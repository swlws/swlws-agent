import { parseByRules } from "./rules";
import { parseByLLM } from "./llm";
import type { IntentResult } from "./types";

export type { IntentTag, IntentResult } from "./types";

export type IntentDetectionMode = "rule" | "llm" | "disabled";

/**
 * 意图解析器入口
 *
 * - "rule"     : 基于关键词/正则规则，零额外 LLM 调用
 * - "llm"      : 单次低温 LLM 调用，多标签分类
 * - "disabled" : 跳过解析，返回空结果（由 resolver 回退到 agentMode）
 */
export class IntentParser {
  constructor(
    private readonly mode: IntentDetectionMode,
    private readonly confidenceThreshold: number,
  ) {}

  async parse(content: string): Promise<IntentResult> {
    switch (this.mode) {
      case "rule":
        return parseByRules(content);

      case "llm":
        return parseByLLM(content);

      case "disabled":
      default:
        // disabled 时置信度设为 0，resolver 将完全回退到 agentMode
        return { tags: new Set(), confidence: 0 };
    }
  }

  /**
   * 置信度是否达到路由阈值
   */
  isConfident(result: IntentResult): boolean {
    return result.confidence >= this.confidenceThreshold;
  }
}