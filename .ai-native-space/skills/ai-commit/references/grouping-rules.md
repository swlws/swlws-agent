# 分组规则

## 默认预设：`by-module`

按 **scope（路径模块）** 聚类；同 scope 内文件归一组。

## 预设一览

| id | 名称 | 规则 |
|----|------|------|
| `by-module` | 业务/目录模块 | scope 相同 → 同组（**默认**） |
| `by-change-kind` | 变更性质 | 先分 config / docs / test / code 四桶，再按 scope |
| `by-layer` | 分层 | 按 pages / components / stores / api / styles 分层 |
| `single` | 单次提交 | 全部 staged → 1 组 |
| `atomic` | 原子 | 每组 1 文件（调试用） |

用户说法映射示例：

- 「配置和代码分开」→ `by-change-kind`
- 「全部一次提交」→ `single`
- 「每个文件单独」→ `atomic`
- 「按页面分」→ `by-module`，以 pages 子目录为 scope

## 默认优先级（`by-module` 时）

1. **用户指定维度**（覆盖默认）
2. **敏感路径** → 排除，不进组
3. **config 隔离**：纯配置且与代码无同文件耦合 → 独立组
4. **docs 隔离**：纯文档变更 → 独立组（可与同 scope 的 feat 分开，若仅 md）
5. **路径聚类**：相同 scope → 同组
6. **类型拆分**（可选）：同 scope 内 feat 与 fix 可拆两组；默认合并若总规模小
7. **大小兜底**：>15 文件或 >500 行增删 → 建议拆组

## 标签（tags）

为每个文件打标签，供分桶：

| tag | 条件 |
|-----|------|
| `config` | `*.config.*`、`tsconfig*`、`package*`、`.claude`、CI 配置 |
| `docs` | `*.md` 为主 |
| `test` | 测试路径（`__tests__`、`*.test.*`、`*.spec.*`） |
| `style` | `*.scss`、`*.css`、`*.less`、`*.module.scss` |
| `code` | 其余源码（`*.tsx`、`*.ts`、`*.js`、`*.py` 等） |

## CommitPlan 结构

```yaml
groups:
  - id: g1
    files: ["path/a", "path/b"]
    type: feat
    scope: components
    message: "feat(components): 新增搜索结果卡片组件"
    rationale: "同一 components 模块的新增 UI"
warnings: []
total_groups: 1
```

## 执行顺序

多组 commit 顺序：

`config` / `chore` → `refactor` → `feat` → `fix` → `style` → `docs` / `test`

## Phase 5 执行方式

每组一条命令，**只提交本组路径上已暂存的内容**：

```bash
git commit -m "$(cat <<'EOF'
特性(scope): desc
EOF
)" -- path/a path/b
```

| 做法 | 是否允许 |
|------|----------|
| `git commit -- <本组文件>` | ✅ 默认 |
| `git reset` + `git add` + `git commit` | ❌ 破坏分块暂存、易混入未暂存改动 |
