import { CloseButton } from "@/fe/components/PanelHeader";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: string;
  children: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  width = "w-72",
  children,
}: DrawerProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/30" onClick={onClose} />
      )}
      <div
        className={`fixed right-0 top-0 z-30 flex h-full ${width} flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-[#1a1a1a] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-[#3f3f46]">
          <span className="font-medium text-gray-800 dark:text-gray-100">
            {title}
          </span>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
