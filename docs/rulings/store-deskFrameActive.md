# Rulings: `apps/desktop/src/store/deskFrameActive.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deskFrameActive §n]` points here.

## deskFrameActive §1

From `apps/desktop/src/store/deskFrameActive.ts`, line 20 at `7f1c6a84` (the comment that stays: "useSyncExternalStore, not useState+useEffect: a writer mounting in the same commit as a consumer must not fire into an empty listener set").

```ts
// J6 S1 (item 47's fix) — this used to be a hand-rolled useState+useEffect
// subscription (`useState(active)` seeded once, corrected only by a later
// notification the mount effect below fires). That has exactly the missed-
// notification race useSyncExternalStore exists to close: when the WHOLE
// app's first-ever commit already lands on a framed route (a hard reload —
// or this harness's own `app.reload()` — while location.hash already points
// at a `/page/:id` or `/journal/:id`), DeskFrame's own mount effect and this
// hook's OWN subscribing effect are BOTH new-mount passive effects in that
// SAME commit. React fires passive mount effects bottom-up (children before
// ancestors), so DeskFrame (several levels down) can call
// `setDeskFrameMounted(true)` BEFORE App.tsx's AppMain/GlobalHeader or
// DeskRail.tsx (shallow ancestors, mounted once at the router's own top
// level) have registered their own listener — the notification fires into
// an empty (for them) `listeners` Set and is lost. The module-level `active`
// flag itself ends up correct (true); only those THREE callers' own derived
// React state does not, and — because `setDeskFrameMounted` only notifies on
// an actual value CHANGE — nothing corrects it until the NEXT genuine flip
// (the first time that same DeskFrame instance unmounts), which can be an
// entire writing session away if the writer never leaves a framed route.
// Reproduced and proven fixed via a bare App.tsx/DeskFrame.tsx-only repro
// (see scripts/harness/j6.mjs's own S1 section): a fresh reload landing
// directly on a framed `/page/:id` read `data-desk-frame-active="false"`
// (paper rect shifted ~32px by the still-reserved 64px gutter) even though
// DeskFrame was genuinely mounted; an in-app-only revisit of the same route
// read correctly, because by then every subscriber had long since
// registered. `useSyncExternalStore` is the React 18 primitive built
// exactly for this class of bug: it reads `getSnapshot()` SYNCHRONOUSLY on
// every render (not just a `useState` initial value frozen at first mount)
// and React itself re-checks the snapshot after commit, forcing a re-render
// if it changed underneath — so a consumer can never end up serving a stale
// value regardless of effect-ordering or which route it mounts under. This
// is "recomputed/synced on route change" at its most literal: it is synced
// on EVERY render, route change included, not merely re-derived from a
// one-shot subscription.
```
