# 数据流与 SSE 协议

## 完整请求链路

```
用户输入（InputBar）
  → useChat.sendText()
  → connectChatSse({ params, onToken, onDone, onError })
  → EventSource GET /api/chat?uid=&conversationId=&text=&mode=&deepThink=
  → app/api/chat/route.ts
  → createChatSseResponse(params)
  → chatSseService.ts → QueryEngine.run(ctx)
      ├─ loadSettings(uid)                      // 三级配置合并
      ├─ loadOrCreateConversation(uid, convId)  // 读文件系统
      ├─ buildContextMessages(conv, text)       // 记忆 + 近8条 + 当前输入
      ├─ applyDeepThinkPolicyPrompt(messages)   // 注入深度思考 system 消息
      ├─ skillManager.match(text)
      │     命中 → executeSkill() → chatStream() → emitter.token()
      └─ IntentParser.parse(text, settings)
            → resolveRunner(tags) → ModeRunner.execute(ctx)
                → emitter.token(cardType, delta) × N
                → emitter.done()
  → onDone()
  → _saveConversationState()   // 追加消息、trim、maybeUpdateSummary
  → _updateGlobalKnowledge()   // refreshMindCards（超 TTL 才触发）
```

## SSE 事件格式

### 后端推送（`chatSseService.ts`）

```
data: {"type":"token","cardType":1,"content":"hello"}\n\n
data: {"type":"token","cardType":2,"content":"思考中..."}\n\n
data: [DONE]\n\n
data: {"type":"error","content":"错误描述"}\n\n
```

### CardType 数值

| 值 | 名称 | 含义 |
|----|------|------|
| 1 | Markdown | 最终回答（Markdown 格式） |
| 2 | Cot | 思考过程（Chain-of-Thought） |
| 3 | Error | 错误信息 |
| 4 | Image | 图片 URL |
| 5 | Divider | 步骤分割线 |

### 前端解析（`chatSseClient.ts`）

```typescript
onToken(cardType: CardType, content: string): void
// useChat 根据 cardType 将 content 追加到对应 MessageCard
```

### 新增 CardType 的完整流程

1. 后端 `src/be/engine/runners/type.ts` → `CardType` const enum 添加值
2. 前端 `src/fe/lib/chatSseClient.ts` → `CardType` const enum 添加相同值
3. 前端 `src/fe/pages/Chat/MessageItem.tsx` → switch 添加渲染分支
4. 前端 `src/fe/cards/` → 新建 `<name>-card/` 目录和渲染组件

## 中止（Abort）流程

```
用户点击停止
  → useChat.abort()
  → POST /api/chat/abort?uid=&conversationId=
  → abortRegistry.get(uid, conversationId).abort()
  → SSE 流中断，各 Runner 通过 signal.aborted 检测后优雅退出
  → 前端 sseRef.current.abort()（同时关闭 EventSource）
```

## 会话保存时机

QueryEngine 在每次请求完成后（无论成功/中止/错误）调用 `_saveConversationState()`：

1. 追加用户消息和助手消息到 `conv.messages`
2. 若超出 `maxMessagesCount`，按完整轮次裁剪（保留整对 user+assistant）
3. 若新增消息数超过 `summaryTriggerCount`，触发 `maybeUpdateSummary()`（异步，不阻塞响应）

## 记忆注入顺序（buildContextMessages）

```
system: "你是 AI Agent..."
system: [memories 结构化记忆，若存在]
assistant: [摘要文本，若存在]
...最近 8 条历史消息...
user: 当前输入
```

`maxContextMessages`（默认 8）控制注入的历史消息数，超出部分依赖摘要覆盖。
