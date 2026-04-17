export type ChatMessage = { role: "user" | "assistant"; content: string };

type ConnectChatSseParams = {
  uid: string;
  conversationId: string;
  content: string;
  onToken: (token: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Connect to `/api/chat` SSE stream via EventSource.
 * The server sends `data: [DONE]` or `data: {"type":"token"|"error","content":...}`.
 */
export function connectChatSse({
  uid,
  conversationId,
  content,
  onToken,
  onDone,
  onError,
}: ConnectChatSseParams): { close: () => void } {
  const url = `/api/chat?uid=${encodeURIComponent(uid)}&conversationId=${encodeURIComponent(conversationId)}&content=${encodeURIComponent(content)}`;
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
      const parsed = JSON.parse(payload) as { type?: string; content?: string };

      if (parsed.type === "token" && typeof parsed.content === "string") {
        onToken(parsed.content);
        return;
      }

      if (parsed.type === "error" && typeof parsed.content === "string") {
        close();
        onError?.(new Error(parsed.content));
      }
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
