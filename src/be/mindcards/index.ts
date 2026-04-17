import { chat } from "@/be/lib/llm";
import type { Session, Persona, MindCard, ChatMessage } from "@/be/session";

const MINDCARDS_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

const MINDCARDS_PROMPT = `你是一个对话引导专家。根据用户的人物画像和当前对话上下文，生成 16 张心智卡片，帮助用户快速开始有价值的对话。

每张卡片要求：
- title：2-5 字的主题标题，精准概括
- desc：一句话说明这张卡片能带来什么价值，15 字以内
- prompt：用户点击后直接发送的具体问题，要有深度、贴合画像，20-40 字

要求：
- 16 张卡片覆盖尽可能多的不同维度，避免重复
- 贴合用户的知识领域、关注点和价值取向
- 结合当前对话上下文，优先生成与近期话题相关的延伸卡片
- prompt 要具体，不要泛泛而谈
- 仅输出 JSON 数组，不添加任何其他文字

输出格式：
[{"title":"...","desc":"...","prompt":"..."}]`;

export async function generateMindCards(
  persona: Persona,
  messages: ChatMessage[],
): Promise<MindCard[]> {
  const personaText = [
    `总结：${persona.summary}`,
    ...persona.traits.map((t) => `${t.dimension}：${t.value}`),
  ].join("\n");

  const contextText =
    messages.length > 0
      ? messages
          .slice(-6)
          .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
          .join("\n")
      : "（暂无对话记录）";

  const raw = await chat([
    { role: "system", content: MINDCARDS_PROMPT },
    {
      role: "user",
      content: `人物画像：\n${personaText}\n\n近期对话上下文：\n${contextText}`,
    },
  ]);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as MindCard[]) : [];
  } catch {
    return [];
  }
}

/**
 * Refresh mind cards when TTL has expired or no cards exist.
 * Requires persona to be present; leaves cards untouched otherwise.
 */
export async function refreshMindCards(session: Session): Promise<Session> {
  if (!session.persona) return session;

  const hasCards = (session.mindCards?.length ?? 0) > 0;
  if (hasCards) {
    const elapsed = session.mindCardsUpdatedAt
      ? Date.now() - new Date(session.mindCardsUpdatedAt).getTime()
      : Infinity;
    if (elapsed <= MINDCARDS_TTL_MS) return session;
  }

  try {
    const mindCards = await generateMindCards(session.persona, session.messages);
    return { ...session, mindCards, mindCardsUpdatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[mindcards] failed to generate:", err);
    return session;
  }
}
