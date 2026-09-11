import { readdir } from "fs/promises";
import path from "path";
import { REPORTS_DIR } from "@/be/config/paths";

export const runtime = "nodejs";

/** 递归收集 REPORTS_DIR 下所有 .md 的相对路径（POSIX 风格，供 URL 使用） */
async function collectMarkdown(dir: string, base: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const results: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectMarkdown(abs, rel)));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(rel.split(path.sep).join("/"));
    }
  }
  return results;
}

export async function GET() {
  const files = (await collectMarkdown(REPORTS_DIR, "")).sort().reverse();
  return Response.json({ files });
}
