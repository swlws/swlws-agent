import type { SkillDefinition, SkillMatchResult } from "./types";

export function matchSkill(
  content: string,
  skills: SkillDefinition[],
): SkillMatchResult | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("/")) return null;

  for (const skill of skills) {
    const cmd = skill.meta.command;
    if (!cmd || !skill.meta.enabled) continue;

    if (
      trimmed === cmd ||
      trimmed.startsWith(cmd + " ") ||
      trimmed.startsWith(cmd + "\n")
    ) {
      return {
        skill,
        extractedArgs: trimmed.slice(cmd.length).trim(),
      };
    }
  }

  return null;
}
