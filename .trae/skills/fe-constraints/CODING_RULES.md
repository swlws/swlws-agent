# 编码规则 (Coding Rules)

本文件定义了前端开发的具体编码准则。

## 1. 导出规范
- 优先使用**具名导出 (Named Exports)**，避免默认导出 (Default Exports)。
- `export function MyComponent() { ... }`

## 2. 状态管理
- **状态下移**: 高频更新（如输入框）的状态应保留在最接近的子组件中。
- **逻辑提取**: 超过 50 行的业务逻辑应考虑提取到自定义 Hook。

## 3. 样式处理
- 统一使用 **Tailwind CSS**。
- 避免在组件中编写内联 `style` 对象（除非是动态计算的值）。

## 4. TypeScript 规范
- 严禁使用 `any`，除非是在 `ReactMarkdown` 的 `components` 等极少数第三方库强制要求的场景下，并需附带 `eslint-disable` 注释。
- 优先定义 `interface` 而非 `type` 用于 Props。
