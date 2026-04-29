import { useState } from "react";
import type { ConversationMeta } from "./useChat";
import { NavIconButton } from "@/fe/components/NavIconButton";
import { NewChatIcon, SettingsIcon, TrashIcon, McpIcon, SkillsIcon } from "@/fe/components/icons";

interface ConversationListProps {
  open: boolean;
  conversations: ConversationMeta[];
  currentId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onOpenMcp: () => void;
  onOpenSkills: () => void;
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
  onDeleteConversation,
  onOpenSettings,
  onOpenMcp,
  onOpenSkills,
}: ConversationListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div
      className={`flex h-full flex-shrink-0 flex-col bg-[#f9f9f9] transition-all duration-200 ease-in-out dark:bg-[#171717] ${
        open ? "w-60" : "w-14"
      }`}
    >
      {/* 上方功能按钮区 */}
      <div className="flex flex-col gap-1 px-2 py-3">
        <NavIconButton
          onClick={onNewChat}
          title="新对话"
          icon={<NewChatIcon />}
          label="新对话"
          showLabel={open}
        />
        <NavIconButton
          onClick={onOpenMcp}
          title="MCP"
          icon={<McpIcon />}
          label="MCP"
          showLabel={open}
        />
        <NavIconButton
          onClick={onOpenSkills}
          title="Skills"
          icon={<SkillsIcon />}
          label="Skills"
          showLabel={open}
        />
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
                <div
                  key={conv.conversationId}
                  className={`group relative flex items-center transition-colors ${
                    conv.conversationId === currentId
                      ? "bg-gray-200 dark:bg-[#2f2f2f]"
                      : "hover:bg-gray-100 dark:hover:bg-[#212121]"
                  }`}
                  onMouseEnter={() => setHoveredId(conv.conversationId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelect(conv.conversationId)}
                    title={conv.title || "新对话"}
                    className={`min-w-0 flex-1 px-3 py-2.5 text-left ${
                      conv.conversationId === currentId
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                  >
                    <p className="truncate text-[13px] leading-5">
                      {conv.title || "新对话"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                      {formatDate(conv.updatedAt)}
                    </p>
                  </button>

                  {/* 删除按钮：hover 时显示 */}
                  {hoveredId === conv.conversationId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conv.conversationId);
                      }}
                      title="删除会话"
                      className="mr-2 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-500 dark:hover:bg-[#3a3a3a] dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* 下方工具按钮区 */}
      <div className="flex h-[66px] flex-col justify-center gap-1 border-t border-gray-200 px-2 dark:border-[#2f2f2f]">
        <NavIconButton
          onClick={onOpenSettings}
          title="设置"
          icon={<SettingsIcon />}
          label="设置"
          showLabel={open}
        />
      </div>
    </div>
  );
}
