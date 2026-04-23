/**
 * Next.js instrumentation hook — 仅在 Node.js 运行时（服务端）执行一次
 * 用于初始化 MCP Manager，将 MCP 工具注入全局注册表
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log("register mcp");

  const { mcpManager } = await import("@/be/engine/tools/mcp");
  const { registerTools } = await import("@/be/engine/tools");

  await mcpManager.initialize();
  registerTools(mcpManager.getTools());

  // 进程退出时断开所有 MCP 连接（动态引用 process，避免 Edge 打包器静态报错）
  const dispose = () => void mcpManager.dispose();
  const proc = await import("node:process");
  proc.default.once("SIGTERM", dispose);
  proc.default.once("SIGINT", dispose);
}
