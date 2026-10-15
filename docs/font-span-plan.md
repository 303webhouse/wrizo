# Font on highlighted words: the plan (FIX, 2026-10-15)

**Nick's rule (Oct 13):** with text highlighted, the Font choice applies only to those words, in cards and in Pages. With nothing highlighted, it changes the whole page (or the whole card), as it does today.

This is a plan only. Nothing is built until Nick approves it. Cursor is mocking the picker.

## 1. How a font span is stored

The text keeps its one rule: the page's markdown conventions live in `entry.text`, with no separate rich-text state. This matters for sync too: the server keeps the text and silently drops any field it doesn't know. So a font span is written into the text, as a **bracketed span with a class**, the form Pandoc reads:

    the [two words]{.font-eb-garamond} in another face

- **The class is the face's roster name as a slug:** lowercase, with spaces turned into hyphens (`crimson-pro`, `lora`, `eb-garamond`, `source-serif-4`, `times-new-roman`, `figtree`, `atkinson-hyperlegible`, `arial`, `courier-prime`).
- **Why this shape:**
  - **No whitespace inside the marks.** `[` sits against the first word and `]{.font-…}` against the last, as `**` does. The app's seven word counters all split on whitespace, so a span adds no words. An HTML `<span style="…">` would add one per span, and a face name with spaces would add more.
  - **No collision.** Nothing in the app uses brackets today. A writer's own `[sic]` stays text, because the grammar is exact: only `]{.font-<slug>}` closes a span.
  - **Portable.** Pandoc reads it as a span, so an exported `.md` file keeps the information.
- **Line-local, like every other mark.** A selection that crosses lines becomes one span per line, the way Bold does today (`selectedSegments`). Spans nest with Bold, Italic, Underline and Strike. Two spans may sit side by side; two that would cross can't both stand, and the later one stays literal text. That is the existing reader's rule.
- **The one reader learns the new kind.** `store/markRuns.ts` gets a `font` kind carrying its face, with an opening mark (`[`) and a closing mark (`]{.font-…}`) of different lengths. Today every run assumes one mark of one length on both sides. That assumption is replaced by `openLen` and `closeLen` in the reader and in the 211 rules (`store/hiddenMarks.ts`), and nothing else changes in them.

## 2. How it is shown

- **The page and the card share one decorator.** `draftDecoration.ts` wraps the run in `<span class="md-font" style="font-family:<roster stack>">`. Its marks are collapsed exactly like `**`: in the DOM, `font-size:0`, never visible. The page's or card's own face is unchanged around it.
- **Faces load on use.** A face named in a span is loaded when the page or card opens, or when the writer chooses it (`ensureFaceLoaded`, the loader item 207 already has). If this build doesn't know a face, it still renders: its own name first, then a serif fallback.
- **The 211 rules hold unchanged in spirit:**
  - the caret steps over the hidden marks;
  - Backspace and Delete never take one half of a span;
  - deleting every word inside a span removes the span;
  - Enter inside a span closes it before the newline and reopens it after.
- **The picker shows what the selection holds.** With a selection or caret inside one span it shows that face; across mixed faces it shows "Mixed"; elsewhere it shows the page's (or card's) own face, as today.
- **On the board, the card face renders the span too.** It uses the same decorator.

## 3. How it is exported

Nothing new is invented here. The exports already have two forms, and the span follows the existing rule for each:

| Path | What it carries |
|---|---|
| **Download `.md`** and **Copy Formatted** | The conventions intact, so the span is kept: `[two words]{.font-eb-garamond}`. Pandoc carries it on. |
| **Download `.txt`** and **Copy My Words** | Stripped through the one reader (`stripLine`), so the words stay and the marks go. |
| **Native copy (Ctrl+C on the page)** | Unchanged: the selection's own text, marks included, as `**` is today. |

There is no print or PDF path today, so there is nothing more to decide.

## 4. How it is removed

- **Choose the page's (or card's) own face** with the words highlighted. Every span in the selection is removed, and a span the selection only partly covers is split, so the words outside the selection keep their face.
- **Choose a different face** over a span. The span takes the new face. Overlapping spans are split or replaced, so a word never carries two fonts. Neighbouring spans with the same face merge.
- **Delete all the words** inside a span. The marks go with them (rule 3 above).
- **Undo** reverts a font press as one step, like every other format press.
- **With nothing highlighted**, the choice changes the whole page or card, as today. No "next text typed" font is held. That keeps the bare-caret behaviour exactly what Nick ruled.

## 5. Fable's four additions (Oct 15), ruled in before the build

1. **Every reader of the words reads them without span marks.** One function strips the font span's two marks and keeps every other convention exactly as it is today: `withoutFontMarks(text)`, next to `stripLine` in `markRuns.ts`. It is applied at each reader that takes the text as words:
   - the Tutor's payload to `/api/tutor/chat` (`messages`, `delta`, `selection`, built in `store/api.ts` and `Tutor.tsx`);
   - Consistency (`computeConsistencyObservations` in `store/tutorConsistency.ts`, and the lenses in `tutorLenses.ts`);
   - titles, excerpts and echoes (`entryText.ts plainLines`, through `stripLine`, which learns the span);
   - every word counter. There are seven private copies of the whitespace counter (PageEditor, Sliver, JournalEntry, ScriptEditor, QuickSprint, HomeFlow, FirstRunGate). The marks contain no whitespace, so a count can't change, but the counters still read through the function so the rule holds by construction rather than by coincidence.

   **Search and find:** the app has no full-text search of its own, so the readers above cover every reading it does. The browser's own find (Ctrl+F) searches what the page's DOM contains. A span's hidden marks are real characters there (collapsed to zero size, never removed, the same as `**` today), so a search for "font" can match inside one. I'm disclosing this, not fixing it: removing the marks from the DOM would break the text the editor reads back.
2. **Overlapping picks merge or split; marks never stack.** A pick is computed on the plain text as one operation:
   - remove every font span the selection touches, splitting a span that reaches outside the selection at the selection's edge;
   - wrap the selection in the new face, unless it is the page's (or card's) own face;
   - merge it with a neighbouring span of the same face.

   So a word is inside at most one font span, and two font marks are never nested or adjacent. Bold, Italic, Underline and Strike nest with a span as they nest with each other.
3. **One undo step per pick.** A pick is one atomic record in the editor's undo stack (`textUndo`), the same as every rail press. Picking again over the same words is one more step, never a merge with the last one.
4. **It gets the full pair**, because it changes saved text.

**The picker (Nick approved Cursor's mockup, `cursor/font-choices` @ `6cc5f529`, frozen):** a Typeface section with two scopes, "Selection" and "Whole document" ("Whole card" in a card), and brass on the current face. With nothing highlighted the "Selection" scope isn't offered. **Frames:** a highlighted pick on a Page, a whole-document pick, and a pick inside a card, in both themes.

## Scope and checks

- **The build touches:** `markRuns.ts` (the `font` kind and asymmetric marks), `hiddenMarks.ts` (`openLen`/`closeLen`), `draftDecoration.ts` (the span), `draftFormat.ts` (apply, remove, the picker's reading, `stripLine`), the Type control's handler in Sliver (Pages) and in the card pop-up's dock, and the loader.
- **No BoardEditor pointer code is touched.** The pop-up's dock calls the same formatter.
- **Checks:**
  - store and show;
  - nested with Bold and Italic;
  - the selection across two lines;
  - partial removal and the split;
  - a same-face merge;
  - every 211 rule on a span;
  - Enter inside a span;
  - Undo;
  - `.md` and `.txt` exports;
  - an unchanged word count;
  - a card and a page, both themes.
- **Plus the window check.** `typing-latency-window-check.mjs` will include spans in its vocabulary, so the windowed 211 rules are proved identical with the new kind too.

**One question for Nick:** should a span's face also follow the text into a card made from a page selection, or into the Tutor's reading? I'd say yes for the card, since it is the same text, and the Tutor reads the stripped words.
