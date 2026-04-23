import { chat } from "@/be/lib/text-llm";
import type { ConversationData, Persona, PersonaData } from "@/be/session";

const PERSONA_PROMPT = `你是一个洞察力敏锐、充满创意的用户画像分析师。请根据对话记忆与消息，深度提炼用户的人物画像。

分析维度（有据可依则输出，无从判断则跳过，不强求每项都有）：
- 表达风格：语言习惯，如简洁/冗长、口语化/书面化、喜欢举例/抽象阐述
- 知识领域：擅长或持续涉足的专业方向
- 思维模式：线性推进还是发散联想；演绎推理还是归纳总结
- 关注点：反复出现的核心议题或执念
- 决策倾向：谨慎权衡 vs 直觉果断；数据驱动 vs 经验优先
- 行动风格：先规划后行动 vs 边做边调整；追求完美 vs 接受够用
- 情绪基调：对话中流露的情绪色彩，如理性克制、热情外放、焦虑求解
- 价值取向：最看重效率、创新、稳定、还是影响力
- 沟通习惯：追问细节 vs 要结论；偏好确认 vs 偏好质疑
- 潜在需求：用户未明说但隐含的深层诉求
- 动物原型：用一种动物比喻其核心特质，附10字以内解释（发挥想象，要有趣）
- 人格标签：一个独特的创意标签，如"深夜思考者"、"系统拆解怪"（自由发挥，每次可以不同）

规则：
- summary 一句话，20 字以内，要有个性，避免套话
- value 生动具体，不超过 30 字
- 动物原型和人格标签必须输出，且要有创意和随机性，不要千篇一律
- 仅输出 JSON，不添加任何其他文字

输出格式：
{"summary":"一句话描述","traits":[{"dimension":"表达风格","value":"..."}]}`;

/** 从当前会话中提炼摘要文本供画像使用 */
function buildSummaryText(conv: ConversationData): string {
  if (conv.memories.length === 0 && conv.messages.length === 0) return "";
  const memText = conv.memories.map((m) => `[${m.type}] ${m.description}：${m.content}`).join("\n");
  const msgText = conv.messages
    .slice(-4)
    .map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`)
    .join("\n");
  return [memText, msgText].filter(Boolean).join("\n");
}

export async function generatePersona(conv: ConversationData): Promise<Persona> {
  const summaryText = buildSummaryText(conv);

  const raw = await chat([
    { role: "system", content: PERSONA_PROMPT },
    { role: "user", content: `会话摘要：\n${summaryText}` },
  ]);

  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Omit<Persona, "updatedAt">;
      return { ...parsed, updatedAt: new Date().toISOString() };
    }
  } catch {
    // fall through to default
  }

  return { summary: "暂无画像", traits: [], updatedAt: new Date().toISOString() };
}

/**
 * Refresh persona every 4 hours based on summaries of all conversations.
 * Returns null persona when there are no conversations with content.
 */
export async function refreshPersona(
  uid: string,
  conv: ConversationData,
  currentData: PersonaData,
  ttlHours = 4,
): Promise<PersonaData> {
  const PERSONA_TTL_MS = ttlHours * 60 * 60 * 1000;
  // 无内容时，人物画像为空
  const hasContent = conv.memories.length > 0 || conv.messages.length > 0;
  if (!hasContent) {
    return { persona: null, updatedAt: new Date().toISOString() };
  }

  // 检查 TTL
  const elapsed = Date.now() - new Date(currentData.updatedAt).getTime();
  if (currentData.persona && elapsed <= PERSONA_TTL_MS) {
    return currentData;
  }

  try {
    const persona = await generatePersona(conv);
    return { persona, updatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[persona] failed to generate:", err);
    return currentData;
  }
}
