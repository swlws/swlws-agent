/**
 * Next.js instrumentation hook — 仅在 Node.js 运行时（服务端）执行一次
 * 用于初始化 MCP Manager，将 MCP 工具注入全局注册表
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { mcpManager } = await import(
    "@/be/engine/tools/mcp"
  );
  const { registerTools } = await import("@/be/engine/tools");

  await mcpManager.initialize();
  registerTools(mcpManager.getTools());

  // 进程退出时断开所有 MCP 连接
  const dispose = () => void mcpManager.dispose();
  process.once("SIGTERM", dispose);
  process.once("SIGINT", dispose);
}
