'use client';

import type { McpServerStatus } from "@/fe/apis/mcp";
import type { SkillMeta } from "@/fe/apis/skills";

interface SlashMenuProps {
  mcpServers: McpServerStatus[];
  skills: SkillMeta[];
  activeIndex: number;
  onSelect: (command: string) => void;
}

export function SlashMenu({ mcpServers, skills, activeIndex, onSelect }: SlashMenuProps) {
  const hasMcp = mcpServers.length > 0;
  const hasSkills = skills.length > 0;
  const isEmpty = !hasMcp && !hasSkills;

  // Build flat list of commands for consistent indexing
  const flatItems: string[] = [
    ...mcpServers.map((s) => `@${s.name} `),
    ...skills.map((s) => (s.command ? `${s.command} ` : `/${s.name} `)),
  ];

  const mcpOffset = 0;
  const skillOffset = mcpServers.length;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-[#3f3f46] dark:bg-[#2f2f2f] z-50 overflow-hidden">
      {isEmpty ? (
        <div className="px-3 py-4 text-sm text-center text-gray-400 dark:text-gray-500">
          无匹配项
        </div>
      ) : (
        <>
          {hasMcp && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                MCP
              </div>
              {mcpServers.map((server, i) => {
                const idx = mcpOffset + i;
                return (
                  <button
                    key={server.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(flatItems[idx]);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                      activeIndex === idx
                        ? "bg-gray-100 dark:bg-[#3a3a3a]"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#3a3a3a]"
                    }`}
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      @{server.name}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {server.status === "connected"
                        ? `${server.tools.length} 个工具`
                        : server.status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {hasMcp && hasSkills && (
            <div className="border-t border-gray-100 dark:border-[#3f3f46]" />
          )}

          {hasSkills && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                Skill
              </div>
              {skills.map((skill, i) => {
                const idx = skillOffset + i;
                return (
                  <button
                    key={skill.name}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(flatItems[idx]);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
                      activeIndex === idx
                        ? "bg-gray-100 dark:bg-[#3a3a3a]"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#3a3a3a]"
                    }`}
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-200">
                      {skill.command ?? `/${skill.name}`}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                      {skill.displayName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}