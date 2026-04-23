import fs from "fs/promises";
import path from "path";
import { Message as ChatMessage } from "@/be/lib/text-llm";
import { SESSIONS_DIR } from "@/be/config/paths";

export type { ChatMessage };

// ─── Write Lock ──────────────────────────────────────────────────────────────

/** 每个文件路径对应一条串行写入队列，防止并发写覆盖 */
const writeLocks = new Map<string, Promise<void>>();

async function lockedWrite(filePath: string, data: string): Promise<void> {
  const prev = writeLocks.get(filePath) ?? Promise.resolve();
  let resolveCurrent!: () => void;
  const current = new Promise<void>((r) => { resolveCurrent = r; });
  writeLocks.set(filePath, current);
  try {
    await prev;
    await fs.writeFile(filePath, data, "utf-8");
  } finally {
    resolveCurrent();
    // 队列已清空时释放 Map 条目，避免内存泄漏
    if (writeLocks.get(filePath) === current) writeLocks.delete(filePath);
  }
}

export type MemoryType = "context" | "preference" | "decision" | "fact";

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

export interface MindCard {
  title: string;
  desc: string;
  prompt: string;
}

/** 单个会话的存储结构 */
export interface ConversationData {
  memories: Memory[];
  messages: ChatMessage[];
  /** 已纳入摘要的消息条数游标，用于判断是否触发重新生成摘要 */
  summarizedUpTo: number;
  /** 第一条用户消息，用于列表展示 */
  title?: string;
  createdAt: string;
  updatedAt: string;
}

/** 会话列表项（轻量，不含 messages） */
export interface ConversationMeta {
  conversationId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersonaData {
  persona: Persona | null;
  updatedAt: string;
}

export interface MindCardsData {
  cards: MindCard[];
  updatedAt: string;
}


function userDir(uid: string): string {
  return path.join(SESSIONS_DIR, "user", uid);
}

function conversationDir(uid: string): string {
  return path.join(userDir(uid), "conversation");
}

async function ensureUserDir(uid: string): Promise<void> {
  await fs.mkdir(userDir(uid), { recursive: true });
}

async function ensureConversationDir(uid: string): Promise<void> {
  await fs.mkdir(conversationDir(uid), { recursive: true });
}

// ─── Conversation ───────────────────────────────────────────────────────────

export async function loadConversation(uid: string, conversationId: string): Promise<ConversationData> {
  const file = path.join(conversationDir(uid), `${conversationId}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const data = JSON.parse(raw) as ConversationData;
    // 兼容旧文件：summarizedUpTo 字段缺失时默认为 0
    if (data.summarizedUpTo === undefined) data.summarizedUpTo = 0;
    return data;
  } catch {
    const now = new Date().toISOString();
    return { memories: [], messages: [], summarizedUpTo: 0, createdAt: now, updatedAt: now };
  }
}

export async function saveConversation(uid: string, conversationId: string, data: ConversationData): Promise<void> {
  await ensureConversationDir(uid);
  const file = path.join(conversationDir(uid), `${conversationId}.json`);
  await lockedWrite(file, JSON.stringify(data, null, 2));
}

export async function listConversations(uid: string): Promise<ConversationMeta[]> {
  const dir = conversationDir(uid);
  try {
    const entries = await fs.readdir(dir);
    const metas: ConversationMeta[] = [];
    for (const entry of entries) {
      if (!entry.endsWith(".json")) continue;
      const conversationId = entry.slice(0, -5);
      try {
        const raw = await fs.readFile(path.join(dir, entry), "utf-8");
        const data = JSON.parse(raw) as ConversationData;
        metas.push({
          conversationId,
          title: data.title ?? "新对话",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      } catch {
        // skip corrupted file
      }
    }
    return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

// ─── Persona ────────────────────────────────────────────────────────────────

export async function loadPersonaData(uid: string): Promise<PersonaData> {
  const file = path.join(userDir(uid), "persona.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as PersonaData;
  } catch {
    return { persona: null, updatedAt: new Date(0).toISOString() };
  }
}

export async function savePersonaData(uid: string, data: PersonaData): Promise<void> {
  await ensureUserDir(uid);
  const file = path.join(userDir(uid), "persona.json");
  await lockedWrite(file, JSON.stringify(data, null, 2));
}

// ─── MindCards ──────────────────────────────────────────────────────────────

export async function loadMindCardsData(uid: string): Promise<MindCardsData> {
  const file = path.join(userDir(uid), "mindcards.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as MindCardsData;
  } catch {
    return { cards: [], updatedAt: new Date(0).toISOString() };
  }
}

export async function saveMindCardsData(uid: string, data: MindCardsData): Promise<void> {
  await ensureUserDir(uid);
  const file = path.join(userDir(uid), "mindcards.json");
  await lockedWrite(file, JSON.stringify(data, null, 2));
}

// ─── User Settings ───────────────────────────────────────────────────────────

export async function loadUserSettings(uid: string): Promise<Partial<import("@/be/config/settings").AppSettings>> {
  const file = path.join(userDir(uid), "setting.json");
  try {
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveUserSettings(uid: string, settings: Partial<import("@/be/config/settings").AppSettings>): Promise<void> {
  await ensureUserDir(uid);
  const file = path.join(userDir(uid), "setting.json");
  await lockedWrite(file, JSON.stringify(settings, null, 2));
}
