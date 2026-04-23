import { chat } from "@/be/lib/text-llm";
import type { ConversationData, Persona, MindCard, MindCardsData } from "@/be/session";

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

const DEFAULT_MINDCARDS_PROMPT = `你是一个对话引导专家。用户刚开始使用这个 AI 助手，还没有任何对话记录。
请生成 16 张通用心智卡片，覆盖多种使用场景，帮助用户发现这个助手的价值。

每张卡片要求：
- title：2-5 字的主题标题
- desc：一句话说明价值，15 字以内
- prompt：具体的问题或指令，20-40 字，有趣且实用

覆盖维度：学习探索、工作效率、创意思维、问题解决、技术开发、写作表达、分析决策、日常规划等
- 仅输出 JSON 数组，不添加任何其他文字

输出格式：
[{"title":"...","desc":"...","prompt":"..."}]`;

async function generateMindCards(
  persona: Persona,
  conv: ConversationData,
): Promise<MindCard[]> {
  const personaText = [
    `总结：${persona.summary}`,
    ...persona.traits.map((t) => `${t.dimension}：${t.value}`),
  ].join("\n");

  // 取当前会话最近消息作为上下文
  const recentMessages = conv.messages
    .slice(-6)
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");

  const contextText = recentMessages || "（暂无对话记录）";

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

async function generateDefaultMindCards(): Promise<MindCard[]> {
  const raw = await chat([
    { role: "system", content: DEFAULT_MINDCARDS_PROMPT },
    { role: "user", content: "请生成通用心智卡片。" },
  ]);

  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return match ? (JSON.parse(match[0]) as MindCard[]) : [];
  } catch {
    return [];
  }
}

/**
 * Refresh mind cards every 4 hours based on summaries of all conversations.
 * When no conversations exist, randomly generate default cards.
 */
export async function refreshMindCards(
  conv: ConversationData,
  persona: Persona | null,
  currentData: MindCardsData,
  ttlHours = 4,
): Promise<MindCardsData> {
  const MINDCARDS_TTL_MS = ttlHours * 60 * 60 * 1000;
  // 检查 TTL
  const elapsed = Date.now() - new Date(currentData.updatedAt).getTime();
  if ((currentData.cards.length ?? 0) > 0 && elapsed <= MINDCARDS_TTL_MS) {
    return currentData;
  }

  const hasContent = conv.memories.length > 0 || conv.messages.length > 0;

  try {
    let cards: MindCard[];
    if (!hasContent || !persona) {
      // 无会话时随机生成默认卡片
      cards = await generateDefaultMindCards();
    } else {
      cards = await generateMindCards(persona, conv);
    }
    return { cards, updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[mindcards] failed to generate:", err);
    return currentData;
  }
}
