import OpenAI from "openai";

export type Message = OpenAI.Chat.ChatCompletionMessageParam;

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

function createClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set");

  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

function resolveModel(explicitModel?: string): string {
  // `OPENAI_MODE` is kept for backwards compatibility with current `.env.local`.
  return (
    explicitModel ||
    process.env.OPENAI_MODEL ||
    process.env.OPENAI_MODE ||
    "gpt-4o-mini"
  );
}

/**
 * Single-turn chat completion
 */
export async function chat(
  messages: Message[],
  options: LLMOptions = {},
): Promise<string> {
  const client = createClient();
  const { model, temperature = 0.7, maxTokens } = options;

  const response = await client.chat.completions.create({
    model: resolveModel(model),
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.choices[0].message.content ?? "";
}

/**
 * Streaming chat completion, yields text deltas
 */
export async function* chatStream(
  messages: Message[],
  options: LLMOptions = {},
): AsyncGenerator<string> {
  const client = createClient();
  const { model, temperature = 0.7, maxTokens } = options;

  const stream = await client.chat.completions.create({
    model: resolveModel(model),
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
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

