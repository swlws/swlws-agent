import { chat } from "@/be/lib/text-llm";
import type { ConversationData, MindCard, MindCardsData } from "@/be/session";
import { toStandardMessages } from "./messages";

const MINDCARDS_PROMPT = `你是一个对话引导专家。根据当前对话上下文，生成 16 张心智卡片，帮助用户快速开始有价值的对话。

每张卡片要求：
- title：2-5 字的主题标题，精准概括
- desc：一句话说明这张卡片能带来什么价值，15 字以内
- prompt：用户点击后直接发送的具体问题，要有深度，20-40 字

要求：
- 16 张卡片覆盖尽可能多的不同维度，避免重复
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

async function generateMindCards(conv: ConversationData): Promise<MindCard[]> {
  const standard = toStandardMessages(conv.messages);
  const recentMessages = standard
    .slice(-6)
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");

  const contextText = recentMessages || "（暂无对话记录）";

  const raw = await chat([
    { role: "system", content: MINDCARDS_PROMPT },
    { role: "user", content: `近期对话上下文：\n${contextText}` },
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

export async function refreshMindCards(
  conv: ConversationData,
  currentData: MindCardsData,
  ttlHours = 4,
): Promise<MindCardsData> {
  const MINDCARDS_TTL_MS = ttlHours * 60 * 60 * 1000;
  const elapsed = Date.now() - new Date(currentData.updatedAt).getTime();
  if ((currentData.cards.length ?? 0) > 0 && elapsed <= MINDCARDS_TTL_MS) {
    return currentData;
  }

  const hasContent = conv.memories.length > 0 || conv.messages.length > 0;

  try {
    const cards = hasContent
      ? await generateMindCards(conv)
      : await generateDefaultMindCards();
    return { cards, updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[mindcards] failed to generate:", err);
    return currentData;
  }
}
