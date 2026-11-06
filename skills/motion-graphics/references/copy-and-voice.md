# Copy and voice

The words are half the design. Copy written last, in whatever phrasing is in the air, is the most
reliable way to make good motion look amateur. So: **lane chosen → copy written → animation built.**

## Three rules

1. **Every on-screen word is one of three things:** a true claim, a real number, or a deliberate design
   element (a label, a rule, a mark). Anything else is filler and gets cut.
2. **The lane dictates the register.** Not your default voice, not the client's — the lane's.
3. **Read it at speed.** On-screen text needs ≈ 3 words/second to be read. Minimum hold =
   `words / 3 + 0.3s`. A 9-word headline needs 3.3s on screen, so 9-word headlines belong in a 15s
   piece, not an 8s one.

## The three registers

| | Night Shift | Paper Ledger | Swiss Signal |
|---|---|---|---|
| Case | lowercase | Sentence case | UPPERCASE |
| Sentence | declarative, subject-first | concrete nouns, one clause | imperative, ≤ 5 words |
| Numbers | numerals, always (`7.4M` not `seven million`) | numerals, spelled for small counts | numerals, tabular |
| Emphasis | weight + accent colour | serif italic | scale + tracking |
| Forbidden there | exclamation, adjectives | slang, contractions | any word over 3 syllables |
| Sounds like | "one file. eleven formats." | "The plate was printed in 1971." | "SHIP IT." |

Copy examples, same idea in three registers:

- Night Shift — `render. / 4.2 seconds. / no timeline.`
- Paper Ledger — `Every frame is printed from the same plate.`
- Swiss Signal — `ONE SOURCE. / EVERY FORMAT.`

## Banned words

Instant tells of generated copy. One appearance fails the critic:

> unlock · elevate · unleash · seamless · seamlessly · revolutionise · revolutionize · game-changing ·
> cutting-edge · next-level · supercharge · empower · "the future of" · "in today's world" ·
> "imagine a world" · "we don't just X, we Y" · "it's not just X, it's Y" · "take it to the next level"

Also banned: three-item adjective lists ("fast, simple, and powerful"), and any sentence that would
survive being pasted onto a different product unchanged. That last test is the useful one — if the
line is transferable, it says nothing.

## Numbers and claims

- Portfolio pieces may use a **visibly fictional** brand (`NORTHWIND`, `Ardent`, `Kestrel Rail`), never
  a real company's name or logo.
- Numbers must be either real (with a source in `BRIEF.md`) or clearly illustrative, and if
  illustrative the piece must not present them as a result. Never invent a testimonial, a customer
  count, a growth figure or a quote.
- Placeholders stay bracketed until replaced: `[CLIENT]`, `[CITY]`, `[N]`.

## Typography is voice

Half the vibe is the face. Commit at step 2, put the files in `assets/fonts/`, and `@font-face` them —
HyperFrames only resolves its bundled fonts by name. All suggestions below are OFL/free-to-ship:

| Lane | Display | Body | Mono |
|---|---|---|---|
| Night Shift | Inter Tight, Space Grotesk, Chivo | Inter | JetBrains Mono |
| Paper Ledger | Newsreader, Instrument Serif, Fraunces | Inter | IBM Plex Mono |
| Swiss Signal | Archivo, Inter (tight tracking), Bebas Neue | Archivo | Space Mono |

**Verify the font loaded on the first still.** A silently failed `@font-face` renders the whole piece
in a fallback and nobody notices until the critic does.

## Length by format

| Format | Words of on-screen copy, total | Beats |
|---|---|---|
| 6s sting | 4–8 | 2–3 |
| 10–15s piece | 10–25 | 3–5 |
| 30s piece | 35–60 | 6–9 |
| 60s reel | 60–100 | 10–14 |

More words than this means the piece wants to be an explainer, not a motion graphic. Say so.
