interface ChatHeaderProps {
  onOpenPersona: () => void;
  onToggleSidebar: () => void;
  onNewChat: () => void;
  sidebarOpen: boolean;
}

export function ChatHeader({ onOpenPersona, onToggleSidebar, onNewChat, sidebarOpen }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2 dark:border-[#3f3f46]">
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
          title={sidebarOpen ? "收起历史" : "展开历史"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
        <button
          onClick={onNewChat}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
          title="新对话"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      </div>

      <button
        onClick={onOpenPersona}
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
        title="人物画像"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    </div>
  );
}
