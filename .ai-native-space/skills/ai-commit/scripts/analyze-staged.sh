#!/usr/bin/env bash
# 分析 git 暂存区，输出 JSON（供 suggest-groups.py 或 Agent 使用）
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo '{"error":"not a git repository"}' >&2
  exit 1
fi

if git diff --cached --quiet 2>/dev/null; then
  echo '{"staged":false,"files":[]}'
  exit 0
fi

# 敏感路径模式（简单匹配）
is_sensitive() {
  local p="$1"
  case "$p" in
    .env|.env.*|*credentials*|*secret*|*.pem|*.key|id_rsa|*.p12) return 0 ;;
    *) return 1 ;;
  esac
}

files_json="["
first=1
warnings_json="["

while IFS= read -r -d '' path; do
  [[ -z "$path" ]] && continue
  if is_sensitive "$path"; then
    if [[ "$warnings_json" != "[" ]]; then warnings_json+=","; fi
    warnings_json+="\"sensitive:$path\""
    continue
  fi

  status=$(git diff --cached --name-status -- "$path" | head -1 | cut -f1)
  stat=$(git diff --cached --numstat -- "$path" 2>/dev/null | head -1)
  add=0
  del=0
  if [[ -n "$stat" ]]; then
    add=$(echo "$stat" | awk '{print $1}')
    del=$(echo "$stat" | awk '{print $2}')
    [[ "$add" == "-" ]] && add=0
    [[ "$del" == "-" ]] && del=0
  fi

  if [[ $first -eq 0 ]]; then files_json+=","; fi
  first=0
  esc=$(printf '%s' "$path" | python3 -c 'import json,sys; print(json.dumps(sys.stdin.read()))')
  files_json+="{\"path\":$esc,\"status\":\"${status:-M}\",\"lines_added\":${add:-0},\"lines_deleted\":${del:-0}}"
done < <(git diff --cached --name-only -z)

files_json+="]"
warnings_json+="]"

echo "{\"staged\":true,\"files\":$files_json,\"warnings\":$warnings_json}"
