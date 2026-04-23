import {
  buildContextMessages,
  appendMessages,
  trimMessages,
  maybeUpdateSummary,
  refreshPersona,
  refreshMindCards,
} from "@/be/memory";
import {
  loadConversation,
  saveConversation,
  loadPersonaData,
  savePersonaData,
  loadMindCardsData,
  saveMindCardsData,
  loadUserSettings,
  ConversationData,
} from "@/be/session";
import { loadDefaultSettings, mergeSettings, type AgentMode } from "@/be/config/settings";
import { modeRunners, type SseEvent } from "./runners";

export type { SseEvent };

export interface QueryParams {
  uid: string;
  conversationId: string;
  content: string;
  /** 若传入则覆盖用户设置中的 agentMode */
  agentMode?: AgentMode;
}

export interface QueryHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  onEvent?: (event: SseEvent) => void;
}

export class QueryEngine {
  async run(
    params: QueryParams,
    handlers: QueryHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const { uid, conversationId, content } = params;
    const { onToken, onDone, onError, onEvent = () => {} } = handlers;

    try {
      const settings = await this._loadSettings(uid);
      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);

      const mode = params.agentMode ?? settings.agentMode;
      const runner = modeRunners.get(mode) ?? modeRunners.get("direct")!;

      const fullAssistantReply = await runner.execute(
        content,
        contextMessages,
        { onToken, onDone, onError, onEvent },
        signal,
      );

      onDone();

      await this._saveConversationState(
        uid,
        conversationId,
        conv,
        content,
        fullAssistantReply,
        settings.maxMessagesCount,
        settings.summaryTriggerCount,
      );

      await this._updateGlobalKnowledge(
        uid,
        conv,
        settings.personaUpdateHours,
        settings.mindCardsUpdateHours,
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
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
    assistantReply: string,
    maxMessagesCount: number,
    summaryTriggerCount: number,
  ) {
    const withMessages = appendMessages(conv, content, assistantReply);
    const trimmed = trimMessages(withMessages, maxMessagesCount);
    const withSummary = await maybeUpdateSummary(trimmed, summaryTriggerCount);
    await saveConversation(uid, conversationId, withSummary);
  }

  private async _updateGlobalKnowledge(
    uid: string,
    conv: ConversationData,
    personaUpdateHours: number,
    mindCardsUpdateHours: number,
  ) {
    const personaData = await loadPersonaData(uid);
    const newPersonaData = await refreshPersona(
      uid,
      conv,
      personaData,
      personaUpdateHours,
    );
    await savePersonaData(uid, newPersonaData);

    const mindCardsData = await loadMindCardsData(uid);
    const newMindCardsData = await refreshMindCards(
      conv,
      newPersonaData.persona,
      mindCardsData,
      mindCardsUpdateHours,
    );
    await saveMindCardsData(uid, newMindCardsData);
  }
}
