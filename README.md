# motion-graphics-studio

Two agent skills that run a motion-graphics production studio: a **master skill** (`motion-graphics`)
that carries the production loop, the craft rules and a bootstrap, and an **adversarial reviewer**
(`motion-critic`) that scores finished renders.

Install the two skills on any machine and a session can build the rest of the studio itself.

**Runs on Windows, Linux and macOS.** The tool layer is Node (`tools/mg.mjs`), not shell scripts, so
there is one implementation for every platform.

---

## Requirements

| | |
|---|---|
| Node.js | 22 or newer (also required by HyperFrames) |
| FFmpeg | any recent build, with `ffprobe` on `PATH` |
| Git | any |
| Disk | about 600 MB for the pinned upstream repos + 1 GB scratch for renders |

Missing pieces: the bootstrap takes `--install-missing` (winget on Windows; on Linux/macOS it prints the
exact `apt`/`dnf`/`brew` commands rather than running `sudo` for you).

## New machine, three steps

```bash
git clone https://github.com/DawitLemmaBalcha/motion-graphics-studio
cd motion-graphics-studio
node install.mjs --bootstrap
```

1. **install.mjs** links both skills into `~/.dsh/skills` (or `--skills-dir <path>`). It uses a directory
   junction on Windows and a symlink elsewhere, falling back to a copy if linking is refused.
2. **--bootstrap** builds the studio at `~/projects/motion-graphics`, clones the six upstream repos at
   pinned commits, installs the tools/templates/prompts, and sets `MG_STUDIO`.
3. **Restart the agent session** so the skill catalog reloads. Then:

> make me a 10 second motion graphic about anything

It finds the studio through `MG_STUDIO`, or bootstraps one if it is missing.

## What the bootstrap builds

```
<studio>/
  tools/mg.mjs     one CLI: env check render measure safeguards find poster
  prompts/         INSPIRATION, BRIEF, BEATMAP, CRITIC, DIRECTIVES, library/ (112 prompts)
  templates/       LANES.md + Scenario's 80 motion loops as source
  repos/           6 pinned upstream clones + MANIFEST.md (licence map)
  work/            one folder per piece
  studio.json      the manifest used to build this studio
```

Repos are pinned by commit in `skills/motion-graphics/setup/studio.json`, so two machines build the same
studio. `--latest` trades that for the newest upstream.

## The tool CLI

```bash
node tools/mg.mjs env                        # toolchain + studio readiness
node tools/mg.mjs render --piece 01-x        # add --draft, --aspect 9:16, --workers N
node tools/mg.mjs measure --piece 01-x       # the quality bar as PASS/FAIL, exit 1 on failure
node tools/mg.mjs safeguards --piece 01-x    # 90/80 safe boxes + platform UI bands
node tools/mg.mjs find --loop tunnel         # the inspiration corpora
node tools/mg.mjs poster --grid              # portfolio contact sheet
```

## What the skills actually enforce

The master skill is a contract with gates, not a style guide: brief → lane → inspiration (four sources,
named mechanisms) → stock inventory with rejections → copy → beat map → seam ledger → build → measured
render → critic. Nothing ships without passing the measured quality bar — contrast, frozen frames,
loudness **range**, true peak, safe areas — and a fresh-eyes critique.

## Layout

```
skills/
  motion-graphics/
    SKILL.md              the contract
    references/           the seven craft documents it routes into
    setup/                THE KIT - what bootstrap.mjs installs
      bootstrap.mjs
      studio.json         pinned commits, versions, kit counts
      tools/ prompts/ templates/
  motion-critic/
    SKILL.md              the rubric, seven axes, hard fails
```

## Updating

```bash
git pull
node install.mjs --force                                            # refresh the skill links
node skills/motion-graphics/setup/bootstrap.mjs --force              # refresh the kit in the studio
```

`bootstrap.mjs` is idempotent: without `--force` it keeps files you (or a session) edited in the studio
and only fills gaps. That is what you want after editing a tool in the studio.

## Changing the pins

Edit `skills/motion-graphics/setup/studio.json`, or delete the repo folder in the studio and re-run the
bootstrap. `--latest` ignores pins for a one-off.

## Licences

This repo's own code and prose: MIT, see [LICENSE](LICENSE). The upstream repos are **not vendored here**
— they are cloned, and keep their own licences (Apache-2.0, MIT, CC-BY-4.0, and two with no LICENSE file
that are published as open work but whose bundled audio must never ship). `repos/MANIFEST.md` in the
studio is the authoritative map, and the bootstrap installs it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `node: command not found` | install Node 22+, open a new shell |
| skill does not appear | restart the session; confirm `SKILL.md` exists in the skills dir |
| symlink refused | re-run with `--copy` |
| studio built somewhere unexpected | set `MG_STUDIO` and re-run the bootstrap |
| `hyperframes` unreachable | `npx --yes hyperframes@latest --help` once by hand to warm the npm cache |
