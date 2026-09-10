import fs from "fs/promises";
import path from "path";
import { lockedWrite } from "@/be/session";
import { logger } from "@/be/lib/logger";
import type { Tool } from "./index";

export const writeFileTool: Tool = {
  name: "write_file",
  description:
    "把文本内容写入本地文件（覆盖式）。会自动创建父目录。用于回填分析报告、更新参考文档等。",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "目标文件绝对路径或相对当前工作目录的路径",
      },
      content: {
        type: "string",
        description: "要写入的完整文本内容（覆盖原文件）",
      },
    },
    required: ["path", "content"],
  },
  async execute(args) {
    const filePath = String(args.path ?? "").trim();
    if (!filePath) return "[write_file 错误: path 为空]";
    const content = String(args.content ?? "");
    logger.debug("write_file", "写入文件", {
      path: filePath,
      bytes: content.length,
    });
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      // 走 lockedWrite 遵守工程「禁止直接 fs.writeFile」约定
      await lockedWrite(filePath, content);
      logger.debug("write_file", "写入成功", { path: filePath });
      return `[write_file 成功: 已写入 ${content.length} 字符到 ${filePath}]`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("write_file", "写入失败", { path: filePath, error: msg });
      return `[write_file 写入失败: ${msg}]`;
    }
  },
};
