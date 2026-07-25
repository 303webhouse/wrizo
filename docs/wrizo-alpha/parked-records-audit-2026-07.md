# Parked-records history audit — 2026-07 (DF1 S4)

**Ticket:** DF1 — the Deflake Pass, S4 (item 48's parked-entry history-audit rider).
**Checker:** `apps/desktop/scripts/audit-parked-records.mjs` — reusable; re-run any time (`node scripts/audit-parked-records.mjs`, exits non-zero only on an un-auto-traceable record needing a human).
**Date:** 2026-07-24.

## The law audited

A parked harness assertion is **immutable**. When a live check is retired, its original text is quoted verbatim inside a `pok()` RECORD:

```
pok('PARKED (was "<ORIGINAL VERBATIM>") — <supersession note>', <condition>, <detail>)
```

The quoted original (`was "..."`) must be introduced **once** and byte-stable ever since. The supersession note after the em-dash may LAWFULLY be extended as later tickets layer on (a chain — "…, then CD1 S3-superseded…" — never a rewrite); the executing CONDITION (the 2nd `pok` arg) and any surrounding `evalJs` PROBE reads lawfully follow current reality, and are exempt. The audit distinguishes the quoted record from the executing condition, and checks only the record.

## Method

For every `pok()` RECORD across all 39 harness files, the checker extracts the full quoted original and runs `git log -S<original> -- apps/desktop/scripts/harness` to find every commit that changed that exact text's occurrence count. What this proves: each parked original has a **real git lineage** — it is a verbatim copy of text that genuinely existed (very often as a live `ok()` check *before* it was parked), not a fabricated or drifted record.

## Result

**39 files scanned · 123 `pok()` calls · 122 quoted RECORDS audited · 1 live probe exempt.**

| Verdict | Count | Meaning |
|---|---:|---|
| TRACED-once | 95 | single introducing commit; byte-stable since |
| TRACED-multi | 21 | real lineage across >1 commit — the byte-identical original moved across later park sweeps (CD1→CD2→CD3 re-parks) or existed as a live check first, then was parked verbatim. Benign. |
| B1-touched (informational) | 2 | `cd2.mjs:973`, `j5.mjs:502` — text touched by the B1 fixture-repair commit `9ce8f6b` (which repaired many files); neither is the B1 mutation. |
| REVIEW — extraction edge | 4 | hand-verified below |

**No un-remediated in-place mutation of a parked record was found.**

The 4 extraction edges, all inspected directly and benign:
- `ab3.mjs:674`, `cd2.mjs:951` — `pok(` appears inside a **comment** documenting the accretion pattern (`// … pok('PARKED …`), not a real call.
- `ab4.mjs:595` — a real record whose original contains nested escaped quotes (`\"Add card\"`), which defeated the auto-keyer; the record itself is intact.
- `fx1.mjs:540` — a real record using the `(was PARKED-generation-1 "…")` generation-2 framing the keyer doesn't parse; the record itself is intact.

## B1 corroboration (the one known pre-law case)

Item 48's rider requires the audit to **corroborate — not rediscover** — B1's pre-law bump. `git show 9ce8f6b -- apps/desktop/scripts/harness/ab3.mjs`:

```diff
-    pok('PARKED (was "S1: the rail carries the Page pull above a separator, three Places below") — CD2 S1: … four sections (3 separators) and seven categories instead (successor in cd2.mjs)',
+    pok('PARKED (was "S1: the rail carries the Page pull above a separator, three Places below") — CD2 S1: … four sections (3 separators) and eight categories instead, B1's Trash included (successor in cd2.mjs)',
```

B1 (`9ce8f6b`, *"fix the actionToast one-shot-state regression; repair harness fixtures broken by the Journal list retirement"*, 2026-07-19) edited an ab3 parked record's **supersession note** in place — "seven categories" → "eight categories, B1's Trash included" — rather than layering. The **quoted original** (`was "S1: the rail carries the Page pull above a separator, three Places below"`) was untouched. Ruled a violation, pre-law (before the parked-entries-immutable rule was ratified); B1's specific instance is closed, no further action (item 48 rider; the CD3 incident, item 53). Cited here, not flagged as fresh.

## Method limits (stated plainly)

`git log -S<current-original>` proves lineage (the text is a verbatim copy of a real prior assertion) but cannot, on its own, isolate a mutation performed *inside* a legitimate park sweep, nor a note-only edit like B1's (B1 changed the note, not the quoted original, so it surfaces via the targeted `git show` above rather than the `-S` trace). The one file with known mutation history — `ab3.mjs` — was therefore hand-checked in full. The ratified parked-entries-immutable law now prevents recurrence, and this checker gives ongoing verbatim-lineage assurance on every re-run.
