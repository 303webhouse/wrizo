# SC2 — the Clock · build brief · 2026-07-25

**Place at:** `docs/wrizo-alpha/sc2-the-clock-brief.md` (records lane).
**Ticket:** SC2, second of the SC arc. **Owner: CC (SC lane), its own
worktree** (`C:\Users\nickh\wrizo-sc1` or a fresh one) — branch off
`main` **after SC1's merge lands**; guard-rail (`git rev-parse
--show-toplevel`) before every commit. **Zero schema, zero server
files, zero new deps.** Merge rides the zero-schema pre-authorization
through chat 1's serialized lane; Fable reviews post-merge
(`sc2-review-fable.md`); deploy is Nick's separate word on SC's own
manifest. **A fix ticket** — it completes SC-V3 and is freeze-lawful.

**Authority:** SC-V3 (Nick's verdict: "1 page roughly equals 1 minute of
screen time — our screenplay page needs to comport to those standards"),
the committee's Pass One standard, and **R1 as approved 2026-07-24**
(page numbers as document furniture).

**What SC2 is NOT:** no `(MORE)`/`(CONT'D)` (SC2.1), no dual dialogue,
no title page, no tool strip or door (SC3), no Tutor work (SC4), no
revision colors or locked pages ever. Do not touch the prose editor,
the Tutor's rails, or `scriptKeys.ts`.

---

## The arithmetic (derive it, do not retype it)

SC1's derivation is the foundation and SC2 adds no second table. At
12pt, `1in = 6em`, `1ch = 0.6em`, `line-height: 1` = one line per em.

```
sheet            66em          (11in)
top margin        6em          (1in)
bottom margin     6em          (1in)
=> text block    54em  =  54 LINES per page at 6 lpi
measure          36em  =  60ch
```

**The body is 54 lines, not the committee's "~55."** The committee
pinned an industry approximation; SC1's derivation is exact and
internally consistent, and consistency is what makes the clock
trustworthy. 54 is the number. Record the discrepancy in the commit
rather than silently choosing.

**Every element width and indent comes from `store/scriptMetrics.ts`** —
the single source SC1 verified as already exact. If a width SC2 needs
isn't there, add it there and nowhere else.

## The invariant that governs everything

**Pagination is viewport-invariant.** Because SC1's scaling law moves
the whole sheet as one object, every measurement in the line math is in
`em`/`ch` and therefore identical at 1100px, 2200px, and a 700px room.
**The same document must produce the same page count and the same break
positions at every width and on every theme.** A page count that moves
with the window is a clock that lies. This is SC2's central claim and
`sc2.mjs`'s central proof.

## The slices

**S1 — the line ledger.** A pure function from the script doc to line
counts: for each element, lines = `ceil(text.length / widthInCh)` at
that element's own measure (never the page's), minimum one line, plus
the inter-element blank lines the renderer already applies. Derive
spacing from the existing render rather than inventing a table; if the
current spacing departs from the trade standard, **name the departure in
the commit and fix it here** — this is the ticket that owns vertical
rhythm. The ledger is pure, synchronous, and testable without a browser.

**S2 — the sheet sequence.** The script surface stops being one sheet
that grows and becomes **a sequence of 66em sheets** — the house's own
primitive, derived and never stored (nothing about pagination enters the
doc, the store, or the server). The last page is a full sheet with
empty remainder, not a stub. A visible gap between sheets, consistent
with how the house renders paper.

**S3 — the break rules.** Elements flow into pages by the ledger, with:
- **A scene heading is never the last line of a page** — it travels
  whole to the next page.
- **A character cue is never the last line of a page** — it travels with
  its dialogue (the Half-Hour Writer's ruling).
- **No element splits in SC2.** An element that does not fit moves
  whole. **Disclose the cost honestly in the commit:** because dialogue
  cannot break, page counts will run slightly long against Final Draft
  until SC2.1 lands `(MORE)`/`(CONT'D)`. That is a known, named
  approximation of the clock — not a silent one.
- An action block longer than a full page is the one permitted split
  (it cannot move whole); break it at a line boundary.

**S4 — page numbers (R1, as approved).** Top-right, inside the top
margin, **page one bare**, from page two on. **The bright line is
binding and must be provable:** the number lives on the page artifact
only. No total, no "of N", no page count anywhere in the app — not in
the sliver, not in the Tutor, not in a title attribute, not in
`aria-label`, nowhere. `sc2.mjs` asserts the absence as strictly as the
presence.

**S5 — the caret across the break.** Typing at the bottom of a page
flows to the next sheet **without losing focus, selection, or the
caret's visual position**. Prove it under a genuinely trusted CDP
pointer with real per-character keystrokes: type continuously across a
page boundary and assert the caret survives and the writer's text is
intact. **Performance floor:** pagination recomputes on every keystroke
in the current architecture — memoize so only affected pages re-render,
and assert a typing-latency ceiling on a document of at least 20 pages.
A clock that stutters under the hands is a defect.

**S6 — `sc2.mjs` and the park cycles.** Rendered-geometry floor from day
one, at both reference widths, both `HARNESS_PARKED` settings:
- the 54-line body proven by measurement, not by reading the constant;
- **viewport invariance** — an identical fixture paginates to identical
  page count and identical break positions at full size, at 2200px, and
  in a 700px room;
- each break rule proven by a fixture engineered to trip it (a scene
  heading landing on line 54; a character cue landing on line 54);
- page numbers present from page two, absent on page one, and **no
  aggregate count present anywhere in the DOM**;
- S5's caret survival under trusted pointer and real keystrokes;
- a known-length fixture paginating to a known page count — the
  1-page-is-1-minute claim made assertable.

**Grep `scripts/harness/` first.** SC2 will falsify SC1's own
`min-height`/single-sheet assertions and anything asserting the script
sheet's total height. Every falsified check carries its lawful park
cycle **in the same commit** — original quoted verbatim, generations
nested rather than overwritten, retirements marked RETIRED in words,
successors named. `cd1.mjs` and SC1's own five cycles are the textbook.

**Untouched, and verify it:** E1's export path serializes text and takes
no pagination — assert it is byte-identical in output. Prose and Journal
must not move at all.

## DoD

Nick opens a screenplay and the page is a clock: pages are pages, the
count is the same at every window size, no scene heading dangles alone
at a page bottom, no character speaks from the foot of one page onto the
next, the numbers sit top-right from page two and nowhere else in the
app, and the caret crosses a page break without flinching. `tsc` ×2 and
`build:web` clean; `sc2.mjs` green both settings; full historic suite at
both settings read to completion in the main loop, orphaned `--headless`
browsers swept before and between passes. Report = push.

— Fable (SC line), briefing SC2, 2026-07-25
