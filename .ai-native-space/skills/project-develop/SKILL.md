---
name: project-develop
description: swlws-agent 工程开发规范。触发场景：在本工程新增功能、修改 API、新增 Runner/Tool/Skill、修改前端组件、调整配置或数据流时使用。关键词：新增功能、新增 runner、新增工具、新增页面、修改接口、调整配置、CardType、ModeRunner、ReAct、Skill 系统。
---

# project-develop：swlws-agent 工程开发规范

本工程是基于 **Next.js + React + TypeScript** 的全栈 AI Agent Web 应用，前后端同仓库，通过 SSE 实现实时流式输出。开发前先阅读本规范，编码完成后执行自检清单。

## 快速索引

| 主题 | 引用文档 |
|------|---------|
| 目录结构与分层 | [references/architecture.md](references/architecture.md) |
| 后端开发约定 | [references/backend.md](references/backend.md) |
| 前端开发约定 | [references/frontend.md](references/frontend.md) |
| 数据流与 SSE 协议 | [references/dataflow.md](references/dataflow.md) |
| 配置与环境变量 | [references/config.md](references/config.md) |
| 类型系统 | [references/types.md](references/types.md) |

## 主流程

生成/修改代码时，按以下顺序检查：

```
Step 1 定位层次   → 确认改动属于 be/（后端）还是 fe/（前端）还是 app/（路由）
Step 2 遵守分层   → 后端改动不引入浏览器 API，前端不直接读文件系统
Step 3 类型一致   → CardType/AppSettings 等跨层类型保持前后端一致
Step 4 数据流     → 新增 SSE 事件类型须同步更新前后端解析逻辑
Step 5 工具注册   → 新增 Tool/MCP/Skill 须在对应注册表登记
Step 6 并发安全   → 文件写操作必须走 lockedWrite；AbortController 须注册
Step 7 配置       → 新增配置项须在 AppSettings 类型、默认值、设置面板三处同步
Step 8 自检       → 完成后执行 [自检清单](#自检清单)
Step 9 自我进化   → 发现未记录的约定？执行 [自我进化机制](#自我进化机制)
```

## 自检清单

- [ ] 后端文件不含 `window` / `document` / `localStorage`
- [ ] 前端文件不含 `fs` / `path` / `process.env`（通过 API 获取）
- [ ] 新增 CardType 值已在前后端两处 `const enum` 同步更新
- [ ] 新增 API Route 包含 `export const runtime = "nodejs"`
- [ ] 文件写操作使用 `lockedWrite`，未直接调用 `fs.writeFile`
- [ ] 新增 ModeRunner 已在 `runners/index.ts` 的 `modeRunners` Map 注册
- [ ] 新增内置 Tool 已在 `tools/index.ts` 的 `getToolRegistry` 中合并
- [ ] 新增配置字段已在 `AppSettings` 类型、`HARDCODED_DEFAULTS`、`SettingsPanel.tsx` 三处更新
- [ ] AbortController 注册于 `abortRegistry`，不裸持有 controller 引用

## 自我进化机制

编码过程中，若发现以下情况，**必须暂停并用 AskUserQuestion 询问**，确认后再继续：

1. 代码中存在但 references 未记录的模式或约定
2. 用户描述了新的实现方式（新的 Runner 策略、新的记忆机制等）
3. references 中的描述与当前代码实现不一致

**询问模板**：

> 我发现一个新约定：`[简短描述]`（见 `[文件路径:行号]`）。是否将其添加到 references/[对应文档]？

用户确认后，立即追加到对应 reference 文件末尾，并注明 `<!-- updated: [日期] -->`。
