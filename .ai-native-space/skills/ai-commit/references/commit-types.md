# 提交类型与 scope 推断

## Message 格式

```text
特性(scope): desc
```

| 字段 | 规则 |
|------|------|
| 特性 | 见下表，一组选一个主类型 |
| scope | 纯小写字母 `[a-z]+`，**无连字符/数字**；可省略 |
| desc | 中文或英文均可，**优先中文**；≤50 字；**不含双引号** |

**括号用圆括号 `()`，不是方括号 `[]`。**

## 特性（type）

| 特性 | 何时用 | 路径/ diff 信号 |
|------|--------|-----------------|
| `feat` | 新功能、新能力 | 新业务代码、新 API、新组件、新页面 |
| `fix` / `bugfix` | 修 bug、修错漏 | 修逻辑、修样式 bug、修接口错误 |
| `refactor` | 行为不变的重构 | 重命名、抽函数、挪文件无行为变 |
| `docs` / `doc` | 文档为主 | `*.md`、`README`、注释占主导 |
| `test` | 测试 | `*test*`、`*spec*`、`__tests__` |
| `chore` | 配置、杂项、工具链 | 脚本、lockfile、`.json`、`.claude`、CI |
| `style` | 纯格式/样式 | 仅空白/格式化/CSS 变量，无逻辑变化 |
| `perf` | 性能优化 | 缓存、懒加载、减少渲染 |
| `build` / `ci` | 构建/流水线 | webpack、CI yaml |
| `types` | 类型声明 | `*.d.ts`、interface/type 独立变更 |

混合意图：**拆组**优先；若用户要求合并，选占比最大的 type。

## scope 推断

优先级：

1. 用户口头指定
2. 路径约定（scope 均为纯小写字母）：
   - `src/api/` / `api/` → `api`
   - `src/components/` / `components/` → `components`
   - `src/pages/` / `pages/` → `pages`
   - `src/stores/` / `stores/` → `stores`
   - `src/hooks/` / `hooks/` → `hooks`
   - `src/services/` / `services/` → `services`
   - `src/styles/` / `styles/` → `styles`
   - `src/utils/` / `utils/` → `utils`
   - `src/types/` / `types/` → `types`
   - `.claude/` → `claude`
   - `public/` → `public`
   - 根目录配置文件（`*.config.*`、`tsconfig*`、`package*`）→ 省略 scope
3. skill 目录名去连字符/数字后的纯字母：`ai-commit` → `aicommit`
4. 多根目录无共同父级 → `multi`

## 敏感路径（默认排除）

匹配即 **warning + 不纳入任何组**：

```
.env
.env.*
*credentials*
*secret*
*.pem
*.key
id_rsa
*.p12
```

`*.env.example`、文档中的占位符可提交，但需在计划中标注。

## 正文（body）何时加

- 单组 ≥3 个文件，或改动非显而易见
- 空一行后写 1–3 句：动机、影响范围、Breaking 说明

Subject 仍保持一行 `特性(scope): desc`。
