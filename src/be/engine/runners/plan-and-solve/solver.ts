import OpenAI from "openai";
import { Message } from "@/be/lib/text-llm";
import type { PlanStep } from "./planner";
import { CardType } from "@/be/engine/runners/type";
import { runReActLoop } from "../common/react-core";

/**
 * 执行单个计划步骤，通过复用 ReAct 核心循环实现动态应变能力
 * 返回本步骤完整输出文本
 */
export async function solveStep(
  step: PlanStep,
  allSteps: PlanStep[],
  originalQuery: string,
  contextMessages: Message[],
  previousResults: string[],
  onToken: (cardType: CardType, token: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const stepHeader = `## 🔍 步骤 ${step.index + 1}：${step.title}\n\n`;
  onToken(CardType.Markdown, stepHeader);

  const messages = buildStepMessages(
    step,
    allSteps,
    originalQuery,
    contextMessages,
    previousResults,
  );

  // 复用通用的 ReAct 核心逻辑执行当前步骤
  const stepOutput = await runReActLoop(messages, onToken, { signal });

  onToken(CardType.Markdown, "\n\n");
  const fullOutput = stepHeader + stepOutput + "\n\n";

  return fullOutput;
}

function buildStepMessages(
  step: PlanStep,
  allSteps: PlanStep[],
  originalQuery: string,
  contextMessages: Message[],
  previousResults: string[],
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemContent =
    contextMessages[0]?.role === "system"
      ? (contextMessages[0].content as string)
      : "";

  const planSummary = allSteps
    .map((s) => `${s.index + 1}. ${s.title}：${s.description}`)
    .join("\n");

  const previousContext =
    previousResults.length > 0
      ? `\n\n### 已完成步骤的输出：\n${previousResults
          .map((r, i) => `**步骤 ${i + 1} 输出：**\n${r}`)
          .join("\n\n")}`
      : "";

  const stepInstruction = `你正在执行多步骤任务的第 ${step.index + 1} 步。

原始问题：${originalQuery}

完整执行计划：
${planSummary}
${previousContext}

当前步骤（第 ${step.index + 1} 步）：${step.title}
任务说明：${step.description}

请专注完成当前步骤，可使用工具辅助。输出应简洁有针对性。`;

  return [
    {
      role: "system",
      content: systemContent
        ? `${systemContent}\n\n${stepInstruction}`
        : stepInstruction,
    },
    ...(contextMessages
      .slice(1, -1)
      .slice(-4) as OpenAI.Chat.ChatCompletionMessageParam[]),
    { role: "user", content: stepInstruction },
  ];
}
