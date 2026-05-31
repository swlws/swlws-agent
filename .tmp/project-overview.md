# 工程概览：swlws-agent

> 生成时间：2026-05-31 17:00

## 基本信息

| 项目 | 值 |
|------|----|
| 技术栈 | Next.js 16 / React 19 / TypeScript 5 / Tailwind CSS v4 / OpenAI SDK |
| 构建工具 | Next.js + Turbopack |
| 启动命令 | `npm run dev` |
| 构建命令 | `npm run build` |
| LLM 接入 | OpenAI 兼容接口（环境变量 `SWLWS_TEXT_LLM_*`，默认走 OpenRouter） |
| 图像生成 | 独立接口（`SWLWS_IMAGE_GEN_*`，默认走 SiliconFlow） |

## 目录结构（关键路径）

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # 单页入口 → 渲染 <Chat />
│   └── api/                # Route Handlers（全部声明 runtime = "nodejs"）
│       ├── chat/           # SSE 流式对话（GET+POST）+ abort
│       ├── conversations/  # 会话列表 CRUD
│       ├── memory/         # 读取历史消息
│       ├── mcp/            # MCP 服务管理
│       ├── mindcards/      # 心智卡片查询
│       ├── settings/       # 用户设置
│       └── skills/         # Skill 启停管理
├── be/                     # 后端核心（仅 Node.js runtime）
│   ├── config/             # AppSettings 类型 + 三级配置合并
│   ├── lib/                # text-llm.ts / image-gen.ts（LLM 封装）
│   ├── session/            # 文件持久化 + lockedWrite 并发安全写
│   ├── memory/             # 消息构建 / 摘要提取 / 心智卡片
│   ├── engine/
│   │   ├── index.ts        # QueryEngine（核心调度器）
│   │   ├── intent/         # 意图解析（rule/llm/disabled）
│   │   ├── runners/        # 5 种 ModeRunner 实现
│   │   │   ├── common/react-core.ts  # 通用 ReAct 循环（共享）
│   │   │   ├── text/       # 直接流式输出
│   │   │   ├── re-act/     # ReAct 工具调用循环
│   │   │   ├── plan-and-solve/  # 规划后逐步执行
│   │   │   ├── image-gen/  # 图片生成
│   │   │   └── reflection/ # Think→Draft→Audit→Revise 自审
│   │   ├── tools/          # 工具注册表 + 内置工具 + MCP 适配
│   │   └── skills/         # Skill 加载/匹配/执行
│   └── services/           # chatSseService + abortRegistry
├── fe/                     # 前端（React 客户端）
│   ├── apis/               # 所有后端 API 调用函数
│   ├── lib/                # chatSseClient / http / uid
│   ├── pages/Chat/         # Chat 页面（useChat Hook + 所有子组件）
│   ├── cards/              # 消息卡片（markdown/cot/error/image/divider）
│   └── components/         # 通用 UI（Button/Dialog/Drawer/Select）
└── instrumentation.ts      # Next.js 启动钩子：初始化 MCP + Skill

.swlws/                     # 运行时数据（不纳入版本控制）
├── sessions/user/<uid>/    # 会话文件 / 心智卡片 / 用户设置
├── mcp.json                # MCP 服务配置
└── skills-state.json       # Skill 启停状态

.swlws-builtin/skills/      # 内置 Skill（只读，随代码发布）
.ai-native-space/skills/    # 本工程维护的 AI 编程 Skill
.claude/skills → .ai-native-space/skills  # 软链接，Claude Code 加载入口
```

## 核心模块

### `src/be/engine/index.ts` — QueryEngine 调度器

- **定位**：所有对话请求的唯一入口，协调配置加载、记忆注入、Skill/Intent 路由、结果持久化
- **数据来源**：`loadSettings(uid)` 三级合并；`loadConversation(uid, convId)` 读文件
- **核心逻辑**：Skill `/command` 匹配优先 → IntentParser 解析 → resolveRunner 路由 → ModeRunner.execute() → SSE 推流 → 保存会话 → 刷新心智卡片
- **当前状态**：完整，AbortError 三条件联合捕获（`AbortError` / `APIUserAbortError` / `signal.aborted`）

### `src/be/engine/runners/common/react-core.ts` — ReAct 核心循环

- **定位**：所有工具调用场景（re-act / plan-and-solve / reflection）的统一实现
- **核心逻辑**：流式请求 → 并行执行 tool_calls → 追加 Observation → 循环直到无工具调用或超 32k token 预算
- **关键参数**：`mutable: true` 时直接操作传入的 messages（Reflection 共享上下文场景）

### `src/be/engine/runners/reflection/` — Reflection 自审模式

- **定位**：高质量输出场景，Think→Draft→Audit→Revise 最多 3 轮
- **核心逻辑**：全程共享同一 `messages[]`（`mutable: true`）；Audit 低温（0.2）输出 JSON `{status, confidence, issues[]}`；相似度 > 0.8 提前收敛

### `src/be/session/index.ts` — 文件持久化层

- **定位**：所有会话/配置/心智卡片的读写，唯一持久化入口
- **核心逻辑**：`lockedWrite` = Promise 链队列，同一文件顺序执行，防并发覆写

### `src/be/memory/` — 记忆系统

- **定位**：短期消息窗口（最近 8 条注入 LLM）+ 长期结构化摘要（4 类 Memory）
- **触发**：每 `summaryTriggerCount`（默认 8）条用户消息触发一次 `extractMemories`
- **心智卡片**：每 4 小时刷新，基于最近 6 条消息生成 16 张引导卡片，随机展示 4 张

### `src/fe/pages/Chat/useChat.ts` — 前端核心 Hook

- **定位**：所有前端状态的单一来源（消息/会话/loading/agentMode）
- **核心逻辑**：`sendText` → `connectChatSse` → `onToken(cardType, delta)` → `setMessages` 按 cardType 追加到对应 MessageCard
- **注意**：`assistantIndex` 基于 `messages.length` 快照计算，并发发送时存在索引竞态（已知 P1 问题）

## 核心约定

- **文件写操作必须使用 `lockedWrite`**，禁止直接调用 `fs.writeFile`，防止并发覆写会话数据
- **所有 API Route 必须声明 `export const runtime = "nodejs"`**，防止 Edge runtime 下 fs/child_process 不可用
- **新增 CardType 须前后端同步**：`src/be/engine/runners/type.ts` 和 `src/fe/lib/chatSseClient.ts` 各维护一份 `const enum`，数值必须一致
- **新增 AgentMode 须三处同步**：`AppSettings` 类型、`HARDCODED_DEFAULTS`、前端 `VALID_MODES` + Route Handler `VALID_MODES`
- **工具调用循环复用 `runReActLoop`**，禁止在各 Runner 中重复实现

## 可用 Skill

| Skill | 说明 |
|-------|------|
| `ai-commit` | 分析 git 暂存区变更，按模块/类型分组生成「特性(scope): desc」提交信息，经用户确认后执行分组 commit |
| `project-code-review` | 对本工程变更代码执行规范审查 + 业务语义审查，输出 P0/P1/P2 分级结果，支持 ai-commit 联动 |
| `project-develop` | 本工程开发规范，覆盖架构分层、后端/前端约定、数据流、配置、类型系统 |
| `project-overview` | 快速生成工程摘要并持久化，供后续对话复用 |
| `skill-link` | 将外部项目的 skill 目录软链接到 .claude/skills/，实现多工程共享 skill |

## 当前状态

- 分支：`master`
- 未提交变更：0 个文件（工作区干净）
