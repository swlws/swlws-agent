"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import MarkdownView from "@/fe/cards/mardown-card";
import { getReportMarkdown } from "@/fe/apis/reports";

export default function ReportDetail({ relPath }: { relPath: string }) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportMarkdown(relPath)
      .then(setContent)
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, [relPath]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-gray-900 dark:text-gray-100">
      <div className="mb-4 text-sm">
        <Link
          href="/reports"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← 返回报告列表
        </Link>
      </div>
      <div className="mb-6 break-all font-mono text-xs text-gray-500">
        {relPath}
      </div>
      {loading && <p className="text-gray-500">加载中…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && <MarkdownView content={content} />}
    </div>
  );
}
