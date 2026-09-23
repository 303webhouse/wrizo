# ITEM 144 — THE BOARD TABS · OFFER, STAGE 1 (tools lane; branch `item144-board-tabs`)

Built from `plan-144-amend` @ `ccbc99a` (merged to main at `8b563ba`): `b144-board-tabs-build-brief.md`
as amended by `b144-plus-menu-and-unnest-amendment.md` (**§8 there governs where they disagree**) and
`b144-tab-bar-amendment.md`. **Nothing here has run — it needs a box turn.** The tabs were never built
before (144 was gated on 108), so this is the first row.

## What is built (stage 1)

- **`store/boardTabs.ts` — the read side, pure.** `getBoardsInside` (**S0(c): the children reader the brief
  asked for**), `boardTabRow` (T2: drawer boards in **birth order**, each followed by its children, a board
  once under the parent `boardNestChain` names, foreign-drawer boards wearing the **"in X"** line, condition
  boards excluded), `connectListRows` (T4's states from the store's **one** guard, `wouldNestCycle`),
  and **`drawerCaptionFor` — S0(d): one "in X" helper.** Item 163 had written it locally in
  `CascadePanels.tsx`; it now lives here and `CascadePanels.tsx` imports it (the local copy is deleted).
- **`components/BoardTabs.tsx` — the row.** A `<nav data-board-tabs>` named for the drawer (never a
  `tablist`); each tab `data-board-tab="<id>"`, current = `aria-current="page"` with an **olive**
  (`--accent-rest`) underline, not pressable; a press **travels** (`flushNow()` then `/page/<id>`), writes
  nothing. **The bare "＋" beside the CURRENT tab** — no visible word, accessible name **"Add a board to
  Characters"** — opens a menu in the row's own band with **exactly two rows: Add Board, New Board.** No Unlink
  in it. The two rows are two separate items over two callbacks, **so they swap by editing one line each** —
  Nick's answer on PLAN DESK's alternative reading is pending, and this is built to his literal words:
  **Add Board = an existing board becomes a nested one (the connect list); New Board = a new board is born
  nested in this drawer, name field focused, and you travel to it.**
- **`BoardEditor.tsx` — the smallest mount.** The row renders after `boardContent` in **both** layouts
  (framed and narrow); non-system boards only. **The room law:** the wrap's measured height now subtracts the
  row's own **rendered** height (read from its rect; observed, since the band grows) — a system board has no
  row and subtracts nothing. The two doors append the new pin to the component's **own live boxes** (**item
  92's law**), never assign the store's copy. A one-shot `state.nameFocus` opens the crumb rename **empty** on
  arrival at a New Board (consumed and history-replaced, like `actionToast`).
- **`scripts/harness/i144.mjs`** — brief S2 checks 1–11 by name, P1/P2, the item-92 survival check at the new
  door, and **the 169 stage-width measurement** below. Every press is a hit-tested `trustedDispatch`.

**Verified without the box:** `tsc` 0 · `build:web` 0 · markers in the bundle · harness syntax-checked · and a
**pure-logic dry run of `boardTabRow`/`connectListRows` against the harness's own fixture** (esbuild, a fake
store): the row order `[Characters, Plot(1), Lore, Notes(1, "in Research")]`, identical order from every
board, and the connect states — Lore: Notes *already inside*, Plot/Characters pressable; **Plot: Characters
*contains this board***; Characters: Plot *already inside*.

## NOT built yet — named, not silent

- **The third "+" row, Connect Board** (Fable, late: a toggle-open list of all boards, most recently opened
  first) — waits for PLAN DESK's amendment. It lands as a third item over the same band; nothing here blocks it.
- **Unlink on a nested tab (§2)**, **un-nesting by drag (§3 — P4–P6)**, **double-click replaces the parent with
  a back arrow (§4 — P7)** — stage 2. Note §3 collides with item 118's hard stop and 168's trash target; its
  build needs the collisions the amendment names.
- **T5 tag narrowing** (gated on item 108, per BT-Q2). **Thumbnails** in the connect list (T4 asks for a
  type-proportioned thumbnail per row; the list is words + the "in X" line for now).
- **The back-arrow "in place" route question** (§4: same route with the pane's content swapped, or navigate) is
  stage 2's S0.

## S0 for item 169 — THE PANE COUNT (the stage-width arithmetic, `CANVAS_MIN_W` 560)

**The amendment's rule (§5):** panes = the largest n ≤ 3 such that n × 560 + (n−1) × gutter ≤ the stage's
measured width. **The gutter is not ruled;** this uses `--frame-gap` (28px), the only gap token the frame has —
stated, not chosen quietly.

**The stage's width, from the CSS (`.desk-frame-host` padding `clamp(16px, 3vw, 40px)` each side; boards pass no
corkboard, so `.desk-frame-grid` is one column, capped at `--frame-max` 1720px):**
`stage = min(viewport − 2·pad, 1720)`. `i144.mjs` **asserts the measured stage width equals this at every
width** (±2px) — so the table rests on a proved derivation, not a hand calculation — and emits the measured
table as a report check.

| viewport | pad | stage | 2 panes need 1148 | 3 panes need 1736 | **panes** |
|---|---|---|---|---|---|
| 1100 | 33 | 1034 | no | no | **1** |
| 1280 | 38.4 | 1203 | yes | no | **2** |
| 1366 | 40 | 1286 | yes | no | **2** |
| 1440 | 40 | 1360 | yes | no | **2** |
| 1680 | 40 | 1600 | yes | no | **2** |
| 1920 | 40 | 1720 (capped) | yes | no (16px short) | **2** |
| 2200 | 40 | 1720 (capped) | yes | no | **2** |

**Two findings, both for Fable/PLAN DESK to rule — this lane measures, it does not move the constant:**
1. **Three panes are unreachable at 560 with this frame.** `--frame-max` caps the stage at 1720; three panes need
   1736 with a 28px gutter. Nick's "three for desktops" needs one of: a per-pane floor ≤ 554px (with the 28px
   gutter), a gutter ≤ 20px (at 560), or a wider cap for the split. The amendment said *"if 560 proves too
   generous or too tight, the constant moves; the rule does not"* — **this is that measurement: at the ruled
   numbers the rule yields 1 or 2 everywhere.** Whether 554 is a readable per-pane floor is a founder look, not
   arithmetic.
2. **The split begins at ~1221px, not 1100.** Two panes need a stage of 1148 → viewport ≥ ~1221. So the
   1100–1220 band — laptops with a narrower window — gets **one** pane; "two for laptops" holds from ~1221 up.
   (Browsers with a classic 15px scrollbar shave that much off every stage; the harness reads the real width.)

Also noted, unmeasured: the board's own content wrapper is `min(100%, 1100px)` today, so a split would need the
board's container to stop being capped at 1100 — 169's build, not this one.

## Risks named, not measured

- **A board is ALWAYS given the row now** (user boards only) — there is no switch in the brief. Any existing
  harness that asserts the board's content geometry, the wrap's height, or counts on `role`/`nav` elements may see
  a row it never knew. **I cannot run the suite; the pair will find them, and each is parked verbatim with a
  successor — never edited.** `i144.mjs` itself parks nothing (count 0, emitted).
- **`BoardEditor.tsx` is touched** (five small hunks: import, handlers, the nameFocus effect, the room-law
  measurement, the two mounts) while FIX's 160 is also changing that file. I did not touch `BoardCardPopup`
  (Fable's instruction for 190); these hunks are elsewhere and should merge, but chat 1 should expect a textual
  conflict check against 160.
- **The loose-board New Board** births with `projectId: null` (created with `''`, patched to null) — a loose
  board's row is itself plus what it is connected to; that case has no check yet.

## Status

**BUILT, STAGE 1: the row, the order and stability, travel, the bare "＋" with Add Board / New Board, the connect
list's states, the room law, item 92's survival, and the 169 stage-width measurement.** Not run. Push, do not
merge; **a founder sitting is owed** — *"I can find the way to put a board inside a board, and I can move between
my boards with one click"* is a meaning claim no suite can make.
