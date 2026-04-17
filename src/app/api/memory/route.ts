import { NextRequest, NextResponse } from "next/server";
import { loadConversation } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const conversationId = req.nextUrl.searchParams.get("conversationId") ?? "default";
  const conv = await loadConversation(uid, conversationId);
  return NextResponse.json(conv.messages);
}
