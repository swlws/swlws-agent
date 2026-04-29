export interface SkillMeta {
  name: string;
  displayName: string;
  description: string;
  command?: string;
  argumentHint?: string;
  asTool: boolean;
  execution: "prompt";
  temperature?: number;
  enabled: boolean;
}

export interface SkillDefinition {
  meta: SkillMeta;
  promptTemplate: string;
  dirPath: string;
}

export interface SkillMatchResult {
  skill: SkillDefinition;
  extractedArgs: string;
}
