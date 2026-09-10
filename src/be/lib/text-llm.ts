import type OpenAI from "openai";
import { streamCompletion } from "./llm/provider";

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function resolveModel(explicitModel?: string): string {
  const model = explicitModel || process.env.SWLWS_TEXT_LLM_MODEL;
  if (!model) throw new Error("SWLWS_TEXT_LLM_MODEL is not set");

  return model;
}

/**
 * Single-turn chat completion
 */
export async function chat(
  messages: Message[],
  options: LLMOptions = {},
): Promise<string> {
  const { model, temperature, maxTokens } = options;

  let text = "";
  for await (const chunk of streamCompletion(resolveModel(model), {
    messages,
    temperature,
    maxTokens,
  })) {
    if (chunk.type === "text") text += chunk.text;
  }
  return text;
}

/**
 * Streaming chat completion, yields text deltas
 */
export async function* chatStream(
  messages: Message[],
  options: LLMOptions = {},
  signal?: AbortSignal,
): AsyncGenerator<string> {
  const { model, temperature } = options;

  for await (const chunk of streamCompletion(resolveModel(model), {
    messages,
    temperature,
    signal,
  })) {
    if (chunk.type === "text") yield chunk.text;
  }
}

/**
 * Simple one-shot prompt (user message only)
 */
export async function prompt(
  userMessage: string,
  systemPrompt?: string,
  options: LLMOptions = {},
): Promise<string> {
  const messages: Message[] = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: userMessage });
  return chat(messages, options);
}
