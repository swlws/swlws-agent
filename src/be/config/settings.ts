import fs from "fs/promises";
import path from "path";

export type AgentMode =
  | "text"
  | "plan-and-solve"
  | "react"
  | "image-gen"
  | "reflection";

/** 意图检测策略：rule = 规则匹配，llm = LLM 分类，disabled = 关闭 */
export type IntentDetectionMode = "rule" | "llm" | "disabled";

export interface AppSettings {
  /** 会话消息存储上限（条），超出时从头部截断，不触发 LLM */
  maxMessagesCount: number;
  /** 每新增多少条消息触发一次历史摘要重新生成（须为偶数，2 条 = 1 次对话） */
  summaryTriggerCount: number;
  /** 默认展示的心智卡片数量，2 的倍数，最多 16 */
  mindCardsDisplayCount: number;
  /** 心智卡片更新间隔（小时） */
  mindCardsUpdateHours: number;
  /** 智能体执行模式：text = 文本处理，plan-and-solve = 规划后逐步执行，react = 推理与行动交替 */
  agentMode: AgentMode;
  /** 意图检测策略：rule = 规则匹配（默认），llm = LLM 分类，disabled = 关闭 */
  intentDetection: IntentDetectionMode;
  /** 意图置信度阈值（0~1），低于此值时回退到 agentMode，默认 0.4 */
  intentConfidenceThreshold: number;
}

const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "src/be/config/setting.json",
);

const HARDCODED_DEFAULTS: AppSettings = {
  maxMessagesCount: 100,
  summaryTriggerCount: 8,
  mindCardsDisplayCount: 4,
  mindCardsUpdateHours: 4,
  agentMode: "text",
  intentDetection: "rule",
  intentConfidenceThreshold: 0.4,
};

let _defaultCache: AppSettings | null = null;

export async function loadDefaultSettings(): Promise<AppSettings> {
  if (_defaultCache) return { ..._defaultCache };
  try {
    const raw = await fs.readFile(DEFAULT_CONFIG_PATH, "utf-8");
    // 用硬编码默认值兜底，确保 setting.json 字段不全时自动补全
    const fromFile = JSON.parse(raw) as Partial<AppSettings>;
    _defaultCache = { ...HARDCODED_DEFAULTS, ...fromFile };
  } catch {
    // 文件缺失或解析失败时完全使用硬编码默认值
    _defaultCache = { ...HARDCODED_DEFAULTS };
  }
  return { ..._defaultCache };
}

/** 用户配置覆盖默认配置，仅覆盖已定义的字段 */
export function mergeSettings(
  defaults: AppSettings,
  user: Partial<AppSettings>,
): AppSettings {
  return { ...defaults, ...user };
}
