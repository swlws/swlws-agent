import { useState, useRef, useEffect, useCallback } from "react";
import {
  connectChatSse,
  CardType,
  type ChatMessage,
} from "@/fe/lib/chatSseClient";
import {
  getUid,
  getConversationId,
  createNewConversationId,
  setConversationId,
} from "@/fe/lib/uid";
import {
  getConversations,
  getMemory,
  deleteConversation as apiDeleteConversation,
  type ConversationMeta,
} from "@/fe/apis/conversations";
import { abortChat } from "@/fe/apis/chat";
import type { AgentMode } from "@/fe/apis/settings";

export type { ConversationMeta, AgentMode };

const AGENT_MODE_KEY = "agent_mode";
const VALID_MODES = new Set<AgentMode>([
  "text",
  "plan-and-solve",
  "react",
  "image-gen",
]);

function loadAgentMode(): AgentMode {
  if (typeof window === "undefined") return "text";
  const stored = localStorage.getItem(AGENT_MODE_KEY) as AgentMode | null;
  return stored && VALID_MODES.has(stored) ? stored : "text";
}

function saveAgentMode(mode: AgentMode) {
  if (typeof window !== "undefined") localStorage.setItem(AGENT_MODE_KEY, mode);
}

/** 后端存储的扁平消息结构 */
interface StoredMessage {
  role: "user" | "assistant" | "system";
  content: string;
  cardType: number;
}

/** 将后端扁平消息聚合为前端展示结构 */
function aggregateMessages(stored: StoredMessage[]): ChatMessage[] {
  const result: ChatMessage[] = [];
  for (const msg of stored) {
    if (msg.role === "user") {
      result.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      const last = result[result.length - 1];
      if (last && last.role === "assistant") {
        last.cards.push({
          cardType: msg.cardType as CardType,
          content: msg.content,
        });
      } else {
        result.push({
          role: "assistant",
          content: "",
          cards: [{ cardType: msg.cardType as CardType, content: msg.content }],
        });
      }
    }
  }
  return result;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationIdState] = useState<string>("");
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [agentMode, setAgentModeState] = useState<AgentMode>("text");
  const sseRef = useRef<{ close: () => void } | null>(null);

  useEffect(() => {
    setConversationIdState(getConversationId());
    setAgentModeState(loadAgentMode());
    return () => {
      sseRef.current?.close();
    };
  }, []);

  const setAgentMode = useCallback((mode: AgentMode) => {
    setAgentModeState(mode);
    saveAgentMode(mode);
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
    setMessages(aggregateMessages(cached as StoredMessage[]));
  }, []);

  const deleteConversation = useCallback(
    async (cid: string) => {
      await apiDeleteConversation(cid);
      // 若删除的是当前会话，切换到新对话
      if (cid === conversationId) {
        sseRef.current?.close();
        sseRef.current = null;
        const newCid = createNewConversationId();
        setConversationIdState(newCid);
        setMessages([]);
        setLoading(false);
      }
      await loadConversationList();
    },
    [conversationId, loadConversationList],
  );

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
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", cards: [] },
      ]);

      const cid = conversationId;
      sseRef.current?.close();
      sseRef.current = connectChatSse({
        uid: getUid(),
        conversationId: cid,
        content: text,
        agentMode,
        onToken: (cardType: CardType, token: string) => {
          setMessages((prev) => {
            const updated = [...prev];
            const assistantMsg = updated[assistantIndex];
            if (!assistantMsg || assistantMsg.role !== "assistant") return prev;

            const cards = [...assistantMsg.cards];
            const last = cards[cards.length - 1];

            if (!last || last.cardType !== cardType) {
              cards.push({ cardType, content: token });
            } else {
              cards[cards.length - 1] = {
                ...last,
                content: last.content + token,
              };
            }

            updated[assistantIndex] = { ...assistantMsg, cards };
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
            const assistantMsg = updated[assistantIndex];
            if (!assistantMsg || assistantMsg.role !== "assistant") return prev;
            updated[assistantIndex] = {
              ...assistantMsg,
              cards: [
                ...assistantMsg.cards,
                { cardType: CardType.Error, content: err.message },
              ],
            };
            return updated;
          });
        },
      });
    },
    [messages, loading, conversationId, agentMode, loadConversationList],
  );

  return {
    messages,
    loading,
    agentMode,
    setAgentMode,
    sendText,
    abort,
    newChat,
    deleteConversation,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  };
}
