# Design system — the luminance fix

Inconsistent luminance is the most common tell of agent-made video, and it has one cause: **each scene
choosing its own colours and opacities**. Five scenes, five subtly different blacks, and the piece
looks like a slideshow.

The fix is structural, not artistic: **decide every value once, before any scene exists, and forbid
anything outside the block.**

## The token block

Paste this into `BRIEF.md` at step 2 and never add a value that isn't here.

```css
:root {
  /* ground — the single most important value. One per piece. */
  --ground:      oklch(18% 0.012 265);   /* the black */
  --surface:     oklch(24% 0.014 265);   /* raised panels */
  --surface-hi:  oklch(30% 0.016 265);   /* hover / active */

  /* ink */
  --ink:         oklch(97% 0.004 265);   /* headline */
  --ink-dim:     oklch(74% 0.008 265);   /* body */
  --ink-faint:   oklch(52% 0.010 265);   /* rules, captions */

  /* accent — exactly one, ≤ 10% of frame area */
  --accent:      oklch(78% 0.170 195);
  --accent-dim:  oklch(58% 0.130 195);

  /* type */
  --font-display: "Söhne", "Inter", sans-serif;
  --font-body:    "Inter", sans-serif;
  --font-mono:    "JetBrains Mono", monospace;

  /* finishing — global, applied at the compositor */
  --grain:    0.045;   /* 0.02–0.06 */
  --vignette: 0.10;    /* 0.06–0.16 */
}
```

## Luminance rules

1. **One `--ground` for the whole piece.** Scenes may raise a panel to `--surface`, never a new backdrop.
2. **Scene backdrops within ±6 L\* of each other.** A momentary key change needs a *reason* (a chapter
   turn, a reveal) and then it must be held, not wandered through.
3. **Never stack opacity to make a tone.** `rgba(#fff, .2)` on an unknown ground is how drift happens.
   Use a token.
4. **Check it, don't feel it:** render the first frame of every scene and view them as one contact
   sheet. Any frame visibly darker or lighter than its neighbours is a defect.
   ```powershell
   npx hyperframes@latest snapshot work\01-slug --at 0,3.1,3.2,7.4 --frames 2 -o stills\scenes
   ```
5. **Accent discipline:** ≤ 10% of any frame. An accent used everywhere is a ground.

## Type

- **One display face, one body face.** Two weights maximum. A third weight is a hierarchy failure.
- **Scale ratio 1.25 or 1.333.** Sizes: pick 4 and stick to them (e.g. 148 / 92 / 44 / 24 at 1080p).
- **Display tracking is negative:** −2% to −4% at large sizes. Positive tracking on a display face
  reads as amateur instantly.
- **Optical alignment beats mathematical.** A left-aligned word beginning with "T" needs ~2% negative
  inset to look flush.
- **Line length** ≤ 28 characters for display, ≤ 45 for body.
- Fonts not bundled by HyperFrames need `@font-face` pointing into `assets/fonts/` — a silently failed
  font renders the entire piece in a fallback. **Verify the face loaded on the first still.**

## Grade and finishing

Applied once, globally, after composition:

| Layer | Setting | Purpose |
|---|---|---|
| Contrast curve | lift −2, gain +4, slight S in mids | kills the flat "rendered" look |
| Saturation | 0.92–1.05 | most renders are too saturated, not too little |
| Grain | `--grain` at 1:1, additive, masked off type | hides banding, reads as captured |
| Vignette | `--vignette` | pulls the eye in |
| Motion blur | on fast moves only | prevents strobing |

Footage grades go through `npx hyperframes@latest media-treatment`, **never** CSS filters (render
contract rule 11).

## Aspect and safe areas

| Target | Size | Notes |
|---|---|---|
| Master | 1920×1080 @ 30fps | 60fps only if the motion is genuinely fast |
| Vertical | 1080×1920 @ 30fps | **recompose, don't crop** — a crop loses the composition |
| Square | 1080×1080 | for feed thumbnails |

Action-safe 90%, title-safe 80%. Key text and any caption must survive the 80% box — a platform UI
eats the rest.

On vertical, the **top 12% and bottom 15%** are covered by the platform's own chrome. Check it by eye,
not by assumption:

```powershell
node "$MG/tools/mg.mjs" safeguards --piece 01-slug        # burns 90/80 boxes + the UI bands onto 5 frames
```
