# swlws-agent 是什么

一个个人 AI 助手 — Next.js 16 + OpenAI SDK + MCP 构建。LLM 走 OpenRouter，图像走 SiliconFlow，模型完全可换。

## 关键架构

三层：

- `src/app`（Next.js 路由）
- `src/be`（后端推理引擎）
- `src/fe`（React 前端）
- `src/instrumentation` 启动时初始化 MCP 与 Skills。

请求链路：`浏览器 EventSource` → `/api/chat` → `chatSseService` → `QueryEngine.run()` → `流式 SSE 回写`。

## 核心引擎（src/be/engine/）

5 种 Runner：

- text — 单次流式
- react — Think→Action→Observation 循环（react-core.ts:31）
- plan-and-solve — 先规划后执行
- image-gen — 图像生成
- reflection — Think→Draft→Audit→Revise 四阶段自审，最多 3 轮（按 docs/reflection.md 实现）

## 意图解析

rule（默认正则）/ llm / disabled 三种策略 → resolveRunner 路由到 Runner。

## 三大扩展系统

1. Skills（.swlws-builtin/skills + .swlws/skills）— SKILL.md + YAML frontmatter，/command 触发，as-tool: true 可作为 LLM 工具暴露
2. MCP（.swlws/mcp.json）— 支持 stdio 和 SSE 两种传输，工具命名 mcp**<server>**<tool>
3. 静态工具 — 如 imageGenerateTool

三类工具运行时合并成统一 Tool[] 注入 ReAct。

## 记忆系统

- 会话存 `.swlws/sessions/user/<uid>/conversation/<id>.json`
- lockedWrite Promise 链串行化保证并发安全
- 每 8 条用户消息触发一次 LLM 摘要（Memory[]）
- 心智卡片 4 小时 TTL 刷新（16 张引导卡片）

## 前端要点

- useChat Hook + EventSource SSE
- 卡片级增量渲染：cardType 区分 markdown / cot / image / error / divider
- abortRegistry 实现中止控制
