# Rulings: `apps/desktop/src/pages/Desk.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[Desk §n]` points here.

## Desk §1

From `apps/desktop/src/pages/Desk.tsx`, line 12 at `4d6af3d9` (the comment that stays: "The Desk, the authed home: unreachable now (Arrival is route '/', and nothing imports this file), kept intact rather than deleted; its resume-pointer logic also lives in Arrival's Open door").

```ts
// PARKED — HB1, 2026-07-16 (docs/wrizo-alpha/hb1-threshold-brief.md, flow
// §6: "The Desk room dies... Route / no longer renders it anywhere.").
// App.tsx no longer imports this component; components/Arrival.tsx is
// route '/' now. Park, don't delete (house law) — kept intact, unreachable
// from any UI. ReturnCard's resume-pointer logic is NOT orphaned: S5 rehomed
// it into Arrival's Open door (getResumeTarget/warmStart, same as here).
// Begin Project / Start writing rehomed onto Arrival's own doors + the
// Drawer's Places faces (already the AB3-era interim home for the recents/
// Shelf glance — DrawersTree below was already redundant with it before
// this ticket). CUSTOMIZE_TIP's premise (themes "unlock at writing
// milestones") is superseded by HB1's actual mechanic (the one-time 100-
// word threshold, not a recurring milestone) — left as-is, parked with the
// rest of this file, not rewritten for a component that no longer renders.
//
// Original header comment, preserved below for context:
// The Desk — the authed home (B4). Answers one question (what now?): a single
// primary action, a quiet glance at recent drawers + On the Shelf below, and the
// create entry. The left rail owns navigation, so the home no longer duplicates
// it. The logo is a single app-wide element (App.BrandMark), full opacity here.
//
// F2 — when there's recent work, the primary block becomes the RETURN CARD: a
// mirror of the writer's own last sentence, rendered only from the typed resume
// pointer (F1). No target → the plain "Start something" primary, unchanged.
```

## Desk §2

From `apps/desktop/src/pages/Desk.tsx`, line 64 at `4d6af3d9` (the comment that stays: "no Catch here: doCatch stays wired, though nothing on this surface calls it").

```ts
          {/* PARKED — cd1.1 (Fable review, 2026-07-16): Nick's "Done alone"
              word was unqualified — it scraps Catch here too, not just
              DeskRail's copy. doCatch stays wired (house law: parked, not
              deleted) though nothing on this surface calls it now. */}
```

## Desk §3

From `apps/desktop/src/pages/Desk.tsx`, line 69 at `4d6af3d9` (the comment that stays: "the copy is left as it was: this file is unreachable, so its words are not swapped").

```ts
          {/* B2.1 S6 — left as "Begin project" verbatim, deliberately not
              swapped: this whole component is PARKED (HB1, see this file's
              header comment above) and genuinely unreachable — App.tsx no
              longer imports Desk.tsx at all (confirmed via grep, no route,
              no other import site). Re-verified true as of this fold.
              Swapping cosmetic copy on dead code adds no writer-facing
              value and only risks reviving a false signal that this file
              is still live; the word already retired from every reachable
              surface via CreateProject.tsx's own eyebrow. */}
```
