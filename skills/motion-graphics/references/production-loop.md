# Production loop — detailed

Commands assume:

```powershell
$MG = if ($env:MG_STUDIO) { $env:MG_STUDIO } elseif (Test-Path "tools\mg.mjs") { (Get-Location).Path } else { Join-Path $env:USERPROFILE "projects\motion-graphics" }
```

## 0 · Environment

```powershell
node "$MG/tools/mg.mjs" env
```

Expect node ≥ 22, ffmpeg/ffprobe on PATH, hyperframes reachable. Record the CLI version in `BRIEF.md`;
renders are only reproducible against a known version.

## 1 · Piece folder

```powershell
$piece = "$MG\work\02-kinetic-type"
New-Item -ItemType Directory -Force -Path `
  "$piece\assets\fonts", "$piece\assets\audio", "$piece\renders", "$piece\stills" | Out-Null
Copy-Item "$MG\prompts\BRIEF.md" "$piece\BRIEF.md"
```

Numbering is permanent. Retire a piece by prefixing `_`, never by renumbering.

## 2 · Brief

Fill `BRIEF.md`. If the person gave you one sentence, **propose** the rest and continue — but a
missing sign-off blocks step 10, not step 2.

## 3 · Lane

Pick from `templates/LANES.md`, paste its token block into `BRIEF.md`. If none fit, write a new lane
there first (so the next piece can reuse it), then paste.

## 4 · Inventory

```powershell
$cat = npx hyperframes@latest catalog --json | ConvertFrom-Json
$cat | Where-Object { $_.title -match 'title|sting|transition' } | Format-Table name,type,title -AutoSize
```

Write `inventory.md` with ≥ 3 candidates and verdicts. Install the chosen ones:

```powershell
npx hyperframes@latest init $piece --non-interactive            # if not already scaffolded
npx hyperframes@latest add transitions-push --dir $piece --json
```

## 5 · Copy

Read `references/copy-and-voice.md`. Put the final strings in `BRIEF.md` verbatim, in the lane's
register, with the typeface decided and font files in `assets/fonts/`.

## 6 · Score

```powershell
$music = "$piece\assets\audio\music.mp3"
npx hyperframes@latest beats $piece
npx hyperframes@latest audio $music --only=bpm,downbeats,onsets,loudness
```

Needs an original bed:

```powershell
$sk = "$MG\repos\claude-animation-skill\plugins\claude-animation\skills\claude-animation"
node "$sk\scripts\music.mjs" "$music" --dur 12 --end 11.4
```

Write `BEATMAP.md`: every cut in seconds **and** frames, each traced to a measured beat. Cut on the
downbeat, not the nearest onset.

## 7 · Ledger

Write `ledger.json`, then verify. Schema and rules: `references/motion-rules.md`.

```powershell
node "$gate\seam-gate.mjs" probe  --t 4.2 --project $piece
node "$gate\seam-gate.mjs" verify --ledger "$piece\ledger.json" --project $piece
```

Exit 0 or the seam isn't planned. Fix the ledger, not the easing.

## 8 · Build

Scaffold shape (from `init`):

```html
<div id="root" data-composition-id="main" data-start="0" data-duration="10"
     data-width="1920" data-height="1080">
  <h1 id="title" class="clip" data-start="0" data-duration="10" data-track-index="0">Title</h1>
</div>
<script>
  const tl = gsap.timeline({ paused: true });
  window.__timelines["main"] = tl;   // after every tween is added
  tl.seek(0);
</script>
```

Obey the 12-rule contract in `/hyperframes`. The ones that bite most:

- every timed element: `class="clip"` + `data-start` + `data-duration`
- never tween `display` / `visibility` / `autoAlpha` on a `.clip` — animate a child
- no `Date.now()`, unseeded `Math.random()`, timers, or `repeat: -1`
- everything visible is a function of timeline time
- asset paths are `assets/...` (no leading `/`), even in sub-compositions
- font families other than the bundled ones need `@font-face`

Gate:

```powershell
npx hyperframes@latest check $piece --json
```

Iterate until zero errors. Each finding usually carries a `Fix:` line — read it.

## 9 · Render and look

```powershell
node "$MG/tools/mg.mjs" render --piece 02-kinetic-type --draft    # iterate on this
node "$MG/tools/mg.mjs" measure --piece 02-kinetic-type           # measures the newest render
node "$MG/tools/mg.mjs" safeguards --piece 02-kinetic-type        # 90/80 boxes + platform UI bands
npx hyperframes@latest snapshot $piece --at 0,1.5,3.5,6.8 --zoom "#hero" -o "$piece\stills\check"
```

Open the stills. Numbers can't see ugly.

### The render tax — read this before your third render

`tools/mg.mjs measure` measures an **encoded master**, so every fix costs a full render before it can be
judged. On a 10s piece that is 4–5 minutes each. One measured piece spent **31% of a 2.4-hour session
in render/measure/debug loops across 10 renders**, and half of those were avoidable.

The rules that follow from that:

1. **Look before you render.** `snapshot --at <every beat>` is seconds, not minutes, and it catches
   layout, grade, and type errors. Three of those ten renders were "I rendered before the look was
   right".
2. **Iterate at `--draft`.** Freeze/contrast/safe-area/hold metrics are quality-independent; only
   loudness needs the real encode. Measure on draft, sign off on delivery.
3. **Never write per-frame to N elements.** Static-frame dedup is disabled by continuously updated
   nodes (and by any `<canvas>`), which is what makes the *held end state* metric fail even when the
   page is static. If the freeze check fails, audit what is being rewritten every frame before
   blaming the capture path.
4. **One render at a time.** Two concurrent renders on this machine silently lose one.
5. **Never delete a raw before the finishing pass that consumes it.** (This happened. It cost a
   re-render and an apology in the report.)
6. **Drive everything from the GSAP timeline, never a `requestAnimationFrame` loop.** A raw rAF
   composition makes the engine fall back from fast capture to **screenshot** capture, which is the
   single biggest render slowdown available — measured here at ~2m per 10s where fast capture is
   several times quicker. A per-frame `draw()` that reads `performance.now()` or owns its own clock
   is the usual cause; compute from `tl.time()` instead.
7. **Do not bother with `-Workers`.** Measured on this machine: 2m10s at 1 worker vs 2m05s at 2. The
   limit is capture mode and the integrated GPU, not parallelism. The flag exists for machines with
   more RAM and a real GPU.

## 10 · Critic

See `prompts/CRITIC.md` for the exact dispatch. Record the verdict in `BRIEF.md`.

## 11 · Deliver

```powershell
node "$MG/tools/mg.mjs" render --piece 02-kinetic-type --aspect 9:16
```

Deliverables: 16:9 master, 9:16 recomposed cut, ≥ 3 stills, `attribution.md`, `measure.txt`.
A piece with no stills is not deliverable.

---

## Recovery

| Symptom | Do |
|---|---|
| render fails at capture | `npx hyperframes browser` then `doctor` |
| `check` errors you don't understand | `npx hyperframes docs <topic>` |
| preview bundle stale | restart `preview`; re-run `seam-gate` without `--url` |
| everything is slow | `render -w auto -q looks`; `clean` stale artifacts |
| fonts silently wrong | `snapshot --zoom` the type; confirm `@font-face` path resolves |
| contrast fails on one line | change the *background* under the text, not the text colour |
