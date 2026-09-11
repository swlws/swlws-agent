import { httpRequest } from "@/fe/lib/http";

export function getReportList(): Promise<{ files: string[] }> {
  return httpRequest("/api/reports");
}

/** 拉取单个报告的原始 markdown 文本（非 JSON，故直接 fetch） */
export async function getReportMarkdown(relPath: string): Promise<string> {
  const encoded = relPath
    .split("/")
    .map((s) => encodeURIComponent(s))
    .join("/");
  const res = await fetch(`/api/reports/${encoded}`);
  if (!res.ok) {
    throw new Error(`加载报告失败（${res.status}）`);
  }
  return res.text();
}
