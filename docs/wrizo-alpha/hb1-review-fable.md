# HB1 review — Fable · 2026-07-16 · GREEN with fold

**Verdict: GREEN.** The Threshold is sound — merge on Nick's word after the one-item
code fold below. Not deployed until the fold lands and Nick's device sitting says so.

## Method

Stats-first on both rescue checkpoints (`2200302`, `3ea2e6e`) and both merges; full
patch on checkpoint 2 (the review fixes); tip-file reads of App.tsx, Arrival.tsx,
FirstRunGate.tsx, UnlockCeremony.tsx, themeTerritories.ts, hb1.mjs. PageEditor and
ModeStage verified at patch + behavioral level via the harness (FX1 precedent).
Merge audit: the final merge (`b8c3b72`), which landed *after* the final green suite
run, brought docs only (+16, open-threads.md) — so the verified state is byte-for-byte
the tip's code. The founding claim of this review is therefore checked, not trusted.

## What holds

- **Routing truth (S1/S5/flow §6):** `/` is Arrival for every boot, authed or not.
  The Desk room is unrouted entirely — structural, not cosmetic. HomeFlow's anon
  short-circuit is retired; sign-in relocated verbatim into Arrival, not rebuilt.
- **The gear catch is the review process working.** The HIGH bug (ModeStage's own
  reveal handle + settings gear — exposing exactly the Theme switch and Typewriter
  toggle the gate forces — escaped the veil) is genuinely fixed, prop-gated,
  byte-identical for every existing caller.
- **The escapee walk.** hb1.mjs now asserts the invariant structurally: every
  button/link/role=button outside the editor must sit inside an `[inert]` ancestor.
  GlobalHeader (a fixed corner cluster no host veil could reach, Sign out included)
  removes itself entirely under the gate — correct reading of "exactly one path."
- **R1 as data.** OFFERED/FUTURE territories in one store; Machina arms later by
  moving one entry. Harness pins the exact lists and order.
- **R2 scoped in code.** The ceremony's header comment carves out first-run only;
  orange fires once, at the choose instant — a transient flash, never resting brass.
- **F1 done properly.** Monotonic word count with a real reason (forward lock's
  derived text can flicker backward mid-strike). F4/D2's re-forcing bug is fixed and
  regression-pinned. The gate glow speaks GoalGlow's exact contract — same class,
  same `--glow-intensity`, same live `--goal-glow-cap` read — consume-not-fork
  honored as a seam; the field never burns.

## Rulings of record

1. **Defense-in-depth harness pattern ratified as precedent.** Where a veil/coverage
   invariant exists, assert it structurally (walk the DOM for violators), never only
   by counting known wrapper nodes. The gear bug is exactly what enumeration misses.
2. **Checkpoint-blob history accepted this once.** Two collisions in a shared
   checkout made the rescue commits the right call in the moment, and ONE CHECKOUT
   PER AGENT (ledger) is endorsed and ratified. But slice-commits remain the law:
   a future ticket arriving as preservation blobs gets returned for re-staging, not
   reviewed. Reviewability is a deliverable.
3. **`.hb1-veil` existence ⇔ gate active** is now a load-bearing selector contract
   (FirstRunVeil renders no wrapper when inactive). Recorded so no future refactor
   adds a dormant veil node and silently breaks the harness's meaning.
4. **Mid-gate refresh drops the veil** (gate rides one-shot navigation state; a
   reload lands the writer on their page unveiled, rite incomplete, next Arrival
   re-gates on a fresh page). Ruled a *mercy valve, kept*: never persist a veil
   across boots — trapping a writer under blur is a worse failure than letting one
   slip the rite. Nick may overrule at the sitting; if kept, it stays documented
   here and in the ledger, deliberate rather than accidental.
5. **Open's no-resume fallback lands on `/journal`.** Fine interim home; revisit
   when the Places-rail work lands (origin chat's seam, not re-ruled here).

## The fold (hb1.1, on-branch, before deploy)

- **F-1 (code, small): ceremony focus management.** On mount, move focus to the
  first offered territory; contain Tab within the dialog while it's open. No
  Escape-dismiss — by design, the rite resolves in a choice; note it in a comment.
  `aria-modal` currently overstates modality to AT while the editor stays reachable
  behind the backdrop; containment makes the claim true. First-screen surface —
  this ships before any writer meets it.
- **F-2 (no code): record ruling 4's mercy valve** in ledger item 27's open-calls
  block, closing that open as *decided* rather than pending.
- **F-3 (Fable's eyes at fold time):** HomeFlow/Desk parked-shim wording, the
  `backTo '/'` sweep entries (CreateProject/Drawers), and s1.mjs's DORMANT
  resume-mirror entries — disclosure-hygiene spot-check per A4 discipline.

## Nick's device sitting (the felt checks only hardware answers)

Anonymous roam — Journal, Shelf, Drawers with no account at all. The full arrival
rite once through, honestly: veil blur depth, glow at cap, the ceremony flash, and
whether Flux next to Plateau is the right first pair to the eye ("for now" stands
either way; the swap is one data line). Anon → write → create account → the page
follows ("anything you've already written here comes with it" is a promise the sync
layer must keep — watch it keep it). Open's two landings: seeded resume target, and
the `/journal` fallback.

## Sequencing

CC folds F-1/F-2 on-branch → Fable spot-checks the fold delta (F-3 rides along) →
Nick's merge word → device sitting on main → deploy on Nick's word. One merge, one
sitting, one deploy decision.

## Housekeeping

The `cd1.1 erratum WIP` stash: **hold, don't drop yet.** It's forensic material for
CD1's own still-open close conditions (the fold delta spot-check + Nick's sitting —
the origin chat's table, not this review's). Once CD1 closes, CC drops it; Fable
deletes nothing as standing practice.

— Fable, for the record · 2026-07-16
