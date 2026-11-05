# Rulings: `apps/desktop/src/store/tabChord.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[tabChord §n]` points here.

## tabChord §1

From `apps/desktop/src/store/tabChord.ts`, line 1 at `e2898deb` (the comment that stays: "the Tab key as a state machine: Tab is not a modifier, so Tab+1 is a chord only after Tab has been HELD CHORD_HOLD_MS; under it, a pending Tab applies first and the 1 types").

```ts
// WRITING-SURFACE S0 STEP 3 - THE TAB KEY, AS A STATE MACHINE (Nick, 2026-09-25: "TAB + 1 indents the whole paragraph. All Tab
// keystrokes should keep indenting the text further, too, even if it has already been indented once.").
//
//   Tab            one first-line level (a leading tab), as many presses as the writer likes: 1, 2, 3 levels.
//   Shift+Tab      one first-line level back.
//   Tab HELD + 1   one whole-paragraph (block) level per press of the 1.
//   Shift+Tab HELD + 1   one block level back.
//
// TAB IS NOT A MODIFIER, so this cannot be the usual chord test. A writer typing a numbered list taps Tab and then 1 with the two
// keys overlapping for a few tens of milliseconds ("rollover"); that must be a tab followed by a typed 1, never a block indent
// that eats the 1. So a chord counts only when Tab has been HELD for CHORD_HOLD_MS before the 1 goes down. Under the threshold the
// pending Tab is applied FIRST and the 1 is left to type.
//
// THE THRESHOLD IS 200 ms: a deliberate hold is a decision a writer makes (well over 200 ms), and overlap between two consecutive
// keystrokes of one touch-typed sequence is a small fraction of that. It is a named constant so the number in the harness, the doc
// and the code are the same number; the harness measures both sides of it (a 60 ms rollover types the 1, a 400 ms hold chords).
//
// A Tab is applied when it is RELEASED (or the moment any other key proves it was a tap), not when it goes down - because at the
// moment it goes down nobody knows yet whether a 1 is coming. A tap is well under 100 ms, so the indent lands before the writer
// could notice. Auto-repeat (a held Tab sending keydown after keydown) is swallowed: one press, one level.
//
// PURE, so it can be proved without a browser: events in, {preventDefault, acts} out. The host performs the acts.
```
