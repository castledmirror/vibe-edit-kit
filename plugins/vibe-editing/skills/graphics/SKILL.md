---
name: graphics
description: Optional. Add motion graphics to a finished vertical clip, tied word by word to what the speaker says. Use only when the user explicitly asks, such as "add graphics", "add motion graphics" or "graphics on this clip". Not for standalone animated explainers (use promo) and not for captions (those are already burned in).
---

# graphics: motion graphics on a finished clip

**This is optional.** A clean clip with captions is a finished clip, and many good reels have no graphics. Never add graphics or suggest them by default. Run this only when the user asks, and only on the clips they name.

The clip stays the star. When a graphic plays, the speaker drops into a card in the lower part of the frame and the graphic takes the top. When it ends, the speaker returns to full frame. Graphics are written as a scene list and rendered in code, so the look comes from one brand file and every revision is a quick re-render.

Input: a finished 1080x1920 clip, normally from `20_DELIVER/`. Captions already burned in are fine: they move with the speaker into the card. The original clip is never changed. Output: `20_DELIVER/<name>_graphics.mp4`.

**License check.** Graphics run on Remotion, which is not open source. It is free for individuals and groups of up to 3 people; 4 or more, counting contractors, need a paid company license from remotion.dev/license. If you don't know the user's company size, ask once before the first render.

## 1. Prepare

```bash
KIT=~/.vibe-edit-kit; [ -d "$KIT" ] || KIT="$(pwd)"
PLUG=$KIT/plugins/vibe-editing; GS=$PLUG/skills/graphics/scripts
export PATH="$PLUG/.venv/bin:$PATH" PYTHONDONTWRITEBYTECODE=1
python3 $GS/prepare.py 20_DELIVER/<clip>.mp4
```

This makes `10_WORK/graphics/<clip>/` with `clip.mp4`, `words.json`, `shotlist.md` and a `spec.json` skeleton. It scans the clip for the speaker's face and sets the crop, so heads do not get cut off in the card. Copy any real screenshots you plan to show into that folder.

## 2. Plan the scenes

Read `shotlist.md` and add scenes to `spec.json`. Times are seconds on this clip. See `examples/spec.example.json`.

| Moment in the script | Scene | Fields |
|---|---|---|
| A line worth reading | `kicker` | `line1`, `line2` |
| The one sentence to remember | `quote` | `text`, `accent` (a part of `text`) |
| A number | `stat` | `value`, `caption`, `sub`; add `countTo`, `prefix`, `suffix` to count up |
| A list, shown as it is said | `rows` | `items[{n,title,sub}]`, `at` (a time per row) |
| A list, teased then revealed | `tease` | `items`, `reveal` (a time per row, or `null` to stay blurred) |
| Two sides of a contrast | `twoUp` | `left{head,lines}`, `right{head,lines}` |
| Steps in order | `chain` | `steps[{step,says}]`, `match` |
| A repeating cycle | `loop` | `nodes` (3 or 4) |
| Before and after, this vs that | `bars` | `items[{label,value,display,hero}]` |
| Proof | `shot` | `src`, `caption` |
| The ask | `cta` | `line1`, `line2`, `action`, `where` |

Every scene also needs `id`, `type`, `start`, `end`, and can take a `head` line. Rows and tease fit 4 items at most. Keep titles short: the layout gate fails anything that does not fit.

### The rules

1. **Say what they say.** Every word on screen comes off the transcript. The delivered take beats the written script. Use the speaker's words, not a better phrasing of them. `validate.py` enforces this.
2. **Nothing invented.** No made-up numbers, logos, URLs or credentials. If a word truly must appear unspoken, such as a brand name, add it to `allow` with a reason and tell the user. Never use `allow` to get a claim onto the screen.
3. **Real beats fake.** A real screenshot beats any illustration. Show it complete at its true aspect ratio.
4. **Land the hook on the face.** Start the first graphic after the hook, usually past 2s.
5. **Give it room.** Leave full-frame breathers between scenes. A scene needs at least 1.5s, and about 3s if it has several parts to read. Don't cover more than 85% of the clip.
6. **Show the idea, don't caption it.** Captions already carry the words. A graphic should show structure: the count, the contrast, the steps, the number growing.
7. **Tease, then reveal.** When the speaker lists things, put them all up blurred, then un-blur each on the word they name it. The viewer can count them and wants to know what they are. The blurred labels must be the speaker's own words.
8. **Built for a phone.** If text cannot be big enough to read, cut it rather than shrink it.

## 3. Build

```bash
bash $GS/build.sh 10_WORK/graphics/<clip> --qa-only           # both gates, no render
bash $GS/build.sh 10_WORK/graphics/<clip> --still 12.5        # one frame to look at
bash $GS/build.sh 10_WORK/graphics/<clip>                     # gates, then render
```

The content gate checks timing and that every word traces to the transcript. The layout gate renders stills across every scene and fails on text that is clipped, overflowing, out of frame, or under 8.5pt on a phone. If either fails, nothing renders. The first build installs the engine (it needs Node.js from nodejs.org, and internet), and fonts load from the internet on every build.

## 4. Look at it

The gates cannot see overlaps or taste. After rendering, extract a frame from each scene and look:

```bash
ffmpeg -v error -y -ss <t> -i 20_DELIVER/<clip>_graphics.mp4 -frames:v 1 -update 1 10_WORK/graphics/<clip>/check.jpg
```

Check that the head is fully in the card, captions are readable, and nothing overlaps. If the crop is wrong, adjust `camera.vy` in `spec.json`: closer to 0 shows more of the top of the source. Compare loudness to the source; it should match.

## Rebrand

`brand/graphics.json` sets `accent`, `accentSoft`, `ink`, `bg` and `fontSet` (`poppins`, `poppins-playfair`, `inter-playfair`). Run `prepare.py` again on a clip to pick up a change. To add a new scene type, build it in `template/src/components/Scenes.tsx`, add it to `spec.ts`, and add its required fields to `validate.py`.
