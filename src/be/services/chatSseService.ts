import { QueryEngine } from "@/be/engine";

const engine = new QueryEngine();

function createSSEStream(uid: string, content: string) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: string) => {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      try {
        await engine.run(uid, content, {
          onToken: (chunk) => sendEvent(JSON.stringify({ type: "token", content: chunk })),
          onDone:  () => sendEvent("[DONE]"),
          onError: (err) => sendEvent(JSON.stringify({ type: "error", content: err.message })),
        });
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

export function createChatSseResponse(uid: string, content: string) {
  return createSSEStream(uid, content);
}
