# FX9 — the Folded Lists · Fable's post-merge review · 2026-07-23

**Ticket:** FX9 (item 49). Merged `a1d2db5`, deployed in the mega-deploy.
**Method:** all product code read whole — `sectionFold.ts` (97 lines),
the `CascadePanels.tsx` fold integration (143 lines), the CSS (50 lines).
The `fx9.mjs` harness (593 lines) taken at record depth, disclosed: its
merge review reported GREEN zero defects, and my independent read of the
complete product surface concurs, so the harness was not re-read line by
line. This is the only artifact in the five-review sweep taken at that
depth, named here so the sweep's own record is exact.

## Verdict: GREEN. Zero defects found on independent read — concurring with the original review. Close pends Nick's sitting sweep (agenda item six: fold, navigate away, return — folds persist; headers carry no counts).

## The no-counts law — holds STRUCTURALLY, and further than asked

The fold header renders exactly two children: the title span and an
`aria-hidden` chevron span. No count, no badge, nothing else — "the
header carries its own name and its chevron, that is all it carries."
And the law is extended into the accessibility tree, not just the paint:
the collapsed body stays mounted (so the height animation is real) but
goes genuinely `inert` (set imperatively via ref — the FirstRunGate
precedent for the @types/react gap) plus `aria-hidden`, so collapsed rows
are neither keyboard-focusable nor announced. A screen reader hears the
same quiet the eye sees.

## Id-keyed persistence — S2's rulings honored verbatim

`sectionFold.ts` is "memory, without schema": one localStorage key
holding a map, module cache, subscriber set, try/catch on every touch —
the firstRun/tutorDisclosure family, extended to a map because sections
are an unbounded dynamic set. Keys are stable and content-independent:
`drawersProject:<id>` (a rename must not forget the fold — the ruling,
implemented literally by riding the same `projectId` the cluster map
already groups by), fixed literals for the singleton sections. The
sovereignty model is exactly right: an explicit choice, once made, wins
forever; an untouched section recomputes the count default (>6 collapses)
**fresh each render**, so a list that grows past six after the writer
last looked still degrades sensibly instead of freezing its first paint.
Inert keys rot with no reaper — the ruled non-goal. The JournalPanel's
in-code honesty is worth noting: Recent caps at five, so the >6 default
can never fire there, and the comment says so rather than implying
coverage it doesn't have.

## The rest, verified

Zero server files, zero schema. ONE `FoldSection` component — the fold
grammar is a single law, not a per-panel judgment call. The whole header
is a real full-width `<button>` (the hit target is the row, never the
chevron alone). The chevron is quiet olive at rest AND hover — never
brass — with a correctly-reasoned exception left in place: the keyboard
focus ring stays site-brass because focus is this app's established
*evental* state ("olive marks where you are, orange marks what you do"),
and the at-rest law governs resting and hovered chrome, not events. The
height animation is the grid `0fr/1fr` technique — real natural height,
no JS measurement, no max-height guess — with reduced-motion dropping
straight to the edge. `data-*` attributes written as explicit strings,
`aria-*` as raw booleans, each matching its own named in-repo precedent.
The empty Loose group renders no fold at all (`length > 0` guard) —
never an empty hinge. The title span keeps its pre-existing class so
every older harness query that reads header text still reads exactly the
title, chevron excluded — cascade-avoidance by construction.

## ADVISORY — one line for the canon

`sectionFold.ts` has become the head of a family: `boardMode.ts` (BM1)
already copied its shape verbatim. Record it in the app-bones canon as
the house pattern for client-local, zero-schema, per-entity UI memory —
one key, a map, stable content-independent ids, sovereign explicit
choice over a fresh-computed default, inert rot, no reaper, a window
seam. Future tickets cite it instead of re-deriving it.

## Close condition

Nick's sitting sweep. Then item 49 closes — and with it, all five owed
post-merge reviews of the mega-deploy are on the record: E1 (AMBER,
E1.1 directed), FX10 (GREEN w/ advisories), BM1 (GREEN w/ advisories,
independent eye closed), J6 (GREEN w/ advisories), FX9 (GREEN).

— Fable
