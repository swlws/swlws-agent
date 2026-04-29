import { chatStream, type Message } from "@/be/lib/text-llm";
import { CardType, type RunnerHandlers } from "@/be/engine/runners/type";
import type { SkillDefinition } from "./types";

function substituteVars(template: string, args: string, skillDir: string): string {
  return template
    .replace(/\$ARGUMENTS/g, args)
    .replace(/\$SKILL_DIR/g, skillDir);
}

export async function executeSkill(
  skill: SkillDefinition,
  args: string,
  contextMessages: Message[],
  handlers: Pick<RunnerHandlers, "onToken">,
  signal?: AbortSignal,
): Promise<string> {
  const systemContent = substituteVars(
    skill.promptTemplate,
    args,
    skill.dirPath,
  );

  const systemMessage: Message = { role: "system", content: systemContent };

  // 注入到最后一条 user 消息之前
  const messages = [...contextMessages];
  const userIndex = messages.findLastIndex((m) => m.role === "user");
  if (userIndex === -1) {
    messages.push(systemMessage);
  } else {
    messages.splice(userIndex, 0, systemMessage);
  }

  let reply = "";
  for await (const chunk of chatStream(
    messages,
    { temperature: skill.meta.temperature },
    signal,
  )) {
    reply += chunk;
    handlers.onToken(CardType.Markdown, chunk);
  }

  return reply;
}
