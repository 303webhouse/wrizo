# SC2b — the finish map · handoff dossier · 2026-07-25

**Place at:** `docs/wrizo-alpha/sc2b-finish-map.md` (records lane).
**Pattern:** the M4/BG1 dossier, which has now worked twice.
**Branch:** `sc2-the-clock` @ `a2706d3`, pushed, nothing in flight.
**Parent:** `main` @ `3e83f4c` (SC1's merge).
**Authority:** `sc2-the-clock-brief.md` + Amendments 1 and 2 + Fable's rulings
of 2026-07-25, all on ledger item 62.

## What is already built (do not rebuild)

| commit | slice | state |
|---|---|---|
| `c1cabe8` | **S0** — the baseline instrument | **FROZEN BASELINE SHA.** n=240 × median-of-3, 928-element fixture + 232-element control, correctness gate, `SC2_TIMING=1` split |
| `1a759c4` | **S1** — the line ledger + vertical rhythm | 44/44 suite both settings, zero failures |
| `447dd8d` | **S2a** — the paginator (projection) | pure, 11 properties green |
| `a2706d3` | **S2a.1** — `paren` ruled, `transition` deferred | 13 properties green |

`tsc` ×2 EXIT 0 and `build:web` clean at HEAD.

## The exact files and line regions S2b touches

**`apps/desktop/src/components/ScriptEditor.tsx`**

- **L693–719 — `const scriptSheet`, the element loop.** This is the whole of
  S2b's render change. Today it maps `elements` into one `.script-sheet`. It
  must become a map over `paginate(lineLedger(elements))` → one `.script-sheet`
  per `Page`, each rendering that page's `placed[]`. **The elements array stays
  the edit model; pages are the projection.** Nothing about pagination may be
  stored, put in state, or persisted.
- **L695 `elements.map((el, i) => {` and L716 `onActivate={(x, y) => activateAt(i, x, y)}`.**
  The index `i` is a DOCUMENT index and must stay one — `activateAt` addresses
  the flat array. When the loop becomes per-page, the document index must be
  carried through, not recomputed from the page-local position.
- **L93–104 — `elementStyle(t)`.** Pure function of the element type; leave it
  that way (see the S5 seam below). It already emits
  `marginTop: calc(var(--script-line) * N)` from `SPACE_BEFORE`.
- **L150–L172 — `ActiveScriptElement`, and L166 `node.focus()`.** This is the
  root cause of the vertical behaviour (see the charge below).
- **L768 — `<div ref={scrollCapRef} className="desk-frame-scroll-cap" data-typewriter="false">`.**
  The scroll cap. Rendered by `ScriptEditor` alone; the sheet sequence lives
  inside it.

**`apps/desktop/src/index.css`**

- **L1643 `.script-sheet{ … }`** — the page box (51em × 66em, `min-height`,
  padding `6em 6em 6em 9em`, `font-size:min(1rem, calc(100cqw / 51))`). S2b
  needs each sheet in the sequence to be `height` (not `min-height`) so pages
  are uniform, plus the inter-sheet gap.
- **L1686 `.script-sheet{ --script-line:1em; }`** — the line unit. Do not
  express the gap in px or em; it is chrome, not body, so it must not be a
  multiple of `--script-line` either (see cross-check 3).
- **L1687–L1693 `.script-el{ … }`** — `white-space:pre-wrap`,
  `overflow-wrap:anywhere`, `hyphens:none`, `min-height:1em`. The ledger's
  arithmetic depends on all four; `sc2.mjs` asserts them.
- **L1705 `.script-sheet > *:first-child{ margin-top:0 !important; }`** — the
  document-start suppression. **When sheets become a sequence this selector
  automatically becomes per-page**, which is exactly right (it is the same rule
  the paginator applies at every page top). Verify that rather than assume it —
  if the per-page wrapper changes the DOM shape, this selector may need to
  follow it.
- **L1591 `.script-page{ container-type:inline-size; }`** — the container query
  the scaling law resolves against. Unchanged; the sequence lives inside it.

**New, already written, imported by nothing yet:**
`src/store/scriptLedger.ts`, `src/store/scriptPaginate.ts`.
S2b's render importing them is what makes them reachable from the bundle — and
that is what converts the thirteen properties from a scratch memory into
coverage.

## THE S5 MEMOIZATION SEAM — name it before designing the render

S5 must turn `StaticScriptElement` into a memoized component. That only bites if
**both** its props stop changing identity every render (Amendment 2, ratified):

1. **`elementStyle(t)` must become one FROZEN object per element type**,
   precomputed at module level — same object identity for two elements of the
   same type, not two equal objects. It is already a pure function of the type,
   which is why it must stay that way. **Do not make it a function of position,
   page, or index in S2b.** If S2b needs a page-top variant, express it in CSS
   (as L1705 already does), never by branching the style object.
2. **`onActivate` must stop being a per-index arrow closure** (L716). S2b is
   rewriting that exact line. **Write it as a stable per-element callback now**
   — the cheapest shape is a single handler on the sheet reading a
   `data-doc-index` attribute, which is stable by construction and removes the
   closure entirely.

**The trap this exists to prevent:** a per-page render that closes over the page
object, or a style that varies by page position, is something S5 would have to
undo. Design the loop so S5 is an edit, not a rewrite — the same argument as the
declarative break table.

## The thirteen properties (currently scratch-only — make them permanent)

They exist today only as a scratch harness, which by Amendment 2's own principle
is **a pre-commit gate, not coverage** — *proof lives where the thing it proves
lives; a check that isn't in the repository is a memory of a check.* All
thirteen become `sc2.mjs` assertions in S2b, the moment the render imports the
modules.

Current forms, verified green at `a2706d3` (`lineLedger` from `scriptLedger.ts`,
`paginate`/`BREAK_RULES` from `scriptPaginate.ts`):

1. a single element projects to exactly 1 page
2. 53 lines → 1 page
3. 55 lines → 2 pages
4. **no page ever exceeds 54 lines** (the derived body: 66 − 6 − 6)
5. a **scene heading** is never last on a page
6. a **character cue** is never last on a page
7. a **parenthetical** is never last on a page (ruled 2026-07-25)
8. an **over-page action splits** across pages (`continues` true on the first part)
9. **dialogue never splits** — SC2.1 owns that row
10. the **first element of every page contributes zero space** (`spaceBefore === 0`)
11. **deterministic** — same input, byte-identical output
12. **every element placed exactly once** — none lost, none duplicated
    (filter `!continuedFrom`, compare count and Set size against ledger length)
13. **idempotence** — `paginate()` twice is byte-identical, AND paginating a
    ledger whose page-one content is unchanged leaves page one identical. This
    is the property that makes "derived, never stored" safe in practice: the
    sequence recomputes on every keystroke, so hidden state would surface as a
    page that quietly rewrites itself while the writer types above it.

## The four rendered cross-checks (one per width/theme leg)

The pure function proves the arithmetic is viewport-invariant — **necessary and
not sufficient. It cannot catch the render disagreeing with the arithmetic at a
given width.** So at each of the four legs (`1100`, `1280`, `2200`, legacy
`1000`, plus the Flux leg `sc1.mjs` already runs):

1. **rendered sheet count === `paginate(ledger).length`**
2. **a mid-document element's rendered sheet index === its index in the
   projection** (pick an element ~60% through the document, find which
   `.script-sheet` contains it, compare)
3. **the inter-sheet gap is chrome and never body** — the gap between sheet N's
   bottom border and sheet N+1's top border contains no `.script-el`, and no
   element's rect straddles a sheet boundary
4. **page N's first line sits at the same offset within its sheet as page 1's**
   — `firstEl.top − sheet.top` equal across all sheets, within 1px

Same shape as S1's wrap asserts: **arithmetic as truth, rendering checked
against it.**

## The `sc1.mjs` height park — the most consequential park the SC arc will make

**The predecessor** (`sc1.mjs`, S1 section, four width/theme legs):

> `S1 @ ${label}: the sheet is a US Letter page — 8.5 x 11in, aspect within 0.5% of 8.5:11`
> `Math.abs(m.aspect - ASPECT) / ASPECT < 0.005 && Math.abs(m.width - PAGE_W) <= 1 && Math.abs(m.height - PAGE_H) <= 1`

A sequence of sheets falsifies it on its NUMBER (there is no longer *one*
sheet), while its LAW — a page is 8.5 × 11in — is not merely intact but
**multiplied**.

**The successor must end with MORE proof than it started** (Fable, 2026-07-25 —
a park that trades one assertion for a weaker one is how coverage erodes
quietly). It asserts:

- **every sheet in the sequence** is 816 × 1056px (not just the first)
- **uniform across the sequence** — no sheet differs from any other
- at **all four width/theme legs**, as the predecessor did
- plus the two truths the old check could not reach:
  **the inter-sheet gap is chrome and never body**, and
  **page N's first-line offset within its sheet equals page 1's**

Park it per the codicil: original quoted **verbatim**, retirement/supersession
stated in words, generation nested rather than overwritten, successor named —
in the **same commit** as the change that falsifies it. `cd1.mjs` is the
textbook; SC1's own five cycles are the recent precedent.

## The `transition` row — deferred, with its shape already decided

Ruled: **`keepWithPrevious`** — a transition orphaned onto a fresh page, away
from the scene it ends, is the mirror of a stranded heading. Deferred from S2a.1
deliberately, and the reason is the requirement:

Every other rule pulls an element **forward** off a page foot. This is the only
rule that reaches **backward**. Mixing directions in one fix-up pass is where
oscillation lives, and `paginate()` runs on every keystroke — an oscillation is
not a wrong page count, it is a frozen editor.

**The required shape:** push the PREVIOUS page's last element **forward** to
join the transition at the top of its page; never pull the transition back. Every
move stays forward-only.

**The monotonicity requirement — this is the acceptance condition.** The fix-up
pass must have a strictly decreasing measure (e.g. the sum over elements of
their page index cannot decrease, and each move strictly increases it), so
termination is proven rather than hoped. **Land the row WITH that proof as a
harness property** — a fixture engineered to trip both rules at once (a
transition at a page top whose previous page ends on a scene heading) must
terminate and produce a stable result. If the proof does not come out clean,
defer the row again and say so; do not ship a cap or a retry limit, which is the
smell that hides an unproven loop.

## The vertical-policy charge (Fable, 2026-07-25)

**The script page's vertical behaviour is currently EMERGENT, not designed.** The
scroll is a side effect of `ActiveScriptElement`'s `node.focus()` (L166) —
focusing an element below the fold scrolls it into view, and every Enter mounts
and focuses a new one. **Nobody ever decided it**, which is why it broke on
SC2 S1, a change that had nothing to do with scrolling (see the `sc1.mjs` S3
park, `1a759c4`).

**S2b's paginator owns the page's vertical policy deliberately:**
`focus({ preventScroll: true })` plus a **stated** caret-visibility rule that
S2b needs for page breaks regardless. Write the rule down in the file as a rule,
not as behaviour that emerges. The existing `sc1.mjs` S3 successor already
asserts the current truth (the box holds still while the caret is visible,
moving only to keep it so) — S2b's policy must keep that assertion true by
intent rather than by accident.

**Open sitting question for Nick, on the ledger, awaiting his word:** *does the
caret sitting flush at the bottom edge want breathing room?* Do not answer it in
code; Fable folds it into the sitting agenda.

## Standing invariants for S2b

Guard-rail (`git rev-parse --show-toplevel`) before every commit; one worktree;
grep `scripts/harness/` before changing any value; **A4 park cycles travel in
the SAME commit** as the change that falsifies them, originals verbatim,
generations nested, retirements marked RETIRED in words; trusted CDP pointer for
gesture claims; `tsc` ×2; `build:web`; **full historic suite BOTH
`HARNESS_PARKED` settings, read to completion in the MAIN LOOP** (44 files at
handoff), orphaned `--headless` browsers swept before and between passes; report
= push. **Merge is chat 1's lane; deploy is Nick's separate word** — SC content
may now ride a shared deploy provided the manifest enumerates both arcs by name
(amended 2026-07-25).

**The re-run standard:** mechanism check FIRST (walk the blast radius), then
**batch-then-batch-again** — re-run under the conditions that produced the
failure, never isolation as a first move. **`j5.mjs`'s clearance is rescinded:
the next lane that sees `j5` red REPORTS IT AND DOES NOT RE-RUN.**

**The two things most worth getting exactly right** (Fable's own words): the
**54-line body, not 55**, and **viewport invariance** — a page count that moves
with the window is a clock that lies.

— CC (SC lane), handing off at the S2a/S2b seam, 2026-07-25
