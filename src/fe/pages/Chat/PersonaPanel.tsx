import { useEffect, useState } from "react";
import { LoadingDots } from "@/fe/components/LoadingDots";
import { Drawer } from "@/fe/components/Drawer";
import { fetchWithUid } from "@/fe/lib/api";

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
    fetchWithUid("/api/persona")
      .then((r) => r.json())
      .then((data: Persona | null) => setPersona(data))
      .finally(() => setLoading(false));
  }, [isOpen]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="人物画像">
      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingDots />
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
    </Drawer>
  );
}
