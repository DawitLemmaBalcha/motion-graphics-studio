---
name: scenario-motion-loops
description: Use when someone wants seamless looping motion graphics for video in their own brand colours, such as backgrounds behind titles, loops for the dead seconds between AI shots, bumpers, transitions or shape animations, optionally with their own mascot, product or character from Scenario MCP composited over the loop. Builds each loop as code (Canvas 2D in one HTML file, a pure function of time whose periods divide the loop), previews it in a browser, checks determinism and the loop seam, and renders a 12-second 1920x1080 MP4 at 24 fps with motion blur, supersampling and an H.264 BT.709 encode. Scenario MCP makes the subject cut-out and an optional AI video shot, chosen with recommend and priced with a dry run. Keywords: seamless loop, motion background, shape animation, motion graphics in code, canvas animation, easing, motion blur, loop seam, H.264 export, alpha composite.
---

# Seamless motion loops in code, with your subject from Scenario MCP

## Overview

A loop here is a pure function of time. `draw(ctx, w, h, t, P)` paints the frame at `t` seconds, and
every motion in it repeats with a period that divides the loop length (12 s), so the frame at 12 s is
the frame at 0 s and the clip loops with no seam. Nothing is generated: nothing warps or flickers,
changing one colour rebrands it, and the same code renders at any size. The Motion Loops
exploration on scenario.com shows 80 loops made this way (40 backgrounds, 40 shape animations),
each with its code. `scripts/loop-template.html` carries the same helpers (`M.*`), palette (`P`) and
`tile(...)` registration those loops were written against, so their tile code runs in it unchanged.

Scenario MCP makes what code cannot draw: the user's subject. A mascot, product or character comes
out of Scenario as a cut-out on a transparent background, and the loop page draws it over the loop on
the loop's own clock, so it gets the same motion blur and the composite still loops. For a subject
that really moves, an AI video shot is generated from that cut-out, its background removed on
Scenario, and the shot laid over the rendered loop with ffmpeg. The loop itself never needs a model
and costs nothing to render.

Needs Node 18 or newer, Playwright (`npm install playwright`, then `npx playwright install chromium`;
or `--channel chrome` with Google Chrome installed), ffmpeg and ffprobe. Scenario MCP is needed
only for the subject. Connection, model choice and the generation loop: the `scenario` skill if it is
installed, otherwise [references/scenario-mcp.md](references/scenario-mcp.md).

## Quick reference

```bash
cp scripts/loop-template.html loop.html            # one loop per file: settings, draw(), overlay
# open loop.html in a browser: live preview; ?t=3 freezes it, ?tone=accent or ?tone=light switches tone
node scripts/render-loop.mjs loop.html --check     # determinism and loop seam, no video
node scripts/render-loop.mjs loop.html --stills look --at 0,3,6,9             # stills to look at
node scripts/render-loop.mjs loop.html --out loop.mp4                          # 12 s, 1920x1080, 24 fps
node scripts/render-loop.mjs loop.html --params "overlay=subject.png" --out loop.mp4   # with a cut-out
node scripts/render-loop.mjs loop.html --width 1080 --height 1920 --out loop-9x16.mp4  # vertical
node scripts/render-loop.mjs --qa loop.mp4 composite.mp4   # seam and format check of any MP4
```

Run it from a folder where Playwright is installed. Existing files are never overwritten without
`--force`. The page check renders the same moment twice (it must match), compares the frame at
exactly 12 s with the frame at 0 s, and compares the step across the loop point with the motion
around it and at the other cycle boundaries. A render refuses to encode unless it prints `PASS`;
`--ignore-seam` is only for a cut designed to sit at the loop point.

| Rule                                                                                                     | Why                                                    |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Every period divides 12 s (1, 1.5, 2, 3, 4, 6, 12); use `M.phase(t, period, offset)`                     | the frame at 12 s equals the frame at 0 s              |
| Scrolls move a whole number of pattern repeats per period                                                | a fractional repeat jumps at the seam                  |
| Randomness only from `M.rand(i, salt)`; no `Math.random`, `Date` or state between frames                 | motion blur and the checks render frames out of order  |
| Sizes from `u = h / 100`, counts from `w`                                                                | right at 16:9, 9:16, 1:1 and at thumbnail size         |
| Colours only from `P` (`bg`, `fg`, `fg2`, `mid`, `accent`, `paper`, `ink`), three tones per brand colour | rebrand by changing `BRAND`; contrast by changing tone |
| Eases from `M.ease`, with anticipation, overshoot and holds; constant speed only for scrolls             | designed motion, not mechanical motion                 |

Render settings the 80 loops shipped with, and the script's defaults: 24 fps, 8 motion-blur
sub-frames over a 180 degree shutter, 2x supersampling, H.264 High, CRF 16, 4:2:0, BT.709 limited
range, faststart. Patterns that close the loop, depth tricks and review habits:
[references/loop-craft.md](references/loop-craft.md).

| Scenario MCP step                   | Calls                                                                       |
| ----------------------------------- | --------------------------------------------------------------------------- |
| Connect, choose team and project    | `teams_list` (ask the user when there are several)                          |
| Bring in the user's own art         | `upload_asset`, curl PUT of each part, `upload_asset_complete`              |
| Choose a model                      | `recommend` (`txt2img`, `img2img`, `img2video`, `video2video`), or `search` |
| Read its inputs                     | `model_schema_get`                                                          |
| Price, then run after the user's go | `model_run` with `dry_run: true`, then `model_run` and `jobs_wait`          |
| Fetch the result                    | `asset_download`, then `curl -L -o`                                         |

## Worked example: a brand mascot floating over a coded loop

Goal: a 12-second seamless 1920x1080 loop in the brand's colours with the brand's mascot floating in
it, and optionally a version where the mascot waves.

1. **Connect.** Call `teams_list`. If several teams or projects come back, ask which one to use, and
   pass its `team_id` and `project_id` to every later call: with a signed-in account, `search`,
   `model_schema_get` and `model_run` refuse to run without them.

2. **Build the loop first (local, free).** `cp scripts/loop-template.html mascot-loop.html`, set
   `BRAND.accent` to the brand colour and keep the example tile (Perspective Floor, a grid streaming
   toward the camera) or write your own `draw()`. Open the file to preview, then:

   ```bash
   node scripts/render-loop.mjs mascot-loop.html --check
   node scripts/render-loop.mjs mascot-loop.html --stills look --at 0,3,6,9
   ```

   Look at the stills. `--check` must end in `PASS`.

3. **Bring in the mascot.** If the user has it as a file, upload it:

   ```json
   {
     "file_name": "mascot.png",
     "content_type": "image/png",
     "kind": "image",
     "file_size": 482113
   }
   ```

   (`file_size` from `wc -c mascot.png`.) PUT the part to the returned URL with curl, then call
   `upload_asset_complete` with `{"upload_id": "<upload id>"}` and keep the asset id.

4. **Choose a model.** `recommend` with:

   ```json
   {
     "capability": "img2img",
     "prompt": "The mascot from the reference image, full body, three-quarter view, a light floating pose, cut out on a transparent background with clean edges, no shadow, no text",
     "limit": 5
   }
   ```

   Without a file, use `"capability": "txt2img"` and describe the mascot. If `next_step.type` is
   `ask_user`, show the options and wait. Prefer a model whose schema has a transparent background
   option; otherwise plan a background removal step after it.

5. **Read the schema and price it.** `model_schema_get` with `{"model_id": "<id from recommend>"}`.
   Build the parameters from the schema: the reference image field takes the uploaded asset id
   (as an array if the schema says so), and the transparent background option is set. Then:

   ```json
   {
     "model_id": "<id from recommend>",
     "dry_run": true,
     "parameters": {
       "prompt": "<the prompt above>",
       "<reference image field>": ["<mascot asset id>"],
       "<background field>": "transparent"
     }
   }
   ```

   Tell the user the price and wait for a go.

6. **Run and download.** `model_run` with the same parameters and `"wait": false`, then `jobs_wait`
   with `{"job_ids": ["<job id>"]}`. Then `asset_download` with
   `{"asset_id": "<asset id>", "format": "png"}` and `curl -L -o subject.png "<url>"` into the folder
   of `mascot-loop.html`. Open the PNG over the loop's background colour at 100 %: halos at the
   outline show on dark tones; regenerate rather than hide them.

7. **Composite in the canvas and render.**

   ```bash
   node scripts/render-loop.mjs mascot-loop.html --params "overlay=subject.png" --stills look --at 0,0.75,1.5,2.25 --force
   node scripts/render-loop.mjs mascot-loop.html --params "overlay=subject.png" --out mascot-loop.mp4 --psnr 4
   ```

   `drawOverlay()` floats the mascot on a 3-second bob and a 6-second sway with a contact shadow,
   all periods dividing 12, so the composite still loops; adjust its size and placement there. The
   script checks the page, renders 288 frames, encodes, and checks the file's loop point. `--psnr`
   compares one encoded frame with its lossless render.

8. **Optional: a shot where the mascot moves.** `recommend` with `"capability": "img2video"`, the
   cut-out's asset id as the start image and a prompt such as "the mascot waves and turns its head,
   plain flat background, locked-off camera, no cuts". Schema, dry run, go, run, `jobs_wait`,
   download. Then `recommend` with `"capability": "video2video"` and "remove the background from this
   clip, keep the subject with an alpha channel", choosing WebM VP9 with alpha as the output. Schema,
   dry run, go, run, download. Render the loop once more without `--params overlay=...`
   (`--out loop-plain.mp4`) and lay the shot over it with ffmpeg (the command is in
   [references/scenario-mcp.md](references/scenario-mcp.md)). The composite is as long as the shot;
   it is not a seamless loop unless the shot loops.

9. **Hand over** the HTML (the loop stays editable), the MP4, the stills and any composite.

## Common mistakes

- **A seam jump at 12 s.** A period that does not divide 12 (a 5 s cycle), or a scroll that moves
  2.5 repeats. `--check` reports `SEAM JUMP` (the frame at 12 s differs from the frame at 0 s).
  Fix the period; never crossfade the ends.
- **State, `Math.random` or `Date` in a tile.** The same `t` gives different frames, the motion-blur
  sub-frames disagree and the loop cannot close. `--check` reports `NOT DETERMINISTIC`. Compute
  everything from `t` and `M.rand(i, salt)`.
- **Colour helpers that only read hex.** `P.mid` and `M.mixColor` return `rgb()` strings, and a
  hex-only parser silently turns them black. The template's `M.rgba` and `M.mixColor` read both.
- **Strobing on fast moves.** Eight sub-frames are not enough for a whole-frame push; it shows
  stepped copies. A full-page swipe in the build needed 40. Raise `--samples` for very fast loops.
- **A wireframe that reads as clutter.** A 3D wave mesh did; rebuilt as hidden-line ridgelines (each
  row fills the background below itself, drawn far to near) it reads as terrain.
- **Dividing by depth twice.** A projection that scales the focal length by depth again shrinks the
  scene to the centre. Project once with `M.proj`.
- **Reviewing a 3-second cycle with stills every 1.5 s.** That shows two poses of it. Sample inside
  one cycle and on both sides of the loop point (`--at 11.9,11.95,0,0.05`).
- **Treating every flag as a bug.** A designed snap (a pop, a burst) or a hold at the loop point can
  trip a seam or glitch detector. Look at the frames first. The script compares the loop point
  with the motion around it and with the other cycle boundaries, which avoids most of these: all 80
  loops of the build pass it.
- **A label or counter that wraps wrong.** Anything indexed by cycle must wrap with `M.mod`; in the
  build a page counter read "06 / 05" at the loop point until it did.
- **Low contrast in one tone.** Change the tone (dark, accent, light) for that loop instead of adding
  a colour.
- **An overlay PNG from disk.** A page opened from `file://` that draws a local image and reads pixels
  back fails, because the image taints the canvas. `render-loop.mjs` serves the folder over a local
  address; the browser preview only displays, so it is not affected.
- **Text before the font loads.** Canvas text does not wait for web fonts; await
  `document.fonts.load(...)` before the first frame, or draw no text in loops.
- **Chasing bitrate.** On flat colour, x264 spends very few bits and the file looks small. In the
  build, PSNR showed the encoder adds almost no loss; the only real loss is 4:2:0 chroma on thin
  saturated lines. Check with `--psnr`, and thicken thin coloured lines instead of raising the bitrate.
- **Losing the alpha of a VP9 shot.** ffmpeg's built-in VP9 decoder ignores alpha; put
  `-c:v libvpx-vp9` before `-i shot.webm`.
- **Making the loop with a video model.** A generated clip's last frame rarely meets its first exactly.
  Keep the loop in code; use Scenario for the subject.
- **Model ids or prices from memory, or a local path in `model_run`.** Choose with `recommend` or
  `search`, read `model_schema_get`, price with `dry_run` and wait for a go, and upload files first.
- **Several teams and no question.** If `teams_list` returns more than one team or project, ask.
