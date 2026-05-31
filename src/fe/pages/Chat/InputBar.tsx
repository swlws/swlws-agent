import { useState, useEffect, useCallback, useRef, memo } from "react";
import type { AgentMode } from "@/fe/apis/settings";
import { getMcpServers, type McpServerStatus } from "@/fe/apis/mcp";
import { getSkills, type SkillMeta } from "@/fe/apis/skills";
import { SlashMenu } from "./SlashMenu";

// line-height: 24px (leading-6), padding-top: 12px, padding-bottom: 4px
const LINE_HEIGHT = 24;
const PADDING_V = 12 + 4; // pt-3 + pb-1
const MIN_ROWS = 1;
const MAX_ROWS = 3;

interface InputBarProps {
  onSend: (value: string, deepThink?: boolean) => void;
  onAbort: () => void;
  disabled: boolean;
  loading: boolean;
  conversationId: string;
  agentMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
}

export const InputBar = memo(function InputBar({
  onSend,
  onAbort,
  disabled,
  loading,
  conversationId,
  agentMode,
  onModeChange,
}: InputBarProps) {
  const [value, setValue] = useState("");
  const [deepThink, setDeepThink] = useState(false);
  const [mcpServers, setMcpServers] = useState<McpServerStatus[]>([]);
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showSlashMenu = value === "/" && (mcpServers.length > 0 || skills.length > 0);

  useEffect(() => {
    let ignore = false;
    Promise.all([getMcpServers(), getSkills()]).then(([mcp, sk]) => {
      if (ignore) return;
      setMcpServers(mcp);
      setSkills(sk.filter((s) => s.enabled));
    });
    return () => { ignore = true; };
  }, []);

  // 每次内容变化时自适应高度，限制在 MIN_ROWS ~ MAX_ROWS 行
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const minH = LINE_HEIGHT * MIN_ROWS + PADDING_V;
    const maxH = LINE_HEIGHT * MAX_ROWS + PADDING_V;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, minH), maxH)}px`;
    el.style.overflowY = el.scrollHeight > maxH ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    setValue("");
  }, [conversationId]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed) {
      onSend(trimmed, deepThink);
      setValue("");
    }
  }, [value, onSend, deepThink]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && showSlashMenu) {
      setValue("");
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSlashSelect = (command: string) => {
    setValue(command);
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-white px-4 py-4 dark:border-[#3f3f46] dark:bg-[#212121] sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="relative rounded-3xl border border-gray-300 bg-white shadow-sm transition-colors focus-within:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:focus-within:border-[#666]">
          {showSlashMenu && (
            <SlashMenu
              mcpServers={mcpServers}
              skills={skills}
              onSelect={handleSlashSelect}
            />
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息…"
            disabled={disabled}
            className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-6 text-gray-900 outline-none placeholder:text-gray-500 disabled:opacity-50 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-3 pb-3">
            {/* 左下角：功能按钮 */}
            <div className="flex items-center gap-2">
              <select
                value={agentMode}
                onChange={(e) => onModeChange(e.target.value as AgentMode)}
                disabled={loading}
                className="rounded-full border border-gray-300 bg-white py-1.5 pl-3 pr-2 text-sm text-gray-700 outline-none transition-colors hover:border-gray-400 disabled:opacity-50 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-300 dark:hover:border-[#666]"
              >
                <option value="text">文本处理</option>
                <option value="image-gen">生成图片</option>
                <option value="react">ReAct</option>
                <option value="plan-and-solve">PlanAndSolve</option>
                <option value="reflection">Reflection</option>
              </select>
            </div>

            {/* 右下角：发送 / 停止按钮 */}
            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600 select-none dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={deepThink}
                  onChange={(e) => setDeepThink(e.target.checked)}
                  disabled={loading}
                  className="h-3.5 w-3.5 accent-[#202123] dark:accent-white"
                />
                深度思考
              </label>
              {loading ? (
                <button
                  onClick={onAbort}
                  className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-100 dark:border-[#4a4a4a] dark:text-gray-300 dark:hover:border-[#666] dark:hover:bg-[#3a3a3a]"
                >
                  停止
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!value.trim()}
                  className="rounded-full bg-[#202123] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200"
                >
                  发送
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
