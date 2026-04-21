interface FormRowProps {
  label: string;
  hint: string;
  children: React.ReactNode;
}

export function FormRow({ label, hint, children }: FormRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-100">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
