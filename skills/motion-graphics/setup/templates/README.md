# templates/ — starting points

Repos, sites and catalog blocks we copy *from*. A template enters this folder only once we've actually
used it or vetted it.

## Catalog blocks (HyperFrames, Apache-2.0)

448 installable blocks/components, 139 of them directly showreel-relevant. Install with:

```powershell
npx hyperframes@latest add <name>
```

Families worth knowing (verified against `catalog --json`):

- **Transitions:** `transitions-3d`, `-blur`, `-cover`, `-destruction`, `-dissolve`, `-distortion`,
  `-grid`, `-light`, `-mechanical`, `-push`, `-radial`, `-scale`, `swirl-vortex`
- **Type:** `kinetic-type-swap`, `morph-text`, `text-stagger`, `type-match-cut`, `variable-axis-type`,
  `glass-shard-title`, `wireframe-portal-title`, `yt-prism-title`, `logo-sting`, `logo-outro`
- **Camera / 3D:** `cinematic-zoom`, `camera-dolly-zoom`, `zoom-through-transition`, `code-3d-extrude`,
  `extruded-logo`
- **Data:** `data-chart`, `bar-chart-race`, `count-up`, `chart-story`, `heatmap`
- **Finishing:** `grain-overlay`, `motion-blur`, `light-leak`, `header` overlays

## Starter repos

| Path | Use when | Licence |
|---|---|---|
| `repos/ClaudeAnimationBase` | piece needs a hand-drawn character (p5.brush) | MIT |
| `repos/claude-animation-skill` | hand-drawn 2D + synthesized sound | MIT |
| `repos/hyperframes` | the backbone; `docs/guides`, `.agents/skills` | Apache-2.0 |
| `repos/ffmpeg-skill` | finishing and delivery recipes | MIT |
| `templates/scenario-motion-loops/` | **seamless looping backgrounds / shape loops** — 80-loop Canvas system | Scenario exploration; code copyable per the page, credit Scenario |

### `scenario-motion-loops/` — the loop factory

[Scenario's 80 Motion Loops](https://www.scenario.com/explorations/motion-loops/) (40 backgrounds +
40 shape animations), **both** the running system and all 80 loop sources:

| File | What it gives us |
|---|---|
| `loops/js/tiles/bg/*.js` `loops/js/tiles/sh/*.js` | **all 80 loops as source** — `depth`, `lines`, `dots`, `shapes`, `minimal` (backgrounds) and `morph`, `bounce`, `burst`, `draw`, `rhythm` (shapes). ~8 loops per file |
| `loops/js/lib.js` | the helpers the loops call: `phase`, `smoothstep`, `clamp`, `lerp`, `rgba`, `proj` |
| `loops/js/sets.js` | the manifest: every loop id, its display name, its pack and its tone |
| `scripts/loop-template.html` | standalone template with the same `M.*` helpers and `P` palette, so a copied `tile()` block runs unchanged |
| `references/loop-craft.md` | the patterns that close a loop: whole-repeat scrolls, camera streams, time-warp surge, three-tone colour |
| `scripts/render-loop.mjs` | 12s @ 24fps, 8-sample motion blur, 2× supersampling; `--check` proves determinism and the seam; `--qa` checks any MP4 |
| `SKILL.md` | the contract, including "every period divides 12s" |

Each loop is `tile('<id>', { draw(ctx, w, h, t, P) })` — self-contained Canvas 2D, a pure function of
time. Adapt by changing `P` (palette), the period, and the counts; then render with `render-loop.mjs`.

```powershell
.\tools\find-source.ps1 -Loop tunnel      # 3 matches: grid, dots, shape
```

Names worth knowing: `perspective-floor`, `grid-tunnel`, `kaleidoscope`, `truchet-flow`, `halftone-wave`,
`phyllotaxis`, `moire`, `contours`, `iso-cubes`, `warp-stars`.

## Sites — reference, and one of them is code

- `hyperframes.studio/design` — frame.md design systems, ~60 named looks. Best source of *token sets*.
- `hyperframes.heygen.com/showcase` — finished pieces to compare against.
- `scenario.com/explorations/motion-loops` — 80 loops, code fetched and vendored in `scenario-motion-loops/loops/`.
- `guanmo-ai.github.io/awesome-ai-motion` — 1,728-case gallery, filter by category or tech.
- `scenario-labs/skills` (GitHub) — Scenario's own skill collection; the clone timed out once, retry if
  something from it is needed.

## Rule

A template is a **starting point, not a deliverable**. Every installed block gets restyled: tokens, copy,
curve. Untouched output is a fail in review.
