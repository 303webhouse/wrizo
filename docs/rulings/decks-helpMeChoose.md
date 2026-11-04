# Rulings: `apps/desktop/src/decks/helpMeChoose.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[helpMeChoose §n]` points here.

## helpMeChoose §1

From `apps/desktop/src/decks/helpMeChoose.ts`, line 1 at `4d6af3d9` (the comment that stays: ""Help me choose" (the librarian / RUN DIAGNOSTIC / Intake / Scout), the logic only: three questions, the pick table, Q3's landing. Pure data and functions, no React, storage, randomness or model: the same answers give the same result in every theme (the questions are deck content, not chrome). Nothing is stored, and nothing here opens a panel (components/HelpMeChoose.tsx opens only on a press). The census harness (scripts/harness/help-choose-census.mjs) checks this module row by row against an independent transcription of the table and against the deck registry. A CHOICE is a deck plus the deck's own deal answers when the table names one; {} means the deck asks its own question when dealt. "Fifteen Beats (Feature, with the Pilot note)" is the deck's own pilot option.").

```ts
// W4 - "HELP ME CHOOSE": the librarian / RUN DIAGNOSTIC / Intake / Scout. THE LOGIC ONLY: three questions, the pick table, Q3's landing. Pure data and functions - no React, no storage, no randomness,
// no model: the same answers give the same result, every time, in every theme (the dress differs, never the questions - the questions are deck content, not chrome). Nothing here is stored, and nothing
// here opens a panel: the panel (components/HelpMeChoose.tsx) opens only on a press.
//
// SOURCE: Downloads\w3-deck-content.md §3 (the three questions, Q2's answers by Q1, the pick table, Q3's behaviour; Fable's rulings of Oct 23-24 at its top). The census harness
// (scripts/harness/help-choose-census.mjs) holds an INDEPENDENT transcription of that table and checks this module against it row by row, and against W3's real deck registry.
//
// A CHOICE is a deck (DeckDefinition.id, decks/library) plus the deck's OWN deal answers (questionId -> option id) when the table names one; {} means the deck asks its own question when dealt
// (H1, ruled: "a novel or novella" deals Three-Act with no answers - the deck asks Novel vs Novella itself). "Fifteen Beats (Feature, with the Pilot note)" is the deck's own pilot option.
```

## helpMeChoose §2

From `apps/desktop/src/decks/helpMeChoose.ts`, line 98 at `4d6af3d9` (the comment that stays: "Q3's landing. A little: the pick deals and opens in the Walk with the first step's "?" already open. The shape: the Walk, "?" closed. Everything: Open (the table), all cards at once, no Walk. With the Walk not shipped (the switch false), all three open as Open. Nothing is stored.").

```ts
/** Q3's landing (Fable's ruling, Oct 23). A little: the pick deals and opens in the Walk with the first step's "?" already open (the writer asked to be shown). The shape: the Walk, "?" closed. Everything:
 *  Open (the table), all cards at once, no Walk. With the Walk not shipped (the switch false), all three would open as Open. Nothing is stored. */
```
