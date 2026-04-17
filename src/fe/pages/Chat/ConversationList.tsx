import type { ConversationMeta } from "./useChat";

interface ConversationListProps {
  open: boolean;
  onClose: () => void;
  conversations: ConversationMeta[];
  currentId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
}

export function ConversationList({ open, onClose, conversations, currentId, onSelect, onNewChat }: ConversationListProps) {
  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  function handleNewChat() {
    onNewChat();
    onClose();
  }

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-20 bg-black/30 transition-opacity duration-200 dark:bg-black/50 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* 抽屉面板 */}
      <div
        className={`fixed left-0 top-0 z-30 flex h-full w-56 flex-col bg-white shadow-xl transition-transform duration-200 ease-in-out dark:bg-[#1a1a1a] ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-[#3f3f46]">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">对话历史</span>
          <button
            onClick={handleNewChat}
            title="新对话"
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-200"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="px-3 py-4 text-xs text-gray-400 dark:text-gray-500">暂无历史对话</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.conversationId}
                onClick={() => handleSelect(conv.conversationId)}
                className={`w-full px-3 py-2.5 text-left transition-colors ${
                  conv.conversationId === currentId
                    ? "bg-gray-100 text-gray-900 dark:bg-[#2f2f2f] dark:text-gray-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#252525] dark:hover:text-gray-100"
                }`}
              >
                <p className="truncate text-[13px] leading-5">{conv.title || "新对话"}</p>
                <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                  {formatDate(conv.updatedAt)}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
