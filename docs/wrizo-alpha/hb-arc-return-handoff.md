# HB-arc return handoff — stewardship to the primary session · 2026-07-18

**You are Fable** — and this workstream is coming home to you. Nick is consolidating
to one chat; the HB-arc session that this document closes was opened by
`hb-arc-handoff.md` and now returns the arc's stewardship, mid-flight, with one
sitting and one fix ticket outstanding. Everything durable is already on disk;
this file is the map, not the territory.

## Boot order (before touching HB-arc work)

1. `docs/wrizo-alpha/hb-arc-handoff.md` — the charter and Nick's original vision.
2. `docs/wrizo-alpha/hb1-threshold-brief.md` — the brief as built, including
   Nick's rulings R1/R2 and Fable's calls F1–F5 (F5 since corrected — see below).
3. `docs/wrizo-alpha/hb1-review-fable.md` + `hb1-review-fable-addendum.md` — the
   review of record (GREEN with fold; five rulings) and the fold-delta/F-3 record.
   The addendum's filename is transposed from its own internal reference —
   deliberate leave; the ledger points at the name that exists.
4. `docs/open-threads.md` item 27 — the living close-out state, including the
   veil-race resolution chain (`a727bae` → `fc43f77`).

## Where HB1 stands (verified against code, 2026-07-18)

Built (six slices + hb1.mjs, now 31 checks), reviewed GREEN, folded (hb1.1:
ceremony focus trap; ledger record), merged to main on Nick's explicit word
(`7e7d7f4`), and **live in production since the FX2 deploy** (`railway up @
740b572`) — which shipped it *unnamed*, HB1's merge being an ancestor of the
deployed SHA. That event birthed the deploy-manifest rule now in TOOLING STATUS.
HB1 has therefore never received its own deploy clearance by name, nor its device
sitting. Both close in one stroke — see Nick's move, below. Subsequent deploys
(FX3+CD2, named per the new rule) have moved prod past 740b572; HB1 rides within.

## The one move that is Nick's alone

**The device sitting, on prod.** The felt list: the veil, the hundred words, the
ceremony, Flux beside Plateau (R1 is data — Machina swaps in by one list edit
when armed); the Ctrl+V at the gate (F5 correction pending its confirmation —
the Voice Wall likely closed the paste seam before the brief claimed otherwise);
the **hammer test** — hard reload, click Write the instant it enables, ×5, watching
for a missed or flashing veil (feeds hb1.2's severity); a poke at any in-app
"Done" still targeting `/`; and the three prior-art questions (below). Closing
line, verbatim or in his own words: *"HB1 sitting verdict — retroactive deploy
clearance for HB1, by name; item 27 closes on this word."*

## hb1.2 — briefed by you, after the sitting

The veil's first-mount race is ruled a real product-level flash risk on first-run
devices (your own FX3-session ruling; the HB1-track's "human-unreachable" read is
withdrawn on the record, `fc43f77`). Constraint already on the books: the fix
makes the gate's mount **deterministic and fail-closed** (in doubt → veiled)
**without touching ruling 4's refresh mercy-valve** (reload drops the veil by
design; never trap a writer under blur). Those two pull against each other;
threading them is the ticket. Investigation scope, two layered mechanisms: the
one-shot `firstRunGateRequested` ref consumed in a race window (the harness
flake's root), and CC's unconfirmed lead — `FirstRunVeil` applies `inert` via
`useEffect`, i.e. after first paint; `useLayoutEffect` or a synchronous ref
callback would close that specific window. Check the lead first; don't assume it.
Hammer-test result calibrates severity and schedule.

## Design questions the arc surfaced (Nick rules, post-sitting)

All three born from prior art found during F-3 — the parked HomeFlow ("HOME port
v6", header comment tells its story) and s1.mjs's honestly-DORMANT resume check:
**the echo** (v6's reward showed the writer their own words back; HB1's ceremony
announces only the theme — arguably the thesis argues for v6); **the mercy**
(v6 idle-nudged a stuck newcomer; HB1's gate is silent by the "speaks once"
ruling — a live tension, not an oversight); **the glance** (does Arrival stay
austere, or offer a quiet unprompted trace of where you left off?). Each is
hb1.2-or-later sized. None re-opens the GREEN.

## Small debts, named

The F5 one-line ledger correction after Nick's Ctrl+V confirms. Desk.tsx's
parked-shim prose — accepted at census, never eyeballed; read it at next touch.
The `cd1.1 erratum WIP` stash — held until CD1's close conditions clear on your
track; CC drops it then. The seam this arc's charter drew between our two
sessions dissolves with this handoff; the glow seam it does NOT dissolve is the
code one — the gate's glow still re-plumbs into the canonical goal/glow system
when yours lands, same contract, one source.

## Rulings you inherit (do not re-litigate; amend formally if needed)

R1 Flux-for-Machina as data. R2's first-run carve-out, scoped to the threshold
only — M1 governs everything after the veil lifts. F1 words-at-the-gate (lines
law untouched elsewhere). F2 Open-always-enabled. F3 once-per-device. F4
DeskFrame-regime only. F5 as corrected. Review rulings 1–5, including the
defense-in-depth harness precedent (assert invariants structurally, never by
enumeration) and ruling 4's mercy valve. The deploy-manifest rule. ONE CHECKOUT
PER AGENT. Slice-commits remain the law; the checkpoint-blob acceptance was
once-only.

The door is open, the first writer through it should be Nick, and the arc is
yours again. It was good work. Keep the paper honest.

— Fable, for Fable, in return · 2026-07-18
