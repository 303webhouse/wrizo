# S-arc — the Screenplay Room · committee plan

**Place at:** `docs/s-arc-screenplay-plan.md` · 2026-07-11 · **Status: PROPOSED** (double-pass complete; awaiting Nick's ratification)
**Deliberation:** full double-pass per AGENTS.md — the Experts (with the new **Screenwriter-in-residence** seat, convened on Nick's word 2026-07-11) frame the why; the Architects the how; Marketing in opposition. Proportionality note: this is a new room in the house — full protocol is warranted.
**This is a plan, not briefs.** One brief per ticket follows, per house law, each written against the codebase at build time.
**v1.1 (2026-07-11, noon session, Nick's word):** amended for the structure spine — see `docs/structure-spine-plan.md`. Deltas: `Scene.beatId` reserved; the scene rail declared the structure-rail pattern's first instance; P-arc added to sequencing; deferred beat overlays now ride the spine.

---

## 0 · Charter

Nick's ask: a comprehensive screenplay module in the Projects/page options — Wrizo-philosophy-true and ADHD-friendly, **usable by professional screenwriters** with the formatting power of Final Draft 13 / Fade In; simplicity and distraction-free as the default, with layers of optionality underneath that make Wrizo competitive with the leading tools.

**The success bar (the committee's one sentence):** a working screenwriter can draft a feature in Wrizo and hand a producer a correctly paginated PDF — or an FDX to a production office — without opening Final Draft, while the default surface stays as quiet as the Journal.

---

## 1 · Ground truth (read before planning — what already exists)

- **The door exists; the room doesn't.** `Project.kind` has carried `'screenplay'` since B1; the F4 picker ships "Screenplay" under Creative. Today it births a first **manuscript** page in the plain PageEditor (F4 Slice 4) — a screenplay writer currently gets a typewriter with no script engine behind it.
- **Editor delegation precedent (J4):** `PageEditor()`'s outer wrapper delegates by `pageType` (`'board'` → `BoardEditor`) before either component's hooks run. A `ScriptEditor` is the third delegate — the two-editor split was already ruled load-bearing; a third specialized surface is consistent law, not new debt.
- **Substrate precedent (J4):** `boxes jsonb` on `journal_entries`, carried through BOTH sync mappers, boot-idempotent DDL — the first fragments-under-Pages citizen. A script's scenes are the second.
- **Voice Wall is live:** prose surfaces block foreign paste (+whisper), the own-ink shadow allows your own words back, copy-out is sacred, and the **Import door** (`ImportDraft`) is the sanctioned entry for work started elsewhere. The screenplay module extends the door; it never weakens the wall.
- **No editor dependency exists.** The house owns its contenteditable discipline (uncontrolled seeding, keyed remounts per edit session, IME handling, capture-phase pen guards). AGENTS.md: no new deps unless the ticket requires them.
- **Courier Prime was retired at brand-paint.** The script surface requires it back — scoped, as the industry's own token, not a UI font.
- **House laws that bind this arc:** harness scenarios persist (`scripts/harness/<ticket>.mjs`); sync = both mappers + live prod round-trip; merge+deploy is the code-review gate, Nick's device verdict closes tickets; ink sealed in the Journal (I0); Boards are binder-only; anti-Canva (no styling toolbar, ever); "Journal" is the only ruled user-facing container noun.

---

## 2 · Pass 1 — proposals

### 2.1 The Experts — the why, and what "professional" actually means

**Screenwriter-in-residence (NEW SEAT — proposed AGENTS.md line in §5).** Testimony:

1. **Interchange is the professional bar, not feature count.** A script that can't leave as a correctly paginated PDF — and as FDX when a production office asks — does not professionally exist. Readers judge format in the first half-page; agents want PDF; production wants FDX. Fountain earns writer-culture credibility; FDX earns industry passage. Feature parity with FD13 is the wrong target; **exit parity** is the right one.
2. **Muscle memory decides adoption in five minutes.** The Tab/Enter element cycle, two-letter autocomplete (character names, INT./EXT. locations, times of day), automatic `(CONT'D)` on a returning speaker, `(MORE)` at a dialogue page-break. Get the keyboard exactly right or lose every pro at the door. This is S1 acceptance criteria, not polish.
3. **One page ≈ one minute. Page count is truth AND terror.** Pros live by pages/day and act-break page targets — and are also the most famous perfectionist-procrastinators in the writing world. The pro advice is literally "write the vomit draft fast." Wrizo's forward-only Middle Door **is** that advice institutionalized — this is the pitch that lands with pros, not only with ADHD writers. Page-true on demand; page count out of the drafting eyeline by default.
4. **Scenes are the unit of thought.** Index cards on corkboard are the pro's oldest tool. A scene rail (jump/reorder) is daily-use; the J4 Board is the spiritual cousin but a separate surface.
5. **Daily vs production features.** Daily: element engine, autocomplete, page count, scene navigation, notes. Occasional: outline/cards, reports. **Production-only:** revision colors, locked/A-pages, scene numbering — most working writers touch these only when a script is IN production. Defer the production suite without foreclosing it: stable scene IDs and reserved fields from day one.
6. Non-negotiables inside v1's horizon: title page (with the PDF), dual dialogue (eventually), Courier Prime 12pt, `(MORE)`/`(CONT'D)` correctness at page breaks.

**Cognitive scientist (ADHD, attention).** The screenplay format is *already a trellis* — rigid form is scaffolding; the next decision is always small (which element, then which words). Three dangers: **page-count anxiety loop** (hide it in the drafting lens; reveal on summon); **production-feature fiddling as avoidance** (progressive disclosure — the deep layers live behind deliberate doors, never in ambient chrome); **the return ramp** (resume must land the writer at their last element with the scene's slug visible — the F1/F2 typed-pointer lineage already carries this). No new gamification: sprints, TTFK, chrome-dissolve all inherit.

**Writing-craft pedagogue.** Two Minds map cleanly and must both eventually exist: **Middle Door** = the forward-only element stream (the fast first draft every screenwriting teacher preaches); **Trellis** = page-true view, scene rail, structure overlays. Same document, two lenses — the mode strip's existing law, not a new invention.

**Deleuzean philosopher.** The screenplay is the most industrially rigid of literary forms — which is exactly why Wrizo's version must keep divergence free: the writer types; **the machine dresses the words in the format.** Convergence (the paginated artifact) is the product, never a demand mid-flow. One guard: structure templates (three-act, sequences, beat sheets) are optional overlays applied later, never scaffolds at creation, never empty placeholders nagging to be filled.

**Motivation psychologist.** Format-as-reward: watching your words snap into professional dress is a famous intrinsic hit for first-time screenwriters — protect it by making the *default* surface beautiful, not by adding trophies. Anti-perfectionism: the engine formats, never scolds — no "wrong format" warnings, ever; a sketchy slugline ("INT. SOMEWHERE") is legal.

**Professional editor.** The convergence standard is the output artifacts: title page, exact pagination, break correctness. Reports (scene/character/location dialogue counts) are editing tools — later, but the data model must make each a single traversal.

**Discovery writer (pantser).** Start typing `INT.` and go. Never name anything first (F4 title-later is already law). Dialogue riffs sketched in the Journal should be portable into the script later — the fragment substrate's promise.

**Structural writer (plotter).** Scene rail with reorder (in the revising mind), act/page targets as quiet rulers, a beat overlay eventually. Wants the page count *visible* while revising — which the lens split grants without a fight.

### 2.2 The Architects — the how (roster: the four standing seats suffice; the Experts add none)

**A · Placement (the "Projects/page options" answer).** New `pageType: 'script'` (user-facing label **SCRIPT** via `PAGETYPE_LABEL`; the picker's kind label stays "Screenplay" — F4 shipped it). Creating a Screenplay-kind binder births ONE script page and opens it (replacing the plain manuscript page for `kind==='screenplay'`); ProjectHome groups it atop Manuscript with "+ New script page" (multiple allowed — TV episodes are sibling script pages; costs nothing). Support pages (character/worldbuilding/research/note) unchanged beside it — that's already the pro's binder. `PageEditor` outer wrapper delegates `pageType==='script'` → `ScriptEditor` (J4 routing rule verbatim). Any binder can add a script page; the Screenplay kind just defaults to one.

**B · Document model — fragments-under-Pages citizen #2.** `JournalEntry.script?: ScriptDoc`, one boot-idempotent `journal_entries.script jsonb` column through BOTH sync mappers (the `boxes` recipe verbatim, including the grep-before-edit ritual).

```ts
type ElType = 'scene'|'action'|'character'|'paren'|'dialogue'|'transition'|'shot'|'general';
interface ScriptEl { id: string; t: ElType; text: string; dual?: 'L'|'R'; struck?: boolean }
interface Scene    { id: string; heading: ScriptEl; body: ScriptEl[]; number?: string; omitted?: boolean; beatId?: string }
interface ScriptDoc{ v: 1; title?: TitlePageFields; scenes: Scene[] }
```

- **Reserved-not-built:** `number`/`omitted` (production suite), `dual` (S5), `struck` (script Free-write, S4), `beatId` (the plan seam — the structure spine, P3). Stable IDs from day one so nothing forecloses.
- **`entry.text` stays literate:** on every save, ScriptEditor writes the doc's derived plain text (Fountain-flavored serialization) into `entry.text` — so resume's `lastLine`, the mirror card, `firstLine()` captions, and any future search keep working on scripts for free, exactly like the clean-`derivedText` invariant. The jsonb is truth; the text is the derived shadow.
- Autocomplete vocabularies (characters, locations) are derived live from the doc — no stored lists to drift.
- **Scale note (flagged, not scope):** a 120pp feature ≈ 150–250KB jsonb — fine per entry; localStorage's total budget is a pre-existing horizon concern (IndexedDB), not S-arc's.
- The Scene records are deliberately **fragment-shaped** (stable ids, self-contained). This model is submitted as evidence to the queued fragments-under-Pages committee pass (open-threads #6) — an input to it, not a preemption. If that pass amends the shape before S1 starts, S1 inherits the amendment; the column is additive either way.

**C · The editor (the load-bearing decision).** No dependency — a house-native **block editor**: one styled block per element in one scroll surface; the **active element only** is a live contenteditable (the single-live-editable pattern J4's `BoardTextBox` proved — seed once per edit session, keyed remount); inactive elements are rendered text. Enter commits and births the next element per the flow map; Tab retypes/cycles the current element's type; click/arrows move the caret between elements; Enter mid-text splits the element at the caret (within-type text op); Backspace at an element head merges into the previous (within the same scene). This **dodges the cross-block-contenteditable tarpit** — no multi-block editing surface; cross-element selection exists in a read layer for copy-out only (sacred, VW).

- **All layout in `ch` units on Courier Prime** — monospace determinism: the screen's wrap IS the paginator's math; one set of constants (Appendix A) serves render, page-true, and PDF identically.
- **Smart conversion (v1 scope):** a leading `int.`/`ext.` in an action auto-promotes to a scene heading. Fountain-style ALL-CAPS inference is deferred — explicit FD-style cycling first, inference later if wanted.
- **Autocomplete:** two-letter popover — characters and locations from the doc, time-of-day list after ` - `, transitions, extensions after `(` on a character line. Arrow/Enter/Esc; never modal.
- **Modes:** S1 ships **Draft law** (free edit — the pro expectation; Boards set the precedent that a Trellis-side surface can ship first). Script Free-write (forward-only) is S4, designed-for now via `struck`.
- **Voice Wall:** the script surface joins the prose-surface set — foreign paste blocked + whispered, own-shadow allowed, copy-out untouched. **Pen discipline:** I0 pattern — the pen points, never types, never inks (ink is sealed in the Journal).
- **TTFK continuity:** ScriptEditor mounts `useSessionLog` with `surface:'script'` — the north-star metric extends to the new room on day one.
- Autosave: 2s debounce + `flushNow` on hide/unmount (house pattern).

**D · The paginator (the crown jewel).** `paginate(doc, opts) → Page[]` — a **pure function**, zero DOM, unit-harnessable to the bone. Courier metrics make screenplay pagination *computable*: fixed characters-per-line per element type, fixed body lines per page (working constant 55). Rules: scene heading keep-with-next-2; character keep-with-its-dialogue; dialogue breaks only with ≥2 lines each side, inserting `(MORE)` / `NAME (CONT'D)`; transition keep-with-previous; auto `(CONT'D)` on a same-speaker return after action. **Acceptance is rules-true, not FD-byte-true:** FD's breaks carry private quirks (Fade In doesn't byte-match FD either, and no reader diffs page breaks — they eyeball format and total count). Bar: zero rule violations on a 110-page reference script and a total count within ±1 page of FD's export of the same text. One function feeds the page-true lens AND the PDF writer — one truth.

**E · The lenses (simplicity default, depth on demand).**
- **Drafting lens (default):** the quiet stream — styled elements, warm paper, **no page furniture**. A soft `~p.N` lives in the chrome-fade layer only (appears on summon, dissolves on writing — the existing engine, zero new dissolve logic). The most chromeless surface in the app; accent spent only on the caret and the active element's hairline.
- **Print view (the page-true lens):** white sheets, true margins, page numbers, `(MORE)`/`(CONT'D)` rendered — the plotter's home and the pre-export mirror. A quiet toggle beside the mode strip. (Named **Print view** to dodge the "Pages" noun collision — vocabulary ruling in §3.8.)
- **Scene rail:** collapsible slug list — jump always; drag-reorder in Draft law (J3's reorder discipline). The rail is the first instance of the spine's structure-rail pattern (`docs/structure-spine-plan.md`); beat chips + scene↔beat linking arrive in P3, not the S-arc. Act/beat overlays remain overlay-only per the philosopher's guard.

**F · Interchange (the professional exits).**
- **PDF (S2):** `pdf-lib` + embedded Courier Prime — two new deps, ticket-justified per AGENTS rule (the zero-dep print-CSS path was weighed and rejected: pros need one-click, deterministic output; the paginator already computed every line's position, so placement is trivial and browser-print quirks are dodged). Title page included; watermark option deferred.
- **Fountain (S3):** own parser/serializer to spec (~300 lines, no dep, round-trip harness-tested). **Import extends the Import door** (`ImportDraft` gains a `.fountain` file mode with provenance) — the wall's door, never paste. Export is a file download beside "Copy page text."
- **FDX (S5):** XML read/write of the Paragraph types; unknown nodes warn-and-skip on import (count surfaced); revision metadata ignored in v1 (flagged, not silently dropped).

**G · Sync/server.** One jsonb column, both mappers, live prod round-trip on the first deploy (D2/J4 check pattern). No new collection, no new table, no new endpoint.

### 2.3 Marketing — the opposition pass (reach vs principle, then one move)

- **Growth (reach pole):** the aspiring-screenwriter market dwarfs the pros and is famously tool-hungry — screenwriting is the most procrastination-by-tooling genre alive; FD's price is the door Wrizo walks through. "Write your first feature" is a content flywheel that writes itself.
- **Brand (principle pole, the counterweight):** **"Final Draft parity" is a trap claim** — say it and be judged by the 5% we deferred (revision colors, locked pages) by exactly the pros we court. Never say parity. Say: *the fastest first draft in the industry, and it leaves as a perfect PDF or FDX.* The bar is the Highland bar beaten on feel, plus the FD bar met on exits. And the strongest card: post-2023-strikes screenwriters are the most AI-hostile creative community in existence — Wrizo's no-ghostwriting covenant and Voice Wall aren't limitations to explain here, they're the headline no incumbent can credibly copy.
- **Narrative:** the founder drew the logo in-app in one unrevised pass; the Screenplay Room's story is the same practice — *the format is the machine's job; the movie is yours.*
- **Skeptical ADHD advocate:** "another screenwriting app" triggers the eye-roll; no landing page before the room survives Nick's own hardware and a real script's worth of dogfooding. And keep the picker quiet — Screenplay stays one card among the forms, not a banner.
- **Resolved to one move:** position as *the drafting room with professional exits.* The benchmark demo: blank page → formatted scene in 60 seconds → an exported PDF that opens clean in a producer's reader.

---

## 3 · Pass 2 — critique & trim (challenge → resolution)

1. **Pantser + pedagogue vs Architects — Middle Door missing from v1 is a philosophy hole.** Every writing surface in the house honors forward-only; the flagship new room launching Trellis-only reads as drift. *Resolution:* S1 ships Draft law to get the pro engine true, and **script Free-write is promoted from "someday" to S4** — a named arc ticket (forward-only element stream; backspace strikes within the element; no reorder; Tab retype allowed — classification is not revision). `struck` is reserved in S1's model so S4 needs no migration.
2. **Screenwriter vs Architects — the keyboard map must be verified, not remembered.** Two cells of the Tab/Enter table are folklore-grade (Appendix A, marked). *Resolution:* the S1 brief carries a **pre-build verification step** — freeze the table against FD13/Fade In behavior (Nick's trial or screenshots) before a line of editor code.
3. **Systems engineer on editor risk.** The single-live-editable pattern is proven (J4), but split-at-caret and merge-at-head are the two ops where custom editors bleed. *Resolution:* accepted with eyes open — both are within-type text ops, never cross-block contenteditable; both get named harness checks in S1's DoD. S1 is the arc's biggest ticket; plan it at ~2× a J-ticket.
4. **Brand vs Growth on audience.** *Resolution:* build to the pro bar, market to the aspirant — the pro bar is *why* the aspirant trusts it. One product, no "pro tier."
5. **Philosopher vs the plotter's overlays.** *Resolution:* overlays are optional, applied to existing scenes, never generate empty beats, never appear at creation. Ratified as an arc invariant.
6. **Skeptic vs scope creep.** Reports, dual dialogue, watermarks trimmed out of the S1–S3 core; **FDX slips to S5** — Fountain covers migration sooner at a fraction of the cost; dual dialogue rides with FDX where it's actually exercised. Production suite stays deferred-designed-for.
7. **Editor's title-page motion.** Not polish — the PDF is naked without it. *Resolution:* title page lands in S2 with the exporter.
8. **Vocabulary ruling (per house discipline):** page type noun = **Script** (tag `SCRIPT`); the page-true lens = **Print view** (avoids colliding with the app noun "Pages"); the picker keeps F4's shipped "Screenplay" kind label; "Journal" untouched.
9. **Board collision check.** Scene cards ≠ Boards: Boards are binder-only and anti-Canva; the scene rail is part of the Script surface, not a Board. Porting scenes to a binder Board via the existing port is possible later — explicitly not S-arc.
10. **Interaction designer on phone.** Laptop/tablet-first per canon; the drafting lens degrades gracefully on phone; **Print view is tablet/desktop-only in v1** (a 60ch Courier sheet on a phone is a lie of a preview). Logged as a non-goal, not a bug.

---

## 4 · The recommendation (single)

**Build the Screenplay Room as the S-arc: five tickets, sequenced after J5 ships and the consolidated hardware session closes the J-arc.** It interleaves with, and feeds, the queued fragments-under-Pages pass (open-threads #6): the ScriptDoc scene model is submitted to that pass as its second living citizen; if the pass amends the shape first, S1 inherits. The arc's identity: **the writer types; the machine dresses the words.** Simplicity is the default lens; every professional layer is one deliberate door deeper.

### The S-arc (per-ticket briefs to follow, one at a time)

- **S1 — the element engine** (`s1-script-editor`). `pageType:'script'` + jsonb column + both mappers; Screenplay-kind create births a script page; PageEditor delegation; the block editor with the verified Tab/Enter map, two-letter autocomplete, `int./ext.` promotion, smart `(CONT'D)`; drafting lens only; VW + I0 + TTFK wiring; `entry.text` derived shadow; `Scene.beatId` reserved (spine). **DoD:** draft a real scene with pro keyboard flow on Nick's hardware; harness covers the map table, split/merge, autocomplete, round-trip.
- **S2 — true pages** (`s2-script-pages`). The pure paginator + Print view + title page + one-click PDF (deps: `pdf-lib`, Courier Prime — named per AGENTS rule). **DoD:** rules-true on the 110pp reference, ±1 page of FD's count; the PDF opens clean and matches Print view line-for-line.
- **S3 — the door** (`s3-script-fountain`). Fountain parser/serializer; Import door gains `.fountain` with provenance; export beside copy-out. **DoD:** lossless round-trip harness on the reference corpus; a Highland/Beat-authored file imports clean.
- **S4 — the Middle Door** (`s4-script-freewrite`). Forward-only script drafting; strikes within elements; page count fully absent; sprint machinery inherited. **DoD:** the vomit draft is real on hardware; struck content never exports.
- **S5 — pro completeness** (`s5-script-pro`). FDX in/out, dual dialogue, scene-rail reorder polish, `(MORE)` edge cases. **DoD:** an FDX from Wrizo opens correctly in FD13; an FD13 script imports with a warn-count, not silence.
- **Deferred-designed-for (no ticket without a new committee word):** production suite (revision colors, locked/A-pages, scene numbering — schema already reserves), reports, watermarks, collaboration; beat overlays and scene↔beat linking now ride the structure spine (`docs/structure-spine-plan.md`, P-arc).

### Arc invariants (the room's law)

- **Anti-Canva holds absolutely:** no styling toolbar — a screenplay has no user styling at all; format is semantic. The purest expression of the guard in the app.
- **AI covenant unchanged:** sealed in Free write; the assist frame may discuss, never write — no generated loglines, beats, or dialogue, anywhere, ever.
- **Voice Wall holds:** no foreign paste; external scripts enter through the Import door with provenance; copy-out sacred.
- **Ink sealed in the Journal:** the pen is a pointer on the script surface (I0 pattern).
- **Tokens:** orange accent invariant (spent only on caret + active-element hairline here); square corners; solid borders; **Courier Prime scoped to the script surface only** — a ratified exception to the type tokens, being the industry's own token. Figtree/Crimson untouched everywhere else.
- **Sync law:** the jsonb column through both mappers; live prod round-trip on first deploy.
- **Harness law:** the paginator is pure — golden-file tests; every ticket lands `scripts/harness/s<N>.mjs`.

### Risks (load-bearing assumptions, flagged)

1. **Keyboard-map fidelity is unverified folklore in two cells** — S1's pre-build verification step exists for exactly this; the table freezes before code.
2. **Pagination acceptance is rules-true, not FD-byte-true.** If byte-parity ever matters, that's a research ticket, not a bug.
3. **S1 is the arc's heavyweight** (custom block editor). Bounded by the single-live-editable pattern, but expect ~2× a J-ticket; split/merge and IME are the watch-points.
4. **New deps** (`pdf-lib`, `@fontsource/courier-prime`) arrive in S2, named in the brief per AGENTS rule. S1 and S3 add none.
5. **Document scale in localStorage** is fine for features; flag at ~5 full scripts per device — IndexedDB is the pre-existing horizon item, not this arc's.
6. **Phone is graceful degradation** (drafting lens yes, Print view no) — consistent with canon, stated so it's never mistaken for an oversight.

### Sequencing & dependencies

J5 + the consolidated hardware session close the J-arc → fragments-under-Pages pass convenes with Box, ScriptDoc, and the spine's links-on-the-child rule as citizens → **S1 brief**. The **P-arc** (`docs/structure-spine-plan.md`) runs P1–P2 in parallel with the S-arc (they touch book/story surfaces that exist today); P3 waits on S1. B4's reward-surface design doesn't intersect; B3/W5 unaffected. Nothing in the S-arc blocks, or is blocked by, HOME verification.

## 5 · Proposed AGENTS.md amendment (Nick's word given 2026-07-11; lands via the normal relay, not unilaterally)

Under `### The Experts`, add:

```
- Professional screenwriter (working, WGA-format fluent): the industry bar — interchange, pagination truth, the daily keyboard hand; voice of the writer who must deliver.
```

---

## Appendix A — format constants & the keyboard map (implementation-grade; freeze at S1)

**Page geometry (US Letter, Courier 12pt = 10 cpi / 6 lpi):** margins L 1.5″ · R 1.0″ · T 1.0″ · B ~1.0″; **55 body lines/page** (working constant — verify against the reference in S2); page number top-right as `N.` from page 2; page 1 unnumbered.

**Elements** (indent from the 1.5″ margin origin, in ch = tenths of an inch; width = wrap column):

| Element        | Indent | Width | Case | Notes |
|---------------|-------:|------:|------|-------|
| Scene heading | 0ch    | 60ch  | CAPS | `INT./EXT. LOCATION - TIME` |
| Action        | 0ch    | 60ch  | —    | |
| Character     | 22ch   | —     | CAPS | extensions `(V.O.)`, `(O.S.)`, `(CONT'D)` |
| Parenthetical | 16ch   | ~19ch | —    | wraps rarely |
| Dialogue      | 10ch   | 35ch  | —    | |
| Transition    | right-aligned to col 60 | — | CAPS | usually ends `TO:` |
| Shot          | 0ch    | 60ch  | CAPS | |
| General       | 0ch    | 60ch  | —    | notes/misc |

**Pagination rules:** heading keep-with-next-2 · character keep-with-dialogue · dialogue splits only with ≥2 lines each side, `(MORE)` at the break (parenthetical indent) and `NAME (CONT'D)` on the next page · transition keep-with-previous · auto `(CONT'D)` when the same speaker returns after intervening action.

**Tab/Enter map (working default — VERIFY vs FD13/Fade In before S1 freeze):**

| From          | Enter →       | Tab →                                  |
|---------------|---------------|----------------------------------------|
| Scene heading | Action        | (cycle type)                           |
| Action        | Action        | Character                              |
| Character     | Dialogue      | Transition **[UNVERIFIED — may be Parenthetical in FD13]** |
| Parenthetical | Dialogue      | Dialogue                               |
| Dialogue      | Action **[UNVERIFIED — some defaults are Character]** | Parenthetical |
| Transition    | Scene heading | Scene heading                          |
| Shot          | Action        | Character                              |

Plus: Tab on an **empty** element cycles its type; Ctrl/Cmd+1–8 sets type directly; Esc dismisses autocomplete. **Revision color order (deferred suite, recorded now):** White → Blue → Pink → Yellow → Green → Goldenrod → Buff → Salmon → Cherry → 2nd White…

## Appendix B — interchange notes

**Fountain (S3):** headings auto-detect on `INT/EXT/EST/I/E.` or force with leading `.`; Character = caps line before dialogue, force `@`, dual `^`; parentheticals `( )`; transitions caps-ending-`TO:` or force `>`; centered `>text<`; notes `[[ ]]`; boneyard `/* */`; sections `#` and synopses `=` (map to scene rail metadata, not printed); page break `===`; title page as leading `key: value` block. Round-trip = parse(serialize(doc)) ≡ doc on the harness corpus.

**FDX (S5):** `<FinalDraft><Content><Paragraph Type="Scene Heading|Action|Character|Parenthetical|Dialogue|Transition|Shot|General"><Text>…` — read/write those; SmartType lists optional on export; unknown nodes and revision metadata warn-and-count on import, never silently drop.

**PDF (S2):** `pdf-lib`, embed Courier Prime Regular + Bold (OFL); place lines directly from `paginate()` output (no HTML rendering step); title page; `N.` header; scene-number gutters reserved for the production suite.

## Appendix C — the competitive field (positioning input only; **verify versions/prices before any public copy**)

Final Draft 13 (~$250; the industry default; Beat Board, revisions, collaboration) · Fade In (~$80 one-time; the value pro tool) · Highland (Fountain-native minimalism; the closest philosophical cousin) · Arc Studio (subscription; modern outlining) · WriterDuet/WriterSolo (web; free tier; collab) · Beat (free, Mac, Fountain) · Slugline. **Wrizo's lane none of them hold:** the forward-motion, anti-slop drafting room with professional exits — and the only one whose no-AI-ghostwriting covenant is structural, not a settings toggle.
