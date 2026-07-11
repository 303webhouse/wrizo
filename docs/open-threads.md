# Open threads — the studio ledger · 2026-07-11

**Place at:** `docs/open-threads.md`. Update on close; anything that must
outlive a session lives here, not in chat.

## NOW — blocks everything downstream
1. ~~**The J4 merge word.**~~ **DONE — 2026-07-11.** Fable's delta review
   returned GREEN; Nick relayed "Merge `j4-board` to `main` and deploy." CC
   merged (clean, no conflicts), ran `tsc` (desktop + server) + `build:web`
   + selftest + the persisted 26-check `scripts/harness/j4.mjs` — all green
   on merged `main` — pushed, `railway up`, and confirmed a live prod
   round-trip for `boxes` (kind/groupId/strokes/provenance all intact).
   See `docs/backlog.md`. J5's prerequisite gate now passes.
2. **The consolidated hardware session** (after the deploy — deploy is now
   live). Four gates, one sitting; bugs → side chats, verdicts → the ledger.
   Owner: Nick.
   - J2 · S25: eraser rubbing feel + latency, 22px width verdict, ring
     visible-but-quiet, hardware-eraser matrix (expect the S-Pen button ≠
     eraser tip — a finding, not a failure; the toggle is the path).
   - J3 · S25: long-press lift timing, drag latency, drop-line visibility,
     and the #1 probe — can a finger scroll the spread from a cell? (If not:
     pre-authorized fallback = pan-y + hold-still-drag, or drag handles.)
   - J4 · S25: box drag/resize at thumb size, group-move feel, pen-as-pointer
     (pen drags a box but CANNOT type into an editing text box — the
     recognizer probe on real silicon), ink line weight after scaling a
     sketch big and small (constant-px weight is the current behavior;
     verdict decides if a width-scale param becomes J4.1).
   - J4 · desktop: handle target size, double-click-edit vs single-click-
     select, drag a box off the right edge (retrievability).
   - Plus: the formal stack word (VW's old merge condition, satisfied in
     practice; this session makes it official).

## IN FLIGHT — proceeds without Nick once (1) lands
3. **J5 — the Spread console.** Runbook Step 4 self-executes after the J4
   merge: CC re-runs the prerequisite gate and builds per
   `docs/j5-spread-console-brief.md`. Then: Fable review → Nick's merge word
   → J5's own S25 + desktop gate items (lens chips at thumb, sheet drill,
   toast legibility; pointer precision). Owner: CC → Fable → Nick.
   **Status: CC starting Step 4 now** (item 1 landed).

## CANON DEBTS — Fable's, actionable after the gate session
4. **Rev 3 of `docs/state-of-wrizo-2026-07.md`.** A week of TTFK data now
   exists on prod; Rev 3 folds it in, plus: the ink canon, the reframed
   gate language ("merge+deploy is the test; verdicts close tickets"), the
   "Your order"/Journal-only vocabulary ruling, and the J-arc verdicts.
   Trigger: Nick's session verdicts land.
5. **F5 TTFK DoD-6 empirical close.** One small CC task: run the
   sessions_log queries against prod (non-null `surface` +
   `desk_opened_at` rows). Fold into the Rev 3 prep relay.

## POST-ARC QUEUE — unblocks when J5 ships + gates close
6. **Fragments-under-Pages committee pass** (Fable deliverable): convenes
   with the Box schema as its first living citizen. Proposal doc, double-
   pass deliberation per AGENTS.md committees.
7. **B3 atmosphere pass · B4 ember accent finish · W5 responsive** — were
   deferred until Journal UI surfaces existed; the Spread and the Board now
   exist. B4 intersects the Journal sprint reward surface (design together).
8. **HOME verification remainder**: bighead art, sort-hint.

## HORIZON — no ticket yet, on the map
9. **User-authored identity / rhizomatic personalization**: wordmark
   replaceable with the writer's own hand; four launch themes (Plateau,
   Flux, Volant, Nomad); single hard invariant = the orange accent.
10. **Reciprocity gate** for the future workshop feature (review before
    submitting).
11. **wrizo.app Cloudflare resolution** (domain plumbing).
12. **USPTO "Wrizo" search** before significant brand investment (one
    low-threat prior use known: a throwaway utility on pi7.org).

## TOOLING STATUS — for any fresh session's orientation
- GitHub connector: READ-ONLY (Fable reviews via read pipe; write grant
  remains Nick's open call — amended canon would land as commits).
- Desktop Commander: chronically unstable (fresh-restart-then-degrade);
  reviews run via GitHub reads, deliverables via container files.
- CC sessions launch FROM THE REPO ROOT (`writer-studio`) or the
  permissions allowlist doesn't govern.
- AGENTS.md rules ratified 2026-07-11: harness scenarios persist as
  committed artifacts; config changes propose-never-ship.
- Per-ticket harness scripts exist from J4 forward (`scripts/harness/`);
  J3/VW predate the rule (no backfill).
