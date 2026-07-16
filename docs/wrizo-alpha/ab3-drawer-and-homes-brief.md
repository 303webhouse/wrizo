# AB3 — the Drawer and the Homes (build brief · v1)

**Branch:** `ab3-drawer-and-homes` · off current `main`
**Authorized by:** `docs/wrizo-alpha/page-and-homes-canon.md` (RULED
2026-07-15 per Nick's build order; ratification record at the foot of
this brief — append it to the canon and flip its status line on
commit). Builds Laws 2, 3, and 4; Laws 5–8 are AB4/AB5/I1.
**Audience:** CC. Plain words lead; build dialect in the slices.

## Why

The space under every paper becomes desk again: everything about a page
— title, star, tags, where it lives, where to send it — moves into one
drawer of fixed size that flips its contents and slides like the real
thing. And the app's oldest unexamined assumption dies: the door the
writer came through sets a page's home. A screenplay born through a
project door never touches the Journal; a journal page sent onward
keeps its place in the Journal forever; a page started at the home base
is loose, and loose is a legitimate permanent home.

## S0 — the ticket's single schema addition, declared loudly

One new **nullable text column `origin`** on entries
(`'journal' | 'project' | 'loose'`), additive-only migration, mapped in
both sync directions (the S1 `script`-column precedent exactly).
**Grandfather clause (canon amendment A2):** every existing row stays
null; null means "behave exactly as today." No data migrates, no page
moves, nothing is re-homed. The provenance law governs creation from
this ticket forward only. Everything else in this brief is zero-schema.

## Scope (slices)

- **S1 — the Drawer.** One component in DeskFrame's existing toolrail
  track: fixed geometry (the track's current width; per-theme constant),
  a face registry — `tools` (default) · `page` · `place:<journal|shelf|
  drawers>` — and the slide (a short translate/opacity flip; no
  geometry change ever). AB2's ToolRail becomes the `tools` face's
  content verbatim — compose, don't rebuild; nothing ToolRail learned
  is thrown away. Every string rides `deskLexicon`. The rail gains the
  **Page** pull above a separator, Places below (Plan joins in AB4).
  The whole drawer carries the vanishing law like every zone.
- **S2 — the Page face.** Title (wires the existing rename), star,
  tags (the existing tag store), **Where it lives** — the page's home
  plus every membership, told truthfully — and the sending verbs
  wiring the existing pipes: Move to… / Copy to… (the Add-to grammar),
  Port to a Board. The saved-silently line becomes the drawer's quiet
  footer, its only appearance anywhere. **Canon amendment A1 (build it
  so):** the Page face describes the thing under the writer's
  attention — on a page, that page; at a wall (AB4), the selected item,
  or the wall itself when nothing is selected. Structure the face's
  data source as `subject`, not `currentPage`, so AB4 plugs in without
  surgery. **Erratum (Fable review, 2026-07-15):** the "wires the
  existing rename" assumption is withdrawn — no stored title field or
  rename pipe ever existed; a page has always titled itself by its
  first line, which the build correctly kept. A stored title, if ever
  wanted, is its own future schema question.
- **S3 — the space under the paper becomes desk.** On framed surfaces,
  the below-page metadata clusters (JournalEntry's and PageEditor's:
  timestamp row, action row, star, tag row, the autosave sentence)
  unmount — superseded by the Page face, parked not deleted; below the
  gate, byte-identical legacy. What remains under the paper: nothing.
  The meter track stays empty and reserved.
- **S4 — creation flows: the doors set the home.** Enumerate every
  door and pass an origin: Journal / Catch → `journal` (homes in the
  Journal; the file-it-first prompt survives here and only here);
  project doors (new page, new screenplay from a project) → `project`
  (homes in that project; **the Journal never sees it** — no journal
  listing, no journal count); the Desk's start-writing / home-base
  door → `loose` (homes nowhere; the Page face reads "Loose — belongs
  nowhere yet," and starting there never files it). Journal furniture
  returns per Law 2: the `tools` face for journal-origin pages carries
  the timer readout, the quiet progress bar, typewriter, ink, and the
  forward lock (the parked components re-mount here — their ruled
  home); non-journal pages' tools faces carry none of that furniture.
  M1's coverage-never-verdicts law governs the furniture unchanged.
- **S5 — the Journal forgets nothing.** Journal views (list, notebook
  nav, counts) include every `origin == 'journal'` entry regardless of
  its current home. A filed journal page appears in both places; the
  drawer's Where-it-lives tells both truths. Null-origin entries keep
  today's behavior exactly (A2). No badges, no indicators in lists —
  the drawer is where the truth lives (anti-solicitation). **Erratum
  (Fable review, 2026-07-15):** "notebook nav" overspecified — the
  Spread's prev/next flip-through is the loose notebook's own sequence,
  not part of the Journal's memory; the Journal's memory is the list,
  the count, and the truthful drawer (Ruling 3, one-order-surface
  principle). Nick-vetoable at the device look.
- **S6 — the Places faces.** Journal, Shelf, and Drawers on the rail
  open as drawer faces while a page is mounted (the absorbed canon's
  reach law): the place's contents, three verbs — Open (travel, way
  back guaranteed) · File/Send (the Add-to grammar inward) · Peek
  (stub for AB4's open-beside; render the verb disabled-quiet with no
  greyed ceremony) — and the honest door at the foot: Go to the Room.
  Guardrails are law: a keystroke dissolves the face with the room;
  faces run one level deep; no counts, no badges, no orange at rest.
  Away from a page, the rail travels exactly as today.
- **S7 — harness (`ab3.mjs`) + dispositions.** Assert at minimum:
  drawer geometry floor (the track's rect identical across every face
  flip — the ab2.1 lesson applied to the new component from day one);
  face flips (tools→page→tools; place faces) with contents correct per
  face; origin per door (create through each of the three doors,
  assert the stored origin and the home); the Journal-forgets-nothing
  view (file a journal-born page to a project, assert it lists in
  both); a project-born page never appears in journal views; the
  loose page's drawer text; metadata absent under framed papers and
  present in legacy below the gate; the drawer dissolves on keydown
  and resurfaces on edge-dwell; A1's subject wiring (face re-renders
  when the subject changes); the saved-silently footer exists only in
  the drawer. Park (never delete) any ab1/ab2 checks this design
  supersedes — the toolrail-content checks and the below-page metadata
  assertions — with the quoted-history + opposite-re-assertion species
  from the ab2 precedent, and name the species per the AB2 review's A4.

## Non-goals

The wall, threads, double-click travel, the pinned-card glance, and
Peek's real behavior (all AB4). Sheets (AB5). Images and Publish
assembly (I1). Drawer progressive-disclosure toggles (the detail pass,
per Nick's deferral). Library. Mobile <1100px untouched everywhere.
Any rename of the historical `journal entries` data-model naming.

## Invariants

One declared schema addition (S0); zero beyond it. Substrate otherwise
untouched. Geometry floors from day one on every new surface. The
vanishing law covers the drawer. Anti-solicitation everywhere: loose
pages are never nudged to file; empty states never beg. Two-regime
orange + the olive law (the drawer's active pull wears
`--accent-rest`). The paper constant: nothing in this ticket touches
the page's measure or dress. Tutor never ghostwrites — no AI anywhere
here. Copy-out and the Voice Wall untouched.

## Definition of done

`tsc` ×2 + `build:web` + selftest + full suite green + `ab3.mjs` green
with the new geometry floors. The lived tests: a screenplay born
through a project door that the Journal has never heard of; a journal
page filed to a project that still turns up in the notebook; a loose
page that stays loose without a single nudge; one drawer that never
changes size no matter what it's showing; and nothing — nothing —
under the paper. Report = push; Fable review per the compressed
rhythm; Nick's look folds into the AB gates.

---

## Ratification record — CC: append this block to
## `docs/wrizo-alpha/page-and-homes-canon.md` on commit and flip its
## status line to RULED (Nick's word, 2026-07-15)

> **Ratification record (double pass, Experts + Architects,
> 2026-07-15).** Ratified with two amendments. **A1 — the drawer's
> subject:** the Page face describes the thing under the writer's
> attention (the page at the page; the selected item at the wall; the
> wall itself when nothing is selected). **A2 — the grandfather
> clause:** existing pages keep their homes exactly; the provenance
> law governs creation forward only; the `origin` field is the canon's
> one declared schema addition, null for all history. Riders folded
> into build briefs: the sheet-turn must never steal the caret or
> perceptible time; silent turnover is truly silent; wheel-turn gets
> keyboard equivalents; sheet editing cost must not scale with
> document length; threads link by id, never by position; M1's
> coverage-never-verdicts governs returning journal furniture; the
> "loose forever" clause is load-bearing and may never be eroded by
> filing nudges. Recorded finding: Law 8 is the smooth/striated
> distinction made literal — the typewriter stream and the settled
> sheet are two inhabitations of the same space, toggled at will.

— Fable, 2026-07-15
