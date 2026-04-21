import type { ConversationMeta } from "./useChat";

interface ConversationListProps {
  open: boolean;
  conversations: ConversationMeta[];
  currentId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onToggle: () => void;
  onOpenPersona: () => void;
  onOpenSettings: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export function ConversationList({
  open,
  conversations,
  currentId,
  onSelect,
  onNewChat,
  onToggle,
  onOpenPersona,
  onOpenSettings,
}: ConversationListProps) {
  return (
    <div
      className={`flex h-full flex-shrink-0 flex-col bg-[#f9f9f9] transition-all duration-200 ease-in-out dark:bg-[#171717] ${
        open ? "w-60" : "w-14"
      }`}
    >
      {/* 上方功能按钮区 */}
      <div className="flex flex-col gap-1 px-2 py-3">
        {/* 展开/收起按钮 */}
        <button
          onClick={onToggle}
          title={open ? "收起侧边栏" : "展开侧边栏"}
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
            </svg>
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-200 ${open ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            {open ? "收起侧边栏" : ""}
          </span>
        </button>

        {/* 新建对话按钮 */}
        <button
          onClick={onNewChat}
          title="新对话"
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-200 ${open ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            新对话
          </span>
        </button>

        {/* 人物画像按钮 */}
        <button
          onClick={onOpenPersona}
          title="人物画像"
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-200 ${open ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            人物画像
          </span>
        </button>
      </div>

      {/* 会话历史区（展开时显示） */}
      <div className="flex-1 overflow-y-auto">
        {open && (
          <>
            {conversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500">
                暂无历史对话
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.conversationId}
                  onClick={() => onSelect(conv.conversationId)}
                  title={conv.title || "新对话"}
                  className={`w-full px-3 py-2.5 text-left transition-colors ${
                    conv.conversationId === currentId
                      ? "bg-gray-200 text-gray-900 dark:bg-[#2f2f2f] dark:text-gray-100"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#212121] dark:hover:text-gray-100"
                  }`}
                >
                  <p className="truncate text-[13px] leading-5">
                    {conv.title || "新对话"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDate(conv.updatedAt)}
                  </p>
                </button>
              ))
            )}
          </>
        )}
      </div>

      {/* 下方工具按钮区 */}
      <div className="flex h-[91px] flex-col justify-center gap-1 border-t border-gray-200 px-2 dark:border-[#2f2f2f]">
        {/* 设置按钮 */}
        <button
          onClick={onOpenSettings}
          title="设置"
          className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        >
          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
            </svg>
          </span>
          <span
            className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-200 ${open ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            设置
          </span>
        </button>
      </div>
    </div>
  );
}
