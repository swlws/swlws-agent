import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const session = await loadSession(uid);
  return NextResponse.json(session.persona ?? null);
}
