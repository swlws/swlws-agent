import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { McpServerConfig } from "./config";
import type { ToolResult } from "@/be/engine/tools";

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

export class McpClient {
  private client: Client;
  private _tools: McpToolInfo[] = [];

  constructor(readonly serverName: string) {
    this.client = new Client({ name: "swlws-agent", version: "1.0.0" });
  }

  async connect(config: McpServerConfig): Promise<void> {
    const transport =
      config.transport === "stdio"
        ? new StdioClientTransport({
            command: config.command,
            args: config.args,
            env: config.env
              ? { ...process.env, ...config.env } as Record<string, string>
              : undefined,
          })
        : new SSEClientTransport(new URL(config.url), {
            requestInit: config.headers
              ? { headers: config.headers }
              : undefined,
          });

    await this.client.connect(transport);

    const { tools } = await this.client.listTools();
    this._tools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: (t.inputSchema ?? {}) as Record<string, unknown>,
    }));
  }

  get tools(): McpToolInfo[] {
    return this._tools;
  }

  async callTool(
    toolName: string,
    args: Record<string, unknown>,
    signal?: AbortSignal,
  ): Promise<ToolResult> {
    try {
      const result = await this.client.callTool(
        { name: toolName, arguments: args },
        undefined,
        { signal: signal ?? undefined },
      );

      const raw = result.content as Array<{ type: string; text?: string }>;
      const content = raw
        .map((c) => (c.type === "text" ? (c.text ?? "") : `[${c.type}]`))
        .join("\n");

      return { content, isError: result.isError === true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { content: `[MCP 工具 ${toolName} 调用失败: ${msg}]`, isError: true };
    }
  }

  async dispose(): Promise<void> {
    await this.client.close();
  }
}
