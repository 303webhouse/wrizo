# App Bones — the ground-up ruling · 2026-07-14

**Status: PROPOSED — flips to RULED on Nick's word (or his delegation; edit
this line when it lands).**
**Answers:** Nick's 2026-07-14 hardware-session verdict and pivot directive
("start from the ground up, adding things back in as they may be useful").
Convened per `AGENTS.md`: the Experts + the Architects, double-pass;
Marketing ran opposition on the positioning axis.
**Place at:** `docs/wrizo-alpha/app-bones-canon.md`.

## The ruling, in one paragraph

The pivot is ratified with its scope drawn precisely: **new bones, same
organs.** What the desktop screenshots and the in-script findings indict is
the *shell* — the top-level composition, the wayfinding IA, the script
surface's missing citizenship — and the shell is rebuilt from the ground up
as the **AB-arc**: a persistent desk composition that hosts the existing,
proven editor delegates. What the screenshots do not indict is the
*substrate* — the fragments-under-pages schema, the sync layer (byte-exact
prod round-trips), the editor cores, the 235-check harness suite, the
way-back, the milestone projection — and the substrate carries forward
untouched. Demolishing it would spend the remaining Fable week re-deriving
solved problems; keeping it means the new shell ships on rails that already
run. `theme-arc.md` (ratified today, parallel lane) independently rules
*"app-bones work precedes all theme implementation"* — two lanes, one
conclusion, same day. The bones are built theme-token-ready so the five
territories dress them later without structural surgery.

## The findings of record

**From `Scriptwriting_Module_1.PNG` (the in-script CLAUDE dialogue) — all
seven extracted:**
1. The writing page is oddly small on a large monitor (stage sizing).
2. "Copy page text" in top chrome reads as confusing/out-of-scope clutter.
3. The typewriter effect is absent on the script surface.
4. The page extends unbounded — text drops to the taskbar (containment
   bug — real defect, not a design gap).
5. No mode selection (Free write/Draft/Revision/Workshop) on the script
   surface.
6. No way to open the story plan, take side notes, or ask the assistant a
   continuity question from the scriptwriting area — the working
   screenwriter's actual loop is unserved.
7. Net: "nowhere close to usable for a professional screenwriter" — adopted
   as the S-arc's acceptance bar.

**From `Journal_Page_1.PNG` (the shell at desktop):** the page floats
undersized in undifferentiated dark; chrome orphaned at viewport corners;
the incentive row renders twice; the spread/Voice-Wall band composition is
illegible at this width; resting orange (tabs, CAPTURE, WORDS, spine) far
exceeds any register discipline. Verdict: the shell fails at desktop scale.
This was the *chosen* debt ("defer large-screen composition until real
content exists") — the content now exists; the bill is due.

## Q1 — What "ground up" means: the shell, not the substrate

**KEEP (carries into the new shell unchanged or lightly wrapped):**
`persistence.ts` + both `sync.ts` mappers and every synced shape; the
fragments-under-pages substrate (`Box`, `ScriptDoc`, `beatId` links); the
editor cores (ink engine, ForwardOnlyEditor, the element engine's keyboard
map + autocomplete); `WritingIncentives` components; `useWayBack` + the
return chip; the milestone projection; the Voice Wall; the full harness
suite (it keeps every kept organ honest through the transplant); PAGE IS
PRIMARY and its standing assertions.

**PARK (alive, harness-guarded, zero new work until pulled forward on
Nick's word):** Journal-ink enhancements beyond the banked S25 fixes; the
Spread's remaining polish and the J3 finger-scroll fallback question; Board
features beyond current; W5 responsive; B3 atmosphere. Parking is free —
the substrate keeps parked surfaces functional and their harnesses keep
them true.

**DELETE:** the shell compositions themselves as each AB slice replaces
them (route chrome, the desktop spread arrangement, orphaned top-bar
items). Nothing below the shell is deleted.

## Q2 — The desk: the target composition

Three persistent zones on a stage that owns the viewport:
- **Wayfinding rail** (left — DeskRail carries, restyled): territories and
  documents. Departure stays honest; the way-back chip stays.
- **The stage** (center): the page at a real reading measure, but the
  *stage* owns the surrounding space — margins are desk surface, not void.
  Existing `PageEditor` delegates (text, board, script) mount here
  unchanged in core.
- **The context rail** (right): tabbed **Plan / Notes / Assist**, orbit-
  class (fixed tracks, collapses within its track, never displaces the
  page). The Plan tab pins the **current beat** — the working
  screenwriter's beat-in-view — with the full plan scrollable beneath;
  interacting deeper navigates honestly, and W2 guarantees the way back.

One **unified lifecycle strip** (the five modes) across text AND script
surfaces. Register discipline: the shell adopts the two-regime orange law
globally (resting ceiling; evental lane) — ruled for Volant, correct
everywhere, and it directly cures the screenshot's orange noise.

**Canon reversal 1 (recorded):** the page-primacy canon's "Plan-beside-page
pull-forward: declined, revisit with real ≥1700px data" is **reversed on
that data's arrival**. The context rail is the revisit. PAGE IS PRIMARY
itself is untouched — the rail is a tool that orbits; the three-line
self-check governs its build.

**Canon reversal 2 (recorded):** S1's "no mode strip on this surface until
S4" is **superseded** — it was a sequencing law, not a principle, and the
unified strip is shell work. S4's mode framework folds into the AB-arc.

**Copy-out ruling:** the capability is canon (writers own their words
*out*; the anti-slop rail blocks paste *in*, never export) and survives —
but it leaves top chrome and lives in **Publish**, where export belongs.
Clutter killed, canon intact, finding 2 resolved.

## Q3 — The parked surfaces and the abandoned session

The remaining hardware-session items are **superseded, not owed**: desktop
items are moot pending the new shell; parked-surface items (J3/J4/J5
S25 feel) park with their surfaces; W2/M1 feel items ride into the AB DoD
because those components carry. Ledger item 2 is rewritten accordingly (see
the week plan's relay). Nick owes no further sitting until AB slices land.

## The S25 verdicts of record (banked — build spec in `docs/wrizo-alpha/j2-s25-fixes-brief.md`)

- J2 eraser feel: **PASS.** Width: **22px → 11px, ruled.** Ring: keep;
  **simplify the pencil cursor graphic.**
- Tool indicator: **shows the target tool** (eraser icon while inking, pen
  icon while erasing — tap to switch). Recorded interpretation of "I should
  see an eraser icon when I'm in ink mode"; if Nick meant show-*current*,
  it is a one-line swap flagged in the brief.
- **S-Pen barrel button toggles ink ↔ eraser** — ruled; updates the old
  "the toggle is the path" stance. Device-gated verification (button-event
  reporting varies by hardware).
- W1 edge-dwell: **PASS.** New rule: **the incentive row (progress bar +
  typewriter toggle) fades out while the stylus is active on the surface
  and fades back on typing** — ink is its own room.
- Everything else from the sheet: superseded per Q3.

## Opposition note (for the record)

The full-demolition reading was argued and trimmed: with six days of
Fable-tier access, a substrate rewrite guarantees the week ends
mid-demolition with less than it started with — the second-system trap on a
deadline. The Journal-as-side-quest reading was partially sustained: no new
ink work, but the shipped surface parks at zero cost, and its banked fixes
are thirty CC-minutes that never touch Fable's clock. Marketing sided with
the pivot outright: the professional-screenwriter bar is the positioning
("the anti-slop screenwriting studio"), and the desk shell is the demo that
converts the actual target user.

## Proposed ledger delta (CC applies on ratification)

Item 2 → struck and rewritten: "**Hardware session 2026-07-14 — partial,
then superseded by the App Bones pivot** (`docs/wrizo-alpha/app-bones-canon.md`). J2 +
W1-partial verdicts banked (`docs/wrizo-alpha/j2-s25-fixes-brief.md`); all remaining
gates superseded per the canon's Q3; AB slices carry their own device
gates." New NOW item 1: "**The AB-arc** — canon ratified <date/word>; briefs
per `docs/wrizo-alpha/fable-week-plan.md`." New IN FLIGHT item: the J2/W1 S25 fix brief
(CC-parallel lane, no Fable gate).

— Fable, for the committee
