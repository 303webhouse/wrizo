# DF1 — the Deflake Pass · brief · 2026-07-24

**Place at:** `docs/wrizo-alpha/df1-deflake-brief.md`.
**Owner: chat 3** (named per the start-word law). **Branch:**
`df1-deflake`, own worktree; guard-rail before every commit; ledger on
`main` only. **HARNESS-ONLY: zero `src/` changes, zero schema, zero
server files, zero new deps.** If a flake's root cause turns out to be
a real product bug, STOP on that slice and report — product fixes do
not ride a deflake ticket. Merge rides the zero-schema
pre-authorization through chat 1's serialized lane; Fable reviews
post-merge; no deploy implications (harness files ship nothing).
Founding: off `main` after the M3 merge lands; disjoint from everything
in flight either way.

## Why now

`fx5`'s per-line-engage flake has flagged nearly every full-suite run
this week (item 48), surviving on a standing isolation-rerun crutch.
Every future run — this arc's, the SC arc's, the freeze-era fix runs —
inherits that noise until it dies. A suite that's green means green is
worth a ticket.

## S1 — `fx5.mjs`: root-cause the flake, retire the crutch

The failing check ("per-line engage motion / scrollTop steps across a
typing run") fails ~1-in-3 under full-suite contention and passes clean
in isolation — the signature of a timing assumption, not a product
defect. Reproduce UNDER suite conditions (run it mid-suite, not alone),
name the mechanism precisely (a fixed `sleep` racing scroll settle
under CPU contention is the likely species), and fix it the
deterministic way: wait-for-condition on the observable the check
actually needs (scrollTop stabilized across N frames, transition
settled), never a longer sleep. The check's ASSERTION must not weaken
— if the honest fix requires asserting less, that is a falsification
and gets a proper A4 park cycle instead. DoD for this slice: the check
passes IN SUITE, repeatedly.

## S2 — `th2.mjs` and `j4.mjs`: the rest of the contention class

The ledger's known-flake trio. Recent runs show both quiet — verify
rather than assume: run each mid-suite ×5; if a flake reproduces, fix
per S1's discipline; if not, record CLEARED with the evidence (runs,
dates) so the ledger's known-flake list tells the current truth. The
list shrinks only on evidence, never on optimism.

## S3 — anchor hardening in `e1.mjs` (E1 advisory 3, E1.1 advisory 3)

The `/^# /m` page-count and `## From the Trash` marker anchors are
writer-text-fragile: a corpus body line beginning `# ` or matching the
marker would confuse the parse. **The export format itself does NOT
change** — the artifact is the writer's, and harness convenience never
reshapes it. Hardening is parser-side only: count and split using
corpus-aware structure (the seeded titles and section order the harness
itself planted) with the anchors as cross-checks, and add one hostile
fixture — a page whose body deliberately contains `# ` at line start
and the marker text — proving the hardened parse is unconfused while
the exported bytes carry the writer's hostile lines verbatim.

## S4 — the parked-entry history audit (item 48's rider)

Every `pok()` record across every harness, audited against git history:
each parked name introduced once and byte-stable ever since (probe
lines exempt — probes lawfully follow reality; the audit distinguishes
the quoted record from the executing condition). Deliverables: a
reusable checker at `scripts/audit-parked-records.mjs` (walks the
files, extracts records, `git log -S` per record, flags any
post-introduction mutation) and a committed audit report
(`docs/wrizo-alpha/parked-records-audit-2026-07.md`) naming every
record checked and the verdict. Known history the audit must
corroborate, not rediscover: B1's pre-law count-bump (ruled a
violation, remediated on the record) — the audit's report cites the
remediation rather than flagging it as fresh.

## Invariants and DoD

Both `HARNESS_PARKED` settings; grep-before-change; every fix is
live-check maintenance (lawful) unless an assertion weakens
(park). **The definition of done is empirical: THREE consecutive
full-suite runs, both settings, 38/38 deterministic, zero isolation
reruns** — read to completion in the main loop each time. The
known-flake list in the ledger updated to the truth; the
isolation-rerun crutch formally retired for every file this ticket
clears; the audit report on disk. After DF1, a red suite means
something is wrong — nothing else.

— Fable, from item 48 and the review riders, for chat 3
