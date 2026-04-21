import { CloseIcon } from "@/fe/components/icons";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
}

export function CloseButton({ onClick, className = "" }: CloseButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#2f2f2f] ${className}`}
    >
      <CloseIcon />
    </button>
  );
}
