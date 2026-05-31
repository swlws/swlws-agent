---
name: project-trd
description: 基于完善后的 PRD，执行技术风险评估，生成包含工程任务拆解、影响分析、工作量评估、技术方案设计的 TRD，持久化到 .ai-native-tmp/trd/。在用户提到生成 TRD、技术方案、@trd、project-trd 时使用。通常在 /project-prd 完成后运行。
---

# project-trd：PRD → TRD 生成

读取完善后的 PRD，执行技术风险评估，生成结构化 TRD 并持久化。

## 主流程

```
Phase 0 读取 PRD    → 读取完善版 PRD（通常为 *-final.md），解析需求内容
Phase 1 风险评估    → 按 [references/risks.md](references/risks.md) 分析技术风险
Phase 2 评审结论    → 汇总风险，AskQuestion 决策：继续/取消
Phase 3 生成 TRD    → 按 [references/trd-template.md](references/trd-template.md) 输出
Phase 4 持久化      → 写入 .ai-native-tmp/trd/<PRD文件名（去掉-final后缀）>.md
Phase 5 自我进化    → 发现未覆盖的新风险模式，询问用户后更新规则
```

## 参考文档

| 主题                         | 文件                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| 技术风险评估规则             | [references/risks.md](references/risks.md)                                                     |
| TRD 模板与填写规范           | [references/trd-template.md](references/trd-template.md)                                       |
| 工程架构（评估影响分析依据） | [../project-develop/references/architecture.md](../project-develop/references/architecture.md) |

---

## Phase 0 — 读取 PRD

1. 用户提供 PRD 文件路径（通常是 `/project-prd` 输出的 `*-final.md`）
2. 使用 Read 工具读取完整内容
3. 提取核心需求：功能目标 / 主流程 / 异常路径 / 技术约束 / 验收标准

---

## Phase 1 — 风险评估

按 [references/risks.md](references/risks.md) 分析，输出格式：

```markdown
## 风险评估结果

🔴 高风险（N 项）：

- [R-1] 新增 ModeRunner 需修改意图路由矩阵，现有 Runner 路由优先级可能受影响

🟡 中风险（N 项）：

- [R-7] 新增 CardType 需前后端两处同步，PRD 未提及前端渲染方案

🟢 低风险/建议（N 项）：

- [R-11] 配置新增字段建议同步更新 SettingsPanel UI
```

---

## Phase 2 — 评审结论与决策

汇总 Phase 1 结果，**必须用 AskUserQuestion** 询问：

**无高风险时**：

| 选项     | 行为         |
| -------- | ------------ |
| 生成 TRD | 进入 Phase 3 |
| 取消     | 零副作用结束 |

**有高风险时**：

| 选项                                      | 行为                                 |
| ----------------------------------------- | ------------------------------------ |
| 生成 TRD（高风险附在 TRD 开头）           | 进入 Phase 3，TRD 首节附风险清单     |
| 取消                                      | 零副作用结束                         |

---

## Phase 3 — 生成 TRD

按 [references/trd-template.md](references/trd-template.md) 生成，核心章节：

1. **评审摘要**（若有高风险，列在此处）
2. **需求理解**（一句话重述功能目标，确认对齐）
3. **工程任务拆解**（细化到具体文件/模块/接口）
4. **现有模块影响分析**（对照工程架构，标出改动点）
5. **技术方案设计**（关键决策与方案选型，含备选方案）
6. **工作量评估**（每项任务：XS/S/M/L/XL，含说明）
7. **风险与注意事项**（来自 Phase 1 评估结果）
8. **验收核对表**（可执行的 checklist，供开发自测与代码审查使用）

---

## Phase 4 — 持久化

- 路径：`.ai-native-tmp/trd/<PRD文件名（去掉路径、-final后缀和扩展名）>.md`
  - 示例：`输入框交互优化-final.md` → `.ai-native-tmp/trd/输入框交互优化.md`
- 文件头写入生成时间戳：`> 生成时间：<YYYY-MM-DD HH:mm>`
- 文件头写入来源 PRD 路径：`> 来源 PRD：<路径>`

---

## Phase 5 — 自我进化机制

生成过程中，若遇到以下情况，**必须暂停并用 AskUserQuestion 询问**：

1. PRD 中出现 risks.md **未覆盖的新技术风险模式**
2. 某条现有风险规则与当前 PRD 的实际情况明显不匹配
3. 用户对某条风险结论表示「不适用」

**询问模板**：

> 我发现一个新风险模式：`[简短描述]`。是否将其添加到 references/risks.md？

用户确认后，立即追加到 risks.md 末尾，并注明 `<!-- updated: [日期] -->`。
