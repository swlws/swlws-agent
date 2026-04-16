"use client";

import { useState } from "react";
import { useChat } from "./useChat";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { PersonaPanel } from "./PersonaPanel";

export default function Chat() {
  const { messages, input, setInput, loading, send, newChat, loadHistory, handleKeyDown } = useChat();
  const [personaOpen, setPersonaOpen] = useState(false);

  return (
    <div className="mx-auto flex h-screen w-full max-w-4xl flex-col bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      <ChatHeader
        onLoadHistory={loadHistory}
        onOpenPersona={() => setPersonaOpen(true)}
        onNewChat={newChat}
      />
      <MessageList messages={messages} loading={loading} />
      <InputBar
        value={input}
        onChange={setInput}
        onSend={send}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <PersonaPanel isOpen={personaOpen} onClose={() => setPersonaOpen(false)} />
    </div>
  );
}
