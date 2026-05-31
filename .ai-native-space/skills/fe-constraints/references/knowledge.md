# 前端工程知识库 (FE Knowledge Base)

本文件记录了工程的文件架构和核心设计模式。

## 目录结构规范

- **`src/fe/assets/icons`**: 存放原始 SVG 图标组件。
- **`src/fe/components`**: 存放通用的原子组件（如 `Button`, `Dialog`）。
- **`src/fe/components/icons`**: 统一导出图标，命名约定为 `XxxIcon`。
- **`src/fe/lib`**: 存放基础库和客户端（如 `http.ts`, `chatSseClient.ts`）。
- **`src/fe/apis`**: 对业务接口的函数封装，统一使用 `httpRequest`。
- **`src/fe/pages/<Feature>`**: 存放具体功能页面的组件和 Hook（如 `index.tsx`, `useChat.ts`）。

## 核心设计模式

1. **API 层抽象**: 通过 `src/fe/lib/http.ts` 封装基础请求，业务逻辑通过 `src/fe/apis` 调用，确保 UID 注入和错误处理一致性。
2. **状态与逻辑分离**: 复杂的 UI 逻辑通过自定义 Hooks (如 `useChat.ts`) 管理，保持组件层的纯粹。
3. **图标中心化**: 所有图标通过 `@/fe/components/icons` 统一出口，方便维护和替换。
