# Rulings: `apps/desktop/src/styles/15-boards-connected.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[boards-connected §n]` points here.

## boards-connected §1

From `apps/desktop/src/styles/15-boards-connected.css`, line 1 at `25112784` (the comment that stays: "BOARDS CONNECTED (PW1): the Plan panel's connections zone. Its heading reuses the engraved register of .wz-cascade-panel-title; the lexicon carries the words, the register the voice. One accent site per menu, and this is it; no new motion").

```css
/* ===== PW1 — BOARDS CONNECTED (the Page/Plan workflow, phase 1) ===========
   S1: the Plan panel's connections zone. The heading reuses the engraved
   register `.wz-cascade-panel-title` already establishes (10px/2px/uppercase/
   olive) — the LEXICON carries Nick's sentence case ("Boards connected"), the
   REGISTER carries the voice. One accent site per menu, and this zone is it
   (G5). No new motion anywhere in this block: the panel's own 180ms collapse
   and the survey's slide are the built engine, and this arc adds none. */
```

## boards-connected §2

From `apps/desktop/src/styles/15-boards-connected.css`, line 38 at `25112784` (the comment that stays: "the two thumbnail shapes: wide for boards, tall for pages, carried by the aspect ratio of a leading swatch (never the row's box), so a long title can wrap without turning a board into a page; no colour, no badge").

```css
/* PW2 S2 AMENDMENT (Nick) — THE TWO THUMBNAIL SHAPES, and the sections that
   hold them. "Section off Boards from Pages clearly and use a different
   thumbnail (horizontal rectangles for Boards, vertical rectangles for
   Pages)."

   The shape is carried by an ASPECT RATIO on a leading swatch rather than by
   the row's own box, so a long title can still wrap without turning a board
   into a page. Geometry is the signal; no colour is spent, and no badge is
   needed to read the row. Same law the canvas board-card obeys — a board is
   wider than tall wherever it appears. */
```

## boards-connected §3

From `apps/desktop/src/styles/15-boards-connected.css`, line 78 at `25112784` (the comment that stays: "destructive colour lives only inside the confirm: Delete stays --text-mid like Move; only .wz-cascade-confirm-danger wears --brick").

```css
/* Destructive color lives ONLY inside the confirm (T4's own ruling —
   "Destructive color appears only inside the confirm, never at rest") —
   the Delete disclosure item itself stays --text-mid like its Move
   sibling; only .wz-cascade-confirm-danger (below) wears --brick. */
```

## boards-connected §4

From `apps/desktop/src/styles/15-boards-connected.css`, line 113 at `25112784` (the comment that stays: "the fold: a header disclosure shared by every list-bearing section (CascadePanels.tsx FoldSection). The whole header is a real full-width button; the chevron is quiet olive at rest and on hover, never brass; keyboard focus keeps the site-wide brass ring, since focus is an event").

```css
/* FX9 S1 — the fold: a header disclosure toggle shared by every
   list-bearing section this ticket touches (CascadePanels.tsx's own
   FoldSection — DrawersPanel's per-project clusters + its "Loose" documents
   group, both reusing `.wz-drawers-cluster`/`.wz-drawers-cluster-title`
   above unchanged for their inner content/title typography; JournalPanel's
   "Recent" list via the `--journal` variant below).
   The WHOLE header is a real, full-width <button> — the hit target is the
   entire row, never the chevron alone (S1's own ruling). The chevron reads
   quiet olive (--accent-rest) at rest AND on hover — "a persistent door,"
   never brass/orange at either state. Keyboard FOCUS still wears the
   site-wide brass ring (button:focus-visible, above) — that law is about
   RESTING/HOVERED chrome specifically ("nothing brass... at rest or on
   hover"), and focus is this app's own established EVENTAL state, not a
   where-you-are marker (see this file's own "olive marks where you are,
   orange marks what you do" comments elsewhere) — so it is deliberately
   left alone here, not overridden to olive. */
```

## boards-connected §5

From `apps/desktop/src/styles/15-boards-connected.css`, line 263 at `25112784` (the comment that stays: "the text selection is brass from the theme token (selecting is the writer acting), with --on-brass so selected text stays legible; both rules, because Firefox honours only ::selection").

```css
/* ITEM 122 — THE SELECTION IS BRASS, on Nick's ruling: orange is for humans
   ACTING, and selecting is the writer acting. Painted from the THEME TOKEN,
   never a literal, so a theme pack re-points it with everything else; and
   `--on-brass` is the paired foreground that already exists for exactly this
   job, so selected text stays legible instead of inheriting whatever ink it
   happened to have. Both rules are needed: Firefox honours only ::selection,
   Chromium honours both, and ::-moz-selection is inert elsewhere. */
```

## boards-connected §6

From `apps/desktop/src/styles/15-boards-connected.css`, line 276 at `25112784` (the comment that stays: "six heading levels, one-to-one with h1-h6, each a distinct size, h1 largest and h6 just above body; text-transform:none, so a heading is never forced into capitals").

```css
/* HEADINGS, six levels (Nick, 2026-10-06), one-to-one with HTML h1-h6: each a distinct size, h1 largest and h6 just above body.
   text-transform is set to none on purpose - a heading is never forced into capitals (Nick: "headings should not default to ALL CAPS"). */
```

## boards-connected §7

From `apps/desktop/src/styles/15-boards-connected.css`, line 295 at `25112784` (the comment that stays: "the free-edit surface is one row per line (store/lineRows.ts) with the newline left as text between rows: inline-block, so textContent, innerText and copied text stay identical; contain:layout style keeps a row's layout inside it, and nothing in a row is positioned").

```css
/* TYPING-LATENCY (row shape F, ruled 2026-10-14) - the page's free-edit surface is one ROW per line (store/lineRows.ts), the
   newline between two rows left as text, exactly where it always was: `.md-line`'s own inline-block shape, so textContent,
   innerText and copied text stay byte-identical (measured, docs/evidence/latency-profile-eb27ea7c), with `contain: layout style`
   so a row's own layout stays inside it. Nothing inside a row is positioned, so a row becoming a containing block moves nothing. */
```

## boards-connected §8

From `apps/desktop/src/styles/15-boards-connected.css`, line 300 at `25112784` (the comment that stays: "no content-visibility on the rows: a skipped row carries no text for innerText, and caret and scroll restores land on estimated rows").

```css
/* TYPING-LATENCY - content-visibility WAS HERE, and is REMOVED (Fable's ruling, Oct 16; chat 1's ledger 67). It cut the keystroke a
   great deal, but a skipped row carries no text for innerText (the editor's innerText read 7,430 of 121,262 characters at 20k), Ctrl+End
   left the caret off screen, and a page -> Plan -> back return restored the scroll over re-estimated rows and showed other text. The
   original note is kept below for the record; the rule itself is gone.
   WAS: TYPING-LATENCY (Fable, Oct 14: content-visibility "justified to try on F rows ... if it measurably cuts the cost"; the profile's G1:
   one-character layout 7.1 / 16 ms at 20k / 50k against containment alone's 40 / 110). A row off screen is skipped by layout; its height
   until first rendered is the per-row estimate store/lineRows.ts writes inline (contain-intrinsic-block-size: auto <est>px), after
   which the browser remembers its real size. What a skipped row implies is all inside the row's own box: size containment while
   skipped (the estimate stands in), paint containment always (nothing in a row draws outside it - bullets and quote borders are inside
   its padding). The real editor's innerText and select-all text are checked against its text at 50k by the profile, every run.
   .forward-only-editor .wz-row{ content-visibility:auto; }   <- the removed rule */
```

## boards-connected §9

From `apps/desktop/src/styles/15-boards-connected.css`, line 326 at `25112784` (the comment that stays: "the sheet owns a top margin (--ts-top), so the first row is never cut by the page's edge or a scroll; the fields are placed from it and the centred block stays at 40% of the sheet").

```css
/* The sheet owns a TOP MARGIN (--ts-top): the contact block and the word line sit that far below the sheet's top edge, so the first row is never cut by the page's own edge or by a scroll of the sheet
   (ledger 92, frame 04: "Ada Marsh" and "About 62,000 words" were clipped mid-glyph in both themes). The fields are positioned from this margin; the centred block stays at 40% of the sheet. */
```

## boards-connected §10

From `apps/desktop/src/styles/15-boards-connected.css`, line 337 at `25112784` (the comment that stays: "a leading tab is a first-line indent, one fixed step: tab-size 2em (the default of 8 characters varies with the face); the whole-paragraph indent is the separate block token below").

```css
/* STEP 3 - THE INDENT LOOK (Nick's ruling): a leading tab is a FIRST-LINE indent - the first visual line moves in one step per
   tab and wrapped lines return to the margin - so a tab must be one fixed step wide. `tab-size` makes it 2em (the browser default,
   8 characters, varies with the typeface). The WHOLE-PARAGRAPH indent is the separate `>| ` block token below. */
```

## boards-connected §11

From `apps/desktop/src/styles/15-boards-connected.css`, line 360 at `25112784` (the comment that stays: "the screenplay surface runs no typewriter: no start offset (it would float a fresh page's caret mid-page) and no fade mask (it would be dead CSS that reanimates if the attribute returned). .mode-scroll and .entry-full keep theirs; the scroll cap's bounded height is the containment fix and stays").

```css
/* AB2 S2 DoD gave the SCRIPT surface the typewriter's hold-band in
   container mode (the sheet lives inside the bounded .desk-frame-scroll-cap
   — AB1 finding 4's containment fix — not the window), with the same fade
   recipe .mode-scroll's fixed-viewport variant above uses, and FX1 S1's start
   offset centring a fresh page's first line.

   SC1 S3, AMENDED 2026-07-24 (Nick's word, via Fable) — BOTH rules retire
   from this surface, because **the screenplay surface no longer runs the
   typewriter at all**, interim, pending his own revision of typewriter mode
   in a separate build.

   The start-offset rule was the measured root of SC-V4 ("the cursor starts by
   floating in the middle of the page"): a static `padding-top` of
   `--tw-start-offset` — 25% of the stage, 183px at the 1280px reference —
   applied unconditionally the moment a script page mounted, pushing the whole
   sheet down the scroll box before a single keystroke, and landing a
   brand-new page's caret at 38.2% of the visible box. Reproduced before it
   was touched; notably the typewriter HOOK was innocent (band()'s C2 guard
   correctly refuses to scroll fresh content, and the first element already
   rendered 1px below the sheet's own top margin) — this declaration was the
   whole defect. The fade mask goes with it: it is the typewriter's own
   visual, and with the engine unwired `data-typewriter` is never 'true' here,
   so leaving a rule keyed on it would be dead CSS that silently reanimates if
   the attribute ever returns.

   `.mode-scroll` (prose) and `.entry-full` (Journal) are UNTOUCHED and keep
   the FX4-tuned quarter-down start and their fades exactly as shipped —
   `--tw-start-offset` is still measured and published by useTypewriterFade.ts
   for them. The scroll cap itself also stays exactly as it is: its bounded
   height and internal scroll are AB1's containment fix, which never had
   anything to do with the typewriter. SC3 owns the option's return. */
```
