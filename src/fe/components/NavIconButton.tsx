interface NavIconButtonProps {
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
  label?: string;
  showLabel?: boolean;
}

export function NavIconButton({
  onClick,
  title,
  icon,
  label,
  showLabel = false,
}: NavIconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2f2f2f] dark:hover:text-gray-100"
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
        {icon}
      </span>
      {label !== undefined && (
        <span
          className={`overflow-hidden whitespace-nowrap text-[13px] transition-all duration-200 ${showLabel ? "w-auto opacity-100" : "w-0 opacity-0"}`}
        >
          {showLabel ? label : ""}
        </span>
      )}
    </button>
  );
}
