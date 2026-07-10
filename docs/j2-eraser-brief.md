# J2 — The eraser (erase-as-strokes) — build brief

**Branch:** `j2-eraser` — created FIRST, before the first edit. Off `main`.
**Arc:** J — "The Notebook & the Board" · ticket 2 of 4 · ink layer, HARD S25 gate
**Canon:** `docs/j-arc-design.md` (Fork 1: hybrid, raster rejected) · 2026-07-09
**Deploy note:** deploy ONLY after Nick's S25 pass — eraser feel is
hardware-invisible by definition.
**Place this file at:** `docs/j2-eraser-brief.md`

## Why

Rub-out-pixels, without giving up anything that makes the current ink good.
Fork 1 is resolved: an erase IS a stroke — same normalized geometry, an
additive `eraser: true` flag — painted in chronological order with
`destination-out`, so it rubs pixels to the paper while the data stays
device-independent vectors that sync as small JSON, thumbnail for free, and
transform losslessly into J4's ink boxes.

## Slices

### Slice 1 — data + render (`store/ink.ts`, types)
- `Stroke.eraser?: true` — additive inside the existing strokes JSON. ZERO
  server change; `saveJournalEntry` untouched (the J8 pattern).
- `ERASER_WIDTH` render-time constant beside `INK_LINE_WIDTH` (start ~22px;
  the S25 pass tunes it). Style-free canon holds: no per-stroke width stored.
- `renderStroke`: when `stroke.eraser`, save/restore around
  `globalCompositeOperation = 'destination-out'`, `ERASER_WIDTH`, opaque
  color (hue irrelevant under destination-out).
- Paint order is LAW: verify `paintCommitted` walks the strokes array in
  chronological order (draw → erase → draw-over must render new ink atop the
  erased region). The IN-FLIGHT stroke must also paint destination-out live
  while erasing — the feel is rubbing, not stamping-on-lift.
- `renderThumbnail`: paint erase strokes, EXCLUDE their points from the bbox
  fit (an erase sweep must not shrink the drawing in the frame).

### Slice 2 — capture + chrome (`pages/JournalEntry.tsx`)
- A two-state pen/eraser toggle in the ink chrome cluster (with undo), riding
  the chrome-fade layer. Session-scoped: a freshly opened page always arms
  the pen.
- Hardware eraser as progressive enhancement: on pen pointerdown, if the
  event reports the eraser (`pointerType 'pen'` with `buttons & 32`, or an
  eraser pointerType where the platform reports one), that stroke is an
  erase regardless of the toggle. Document the S25 detection matrix in the
  report — what the events actually carry. The toggle is the guaranteed
  path; the signal is a bonus.
- While the eraser is armed: a minimal ring preview (ERASER_WIDTH diameter)
  follows the pen on the ink canvas — render-only, aim matters. Capture
  ownership unchanged (I0 stands: the pen never scrolls, never types).

### Slice 3 — undo interplay (verify, not build)
The existing one-level ink undo removes the LAST stroke; an erase stroke is a
stroke, so undoing an erase restores what it hid. Verify; add nothing.

## Non-goals (logged)
Variable eraser sizes; stroke compaction/vacuum (fully-erased strokes persist
— Wrizo never destroys); lasso/selection; per-stroke style storage; any
server or schema change; anything Board (J4).

## Invariants
- Strokes remain pure geometry + the one semantic flag. No stored style.
- Chronological paint order everywhere strokes render (live canvas AND
  thumbnails) — draw-over-erase correctness depends on it.
- Text layer, forward-only, honor-discard, sync: untouched.
- I0 pen discipline on non-Journal surfaces: untouched.

## Definition of done (in-harness + HARD S25 gate)
1. An erase stroke round-trips inside the strokes JSON (reload + harness
   sync) with `eraser: true` intact.
2. Draw → erase-across → draw-over renders correctly (CDP pixel-sample
   assertions on all three regions).
3. Thumbnail fixture: a small drawing + a huge erase sweep → the drawing
   still fills the thumb; erased pixels absent from it.
4. Undo removes the last stroke whether ink or erase; an undone erase
   restores the hidden pixels.
5. Toggle: pen by default per page; arm/disarm works; the ring preview
   follows while armed; everything rides the chrome-fade layer.
6. `tsc` (desktop + server) + `build:web` + selftest green.
7. S25 GATE (deploy blocks on this): rubbing feels like rubbing (latency,
   width verdict on real handwriting), the ring is visible-but-quiet on the
   paper, and the hardware-eraser detection matrix is documented —
   works/doesn't, and exactly what the pointer events report.

## Working environment
- Branch `j2-eraser` FIRST, before the first edit. Report = push.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
