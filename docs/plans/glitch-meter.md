# Flux Glitch meter: plan

Status: PLAN, for Fable's review. No code until it is cleared.
Mockup: `cursor/flux-flicker-mockup` @ `0eb36a6a` (Fable, Oct 16). That is the approved `04643f2` plus its two safety fixes: OS reduced motion, and each backlight dip counts as its own flash.

**The brief.** The brief has not reached this lane: twice now the message said it was attached, and nothing came with it. It is not in `docs/briefs/` yet. This plan is built from Fable's three rulings (Oct 16, below), the mockup, and the source. Where the brief might decide differently, the plan says "BRIEF?". When the brief arrives it gets committed and this plan is checked against it, and any gaps are handed up before the build.

## 0. The rulings this plan carries (Fable, Oct 16, on Nick's word)

1. **Over the page.** The meter covers the whole screen, page and text included. This overrides canon's "never enters the prose column": the meter never runs while the writer types. It is a separate `pointer-events:none` layer above the page. The ambient Signal Loss texture stays behind the page.
2. **Nick's rule.**
   - The meter is silent if a key was pressed in the last 30 s.
   - It ramps to its peak at 5 minutes idle.
   - Its intensity is multiplied by (1 − lap progress), and progress resets at the goal.
   - The Signal Loss texture keeps its own damping.
   - ONE global limiter (at most 3 flashes in any 1 s) counts both.
3. **Mockup `0eb36a6a`.** It honours OS reduced motion, and a double dip counts as two flashes. The same rule applies to the sync jump's second jump.

## 1. Reuse: what comes from ThemeEffectsLayer's Signal Loss pieces

As it is today:
- `components/ThemeEffectsLayer.tsx` mounts a theme's handlers into one fixed layer (`.theme-fx-layer`, `z-index:-1`, behind everything).
- `store/fluxThemeFx.ts` registers Flux's six Signal Loss events there: tear storm, shear band, noise patch, macroblock cluster, sync jump and backlight dip.
- Each event is its own jittered loop, scaled by the Ambiance dial and floored at 0.4 × its minimum interval.
- The loops damp while typing: the layer drops to opacity .13.
- Reduced motion zeroes the dial, so nothing runs.

The meter reuses the **events**, not the layer.
- **Extract the six event builders** from `fluxThemeFx.ts` into `store/signalLossEvents.ts`.
  - Each builder takes `(container, intensity)` and returns nothing.
  - They are the same DOM, classes and timings as today, with the mockup's per-intensity opacities (`bright(I, lo, hi)`) taken as a parameter.
  - Signal Loss calls them at its current fixed opacities, so it is byte-for-byte unchanged on screen. The meter calls them with its intensity.
  - This is one implementation with two callers. Keeping two copies is the drift this codebase keeps paying for.
- **The scheduler.** The meter keeps the six loops' jittered intervals, compressed by intensity exactly as the mockup does: `span / max(0.22, 0.22 + 0.78·I)`. It does not use the Ambiance dial: the meter's rate is its intensity (BRIEF?: does the dial scale the meter too?). Each loop keeps a floor of 0.4 × its minimum interval, as Signal Loss does.
- **The CSS.** The `.theme-fx-*` classes are reused inside the new layer. The sync jump moves only the meter layer: `transform` on `.glitch-meter-layer`, the same ±4 px.

**What is new**
- **`components/GlitchMeterLayer.tsx`:**
  - Mounted once at the app root, beside `ThemeEffectsLayer`.
  - `position:fixed; inset:0; pointer-events:none; z-index` above the page and below modals and the Flux block caret (z 60), so above everything the writer reads and below anything they must click (§6).
  - `aria-hidden`.
  - Runs only when all of these hold: the theme is Flux, Flicker is on, and a writing surface is mounted (`useWritingSession().inSession`). BRIEF?: which surfaces? This plan assumes every writing surface in session, as the mockup frames a page.
- **Page primacy.** The layer is chrome-category: it overlays without displacing. It never moves, resizes or unmounts the page, and it takes no input (§6's check proves it).

## 2. Intensity: idle × progress

```
idle(t) = 0                                   when t < 30 s  (a key in the last 30 s: silent)
        = u² · 0.4 + u · 0.6,  u = min(1, (t − 30) / (300 − 30))     (the mockup's curve: peak at 5 min)
I       = idle(t) × (1 − lapFrac)             (0 when Flicker is off, or the theme is not Flux)
```

- **`t`, the last keystroke.** `WritingSession` has only a settle-window boolean, with no time on it. A small store, `store/lastKeystroke.ts`, records `performance.now()`. It records from a capture-phase `keydown` and `beforeinput` on `document` while a writing surface is in session. Pointer moves and clicks do not count; Nick's rule says "a key" (BRIEF?: does a caret click or a scroll count as activity?).
  - IME composition counts as a key, through `beforeinput`. So does a pen stroke? No: the pen is inert on non-Journal surfaces, and the Journal is not a Flux writing surface for this meter (BRIEF?).
- **`lapFrac` is the lap's own progress.** It is `useGoalProgress(value, goal).frac`, the same number ModeStage already draws: word goal 250, time goal 25 min. It is `(value % goal) / goal`, so it returns to 0 when a lap completes. That is the reset at the goal, already built.
  - ModeStage publishes it to `store/glitchMeterInputs.ts`, `setLapFrac(frac)`, a one-line effect, and the layer reads it per frame.
  - When no goal is drawn (no ModeStage), `lapFrac = 0`, so I = idle(t).
- **One clock.** The layer runs one `requestAnimationFrame` loop that recomputes I per frame and fires due events, as the mockup's `tick` does.
  - When I = 0 it does no work beyond the check.
  - It stops while the document is hidden, because rAF pauses.
  - A keystroke makes I = 0 at the next frame. Events already in flight finish their ~150–400 ms; nothing new starts.

## 3. The global limiter: at most 3 flashes in any 1 s

- **`store/flashBudget.ts`**, one module, the only gate:
  ```ts
  export function tryFlash(): boolean   // a sliding 1000 ms window; true and recorded only if fewer than 3 flashes are in it
  ```
- **Both callers ask it before every flash.** Signal Loss's six loops ask, and so does the meter's scheduler. A refused flash is skipped, not queued, as in the mockup.
- **What counts as one flash** (BRIEF?: the brief may define a flash):
  - **1 each:** a tear storm (3–5 lines inside ~200 ms), a shear band, a noise patch, and a macroblock cluster.
  - **Sync jump:** the first jump is 1, and the optional second jump is 1 more (`0eb36a6a`).
  - **Backlight dip:** the first dip is 1, and the optional second dip is 1 more (`0eb36a6a`).
- **Why the existing safeguard is not enough.** The per-loop floor (0.4 × min) stays as it is. But six independent loops can coincide: the macroblock floor alone is 1040 ms, and six of them can land inside one second. Only a shared count prevents that, and it is the one structural guarantee for the "nothing flashes above 3 Hz anywhere" rule.
- **A harness-only record.**
  - When `window.__wzVerifyFlashes` is set, which runtime-verify arms the way it arms `__wzVerifyRows`, every granted and refused flash is logged with its time and kind.
  - It is never compiled out: the log is behind a flag read at call time, and it holds plain data. Memory: the minifier deletes empty spin loops, so nothing here depends on a timing loop.

## 4. Reduced motion: the still version

- **The source.** It reads `matchMedia('(prefers-reduced-motion: reduce)')` and listens for its `change` event, so turning the OS setting on mid-session stops flashing at once (`0eb36a6a` reads it at load; the app must also follow changes).
- **Under reduced motion the meter fires NO events,** so it never flashes or moves. Instead it shows the mockup's `.rm` overlay: a still scanline-and-grain texture whose opacity is `I × 0.42`.
  - Its opacity eases with a slow transition. The mockup sets it per frame; the app eases it over ≥ 2 s, so a change never reads as a flash. BRIEF?: mockup parity or the eased version?
- **Signal Loss behaves as now:** reduced motion sets the dial to 0, so nothing runs.
- **The limiter is unaffected,** since nothing asks it.

## 5. The Flicker switch

- **The control.** It is the mockup's FLICKER OFF/ON pair: a Flux-only switch, default ON (mockup).
  - It is stored as `wrizo-flux-flicker` in `store/writingSettings.ts`, beside Typewriter, with the same read-once and write-on-toggle pattern.
  - OFF sets I = 0. The meter layer empties, and the ambient Signal Loss texture is untouched.
- **Where it lives.** BRIEF?: the mockup draws it in the top bar. In the app the top bar is chrome that recedes while writing. This plan puts it in the drawer's Flux settings, beside the Ambiance dial, plus the top-bar pair if the brief places it there.
  - Either place is a tool, so it never displaces the page.
- **Theme lexicon.** The label comes through `t()`, not a literal, so a lexicon change is not a code change.

## 6. The harness: `scripts/harness/glitch-meter.mjs`

Real time cannot be waited out: 5 minutes of idle per check is too slow. So the meter reads its clock through one harness seam:

```
window.wrizoGlitchMeter = { setIdleOffset(sec), setLapFrac(f), state() }
```

The harness offsets the last keystroke backwards, as the mockup's `?idle=` does. `state()` returns `{ I, idleSec, lapFrac, reduced, flicker, running }`.

The checks, Flux, on a Draft page:

- **G1, silent while typing.** At idle 299 s, type one key, then 2 s later read `I === 0` and see no new meter children.
- **G2, the ramp.** `I` at idle 20 s / 60 s / 180 s / 300 s / 360 s equals the formula (0, idle(60), idle(180), 1, 1) within 1e-6. It is read from `state()` and checked against a copy of the formula in the harness.
- **G3, × progress.**
  - At idle 300 s with lap progress 0.5, `I === 0.5`.
  - At progress 1 (a lap completed), progress wraps to 0, so I returns to 1.
- **G4, THE FLASH COUNT.** This is the safety check, measured two ways and compared.
  - **Setup:** run at peak (idle 300 s, progress 0) for 20 s, with the Signal Loss dial at 100 so both systems compete for the budget.
  - **Measure A, the limiter's own log** (`__wzVerifyFlashes`): every granted flash, with its time.
  - **Measure B, independent of the limiter:** a `MutationObserver` on both layers. It counts each `.on` class added to a tear, shear or noise element, each macroblock cluster appended, each `jmp`/`jmp2` and `sync` class added, and each backlight opacity rise above 0.
  - **Asserted:**
    - in every sliding 1000 ms window of B, at most 3 flashes;
    - B's total equals A's grants. If they differ, the observer or the log is blind, so A cannot pass alone (memory: a guard can pass while blind);
    - A's refusals are above 0. At peak plus dial 100, the limiter must actually have refused something, or the run proves nothing about the limiter;
    - each kind is printed by count (the members, not just the total).
  - **Mutant (browserless, in `glitch-meter-check.mjs`):** raising the limit to 4 makes G4's window assertion go red on a scripted, deterministic schedule (a fake clock driven through the module, no browser).
- **G5, double events.** With randomness forced through the seam (`setForceDouble(true)`), one dip logs 2 grants, and one sync logs 2.
- **G6, reduced motion.**
  - With `emulateMedia prefers-reduced-motion: reduce` at peak: no event elements appear for 10 s (B = 0), the still overlay's opacity reaches `1 × 0.42` (±0.02, once settled), and no element on either layer animates.
  - Flipping the media setting back mid-run resumes events. That proves the live `change` listener.
- **G7, the Flicker switch.** A real press on OFF gives `I === 0`, the meter layer empties, and the Signal Loss layer still has its children. The setting survives a reload. ON resumes.
- **G8, page primacy and input.**
  - The page's bounding rect is identical with the meter at peak and with it off.
  - A real click on the page while the meter is at peak lands a caret: `elementFromPoint` returns the editor, not the layer.
  - The layer's computed `pointer-events` is `none`.
- **G9, Plateau.** In Plateau the meter layer is absent or empty, and `state().running === false`.
- **Browserless: `scripts/glitch-meter-check.mjs`.**
  - It covers the intensity formula (the curve and its edges), the limiter on a fake clock (the 3-in-1 s window, sliding edges, and a refusal that is skipped, not queued), and the double events counted twice.
  - Mutants:
    - the limit at 4;
    - a window of 999 ms;
    - the second dip not counted;
    - the 30 s gate dropped.
- **Existing harnesses that will change.** The Signal Loss tests (TH2's) now see refused flashes when they coincide. Any check that counts Signal Loss events per second must be found by a behaviour sweep (grep for what the limiter changes: `theme-fx-` counts, timings) and parked, not edited, if it is falsified.

## 7. Files

- **New:**
  - `components/GlitchMeterLayer.tsx`
  - `store/signalLossEvents.ts`
  - `store/flashBudget.ts`
  - `store/lastKeystroke.ts`
  - `store/glitchMeterInputs.ts`
  - `scripts/glitch-meter-check.mjs`
  - `scripts/harness/glitch-meter.mjs`
- **Changed:**
  - `store/fluxThemeFx.ts`: it calls the extracted builders, and `tryFlash()` before each event.
  - `App.tsx`: mounts the layer.
  - `ModeStage.tsx`: publishes the lap fraction.
  - `store/writingSettings.ts`: the Flicker setting.
  - The drawer's Flux settings: the switch.
  - `index.css`: the layer, plus the `.rm`-style still overlay.
  - `deskLexicon` / `themeLexicon`: the label.
- **No new dependencies.** No storage beyond one localStorage key. Nothing on the server.

## 8. Questions (BRIEF? items, collected)

- **Q1.** Does the Ambiance dial also scale the meter? This plan says no: the meter's rate is its intensity.
- **Q2.** Which surfaces run the meter? This plan says every writing surface in session.
- **Q3.** What counts as activity besides a key: a caret click, a scroll?
- **Q4.** What is one flash? This plan says one per event, with double events counting 2, as in `0eb36a6a`.
- **Q5.** Should the reduced-motion still overlay ease (≥ 2 s), or follow the mockup per frame? Lean: ease.
- **Q6.** Where does the Flicker switch live: the drawer, the top bar, or both?
