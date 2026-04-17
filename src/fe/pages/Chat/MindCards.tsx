import { useEffect, useState, useCallback } from "react";
import { getUid } from "@/fe/lib/uid";

interface MindCard {
  title: string;
  desc: string;
  prompt: string;
}

interface MindCardsProps {
  onSelect: (prompt: string) => void;
}

export function MindCards({ onSelect }: MindCardsProps) {
  const [cards, setCards] = useState<MindCard[]>([]);

  const fetchCards = useCallback(() => {
    fetch(`/api/mindcards?uid=${encodeURIComponent(getUid())}`)
      .then((r) => r.json())
      .then((data: MindCard[]) => setCards(data));
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  if (cards.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, i) => (
          <button
            key={i}
            onClick={() => onSelect(card.prompt)}
            className="rounded-xl border border-gray-200 p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-[#3f3f46] dark:hover:border-[#52525b] dark:hover:bg-[#2f2f2f]"
          >
            <p className="mb-1 text-sm font-medium text-gray-800 dark:text-gray-100">{card.title}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{card.desc}</p>
          </button>
        ))}
      </div>
      <div className="mt-3 flex justify-center">
        <button
          onClick={fetchCards}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          换一批
        </button>
      </div>
    </div>
  );
}
