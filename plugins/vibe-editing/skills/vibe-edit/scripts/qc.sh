#!/usr/bin/env bash
# Run from the footage folder. For each delivered clip: duration, a fresh transcript (what a viewer
# hears), the reqc gate and a frame strip in 10_WORK/qc/. Optional argument: a name pattern.
PLUG="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd -P)"
export PATH="$PLUG/.venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1 CLAUDE_PLUGIN_ROOT="$PLUG"
mkdir -p 10_WORK/qc/tmp
for f in 20_DELIVER/${1:-*}.mp4; do
  [ -f "$f" ] || continue
  n="$(basename "$f" .mp4)"
  mkdir -p "10_WORK/qc/tmp/$n"; cp "$f" "10_WORK/qc/tmp/$n/"
  (cd "10_WORK/qc/tmp/$n" && python3 "$PLUG/skills/vibe-edit/scripts/prep.py" >/dev/null)
  ffmpeg -v error -y -i "$f" -vf "fps=1/5,scale=270:-1,tile=8x1" -frames:v 1 -update 1 "10_WORK/qc/$n.jpg"
  dur="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")"
  rq="$(python3 "$PLUG/skills/edit/scripts/reqc.py" "$f" --project "10_WORK/clips/$n" 2>&1 | grep -E '✗|⚠' | grep -v 'RES 1080x1920' | tr -s ' ' | tr '\n' ';')"
  echo "### $n  (${dur%.*}s)"
  python3 -c "import json,sys;d=json.load(open(sys.argv[1]));print(d.get('text') or ' '.join(w['word'] for w in d.get('words',[])))" "10_WORK/qc/tmp/$n/10_WORK/transcripts/$n.json"
  echo "reqc: ${rq:-clean}"
  echo
done
rm -rf 10_WORK/qc/tmp
