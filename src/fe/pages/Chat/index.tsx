"use client";

import { useState, useEffect } from "react";
import { useChat } from "./useChat";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { ConversationList } from "./ConversationList";
import { SettingsPanel } from "./SettingsPanel";
import { McpPanel } from "./McpPanel";
import { SkillsPanel } from "./SkillsPanel";
import { ChatHeader } from "./ChatHeader";

export default function Chat() {
  const {
    messages,
    loading,
    sendText,
    abort,
    newChat,
    deleteConversation,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
    agentMode,
    setAgentMode,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mcpOpen, setMcpOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

  useEffect(() => {
    loadConversationList();
  }, [loadConversationList]);

  function handleNewChat() {
    newChat();
    loadConversationList();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      {/* 左侧固定导航栏 */}
      <ConversationList
        open={sidebarOpen}
        conversations={conversations}
        currentId={conversationId}
        onSelect={switchConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMcp={() => setMcpOpen(true)}
        onOpenSkills={() => setSkillsOpen(true)}
      />

      {/* 右侧主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <MessageList
          messages={messages}
          loading={loading}
          onCardSelect={sendText}
        />
        <InputBar
          onSend={sendText}
          onAbort={abort}
          disabled={loading}
          loading={loading}
          conversationId={conversationId}
          agentMode={agentMode}
          onModeChange={setAgentMode}
        />
      </div>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => {}}
      />
      <McpPanel
        isOpen={mcpOpen}
        onClose={() => setMcpOpen(false)}
      />
      <SkillsPanel
        isOpen={skillsOpen}
        onClose={() => setSkillsOpen(false)}
      />
    </div>
  );
}
