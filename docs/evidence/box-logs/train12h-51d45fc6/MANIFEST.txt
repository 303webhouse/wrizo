# Train #12h — manifest (Chat 1, Nov 1 2026)

**Product tree `51d45fc6`** (`train-12h`: main `defbca64` + one `--no-ff` merge; main is fast-forwarded to it plus this records commit; `git diff 51d45fc6 HEAD -- apps/desktop/src apps/server` is empty at every records commit after it). Rollback target: `git 2b06e484 · railway 54492996` (deploy #12g).

## In
| Lane | Branch @ sha | Merge | What |
|---|---|---|---|
| FIX | caret-reset-r2 `8cf12706` | `51d45fc6` | Bug-list #33 (ledger 168): a caret the writer moved is not put back at the end of the text by the next render. `ForwardOnlyEditor.tsx` clears the writer-moved note in `handleInput` (every text path: typed key, Enter, dictation, IME/compositionend, paste), not in listeners that run after the render. New `caret-reset.mjs` (27 checks). |

Clean merge. Product code, 1 file: `apps/desktop/src/components/ForwardOnlyEditor.tsx` (+25). Harness: `apps/desktop/scripts/harness/caret-reset.mjs` (+154). No `apps/server`, migration or package change.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41293780212 (8 shards per leg, ref = the full sha): default 228/235 (the 7 non-OK are the capture/probe tools with no verdict line); parked 227/235 (the same 7 + `b2-1.mjs`, exit 1 after 15 s). `caret-reset` PASS 27/27, `blank-page-click` PASS 26, `empty-line-caret` PASS 20, `fx5` PASS 57, `typewriter-glide-keys` PASS 8/8, on both legs. `b2-1` attribution: Actions reruns on the train tip (both legs PASS 28) and on main `defbca64` (both legs PASS 28); on the box, parked x5 PASS 28 each.
- **Box**, INK's box-only list (12) + `cd2`, `typewriter-glide-keys`, `tw-glide-measure` + `caret-reset`, `blank-page-click`, `empty-line-caret` (18 files). Stamp `tree=51d45fc6 bundle=index-hzRgs52S.js/958221b`. **Parked leg CLEAN 18/18. Default leg 17/18:** `typewriter-glide-keys` 6/8 (K1 premise: the glide had already ended, age 825 ms, when Ctrl+Home landed). Attribution by control (same file, train vs `train-12g` = main's product code, box): default x5 PASS 8/8 on each tree, parked PASS 8/8 on each. `caret-reset` x2 extra rounds, both legs: CLEAN. `rhizome-latency` PASS (14) on both legs; `typewriter-fade` and `cd2` PASS, not excused.
- **`fx5` on the box:** the ordered x3 per leg: default 3/3 PASS 57; parked 2/3 PASS 57 and **1 red: round 1, S1(a) first-engage ("never one big instant jump"), `maxStep` 444**. Attribution runs, parked x12 + default x3 more on the train tree: all PASS 57. Control `train-12g` (main's product code): parked x12 + default x3: all PASS 57 (and 6/6 at the 12g ship). Train total 23 PASS + 1 red of 24; control 21 of 21. Fable's ruling: not attributable to the caret change (the jump class lives in 12g's engine, already live); FIX gets the step cap as train-12i.
- Clear: Fable, Nov 1 1:33 am ("CLEARED ... Green -> ship, verify, ledger") and the ship word after the control report ("train-12h: SHIP 51d45fc6").

Files here: `pair-*.log.txt`, `summary.md` (Actions); `box-default/parked.log.txt`, `caret-reset-*`, `fx5-*` (the ordered box runs); `typewriter-glide-keys.box-default-RED.txt`, `fx5-parked-1-RED.output.txt` (the two reds' full output); `controls/` (the attribution runs).
