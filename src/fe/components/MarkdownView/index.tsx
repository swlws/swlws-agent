"use client";

import React from "react";

type InlineNode = React.ReactNode;

function parseInline(text: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  const re =
    /(\[([^\]]+)\]\(([^)]+)\))|(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  // `exec` 会更新 lastIndex（因为是 global）
  while ((match = re.exec(text))) {
    const index = match.index;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));

    // Groups:
    // 2: link text, 3: url
    // 5: inline code
    // 7: bold
    // 9: italic
    const linkText = match[2];
    const url = match[3];
    const inlineCode = match[5];
    const boldText = match[7];
    const italicText = match[9];

    if (typeof linkText === "string" && typeof url === "string") {
      nodes.push(
        <a
          key={`${index}-a`}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          {linkText}
        </a>,
      );
    } else if (typeof inlineCode === "string") {
      nodes.push(
        <code
          key={`${index}-c`}
          className="rounded bg-gray-100 px-1 py-[1px] font-mono text-[13px] text-gray-900 dark:bg-[#2a2a2a] dark:text-gray-100"
        >
          {inlineCode}
        </code>,
      );
    } else if (typeof boldText === "string") {
      nodes.push(
        <strong key={`${index}-b`} className="font-semibold">
          {boldText}
        </strong>,
      );
    } else if (typeof italicText === "string") {
      nodes.push(
        <em key={`${index}-i`} className="italic">
          {italicText}
        </em>,
      );
    } else {
      // 不太可能到这里，但保底
      nodes.push(match[0]);
    }

    lastIndex = re.lastIndex;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

export default function MarkdownView({ content }: { content: string }) {
  const lines = content.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    // 空行直接跳过（用于段落分隔）
    if (!trimmed) {
      i++;
      continue;
    }

    // 代码块 ```lang\n...\n```
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      let j = i + 1;
      const codeLines: string[] = [];
      while (j < lines.length && !(lines[j] ?? "").trim().startsWith("```")) {
        codeLines.push(lines[j] ?? "");
        j++;
      }

      // 未找到闭合 ```：当作普通文本（避免流式未闭合导致渲染错）
      if (j >= lines.length) {
        const fallback = lines.slice(i).join("\n");
        blocks.push(
          <p key={`p-${i}`} className="whitespace-pre-wrap break-words">
            {parseInline(fallback)}
          </p>,
        );
        break;
      }

      const code = codeLines.join("\n");
      blocks.push(
        <pre
          key={`code-${i}`}
          className="my-2 overflow-x-auto rounded-xl bg-[#0b0b0b] p-3 text-[13.5px] text-gray-100 dark:bg-black"
        >
          <code className="font-mono">
            {code}
            {lang ? (
              <span className="sr-only">{lang}</span>
            ) : null}
          </code>
        </pre>,
      );

      i = j + 1;
      continue;
    }

    // 标题：# / ## / ...
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const Tag = `h${Math.min(6, Math.max(1, level))}` as unknown as React.ElementType;
      blocks.push(
        <Tag
          key={`h-${i}`}
          className="my-2 break-words font-semibold tracking-tight"
        >
          {parseInline(text)}
        </Tag>,
      );
      i++;
      continue;
    }

    // 列表：- xxx / * xxx / 1. xxx
    const unorderedMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    const orderedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (unorderedMatch || orderedMatch) {
      const isOrdered = Boolean(orderedMatch);
      const ListTag = (isOrdered ? "ol" : "ul") as unknown as React.ElementType;
      const items: string[] = [];

      let j = i;
      while (j < lines.length) {
        const t = (lines[j] ?? "").trim();
        if (!t) break;

        const u = t.match(/^[-*+]\s+(.+)$/);
        const o = t.match(/^\d+\.\s+(.+)$/);
        if ((isOrdered && o) || (!isOrdered && u)) {
          items.push(isOrdered ? (o?.[1] ?? "") : (u?.[1] ?? ""));
          j++;
          continue;
        }
        break;
      }

      blocks.push(
        <ListTag key={`list-${i}`} className="my-2 list-inside pl-5">
          {items.map((it, idx) => (
            <li key={`${i}-${idx}`} className="my-1 break-words">
              {parseInline(it)}
            </li>
          ))}
        </ListTag>,
      );

      i = j;
      continue;
    }

    // 引用：> ...
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const t = (lines[j] ?? "").trim();
        if (!t) break;
        if (t.startsWith(">")) {
          quoteLines.push(t.replace(/^>\s?/, ""));
          j++;
          continue;
        }
        break;
      }
      blocks.push(
        <blockquote
          key={`q-${i}`}
          className="my-2 border-l-2 border-gray-300 pl-3 italic dark:border-gray-700"
        >
          {quoteLines.map((ql, idx) => (
            <p key={`${i}-q-${idx}`} className="break-words">
              {parseInline(ql)}
            </p>
          ))}
        </blockquote>,
      );
      i = j;
      continue;
    }

    // 段落：连续非空行聚合，直到遇到空行/块起始符
    const paraLines: string[] = [];
    let j = i;
    while (j < lines.length) {
      const t = (lines[j] ?? "").trim();
      if (!t) break;
      if (t.startsWith("```")) break;
      if (t.match(/^(#{1,6})\s+/)) break;
      if (t.match(/^[-*+]\s+/)) break;
      if (t.match(/^\d+\.\s+/)) break;
      if (t.startsWith(">")) break;
      paraLines.push(lines[j] ?? "");
      j++;
    }

    const paraText = paraLines.join("\n");
    blocks.push(
      <p key={`p-${i}`} className="my-2 break-words">
        {paraText.split("\n").map((pl, idx) => (
          <React.Fragment key={`${i}-pl-${idx}`}>
            {parseInline(pl)}
            {idx < paraText.split("\n").length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </p>,
    );

    i = j;
  }

  return <>{blocks}</>;
}
