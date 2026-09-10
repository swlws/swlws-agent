import Anthropic from "@anthropic-ai/sdk";
import type OpenAI from "openai";
import type { LLMStreamChunk, StreamCompletionParams } from "./provider";

/** Anthropic Messages 要求必填 max_tokens；给一个足够大的默认值 */
const DEFAULT_MAX_TOKENS = 8192;

/**
 * 处理 Base URL：SDK 会自动追加 `/v1/messages`，因此需剥掉配置中已有的该后缀。
 * 例：`http://gw/anthropic/v1/messages` → `http://gw/anthropic`
 */
function normalizeBaseUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) return undefined;
  return baseUrl.replace(/\/v1\/messages\/?$/, "").replace(/\/$/, "");
}

function createClient(): Anthropic {
  const apiKey = process.env.SWLWS_TEXT_LLM_API_KEY;
  if (!apiKey) throw new Error("SWLWS_TEXT_LLM_API_KEY is not set");
  return new Anthropic({
    apiKey,
    baseURL: normalizeBaseUrl(process.env.SWLWS_TEXT_LLM_BASE_URL),
  });
}

/** OpenAI 工具定义 → Anthropic 工具定义 */
function convertTools(
  tools?: OpenAI.Chat.ChatCompletionTool[],
): Anthropic.Tool[] | undefined {
  if (!tools || tools.length === 0) return undefined;
  return tools
    .filter((t) => t.type === "function")
    .map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: (t.function.parameters ?? {
        type: "object",
        properties: {},
      }) as Anthropic.Tool.InputSchema,
    }));
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "object" && part && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("");
  }
  return content == null ? "" : String(content);
}

/**
 * OpenAI 消息数组 → Anthropic 消息数组 + 顶层 system。
 * - system 角色合并为顶层 system 参数
 * - assistant 的 tool_calls → tool_use 内容块（arguments 解析为对象）
 * - tool 角色 → tool_result 内容块，并入相邻的 user 轮次
 */
function convertMessages(messages: OpenAI.Chat.ChatCompletionMessageParam[]): {
  system: string;
  anthropicMessages: Anthropic.MessageParam[];
} {
  const systemParts: string[] = [];
  const result: Anthropic.MessageParam[] = [];

  const pushToUser = (block: Anthropic.ContentBlockParam) => {
    const last = result[result.length - 1];
    if (last && last.role === "user" && Array.isArray(last.content)) {
      last.content.push(block);
    } else {
      result.push({ role: "user", content: [block] });
    }
  };

  for (const msg of messages) {
    if (msg.role === "system") {
      systemParts.push(contentToText(msg.content));
      continue;
    }

    if (msg.role === "user") {
      pushToUser({ type: "text", text: contentToText(msg.content) });
      continue;
    }

    if (msg.role === "tool") {
      pushToUser({
        type: "tool_result",
        tool_use_id: msg.tool_call_id,
        content: contentToText(msg.content),
      });
      continue;
    }

    if (msg.role === "assistant") {
      const blocks: Anthropic.ContentBlockParam[] = [];
      const text = contentToText(msg.content);
      if (text) blocks.push({ type: "text", text });

      const toolCalls = msg.tool_calls ?? [];
      for (const tc of toolCalls) {
        if (tc.type !== "function") continue;
        let input: unknown = {};
        try {
          input = tc.function.arguments
            ? JSON.parse(tc.function.arguments)
            : {};
        } catch {
          input = {};
        }
        blocks.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input,
        });
      }

      if (blocks.length > 0) {
        result.push({ role: "assistant", content: blocks });
      }
      continue;
    }
  }

  return { system: systemParts.join("\n\n"), anthropicMessages: result };
}

/** Anthropic Messages 协议适配器：将原生流事件转换为归一化的 {@link LLMStreamChunk} */
export async function* streamAnthropic(
  model: string,
  params: StreamCompletionParams,
): AsyncGenerator<LLMStreamChunk> {
  const { messages, tools, temperature = 0.7, maxTokens, signal } = params;
  const client = createClient();
  const { system, anthropicMessages } = convertMessages(messages);

  const stream = await client.messages.create(
    {
      model,
      max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: anthropicMessages,
      ...(system ? { system } : {}),
      ...(tools ? { tools: convertTools(tools) } : {}),
      // Anthropic temperature 上限为 1.0（OpenAI 允许到 2.0），需 clamp 避免 400
      temperature: Math.max(0, Math.min(1, temperature)),
      stream: true,
    },
    { signal },
  );

  // 累计 usage：input_tokens 来自 message_start，output_tokens 来自 message_delta
  let inputTokens = 0;

  for await (const event of stream) {
    switch (event.type) {
      case "message_start":
        inputTokens = event.message.usage?.input_tokens ?? 0;
        break;

      case "content_block_start":
        if (event.content_block.type === "tool_use") {
          yield {
            type: "tool_call",
            index: event.index,
            id: event.content_block.id,
            name: event.content_block.name,
          };
        }
        break;

      case "content_block_delta":
        if (event.delta.type === "text_delta") {
          yield { type: "text", text: event.delta.text };
        } else if (event.delta.type === "input_json_delta") {
          yield {
            type: "tool_call",
            index: event.index,
            argsDelta: event.delta.partial_json,
          };
        }
        break;

      case "message_delta":
        if (event.usage) {
          yield {
            type: "usage",
            totalTokens: inputTokens + (event.usage.output_tokens ?? 0),
          };
        }
        break;
    }
  }
}
