# skills/ — reusable craft instructions

Each subfolder is one skill: a `SKILL.md` (with YAML frontmatter: `name`, `description`) plus optional
`references/` and `scripts/`.

**Two harnesses read this folder, by two different mechanisms.** Both must be kept working — a skill
that is junctioned but not configured (or the reverse) is invisible in the session that needs it.

| Harness | How it finds this folder | Where |
|---|---|---|
| DSH | junction per skill | `~/.dsh/skills/<name>` → `./skills/<name>` |
| OpenCode | `skills` array in project config | `opencode.jsonc` at the studio root |

```powershell
# DSH: from the project root, once per skill
New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\skills\<name>" -Target ".\skills\<name>"
```

The OpenCode entry is an **absolute** path on purpose: `skills` array entries resolve from the working
directory, not the config file, and sessions are often opened inside `work/<piece>/`.

## Installed

| Skill | Source | Status |
|---|---|---|
| `motion-graphics/` | ours — the contract: 11-step loop (0–10), 10 gates, floors/ceiling, quality bar | **installed** DSH + OpenCode |
| `motion-critic/` | ours — adversarial rubric, 7 axes, hard fails | **installed** DSH + OpenCode |

## Routing — which skill is the front door

`motion-graphics` is the front door for **anything produced in this studio**. It is the only skill that
enforces the gate chain, and it assumes **one render engine: HyperFrames**. A second engine means a
second render contract and a second quality bar, and the two drift.

`product-ad-video` (`~/.dsh/skills/product-ad-video`) is **outside the studio**, not vendored, not
indexed above. It is a Remotion-based specialist for paid-social ad creative — voiceover-driven,
9:16 + 4:5 Meta placements, cover art. It carries its own template, presets and audio measurement, and
it does **not** go through `tools/measure.ps1` or the seam ledger.

The boundary, so nobody has to guess later:

- A request for a piece → `motion-graphics`, HyperFrames, full gate chain.
- A request specifically for a Meta ad set, where Remotion is an accepted constraint → `product-ad-video`.
- Both could apply → `motion-graphics` fires first, writes the brief, and either absorbs the deliverable
  or hands off explicitly *with the brief in hand*. Never run both at once on one piece.

If `product-ad-video` ever becomes part of the studio, it must be copied in here first (it currently
exists in one place only, so a machine rebuild loses it) and its engine decision recorded as a
deliberate exception, not an accident.

## Vendored, not installed as skills

Read directly from `repos/` by path — one copy, so nothing drifts:

| Read | Path |
|---|---|
| seam law, vector ledger, anti-idle | `repos/hyperframes/.agents/skills/motion-doctrine/SKILL.md` |
| transition catalog + code | `repos/hyperframes/.agents/skills/cut-the-curve/SKILL.md` |
| seam mechanics | `repos/hyperframes/.agents/skills/seam-craft/SKILL.md` |
| the render contract | `repos/hyperframes/skills/hyperframes/SKILL.md` |
| catalog usage | `repos/hyperframes/skills/hyperframes-registry/SKILL.md` |
| CLI recovery | `repos/hyperframes/skills/hyperframes-cli/SKILL.md` |
| hand-drawn 2D + sound | `repos/claude-animation-skill/.../claude-animation/SKILL.md` |
| finishing/delivery | `repos/ffmpeg-skill/SKILL.md` |

Also available: `npx hyperframes skills update` installs HyperFrames' own core set into a project.
We don't run it — the vendored copies above are the reference, and running it invites version drift.

## Adding a skill

1. `skills/<name>/SKILL.md` with frontmatter (`name`, `description` — the description decides when it
   fires, so write the trigger words into it).
2. Junction it for DSH: `New-Item -ItemType Junction -Path "$env:USERPROFILE\.dsh\skills\<name>" -Target ".\skills\<name>"`.
   OpenCode needs nothing extra — the `opencode.jsonc` `skills` entry covers the whole folder.
3. It appears in both session catalogs immediately. Verify by ID, not by `name`: the ID is the folder
   name, and it is case-sensitive.
4. Add a row to the table above with its licence.

## External skills, deliberately not here

`~/.dsh/skills/exa-research` is a research utility, not studio craft. It is junctioned from the harness
side, lives in one place, and is not part of the production contract. Treat it as a tool, not a rule.
