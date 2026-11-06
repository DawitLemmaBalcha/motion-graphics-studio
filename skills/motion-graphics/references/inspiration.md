# Inspiration pass

Before the lane is locked and before a single block is installed, **go looking**. The stock catalog
solves "how do I build this"; this pass solves "what should it feel like, and has someone already
solved this in code I can adapt".

Skipping it is why agent work looks like agent work: technically fine, culturally weightless.

## The four sources — and what each can actually give you

| # | Source | What's in it | Can you take code? |
|---|---|---|---|
| **S1** | `templates/scenario-motion-loops/` | **all 80 loops as source**, ~8 per file in `loops/js/tiles/bg/*.js` (depth, lines, dots, shapes, minimal) and `loops/js/tiles/sh/*.js` (morph, bounce, burst, draw, rhythm), plus `loops/js/lib.js` helpers, `sets.js` manifest, `scripts/loop-template.html`, `references/loop-craft.md`, `scripts/render-loop.mjs` | **Yes** — `tile('<id>', { draw(ctx,w,h,t,P) })`, self-contained Canvas 2D. Adapt `P`, the period, the counts. Credit Scenario. |
| **S2** | `prompts/library/*.txt` (112) | creator prompts verbatim where published — precedent: structure, ambition, technique names | **No code** — borrow shape, not content |
| **S3** | `repos/awesome-ai-motion/browse/resources.en.md` + `browse/*.en.md` (8 collections: motion, product, characters, education, music, stories, interactive, discoveries) | **190 works that link to the actual source repo or tool** in `resources.en.md`, with the licence of each link and a check date. This is the "repos inside the repos". The other eight collections index by subject. | **Yes, licence permitting** — each entry names its licence; AGPL entries are flagged with their obligations. |
| **S4** | `repos/awesome-ai-motion/cases/*.en.md` | 1,728 shipped cases, each with the creator's prompt and a "what to learn" note | **No** — precedent only |

Not inspiration sources, but adjacent: `templates/LANES.md` (our looks) and the HyperFrames catalog
(build stock, searched at step 3b).

## How to search them

```powershell
$MG = if ($env:MG_STUDIO) { $env:MG_STUDIO } elseif (Test-Path "tools\mg.mjs") { (Get-Location).Path } else { Join-Path $env:USERPROFILE "projects\motion-graphics" }

# all three sources, one helper
node "$MG/tools/mg.mjs" find --loop tunnel      # 80 loop sources (code)
node "$MG/tools/mg.mjs" find --prompt shader    # 112 prompts + 1,728 cases (no code)
node "$MG/tools/mg.mjs" find --repo three       # 190 licensed source repos (code)

# S2 — find a technique precedent by hand
Select-String -Path "$MG\repos\awesome-ai-motion\cases\*.en.md" -Pattern 'shader' -List |
  Select-Object -First 10 Filename

# S3 — find a source repo for a look
Select-String -Path "$MG\repos\awesome-ai-motion\browse\resources.en.md" -Pattern 'Related tool|MIT|AGPL' -Context 0,1 |
  Select-Object -First 20

# S1 — the loop patterns
Get-Content "$MG\templates\scenario-motion-loops\references\loop-craft.md"
```

## The artifact: `inspiration.md`

Two columns, because the two kinds of borrowing are different and must not be confused. Template:
`prompts/INSPIRATION.md`.

```markdown
# Inspiration — 02-paper-ledger

## Steal the look (no code involved)
| Reference | Source | What exactly I'm taking | Where it lands |
|---|---|---|---|
| Contact-sheet grid reveal | S4 case 2112… | content arrives as a printed grid, not a slide | shot 2 |
| Paper tone, 3 tones from one ink | S1 loop-craft §Colour | the three-tone rule | lane tokens |

## Adapt the code (licence noted)
| Reference | Licence | What I'm adapting | What I'm changing |
|---|---|---|---|
| `loop-template.html` wave tile | Scenario exploration | `M.phase` + whole-repeat scroll | palette `P`, period 4s, stroke 2u |

## Rejected
| Reference | Why not |
|---|---|
| shader ribbons (S2) | a second showpiece; the piece already has one |
```

## Rules

1. **At least three references, from at least two different sources.** One source is a mood board;
   two is a direction.
2. **Name the specific thing** — "the way the type is cropped by the frame edge", not "the vibe".
   A reference you can't name a mechanism from is decoration.
3. **Never take a look wholesale.** The piece must combine what it borrowed into something the
   references don't contain. If it's recognisable as one reference, you've plagiarised a style.
4. **Licence before code.** S3 entries state their licence; honour AGPL's obligations or don't use
   them. Credit every adapted source in `attribution.md`.
5. **A reference never overrides the brief.** If the best reference fights the lane or the copy, drop
   the reference — the brief wins.

## Why this is a gate and not a suggestion

The failure it prevents is specific: a piece that is technically correct, on-system, and completely
forgettable, because it was built entirely from the stock catalog's defaults. The catalog is good at
*execution*; it is not a style. Style comes from here.
