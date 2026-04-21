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

interface PanelHeaderProps {
  title: string;
  onClose: () => void;
  className?: string;
  titleClassName?: string;
}

export function PanelHeader({ title, onClose, className = "", titleClassName = "" }: PanelHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#3f3f46] ${className}`}
    >
      <span className={`font-medium text-gray-800 dark:text-gray-100 ${titleClassName}`}>{title}</span>
      <CloseButton onClick={onClose} />
    </div>
  );
}
