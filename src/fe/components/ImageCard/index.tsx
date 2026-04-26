import { useState } from "react";
import { CopyClipboardIcon, CopySuccessIcon } from "../icons";

interface ImageCardProps {
  url: string;
}

export function ImageCard({ url }: ImageCardProps) {
  const [copied, setCopied] = useState(false);
  let displayUrl = url;
  if (url && !url.startsWith("http")) {
    const match = url.match(/!\[.*?\]\((.*?)\)/);
    if (match && match[1]) {
      displayUrl = match[1];
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="my-4 group relative inline-block max-w-full">
      <div className="p-2 bg-white dark:bg-[#202123] rounded-xl border border-gray-200 dark:border-[#4a4a4a] shadow-sm transition-all hover:shadow-md">
        <img
          src={displayUrl}
          alt="generated"
          className="max-w-full rounded-lg block"
        />
      </div>

      <button
        onClick={handleCopy}
        className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-[#4a4a4a] opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm hover:bg-white dark:hover:bg-black"
        title="Copy URL"
      >
        <span
          className={
            copied ? "text-green-500" : "text-gray-600 dark:text-gray-400"
          }
        >
          {copied ? (
            <CopySuccessIcon size={16} />
          ) : (
            <CopyClipboardIcon size={16} />
          )}
        </span>
      </button>
    </div>
  );
}
