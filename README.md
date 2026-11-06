# Vibe Edit Kit

**Raw footage in. Finished, captioned clips out.** Tell Claude Code what you want in plain English and it does the editing.

By Ocean Gross, built on the open-source [Vibe Editing](https://github.com/maddexritter-rgb/vibe-editing) project. See `NOTICE.md`.

> **Start here:** click the green **Code** button above, choose **Download ZIP**, and unzip it. Then open the folder in the Claude Code app and paste the box from `ONBOARDING.md`. It installs everything, interviews you about your brand and makes a test clip. No editing software and no terminal needed. `Vibe-Edit-Kit-Playbook.pdf` is the walkthrough.

## What it does

| You say | You get |
|---|---|
| "Vibe edit this folder" | Vertical clips from footage you shot vertically: cut, captioned and leveled, with hook variants |
| "Make clips from this video" | Long horizontal recordings mined, face-tracked to 9:16 and quality-checked |
| "Mine highlights from this" | Horizontal 16:9 "mid" videos |
| "Make a promo" | Standalone animated explainers |
| "Add graphics to this clip" | Optional motion graphics, tied word by word to what you said |

## Graphics are optional

A clean clip with captions is a finished clip, so nothing adds graphics unless you ask, and their engine doesn't install until then. When you do ask, Claude plans scenes from your transcript and builds them. It only uses words you actually said.

## What you bring

| You bring | Where |
|---|---|
| Footage | Any folder |
| A free Groq key (optional, much faster transcription) | `plugins/vibe-editing/config/keys.env` |
| Your brand | The interview fills in `brand/` |
| A Remotion license, only if you use graphics and your company is 4+ people | See `NOTICE.md` |

Setup needs a Mac, a paid Claude plan, and about 15 minutes. Check readiness any time: `python3 plugins/vibe-editing/doctor.py`
