import Link from "next/link";

interface EntryCard {
  href: string;
  title: string;
  desc: string;
  icon: string;
}

const ENTRIES: EntryCard[] = [
  {
    href: "/chat",
    title: "对话 Chat",
    desc: "与 Agent 实时对话，调用工具、技能与 MCP 完成任务。",
    icon: "💬",
  },
  {
    href: "/reports",
    title: "报告 Reports",
    desc: "查看技能产出的监控巡检与统计分析报告。",
    icon: "📊",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
        swlws agent
      </h1>
      <p className="mb-10 text-gray-500 dark:text-gray-400">
        选择一个入口开始
      </p>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        {ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className="group rounded-xl border border-gray-200 p-6 transition-colors hover:border-blue-400 hover:bg-gray-50 dark:border-[#3f3f46] dark:hover:border-blue-500 dark:hover:bg-[#1f1f22]"
          >
            <div className="mb-3 text-3xl">{entry.icon}</div>
            <h2 className="mb-1 text-lg font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
              {entry.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {entry.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
