# 类型系统

## 核心类型分布

| 类型 | 定义位置 | 共享方式 |
|------|---------|---------|
| `CardType` | 后端 `src/be/engine/runners/type.ts`、前端 `src/fe/lib/chatSseClient.ts` | 各自定义同值的 `const enum`，通过 SSE 数字值传递 |
| `AppSettings` / `AgentMode` | `src/be/config/settings.ts` | 前端 `src/fe/apis/settings.ts` 直接 re-export |
| `ConversationData` / `ChatMessage` / `MindCard` | `src/be/session/index.ts` | 仅后端使用 |
| `ModeRunner` / `RunnerContext` / `AuditResult` | `src/be/engine/runners/type.ts` | 仅后端使用 |
| `ChatMessage`（前端）/ `MessageCard` | `src/fe/lib/chatSseClient.ts` | 仅前端使用 |
| `Tool` / `ToolRegistry` | `src/be/engine/tools/index.ts` | 仅后端使用 |
| `SkillDefinition` / `SkillMeta` | `src/be/engine/skills/types.ts` | 仅后端使用 |

## CardType 同名不同实体

**后端**（`src/be/engine/runners/type.ts`）：用于 Runner 推送 SSE token 时标记 card 类型。

**前端**（`src/fe/lib/chatSseClient.ts`）：用于解析 SSE token 并路由到对应渲染组件。

两者数值必须保持一致。**新增 CardType 时必须同步修改两处。**

```typescript
// 当前值（两处相同）
const enum CardType {
  Markdown = 1,
  Cot      = 2,
  Error    = 3,
  Image    = 4,
  Divider  = 5,
}
```

## 前端消息数据模型

```typescript
// useChat 内存中的消息结构
interface ChatMessage {
  role: 'user' | 'assistant'
  content: string         // user 消息的文本内容
  cards?: MessageCard[]   // assistant 消息的多张卡片
}

interface MessageCard {
  type: CardType
  content: string         // 流式追加中逐渐增长
}
```

## 后端会话数据模型

```typescript
// 持久化到 .swlws/sessions/user/<uid>/conversation/<id>.json
interface ConversationData {
  id: string
  title: string
  messages: ChatMessage[]         // { role, content, cardType? }
  memories: MemoryItem[]          // 结构化长期记忆
  summaryAnchor: number           // 已摘要到的消息索引游标
  mindCardsUpdatedAt?: number     // 心智卡片上次更新时间戳（ms）
}

interface MemoryItem {
  type: 'context' | 'preference' | 'decision' | 'fact'
  content: string
}
```

## 路径别名

`tsconfig.json` 配置 `@/*` → `./src/*`，所有跨目录导入使用别名：

```typescript
// 正确
import { lockedWrite } from '@/be/session'
import { CardType } from '@/fe/lib/chatSseClient'

// 错误
import { lockedWrite } from '../../../be/session'
```
