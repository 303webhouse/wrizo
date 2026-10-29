# Deploy #10 manifest: train-10d = `8dc5394b` (Oct 28-29, 2026, chat 1)

**Tested tree = merged tree = `8dc5394b`** (main fast-forwarded from `db8dcc00`; this manifest is the only commit on top, records only).
**Rollback target (ratcheted):** deploy #9: git `32555904` (product `b4a72770`) / railway `c7ad18a7`, bundle `index-rF7j6nOF.js`.

## What is in (merge order)
| Branch | Tip | Notes |
|---|---|---|
| runner-verdict-shapes | `46878e82` | the runner now reads the verdict lines `guided-w2`, `guided-w2-part2`, `guided-w3-part2` print; `verdict-shapes-check.mjs` 30/30 |
| polish10-scrollbar-r | `f6a04b07` | FIX |
| polish10-ground-r | `e558afbc` | FIX |
| polish10-recede-r3 | `b841016f` | FIX: recede + hint-fixture; carries `587f7b77` (recede-r2) and the two record-only fixes (item211 C4, polish10-recede MR1) |
| polish10-hint-r2 | `3d3b979b` | FIX |
| tools-10-rebased | `edf566c0` | TOOLS (9, 8, 10, 11 + the Esc fix); the last tip is harness-only (ab3 CD2 S1/S5 parked with a successor) |
| add-scenes-r | `3d15a8a9` | INK |
| polish/flux-circuit-mockups | `f6754011` | docs only; its capture script moved from `scripts/harness/` to `scripts/` (the suite runs everything in `harness/`; it has no verdict line) |

**Out (to #11):** polish10-board-r2, -caret-r2, -anchor-r, -page-r, -format-r2, -card, -timing-r3, -linkdock-r3, tools-11-intake, INK 12-15; `polish/arbor-ground` scrapped by Nick.
**Product vs deploy #9:** 44 non-harness files under apps/ + packages/ (src + 5 scripts), 39 files / +819 -81 in `apps/desktop/src`, apps/server, packages. Docs range: mockups + this evidence only.

## Verification
- `tsc` app 0, server 0; `seed-guard` PASS 36; `verdict-shapes-check` PASS 30.
- **First pair, train-10 (`16773764`, everything incl. FIX board/caret/anchor/page/format, 225 files):** default 203/225, parked 198/225. NOT CLEAN; reds attributed by a default-leg bisect (main+runner / +FIX / +TOOLS / +add-scenes): the FIX point owned b3, guided-w1, item126, item211, tu2, tu5 and the polish10-* files; TOOLS owned cd2; add-scenes owned machina-step. Those FIX branches were then dropped or fixed.
- **train-10b (`ace052b6`, 35 files, both legs):** default 34/35 (rhizome-latency), parked 31/35 (ab3, item211, polish10-recede, rhizome-latency).
- **Waivers:** `ab3` parked GREEN on main and GREEN on recede-r2 alone, so red only in the 10b mix = TOOLS item 8's ~200 ms exit against ab3's 150 ms sample (Fable). `rhizome-latency` paired: main green 1/3, 10b green 3/3: not a regression, the known flake (ticket 150). *Note: the status file `waiver10b.status.txt` labels every run RED because my script matched `[1/1]` and the runner prints `[01/1]`; the verdicts above are read from the per-run logs.*
- **train-10c (`5f51e97f`):** default 4/4; parked 3/4 (ab3 only).
- **train-10d (`8dc5394b`, ab3 / cd2 / item211 / polish10-recede / rhizome-latency):** parked 5/5 CLEAN; default 4/5, the one red `rhizome-latency` (2/14), then green on two re-runs (default leg alone) = green in 3 of 4 runs including the parked leg. Stamp: `tree=8dc5394b bundle=index-Cxvl7CYX.js/943093b`.
- Cleared by Fable (written, Oct 28): "Rules met -> ship #10 per docs/deploy.md under this clear."

## Open after #10
`rhizome-latency` = known flake (ticket 150). FIX #11: board (b3 card rect moves when the wizard opens at 1280), caret (C17-HOLD in Flux Free Write zoom), anchor (A3 at 1366), page (P5 zoom-ink), format, card, timing, linkdock. TOOLS: tools-11-intake. INK: 12-15.
