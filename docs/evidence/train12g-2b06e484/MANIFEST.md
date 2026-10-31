# Train #12g — manifest (Chat 1, Oct 31 2026)

**Product tree `2b06e484`** (`train-12g`: main `72ba5d37` + one `--no-ff` merge; main is fast-forwarded to it; `git diff 2b06e484 HEAD -- apps/desktop/src apps/server` is empty at every records commit after it). Rollback target: `git 6c58aa10 · railway c04bc181` (deploy #12f).

## In
| Lane | Branch @ sha | Merge | What |
|---|---|---|---|
| FIX | typewriter-fade-r2 `318105ab` | `2b06e484` | The Typewriter's history glide (ledger 166 review): time-based with a backlog cap; only the writer's input cancels it, a dropped scrollTop is ridden out to the absolute target; a scroll that is not where the glide left it is the writer's, except a drop to the top (the re-render's clamp); a view key (Home/End/PageUp/PageDown/ArrowUp/ArrowDown) is the writer's scroll (keydown cancel). Harness: `typewriter-fade` and `cd2` S2/S3/T5 wait on the state, not a clock; new `typewriter-glide-keys.mjs` (red-first on `85412cd8`, K1-K3) and `tw-glide-measure.mjs`. |

Clean merge. Product code, 1 file: `apps/desktop/src/components/useTypewriterFade.ts` (+67/-5). No `apps/server`, migration or package change.

## The runs
- `tsc` desktop 0, `tsc` server 0, `seed-guard` PASS 36.
- **GitHub Actions** full pair, run 41243063104 (8 shards per leg, ref = the full sha): **default 227/234 and parked 227/234; the 7 non-OK on each leg are the capture/probe tools with no verdict line**, identical on both legs: no real red. `cd2` PASS 53, `fx5` PASS 57, `tw-glide-measure` PASS, `typewriter-glide-keys` PASS 8/8, on both legs.
- **Box**, INK's box-only list (12) + `cd2`, `typewriter-glide-keys`, `tw-glide-measure` (15 files), both legs: **CLEAN 15/15 on each**. Stamp `tree=2b06e484 bundle=index-BFqoHDJm.js/957641b`. `typewriter-fade` PASS (6 checks) and `cd2` PASS 53, both back IN, not excused; `rhizome-latency` PASS (14) on both legs, no flake call needed.
- **`fx5` x3 on the box, each leg:** 6 of 6 PASS 57 checks (`fx5-default-1..3`, `fx5-parked-1..3`). No S1(a) red; no step-cap hand-back.
- Clear: Fable, Oct 31 ("CLEARED for train-12g: FIX typewriter-fade-r2 318105ab ... typewriter-fade and cd2 are ordinary, not excused. Add typewriter-glide-keys + tw-glide-measure. fx5 x3 on the box. All green -> ship").
