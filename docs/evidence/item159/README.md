# Item 159 — falsification evidence (FIX)

Chat 1 could not find this on disk; it was reported before the pair and never
attached. These are the raw runner outputs, unedited, copied out of the suite's
temp directories. Nothing here is summarised from memory: every file below is
the runner's own output.

## What was run

`item159.mjs` (9 checks: 2 setup, S1 x2, S2, S3 x2, S4, S5) was run twice:

| run | tree | bundle | verdict | files |
|---|---|---|---|---|
| **OLD code** (no Styling-dock change) | `0c8838c+1dirty` | `index-BDZr-D5R.js/588012b` | **FAIL — 6/9 failed** | `old-code.*` |
| **NEW code** (159 merged, final pair) | `e31b43a` (clean) | `index-BGbwUOFl.js/588429b` | **PASS (9 checks)**, default AND parked leg | `new-code.*` |

**How the old-code run was made, said plainly.** `item159.mjs` does not exist on
`origin/main` (it is introduced by 159's own commit), so `--only item159.mjs` on a
checkout of main matched **zero files** (`files=0`, "CLEAN", 0/0 — a vacuous pass;
that first attempt is not evidence and is not included). The file was therefore
copied from the 159 branch onto a detached checkout of `origin/main` (`0c8838c`) —
which is exactly why the tree stamp reads `+1dirty`: the one dirty path is that
overlaid harness file. Product source was untouched old code. The overlay was
deleted and the branch restored afterwards.

## What the red proves, and what it does not

Only two of the six reds are independent falsifiers of the claim under test:

- **S1 THE TICKET** — `{"card":true,"dock":true,"tools":3}`: on old code the dock
  is present and open on opening a card. This is the reported defect, measured.
- **S3 THE OVERLAP, MEASURED** — `dockRect.right 437 > cardRect.left 435`,
  `overlaps:true`: a 2px intersection on old code (the `margin-right:-1px` seam).
  On new code `dockRect.right 414 <= cardRect.left 435`, `overlaps:false`.

The other four reds are **consequences, not independent evidence**: S1's grip check
(`grip:false`), S2 (`expanded:null`) and S5 (`expanded:null`) fail because the grip
does not exist on old code; S4 fails because its driver cannot press a grip that is
not there, so nothing is styled (`stored:"Plain card words"`).

**One check passes on old code for a reason that is vacuous, and it should not be
read as evidence either way:** `S3: and the GRIP does not cross the card` reports
`{"gripRect":null,"overlaps":false}` — there is no grip to overlap anything.

## A separate finding made while proving the green (not a falsification)

The first run on NEW code was 1/9 red (S4, `stored:"Plain card words"`). That was
the **check's own timing**, not the product: BoardEditor's box autosave is a
separate 2000ms debounce (`AUTOSAVE_MS`), S4 read localStorage at ~900ms. Measured:
in-memory box correct at 20ms and 220ms, localStorage stale at ~900ms and correct
at ~2200ms. Fixed in commit `1906bd5` (waits past the debounce and calls
`wrizoFlushNow`). Recorded here so the S4 wait is not later "simplified" back.

The full default leg then went red on **fx4, fx5, fx6** — three drivers that click
the card's Bold tool with a bare `.click()`, which 159's closed-by-default dock
falsified (the 159 park sweep had grepped what the change renamed, not what it
does). Fixed as driver preconditions in `445d9e1`; the claims those files make are
unchanged. The final pair (93/93 on both legs, `tree=e31b43a`) is the result after
both fixes.

## Files

- `old-code.item159.mjs.default.txt` — per-check output, old code (6/9 red).
- `old-code.runner.log.txt` — the runner's log for that run, stamp included.
- `new-code.pair-default.item159.mjs.default.txt`, `new-code.pair-parked.item159.mjs.parked.txt` — per-check output, final pair.
- `new-code.pair-*.runner-excerpt.log.txt` — the SUITE START / item159 / SUITE RESULT lines of each leg (the full logs are 93 files each and not copied).
