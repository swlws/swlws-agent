"use client";

import { useState, useEffect } from "react";
import { useChat } from "./useChat";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { PersonaPanel } from "./PersonaPanel";
import { ConversationList } from "./ConversationList";
import { SettingsPanel } from "./SettingsPanel";

export default function Chat() {
  const {
    messages,
    loading,
    sendText,
    abort,
    newChat,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  } = useChat();

  const [personaOpen, setPersonaOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    loadConversationList();
  }, [loadConversationList]);

  function handleNewChat() {
    newChat();
    loadConversationList();
  }

  return (
    <div className="mx-auto flex h-screen w-full max-w-4xl flex-col bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      <ConversationList
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentId={conversationId}
        onSelect={switchConversation}
        onNewChat={handleNewChat}
      />

      <ChatHeader
        onOpenPersona={() => setPersonaOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onNewChat={handleNewChat}
        sidebarOpen={sidebarOpen}
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
      />

      <PersonaPanel
        isOpen={personaOpen}
        onClose={() => setPersonaOpen(false)}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}
