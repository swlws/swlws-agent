'use client';

import type { McpServerStatus } from "@/fe/apis/mcp";
import type { SkillMeta } from "@/fe/apis/skills";

interface SlashMenuProps {
  mcpServers: McpServerStatus[];
  skills: SkillMeta[];
  onSelect: (command: string) => void;
}

export function SlashMenu({ mcpServers, skills, onSelect }: SlashMenuProps) {
  const hasMcp = mcpServers.length > 0;
  const hasSkills = skills.length > 0;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-[#3f3f46] dark:bg-[#2f2f2f] z-50 overflow-hidden">
      {hasMcp && (
        <div>
          <div className="px-3 py-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
            MCP
          </div>
          {mcpServers.map((server) => (
            <button
              key={server.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(`@${server.name} `);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#3a3a3a] flex items-center gap-2"
            >
              <span className="font-medium">@{server.name}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {server.status === "connected" ? `${server.tools.length} 个工具` : server.status}
              </span>
            </button>
          ))}
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
          {skills.map((skill) => (
            <button
              key={skill.name}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(skill.command ? `${skill.command} ` : `/${skill.name} `);
              }}
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#3a3a3a] flex items-center gap-2"
            >
              <span className="font-medium">{skill.command ?? `/${skill.name}`}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {skill.displayName}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
