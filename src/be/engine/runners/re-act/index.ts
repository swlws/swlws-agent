import OpenAI from "openai";
import { type ModeRunner } from "@/be/engine/runners/type";
import { runReActLoop } from "../common/react-core";

/**
 * ReAct 模式：Thought → Action → Observation 循环，直到 LLM 不再调用工具
 */
export const reactRunner: ModeRunner = {
  async execute(_content, contextMessages, { onToken }, signal) {
    return runReActLoop(
      contextMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      onToken,
      {
        signal,
      }
    );
  },
};
