# Rulings: `apps/desktop/src/store/deckRewards.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[deckRewards §n]` points here.

## deckRewards §1

From `apps/desktop/src/store/deckRewards.ts`, line 7 at `f079d49e` (the comment that stays: "gaps and the three reward moments: the pure decisions and the one device-local memory; everything computed from kindled(); names never a count, once per step and per Deck, nothing speaks first").

```ts
// W5 - GAPS AND THE THREE REWARD MOMENTS (brief Downloads\w5-gaps-rewards-brief.md; Nick's rulings Oct 26). The PURE decisions and the ONE device-local memory live here; components/DeckGaps.tsx draws the line,
// components/useDeckRewards.ts times the moments, and the stylesheet's W5 zone dresses them. Everything is computed from `kindled()` (store/guided.ts) - the single gate - which this file is handed, never re-derives.
//
// THE GUARDRAILS (binding; harness guided-w5 pins them): names, never a count; a moment happens ONCE per step and per Deck, identical every time; rewards only for the writer's words or a graft to a page, never for
// a click or a view; nothing speaks first (no toast, no reminder, no idle nudge); a writer who never opens a Deck sees nothing new. Lit (the writer's own mark) never celebrates and never counts.
```
