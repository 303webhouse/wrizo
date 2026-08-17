# Chat 1 (merge / deploy / records lane) — status for a remote pickup — 2026-08-04

**Read-first companions:** `docs/wrizo-alpha/vacation-handoff-2026-08-04.md` (Fable's
standing orders) and the ledger `docs/open-threads.md` top section (the **P0 WAVE DEPLOY
MANIFEST**, **SHIP 2 — PARKED**, and **item 99 — the Orphan Reaper**). This file is the
one-screen "where the lane is" so the build can resume from anywhere.

## LIVE IN PRODUCTION
- **P0 wave — git `c23c380` · railway `ee0a9bf2`** (deployed 2026-08-03). Offline writes
  self-heal on reconnect (item 89); filing validates its target and stops birthing litter
  (88a/88b). Verified LIVE: `/healthz` 200, bundle `index-CThKwy6K.js`, `/auth/me` 401.
- **Rollback ratchet:** the live stamp above is the current floor. The prior build (P2b —
  git `c266cb3` · railway `11b612db`) is the redeploy source if a rollback is ever needed.

## NOT SHIPPED — parked
- **Ship 2 (fw2 = items 91+92, the boards work):** PARKED on Nick's **condition 2** — the
  fix lane's parked re-run is **incomplete** (`j4.mjs` NOVERDICT, a named first-parked-act
  race; the navigate-first fixture fix is **UNRUN**; the parked stamp is **OWED, not
  claimed**). Unparked was **55/55 CLEAN**. `fw2-offer @ dad280e` is **unmerged**, still on
  its branch. **No merge, no deploy** until the fix lane completes the parked re-run GREEN
  both settings AND Nick gives a fresh clean-suite word (post-vacation). The red-suite
  clause was NOT spent — no red was measured; the gate simply wasn't met.
- **Item 87** (New Page defaults): built, `tsc`-clean, **NOT verified** — on branch
  `fw2-boards-and-defaults`, `DO NOT MERGE YET`.

## MERGED TO MAIN since the P0 deploy (all docs-only design records — zero product change)
- item 84 pass 3 — Revise · `bf2616a`
- item 84 phase 3 mockups — Plateau · `e106670` **(main HEAD)**

## ON A LANE BRANCH — not main
- **item 84 phase 4 — THE LOCK SHEET** · `5cd3968` on `item84/tutor-menus`
  (`docs/menus/tutor/tutor-menus-lock-sheet.md`). Seven word-lines for Nick to answer to
  close the Tutor's-menu design. **Open; no locks.** This is the doc to read + answer when
  picking the menus build back up — answer by any channel; the desk transcribes verbatim
  and build tickets follow post-vacation, briefed decision-complete.

## STANDING ORDERS (vacation — until Nick returns)
- **Chat 1: records and merges only. ZERO deploys of any kind.** Ship 2 was the last deploy
  window and it parked; nothing else ships until Nick's word on return.
- **Fix lane:** stand down after fw2 resolves. **SC-chain:** complete fix (b)'s suite when
  the box arrives, offer, merge on green, then stand down; SC2's sixth suite is
  post-vacation; **P2c is the first ship on Nick's word.**
- **Menus desks (83 / 84):** continue passes; **all locks gated on Nick's return + his
  sitting verdicts.** Tool-menu code overhaul: design merges freely; **app code builds
  NOTHING until Nick is back.**

## TO PICK UP THE BUILD REMOTELY
1. The live P0 fix self-heals offline work on reconnect — keep the tab open in the air.
2. The menus arc's next decision point is the **lock sheet** on `item84/tutor-menus` —
   answering its seven lines is what unblocks the menus build brief.
3. First post-vacation act (menus): the **disclosure-v4 committee pass** (TR7), then **P2c
   ships fw2** on a clean suite. No production deploys before then.

— chat 1, 2026-08-04
