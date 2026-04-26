import { chat } from "@/be/lib/text-llm";
import type { ConversationData, Memory, ChatMessage } from "@/be/session";
import { toStandardMessages } from "./messages";

const EXTRACT_PROMPT = `你是一个对话记忆提取助手。请从新增对话中提取关键信息，与现有记忆合并更新后输出完整记忆列表。

类型说明：
- context：对话背景、主题、用户目标
- preference：用户偏好、风格要求
- decision：已达成的结论或决策
- fact：重要的客观事实

规则：
- 同类型的记忆合并为一条，不重复
- description 为一句话索引，content 为详细内容
- 无新信息时原样保留现有记忆
- 仅输出 JSON 数组，不添加任何其他文字

输出格式：
[{"type":"context|preference|decision|fact","description":"一句话索引","content":"详细内容"}]`;

async function extractMemories(
  existing: Memory[],
  newMessages: ChatMessage[],
): Promise<Memory[]> {
  // 提取记忆前先进行聚合与过滤（剔除 Cot 和 Error，保留 Markdown 内容）
  const filtered = newMessages.filter((m) => m.cardType === 1);
  const standard = toStandardMessages(filtered);

  const transcript = standard
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");

  const parts: string[] = [];
  if (existing.length > 0) {
    parts.push(`现有记忆：\n${JSON.stringify(existing, null, 2)}`);
  }
  parts.push(`新增对话：\n${transcript}`);

  const raw = await chat([
    { role: "system", content: EXTRACT_PROMPT },
    { role: "user", content: parts.join("\n\n") },
  ]);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as Memory[]) : existing;
  } catch {
    return existing;
  }
}

/**
 * 截断消息列表，确保不截断单次对话的卡片流。
 * 基于用户消息（轮次）进行计数。
 */
export function trimMessages(
  conv: ConversationData,
  maxUserMessages = 50,
): ConversationData {
  const userIndices = conv.messages
    .map((m, i) => (m.role === "user" ? i : -1))
    .filter((i) => i !== -1);

  if (userIndices.length <= maxUserMessages) return conv;

  const keepFromIndex = userIndices[userIndices.length - maxUserMessages];
  return {
    ...conv,
    messages: conv.messages.slice(keepFromIndex),
    summarizedUpTo: Math.max(0, conv.summarizedUpTo - keepFromIndex),
  };
}

/**
 * 按轮次判断是否需要重新生成历史摘要。
 * 每新增 triggerUserCount 轮对话触发一次。
 */
export async function maybeUpdateSummary(
  conv: ConversationData,
  triggerUserCount = 4,
): Promise<ConversationData> {
  const messagesSinceSummary = conv.messages.slice(conv.summarizedUpTo);
  const newUserCount = messagesSinceSummary.filter(
    (m) => m.role === "user",
  ).length;

  if (newUserCount < triggerUserCount) return conv;

  const memories = await extractMemories(conv.memories, messagesSinceSummary);

  return {
    ...conv,
    memories,
    summarizedUpTo: conv.messages.length,
  };
}
