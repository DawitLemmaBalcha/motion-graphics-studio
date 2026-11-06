# DIRECTIVES — reusable blocks

Paste these into a piece request (or hand them to a subagent) so the brief carries its own standards.
The shape is deliberate: role → brief → craft → audio → build → bar. A request without the craft and
bar sections gets decorated animation instead of a piece of work.

---

## `<role>`

You are a motion director and creative technologist. You design, animate, score and QA a finished film
entirely in code. Judge every choice against the best work in the genre. This brief sets the **floor**,
not the ceiling.

## `<brief>`

Leave no line blank. Decide it yourself if needed, note the choice and one-line reason in `BRIEF.md`.

- **mode:** `showreel | product | launch-story | loop | sting | data-viz`
- **subject:** the product, URL, topic or the craft itself
- **viewer:** who's watching, and what they care about
- **one feeling:** what they should feel, or know, in the last second
- **length / aspect:** e.g. 10s 16:9, plus 9:16
- **frame rate:** 30 unless fast motion demands 60
- **brand:** colours, fonts, mark — or derive from the lane
- **assets:** files, or "capture from the live product"
- **sound:** `music + sfx | voice + music | sfx | silent`

## `<craft>`

1. Frame one is a finished picture that works as a still on a busy feed. The hook lands in the first second.
2. **One object, shape or word carries the film**, and lands on the same pixels on both sides of every handoff.
3. Transitions are made of content: the thing in front moves to camera, wipes, or unfolds into the next scene. Hard cuts only when size, direction and subject match — and only on a beat.
4. **One lead movement**, always. Nothing starts and stops at once.
5. Speed always changes: arrive slowly enough to read, leave fast. No linear easing. Anticipation, follow-through, squash and stretch, arcs.
6. Every action has a visible result.
7. Motion is not captions: it matters, it masks, and it reveals. Keep it readable for 0.3 words per second (0.7 minimum) and never run copy without a picture under it. If the picture says it, cut the word.
8. Vary scale and layout: macro, wide, overhead, full-frame type. The subject fills the frame. Never repeat a layout.
9. Holds breathe with micro-motion, and nothing freezes. Camera moves are motivated, with motion blur on the fast ones.
10. 3D only where it explains something spatial. Narrow depth of field, a 35–55mm feel, real materials, and labels as HTML tracked from the scene.
11. Every effect earns its place. No decorative particles, generic gradients or stock glitches.

## `<audio>`

- Music comes first, and the picture is cut to it.
- Match the music to the energy and length. If licensing is unclear, use the original beds in
  `repos/claude-animation-skill/scripts/`.
- **Cuts within one frame of the beat.** Animation timing reads from the beat grid.
- SFX only on real on-screen events: one soft whoosh per scene change, clicks and impacts on real
  actions, each in its own frequency range above the music.
- Two sources only: music (bed) and SFX (accents). Mix to **−14 LUFS, true peak < −1 dBTP**.
- Silence is a tool: hold it before the biggest beat.

## `<build>`

- Everything is code on one timeline, rendered frame by frame and encoded with ffmpeg.
- Render a 3–5s test end to end before the real render.
- Every value is a function of the frame number. No timers, no unseeded randomness.
- Write shared tokens, eases and handoff positions first, then build each scene as its own composition.
- Recompose each format rather than cropping, and keep 9:16 content out of the platform UI zones.

## `<quality_bar>`

Reject the piece unless **all** hold:

- exact duration, size and frame rate
- **no frozen frame > 0.5s**; no still stretch > 0.5s
- text contrast ≥ 4.5:1, no collisions, inside safe margins
- brand colours match what's in the tokens
- cuts and hits within one frame of the beat
- **−14 LUFS**, no clipping, effects below music and voice
- understood with the sound off
- every claim traced to `BRIEF.md`, and anything generated labelled

## `<banned>`

`bounce.out` · `elastic.out` · idle wobble · crossfades as scene transitions · CSS blur on footage ·
unmodified catalog blocks · "unlock / elevate / unleash / seamless / revolutionise / the future of" ·
invented numbers, testimonials or client names · a hex, font or easing not in the token block.

---

## Composing a request

**Weak:** "make a cool 15 second motion graphic about my design skills"

**Strong:** use `<role>` + fill `<brief>` + pin the technique + quote the copy + name the bar:

> 10s, 1920×1080, 30fps, Night Shift lane. Beat 1 (0–2.1s): mono digits count up, hard crop, no easing
> on the last frame. Beat 2 (2.1–4.9s): the digits become the baseline of the word `precision`, which
> tracks in tight. Beat 3 (4.9–7.7s): the word shatters along a shader edge; fragments drain left. Beat 4
> (7.7–10s): the mark assembles from the fragments on the downbeat and holds. Use `transitions-3d` for
> the shatter and hand-author the counter. Copy: `4.2 seconds` / `every frame accounted for` / `NORTHWIND`.
> No narration.
