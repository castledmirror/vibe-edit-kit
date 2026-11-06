# Vibe Edit Kit: setup

Turn your videos into finished clips in your own brand, without editing anything yourself. Claude Code does the setup and asks a few simple questions. It takes about 15 minutes.

**1. Get the Claude Code desktop app** from https://claude.com/claude-code and sign in. You need a paid Claude plan.

**2. Download the kit.** Go to https://github.com/castledmirror/vibe-edit-kit, click the green **Code** button, then **Download ZIP**, and unzip it.

**3. Open that folder in Claude Code,** start a new chat, and paste everything in the box below.

**4. Answer its questions.** When it asks permission to install something, click Allow. It finishes by making you a test clip.

### Copy from here

```
You're setting up the Vibe Edit Kit for me on this Mac. I am NOT technical, so do everything
yourself, never make me run a terminal command or edit a file by hand, and explain each step in
plain English. Keep a visible to-do list and check it off as you go.

1) SET UP MY MACHINE
   - Work inside this folder. If it doesn't contain setup.sh, stop and ask me where the kit is.
   - Run bash setup.sh. If Homebrew is missing, install it first.
   - Re-run python3 plugins/vibe-editing/doctor.py until it prints READY, then tell me it's ready.

2) FAST TRANSCRIPTION
   - Walk me through getting a free key: go to console.groq.com, sign up, create an API key, copy it.
   - Ask me to paste it here, save it to plugins/vibe-editing/config/keys.env, and never show it again.
   - If I'd rather skip it, offline transcription is used automatically.

3) MAKE IT MY BRAND. Ask ONE question at a time and wait for each answer.
   - My brand or channel name, and which platforms I post on
   - What my videos are about
   - My hooks: how should a clip open?
   - My endings: how should a clip end?
   - Anything a clip must never do
   - Caption look: show me a few fonts from the library, or let me paste a screenshot of captions I like
   Then save my answers to brand/brand_profile.md, the BRAND RULES section of
   plugins/vibe-editing/skills/edit/prompts/clip_select.md,
   and plugins/vibe-editing/skills/caption-clips/presets/spice.json.
   Show me what changed.

4) MAKE A TEST CLIP
   - Ask me for a folder with one short video I shot vertically, and run the vibe-edit skill on it.
   - Show me the clip, ask what I'd change, and adjust until I love it.
   - Don't add graphics. They're optional, and I'll ask if I want them.
```

### Copy to here

## Once it's set up

- **Make clips:** open a folder of footage in Claude Code and say *"vibe edit this folder."*
- **Long horizontal videos:** give it a file or link and say *"make clips from this."*
- **Want graphics on a clip?** They're optional. Say *"add graphics to this clip."* The first time, Claude asks about your colors and company size and installs what it needs.
- **Change anything:** *"make the captions bigger," "use this logo," "cut it tighter."*
- **Finished clips** land in `20_DELIVER/` inside your footage folder.

Windows: install [WSL](https://learn.microsoft.com/windows/wsl/install) first and do everything inside it. This has not been tested as part of this kit.
