import { useState, useEffect, useCallback, memo } from "react";

interface InputBarProps {
  onSend: (value: string) => void;
  onAbort: () => void;
  disabled: boolean;
  loading: boolean;
  conversationId: string;
}

export const InputBar = memo(function InputBar({
  onSend,
  onAbort,
  disabled,
  loading,
  conversationId,
}: InputBarProps) {
  const [value, setValue] = useState("");

  // 当会话切换时，重置输入框
  useEffect(() => {
    setValue("");
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSend(trimmed);
      setValue("");
    }
  }, [value, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-[#3f3f46] dark:bg-[#212121] sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-3xl border border-gray-300 bg-white p-2 shadow-sm transition-colors focus-within:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:focus-within:border-[#666]">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息…"
          disabled={disabled}
          className="max-h-48 flex-1 resize-none bg-transparent px-3 py-2 text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-500 disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400"
        />
        {loading ? (
          <button
            onClick={onAbort}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-[#4a4a4a] dark:text-gray-300 dark:hover:border-[#666] dark:hover:bg-[#3a3a3a]"
          >
            停止
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!value.trim()}
            className="rounded-full bg-[#202123] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200"
          >
            发送
          </button>
        )}
      </div>
    </div>
  );
});
