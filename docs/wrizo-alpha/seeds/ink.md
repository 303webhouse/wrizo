# INK — restart note

_Written 2026-09-23 at a clean stop. Nothing of mine was running; PW's 176 pair
held the box (its own worktree). Both my branches are pushed and their trees are
clean._

## 1 · ROLE

I am the **INK lane** in Wrizo (`writer-studio`). I survey, build, harness and
**offer**; I do not merge and I do not deploy.

- Relay comes through **Nick**, carrying **Fable** (reviewer, rules) and
  **chat 1** (merger, box grants). A new Fable took over at handoff `1331892`.
- **chat 1 merges to main.** An offer that exists only on my disk is not an
  offer — push the branch.
- **Ships are batched, on Nick's word**, and deploy runs **only from the primary
  checkout** `C:\Users\nickh\writer-studio`, never a worktree.
- **Never build in the primary checkout** — it is another lane's deploy staging.

## 2 · WORKTREES AND BRANCHES

| path | branch | tip | state |
|---|---|---|---|
| `C:\Users\nickh\writer-studio\.claude\worktrees\item157-ink-sheet` | `item157-ink-sheet` | `fb61ba5` | clean, pushed, `node_modules` installed |
| `C:\Users\nickh\writer-studio\.claude\worktrees\item171-typewriter-scope` | `item171-typewriter-scope` | `980360c` | clean, pushed, `node_modules` installed |

`origin/main` last seen **`fc8de60`** (2026-09-23). It moves under me — fetch and
re-read before branching or merging.

## 3 · ITEMS

### 157 — THE INK SHEET COVERS THE PAGE · built, awaiting its box turn
Nick: _"The ink is hard limited to a kind of text box, not the entire page
surface like it should be."_ **Ships as built** (ruled).

Ink now renders and captures on the **whole paper**: the canvases are portalled
into `.mode-page`, the **basis stays the sheet** (zero migration — production
carries ink stored against it), each paint translates by the sheet's live offset
and repaints on scroll (so ink still moves with the text — item 121's reason,
kept), the group-move clamp bounds are the page, and the scrollbar gutter is
excluded from capture.

Commits: `1870b90` S0 · `47c5380` fix · `431214d` harness + parks · `83bf018`
M4/M5 anchoring + M10 · `153da9c` ruling recorded · `fb61ba5` M11.

- Harness `apps/desktop/scripts/harness/item157.mjs`, legs **M0–M11**.
- **Parks (5, counted by execution):** `item121.mjs` S1, S2 · `item126.mjs` C1,
  C8, C8b. Originals verbatim, live successors, `pok()` entries in each file's
  parked leg.
- M10 measures the typewriter-band question (dissolved by 171); M11 measures the
  ink's reach against the paper's **outer** bounds on all four sides.
- **In the offer, in its own words:** an **eraser is a stroke**, so erasing does
  not restore the typewriter — **undo** does; and a page **at the top still
  lifts by the pad** when Ink is selected (scroll cannot go below zero).

### 171-A — TYPEWRITER SCOPE · built + amended, awaiting its pair after 157
Tip `980360c`. Rule: the typewriter runs **only** in Free Write/TEXT on a page
with **no ink**, or in **Draft** — which keeps **its own stored value**
(`typewriterDraft`, **default OFF**) so the two modes cannot write over each
other. **Never Revise.** Where unavailable the control is **absent, never
greyed**, on **all five** control surfaces together (SC1 S3's law).

- **Bare menu:** with Draft's typewriter ON the sliver's tools body renders
  nothing; the content **kind stays `'draft'`** (the foot decides which stored
  value it owns by kind).
- **Preset fix:** the beginnings doors and the first-line invite hide when INK
  is selected — one switch, one effect.
- **Parks:** `fx2.mjs` 11 (5 counted entries) · `item87.mjs` 2 · `ab2.mjs` 1 ·
  `fx3.mjs` 2 · `sc1.mjs` 2. My own never-shipped successors were amended **in
  place** (ratified) — parks protect the record of what was true **of the
  product**.
- Harness `item171a.mjs`, legs **T1–T13**.
- ⚠ **OWED: park `item157.mjs`'s M10 when 157 merges** — its premise is
  unreachable under this rule. Recorded in three places (157's S0 §10, M10's own
  comment, `item171a.mjs`'s parked section).

### 171-B — ink authoring on boards and cards · with PLAN DESK
A **feature build, not a gate**: a Board **renders ink it cannot author** (one
creation site, the port) and a **Card has no ink at all**. I build on PLAN's
charter. Three open questions: the coordinate basis (lean **box-local**), what a
card's ink is, and how a pen shares a board with select and drag.

### 183 — RESOLVED
The typewriter control **stays absent** on the screenplay surface and the engine
is **not** wired inside 171-A: that engine was removed for a **measured** defect
(SC-V4), and R12's hook-up is its own item. Lineage recorded in
`ScriptEditor.tsx`, `sc1.mjs`, `fx3.mjs`, `ab2.mjs`.

### 182 — not mine
"The grant proves a token, not a holder" (harness/tooling). Unrouted at last
check. Do not claim it.

## 4 · WAITING ON

- **chat 1 — the box.** Order: PW's 176 pair → FIX's 159, 158 → **my 157** →
  **171-A**. Each is granted separately.
- **PLAN DESK** — 171-B's charter.
- **Nick** — nothing blocking.

## 5 · RULINGS AND LAWS I WORK UNDER

**The box.** A worktree isolates files, **not the box** — one machine, one
browser pool. **Announcement grants the turn; quiet is only the safety check
after it.** Never arm a driver to launch on quiet. **A build is a run** — check
the process table (read-only) before `tsc`/`build:web`/`pnpm install`, and hold
while another lane's pair is live. Export `WS_BOX_TURN=<token>` matching
`C:\Users\nickh\.wrizo\box-turn.json`; **the token travels in the relay and the
grant file only — never into the ledger.** Pre-flight non-zero is a **STOP**.
**Push at pair start.** **Both legs always run** (`;`, never `&&`). Never kill
another lane's processes.

**Harness.** Park, never edit in place — original verbatim + SUPERSEDED +
successor. **Park also what stops meaning what it says**, not only what turns
red. **The park COUNT is the check**, read from the parked leg's JSON, never
from prose. Probe before every gesture; a driver can lie by dying or by doing
nothing. Trusted CDP pointers only. Select by name, not index. Suite runs use an
**absolute** worktree path.

**Writing files.** **Special content — backticks, backslash escapes — goes
through a FILE, never a shell heredoc or `python -c`.** I broke this once on
171-A; `node --check` caught it and it was repaired through a file.

**Judgment.** Hand up conflicts **with a lean**, and state the rival in its
strongest form. Verify a scout's or subagent's claims in source — disk wins.
Never count from a view you cut. Measure before calling something variance.

## 6 · BOOT ORDER

1. Read this note, then `MEMORY.md` and the memory directory.
2. Verify both worktrees are clean and pushed; fetch and read `origin/main`.
3. **Run nothing** — no harness, suite, build or install — without an announced
   turn. Check the process table read-only first.
4. When 157's turn is granted: merge `origin/main` and re-verify by content →
   export the token → pre-flight → **push** → the **two approved mutation runs**
   → the **stamped pair in both settings** → audit the park count by execution →
   write the offer record and ledger entry (house form: branch, tip, both SUITE
   RESULT lines, the tree the record names).
   - Mutation (a): remove the `inScrollbar` guard in `InkStratum`'s edit
     `onDown` → expect M8 red. **If it stays GREEN, say so plainly** — that is a
     claim about Chromium not dispatching `pointerdown` on scrollbar presses,
     not about the product.
   - Mutation (b): remove the scroll-repaint effect → expect M5 red.
   - Commit before mutating, **assert the mutation landed** before believing a
     red, restore in a `finally`, rebuild after restoring.
5. Then 171-A's pair, on its own grant.
6. Report to Fable as before; the relay comes through Nick.
