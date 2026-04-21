import { CloseButton } from "@/fe/components/CloseButton";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  maxWidth?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  maxWidth = "max-w-sm",
  children,
  footer,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl dark:bg-[#2a2a2a]`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-[#3f3f46]">
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </span>
          <CloseButton onClick={onClose} />
        </div>
        <div>{children}</div>
        {footer && <div>{footer}</div>}
      </div>
    </div>
  );
}
