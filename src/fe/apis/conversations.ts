import { httpRequest } from "@/fe/lib/http";
import type { ChatMessage } from "@/fe/lib/chatSseClient";

export interface ConversationMeta {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function getConversations(): Promise<ConversationMeta[]> {
  return httpRequest("/api/conversations");
}

export function getMemory(conversationId: string): Promise<ChatMessage[]> {
  return httpRequest("/api/memory", { params: { conversationId } });
}
