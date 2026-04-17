import { chat } from "@/be/lib/llm";
import type { ConversationData, Memory, ChatMessage } from "@/be/session";

const KEEP_RECENT = 4;

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
  overflow: ChatMessage[],
): Promise<Memory[]> {
  const transcript = overflow
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

export interface CompactMemoriesResult {
  conv: ConversationData;
  memoriesChanged: boolean;
}

/**
 * When messages exceed the window, compress overflow into typed memories.
 * No-op when within the window.
 */
export async function compactMemories(conv: ConversationData): Promise<CompactMemoriesResult> {
  if (conv.messages.length <= KEEP_RECENT) {
    return { conv, memoriesChanged: false };
  }

  const overflow = conv.messages.slice(0, conv.messages.length - KEEP_RECENT);
  const recent = conv.messages.slice(-KEEP_RECENT);
  const memories = await extractMemories(conv.memories, overflow);

  const memoriesChanged = JSON.stringify(memories) !== JSON.stringify(conv.memories);
  return { conv: { ...conv, memories, messages: recent }, memoriesChanged };
}
