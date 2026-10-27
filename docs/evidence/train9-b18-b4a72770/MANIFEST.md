# Deploy #9 manifest (chat 1, Oct 27) - target SHA `b4a72770`

**Target:** `main` fast-forwarded from `4820d994` (the deploy #8 ledger tip; product = deploy #8 `c0b440d8`) to **`b4a72770`** = the tested tree `b18` (apps/ identical, `git diff b4a72770 HEAD -- apps` empty).
**Rollback target (named before ship):** `git c0b440d8 - railway 15be9af0` (deploy #8, live Oct 26).

## Everything in the target SHA (the merged-but-undeployed set)

| # | Lane | Branch @ tip | What |
|---|---|---|---|
| 1 | FIX | `guided-w2-write-place` @ `716794ac` | W2: Write this / Place a page (the Walk's two doors, the page's own door, `writePlace.ts`, `unbornPage.ts` graft) |
| 2 | INK | `w5-gaps-rewards` @ `70ffd12d` | W5: gaps + rewards + Lit (Deck header line, Mark lit door) |
| 3 | TOOLS | `tools-9-clean` @ `7c878993` | WALK_SHIPPED flipped on; Machina Intake; Machina Step. (NOT `tools-9-walk-shipped`: it carries a stray W2 commit.) |
| 4 | INK | `glue-9` @ `7d5e689a` | glue: Flux `walkReadoutPlan`, door-list successors (W1/W2 part 2 D1), `flux-v2` OR1 -> OR2, `guided-w3-part2` fixture |
| 5 | chat 1 | `walk-open-select` fix `02d2d525` + harness `b4a72770` | one line in `BoardEditor.tsx`: the pointer effect re-runs when the board is shown Open (a Deck switched from the Walk had unpressable cards). Found by INK, fixed on Nick's word ("fix it first"). |

**NOT in this ship:** `add-scenes` (not cleared: Outline put children in a 2nd column, light frames were not light; `box-tombstones` T11 red from its raw `setBoxes(made.boxes)` read) -> deploy #10.

Merge commits: `65fb18a6` (W2), `4308b348` (W5), `70a8fd51` (TOOLS), `52ab7d06` (glue-9). Conflict rules (all product, all additive, none touched a harness): `deskLexicon.ts` keep both sides; `unbornPage.ts` keep both (W2 `graft` + TOOLS `landing`); `Walk.tsx` doors: Step's readout width + keys hint with W2's `onOpen(card, anchor)`.

## Product diff vs deploy #8 (`git diff 4820d994 b4a72770 -- apps/desktop/src apps/server`): 23 files, all in the named branches above (docs range: evidence + this manifest only).

## Verification (tree `b4a72770`, bundle `index-rF7j6nOF.js`, 926,927 bytes)

- `tsc` app 0, `tsc` server 0, `seed-guard` PASS (36 checks).
- **Targeted waiver run (Fable, Oct 27: "ship b18 (122 files, both legs)"):** the b14 board-opening set (114) + every `guided-*` + `flux-v2` + `glue-9` + `walk-open-select`, minus the two add-scenes files = 122 files.
  - DEFAULT 15:38:48Z-16:48:46Z: 117 of 122 returned a verdict, **0 FAIL**.
  - PARKED (`HARNESS_PARKED=1`) 16:48Z-17:59:56Z: 117 of 122, **0 FAIL**.
  - The 5 without the runner's "VERIFY" verdict on EACH leg are not reds: `flux-screens` (a capture tool, needs `<outDir>`), `tutor-drawer-probe` (no assertions), `guided-w2` (42/42 green, 14/14 mutants landed), `guided-w2-part2` (PASS 130/130), `guided-w3-part2` (PASS 41) - the last three print a verdict line the runner's regex does not match.
- The first full pair on `train-9` (`70a8fd51`, 206 files, 03:38Z-07:03Z) found 5 real reds, all attributed (Flux `walkReadoutPlan` -> tools-9's lexicon; the Lit door vs W2/W1 door-list checks -> W5 x W2; `flux-v2` OR1 -> W5's Lit mark; `guided-w3-part2` fixture) and all fixed or parked verbatim with successors on `glue-9`. Evidence: `docs/evidence/train9-b15-70a8fd51/` (both legs' output, committed with this manifest).
- Walk -> Open: `walk-open-select.mjs` was RED on the unfixed bundle `index--VDsx5Sv.js` (C3: nothing selected) and GREEN on `index-Ch4O-KrC.js` (17/17).
- Box (UTC, Oct 27): chat 1 turns 03:38-07:03 (train-9 pair), 14:01-14:06 (b16, stopped for the fix), 14:06-14:12 (walk-open-select red/green, three short turns), 14:11-15:38 (b16 default leg + attribution), 15:38:47-17:59:56 (b18 pair). Grants released with `release <token>`.
