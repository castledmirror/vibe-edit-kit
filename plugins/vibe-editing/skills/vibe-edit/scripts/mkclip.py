#!/usr/bin/env python3
"""Make a vertical-pipeline render project from word-snapped ranges.

mkclip.py <clip_name> <source_basename> "<context>" a-b[:label] [c-d[:label] ...] [--corr from=to ...]
Each a-b range keeps the words whose START falls in [a, b]; in/out snap to word edges.
"""
import json, sys
from pathlib import Path

ROOT = Path.cwd()  # run from the footage folder
PLUG = Path(__file__).resolve().parents[3]

name, src, context, *rest = sys.argv[1:]
corr = {}
if "--corr" in rest:
    i = rest.index("--corr")
    corr = dict(x.split("=", 1) for x in rest[i + 1:])
    rest = rest[:i]

words = json.load(open(ROOT / "10_WORK/transcripts" / f"{src}.json"))["words"]
silences = json.load(open(ROOT / "10_WORK/silences" / f"{src}.json"))
PAD, MIN_GAP = 0.12, 0.6


def trim_dead_air(t_in, t_out):
    """Pull edges out of silence and drop interior pauses >= MIN_GAP (keeping PAD of air each side)."""
    for a, b in silences:
        if a <= t_in < b:
            t_in = max(t_in, b - 0.1)
        if a < t_out <= b:
            t_out = min(t_out, a + 0.15)
    pieces, cur = [], t_in
    for a, b in silences:
        if b - a >= MIN_GAP and cur < a and b < t_out:
            pieces.append((cur, a + PAD))
            cur = b - PAD
    pieces.append((cur, t_out))
    return [(round(x, 2), round(y, 2)) for x, y in pieces if y - x > 0.15]


segs = []
for r in rest:
    rng, _, label = r.partition(":")
    a, b = map(float, rng.split("-"))
    idx = [i for i, w in enumerate(words) if a <= w["start"] <= b]
    first, last = idx[0], idx[-1]
    prev_end = words[first - 1]["end"] if first > 0 else 0.0
    next_start = words[last + 1]["start"] if last + 1 < len(words) else words[last]["end"] + 1
    t_in = max(words[first]["start"] - 0.08, prev_end + 0.02, 0.0)
    t_out = max(min(words[last]["end"] + 0.15, next_start - 0.03), words[last]["end"])
    text = " ".join(w["word"] for w in words[first:last + 1])
    pieces = trim_dead_air(t_in, t_out)
    for k, (x, y) in enumerate(pieces):
        segs.append({"in": x, "out": y, "label": (label or text[:60]) + (f" [{k + 1}/{len(pieces)}]" if len(pieces) > 1 else "")})
    print(f"  {t_in:7.2f}-{t_out:7.2f} ({len(pieces)} pc)  {text}")

merged = []
for sg in segs:  # glue pieces separated by a hair (< 0.1s) back together
    if merged and sg["in"] - merged[-1]["out"] < 0.1 and sg["in"] >= merged[-1]["out"] - 0.01:
        merged[-1]["out"] = sg["out"]
    else:
        merged.append(sg)
segs = merged

proj = ROOT / "10_WORK/clips" / name
(proj / "10_WORK").mkdir(parents=True, exist_ok=True)
json.dump({"segments": segs}, open(proj / "10_WORK/cuts.json", "w"), indent=1)
source = str(next(p for p in ROOT.iterdir() if p.stem == src and p.suffix.lower() in (".mp4", ".mov")).resolve())
manifest = {
    "title": name, "pipeline": "vertical",
    "output": {"name": f"{name}.mp4", "dir": str(ROOT / "20_DELIVER"), "versioned": False},
    "stages": {
        "cut": {"source_video": source, "source_audio": source, "spec": "10_WORK/cuts.json"},
        "captions": {"preset": str(PLUG / "skills/caption-clips/presets/spice.json"), "no_layout": True,
                     "corrections": corr, "context": context},
        "mix": {"voice_lufs": -16},
        "leadfix": {"head_trim": 0.0},
    },
}
json.dump(manifest, open(proj / "manifest.json", "w"), indent=1)
print(f"{name}: {sum(s['out'] - s['in'] for s in segs):.1f}s, {len(segs)} segs")
