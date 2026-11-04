# Rulings: `apps/desktop/src/decks/types.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[types §n]` points here.

## types §1

From `apps/desktop/src/decks/types.ts`, line 3 at `4d6af3d9` (the comment that stays: "The deck engine's shape. A Card Deck is a preset: an optional wizard that narrows choices, then deals a pre-built set of cards onto a board. This file is the ENTIRE static-data contract a deck definition satisfies; the engine (DeckWizard.tsx + engine.ts) is deck-agnostic: it renders what a definition declares and calls its own `deal`. Zero schema: a DeckDefinition is a plain static in-memory object, never persisted, never user data, shipped with the app like KIND_META/PICKER_GROUPS (store/kindLabels.ts); nothing here is a database row or a new Box field. Lexicon discipline: every string a definition names is a DeskTermId (a lexicon KEY), never a raw string, resolved through deskTerm() at deal time (engine.ts), the non-hook escape hatch persistence.ts's SYSTEM_BOARD_TITLE_TERM and kindLabels.ts already use.").

```ts
// B3 S1 — the deck engine's own shape. A "Card Deck" (Nick's coinage, the
// catalog's own item 36) is a preset: an optional wizard that narrows
// choices, then deals a pre-built set of cards onto a board. This file is
// the ENTIRE static-data contract every deck definition must satisfy — the
// engine (DeckWizard.tsx + engine.ts) is completely deck-agnostic: it
// renders whatever a definition declares and calls the definition's own
// `deal` function, nothing more.
//
// Zero schema (the catalog's own Law 4, this ticket's constitution): a
// DeckDefinition is a plain, static, in-memory TypeScript object — never
// persisted, never user data, shipped with the app like KIND_META/
// PICKER_GROUPS (store/kindLabels.ts) already are. Nothing in this file (or
// anything it produces) is a database row or a new Box field.
//
// Lexicon discipline (S2's own law) — every string a deck definition names
// is a DeskTermId (a lexicon KEY), never a raw string: deck names, wizard
// prompts/options, and every dealt card's title/body all resolve through
// deskTerm() at deal time (engine.ts), the SAME non-hook escape hatch
// persistence.ts's own SYSTEM_BOARD_TITLE_TERM and kindLabels.ts already
// use for exactly this "compose copy outside a component" situation.
```
