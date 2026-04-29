"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog } from "@/fe/components/Dialog";
import { Button } from "@/fe/components/Button";
import { RefreshIcon } from "@/fe/components/icons";
import {
  getSkills,
  toggleSkill,
  reloadSkills,
  type SkillMeta,
} from "@/fe/apis/skills";

interface SkillsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SkillsPanel({ isOpen, onClose }: SkillsPanelProps) {
  const [skills, setSkills] = useState<SkillMeta[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSkills();
      setSkills(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  async function handleToggle(name: string, currentEnabled: boolean) {
    await toggleSkill(name, currentEnabled ? "disable" : "enable");
    await refresh();
  }

  async function handleReload() {
    setLoading(true);
    try {
      await reloadSkills();
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Skills"
      maxWidth="max-w-md"
      footer={
        <div className="flex justify-between px-5 py-4">
          <Button variant="ghost" onClick={handleReload} disabled={loading}>
            <span className="flex items-center gap-1">
              <RefreshIcon size={14} />
              重新扫描
            </span>
          </Button>
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
        </div>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto px-5 py-4">
        {skills.length === 0 && !loading && (
          <p className="py-4 text-center text-sm text-gray-400">
            暂无 Skill
          </p>
        )}
        {loading && skills.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">加载中…</p>
        )}

        <div className="space-y-2">
          {skills.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2.5 dark:border-[#3f3f46]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {s.displayName}
                  </span>
                  {s.command && (
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-[#2f2f2f] dark:text-gray-400">
                      {s.command}
                      {s.argumentHint ? ` ${s.argumentHint}` : ""}
                    </code>
                  )}
                  {s.asTool && (
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-500 dark:bg-blue-900/30 dark:text-blue-400">
                      Tool
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {s.description}
                </p>
              </div>

              <button
                onClick={() => handleToggle(s.name, s.enabled)}
                className={`relative h-5 w-9 flex-shrink-0 rounded-full transition-colors ${
                  s.enabled
                    ? "bg-green-400"
                    : "bg-gray-300 dark:bg-[#4a4a4a]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    s.enabled ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          将 SKILL.md 放入 .swlws/skills/&lt;name&gt;/ 目录即可自动发现新
          Skill
        </p>
      </div>
    </Dialog>
  );
}
