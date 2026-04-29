import { httpRequest } from "@/fe/lib/http";
import type { SkillMeta } from "@/be/engine/skills/types";

export type { SkillMeta };

export function getSkills(): Promise<SkillMeta[]> {
  return httpRequest("/api/skills");
}

export function toggleSkill(
  name: string,
  action: "enable" | "disable",
): Promise<{ ok: boolean }> {
  return httpRequest("/api/skills", {
    method: "PATCH",
    body: { name, action },
  });
}

export function reloadSkills(): Promise<{ ok: boolean }> {
  return httpRequest("/api/skills", { method: "POST" });
}
