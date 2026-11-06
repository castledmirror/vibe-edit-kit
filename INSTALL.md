# Install

`ONBOARDING.md` is the easy way. To do it by hand:

```bash
bash setup.sh
```

This installs what's missing (ffmpeg, yt-dlp, tesseract, rclone), creates a Python environment, and links the `vibe-edit` and `graphics` skills so they work from any folder. It never replaces a skill you already have.

Python 3.10 to 3.13 is required. On a Mac whose default Python is older, setup finds or installs a newer one.

Graphics are optional. Their engine installs the first time you ask for graphics, which also needs [Node.js](https://nodejs.org).

Add keys to `plugins/vibe-editing/config/keys.env`. All are optional:

| Key | What for |
|---|---|
| `GROQ_API_KEY` | Fast transcription. Without it, the kit transcribes offline |
| `ANTHROPIC_API_KEY` | Most reliable caption styling. Without it, your Claude Code login is used |
| `ELEVENLABS_API_KEY` | Audio cleanup in the long-form pipeline |

Check it worked: `python3 plugins/vibe-editing/doctor.py`

To use it as a plugin instead: `/plugin marketplace add .` then `/plugin install vibe-editing@vibe-edit-kit`
