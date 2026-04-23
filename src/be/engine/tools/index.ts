import type OpenAI from "openai";
import { imageGenerateTool } from "./imageGenerate";
import { mcpManager, parseMcpToolName } from "./mcp";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute(args: Record<string, unknown>, signal?: AbortSignal): Promise<string>;
}

export interface ToolResult {
  content: string;
  isError: boolean;
}

/** 静态工具（随进程启动固定注册） */
const staticTools: Tool[] = [imageGenerateTool];

/** 动态工具（MCP 等在运行时注册） */
let dynamicTools: Tool[] = [];

export function registerTools(tools: Tool[]): void {
  dynamicTools.push(...tools);
}

export function clearDynamicTools(): void {
  dynamicTools = [];
}

function getAllTools(): Tool[] {
  return [...staticTools, ...dynamicTools];
}

export function getToolRegistry(): Tool[] {
  return getAllTools();
}

export function getToolDefinitions(): OpenAI.Chat.ChatCompletionTool[] {
  return getAllTools().map((tool) => ({
    type: "function" as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ToolResult> {
  // MCP 工具路由
  const mcp = parseMcpToolName(name);
  if (mcp) {
    return mcpManager.execute(mcp.serverName, mcp.toolName, args, signal);
  }

  // 本地静态/动态工具
  const tool = getAllTools().find((t) => t.name === name);
  if (!tool) {
    return { content: `[未知工具: ${name}]`, isError: true };
  }

  try {
    const content = await tool.execute(args, signal);
    return { content, isError: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { content: `[工具 ${name} 执行失败: ${msg}]`, isError: true };
  }
}
