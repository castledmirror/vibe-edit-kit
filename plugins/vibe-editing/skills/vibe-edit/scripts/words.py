#!/usr/bin/env python3
"""Print words with start times (and ‖gaps‖) for a transcript window: words.py NAME a b  (run from footage folder)."""
import json, sys
d = json.load(open(f"10_WORK/transcripts/{sys.argv[1]}.json")); a, b = float(sys.argv[2]), float(sys.argv[3])
out, prev = [], None
for w in d["words"]:
    if a <= w["start"] <= b:
        gap = w["start"] - prev if prev is not None else 0
        out.append((f" ‖{gap:.1f}‖ " if gap > 0.6 else " ") + f"[{w['start']:.2f}]{w['word']}")
        prev = w["end"]
print("".join(out))
