import { useState, useEffect } from "react";
import {
  type AppSettings,
  fetchSettings,
  persistSettings,
} from "@/fe/lib/settings";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

const DEFAULT_FORM: AppSettings = {
  conversationCacheCount: 4,
  personaUpdateHours: 4,
  mindCardsDisplayCount: 4,
  mindCardsUpdateHours: 4,
};

const HOUR_OPTIONS = [1, 2, 4, 8, 12, 24];
const CARD_COUNT_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 dark:text-gray-100">{label}</p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
          {hint}
        </p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
  format,
}: {
  value: number;
  options: number[];
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none transition-colors focus:border-gray-400 dark:border-[#4a4a4a] dark:bg-[#2f2f2f] dark:text-gray-100 dark:focus:border-[#666]"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {format ? format(o) : o}
        </option>
      ))}
    </select>
  );
}

export function SettingsPanel({ isOpen, onClose, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState<AppSettings>(DEFAULT_FORM);
  const [defaults, setDefaults] = useState<AppSettings>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchSettings().then((s) => {
      setForm(s);
      setDefaults(s);
    });
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await persistSettings(form);
      onSave(saved);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setForm({ ...defaults });
  }

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 dark:bg-black/50"
        onClick={onClose}
      />

      {/* 面板 */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl dark:bg-[#2a2a2a]">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-[#3f3f46]">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            设置
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-[#3f3f46] dark:hover:text-gray-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 配置项 */}
        <div className="divide-y divide-gray-100 px-5 dark:divide-[#3f3f46]">
          <Row
            label="对话缓存数量"
            hint={`压缩前保留最近 ${form.conversationCacheCount} 条消息，4-12`}
          >
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={4}
                max={12}
                value={form.conversationCacheCount}
                onChange={(e) =>
                  set("conversationCacheCount", Number(e.target.value))
                }
                className="w-24 accent-gray-800 dark:accent-gray-300"
              />
              <span className="w-5 text-center text-sm tabular-nums text-gray-700 dark:text-gray-300">
                {form.conversationCacheCount}
              </span>
            </div>
          </Row>

          <Row
            label="人物画像更新频率"
            hint="距上次更新超过此时长后，下次对话时自动刷新"
          >
            <Select
              value={form.personaUpdateHours}
              options={HOUR_OPTIONS}
              onChange={(v) => set("personaUpdateHours", v)}
              format={(v) => `${v} 小时`}
            />
          </Row>

          <Row label="心智卡片展示数量" hint="每次展示的卡片数，最多 16 张">
            <Select
              value={form.mindCardsDisplayCount}
              options={CARD_COUNT_OPTIONS}
              onChange={(v) => set("mindCardsDisplayCount", v)}
              format={(v) => `${v} 张`}
            />
          </Row>

          <Row
            label="心智卡片更新频率"
            hint="距上次更新超过此时长后，下次对话时自动刷新"
          >
            <Select
              value={form.mindCardsUpdateHours}
              options={HOUR_OPTIONS}
              onChange={(v) => set("mindCardsUpdateHours", v)}
              format={(v) => `${v} 小时`}
            />
          </Row>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={handleReset}
            className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
          >
            恢复默认
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 dark:border-[#4a4a4a] dark:text-gray-300 dark:hover:bg-[#3a3a3a]"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#202123] px-4 py-1.5 text-sm text-white transition-colors hover:bg-black disabled:opacity-50 dark:bg-white dark:text-[#202123] dark:hover:bg-gray-200"
            >
              {saving ? "保存中…" : "保存"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
