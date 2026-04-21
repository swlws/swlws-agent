import { useEffect, useState, useCallback } from "react";
import { getIcon } from "@/fe/lib/icons";
import { getMindCards, type MindCard } from "@/fe/apis/mindcards";
import { ArrowRightIcon, RefreshIcon } from "@/fe/components/icons";

interface MindCardsProps {
  onSelect: (prompt: string) => void;
}

export function MindCards({ onSelect }: MindCardsProps) {
  const [cards, setCards] = useState<MindCard[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCards = useCallback(() => {
    setIsRefreshing(true);
    getMindCards()
      .then((data) => {
        setCards(data);
        setTimeout(() => setIsRefreshing(false), 500);
      })
      .catch(() => setIsRefreshing(false));
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (cards.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => onSelect(card.prompt)}
            className="group relative flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md dark:border-[#3f3f46] dark:bg-[#27272a] dark:hover:border-blue-500/50 dark:hover:shadow-blue-900/10"
          >
            <div className="mb-1.5 flex w-full items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="shrink-0 text-lg">{getIcon(card.title)}</span>
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {card.title}
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-gray-50 p-1 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white/5">
                <ArrowRightIcon className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">
              {card.desc}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-4 flex justify-center">
        <button
          onClick={fetchCards}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "正在刷新..." : "换一批灵感"}
        </button>
      </div>
    </div>
  );
}
