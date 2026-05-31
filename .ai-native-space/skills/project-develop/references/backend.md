# 后端开发约定

## LLM 调用

所有 LLM 调用通过 `src/be/lib/text-llm.ts` 的三个函数，**不直接使用 OpenAI SDK**：

```typescript
// 一次性返回完整内容
chat(messages, options?): Promise<string>

// 流式返回，每个 token 触发 onToken 回调
chatStream(messages, onToken, options?): Promise<void>

// 单次 prompt（无历史），返回完整内容
prompt(systemPrompt, userPrompt, options?): Promise<string>
```

`options` 可覆盖 `temperature`、`model`、`maxTokens`。低温调用（如 Audit 阶段）显式传 `{ temperature: 0.2 }`。

## ModeRunner 实现

### 接口定义（`src/be/engine/runners/type.ts`）

```typescript
interface ModeRunner {
  execute(ctx: RunnerContext): Promise<void>
}

interface RunnerContext {
  messages: CoreMessage[]   // 已构建好的上下文消息
  settings: AppSettings
  emitter: SseEmitter       // 发送 SSE token 的方法
  signal: AbortSignal
  tools: Tool[]
}
```

### 新增 Runner 步骤

1. 在 `src/be/engine/runners/<name>/index.ts` 实现 `ModeRunner` 接口
2. 在 `src/be/engine/runners/index.ts` 的 `modeRunners` Map 中注册：
   ```typescript
   modeRunners.set('my-mode', new MyModeRunner())
   ```
3. 在 `src/be/engine/intent/resolver.ts` 的意图路由矩阵中添加路由规则
4. 在 `src/be/config/settings.ts` 的 `AgentMode` 类型中添加枚举值（若需要手动选择）

### ReAct Core 复用

工具调用循环统一复用 `src/be/engine/runners/common/react-core.ts` 的 `runReActLoop`：

```typescript
runReActLoop(ctx, {
  systemPrompt?,      // 追加的 system 消息
  mutable?,           // true = 直接操作 ctx.messages（Reflection 使用）
  outputCardType?,    // 最终输出的 CardType（默认 Markdown）
})
```

**不要**在各 Runner 中重复实现工具调用循环。

### Token 预算

`react-core.ts` 内置 token 预算保护：累计消耗 `>32000 tokens` 后优雅退出（输出截断提示）。Runner 自身不需要额外的 token 计数逻辑。

## 工具（Tool）

### 接口定义（`src/be/engine/tools/index.ts`）

```typescript
interface Tool {
  name: string
  description: string
  parameters: JSONSchema
  execute(args: unknown, signal: AbortSignal): Promise<string>
}
```

### 新增内置工具步骤

1. 在 `src/be/engine/tools/<toolName>.ts` 实现 `Tool` 接口
2. 在 `src/be/engine/tools/index.ts` 的 `getToolRegistry` 中加入：
   ```typescript
   const staticTools = [imageGenerateTool, webSearchTool, myNewTool]
   ```

### MCP 工具命名规范

MCP 工具名统一为 `mcp__<serverName>__<toolName>`，由 `adapter.ts` 自动生成，**不要手动构造**。

## 文件持久化

### lockedWrite（必须使用）

所有写文件操作必须通过 `lockedWrite`，**禁止直接调用 `fs.writeFile`**：

```typescript
import { lockedWrite } from '@/be/session'
await lockedWrite(filePath, JSON.stringify(data, null, 2))
```

`lockedWrite` 内部维护每个文件路径的 Promise 队列，确保同一文件的写操作顺序执行，防止并发覆写。

### 路径常量

所有数据目录路径从 `src/be/config/paths.ts` 导入，不硬编码字符串路径：

```typescript
import { DATA_DIR, SESSIONS_DIR, MCP_CONFIG_FILE } from '@/be/config/paths'
```

### 会话数据结构（`src/be/session/index.ts`）

```typescript
interface ConversationData {
  id: string
  title: string
  messages: ChatMessage[]
  memories: MemoryItem[]
  summaryAnchor: number          // 已摘要到的消息索引
  mindCardsUpdatedAt?: number    // 心智卡片最后更新时间戳
}
```

## SSE 发送

Runner 通过 `ctx.emitter` 发送 token，**不直接操作 ReadableStream**：

```typescript
// 发送文本 token（追加到当前 card）
ctx.emitter.token(CardType.Markdown, deltaText)

// 发送新卡片开始（分割线等）
ctx.emitter.card(CardType.Divider, '')
```

## AbortController 注册

需要可中止的长时异步操作，通过 `abortRegistry` 注册：

```typescript
import { abortRegistry } from '@/be/services/abortRegistry'
const controller = new AbortController()
abortRegistry.register(uid, conversationId, controller)
// 操作完成后取消注册
abortRegistry.unregister(uid, conversationId)
```

## API Route 约定

每个 Route Handler 文件顶部必须声明：

```typescript
export const runtime = 'nodejs'
```

Next.js 默认某些路由走 Edge runtime，但本工程所有后端逻辑依赖 Node.js API（fs、child_process 等），必须强制指定。

## Skill 系统开发

### SkillDefinition（`src/be/engine/skills/types.ts`）

```typescript
interface SkillDefinition {
  id: string            // 目录名
  name: string          // frontmatter name
  description: string   // frontmatter description
  command?: string      // frontmatter command（触发前缀，如 /hello）
  template: string      // SKILL.md 正文（Prompt 模板）
  asTool?: boolean      // true = 同时注册为 LLM Tool
  dirPath: string       // Skill 目录绝对路径
}
```

### 变量替换

Skill 模板中可使用：
- `$ARGUMENTS`：`/command` 后的用户输入文本
- `$SKILL_DIR`：Skill 目录的绝对路径（用于引用 Skill 内的文件）

### Skill 目录优先级

1. `.swlws/skills/`（用户 Skill，可覆盖内置）
2. `.swlws-builtin/skills/`（内置 Skill）

同名 Skill 用户优先级高于内置。
