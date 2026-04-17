import type { ConversationData, ChatMessage } from "@/be/session";
import type { Message as LlmMessage } from "@/be/lib/llm";

export type { ChatMessage };

const MEMORY_LABELS: Record<string, string> = {
  context: "对话背景",
  preference: "用户偏好",
  decision: "关键决策",
  fact: "重要信息",
};

/**
 * Build the LLM input: structured memory index as system prompt + recent messages + current input.
 */
export function buildContextMessages(
  conv: ConversationData,
  currentContent: string,
): LlmMessage[] {
  const parts: string[] = [];

  if (conv.memories.length > 0) {
    const sections = conv.memories
      .map((m) => `### ${MEMORY_LABELS[m.type] ?? m.type}\n${m.content}`)
      .join("\n\n");
    parts.push(`## 对话记忆\n\n${sections}`);
    parts.push(
      "如用户输入简短或指代不明，请结合以上记忆推断其完整意图，直接给出回答，无需要求用户澄清。",
    );
  }

  return [
    { role: "system", content: parts.join("\n\n") },
    ...conv.messages,
    { role: "user", content: currentContent },
  ];
}

/**
 * Append the new exchange. Always runs, synchronous.
 * Also sets title from the first user message.
 */
export function appendMessages(
  conv: ConversationData,
  userContent: string,
  assistantContent: string,
): ConversationData {
  const title = conv.title ?? userContent.slice(0, 30);
  return {
    ...conv,
    title,
    updatedAt: new Date().toISOString(),
    messages: [
      ...conv.messages,
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent },
    ],
  };
}
