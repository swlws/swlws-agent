import fs from "fs/promises";
import path from "path";
import type { SkillDefinition, SkillMeta } from "./types";

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;

function parseFrontmatter(
  raw: string,
  dirName: string,
  dirPath: string,
): SkillDefinition | null {
  const match = raw.match(FRONTMATTER_RE);
  if (!match) return null;

  const [, yaml, body] = match;
  const fields: Record<string, string> = {};
  for (const line of yaml.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) fields[key] = val;
  }

  const meta: SkillMeta = {
    name: fields["name"] || dirName,
    displayName: fields["displayName"] || fields["name"] || dirName,
    description: fields["description"] || "",
    command: fields["command"] || undefined,
    argumentHint: fields["argument-hint"] || undefined,
    asTool: fields["as-tool"] === "true",
    execution: "prompt",
    temperature: fields["temperature"] ? Number(fields["temperature"]) : undefined,
    enabled: fields["enabled"] !== "false",
  };

  return { meta, promptTemplate: body.trim(), dirPath };
}

export async function loadSkillsFromDir(
  dir: string,
): Promise<SkillDefinition[]> {
  const skills: SkillDefinition[] = [];
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return skills;
  }

  for (const entry of entries) {
    const skillDir = path.join(dir, entry);
    const stat = await fs.stat(skillDir).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const skillFile = path.join(skillDir, "SKILL.md");
    try {
      const raw = await fs.readFile(skillFile, "utf-8");
      const skill = parseFrontmatter(raw, entry, skillDir);
      if (skill) skills.push(skill);
    } catch {
      // skip directories without SKILL.md
    }
  }

  return skills;
}
