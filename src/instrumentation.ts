/**
 * Next.js instrumentation hook — 仅在 Node.js 运行时（服务端）执行一次
 * 用于初始化 MCP Manager，将 MCP 工具注入全局注册表
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { mcpManager } = await import("@/be/engine/tools/mcp");

  await mcpManager.initialize();

  // 进程退出时断开所有 MCP 连接（通过 globalThis 括号访问，绕过 Edge 打包器静态分析）
  const dispose = () => void mcpManager.dispose();
  const proc = (globalThis as Record<string, unknown>)["process"] as
    | NodeJS.Process
    | undefined;
  proc?.once("SIGTERM", dispose);
  proc?.once("SIGINT", dispose);
}
