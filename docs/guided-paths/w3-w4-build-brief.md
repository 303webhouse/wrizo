# W3 + W11a + W4 + lexicon: build brief (Fable → INK, Oct 23, 2026)

**What:** the first wave of guided paths (the Wrizors' game plan, wave 1).
- Every deck's step becomes a QUESTION shown as a placeholder.
- Every step gets a "?" explaining itself.
- New Tier 1 decks.
- "Help me choose" at the top of Presets.

Nick ruled all of it today; the frames are `cursor/board-kinds-mockup` @ b8f4b8fb (frames 02, 06, 07, 08, 09). **No board-view work here:** the Walk and "Show as" are W1, briefed separately.

## Timing
- Branch `guided-w3` from main AFTER deploy #5 merges (deskLexicon overlaps flux-inputs).
- Plan + red-first harness can start now.
- The step CONTENT (questions, "?" explanations, examples, new decks) comes from the Wrizors as `Downloads\w3-deck-content.md`. Build the mechanics first; load the content when it lands.

## 1. Questions as placeholders (W3)
- `DeckDefinition` steps gain lexicon keys: `questionTerm`, `explainTerm`, `exampleTerm` (the existing deskTerm discipline).
- **A dealt card's BODY IS EMPTY.** The card carries:
  - `prompt` (the resolved question at deal time);
  - `deckStep: { deck, step }`.
- Both are **optional additive box fields** (the fontFace/seq precedent: no column, no schema change; ledger the note). This replaces "the deck forgets itself" for NEW deals only; existing dealt cards are untouched.
- **Rendering:** an empty body with a `prompt` shows it as a placeholder:
  - Arbor: olive italic;
  - Flux: the dim readout prompt line `> … ▮`;
  - other themes: their muted text.
- The first keystroke hides it.
- **The placeholder is never body text:** never exported, copied, counted, synced as body, or read by the Tutor as the writer's words.
- **Coverage helper (no UI yet):** `kindled(card)` = the body has the writer's text OR the card has a graft to a page. W1/W5 will use it.

## 2. The "?" on a step (W11a)
- A dealt card with `deckStep` shows a small "?" at its title's end.
- The popover is ANCHORED at the "?" (frame 06): one plain sentence + one italic example + "more → Tutor".
  - "more" STAGES an ask in the Tutor composer ("What does <step> do?"); nothing is sent until the writer sends.
- Local content, shipped with the app, not stored on the card. Esc closes it; focus returns.
- Words: Arbor "?" / "more"; Flux "[?]" / "MORE" → Operator.

## 3. New Tier 1 decks (W3, data + lexicon)
- Hero's Journey · Story Circle (from the hidden framework JSON) · Scene–Sequel · Fifteen Beats with a "Novel" answer on Feature Screenplay · Argumentative Essay · Research Paper (IMRaD) · Business Proposal · From my pages.
- "From my pages" deals one card per chosen page IN ORDER, each grafted to its page. It **shows only** and never reorders pages (Nick).
- The live seven decks get questions/explanations/examples too. **One Three-Act** (the live nine; item 165's five-card version is retired).

## 4. Help me choose (W4)
- One row at the top of Presets:
  - Arbor: "Ask the librarian";
  - Flux: "RUN DIAGNOSTIC";
  - Machina, Nomad and Volant get a plain fallback until their builds.
- **Three questions:** What are you making? / What carries it? / How much do you want to know before you start? (Flux words per frame 09.)
- A **local, deterministic mapping** gives a pick + one alternative; each is one press from dealing.
- "Browse the shelves" / "BROWSE ALL STACKS". Nothing is stored. It never opens itself; Esc closes it.
- **Dress:** frame 08 (the wooden catalog drawer, index cards, the brass-stamped result card) and frame 09 (the terminal panel, the lime line filling a third per answer, [LOAD]).
- Reduced motion = no slide.

## 5. Lexicon pass (strings only, fast lane)
- **Arbor:** Show as · Walk · Write this · Place a page… · Ask the librarian · Nothing yet · Lit · Library.
- **Flux:** Stack · Render · Trace · Playback · Index · Boot doc · Input doc… · RUN DIAGNOSTIC · NO SIGNAL · LOCKED · Manuals · LOAD STACK · FICTION // STACKS · BOOT.
- Fix the empty board's starter row: "Templates" → **Presets** (Nick, B1: Presets = decks, Templates = page dress).
- Hide any string a feature doesn't render yet (absent, not greyed).

## Checks (red first; mutants that land and redden)
- A dealt card's body is empty and its prompt shows as a placeholder.
- The placeholder is absent from export, copy, the word count and the Tutor's page text.
- The first keystroke hides it.
- Census: every step of every Tier 1 deck has a question, an explanation and an example.
- The "?" popover is anchored, has focus handling, and its Esc returns focus.
- "more" stages without sending.
- The recommender is deterministic (a table of all answer combinations → a pick).
- No "Templates" string on the board starter.
- Grep each changed identifier and state the count; park any check that reads the old dealt body, verbatim with a successor.
- **Lane:** fast lane (board/card rendering and deck data; no PageEditor, no save/sync format change beyond the optional box fields). If you find yourself in PageEditor or persistence, STOP and tell me.
- **Screens for my clear:** a dealt Three-Act in Arbor and Flux (dark + light), the "?" open, the librarian (both states), RUN DIAGNOSTIC (both states).
