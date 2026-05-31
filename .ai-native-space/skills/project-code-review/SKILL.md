---
name: project-code-review
description: 对 swlws-agent 工程变更代码执行规范审查 + 业务语义审查，输出 P0/P1/P2 分级结果并写入 .ai-native-tmp/cr/<日期>.md。在用户提到 code review、审查代码、review 变更、检查规范、@review 时使用。也可由 ai-commit skill 在提交前自动触发。
---

# project-code-review

对本工程变更文件执行两步审查，输出分级结果并持久化。

## 触发条件

- 变更（staged 或 diff）中包含 `src/` 下的 `.ts` / `.tsx` 文件
- 或用户主动调用（code review、审查代码、@review）
- 或 ai-commit skill 在 Phase 1.5 中触发

## 主流程

```
Step 1 采集变更   → git diff --cached（staged）或 git diff HEAD（最近提交）
Step 2 规范审查   → 执行 [规范审查清单](#规范审查清单)（结构性规则，逐条核对）
Step 3 语义审查   → 执行 [代码审查（业务语义）](references/rules.md)（P0/P1/P2 分级）
Step 4 持久化     → 写入 .ai-native-tmp/cr/<YYYY-MM-DD>.md
Step 5 输出结果   → 按 [输出格式](#审查输出格式) 展示
```

## 参考文档

| 主题                             | 文件                                                                                   |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| P0 / P1 / P2 规则详细说明        | [references/rules.md](references/rules.md)                                             |
| 后端架构约定（分层/工具/Runner） | [../project-develop/references/backend.md](../project-develop/references/backend.md)   |
| 前端架构约定（状态/API/组件）    | [../project-develop/references/frontend.md](../project-develop/references/frontend.md) |
| 数据流与 SSE 协议                | [../project-develop/references/dataflow.md](../project-develop/references/dataflow.md) |
| 类型系统约定                     | [../project-develop/references/types.md](../project-develop/references/types.md)       |

---

## 规范审查清单

生成/修改代码完成后，逐项核对（结构性规则，非业务语义）：

**后端（`src/be/`）**

- [ ] `src/be/` 下无 `window` / `document` / `localStorage` 引用
- [ ] 文件写操作使用 `lockedWrite`，未直接调用 `fs.writeFile` / `fs.appendFile`
- [ ] LLM 调用通过 `text-llm.ts` 的 `chat` / `chatStream` / `prompt`，未直接实例化 OpenAI 客户端（`new OpenAI()`）
- [ ] 新增 ModeRunner 已在 `src/be/engine/runners/index.ts` 的 `modeRunners` Map 注册
- [ ] 工具调用循环使用 `runReActLoop`，未在 Runner 中重复实现工具调用逻辑
- [ ] 新增内置 Tool 已在 `src/be/engine/tools/index.ts` 的 `staticTools` 数组中注册
- [ ] 新增 AgentMode 值已在 `src/be/config/settings.ts` 的 `AgentMode` 类型和 `VALID_MODES` 中同步更新

**API Route（`src/app/api/`）**

- [ ] 每个 Route Handler 文件顶部包含 `export const runtime = "nodejs"`
- [ ] 用户输入在 Route Handler 层完成校验，不将原始输入透传到 QueryEngine
- [ ] uid / conversationId 有空值兜底（`?? "anonymous"` / `?? "default"`）

**前端（`src/fe/`）**

- [ ] `src/fe/` 下无 `fs` / `path` 模块引用
- [ ] 前端不直接读取 `process.env`（通过 API 获取后端配置）
- [ ] 所有后端 API 调用通过 `src/fe/apis/` 下的函数，未在组件中直接 `fetch`
- [ ] 新增 `CardType` 值已在前后端两处 `const enum` 同步更新，且 `MessageItem.tsx` 中有对应渲染分支
- [ ] 客户端组件顶部有 `'use client'` 指令

**类型系统**

- [ ] 新增配置字段已在 `AppSettings` 类型、`HARDCODED_DEFAULTS`、`SettingsPanel.tsx` 三处同步
- [ ] 跨模块导入使用 `@/*` 路径别名，未使用相对路径 `../../../`
- [ ] `AgentMode` 类型前端直接从 `@/fe/apis/settings` re-export，未重复定义

---

## 审查输出格式

```
## 规范审查

✅ 通过：全部 N 项
⚠️ 问题（N 项）：
  - [规范] src/be/engine/runners/my-runner/index.ts:12 — 直接调用 fs.writeFile，应使用 lockedWrite

## 代码审查（业务语义）

**P0 — 必须修复（N 项）**
- [P0] src/be/engine/index.ts:45 — AbortError 未被捕获，用户中止时会触发 onError 回调

**P1 — 强烈建议（N 项）**
- [P1] src/fe/pages/Chat/useChat.ts:88 — assistantIndex 在 sendText 闭包内依赖 messages.length，并发发送时索引可能越界

**P2 — 建议优化（N 项）**
- [P2] src/be/engine/tools/index.ts:22 — import 的 webSearchTool 未在 staticTools 中使用

✅ 无问题
```

---

## 审查结果持久化

每次执行审查，**必须将结果写入 `.ai-native-tmp/cr/<YYYY-MM-DD>.md`**：

- 同日多次审查追加到同一文件末尾（附时间戳分隔符 `---`）
- `.ai-native-tmp/` 目录不纳入版本控制
- 格式与「审查输出格式」保持一致

---

## ai-commit 联动规则

被 ai-commit Phase 1.5 触发时，审查结果影响后续提交选项：

| 最高级别             | 行为                                                       |
| -------------------- | ---------------------------------------------------------- |
| **P0**               | 禁止出现「直接提交」选项，只能「修复后重新运行」或「取消」 |
| **P1**               | 增加「忽略 P1 直接提交」选项，默认推荐「先修复」           |
| 仅 **P2 / 规范问题** | 正常提交，审查摘要附在 commit body 末尾                    |

---

## 自我进化机制

当用户对某条审查结论明确表示「不需要修复」或「这不是问题」时，**必须用 AskUserQuestion 询问**：

> 「[规则简述]」这条校验，您希望如何处理？

**选项**：

| 选项             | 行为                                            |
| ---------------- | ----------------------------------------------- |
| 本轮对话临时跳过 | 仅本次对话中不再提示该问题，下次重新生效        |
| 永久豁免此规则   | 将豁免记录写入 `references/rules.md` 的豁免列表 |
| 仍需修复         | 维持原判，继续要求修复                          |

**永久豁免写入规范**：追加到 `references/rules.md` 末尾的豁免列表（格式见该文件），并在每次审查前读取豁免列表，命中规则跳过不输出。

当用户指出某条现有规则描述不准确，或提供了新的实现模式，**必须用 AskUserQuestion 确认**是否更新对应规则，确认后立即追加到 `references/rules.md` 并注明 `<!-- updated: [日期] -->`。
