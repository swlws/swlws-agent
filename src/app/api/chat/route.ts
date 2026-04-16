import { NextRequest } from "next/server";
import { createChatSseResponse, ChatMessage } from "@/be/services/chatSseService";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatMessage[] };

  if (!messages?.length) {
    return new Response("messages is required", { status: 400 });
  }

  return createChatSseResponse(messages);
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const raw = url.searchParams.get("messages");

  if (!raw) {
    return new Response("messages is required", { status: 400 });
  }

  try {
    const messages = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("messages is required", { status: 400 });
    }
    return createChatSseResponse(messages);
  } catch {
    return new Response("messages is invalid", { status: 400 });
  }
}
