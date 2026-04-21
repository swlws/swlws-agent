import { useEffect, useRef, memo } from "react";
import { ChatMessage } from "@/fe/lib/chatSseClient";
import { MessageItem } from "./MessageItem";
import { MindCards } from "./MindCards";

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  onCardSelect: (prompt: string) => void;
}

const NEAR_BOTTOM_THRESHOLD = 80;

export const MessageList = memo(function MessageList({
  messages,
  loading,
  onCardSelect,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const isNearBottomRef = useRef(true);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    isNearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
  }

  useEffect(() => {
    const lengthChanged = messages.length !== prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (lengthChanged) {
      // 新消息追加，强制置底
      isNearBottomRef.current = true;
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (isNearBottomRef.current) {
      // SSE 流式更新，仅在底部附近时跟随
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-8 sm:px-6"
    >
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
