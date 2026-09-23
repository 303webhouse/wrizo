# THE SPLASH SCREEN · S0 — WHAT EXISTS TODAY, AND WHAT IT REPLACES
### tools lane · worktree `.claude/splash` · branch `splash-screen`
### off `origin/main` @ `8b774d4` · 2026-09-22 · NO BEHAVIOUR CHANGE
### item number **PROPOSED 194** (the registry's next free; chat 1 assigns)

**ASSETS PRESENT, AS BRIEFED — checked first, per the brief's own stop
condition.** Both at `C:\Users\nickh\Downloads\`, both `3374 x 2699`, both
8-bit **RGBA** (a real alpha channel, not a matted one):

```
wrizo-sketch-for-dark-theme.png    3374x2699  RGBA  291 KB
wrizo-sketch-for-light-theme.png   3374x2699  RGBA  291 KB
```

**Colours untouched, as instructed** — nothing here recolours anything.

---

## §1 · THE ANSWER TO "WHAT IT REPLACES": NOTHING

**There is no splash screen today.** `splash` appears **zero** times in the
entire app source (`--include=*.tsx --include=*.ts --include=*.css`).

**The plain-text loading screen it might have replaced is already gone** —
retired by HB1, not by this item. `App.tsx`, in its own words:

> *"the router now mounts regardless of auth state. Arrival (route '/') is
> both the boot screen and the front door… This retires the old
> `authState === 'anon' → HomeFlow` short-circuit and the plain-text loading
> screen — Arrival's own boot bar (authState threaded through as a prop)
> carries both jobs now."*

**What stands at boot instead: `Arrival` — "the Threshold" (HB1 S1/S5),
route `/` for every boot, authed or not.** It carries three things: *the
mark*, *a boot bar* (the two doors stay disabled until `authState` resolves
— real readiness, not a timer), and *the two doors*. It is a **destination**,
not a loading state: Write is local-first and never waits on the network.

**A brand mark already ships, and the splash is not it.** `/brand/wrizo-logo.png`
(900×400 RGBA) renders twice today — `.brand-mark`, a fixed **88px**
bottom-right watermark on every route except `/` (hidden under
`.app-immersive`), and Arrival's own `.wz-mark` (80px, top-left,
`opacity:.4`). Nick's sketch is a **different artefact** at a different
scale; nothing above is retired, moved, or restyled by this item.

**So: the splash is purely ADDITIVE.** No park, no successor, no supersede.
That is the whole answer to the brief's question, and it is worth stating
plainly because "add a splash" usually means "replace a loading state", and
here there is none to replace.

---

## §2 · THE ASSET, MEASURED — SIZE THE INK, NOT THE CANVAS

Measured by decoding both PNGs (node's own `zlib`, no dependency) and walking
the alpha channel. **The two assets are geometrically identical to the
pixel** — same canvas, same bounding box, same margins:

| | |
|---|---|
| canvas | `3374 x 2699` |
| ink bounding box | `x 149..3225, y 121..2578` = **`3077 x 2458`** |
| bbox vs canvas | **91.2%** of width, **91.1%** of height (83.1% of area) |
| bbox aspect | **1.252** (canvas 1.250) |
| ink coverage | **4.5%** of the bbox — sparse linework |
| brass (`TEXT` box) | `442 x 335` at **45.0% across, 57.4% down** |

**Two consequences for the build:**

1. **Sizing must target the BBOX.** "A fifth of the screen" is a claim about
   what the eye sees, and the eye sees the linework, not the transparent
   margin. Sizing the `<img>` to the target instead lands the visible mark at
   **83.1%** of the intended area. The element is therefore sized to
   bbox ÷ 0.912 across and ÷ 0.911 down.
2. **4.5% ink coverage is why the small reading is fragile.** This is thin
   hand-drawn line, not a solid logo: it thins toward invisibility far faster
   than a filled mark would as it shrinks.

---

## §3 · THE TWO READINGS ARE ~2× APART — AND ONE OF THEM BREAKS THE CEILING

> **CORRECTED 2026-09-22, before any of it was built on.** This section first
> claimed the readings differ by *"2.24× linear, 5.00× in area — a fifth of the
> WIDTH is a twenty-fifth of the AREA at any aspect."* **Both figures were
> wrong.** They were a constant I wrote into the tool (`1/√0.2`), not a value
> derived from the two readings, and they hold **only when the emblem's aspect
> equals the screen's** — a 5:4 monitor, for a 1.252 emblem. **The table below
> already disproved them**: B's share of area varies 3.8%–5.7% across these
> viewports and is a flat twenty-fifth (4%) at none of them. Caught by a
> no-browser algebra check written to protect the box turn, which re-derived
> the ratio instead of trusting the summary line. Derived correctly:
>
> **A/B linear = √(5 · emblemAspect / screenAspect)** → **1.88×–2.28×** across
> these viewports (**3.52×–5.22×** in area). **B's share of area = 0.04 ·
> screenAspect / emblemAspect.** Both depend on the screen's shape: wider
> screens narrow the gap, taller ones widen it.
>
> The per-viewport table itself was computed by the correct formula and is
> unchanged. Only the generalisation drawn from it was wrong — which is the
> cleaner half of the lesson: *the summary was not derived from the measurement
> printed beside it.*

`scripts/splash-size.mjs` (committed, no browser) computes both at real
viewports:

| viewport | A: 1/5 **area** (ink px) | A as % of width | B: 1/5 **width** (ink px) | B as % of area |
|---|---|---|---|---|
| 1366×768 | 512 × 409 | **37.5%** | 273 × 218 | 5.7% |
| 1680×1050 | 665 × 531 | **39.6%** | 336 × 268 | 5.1% |
| 1920×1080 | 721 × 576 | **37.5%** | 384 × 307 | 5.7% |
| 1440×1200 | 658 × 525 | **45.7%** | 288 × 230 | 3.8% |
| 2200×1300 | 846 × 676 | **38.5%** | 440 × 352 | 5.4% |

**The finding worth Nick's eye: "at most 1/5" is a CEILING, and the two
readings disagree about whether A is inside it.** Under an area reading, A
sits exactly at the ceiling. Under a width reading, A is **~2.2× over** it —
an emblem spanning 37–46% of the screen's width. A person looking at 45.7%
of their screen width may not call that "at most a fifth of the screen",
even though by area it is exactly that.

**Legibility, the other half of the choice.** The sketch's handwritten labels
have a cap height of roughly 60px in the original (measured off the linework,
and stated as approximate):

- **Reading A** → labels land at **~10–16px**. Readable; the sketch stays a
  diagram you can read.
- **Reading B** → labels land at **~5.3–8.6px**, at or under the floor where
  a hand-drawn stroke stops resolving as a word. **This is exactly the
  "labels become texture" the brief predicts** — confirmed by arithmetic
  rather than assumed.

**Building to AREA until Nick chooses, as instructed.** Both frames still get
rendered for him headfully — that needs the box (§6).

---

## §4 · THE BRIEF'S ITEM (3) DOESN'T MAP ONTO THE APP AS BUILT — HANDED UP

> *"(3) the dark or light asset follows the active theme"*

**There are exactly two registered themes, and BOTH are dark-ground:**

| theme | app ground (`--ink-950`) | |
|---|---|---|
| `plateau` (default) | `#110600` | *"deep espresso ground (Wrizo brand)"* |
| `flux` | `#04141A` | |

**Neither theme is a "light theme".** The light/dark axis that *does* exist
is **`data-page`** (`'dark' | 'light'`, default **`light`**, set on `<html>`
by `store/themePrefs.ts`) — but that governs the **paper**, not the chrome,
and Plateau's dark pair is a **flagged debt** (canon §11: *"Page:dark has no
Plateau…"*). So `data-theme` is the wrong signal and `data-page` describes a
different surface than the one the splash floats over.

**Which asset is correct today?** The splash sits over the app ground (at
boot that is Arrival, which renders on the ground, not on paper) — and the
ground is dark under **both** themes. So the **dark-theme asset (cream
linework) is correct in every configuration the app currently ships.** The
light asset would have no trigger at all under a literal `data-theme` map.

**LEAN, handed up rather than decided quietly: derive the choice from the
measured luminance behind the splash at mount, not from a theme→asset map.**
Three reasons: (a) `theme.ts`'s own comment anticipates *Volant, Nomad,
Machina* — a hardcoded map goes stale the moment one lands, and the failure
mode here is **cream ink on a cream ground: invisible art**, which no test
that only checks "the element mounted" would catch; (b) it makes the
paper-vs-chrome distinction moot, because it measures what is *actually*
behind; (c) it is the same discipline as this arc's census laws — *a list
sees the spellings someone imagined.* If Fable prefers the literal map, say
so and it is a two-line change.

---

## §5 · `backdrop-filter` WOULD BE ITS FIRST USE IN THIS APP

> *"(1) … a backdrop blur of the live app, not a screenshot"*

**`backdrop-filter` appears ZERO times in `index.css`.** The blur is
therefore a new rendering primitive here, not an existing pattern to follow,
and it interacts with a stacking context this app has already tuned hard:
`z-index` runs to 300 (modals/backdrops/toasts `fixed` at 80–300),
`ThemeEffectsLayer` paints behind everything, `.desk-frame-strip` carries a
deliberate `z-index:1` from item 130, and `.app-immersive` hides chrome
outright. A backdrop blur reads the composited backdrop, so **whether it
blurs what we intend is a headful question, not a source-reading one** — it
is the first thing the box turn checks.

*(The brief's "not a screenshot" is already the right call for a second
reason: the app is local-first and paints immediately, so there is no frozen
frame to screenshot that would not be stale by the time it showed.)*

---

## §6 · WHAT THIS S0 DID NOT DO — THE BOX IS HELD BY ANOTHER LANE

**Pre-flight was not zero, so I stopped**, per the brief's own instruction.
`~/.wrizo/box-turn.json` names **`lane: PW2`, token `pw2-item176-corrected-20260922`**.
A worktree isolates files, not the box; the turn is PW2's. **Nothing headful
ran.** Everything above is static: PNG headers, an alpha walk, CSS and TSX
reading, and arithmetic.

**Waiting on a grant:** the two headful frames into `Downloads` (area and
width, for Nick to choose between), and the `backdrop-filter` compositing
check of §5.

---

## §7 · PROPOSED DISMISSAL, WITH THE REASONING (BRIEF ITEM 4)

> *"(4) it never blocks writing — propose the dismissal … and say which you
> chose and why"*

**Chosen: a short hold that dismisses itself, which ANY input also dismisses
early — and that input still reaches the app.**

Against the brief's three candidates:

- **On first paint of the app** — *rejected.* HB1 made boot instant and
  local-first; Arrival paints in a few frames with nothing to wait for. A
  first-paint dismissal would flash the emblem for ~2 frames and vanish,
  which is not an appearance at all. It also ties the art's life to an event
  the app was deliberately engineered to make as early as possible.
- **A click** — *rejected as the sole path.* An overlay that requires a
  gesture **is** a block until that gesture happens, which fails the brief's
  own "never blocks writing" on its face.
- **A short hold** — *chosen*, with two additions that make the constraint
  literally true rather than nearly true.

**The two additions, and why they matter:**

1. **Any input dismisses it immediately** — pointer, key, or focus. So the
   hold is a *maximum*, never a wait.
2. **That first keystroke must still land in the app.** The real trap in
   "never blocks writing" is a writer who opens Wrizo and immediately types:
   if the overlay eats that character as its dismiss gesture, the app has
   silently swallowed the first word. So the splash listens **passively**
   (no `preventDefault`, no capture-phase interception, `pointer-events:
   none` on everything that does not need to be hit) — it *observes* the
   input and leaves; it never *consumes* it.

**Reduced motion (brief item 5):** no animated entrance either way — a plain
appear and disappear, the same hold, no transition. The app already carries
45 `prefers-reduced-motion` blocks, so this follows an established house
convention rather than inventing one.

**One thing the brief does not say, so I am flagging rather than assuming:**
Nick says *"the opening splash screen"*, which reads as **every app open**,
not first-run-only. The existing `store/firstRun.ts` is a different concept
(it gates founding defaults and the unlock ceremony) and is **not** reused
here. If he means once-ever, that is a one-line change to a different store.

---

## §8 · ONE MORE THING TO CONFIRM BEFORE BUILDING

Nick: *"with the regular app interface blurred out in the background."* At
boot, the regular interface is **Arrival/the Threshold** — a mark, a boot
bar, two doors — not the writing room. The faithful build blurs *whatever is
actually mounted* (which is what "the REAL app interface, not a screenshot"
asks for), and at open that is Arrival. Flagged because the phrase might
picture the writing surface, and those are different pictures. **Lean: blur
what is genuinely there**, i.e. Arrival at boot — and it then works
unchanged if the splash is ever shown over a writing surface.

---

## §9 · WHAT THIS COMMIT CHANGES

**No app behaviour.** One new committed tool
(`apps/desktop/scripts/splash-size.mjs`, static, no browser) and this survey.
No asset has been copied into the repo yet, no component exists yet, and
nothing headful has run.
