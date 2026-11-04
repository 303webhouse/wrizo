# Rulings: `apps/desktop/src/components/SplashMark.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[SplashMark §n]` points here.

## SplashMark §1

From `apps/desktop/src/components/SplashMark.tsx`, line 4 at `ded4321b` (the comment that stays: "per-theme drawn-on-open splash: only connectors and stage outlines turn brass, never the letters; the glow's drop-shadow values are this file's own (the brief says only "a short glow")").

```ts
// SPLASH-SWEEP (Fable, Oct 16; docs/briefs/splash-brief.md + splash-build-kit.md
// carry Nick's own rulings and the reference material this file builds from).
//
// Replaces the old two-asset (cream/warm-ink) sketch with a drawn-on-open,
// per-theme animation: Arbor is Nick's hand-drawn sketch, cut into layers and
// swept brass from IDEAS to FINAL DRAFT; Flux is a vector schematic of the
// same five steps (IDEAS, TEXT, PAGE, FEEDBACK, FINAL DRAFT), swept the same
// way. Round 3 (Nick): only the CONNECTORS and the stage OUTLINES turn brass —
// never the letters/labels inside them. Round 4 (Nick): every mockup timing
// below is multiplied by 0.7 ("30% faster"), and the splash's hold floor is
// no longer a fixed 5s — it is this animation's own length (Splash.tsx reads
// that back via `onFloorReached`, replacing the old fixed-floor timer; the
// ready-gate, the 10s ceiling and pointer-events:none are untouched, owned by
// Splash.tsx still).
//
// WHAT THIS FILE DOES NOT FAITHFULLY REPRODUCE, and why: the mockup artifact
// ("Splash Sweep Mockup", round 4) is the canonical reference, but the build
// kit excerpts its script with some helper/setup code omitted (`$`, `mk`,
// `state`, `PHRASES`, the exact `glowOn`/`glowOff`/`glowRest` filter values,
// and `arEdges`'/`arIdeas`'s own DOM wiring). Everything the BRIEF states in
// words (which stage/connector lights when, the pop's own numbers, the
// reduced-motion end state) is built exactly as written; the one place this
// file supplies its own values is the brass GLOW's own drop-shadow
// parameters (the brief only says "a short glow" for IDEAS and FINAL DRAFT,
// TEXT/PAGE/FEEDBACK get a plain crossfade per the mockup script's own
// structure) — flagged here for a visual compare against the mockup once a
// box turn opens.
```

## SplashMark §2

From `apps/desktop/src/components/SplashMark.tsx`, line 32 at `ded4321b` (the comment that stays: "every mockup time below is multiplied by 0.7").

```ts
// Round 4 (Nick, live): "every time below is multiplied by 0.7"
```

## SplashMark §3

From `apps/desktop/src/components/SplashMark.tsx`, line 33 at `ded4321b` (no comment stays: the code reads plainly).

```ts
// Fable's own exact values (Oct 16), superseding this file's earlier guess.
```

## SplashMark §4

From `apps/desktop/src/components/SplashMark.tsx`, line 47 at `ded4321b` (the comment that stays: "Arbor: the hand-drawn sketch cut into base, outline and connector layers; their geometry is baked in, not fetched, so the critical render never waits on layout numbers").

```ts
// ============================================================================
// ARBOR — Nick's hand-drawn sketch, cut by splash-build-kit.md's own script
// (docs/briefs/splash-build-kit.md §1) into base + 5 outline layers + 6
// connector layers, committed under public/brand/splash-arbor/ (layers.json
// there is this asset pack's own record; the geometry below is that file's
// content, baked in rather than fetched, so the splash's critical render
// path never waits on an extra network round-trip for layout numbers that
// never change at runtime).
// ============================================================================
```

## SplashMark §5

From `apps/desktop/src/components/SplashMark.tsx`, line 59 at `ded4321b` (the comment that stays: "the sweep speed in the full-size paths' own px (the mockup's 0.2px/ms at 1350 wide); literal values, not re-derived from a ratio").

```ts
/** Fable's own exact scaling (Oct 16): the mockup's wave is 0.2px/ms in its
 *  own 1350-wide working space, which is 0.5px/ms against the full-size
 *  3374-wide paths these layers actually use; the last connector's own
 *  faster speed is 0.75 (was 0.3 in mockup space). Literal, not re-derived
 *  from a ratio — these are the authoritative values. */
```

## SplashMark §6

From `apps/desktop/src/components/SplashMark.tsx`, line 388 at `ded4321b` (the comment that stays: "Machina: the WRIZ[] wordmark, IDEAS and FINAL DRAFT, and one twenty-unit Run strip that fills and closes orange; no loading lines (the strip is the readout)").

```ts
// MACHINA - the approved mockup's splash (cursor/machina-v1-mockup @ 360f3db3): the WRIZ[] wordmark (28px, .14em, the orange outlined square), IDEAS and FINAL DRAFT as the two end labels, and
// ONE twenty-unit Run strip between them that fills left to right, then closes orange once. No loading lines (Fable's ruling 6: the strip IS the readout). The same unit count and the same
// closed-orange grammar as the in-app Run strip. Reduced motion: the closed strip at once, then the usual fade.
```
