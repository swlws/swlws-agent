import { NextRequest, NextResponse } from "next/server";
import { abortByConversation } from "@/be/services/abortRegistry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { uid, conversationId } = (await req.json()) as { uid?: string; conversationId?: string };
  abortByConversation(uid ?? "anonymous", conversationId ?? "");
  return NextResponse.json({ ok: true });
}
