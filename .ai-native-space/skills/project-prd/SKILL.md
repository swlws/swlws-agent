---
name: project-prd
description: 对 swlws-agent 工程的 PRD 文档执行完整性检查 + 风险评估，通过后生成 TRD（技术需求文档），持久化到 .ai-native-tmp/trd/。在用户提到 PRD 评审、需求评审、生成 TRD、review PRD、@prd 时使用。
---

# project-prd：PRD 评审 → TRD 生成

读取 PRD Markdown 文件，执行两阶段评审（完整性检查 → 风险评估），评审通过后生成包含工程任务拆解、影响分析、工作量评估、技术方案设计的 TRD，持久化到 `.ai-native-tmp/trd/`。

## 主流程

```
Phase 0 读取 PRD    → 解析 PRD 文件，识别文档结构
Phase 1 完整性检查  → 按 [references/completeness.md](references/completeness.md) 逐项核对
Phase 2 风险评估    → 按 [references/risks.md](references/risks.md) 分析技术风险
Phase 3 评审结论    → 汇总问题，AskQuestion 决策：继续/修改后继续/终止
Phase 4 生成 TRD    → 按 [references/trd-template.md](references/trd-template.md) 输出
Phase 5 持久化      → 写入 .ai-native-tmp/trd/<PRD文件名>.md
Phase 6 自我进化    → 评审中发现未覆盖的新模式，询问用户后更新规则
```

## 参考文档

| 主题                         | 文件                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| PRD 完整性检查清单           | [references/completeness.md](references/completeness.md)                                       |
| 技术风险评估规则             | [references/risks.md](references/risks.md)                                                     |
| TRD 模板与填写规范           | [references/trd-template.md](references/trd-template.md)                                       |
| 工程架构（评估影响分析依据） | [../project-develop/references/architecture.md](../project-develop/references/architecture.md) |

---

## Phase 0 — 读取 PRD

1. 用户提供 PRD 文件路径，使用 Read 工具读取完整内容
2. 识别文档包含的结构章节：需求背景与范围 / 功能说明 / 技术指标与接口 / 验收标准
3. 缺少某章节时标记为「缺失」，不直接报错（留到 Phase 1 处理）

---

## Phase 1 — 完整性检查

按 [references/completeness.md](references/completeness.md) 逐项核对，输出格式：

```markdown
## 完整性检查结果

✅ 通过（N 项）
❌ 缺失/不合格（N 项）：

- [C-1] 需求背景章节缺少「不做什么」边界说明
- [C-4] 功能说明中「状态 A → 状态 B」流程无异常路径描述
- [C-9] 验收标准未提供可量化的测试 case
```

**通过标准**：❌ 项为 0，或全部为「建议」级（非「必须」级）。  
不通过时进入 Phase 3 决策，**不自动生成 TRD**。

---

## Phase 2 — 风险评估

按 [references/risks.md](references/risks.md) 分析，输出格式：

```markdown
## 风险评估结果

🔴 高风险（N 项）：

- [R-2] 新增 ModeRunner 需修改意图路由矩阵，现有 Runner 路由优先级可能受影响
- [R-5] 并发场景未描述 AbortController 处理策略，可能与 abortRegistry 冲突

🟡 中风险（N 项）：

- [R-7] 新增 CardType 需前后端两处同步，PRD 未提及前端渲染方案

🟢 低风险/建议（N 项）：

- [R-11] 配置新增字段建议同步更新 SettingsPanel UI，PRD 未提及
```

---

## Phase 3 — 评审结论与决策

汇总 Phase 1 + Phase 2 结果，**必须用 AskUserQuestion** 询问：

**完整性通过、无高风险时**：

| 选项     | 行为         |
| -------- | ------------ |
| 生成 TRD | 进入 Phase 4 |
| 取消     | 零副作用结束 |

**有完整性问题或高风险时**：

| 选项                                      | 行为                                 |
| ----------------------------------------- | ------------------------------------ |
| 先修改 PRD，修改后重新运行                | 结束，等用户更新后重跑               |
| 忽略问题直接生成 TRD（问题附在 TRD 开头） | 进入 Phase 4，TRD 首页附评审问题清单 |
| 取消                                      | 零副作用结束                         |

---

## Phase 4 — 生成 TRD

按 [references/trd-template.md](references/trd-template.md) 生成，核心章节：

1. **评审摘要**（若有问题，列在此处）
2. **需求理解**（一句话重述功能目标，确认对齐）
3. **工程任务拆解**（细化到具体文件/模块/接口）
4. **现有模块影响分析**（对照工程架构，标出改动点）
5. **技术方案设计**（关键决策与方案选型，含备选方案）
6. **工作量评估**（每项任务：S/M/L/XL，含说明）
7. **风险与注意事项**（来自 Phase 2 评估结果）
8. **验收核对表**（可执行的 checklist，供开发自测与代码审查使用）

---

## Phase 5 — 持久化

- 路径：`.ai-native-tmp/trd/<PRD文件名（去掉路径和扩展名）>.md`
- `.ai-native-tmp/` 不纳入版本控制
- 文件头写入生成时间戳：`> 生成时间：<YYYY-MM-DD HH:mm>`

---

## Phase 6 — 自我进化机制

评审过程中，若遇到以下情况，**必须暂停并用 AskUserQuestion 询问**：

1. PRD 中出现 completeness.md / risks.md **未覆盖的新模式**（如新的 AI 功能结构、新的接口约定）
2. 某条现有规则与当前 PRD 的实际情况明显不匹配
3. 用户对某条评审结论表示「不适用」或「不需要检查」

**询问模板**：

> 我发现一个新模式：`[简短描述]`。是否将其添加到 references/[completeness.md 或 risks.md]？

用户确认后，立即追加到对应 reference 文件末尾，并注明 `<!-- updated: [日期] -->`。
