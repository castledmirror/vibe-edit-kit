#!/usr/bin/env bash
# Run from the footage folder. Renders every clip under 10_WORK/clips, 3 at a time. ONLY='v2*' limits it.
ROOT="$PWD"
PLUG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
export PATH="$PLUG/.venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 CLAUDE_PLUGIN_ROOT="$PLUG"
mkdir -p "$ROOT/10_WORK/logs"
for d in "$ROOT"/10_WORK/clips/*/; do
  n="$(basename "$d")"
  case "$n" in ${ONLY:-*}) ;; *) continue ;; esac
  while [ "$(jobs -r | wc -l)" -ge 3 ]; do sleep 2; done
  ( python3 "$PLUG/skills/render/engine.py" "${d%/}" > "$ROOT/10_WORK/logs/$n.log" 2>&1 && echo "OK $n" || echo "FAIL $n (see 10_WORK/logs/$n.log)" ) &
done
wait
