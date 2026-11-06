# Motion rules

The house law. It exists because independently-animated scenes — each with its own easing, starting
and settling at rest — read as a slideshow no matter how good each scene is alone.

**The full doctrine is vendored, not copied here.** Read it when authoring, not before:

| Read | Path |
|---|---|
| The seam law, carriers, anti-idle rules | `repos/hyperframes/.agents/skills/motion-doctrine/SKILL.md` |
| Transition catalog + code | `repos/hyperframes/.agents/skills/cut-the-curve/SKILL.md` |
| Seam render mechanics, white-flash guard | `repos/hyperframes/.agents/skills/seam-craft/SKILL.md` |
| Cursor-led action | `repos/hyperframes/.agents/skills/oversized-cursor/SKILL.md` |

## House constants

| Constant | Value |
|---|---|
| Dominant direction (the current) | LEFT, for every ordinary seam |
| Single element entrance | ≤ 800ms |
| Exit duration | ≈ 75% of entry |
| Total stagger | ≤ 500ms |
| Stillness before a result | 0.3–0.75s |
| Overshoot | `back.out(1.4–1.7)` |
| Never | `bounce.out`, `elastic.out` |
| Inter-scene transition vocabulary | 2–3 techniques, repeated |

## Easing by register

| Register | Enter | Exit | Character |
|---|---|---|---|
| Snappy | `power4.out` | `power4.in` | fast attack, instant settle |
| Weighted | `power2.out` | `power2.in` | mass, longer settle |
| Liquid | `expo.out` | `expo.in` | long tail, smooth |

Mirrored pairs matter: if a scene exits with `power4.in`, the next enters with `power4.out` at matched
distance and duration, picking up ≥ 50% along the path. Never from rest.

## Quote peak velocity, not average

Two different numbers describe the same move and quoting the wrong one turns a real trade into a
rationalisation:

| Number | What it is | Where it comes from |
|---|---|---|
| **average** | total distance ÷ total duration | your own arithmetic |
| **peak** | the instantaneous velocity at the cut frame | `seam-gate.mjs` exit/entry velocity |

A `power4` exit is slow then violent: at the cut, peak can be **2–5×** the average. Motion blur,
strobing and "does this read as a pan or a cut" all depend on the **peak**, so the peak is the number
that belongs in `BRIEF.md` when justifying a floor element. Quoting the average to argue that blur
isn't needed is the most common way a correct decision gets an incorrect reason.

```powershell
# the gate reports px/s per seam — use those figures, not distance/duration
node "$gate\seam-gate.mjs" verify --ledger "$piece\ledger.json" --project $piece
```

Rule of thumb at 30fps: under ~12 px/frame no blur is needed; 12–30 px/frame is a judgement call on
duration (a 0.3s move the eye doesn't track can survive); over ~30 px/frame, ship blur or don't ship
the move.

## The ledger

`work/NN-slug/ledger.json`, written **before** authoring scene entrances:

```json
{
  "fps": 30,
  "seams": [
    {
      "id": "hook→claim",
      "cut": 4.2,
      "technique": "cut-the-curve LEFT",
      "exit":  { "selector": "#el-hook",  "axis": "x", "dir": -1 },
      "entry": { "selector": "#el-claim", "axis": "x", "dir": -1 }
    },
    {
      "id": "claim→payoff",
      "cut": 10.2,
      "technique": "inverse zoom-through",
      "exit":  { "selector": "#el-claim",  "axis": "z", "dir": -1 },
      "entry": { "selector": "#el-payoff", "axis": "z", "dir": -1, "scanRoot": "#el-payoff" }
    },
    {
      "id": "ui→player",
      "cut": 6.6,
      "type": "match-cut",
      "carrier": { "out": "#resting-card", "in": "#product-video" }
    }
  ]
}
```

- `cut` — seconds on the master clock; the frame the incoming side ignites.
- `axis` — `x`, `y`, `z`. `dir` — sign: x −1 left, y −1 up, z +1 push (grow), z −1 pull (shrink).
- `type` — `cut` (default, full checks), `match-cut` / `morph` (carrier + overlap only).
- `selector` — the element carrying the seam. `probe` tells you which.

## Verify

```powershell
$mg = if ($env:MG_STUDIO) { $env:MG_STUDIO } elseif (Test-Path "tools\mg.mjs") { (Get-Location).Path } else { Join-Path $env:USERPROFILE "projects\motion-graphics" }
$gate = "$mg\repos\hyperframes\.agents\skills\motion-doctrine\scripts"

# find the real carrier selectors when authoring a row
node "$gate\seam-gate.mjs" probe --t 4.2 --project "work\01-slug"

# verify (exit 0 = pass)
node "$gate\seam-gate.mjs" verify --ledger "work\01-slug\ledger.json" --project "work\01-slug"

# optionally stamp the seam block rather than hand-writing it
node "$gate\seam-stamp.mjs" --ledger "work\01-slug\ledger.json" --write "work\01-slug\index.html"
```

The gate enforces: exit still moving, entry mid-flight, direction matches the ledger, no overlap,
Z sign consistency, carrier continuity. It cannot see intention — that's what the plan is for.

> **Windows: `--project` is broken, use `--url`.** `seam-gate.mjs --project` shells out to `sh`, which
> does not exist here, so it dies before checking anything. Run the preview yourself and point the gate
> at it:
>
> ```powershell
> npx hyperframes@latest preview --background       # note the port it prints
> npx hyperframes@latest preview --status
> $env:CHROME_PATH = "<path to chrome.exe>"        # if the gate cannot find a browser
> node "$gate\seam-gate.mjs" verify --ledger "work\01-slug\ledger.json" --url http://localhost:<port>
> npx hyperframes@latest preview --stop
> ```
>
> Restart the preview after editing a composition — a stale bundle makes the gate measure the old page.

## The four sustained-motion routes

Between an entry and its exit, a scene must be *doing* something. Idle wobble (breathe, float, pulse)
is banned — it reads as waiting. Pick one route per phase:

1. **Staged reveals** — hold content back, pay it off on beats.
2. **Camera with intent** — establish, travel, arrive.
3. **Sequenced life** — counters tick, progress advances, highlights step.
4. **Cursor-led action** — an oversized cursor walks the eye to a trigger and clicks.

Test: pause at any second. Something meaningful must be mid-flight.

## Common failures

| Symptom | Cause | Fix |
|---|---|---|
| Momentum dies at cuts | scenes settled before the cut | cut mid-motion both sides |
| Piece feels like a slideshow | every scene starts from rest | entry ≥ 50% along the path |
| Ping-pong feeling | consecutive seams in opposite directions | keep the current |
| Cheap bounce | `bounce.out` / `elastic.out` | `back.out(1.4)` |
| Dead air | entry finished early, seconds left | add story or a route, not wobble |
| Text blurry mid-zoom | animating `filter` / `will-change` under a scaled parent | animate transform only |
