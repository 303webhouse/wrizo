# Rulings: `apps/desktop/src/store/draftDecoration.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[draftDecoration §n]` points here.

## draftDecoration §1

From `apps/desktop/src/store/draftDecoration.ts`, line 25 at `7f1c6a84` (the comment that stays: "an indent's leading tabs are MARKERS (they wear .md-mark); the tab itself draws the level under pre-wrap; split off before the heading match so an indented `# ` still reads as a heading, and the count stays 1:1").

```ts
// ITEM 83 ERRATA E3 (2026-09-03) — the indent's leading tabs are MARKERS, not
// content. The indent itself needs no renderer: the editor is
// `white-space:pre-wrap` (ForwardOnlyEditor.tsx), so a leading tab already
// draws the level the writer asked for, and inventing a second indent
// mechanism on top of it would be two formulas for one number. What was
// missing is the REGISTER — every other convention in this file wears
// `.md-mark`, and the tab did not, so it read as text the writer had typed
// rather than as craft a control had applied.
//
// Split off ahead of the heading match, for two reasons. Character count stays
// 1:1 (only spans are added), which is what lets the caller restore a
// plain-text caret offset. And `# ` on an INDENTED line still reads as a
// heading — a whole-line `^#` match against a tab-prefixed line would silently
// have stopped matching the moment E3 made indents repeatable and common.
```

## draftDecoration §2

From `apps/desktop/src/store/draftDecoration.ts`, line 42 at `7f1c6a84` (the comment that stays: "the card's display register: markers hidden by font-size:0, never display:none or visibility:hidden, because the stored text is read from innerText").

```ts
// FX5 S6 — the CARD-surface display register (BoardEditor.tsx's
// BoardCardPopup ONLY — Draft mode's own decorateMarkdown/decorateInline
// above are NEVER called by this, and their own `.md-mark{opacity:.38}`
// dimmed-syntax rule in index.css is untouched by anything below). Nick's
// own verdict: asterisks visible on a card is a bug, not a style choice —
// "the popup shows words, not syntax." Bold/Italic markers are HIDDEN by
// default and reveal ONLY for the run the caret currently sits within or
// beside ("reveal-adjacent-to-caret," the brief's own named fallback).
//
// Why reveal-adjacent instead of hiding always: BoardCardPopup's own onInput
// derives the text that gets STORED from `el.innerText` (readEditorPlainText,
// above) — and `Element.innerText` is defined by spec to approximate
// RENDERED text, excluding anything `display:none` or `visibility:hidden`.
// An always-hidden marker built with either of those would vanish from
// `innerText` the moment it existed, silently stripping the markdown
// characters out of the STORED text on the very next keystroke — a real,
// provable way "storage stays markdown conventions untouched" would break,
// not a hypothetical. Reveal-adjacent keeps every marker a REAL, normally-
// rendered character at all times (visually collapsed via `.md-mark-hidden`
// — font-size:0, never display/visibility — see index.css), so `innerText`
// always reports it faithfully; only the VISUAL presentation toggles based
// on where the caret currently is.
// ITEM 211, THE CARD PORT: the board card popup now runs the page's editing rules (store/hiddenMarksEditing.ts), so the interim
// `revealAtMarker` option it alone passed - a mark shows while the caret touches it - is retired with it. No surface shows a mark.
```

## draftDecoration §3

From `apps/desktop/src/store/draftDecoration.ts`, line 101 at `7f1c6a84` (the comment that stays: "markers never show; the style still paints and the marks stay in the text, so storage, undo and innerText are unchanged").

```ts
      // ITEM 211 — Nick's "A" (2026-09-25), built on his word. Markers never
      // show. The interim rule un-hid a run's marks while the caret touched
      // them, so bolding or italicizing a word and clicking off its edge left
      // the asterisks on the page. The style still paints. The marks stay in
      // the text, so storage, undo, and innerText are unchanged.
```

## draftDecoration §4

From `apps/desktop/src/store/draftDecoration.ts`, line 113 at `7f1c6a84` (the comment that stays: "a style span paints its face, its size (real points in page units), or both; its hidden marks keep their own zero size").

```ts
        // POLISH #10 item 4: a style span paints its face, its size (real points in page units, as the page's own size), or both. Its hidden marks keep
        // their own zero size (.md-mark-hidden is on the marks themselves, so the span's size never reaches them).
```

## draftDecoration §5

From `apps/desktop/src/store/draftDecoration.ts`, line 138 at `7f1c6a84` (the comment that stays: "the dimmed-syntax register is gone, functions included; its leading-tab indent is ported into the pass below and does not collapse (a tab IS the indentation)").

```ts
// ITEM 122 — `decorateMarkdown` and `decorateInline` WERE HERE, and are DELETED.
// They rendered the retired iA register, where every marker stayed on screen at
// `.md-mark{opacity:.38}`. Nick's ruling retired that for Draft; Fable's ruling
// then retired the FUNCTIONS, because "SUPERSEDED-AS-DEFAULT is a trap in code,
// not a record" — a live export that produces the wrong register is something a
// future reader can reach for by habit, and the parks that mention them quote
// the past rather than calling it.
//
// WHAT THE DELETION COST, recorded because it was nearly missed: the two passes
// were NOT feature-equivalent. The deleted one handled the leading-tab indent
// and this one did not, so moving the default silently dropped Draft's indent
// marker — caught by item83f.mjs's E3 check reporting zero `.md-mark` elements,
// not by review. The indent is ported into the pass below, and it deliberately
// does NOT collapse: a tab IS the indentation, not syntax standing in for it.
```

## draftDecoration §6

From `apps/desktop/src/store/draftDecoration.ts`, line 302 at `7f1c6a84` (the comment that stays: "the default register is the one every Draft call site shares, so a fifth call site cannot forget it; the card passes it explicitly, so the two surfaces share one engine").

```ts
  // ITEM 122 — THE DEFAULT REGISTER IS NOW REVEAL-ADJACENT, on Nick's ruling
  // that Draft's B/I/U must render the STYLE with no visible markers
  // ("bold renders bold"). FX5 S6 introduced this parameter with
  // `decorateMarkdown` as the default — the iA dimmed-syntax register, where
  // every marker stayed on screen at `opacity:.38`. That register is what the
  // ruling retires for Draft.
  //
  // WHY THE DEFAULT MOVES RATHER THAN EACH CALL SITE PASSING AN OVERRIDE:
  // there are four Draft call sites (ForwardOnlyEditor's redecorate and its
  // initial mount, its initial React html, and PageEditor's rail actions), and
  // they must agree or the markers flicker between registers as the writer
  // types. A default cannot be forgotten at a fifth site; four overrides can.
  // BoardCardPopup already passed this function explicitly, so the card is
  // unchanged either way — the two surfaces now simply share one register,
  // which is what "the same engine" was always supposed to mean.
  //
  // SAFE THROUGH THE LIVE ROUND-TRIP, MEASURED NOT ASSUMED (item 122 S0): the
  // collapsed marks use `font-size:0`, never display/visibility, so they remain
  // real rendered characters and survive `el.innerText` — which is what the
  // live editor reads back into the store on every keystroke. The two forbidden
  // techniques were run as controls in the same probe and BOTH stripped the
  // markers out of `innerText`. See this file's own header for why that
  // distinction is load-bearing rather than stylistic.
```
