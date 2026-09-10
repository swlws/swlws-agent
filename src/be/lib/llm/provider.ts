import type OpenAI from "openai";

/** LLM 协议类型：OpenAI Chat Completions 或 Anthropic Messages */
export type LLMProtocol = "openai" | "anthropic";

/** 统一的流式请求参数（内部标准格式：OpenAI 消息格式） */
export interface StreamCompletionParams {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  tools?: OpenAI.Chat.ChatCompletionTool[];
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/**
 * 归一化的流式输出块。两种协议的原生流事件都会被适配器转换成这些块，
 * 使上层调用逻辑与具体协议解耦。
 */
export type LLMStreamChunk =
  | { type: "text"; text: string }
  | {
      type: "tool_call";
      index: number;
      id?: string;
      name?: string;
      argsDelta?: string;
    }
  | { type: "usage"; totalTokens: number };

/**
 * 根据 Base URL 判断使用哪种协议。
 * URL 含 `/messages` 或 `anthropic` 段视为 Anthropic Messages API，否则视为 OpenAI 兼容。
 */
export function detectProtocol(baseUrl?: string): LLMProtocol {
  if (!baseUrl) return "openai";
  const lower = baseUrl.toLowerCase();
  if (lower.includes("/messages") || lower.includes("anthropic")) {
    return "anthropic";
  }
  return "openai";
}

/**
 * 统一的流式补全入口。按 SWLWS_TEXT_LLM_BASE_URL 检测协议并分发到对应适配器，
 * 输出归一化的 {@link LLMStreamChunk} 序列。
 */
export async function* streamCompletion(
  model: string,
  params: StreamCompletionParams,
): AsyncGenerator<LLMStreamChunk> {
  const protocol = detectProtocol(process.env.SWLWS_TEXT_LLM_BASE_URL);

  if (protocol === "anthropic") {
    const { streamAnthropic } = await import("./anthropic-adapter");
    yield* streamAnthropic(model, params);
  } else {
    const { streamOpenAI } = await import("./openai-adapter");
    yield* streamOpenAI(model, params);
  }
}
