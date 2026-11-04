# Rulings: `apps/desktop/src/decks/content.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[content §n]` points here.

## content §1

From `apps/desktop/src/decks/content.ts`, line 1 at `4d6af3d9` (the comment that stays: "The guided-path CONTENT: for every step of every Tier 1 deck, the QUESTION a dealt card carries as its placeholder (q), the one plain "?" sentence (e) and one example (x), parsed by a script from the deck-content doc (md5 347e3efc057eece588c27dc28d1d5c3a), never retyped. A sibling file, not deskLexicon's CANONICAL: this is deck content, not chrome, so no theme overrides it and the sentences stay out of the lexicon census. Every word lives in this one file, reached only through stepQuestion / stepExplain / stepExample. Where a question varies by the deal's own answer, `q` is a record keyed by the answer's option id. Examples are for the "?" only: never on a card, and never sent with a Tutor ask unless the writer opened that entry.").

```ts
// W3 / W11a - the guided-path CONTENT: for every step of every Tier 1 deck, the QUESTION a dealt card carries as its placeholder (q), the one plain "?" sentence (e) and one example (x).
// Source: Fable's copy of the Wrizors' w3-deck-content.md (md5 347e3efc057eece588c27dc28d1d5c3a), parsed by a script - never retyped, so a stray character cannot drift from the doc. 112 steps.
//
// WHY A SIBLING FILE, NOT deskLexicon.ts's CANONICAL (the brief's "questionTerm / explainTerm / exampleTerm - the existing deskTerm discipline"): this is DECK CONTENT, not chrome. The doc's own
// rule 3: "the other themes' lexicons translate only the chrome, not the questions (the questions are deck content)" - so there is no per-theme override, and ~375 sentences stay out of
// the lexicon census (flux-v2's LX2 reads every CANONICAL key through Flux's forbidden-noun list; story-craft prose says "page one"). The discipline kept: every word lives in exactly ONE
// place (this file), reached only through stepQuestion / stepExplain / stepExample below - no deck file, component or harness hard-codes a sentence. Where a question varies by the deal's own
// answer (Worldbuilding's Rules, Grant's Alignment, Feature Story's Nut Graf, Fifteen Beats' step 8) `q` is a record keyed by the answer's option id; the "?" sentence and example are shared.
// Examples are content for the "?" and never appear on a card; they never travel with a Tutor ask unless the writer opened that entry (doc, rule 5).
```
