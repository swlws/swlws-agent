import { memo, useState, useCallback } from "react";
import MarkdownView from "@/fe/components/MarkdownView";
import { LoadingDots } from "@/fe/components/LoadingDots";
import { ChatMessage } from "@/fe/lib/chatSseClient";
import { CopySuccessIcon, CopyClipboardIcon } from "@/fe/components/icons";

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
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [message.content]);

  return (
    <div
      className={`group flex w-full ${
        isUser
          ? "justify-end"
          : "justify-start rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[#2f2f2f]"
      }`}
    >
      <div
        className={`relative break-words text-[15px] leading-7 ${
          isUser
            ? "max-w-[85%] rounded-3xl bg-[#303030] px-5 py-3 text-white dark:bg-[#f4f4f4] dark:text-[#202123]"
            : "w-full text-gray-900 dark:text-gray-100"
        }`}
      >
        {showLoader ? (
          <LoadingDots className="items-center gap-1 py-1" />
        ) : (
          <>
            <MarkdownView content={message.content} />
            {message.content && (
              <button
                onClick={handleCopy}
                title="复制"
                className={`mt-1 rounded-md p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${
                  isUser ? "absolute -bottom-7 right-0" : "inline-flex"
                }`}
              >
                {copied ? <CopySuccessIcon /> : <CopyClipboardIcon />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});
