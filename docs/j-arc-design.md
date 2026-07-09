# J-arc — The Notebook & the Board (architecture, forks resolved)

**Status:** design canon for the four coupled pieces Nick specified (2026-07-05).
One brief per ticket follows, per house law — J1 ships with this doc; J2–J4
briefs follow as each predecessor is reviewed.
**Canon honored:** the ink canon (2026-07-03: ink sealed in the Journal; Pages
are the typewriter; ink reaches a project only by porting) · north-star v0.2 ·
forward-only · honor-discard · one-home · copy-out-is-sacred · the sync
checklist. Baseline assumes the three shipped mobile/feel fixes.
**Place this file at:** `docs/j-arc-design.md`

## The arc at a glance

- **J1 — Ordered pages + navigation** (plumbing + light chrome)
- **J2 — The eraser** (the ink-model decision, realized)
- **J3 — The spread view** (thumbnails, drag-reorder, multi-select)
- **J4 — The Board + the port** (the big one: I2/I3 realized, the first
  fragments-under-Pages instance)

Sequence J1 → J2 → J3 → J4: plumbing first, then the daily-feel win, then the
management surface, then the synthesis that depends on both. (CC suggested
reorder before eraser; flipped because J2's ink decision de-risks J4's data
model early, and the eraser is the piece Nick feels every day he journals.)

---

## Fork 1 — the eraser: HYBRID (erase-as-strokes). Raster is rejected.

**Decision:** erasing stays vector. An erase is a `Stroke` with an additive
flag — `eraser?: true` — recorded exactly like ink (normalized points), and
painted in strict chronological order with `globalCompositeOperation =
'destination-out'` on the transparent ink canvas, so it rubs pixels out to the
paper beneath. Draw-over-an-erase works because order is honored.

**Why not raster:** the current system's proven virtue is that strokes are
device-independent pure geometry (`{points: {x,y,p?}[]}`, normalized by sheet
width, style applied at render time) — a tablet drawing renders faithfully on
a phone, thumbnails are a bbox transform, resize repaint is free, and the
whole thing syncs as small JSON through the existing whole-record write with
zero schema. A raster layer forfeits every one of those at once (resolution
choices, blob sync, snapshot undo) and — decisively — kills J4: an ink BOX
must move and scale losslessly, which vectors do and bitmaps resample. The
felt experience Nick asked for (rub-out-pixels) is fully delivered by the
mask: the eraser removes whatever pixels its path covers.

**Consequences, encoded:**
- `Stroke.eraser?: true` is additive inside the existing strokes JSON — zero
  server change; `saveJournalEntry` untouched (the J8 pattern).
- Style-free canon preserved: no per-stroke width. `ERASER_WIDTH` is a
  render-time constant (a fat multiple of `INK_LINE_WIDTH`), like the one pen.
- `renderStroke` gains the composite-op branch; `renderThumbnail` paints erase
  strokes but EXCLUDES them from the bbox fit (an erase sweep must not inflate
  the frame).
- Fully-erased strokes remain in data — Wrizo never destroys; a compaction
  pass is a logged non-goal.
- Activation: an explicit eraser toggle in the ink chrome ALWAYS; the hardware
  eraser signal (pen `buttons & 32` / eraser pointer, where the device reports
  it) is a progressive enhancement verified on the S25 — never the only path.

## Fork 2 — ordering: `orderIndex`, sparse float, the spineOrder pattern.

`JournalEntry.orderIndex?: number` — additive, optional, the J6 pattern. Sort
for the loose-Journal notebook = `orderIndex ?? epoch(createdAt)` — no
backfill, no migration; every existing page keeps its chronological place
until first touched. Insert-between = midpoint; a normalize pass re-spreads
when neighboring gaps fall under epsilon. Server: one boot-idempotent
`order_index double precision` column through BOTH sync mappers. Scope is the
loose Journal only — binder pages and the Shelf keep their current orderings
(a logged non-goal, not an oversight).

## Fork 3 — the spread view.

"Spread the notebook open": a grid of page thumbnails — `renderThumbnail` for
ink + the first line as a caption (text-fidelity thumbnails are a non-goal) —
long-press to lift, drag to reorder, persisting `orderIndex`. Multi-select is
built here on purpose: it is J4's selection surface for the group port.
Hardware gate: touch-drag feel is S25 work.

## Fork 4 — the Board (what a "Draft page" IS), and the port.

**Naming first:** "Draft page" collides fatally with Draft MODE. The new
species is a **Board** (`pageType: 'board'`) — one new value in the existing
text column, riding every typed-page pipe (routing, mirror-card vocabulary tag
"BOARD", filing, resume). Nick may veto the word; the model stands either way.

**What it is:** a NEW page species, not a replacement. Manuscript sheets stay
the typewriter — flowing prose, pagination, future Format conventions. The
Board is the drawing pad's binder cousin: a canvas of positioned boxes. In Two
Minds terms it is Trellis-side — arrangement is convergence — which settles
the forward-only question cleanly: **Board text boxes edit freely.** No modes
strip on a Board; generation happens in the Journal and Free write, Boards
arrange what generation produced.

**The data — and the fragments statement:** `JournalEntry.boxes?: Box[]`, a
JSON column exactly like strokes (one boot-idempotent `boxes text` column,
both mappers). The Box shape is designed fragment-compatible ON PURPOSE:

    Box = { id, kind: 'text' | 'ink', x, y, w, h,   // normalized to page width
            z, groupId?,                             // locked groups
            text?,                                   // kind 'text'
            strokes?: Stroke[],                      // kind 'ink' (incl. erases)
            sourceEntryId?, portedAt? }              // provenance

**This is the first fragments-under-Pages instance.** Its schema is the design
input to the queued substrate committee pass — we are not building a second
object system, we are building the first visible one and letting the
substrate pass generalize it.

**The port (I2 realized):** COPY, not move — a deliberate one-home nuance:
one-home governs entities, and the Board is a NEW entry whose boxes carry
copies with provenance (`sourceEntryId`); the journal original never leaves
the diary, because the diary is the permanent record. The ported page lands as
ONE LOCKED GROUP — a text box + an ink box sharing a `groupId`, moving as a
unit — which is Nick's original "ink locked to the text" canon realized; an
**Ungroup** action is the unlink, freeing each box to move and edit
independently (I3 realized: the anime panel, movable). Ink boxes transform
losslessly because Fork 1 kept vectors.

**Destinations v1:** an existing binder, or a new project via mini-create —
either way a Board page is created there (`/page/:id`; PageEditor delegates to
a BoardEditor when `pageType === 'board'`, so the one routing rule survives).
Group port from J3's multi-select: N pages → N locked groups in a vertical
flow on one Board. "Append to an existing Board" is v1.5.

**The anti-Canva guard (Marketing's one hard line):** no styling toolbar,
ever, in v1 — no fonts, no colors, no shapes. Boxes carry content (text, ink)
and position only. The differentiator is the JOURNAL→BOARD flow, not layout
features; the moment the Board grows a toolbar it starts competing with tools
that do toolbars better.

---

## Gates & schema tally

- J1: harness-verifiable + a light phone check (arrow placement vs dissolve).
  Schema: `order_index`.
- J2: HARD S25 gate — eraser feel, width, hardware-eraser detection. Schema:
  none (flag rides strokes JSON).
- J3: S25 gate — touch drag. Schema: none.
- J4: S25 + desktop gates — box manipulation on touch AND mouse. Schema:
  `boxes`.
All server work is boot-idempotent columns through both sync mappers, per the
checklist. One brief per ticket; each reviewed before the next begins.

## Arc-wide non-goals (logged)
Styling/toolbars on Boards; lasso stroke-splitting (one ink box per port in
v1); variable eraser sizes; page-flip gestures (buttons only; margins scroll);
binder-page or Shelf ordering; text-fidelity thumbnails; stroke compaction;
Board templates.
