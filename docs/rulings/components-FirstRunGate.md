# Rulings: `apps/desktop/src/components/FirstRunGate.tsx`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[FirstRunGate §n]` points here.

## FirstRunGate §1

From `apps/desktop/src/components/FirstRunGate.tsx`, line 4 at `ded4321b` (the comment that stays: "the veil and the gate are first-run only; the word count (useMonotonicWordCount, 100 whitespace-delimited words) is general and has other callers").

```ts
// HB1 S3 — the veil + the gate. Three small, composable pieces, wired
// together by PageEditorView on the ONE page a first-run Write click can
// produce (components/Arrival.tsx's `firstRunGate` one-shot navigation
// state — the same pattern useWarmStart already uses for its own one-shot
// signal). The instrument is the brief's own: 100 whitespace-delimited words,
// F1.
//
// CORRECTED 2026-08-26 (item 84, the deck phase). This header used to end
// "Nothing here is mode-specific or reusable beyond that page." That sentence
// was true when written — the veil and the gate had one caller — and it is no
// longer true of `useMonotonicWordCount`, which item 84's Free Write roster now
// imports for Nick's refill ruling ("It should reset after 100 words have been
// written"). Corrected rather than left standing, under the mirror law this
// house already applies to tutor-rules.md: a comment that lies about the code
// is a defect, and it is fixed in the SAME COMMIT as the change that falsified
// it. THE VEIL AND THE GATE REMAIN HB1's, and remain first-run-only; it is the
// word COUNT that turned out to be general — which is the honest shape of it,
// since Nick's hundred and F1's hundred are the same hundred, and a second
// reading of the same number would have been the real defect.
```
