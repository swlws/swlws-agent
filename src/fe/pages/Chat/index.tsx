"use client";

import { useState, useEffect } from "react";
import { useChat } from "./useChat";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { PersonaPanel } from "./PersonaPanel";
import { ConversationList } from "./ConversationList";

export default function Chat() {
  const {
    messages,
    input,
    setInput,
    loading,
    send,
    sendText,
    abort,
    newChat,
    handleKeyDown,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  } = useChat();

  const [personaOpen, setPersonaOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        sidebarOpen={sidebarOpen}
      />
      <MessageList messages={messages} loading={loading} onCardSelect={sendText} />
      <InputBar
        value={input}
        onChange={setInput}
        onSend={send}
        onAbort={abort}
        onKeyDown={handleKeyDown}
        disabled={loading}
        loading={loading}
      />

      <PersonaPanel isOpen={personaOpen} onClose={() => setPersonaOpen(false)} />
    </div>
  );
}
