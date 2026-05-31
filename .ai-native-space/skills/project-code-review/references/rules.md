# 业务语义审查规则

## 优先级定义

| 级别 | 含义 | 是否必须修复后才能提交 |
|------|------|----------------------|
| **P0** | 崩溃 / 功能失效 / 数据丢失 / 安全问题 | ✅ 是 |
| **P1** | 业务逻辑错误 / 并发竞态 / 内存泄漏 / 边界遗漏 | ⚠️ 强烈建议 |
| **P2** | 代码冗余 / 命名不规范 / 未用 import / 可读性 | 💡 建议 |

---

## P0 规则（必须修复）

### B-P0-1：AbortError 未正确识别导致错误回调误触发

**检查**：`QueryEngine.run` 的 catch 块中，AbortError 判断是否覆盖所有中止情形：
```typescript
// 正确：三条件联合判断
if (err.name === "AbortError" || err.name === "APIUserAbortError" || signal?.aborted) return;
```
若 catch 块缺少 `signal?.aborted` 或 `APIUserAbortError`，用户主动中止时会误触发 `onError` 回调，前端展示错误卡片。

### B-P0-2：文件写操作未使用 lockedWrite

**检查**：`src/be/session/` 或其他后端模块中直接调用 `fs.writeFile` / `fs.appendFile` 写持久化数据。  
**影响**：并发请求（同一会话多轮对话）时产生写冲突，导致会话数据覆写丢失。

### B-P0-3：环境变量缺失时未抛出明确错误

**检查**：`createClient()` 和 `resolveModel()` 在 `SWLWS_TEXT_LLM_API_KEY` 或 `SWLWS_TEXT_LLM_MODEL` 未设置时，是否抛出含字段名的 Error（而非静默传入 `undefined`）。  
**影响**：`undefined` 传入 OpenAI SDK 时产生运行时崩溃，错误信息不明确。

### B-P0-4：SSE 流未关闭导致连接泄漏

**检查**：`connectChatSse` 返回的 `{ close }` 是否在组件 unmount 或新请求发送前被调用。  
**影响**：旧 EventSource 持续接收事件，更新已卸载组件的 state，触发 React 警告或状态污染。

### B-P0-5：Route Handler 缺少 `export const runtime = "nodejs"`

**检查**：`src/app/api/` 下所有新增 Route Handler 文件是否包含此声明。  
**影响**：Edge runtime 下无法使用 `fs`、`child_process`，MCP stdio 传输和文件持久化会直接崩溃。

### B-P0-6：ModeRunner 执行后未调用 onDone

**检查**：Skill 命中分支和 Runner 分支执行完成后，`onDone()` 是否在 `QueryEngine.run` 中被调用（当前在 runner.execute 返回后统一调用）。  
**影响**：前端 `loading` 状态永远不会重置，输入框卡死无法发送新消息。

### F-P0-1：assistantIndex 基于 messages.length 快照导致并发索引错误

**检查**：`useChat.sendText` 中 `assistantIndex` 的计算：
```typescript
// 当前实现（存在隐患）
const assistantIndex = messages.length + 1;
```
若短时间内连续调用（如快速双击发送），`messages` state 快照可能不是最新值，导致 `onToken` 更新错误的消息位置。  
**建议**：改为在 `setMessages` 回调中用数组长度动态定位，或加 `loading` 守卫（已有，但需确认守卫在 state 更新前生效）。

---

## P1 规则（强烈建议）

### B-P1-1：Token 预算保护仅为软约束

**检查**：`react-core.ts` 中 `usedTokens < TOKEN_BUDGET` 的判断时机——在循环顶部判断，而非在收到 usage 后立即中止。  
**影响**：最后一次循环可能超出预算约 1 个请求量（约 2k-4k tokens）。对于需要精确控制成本的场景需注意。

### B-P1-2：工具执行结果 isError 未向 LLM 传递错误语义

**检查**：`executeTool` 返回 `{ isError: true }` 时，`react-core.ts` 是否将错误内容作为 `tool` 角色消息追加（当前直接追加内容字符串），LLM 是否能感知工具失败。  
**影响**：工具失败时 LLM 可能继续基于错误结果推理，生成不正确的最终答案。

### B-P1-3：摘要触发计数（summaryTriggerCount）含 system 消息

**检查**：`maybeUpdateSummary` 中统计 `newUserCount` 只过滤 `role === "user"`，但 `conv.messages` 中存在 cardType 为 2（Cot）的 assistant 消息。若 `buildContextMessages` 传入包含 system 消息的结构，需确认不会干扰计数。

### B-P1-4：listConversations 顺序读取无并发优化

**检查**：`session/index.ts` 的 `listConversations` 中，`for...of` 逐个读取会话文件。会话数量多时（>100）会显著阻塞 API 响应。  
**建议**：改用 `Promise.all` 并发读取。

### B-P1-5：前端 agentMode 持久化与后端 VALID_MODES 不同步

**检查**：`useChat.ts` 中 `VALID_MODES` 集合与 `src/app/api/chat/route.ts` 中的 `VALID_MODES` 是否一致。新增 AgentMode 时若只更新一处，会导致：
- 用户选择新模式后刷新页面回退到 `text`（前端 VALID_MODES 缺失）
- 或后端拒绝合法请求（后端 VALID_MODES 缺失）

### F-P1-1：SSE 连接 onerror 触发时未区分主动关闭和网络异常

**检查**：`chatSseClient.ts` 中 `es.onerror` 的处理，已有 `finished` 标志守卫，但 `finished = true` 在 `close()` 内设置，存在时序竞争。  
**影响**：主动 close 后若 onerror 在 `finished` 设置前触发，仍会执行 `onError` 回调。

### F-P1-2：switchConversation 中 getMemory 失败时无错误处理

**检查**：`useChat.switchConversation` 中 `getMemory(cid)` 为纯 `await` 调用，无 try/catch。  
**影响**：接口失败时 Promise rejection 冒泡到未处理状态，messages 不更新，用户看到空白但无提示。

---

## P2 规则（建议优化）

### B-P2-1：设置缓存 `_defaultCache` 为模块级变量，测试隔离困难

`settings.ts` 中 `_defaultCache` 在进程生命周期内只加载一次，单元测试无法重置。建议提供 `resetSettingsCache()` 导出或改为参数注入。

### B-P2-2：lockedWrite 的 Map 在高并发下可能轻微内存增长

`writeLocks` 仅在 `writeLocks.get(filePath) === current` 时才 `delete`，若有多个写操作排队，Map 条目在前一个释放时已被覆盖，符合预期。但长期运行若文件路径持续增加（新用户），Map 不会主动 GC。**低优先级，监控即可。**

### B-P2-3：Observation 块格式硬编码于 react-core.ts

```typescript
const observationBlock = "\n\n> **Observation（" + tc.function.name + "）**\n> " + ...
```
格式与展示层耦合。若将来需要调整 Observation 的渲染方式，需修改核心循环逻辑。建议提取为常量或格式化函数。

### B-P2-4：`toStandardMessages` 中 cardType === 3 的过滤缺少注释

```typescript
if (msg.cardType === 3) continue; // 忽略 Error 卡片
```
已有注释，但 `3` 为魔法数字，建议改为 `msg.cardType === CardType.Error`。

### B-P2-5：前端 `http.ts` 中 GET 请求 uid 固定追加，POST 通过展开对象注入

两种方式不统一，且 `body` 类型断言 `as object` 不安全。

### F-P2-1：MessageCard 中 cardType 字段命名与后端 ChatMessage 的 cardType 含义不同

前端 `MessageCard.cardType` 是渲染类型，后端 `ChatMessage.cardType` 是存储类型，数值相同但语义独立。两处均无注释说明关系，后续维护容易混淆。

### F-P2-2：useChat 中 `loadConversationList` 在每次 onDone 时触发

每次对话结束都刷新完整会话列表（含所有文件读取），会话数量多时有不必要的开销。可改为仅在会话新建时刷新，或后端返回增量信息。

---

## 豁免规则（用户确认永久跳过）

| 规则 ID | 规则描述 | 豁免原因 | 豁免日期 |
|---------|---------|---------|---------|
| （暂无）| | | |

<!-- updated: 初始版本 2026-05-31 -->
