import { useEffect, useState } from "react";
import { getUid } from "@/fe/lib/uid";

interface PersonaTrait {
  dimension: string;
  value: string;
}

interface Persona {
  summary: string;
  traits: PersonaTrait[];
  updatedAt: string;
}

interface PersonaPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PersonaPanel({ isOpen, onClose }: PersonaPanelProps) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch(`/api/persona?uid=${encodeURIComponent(getUid())}`)
      .then((r) => r.json())
      .then((data: Persona | null) => setPersona(data))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/30" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 z-30 flex h-full w-72 flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-[#1a1a1a] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#3f3f46]">
          <span className="font-medium text-gray-800 dark:text-gray-100">人物画像</span>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#2f2f2f]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="inline-flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
              </span>
            </div>
          ) : !persona ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              暂无画像，继续对话后生成
            </p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-[#2f2f2f]">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {persona.summary}
                </p>
              </div>
              <ul className="space-y-2">
                {persona.traits.map((t, i) => (
                  <li key={i} className="rounded-xl border border-gray-100 p-3 dark:border-[#2f2f2f]">
                    <span className="mb-1 block text-xs text-gray-400 dark:text-gray-500">
                      {t.dimension}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{t.value}</span>
                  </li>
                ))}
              </ul>
              <p className="text-right text-xs text-gray-300 dark:text-gray-600">
                {new Date(persona.updatedAt).toLocaleString("zh-CN")}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
