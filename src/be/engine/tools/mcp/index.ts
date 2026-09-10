import type { Tool, ToolResult } from "@/be/engine/tools";
import { loadMcpConfig, saveMcpConfig, type McpServerConfig } from "./config";
import { McpClient } from "./client";
import { adaptMcpTool, parseMcpToolName } from "./adapter";
import { logger } from "@/be/lib/logger";

export interface McpServerStatus {
  name: string;
  config: McpServerConfig;
  status: "connected" | "failed" | "disconnected";
  error?: string;
  tools: string[];
}

class McpManager {
  private clients = new Map<string, McpClient>();
  private configs = new Map<string, McpServerConfig>();
  private statuses = new Map<string, McpServerStatus>();
  private _tools: Tool[] = [];

  async initialize(): Promise<void> {
    const config = await loadMcpConfig();
    const entries = Object.entries(config.mcpServers);

    if (entries.length === 0) return;

    await Promise.allSettled(
      entries.map(([name, cfg]) => this._connectServer(name, cfg)),
    );
  }

  private async _connectServer(
    name: string,
    config: McpServerConfig,
  ): Promise<void> {
    this.configs.set(name, config);
    try {
      const client = new McpClient(name);
      await client.connect(config);
      this.clients.set(name, client);

      const adapted = client.tools.map((info) =>
        adaptMcpTool(name, info, client),
      );
      this._tools.push(...adapted);

      this.statuses.set(name, {
        name,
        config,
        status: "connected",
        tools: client.tools.map((t) => t.name),
      });
      logger.info("mcp", "连接成功", {
        server: name,
        toolCount: adapted.length,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      this.statuses.set(name, {
        name,
        config,
        status: "failed",
        error: msg,
        tools: [],
      });
      logger.error("mcp", "连接失败", { server: name, error: msg });
    }
  }

  getTools(): Tool[] {
    return this._tools;
  }

  getServerStatuses(): McpServerStatus[] {
    return [...this.statuses.values()];
  }

  async addServer(name: string, config: McpServerConfig): Promise<void> {
    // 先断开已有同名连接
    if (this.clients.has(name)) {
      await this.removeServer(name);
    }
    await this._connectServer(name, config);
    await this._persistConfig();
  }

  async stopServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.dispose().catch(() => {});
      this.clients.delete(name);
    }
    this._tools = this._tools.filter(
      (t) => !t.name.startsWith(`mcp__${name}__`),
    );
    const status = this.statuses.get(name);
    if (status) {
      this.statuses.set(name, {
        ...status,
        status: "disconnected",
        error: undefined,
        tools: [],
      });
    }
  }

  async startServer(name: string): Promise<void> {
    const config = this.configs.get(name);
    if (!config) return;
    // 先清理残留
    await this.stopServer(name);
    await this._connectServer(name, config);
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.dispose().catch(() => {});
      this.clients.delete(name);
    }
    this._tools = this._tools.filter(
      (t) => !t.name.startsWith(`mcp__${name}__`),
    );
    this.configs.delete(name);
    this.statuses.delete(name);
    await this._persistConfig();
  }

  private async _persistConfig(): Promise<void> {
    const mcpServers: Record<string, McpServerConfig> = {};
    for (const [name, cfg] of this.configs) {
      mcpServers[name] = cfg;
    }
    await saveMcpConfig({ mcpServers });
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
    this.configs.clear();
    this.statuses.clear();
    this._tools = [];
  }
}

const g = globalThis as unknown as {
  __mcpManager?: McpManager;
  __mcpManagerVersion?: number;
};
const MCP_VERSION = 2;
if (!g.__mcpManager || g.__mcpManagerVersion !== MCP_VERSION) {
  g.__mcpManager = new McpManager();
  g.__mcpManagerVersion = MCP_VERSION;
}
export const mcpManager: McpManager = g.__mcpManager;

export { parseMcpToolName };
