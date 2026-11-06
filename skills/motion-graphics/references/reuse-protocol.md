# Reuse protocol

How to build from the stock without shipping stock. This file is the difference between "used a
template" and "cut and pasted a template".

## Why reuse first

Hand-authoring a named visual is slower, worse, and less consistent than installing one that has been
tuned by people who make these for a living. The catalog has 448 of them. A hand-written title card
next to a catalog one is not close; a hand-written *transition* next to `transitions-light` is not close
either. Spend your authorship on the 10% that is actually this piece's idea.

## Search before you author

```powershell
$cat = npx hyperframes@latest catalog --json | ConvertFrom-Json

# by name
$cat | Where-Object { $_.name -match 'transition' } | Format-Table name,type,title

# by tag / type
npx hyperframes@latest catalog --type component --tag text --json
npx hyperframes@latest catalog "kinetic type"
```

Then install:

```powershell
npx hyperframes@latest add kinetic-type-swap --dir work\01-slug --json
```

`--json` prints the files written and the include snippet. Blocks land under `compositions/`,
components under `compositions/components/` (see `hyperframes.json` `paths`).

## The burden of proof

`work/NN-slug/inventory.md` — required before authoring. Format:

```markdown
# Stock inventory

| Need | Candidates searched | Verdict | Why |
|---|---|---|---|
| scene transition (4 cuts) | transitions-push, transitions-light, transitions-scale | **USE** transitions-push | matches LEFT current; light is too soft for the tone |
| opening title | kinetic-type-swap, glass-shard-title, hw-title | **REJECT both** | swap is too playful; glass shard fights the lane's flatness |
| end card | logo-sting, logo-outro | **USE** logo-sting | restyled to lane tokens |
| background motion | aurora, grain-overlay, light-leak | **USE** grain-overlay only | aurora is a different lane entirely |
```

"None fit, here's why" is a legitimate verdict. Silence is not.

## Restyling — the five knobs

Installed source is editable by design. Change at least **three** before the block counts as used:

1. **Tokens** — remap its colours and fonts to the lane block. Non-negotiable.
2. **Copy** — its placeholder text is someone else's idea. Replace every word.
3. **Curve** — its easing and durations. Snappier, heavier, slower — make it this piece's rhythm.
4. **Layout** — position, scale, crop. A block centred by default can sit off-centre in a ninth.
5. **Layer** — what's behind/around it. Often the cheapest way to make a block unrecognisable is to
   change the ground under it.

## The recognition test

Show your frame next to the catalog preview at thumbnail size. If a person who has browsed the catalog
could name the block, restyle more. Specifically watch for: a signature easing, a signature accent
colour, the block's default font, and its default aspect/position.

## Attribution

Every piece carries `work/NN-slug/attribution.md`:

```markdown
# Attribution

## Reused
- `transitions-push` — hyperframes catalog (Apache-2.0). Restyled: tokens, durations, direction.
- `kinetic-type-swap` — hyperframes catalog (Apache-2.0). Restyled: tokens, copy, ease.
- music bed — `repos/claude-animation-skill/scripts/music.mjs` (MIT). Original render, 96 BPM.

## Authored
- the type system and the six-beat structure
- the ledger and all seam timings

## Not used, deliberately
- `repos/PDoomVideo` — no licence. Studied the chapter-per-scene structure, copied nothing.
```

## Licence map — read before copying anything

| Source | Licence | May I ship its code? |
|---|---|---|
| `repos/hyperframes` (catalog, engine) | Apache-2.0 | **Yes**, keep notice |
| `repos/ClaudeAnimationBase` | MIT | **Yes**, keep notice |
| `repos/claude-animation-skill` | MIT | **Yes**, keep notice |
| `repos/ffmpeg-skill` | MIT | **Yes**, keep notice |
| `repos/awesome-ai-motion` scripts | MIT | Yes — but its **third-party videos, prompts and covers belong to their authors** |
| `templates/scenario-motion-loops/` | Scenario exploration, code published for copying | **Yes** — adapt `P`, period, counts; credit Scenario |
| `repos/PDoomVideo` | no LICENSE file, published as open work | **Yes — adapt freely.** Credit the author. |

**The one real trap: bundled media.** A repo being open does not make the *assets inside it* the
author's to give away.

| Asset | Status |
|---|---|
| `PDoomVideo/assets/pdoom.mp3` | **Third party's song**, per its own README. Never ship it — use our own beds. |
| `PDoomVideo` / `ClaudeAnimationBase` character art | the authors' own — fine, credit |
| Any font inside a repo | check its own licence before extracting |

Rule: **adapt the code and the technique, write our own media, credit in `attribution.md`.**
