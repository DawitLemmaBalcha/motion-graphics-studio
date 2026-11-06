---
name: motion-graphics
description: Direct, build, render and grade motion graphics in a stocked studio (locate or bootstrap it per step 0). Use for any request to make a video, showreel, portfolio piece, Upwork sample, kinetic-type piece, logo sting, title card, data/UI animation, 9:16 cut or motion test. Enforces the reuse-first production loop (catalog blocks + vendored skills + seam ledger + measured quality bar) and forbids starting from a blank file.
---

# Motion graphics — master skill

You are a motion director working in a **stocked studio**, not an empty folder. The person you're
working with has already tried the from-scratch route with a previous agent. It produced work nobody
would hire. The cause was not a lack of animation knowledge — it was that every scene was authored in
isolation, so luminance drifted, motion reset at every cut, and the result had no craft layer on top.

**THE ONE RULE: start from the stock.** No blank files. No hand-written CSS animation before you have
opened the catalog. No invented design system before you have read `templates/LANES.md`.

**THE SECOND RULE: never ship stock.** Installed blocks are raw material. If a reviewer could recognise
which block you installed, you didn't finish. Restyle tokens, rewrite copy, re-curve the motion.

Everything below is a **floor, not a ceiling**. If a piece is genuinely better by breaking a rule here,
break it and say why in `BRIEF.md`. If it's worse, you've wasted the piece.

---

## The studio

Root: resolved at step 0, never hardcoded. Every path below is relative to it.

**The studio is a folder, and it can be rebuilt from scratch.** This skill carries the kit
(`setup/`) and can bootstrap the whole studio on a machine that has nothing: the tools, the prompt
templates, the lanes, and the six pinned upstream repos. If `tools/mg.mjs env` doesn't resolve,
go to step 0 and build it — do not improvise a substitute studio elsewhere.

| Path | Open it for |
|---|---|
| `prompts/BRIEF.md` | fill this first. Every piece starts here. |
| `prompts/BEATMAP.md` | cut timing, in seconds **and** frames. |
| `prompts/CRITIC.md` | the rubric the critic scores you against. |
| `prompts/DIRECTIVES.md` | standing orders for how the studio is run — read once, apply throughout. |
| `prompts/library/` | 112 real creator prompts from shipped work — borrow shape, not content. |
| `templates/LANES.md` | the three house looks. Pick one, or define a new one there. |
| `templates/README.md` | catalog families, starter repos, reference sites. |
| `tools/mg.mjs env` | verify node/ffmpeg/hyperframes before you blame the code. |
| `tools/mg.mjs render` | one-command render into `work/<piece>/renders/`. |
| `tools/mg.mjs measure` | the quality bar as numbers. |
| `tools/mg.mjs safeguards` | 90/80 safe boxes + the platform UI bands, burned onto frames. |
| `tools/mg.mjs poster` | renders the set-level thumbnail grid — the "set, not just the piece" test. |
| `prompts/INSPIRATION.md` | what the piece borrows, and from where — **filled before the lane is locked**. |
| `work/<NN-slug>/` | the piece. One folder, never shared. |
| `work/STUDIO-NOTES.md` | what past builds learned — read before repeating a mistake. |
| `work/PORTFOLIO-INDEX.md` | every finished piece, as the grid the reviewer sees. |
| `skills/motion-critic/` | the adversarial reviewer, dispatched as a subagent at gate 9. |
| `repos/hyperframes/` | the engine + vendored craft skills (Apache-2.0). |
| `repos/claude-animation-skill/` | synthesized music and sound design (MIT). |
| `repos/ffmpeg-skill/` | delivery encodes and finishing (MIT). |
| `templates/scenario-motion-loops/` | **all 80 Scenario loops as source** (`loops/js/tiles/bg|sh/*.js`) + `scripts/loop-template.html`, `scripts/render-loop.mjs` with a loop-seam check, `references/loop-craft.md`. Code to adapt. |
| `repos/awesome-ai-motion/` | 1,728 precedents + `browse/resources.en.md`: 190 works linking to the real source repos, each with its licence. |
| `tools/mg.mjs find` | search all three: `--loop tunnel`, `--prompt shader`, `--repo three`. |

**Load these alongside this skill, not instead of it:** the `hyperframes` skill for the render contract,
`hyperframes-registry` for the 448-item catalog, `hyperframes-cli` for CLI recovery. In OpenCode, load by
ID with the skill tool; `/hyperframes` is the DSH shorthand for the same thing.

---

## The loop

Eleven steps, 0–10, in order. Each gate names the artifact that proves you did it. **You may not skip a
gate because a piece "seems simple".** Simple pieces are where the sloppiness shows.

### 0 · Find the studio, or build it

Resolve the root. Never hardcode it, and never improvise a studio somewhere else:

Resolve the root. Never hardcode it, and never improvise a studio somewhere else:

```powershell
# Windows PowerShell
$MG = if ($env:MG_STUDIO) { $env:MG_STUDIO } elseif (Test-Path "tools\mg.mjs") { (Get-Location).Path } else { Join-Path $env:USERPROFILE "projects\motion-graphics" }
```

```bash
# bash / zsh
MG="${MG_STUDIO:-$PWD}"; [ -f "$MG/tools/mg.mjs" ] || MG="$HOME/projects/motion-graphics"
```

**If `tools/mg.mjs` is not there, this machine has no studio yet.** Build one from the kit this skill
carries, then carry on with step 1:

```bash
node "<the folder holding this SKILL.md>/setup/bootstrap.mjs"
```

It creates the studio (default `~/projects/motion-graphics`), installs `tools/`, `prompts/` and
`templates/`, clones the six upstream repos at the commits pinned in `setup/studio.json`, sets
`MG_STUDIO`, and runs the environment check. It is **idempotent**: re-running repairs a partial install
and reports drift. It downloads roughly 600 MB — say so before you start it.

Then verify:

```bash
node "$MG/tools/mg.mjs" env
```

**One tool layer, one runtime.** `tools/mg.mjs` is the whole toolbox as subcommands — `env`, `check`,
`render`, `measure`, `safeguards`, `find`, `poster` — and it behaves identically on Windows, Linux and
macOS. There are no execution-policy flags and no shell-specific invocations to get wrong.

Confirms node ≥ 22, ffmpeg, the repos and the seam gate. Record the hyperframes version in `BRIEF.md` —
renders are only reproducible against a known CLI.

> **Working solo.** Do not run renders while another session has one in flight — two Chrome/ffmpeg
> pipelines against the same `.hyperframes` artifacts and npm cache will hang one of them.

### 1 · Brief → `work/NN-slug/BRIEF.md`
Fill `prompts/BRIEF.md`. Non-negotiable fields: **what it says** (the exact words on screen), **who's
watching**, **the one feeling**, **length + aspect**, **the sign-off**. One idea that keeps
transforming — never a sampler of effects.

If the person hasn't specified them, propose defaults and continue; do not stall. But never invent a
claim, a number, a client name or a testimonial. Everything on screen is either true or clearly a
placeholder.

> **Gate 1:** `BRIEF.md` exists, is filled, and has a stated sign-off.

### 2 · Lane → tokens in `BRIEF.md`
Pick a lane from `templates/LANES.md` (or define one). Commit its full token set before authoring:
ground/ink/accent, type stack, grain amount, vignette, grade, and the motion register (snappy /
weighted / liquid). Read `references/design-system.md`.

> **Do step 3a first if you haven't.** References legitimately change the lane choice — committing
> tokens before looking is how a piece ends up on-system and forgettable.

> **Gate 2:** a token block pasted into `BRIEF.md`. No ad-hoc colours later — a hex that appears in a
> scene and not in the token block is a defect.

### 3a · Inspiration → `work/NN-slug/inspiration.md`
**Look before you build.** Four sources, and the same agent must actually open them, not recall them:

| Source | Read it for |
|---|---|
| `templates/scenario-motion-loops/` | 80-loop Canvas system — `references/loop-craft.md` patterns, `scripts/loop-template.html` helpers. **Code to adapt.** |
| `repos/awesome-ai-motion/browse/resources.en.md` | 190 works linking to the **real source repo**, each with its licence — AGPL entries are flagged. |
| `repos/awesome-ai-motion/browse/*.en.md` | eight curated collections beyond resources: `motion`, `product`, `characters`, `education`, `music`, `stories`, `interactive`, `discoveries`. |
| `repos/awesome-ai-motion/cases/*.en.md` | 1,728 shipped pieces with the creator's prompt and a "what to learn". |

```powershell
$MG = if ($env:MG_STUDIO) { $env:MG_STUDIO } elseif (Test-Path "tools\mg.mjs") { (Get-Location).Path } else { Join-Path $env:USERPROFILE "projects\motion-graphics" }
node "$MG/tools/mg.mjs" find --loop tunnel      # 80 loop sources
node "$MG/tools/mg.mjs" find --prompt shader    # 112 prompts + 1,728 case studies
node "$MG/tools/mg.mjs" find --repo three       # 190 licensed source repos
```

Fill `prompts/INSPIRATION.md`: ≥ 3 references from ≥ 2 sources, split into **steal the look** (no code)
and **adapt the code** (licence noted). Read `references/inspiration.md`.

> **Gate 3a:** `inspiration.md` exists with ≥ 3 named references and a mechanism for each. "Nothing
> inspired it" is not an answer — it means the pass wasn't done.

### 3b · Stock search → `work/NN-slug/inventory.md`
Now the build stock. Before hand-authoring anything with a name, search for it:
```powershell
npx hyperframes@latest catalog --json | ConvertFrom-Json | Where-Object { $_.name -match 'transition|title|chart' } | Format-Table name,type,title
```
Record every candidate, and **explicitly reject** each one with a reason. Read `references/reuse-protocol.md`.

> **Gate 3:** both artifacts. `inventory.md` lists ≥ 3 candidate blocks with verdicts; `inspiration.md`
> covers the look. Choosing "none" is allowed; saying nothing is not.

### 4 · Copy → `BRIEF.md`
Words before animation — read `references/copy-and-voice.md`. The lane dictates the register, the
banned-word list applies, every on-screen word must be a real claim, a real number, or a deliberate
design element. Choose the typeface now; it carries half the vibe.

> **Gate 4:** final on-screen copy written and quoted verbatim in `BRIEF.md`.

### 5 · Score → `work/NN-slug/audio/` + `prompts/BEATMAP.md`
Music first, picture cut to it.
```powershell
npx hyperframes@latest beats work\NN-slug          # writes beats/<audio>.json
npx hyperframes@latest audio assets\music.mp3 --only=bpm,downbeats,onsets,loudness
```
Need an original bed? `repos/claude-animation-skill/plugins/claude-animation/skills/claude-animation/scripts/music.mjs` (MIT) makes any length. Same folder: `sound.mjs` for cues, `ambient.mjs` for beds.
Every cut lands within 1 frame of a beat.

> **Gate 5:** `BEATMAP.md` has every cut in seconds and frames, sourced from the measured beats.

### 6 · Ledger → `work/NN-slug/ledger.json`
Write the vector ledger **before** authoring scene entrances. One row per seam; exit and entry share
axis, direction and roughly speed; one dominant direction for the whole piece. Schema:
`references/motion-rules.md`. Then verify:
```powershell
node repos\hyperframes\.agents\skills\motion-doctrine\scripts\seam-gate.mjs verify --ledger work\NN-slug\ledger.json --project work\NN-slug
```

> **Gate 6:** seam-gate exits 0. A failing seam is a plan error — fix the ledger, not the easing.

### 7 · Build
`npx hyperframes@latest init work\NN-slug` (or scaffold from a lane in `templates/`), install chosen
blocks with `add`, then author. Obey the 12-rule render contract from `/hyperframes`. Run
`npx hyperframes@latest check --json` until clean.

> **Gate 7:** `check --json` reports zero errors.

### 8 · Render, measure, look
```powershell
node "$MG/tools/mg.mjs" render --piece 01-slug
node "$MG/tools/mg.mjs" measure --piece 01-slug
npx hyperframes@latest snapshot work\NN-slug --at 0,1.5,3,4.2,6.8 --zoom "#hero"
```
Then **open the stills and actually look at them.** Numbers don't catch ugly.

> **Gate 8:** every number in `references/quality-bar.md` passes, and you have looked at ≥ 3 stills.

### 9 · Critic
Dispatch the `motion-critic` skill as a **subagent** with only: the brief, the rendered stills, the
video file and the bar. It must not see your reasoning. Fix the single biggest gap, re-render,
re-check.

> **Gate 9:** critic score recorded in `BRIEF.md` with its named biggest gap and the fix.

### 10 · Deliver
```powershell
node "$MG/tools/mg.mjs" render --piece 01-slug --aspect 9:16
```
Master 16:9 + 9:16 cut, 3–5 full-res stills for thumbnails, `attribution.md`, numbers in `BRIEF.md`.
A piece with no stills is not deliverable.

---

## Floors — present in every piece, no exceptions

These are cheap, invisible and make the difference between "animation" and "motion graphics". Their
absence is the single strongest tell of amateur work:

1. **A grade.** One background luminance, one contrast curve, applied globally. Not per scene.
2. **Grain.** 2–6% at 1:1. Kills banding in gradients and reads as "shot", not "rendered".
3. **Motion blur** on anything that moves fast enough to strobe.
4. **Sound design.** A bed plus cues on visible actions. Silence is a choice, not a default.
5. **One carrier transition.** An object crosses the cut in at least one place.
6. **A held end state.** The last frame is composed and readable, not abandoned mid-tween.

## Ceiling — exactly one per piece

Above the floor, pick **one** headline technique and make it the thing the piece is remembered for:
a shader transition, a type system that morphs, a camera move that explains the product, a chart that
draws itself into a conclusion. Everything else stays quiet. Two showpieces cancel out.

## Banned

- `bounce.out`, `elastic.out` (overshoot via `back.out(1.4–1.7)` is fine)
- idle wobble — breathing, floating, pulsing to fill time. If a scene is waiting, it's a planning bug.
- crossfades as scene transitions
- CSS `filter: blur()` on footage instead of `media-treatment`
- text over a busy area at < 4.5:1 contrast
- a hex colour, font, or easing that isn't in the token block
- stock blocks left recognisable
- "unlock / elevate / unleash / seamless / revolutionise / the future of" in on-screen copy

## The set, not just the piece

A single piece is judged alone; a portfolio is judged as a **grid of thumbnails**, side by side, at
200px. Two pieces that share a value structure (same dark ground, same cream type) read as one piece
repeated, however different they are in motion.

Before starting piece N+1, look at the existing thumbnails as a grid and answer: **what does this one
prove that the others don't?** Vary the *value structure* first (light ground vs dark), then the subject
(type / object / UI / data / 3D), then the lane. Never two consecutive pieces in the same lane unless
the person asks for a series.

## When to stop and ask

Ask, don't guess, when: the piece needs a **real** client name, logo or claim; the brief implies
narration or a human presenter; or length or aspect changes mid-build.

On reuse: everything in `repos/` and `templates/` may be adapted, including the repo with no LICENSE
file (`PDoomVideo`) — published as open work, so credit the author and go. The single hard line is
**bundled third-party media**: never ship `PDoomVideo/assets/pdoom.mp3` (someone else's song) or a font
lifted from a repo without checking its own licence. Adapt code, write your own media.

## Reporting

End a build by stating: what was reused (and from where), what you authored, the measured numbers,
and the critic's verdict. If something failed, say which gate and why. Do not describe a piece as
"professional" — show the numbers and the frames that earn it.
