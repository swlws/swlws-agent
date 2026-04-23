import type { Tool, ToolResult } from "@/be/engine/tools";
import type { McpClient, McpToolInfo } from "./client";

export const MCP_PREFIX = "mcp__";

/** MCP tool 的全局名称：mcp__<serverName>__<toolName> */
export function mcpToolName(serverName: string, toolName: string): string {
  return `${MCP_PREFIX}${serverName}__${toolName}`;
}

/** 从全局名称解析出 serverName 和 toolName */
export function parseMcpToolName(
  name: string,
): { serverName: string; toolName: string } | null {
  if (!name.startsWith(MCP_PREFIX)) return null;
  const rest = name.slice(MCP_PREFIX.length);
  const sep = rest.indexOf("__");
  if (sep === -1) return null;
  return { serverName: rest.slice(0, sep), toolName: rest.slice(sep + 2) };
}

/** 将 McpClient 中的一个工具适配为本地 Tool 接口 */
export function adaptMcpTool(
  serverName: string,
  info: McpToolInfo,
  client: McpClient,
): Tool {
  return {
    name: mcpToolName(serverName, info.name),
    description: `[${serverName}] ${info.description ?? info.name}`,
    parameters: info.inputSchema,
    async execute(
      args: Record<string, unknown>,
      signal?: AbortSignal,
    ): Promise<string> {
      const result: ToolResult = await client.callTool(info.name, args, signal);
      if (result.isError) throw new Error(result.content);
      return result.content;
    },
  };
}
