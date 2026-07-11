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
4. **S1 — the element engine (the Screenplay Room).** Built per
   `docs/s1-script-editor-brief.md` on `s1-script-editor`, off post-J5
   `main` — the S-arc's heavyweight (~2× a J-ticket), authorized by
   `docs/fragments-under-pages-canon.md`'s ruling (item 7 below) that
   ScriptDoc conforms. The substrate (`pageType:'script'`, one `script`
   jsonb column through both sync mappers), the birth paths (Screenplay-
   kind create + ProjectHome's dedicated button + the generic picker's
   Script leaf), and the room itself — a house-native block editor, one
   live element at a time (the `BoardTextBox` pattern), the frozen Enter/
   Tab keyboard map, slugline/location/TOD + character + extension
   autocomplete, auto (CONT'D), Voice Wall + I0 pen discipline + TTFK
   wiring. One new dep (`@fontsource/courier-prime`, scoped to
   `--font-script` — `--font-mono` untouched).
   **Fable's review returned 2026-07-11: REQUIRED FIXES — 2** (one code,
   one verification), no data-loss/sync-law findings — "for a 1,400-line
   heavyweight this is an unusually clean build" (`docs/s1-review-fable.md`).
   CC folded R1 (the autocomplete popover was unanchored — it rendered as
   the sheet's last child with no top/left, so it took its static position
   at the bottom of the WHOLE document instead of beneath the active
   element; every harness check had always edited the document's tail, so
   82/82 passed while it was broken for the primary case — mid-document
   editing. Fixed by rendering it as the active element's own flow-sibling;
   a new mid-document harness check measured `gap:0` from the active
   element, `250px` from the sheet's bottom — unambiguous.) and R2 (grepped
   all 6 CSS vars the surface consumes — confirmed present, no fix needed).
   Also folded three advisories Fable flagged as fix-opportunistically (a
   DOM-vs-state read asymmetry in Backspace-merge/arrow-walk/click-commits;
   a comma-operator bug silently dropping half a `waitFor` condition; one
   exact-match golden-string assertion, since containment alone can't catch
   whitespace drift in a string that's S3's future parser contract) —
   deferred A1 (synthetic-heading id churn) to P3 per Fable's own call, and
   A5 (ghost-visibility feel) to the hardware gate. Found and fixed one
   flaky-harness bug of CC's own along the way: two blind `sleep(2300)`
   calls sat at the exact debounce worst-case with zero buffer and
   intermittently read stale content — fixed by polling instead (the same
   lesson J5's harness already learned once). `scripts/harness/s1.mjs`
   grew 82 → 87 checks, stable across 3 runs; `j4.mjs`/`j5.mjs` re-run
   green; `tsc`/`build:web`/selftest green. See `docs/backlog.md` for the
   full log. **CC's part is DONE — re-pushed, awaiting Fable's delta
   spot-check + Nick's merge word** (same protocol as J4/J5). **Note per
   Fable: unlike J5, this deploy is NOT zero-schema** — the live prod
   push/pull round-trip for the new `script` column (the D2/J4 ritual) is
   required on first deploy, not optional. Next: Fable's delta check →
   Nick's merge word → `railway up` + the live round-trip → S1's own S25 +
   desktop gate items (typing rhythm, ghost legibility, autocomplete at
   pointer/thumb, keyboard-map muscle memory). Owner now: Fable → Nick.

## CANON DEBTS — Fable's, actionable after the gate session
5. **Rev 3 of `docs/state-of-wrizo-2026-07.md`.** A week of TTFK data now
   exists on prod; Rev 3 folds it in, plus: the ink canon, the reframed
   gate language ("merge+deploy is the test; verdicts close tickets"), the
   "Your order"/Journal-only vocabulary ruling, and the J-arc verdicts.
   Trigger: Nick's session verdicts land.
6. **F5 TTFK DoD-6 empirical close.** One small CC task: run the
   sessions_log queries against prod (non-null `surface` +
   `desk_opened_at` rows). Fold into the Rev 3 prep relay.

## POST-ARC QUEUE — unblocks when J5 ships + gates close
7. ~~**Fragments-under-Pages committee pass.**~~ **RULED — 2026-07-11**
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
8. **B3 atmosphere pass · B4 ember accent finish · W5 responsive** — were
   deferred until Journal UI surfaces existed; the Spread and the Board now
   exist. B4 intersects the Journal sprint reward surface (design together).
9. **HOME verification remainder**: bighead art, sort-hint.

## HORIZON — no ticket yet, on the map
10. **User-authored identity / rhizomatic personalization**: wordmark
    replaceable with the writer's own hand; four launch themes (Plateau,
    Flux, Volant, Nomad); single hard invariant = the orange accent.
11. **Reciprocity gate** for the future workshop feature (review before
    submitting).
12. **wrizo.app Cloudflare resolution** (domain plumbing).
13. **USPTO "Wrizo" search** before significant brand investment (one
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
