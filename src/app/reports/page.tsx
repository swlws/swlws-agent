"use client";

import dynamic from "next/dynamic";

const ReportsList = dynamic(() => import("@/fe/pages/Reports"), {
  ssr: false,
  loading: () => <p className="px-6 py-10 text-gray-500">加载中…</p>,
});

export default function ReportsListPage() {
  return <ReportsList />;
}
