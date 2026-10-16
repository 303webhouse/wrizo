# Typed formatting characters are literal, and the caret settles synchronously: the plan (FIX, 2026-10-16)

**Nick's rulings (Oct 16, 12:28 am):**

1. Typed formatting characters have no formatting meaning. A hand-typed `*` or `**` (and `_`, `~`, `#`, and so on) is literal text, stored escaped so it never becomes markup. Bold, Italic and the rest come only from Ctrl+B / Ctrl+I and the menus. Existing saved markup stays as it is: old Pages are not rewritten. The `.md` export keeps literals escaped; `.txt` and Copy My Words show the plain characters.
2. Caret settling is synchronous: the same keys always give the same text at any speed. The latency cost goes in the next profile.

This is a plan only. It's built on its own branch after typing-latency lands, and it takes the full pair.

## 1. What gets escaped, and how it is stored

The escape is Markdown's own: a backslash before the character (`\*`). So a `.md` export renders it as the literal character in any Markdown reader, which is what Nick asked for. One rule decides it: **a character the writer TYPES that the one reader (`store/markRuns.ts`) could read as markup is stored escaped.**

| Typed character | Where | Stored as | Why |
|---|---|---|---|
| `*` `_` `~` | anywhere | `\*` `\_` `\~` | the inline marks: bold, italic, underline, strike |
| `#` | at the start of a line's text (after any tabs or tokens) | `\#` | a heading token is `#…#` plus a space at the line's start |
| `-` `>` | at the start of a line's text | `\-` `\>` | the bullet (`- `, `-+ `, `-= `) and quote / align / block (`> `, `>< `, `>> `, `>| `) tokens. A hyphen or `>` mid-line is never markup, so it stays bare (`well-known`, not `well\-known`). |
| `[` | anywhere, once font-span lands | `\[` | the font span opens with `[`. Escaping only the opener is enough; a writer's `]` stays bare. |
| `\` | anywhere | `\\` | so a typed backslash can't be read as an escape |

- **Typed means:** any text the browser inserts from the keyboard (the editor's native `input` path, which `repairInput` already reads), an IME composition's committed text, and the em-dash substitution's own input. The formatter's writes (Ctrl+B/I/U, the menus, Tab's indent chord, font picks) never pass through the escaper, so they stay markup.
- **Paste is literal too (Nick's ruling, Oct 16).** Pasted text goes through the same escaper as typed text, so a pasted `**` is a literal `**`. Until the follow-on lands, a copy-then-paste inside the app loses its formatting.
- **Follow-on ticket, `in-app-copy-format`, planned after this one (Nick):** a copy inside Wrizo carries Wrizo's own format beside the plain text, so pasting back into Wrizo keeps bold, italic and font spans. Pasting anywhere else gets the plain text.
- **Old Pages are not rewritten.** The reader still reads unescaped markup as markup, so `**bold**` saved before this change stays bold. Only new typing is escaped.

## 2. How it is shown and edited

- **Shown:** the reader learns one more token, an escape (`\` plus the punctuation). `\*` paints as `*`, and its backslash is a hidden mark (`md-mark md-mark-hidden md-escape`: `font-size:0`, never `display:none`). That keeps the DOM's text 1:1 with the stored text, the property every caret and offset path relies on, as it does for `**`.
- **Edited:** the 211 rules treat the escape as one character.
  - The caret never stops between `\` and `*`.
  - Backspace after `\*`, or Delete before it, removes both.
  - A range that cuts through an escape takes it whole (`replaceRange`'s existing "a marker is taken whole" rule, applied to the escape).
- **Ctrl+B / Ctrl+I runs behave as today.**
  - The formatter writes real marks.
  - Typing inside a bold run stays bold, and the reabsorb still carries a typed space and word into the run.
  - A run pressed off at its end ends there (card-held-italic).
  - A `*` typed inside a bold run is a literal star in bold text: `**a\*b**`.
- **The readers:**
  - `stripLine` (titles, `.txt`, Copy My Words) unescapes, so the writer sees `*`.
  - The Tutor and Consistency get the unescaped words.
  - `.md` export and Copy Formatted keep the escapes.
  - Word counts are unchanged, because an escape holds no whitespace.

## 3. Synchronous settling (ruling 2)

**Today:** a keyboard caret that lands inside a run's hidden closing marks is moved to before them on `selectionchange`, which is asynchronous. A fast typist's next character can arrive first and land on the other side. That is item112a's race (ledgers 64 and 67).

**The fix:** settle at the edit, not after it. A collapsed native insertion is applied at the settled position: `repairInput` takes `snapCaret(before.text, before.start)` as the insertion point, so where the text lands no longer depends on whether `selectionchange` has run. Backspace, Delete, Enter and the arrows already settle synchronously, because they go through `backspaceAt` / `enterAt` / `stepLeft`, which snap first. After ruling 1, a typed character can't complete hidden marks any more, so the remaining case is a caret the browser placed itself (Home, End, the vertical arrows, a click). Those go through the same settle on their next insertion.

**Cost:** `snapCaret` is line-local (`lineAt`), microseconds a key. The next profile reports it as its own bucket.

## 4. Checks: new, and parked

**New checks:**

- **Escape:** each character in the table, typed at a line's start, mid-line and inside a bold run, renders as itself and is stored escaped. Cases where nothing is escaped, as controls:
  - a mid-line hyphen;
  - Ctrl+B's own marks;
  - an old page's saved `**bold**`, which stays bold.
- **211 on an escape:** Backspace, Delete and a selection cut through `\*`.
- **Exports:** `.md` keeps the escapes; `.txt` and Copy My Words show the plain character.
- **Determinism:** the same keys at harness speed, item112a's exact call, and a writer's pace give the same text (the probe becomes a check).
- **Window check:** the escape joins `typing-latency-window-check.mjs`'s vocabulary.

**Parked, each verbatim with a successor that uses Ctrl+B / the menus (the sweep found only these that type markup by hand):**

- `fx5.mjs` S6 [PR #7 successor]: types `**bold in draft**` and expects hidden marks. Its successor makes the bold with Ctrl+B.
- `item112a.mjs` S2/§3 S0: types ` **bold** done` and expects `.md-bold`. Successor: Ctrl+B.
- `item112a.mjs` S2/§3 [deterministic successor, on `item112a-deterministic`]: counts four `*` in the typed run. Escaping adds four `\`, so it is parked again, and its successor asserts the stored text holds `\*\*bold\*\* done` and renders `**bold** done` as literal stars.

The item211 cases type plain letters beside seeded markup, which stays meaningful, so none of them is falsified. The full pair will show anything the sweep missed.

## 5. Order

1. typing-latency lands.
2. This branch (`typed-literal`, off main):
   - the reader's escape token;
   - the escaper on the typed path;
   - the 211 escape rules;
   - the readers' unescape;
   - synchronous settling;
   - the checks and parks.
3. The full pair, then the next profile with settling's cost.
4. font-span adds `[` to the escaper when it lands. Whichever of the two lands second takes the merge.
