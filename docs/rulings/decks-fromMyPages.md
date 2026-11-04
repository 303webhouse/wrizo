# Rulings: `apps/desktop/src/decks/library/fromMyPages.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[fromMyPages §n]` points here.

## fromMyPages §1

From `apps/desktop/src/decks/library/fromMyPages.ts`, line 3 at `4d6af3d9` (the comment that stays: "a card's title carries no font marks").

```ts
// POLISH #10 item 4
```

## fromMyPages §2

From `apps/desktop/src/decks/library/fromMyPages.ts`, line 8 at `4d6af3d9` (the comment that stays: "FROM MY PAGES, the reverse outline: look at what you already wrote and name what each part is doing. The writer PICKS pages, in their order (the wizard's `kind: 'pages'` question, components/DeckWizard.tsx); the deck deals ONE CARD PER PAGE, in that order, each titled with its page's title (or first words) and GRAFTED to that page (`graftTo`; the caller grafts it through the board, decks/engine.ts MaterializedDeal.grafts). It only shows: nothing here writes, reorders or moves a page (the only store import is a READ, getJournalEntry), and a card's graft is the ordinary Grafts record a writer could make by hand. The card's body is empty, its question "What does this part do for the whole?"; the Gaps readout is not a card and is not dealt. Answers: `pages` = the chosen entry ids joined by ',' (in the order picked); a deal with none deals nothing, and the wizard never offers it.").

```ts
// W3 (Wrizors' game plan, wave 1; content decks/content.ts, from w3-deck-content.md section 2.7) - FROM MY PAGES, the reverse outline: look at what you already wrote and name what each part is doing.
// The writer PICKS pages, in their order (the wizard's own page step - a `kind: 'pages'` question, components/DeckWizard.tsx); the deck deals ONE CARD PER PAGE, in that order, each card titled
// with its page's title (or first words) and GRAFTED to that page (the card carries `graftTo`; the caller grafts it through the board - decks/engine.ts MaterializedDeal.grafts).
//
// IT SHOWS ONLY (Nick, Oct 23): nothing here writes a page, reorders a page or moves one - this file imports no store function but a READ (getJournalEntry), and a card's graft is the ordinary
// Grafts record the writer could make by hand. The card's body is empty and its question is "What does this part do for the whole?"; the "gaps" row of the doc (the Gaps readout, local) is
// W5's, not a card, and is not dealt.
//
// Answers: `pages` = the chosen entry ids joined by ',' (in the order picked). A deal with none deals nothing - the wizard never offers it.
```
