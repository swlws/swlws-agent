"use client";

import { useState, useCallback, useMemo, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopySuccessIcon, CopyClipboardIcon } from "@/fe/components/icons";

function extractText(node: React.ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node !== null && typeof node === "object") {
    const el = node as React.ReactElement<{ children?: React.ReactNode }>;
    if ("props" in el) return extractText(el.props.children);
  }
  return "";
}

const MemoizedImage = memo(function MemoizedImage({
  src,
  alt,
}: {
  src?: string;
  alt?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className="my-3 max-w-full rounded-lg shadow-sm transition-opacity duration-300"
      loading="lazy"
    />
  );
});

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = extractText(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <pre className="group relative my-2 rounded-xl bg-[#0b0b0b] p-3 text-[13.5px] whitespace-pre-wrap break-words dark:bg-black [&>code]:bg-transparent [&>code]:text-gray-100 [&>code]:p-0">
      <button
        onClick={handleCopy}
        title="复制代码"
        className="absolute right-2 top-2 rounded-md p-1.5 text-gray-500 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-gray-200"
      >
        {copied ? (
          <CopySuccessIcon />
        ) : (
          <CopyClipboardIcon />
        )}
      </button>
      {children}
    </pre>
  );
}

export default function MarkdownView({ content }: { content: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: any = useMemo(
    () => ({
      a: ({
        children,
        href,
      }: {
        children?: React.ReactNode;
        href?: string;
      }) => (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline dark:text-blue-400"
        >
          {children}
        </a>
      ),
      code: ({
        children,
        className,
      }: {
        children?: React.ReactNode;
        className?: string;
      }) => {
        const isBlock = className?.startsWith("language-");
        return isBlock ? (
          <code className={`${className} whitespace-pre-wrap break-words`}>
            {children}
          </code>
        ) : (
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm break-words dark:bg-[#2a2a2a]">
            {children}
          </code>
        );
      },
      table: ({ children }: { children?: React.ReactNode }) => (
        <div className="my-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">{children}</table>
        </div>
      ),
      thead: ({ children }: { children?: React.ReactNode }) => (
        <thead className="bg-gray-100 dark:bg-[#2a2a2a]">{children}</thead>
      ),
      th: ({ children }: { children?: React.ReactNode }) => (
        <th className="border border-gray-300 px-3 py-2 text-left font-semibold dark:border-[#4a4a4a]">
          {children}
        </th>
      ),
      td: ({ children }: { children?: React.ReactNode }) => (
        <td className="border border-gray-300 px-3 py-2 dark:border-[#4a4a4a]">
          {children}
        </td>
      ),
      img: ({ src, alt }: { src?: string; alt?: string }) => (
        <MemoizedImage src={src} alt={alt} />
      ),
      pre: ({ children }: { children?: React.ReactNode }) => (
        <CodeBlock>{children}</CodeBlock>
      ),
    }),
    [],
  );

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
