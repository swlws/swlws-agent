import { prompt } from "@/be/lib/text-llm";
import type { IntentTag, IntentResult } from "./types";

const VALID_TAGS = new Set<IntentTag>([
  "code",
  "image",
  "search",
  "plan",
  "qa",
  "reflect",
]);

const SYSTEM_PROMPT = `你是一个意图分类器。根据用户的输入，从以下标签中选出所有匹配的意图标签（可多选）：

- code    涉及代码编写、调试、重构、实现功能
- image   涉及图像、图片生成或绘制
- search  需要联网搜索或实时信息检索
- plan    需要任务拆分、制定步骤或规划方案
- qa      问答、解释、分析，无需生成代码或图像
- reflect 需要对已有内容进行审查、检查或评审

输出格式：仅输出 JSON 数组，如 ["code","plan"]，不要有任何其他内容。
若无法判断，输出 ["qa"]。`;

/**
 * 解析 LLM 输出，提取合法的 IntentTag 集合
 */
function parseLLMOutput(raw: string): Set<IntentTag> {
  try {
    // 从输出中提取 JSON 数组部分
    const match = raw.match(/\[[\s\S]*?\]/);
    if (!match) return new Set(["qa"]);

    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return new Set(["qa"]);

    const tags = new Set<IntentTag>();
    for (const item of parsed) {
      if (typeof item === "string" && VALID_TAGS.has(item as IntentTag)) {
        tags.add(item as IntentTag);
      }
    }

    return tags.size > 0 ? tags : new Set(["qa"]);
  } catch {
    return new Set(["qa"]);
  }
}

/**
 * 基于 LLM 的多标签意图解析
 *
 * - 使用低温（0）单次调用，响应快速
 * - 解析失败时静默降级，返回 qa + confidence 0
 */
export async function parseByLLM(content: string): Promise<IntentResult> {
  try {
    const raw = await prompt(content, SYSTEM_PROMPT, {
      temperature: 0,
      maxTokens: 32,
    });

    const tags = parseLLMOutput(raw);

    // LLM 分类置信度固定为高置信
    return { tags, confidence: 0.9 };
  } catch {
    // LLM 调用失败 → 静默降级，置信度 0 触发回退
    return { tags: new Set(["qa"]), confidence: 0 };
  }
}