import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { REPORTS_DIR } from "@/be/config/paths";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;

  // 逐段校验：仅允许文件名字符，拒绝 .. 与路径分隔符，防目录穿越
  const safe = segments.every((s) => /^[\w.-]+$/.test(s) && s !== "..");
  if (!safe || segments.length === 0) {
    return new Response("Invalid report path", { status: 400 });
  }

  const rel = segments.join("/");
  if (!rel.endsWith(".md")) {
    return new Response("Only .md reports are served", { status: 400 });
  }

  const filePath = path.join(REPORTS_DIR, ...segments);
  // 二次校验：解析后的绝对路径必须仍在 REPORTS_DIR 内
  if (!filePath.startsWith(REPORTS_DIR + path.sep)) {
    return new Response("Invalid report path", { status: 400 });
  }

  let markdown: string;
  try {
    markdown = await readFile(filePath, "utf-8");
  } catch {
    return new Response("Report not found", { status: 404 });
  }

  return new Response(markdown, {
    status: 200,
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
