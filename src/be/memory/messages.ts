import type { ConversationData, ChatMessage } from "@/be/session";
import type { Message as LlmMessage } from "@/be/lib/text-llm";

export type { ChatMessage };

const MEMORY_LABELS: Record<string, string> = {
  context: "对话背景",
  preference: "用户偏好",
  decision: "关键决策",
  fact: "重要信息",
};

/**
 * 将扁平化的 ChatMessage[] 转换为 OpenAI 标准的 LlmMessage[]
 * 聚合连续的相同 role 的消息
 */
export function toStandardMessages(stored: ChatMessage[]): LlmMessage[] {
  const result: LlmMessage[] = [];
  for (const msg of stored) {
    if (msg.cardType === 3) continue; // 忽略 Error 卡片

    const last = result[result.length - 1];
    if (last && last.role === msg.role) {
      // 聚合相同 role 的内容
      last.content = (last.content as string) + "\n" + msg.content;
    } else {
      result.push({
        role: msg.role,
        content: msg.content,
      } as LlmMessage);
    }
  }
  return result;
}

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

  const standardMessages = toStandardMessages(conv.messages);

  return [
    { role: "system", content: parts.join("\n\n") },
    // 只取最近 4 次对话（约 8 条聚合后的消息）传给 LLM
    ...standardMessages.slice(-8),
    { role: "user", content: currentContent },
  ];
}

/**
 * Append the new exchange.
 */
export function appendMessages(
  conv: ConversationData,
  userContent: string,
  assistantMessages: ChatMessage[],
): ConversationData {
  const title = conv.title ?? userContent.slice(0, 30);
  return {
    ...conv,
    title,
    updatedAt: new Date().toISOString(),
    messages: [
      ...conv.messages,
      { role: "user", content: userContent, cardType: 1 },
      ...assistantMessages,
    ],
  };
}
