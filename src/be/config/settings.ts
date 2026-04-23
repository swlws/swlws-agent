import fs from "fs/promises";
import path from "path";

export type AgentMode = "text" | "plan-and-solve" | "react" | "image-gen";

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
}

const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "src/be/config/setting.json",
);

let _defaultCache: AppSettings | null = null;

export async function loadDefaultSettings(): Promise<AppSettings> {
  if (_defaultCache) return { ..._defaultCache };
  try {
    const raw = await fs.readFile(DEFAULT_CONFIG_PATH, "utf-8");
    _defaultCache = JSON.parse(raw) as AppSettings;
    return { ..._defaultCache };
  } catch {
    // 文件缺失时的硬编码兜底
    _defaultCache = {
      maxMessagesCount: 100,
      summaryTriggerCount: 8,
      mindCardsDisplayCount: 4,
      mindCardsUpdateHours: 4,
      agentMode: "text",
    };
    return { ..._defaultCache };
  }
}

/** 用户配置覆盖默认配置，仅覆盖已定义的字段 */
export function mergeSettings(
  defaults: AppSettings,
  user: Partial<AppSettings>,
): AppSettings {
  return { ...defaults, ...user };
}
