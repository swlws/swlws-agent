import type { ModeRunner } from "@/be/engine/runners/type";
import { modeRunners } from "@/be/engine/runners";
import type { AgentMode } from "@/be/config/settings";
import type { IntentResult } from "./types";

/**
 * 多意图路由矩阵
 *
 * 优先级（从高到低）：
 *   1. image                        → image-gen
 *   2. code + reflect               → reflection
 *   3. code + plan                  → plan-and-solve
 *   4. code + search                → react
 *   5. reflect（不含 code）         → reflection
 *   6. plan（不含 code）            → plan-and-solve
 *   7. search（不含 code）          → react
 *   8. code（单独）                 → 保持 fallbackMode
 *   9. qa 或无特殊意图              → text
 *
 * 置信度低于阈值时完全回退到 fallbackMode。
 */
export function resolveRunner(
  intent: IntentResult,
  fallbackMode: AgentMode,
  confidenceThreshold: number,
): ModeRunner {
  const fallback =
    modeRunners.get(fallbackMode) ?? modeRunners.get("text")!;

  // 置信度不足 → 回退
  if (intent.confidence < confidenceThreshold) {
    return fallback;
  }

  const { tags } = intent;
  const has = (tag: (typeof tags extends Set<infer T> ? T : never)) =>
    tags.has(tag);

  // 1. image 优先级最高，与其他意图共存时独占
  if (has("image")) {
    return modeRunners.get("image-gen")!;
  }

  // 2. code + reflect
  if (has("code") && has("reflect")) {
    return modeRunners.get("reflection")!;
  }

  // 3. code + plan
  if (has("code") && has("plan")) {
    return modeRunners.get("plan-and-solve")!;
  }

  // 4. code + search
  if (has("code") && has("search")) {
    return modeRunners.get("react")!;
  }

  // 5. reflect（不含 code）
  if (has("reflect")) {
    return modeRunners.get("reflection")!;
  }

  // 6. plan（不含 code）
  if (has("plan")) {
    return modeRunners.get("plan-and-solve")!;
  }

  // 7. search（不含 code）
  if (has("search")) {
    return modeRunners.get("react")!;
  }

  // 8. code 单独 → 保持 fallbackMode
  if (has("code")) {
    return fallback;
  }

  // 9. qa 或无特殊意图
  return modeRunners.get("text")!;
}