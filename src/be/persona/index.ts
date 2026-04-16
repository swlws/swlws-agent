import { chat } from "@/be/lib/llm";
import type { Session, Persona } from "@/be/session";

const PERSONA_PROMPT = `你是一个用户画像分析师。请根据以下对话记忆与消息，提炼用户的人物画像。

分析维度（如无依据可省略该项）：
- 表达风格：用户的语言风格，如简洁/详细、正式/随意
- 知识领域：用户擅长或关注的专业领域
- 关注点：用户反复关心的核心问题
- 决策倾向：用户做决策的方式，如谨慎/果断、数据驱动/直觉
- 沟通习惯：用户的互动模式，如喜欢追问/喜欢直接结论

规则：
- summary 为一句话总结，20 字以内
- 仅输出 JSON，不添加任何其他文字

输出格式：
{"summary":"一句话描述","traits":[{"dimension":"表达风格","value":"..."}]}`;

export async function generatePersona(session: Session): Promise<Persona> {
  const memoryText = session.memories.length > 0
    ? session.memories.map((m) => `[${m.type}] ${m.description}：${m.content}`).join("\n")
    : "（暂无记忆）";

  const messageText = session.messages.length > 0
    ? session.messages.map((m) => `${m.role === "user" ? "用户" : "助手"}：${m.content}`).join("\n")
    : "（暂无消息）";

  const raw = await chat([
    { role: "system", content: PERSONA_PROMPT },
    { role: "user", content: `记忆：\n${memoryText}\n\n最近对话：\n${messageText}` },
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
