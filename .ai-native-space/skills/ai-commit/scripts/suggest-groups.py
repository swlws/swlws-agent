#!/usr/bin/env python3
"""根据 analyze-staged.sh 的 JSON 建议分组（Agent 可覆盖）。"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import PurePosixPath

SENSITIVE_RE = re.compile(
    r"(\.env$|\.env\.|credentials|secret|\.pem$|\.key$|id_rsa|\.p12$)",
    re.I,
)

CONFIG_PARTS = {".github", ".gitlab", ".circleci", ".claude", ".cursor"}
DOCS_EXT = {".md", ".mdx", ".rst"}
TEST_PARTS = {"test", "tests", "__tests__", "spec", "specs"}
STYLE_EXT = {".scss", ".css", ".less"}

# 通用 src/ 下的 scope 映射
SCOPE_MAP = {
    "api": "api",
    "components": "components",
    "pages": "pages",
    "stores": "stores",
    "hooks": "hooks",
    "services": "services",
    "styles": "styles",
    "utils": "utils",
    "types": "types",
    "i18n": "i18n",
    "constants": "constants",
}


def tag_file(path: str) -> set[str]:
    tags: set[str] = set()
    p = PurePosixPath(path)
    parts = set(p.parts)
    suffix = p.suffix.lower()

    if suffix in DOCS_EXT:
        tags.add("docs")
    if parts & TEST_PARTS or ".test." in path or ".spec." in path:
        tags.add("test")
    if suffix in STYLE_EXT:
        tags.add("style")
    if (
        suffix in {".json", ".yaml", ".yml", ".toml"}
        or parts & CONFIG_PARTS
        or (path.startswith(".") and suffix not in DOCS_EXT)
    ):
        tags.add("config")
    if not tags or "docs" not in tags:
        tags.add("code")
    return tags


def infer_scope(path: str) -> str:
    parts = PurePosixPath(path).parts
    if not parts:
        return "root"

    if parts[0] in CONFIG_PARTS:
        return parts[0].lstrip(".")
    if parts[0] == "public":
        return "public"

    # src/ 下的模块
    if parts[0] == "src" and len(parts) >= 2:
        module = parts[1]
        return SCOPE_MAP.get(module, module[:32])

    return parts[0][:32] if parts[0] != "." else "root"


def infer_type(path: str, tags: set[str]) -> str:
    if "config" in tags and "code" not in tags:
        return "chore"
    if "docs" in tags and tags <= {"docs", "code"}:
        return "docs"
    if "test" in tags:
        return "test"
    if "style" in tags and "code" not in tags:
        return "style"
    return "feat"


def group_by_module(files: list[dict]) -> dict[str, list[dict]]:
    buckets: dict[str, list[dict]] = defaultdict(list)
    for f in files:
        path = f["path"]
        tags = tag_file(path)
        scope = infer_scope(path)
        if "config" in tags and "code" not in tags:
            key = f"config:{scope}"
        elif tags == {"docs"} or (tags <= {"docs", "code"} and path.endswith(".md")):
            key = f"docs:{scope}"
        elif "style" in tags and "code" not in tags:
            key = f"style:{scope}"
        else:
            key = f"code:{scope}"
        buckets[key].append({**f, "tags": list(tags), "scope": scope, "type": infer_type(path, tags)})
    return buckets


def main() -> None:
    raw = sys.stdin.read() or "{}"
    data = json.loads(raw)
    if data.get("error"):
        print(json.dumps(data))
        sys.exit(1)
    if not data.get("staged"):
        print(json.dumps({"groups": [], "warnings": data.get("warnings", [])}))
        return

    files = []
    for f in data.get("files", []):
        path = f.get("path", "")
        if SENSITIVE_RE.search(path):
            continue
        files.append(f)

    warnings = list(data.get("warnings", []))
    buckets = group_by_module(files)

    groups = []
    for i, (key, items) in enumerate(sorted(buckets.items()), start=1):
        t = items[0].get("type", "chore")
        scope = items[0].get("scope", "multi")
        paths = [x["path"] for x in items]
        msg = f"{t}({scope}): 更新 {scope} 相关变更" if scope != "root" else f"{t}: 更新配置"
        groups.append(
            {
                "id": f"g{i}",
                "files": paths,
                "type": t,
                "scope": scope,
                "message": msg,
                "rationale": f"预设 by-module，桶 {key}，{len(paths)} 个文件",
            }
        )

    print(json.dumps({"groups": groups, "warnings": warnings}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
