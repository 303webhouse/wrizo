# Rulings: `apps/desktop/src/components/Splash.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Splash §n]` points here.

## Splash §1

From `apps/desktop/src/components/Splash.tsx`, line 6 at `e2898deb` (the comment that stays: "the splash: pointer-events:none so it never eats a keystroke; sized by the ink's bounding box to about a quarter of the screen's area (capped at 60% height, 70% width); per-theme animation; holds until its animation ends and the app is ready; once per app load").

```ts
// THE SPLASH (item 187) — Nick's own hand-drawn Wrizo, over the live app, dimmed behind.
//
// Nick: "I would like the opening splash screen to be at most 1/5 the size of
// the screen with the regular app interface blurred out in the background."
//
// ITEM splash-hold (live, Nick): the first ship ran too fast and blurred, not
// dimmed. "Visible for at least 3 seconds, and the background should be faded
// out, not blurred." Two changes from that one sentence: the hold is now a
// FLOOR a writer cannot shorten (the old early-dismiss retires whole, below),
// and the veil is a flat dimming tint in the theme's own ground colour, never
// a backdrop-filter blur (see .wz-splash-veil, index.css).
//
// ITEM splash-hold ROUND 3 (Nick's ruling): "No ghost" — the front door's own
// wordmark/tagline/doors were visible THROUGH the dimmed veil the whole hold,
// racing the splash for attention. They now stay hidden for the hold's own
// duration and fade in exactly as the splash leaves (index.css's own
// `[data-splash-hold]` attribute rule on document.documentElement, set/cleared
// below — the two components never need to know about each other directly).
// The floor itself rose to 5s, and — new — the splash now ALSO waits for the
// app to be genuinely ready (`ready`, threaded from App.tsx's authState, the
// SAME derivation Arrival.tsx's own boot bar already uses): the hold is a
// floor, not a fixed duration, so a slow boot holds longer rather than
// handing off to a front door that is not ready yet. A cycling loading line
// under the mark (one of four per-theme lexicon phrases, changing ~1.4s)
// gives the hold something to say while it waits.
//
// FOUR THINGS THIS FILE IS CAREFUL ABOUT, each one measured or ruled rather
// than chosen by taste (docs/menus/splash-s0-survey.md carries the numbers):
//
// 1. IT NEVER BLOCKS WRITING, LITERALLY AND NOT NEARLY. The whole overlay is
//    `pointer-events:none` — it cannot intercept anything, so a click during
//    the splash lands in the app exactly as if the splash were not there. The
//    PASSIVE, non-capturing `window` listeners stay (splash-hold: they no
//    longer dismiss early — see below — but input still passes through them
//    exactly as before: they observe and leave, never `preventDefault`,
//    never capture, never consume). The trap this closes is specific — a
//    writer who opens Wrizo and immediately types must not have that first
//    character eaten by anything the splash does.
//
// 2. IT IS SIZED BY ITS INK, NOT ITS CANVAS. The asset is 3374x2699 but its
//    linework occupies only 3077x2458 of that (91.2% x 91.1%) — the rest is
//    transparent margin. "A fifth of the screen" is a claim about what the eye
//    sees, so the TARGET is the bounding box and the <img> is scaled up off it.
//    Sizing the canvas instead would land the visible mark at 83.1% of the
//    intended area, which is a fifth of nothing in particular.
//
// 3. THE SIZE IS ABOUT A QUARTER OF THE SCREEN'S AREA (item 187). Nick, last
//    word: "OK, let's make it ~1/4 the screen size. Doesn't need to be exact,
//    but that should be big enough to see the text a bit better, no?" This
//    supersedes the earlier fifth-of-the-WIDTH build (never run): a quarter of
//    the width grows the handwriting only a quarter, a quarter of the AREA
//    about doubles the width. It is arithmetic (CSS cannot take a geometric
//    mean portably), recomputed on resize. What the size must DO is unchanged
//    and is what splash.mjs asserts: the blurred app stays visible on all four
//    sides of the emblem, so it reads as a popup over the real app. Two caps
//    enforce that at extreme shapes - the ink height never exceeds 60% of the
//    viewport, its width never 70% - and both only ever make it smaller.
//
// 4. THE MARK FOLLOWS THE LAST-PICKED THEME (splash-sweep, docs/briefs/
//    splash-brief.md). Each theme draws its own animation — Arbor sweeps
//    Nick's hand-drawn sketch brass from IDEAS to FINAL DRAFT (SplashMark.tsx's
//    own ArborMark, cut by splash-build-kit.md's own script); Flux sweeps a
//    vector schematic of the same five steps (FluxMark). Both draw cream
//    lines/tokens on the veil's own (always-dark) ground by construction, so
//    there is no backdrop to measure any more — store/backdropTone.ts
//    (fix/splash-tone) is REMOVED here on Fable's own word: it existed to
//    choose between a cream and a warm-ink copy of ONE asset, a choice that
//    no longer exists once every theme ships its own built animation.
//
// splash-sweep ROUND 4 (Nick, live): "every [mockup] time below is multiplied
// by 0.7" and "the old 5s minimum hold is replaced by the animation's own
// length." SplashMark.tsx computes each theme's own total (reduced motion:
// instant) and calls `onFloorReached` at that point — see `holdMs()`/
// `onFloorReached` below for how that replaces the old fixed floor while
// keeping the same localStorage override (test speed) and the same 10s
// ceiling (now also this effect's floor backstop, in case a theme's
// animation never signals — belt, not the expected path).
//
// SHOWS ON EVERY OPEN (Fable's ruling), not first-run-only — `store/firstRun.ts`
// is a different concept (founding defaults, the unlock ceremony) and is
// deliberately not reused. The module-level `alreadyShown` makes it once per
// APP LOAD rather than once per mount, so a remount mid-session does not
// re-raise it.
```

## Splash §2

From `apps/desktop/src/components/Splash.tsx`, line 97 at `e2898deb` (the comment that stays: "about a quarter of the screen's area").

```ts
/** About a quarter of the screen's area (Nick: "~1/4 the screen size"). */
```

## Splash §3

From `apps/desktop/src/components/Splash.tsx`, line 105 at `e2898deb` (the comment that stays: "the escape hatch: /auth/me has no time limit, so after this long from mount the hold ends regardless of readiness (once the floor has passed); also the floor's backstop if the animation never signals").

```ts
/**
 * ITEM splash-hold round 4 (Fable's review): `/auth/me` carries no time limit
 * (apps/desktop/src/store/api.ts) — a hung network would keep `ready` false
 * forever, and the floor+ready gate alone would hold the splash up forever
 * with it. This is the escape hatch: once this many ms have passed (from
 * mount, not from the floor), the hold ends regardless of readiness —
 * Arrival's own boot bar (which already renders whether ready or not) takes
 * over signalling "still working" from there. Only matters once the floor has
 * ALSO passed (tryEnd's own gate, below) — a capture pass's longer explicit
 * hold override is never cut short by this.
 *
 * splash-sweep reuses this SAME value as the floor's own backstop (`holdMs()`
 * below): the normal floor trigger is SplashMark's `onFloorReached`, fired
 * at its own per-theme computed end (Nick's round 4: "the old 5s minimum
 * hold is replaced by the animation's own length") — this timer only matters
 * if that callback never fires at all (a bug, not the expected path), so it
 * is pinned to the same "something is wrong" horizon the readiness ceiling
 * already uses rather than inventing a second one.
 */
```

## Splash §4

From `apps/desktop/src/components/Splash.tsx`, line 171 at `e2898deb` (the comment that stays: "the flag and data-splash-hold are read during the first render, not in an effect, so no frame paints a splash about to retract or a front door about to hide").

```ts
  // Read the flag during the first render rather than in an effect: an effect
  // would let a remount paint one frame of a splash it is about to retract.
  // ROUND 5 (Fable's review) — `data-splash-hold` moves here too, for the SAME
  // reason: setting it in the mount effect let the front door paint ONE frame
  // visible (~0.33s, measured) before the effect ran and hid it. This runs
  // synchronously during the first render, before that frame ever paints.
```

## Splash §5

From `apps/desktop/src/components/Splash.tsx`, line 205 at `e2898deb` (the comment that stays: "SplashMark's timeline calls this once, at its hold point; refs keep its identity stable so SplashMark's mount effect never re-runs").

```ts
  // splash-sweep: SplashMark's own per-theme timeline calls this once, at
  // the point its animation reaches the brief's "a short hold, then the
  // fade" — the NEW floor trigger (Nick's round 4), replacing the old fixed
  // 5s timer. A stable identity (refs, not the effect's own `tryEnd`
  // closure) so SplashMark's mount effect never needs to re-run when this
  // component re-renders.
```

## Splash §6

From `apps/desktop/src/components/Splash.tsx`, line 232 at `e2898deb` (the comment that stays: "these listeners no longer end the hold: the floor flips floorPassedRef, and tryEnd ends it once the floor and readiness (or the ceiling) hold").

```ts
    // ITEM splash-hold, SUPERSEDED: the hold used to be a MAXIMUM, ended early by
    // the first keydown/pointerdown/wheel/touchstart (dismiss() called from each).
    // Nick's own word made the hold a FLOOR instead ("visible for at least 3
    // seconds") — nothing shortens it now, so these four listeners no longer call
    // anything. ROUND 3: the floor alone no longer ends the hold either — it only
    // flips floorPassedRef, and tryEnd() (called here AND from the ready-effect
    // below) is what actually ends it, once both conditions hold. ROUND 4: a third
    // way in — the ceiling timer flips ceilingPassedRef, letting tryEnd proceed even
    // with readyRef still false (but ONLY once the floor has also passed, same gate
    // everything else goes through — a capture pass's longer explicit hold is safe).
```

## Splash §7

From `apps/desktop/src/components/Splash.tsx`, line 318 at `e2898deb` (the comment that stays: "role=status: announced politely; `key` remounts each line to restart the fade, which reduced motion drops").

```ts
      {/* role="status" (Nick's ruling): announced politely, never interrupting.
          `key` forces a remount on every line change, restarting the CSS fade —
          reduced motion drops that animation entirely (index.css), an instant swap. */}
```

## Splash §8

From `apps/desktop/src/components/Splash.tsx`, line 330 at `e2898deb` (the comment that stays: "test seam: the frame pass and splash.mjs read this code's sizing; the floor is measured empirically, not reported").

```ts
/** Test/inspection seam — the frame pass and splash.mjs read THIS code's sizing.
 *  `HOLD_MS` SUPERSEDED (splash-sweep): there is no longer one fixed floor to
 *  report — `holdMs()` now returns the override-or-backstop (see its own
 *  comment), not a per-theme animation length, so splash.mjs measures the
 *  real floor empirically (elapsed time to `data-leaving`) instead of
 *  comparing against a reported constant. */
```
