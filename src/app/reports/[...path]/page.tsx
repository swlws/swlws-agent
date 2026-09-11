"use client";

import { use } from "react";
import dynamic from "next/dynamic";

const ReportDetail = dynamic(() => import("@/fe/pages/Reports/Detail"), {
  ssr: false,
  loading: () => <p className="px-6 py-10 text-gray-500">加载中…</p>,
});

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: segments } = use(params);
  return <ReportDetail relPath={segments.join("/")} />;
}
