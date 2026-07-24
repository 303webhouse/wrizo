# The SC Committee — the Script's Own Room · double pass · 2026-07-24

**Place at:** `docs/wrizo-alpha/sc-committee-pass.md` (records lane; CC
commits). Companion to `sc-defect-verdicts.md` (SC-V1–V7, the spec) and
`sc-arc-seed.md`.

**Standing:** the Experts (why), the Architects (how), Marketing in the
opposition seat — and, by Nick's word, a guest bench of working
screenwriters across genres: **the Feature Dramatist** (indie/prestige
features), **the Room Writer** (network/streaming hour-long, staffed
rooms), **the Half-Hour Writer** (comedy), **the Genre Spec Writer**
(horror/thriller specs). Invented seats, real trade knowledge.

**Charge:** review the script surface as built (post-CD4, `main` at the
M3 merge), what it needs under the Page/Board architecture, and the
standing Board and Tutor plans through the screenplay lens — storyboard
access with special emphasis. The freeze (Aug 1) frames everything:
fixes proceed, features stop and wait.

**The census the committee sat with (verified against `main`):**
`ScriptEditor.tsx` (821 lines) flattens/regroups a jsonb `{v:1, scenes}`
doc live; `scriptKeys.ts` carries the frozen Enter/Tab element cycle with
two AMENDABLE cells; the typewriter hook centers `.script-el-active`;
`.script-sheet` already wears `padding: 1in 1in 1in 1.5in` and
`--font-script` but has no fixed page size, no type metric, no element
grid beyond inline approximations; `retype()` is keyboard-only — no
pointer path to an element type exists; the script bar reads `['Pages']`
(door-less by BM1's ruling), with "‹ Back to the board" appearing only
when arriving FROM a board; the legacy sub-1100 path keeps "Copy script
text" by deliberate exception; the mode strip is pinned `drafting`
(script Free-write was the old S4, never landed); E1's Publish dialog
serves the surface; the Tutor works on script pages with prose-tuned
lenses.

---

## PASS ONE — the standards, the craft, the shape

**The Experts — the page is a clock.** A screenplay page is not a
container for words; it is a unit of time. The industry standard exists
so that everyone downstream — the reader, the producer, the AD breaking
the schedule — can trust that **one page is roughly one minute of
screen**. The standard, pinned for the record: **US Letter (8.5 × 11
in); Courier at 12 pt — 10 characters per inch, 6 lines per inch;
margins left 1.5 in, right 1.0 in, top 1.0 in, bottom 1.0 in; ~55 lines
per page.** The element grid, measured from the page's left edge: scene
heading and action at **1.5 in**, full measure to the right margin,
headings uppercase; dialogue at **2.5 in**, ~3.5 in wide; parenthetical
at **3.1 in**; character cue at **3.7 in**, uppercase; transition
flush toward the right margin, uppercase, colon-terminated; shot at the
left margin, uppercase. Page numbers top-right from page two. A page
that departs from this grid lies about time — and every verdict in the
first sitting (V2, V3, V4) is one defect wearing three faces: **the
room was furnished with prose furniture.** The margins someone already
poured into the CSS prove the intent; the page, the metric, and the
grid never followed.

**The Feature Dramatist.** Endorses the grid as constitutional, then
names the tension no one else will: **page numbers.** The house law
says nothing counted, and the law is right — about the app's judgment
of the writer. But a page number on a screenplay is not the app
counting; it is the document's own furniture, as intrinsic as the
slugline's capitals. "We're on page ninety" is craft language, not a
score. The bench's recommendation: page numbers render on the page
artifact per the standard (top-right, page one bare), and the app never
editorializes on them — no totals, no "pages today," no meter anywhere
else, ever. The boundary is bright; it still amends canon, so it goes
to Nick (→ R1).

**The Room Writer.** Speed of element cycling is the entire feel of a
screenwriting tool. Reviewed the frozen key map cell by cell against the
tools working writers actually keep muscle memory in: **both AMENDABLE
cells match convention** — Enter after dialogue lands on action; Tab
from a character cue reaches transition. Recommend ratifying the map
exactly as shipped and closing the 2026-07-11 loop (→ R5). Then the
harder point, seconding Fable's census: **there is no pointer path to an
element type.** A staffed-room writer lives on the keyboard; a writer on
a tablet in a coffee shop does not have one. On a laptop/tablet-first
product that is a broken surface, not a wishlist — the script page's
strip must carry the trade's controls: an active-element indicator and
tap targets for the type cycle (→ SC3).

**The Half-Hour Writer.** White space is timing. The moment pages break
(SC2), the break rules matter as much as the line count: **a character
cue must never orphan at a page bottom** — it travels to the next page
with its dialogue. `(MORE)` / `(CONT'D)` when a speech itself breaks is
the full standard but is second-order — lawful to defer, dishonest to
forget: name it a follow-on, don't fold it silently into MVP. Dual
dialogue: rare, production-adjacent, defer without guilt.

**The Genre Spec Writer.** Speaks for SC-V7. Genre writers think in
images and sequences before sentences — **the storyboard is not an
accessory to the script; for us it IS the plan.** The Board already has
a STORYBOARD mode (BM1) and lazy pairing; what's missing is the gesture
FROM the page. Wants: the door on the script bar (one move, not a
round-trip through Pages), the paired board waking in STORYBOARD when a
script page births it, and — the real prize — the board BESIDE the page
(BM2's side-by-side), so a beat can be checked without leaving the
sentence. Someday: scene cards seeded from sluglines. Knows that last
one is a feature and says so.

**The Architects — the ticket ladder.** The bones are good — the
element model, the live flatten/regroup, the frozen key grammar, E1's
export path all survive intact. The room around them is wrong, and the
house already owns the right law for fixing it: **pages are made of
sheets, derived and never stored.** A script sheet derives from the
Courier grid by deterministic line math — element type → lines occupied
at 6 lpi within its measure — so pagination, and therefore 1 page ≈ 1
minute, falls out of geometry instead of being computed and displayed.
Zero schema anywhere in the arc: the jsonb doc doesn't change; only the
projection does.

- **SC1 — the Room's True Geometry** (fix; the arc's heart). The sheet
  becomes a Letter-proportioned page: fixed 8.5 in measure, 11 in
  sheet height, the existing 1.5/1/1/1 margins kept; Courier metrics
  (12 pt / 10 cpi / 6 lpi) — recommend bundling **Courier Prime** (SIL
  OFL; a font asset, not a dependency, license file committed);
  `elementStyle()` replaced by the standard grid above; **the caret's
  home is the top of page one** — the typewriter yields until the
  writing reaches center, then carries as before; the stage centers the
  page and seats the chrome (SC-V1's root), reproduced across themes
  with any Flux-only residue recorded to the parked theme arc, never
  chased here. Zero schema, zero server.
- **SC2 — the Clock** (fix). Derived page breaks at the ~55-line grid
  with element spacing rules and the cue-orphan protection; page
  numbers per R1's ruling; `(MORE)`/`(CONT'D)` explicitly deferred to
  SC2.1. Zero schema — the breaks are projections of the same doc.
- **SC3 — the Trade's Tools** (fix, per the census: the surface is
  keyboard-gated today). The script page's own strip: active-type
  indicator + tap targets mirroring `TYPE_CYCLE`, honoring the frozen
  key grammar. **Dependency named honestly:** the per-mode strips
  chamber (TS1) from the second sitting is pending Nick's ratification;
  SC3 conforms to whatever he ratifies, or waits on it (→ R3).
- **The door** (SC-V7, near-term half). BM1 deliberately left the
  script bar door-less — a ruling made before this bench sat. Recommend
  amending it: the script page gains the same arrow-dressed **PLAN →**
  door (lexicon unity — for a screenwriter the storyboard IS the plan;
  the telos line already says so), and a board FIRST BORN from a script
  page wakes in STORYBOARD mode — thereafter the board's own remembered
  mode governs, per decks-are-data-modes-are-projections. Amends a BM1
  ruling → Nick's word (→ R2). The return half already exists ("‹ Back
  to the board"); the door completes the loop.
- **BM2, reviewed with screenplay emphasis** (SC-V7, the deep half).
  Endorsed unchanged in sequence (post-vacation) with one amendment to
  its eventual spec: **script + storyboard side-by-side is BM2's
  primary definition-of-done case** — two live surfaces, the page never
  losing the caret while the board scrolls. The committee asks the BM2
  brief, whenever written, to inherit this line.
- **The Tutor** (SC-V6). The rails are constitutional and untouched —
  on a script page as anywhere, the Tutor never writes. Two lanes:
  (a) a fourth **programmatic offline lens — FORMAT** — pure format
  linting against the grid (slugline grammar, caps, empty cues,
  transition form); mechanical, rail-safe, cheap; (b) **craft ears** —
  the conversational system prompt learns it is reading a screenplay
  (scene purpose, dialogue-on-the-ear, enter-late-leave-early) —
  prompt-side work in the TU lane. Both are additions, which makes them
  features under the freeze; Fable leans post-vacation for both, with
  the honest counter-argument recorded: a Tutor applying prose rules to
  a screenplay gives wrong guidance today, which smells like a defect.
  Nick rules the lane (→ R4).

---

## PASS TWO — opposition, cross-examination, resolutions

**Marketing, in opposition.** Five objections, pressed hard:

1. **The runway.** Freeze in eight days; vacation in eleven; the mega
   deploy is unshipped, the device sitting unsat, the offline test
   unrun — and Nick drafts his own book (prose) on the 4th. The script
   room serves NEXT season's writer. Don't let SC eat the week the
   Write line still owes. *Resolution:* sequencing is Nick's (→ R6);
   the committee's own recommendation is SC1 alone pre-freeze if the
   runway allows, SC2/SC3 lawful as fixes but unashamed to land
   post-vacation. The sitting and the deploy word outrank all of it.
2. **The first number.** Page numbers breach a dam the house built on
   purpose — today a page number, tomorrow a meter. *Resolution:* the
   bench's boundary holds because it is structural, not aspirational —
   the number lives ON the page artifact as part of the document
   standard, and NO aggregate of it may ever surface anywhere in the
   app. The anti-gamification frame governs the app's judgment of the
   writer; it was never a vow that documents forget their own form. A
   canon amendment all the same → R1, Nick's word.
3. **The flip-flop.** BM1 ruled the script bar door-less six days ago;
   reversing it now reads as thrash. *Resolution:* BM1's ruling
   predates the first screenwriter ever seated at this table; amending
   it WITH the reasoning on the record is the system working, not
   churning. → R2.
4. **Storyboard-by-default presumes the genre.** Plenty of
   screenwriters outline in OUTLINE, not STORYBOARD. *Resolution:*
   accepted and folded in — the default applies only at a board's FIRST
   BIRTH from a script page; from then on the board's own remembered
   mode governs. The projection law stays clean.
5. **Scope gravity.** `(MORE)`/`(CONT'D)`, dual dialogue, title pages,
   revision colors, locked pages — the production office will pull at
   this arc forever. *Resolution:* the line is drawn now, on the
   record: **Wrizo's screenplay room is a writing room, not a
   production office.** Deferred and named: SC2.1 (`MORE`/`CONT'D`),
   dual dialogue, title page. Out of alpha scope entirely: revision
   colors, locked pages, production numbering. Scene-cards-from-
   sluglines goes to the Thread/Boards committees, post-vacation.

**Cross-examination residue, settled in session:** the mode strip on
script is pinned to Draft (the old S4 script Free-write never landed) —
the bench flags mode parity on script as a REAL question (Free Write's
forward-only law on a screenplay; Revise's typography on a fixed-grid
page is largely moot) but rules it out of the fix arc: a design
question for a future sitting, recorded here so it isn't lost. The
sub-1100 legacy "Copy script text" exception stands untouched — E1's
law, not SC's.

---

## THE ASKS — Nick's words needed (R1–R6)

- **R1 — Page numbers as document furniture.** Top-right from page two,
  never aggregated anywhere, no meter descends from them. Amends the
  anti-gamification boundary by one bright line.
- **R2 — The script page's door.** Amend BM1: the script bar gains the
  arrow-dressed PLAN → door; a board first born from a script page
  wakes in STORYBOARD; remembered mode governs thereafter.
- **R3 — The strips chamber.** TS1 (second sitting, chamber 1) is
  still pending your ratification; SC3 conforms to it or waits on it.
- **R4 — The Tutor's script ear.** FORMAT lens + craft-ear prompt:
  rule them features (post-vacation, Fable's lean) or rule the FORMAT
  lens a fix (a prose-tuned Tutor on a screenplay is wrong today).
- **R5 — The frozen key map.** The bench confirms both AMENDABLE cells
  match the trade's muscle memory; ratify `scriptKeys.ts` as shipped
  and close the 2026-07-11 loop.
- **R6 — Sequencing.** Recommended: sitting + batched deploy + offline
  test first (the Write line's owed week); then SC1; SC2, SC3 as
  runway allows, post-vacation without shame. All three are fixes,
  freeze-lawful.

**The arc's definition of done, for the record:** Nick converts a page
to Screenplay and the room is a screenwriter's room — the page is a
clock, the caret starts at the top of page one, the tools are the
trade's under thumb as under keys, and the storyboard is one door away.
The thesis unchanged: the app funnels a writer forward into their words
— a screenplay writer no less than a prose one.

— the SC committee, double pass complete, 2026-07-24 · Fable presiding
