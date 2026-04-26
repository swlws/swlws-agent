import { useState } from "react";
import MarkdownView from "@/fe/cards/mardown-card";

interface CotCardProps {
  content: string;
  streaming?: boolean;
}

export function CotCard({ content, streaming = false }: CotCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="my-2 rounded-lg border border-gray-200 dark:border-[#3f3f46]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <span
          className={`inline-block transition-transform duration-200 ${expanded ? "rotate-90" : "rotate-0"}`}
        >
          ▶
        </span>
        <span className="font-medium">思考过程</span>
        {streaming && (
          <span className="ml-auto text-xs text-blue-400 dark:text-blue-500">
            思考中…
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-200 px-3 py-2 dark:border-[#3f3f46]">
          <div className="border-l-2 border-gray-300 pl-3 text-sm italic text-gray-600 dark:border-[#555] dark:text-gray-400">
            <MarkdownView content={content} />
          </div>
        </div>
      )}
    </div>
  );
}
