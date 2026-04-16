import fs from "fs/promises";
import path from "path";
import { Message as ChatMessage } from "@/be/lib/llm";

export type { ChatMessage };

export type MemoryType = "context" | "preference" | "decision" | "fact";

/**
 * A single typed memory entry, inspired by Claude Code's memory structure.
 * - description: one-line hook used to judge relevance (shown as index)
 * - content: full detail injected into the system prompt
 */
export interface Memory {
  type: MemoryType;
  description: string;
  content: string;
}

export interface PersonaTrait {
  dimension: string;
  value: string;
}

export interface Persona {
  summary: string;
  traits: PersonaTrait[];
  updatedAt: string;
}

export interface Session {
  memories: Memory[];
  messages: ChatMessage[];
  persona?: Persona;
}

const SESSIONS_DIR = path.join(process.cwd(), ".sessions");

async function ensureDir(): Promise<void> {
  await fs.mkdir(SESSIONS_DIR, { recursive: true });
}

export async function loadSession(uid: string): Promise<Session> {
  const file = path.join(SESSIONS_DIR, `${uid}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as Session;
  } catch {
    return { memories: [], messages: [] };
  }
}

export async function saveSession(uid: string, session: Session): Promise<void> {
  await ensureDir();
  const file = path.join(SESSIONS_DIR, `${uid}.json`);
  await fs.writeFile(file, JSON.stringify(session, null, 2), "utf-8");
}
