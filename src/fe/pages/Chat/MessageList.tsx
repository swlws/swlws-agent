import { useEffect, useRef, memo } from "react";
import { ChatMessage } from "@/fe/lib/chatSseClient";
import { MessageItem } from "./MessageItem";
import { MindCards } from "./MindCards";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  onCardSelect: (prompt: string) => void;
}

export const MessageList = memo(function MessageList({
  messages,
  loading,
  onCardSelect,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
      {messages.length === 0 && (
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="mb-6 text-2xl font-semibold tracking-tight text-gray-800 dark:text-gray-200">
            Hello World
          </h1>
          <MindCards onSelect={onCardSelect} />
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {messages.map((msg, i) => (
          <MessageItem
            key={i}
            message={msg}
            isLast={i === messages.length - 1}
            loading={loading}
          />
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
});
