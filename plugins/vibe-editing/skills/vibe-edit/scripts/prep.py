#!/usr/bin/env python3
"""Run from the footage folder. For every video: compact mp3, word-level transcript, silence map."""
import json, os, re, subprocess, sys
from pathlib import Path

PLUG = Path(__file__).resolve().parents[3]
for ln in (PLUG / "config/keys.env").read_text().splitlines() if (PLUG / "config/keys.env").is_file() else []:
    ln = ln.strip()
    if ln and not ln.startswith("#") and "=" in ln:
        k, v = ln.split("=", 1)
        if v.strip() and "PASTE" not in v and not os.environ.get(k.strip()):
            os.environ[k.strip()] = v.strip()
for d in ("audio", "transcripts", "silences"):
    Path("10_WORK", d).mkdir(parents=True, exist_ok=True)


def transcribe(mp3, out):
    key = os.environ.get("GROQ_API_KEY")
    if key:
        import requests
        with open(mp3, "rb") as fh:
            r = requests.post("https://api.groq.com/openai/v1/audio/transcriptions",
                              headers={"Authorization": f"Bearer {key}"}, timeout=900,
                              files={"file": (mp3.name, fh, "audio/mpeg")},
                              data=[("model", "whisper-large-v3"), ("response_format", "verbose_json"),
                                    ("timestamp_granularities[]", "word"), ("timestamp_granularities[]", "segment")])
        if r.status_code == 401:
            sys.exit("STOP: Groq rejected the API key. Check GROQ_API_KEY in plugins/vibe-editing/config/keys.env.")
        if r.status_code == 413:
            sys.exit(f"STOP: {mp3.name} is too big for Groq (25 MB limit). Split the video first.")
        if r.status_code != 200:
            sys.exit(f"STOP: Groq transcription failed ({r.status_code}): {r.text[:200]}")
        out.write_text(r.text)
        return
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("STOP: no GROQ_API_KEY and faster-whisper is not installed, so nothing can transcribe.")
    print(f"  no Groq key: transcribing {mp3.stem} offline (slower)")
    segs, _ = WhisperModel("small", compute_type="int8").transcribe(str(mp3), word_timestamps=True)
    words = [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segs for w in s.words]
    out.write_text(json.dumps({"words": words}))


vids = sorted(p for p in Path(".").iterdir() if p.suffix.lower() in (".mp4", ".mov"))
if not vids:
    sys.exit("STOP: no .mp4 or .mov files in this folder.")
for f in vids:
    b = f.stem
    mp3 = Path("10_WORK/audio", f"{b}.mp3")
    tr = Path("10_WORK/transcripts", f"{b}.json")
    if not mp3.exists():
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(f), "-ac", "1", "-ar", "16000", "-vn",
                        "-c:a", "libmp3lame", "-b:a", "48k", str(mp3)], check=True)
    if not tr.exists() or tr.stat().st_size == 0:
        transcribe(mp3, tr)
    log = subprocess.run(["ffmpeg", "-v", "info", "-i", str(mp3), "-af", "silencedetect=noise=-38dB:d=0.5", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    sil, cur = [], None
    for ln in log.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", ln)
        if m:
            cur = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", ln)
        if m and cur is not None:
            sil.append([cur, float(m.group(1))])
            cur = None
    json.dump(sil, open(f"10_WORK/silences/{b}.json", "w"))
    print(b, len(json.load(open(tr)).get("words", [])), "words")
