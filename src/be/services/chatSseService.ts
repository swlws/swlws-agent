import { chatStream, Message as LlmMessage } from "@/be/lib/llm";

export type ChatMessage = LlmMessage;

function createSSEStream(messages: ChatMessage[]) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        for await (const chunk of chatStream(messages)) {
          sendEvent(JSON.stringify({ type: "token", content: chunk }));
        }
        sendEvent("[DONE]");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        sendEvent(JSON.stringify({ type: "error", content: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function createChatSseResponse(messages: ChatMessage[]) {
  return createSSEStream(messages);
}

