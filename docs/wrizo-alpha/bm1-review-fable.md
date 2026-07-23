# BM1 — the Board's Own Modes · Fable's post-merge review · 2026-07-23

**Ticket:** BM1 (item 54), THE schema ticket. Merged `b936f67` on Nick's
explicit schema word; migration ran clean on the production boot.
**Standing of this review:** BM1's only prior verification was the
orchestrating session's compensating check after both dispatched review
agents stalled — lawful under the placeholder rule, disclosed, but the
builder verifying the builder. **This review is the independent eye; the
gap is now closed.**
**Method:** the schema obligation in full — the entire migration and BOTH
sync-mapper directions read line-by-line, placeholder counts verified by
my own hand; the live `sync.ts` fetched whole to verify the down-sync
select shape (not inferable from the diff); the pairing logic, the type
charters, and the projection seam (`boardStructure.ts`, `boardMode.ts`,
lexicon) read line-by-line. The UI/projection components (`64f4647`) and
the 36-check harness (`cb9b475`) verified at commit-record depth against
the enumerated compensating verification; the A4 park commit (`06d0291`)
previously read in full and ruled (the A1 ruling).

## Verdict: GREEN WITH ADVISORIES. The schema slice is the best-disciplined in the project's history — the house recipe followed exactly, both directions, hand-verified. Close pends Nick's device verdicts (A2/A3/A4, sitting agenda item four).

## THE SCHEMA — verified whole, by hand

**Migration** (`migrate.ts`): one additive nullable text column,
`add column if not exists plan_board_id text` — idempotent, no backfill,
null on every existing row. The exact `origin`/`imported_at` recipe.

**Placeholder census — counted by hand, 23/23/23 confirmed:** the insert
column list is 23 columns ending `plan_board_id`; the values list runs
`$1`–`$23` with `plan_board_id` at `$23`, plain text, no cast; the params
array is 23 entries positionally aligned (every `::jsonb` cast lands on a
`JSON.stringify` param — boxes/script/tutor/tags/routed/strokes at
13/14/16/17/18/19), ending `e.planBoardId ?? null`. The `on conflict`
set includes `plan_board_id = excluded.plan_board_id`; the last-write-wins
`updated_at` guard is intact and unchanged.

**Both directions, fixed point held:** up-sync `undefined → null` via
`?? null`; down-sync `null → undefined` via `r.plan_board_id ??
undefined`. **The down-sync select is `select *`** (verified in the live
file, not assumed) — the new column rides every pull with no reader-side
column list to forget. Round trip: absent → null → absent. An unpaired
entry is byte-identical to its grandfathered self through every path.

**The board's own record is never touched.** The pointer lives on the
page side only; the back-reference is derived by scan
(`isPairedPlanBoard`/`getPairedPageId`), so derived Journal/Shelf/Trash
membership is unaffected by construction, not by promise. `belongsOnShelf`
gains one derivation guard that is provably a no-op on every grandfathered
row. Unpair destructure-deletes the key — absent, never `null` — restoring
literal byte-identity. Soft-deleting a paired plan board unpairs first,
exactly once; soft-deleting a page cascades nothing — the board orphans by
derivation and a restore re-pairs for free because the pointer was never
touched. Lazy birth is idempotent, guarded against board-as-its-own-face,
born empty/OPEN/loose and invisible until orphaned; a dangling pointer
re-births rather than crashing. 1:1 enforced at both ends in
`pairBoardWithPage`. This is "Page is Primary" made structural.

## THE PROJECTION SEAM — constitutional check passed

`boardStructure.ts` is the one structure description, derived purely from
shared box data (`seq`/`laneId`/`parentId` + board-meta `lanes[]`).
STORYBOARD and OUTLINE walk the same tree with the same comparator —
`flattenLane` is a pre-order walk of the identical forest, so cross-mode
order equality is true **by construction**, not by test alone. OPEN never
imports the module and draws by x/y/z exactly as before; every structure
field is additive-optional and absent on all existing boxes, so the
seven-deck library is byte-identical in OPEN. The ordering comparator is
total and stable (seq, else array index, array index as final tiebreak) —
a never-reordered board keeps its authored order deterministically. No
per-mode fork exists anywhere in the seam. `boardMode.ts` is the FX9
sectionFold family exactly: client-local, zero schema, one key, validated
values, default OPEN, no reaper. The lexicon carries the tabs, both door
words, the telos line verbatim ("The plan serves the page."), and the
arrow as component glyph, never prose.

**The OUTLINE floor and doors** — per the harness record (36 checks, both
`HARNESS_PARKED` settings) and the compensating verification: genuine
nesting rendered AND edited (`withParent` + text round-trip through the
same `box.text` OPEN reads), doors under genuine trusted pointer with
lazy birth, PAGE → never selected, unpaired → the FX10 named return,
nothing orange at rest, no knocks. The A4 park on `cd1.mjs` was read in
full previously and ruled legal under the immutability codicil.

## ADVISORIES — non-blocking

1. **A rootless parent cycle silently drops cards from the projections.**
   `buildNodes` is cycle-guarded against hangs (correct), and `withParent`
   refuses self-parenting — but not mutual ancestry: nest A under B, then
   B under A, and neither is a root, so both vanish from STORYBOARD/
   OUTLINE (data intact, OPEN unaffected). Whether the OUTLINE gesture
   layer can produce this sequence is unverified. Cheap fix, two options:
   `withParent` walks the ancestor chain and refuses a cycle, or
   `buildNodes` promotes orphan-cycle members to roots instead of
   dropping. **Rider for BM1.1 or FX11 — the never-silently-missing
   principle applies to projections as much as exports.**
2. **`withLanes` clears via `lanes: undefined`** rather than the
   destructure-delete used everywhere else. Serialized byte-identity holds
   (JSON drops undefined-valued keys), so this is wire-safe — but the
   in-memory key presence differs from the house pattern. Harmonize on
   next touch; not worth its own commit.
3. **`isPairedPlanBoard` is an O(n) scan called per-entry by
   `belongsOnShelf`** → O(n²) Shelf derivation. Immaterial at a single
   writer's corpus scale; noted so that if Shelf derivation ever measures
   hot, this is the first candidate for a one-pass paired-set.
4. **The Done-retirement commit** (whenever Nick's word arrives) will
   falsify the b2/hb1 Board-Done checks and cd1's successors: per the
   codicil, their park cycles must travel **in that same commit**. hb1's
   CD3-era Page/Script-scoped successor was verified proper at
   commit-record depth; b2/hb1's Board-facing checks are unaffected today
   only because Done survives.

## Close condition

Nick's device verdicts: the flip/telos/order feel (A4), the Done-overlap
word (A2 — the retirement gate), the two-Plans word (A3 — recommendation
Beats). The rootless-cycle rider scheduled. Then item 54 closes.

— Fable
