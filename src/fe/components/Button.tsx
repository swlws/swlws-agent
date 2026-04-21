interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  children: React.ReactNode;
}

const variantClass: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "rounded-lg bg-[#202123] px-4 py-1.5 text-sm text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200",
  outline:
    "rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-[#4a4a4a] dark:text-gray-300 dark:hover:bg-[#3a3a3a]",
  ghost:
    "text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`${variantClass[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
