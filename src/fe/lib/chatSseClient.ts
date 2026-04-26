import type { AgentMode } from "@/fe/apis/settings";

export const enum CardType {
  Markdown = 1,
  Cot = 2,
  Error = 3,
  Image = 4,
  Divider = 5,
}

export interface MessageCard {
  cardType: CardType;
  content: string;
}

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; cards: MessageCard[] };

type ConnectChatSseParams = {
  uid: string;
  conversationId: string;
  content: string;
  agentMode?: AgentMode;
  onToken: (cardType: CardType, token: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Connect to `/api/chat` SSE stream via EventSource.
 * The server sends `data: [DONE]` or `data: {"type":"token"|"error"|...,"content":...}`.
 */
export function connectChatSse({
  uid,
  conversationId,
  content,
  agentMode,
  onToken,
  onDone,
  onError,
}: ConnectChatSseParams): { close: () => void } {
  let url = `/api/chat?uid=${encodeURIComponent(uid)}&conversationId=${encodeURIComponent(conversationId)}&content=${encodeURIComponent(content)}`;
  if (agentMode) url += `&agentMode=${encodeURIComponent(agentMode)}`;
  const es = new EventSource(url);

  let finished = false;

  const close = () => {
    finished = true;
    es.close();
  };

  es.onmessage = (event) => {
    const payload = event.data;

    if (payload === "[DONE]") {
      close();
      onDone?.();
      return;
    }

    try {
      const parsed = JSON.parse(payload) as {
        type?: string;
        cardType?: CardType;
        content?: string;
      };

      if (parsed.type === "token" && typeof parsed.content === "string") {
        onToken(parsed.cardType ?? CardType.Markdown, parsed.content);
        return;
      }

      if (parsed.type === "error" && typeof parsed.content === "string") {
        close();
        onError?.(new Error(parsed.content));
        return;
      }

      // 未知 type，忽略
    } catch (err) {
      close();
      onError?.(err instanceof Error ? err : new Error("Request failed"));
    }
  };

  es.onerror = () => {
    if (finished) return;
    close();
    onError?.(new Error("Connection lost"));
  };

  return { close };
}
