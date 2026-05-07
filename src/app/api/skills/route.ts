import { NextRequest, NextResponse } from "next/server";
import { skillManager } from "@/be/engine/skills";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(skillManager.getSkillList());
}

export async function PATCH(req: NextRequest) {
  const { name, action } = (await req.json()) as {
    name?: string;
    action?: string;
  };
  if (!name || (action !== "enable" && action !== "disable")) {
    return NextResponse.json(
      { error: "name and action (enable|disable) are required" },
      { status: 400 },
    );
  }
  await skillManager.setEnabled(name, action === "enable");
  return NextResponse.json({ ok: true });
}

export async function POST() {
  await skillManager.reload();
  return NextResponse.json({ ok: true });
}
