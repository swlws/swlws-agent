import { NextRequest, NextResponse } from "next/server";
import { listConversations } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const metas = await listConversations(uid);
  return NextResponse.json(metas);
}
