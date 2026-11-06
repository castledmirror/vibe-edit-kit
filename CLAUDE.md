# Vibe Edit Kit: how to run this project

This folder is the **Vibe Edit Kit**: it turns footage into finished, captioned **vertical clips**
in the creator's own brand, with optional motion graphics. It's built to be run by
**non-technical creators** — so when you help someone here, do the work yourself, never make them
run terminal commands or hand-edit files, and explain what's happening in plain English.

## Start here
Read `brand/brand_profile.md` before any edit. If it is blank, run the brand interview in `ONBOARDING.md`.

| The user wants | Read and follow |
|---|---|
| Clips from footage shot vertically ("vibe edit this folder") | `plugins/vibe-editing/skills/vibe-edit/SKILL.md` |
| Graphics on a finished clip, only when asked ("add graphics") | `plugins/vibe-editing/skills/graphics/SKILL.md` |
| Clips from a long horizontal video or a link | The section below |

## Making clips from long or horizontal video
When the user gives you a video — a YouTube/URL link or a local file — and asks for clips in ANY
plain-English way ("make clips from this", "cut this up", "shorts from this", "/edit <link>"):

1. Read **`plugins/vibe-editing/skills/edit/SKILL.md`** and follow its spine end-to-end.
2. Put source footage in the project's `00_SOURCE/`, scratch in `10_WORK/`, and finished clips in
   **`20_DELIVER/`**. Show the user the delivered clips when you're done.
3. The pipeline mines the strongest moments, hand-cuts, face-tracks to 9:16, captions, mixes music,
   renders, and runs a 6-gate self-audit — a clip that fails a gate doesn't ship.

You do **not** need the `/edit` slash command or any plugin install — run the workflow directly
from the scripts in `plugins/vibe-editing/`. (A `/edit` shortcut is available if the user wants it:
`/plugin marketplace add .` then `/plugin install vibe-editing@vibe-edit-kit`.)

## Horizontal "mid" videos (the highlight skill)
If the user wants HORIZONTAL 16:9 "mid" videos for SUBSCRIBER growth from a long recording —
"mine highlights", "make mids", "highlights channel", "post and schedule these" — read
`plugins/vibe-editing/skills/highlight/SKILL.md` and follow it. These are regular 16:9 videos,
NOT 9:16 shorts (shorts = the edit pipeline above). The CTA outro is user-supplied and optional
at `brand/cta/outro.mp4`. POST mode titles + schedules to the user's OWN YouTube via their own
Google sign-in — never any other account.

## First-time setup (only if it isn't set up yet)
If `plugins/vibe-editing/.venv` is missing, or `python3 plugins/vibe-editing/doctor.py` reports
missing tools, run `./setup.sh`. A free Groq key in
`plugins/vibe-editing/config/keys.env` makes transcription ~10× faster; without it, it uses free
offline transcription. Full first-run + brand interview: **`ONBOARDING.md`**.

## Brand it / change it
Brand assets live in `brand/` (logos, fonts, music, caption-style, animations, graphics colors). When the user wants
their brand applied, or any change ("captions bigger", "use this logo", "cut tighter", "don't open
on a question"), update the right config and re-run:
- captions → `plugins/vibe-editing/skills/caption-clips/presets/spice.json`
- font → bundled `plugins/vibe-editing/skills/caption-clips/fonts/` (or their own in `brand/fonts/`)
- what makes a clip worth cutting → `plugins/vibe-editing/skills/edit/prompts/clip_select.md`
- music → `brand/music/`
- graphics colors and font → `brand/graphics.json`

## Rules
- Graphics are optional. Never add or suggest them unless the user asks. A clean captioned clip is a finished clip.
- Always run kit scripts with `plugins/vibe-editing/.venv/bin` first on PATH. It holds the kit's Python and the ffprobe fix.
- Only use this kit — don't pull tools or keys from anywhere else on the machine.
- Never delete the user's source footage. Re-renders overwrite the delivered clip in place.
- Be patient and plain-spoken; assume they've never used a terminal.
