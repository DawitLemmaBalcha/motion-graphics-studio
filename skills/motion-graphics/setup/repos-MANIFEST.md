# repos/ — MANIFEST

Upstream clones. Reference and adaptation material. Nothing here is edited in place; anything we
actually build on is copied out into `templates/` or `tools/`, with a credit line.

Cloned with `--depth 1` (HyperFrames with `GIT_LFS_SKIP_SMUDGE=1`, so its ~240 MB of test videos are
absent — source, docs and registry are all present).

**Five repos. That is deliberate.** Three prompt-corpus repos were removed on 29 Oct because they
overlapped, contained no code, and competed for attention. See *Removed* below.

| Repo | Licence | Use it for | Caveat |
|---|---|---|---|
| `hyperframes` | **Apache-2.0** | the engine, the 448-item registry, `docs/guides` (41), the craft skills in `.agents/skills` (`motion-doctrine`, `seam-craft`, `cut-the-curve`, `oversized-cursor`), `seam-gate.mjs` | 380 MB; LFS blobs skipped |
| `ClaudeAnimationBase` | **MIT** | hand-drawn p5.brush character pipeline; `ANIMATION_GUIDE.md`; `render.mjs` contact sheets | the same author's cleaner successor to `PDoomVideo` — **prefer this one** |
| `claude-animation-skill` | **MIT** | `music.mjs` / `ambient.mjs` / `chiptune.mjs` / `sound.mjs` — original beds, SFX cues, loudnorm+mux; rigs and fx library | renders without a browser, so not a HyperFrames path |
| `ffmpeg-skill` | **MIT** | finishing and delivery recipes: encodes, motion blur, concat, subtitles, HLS | recipes, mostly — not a runtime |
| `awesome-ai-motion` | MIT (repo scripts) | **1,728 shipped cases** with the creator's own prompt and a "what to learn"; 112 plain-text prompts in `prompts/`; `browse/resources.en.md` — **190 works linking the real source repo, each with its licence** | **third-party videos, prompts and covers belong to their authors** — precedent, not stock. `assets/` (56 MB of covers) removed |
| `PDoomVideo` | no LICENSE file, published as open work | adapt freely: chapter-per-scene structure, `ANIMATION_GUIDE.md`, `STORYBOARD.md` as exemplars of a brief | **`assets/pdoom.mp3` is a third party's song — never ship it** |

## Removed — and why (keep this list)

| Removed | Was | Why gone |
|---|---|---|
| `awesome-opus5-5-videos` (yihui-dev) | 703 creator prompts in `videos.json` | **Prompts only, no code** — verified: 704 of 705 files are `.md`, 0 of 703 prompts embed markup. Duplicated what `awesome-ai-motion` already gives, with less context. |
| `awesome-opus-5-5-videos` (athemeroy) | CC-BY-4.0 workflow dataset | Third prompt corpus with the same shape; a second index of the same genre isn't a second capability. |
| `Battle-of-Austerlitz-Film` | 5-min WebGL historical film, 183 MB | Out of scope: long-form historical narrative with terrain data and TTS narration, not 10–15s motion graphics. The one transferable idea is recorded here: *a painterly Kuwahara filter blended over the render, plus canvas weave and grain, gives a code-rendered frame a printed look.* |

Re-clone any of them in one command if a piece genuinely needs one:

```powershell
git clone --depth 1 https://github.com/<owner>/<repo> repos/<name>
```

## Standing rule

Adapt the **code and technique**, write our **own media**, credit the author in the piece's
`attribution.md`. The one hard prohibition is shipping a third-party asset that happens to be bundled
in an open repo — the PDoom mp3 is the known case.

## Refreshing

```powershell
# re-pull one repo's source (keeps the clone shallow)
git -C repos\hyperframes pull --depth 1

# check for newer upstream without touching the tree
git -C repos\<name> fetch --depth 1; git -C repos\<name> log --oneline -1 origin/HEAD
```

Do not `npm install` inside `repos/` — tooling lives in `tools/`, and a stray `node_modules` is 250 MB.
