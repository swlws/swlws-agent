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
import { modeRunners } from "./runners";
import { type CardType } from "./runners/type";

export type { CardType };

export interface QueryParams {
  uid: string;
  conversationId: string;
  content: string;
  /** 若传入则覆盖用户设置中的 agentMode */
  agentMode?: AgentMode;
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

    try {
      const settings = await this._loadSettings(uid);
      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);

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

      const mode = params.agentMode ?? settings.agentMode;
      const runner = modeRunners.get(mode) ?? modeRunners.get("text")!;

      await runner.execute(
        content,
        contextMessages,
        { onToken: wrappedOnToken, onDone, onError },
        signal,
      );

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
      )
        return;
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
