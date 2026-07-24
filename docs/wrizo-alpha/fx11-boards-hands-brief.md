# FX11 — the Board's Hands · fix brief · 2026-07-24

**Place at:** `docs/wrizo-alpha/fx11-boards-hands-brief.md`.
**Owner: chat 3** (named per the start-word law). **Branch:**
`fx11-boards-hands`, own worktree; guard-rail
(`git rev-parse --show-toplevel`) before every commit; ledger edits on
`main` only. **Sequencing: FX11 builds first, M3 after its review** —
one-brief-per-ticket rhythm, both merged before the Aug 1 freeze.
**ZERO SCHEMA, ZERO SERVER FILES, ZERO NEW DEPS.** Merge pre-authorized
as zero-schema; Fable reviews post-merge; deploy is Nick's separate
word. The FX8-ratified practice binds throughout: grep
`scripts/harness/` for existing assertions BEFORE changing any value.

## Why this ticket

Five small debts have accrued to the Board's hands and edges, each on
the record: FX8's own review found a real leak (A1); Nick's device found
a gesture glitch; E1.1's review ruled lane titles into the export; BM1's
review found a silent projection drop; FX10's review left one geometry
leg unproven. One ticket retires all five.

## S0 — records

Open the ledger item, cargo enumerated by source (FX8 review A1; Nick's
device report; E1.1 review advisory 2 as ruled; BM1 review advisory 1;
FX10 review advisory 2).

## S1 — the `isDragging` cleanup leak (FX8 A1, named to the line)

The delegated pointer effect's cleanup (deps `[pageWidthPx]`) tears
down its listeners without clearing `isDragging` — a viewport resize
mid-drag re-attaches with fresh closure state while the React flag stays
`true`, leaving `data-dragging='true'` and every face stuck
`cursor:grabbing` until the next drag completes. Fix as the review
prescribed: clear the flag in the cleanup. Harness, trusted pointer:
begin a genuine drag, change viewport width mid-hold, release — canvas
attribute cleared, cursors at rest.

## S2 — resize-then-can't-move (Nick's glitch; root cause FIRST)

The E1 S1 discipline applies: reproduce before patching. Under genuine
trusted pointer, resize a card by its handle, release, then attempt a
move — capture the failing state precisely (the `phase` value, pointer
capture, the `isDragging` mirror, any stale closure) and NAME the root
cause in the commit before fixing at that root. Diagnose the kinship
question explicitly: S1's leak and this glitch are plausibly related
and provably distinct until shown otherwise — if they share a root, say
so and fix once, disclosed; if not, fix each at its own. FX8's
state-machine map (`phase` transitions untouched; `isDragging` set only
in `beginMove`; `finish` clears unconditionally) is your diagnostic
ground truth. Harness: the full gesture chain under trusted pointer —
resize → release → move succeeds; repeat across two cards and both
resize axes. Board card behavior is intentionally shared across framed
and legacy paths (FX8 A3's ruling) — prove at 1280 framed; one legacy
sanity pass.

## S3 — lane titles ride the export (E1.1 advisory 2, as ruled)

`boardBody()` renders writer-authored lane titles when `board-meta`
carries named lanes: minimal form, one `Lanes:` line per board block
listing the titles in lane order; per-lane grouping of cards only if
trivially cheap — your call, disclosed. Empty-named lanes are filtered,
and a board with no named lanes emits nothing (no empty hinge). The
line is exported body text and therefore deliberately OUTSIDE
`deskLexicon` (the ratified E1 boundary). Correct the now-stale
"zero writer text" comment at the `board-meta` skip in the same touch.
Harness: `e1.mjs` gains live checks — a board seeded with two named
lanes shows both titles in "Everything"; the unnamed case emits no
`Lanes:` line.

## S4 — the rootless-cycle guard, both layers (BM1 advisory 1)

Two defenses, both cheap: **(a)** `withParent` walks the ancestor chain
and refuses to create a cycle — a refused nest is a clean no-op
returning the boxes unchanged, matching the store's refusal grammar;
**(b)** `buildNodes` promotes orphan-cycle members to roots instead of
dropping them — the never-silently-missing law applies to projections,
and (b) defends data that arrives already-cyclic from an older client
via sync. Harness: attempt the A↔B mutual nest through the seam —
refused, structure unchanged; seed a pathological pre-existing cycle
directly in box data — every card still renders in STORYBOARD and
OUTLINE (promotion proven), OPEN unaffected throughout.

## S5 — FX10's missing leg (FX10 review advisory 2)

`fx10.mjs`'s S4 scrollbar-flush and text-measure asserts gain the 2200
width — live-section addition, the header's width list updated to tell
the truth.

## Invariants

Trusted CDP pointer for every gesture claim — S1 and S2 are gesture
claims by definition, no synthetic substitutes; both `HARNESS_PARKED`
settings; A4 parks for anything falsified (expected: little to none —
this ticket is mostly additive); every UI string through `deskLexicon`
(expected: none new); `tsc` ×2; `build:web`; report = push.

## Non-goals

FX8 A2's pin-door affordance question (sitting business, Nick's eye);
the tu2 "v2" label and `addFact` v-stamp harmonization (next-touch
notes, wrong files for this scope); BM2; board zoom; the Board-rail
question; the deflake pass (its own armed ticket).

## Definition of done

A card resized is a card still movable. A viewport resized mid-drag
leaves no ghost grip. A writer's lane names reach their export. No card
can silently vanish from a projection. And the harness tells the truth
at every width it names.

— Fable, from the accumulated record, for chat 3 to build
