# A1 — the immutability-law ruling · 2026-07-22

**Question (carried forward open through BM1's merge and deploy):** BM1's
commit `06d0291` updated the parked cd1.1 entry's live re-verification
condition in place — expected bar contents moved from `['Pages','Plan']`
to `['Pages','Plan','Plan →']` — while keeping the recorded-original name
byte-identical, following the pattern CD3 itself established on that same
entry. Is this a violation of the parked-entries-are-immutable law?

## Ruling: LEGAL. No remediation. CD3's prior instance legal by the same reading.

**The structural test, applied to the diff itself (read line-by-line by
Fable, not from the report):**

1. **The record is the quoted non-executing text.** The `pok()` first
   argument — the parked name, its original quote, and its supersession
   annotation — is byte-identical before and after `06d0291`. Untouched.
2. **The probe is what runs.** The second argument — the boolean evaluated
   against the live app under `HARNESS_PARKED` — is the live
   re-verification instrument. It exists to confirm that current reality
   still justifies the park. When BM1 changed the bar, current reality
   changed; the probe tracked it, disclosed in-commit and in-file. That is
   the instrument doing its job.
3. **The decisive evidence the probe was never part of the record:** CD3
   set this same probe to `['Pages','Plan']` while the quoted original
   asserts `['Pages','Plan','Done']`. The probe has never matched the
   frozen text — it has always tracked current reality. An instrument by
   construction, not history.
4. **The history is layered, never rewritten.** The supersession event
   that changed reality received its own fresh park cycle in the same
   commit: the gen-2 CD3 check parked verbatim as a new entry, a gen-3
   live successor asserting the new truth. The chain reads: cd1.1
   original → CD3 cycle → BM1 cycle → live gen-3.

## Codicil (ratified by Fable as canon keeper; vetoable by Nick)

A parked entry's live re-verification probe may update in place **only**
in a commit that also records the supersession event that changed reality
— a new park cycle for the superseded generation plus a live successor —
with the probe update disclosed by name in the commit message. A probe
update arriving **without** its supersession record is treated as a
record mutation and remediated as one. Both the CD3 instance and the BM1
instance satisfy this retroactively.

The bright line, restated: **the record is the quoted non-executing text;
the probe is what runs; a probe may move only when reality moved, and the
record of reality moving must travel in the same commit.**

— Fable, 2026-07-22
