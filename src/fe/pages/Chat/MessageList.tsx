import { useEffect, useRef, useState, memo } from "react";
import { ChatMessage } from "@/fe/lib/chatSseClient";
import { MessageItem } from "./MessageItem";
import { MindCards } from "./MindCards";
import { ArrowDownIcon } from "@/fe/components/icons";

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
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(loading && !nearBottom);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    isNearBottomRef.current = true;
    setShowScrollBtn(false);
  }

  useEffect(() => {
    const lengthChanged = messages.length !== prevLengthRef.current;
    prevLengthRef.current = messages.length;

    if (lengthChanged) {
      isNearBottomRef.current = true;
      setShowScrollBtn(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [messages]);

  // loading 结束时隐藏按钮
  useEffect(() => {
    if (!loading) setShowScrollBtn(false);
  }, [loading]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-8 sm:px-6"
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

      {/* SSE 输出中且用户上翻时显示的滚底按钮 */}
      {showScrollBtn && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 shadow-md transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-[#3f3f46] dark:bg-[#2a2a2a] dark:text-gray-400 dark:hover:bg-[#333] dark:hover:text-gray-200"
          >
            <ArrowDownIcon className="h-3.5 w-3.5 animate-bounce" />
            <span>回到底部</span>
          </button>
        </div>
      )}
    </div>
  );
});
