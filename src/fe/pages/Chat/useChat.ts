import { useState, useRef, useEffect, useCallback } from "react";
import { connectChatSse, ChatMessage } from "@/fe/lib/chatSseClient";
import { getUid, getConversationId, createNewConversationId, setConversationId } from "@/fe/lib/uid";

export interface ConversationMeta {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationIdState] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const sseRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    setConversationIdState(getConversationId());
    return () => {
      sseRef.current?.close();
    };
  }, []);

  const loadConversationList = useCallback(async () => {
    const res = await fetch(`/api/conversations?uid=${encodeURIComponent(getUid())}`);
    const list: ConversationMeta[] = await res.json();
    setConversations(list);
  }, []);

  async function switchConversation(cid: string) {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    setInput("");
    setConversationId(cid);
    setConversationIdState(cid);

    const res = await fetch(
      `/api/memory?uid=${encodeURIComponent(getUid())}&conversationId=${encodeURIComponent(cid)}`,
    );
    const cached: ChatMessage[] = await res.json();
    setMessages(cached);
  }

  function newChat() {
    sseRef.current?.close();
    sseRef.current = null;
    const cid = createNewConversationId();
    setConversationIdState(cid);
    setMessages([]);
    setInput("");
    setLoading(false);
  }

  function abort() {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    fetch("/api/chat/abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: getUid() }),
    }).catch(() => {});
  }

  function sendText(text: string) {
    if (!text || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const assistantIndex = next.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const cid = conversationId;
    sseRef.current?.close();
    sseRef.current = connectChatSse({
      uid: getUid(),
      conversationId: cid,
      content: text,
      onToken: (token) => {
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = {
            ...updated[assistantIndex],
            content: updated[assistantIndex].content + token,
          };
          return updated;
        });
      },
      onDone: () => {
        sseRef.current = null;
        setLoading(false);
        loadConversationList();
      },
      onError: (err) => {
        sseRef.current = null;
        setLoading(false);
        setMessages((prev) => {
          const updated = [...prev];
          updated[assistantIndex] = { role: "assistant", content: `[error]: ${err.message}` };
          return updated;
        });
      },
    });
  }

  function send() {
    sendText(input.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return {
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
  };
}
