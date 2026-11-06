---
name: vibe-edit
description: Vibe-edit the footage in the CURRENT folder into finished, captioned vertical clips using the Vibe Edit Kit as the rulebook and toolbox. Use when the user says "/vibe-edit", "vibe edit this folder", "edit this footage", "make clips from this folder", "cut these into reels/ads".
---

# /vibe-edit: edit the footage in this folder

| Folder | Role | Write there? |
|---|---|---|
| The folder the user opened | The footage and all output: `10_WORK/` (scratch), `20_DELIVER/` (finished clips) | Yes |
| The kit (`~/.vibe-edit-kit`, or this skill's own kit if run from inside it) | Rules, brand profile, tools, keys | No. Read-only during an edit |

Never move, rename, re-encode or delete source footage. Reference it in place by absolute path.
Do the work yourself, never ask the user to run commands, and explain in plain English.
This is the default for footage already shot vertically. For long horizontal recordings, use the `edit` skill.

## 0. Setup, every run

```bash
KIT=~/.vibe-edit-kit; [ -d "$KIT" ] || KIT="$(pwd)"   # the folder holding brand/ and plugins/
PLUG=$KIT/plugins/vibe-editing
SK=$PLUG/skills/vibe-edit/scripts
export PATH="$PLUG/.venv/bin:$PATH"   # kit Python plus the ffprobe fix
export PYTHONDONTWRITEBYTECODE=1
mkdir -p 10_WORK 20_DELIVER
```

## 1. Read the rules

1. `$KIT/brand/brand_profile.md`: caption look, hooks, endings, the "never" list, length, music. If it is still blank, run the brand interview in `$KIT/ONBOARDING.md` first.
2. `$PLUG/skills/edit/prompts/clip_select.md`, especially BRAND RULES.

## 2. Inventory the folder

- `ffprobe` every video for size, rotation side data, fps and duration. Many cameras store vertical footage as 1920x1080 with `rotation=90`. ffmpeg auto-rotates it, so the vertical pipeline still outputs 1080x1920.
- Make a contact sheet per file (`ffmpeg -i F -vf "fps=1/20,scale=240:-1,tile=6x2" -frames:v 1 sheet.jpg`) and look at it: to-camera read or call, who is on camera, empty or test clips. Skip test clips under 15s with no speech.

## 3. Transcribe and map silences

```bash
python3 $SK/prep.py                            # audio, word-level transcript, silence map for every video
python3 $SK/words.py <NAME> <from_s> <to_s>    # words with times and ‖pauses‖, for picking edit points
```

It uses Groq when a key is set and offline Whisper when not. Whisper often stretches a word across a pause, so trust `silences/` for dead air, not gaps between words. Split files over about 60 minutes first.

## 4. Decide what each file is, then pick the clips

- **Hook stack** (several hooks read up front, then one body): one deliverable per hook, hook plus shared body, named `vN_hookN_<slug>`.
- **Scripted reads or ad takes:** best take of each line, drop flubs, retakes and dead air, one clean clip per script, named `adN_<slug>`.
- **Calls, coaching, meetings:** mine the user's own standalone lessons. Use only their voice. Never name or identify a client: skip ranges with client names, cities or business details. Each clip needs a bold or contrarian hook, or a number, and a payoff. Where a second strong opener exists, make variants sharing the body (`vN_hookA_<slug>`, `vN_hookB_<slug>`) for trial reels.
- Never open on "so", "um", "okay", "yeah" or "and": start one word later. In calls, watch for the other person's last word bleeding into the first word.

## 5. Build and render

One command per clip. Each `a-b` keeps the words whose START is inside it. Edges snap to words, interior pauses of 0.6s or more are trimmed, and segments play in the order given, so a hook can come from later in the recording.

```bash
python3 $SK/mkclip.py <clip_name> <SOURCE_BASENAME> "<who the speaker is, one line on the clip>" a-b c-d [--corr wrongword=rightword ...]
bash $SK/render_all.sh                # 3 at a time, about 1.5 minutes per 40s clip
ONLY='v2*' bash $SK/render_all.sh     # just some; the engine only rebuilds what changed
```

`--corr` makes captions show what the speaker meant for small slips (`post=posted`). Never use it to change meaning.

## 6. QC before showing the user

`bash $SK/qc.sh` runs the checks. Then read every result yourself:

- It opens on the hook word, has no other voice, names no client, has no garbled words at cuts, and ends on a finished thought.
- Look at the frame strip: vertical, upright, captions readable.
- Read the burned caption text in `10_WORK/clips/<c>/10_WORK/captions_work/subs_text.srt`, not just the audio.

"RES 1080x1920 (want 4K)" is expected for 1080p footage. Fix problems in `cuts.json` or `corrections` and re-render that clip.

## 7. Deliver

Write `20_DELIVER/EDIT_NOTES.md`: each clip, length, hook, what it is for, which hook variants pair up, and where a proof screenshot from `$KIT/brand/proof/` would fit. The clips are finished at this point. Add graphics only if the user asks for them.

## Known gotchas

- The caption stage re-transcribes, so it can drop a first word or mishear a phrase. Copy its `caption_gen_cache/*/transcript.json` to `10_WORK/words_pinned.json`, edit the words, set `"words": "10_WORK/words_pinned.json"` in the manifest's `captions` block, and re-render.
- The number formatter can mangle amounts ("a few million dollars"). In pinned words, write the final form ("$100K") or put the phrase in one token ("few million"). Multi-word tokens pass through untouched.
- Whisper can invent words on trailing silence. Re-transcribe the last 2s to confirm before recutting.
- Call audio can land near -18.5 LUFS. Set `mix.voice_lufs` to -14 for those clips.
