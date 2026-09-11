"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReportList } from "@/fe/apis/reports";

interface TreeGroup {
  name: string;
  files: { label: string; path: string }[];
}

/** 扁平相对路径按首段（skill 目录）归组；剩余段作为文件标签 */
function buildTree(files: string[]): TreeGroup[] {
  const map = new Map<string, TreeGroup["files"]>();
  for (const f of files) {
    const idx = f.indexOf("/");
    const group = idx === -1 ? "" : f.slice(0, idx);
    const label = idx === -1 ? f : f.slice(idx + 1);
    if (!map.has(group)) map.set(group, []);
    map.get(group)!.push({ label, path: f });
  }
  return [...map.entries()].map(([name, files]) => ({ name, files }));
}

function GroupNode({ group }: { group: TreeGroup }) {
  const [expanded, setExpanded] = useState(true);
  const title = group.name || "(根目录)";

  return (
    <div className="rounded-lg border border-gray-200 dark:border-[#3f3f46]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
      >
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : "rotate-0"}`}
        >
          ▶
        </span>
        <span className="break-all">{title}</span>
        <span className="ml-auto shrink-0 text-xs text-gray-400">
          {group.files.length}
        </span>
      </button>

      {expanded && (
        <ul className="border-t border-gray-200 py-1 dark:border-[#3f3f46]">
          {group.files.map((file) => (
            <li key={file.path}>
              <Link
                href={`/reports/${file.path}`}
                className="block break-all py-1.5 pl-9 pr-3 font-mono text-sm text-blue-600 transition-colors hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-[#1f1f22]"
              >
                {file.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ReportsList() {
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getReportList()
      .then((r) => setFiles(r.files))
      .catch((e) => setError(e instanceof Error ? e.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  const tree = buildTree(files);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-4 text-sm">
        <Link
          href="/"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          ← 返回首页
        </Link>
      </div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        报告列表
      </h1>
      {loading && <p className="text-gray-500">加载中…</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && files.length === 0 && (
        <p className="text-gray-500">暂无报告产出。</p>
      )}
      <div className="space-y-3">
        {tree.map((group) => (
          <GroupNode key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}
