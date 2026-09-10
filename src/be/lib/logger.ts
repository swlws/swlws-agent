/**
 * 统一日志模块（后端专用）。
 *
 * 级别：debug < info < warn < error，默认 info，由环境变量 SWLWS_LOG_LEVEL 覆盖
 *（不合法值回退 info）。低于当前级别的日志直接丢弃。
 * warn/error 走 stderr，其余走 stdout。仅 console 输出，不落盘。
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = (process.env.SWLWS_LOG_LEVEL ?? "").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

// 启动时解析一次（logger 属启动期基础设施，运行时改级别意义有限）
const currentLevel = resolveLevel();
const currentWeight = LEVEL_WEIGHT[currentLevel];

function timestamp(): string {
  // 仅取 HH:mm:ss.SSS，避免依赖 Date 完整格式
  const now = new Date();
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
    now.getSeconds(),
  )}.${pad(now.getMilliseconds(), 3)}`;
}

function format(
  level: LogLevel,
  module: string,
  msg: string,
  meta?: unknown,
): string {
  let line = `[${timestamp()}] [${level.toUpperCase()}] [${module}] ${msg}`;
  if (meta !== undefined) {
    try {
      line += ` ${JSON.stringify(meta)}`;
    } catch {
      line += ` ${String(meta)}`;
    }
  }
  return line;
}

function emit(
  level: LogLevel,
  module: string,
  msg: string,
  meta?: unknown,
): void {
  if (LEVEL_WEIGHT[level] < currentWeight) return;
  const line = format(level, module, msg, meta);
  if (level === "warn" || level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (module: string, msg: string, meta?: unknown) =>
    emit("debug", module, msg, meta),
  info: (module: string, msg: string, meta?: unknown) =>
    emit("info", module, msg, meta),
  warn: (module: string, msg: string, meta?: unknown) =>
    emit("warn", module, msg, meta),
  error: (module: string, msg: string, meta?: unknown) =>
    emit("error", module, msg, meta),
};
