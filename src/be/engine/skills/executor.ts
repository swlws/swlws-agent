import { type Message } from "@/be/lib/text-llm";
import { type RunnerHandlers } from "@/be/engine/runners/type";
import { runReActLoop } from "@/be/engine/runners/common/react-core";
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

  // Skill system prompt 置于消息数组头部（index 0），确保符合 API 约定
  const messages: Message[] = [systemMessage, ...contextMessages];

  // 走 ReAct 循环而非纯 chatStream，使 skill 可调用 run_command / read_file /
  // write_file 等工具（例如 apm skill 需要执行 python3 脚本再回填分析）。
  // 无工具调用的纯文本 skill 会一轮结束，行为与原 chatStream 等价。
  return runReActLoop(messages, handlers.onToken, {
    temperature: skill.meta.temperature,
    signal,
  });
}
