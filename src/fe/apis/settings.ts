import { httpRequest } from "@/fe/lib/http";
import type { AppSettings, AgentMode, IntentDetectionMode } from "@/be/config/settings";

export type { AppSettings, AgentMode, IntentDetectionMode };

export function getSettings(): Promise<AppSettings> {
  return httpRequest("/api/settings");
}

export function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  return httpRequest("/api/settings", { method: "POST", body: { settings } });
}
