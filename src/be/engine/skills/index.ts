import type { Tool } from "@/be/engine/tools";
import { chat } from "@/be/lib/text-llm";
import { SKILLS_DIR, BUILTIN_SKILLS_DIR } from "@/be/config/paths";
import { loadSkillsFromDir } from "./loader";
import { matchSkill } from "./matcher";
import type { SkillDefinition, SkillMeta, SkillMatchResult } from "./types";

export type { SkillDefinition, SkillMeta, SkillMatchResult };
export { executeSkill } from "./executor";

const SKILL_TOOL_PREFIX = "skill__";

class SkillManager {
  private skills = new Map<string, SkillDefinition>();

  async initialize(): Promise<void> {
    await this._load();
  }

  private async _load(): Promise<void> {
    this.skills.clear();

    // 1. 内置 skills
    const builtins = await loadSkillsFromDir(BUILTIN_SKILLS_DIR);
    for (const s of builtins) this.skills.set(s.meta.name, s);

    // 2. 用户 skills（同名覆盖内置）
    const userSkills = await loadSkillsFromDir(SKILLS_DIR);
    for (const s of userSkills) this.skills.set(s.meta.name, s);

    const names = [...this.skills.keys()];
    if (names.length > 0) {
      console.log(`[Skills] loaded: ${names.join(", ")}`);
    }
  }

  match(content: string): SkillMatchResult | null {
    return matchSkill(content, [...this.skills.values()]);
  }

  getAsTools(): Tool[] {
    const tools: Tool[] = [];
    for (const skill of this.skills.values()) {
      if (!skill.meta.asTool || !skill.meta.enabled) continue;
      tools.push({
        name: `${SKILL_TOOL_PREFIX}${skill.meta.name}`,
        description: skill.meta.description,
        parameters: {
          type: "object",
          properties: {
            input: { type: "string", description: "用户输入" },
          },
          required: ["input"],
        },
        execute: async (args) => {
          const input = (args.input as string) ?? "";
          const prompt = skill.promptTemplate
            .replace(/\$ARGUMENTS/g, input)
            .replace(/\$SKILL_DIR/g, skill.dirPath);
          return chat([
            { role: "system", content: prompt },
            { role: "user", content: input },
          ], { temperature: skill.meta.temperature });
        },
      });
    }
    return tools;
  }

  getSkillList(): SkillMeta[] {
    return [...this.skills.values()].map((s) => s.meta);
  }

  setEnabled(name: string, enabled: boolean): void {
    const skill = this.skills.get(name);
    if (skill) skill.meta.enabled = enabled;
  }

  async reload(): Promise<void> {
    await this._load();
  }
}

const g = globalThis as unknown as {
  __skillManager?: SkillManager;
  __skillManagerVersion?: number;
};
const SKILL_VERSION = 1;
if (!g.__skillManager || g.__skillManagerVersion !== SKILL_VERSION) {
  g.__skillManager = new SkillManager();
  g.__skillManagerVersion = SKILL_VERSION;
}
export const skillManager: SkillManager = g.__skillManager;
