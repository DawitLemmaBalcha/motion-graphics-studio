# tools/ — runnable code

If it has to be *executed*, it lives here. Scripts are copied out of `repos/` (with attribution) so that
upstream clones stay pristine.

## Installed on this machine (verified)

| Tool | Version | Notes |
|---|---|---|
| Node.js | v22.22.2 | HyperFrames requires 22+ |
| FFmpeg / ffprobe | 8.1.1 (winget, Gyan build) | on PATH |
| git | present | |
| Python | 3.14 | available if a script needs it |
| HyperFrames CLI | 0.8.214 via `npx` | do not install globally; pin the version in scripts |

## Planned contents

| Tool | Purpose | Source |
|---|---|---|
| `check-env.ps1` | node/ffmpeg/hyperframes/repos — run before blaming the code | ours |
| `render.ps1` | one-command render of a `work/` piece, into `renders/`, timestamped | ours |
| `measure.ps1` | the quality bar as numbers: duration, fps, freezes, hold, LUFS, true peak, **LRA**, contrast | ours |
| `safeguides.ps1` | burns 90%/80% safe boxes + the platform UI bands onto key frames | ours |
| `music.mjs` | original music bed of any length | `repos/claude-animation-skill` (MIT) |
| `ambient.mjs`, `chiptune.mjs` | ambient pad bed, chiptune bed | same (MIT) |
| `sound.mjs` | sound cues on a timeline + bed + loudnorm + mux | same (MIT) |
| `ffmpeg recipes` | delivery encodes, motion blur, concat, subtitles | `repos/ffmpeg-skill` (MIT) |
| `find-source.ps1` | search the inspiration corpora: `-Loop tunnel` (80 loop sources), `-Prompt shader` (703 prompts), `-Repo three` (190 licensed source links) | ours |
| `render-loop.mjs` | renders a Canvas loop to 12s @ 24fps with 8-sample motion blur + 2× supersampling; `--check` proves determinism and a seamless loop point; `--qa` checks any MP4's seam | `templates/scenario-motion-loops/scripts/` (Scenario exploration) |
| `smoke/` | 20-second render sanity check after any toolchain change | ours |

`render-loop.mjs` is the one tool here that needs Playwright (`npm i playwright` then
`npx playwright install chromium`, or `--channel chrome`). Use it when a piece needs a **seamless
background loop** — it will refuse to encode unless the loop-seam check prints `PASS`, which is a
quality gate we'd otherwise be eyeballing.

**Rule:** every script takes arguments, writes to `work/<piece>/renders/`, and never overwrites a good file
with a failed one.

**Scripts are invoked with `-ExecutionPolicy Bypass`.** `powershell -NoProfile -ExecutionPolicy Bypass -File .\tools\measure.ps1 ...`
— the machine policy is RemoteSigned and a re-saved script can intermittently trip it.

**Keep `.ps1` files ASCII-only.** Windows PowerShell 5.1 reads a BOM-less script as ANSI, so a single
em dash (UTF-8 `E2 80 94`) decodes as a smart quote, opens a phantom string, and produces seven
nonsense parse errors ("Missing closing '}'", "Variable reference is not valid"). Use `-`, not `—`.
Check any edit with:

```powershell
[void][System.Management.Automation.Language.Parser]::ParseFile("$pwd\tools\render.ps1", [ref]$null, [ref]$err); $err.Count
```

**Scratch goes in `work/<piece>/.tmp/`, never the project root.** Ad-hoc helper scripts, probe projects
and pixel-sampling one-offs accumulate fast (one 15s piece produced 41 of them). If a helper gets used
twice, promote it here with an argument instead of writing `pix2.cjs`.
