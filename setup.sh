#!/usr/bin/env bash
# One-command setup for the Vibe Edit Kit. Safe to run again.
# VIBE_SKIP_BREW=1 skips system installs.
set -e
DIR="$(cd "$(dirname "$0")" && pwd -P)"
PLUG="$DIR/plugins/vibe-editing"
echo "== Vibe Edit Kit setup =="

TOOLS=""
for t in ffmpeg tesseract yt-dlp rclone; do command -v "$t" >/dev/null 2>&1 || TOOLS="$TOOLS $t"; done
if [ -n "$TOOLS" ] && [ -z "${VIBE_SKIP_BREW:-}" ]; then
  if command -v brew >/dev/null 2>&1; then
    echo "Installing what's missing:$TOOLS"
    # shellcheck disable=SC2086
    brew install $TOOLS || true
  else
    echo "!! Homebrew not found. Install it from https://brew.sh and run this again, or install:$TOOLS"
  fi
fi

PY=""
for c in python3.13 python3.12 python3.11 python3.10 python3; do
  if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] < (3,14) else 1)'; then PY="$c"; break; fi
done
if [ -z "$PY" ]; then
  if [ -z "${VIBE_SKIP_BREW:-}" ] && command -v brew >/dev/null 2>&1; then
    brew install python@3.12; PY="$(brew --prefix)/bin/python3.12"
  else
    echo "!! Python 3.10 to 3.13 is required and was not found. Install Python 3.12, then run this again."; exit 1
  fi
fi

echo "Setting up Python with $PY…"
cd "$PLUG"
[ -f config/keys.env ] || cp config/keys.env.example config/keys.env
[ -x .venv/bin/python ] || "$PY" -m venv .venv
.venv/bin/python -m pip install -q --upgrade pip
.venv/bin/python -m pip install -q -r requirements.txt

# ffprobe 9 adds a trailing comma to csv output, which breaks the pipeline's fps and size parsing.
REAL_FFPROBE="$(command -v ffprobe || true)"
if [ -n "$REAL_FFPROBE" ]; then
  cat > .venv/bin/ffprobe <<SHIM
#!/bin/bash
REAL="$REAL_FFPROBE"
for a in "\$@"; do
  case "\$a" in csv*) "\$REAL" "\$@" | sed 's/,*\$//'; exit "\${PIPESTATUS[0]}";; esac
done
exec "\$REAL" "\$@"
SHIM
  chmod +x .venv/bin/ffprobe
fi

# Graphics are optional. Their engine installs the first time someone asks for graphics.

# So "vibe edit this folder" works from any footage folder. Never replaces an existing skill.
ln -sfn "$DIR" "$HOME/.vibe-edit-kit"
mkdir -p "$HOME/.claude/skills"
for sk in vibe-edit graphics; do
  L="$HOME/.claude/skills/$sk"
  if [ -e "$L" ] && [ ! -L "$L" ]; then echo "Left your existing $sk skill alone: $L"; else ln -sfn "$PLUG/skills/$sk" "$L"; fi
done

echo; PATH="$PLUG/.venv/bin:$PATH" python3 "$PLUG/doctor.py" || true
echo "Next: add a free Groq key to plugins/vibe-editing/config/keys.env (optional), then open a footage folder in Claude Code and say: vibe edit this folder"
