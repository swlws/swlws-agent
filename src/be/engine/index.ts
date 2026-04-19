import { chatStream, Message } from "@/be/lib/text-llm";
import { generateImage } from "@/be/lib/image-gen";
import {
  buildContextMessages,
  appendMessages,
  compactMemories,
  refreshPersona,
  refreshMindCards,
} from "@/be/memory";
import {
  loadConversation,
  saveConversation,
  listConversations,
  loadConversation as loadConv,
  loadPersonaData,
  savePersonaData,
  loadMindCardsData,
  saveMindCardsData,
  loadUserSettings,
  ConversationData,
} from "@/be/session";
import { loadDefaultSettings, mergeSettings } from "@/be/config/settings";

export interface QueryParams {
  uid: string;
  conversationId: string;
  content: string;
}

export interface QueryHandlers {
  onToken: (token: string) => void;
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
    const { onDone, onError } = handlers;

    try {
      const settings = await this._loadSettings(uid);
      const conv = await loadConversation(uid, conversationId);
      const contextMessages = buildContextMessages(conv, content);

      const assistantReply = await this._generateResponse(
        content,
        contextMessages,
        handlers,
        signal,
      );

      onDone();

      await this._saveConversationState(
        uid,
        conversationId,
        conv,
        content,
        assistantReply,
        settings.conversationCacheCount,
      );

      await this._updateGlobalKnowledge(
        uid,
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

  private async _generateResponse(
    content: string,
    contextMessages: Message[],
    handlers: QueryHandlers,
    signal?: AbortSignal,
  ): Promise<string> {
    const { onToken } = handlers;
    let assistantReply = "";

    if (content.includes("生成图片")) {
      onToken("正在为您生成图片...\n\n");
      const promptMatch = content.match(/生成图片[:：\s]*(.*)/);
      const imagePrompt =
        (promptMatch && promptMatch[1].trim()) ||
        content.replace(/生成图片/g, "").trim();

      try {
        const imageUrl = await generateImage(imagePrompt || "一张精美的图片");
        assistantReply = `![generated image](${imageUrl})`;
        onToken(assistantReply);
      } catch (error) {
        console.error("Image generation failed:", error);
        assistantReply = "抱歉，生成图片时出错了。请稍后再试。";
        onToken(assistantReply);
      }
    } else {
      for await (const chunk of chatStream(contextMessages, {}, signal)) {
        assistantReply += chunk;
        onToken(chunk);
      }
    }

    return assistantReply;
  }

  private async _saveConversationState(
    uid: string,
    conversationId: string,
    conv: ConversationData,
    content: string,
    assistantReply: string,
    cacheCount: number,
  ) {
    const withMessages = appendMessages(conv, content, assistantReply);
    const { conv: withMemory } = await compactMemories(
      withMessages,
      cacheCount,
    );
    await saveConversation(uid, conversationId, withMemory);
  }

  private async _updateGlobalKnowledge(
    uid: string,
    personaUpdateHours: number,
    mindCardsUpdateHours: number,
  ) {
    const metas = await listConversations(uid);
    const allConversations = await Promise.all(
      metas.map((m) => loadConv(uid, m.conversationId)),
    );

    const personaData = await loadPersonaData(uid);
    const newPersonaData = await refreshPersona(
      uid,
      allConversations,
      personaData,
      personaUpdateHours,
    );
    await savePersonaData(uid, newPersonaData);

    const mindCardsData = await loadMindCardsData(uid);
    const newMindCardsData = await refreshMindCards(
      allConversations,
      newPersonaData.persona,
      mindCardsData,
      mindCardsUpdateHours,
    );
    await saveMindCardsData(uid, newMindCardsData);
  }
}
