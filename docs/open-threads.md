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
   live, J4 + J5 both). Five gates, one sitting; bugs → side chats, verdicts
   → the ledger. Owner: Nick.
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
   - J5 · S25 + desktop: lens chips and the "Add to…" sheet at thumb size,
     drill-down feel, toast legibility (S25); pointer precision on chips/
     handles/sheet rows (desktop). Folded in here rather than a separate
     sitting — same surface family as J3/J4, same hand.
   - Plus: the formal stack word (VW's old merge condition, satisfied in
     practice; this session makes it official).

## IN FLIGHT — proceeds without Nick once (1) lands
3. ~~**J5 — the Spread console.**~~ **DONE — 2026-07-11.** Built per
   `docs/j5-spread-console-brief.md` on `j5-spread-console`, off post-merge
   `main` (Slices 0-3: the lens row — order/content/star/tag, drag disabled
   outside the default lens — and the "Add to…" destination-drill sheet —
   FILE to Shelf/Drawer/Binder, COPY to a chapter or Board, LINK to a plan
   beat). Fable's review returned REQUIRED FIXES — 3, all small, no
   data-loss-class findings (`docs/j5-review-fable.md`); CC folded R1
   (single-page MOVE toast lost on navigate — fixed via the F2 `warmStart`
   one-shot-state pattern), R2 (DoD 2's positive drag-reorder path was
   unverified — harness gained the missing check, no app fix), R3
   (multi-source append order ruled **notebook order** — docs/comment fix,
   no behavior change); `scripts/harness/j5.mjs` grew to 40 checks. Nick
   relayed "Merge `j5-spread-console` to `main` and deploy." CC merged
   (one expected conflict in this ledger's own item 3, resolved in favor of
   the more current text), ran `tsc` (desktop + server) + `build:web` +
   selftest + the persisted `scripts/harness/j4.mjs` (26/26) +
   `scripts/harness/j5.mjs` (40/40) — all green on merged `main` — pushed,
   `railway up`. **Zero-schema deploy** (no server files touched; every new
   path rides pre-existing synced fields) — confirmed live via a basic
   liveness check (`200` on `/`, the auth gate responding) rather than a
   new-field round-trip, since there was no new field to check. See
   `docs/backlog.md`. Next: J5's own S25 + desktop gate items (lens chips at
   thumb, sheet drill, toast legibility; pointer precision) — fold into the
   consolidated hardware session (item 2) rather than a separate sitting.

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
   with three living citizens now — the Box schema, the S-arc's ScriptDoc
   scenes (`docs/s-arc-screenplay-plan.md`, v1.1), and the Structure Spine's
   links-on-the-child rule (`docs/structure-spine-plan.md` — **PROPOSED,
   awaiting Nick's ratification**; not yet a build authorization). Proposal
   doc, double-pass deliberation per AGENTS.md committees. Downstream: once
   this pass convenes, the spine's P-arc runs P1 (vocab+templates) and P2
   (the two-way materialize/promote seam) parallel to the S-arc; P3
   (fragment-granular) waits on S1. Briefs for P1/S1 etc. follow one ticket
   at a time — this plan alone builds nothing.
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
