# 目录结构与分层架构

## 顶层结构

```
src/
├── app/          # Next.js App Router（页面入口 + API Route Handlers）
├── be/           # 后端核心（仅 Node.js runtime）
└── fe/           # 前端（React 客户端组件）

.swlws/           # 运行时数据（会话、配置、Skill 状态）—— 不纳入版本控制
.swlws-builtin/   # 内置 Skill（只读，随代码发布）
```

## 三层分离原则

| 层 | 路径 | 职责 | 禁止引入 |
|----|------|------|---------|
| App Router | `src/app/` | 页面入口、API Route、全局初始化 | 业务逻辑直接写在 route 中 |
| Backend | `src/be/` | LLM 调用、文件持久化、Agent 引擎、工具执行 | `window`、`document`、`localStorage` |
| Frontend | `src/fe/` | React 组件、状态 Hook、API 客户端 | `fs`、`path`、直接读 `process.env` |

## 后端目录详解

```
src/be/
├── config/
│   ├── paths.ts          # 全局路径常量（DATA_DIR、SESSIONS_DIR 等）
│   ├── settings.ts       # AppSettings 类型 + 默认值 + 三级合并逻辑
│   └── setting.json      # 文件级默认配置（覆盖硬编码默认值）
├── lib/
│   ├── text-llm.ts       # OpenAI SDK 封装（chat/chatStream/prompt）
│   └── image-gen.ts      # OpenAI Images API 封装
├── session/index.ts      # 文件系统持久化（lockedWrite + 数据类型定义）
├── memory/               # 记忆提取、消息裁剪、摘要、心智卡片
├── engine/
│   ├── index.ts          # QueryEngine（核心调度器）
│   ├── prompts/          # 系统提示词注入（深度思考策略等）
│   ├── intent/           # 意图解析（rule/llm/disabled 三种模式）
│   ├── runners/          # ModeRunner 实现（text/image-gen/react/plan-and-solve/reflection）
│   ├── tools/            # 工具注册表 + 内置工具 + MCP 集成
│   └── skills/           # Skill 加载、匹配、执行
└── services/
    ├── chatSseService.ts # SSE 流封装
    └── abortRegistry.ts  # AbortController 注册表
```

## 前端目录详解

```
src/fe/
├── apis/           # 所有后端 API 调用（每个模块一个文件）
├── lib/
│   ├── chatSseClient.ts  # SSE 客户端 + 前端核心类型（ChatMessage、CardType）
│   ├── http.ts           # 通用 httpRequest（自动注入 uid header）
│   └── uid.ts            # localStorage uid/conversationId 管理
├── pages/Chat/     # Chat 页面（容器 + 状态 Hook + 子组件）
├── cards/          # 消息卡片渲染（按 CardType 分类）
├── components/     # 通用 UI 组件
└── assets/icons/   # SVG 图标 React 组件
```

## 全局初始化

`src/instrumentation.ts` 的 `register()` 钩子在 Next.js Node.js runtime 启动时执行一次：
- 初始化 `McpManager`（启动所有 enabled MCP 服务）
- 初始化 `SkillManager`（扫描并加载 Skill）
- 注册进程退出清理（`McpManager.closeAll()`）

新增需要全局单例初始化的模块，在此处注册。
