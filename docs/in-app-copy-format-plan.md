# in-app-copy-format: plan

Status: PLAN, for Fable's review. Nothing is built.
Follows typed-literal (plan `docs/typed-literal-plan.md` @ 9c0864d1; build `typed-literal` @ b39eda69).
Nick's ruling, Oct 16: "a copy inside Wrizo carries its own format, so pasting back keeps bold, italic and font spans. Pasting anywhere else gets the plain text."

## 1. What happens today, read from the source

- **Copy is native on every writing surface.** Draft, Revise, Free Write and the card pop-up have no `copy` handler. Rule 5 of item 211 left copy "exactly as it was". The browser serialises the DOM selection, and hidden marks are hidden with `font-size:0`, never `display:none`, so they are copied. A bold word reaches the clipboard as `**bold**`, today, on main.
- **typed-literal adds a second leak.** A typed star is stored as `\*`, and the backslash is a hidden mark too. A writer who copies `*sigh*` and pastes it into an email gets `\*sigh\*`.
- **Pasting back inside Wrizo makes it worse each time.** Since typed-literal, a paste is escaped like typing. Copied `**bold**` comes back as literal stars, which the typed-literal plan already says. Copied `\*` comes back as `\\\*`, which shows `\*`, and every further copy and paste adds another visible backslash.
- **The Voice Wall records own ink from the DOM selection.** `VoiceWallWhisper` records `String(getSelection())` in a capture-phase `copy` listener on the document. `shadowAllows` then compares the pasted `text/plain` with it exactly, or trimmed.
- **Copy My Words** (`store/clipboard.ts` `copyText`) copies the derived clean text. It records its own shadow, and it is not changed here.

**A decision this needs before either ticket ships (§6, Q1):** typed-literal alone ships the backslash leak and the backslash growth. The copy half of this ticket closes both.

## 2. The design

### 2.1 Copy: two formats on the clipboard

On `copy` from a writing surface, the surface's own handler:
1. calls `preventDefault()`;
2. maps the selection to stored-text offsets `[s, e)`, using the same mapping the 211 rules use (`selectionEnds`; on the page, the rows map);
3. writes two formats:
   - **`text/plain`: the plain characters.** Each line goes through `stripLine`, the reader Copy My Words and the `.txt` export already use, so no marks, no escapes and no lead tokens. This is what any other app receives.
   - **`application/x-wrizo-fragment`: the stored markup of the selection.** It is a JSON envelope: `{ v: 1, text, plain }`. `text` is the fragment, and `plain` is exactly the `text/plain` written beside it.

   Chromium carries a custom MIME type as web custom data, so Electron and the web app both read it back on paste. No other application sees it.
4. records the shadow itself: `recordShadow(plain)`. The document-level capture listener in `VoiceWallWhisper` has already recorded the DOM string, which still holds the hidden marks. The surface's listener runs after it and records the text that is really on the clipboard, so pasting your own words back still passes the wall.

**No `text/html` is written.** Pasting into Word or Docs gets plain text, as ruled. A formatted paste into other apps would be a separate ruling (§6, Q4).

### 2.2 The fragment: `fragmentOf(text, s, e)`

A new pure module, `store/clipboardFormat.ts`, built on the one reader in `store/markRuns.ts`. It takes the stored text and `[s, e)` and returns balanced markup. Five rules:

- **A run cut by the selection is closed and reopened at the cut.** Its marks are written at the selection's edges, so `**bo|ld wor|ds**` copies as `**ld wor**`. This applies to emphasis and to font spans (`[`…`]{.font-<slug>}`, using `closeMark`), nested runs included.
- **An escape is taken whole.** An edge that falls between the backslash and its character moves outward, as `replaceRange` already does.
- **Lead tokens** (tabs, `# `, `- `, `> `, `>< `, and the rest) are kept for every line after the first. They are kept on the first line only when the selection begins at that line's start (see §6, Q2).
- **Struck Free Write text** is history, not prose, so it is left out of both formats. The fragment is cut from the derived text (§6, Q3).
- **Invariant:** `stripLines(fragmentOf(...))` equals the `plain` the same selection yields. One reader, two outputs, so the two formats cannot disagree.

### 2.3 Paste: the fragment wins when it is trustworthy

On `insertFromPaste`, in the `beforeinput` path each surface already has:

1. **The wall first, unchanged.** `shadowAllows(text/plain)` decides own ink. Foreign text is blocked and whispered exactly as today. The fragment never bypasses the wall.
2. **If the paste carries `application/x-wrizo-fragment`:** the envelope must parse, and its `plain` must equal the `text/plain` it was pasted with. If so, the handler calls `preventDefault()` and inserts `envelope.text` as markup, not escaped, through `replaceRange` at the selection. This is one edit and one undo step, and the caret lands after the insertion.
3. **If the caret is not at a line's text start,** the fragment's first-line lead tokens are dropped. Mid-line, a `# ` is not a heading, and it would show as literal characters.
4. **Otherwise, the typed-literal path is unchanged:** `text/plain` is escaped and literal. This covers paste from another app, a forged or stale envelope, and an envelope whose `plain` does not match.
5. **Free Write appends at the runway tip,** as today. Free Write paste already routes through `handleTyped`, and the fragment path calls `handleInput(fragment)` without escaping. The runway law holds: text still enters only at the tip.

### 2.4 Cut

Draft, Revise and the card can cut. Free Write blocks cut, and that does not change. A cut writes the same two formats, then deletes `[s, e)` through `replaceRange`, so its rules (no lone hidden mark, escapes whole) apply. The deletion is one undo step. The cut cannot stay native: once `preventDefault()` sets the clipboard, the browser deletes nothing.

### 2.5 Surfaces

| Surface | Copy | Cut | Paste fragment |
|---|---|---|---|
| Page: Draft, Revise (rows) | yes | yes | yes |
| Page: Free Write | yes (derived text) | blocked, as today | yes, at the tip |
| Card pop-up | yes | yes | yes |
| Journal sheet, screenplay | unchanged: no markup model | unchanged | receives `text/plain` |

Card ↔ page in both directions comes free, because both read the same envelope.

## 3. Files

- **New:** `store/clipboardFormat.ts`, with `fragmentOf`, `plainOfFragment`, `readEnvelope` and `writeEnvelope`.
- **`components/ForwardOnlyEditor.tsx`:** the Draft and Revise copy and cut listeners and the paste branch; the Free Write paste branch.
- **`components/BoardEditor.tsx`:** the card pop-up's copy, cut and paste. These are clipboard listeners, not INK's pointer code.
- **`store/hiddenMarksEditing.ts`:** an `insertMarkup(range, fragment)` entry. It is `replaceRange` without the escaper, and it records one undo step.
- **Not touched:** `VoiceWallWhisper` (its observer still runs; the surface records after it), `store/clipboard.ts` (Copy My Words), exports, and storage.
- No new dependencies.

## 4. Checks (red first; the checks are committed before the build)

**Browserless: `scripts/in-app-copy-format-check.mjs`, using the real modules bundled with esbuild, as typed-literal-check does.**
- `fragmentOf` on seeded random pages, every selection kind (inside a run, across a run's edge, across lines, through an escape, through a font span, nested runs):
  - the fragment is balanced: `readMarks` finds no lone mark;
  - its strip equals `plain`;
  - it holds no half escape.
- Round trip: inserting the fragment into an empty page and reading its runs gives the source slice's runs, kind by kind and face by face.
- `readEnvelope` refuses a bad JSON envelope, a wrong version, and a `plain` that does not match.
- Mutants, each one confirmed to have landed before its red is believed:
  - drop the reopen at the cut;
  - drop escape widening;
  - skip the envelope's `plain` comparison.

**Browser: `scripts/harness/in-app-copy-format.mjs`, with trusted keys (`keyDown` carrying `commands: ['copy' | 'cut' | 'paste']`, the route typed-literal.mjs L5 uses).**
- **Draft:** copy a selection holding bold, italic and a font span, and paste it at the end.
  - The pasted copy is styled, with the same counts.
  - The stored text holds real marks.
  - The clipboard's `text/plain` holds no `*`, `\` or `[`…`]{`.
- **A cut through a bold run's middle:** the run splits cleanly, no mark is shown, and one undo restores it.
- **Card to page, and page to card:** formatting is kept.
- **Free Write:** a styled paste lands at the tip, styled.
- **External text** (the plain text only, no envelope): still literal, as typed-literal L5.
- **A forged envelope** whose `plain` does not match: the paste is literal.
- **Foreign text:** still blocked and whispered. This is the Voice Wall regression check.
- **A typed `*` copied and pasted back:** it stays one literal star, and no backslash appears. This is §1's growth, closed.

**Parks.** typed-literal.mjs L5 asserts that the in-app round trip loses formatting. This ticket falsifies that, so L5 is parked verbatim with a successor.

## 5. Order

1. typed-literal merges, after typing-latency, per Fable.
2. This ticket branches from main after that. It needs the escape reader and the paste branch typed-literal builds.
3. If Q1 is answered "ship together", the copy half (§2.1, §2.2 and the `text/plain` cleaning) can instead ride on typed-literal's branch as its own commits. The paste half follows here.

## 6. Questions for Fable (and Nick where noted)

- **Q1 (ship order; Nick's call).** typed-literal alone ships the clipboard backslash (`\*` reaching other apps) and the backslash growth inside Wrizo.
  - Reading A: ship typed-literal first and accept both until this ticket lands. Today's `**` on the clipboard is already the same class of leak.
  - Reading B: hold typed-literal until this ticket's copy half is ready, and ship them as one deploy. The copy half (§2.1 and §2.2) is self-contained.
  - **Lean: B.** Reading A puts a visible regression in front of writers: a backslash they never typed, in their email, and on the page after a round trip. A's risk is unmeasured, because we do not know how often writers copy out of a page; B's cost is a few days.
- **Q2 (first-line lead tokens).** A selection from a line's start carries its `# ` or `- `, and the paste keeps it only at a line start. The alternative is never to carry a partial first line's structure. **Lean: as written,** because copying a whole heading line should paste as a heading.
- **Q3 (struck text).** Struck Free Write text is left out of both formats. Today a native copy includes it, because it is visible.
  - **Lean: leave it out.** The derived text is "the writer's words", and Copy My Words already excludes it.
  - The rival: a writer who selects struck words and copies them may expect them. Nick may want to rule.
- **Q4 (out of scope, named so it is not assumed).** A formatted paste into Word or Docs (`text/html` with `<b>`/`<i>`) is not in this ticket. The ruling says other apps get plain text.
