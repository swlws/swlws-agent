import type { AgentMode } from "@/fe/apis/settings";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface SseEvent {
  type: string;
  [key: string]: unknown;
}

type ConnectChatSseParams = {
  uid: string;
  conversationId: string;
  content: string;
  agentMode?: AgentMode;
  onToken: (token: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
  onEvent?: (event: SseEvent) => void;
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
  onEvent,
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
      const parsed = JSON.parse(payload) as { type?: string; content?: string };

      if (parsed.type === "token" && typeof parsed.content === "string") {
        onToken(parsed.content);
        return;
      }

      if (parsed.type === "error" && typeof parsed.content === "string") {
        close();
        onError?.(new Error(parsed.content));
        return;
      }

      // 结构化事件（plan_start、step_start、tool_call 等）
      if (parsed.type) {
        onEvent?.(parsed as SseEvent);
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
