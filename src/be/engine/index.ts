import {
  buildContextMessages,
  appendMessages,
  trimMessages,
  maybeUpdateSummary,
  refreshMindCards,
} from "@/be/memory";
import {
  loadConversation,
  saveConversation,
  loadMindCardsData,
  saveMindCardsData,
  loadUserSettings,
  ConversationData,
  ChatMessage,
} from "@/be/session";
import {
  loadDefaultSettings,
  mergeSettings,
  type AgentMode,
} from "@/be/config/settings";
import { type CardType } from "./runners/type";
import { IntentParser } from "./intent";
import { resolveRunner } from "./intent/resolver";
import { modeRunners } from "./runners";
import { applyDeepThinkPolicyPrompt } from "./prompts/deep-think-policy";
import { skillManager, executeSkill } from "@/be/engine/skills";
import { logger } from "@/be/lib/logger";

export type { CardType };

export interface QueryParams {
  uid: string;
  conversationId: string;
  content: string;
  /** 若传入则覆盖用户设置中的 agentMode */
  agentMode?: AgentMode;
  /** true 时启用深度思考提示词策略 */
  deepThink?: boolean;
}

export interface QueryHandlers {
  onToken: (cardType: CardType, token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

export class QueryEngine {
  async run(
    params: QueryParams,
    handlers: QueryHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const { uid, conversationId, content } = params;
    const { onToken, onDone, onError } = handlers;

    logger.info("engine", "请求进入", {
      uid: uid ?? "anonymous",
      conversationId: conversationId ?? "default",
      contentLength: content?.length ?? 0,
    });

    try {
      const settings = await this._loadSettings(uid);
      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);
      const runtimeMessages = applyDeepThinkPolicyPrompt(
        contextMessages,
        params.deepThink ?? false,
      );

      const assistantMessages: ChatMessage[] = [];
      const wrappedOnToken = (cardType: CardType, token: string) => {
        const last = assistantMessages[assistantMessages.length - 1];
        if (last && last.cardType === (cardType as number)) {
          last.content += token;
        } else {
          assistantMessages.push({
            role: "assistant",
            content: token,
            cardType: cardType as number,
          });
        }
        onToken(cardType, token);
      };

      const fallbackMode = params.agentMode ?? settings.agentMode;

      // Skill 匹配：/command 优先于意图解析
      const skillMatch = skillManager.match(content);
      if (skillMatch) {
        logger.info("engine", "路由: skill 命中", {
          skill: skillMatch.skill.meta.name,
        });
        await executeSkill(
          skillMatch.skill,
          skillMatch.extractedArgs,
          runtimeMessages,
          { onToken: wrappedOnToken },
          signal,
        );
      } else {
        // 意图解析：根据配置策略解析用户意图，再路由到最合适的 Runner
        const intentParser = new IntentParser(
          settings.intentDetection,
          settings.intentConfidenceThreshold,
        );
        const intentResult = await intentParser.parse(content);
        const runner = resolveRunner(
          intentResult,
          fallbackMode,
          settings.intentConfidenceThreshold,
        );
        // runner 是对象字面量（无 class 名），从 modeRunners 反查其 mode key
        const runnerMode =
          [...modeRunners.entries()].find(([, r]) => r === runner)?.[0] ??
          "unknown";
        logger.info("engine", "路由: 意图解析→Runner", {
          tags: Array.from(intentResult.tags),
          confidence: intentResult.confidence,
          runner: runnerMode,
        });

        await runner.execute(
          content,
          runtimeMessages,
          { onToken: wrappedOnToken, onDone, onError },
          signal,
        );
      }

      onDone();

      const updatedConv = await this._saveConversationState(
        uid,
        conversationId,
        conv,
        content,
        assistantMessages,
        settings.maxMessagesCount,
        settings.summaryTriggerCount,
      );

      await this._updateGlobalKnowledge(
        uid,
        updatedConv,
        settings.mindCardsUpdateHours,
      );
    } catch (err) {
      if (
        err instanceof Error &&
        (err.name === "AbortError" ||
          err.name === "APIUserAbortError" ||
          signal?.aborted)
      ) {
        logger.info("engine", "请求被中止");
        return;
      }
      logger.error("engine", "请求处理异常", {
        error: err instanceof Error ? err.message : String(err),
      });
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }

  private async _loadSettings(uid: string) {
    const [defaults, userOverrides] = await Promise.all([
      loadDefaultSettings(),
      loadUserSettings(uid),
    ]);
    return mergeSettings(defaults, userOverrides);
  }

  private async _saveConversationState(
    uid: string,
    conversationId: string,
    conv: ConversationData,
    content: string,
    assistantMessages: ChatMessage[],
    maxMessagesCount: number,
    summaryTriggerCount: number,
  ): Promise<ConversationData> {
    const withMessages = appendMessages(conv, content, assistantMessages);
    const trimmed = trimMessages(withMessages, maxMessagesCount);
    const withSummary = await maybeUpdateSummary(trimmed, summaryTriggerCount);
    await saveConversation(uid, conversationId, withSummary);
    return withSummary;
  }

  private async _updateGlobalKnowledge(
    uid: string,
    conv: ConversationData,
    mindCardsUpdateHours: number,
  ) {
    const mindCardsData = await loadMindCardsData(uid);
    const newMindCardsData = await refreshMindCards(
      conv,
      mindCardsData,
      mindCardsUpdateHours,
    );
    await saveMindCardsData(uid, newMindCardsData);
  }
}
