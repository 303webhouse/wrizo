# Rulings: `apps/desktop/src/components/useChromeDissolve.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[useChromeDissolve §n]` points here.

## useChromeDissolve §1

From `apps/desktop/src/components/useChromeDissolve.ts`, line 45 at `e2898deb` (the comment that stays: "a dissolved surface is pointer-events:none and cannot be hovered, so the engine tests the pointer against every dissolving surface's rect; an element with data-open="false" is closed whatever its opacity").

```ts
// FX10 S3 — the vanishing law's other half, restored. Root-caused live
// (a runtime-verify.mjs probe, not guessed): a dissolved surface always
// carries `pointer-events:none` (both the `.chrome-fade`/`data-chrome-
// receded` and `.desk-dissolve`/`data-writing` rules set it, index.css),
// so it can never fire its OWN hover/pointerenter — the browser's hit-test
// skips it entirely, and any click/move lands on whatever is genuinely
// underneath. The pre-FX10 `onMove` below only ever treated "at a viewport
// EDGE" as a summon signal; a dissolved-but-open menu sitting well inland
// (confirmed live: the sliver panel measures ~132-316px from the left edge
// at 1280px, nowhere near EDGE_PX=56) could be hovered indefinitely and
// never resurface — exactly Nick's own finding ("I had to click to get it
// back"). Fixed at the SOURCE, in the one shared engine every dissolved
// surface already reads `dissolved`/`--fade-dur` from, rather than in any
// one consumer: a window-level pointer-coordinate check (the SAME
// technique the edge check already uses, for the SAME reason — a
// pointer-events:none element cannot be hit-tested, but its own
// getBoundingClientRect() is untouched by pointer-events, so testing
// coordinates against it works regardless) against every currently-
// dissolving chrome surface's own rect. `.chrome-fade, .desk-dissolve` is
// every class family a dissolving surface can carry app-wide (App.tsx's
// header, DeskRail, the strip, the sliver/tutor panels, the corkboard,
// every sprint-nav/chrome-top bar) — one sweep covers all of them, so
// every dissolved surface inherits this fix automatically; nothing here is
// specific to the sliver. A collapsed (0×0) or off-screen element can never
// match (an empty rect contains no point), so a genuinely CLOSED surface —
// as opposed to a dissolved-but-structurally-open one — is never mistaken
// for a reachable menu. Queried fresh on every qualifying move rather than
// cached: this only runs while `dissolvedRef.current` is already true (see
// the early return below), a comparatively rare state, and the set of
// dissolving surfaces on screen varies by route/mount.
//
// TWO real defects found live (fx5.mjs's own S8 "genuine departure" check,
// re-run in full-suite context, not guessed — a zero-size check ALONE is
// not enough):
//
// (1) `.wz-sliver-panel` carries `chrome-fade desk-dissolve`
// UNCONDITIONALLY — its own width is a static `calc(100% - 16px)` whether
// the sliver is open or closed (Sliver.tsx's own header comment), so a
// genuinely CLOSED sliver still has a real, nonzero rect sitting in the
// margin, and the width/height check alone let that closed rect count as
// "reachable chrome."
//
// (2) A first fix (requiring nonzero opacity) was ALSO insufficient,
// confirmed by re-running the same check against it: `.wz-sliver-panel`'s
// own "closed" rule (`opacity:0`, ONE class, specificity 0,0,1,0) LOSES the
// cascade to the ambient `.desk-frame[data-writing='true'] .desk-dissolve`
// rule (TWO classes + an attribute, specificity 0,0,3,0) the instant the
// ROOM itself is also dissolving — so a genuinely CLOSED sliver, while the
// room dissolves, settles at the SAME small nonzero opacity (~0.04-0.08,
// --fade-min) a genuinely OPEN-but-faded one does. Opacity alone cannot
// tell the two apart in that state. The only signal that actually
// distinguishes "closed" from "open" is the component's own LOCAL toggle:
// `data-open` (Sliver.tsx/Tutor.tsx both set it). An element with
// `data-open="false"` is genuinely closed regardless of its computed
// opacity; an element with no `data-open` attribute at all (the strip, the
// header, every sprint-nav bar — surfaces with no local open/closed
// concept, only the ambient dissolve) has nothing to disqualify it.
```

## useChromeDissolve §2

From `apps/desktop/src/components/useChromeDissolve.ts`, line 176 at `e2898deb` (the comment that stays: "turning Fade off mid-dissolve resurfaces the chrome at once, not at the next trigger").

```ts
  // Fable's A1 (TH1 review, folded in TH2) — noteWrite's Fade:off guard only
  // stops FUTURE dissolves; flipping the pref mid-dissolve (chrome already
  // faded) left it faded until the next natural resurface trigger. Fade:off
  // means "chrome is never hidden," so the transition itself must resurface
  // immediately, not just gate the next keystroke.
```

## useChromeDissolve §3

From `apps/desktop/src/components/useChromeDissolve.ts`, line 261 at `e2898deb` (the comment that stays: "keyboard focus outside the text restores the chrome, as a pointer reaching it does").

```ts
    // POLISH #10 item 23 (Nick, Oct 25): keyboard focus restores the chrome - focus landing on anything outside the text (a rail item, a mode tab, a
    // drawer's tab, the "...") brings it back, as a pointer reaching it does. (Before, a Tab onto dissolved chrome left it invisible.)
```
