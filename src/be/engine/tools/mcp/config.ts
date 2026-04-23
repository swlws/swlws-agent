import fs from "fs/promises";
import { MCP_CONFIG_PATH } from "@/be/config/paths";

export interface McpStdioServerConfig {
  transport: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface McpSseServerConfig {
  transport: "sse";
  url: string;
  headers?: Record<string, string>;
}

export type McpServerConfig = McpStdioServerConfig | McpSseServerConfig;

export interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export async function loadMcpConfig(): Promise<McpConfig> {
  try {
    const raw = await fs.readFile(MCP_CONFIG_PATH, "utf-8");
    return JSON.parse(raw) as McpConfig;
  } catch {
    return { mcpServers: {} };
  }
}
