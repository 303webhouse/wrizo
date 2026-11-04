# Rulings: `apps/desktop/src/decks/engine.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[engine §n]` points here.

## engine §1

From `apps/desktop/src/decks/engine.ts`, line 5 at `4d6af3d9` (the comment that stays: "The deck engine's pure heart: turns a deck's declared card set (DealtCardSpec[], local `key`s only) into a real Box[] (generated ids, real 'connection' threads) without touching persistence. Zero schema: a dealt card has the same shape as a hand-typed "Add card" box and owes its template nothing, except that a guided step (a Tier 1 deck's dealt card) carries ONE pointer, `deckStep: { deck, step }`, and its question as `prompt`, both optional, written only here on a NEW deal. `spec.title`/`spec.body` arrive already resolved through deskTerm() (see decks/types.ts's DealtCardSpec). Threads dedupe either direction (as BoardEditor's finishThreadDrag does), so two cards naming each other mint ONE connection. Callers own the one mutation, always the ordinary boxes-array path (saveBoardBoxes for a new board; plain setBoxes on the Board, riding its debounced autosave, since a separate saveBoardBoxes there would race the unflushed in-memory boxes).").

```ts
// B3 S1 — the deck engine's own pure heart: turns a deck definition's
// declared card set (DealtCardSpec[], local `key`s only) into a real Box[]
// (real generateId()'d ids, real 'connection' threads), WITHOUT touching
// persistence at all. Zero schema, by construction: a dealt card is exactly
// `{ id, kind:'text', x, y, w, h, z, text }` — the SAME shape any hand-typed
// "Add card" box already has (BoardEditor.tsx's own onAddCard) — and owes
// NOTHING to its template afterward: no deckId, no definition id, no back-
// reference of any kind, on the card OR the thread. (W3 AMENDMENT, Nick Oct 23: a GUIDED step - a Tier 1 deck's dealt card - carries ONE pointer, `deckStep: { deck, step }`,
// plus its question as `prompt`; both optional and additive inside `boxes`, written only here, only on a NEW deal. Nothing else about the deck follows the card, and every card
// dealt before W3 is untouched.) `spec.title`/`spec.body`
// arrive here ALREADY resolved (each deck's own deal() function builds them
// by calling deskTerm() itself — the established non-hook lexicon escape
// hatch persistence.ts's own SYSTEM_BOARD_TITLE_TERM already uses — see
// decks/types.ts's own DealtCardSpec comment for why this lives at the deck
// layer, not here) so every dealt card's own words still route through the
// SAME lexicon seam as any other chrome copy, even a composed one.
//
// Threads dedupe either direction (the SAME rule BoardEditor.tsx's own
// finishThreadDrag already applies to a hand-drawn thread) so two cards
// naming each other in `threadTo` mint exactly ONE connection, not two.
//
// This function is pure and does not persist — callers own the ONE actual
// mutation, and it is always the SAME boxes-array path any other card
// creation already uses (saveBoardBoxes for a brand-new board in
// CreateProject.tsx's own door; plain setBoxes, riding BoardEditor's own
// existing debounced autosave, for the Board's own "From a deck…" door —
// see that file's own onAddFromDeck for why: appending via a SEPARATE
// direct saveBoardBoxes call there would race BoardEditor's own in-memory,
// not-yet-flushed `boxes` state, the exact class of seed/flush race this
// project's own standing harness discipline warns against).
```
