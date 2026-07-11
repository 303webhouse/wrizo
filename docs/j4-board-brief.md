# J4 — The Board + the port — build brief

**Branch:** `j4-board` — created FIRST, before the first edit. Off `main` AFTER
the J3 + VW merges and their deploy land (J4's sync work joins a `sync.ts`
that must already carry `order_index` AND `imported_at` — the union-merge
lesson applies once, upstream of this ticket, not inside it).
**Arc:** J — "The Notebook & the Board" · ticket 4 of 4 · the synthesis
**Canon:** `docs/j-arc-design.md` (Fork 4) · ink canon 2026-07-03 · 2026-07-11
**Gates:** S25 AND desktop (box manipulation on touch and mouse are different
animals). Merge+deploy is the test per the reframed gate; J4 is not DONE
until both passes report.
**Place this file at:** `docs/j4-board-brief.md`

## Why

This is I2 and I3 made real, and the first fragments-under-Pages instance.
The Journal's pages (ordered by J1, erasable by J2, grabbable by J3) can now
be PORTED — copied, never moved — into a project as a **Board**: a canvas of
positioned boxes where the writer's text and ink live side by side, locked
together on arrival, separable on command. The diary keeps its record; the
binder gets its working artifact; the anime panel becomes movable.

## The model (binding)

    Box = {
      id: string,
      kind: 'text' | 'ink',
      x: number, y: number, w: number, h: number,  // normalized to page WIDTH
      z: number,                                    // stacking; new = max+1
      groupId?: string,                             // locked groups
      text?: string,                                // kind 'text'
      strokes?: Stroke[],                           // kind 'ink' (incl. erases)
      sourceEntryId?: string, portedAt?: string     // provenance
    }

- `JournalEntry.boxes?: Box[]` — a JSON column exactly like strokes. Server:
  ONE boot-idempotent `journal_entries.boxes text` column through BOTH sync
  mappers (jsonb-cast in the upsert, like strokes/tags). `pageType: 'board'`
  is a new value in an existing text column — no DDL.
- This Box shape is the DESIGN INPUT to the queued fragments-under-Pages
  committee pass. Build it as specified; do not generalize it here.
- Ink box strokes are RE-NORMALIZED on port: bbox origin (non-eraser points,
  per J2's convention) translates to 0,0 and scales so bbox width = 1 — the
  box crop-fits its drawing and transforms losslessly with `w`.
- The Board canvas: paper ground, page-width coordinate space, vertical
  scroll; height grows to fit content (max box bottom + margin), min one
  viewport. Boxes absolutely positioned.

## Slices

### Slice 1 — model, schema, shell
- `Box` type; `boxes` column + BOTH mappers (post-merge, grep-verify the
  journal_entries mappers carry order_index + imported_at + boxes together
  before proceeding).
- `createBoardPage(binderId, title?)` → a binder page with
  `pageType:'board'`, empty boxes.
- Routing rule preserved: `/page/:id` stays the one typed-page route;
  PageEditor delegates to a new `BoardEditor` when `pageType === 'board'`.
- Vocab: the pageType label map gains board → "BOARD" (mirror card speaks it).
- BoardEditor shell renders boxes READ-ONLY this slice: text boxes in the
  prose face, ink boxes via `renderStroke` with the box-local transform.
- Boards are binder-only in v1: the page file-menu is hidden on board pages
  (one-home untouched; Shelf/Journal homes for boards are a logged non-goal).
- Harness: a seeded board round-trips its boxes JSON (reload + sync).

### Slice 2 — the port
- `portToBoard(sourceIds: string[], dest: binderId | 'new', includeInk: bool)`:
  - COPY, never move — source journal pages byte-untouched (harness-assert).
  - Per source page, in selection/notebook order, stacked vertically with
    spacing: a text box (content width ~0.6 page width, height auto) and —
    when `includeInk` and the page has strokes — an ink box (bbox-fit, max
    0.5 page width) directly below it, sharing a fresh `groupId` (the LOCKED
    group: Nick's "ink locked to the text," realized). Text-empty pages port
    ink-only; ink-empty pages port text-only; the group forms only when both
    exist. Provenance (`sourceEntryId`, `portedAt`) on every box.
  - `dest: 'new'` → create an Untitled binder ON THE SPOT (F4's law: Untitled
    is a valid birth name; kind 'other') and port into it — one tap, no
    modal-in-modal.
- Entry points:
  - A loose journal page's actions row: "Port to a Board…".
  - The Spread's Select mode header gains its FIRST action: "Port N pages…"
    (the J3 dead-button rule lifts here, by design).
- The prompt: ONE choice per port, only when any selected page has ink —
  "Text only" / "Text + ink". No per-page interrogation.
- The destination picker: existing binders (drawer-grouped, quiet) +
  "＋ New project". Lands in the new Board on completion.
- Harness: single-page and 3-page group ports land correct boxes, groups,
  order, provenance; originals untouched; ink-only and text-only pages
  degrade correctly; 'new' destination births Untitled and ports.

### Slice 3 — manipulation
- Select: tap/click a box → brass border + ONE corner handle; selecting any
  grouped member selects the GROUP (moves as a unit). Tap-outside/Esc
  deselects. One selection at a time.
- Move: drag (mouse: threshold-commit; touch/pen: the SAME gesture
  disambiguation the S25-verified Spread uses — if J3's gate changed the
  pattern, mirror the change; pointer capture on lift, per the J3 fix).
- Resize via the corner handle: text box → width (height reflows); ink box →
  uniform scale. Grouped members: move-only — ungroup to resize.
- Quiet action row on selection: **Ungroup** (grouped only — the unlink,
  one-way in v1) · **Remove** (boxes are copies; the diary keeps the
  original). ONE-SLOT undo (the house lastAction pattern) covering the last
  move/resize/remove/ungroup.
- Pen discipline (the ink canon, extended): the pen on a Board is a POINTER
  — it selects, drags, resizes — and NEVER draws (ink reaches a Board only
  by porting) and NEVER types: board text boxes get the ForwardOnlyEditor
  pen treatment (pen pointer events neutralized for text entry;
  touch-action per the I0 pattern) because the Samsung recognizer hazard
  returns exactly here and we preempt it rather than rediscover it.
- Autosave: box mutations serialize the whole boxes array through
  `saveJournalEntry`, debounced like text, `flushNow` on hide.
- Harness: CDP drag/resize persist across reload + round-trip; group-move
  moves members together; ungroup separates; remove + undo restores;
  synthetic pen events on a text box produce zero characters.

### Slice 4 — text editing + the wall
- Double-tap/double-click a text box → edit in place: a plain contenteditable
  under DRAFT law (free editing — Boards are Trellis-side; no forward-only,
  no mode strip anywhere on the Board).
- The Voice Wall applies: `.board-text` joins the wall's prose-surface set —
  foreign paste blocks + whispers; the own-ink shadow passes; copy-out free.
- Harness: edits persist; foreign paste blocked with whisper; shadowed own
  text pastes; metadata (board title via ProjectHome rename) unaffected.

## Non-goals (logged, the anti-Canva guard above all)
NO styling — fonts, sizes, colors, shapes, backgrounds: never in v1 (boxes
carry content and position, period). Append-to-existing-Board (v1.5);
multi-box selection / lasso; re-group after ungroup; rotation; manual
z-order UI (auto max+1 only); board→Journal back-porting; drawing on Boards;
Shelf/Journal homes for boards; board templates; per-page ink prompts.

## Invariants
- COPY semantics absolute: no port ever mutates, moves, or deletes a source
  journal page. One-home untouched (the Board is a new entry, home binder).
- The ink canon holds: no surface outside the Journal ever CREATES ink.
- Chronological stroke order inside an ink box (J2's law travels with the
  copy). Style-free strokes; the box transform is the only scaling.
- Forward-only, honor-discard, the Journal editors: untouched.
- Sync checklist: `boxes` in push AND pull mappers; live round-trip on the
  deploy; the post-merge grep (order_index + imported_at + boxes) precedes
  any server work.

## Definition of done (in-harness + BOTH hardware gates)
1. Slice-by-slice harness checks above, all green, plus: `tsc` (desktop +
   server) + `build:web` + selftest.
2. The mirror card renders a board target as "<KIND> · BOARD" with the board
   title in the crumb; Keep writing lands in the BoardEditor.
3. Live prod round-trip for `boxes` after deploy (D2 precedent).
4. S25 GATE: box drag/resize at thumb size; the group-move feel; long-press
   semantics consistent with the Spread; pen-as-pointer works and the pen
   CANNOT type into a text box (the recognizer probe, on real hardware).
5. DESKTOP GATE: mouse precision — select/drag/resize/handle targets at
   cursor scale; double-click-to-edit doesn't fight single-click-select.
6. J4 is DONE only when both gate reports land.

## Working environment
- Branch `j4-board` FIRST, before the first edit. Report = push.
- PowerShell edits via `[System.IO.File]::ReadAllText/WriteAllText`, UTF-8 no
  BOM; `git --no-pager` always. Log the shipped ticket to `docs/backlog.md`.
