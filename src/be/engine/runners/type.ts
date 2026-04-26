import type { Message } from "@/be/lib/text-llm";

export const enum CardType {
  Divider = 5,
  Markdown = 1,
  Cot = 2,
  Error = 3,
  Image = 4,
}

export interface RunnerHandlers {
  onToken: (cardType: CardType, token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
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
