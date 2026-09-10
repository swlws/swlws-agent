import { exec } from "child_process";
import { logger } from "@/be/lib/logger";
import type { Tool } from "./index";

/**
 * ⚠️ 安全提示：本工具直接执行任意 shell 命令，无命令白名单 / 沙箱 / 权限门控。
 * 仅适用于**受信任的本地自用环境**。若本 app 将来对外提供服务，这里等价于
 * 任意命令执行（RCE）漏洞，届时必须加入命令校验 / 沙箱 / 用户确认。
 */

/** 输出截断上限，避免超长 stdout 撑爆模型上下文 */
const MAX_OUTPUT = 30_000;
/** 命令超时（毫秒） */
const TIMEOUT_MS = 120_000;

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  return (
    text.slice(0, MAX_OUTPUT) +
    `\n\n... [输出已截断，共 ${text.length} 字符，仅显示前 ${MAX_OUTPUT}]`
  );
}

export const runCommandTool: Tool = {
  name: "run_command",
  description:
    "在本地 shell 执行命令并返回 stdout/stderr（合并）。适用于运行脚本（如 python3 script.py）、查看文件列表等。命令在指定工作目录下执行，非零退出码会在结果中标注。",
  parameters: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "要执行的完整 shell 命令，例如 `python3 /path/to/script.py --arg x`",
      },
      cwd: {
        type: "string",
        description: "工作目录（可选），默认为进程当前目录",
      },
    },
    required: ["command"],
  },
  async execute(args, signal) {
    const command = String(args.command ?? "").trim();
    if (!command) return "[run_command 错误: command 为空]";
    const cwd = args.cwd ? String(args.cwd) : process.cwd();

    logger.info("run_command", "执行命令", { command, cwd });

    return await new Promise<string>((resolve) => {
      const child = exec(
        command,
        { cwd, timeout: TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          const parts: string[] = [];
          if (stdout) parts.push(stdout);
          if (stderr) parts.push(`[stderr]\n${stderr}`);
          if (error) {
            const code = (error as { code?: number }).code;
            const killed = (error as { killed?: boolean }).killed;
            if (killed) {
              parts.push(`[命令超时被终止，上限 ${TIMEOUT_MS / 1000}s]`);
              logger.error("run_command", "命令超时被终止", {
                command,
                timeoutMs: TIMEOUT_MS,
              });
            } else {
              parts.push(`[命令退出码: ${code ?? "非零"}]`);
              logger.error("run_command", "命令非零退出", {
                command,
                code: code ?? "unknown",
              });
            }
          } else {
            logger.info("run_command", "命令完成", { command, code: 0 });
          }
          resolve(truncate(parts.join("\n").trim() || "[命令无输出，退出码 0]"));
        },
      );

      // 透传取消：ReAct 循环中止时杀掉子进程
      if (signal) {
        if (signal.aborted) child.kill();
        else signal.addEventListener("abort", () => child.kill(), { once: true });
      }
    });
  },
};
