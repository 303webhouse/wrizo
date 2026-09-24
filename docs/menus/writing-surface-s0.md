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
