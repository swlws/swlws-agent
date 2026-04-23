import type { Tool, ToolResult } from "@/be/engine/tools";
import { loadMcpConfig } from "./config";
import { McpClient } from "./client";
import { adaptMcpTool, parseMcpToolName } from "./adapter";

class McpManager {
  private clients = new Map<string, McpClient>();
  private _tools: Tool[] = [];

  async initialize(): Promise<void> {
    const config = await loadMcpConfig();
    const entries = Object.entries(config.mcpServers);

    if (entries.length === 0) return;

    const results = await Promise.allSettled(
      entries.map(async ([serverName, serverConfig]) => {
        const client = new McpClient(serverName);
        await client.connect(serverConfig);
        this.clients.set(serverName, client);
        return { serverName, client };
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        const { serverName, client } = result.value;
        const adapted = client.tools.map((info) =>
          adaptMcpTool(serverName, info, client),
        );
        this._tools.push(...adapted);
        console.log(
          `[MCP] ${serverName} connected, ${adapted.length} tool(s) loaded`,
        );
      } else {
        console.error("[MCP] Server connection failed:", result.reason);
      }
    }
  }

  getTools(): Tool[] {
    return this._tools;
  }

  async execute(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    const client = this.clients.get(serverName);
    if (!client) {
      return {
        content: `[MCP] 未找到 server: ${serverName}`,
        isError: true,
      };
    }
    return client.callTool(toolName, args, signal);
  }

  async dispose(): Promise<void> {
    await Promise.allSettled(
      [...this.clients.values()].map((c) => c.dispose()),
    );
    this.clients.clear();
    this._tools = [];
  }
}

export const mcpManager = new McpManager();

export { parseMcpToolName };
