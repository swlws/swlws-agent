import OpenAI from "openai";
import type { LLMStreamChunk, StreamCompletionParams } from "./provider";

function createClient(): OpenAI {
  const apiKey = process.env.SWLWS_TEXT_LLM_API_KEY;
  if (!apiKey) throw new Error("SWLWS_TEXT_LLM_API_KEY is not set");
  return new OpenAI({ apiKey, baseURL: process.env.SWLWS_TEXT_LLM_BASE_URL });
}

/** OpenAI 兼容协议适配器：将 SDK 原生流转换为归一化的 {@link LLMStreamChunk} */
export async function* streamOpenAI(
  model: string,
  params: StreamCompletionParams,
): AsyncGenerator<LLMStreamChunk> {
  const { messages, tools, temperature = 0.7, maxTokens, signal } = params;
  const client = createClient();

  const stream = await client.chat.completions.create(
    {
      model,
      messages,
      ...(tools && tools.length > 0
        ? { tools, tool_choice: "auto" as const }
        : {}),
      temperature,
      ...(maxTokens ? { max_tokens: maxTokens } : {}),
      stream: true,
      stream_options: { include_usage: true },
    },
    { signal },
  );

  for await (const chunk of stream) {
    if (chunk.usage) {
      yield { type: "usage", totalTokens: chunk.usage.total_tokens };
    }

    const delta = chunk.choices[0]?.delta;
    if (!delta) continue;

    if (typeof delta.content === "string" && delta.content) {
      yield { type: "text", text: delta.content };
    }

    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        yield {
          type: "tool_call",
          index: tc.index ?? 0,
          id: tc.id,
          name: tc.function?.name,
          argsDelta: tc.function?.arguments,
        };
      }
    }
  }
}
