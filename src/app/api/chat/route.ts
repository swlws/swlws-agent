import { NextRequest } from "next/server";
import { createChatSseResponse } from "@/be/services/chatSseService";
import type { AgentMode } from "@/be/config/settings";

const VALID_MODES = new Set<AgentMode>(["direct", "plan-and-solve", "react"]);

function parseAgentMode(value: string | null): AgentMode | undefined {
  return value && VALID_MODES.has(value as AgentMode)
    ? (value as AgentMode)
    : undefined;
}

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { uid, conversationId, content, agentMode } = (await req.json()) as {
    uid?: string;
    conversationId?: string;
    content: string;
    agentMode?: string;
  };

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(
    uid ?? "anonymous",
    conversationId ?? "default",
    content,
    parseAgentMode(agentMode ?? null),
  );
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const uid = url.searchParams.get("uid") ?? "anonymous";
  const conversationId = url.searchParams.get("conversationId") ?? "default";
  const content = url.searchParams.get("content");

  if (!content?.trim()) {
    return new Response("content is required", { status: 400 });
  }

  return createChatSseResponse(
    uid,
    conversationId,
    content,
    parseAgentMode(url.searchParams.get("agentMode")),
  );
}
