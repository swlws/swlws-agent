import type OpenAI from "openai";
import { getToolDefinitions, executeTool } from "@/be/engine/tools";
import { CardType } from "@/be/engine/runners/type";
import { streamCompletion } from "@/be/lib/llm/provider";

/** Token 预算：累计消耗超过此值时，完成当前迭代后优雅退出（软约束） */
const TOKEN_BUDGET = 32_000;

export interface ReActOptions {
  signal?: AbortSignal;
  temperature?: number;
  /** 若为 true，直接操作传入的 messages 数组（不复制），用于 Reflection 共享上下文 */
  mutable?: boolean;
}

export function resolveModel(): string {
  const model = process.env.SWLWS_TEXT_LLM_MODEL;
  if (!model) throw new Error("SWLWS_TEXT_LLM_MODEL is not set");
  return model;
}

/**
 * 通用的 ReAct 核心循环逻辑
 * 当 options.mutable 为 true 时，直接操作传入的 messages 数组（共享上下文场景）
 */
export async function runReActLoop(
  initialMessages: OpenAI.Chat.ChatCompletionMessageParam[],
  onToken: (cardType: CardType, token: string) => void,
  options: ReActOptions = {},
): Promise<string> {
  const { signal, temperature = 0.7, mutable = false } = options;
  const model = resolveModel();
  const toolDefinitions = getToolDefinitions();

  let fullReply = "";
  let usedTokens = 0;
  const messages = mutable ? initialMessages : [...initialMessages];

  while (usedTokens < TOKEN_BUDGET) {
    if (signal?.aborted) break;

    const stream = streamCompletion(model, {
      messages,
      tools: toolDefinitions,
      temperature,
      signal,
    });

    let stepText = "";
    const toolCallChunks: Record<
      number,
      { id: string; name: string; arguments: string }
    > = {};

    for await (const chunk of stream) {
      if (chunk.type === "usage") {
        usedTokens += chunk.totalTokens;
        continue;
      }

      if (chunk.type === "text") {
        // 过滤误输出的 TOOLCALL 行，防止被当作普通文本展示
        if (chunk.text.trim().startsWith("TOOLCALL>")) {
          console.log("跳过 TOOLCALL 行", chunk.text);
          // 跳过此内容，不触发 token 回调
          continue;
        }
        stepText += chunk.text;
        fullReply += chunk.text;
        onToken(CardType.Markdown, chunk.text);
        continue;
      }

      if (chunk.type === "tool_call") {
        const idx = chunk.index;
        if (!toolCallChunks[idx]) {
          toolCallChunks[idx] = { id: "", name: "", arguments: "" };
        }
        if (chunk.name) toolCallChunks[idx].name += chunk.name;
        if (chunk.argsDelta) toolCallChunks[idx].arguments += chunk.argsDelta;
        if (chunk.id) toolCallChunks[idx].id = chunk.id;
      }
    }

    const toolCalls = Object.values(toolCallChunks).map((chunk) => ({
      id: chunk.id,
      type: "function" as const,
      function: { name: chunk.name, arguments: chunk.arguments },
    }));

    // 无工具调用 → LLM 已给出最终答案
    if (toolCalls.length === 0) {
      // 共享上下文场景：将最终 assistant 输出追加到 messages，供后续阶段引用
      if (mutable && stepText) {
        messages.push({ role: "assistant", content: stepText });
      }
      break;
    }

    // 将 assistant 消息（含 tool_calls）加入历史
    messages.push({
      role: "assistant",
      content: stepText || null,
      tool_calls: toolCalls,
    });

    // 并行执行所有工具调用
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {};
          }
        })();

        const result = await executeTool(tc.function.name, args, signal);
        return { tc, result };
      }),
    );

    // 按顺序推流 Observation 并追加消息历史
    for (const { tc, result } of toolResults) {
      if (result.isImage) {
        onToken(CardType.Image, result.content);
      } else {
        const observationBlock =
          "\n\n> **Observation（" +
          tc.function.name +
          "）**\n> " +
          result.content.split("\n").join("\n> ") +
          "\n\n";

        fullReply += observationBlock;
        onToken(CardType.Cot, observationBlock);
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.content,
      });
    }
  }

  return fullReply;
}
