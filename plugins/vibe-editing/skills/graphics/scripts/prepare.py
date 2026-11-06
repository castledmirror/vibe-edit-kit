#!/usr/bin/env python3
"""Get a finished vertical clip ready for graphics.

    prepare.py <clip.mp4> [--work DIR] [--words words.json]

Makes a work folder holding the clip, word timings, a camera crop fitted to the speaker's face, a
spec.json skeleton and shotlist.md. The source clip is copied, never changed.
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PLUGIN = HERE.parents[2]
KIT = PLUGIN.parents[1]
YUNET = PLUGIN / "skills/horizontal-to-vertical/scripts/yunet.onnx"
CARD_W, CARD_H, VW = 820, 1160, 880
SCALE = VW / 1080


def die(msg):
    sys.exit(f"STOP: {msg}")


def load_keys():
    f = PLUGIN / "config/keys.env"
    if f.is_file():
        for ln in f.read_text().splitlines():
            ln = ln.strip()
            if ln and not ln.startswith("#") and "=" in ln:
                k, v = ln.split("=", 1)
                if v.strip() and "PASTE" not in v and not os.environ.get(k.strip()):
                    os.environ[k.strip()] = v.strip()


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate:format=duration", "-of", "json", str(path)],
                         capture_output=True, text=True)
    if out.returncode:
        die(f"could not read {path}: {out.stderr.strip()}")
    d = json.loads(out.stdout)
    st = d["streams"][0]
    a, b = st["r_frame_rate"].split("/")
    return int(st["width"]), int(st["height"]), round(float(a) / float(b), 3), float(d["format"]["duration"])


def transcribe(clip):
    load_keys()
    with tempfile.TemporaryDirectory() as td:
        mp3 = Path(td) / "a.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(clip), "-ac", "1", "-ar", "16000", "-vn",
                        "-c:a", "libmp3lame", "-b:a", "48k", str(mp3)], check=True)
        key = os.environ.get("GROQ_API_KEY")
        if key:
            import requests
            with open(mp3, "rb") as fh:
                r = requests.post("https://api.groq.com/openai/v1/audio/transcriptions",
                                  headers={"Authorization": f"Bearer {key}"}, timeout=300,
                                  files={"file": ("a.mp3", fh, "audio/mpeg")},
                                  data=[("model", "whisper-large-v3"), ("response_format", "verbose_json"),
                                        ("timestamp_granularities[]", "word")])
            if r.status_code == 401:
                die("Groq rejected the API key. Check GROQ_API_KEY in plugins/vibe-editing/config/keys.env.")
            if r.status_code != 200:
                die(f"Groq transcription failed ({r.status_code}): {r.text[:200]}")
            return [{"word": w["word"].strip(), "start": w["start"], "end": w["end"]} for w in r.json()["words"]]
        try:
            from faster_whisper import WhisperModel
        except ImportError:
            die("No GROQ_API_KEY and faster-whisper is not installed, so nothing can transcribe this clip.")
        print("No Groq key: using offline transcription (slower).")
        segs, _ = WhisperModel("small", compute_type="int8").transcribe(str(mp3), word_timestamps=True)
        return [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segs for w in s.words]


def fit_camera(clip, duration):
    """Place the crop so the speaker's head sits inside the card. Without this, footage with the
    head high in frame loses the top of it. Falls back to the centre if no face is found."""
    max_shift = int(1920 * SCALE - CARD_H)
    fallback = {"vw": VW, "vx": -(VW - CARD_W) // 2, "vy": -max_shift // 2}
    try:
        import cv2
    except ImportError:
        print("Camera: OpenCV missing, using a centred crop. Check the framing by eye.")
        return fallback
    det = cv2.FaceDetectorYN.create(str(YUNET), "", (1080, 1920), 0.6)
    cap = cv2.VideoCapture(str(clip))
    tops, xs = [], []
    for i in range(12):
        cap.set(cv2.CAP_PROP_POS_MSEC, 1000 * duration * (i + 0.5) / 12)
        ok, fr = cap.read()
        if not ok:
            continue
        det.setInputSize((fr.shape[1], fr.shape[0]))
        _, faces = det.detect(fr)
        if faces is not None and len(faces):
            f = max(faces, key=lambda r: r[2] * r[3])
            tops.append(float(f[1]) - 0.45 * float(f[3]))  # forehead up to hair or a hat
            xs.append(float(f[0]) + float(f[2]) / 2)
    cap.release()
    if not tops:
        print("Camera: no face found, using a centred crop. Check the framing by eye.")
        return fallback
    tops.sort(); xs.sort()
    head_top = tops[max(0, len(tops) // 5)]  # near the highest the head goes, ignoring one-off misses
    vy = -int(max(0, head_top - 40) * SCALE)
    vy = max(-max_shift, min(0, vy))
    vx = int(CARD_W / 2 - xs[len(xs) // 2] * SCALE)
    vx = max(-(VW - CARD_W), min(0, vx))
    print(f"Camera: face found in {len(tops)}/12 samples, vy={vy}, vx={vx}")
    return {"vw": VW, "vx": vx, "vy": vy}


def shotlist(words, fps, path):
    """Spoken lines with times, split on pauses and sentence ends, for choosing scene times."""
    lines, cur = [], []
    for i, w in enumerate(words):
        cur.append(w)
        gap = words[i + 1]["start"] - w["end"] if i + 1 < len(words) else 9
        if gap > 0.45 or re.search(r"[.?!]$", w["word"]) or len(cur) >= 14:
            lines.append(cur)
            cur = []
    with open(path, "w") as f:
        f.write(f"# Shot list\n\n{fps} fps. Times are seconds on this clip.\n\n| start | end | line |\n|---|---|---|\n")
        for ln in lines:
            f.write(f"| {ln[0]['start']:.2f} | {ln[-1]['end']:.2f} | {' '.join(x['word'] for x in ln)} |\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("clip")
    ap.add_argument("--work")
    ap.add_argument("--words", help="existing words JSON; skips transcription")
    a = ap.parse_args()
    clip = Path(a.clip).resolve()
    if not clip.is_file():
        die(f"no such file: {clip}")
    w, h, fps, dur = probe(clip)
    if (w, h) != (1080, 1920):
        die(f"graphics needs a finished 1080x1920 clip, and this one is {w}x{h}. Cut it to vertical first.")
    work = Path(a.work).resolve() if a.work else Path.cwd() / "10_WORK/graphics" / clip.stem
    work.mkdir(parents=True, exist_ok=True)
    shutil.copy2(clip, work / "clip.mp4")
    if a.words:
        raw = json.load(open(a.words))
        raw = raw["words"] if isinstance(raw, dict) else raw
        words = [{"word": x["word"].strip(), "start": x["start"], "end": x["end"]} for x in raw]
    else:
        words = transcribe(clip)
    if not words:
        die("the transcript came back empty, so there is nothing to tie graphics to.")
    json.dump(words, open(work / "words.json", "w"), indent=0)
    shotlist(words, fps, work / "shotlist.md")
    brand_file = KIT / "brand/graphics.json"
    brand = json.load(open(brand_file)) if brand_file.is_file() else {}
    spec_path = work / "spec.json"
    scenes, allow = [], []
    if spec_path.is_file():  # re-running keeps scenes already written
        old = json.load(open(spec_path))
        scenes, allow = old.get("scenes", []), old.get("allow", [])
    json.dump({"name": clip.stem, "video": "clip.mp4", "fps": fps, "duration": round(dur, 3),
               "camera": fit_camera(work / "clip.mp4", dur), "brand": brand, "allow": allow, "scenes": scenes},
              open(spec_path, "w"), indent=2)
    print(f"Ready: {work}\n  {len(words)} words, {dur:.1f}s at {fps} fps\n  Next: write the scenes into spec.json from shotlist.md")


main()
