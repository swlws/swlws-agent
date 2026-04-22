import OpenAI from "openai";
import { Message } from "@/be/lib/text-llm";
import { getToolDefinitions, executeTool } from "@/be/engine/tools";
import type { ModeRunner } from "@/be/engine/runners";

const MAX_ITERATIONS = 8;

function createClient(): OpenAI {
  const apiKey = process.env.SWLWS_TEXT_LLM_API_KEY;
  if (!apiKey) throw new Error("SWLWS_TEXT_LLM_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: process.env.SWLWS_TEXT_LLM_BASE_URL });
}

function resolveModel(): string {
  const model = process.env.SWLWS_TEXT_LLM_MODEL;
  if (!model) throw new Error("SWLWS_TEXT_LLM_MODEL is not set");
  return model;
}

/**
 * ReAct 模式：Thought → Action → Observation 循环，直到 LLM 不再调用工具
 * 每次迭代的文本输出和工具结果都实时流式推送
 */
export const reactRunner: ModeRunner = {
  async execute(_content, contextMessages, { onToken, onEvent }, signal) {
    const client = createClient();
    const model = resolveModel();
    const toolDefinitions = getToolDefinitions();

    let fullReply = "";
    let iterations = 0;
    let messages: OpenAI.Chat.ChatCompletionMessageParam[] =
      contextMessages as OpenAI.Chat.ChatCompletionMessageParam[];

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const response = await client.chat.completions.create(
        {
          model,
          messages,
          tools: toolDefinitions,
          tool_choice: "auto",
          stream: true,
          temperature: 0.7,
        },
        { signal },
      );

      let stepText = "";
      const toolCalls: Array<{
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }> = [];
      const toolCallChunks: Record<
        number,
        { id: string; name: string; arguments: string }
      > = {};

      for await (const chunk of response) {
        const delta = chunk.choices[0]?.delta;
        if (!delta) continue;

        if (delta.content) {
          stepText += delta.content;
          fullReply += delta.content;
          onToken(delta.content);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallChunks[idx]) {
              toolCallChunks[idx] = { id: tc.id ?? "", name: "", arguments: "" };
            }
            if (tc.function?.name) toolCallChunks[idx].name += tc.function.name;
            if (tc.function?.arguments) toolCallChunks[idx].arguments += tc.function.arguments;
            if (tc.id) toolCallChunks[idx].id = tc.id;
          }
        }
      }

      for (const chunk of Object.values(toolCallChunks)) {
        toolCalls.push({
          id: chunk.id,
          type: "function",
          function: { name: chunk.name, arguments: chunk.arguments },
        });
      }

      // 无工具调用 → LLM 已给出最终答案，结束循环
      if (toolCalls.length === 0) break;

      // 将 assistant 消息（含 tool_calls）加入历史
      messages = [
        ...messages,
        {
          role: "assistant",
          content: stepText || null,
          tool_calls: toolCalls,
        },
      ];

      // 逐个执行工具，将 Observation 推流并追加到历史
      for (const tc of toolCalls) {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {};
          }
        })();

        onEvent({ type: "tool_call", name: tc.function.name, args });

        const result = await executeTool(tc.function.name, args, signal);

        onEvent({ type: "tool_result", name: tc.function.name, result });

        const observationBlock =
          "\n\n> **Observation（" +
          tc.function.name +
          "）**\n> " +
          result.split("\n").join("\n> ") +
          "\n\n";

        fullReply += observationBlock;
        onToken(observationBlock);

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
    }

    return fullReply;
  },
};
