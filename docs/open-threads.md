# Open threads — the studio ledger · 2026-07-12

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
   live, J4 + J5 + S1 all; W1 pending its own merge, see item 5). Seven
   gates, one sitting; bugs → side chats, verdicts → the ledger. Owner: Nick.
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
   - S1 · S25 + desktop: typing rhythm, ghost legibility, autocomplete at
     thumb (S25); keyboard-map muscle memory, autocomplete at pointer
     precision (desktop). The Screenplay Room's first hardware pass.
   - W1 · S25 + desktop: edge-dwell + 0.7s summon feel (deliberate reach vs
     drive-by), typewriter window-scroll on the ink surface (stylus-down
     judder; does Draft want it at all), progress caret + celebration read
     (reward vs interruption; A4's reset-drain), ≥1700px rail-toggle page
     stability (the actual bug W1 fixed), Workshop/Publish tabs behaving
     sanely on a Page.
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
4. ~~**S1 — the element engine (the Screenplay Room).**~~ **DONE —
   2026-07-11.** Built per `docs/s1-script-editor-brief.md` on
   `s1-script-editor`, off post-J5 `main` — the S-arc's heavyweight, authorized
   by `docs/fragments-under-pages-canon.md`'s ruling (item 8 below). The
   substrate (`pageType:'script'`, one `script` jsonb column through both sync
   mappers), the birth paths, and the room itself — a house-native block
   editor, the frozen Enter/Tab keyboard map, full autocomplete chain, auto
   (CONT'D), Voice Wall + I0 pen discipline + TTFK wiring. Fable's review
   returned REQUIRED FIXES — 2 (`docs/s1-review-fable.md`) — CC folded both
   plus three opportunistic advisories; `scripts/harness/s1.mjs` grew
   82 → 87 checks, stable across 3 runs. Nick relayed "Merge `s1-script-editor`
   to `main`... `railway up`... then run the live prod push/pull round-trip
   for the `script` column." CC set aside an unrelated in-progress workstream
   sitting uncommitted in the working tree (`git stash push -u` on an
   explicit pathspec, not a blanket stash), merged clean (no conflicts), ran
   `tsc` (desktop + server) + `build:web` + selftest + `j4.mjs` (26/26) +
   `j5.mjs` (40/40) + `s1.mjs` (87/87) — all green on merged `main` —
   pushed, `railway up`. **The live prod round-trip (required — NOT
   zero-schema, per Fable's note): a scratchpad script registered a
   throwaway account, pushed a `journal_entries` row with a populated
   multi-element `ScriptDoc`, and pulled it back down via a second
   `/api/sync` call simulating a second device — `pageType`, `entry.text`,
   and the full `ScriptDoc` all matched byte-for-byte (key-order-insensitive).
   ROUND-TRIP: PASS.** Test entry soft-deleted after. Stash restored
   afterward, applied clean. See `docs/backlog.md`. S1's own S25 + desktop
   gate items (typing rhythm, ghost legibility, autocomplete at
   pointer/thumb, keyboard-map muscle memory) join the consolidated hardware
   session (item 2) — Nick's device verdict closes the ticket.
5. **W1 — writing-surface polish.** Built on `w1-writing-surface-polish`
   (shared `WritingIncentives`/`useTypewriterFade` extraction, Journal
   incentive-layer parity, page-is-primary metadata relocation, edge-dwell +
   0.7s summon, fixed-track grid, Workshop/Publish tabs into PageEditor).
   Fable's review: REQUIRED FIXES — 4 (`docs/w1-review-fable.md`), no
   data-loss-class findings. R1–R3 folded (spurious mount celebration seed,
   Journal progress-setting gate, window-scroll `data-scrolled` C2 fix); R4
   ruled — Nick: ratify the `.vscode/settings.json` auto-approve expansion
   in place, logged in the fix-batch commit. Merge waits on the delta
   spot-check + Nick's word; device gates fold into item 2. Rode along in
   the original push: `fe24918` (state-of-wrizo 2026-07 + logo set,
   docs-only sweep).

## CANON DEBTS — Fable's, actionable after the gate session
6. **Rev 3 of `docs/state-of-wrizo-2026-07.md`.** A week of TTFK data now
   exists on prod; Rev 3 folds it in, plus: the ink canon, the reframed
   gate language ("merge+deploy is the test; verdicts close tickets"), the
   "Your order"/Journal-only vocabulary ruling, and the J-arc verdicts.
   Trigger: Nick's session verdicts land.
7. **F5 TTFK DoD-6 empirical close.** One small CC task: run the
   sessions_log queries against prod (non-null `surface` +
   `desk_opened_at` rows). Fold into the Rev 3 prep relay.

## POST-ARC QUEUE — unblocks when J5 ships + gates close
8. ~~**Fragments-under-Pages committee pass.**~~ **RULED — 2026-07-11**
   (`docs/fragments-under-pages-canon.md`, convened on Nick's word — "let's
   get it built" — with a sequencing pull-forward). Names the pattern `Box`
   and `ScriptDoc` already share: one jsonb column per substrate family on
   `journal_entries`, both sync mappers, boot-idempotent DDL, never a new
   collection; links live on the child (fragment `beatId?`, never a beat's
   target list); a prose-bearing substrate maintains a derived `entry.text`
   shadow, a spatial one (boxes) doesn't; each substrate gets its own
   `PageEditor()` delegate (the J4 routing rule). Ruled: `Box` conforms
   (grandfathered on schema `v`); `ScriptDoc` conforms as designed —
   **S1 may proceed** (see item 4 above, now built). Closes this item;
   future structured pageTypes join by satisfying §2's checklist in their
   own brief's Slice 0, no new committee pass required.
9. **B3 atmosphere pass · B4 ember accent finish · W5 responsive** — were
   deferred until Journal UI surfaces existed; the Spread and the Board now
   exist. B4 intersects the Journal sprint reward surface (design together).
10. **HOME verification remainder**: bighead art, sort-hint.
11. **Page-is-primary committee pass** (`docs/page-primacy-committee-brief.md`,
    logged 2026-07-11/12). Drawers/Shelf/Library are still full route
    navigations that unmount the current writing surface — W1 only fixed the
    in-ModeStage instance of the bug (the assist-rail layout shift). Needs
    the Experts + Architects to rule overlay-vs-navigation and, if overlay,
    the interaction model, before a build brief exists.
12. **Progress-milestones committee pass**
    (`docs/progress-milestones-committee-brief.md`, logged 2026-07-11/12).
    The Words⟷Project progress-bar toggle (milestone circles per
    chapter/scene) and extending the bar to Structure Board notecards, both
    requested alongside W1's progress-bar redesign — needs a ruling on what
    "chapter complete" means before it's buildable.

## HORIZON — no ticket yet, on the map
13. **User-authored identity / rhizomatic personalization**: wordmark
    replaceable with the writer's own hand; four launch themes (Plateau,
    Flux, Volant, Nomad); single hard invariant = the orange accent.
14. **Reciprocity gate** for the future workshop feature (review before
    submitting).
15. **wrizo.app Cloudflare resolution** (domain plumbing).
16. **USPTO "Wrizo" search** before significant brand investment (one
    low-threat prior use known: a throwaway utility on pi7.org).

## TOOLING STATUS — for any fresh session's orientation
- GitHub connector: READ-ONLY (Fable reviews via read pipe; write grant
  remains Nick's open call — amended canon would land as commits).
- Desktop Commander: chronically unstable (fresh-restart-then-degrade);
  reviews run via GitHub reads, deliverables via container files.
- CC sessions launch FROM THE REPO ROOT (`writer-studio`) or the
  permissions allowlist doesn't govern.
- AGENTS.md rules ratified 2026-07-11: harness scenarios persist as
  committed artifacts; config changes propose-never-ship (2026-07-12:
  `.vscode/settings.json` auto-approve expansion ratified post-hoc as a W1
  exception — see item 5 / `docs/w1-review-fable.md` R4; the rule stands
  for future changes).
- Per-ticket harness scripts exist from J4 forward (`scripts/harness/`);
  J3/VW predate the rule (no backfill).
