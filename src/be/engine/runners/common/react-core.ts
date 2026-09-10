import type OpenAI from "openai";
import { getToolDefinitions, executeTool } from "@/be/engine/tools";
import { CardType } from "@/be/engine/runners/type";
import { streamCompletion } from "@/be/lib/llm/provider";
import { logger } from "@/be/lib/logger";

/** Token 预算：累计消耗超过此值时，完成当前迭代后优雅退出（软约束） */
const TOKEN_BUDGET = 128_000;

/** Bash 卡片展示的执行结果最大字符数（仅影响前端展示，不影响喂给模型的完整结果） */
const BASH_OUTPUT_DISPLAY_LIMIT = 2000;

/**
 * 从工具调用中提取展示用的「命令行」。
 * run_command → 真实命令；其他工具 → `工具名 参数摘要`。
 */
function extractCommand(toolName: string, rawArgs: string): string {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(rawArgs) as Record<string, unknown>;
  } catch {
    // 参数非法 JSON，回退到原始串
  }

  if (toolName === "run_command" && typeof parsed.command === "string") {
    return parsed.command;
  }

  const argsSummary = rawArgs?.trim();
  if (argsSummary && argsSummary !== "{}") {
    return `${toolName} ${argsSummary}`;
  }
  return toolName;
}

export interface ReActOptions {
  signal?: AbortSignal;
  temperature?: number;
  /** 若为 true，直接操作传入的 messages 数组（不复制），用于 Reflection 共享上下文 */
  mutable?: boolean;
}

export function resolveModel(): string {
  const model = process.env.SWLWS_TEXT_LLM_MODEL;
  if (!model) throw new Error("SWLWS_TEXT_LLM_MODEL is not set");
  return model;
}

/**
 * 通用的 ReAct 核心循环逻辑
 * 当 options.mutable 为 true 时，直接操作传入的 messages 数组（共享上下文场景）
 */
export async function runReActLoop(
  initialMessages: OpenAI.Chat.ChatCompletionMessageParam[],
  onToken: (cardType: CardType, token: string) => void,
  options: ReActOptions = {},
): Promise<string> {
  const { signal, temperature = 0.7, mutable = false } = options;
  const model = resolveModel();
  const toolDefinitions = getToolDefinitions();

  let fullReply = "";
  let usedTokens = 0;
  let iteration = 0;
  const messages = mutable ? initialMessages : [...initialMessages];

  logger.debug("react", "循环开始", {
    model,
    toolCount: toolDefinitions.length,
  });

  while (usedTokens < TOKEN_BUDGET) {
    if (signal?.aborted) break;
    iteration += 1;
    logger.debug("react", "迭代", { iteration, usedTokens });

    const stream = streamCompletion(model, {
      messages,
      tools: toolDefinitions,
      temperature,
      signal,
    });

    let stepText = "";
    const toolCallChunks: Record<
      number,
      { id: string; name: string; arguments: string }
    > = {};

    for await (const chunk of stream) {
      if (chunk.type === "usage") {
        // total_tokens 是「当前对话累计值」（prompt+completion），非增量。
        // 取最大值而非累加，避免把每轮的累计量重复叠加导致预算被瞬间撑爆。
        usedTokens = Math.max(usedTokens, chunk.totalTokens);
        continue;
      }

      if (chunk.type === "text") {
        // 过滤误输出的 TOOLCALL 行，防止被当作普通文本展示
        if (chunk.text.trim().startsWith("TOOLCALL>")) {
          logger.debug("react", "跳过 TOOLCALL 行", { text: chunk.text });
          // 跳过此内容，不触发 token 回调
          continue;
        }
        stepText += chunk.text;
        fullReply += chunk.text;
        onToken(CardType.Markdown, chunk.text);
        continue;
      }

      if (chunk.type === "tool_call") {
        const idx = chunk.index;
        if (!toolCallChunks[idx]) {
          toolCallChunks[idx] = { id: "", name: "", arguments: "" };
        }
        if (chunk.name) toolCallChunks[idx].name += chunk.name;
        if (chunk.argsDelta) toolCallChunks[idx].arguments += chunk.argsDelta;
        if (chunk.id) toolCallChunks[idx].id = chunk.id;
      }
    }

    const toolCalls = Object.values(toolCallChunks).map((chunk) => ({
      id: chunk.id,
      type: "function" as const,
      function: { name: chunk.name, arguments: chunk.arguments },
    }));

    // 无工具调用 → LLM 已给出最终答案
    if (toolCalls.length === 0) {
      // 共享上下文场景：将最终 assistant 输出追加到 messages，供后续阶段引用
      if (mutable && stepText) {
        messages.push({ role: "assistant", content: stepText });
      }
      break;
    }

    // 将 assistant 消息（含 tool_calls）加入历史
    messages.push({
      role: "assistant",
      content: stepText || null,
      tool_calls: toolCalls,
    });

    // 并行执行所有工具调用
    logger.info("react", "工具调用", {
      iteration,
      tools: toolCalls.map((tc) => tc.function.name),
    });
    const toolResults = await Promise.all(
      toolCalls.map(async (tc) => {
        const args = (() => {
          try {
            return JSON.parse(tc.function.arguments) as Record<string, unknown>;
          } catch {
            return {};
          }
        })();

        const startedAt = Date.now();
        const result = await executeTool(tc.function.name, args, signal);
        logger.info("react", "工具完成", {
          tool: tc.function.name,
          isError: result.isError,
          ms: Date.now() - startedAt,
        });
        return { tc, result };
      }),
    );

    // 按顺序推流 Observation 并追加消息历史
    for (const { tc, result } of toolResults) {
      if (result.isImage) {
        onToken(CardType.Image, result.content);
      } else {
        // 工具调用用独立的 Bash 卡片展示：命令 + 执行结果。
        // 每个块以记录分隔符 \x1e 起始 + JSON，前端据此拆分同卡内的多次调用。
        // 展示层结果截断，喂给模型的 messages 仍是完整结果。
        const command = extractCommand(tc.function.name, tc.function.arguments);
        const output =
          result.content.length > BASH_OUTPUT_DISPLAY_LIMIT
            ? result.content.slice(0, BASH_OUTPUT_DISPLAY_LIMIT) +
              "\n…(结果过长已截断)"
            : result.content;
        const block =
          "\x1e" +
          JSON.stringify({ command, output, isError: result.isError });
        onToken(CardType.Bash, block);
      }

      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        content: result.content,
      });
    }
  }

  return fullReply;
}
