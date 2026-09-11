import path from "path";

/** 所有持久化数据的根目录 */
export const DATA_DIR = path.join(process.cwd(), ".swlws");

/** 会话存储目录（原 .sessions） */
export const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

/** MCP 配置文件路径 */
export const MCP_CONFIG_PATH = path.join(DATA_DIR, "mcp.json");

/** 用户 Skill 目录 */
export const SKILLS_DIR = path.join(DATA_DIR, "skills");

/** 内置 Skill 目录 */
export const BUILTIN_SKILLS_DIR = path.join(
  process.cwd(),
  ".swlws-builtin/skills",
);

/** 各 skill 的数据/分析报告产出根目录（子目录按 skill 划分） */
export const REPORTS_DIR = path.join(process.cwd(), "native-tmp");
