# The Structure Spine — one Plan across the forms · committee plan

**Place at:** `docs/structure-spine-plan.md` · 2026-07-11 (noon session) · **Status: PROPOSED** (compact double-pass; awaiting Nick's ratification)
**Charter (Nick's word):** the project pipelines that walk writers through a story plan / character arc must integrate seamlessly with the main drafting pages, the screenplay module (S-arc), and every future form module (thesis/paper, feature article, book/novel, …) — first-class for **both plotters and pantsers**.
**Relationship to other canon:** companion to `docs/s-arc-screenplay-plan.md` (amended to v1.1 today) and a direct input to the queued **fragments-under-Pages pass** (open-threads #6). Same committee, same seats; the Screenwriter-in-residence sat in.

---

## 0 · The problem, named

The structure stack is story-shaped and half-seamed. What exists: **BeatWizard** (the guided story/character-arc walk) → **StoryPlan/StructureBoard** (the binder's Plan; Pages ↔ Plan toggle; `story_plans` with `beat_notes` jsonb, fully synced) → the **page seam** (`JournalEntry.beatId` + `routedProjectIds`, D2's "Foundation 3") → and as of yesterday **J5's Add-to sheet** (plan-link, chapter-append, board-append; every leaf tagged MOVES/COPIES/LINKS).

Three gaps stand between this and Nick's directive:

1. **Kind-blindness.** Beats and the wizard speak story. A thesis needs an argument chain; an article needs a nut graf and sections; a screenplay needs scenes/sequences. If the S-arc ships its own scene rail and a future thesis module ships its own outline store, Wrizo grows three structure systems — the exact drift this session exists to prevent.
2. **Granularity mismatch.** Screenplay scenes live *inside* one script page (`ScriptDoc.scenes`), but the seam links at page level. Seamless means beats can point at sub-page fragments — which is precisely the fragments-under-Pages question.
3. **One direction is missing.** J5 gave the pantser draft→plan (link a page to a beat). The plotter's plan→draft (make the page/scene *from* the beat) has no verb yet.

---

## 1 · Pass 1 — proposals (condensed; seats speak to their lane)

**Writing-craft pedagogue.** The Plan is the Trellis made visible — one instrument, tuned per form. Plotters enter through it; pantsers arrive at it. Both are honest practices; the spine must never rank them.

**Discovery writer (pantser).** The plan should be *harvestable from the draft*: promote a page or a scene to a beat after it emerged. Structure as archaeology, not architecture. J5's plan-link is half of this; **promote-to-beat** (the page's first line becomes a new beat, pre-linked) is the other half.

**Structural writer (plotter).** The inverse verb: **materialize** — from a beat, birth the linked chapter page (book) or insert the linked empty scene at the right position (script). Plan-first must land the writer *on the page* with the beat's note one glance away, not in a diagram.

**Screenwriter-in-residence.** Sequences and act targets are how pros think; but a screenwriter's plan is *the same plan* a novelist keeps — ordered beats with notes. Don't fork the model for film; parameterize the labels and the templates. Page-count rulers on beats belong to Print-view territory (Trellis), never the drafting lens.

**Cognitive scientist (ADHD).** One structure home means one place to look — executive-function gold. Dangers: template paralysis (offer shapes only on an EMPTY plan, one tap to dismiss forever) and plan-gardening as avoidance (the Plan is reachable from the page in one gesture, and the page from the Plan in one gesture — the round trip must be cheaper than the fidget).

**Deleuzean philosopher.** Ratified this morning for scripts; now spine-wide law: **templates are overlays on what exists, never scaffolds at creation, never empty placeholders that nag.** An empty Plan invites; it does not assign homework. The rhizome grows; the trellis is offered.

**Motivation psychologist.** Linking a draft fragment to a beat is a completion event — a quiet tick on the beat, never a progress bar shaming the unlinked. No percentages.

**Professional editor.** The spine is also the future reports engine: scene lists, beat coverage, section audits are all one traversal *if* links live in one place.

**The Architects (all four, one voice).**
- **One home:** the binder's Plan (`storyPlans`) is the sole structure store. No module-private outline collections, ever.
- **Links live on the child:** page → `beatId` (exists); fragment → `beatId?` on the fragment record (`Scene` in ScriptDoc — reserved in S-arc v1.1 today; `Box` and future `Section`/fragment types follow the same rule). Beats never store target lists; every beat→targets view derives by scan (single source of truth, the house pattern).
- **One vocabulary module:** internal noun `beat` unchanged in code; user-facing unit label per kind from a `planVocab` single source (the `kindLabels.ts` pattern — picker and card provably cannot drift; Plan and rail get the same guarantee). "Plan" is the only user-facing container noun for structure. Working labels: creative → *Beat* (script rail shows *Scene* for its fragments — a fragment name, not a plan-unit name); academic → *Section*; professional → *Section*. Freeze at P1.
- **Templates per kind:** `planTemplates.ts` — starter beat sets offered on an empty Plan only (Appendix A sketches; final shapes at P1 with pedagogue + editor). Deletable, editable, never auto-generate pages.
- **Wizards are front-ends:** BeatWizard today, any future thesis/article walk — all write into the same Plan model. A wizard is a per-kind *entrance*, never a parallel artifact.
- **The rail is a pattern, not a god-component:** the S-arc scene rail is the first instance of a shared structure-rail *pattern* (store + conventions), composed per editor. Parameterize the pattern; don't force one component across editors with different substrates (compose, don't rebuild).
- **Model deltas are additive and small.** Candidate reserved fields on the beat record: `act?/groupId?` (grouping), `trackId?` (character-arc tracks, deferred-designed-for). **Flagged assumption:** the StoryPlan/beat field shape is asserted from canon (setup field + beats with notes, `beat_notes` jsonb), not re-read this session — **P1's brief opens with the read** (read-before-brief law) and freezes exact names then.
- **Sync law standing:** additive fields through both mappers, live prod round-trip on first deploy. No new collection, no new table anywhere in this plan.

**Marketing (opposition, resolved).** Growth: "one app, every form" is the expansion story — beat boards are a checkbox competitors (Arc Studio, Plottr, Scrivener's corkboard) already tick. Brand: the *differentiated* claim is the two-way, fragment-granular seam — the plan grows out of the draft as honestly as the draft grows out of the plan; nobody else's corkboard does both directions at sub-page grain. Skeptic: wizards and templates must never gate drafting — a writer who ignores the Plan forever is a fully supported citizen. **One move:** market the seam, not the board.

---

## 2 · Pass 2 — critique & trim

1. **Character-arc tracks** (a character's line across beats — the BeatWizard's deepest promise): real, wanted, and premature. *Trimmed to deferred-designed-for* — reserve `trackId?` at P1; no UI ticket without a new committee word. Character pages remain the home of character work meanwhile.
2. **Beat→fragment forward pointers** proposed for cheap rail rendering: *rejected.* Derive by scan; double-booked links are the drift machine this doc exists to kill.
3. **One StructureRail component everywhere:** *rejected* (see Architects). Pattern + shared store, per-editor composition.
4. **Per-kind wizards now** (thesis walk, article walk): *no tickets.* The contract simply guarantees the model doesn't block them.
5. **Page-target rulers on beats** (screenwriter's act targets): *deferred to Print-view territory*, overlay-only, quiet — never in the drafting lens.
6. **Naming fight** ("Outline" vs "Plan" for academic kinds): *resolved* — the container noun stays **Plan** everywhere (vocabulary discipline); only the unit label parameterizes.
7. **J5 taxonomy:** *promoted to spine canon* — every structural affordance, present and future, declares itself MOVES / COPIES / LINKS in the sheet. A mislabeled verb is a data-loss-class UX lie.

---

## 3 · The Spine Contract — what every form module owes (the centerpiece)

Any current or future form module (screenplay, thesis/paper, feature article, book/novel, report, …) MUST:

1. **Use the binder's Plan as its only structure home** — no private outline stores.
2. **Carry links on the child:** pages via `beatId`; structured sub-page fragments via `beatId?` on the fragment record. Beats never hold target lists; views derive.
3. **Ship both verbs:** *link/promote* (draft→plan) and *materialize* (plan→draft), through the Add-to sheet family, each leaf tagged MOVES/COPIES/LINKS.
4. **Register its vocabulary** in `planVocab` (unit label) and its optional starter shapes in `planTemplates` — offered on an empty Plan only, never at creation, never auto-filling.
5. **Route any guided walk into the same Plan model** (wizards are entrances, not artifacts).
6. **Keep structure UI Trellis-side** — present in Draft/board surfaces, absent from Free write.
7. **Honor the standing laws:** additive-fields-through-both-mappers + prod round-trip; anti-Canva; Voice Wall; ink sealed in the Journal; harness scenario committed per ticket.

A module that satisfies the contract is *born integrated*; the S-arc is the contract's first test (its v1.1 amendments are exactly clauses 1–4 landing in a plan doc before a line of code — the pattern working as intended).

---

## 4 · The P-arc (three tickets, proportional; briefs to follow one at a time)

- **P1 — spine vocabulary + templates** (`p1-plan-vocab`). Open with the StoryPlan shape read; freeze field names; `planVocab` + `planTemplates`; the empty-Plan template offer (one-tap dismiss, philosopher's guard harness-asserted); reserve `act?/trackId?`. No behavior change to existing story flows.
- **P2 — the two-way seam** (`p2-plan-seam`). *Materialize* chapter-from-beat (book/story kinds, pre-linked, lands the writer on the page); *promote* page-to-beat (first line becomes the beat, linked); beat chips where a binder's pages list; all through the J5 sheet patterns. Pantser and plotter each gain their missing verb.
- **P3 — fragment-granular seam** (`p3-plan-fragments`). Scripts first (depends S1): link/unlink a scene from the scene rail; materialize scene-from-beat at position; rail beat chips. Establishes the fragment-level pattern every future structured page type inherits.
- **Deferred-designed-for (no ticket without a new word):** character-arc tracks (`trackId`), page-target rulers, structure reports, per-kind wizards beyond story.

**Sequencing.** The **fragments-under-Pages pass convenes first** (open-threads #6) with three living citizens now — Box, ScriptDoc, and this contract's links-on-the-child rule — then: P1–P2 can run parallel to the S-arc (they touch book/story surfaces that exist today); P3 waits on S1. Nothing here blocks J5's merge, the hardware session, or HOME verification.

**Risks (load-bearing, flagged).** (1) StoryPlan field shape asserted from canon, not re-read — P1 opens with the read. (2) Materialize touches page-creation paths (`createBinderPage` lineage) — P2's brief greps every creation call site before writing. (3) The template offer is one bad default away from homework — the empty-Plan invite gets the same faintness discipline as F6's first-line invitation, and the harness asserts dismiss-forever.

---

## Appendix A — starter shapes per kind (sketches; freeze at P1 with pedagogue + editor)

**Book / Short fiction:** Hook · Inciting event · First threshold · Midpoint turn · Crisis · Climax · Resolution (generic three-act; no branded method names in product copy). **Screenplay:** Act I / II / III or the 8-sequence variant; beats carry optional page targets (dormant until Print-view rulers). **Thesis / Paper:** Question · Literature · Method · Findings · Discussion · Conclusion (+ chapter variant for thesis). **Feature article:** Lede · Nut graf · Sections (n) · Kicker. **Report / Proposal:** Situation · Options · Recommendation · Next steps. **Something else:** no template — the empty Plan invites.

## Appendix B — S-arc v1.1 deltas landed today (for the record)

`Scene` gains reserved `beatId?`; reserved-not-built list names the spine; the scene rail is declared the structure-rail pattern's first instance (beat chips arrive P3); sequencing adds the P-arc; deferred "beat overlays" now points here.
