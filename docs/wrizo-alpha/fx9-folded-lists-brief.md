# FX9 — the Folded Lists · build brief · 2026-07-21

**Place at:** `docs/wrizo-alpha/fx9-folded-lists-brief.md`.
**Branch:** `fx9-folded-lists` off `main`, own worktree per ONE CHECKOUT
PER AGENT. **Sequencing:** parallel with J6 is lawful — J6 owns routing
and geometry substrate, FX9 owns cascade panel chrome. If both touch
`CascadePanels.tsx`, first to merge wins the base and the other rebases.
**Authority:** item 41 finding 11 (Nick's second sitting — collapsible
list menus), Fable's ruling of 2026-07-21 naming it FX9 (renamed from
the FX8 collision per the ledger-item-claims-the-number rule), and this
brief. **ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge
pre-authorized as zero-schema per the AB4 precedent; Fable reviews
post-merge. Report = push; deploy is Nick's separate word.

## The finding, and the surfaces it lands on

The cascade's list-bearing panels grow without bound as the writer's
work accumulates, and a long list is a wall. Verified structure in
`CascadePanels.tsx` before this brief: `DrawersPanel` is the primary
case — it renders project-title **clusters**, each with its own item
list, plus a separate documents list; `JournalPanel` renders a recent
list; `ShelfPanel` and `TrashPanel` render their own. Those clusters
are already a section structure in all but name; this ticket gives the
name a hinge.

## S0 — records first
Ledger: open FX9's item (this brief; the four rulings below recorded;
the FX8→FX9 rename cross-referenced to item 45 so the number's history
is legible). Commit this brief.

## S1 — the fold
Every list-bearing section in the cascade's panels gains a **header
disclosure toggle**. Applies to: `DrawersPanel`'s per-project clusters
AND its documents list, `JournalPanel`'s recent list, `ShelfPanel`,
`TrashPanel`. Does NOT apply to `PagePanel`, `PlanPanel`,
`CascadeSettingsPanel`, or `CascadeThemePanel` — those are action
surfaces and short by construction; a hinge on a three-item action list
is chrome for its own sake.

Grammar, ruled:
- **The whole header is the hit target**, not the chevron alone.
- The chevron is quiet olive — a persistent door, so olive by the lane
  law; **nothing brass, nothing orange, at rest or on hover.**
- ~180ms, the house timing; `prefers-reduced-motion` toggles instantly
  with no height animation.
- Proper button semantics: `aria-expanded`, the header focusable and
  operable by keyboard, focus-visible honored.
- Every string through `deskLexicon`.

## S2 — memory, without schema
Open/closed state persists **per section, client-local only** — the
`store/firstRun.ts` / `tutorDisclosure.ts` shape (localStorage, never
schema, HB1 F3's own precedent). Keys must be stable and
content-independent: a project cluster's key rides its project id, never
its title (a renamed project must not forget its fold). A key for a
section that no longer exists is inert and may be left to rot — do not
build a reaper this ticket.

**First-ever default, ruled:** a section with **more than six items**
opens collapsed; six or fewer opens expanded. The number is deliberate
— a hand's worth of items reads at a glance and needs no hinge. Once the
writer has touched a section's toggle, their choice is sovereign and the
count rule never overrides it again.

## S3 — what a folded header may NOT say
**No counts. No badges. No dots. No "12 pages" on a collapsed header.**
A folded drawer that advertises how much is inside it is halfway to a
badge, and the room never knocks (A14's spirit; M1's
coverage-never-verdicts). The header carries its own name and its
chevron. That is all it carries. This is a design law for the ticket,
not a preference — a build that adds a count is STOP-and-report.

## S4 — harness (`fx9.mjs`) + the bar
Toggle behavior on every listed panel: header click collapses and
expands; the full header is the hit target (a click at the header's far
end from the chevron works); keyboard operation and `aria-expanded`
correctness. Persistence: a fold survives closing and reopening the
cascade AND a full reload; a project cluster's fold survives renaming
the project (the id-keyed proof). Default rule: a seeded seven-item
section opens collapsed on first ever view, a six-item section opens
expanded, and a writer's explicit toggle beats the count rule on the
next view. **Negative assertion, mandatory: no collapsed header anywhere
renders a numeral or a badge element** (S3's law, proven not assumed).
Nothing brass in the panel at rest. Reduced-motion branch. Geometry at
1100 (floor, mandatory) / 1280 / 2200: the cascade's own rect and the
paper's rect are unchanged by any fold or unfold — **folding a list must
never move the paper**. Legacy (<1100px) unchanged. Park sweep per A4
with live successors — expect existing cascade checks that assume an
unconditionally-visible list to need parking; park them, never edit
their intent. Full suite green, both `HARNESS_PARKED` settings. `tsc`
×2, `build:web`, selftest.

## Non-goals
Folding `PagePanel`/`PlanPanel`/settings/theme panels; search or filter
within a list; drag-reordering sections; a stale-key reaper; counts or
any other summary on a header (constitutionally out, not deferred); the
cascade's own open/close grammar (untouched); anything in J6's lane.

## Invariants
No at-rest affordances in the brass lane — olive for persistent doors;
A14's spirit (the room never advertises); M1's coverage-never-verdicts
extended to folded headers; every string through deskLexicon; zero
schema, zero server files, zero deps; both-reference-widths + the 1100
floor on every geometry assert; legacy <1100 byte-identical; A4 parking
with live-successor pointers; report = push.

## Definition of done
Nick, after merge and his deploy word: opens the Drawer and finds it
readable again — projects he isn't working in today folded quietly away,
the one he is working in open where he left it, and no number anywhere
telling him how much he hasn't done. Clicks a header anywhere along its
length and it folds. Reloads, and it remembers. Renames a project, and
it still remembers. The paper never moved.

— Fable, from item 41 finding 11, 2026-07-21
