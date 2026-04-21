import { useState, useRef, useEffect, useCallback } from "react";
import { connectChatSse, ChatMessage } from "@/fe/lib/chatSseClient";
import {
  getUid,
  getConversationId,
  createNewConversationId,
  setConversationId,
} from "@/fe/lib/uid";
import { getConversations, getMemory, type ConversationMeta } from "@/fe/apis/conversations";
import { abortChat } from "@/fe/apis/chat";

export type { ConversationMeta };

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
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
    const list = await getConversations();
    setConversations(list);
  }, []);

  const switchConversation = useCallback(async (cid: string) => {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    setConversationId(cid);
    setConversationIdState(cid);

    const cached = await getMemory(cid);
    setMessages(cached);
  }, []);

  const newChat = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    const cid = createNewConversationId();
    setConversationIdState(cid);
    setMessages([]);
    setLoading(false);
  }, []);

  const abort = useCallback(() => {
    sseRef.current?.close();
    sseRef.current = null;
    setLoading(false);
    abortChat();
  }, []);

  const sendText = useCallback(
    (text: string) => {
      if (!text || loading) return;

      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);

      const assistantIndex = messages.length + 1; // current messages + new user message
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
            const assistantMsg = updated[assistantIndex];
            if (assistantMsg) {
              updated[assistantIndex] = {
                ...assistantMsg,
                content: assistantMsg.content + token,
              };
            }
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
            updated[assistantIndex] = {
              role: "assistant",
              content: `[error]: ${err.message}`,
            };
            return updated;
          });
        },
      });
    },
    [messages, loading, conversationId, loadConversationList],
  );

  return {
    messages,
    loading,
    sendText,
    abort,
    newChat,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  };
}
