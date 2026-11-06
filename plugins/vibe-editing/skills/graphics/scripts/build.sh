#!/usr/bin/env bash
# Build one clip with graphics. Content gate, layout gate, then render.
#   build.sh <workdir>                   gates + render to <footage>/20_DELIVER/<name>_graphics.mp4
#   build.sh <workdir> --qa-only         gates only
#   build.sh <workdir> --still <seconds> one frame, to look at
#   build.sh <workdir> --out <file.mp4>  choose the output path
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$HERE/template"
WORK="$(cd "${1:?usage: build.sh <workdir> [--qa-only|--still s|--out file]}" && pwd)"; shift
[ -f "$WORK/spec.json" ] || { echo "No spec.json in $WORK. Run prepare.py first."; exit 1; }
PLUG="$(cd "$HERE/../.." && pwd -P)"; export PATH="$PLUG/.venv/bin:$PATH"
PY=python3; [ -x "$PLUG/.venv/bin/python" ] && PY="$PLUG/.venv/bin/python"
command -v node >/dev/null || { echo "Node.js is required for graphics. Install it from https://nodejs.org"; exit 1; }
[ -d "$T/node_modules" ] || { echo "First run: installing the graphics engine…"; (cd "$T" && npm install --silent --no-audit --no-fund); }
NAME="$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1]))['name'])" "$WORK/spec.json")"
FPS="$("$PY" -c "import json,sys;print(json.load(open(sys.argv[1]))['fps'])" "$WORK/spec.json")"

if [ "${1:-}" = "--still" ]; then
  FRAME="$("$PY" -c "print(round(float('$2')*float('$FPS')))")"
  mkdir -p "$WORK/stills"
  (cd "$T" && npx remotion still src/index.ts Main "$WORK/stills/t$2.png" --frame="$FRAME" --props="$WORK/spec.json" --public-dir="$WORK" --log=error)
  echo "still: $WORK/stills/t$2.png"; exit 0
fi

echo "── content gate ──"; "$PY" "$HERE/scripts/validate.py" "$WORK"
echo "── layout gate ──"; (cd "$T" && node qa/check.mjs "$WORK" 2>&1 | grep -v QA_REPORT)
[ "${1:-}" = "--qa-only" ] && { echo "Gates passed. No render."; exit 0; }

case "$WORK" in
  */10_WORK/graphics/*) OUT="${WORK%%/10_WORK/graphics/*}/20_DELIVER/${NAME}_graphics.mp4" ;;
  *) OUT="$WORK/${NAME}_graphics.mp4" ;;
esac
[ "${1:-}" = "--out" ] && OUT="$2"
mkdir -p "$(dirname "$OUT")"
echo "── render ──"
(cd "$T" && npx remotion render src/index.ts Main "$OUT" --props="$WORK/spec.json" --public-dir="$WORK" \
  --crf=18 --pixel-format=yuv420p --color-space=bt709 --audio-codec=aac --log=error)
A="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$WORK/clip.mp4")"
B="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")"
"$PY" -c "import sys;a,b=float('$A'),float('$B');sys.exit('STOP: render is %.2fs, source is %.2fs'%(b,a) if abs(a-b)>0.15 else 0)"
echo "done: $OUT"
