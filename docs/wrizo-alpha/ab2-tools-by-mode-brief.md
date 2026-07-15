# AB2 — the Tools by Mode (build brief · v1)

**Branch:** `ab2-tools-by-mode` · off current `main` (post-ab1.1 @ `f01b400`)
**Authorized by:** the Desk design (`docs/wrizo-alpha/the-desk-design.md`,
RULED), the AB1 review's R2 ruling (`docs/wrizo-alpha/ab1-review-fable.md`
— JournalEntry re-homed here), and Nick's rulings of 2026-07-14 (olive
hairline · engraved strip · approved same day).
**Audience:** CC. Plain words lead; the build dialect is in the slices.

## Why

AB1 built the desk; AB2 puts the tools on it. The empty rail left of the
page fills with exactly the current mode's instruments — and only what
passes the relevance law: *does it directly serve getting the words you
want onto the page?* The Journal's page finally joins the frame (the R2
ruling: it may not slip past this ticket). Copy-out comes home to
Publish. And the mode strip goes quiet per Nick's rulings. The tool set
stays tiny and excellent — bold, italic, headings, spacing — not Word.

## S0 — the Draft-storage ruling (gate; no code)

The handoff ordered the committee to test, not inherit, the recorded
prior. Tested and **SUSTAINED**: formatted Draft text stores as
**markdown conventions inside `entry.text`** — zero schema, sync-free,
one source of truth.

The alternatives, weighed and rejected: HTML-in-text pollutes the single
source every reader depends on (word counts, the Voice Wall's shadow,
resume snippets, TTFK surfaces); a structured jsonb column now spends
schema before need; overlay/annotation ranges shear under edits. The
prior wins on every axis that matters at this size.

Two riders, binding:
1. **The convention set is frozen tiny:** bold (`**`), italic (`*`),
   headings (`#`, `##`), spacing (blank lines). No links, images, tables,
   or code in v1 — links especially are deferred deliberately (anti-slop
   adjacency; their own pass later).
2. **The upgrade path is recorded, not built:** if Draft ever outgrows
   conventions (Revise-era marks, comments, tracked changes), the lawful
   exit is a structured jsonb column satisfying the fragments-under-pages
   §2 checklist, with `entry.text` becoming the derived shadow — exactly
   the ScriptDoc pattern. Nothing in this ticket may foreclose that path.

**Display register (ruled here):** the iA convention — syntax visible,
effect live. Bold text renders bold *with its asterisks present, dimmed*;
a heading line renders larger with its `#` present, dimmed. The marks
show their work: honest text, no hidden state, no rich-text engine.
Implementation mechanics are CC's (ForwardOnlyEditor is contenteditable-
class; a decoration pass on input is the expected shape) — the behavior
above is the spec.

## Scope (slices)

- **S1 — the tool rail.** `components/ToolRail.tsx` mounts into
  DeskFrame's reserved tool-rail track (the track exists; this fills it).
  A per-mode registry: the rail renders exactly the active mode's tools,
  nothing else, re-rendering on mode switch without the page rect moving
  (PAGE IS PRIMARY assertions extend here — the track's width is fixed;
  only its contents change). The rail carries `chrome-fade desk-dissolve`
  — the vanishing law governs it like every other zone. Empty modes
  (Revise, Workshop) render the rail as desk ground, exactly as AB1
  shipped it.
- **S2 — Free Write's tools.** Into the rail, for mode `journal`: the
  ink colors + nib controls (relocate from the pen bar where they live
  today — the pen bar row above the page retires on framed surfaces once
  its contents have a rail home; below the gate, untouched); the
  **typewriter toggle** (returns from parking — this is its ruled home;
  the effect re-arms only when toggled, persisted setting honored as
  before); the **forward lock** — ForwardOnlyEditor's propulsion exposed
  as an explicit switch, persisted, default matching today's shipped
  Free Write behavior so no writer's page changes physics under them.
  The capture items (Spark deck · Fragments · Send → Drawer) move from
  AB1's interim corkboard tab into this rail — their ruled final home —
  and the interim corkboard Journal tab retires (the corkboard track
  returns to empty/reserved until AB3).
- **S3 — Draft's tools.** For mode `drafting`: Bold, Italic, Heading,
  Spacing — operating as markdown conventions per S0, applied to the
  selection or the caret's line, stored in `entry.text`, displayed in
  the iA register. Nothing else. The word "toolbar" should feel too big
  for what this is.
- **S4 — the Structure picker.** A Draft tool: **Prose | Screenplay**
  (the S1 element engine mounts unchanged inside; later structures join
  as entries, not rebuilds). Switching an *empty* page is free.
  Prose → screenplay on a page with words: one plain confirmation, then
  the mechanical mapping — each paragraph becomes an action element in a
  fresh ScriptDoc (the substrate's birth path, reused). Screenplay →
  prose: the `entry.text` shadow *is* the prose rendering — adopt it —
  but element types don't survive the trip, so this direction carries a
  plain one-way warning before it acts. No AI anywhere in this: the
  mapping is mechanical, the writer's words move verbatim.
- **S5 — copy-out comes home.** The Publish dialog (both prose and
  script surfaces) gains two actions: **Copy My Words** (plain text,
  conventions stripped) and **Copy Formatted** (the conventions travel —
  markdown is the portable format; for script, the existing
  copy-script-text rendering). This restores the canon-protected
  capability AB1 removed from top chrome; the anti-slop wall is
  untouched — words flow out freely, never in.
- **S6 — the Journal's page enters the frame** (the R2 ruling; may not
  slip). At ≥1100px, `JournalEntry` mounts inside DeskFrame: its sheet
  (ink layer and all — editor core untouched) in the stage; the unified
  mode strip above it (its own legacy tab row does not mount when
  framed, superseded — not deleted); its metadata/star band keeps its
  below-the-page position inside the stage column; its capture
  vocabulary is S2's rail (same ticket, clean confluence). The Spread
  stays its own surface — it is browse, not the page. Below the gate:
  byte-identical legacy JSX, the AB1 pattern exactly, which is also why
  the existing JournalEntry-flavored harness checks stay green untouched.
- **S7 — the strip quiets** (Nick's rulings, 2026-07-14). The active
  mode tab loses its brass fill: brightened ink + a **1px olive
  hairline** (`--accent-rest`, working value `#96a05a` — a new token
  slot; the Plateau foundations doc locks the final hue and may re-point
  it, zero component edits, the established seam pattern). The strip
  renders in the **engraved register** — uppercase, letterspaced — as
  *presentation* (CSS transform in Plateau's dress): the canonical
  strings remain the ratified title case, `deskLexicon` untouched,
  `ab1.mjs`'s exact-string assertions untouched. Orange leaves the strip
  entirely; its lane (caret, celebration, press states) is not this
  ticket's to build.
- **S8 — harness (`scripts/harness/ab2.mjs`) + parked-disposition
  update.** Assert at minimum: per-mode rail contents (each mode shows
  its tools and only its tools); rect invariance across mode switches
  with the rail populated; forward-lock toggle changes editor behavior
  (a backspace-past-boundary probe) and persists; a bold application
  writes `**` conventions into `entry.text` (storage ruling proven at
  the seam); structure switch prose→script produces a valid ScriptDoc
  whose action elements match the source paragraphs, and the
  confirmation gates it; Publish carries both copy actions and the
  copied payloads differ correctly; JournalEntry framed at ≥1100px
  (strip present, capture items in the rail, corkboard tab retired,
  legacy below the gate untouched); the active tab carries no brass
  background (computed-style check, the th2 pattern) and the hairline
  is present; the strip's rendered case is uppercase while textContent
  stays title case. Update `ab1.mjs`'s corkboard-Journal-tab checks:
  they assert the *interim* home this ticket retires — move them into
  the PARKED section with a one-line reason (first real tenant of the
  scaffold), never deleted; add the successor assertions here.

## Non-goals

Corkboard depth, reach panels, the two flight doorways (all AB3 — and
gated on the gaze-and-flight canon receiving Nick's word). Revise and
Workshop toolsets (deferred; tabs stay deferred). **Script Free-write**
(forward-only across structured elements needs its own small design
pass — the S-arc reserved S4 for it; deferred with this pointer, not
forgotten). Links/images/tables in Draft (S0 rider 1). The menu-item
casing question (open, Plateau foundations doc). Mobile <1100px keeps
current behavior everywhere. Any substrate, sync, or schema change —
S0's ruling guarantees zero-schema for this entire ticket.

## Invariants

Zero schema. No new deps. Substrate untouched (app-bones KEEP list).
Fixed tracks; PAGE IS PRIMARY self-check every slice. The vanishing law
covers every new chrome element this ticket mounts. Two-regime orange —
now with the olive carrying resting duty in the strip. Parked ≠ deleted
(S8's parked-section move is the law working as designed). Tutor never
ghostwrites — nothing in this ticket touches AI, and the Structure
picker's conversions are mechanical only. The Voice Wall and anti-slop
rails are untouched: copy-out is canon; paste-in rules unchanged.

## Definition of done

`tsc` ×2 + `build:web` + selftest + full suite green (with the S8 parked
move documented in the ship report) + `ab2.mjs` green. Findings 2 and 3
of record die here: copy-out lives in Publish where export belongs, and
the typewriter option reaches the script surface's Draft posture through
the rail (its hold-band must respect the script's scroll-cap — the
containment fix and the typewriter must not fight; prove it in S8). The
rail reads as instruments within reach, not a menu; the strip reads as
an engraving, not a control panel. Report = push; review per the
compressed rhythm; Nick's device look folds into the AB gates.

— Fable
