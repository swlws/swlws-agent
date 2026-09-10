import type { Message } from "@/be/lib/text-llm";

export const enum CardType {
  Divider = 5,
  Markdown = 1,
  Cot = 2,
  Error = 3,
  Image = 4,
  Bash = 6,
}

export interface RunnerHandlers {
  onToken: (cardType: CardType, token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

/** 每种模式实现此接口，返回完整的 assistant 输出文本 */
export interface ModeRunner {
  execute(
    content: string,
    contextMessages: Message[],
    handlers: RunnerHandlers,
    signal?: AbortSignal,
  ): Promise<string>;
}

/* ── Reflection 专用类型 ── */

/** Audit 阶段结构化输出 */
export interface AuditIssue {
  severity: "critical" | "minor";
  description: string;
  suggestion: string;
}

export interface AuditResult {
  status: "pass" | "fail";
  confidence: number;
  issues: AuditIssue[];
}

/** Reflection 模式配置 */
export interface ReflectionOptions {
  maxRounds?: number;          // 默认 3
  auditTemperature?: number;   // Audit 阶段低温 0.2
  draftTemperature?: number;   // Draft 阶段 0.7
}
