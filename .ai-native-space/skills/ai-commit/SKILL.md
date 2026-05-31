---
name: ai-commit
description: 分析 git 暂存区变更，按模块/类型分组生成「特性(scope): desc」提交信息，经用户 AskQuestion 确认后执行分组 commit。在用户提到 ai-commit、分组提交、提交暂存区、按模块提交、@ai-commit 时使用。
---

# ai-commit：分组提交暂存区变更

对 **已暂存（staged）** 变更做分析、分组、生成 commit message，**用户确认后才执行** `git commit`。不自动 `git add`、不 push。

## 硬性约束

- **仅处理 staged**；暂存区为空则提示 `git add` 后结束
- **未获用户确认前不得** 执行任何 `git commit`
- **禁止**：改 `git config`；`--no-verify` / `--no-gpg-sign`；force push / hard reset（除非用户明确要求）
- **秘密文件**（`.env`、`*credentials*`、`*.pem`、`id_rsa` 等）默认排除并警告，不得提交
- commit message 必须用 **HEREDOC** 传入
- Phase 5 **禁止** `git reset` / `git restore --staged .`；分组提交用 `git commit -- <pathspec>`（见 Phase 5）
- hook 失败：**不要 amend**，修问题后重新走计划或新建 commit

## 工作流

```
Phase 0 前置检查 → Phase 1 采集 → Phase 1.5 代码审查（project-code-review）
→ Phase 2 分组与文案 → Phase 3 展示计划 → Phase 4 AskQuestion 确认
→ Phase 5 执行 → Phase 6 摘要
```

### Phase 0 — 前置检查

1. `git rev-parse --is-inside-work-tree`
2. `git diff --cached --quiet` → 空则停止
3. 扫描敏感路径（见 [references/commit-types.md](references/commit-types.md)）
4. `git log -5 --oneline` 对齐仓库提交语气（中/英 desc）

### Phase 1 — 采集（并行）

```bash
git status --porcelain=v1
git diff --cached --stat
git diff --cached
git diff --cached --name-only
```

可选：运行 `scripts/analyze-staged.sh` 得 JSON；`scripts/suggest-groups.py` 得分组建议（Agent 可覆盖）。

### Phase 1.5 — 代码审查（project-code-review）

**仅当 staged 文件包含 `src/` 下的 `.ts` / `.tsx` 文件时执行。**

调用 [project-code-review](../project-code-review/SKILL.md)，依次执行：

- **规范审查**：[规范审查清单](../project-code-review/SKILL.md#规范审查清单)
- **业务语义审查**：[P0/P1/P2 规则](../project-code-review/references/rules.md)

审查结果在 Phase 3 中紧跟提交计划输出，并写入 `.ai-native-tmp/cr/<YYYY-MM-DD>.md`；Phase 4 选项依据最高优先级联动：

- **P0** → 禁止提交，只能「修复后重新运行」或「取消」
- **P1** → 增加「忽略 P1 直接提交」，默认推荐「先修复」
- 仅 **P2 / 规范问题** → 正常提交，问题附在 commit body 末尾

### Phase 2 — 分组与 message

1. 解析每个 staged 文件为 ChangeUnit（path、status、diff 规模、tags）
2. 按 [references/grouping-rules.md](references/grouping-rules.md) 默认 **`by-module`** 分组；用户指定维度时切换预设
3. 为每组生成：`特性(scope): desc`（规则见 [references/commit-types.md](references/commit-types.md)）
4. 输出 **CommitPlan**（组 id、files、message、rationale、warnings）

**拆分阈值**（建议）：单组 >15 文件或 >500 行增删 → 建议拆组并说明。

**提交顺序**（多组时）：`config`/`chore` → `refactor` → `feat` → `fix` → `docs`/`test`

### Phase 3 — 展示计划

固定模板，便于扫读：

```markdown
## 提交计划（共 N 组）

### 组 1/N — feat(scope)

- **文件**：`path/a`, `path/b`
- **说明**：一句话 rationale
- **Message**：`feat(scope): 描述`
```

### Phase 4 — 交互确认（必须用 AskQuestion）

**层 A 选项**：

| 标签           | 行为         |
| -------------- | ------------ |
| 全部确认并提交 | 进入 Phase 5 |
| 取消           | 零副作用结束 |
| 修改计划       | 进入层 B     |

**层 B — 修改计划**（用户选「修改计划」时）：合并组、拆组、改 message、换分组维度、从计划剔除文件（保留 staged）、`back` 回层 A。

**层 C — 逐组确认**（仅当用户要求「逐条确认」）：每组 commit 前再问确认/跳过/改 message/中止。

**禁止**在未完成 Phase 4 的情况下执行 commit。

### Phase 5 — 执行

对每组 **顺序** 执行（**禁止** `git reset` / `git restore --staged .` 清空暂存区）：

```bash
git commit -m "$(cat <<'EOF'
特性(scope): desc

可选正文：说明动机或影响范围（多文件/非显而易见时加）

EOF
)" -- <本组文件...>
```

`git commit -- <pathspec>` 只提交**这些路径上已暂存**的改动，其余 staged 文件保持暂存，无需 reset。

每组后记录：`git log -1 --oneline`。

### Phase 6 — 收尾

- `git status`：是否仍有 staged / 未暂存变更
- 表格汇总：组号、hash、message、文件数
- 列出被 exclude 仍留在暂存区的文件

## 提交格式

```text
特性(scope): desc
```

- **特性**：`feat` `fix` `bugfix` `refactor` `docs` `doc` `test` `chore` `style` `perf` `build` `ci` `types`
- **scope**：英文纯小写字母 `[a-z]+`，**不含连字符、数字或其他符号**；跨模块用 `multi`；可省略
  - 转换规则：去掉所有 `-` 和数字，全小写 → `ai-commit` → `aicommit`
  - 优先使用路径约定推导 scope，未覆盖路径再按转换规则推导
- **括号**：圆括号 `(scope)`，**不是方括号** `[scope]`
- **desc**：中文或英文均可；祈使句；避免「更新文件」类空话；**优先使用中文**；不含双引号

## 参考

- 特性与 scope 推断：[references/commit-types.md](references/commit-types.md)
- 分组维度与预设：[references/grouping-rules.md](references/grouping-rules.md)
- 场景示例：[references/examples.md](references/examples.md)

## 脚本（可选）

```bash
bash scripts/analyze-staged.sh          # stdout: JSON
python3 scripts/suggest-groups.py       # stdin: analyze JSON, stdout: groups JSON
```

脚本输出为建议；最终计划以 Agent 分析 + 用户确认为准。
