import { memo } from "react";
import MarkdownView from "@/fe/components/MarkdownView";
import { ChatMessage } from "@/fe/lib/chatSseClient";

interface MessageItemProps {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  isLast,
  loading,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const showLoader = loading && isLast && !message.content;

  return (
    <div
      className={`flex w-full ${
        isUser
          ? "justify-end"
          : "justify-start rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[#2f2f2f]"
      }`}
    >
      <div
        className={`break-words text-[15px] leading-7 ${
          isUser
            ? "max-w-[85%] rounded-3xl bg-[#303030] px-5 py-3 text-white dark:bg-[#f4f4f4] dark:text-[#202123]"
            : "w-full text-gray-900 dark:text-gray-100"
        }`}
      >
        {showLoader ? (
          <span className="inline-flex items-center gap-1 py-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
          </span>
        ) : (
          <MarkdownView content={message.content} />
        )}
      </div>
    </div>
  );
});
