# BEATMAP — <piece name>

Sourced from measured beats, never from counting. Attach `beats/<audio>.json` output.

```powershell
npx hyperframes@latest beats work\NN-slug
npx hyperframes@latest audio assets\music.mp3 --only=bpm,downbeats,onsets
```

| | |
|---|---|
| **Track** | `<file>` |
| **BPM** | `<measured>` |
| **Time signature** | `<4/4>` |
| **Frame rate** | 30fps — 1 beat = `<60/BPM*30>` frames |
| **First downbeat** | `<t>` s |

## Cuts

All times in seconds, all frames absolute at 30fps. `beat` = index in `beats/<audio>.json`.

| # | Scene | In (s) | In (frame) | Beat | On | Out (s) | Vector | Technique |
|---|---|---|---|---|---|---|---|---|
| 1 | hook | 0.00 | 0 | 0 | downbeat | 2.13 | — | entry from black, mid-motion |
| 2 | claim | 2.13 | 64 | 4 | downbeat | 4.93 | x −1 | cut-the-curve LEFT |
| 3 | proof | 4.93 | 148 | 8 | downbeat | 7.73 | x −1 | cut-the-curve LEFT |
| 4 | sign-off | 7.73 | 232 | 12 | downbeat | 10.00 | z −1 | inverse zoom, holds |

## Audio cues

Sound on visible actions only. Every cue lands on the frame the action lands.

| Time (s) | Frame | Action on screen | Cue | Level |
|---|---|---|---|---|
| 0.40 | 12 | title lands | low thud | −18 dB |
| 2.13 | 64 | cut | reverse whoosh | −24 dB |
| 5.60 | 168 | counter settles | tick | −20 dB |

## Checks

- [ ] Every cut is within 1 frame of its beat (measured, not counted)
- [ ] No cut falls mid-word or mid-glyph
- [ ] The last cue is not the loudest thing in the piece
- [ ] Silence, if any, is deliberate and placed before the biggest beat
