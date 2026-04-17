import { chat, Message as LlmMessage } from "@/be/lib/llm";
import type { Session, Memory, ChatMessage } from "@/be/session";

export type { ChatMessage };

const KEEP_RECENT = 4;

const MEMORY_LABELS: Record<string, string> = {
  context: "对话背景",
  preference: "用户偏好",
  decision: "关键决策",
  fact: "重要信息",
};

/**
 * Prompt for incremental memory extraction.
 * Inspired by Claude Code's typed memory (user / feedback / project / reference).
 * We classify into: context / preference / decision / fact.
 */
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

/**
 * Build the LLM input: structured memory index as system prompt + recent messages + current input.
 * Each memory type becomes a labeled section, mirroring Claude Code's MEMORY.md index structure.
 */
export function buildContextMessages(
  session: Session,
  currentContent: string,
): LlmMessage[] {
  const messages: LlmMessage[] = [];

  const parts: string[] = [];

  if (session.memories.length > 0) {
    const sections = session.memories
      .map((m) => `### ${MEMORY_LABELS[m.type] ?? m.type}\n${m.content}`)
      .join("\n\n");
    parts.push(`## 对话记忆\n\n${sections}`);
    parts.push(
      "如用户输入简短或指代不明，请结合以上记忆推断其完整意图，直接给出回答，无需要求用户澄清。",
    );
  }

  // parts.push("默认给出精简回答，去除铺垫和总结性套话；仅当用户明确要求详细或扩展时，再给出完整展开。");

  messages.push({ role: "system", content: parts.join("\n\n") });
  messages.push(...session.messages);
  messages.push({ role: "user", content: currentContent });
  return messages;
}

/**
 * Extract typed memories from overflow messages and merge with existing ones.
 * Incremental: only the overflow is processed; existing memories are preserved by the LLM.
 */
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

/**
 * Append the new exchange. Always runs, synchronous.
 */
export function updateSession(
  session: Session,
  userContent: string,
  assistantContent: string,
): Session {
  return {
    ...session,
    messages: [
      ...session.messages,
      { role: "user", content: userContent },
      { role: "assistant", content: assistantContent },
    ],
  };
}

export interface CompactMemoriesResult {
  session: Session;
  memoriesChanged: boolean;
}

/**
 * When messages exceed the window, compress overflow into typed memories.
 * No-op when within the window.
 */
export async function compactMemories(session: Session): Promise<CompactMemoriesResult> {
  if (session.messages.length <= KEEP_RECENT) {
    return { session, memoriesChanged: false };
  }

  const overflow = session.messages.slice(0, session.messages.length - KEEP_RECENT);
  const recent = session.messages.slice(-KEEP_RECENT);
  const memories = await extractMemories(session.memories, overflow);

  const memoriesChanged = JSON.stringify(memories) !== JSON.stringify(session.memories);
  return { session: { ...session, memories, messages: recent }, memoriesChanged };
}
