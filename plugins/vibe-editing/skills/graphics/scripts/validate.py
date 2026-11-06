#!/usr/bin/env python3
"""Content gate for a graphics spec: validate.py <workdir>

Timing must be sane, images must exist, and every word on screen must come off the transcript.
A word the speaker did not say can only pass through the spec's `allow` list, each with a reason,
and those are printed so a person can see them.
"""
import json, re, sys
from pathlib import Path
try:
    from num2words import num2words
except ImportError:
    num2words = None

work = Path(sys.argv[1])
spec = json.load(open(work / "spec.json"))
words = json.load(open(work / "words.json"))
fails, warns = [], []
TYPES = {"kicker": ["line1"], "quote": ["text"], "stat": ["value", "caption"], "rows": ["items"], "tease": ["items", "reveal"],
         "twoUp": ["left", "right"], "chain": ["steps"], "loop": ["nodes"], "bars": ["items"], "shot": ["src"], "cta": ["line1", "action"]}
FILLER = {"a", "an", "the", "of", "to", "in", "on", "and", "or", "for", "vs", "is", "it", "at", "by", "with", "your", "you", "my"}
NON_TEXT = {"id", "type", "start", "end", "at", "reveal", "src", "value_num", "countTo", "n", "prefix", "suffix"}


def toks(s):
    return re.findall(r"[a-z0-9$%][a-z0-9'.,$%]*", s.lower().replace("’", "'"))


def norm(t):
    return t.strip(".,'%$")


said_raw = " ".join(w["word"] for w in words)
said = {norm(t) for t in toks(said_raw)} | {t.removesuffix("'s") for t in map(norm, toks(said_raw))}
allow = {a["word"].lower(): a.get("why", "") for a in spec.get("allow", [])}
for a in spec.get("allow", []):
    if not a.get("why"):
        fails.append(f'allow entry "{a.get("word")}" has no reason')


def strings(x, key=None):
    if key in NON_TEXT:
        return
    if isinstance(x, str):
        yield x
    elif isinstance(x, dict):
        for k, v in x.items():
            yield from strings(v, k)
    elif isinstance(x, list):
        for v in x:
            yield from strings(v, key)


def spoken(tok):
    t = norm(tok)
    if not t or t in FILLER or t in said or tok in allow or t in allow:
        return True
    if t.replace(",", "").replace(".", "").isdigit() and num2words:
        spelled = re.findall(r"[a-z]+", num2words(int(float(t.replace(",", "")))).lower())
        return all(p == "and" or p in said for p in spelled) or t.replace(",", "") in said_raw.replace(",", "")
    return False


seen_ids, last_end = set(), 0.0
scenes = sorted(spec["scenes"], key=lambda s: s["start"])
if not scenes:
    fails.append("no scenes in spec.json")
for s in scenes:
    sid = s.get("id", "?")
    if sid in seen_ids:
        fails.append(f"{sid}: duplicate id")
    seen_ids.add(sid)
    t = s.get("type")
    if t not in TYPES:
        fails.append(f"{sid}: unknown type {t}")
        continue
    for k in TYPES[t]:
        if k not in s:
            fails.append(f"{sid}: {t} needs {k}")
    if s["end"] > spec["duration"] + 0.01 or s["start"] < 0:
        fails.append(f"{sid}: outside the clip ({spec['duration']}s)")
    if s["end"] - s["start"] < 1.5:
        fails.append(f"{sid}: {s['end'] - s['start']:.1f}s is too short to read")
    if s["start"] < last_end - 0.01:
        fails.append(f"{sid}: overlaps the scene before it")
    last_end = max(last_end, s["end"])
    if t == "shot" and not (work / s.get("src", "")).is_file():
        fails.append(f"{sid}: image {s.get('src')} is not in the work folder")
    if t in ("rows", "tease") and len(s.get("items", [])) > 4:
        fails.append(f"{sid}: max 4 rows fit")
    if t == "tease" and len(s.get("reveal", [])) != len(s.get("items", [])):
        fails.append(f"{sid}: tease needs one reveal time per item")
    if t == "tease" and not any(r is not None for r in s.get("reveal", [])):
        warns.append(f"{sid}: nothing ever un-blurs in this scene; fine only if a later scene pays it off")
    for r in list(s.get("reveal") or []) + list(s.get("at") or []):
        if r is not None and not s["start"] <= r <= s["end"]:
            fails.append(f"{sid}: time {r} is outside the scene")
    missed = [tok for st in strings({k: v for k, v in s.items() if k != "src"}) for tok in toks(st) if not spoken(tok)]
    if missed:
        fails.append(f"{sid}: not said in the clip: {', '.join(dict.fromkeys(missed))}")
if scenes and scenes[0]["start"] < 2.0:
    warns.append("the first graphic starts before 2s; the hook usually lands harder on the speaker's face")
covered = sum(s["end"] - s["start"] for s in scenes)
if spec["duration"] and covered / spec["duration"] > 0.85:
    warns.append(f"graphics cover {covered / spec['duration']:.0%} of the clip; leave full-frame breathers")

for a, why in allow.items():
    print(f'ALLOWED, not spoken: "{a}" ({why})')
for w in warns:
    print("WARN:", w)
if fails:
    print(f"FAIL: {len(fails)} issue(s)")
    for f in fails:
        print("  -", f)
    sys.exit(1)
print(f"PASS: {len(scenes)} scenes, {covered:.0f}s of {spec['duration']:.0f}s, every word traced to the transcript")
