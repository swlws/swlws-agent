import fs from "fs/promises";
import path from "path";

export interface AppSettings {
  /** 对话缓存消息条数（压缩前保留的最近消息数），4-12 */
  conversationCacheCount: number;
  /** 人物画像更新间隔（小时） */
  personaUpdateHours: number;
  /** 默认展示的心智卡片数量，2 的倍数，最多 16 */
  mindCardsDisplayCount: number;
  /** 心智卡片更新间隔（小时） */
  mindCardsUpdateHours: number;
}

const DEFAULT_CONFIG_PATH = path.join(
  process.cwd(),
  "src/be/config/setting.json",
);

let _defaultCache: AppSettings | null = null;

export async function loadDefaultSettings(): Promise<AppSettings> {
  if (_defaultCache) return _defaultCache;
  try {
    const raw = await fs.readFile(DEFAULT_CONFIG_PATH, "utf-8");
    _defaultCache = JSON.parse(raw) as AppSettings;
    return _defaultCache;
  } catch {
    // 文件缺失时的硬编码兜底
    _defaultCache = {
      conversationCacheCount: 4,
      personaUpdateHours: 4,
      mindCardsDisplayCount: 4,
      mindCardsUpdateHours: 4,
    };
    return _defaultCache;
  }
}

/** 用户配置覆盖默认配置，仅覆盖已定义的字段 */
export function mergeSettings(
  defaults: AppSettings,
  user: Partial<AppSettings>,
): AppSettings {
  return { ...defaults, ...user };
}
