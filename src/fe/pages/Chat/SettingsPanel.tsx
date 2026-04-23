import { useState, useEffect } from "react";
import {
  type AppSettings,
  getSettings,
  saveSettings,
} from "@/fe/apis/settings";
import { Dialog } from "@/fe/components/Dialog";
import { FormRow } from "@/fe/components/FormRow";
import { Select } from "@/fe/components/Select";
import { Button } from "@/fe/components/Button";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

const DEFAULT_FORM: AppSettings = {
  maxMessagesCount: 100,
  summaryTriggerCount: 8,
  mindCardsDisplayCount: 4,
  mindCardsUpdateHours: 4,
  agentMode: "direct",
};

const HOUR_OPTIONS = [1, 2, 4, 8, 12, 24];
const CARD_COUNT_OPTIONS = [2, 4, 6, 8, 10, 12, 14, 16];
const MSG_COUNT_OPTIONS = [20, 50, 100, 200, 500];
const SUMMARY_TRIGGER_OPTIONS = [4, 6, 8, 10, 12];

export function SettingsPanel({ isOpen, onClose, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState<AppSettings>(DEFAULT_FORM);
  const [defaults, setDefaults] = useState<AppSettings>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    getSettings().then((s) => {
      setForm(s);
      setDefaults(s);
    });
  }, [isOpen]);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveSettings(form);
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

  const footer = (
    <div className="flex items-center justify-between px-5 py-4">
      <Button variant="ghost" onClick={handleReset}>
        恢复默认
      </Button>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "保存中…" : "保存"}
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="设置" footer={footer}>
      <div className="divide-y divide-gray-100 px-5 dark:divide-[#3f3f46]">
          <FormRow
            label="消息存储上限"
            hint={`会话最多保留 ${form.maxMessagesCount} 条消息，超出后从头部截断`}
          >
            <Select
              value={form.maxMessagesCount}
              options={MSG_COUNT_OPTIONS}
              onChange={(v) => set("maxMessagesCount", v)}
              format={(v) => `${v} 条`}
            />
          </FormRow>

          <FormRow
            label="摘要触发频率"
            hint={`每新增 ${form.summaryTriggerCount} 条消息后自动重新生成历史摘要`}
          >
            <Select
              value={form.summaryTriggerCount}
              options={SUMMARY_TRIGGER_OPTIONS}
              onChange={(v) => set("summaryTriggerCount", v)}
              format={(v) => `${v} 条`}
            />
          </FormRow>

          <FormRow label="心智卡片展示数量" hint="每次展示的卡片数，最多 16 张">
            <Select
              value={form.mindCardsDisplayCount}
              options={CARD_COUNT_OPTIONS}
              onChange={(v) => set("mindCardsDisplayCount", v)}
              format={(v) => `${v} 张`}
            />
          </FormRow>

          <FormRow
            label="心智卡片更新频率"
            hint="距上次更新超过此时长后，下次对话时自动刷新"
          >
            <Select
              value={form.mindCardsUpdateHours}
              options={HOUR_OPTIONS}
              onChange={(v) => set("mindCardsUpdateHours", v)}
              format={(v) => `${v} 小时`}
            />
          </FormRow>
        </div>
    </Dialog>
  );
}
