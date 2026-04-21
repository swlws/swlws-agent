interface LoadingDotsProps {
  className?: string;
}

export function LoadingDots({ className = "gap-1" }: LoadingDotsProps) {
  return (
    <span className={`inline-flex ${className}`}>
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
    </span>
  );
}
