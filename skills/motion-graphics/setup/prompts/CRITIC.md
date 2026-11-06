# CRITIC — how to dispatch the review

The critic must be a **separate context**. If you review your own piece in this session you will
rationalise it; every agent does. Dispatch `motion-critic` as a subagent.

## Dispatch

```
Use the motion-critic skill to review work/NN-slug.

Read only:
- work/NN-slug/BRIEF.md          (the what/why — not your reasoning)
- work/NN-slug/stills/*.png      (at least 3, including first and last frame)
- work/NN-slug/renders/*.mp4     (the render itself)
- work/NN-slug/stills/measure.txt

Do not ask me what I intended. Do not read ledger.json, inventory.md or any source file.
Return only the output format in the skill.
```

Two things worth knowing:

- **Don't send your own summary.** The moment you explain a choice, the critic grades the explanation.
- **Run it twice on different days** for anything going in a portfolio. A second pass finds what the
  first one was polite about.

## What to do with the verdict

| Verdict | Action |
|---|---|
| `ship` | record the score in `BRIEF.md`, deliver |
| `not yet`, one named fix | fix **that one thing**, re-render, re-measure, re-dispatch |
| `not yet`, vague | the critic failed — re-dispatch with sharper stills, or fix the brief |

Fix the **biggest** gap only. Applying five small fixes at once makes it impossible to know which one
worked, and usually flattens the piece.

## Escalate to the person when

- The critic says the *idea* is weak (axis "idea" ≤ 2). That's not a render problem; it's a brief
  problem, and it needs a human decision.
- Two consecutive rounds fail on the same axis. You are not converging — stop and say so.

## Record

```
VERDICT: not yet
SCORE:   idea 4 · composition 3 · type 4 · colour 2 · motion 3 · craft 3 · fit 4 → mean 3.3
BIGGEST: the third scene sits at a visibly different exposure to the rest.
FIX:     lift scene 3's ground to the --surface token and re-render; it is currently ~8 L* dark.
```

That goes in `BRIEF.md` verbatim, with what you changed underneath.
