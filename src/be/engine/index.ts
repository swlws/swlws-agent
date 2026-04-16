import { chatStream } from "@/be/lib/llm";
import { buildContextMessages, updateSession } from "@/be/memory";
import { loadSession, saveSession } from "@/be/session";

export interface QueryHandlers {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
}

/**
 * QueryEngine orchestrates the full query lifecycle:
 *   1. Load session context
 *   2. Build LLM input via memory
 *   3. Stream response tokens via callbacks
 *   4. Persist session asynchronously (fire-and-forget)
 *
 * Callers (e.g. SSE service) only deal with transport concerns;
 * all business logic lives here.
 */
export class QueryEngine {
  async run(uid: string, content: string, handlers: QueryHandlers): Promise<void> {
    const { onToken, onDone, onError } = handlers;

    try {
      const session = await loadSession(uid);
      const contextMessages = buildContextMessages(session, content);

      let assistantReply = "";
      for await (const chunk of chatStream(contextMessages)) {
        assistantReply += chunk;
        onToken(chunk);
      }

      onDone();

      updateSession(session, content, assistantReply)
        .then((updated) => saveSession(uid, updated))
        .catch((err) => console.error("[memory] failed to save session:", err));
    } catch (err) {
      onError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }
}
