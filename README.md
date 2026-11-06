# motion-graphics-studio

Two agent skills that run a motion-graphics production studio: a **master skill** (`motion-graphics`)
that carries the production loop, the craft rules and a bootstrap, and an **adversarial reviewer**
(`motion-critic`) that scores finished renders.

Install the skills on any machine and a session can build the rest of the studio itself.

---

## Requirements

| | |
|---|---|
| OS | Windows (the tools are PowerShell) |
| Node.js | 22 or newer |
| FFmpeg | any recent build, with `ffprobe` on `PATH` |
| Git | any |
| Disk | about 600 MB for the pinned upstream repos |

Missing pieces can be installed with `winget` — the bootstrap takes `-InstallMissing`.

## New machine, three steps

```powershell
git clone https://github.com/DawitLemmaBalcha/motion-graphics-studio
cd motion-graphics-studio
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Bootstrap
```

1. **install.ps1** links both skills into `%USERPROFILE%\.dsh\skills` (or `-SkillsDir <path>`).
2. **-Bootstrap** builds the studio at `%USERPROFILE%\projects\motion-graphics`, clones the six upstream
   repos at pinned commits, installs the tools/templates/prompts, and sets `MG_STUDIO`.
3. **Restart the agent session** so the skill catalog reloads. Then:

> make me a 10 second motion graphic about anything

It will find the studio through `MG_STUDIO`, or bootstrap one if it is missing.

## What the bootstrap builds

```
<studio>/
  tools/           check-env, render, measure, safeguards, find-source, portfolio-poster
  prompts/         INSPIRATION, BRIEF, BEATMAP, CRITIC, DIRECTIVES, library/ (112 prompts)
  templates/       LANES.md + Scenario's 80 motion loops as source
  repos/           6 pinned upstream clones + MANIFEST.md (licence map)
  work/            one folder per piece
  studio.json      the manifest used to build this studio
```

Repos are pinned by commit in `skills/motion-graphics/setup/studio.json`, so two machines build the
same studio. `-Latest` trades that for the newest upstream.

## What the skills actually enforce

The master skill is a contract with gates, not a style guide: brief -> lane -> inspiration (four
sources, named mechanisms) -> stock inventory with rejections -> copy -> beat map -> seam ledger ->
build -> measured render -> critic. Nothing ships without passing the measured quality bar (contrast,
frozen frames, loudness **range**, true peak, safe areas) and a fresh-eyes critique.

## Layout

```
skills/
  motion-graphics/
    SKILL.md              the contract
    references/           the seven craft documents it routes into
    setup/                THE KIT - what bootstrap.ps1 installs
      bootstrap.ps1
      studio.json         pinned commits, versions, kit counts
      tools/ prompts/ templates/
  motion-critic/
    SKILL.md              the rubric, seven axes, hard fails
```

## Updating

```powershell
git pull
powershell -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -Force     # refresh the skill links
powershell -NoProfile -ExecutionPolicy Bypass -File .\skills\motion-graphics\setup\bootstrap.ps1 -Force   # refresh the kit in the studio
```

`bootstrap.ps1` is idempotent: without `-Force` it keeps files you (or a session) edited in the studio,
and only fills gaps. That is what you want after editing a tool in the studio.

## Changing the pins

Edit `skills/motion-graphics/setup/studio.json`, or delete the repo folder in the studio and re-run the
bootstrap. `-Latest` ignores pins for a one-off.

## Licences

This repo's own code and prose: use it freely. The upstream repos are **not vendored here** — they are
cloned, and carry their own licences (Apache-2.0, MIT, CC-BY-4.0, and two with no LICENSE file that are
published as open work but whose bundled audio must never ship). `repos/MANIFEST.md` in the studio is the
authoritative map, and the bootstrap installs it.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `cannot be loaded. The file is not digitally signed` | always invoke with `-ExecutionPolicy Bypass` (as above) |
| `node` not found after installing | open a new shell - `PATH` is stale |
| junction fails | re-run with `-Copy` |
| skill does not appear | restart the session; confirm `SKILL.md` exists in the skills dir |
| studio built somewhere unexpected | set `MG_STUDIO` and re-run the bootstrap |
