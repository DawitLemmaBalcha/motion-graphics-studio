# LANES — the three house looks

A lane is a complete, committed design decision: tokens, type, motion register and copy voice. Pick one
and hold it for the whole piece. Three lanes exist so pieces don't drift into a house sameness, but
**within a piece there is exactly one**.

If you need a fourth, write it here first — a lane defined inline in a piece is a lane nobody can reuse.

---

## 1 · Night Shift — dark premium tech

**Use for:** SaaS, dev tools, AI products, anything where precision is the selling point.
**Feeling:** expensive, quiet, engineered. The look you'd see on a Linear or Vercel launch.

```css
:root{
  --ground:     oklch(18% 0.012 265);
  --surface:    oklch(24% 0.014 265);
  --surface-hi: oklch(30% 0.016 265);
  --ink:        oklch(97% 0.004 265);
  --ink-dim:    oklch(74% 0.008 265);
  --ink-faint:  oklch(52% 0.010 265);
  --accent:     oklch(78% 0.170 195);
  --accent-dim: oklch(58% 0.130 195);
  --font-display:"Inter Tight", Inter, sans-serif;
  --font-body:  Inter, sans-serif;
  --font-mono:  "JetBrains Mono", monospace;
  --grain:0.045; --vignette:0.10;
}
```

- **Type:** Inter Tight / Space Grotesk display. Tracking −2% to −4%. Numerals are the hero — tabular,
  oversized, cropped by the frame.
- **Layout:** heavy negative space, one object, generous margins, thin 1px rules at `--ink-faint`.
- **Motion:** *snappy* — `power4.out`, 400–700ms entrances, hard cut-the-curve LEFT.
- **Copy:** lowercase, declarative, numerals. `render. / 4.2 seconds. / no timeline.`
- **Pitfalls:** neon overload, glow on everything, gradients that band (grain is mandatory here).

---

## 2 · Paper Ledger — warm editorial print

**Use for:** publishing, courses, brand/strategy, anything that should feel authored and human.
**Feeling:** considered, tactile, archival. A printed annual report that moves.

```css
:root{
  --ground:     oklch(94% 0.014 85);
  --surface:    oklch(89% 0.018 85);
  --surface-hi: oklch(84% 0.022 85);
  --ink:        oklch(22% 0.020 60);
  --ink-dim:    oklch(42% 0.018 60);
  --ink-faint:  oklch(64% 0.014 70);
  --accent:     oklch(56% 0.150 42);
  --accent-dim: oklch(44% 0.120 42);
  --font-display:"Newsreader", Georgia, serif;
  --font-body:  Inter, sans-serif;
  --font-mono:  "IBM Plex Mono", monospace;
  --grain:0.06; --vignette:0.06;
}
```

- **Type:** Newsreader / Instrument Serif display, serif italic for emphasis only. Body in a grotesk
  to keep it modern. Real optical sizing.
- **Layout:** asymmetric columns, hairline rules, a running mark, wide margins. Numbered sections.
- **Motion:** *weighted* — `power2.out`, 600–900ms, slow settles, page-turn style wipes, minimal blur.
- **Copy:** Sentence case, concrete nouns, one clause. `Every frame is printed from the same plate.`
- **Pitfalls:** looking like a template CV; saturating the paper; too many rules and rules-on-rules.

---

## 3 · Swiss Signal — brutalist grid

**Use for:** anything that needs to shout: launches, events, sport, music, a strong opinion.
**Feeling:** loud, exact, unbothered. Not decoration — typography as structure.

```css
:root{
  --ground:     oklch(12% 0 0);
  --surface:    oklch(20% 0 0);
  --surface-hi: oklch(96% 0 0);
  --ink:        oklch(98% 0 0);
  --ink-dim:    oklch(72% 0 0);
  --ink-faint:  oklch(48% 0 0);
  --accent:     oklch(62% 0.220 27);
  --accent-dim: oklch(48% 0.180 27);
  --font-display:"Archivo", Helvetica, sans-serif;
  --font-body:  Archivo, sans-serif;
  --font-mono:  "Space Mono", monospace;
  --grain:0.03; --vignette:0.08;
}
```

- **Type:** Archivo / Inter at extreme sizes, tracking −3% at display, **no rounding anywhere**.
  Type is cropped by the frame on purpose — a word larger than the canvas reads as confidence.
- **Layout:** a visible or implied grid, hard edges, one element breaking the grid per frame.
- **Motion:** *mechanical* — stepped, hard cuts, `power4.in`, slam entries, counter/mono rolls.
- **Copy:** UPPERCASE, imperative, ≤ 5 words. `ONE SOURCE. / EVERY FORMAT.`
- **Pitfalls:** becoming a skate brand pastiche; red used at 40% of frame; no legible hierarchy under
  the shouting.

---

## 4 · Daylight Product — cool light UI

**Use for:** product explainers, app demos, data and chart films — anything where the subject is a
*real interface* or a real number, and the buyer must believe software shipped this year.
**Feeling:** daylight on a desk. Precise, calm, engineered; not a dark launch trailer.

```css
:root{
  --ground:     oklch(96.5% 0.006 230);   /* cool near-white, the desk the UI sits on */
  --surface:    oklch(93% 0.008 230);
  --surface-hi: oklch(88% 0.010 230);

  --ink:        oklch(19% 0.020 235);     /* deep ink-blue, 15:1 on ground */
  --ink-dim:    oklch(46% 0.018 235);     /*  6.5:1 — labels */
  --ink-faint:  oklch(70% 0.012 235);     /*  3.0:1 — rules and hairlines ONLY */

  --accent:     oklch(88% 0.190 122);     /* lime, FILL ONLY (bars, chips, states) */
  --accent-ink: oklch(52% 0.140 122);     /* the same hue, text-safe at 4.6:1 */
  --danger:     oklch(58% 0.190 25);      /* conflicts, one moment per piece at most */

  --font-display:"Inter Tight", Inter, sans-serif;
  --font-body:  Inter, sans-serif;
  --font-mono:  "JetBrains Mono", monospace;
  --grain:0.028; --vignette:0.03;
}
```

- **Type:** Inter Tight display at −2%; UI text at real sizes (13–22 px at 1080p) because a demo with
  no small text reads as a mockup. Numerals tabular.
- **Layout:** the UI is the picture. Chrome, sidebars, rows, hairlines at `--ink-faint`. The camera
  moves through it; the frame is never a slide with UI floating in the middle.
- **Motion:** *precise* — `power3.out`, 280–460 ms, no overshoot on UI. Camera-led, not element-led.
  Hover, press and settle states must exist; a cursor that jumps is a lie.
- **Copy:** sentence case, lowercase labels, numerals. `drag it. it fits.`
- **Pitfalls:** fake-looking UI (centred, airy, two rows of text); lime used as a text colour; any glow.

---

## Choosing

| The brief sounds like | Lane |
|---|---|
| "we ship a tool, it's fast, it's for developers" | Night Shift |
| "we publish things, we have a point of view" | Paper Ledger |
| "we're launching, it needs to be loud" | Swiss Signal |
| "it's an app / a product / a chart, show the thing working" | Daylight Product |
| "it must look like the client's existing brand" | derive tokens from their brand, then pick the closest lane's *motion register* |

Never mix two lanes' tokens. If the piece genuinely needs two worlds (a light act and a dark act),
that's one lane with a **deliberate** inversion at a chapter turn — held, and justified in `BRIEF.md`.
