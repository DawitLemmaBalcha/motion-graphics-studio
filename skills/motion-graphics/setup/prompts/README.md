# prompts/ — the directives

The skills say *how*; the prompts say *what* and *how well*. Every piece starts with a brief from here and
ends with a critic pass from here.

## Contents

| File | Role |
|---|---|
| `INSPIRATION.md` | **filled before the lane is locked** — what the piece borrows, split into steal-the-look vs adapt-the-code, with licences. Gate 3a reads it. |
| `BRIEF.md` | the blank brief: subject, viewer, one feeling, tokens, copy, claims, measured results. Gates 1/2/4/10 read it. |
| `BEATMAP.md` | every cut in seconds **and** frames, traced to a measured beat, plus audio cues |
| `CRITIC.md` | how to dispatch `motion-critic` as a subagent, and what to do with each verdict |
| `DIRECTIVES.md` | reusable directive blocks in the professional shape: `<role> <brief> <craft> <audio> <build> <quality_bar> <banned>` |
| `library/` | 112 plain-text creator prompts from shipped work (`repos/awesome-ai-motion/prompts`), verbatim |

Prompt corpora, in two sizes: `library/` (112 files, greppable) and the 1,728 case studies, each with
the creator's prompt plus a "what to learn" note. Search both at once:

```powershell
.\tools\find-source.ps1 -Prompt shader     # 16 cases match
```

Precedent with commentary — 1,728 cases, each with the creator's prompt and a "what to learn" note:
`repos/awesome-ai-motion/cases/*.en.md`.

## The shape of a strong prompt (warehouse practice)

Routed → spec'd → beat-timestamped → copy quoted → technique pinned → gaps closed.

Vague: *"make a cool 15s motion graphic"*.
Strong: *"8s, 1920×1080, 30fps. Beat 1 (0–4s): … Beat 2 (4–5s): … Beat 3 (5–8s): …. Use the
`code-typing` and `vfx-shatter` blocks; hand-author the kinetic text. No narration."*

## Quality bar (from the professional brief — nothing ships below this)

- Text contrast ≥ 4.5:1, no collisions, inside safe margins
- No frozen frame > 0.5s; no still stretch > 0.5s
- Cuts within 1 frame of the beat
- −14 LUFS integrated, true peak < −1 dBTP, no clipping
- Understood with the sound off
- Every claim traced to a source; anything generated is labelled
