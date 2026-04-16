"use client";

import { useState, useRef, useEffect } from "react";

import { connectChatSse, ChatMessage } from "@/fe/lib/chatSseClient";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      sseRef.current?.close();
    };
  }, []);

  function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const assistantIndex = next.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    // 关闭上一次未完成的连接
    sseRef.current?.close();
    sseRef.current = connectChatSse({
      messages: next,
      onToken: (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            content: updated[assistantIndex].content + token,
          };
          return updated;
        });
      },
      onDone: () => {
        sseRef.current = null;
        setLoading(false);
      },
      onError: (err) => {
        sseRef.current = null;
        setLoading(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: `[error]: ${err.message}` };
          return updated;
        });
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-4xl flex-col bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        {messages.length === 0 && (
          <div className="mt-24 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-800 dark:text-gray-200">
              What can I help with?
            </h1>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Ask anything and press Enter to send
            </p>
          </div>
        )}
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex w-full ${
                msg.role === "user"
                  ? "justify-end"
                  : "justify-start rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[#2f2f2f]"
              }`}
            >
              <div
                className={`whitespace-pre-wrap text-[15px] leading-7 ${
                  msg.role === "user"
                    ? "max-w-[85%] rounded-3xl bg-[#303030] px-5 py-3 text-white dark:bg-[#f4f4f4] dark:text-[#202123]"
                    : "w-full text-gray-900 dark:text-gray-100"
                }`}
              >
                {msg.content || (loading && i === messages.length - 1 ? "▋" : "")}
              </div>
            </div>
          ))}
        </div>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-[#3f3f46] dark:bg-[#212121] sm:px-6">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-gray-300 bg-white p-2 shadow-sm transition-colors focus-within:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:focus-within:border-[#666]">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message ChatGPT"
            disabled={loading}
            className="max-h-48 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-500 disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="rounded-full bg-[#202123] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

