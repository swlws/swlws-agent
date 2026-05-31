---
name: skill-link
description: 将外部项目的 skill 目录软链接到当前工程的 .claude/skills/，使多项目共享同一份 skill 源。新增 skill 后、或需要从其他工程同步 skill 时使用。关键词：link skill、同步 skill、skill-link、@skill-link、skill 链接、skill 未加载。
---

# skill-link

将外部 skill 目录软链接到 `.claude/skills/`，skill 在外部工程统一维护，本工程自动获取最新版本。

## 使用场景

1. 从其他工程引入 skill：将外部工程的 skill 目录软链接到本工程
2. 检查现有链接是否有效（目标是否存在）
3. 更新过期的软链接

## 主流程

```
Step 1 Dry-run 预览  → bash scripts/link.sh --dry-run <source_skills_dir>
Step 2 用户确认      → AskUserQuestion 确认后才执行
Step 3 执行链接      → bash scripts/link.sh <source_skills_dir>
```

## 脚本

```bash
# 预览（不执行写操作）
bash .claude/skills/skill-link/scripts/link.sh --dry-run <source_skills_dir>

# 执行链接
bash .claude/skills/skill-link/scripts/link.sh <source_skills_dir>

# 检查所有现有 skill 链接
bash .claude/skills/skill-link/scripts/link.sh --check
```

## 输出说明

| 标记 | 含义 |
|------|------|
| `ok` | 已是正确软链接，无需操作 |
| `create` | 新建软链接 |
| `update` | 旧链接目标有误，更新 |
| `broken` | 软链接目标不存在，需手动处理 |
| `WARN` | 目标是真实目录（非链接），跳过，需手动 `rm -rf .claude/skills/<name>` 后重跑 |
