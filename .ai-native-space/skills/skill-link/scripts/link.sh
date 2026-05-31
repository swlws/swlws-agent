#!/usr/bin/env bash
# 将外部 skill 目录软链接到 .claude/skills/
# 用法:
#   bash link.sh [--dry-run] <source_skills_dir>   # 链接指定目录下的所有 skill
#   bash link.sh --check                            # 检查所有现有 skill 链接状态

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
TARGET_DIR="$REPO_ROOT/.claude/skills"
DRY_RUN=false
CHECK_ONLY=false

# 解析参数
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true; shift ;;
    --check) CHECK_ONLY=true; shift ;;
    *) SOURCE_DIR="$1"; shift ;;
  esac
done

if [[ "$CHECK_ONLY" == true ]]; then
  echo "=== skill-link: 检查现有链接 ==="
  for link in "$TARGET_DIR"/*/; do
    name=$(basename "$link")
    if [[ -L "${link%/}" ]]; then
      target=$(readlink "${link%/}")
      if [[ -e "$TARGET_DIR/$name" ]]; then
        echo "  $name: ok → $target"
      else
        echo "  $name: broken → $target (目标不存在)"
      fi
    else
      echo "  $name: 真实目录（非链接）"
    fi
  done
  exit 0
fi

if [[ -z "${SOURCE_DIR:-}" ]]; then
  echo "用法: $0 [--dry-run] <source_skills_dir>" >&2
  exit 1
fi

SOURCE_DIR="$(cd "$SOURCE_DIR" && pwd)"
echo "=== skill-link$([ "$DRY_RUN" = true ] && echo ' [dry-run]') ==="
echo "  source: $SOURCE_DIR"
echo "  target: $TARGET_DIR"

mkdir -p "$TARGET_DIR"

for skill_src in "$SOURCE_DIR"/*/; do
  [[ -d "$skill_src" ]] || continue
  name=$(basename "$skill_src")
  target="$TARGET_DIR/$name"
  rel="$(python3 -c "import os; print(os.path.relpath('$skill_src', '$TARGET_DIR'))")"

  if [[ -L "$target" ]] && [[ "$(readlink "$target")" == "$rel" ]]; then
    echo "  $name: ok"
  elif [[ -L "$target" ]]; then
    echo "  $name: update $(readlink "$target") → $rel"
    [[ "$DRY_RUN" = false ]] && { rm "$target"; ln -s "$rel" "$target"; }
  elif [[ -e "$target" ]]; then
    echo "  $name: WARN 真实目录，跳过。如需替换请先手动删除 .claude/skills/$name"
  else
    echo "  $name: create $rel"
    [[ "$DRY_RUN" = false ]] && ln -s "$rel" "$target"
  fi
done
