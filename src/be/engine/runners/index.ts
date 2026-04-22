import type { Message } from "@/be/lib/text-llm";
import type { SseEvent } from "./plan-and-solve/solver";
import { directRunner } from "./direct";
import { planAndSolveRunner } from "./plan-and-solve";
import { reactRunner } from "./react";

export type { SseEvent };

export interface RunnerHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onEvent: (event: SseEvent) => void;
}

/** 每种模式实现此接口，返回完整的 assistant 输出文本 */
export interface ModeRunner {
  execute(
    content: string,
    contextMessages: Message[],
    handlers: RunnerHandlers,
    signal?: AbortSignal,
  ): Promise<string>;
}

export const modeRunners = new Map<string, ModeRunner>([
  ["direct", directRunner],
  ["plan-and-solve", planAndSolveRunner],
  ["react", reactRunner],
]);
