/**
 * 意图标签：一条用户消息可同时携带多个意图
 *
 * - code    涉及代码编写 / 调试 / 重构
 * - image   涉及图像生成
 * - search  需要联网 / 工具检索
 * - plan    任务拆分 / 步骤规划
 * - qa      问答 / 解释 / 分析（无需生成产物）
 * - reflect 需要多轮自我审查
 */
export type IntentTag =
  | "code"
  | "image"
  | "search"
  | "plan"
  | "qa"
  | "reflect";

/**
 * 意图解析结果
 *
 * @property tags       识别出的意图集合，可包含多个标签
 * @property confidence 整体置信度 0 ~ 1；低于阈值时路由回退到 agentMode
 */
export interface IntentResult {
  tags: Set<IntentTag>;
  confidence: number;
}