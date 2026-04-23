import path from "path";

/** 所有持久化数据的根目录 */
export const DATA_DIR = path.join(process.cwd(), ".swlws");

/** 会话存储目录（原 .sessions） */
export const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

/** MCP 配置文件路径 */
export const MCP_CONFIG_PATH = path.join(DATA_DIR, "mcp.json");
