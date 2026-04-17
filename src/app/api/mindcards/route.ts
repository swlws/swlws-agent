import { NextRequest, NextResponse } from "next/server";
import { loadMindCardsData } from "@/be/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? "anonymous";
  const data = await loadMindCardsData(uid);
  const all = data.cards;
  if (all.length <= 4) return NextResponse.json(all);

  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return NextResponse.json(shuffled.slice(0, 4));
}
