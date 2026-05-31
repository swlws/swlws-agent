# 技术风险评估规则

基于 swlws-agent 工程的实际架构，评估 PRD 引入的技术风险。

## 风险等级

| 等级 | 标记 | 含义 |
|------|------|------|
| 高风险 | 🔴 | 可能导致已有功能回归、数据损坏、系统崩溃，或实现复杂度显著超出预期 |
| 中风险 | 🟡 | 实现中有易遗漏的联动点，或涉及跨模块改动 |
| 低风险/建议 | 🟢 | 不影响核心链路，但有改进空间 |

---

## 一、Agent 引擎层风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-1 | 🔴 | **新增 ModeRunner 影响意图路由**：`resolveRunner` 的优先级矩阵是顺序匹配，插入新 Runner 可能改变已有意图的路由结果 | PRD 要求新增 AgentMode 或 Runner |
| R-2 | 🔴 | **ReAct 循环未复用**：若新 Runner 自行实现工具调用循环而非复用 `runReActLoop`，将绕过 Token 预算保护和工具执行日志 | PRD 描述新 Runner 需要调用工具 |
| R-3 | 🟡 | **Skill 前缀冲突**：新 Skill 的 `/command` 前缀与现有 Skill 存在前缀包含关系（如 `/code` 和 `/codeReview`） | PRD 定义新 Skill 命令 |
| R-4 | 🟡 | **并发请求竞态**：新功能在同一 `uid:conversationId` 下触发多次请求，未通过 `abortRegistry` 管理旧请求的中止 | PRD 描述异步操作或轮询场景 |
| R-5 | 🟡 | **Reflection 共享上下文污染**：若新功能在 Reflection 的某个 Phase 中插入额外 messages，可能干扰后续 Audit 解析 | PRD 要求修改或扩展 Reflection 行为 |

## 二、持久化与数据层风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-6 | 🔴 | **直接写文件绕过锁**：新增写操作未使用 `lockedWrite`，在并发请求（同一会话多轮对话）时产生文件覆写竞争 | PRD 要求新增持久化能力 |
| R-7 | 🔴 | **数据结构变更无迁移策略**：修改 `ConversationData` / `AppSettings` 等持久化结构，未处理旧文件的兼容读取 | PRD 要求修改存储数据结构 |
| R-8 | 🟡 | **用户目录创建时序**：新增写操作前未调用 `ensureUserDir` / `ensureConversationDir`，目录不存在时抛出 ENOENT | PRD 要求写入新路径或用户首次使用场景 |

## 三、前后端类型同步风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-9 | 🔴 | **CardType 前后端不同步**：后端新增 CardType 值但前端未更新 `const enum` 或 `MessageItem.tsx` 渲染分支，新卡片内容静默丢弃 | PRD 要求新增消息渲染类型 |
| R-10 | 🔴 | **AgentMode 枚举三处不同步**：`AppSettings` 类型、后端 Route `VALID_MODES`、前端 `useChat.ts VALID_MODES` 任一遗漏，新模式被静默回退到 `text` | PRD 要求新增 Agent 模式 |
| R-11 | 🟡 | **配置字段未在 SettingsPanel 暴露**：后端新增 `AppSettings` 字段，但前端没有对应 UI 控件，用户无法通过界面修改 | PRD 要求新增可配置项 |

## 四、API Route 层风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-12 | 🔴 | **缺少 `export const runtime = "nodejs"`**：新 Route Handler 未声明，在 Edge runtime 下无法使用 `fs` / `child_process`，MCP 和文件持久化直接崩溃 | PRD 要求新增 API 端点 |
| R-13 | 🟡 | **用户输入校验缺失**：`uid` / `conversationId` 等参数未做空值兜底，传入 `undefined` 可能构造出错误的文件路径 | PRD 要求新增接受用户输入的 API |

## 五、LLM 调用风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-14 | 🟡 | **直接实例化 OpenAI 客户端**：绕过 `text-llm.ts` 封装，环境变量缺失时错误信息不明确，且无法统一替换底层 SDK | PRD 描述直接调用 LLM 的新模块 |
| R-15 | 🟡 | **低温 Audit 场景温度未显式设置**：评估/判断类 LLM 调用未传 `{ temperature: 0.2 }`，结果随机性高影响一致性 | PRD 描述需要结构化 LLM 输出（如 JSON 判断）的场景 |

## 六、前端交互风险

| ID | 等级 | 风险描述 | 触发条件 |
|----|------|---------|---------|
| R-16 | 🟡 | **SSE 连接泄漏**：新增交互场景（如自动触发对话）未在 unmount 或切换时调用 `sseRef.close()`，旧连接持续接收事件 | PRD 描述自动化触发 SSE 的前端行为 |
| R-17 | 🟢 | **`loadConversationList` 串行读文件**：会话数量多时 API 响应慢，新功能若频繁触发列表刷新将加剧此问题 | PRD 要求高频刷新会话列表 |

---

## 豁免规则（用户确认永久跳过）

| 规则 ID | 规则描述 | 豁免原因 | 豁免日期 |
|---------|---------|---------|---------|
| （暂无） | | | |

<!-- updated: 初始版本 2026-05-31 -->
