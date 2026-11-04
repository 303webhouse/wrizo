# Rulings: `apps/desktop/src/store/themeCast.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[themeCast §n]` points here.

## themeCast §1

From `apps/desktop/src/store/themeCast.ts`, line 4 at `f079d49e` (the comment that stays: "Machina's cast (cool or neutral) in its own file: themePrefs holds the cross-theme three; the stored value survives a theme switch but is read only under Machina").

```ts
// MACHINA'S CAST (docs/theme-foundations/machina/machina-foundations.md §3/§11; docs/plans/machina-build.md §2) - a second, theme-scoped preference
// dimension: COOL (the default: steel active lines, sparks off) or NEUTRAL (orange active lines, sparks on). It is Machina's alone.
//
// WHY A FILE OF ITS OWN (the plan's open question, decided at build time per Fable's ruling "prefer extending themePrefs.ts if it already holds
// theme-scoped prefs"): themePrefs.ts holds the three CROSS-theme prefs (Voice / Page / Fade - canon §11), every one meaningful on every theme. CAST
// is meaningful on exactly one, so it does not belong in that matrix; keeping it here is what lets the matrix stay "the same three on every theme".
//
// THE LEAK LAW (the shape typewriter-scope just fixed for a different preference): the STORED value survives a theme switch (switch to Arbor and back
// and the writer's CAST is still there - canon §11's lossless round-trip), but it is only ever READ or REFLECTED under Machina. `getCast()` answers the
// fixed default 'cool' under any other theme, and `data-cast` is on <html> ONLY while the theme is Machina - a stale 'neutral' can never colour, or
// even appear on, Arbor or Flux.
//
// Zero schema: a local preference, localStorage only (foundations §13.5). Nothing here reaches sync.
```
