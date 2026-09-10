import fs from "fs/promises";
import type { Tool } from "./index";

/** 读取上限，避免超大文件撑爆模型上下文 */
const MAX_READ = 60_000;

export const readFileTool: Tool = {
  name: "read_file",
  description:
    "读取本地文件的文本内容。用于读取脚本生成的报告、参考文档等。返回文件内容（超长会截断）。",
  parameters: {
    type: "object",
    properties: {
      path: {
        type: "string",
        description: "要读取的文件绝对路径或相对当前工作目录的路径",
      },
    },
    required: ["path"],
  },
  async execute(args) {
    const filePath = String(args.path ?? "").trim();
    if (!filePath) return "[read_file 错误: path 为空]";
    try {
      const content = await fs.readFile(filePath, "utf-8");
      if (content.length <= MAX_READ) return content;
      return (
        content.slice(0, MAX_READ) +
        `\n\n... [内容已截断，共 ${content.length} 字符，仅显示前 ${MAX_READ}]`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return `[read_file 读取失败: ${msg}]`;
    }
  },
};
