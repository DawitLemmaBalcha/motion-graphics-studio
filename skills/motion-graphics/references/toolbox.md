# Toolbox — what to reach for, and what it costs

## Licence map (read first)

| Source | Licence | Ship it? |
|---|---|---|
| `repos/hyperframes` | Apache-2.0 | **Yes** — engine, 448 blocks, 7 craft skills |
| `repos/ClaudeAnimationBase` | MIT | **Yes** — p5.brush character pipeline |
| `repos/claude-animation-skill` | MIT | **Yes** — hand-drawn 2D + sound synthesis |
| `repos/ffmpeg-skill` | MIT | **Yes** — finishing and delivery |
| `repos/awesome-ai-motion` | MIT (repo scripts) | Scripts yes; **third-party videos/prompts/covers belong to their authors** |
| `repos/PDoomVideo` | no LICENSE, published as open work | **Yes — adapt freely, credit.** Never ship its bundled mp3 (third party's song) |

Two prompt-corpus repos were removed (yihui 703 prompts, athemeroy dataset) and one out-of-scope film
(Austerlitz, 183 MB) — reasons recorded in `repos/MANIFEST.md`.

## The engine

`npx hyperframes@latest` (0.8.214 when this was written). Commands that matter:

| Command | Use |
|---|---|
| `init <dir>` | scaffold; `--non-interactive`, `--example`, `--resolution` |
| `add <block> --json` | install from catalog |
| `catalog --json` | search 448 items |
| `check --json` | the real gate: lint + runtime + layout + contrast, with `Fix:` lines |
| `render` | `-q looks/delivery`, `-w auto`, `-f 30`, `--format mp4/webm/mov/png-sequence` |
| `beats` | beat grid → `beats/<audio>.json` |
| `audio` | onsets, bpm, downbeats, loudness, silence |
| `snapshot --at` | stills; `--zoom` for a selector, `--angle` for 3D |
| `grade-compare` | render candidate grades onto one frame, labelled |
| `compare` | render variants into one label sheet |
| `keyframes` / `inspect` | onion-shot diagnostics, layout across time |
| `transcribe` / `tts` | word-level timestamps; local Kokoro TTS |
| `normalize-audio` | match one clip's loudness to another |
| `media-treatment` | grade/grain/blur on footage (contract rule 11) |
| `doctor` / `browser` / `clean` | environment recovery |

## Catalog families (139 of 448 are showreel-relevant)

| Need | Blocks |
|---|---|
| Transitions | `transitions-3d -blur -cover -destruction -dissolve -distortion -grid -light -mechanical -push -radial -scale -other`, `swirl-vortex`, `chromatic-aberration-wipe` |
| Kinetic type | `kinetic-type-swap`, `morph-text`, `text-stagger`, `type-match-cut`, `variable-axis-type`, `text-shimmer`, `text-match-cut` |
| Titles | `glass-shard-title`, `wireframe-portal-title`, `yt-prism-title`, `hw-title`, `hw-write-title`, `titlecard-lockup`, `titlecard-calm` |
| Logo | `logo-sting`, `logo-outro`, `logo-brand-close`, `extruded-logo`, `yt-logo-intro` |
| Camera / 3D | `cinematic-zoom`, `camera-dolly-zoom`, `zoom-through-transition`, `parallax-zoom`, `camera-rig-depth-stack`, `code-3d-extrude` |
| Data | `data-chart`, `bar-chart-race`, `count-up`, `chart-story`, `heatmap`, `flowchart` |
| Maps | `world-map`, `us-map`, `us-map-hex`, `us-map-flow`, `nyc-paris-flight`, `spain-map` |
| Finishing | `grain-overlay`, `grain-field`, `motion-blur`, `light-leak`, `transitions-dissolve`, `spotlight-card` |
| UI / product | `ui-3d-reveal`, `ui-focus-zoom`, `app-showcase`, `typed-prompt`, `cursor-*` |

## Sound

| Tool | Use |
|---|---|
| `repos/claude-animation-skill/plugins/claude-animation/skills/claude-animation/scripts/music.mjs` | original bed, any length (`--dur`, `--end`); `sound.mjs` for cues, `ambient.mjs` for beds |
| `.../ambient.mjs` | loops of pads/bells/wind |
| `.../chiptune.mjs` | game soundtrack with sections |
| `.../sound.mjs` | SFX cues on a timeline + bed + loudnorm + mux |
| `npx hyperframes tts` | local voice (Kokoro-82M), no API key |
| `npx hyperframes audio` | measure where the sound actually lands |

## The library list, honestly sorted

Most of the 20 links are *not* in our render path, and shouldn't be. Only reach for one when a piece
genuinely needs it — every extra runtime is a failure surface.

**In the path:** GSAP (bundled with the scaffold, seekable), FFmpeg (encode/measure), HyperFrames.

**Reach for when the piece demands it:**

| Library | Only when |
|---|---|
| Anime.js | you need its timeline as a second, non-GSAP runtime — prefer GSAP |
| Three.js / OGL | genuine 3D or custom shaders (`code-3d-extrude` covers many cases) |
| PixiJS | heavy 2D GPU particles at 4K |
| p5.js (+ p5.brush) | hand-drawn/watercolour character work (via `ClaudeAnimationBase`) |
| Paper.js | boolean vector-path operations you can't do in SVG |
| Matter.js / Rapier | real physics simulation as the idea |
| tsParticles | particle fields beyond `particle-text-dissolve` |
| Tone.js | procedural audio beyond the hanif scripts |
| gl-transitions | a shader transition the catalog lacks |
| faster-whisper | long-form captions (hyperframes `transcribe` usually suffices) |
| OpenCut | timeline editing of live footage — not our medium |
| OBS | screen capture of a real UI |
| Chatterbox | voice, if Kokoro's voice is wrong |
| Blender / glTF Transform | 3D assets to import |
| Remotion | only if a piece must reuse existing React components; HyperFrames is the default |

## Precedent

`repos/awesome-ai-motion/cases/*.en.md` — 1,728 shipped pieces, each with the creator's actual prompt
and a "what to learn" note. Use for *shape and ambition*, never for content. `prompts/library/` holds
the 112 plain-text prompts for fast scanning.
