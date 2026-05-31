# 前端开发约定

## 状态管理

整个前端**无全局状态库**（无 Redux/Zustand/Jotai），完全基于 React 原生机制：

| 机制 | 用途 |
|------|------|
| `useState` | 组件/页面级状态（消息列表、loading、面板开关等） |
| `useRef` | 跨渲染持久化引用（SSE 连接 `sseRef`、DOM 引用） |
| `localStorage` | 跨会话持久化（uid、conversationId、agentMode） |

`useChat.ts` 是唯一的核心状态 Hook，统一管理消息流、会话切换、SSE 生命周期。**不要在子组件中维护与 `useChat` 重叠的状态。**

## API 调用

所有后端请求通过 `src/fe/apis/` 下的函数，**不在组件中直接 `fetch`**：

```typescript
// 正确：从 apis/ 导入
import { fetchConversations } from '@/fe/apis/conversations'

// 错误：组件内直接 fetch
fetch('/api/conversations').then(...)
```

`httpRequest`（`src/fe/lib/http.ts`）自动注入 `x-uid` header，所有 API 函数基于它封装。

## SSE 连接

Chat 页面通过 `chatSseClient.ts` 的 `connectChatSse` 建立连接：

```typescript
const sse = connectChatSse({
  params,                        // query 参数（conversationId、mode 等）
  onToken(cardType, content) {}, // 每个 delta token 回调
  onDone() {},                   // 流结束回调
  onError(msg) {},               // 错误回调
})
// 中止
sse.abort()
```

SSE 连接引用存在 `useRef`（`sseRef`），在组件 unmount 或新请求发送前 abort 旧连接。

## 消息渲染（CardType 分发）

`MessageItem.tsx` 根据 `card.type`（`CardType`）选择渲染组件：

| CardType | 渲染组件 | 用途 |
|----------|---------|------|
| 1 Markdown | `<MarkdownCard>` | 最终回答（流式追加） |
| 2 Cot | `<CotCard>` | 思考过程（可折叠） |
| 3 Error | `<ErrorCard>` | 错误信息 |
| 4 Image | `<ImageCard>` | 图片展示 |
| 5 Divider | `<DividerCard>` | 步骤分割线 |

新增 CardType 必须：
1. 在 `src/fe/lib/chatSseClient.ts` 的 `CardType` enum 添加值
2. 在 `MessageItem.tsx` 的 switch/条件中添加分支
3. 在 `src/fe/cards/` 下新建对应 Card 组件

## 新增页面

本工程目前为单页应用（`src/app/page.tsx` → `<Chat />`）。若需新增页面：

1. 在 `src/app/<route>/page.tsx` 创建路由文件
2. 在 `src/fe/pages/<PageName>/` 下组织页面组件和 Hook
3. 页面容器使用 `'use client'` 指令（App Router 默认 Server Component）

## 组件约定

- 所有客户端交互组件顶部声明 `'use client'`
- 组件文件名与导出名一致（PascalCase）
- 通用 UI 组件放 `src/fe/components/`，页面专属组件放对应页面目录
- 图标统一使用 `src/fe/assets/icons/` 下的 SVG React 组件，不引入外部图标库

## CSS / 样式

- 全局使用 **Tailwind CSS v4**（PostCSS 插件模式）
- 不引入其他 CSS 框架或组件库
- 需要 CSS Modules 时文件命名为 `*.module.css`

## uid 管理

`uid`（用户身份）和 `conversationId` 由 `src/fe/lib/uid.ts` 管理，存储在 `localStorage`：

```typescript
import { getOrCreateUid, getConversationId, setConversationId } from '@/fe/lib/uid'
```

API 请求自动注入 `x-uid` header，后端从 header 读取，**不通过请求 body 传递 uid**。
