# ai-commit 示例

## 示例 1：组件与页面分组

**暂存**：

- `src/components/SearchCard/index.tsx`（新增卡片组件）
- `src/pages/SearchResult/index.tsx`（引用新组件）
- `src/stores/searchStore.ts`（新增 search state）

**计划**：

| 组 | Message |
|----|---------|
| g1 | `feat(stores): 新增 search 状态管理` |
| g2 | `feat(components): 新增 SearchCard 卡片组件` |
| g3 | `feat(pages): 搜索结果页接入 SearchCard` |

用户 **全部确认** → 三次 `git commit -- <paths>`（不 reset，其余文件保持 staged）。

---

## 示例 2：配置与代码分离

**暂存**：`tsconfig.json` + `src/api/chat.ts`

**维度**：用户说「配置和代码分开」→ `by-change-kind`

| 组 | Message |
|----|---------|
| g1 | `chore: 调整 tsconfig 路径别名` |
| g2 | `feat(api): 新增 chat 接口封装` |

---

## 示例 3：修改计划

展示 3 组后用户选 **修改** → **合并 g1 与 g2** → 重新展示 2 组 → **全部确认**。

---

## 示例 4：取消

用户选 **取消** → 不执行任何 `git commit`，暂存区保持不变。

---

## 示例 5：排除秘密文件

暂存含 `.env.local`（误 add）：

- warnings：`.env.local` 已排除
- 其余文件正常分组；提醒用户 `git restore --staged .env.local`

---

## AskQuestion 层 A 示例文案

**问题**：是否按上述计划提交（共 2 组）？

**选项**：

- 全部确认并提交
- 取消
- 修改计划
