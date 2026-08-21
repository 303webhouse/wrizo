# MERGE OFFER TO CHAT 1 — THE DOORWAY SHIP (items 104 + 87-subset + 97 + 101 S0)

Branch: **`doorway-ship`**. Base: `origin/main` @ **`b3cd56c`**, pinned by SHA.
**NO DEPLOY — the doorway ship holds for Nick's explicit word.**

| commit | |
|---|---|
| `46509f4` | Item 87 as built on 2026-08-03, brought forward (cherry-pick, clean) |
| `fe0252b` | Item 104 fix + item 87 SCOPE CHANGE (Draft-default held & parked) + item 101 S0 |
| `fc518d7` | Item 97 — re-mint ratified in code; harness is a standing guard |

---

## STAMPS

| | |
|---|---|
| unparked | **59/59 CLEAN** — `tree=46509f4+10dirty bundle=index-D8pFRr1k.js/531254b` |
| parked | **59/59 CLEAN** — `tree=46509f4+10dirty bundle=index-D8pFRr1k.js/531254b` (identical bundle; item 87's 4 parks green) |
| `item104.mjs` | 13 checks — **S1(c) RED pre-fix**; 4 controls green on both builds |
| `item87.mjs` | 4 live + 4 parked (was 8/8, **4/8 red pre-fix**, before the amendment) |
| `item97.mjs` | 7 checks — **green on BOTH builds; a guard, not proof of a fix** |
| `tsc` | clean |
| schema | **zero** — no `apps/server` file in any diff |

---

## WHAT SHIPS

**Item 104 — one defect, not three.** `UnbornPage` dispatched on
`descriptor.kind` (the door's intent) while the born route has always dispatched
on `entry.pageType` (the room's truth); `birthWith` deliberately uses
`replaceState`, so no route change ever fired and the surface never swapped. F5
landed on the born route and worked — exactly the asymmetry Nick measured. Fixed
by asking the room once the room exists. **Prose birth is untouched** (no
`pageType` → same component, same key → no remount), so PB1's burst-integrity
property is preserved exactly. The descriptor gains `structure`, applied through
`requestScreenplay` alone.

**Item 87 — the shipping subset only.** Clause 3 (typewriter off on a fresh
page) + clause 2's assertion. Clause 1 is **HELD and PARKED** per Nick's
amendment.

**Item 97 — ratification in code.** Deliberate soft-deleted handling + the stale
pointer cleared at detection.

---

## THREE THINGS THE DESK SHOULD READ BEFORE MERGING

These are the parts a green suite does **not** tell you.

1. **Two of the brief's 104 claims dissolved under S0.** (a) does not reproduce
   on a born page — `item104.mjs` S2 is green against the *pre-fix* bundle. (c)
   was already wired; it only looked dead for the same dispatch reason. Briefs
   name symptoms; the anatomy is corrected here.
2. **Item 97's harness does not bite** — 7/7 green pre-fix. The decision
   ratifies behaviour that was already there. It also corrects **this lane's own
   2026-08-03 finding**, which read `getOrCreatePlanBoard` alone and missed that
   `softDeleteEntry` already unpairs (BM1 S2). Merge it as a standing guard, not
   as a repair.
3. **Item 87's harness found a bug in itself on its first run** — a raw
   `localStorage` seeding write, the exact race AGENTS.md forbids, which
   clobbered the row and timed the run out with no verdict. Migrated to the app's
   own write path per law. This is the concrete case for why "BUILT, NOT
   VERIFIED" was an honest label.

---

## ALSO ON THE RECORD

- **Item 101 is parked, not fixed** — measured through the cascade's own door:
  no row written, address unchanged, identical blank door. Nothing is lost. What
  is owed is FEEDBACK at the door → item 96's charter.
- **A 13-day records defect is corrected.** The ledger's live band said item 87
  was "FIXED" from 2026-08-03 while its code was unmerged and its harness had
  never run. The lane that wrote both introduced the discrepancy; it is corrected
  append-style rather than quietly overwritten.
- **Harness infra:** the sync double gains an armable `pull`, defaulting to the
  pre-existing empty pull, so every other file sees byte-identical behaviour.
- **Residual named, not hidden (item 97):** the window between a tombstone
  arriving and the next flip is not closed; closing it means unpairing at
  apply-time, a larger change than the decision authorised.
