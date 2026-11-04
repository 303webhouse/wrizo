# Rulings: `apps/desktop/src/store/hiddenMarks.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[hiddenMarks §n]` points here.

## hiddenMarks §1

From `apps/desktop/src/store/hiddenMarks.ts`, line 68 at `f079d49e` (the comment that stays: "typed text with every character the reader could read as markup escaped: `\` `*` `_` `~` anywhere, `#` `-` `>` only where a line's text begins").

```ts
/** TYPED-LITERAL (Nick's ruling, Oct 16; docs/typed-literal-plan.md): `ins`, text the writer TYPED or PASTED at `at` in `text`, with every
 *  character the reader could read as markup escaped (`\\*`), so typed formatting characters are literal and never become markup.
 *  `\\` `*` `_` `~` anywhere; `#` `-` `>` only where a line's TEXT begins (after nothing but its structure tokens) - a heading, bullet or
 *  quote token can only form there, so a mid-line hyphen stays bare. (`[` joins the first set when font-span's spans are on this branch.) */
```

## hiddenMarks §2

From `apps/desktop/src/store/hiddenMarks.ts`, line 106 at `f079d49e` (the comment that stays: "a CLICK keeps the side of a word's closing marks it landed on (inside or just after them, the caret goes to the group's end); every other position takes snapCaret, and the keyboard is unchanged").

```ts
/** NICK'S LIVE BUG (2026-10-06): a click in the space right of a line that ENDS in a styled word landed just after that word's hidden
 *  closing marks, and `snapCaret` (the keyboard rule: sit after the nearest VISIBLE character) pulled it back inside the run - so the
 *  strip lit B and the next letter typed bold, though the writer had clicked past the word. A CLICK keeps the side of the closing
 *  marks it landed on: inside or just after a group of closing marks, the caret goes to the group's END. Every other position takes
 *  `snapCaret` as before; the keyboard is unchanged. (An empty pair's interior is not a closing group: a press made it to be typed into.) */
```

## hiddenMarks §3

From `apps/desktop/src/store/hiddenMarks.ts`, line 348 at `f079d49e` (the comment that stays: "Ctrl+Backspace: a word is a run of non-space characters, walking over hidden marks, never past the line's hidden lead; removal goes through replaceRange, which keeps a mark whose partner survives").

```ts
/** CTRL+BACKSPACE (item 211, owner's queue). The browser's own word deletion treats a hidden `**` as punctuation - a word boundary -
 *  so a native word delete could stop at an invisible boundary or take part of a pair. Here a word is a run of non-space characters
 *  on the line, walked back over the spaces before the caret and then the word (hidden marks are stepped over; given the reader's
 *  flanking rule, a mark never touches a space on its inner side, so this matches what the writer sees), and never past the line's
 *  hidden lead. What makes it safe is the REMOVAL: through replaceRange, which keeps a mark whose partner survives and removes a pair
 *  left empty. With nothing visible before the caret on its line, it is a plain Backspace (joining lines, or removing the token). */
```

## hiddenMarks §4

From `apps/desktop/src/store/hiddenMarks.ts`, line 450 at `f079d49e` (the comment that stays: "every rule reads LINES, so each runs on a window of whole lines (the edit's lines plus one on each side) and is spliced back; lines outside come back byte-identical; a short text skips the window").

```ts
// ---- THE WINDOW (typing-latency, 2026-10-13) --------------------------------------------------------------------------------------
// Every rule above reads LINES: readLead and readMarks take one line, lineAt bounds itself at the '\n's around a position, and no run
// can cross a newline (Enter closes a run before it and reopens it after). allRuns and repair walk the whole text only because they
// were handed the whole text - and that walk, on every keystroke, was the 211 rules' share of a 50k-word page's keystroke (81 ms).
// So each rule runs on a WINDOW of whole lines: the lines the edit touches, plus one whole line on each side (Backspace at a line's
// start joins the line above, Delete at its end joins the line below), and its result is spliced back. Lines outside the window are
// not read and come back byte-identical, which is what they would have done in the whole-text run: a run there is neither cut nor
// emptied, so repair finds it where it was and leaves it. A short text skips the window (nothing to save).
```
