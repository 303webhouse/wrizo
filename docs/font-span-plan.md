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
