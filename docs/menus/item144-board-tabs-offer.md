# ITEM 144 — THE BOARD TABS · OFFER, STAGE 2 (tools lane; branch `item144-board-tabs`)

Built from `plan-144-amend` (`b144-board-tabs-build-brief.md` as amended by `b144-plus-menu-and-unnest-amendment.md`
**§8 and §9 govern**). **Nothing here has run — it needs a box turn.** Stage 1 (`b6f4efc`) built Add Board as
"pick an existing board", the *alternative* reading; **stage 2 swaps to Nick's literal words** and adds everything
else Fable listed. **144 merges AFTER FIX's 160 (both edit `BoardEditor.tsx`).**

## What is built

**The menu — three rows, Nick's literal words** (`components/BoardTabs.tsx`, each a separate item over a separate
callback, so any reading swap is one line):
- **Add Board** = a **NEW board INSIDE this one** — born in this drawer, nested (a page-pin), name field
  focused, and you travel to it.
- **New Board** = a **NEW board BESIDE this one** — born in this drawer, **not nested**, **connected beside**
  (stored), you **stay put**, and a whisper says where it went (*"New board added beside Lore — open it from its tab."*).
- **Connect Board** = a **toggle-open list of ALL boards, most recently opened first**; the pick is connected
  **beside** this one. Self is absent; a board already beside is present and inert (*"already beside"*). The list
  opens in the row's own band (never over the canvas — item 166) and **the writer stays put**.

**"Beside" storage — the seam** (`store/boardBeside.ts`: `getBoardsBeside` / `isBeside` / `connectBeside` /
`unlinkBeside`). Nick: *"Store them properly."* The client half is written against **the exact shape in
`item144-beside-storage-s0.md`** (a column, `besideLinks` on board rows, one-ended with a reverse read; the S0
report is the hard stop **for the server half, which is NOT written**). It persists locally and is the final shape;
**if you rule a table, only these four functions change.** ⚠ **Until the server column lands, `besideLinks` never
leaves the device and a newer pulled row can replace it — 144 must not deploy without the server half.**

**"Recently opened"** (`store/boardRecents.ts`): a bounded (100) most-recent-first list of board ids in
`localStorage` (`wrizo-board-recents`), written when a board **mounts**; never-opened boards follow by `updatedAt`
descending (a **stated fallback**, not a claim about opening). **No column.** Named limits: it does not sync; a new
device starts on the fallback order; a cleared cache resets it.

**Unlink, on each tab's own ⋯** — **absent, not greyed**, when a tab has nothing to unlink; shown always on the
current tab and on hover/focus for the rest. *"Unlink from Characters"* names its parent **as the row draws it**
(nested), and *"Unlink from &lt;current&gt;"* on a tab **beside** the current board (now buildable — Nick answered
the storage question). Nested Unlink writes **membership only** (`unpinPageFromBoard`, and the live boxes drop the
pin too — item 92's law); beside Unlink **soft-deletes** the record on whichever row(s) stored it. Nothing is deleted.

**Un-nesting by dragging (§3).** The card **stops at the canvas edge** (item 118, untouched); only the **pointer**
leaves. A nested board's card (and only that) **arms** when the pointer is **≥ 32px** past the canvas wrap's visible
rect — read against the rect, **never the scroll offset**, so edge auto-scroll cannot arm it. Armed: a labelled band
(*"Release to unlink from Characters"*, `position:fixed`, displaces nothing) and a lifted card. Moving back inside
disarms with no effect. **Release while armed = Unlink**; **Undo is the drag's own start snapshot**, through the
board's own one-level **Undo** button. Nothing is ever left armed (`finish()` disarms on every exit).
Collisions: a release over a **tab** or the **trash icon** reverts the card and writes nothing.

**Double-click a nested board → the back arrow (§4).** The double-click's existing travel now carries a **stack of
frames** (the parent's id, name, canvas scroll and selection at departure). The child shows an icon-only arrow named
*"Back to Lore"*; **one press returns the parent as it was left** (scroll and selection restored once, history
replaced so a refresh never re-applies it; per-board mode already persists per board). It stacks. A tab press pushes
no frame. **The builder's S0 question (swap the pane's content, or navigate) is answered: navigate, with the state
in route state — one route per board, no second surface.**

## Item 169 — the pane count, TUNED (`store/splitPanes.ts`)

**Nick's counts are the requirement: two on laptops and tablets, three on desktops.** At the amendment's first
numbers (560 per pane, 28 gutter) three were **unreachable** (a 1736 stage needed; `--frame-max` caps it at 1720) and
two began only near 1221px. **Tuned: `SPLIT_PANE_MIN_W = 480`** (two need 988, three need 1496); the **28px gutter is
accepted** and the **frame max is left at 1720** — it was not the binding constant. **`CANVAS_MIN_W` (560) is the
canvas's own resize floor and is not changed**; a pane may be narrower than it (a wider persisted canvas scrolls
inside its pane's wrap).

| viewport | stage (`min(vw − 2·pad, 1720)`) | panes | with a 15px scrollbar |
|---|---|---|---|
| 1100 | 1034 | **2** | 2 |
| 1280 | 1203 | **2** | 2 |
| 1366 | 1286 | **2** | 2 |
| 1440 | 1360 | **2** | 2 |
| 1575 | 1495 | 2 | 2 |
| **1576** | **1496** | **3** ← the threshold | 2 |
| 1680 | 1600 | **3** | 3 |
| 1920 | 1720 (capped) | **3** | 3 |
| 2200 | 1720 (capped) | **3** | 3 |

**"Where a screen truly can't fit two readable panes, one is honest":** below 1100 there is no DeskFrame at all, so
no split — the rule's own floor. **Whether 480px is a *readable* pane for a board's cards is a founder look, not
arithmetic**; if it is too tight the constant moves and the rule does not. `i144.mjs` **measures** the real stage
width at every width, asserts it equals the CSS arithmetic (±2px) and asserts Nick's count is reached from the
**measured** stage. **No split view exists yet** — this is the constants and the proof, ready for 169's build.

## Verified without the box

`tsc` 0 · `build:web` 0 · markers in the bundle · harness syntax-checked · **two pure-logic dry runs against the
harness's own fixture** (esbuild + a fake store): the row order `[*Characters, Plot(1, under Characters), Lore,
Notes(1, under Lore, "in Research")]`, **identical from both ends of a beside connection**; connect is idempotent
in either direction and refuses self; the **reverse read** (Characters sees Lore with nothing on its row);
`besideCurrent` / `parentTitle` (so the right Unlink label shows); recents-first ordering with the never-opened
tail and self absent; unlink from the *other* end clears both ends. *(The first run showed two FAILs that were the
test's fault — two bundles each inlined their own fake store; one bundle passes all.)*

## NOT built — named, not silent

- **The trash-icon collision:** item 168 owns Delete and **no trash drop target exists yet**. The drag handler
  already yields to `[data-trash-target]` (a no-op selector until 168 adds it).
- **A release over ANOTHER PANE (169-Q7(c))** — no second pane exists.
- **A release over a tab while armed** is effectively unreachable: the tab row sits inside the 32px band, so the
  pointer disarms before it gets there. The rule (a tab release does nothing) is coded and un-asserted.
- **The whisper has no Undo *button* inside it** — `ActionToast` has no action slot and extending a shared
  component was out of scope. The board's own **Undo** button (already in the actions row) carries it; the whisper
  says so.
- **Thumbnails** in the connect list (type-proportioned, 172 §4) — words and the "in X" line for now. **T5** tag
  narrowing (gated on 108). **Duplicate**'s handling of connections (S0 open question; default: no).
- The stage-1 **inside-direction connect list** (`connectListRows`, already-inside / contains-this-board) is kept
  in `store/boardTabs.ts` **unused** — it is the Plan menu's *"Put inside…"* mounting (PLAN DESK's question with
  Nick), not the tabs'.

## Risks named, not measured

- **`BoardEditor.tsx` is touched in more places now** — the handlers, the recents write, the back-stack read and
  restore effect, `travelToEntry`, **and the pointer effect (the armed drag)** — while FIX's 160 is also changing
  that file. The drag hunks sit in the `dragging` branch of `onMove`, `finish()` and `onUp`; **expect a textual
  conflict check against 160, and merge 144 after it, as ordered.**
- **Every user board now shows the row** (no switch in the brief). Existing harnesses that assert board geometry or
  count `role`/`nav` elements may see it; the pair finds them and each is parked verbatim with a successor.
- **`$N` ordering against PW's `page_links`** in the shared INSERT — see the S0 report §3.
- **Overshoot while merely rearranging a nested board's card** is the desk's named unmeasured risk; the 32px
  hysteresis, the band and Undo are the three defences, none a measurement.

## Status

**BUILT, STAGE 2.** Add/New swapped to Nick's words; Connect Board on the seam; beside connections stored
(client half); Unlink for nested **and** beside; un-nesting by drag; the back arrow; 169's constants tuned and proved.
**HELD:** the server column (gated on Fable's S0 review). Push, do not merge — **a founder sitting is owed**.
