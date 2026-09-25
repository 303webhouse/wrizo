# Writing-surface S0 (FIX, 2026-09-24) — browserless half

Trigger: Nick — "most of the text formatting options (B-I-U, bulleting, indenting, etc.) are not displaying correctly … every time I write in the app, I hit formatting issues."

Instrument: `apps/desktop/scripts/writing-engine-audit.mjs` (real `draftFormat.ts` + real `draftDecoration.ts`, esbuild-bundled, no browser). Output was read from the run of 2026-09-24 at d70822c. It sees STORED text, the decorator's HTML and which CSS classes it emits. It cannot see pixels, the caret, native shortcuts or the dark theme; those are the box frames below.

## Ranked list (how often a writer hits it × how wrong it looks)

| # | Defect | Evidence | Likely cause |
|---|--------|----------|--------------|
| 1 | **Bullets show a literal `- `.** Press Bullet, the page shows `- Buy milk` as plain text: no bullet glyph, no hanging indent. | L1/L2: visible `- Buy milk`, classes none | `draftDecoration.ts` has no bullet rule; `index.css` has no `.md-bullet` |
| 2 | **Quote shows a literal `> `**, no bar/indent/italics. | Q1: visible `> To be…`, classes none | same: no decorator rule, no CSS |
| 3 | **Center / Right show literal `>< ` / `>> `** and the line does not move. | A1/A2/AB: marker visible, classes none | same; there is no alignment rendering at all |
| 4 | **Press Bold/Underline again = more asterisks, not un-bold.** `****Plain****`, `____Plain____`. | B2, U2 | `wrapSelection` always wraps; no toggle (`marksAt` knows the state, `applyFormat` ignores it) |
| 5 | **Press Italic on an italic word turns it BOLD** (`*Plain*` → `**Plain**`). | I2 | same non-toggle; `*`+`*` = `**` |
| 6 | **Bold+Italic and Bold+Underline leave raw marks visible.** `***Plain***` shows `*Plain*` with the bold applied; `**__Plain__**` shows `__Plain__`. | BI, BU | decorator's inline regexes do not nest; the inner mark is not parsed |
| 7 | **A selection across a paragraph break stays raw**: `**First…\nSecond…**` shows the asterisks, no bold. | BML, IML | decorator matches per line; `wrapSelection` wraps across the newline |
| 8 | **Indent is a bare tab** wrapped in `.md-mark` (dim 0.38 opacity), no hanging wrap. Works, but looks "faint"; a wrapped line returns to the margin. | N1/N2 (stored `\t`) | tab is real, styling is only the mark class |
| 9 | Ctrl/Cmd+B / I / U do nothing in the app's own editor; native contenteditable bold (if the engine applies one) is discarded on the next redecorate. | ForwardOnlyEditor intercepts only Z/Y | only Z/Y handled; needs a real-browser frame to confirm what the native path does |
| 10 | Free Write and Revise have NO styling tools (item 121 I6/R15 removed them from Free Write; Revise's sliver is `{kind:'empty'}`); a Draft page's bullets and quotes show raw after a switch to Free Write. | `PageEditor.tsx` sliverContent | by ruling; the raw-marker problem (1–3, 6–7) reaches those modes the moment the text has them |

Heading, plain bold, plain italic, plain underline, plain strike and unindent work: stored strings are right and the decorator emits `md-h1`/`md-h2`/`md-bold`/`md-italic`/`md-underline`/`md-strike`.

## Fix order (proposed; nothing built)

1. Bullets, quotes, alignment rendering (1–3): decorator line rules + CSS classes; one commit, one harness scenario (the stored text is unchanged, so no data migration).
2. Toggle for B/I/U/S, and the italic-on-italic collision (4, 5): `applyFormat` reads `marksAt` first.
3. Nested inline marks and cross-paragraph selection (6, 7).
4. Ctrl/Cmd+B/I/U (9) after the box frames say what the native path does.
5. Indent look (8).

## Frames the box has to supply (short grant, after Batch Six)

Default theme and one dark theme, for each of Free Write / Draft / Revise (and screenplay where the toolbar exists): each tool applied by a real pointer press and by Ctrl+B/I/U; screenshot, `innerHTML` and stored `entry.text` after the debounce and a reload. The script for it is NOT written yet; it is the next step once a grant is named. Fonts are PLAN DESK's.

## Browser frames (run 2026-09-24, box turn FIX; 98 frames, `docs/evidence/writing-s0/frames.json` + PNGs; script `apps/desktop/scripts/writing-s0-frames.mjs`)

Real select-all, real pointer presses on the sliver buttons, stored text read after the debounces settled. Both themes were run (default; and prefs page=dark). Note both show the same dark chrome with the same cream page: the "dark" page-tone pref did not change the paper in these frames, so no theme-specific defect surfaced; every defect below is theme-independent.

- **#10 CONFIRMED, cause found.** Free Write renders the stored page as one raw `.fo-run` span: `**bold**`, `# Heading`, `- bullet`, `> quote`, `>< ` all show as typed (frame `default/render-FreeWrite.png`). Draft and Revise both run the decorator (bold/italic/underline/strike/headings render, marks hidden; bullets, quotes, alignment still raw in both, as ranked 1-3). So styled text renders in Revise but NOT in Free Write: the decorator is not running there.
- **Ctrl+B / Ctrl+I / Ctrl+U: no effect in any mode** (stored text unchanged, DOM unchanged, immediately or settled). Rank 9 confirmed as "nothing happens", not "native bold discarded".
- **Two-line select-all + Bold stores `**Plain words here\nSecond line here**`** and Draft renders it with no bold at all (classes none): the cross-paragraph defect (7) is what a writer hits first, since select-all is the natural gesture. Pressing Bold again gives `******Plain…**` (4).
- Bullet, quote, Center store correctly and render as raw prefixes (`- `, `> `, `>< `); Indent stores a tab per selected line and renders a dim tab.
- Free Write and Revise: no format toolbar (ruled); recorded as ABSENT rows.
- Screenplay: `#/page/new?structure=screenplay` did not reach a screenplay surface in the run (row recorded, no `.script-page`); the screenplay frames need a different route and stay open.

## Fix step 1 (as ruled by Fable): rendering of bullets, quotes, alignment in Draft AND Revise, plus the decorator running in Free Write. Only the tools stay where ruled.

### Open notes (Fable, 2026-09-24)

- **Unexplained: the "dark" page-tone pref left the paper cream.** The frames set `wrizo-theme-prefs` to `{page:'dark'}` before load and the paper stayed cream in every mode. Not investigated; it may be that the pref is read by a control that was never mounted in these frames, or that the paper is fixed by the theme. To be checked before anyone claims a dark-page frame.
- **Screenplay route found.** `#/page/new?structure=screenplay` is the unborn DOOR: it only opens the "make this a screenplay" confirm (`requestScreenplay`, PageEditor.tsx:493) and births on confirmation, so it never showed a script surface. The real surface is a page with `pageType:'script'` (PageEditor.tsx:1320 delegates to ScriptEditor): seed one through `wrizoCreateJournalPage({... pageType:'script'})` and navigate to `#/page/<id>`. The next frame run uses that.

## Step 1 landed (item-writing-r1 @ 1cf842c)

Bullets, quotes, centre and right alignment now render in Draft and Revise, and Free Write runs the same decorator (rendering only). Mechanism: `decorateLineForCard` peels line prefixes (after any leading tabs; stackable, e.g. `> - `), wraps each in an inline-block `.md-line` (never display:block: the joining `\n` would draw a blank line) and collapses the stored prefix with `.md-mark-hidden`, revealed while the caret is at it. Bullet = hanging glyph in a 1.4em gutter; quote = 3px rule from `currentColor` + italic; alignment = `text-align`. Free Write: unstruck runs are decorated with a null caret, struck runs stay plain struck spans, `.fo-run` wrapper kept.

Evidence: `scripts/harness/writing-r1.mjs` 25/25 on the new build, 12/25 on the parent's `src` (13 fail: every render check; the 12 that pass are the storage-invariant, no-blank-line and typing checks that did not depend on the change). Regression: reveal 16, underline 7, strike 7, outdent 9, item83f 34, item121 43, fx5 62, fx6 37, ab2 33, fx1 23, j5 37, all PASS. NOT run: the full suite pair.

Known trade-off, stated: a stray `*` pair in Free Write prose ("2 * 3 and 4 * 5") now collapses its asterisks, as Draft and the cards already do. Forward-only cannot repair it.

## Step 2 (item-writing-r2, on top of step 1)

Ruled: the toggles (4, 5), cross-paragraph selection (7), Ctrl+B/I/U (9), all through the one formatter the toolbar calls.

- **Cause of 4/5/7 was one thing:** `wrapSelection` only ever wrapped, once, around the whole selection. Replaced by `toggleInline` (store/draftFormat.ts): per-line segments (prefixes `- `, `> `, `>< `, tabs, `# ` left in front of the mark), remove-from-all if every segment is already marked, otherwise apply-to-all; a part of a run splits it; star runs are read as bold/italic/both so `***x***` is understood (Italic un-marks it back to `**x**`).
- **A second cause, found by the browser run, not the engine:** the toolbar and the shortcut restored a collapsed CARET after a press, so the selection the press had just marked was lost and the second press acted on line 1 alone. `setSelectionOffsets` (store/caretOffset.ts) now restores the selection; no marker pair is revealed while a range is selected.
- **Line tools** (Bullet, Quote, Centre, Right, Left) now act on every line the selection touches (they changed the first line only), remove from all when all have it, find their token anywhere in a line's leading run, and insert after the tabs so Outdent still finds them.
- **Ctrl/Cmd+B/I/U:** `formatShortcutAction` (one map) is called by the page's free-edit editor (Draft only: the host passes a formatter only there) and the card popup. Free Write and Revise leave the keys alone by ruling: measured, unchanged text, nothing bold.
- **"Copy My Words"** stripped only `- ` at the very front, so an indented bullet kept its hyphen; it now strips stacked prefixes in any order. (Not asked for; the same defect class, in the same file.)
- **Evidence:** `scripts/writing-format-proof.mjs` 42/42 checks, 8 mutants each removed alone and all killed; `harness/writing-r2.mjs` 13/13 on the new build, 6/13 on the parent's src (7 red); writing-r1 still 25/25; regressions ab2 33, e1 41, fx4 42, fx5 62, item118 10, item83f 34, underline 7, strike 7, outdent 9, reveal 16, item121 43, fx6 37, fx1 23, j5 37, fx7 44: all PASS. Not run: the full-suite pair.
- **Known, deferred to step 3:** a mark nested inside another still stores correctly but the decorator does not paint it (`__*x*__` shows the underline markers). The toggles are ready for it.
