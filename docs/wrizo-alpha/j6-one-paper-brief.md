# J6 — One Paper · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/j6-one-paper-brief.md`.
**Branch:** `j6-one-paper` off `main` (post-FX8/M2 deploy), own worktree
per ONE CHECKOUT PER AGENT. **Sequencing:** FX9 (the Folded Lists) may
run in parallel in its own worktree — no surface overlap (cascade menu
chrome vs. routing/geometry substrate).
**Authority:** item 41 finding 1 (Nick's second sitting — "Journal's New
Page routing," really "should `JournalEntry.tsx` exist as its own
writing surface"), Fable's ruling of 2026-07-21 that it becomes J6, and
this brief. **ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge
pre-authorized as zero-schema per the AB4 precedent; Fable reviews
post-merge. Report = push; deploy is Nick's separate word.

## Why this shape — read before building

The literal finding is one `navigate()` call. The real finding is that
**the app has no single source of routing truth**, and that fixing it
properly requires evidence this ticket does not yet have. Verified in
code before this brief was written:

- `/journal/:id` → `JournalEntry.tsx` (1,288 lines); `/page/:id` →
  `PageEditor.tsx` (733 lines). Two maintained writing surfaces, both
  with full framed `DeskFrame` branches.
- The route-choice predicate `entry.pageType != null ? '/page/' :
  '/journal/'` is **duplicated verbatim in at least four places**:
  `BoardEditor.tsx`, `CascadePanels.tsx`, `ProjectHome.tsx`, and
  `JournalEntry.tsx`'s own redirect guard — plus unconditional
  `/journal/` navigations in `Spread.tsx` and `CascadePanels.tsx`.
- **Two "New Page" doors already land on different surfaces:** the
  cascade's Page-section door (`createLooseHomePage` → `/page/:id`) and
  the Journal's own (`createLoosePage` → `/journal/:id`). That is the
  incoherence Nick felt.
- **No membership risk exists in a route change.** `createLoosePage`
  already sets `origin: 'journal'`, and `inJournalView` derives Journal
  membership from `origin` and `projectId` alone — never from which
  route opened the entry. Verified in `persistence.ts`.
- **PageEditor holds capabilities JournalEntry lacks** (the mode system,
  `ForwardOnlyEditor`, draft formatting, the first-run gate, the
  Board/Script delegates) and **JournalEntry holds capabilities
  PageEditor lacks** (ink, `useChromeDissolve`, `JOURNAL_HOLD_BAND`
  typewriter fade, the unframed incentive row, `AddToSheet`, the
  sprint/quick-project machinery).

**Therefore this ticket deliberately does NOT flip the predicate.** It
makes the flip a one-line change and produces the document that says
what the flip costs. Briefing the surgery today would mean guessing at
that last bullet, and a guess is not a brief.

## S0 — records first
Ledger: open J6's item (this brief; the scope ruling above; item 47
folded in as S1 with its own item cross-referenced and closed on merge).
Commit this brief.

## S1 — the geometry substrate (item 47's fix)
`store/deskFrameActive.ts`'s `active` flag can go transiently stale
across an in-app navigation that revisits a framed route without a full
reload, so `App.tsx`'s `.app-main[data-desk-frame-active]` DeskRail
gutter (a 64px reservation) can hold a value a fresh mount would not
compute — shifting any absolute stage/paper rect read during that window
by a constant horizontal offset with no actual layout change. Fix it
at the source: the flag must be recomputed/synced on route change, so a
navigated-to framed route measures identically to a freshly-mounted one.
**This lands FIRST because S2's whole subject is navigation across
framed routes** — J6 cannot honestly prove geometry on a substrate that
goes stale on exactly the transitions it touches. Reproduce before
fixing (a bare `App.tsx`/`DeskFrame.tsx` repro exists in M2's build
report), then prove the fix against that same repro. On merge, item 47
closes and `m2.mjs`'s Section A shape-normalization workaround gets a
one-line comment noting the substrate is now sound — **but do not
rewrite that check to absolute coordinates this ticket** (A4 discipline:
its intent didn't change).

## S2 — `routeForEntry`: one source of routing truth
Add `routeForEntry(entry): string` to the store (its own small module or
`pageHome.ts` — builder's call, disclosed), implementing **exactly
today's predicate, byte-for-byte**: `pageType != null → /page/:id`,
otherwise `/journal/:id`. Replace every duplicated inline predicate with
a call to it: `BoardEditor.tsx`, `CascadePanels.tsx`, `ProjectHome.tsx`,
`JournalEntry.tsx`'s redirect guard, and every unconditional
`/journal/${...}` navigation that is *choosing* a surface for an
arbitrary entry (`Spread.tsx`'s `openPage`, `JournalEntry.tsx`'s own
neighbour navigation). **Leave alone** the calls that are not choosing —
a freshly-created board or script page navigating to its own known
route is not a predicate and must not be laundered into one.
**This slice changes no behavior.** Any diff in where a given entry
lands is a defect, not an improvement, and is STOP-and-report. The
prize is that the flip becomes one line in one file.

## S3 — the parity census (the ticket's real deliverable)
Author `docs/wrizo-alpha/j6-parity-census.md` **from the code, not from
this brief's summary**: every capability `JournalEntry.tsx` provides
that `PageEditor.tsx` does not, and vice versa. For each, record: what
it is, where it lives, whether an equivalent exists on the other side,
and a recommendation of **port-now / port-later / retire / needs its own
ticket** with one sentence of reasoning. Known starting set (verify and
extend — this list is a floor, not a ceiling): ink (`store/ink`,
strokes, eraser), `useChromeDissolve`, `useTypewriterFade`'s
`JOURNAL_HOLD_BAND`, the unframed incentive row (`ProgressBar` /
`AmbientGlow` / `TypewriterToggle`), `AddToSheet`, the
sprint/quick-project machinery (`setProjectSprintText`,
`createQuickSprintProject`), and — the other direction — the mode
system, `ForwardOnlyEditor`, draft formatting, the first-run gate, the
Board/Script delegates. Close with a plain statement of what the flip
would cost today and what must land before it. **No code changes in
this slice.** This document is what J7 gets briefed from.

## S4 — harness (`j6.mjs`) + the bar
S1: the stale-gutter repro fails before the fix and passes after
(reproduce-then-fix, the FX7-ratified standard); an absolute paper-rect
read taken after an in-app navigation to a framed route equals a
fresh-mount read of the same state, at 1100 (floor, mandatory) / 1280 /
2200. S2: **behavioral identity** — for a representative entry of every
kind (plain prose, journal-homed loose, binder manuscript, board,
script, missing/deleted), `routeForEntry` returns exactly the string
today's inline predicate returns; and every migrated call site is proven
to still land on the same surface via real navigation, not by reading
the helper twice. Every existing door re-proven unregressed: the
Journal's New Page, the cascade's Page-section New Page, a board pin's
double-click travel (FX7 S5), a ported card's travel (FX5 S3), and
`JournalEntry`'s own `pageType` redirect guard. Legacy (<1100px)
unchanged. Park sweep per A4 with live successors. Full suite green,
both `HARNESS_PARKED` settings. `tsc` ×2, `build:web`, selftest.

## Non-goals
Flipping the routing predicate; retiring `JournalEntry.tsx`; porting
ink or giving it a page-kind home (its own ticket, briefed off S3);
migrating existing journal entries; the sprint machinery; the
StructureWizard/BeatWizard fate (still parked); FX8's `isDragging`
cleanup one-liner (named in the ledger, different surface).

## Invariants
Page is Primary; B1's derived Journal membership untouched (`origin` is
the key and stays the key — no route change may alter what
`inJournalView` returns for any entry); zero schema, zero server files,
zero deps; both-reference-widths + the 1100 floor on every geometry
assert; legacy <1100 byte-identical; every string through deskLexicon;
A4 parking with live-successor pointers; report = push.

## Definition of done
Nick, after merge and his deploy word: navigates between framed pages
and the paper sits where it has always sat, measured or eyeballed;
every door in the app still opens exactly the surface it opened
yesterday, because that was the point; and on disk there is a document
that answers, from the code rather than from anyone's memory, the
question he actually asked at the sitting — whether `JournalEntry.tsx`
should exist at all, and what it would cost to find out. Nothing moved
for the writer. Everything moved for the next ticket.

— Fable, from item 41 finding 1, 2026-07-21
