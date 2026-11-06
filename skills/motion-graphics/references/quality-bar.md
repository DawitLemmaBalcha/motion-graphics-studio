# Quality bar

The bar is numbers, not adjectives. Every piece must pass all of it before delivery, and the numbers go
into `BRIEF.md`. `tools/mg.mjs measure` runs most of this in one go.

| # | Metric | Target | How |
|---|---|---|---|
| 1 | Text contrast | ≥ 4.5:1 (≥ 3.0 for ≥ 32px display type, ≥ 7.0 preferred) | `npx hyperframes check --json` |
| 2 | Frozen frame | none > 0.5s while the piece is still running | `ffmpeg -i in.mp4 -vf freezedetect=n=0.001:d=0.5 -map 0:v -f null -` |
| 3 | Integrated loudness | −14 LUFS ± 1 (web) / −23 LUFS (broadcast) | `ffmpeg -i in.mp4 -af loudnorm=print_format=summary -f null -` |
| 4 | True peak | < −1 dBTP | same output |
| 5 | Cut alignment | every cut within 1 frame of a beat | compare `BEATMAP.md` against `beats/<audio>.json` |
| 6 | Duration | exactly the brief's length, ± 0 frames | `ffprobe` |
| 7 | Frame rate | 30fps constant (60 only if fast motion demands) | `ffprobe` |
| 8 | Audio present | a bed + ≥ 3 cues on visible actions, unless the brief says silent | listen, and `npx hyperframes audio --dir work\NN-slug` |
| 9 | Grading | grain visible at 1:1, no banding in gradients, vignette present | look at stills |
| 10 | Stillness | last frame composed and held ≥ 0.5s | `snapshot --at <end-0.2>` |
| 11 | Legibility with sound off | the whole message reads from the picture + text alone | watch muted |
| 12 | Stills | ≥ 3, full resolution, saved to `work/NN-slug/stills/` | `snapshot` |
| 13 | Vertical cut | 1080×1920, **recomposed** not cropped | render again |
| 14 | File | H.264, `yuv420p`, `+faststart`, CRF 16–18 | `tools/mg.mjs render` |
| 15 | Loudness range | 4–9 LU on pieces ≥ 10s (a 6s sting is exempt) | `loudnorm` summary → `Input LRA` |
| 16 | Safe area | key text inside the 80% box; 9:16 bottom 15% and top 12% clear of text | `tools/mg.mjs safeguards`, then look |

**On #15 — the metric this bar was missing.** Loudness *level* and loudness *range* are different
goals. A mix can hit −14 LUFS exactly and still be squashed flat, because nothing was allowed to be
quiet. If the piece has a build, a drop or a hole before an impact, LRA should show it. Under 4 LU on a
piece with dynamics means the compressor is doing the storytelling; over 9 means the quiet parts will
disappear on phone speakers.

**On #16 — automate the drawing, not the judgement.** `tools/mg.mjs safeguards` burns the 90%/80% boxes onto key
frames so the check is lookable rather than abstract. Content under the platform's UI is invisible to
`check --json`; only the frame shows it.

## The five that actually fail pieces

In practice, in order:

1. **Contrast** — text over a gradient or footage. Look at the *local* background, not the frame average.
2. **Frozen frames** — an entry lands early and the scene sits there. Fix with a sustained-motion
   route, never with wobble.
3. **Loudness** — a bed at −8 LUFS clips dialogue and fatigues the ear. Always measure.
4. **Beat alignment** — cuts 2–3 frames off read as "sloppy editing" without anyone being able to say
   why. Use the measured beats, never your count.
5. **Banding** — a big gradient with no grain. Cheap to fix, impossible to un-see.

## Reading the numbers

```powershell
node "$MG/tools/mg.mjs" measure --piece 01-slug
```

Writes `work/01-slug/stills/measure.txt` and prints a PASS/FAIL table. Numbers that fail block
delivery — do not report a piece as done with a failing metric unless you name it and the person
accepts it.

## What the numbers can't see

Composition, taste, whether the idea is any good. That's the critic's job (`motion-critic`), and the
reason the critic looks at frames rather than trusting this table.
