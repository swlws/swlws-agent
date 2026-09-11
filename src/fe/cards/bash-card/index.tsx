import { useState } from "react";

interface BashBlock {
  command: string;
  output: string;
  isError?: boolean;
}

interface BashCardProps {
  /** 一或多个以 \x1e 分隔的 JSON 块（同轮并行工具调用会合并进同一张卡） */
  content: string;
  streaming?: boolean;
}

/** 解析累积的行分隔 JSON 块；流式中途可能是不完整 JSON，容错跳过 */
function parseBlocks(content: string): BashBlock[] {
  return content
    .split("\x1e")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((chunk) => {
      try {
        return JSON.parse(chunk) as BashBlock;
      } catch {
        return null;
      }
    })
    .filter((b): b is BashBlock => b !== null);
}

export function BashCard({ content, streaming = false }: BashCardProps) {
  const [expanded, setExpanded] = useState(true);
  const blocks = parseBlocks(content);
  if (blocks.length === 0) return null;

  const title =
    blocks.length === 1 ? blocks[0].command : `${blocks.length} 条命令`;

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-gray-700 bg-[#1e1e1e]">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:text-white"
      >
        <span
          className={`inline-block shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : "rotate-0"}`}
        >
          ▶
        </span>
        <span className="shrink-0 font-medium">终端</span>
        <span className="min-w-0 flex-1 truncate font-mono text-xs text-gray-500">
          {title}
        </span>
        {streaming && (
          <span className="ml-auto shrink-0 text-xs text-green-400">
            执行中…
          </span>
        )}
      </button>

      {expanded && (
        <div className="border-t border-gray-700">
          {blocks.map((block, idx) => (
            <div
              key={idx}
              className={
                idx > 0 ? "border-t border-gray-800 px-3 py-2" : "px-3 py-2"
              }
            >
              <div className="flex gap-2 font-mono text-xs text-green-400">
                <span className="shrink-0 select-none">$</span>
                <span className="whitespace-pre-wrap break-all">
                  {block.command}
                </span>
              </div>
              {block.output && (
                <pre
                  className={`mt-1 max-h-80 overflow-auto whitespace-pre-wrap break-all font-mono text-xs ${
                    block.isError ? "text-red-400" : "text-gray-300"
                  }`}
                >
                  {block.output}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
