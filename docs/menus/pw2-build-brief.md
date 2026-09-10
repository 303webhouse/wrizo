# PW2 BUILD BRIEF — NESTING AND TRANSFER
### PLAN desk · 2026-09-07 · decision-complete · items 128 + 123

**WORKTREE:** `.claude/worktrees/pw2-nesting-transfer` · **BRANCH:** `pw2-nesting-transfer`
· **OFF:** `origin/main` **after PW1 has merged** — this slice builds on PW1's side menu,
its membership/display split, and its cascade persistence. **Never the primary checkout.**
**This lane pushes its BRANCH; the merge is chat 1's.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — standing law (Fable via Nick, 2026-09-08).
> **One machine, one browser pool: a run from ANY tree is a run on the box.** Your own
> worktree buys you file isolation and nothing else. This brief's close conditions end at a
> full suite in both settings, so **before any harness, probe or suite launch, read the
> current box ordering on the ledger or ask chat 1 — never infer your turn from quiet.**
> Contention has voided runs in batches; every one of them was a lane that believed its tree
> was its own machine.
>
> *This clause carries no dates and names no window on purpose: a dated hold written into a
> durable brief goes stale and then misleads. The ordering lives on the ledger; the law lives
> here.*


**GATE:** PW1 merged. If PW1 is still an offer, this brief waits — do not fork the side menu.

> **⚠ LINE NUMBERS ARE A COURTESY; SYMBOLS ARE THE ANCHOR.** Every reference below was
> verified against **`0d352c9`** while this brief was being written — and `PageEditor.tsx`
> **moved under this desk mid-brief** (the Ink lane, `af3c79c` / `cec9180`), which is exactly
> why this note exists. **Locate by symbol name, never by line.** If a number misses, the
> symbol is still right and the number has drifted; report it, do not hunt.

**SOURCES.** Ledger items **123** (card transfer) and **128** (nested boards), the
three-space canon (open-threads §2291–2334, `3d80a0f`), and the desk's **Journey D**
(`pw-journey-d-the-nest.html` — the journey item 128 asked this desk to design; it is the
visual spec for everything below).

---

## §0 · WHAT THIS SLICE IS

Two capabilities that share one grammar and one guard:

- **Nesting (128).** A board is a **recursive container**. A board is a member of a board
  exactly as a page is — same membership, same two display acts, same rows.
- **Transfer (123).** A card is **copied** from one board to another. Copy only.

**Nesting is largely free today — and that is also the hazard.** See S1.

---

## S0 · SURVEY

**(a) Verify, do not assume: nesting may already work.** `pinPageToBoard`
(`persistence.ts:1013`) guards **three** things and only three — self-pin
(`entryId === boardEntryId`), a **system-board source** (`getSystemKind`), and that the
**target** is a board (`board.pageType !== 'board'`). **It never checks the source's
`pageType`.** So a normal board may already be pinnable onto another board on today's build,
carried by the same `page-pin` Box, and `travelToPin → routeForEntry` already resolves a
board entry to the board route. **Confirm this at the branch tip and report** — it changes
how much of S2 is new code versus new chrome.

**(b) ⛔ AND NOTHING GUARDS A CYCLE.** Confirm by inspection that no ancestor check exists
anywhere on the pin path. S1 is the first invariant and it lands **before** any nesting
chrome ships.

**(c)** Confirm PW1's side menu, membership/display split and `⋯` menu are on `main` and
unchanged in shape. Report any drift — this brief's chrome hangs off them.

**(d)** Park discipline as PW1's S0(d): anything rewritten in place is **parked with its
original quoted verbatim**, and the **park COUNT is audited against this brief's claim** — a
green run cannot see a check that is no longer there.

---

## S1 · THE CYCLE GUARD — item 128's FIRST invariant. Build it first.

**The law, Fable's words, verbatim, and it belongs in the code comment:**

> **A board cannot be placed inside itself, or inside a board it already contains.**

**⚠ THE BUILD LAW — THE ANCESTOR WALK RUNS AT EVERY MEMBERSHIP WRITE, NEVER ONLY THE FIRST.**
A membership that is lawful when made becomes a cycle later, when its **parent** nests
somewhere new. A first-write-only guard is a guard that misses the exact case it exists for.
**Walk ancestors on every membership write, both directions of the relation.**

**Why it is worth building first, in one line:** a cycle presents as a hang or a blown stack,
far from the pin that caused it — trivial to prevent, expensive to find.

**Two cases, opposite treatments, and the split is principled — ONE grammar for refusals:**

| case | treatment | why |
|---|---|---|
| **self** — a board on itself | **ABSENT.** Never listed. | Nonsense, not a refusal. Nothing to teach, and the built self-pin guard already holds it. |
| **descendant** — a board into something it contains | **INERT, reason on the control:** `already contains this board` | **G3's LAWFUL pole**, not its forbidden one: a *transient* gate on real capability — remove the inner membership and the pairing becomes legal — with the refusal disclosed. Same shape as the selection-gated action row, and as PW1's inert *Unlink*. |

**Absence would be wrong here** and the reason is worth keeping: it makes the writer hunt for
a board they can see on their own crumb.

**The zone carries Fable's sentence as its own line** beneath the list.

---

## S2 · NESTING — the board-card

- **A nested board renders on its parent as a BOARD-CARD** (128). **Shape teaches the kind**,
  extended to a third silhouette and **spending no colour** (the Plateau ember ceiling is
  untouched, and this is the same job Pass 5 routed to item 96 as *colour-as-kind-signal* —
  shape does it instead): a **doubled edge — a thing that holds things**. See Journey D's
  `.brdcard`. Its badge reads **`Board`**, never *"From a page"* — the badge is the noun and
  CA1 binds: *covering the badge still tells you what you're holding.*
- **DOUBLE-CLICK TRAVELS IN** (128), matching PW1/S2's board-thumbnail rule exactly. **Menu
  twin required** (PW22): the same act as a row in the `⋯`.
- **Membership generalizes, unchanged** (125): a board is a member of a board exactly as a
  page is — **not displayed** until `Display on Board` or a drag. One rule covers pages and
  boards; there is no second model to learn.
- **PW13's list wakes.** On a board, `BOARDS CONNECTED` names **its drawer AND any parent
  boards** — same heading as on a page (G2: one form, two contents; one word for the writer
  to learn, not two).
- **The crumb carries the nest chain** — `Novel / Westeros — the whole / Stark`. Once
  containers hold containers this is the only thing that answers *"where am I"* without
  opening anything, and **the parent segment is the door out**. PW1's S6 never-empty rule
  still binds. *The test a recursive container has to pass: the address stays one line and
  the way back stays one press, at any depth.*

---

## S3 · TRANSFER — item 123, COPY ONLY

**Semantics, verbatim from the ledger — all four are harness-owed:**
- **The original stays. There is NO SHARED IDENTITY — edits do not follow.**
- **Tags travel with the copy; THREADS DO NOT.**
- **Every card keeps ≥ 1 board.**
- **COPY ONLY.** *Move* is an ownership transfer and a different act in a canon built on
  ownership — **deferred, not designed. Do not build it.**

**The door — already ratified, and it is not a new act:** the built per-row `⋯`
(`CascadeSurvey.tsx:96`), which already carries Move/Delete on **board** rows via
`BoardRowMenu`. **Card transfer is that same grammar one level down.** PP4 is intact: a quiet
disclosure is not a competing primary act.

**The verbs teach the kind (CA1), and the canon does the sorting:**

| row kind | verb | why |
|---|---|---|
| **free / text card** | **`Copy to <board>…`** | board-owned **content**; a copy is a new owned card |
| **page-pin** | **no copy verb** | **membership**, not content — "copying" it is just a second membership, which PW1's checkbox already makes |
| **board-card** | **no copy verb** | membership too (Fable, this arc): *"copying a board-card is membership, not content"* |

**The tray discloses all three consequences before the act, in one line:**

> *A copy is a new card owned by the board it lands on. Its tags come with it; its threads do
> not, and edits do not follow.*

A writer who copies a threaded card and finds the thread gone has been surprised by the app,
which is the one thing the tray exists to prevent.

**The ≥1-board invariant is RENDERED, not merely enforced:** on a card whose only board this
is, the removal verb is **present, inert, and says why — `its only board`.** Same refusal
grammar as S1. **Provenance carries on the built fields** — `sourceEntryId` / `portedAt`
(*"provenance travels on every box"*, FX5 S3) — and the arrived copy **states its lineage in
the second-line slot**: `copied from <board>`. No badge, no colour, no count.

---

## S4 · THE HARNESS — `apps/desktop/scripts/harness/pw2.mjs`

Auto-discovered; no registration. Same standing laws as PW1/S7 — **drivers never assume
existence**, **real pointer events**, **seed through the seams**, **absolute worktree path**.

**Checks owed, at minimum:**
1. **⚠ THE ANCESTOR WALK, at a LATER write.** A→B lawful; then nest B's parent so A becomes
   an ancestor; assert **the guard fires on that second write**. *A first-write-only guard
   passes a naive test and fails this one — this is the check the build law exists for.*
2. Self is **absent from the list**; a descendant is **present, inert, reason rendered**.
3. Deep chain (3+ levels): travel in by double-click; the crumb renders the full chain; the
   parent segment returns; **the `⋯` twin performs the same travel.**
4. A nested board is a **member and NOT displayed**; `Display on Board` puts it on the canvas;
   its badge reads `Board`.
5. Copy: original unchanged; **the copy's edits do not appear on the original** (both
   directions, one fixture); **tags present on the copy; threads absent**; lineage line
   rendered.
6. **No copy verb** on a page-pin row or a board-card row; **present** on a free card.
7. Last-board removal is **inert with its reason**; a card with two boards removes normally.
8. Both `HARNESS_PARKED` settings CLEAN; **park count audited.**

---

## §CLOSE · CLOSE CONDITIONS

1. S0 reported (especially (a) — how much of nesting already works — and (b)).
2. **S1 lands before any nesting chrome.**
3. Build S1–S4; `tsc` + `build:web` + selftest + full suite, **both settings**, green,
   independently re-run on the branch tip.
4. **Push the branch. Do not merge.** Offer to chat 1 through Nick; Fable reviews.
5. **Not in this slice:** Move semantics · item 116's import · specialty board TOOL tabs
   (R13.vii hold) · the drawer-board surface if PW1 deferred it.

**Nothing deploys on this lane's word.**
