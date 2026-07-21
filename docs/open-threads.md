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
2. ~~**The consolidated hardware session.**~~ **PARTIAL, THEN SUPERSEDED —
   2026-07-14.** Nick's device pass ruled five J2/W1 specifics (S1-S5) before
   the sitting was superseded by the App Bones pivot
   (`docs/wrizo-alpha/app-bones-canon.md`). J2 + W1-partial verdicts banked
   (`docs/wrizo-alpha/j2-s25-fixes-brief.md`); all remaining gates (J3, J4,
   J5, S1, W2, M1, and TH2's tenth cluster) superseded per the canon's Q3 —
   parked surfaces carry no debt; AB slices carry their own device gates.
   See item 21.
21. ~~**The AB-arc.**~~ **CLOSED — 2026-07-16, Nick's word.** Canon ratified 2026-07-14 — Nick's word, rulings folded
    into `docs/wrizo-alpha/ab1-page-frame-brief.md` (mode strings, flourishes
    unmounted, theme-scoped module names) and `docs/wrizo-alpha/the-desk-design.md`
    Part 6 (now RULED). Briefs per `docs/wrizo-alpha/fable-week-plan.md`.
    Supersedes item 2's remaining gates (see above). Blocks: AB2/AB3 briefs,
    the succession dossier.
    **AB1 — MERGED, NOT CLOSED — 2026-07-14.** Built S0-S6 on
    `ab1-page-frame` off post-handoff `main` (shell inventory
    `docs/wrizo-alpha/ab1-shell-inventory.md`; `DeskFrame` + the five zone
    tracks, gated at the brief's own ≥1100px floor — below it every surface
    is byte-identical pre-AB1 JSX; `ModeStrip` with the ratified strings on
    text + script; flourishes unmounted, meter track empty; the vanishing
    law generalized (found and fixed a real pre-existing `ModeStage`
    edge-dwell resurface bug along the way — the dwell listener was being
    torn down every render); chrome purge + the script containment fix
    (finding 4 dead); `store/deskLexicon.ts` for the strings seam — **note
    for review: Fable's handoff named `desk/strings.ts`, CC built
    `store/deskLexicon.ts` instead (sibling to `themeLexicon.ts`), a
    reasoned but unconfirmed deviation, flag at review**; `ab1.mjs`
    harness). An independent CC review pass then found and fixed two real
    defects before folding back: a genuine layout overflow at the exact
    1100px gate floor (page column overlapped the tool-rail/corkboard
    tracks — a `minmax(0,1fr)`/min-width chain fix, new permanent harness
    coverage) and Board's vanishing law left unwired (judged a real gap,
    not a Nick-level call, and wired to match Script's pattern).
    `ab1.mjs` grew 32→37 checks. `tsc` + `build:web` + selftest + the full
    suite (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`, 341 checks
    total) green, independently re-run a second time on merged `main` by
    CC (not just trusted from the build/review agents) before push.
    Fast-forwarded to `main` @ `fba81c7`, pushed.
    **Fable's post-merge review landed** (`docs/wrizo-alpha/ab1-review-fable.md`):
    REQUIRED FIXES — 2, no data-loss-class or architecture findings.
    Rulings of record: the `store/deskLexicon.ts` naming **RATIFIED**
    (over the handoff's `desk/strings.ts`); the ≥1100px gate **RATIFIED**;
    SyncIndicator's global silence **RATIFIED**; CC's self-review pass and
    the `ModeStage` dwell fix **endorsed**; finding 1 argued
    dead-by-composition, formal death certificate deferred to Nick's
    device look. Six advisories carried (A1-A6), none blocking.
    **ab1.1 folded — 2026-07-14** @ `f01b400`: R1 — the vanishing law
    missed the `sprint-nav` row (breadcrumb + Done/Undo) on framed Script
    and Board, which carried no `chrome-fade`/`data-chrome-receded` and so
    stayed visible while the rest of the room dissolved; fixed by
    mirroring PageEditorView's pattern in `ScriptEditor.tsx` and
    `BoardEditor.tsx`, `ab1.mjs` grew 4 checks (recede + restore, both
    surfaces) 37→41. R2 — `ab1-page-frame-brief.md`'s S2 now carries the
    ruling on JournalEntry: absorb-deferred is **sustained**, the work is
    **re-homed to AB2 as a named slice** (QuickSprint's deferral likewise
    sustained — never in S2's list). Full suite re-verified green
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`, 345 checks total),
    pushed. **Close conditions per Fable: (1) CC folds ab1.1 + reports=push
    — DONE; (2) Fable spot-checks the ab1.1 delta — DONE, 2026-07-15,
    GREEN, no findings (verified against `f01b400` full patch; fixes
    match the review's prescription verbatim, framed-only, harness
    asserts recede+restore on both surfaces); (3) Nick's device look
    (wide + near-floor; finding 1's composition verdict and A1's
    active-tab orange read are his to make there; no deploy owed
    first) — OPEN.** Item closes only after (3).
    **AB2 — MERGED, NOT CLOSED — 2026-07-15.** Built S0-S8 on
    `ab2-tools-by-mode` off post-ab1.1 `main` @ `8e98337`
    (`docs/wrizo-alpha/ab2-tools-by-mode-brief.md`). S0 ruled Draft storage
    SUSTAINED (markdown conventions in `entry.text`, iA display register).
    `components/ToolRail.tsx` fills DeskFrame's tool-rail track per mode;
    Free Write gets ink/typewriter (un-parked)/forward-lock (persisted,
    default on, matches pre-AB2 behavior)/capture items (retiring AB1's
    interim corkboard Journal tab); Draft gets Bold/Italic/Heading/Spacing
    (`store/draftFormat.ts`) plus the Structure picker
    (`store/structureConvert.ts`, mechanical only, confirmed AI-free by
    grep); Publish gains Copy My Words/Copy Formatted on both prose and
    script (findings 2, 3 dead); `JournalEntry` enters the frame at
    ≥1100px (the AB1 review's R2 ruling, satisfied); the strip quiets —
    brass off the active tab, a 1px olive `--accent-rest` hairline,
    uppercase/letterspaced presentation only (ratified strings/
    `deskLexicon` untouched). `ab2.mjs` (38 checks); `ab1.mjs`'s four
    now-superseded checks moved to PARKED (originals quoted, one-line
    reasons, successors in `ab2.mjs`). An independent review pass then
    stress-tested S3's live contenteditable decoration engine and found a
    **real, serious bug**: Draft-mode Enter-key handling silently
    corrupted caret position under ordinary typing (`execCommand`
    produced a block split, not a text newline, compounding with a
    genuine Chromium EOF-caret quirk reproduced React-free) — root-caused
    and fixed with a shared, guarded redecorate helper now used
    consistently by both the editor and the rail's format actions;
    reverified via the same stress scenarios plus a persisted-storage
    check. `tsc` + `build:web` + selftest + the full suite
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`/`ab2`, 379 checks
    total, both `HARNESS_PARKED` settings) green, independently re-run a
    second time on merged `main` by CC before push. Fast-forwarded to
    `main` @ `136f438`, pushed.
    **Deployed — 2026-07-15**, Nick's word (`railway up`): live at
    `writer-studio-app-production.up.railway.app`, confirmed (`200` on
    `/healthz` and `/`, `401` on `/auth/me`, unauthenticated as expected).
    Carries AB1 + AB2 together (main was already merged through both at
    deploy time).
    **Fable's post-merge review landed — 2026-07-15**
    (`docs/wrizo-alpha/ab2-review-fable.md`): **REQUIRED FIXES — 0**, the
    first clean sheet of the AB arc — no data-loss-class or architecture
    findings, no fold. Five endorsements on the record (the caret fix's
    diagnosis and one-gate architecture; S6 carrying AB1's R1 lesson
    whole, clean on the first pass; the prose↔screenplay conversion's
    data discipline; the parked-section disposition blessed; the
    reasoned rail omissions sustained). Five advisories carried, none
    blocking (A1 a low-stakes `sync.ts` seam to eyeball next
    server-adjacent touch; A2 the typewriter toggle unreachable from a
    script-only workflow, a 2-line fold candidate for AB3; A3 the
    sentinel strip also cleans user-authored zero-width-spaces,
    recorded as a decision; A4 name the PARKED section's two check
    species — dormant vs. superseded; A5 the italic matcher is looser
    than strict markdown, house-convention-acceptable). Suite arithmetic
    independently verified (304 + 37 + 38 = 379 default-flow; armed adds
    3). **Close conditions per Fable: (1) CC build→review→merge→push —
    DONE; (2) Fable's post-merge review — DONE, this document, no fold
    owed; (3) Nick's device look — the SOLE remaining gate, one sitting
    for both AB1 and AB2** (composition wide + near-floor, the strip's
    olive hairline in situ, Draft's iA register under the hand, a
    Structure-picker conversion each way, the Journal inside the frame,
    the forward-lock switch). Item 21 closes on (3) alone now.
    **ab2.1 folded — 2026-07-15** @ `3defe3f`
    (`docs/wrizo-alpha/ab2-1-fix-brief.md`), found by (3)'s device look
    itself against the live deploy: the Journal paper rendered as an
    ~80px sliver. **F1 (required):** `JournalEntry.tsx`'s framed wrapper
    had `alignItems:'center'`, overriding flex's default `stretch` and
    collapsing every block child — including the paper — to
    fit-content; fixed with `width:'min(100%, 720px)'`, no `alignItems`.
    **F2 (required, the class fix):** a rendered-geometry sanity sweep
    added to `ab2.mjs` across every framed surface — which immediately
    caught a **second, previously-undetected instance of the same bug**,
    live since AB1: `BoardEditor`'s framed branch passed two children
    into `DeskFrame`'s flex-row stage with no width wrapper, collapsing
    `.board-canvas-wrap` to 2px. Fixed with the same wrapper pattern
    (capped at legacy board's own 1100px measure). **F3 (lawful sweep,
    Nick may veto on sight):** `DeskRail`'s active-item indicator swapped
    brass → `--accent-rest`, per `docs/theme-foundations/plateau/`'s new
    foundations doc (§3/§5, committed alongside this brief): *olive marks
    where you are; orange marks what you do* — the resting-orange
    allowance is engraved zone headings only now. Full suite green — 384
    checks total (`ab1` 37/40 armed, `ab2` 43, +5 over the AB2 review's
    379). Report = push.
    **Redeployed — 2026-07-15**, Nick's word ("Deploy it so I can test out
    the page"): `railway up` on `main` @ `fce22df`, confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). The live site now carries
    ab2.1.
    **Fable's delta spot-check — DONE 2026-07-15, GREEN** (verified
    against `3defe3f` full patch). Advisory: F3's not-brass assertion is
    correct strength while olive is a working value — graduate to a
    positive olive assert when the Plateau token locks. Carry to AB3
    review context: `BoardEditor` mounts `DeskFrame` `pageKind='prose'`
    (pre-existing AB1 wiring, untouched by the fold).
    **Nick's first device sitting — PARTIAL, 2026-07-16.** Ran against
    the AB1+AB2+AB3 deploy (`main` @ `32db861`). **Composition verdict:
    FAILS on wide** — the tool sliver, panel architecture, mode-strip
    placement, and wide-monitor composition don't hold up as built; this
    drives a **new committee design pass**, structural, not a fix-fold —
    brief pending, not yet written. **Ruled and answered by FX1**
    (`docs/wrizo-alpha/fx1-first-sitting-brief.md`, building): the
    typewriter feel (no per-line pop, fade band, centered start), the
    screenplay paper (was collapsed/misaligned — Law 1 violated), the
    forward lock (Nick's verdict: it's **mode furniture** — belongs to
    Free Write the posture, not the Journal the place — reinstated on
    every page's rail regardless of origin; **provisional canon note**:
    Law 2's furniture list amends in practice pending the committee
    pass's formal ratification), square corners everywhere. **Still open
    for a later sitting** (not FX1's to answer): the notebook
    felt-check (item 23's Ruling 3 — file a page, flip the notebook,
    does its absence from the flip-through feel like forgetting?), the
    olive rail read, and the timer/progress feel once the goal system
    lands. Item 21 does **not** close on this sitting alone — the
    composition verdict alone reopens it, independent of FX1's fate. See
    FX1's own ledger entry once built, and watch for the pending
    committee-pass brief.

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
5. ~~**W1 — writing-surface polish.**~~ **DONE — merged/deployed
   2026-07-12.** Built on `w1-writing-surface-polish` (shared
   `WritingIncentives`/`useTypewriterFade` extraction, Journal incentive-
   layer parity, page-is-primary metadata relocation, edge-dwell + 0.7s
   summon, fixed-track grid, Workshop/Publish tabs into PageEditor). Fable's
   review returned REQUIRED FIXES — 4 (`docs/w1-review-fable.md`), no
   data-loss-class findings; CC folded R1 (spurious mount celebration —
   `lapsRef` now seeds from the first-render value), R2 (Journal now honors
   the persisted Progress=off setting), R3 (window-scroll `data-scrolled`
   gated on the sheet's own top vs. viewport, not raw `scrollY` — fixes a
   C2 violation); R4 ruled — Nick: ratify the `.vscode/settings.json`
   auto-approve expansion in place, logged in the fix-batch commit.
   `scripts/harness/w1.mjs` grew to 18 checks, including the two regression
   scenarios Fable specified. Per `docs/w1-close-handoff.md`: Nick relayed
   the W1 merge word plus delegated the two committee-canon ratifications to
   Fable under a progress-over-perfection directive. CC merged (fast-
   forward, no conflicts), ran `tsc` (desktop + server) + `build:web` +
   selftest + `j4.mjs` (26/26) + `j5.mjs` (40/40) + `s1.mjs` (87/87) +
   `w1.mjs` (18/18) — all green on merged `main` — pushed, `railway up`.
   **Zero-schema deploy** — confirmed live via `200` on `/` and the auth
   gate responding as expected. See `docs/backlog.md`. W1's own S25 +
   desktop gate items (edge-dwell/summon feel, typewriter window-scroll,
   progress caret/celebration read, ≥1700px rail-toggle stability,
   Workshop/Publish on a Page) join the consolidated hardware session
   (item 2) — Nick's device verdict closes the ticket. Rode along in the
   original push: `fe24918` (state-of-wrizo 2026-07 + logo set, docs-only
   sweep).

6. ~~**W2 — the way back.**~~ **DONE — merged/deployed 2026-07-13.** Built
   per `docs/w2-way-back-brief.md` on `w2-way-back` @ `1b10d04`, off
   post-W1 `main` — the PAGE IS PRIMARY rule (AGENTS.md, verbatim from
   `docs/page-primacy-canon.md`) landed with this ticket, per the canon.
   Session capture (`store/wayBack.ts`, `store/caretOffset.ts`,
   `components/useWayBack.ts`) wired into all five writing surfaces; the
   return chip in DeskRail's top slot. Fable's review returned REQUIRED — 2
   (`docs/w2-review-fable.md`), no data-loss-class or architecture findings.
   **w2.1 folded before close:** R1 — the hook's own comment ("callers
   are keyed by id") turned out to be false for QuickSprint: it had NO
   remount-forcing key at its route mount (unlike PageEditor/JournalEntry),
   so navigating between two different sprint routes reused the same
   component instance — `liveRef` (updated unconditionally every render)
   would already read the NEW id by the time the OLD entry's capture
   cleanup ran, mislabeling its scroll/caret under the wrong id. Fixed by
   wrapping `QuickSprint` in an outer `key={draftId}`-forcing component,
   the same pattern PageEditor/JournalEntry already used. R2 — the restore
   effect's rAF + 80/200/350ms re-assert ladder (needed to win the
   mount-seeding race against a surface's own initial adjustments, e.g. the
   typewriter's hold-band scroll) fought the writer if they acted inside
   that window; fixed with a self-removing canceller on
   keydown/pointerdown/wheel/touchstart that clears the remaining
   re-asserts the moment the writer does anything. `scripts/harness/w2.mjs`
   grew 21 → 31 checks (the pager A→B non-leak proof, the QuickSprint
   depart/return round trip, the R2 cancel-on-input proof). Advisories
   A1/A2/A3 noted in file headers, not fixed (no live problem at current
   scale; A3 — a reload preserving the chip — judged correct, not a bug).
   Merge was pre-authorized (Nick, 2026-07-13, fix-forward mode). CC merged
   (fast-forward, no conflicts), ran the full suite (`tsc` ×2 + `build:web`
   + selftest + `j4.mjs` 26/26 + `j5.mjs` 40/40 + `s1.mjs` 87/87 +
   `w1.mjs` 18/18 + `w2.mjs` 21/21) green on merged `main`, pushed,
   `railway up`, confirmed live — then folded w2.1, re-ran the full suite
   again (all green, `w2.mjs` now 31/31), and pushed + redeployed a second
   time for Fable's delta spot-check. **Zero-schema** both times — liveness
   check only. See `docs/backlog.md`. W2's own S25 + desktop gate items
   join the consolidated hardware session (item 2) — Nick's device verdict
   closes the ticket.
19. ~~**TH1 — the theme seam.**~~ **DONE — merged/deployed 2026-07-14.**
    Brief: docs/th1-theme-seam-brief.md, canon: docs/flux-theme-canon.md,
    visual ref: docs/design/flux-rc2.html. Built per the brief's Slices 0-4
    on `th1-theme-seam` off post-docs-sweep `main` @ `dfc7dc3` (errata: this
    item originally named the branch point `7f4bc6b` — the actual
    merge-base is `dfc7dc3`, the TH-arc docs sweep commit; corrected here)
    — a theme-agnostic seam (data-theme attribute; the token audit + two
    new slots `--line-active`/`--signal-live`; lexicon projection; four
    font slots re-pointing the existing material-named vars; the
    Voice/Page/Fade preference matrix; the effects-layer scaffold), zero
    component forks, Plateau byte-equivalent to pre-TH1 values.
    Fable's review returned REQUIRED — 2, 3 advisories carried to TH2, no
    data-loss-class or architecture findings. **Folded before merge:**
    R1 — the lexicon carried one string per term; English pluralization
    isn't algorithmic from a single string (Drawer/Drawers works with a
    mechanical +s, but a theme's own noun might not), so
    `store/themeLexicon.ts` now carries two independent number forms per
    term (`one`/`many`), each separately overridable per theme; `t()`
    returns `one`, new `tMany()` returns `many` with the same canonical
    fall-through — swept DeskRail's Drawers rail item and the
    PageEditor/QuickSprint Pages toggle (the two plural-noun UI sites the
    original build left unswept) through `tMany()`, byte-equivalent on
    Plateau. R2 — `ThemeEffectsLayer.tsx` now exports `registerThemeFx(id,
    handlers)`, the actual seam a theme calls to light the layer up, plus
    two comment truth-ups (that file's header; `store/theme.ts`'s
    `initTheme()` doc-comment named the wrong call site, corrected to
    `main.tsx`). `docs/flux-theme-canon.md` §5 gained a two-sentence
    number-forms note. `scripts/harness/th1.mjs` grew 21 -> 26 checks,
    stable across 3 runs. **Merge mode: CONTINGENT** — Nick's merge word
    granted on a green fold. `main` had diverged (this session's own
    `docs/theme-foundations` commit, `befd377`, landed on `main` after the
    branch point) — rebased the branch onto `main` clean (zero conflicts,
    fully disjoint files), force-pushed, then fast-forward merged. Ran the
    full suite (`tsc` ×2 + `build:web` + selftest + `j4.mjs` 26/26 +
    `j5.mjs` 40/40 + `s1.mjs` 87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 +
    `m1.mjs` 33/33 + `th1.mjs` 26/26) green on merged `main`, pushed,
    `railway up` — confirmed live (`200` on `/healthz` and `/`, `/auth/me`
    returning the expected `401`). **Zero-schema deploy** — no server files
    touched, liveness check only. See `docs/backlog.md`. Fable's delta
    spot-check runs post-merge (fix-forward). TH1's hardware-gate item
    folds into the consolidated session (item 2); Plateau's only
    feel-check (visually unchanged) is satisfied by the byte-equivalence
    checks, already green pre-merge.
20. ~~**TH2 — Flux.**~~ **DONE-AT-MERGE — merged/deployed 2026-07-14** (device
    verdict still open — see item 2's tenth cluster). Brief:
    docs/th2-flux-brief.md, canon: docs/flux-theme-canon.md, foundations:
    docs/theme-foundations/flux/flux-foundations.md, visual ref:
    docs/theme-foundations/flux/flux-rc2.html. Built per the brief's Slices
    0-5 on `th2-flux` off post-docs `main` @ `a18a9fb`, plus TH1's carried
    advisories (A1 Fade->off resurfaces chrome immediately; A2 prefs enum
    validation on load) and a full lexicon surface sweep across 12+ files.
    Fable's review (`docs/th2-review-fable.md`) returned REQUIRED — 3, 4
    advisories, no data-loss-class findings — "the arc's best craftsmanship
    yet." **Folded before merge:** R1 — the earn-the-orange handoff never
    fired: `[data-theme='flux'] .mode-pfill{background:signal-live}` and
    Plateau's own `.mode-pfill.celebrate{background:brass}` were equal CSS
    specificity, so source order alone silently kept the fill lime straight
    through the celebrate window (ignition sweep, orange notch, and sparks
    all rendering over lime) — a three-selector override rule fixed it
    cleanly; canon §9 + `flux-foundations.md` §3.7 both gained the errata
    reconciling "rests calm orange" with the app's repeating-lap mechanics
    (each new lap charges lime afresh). R2 — the Ambiance dial was a boolean
    (fires vs doesn't) when the brief mandates scaling: added
    `dialIntervalScale()` (50 -> 1.0 dial-center, monotonic 1 -> ~1.75x
    slower / 100 -> ~0.55x faster), read live per scheduled tick with each
    loop clamped to its own structural floor (protects the ≤3Hz-family
    spacing regardless of dial position); added an Ambiance row to
    ThemePanel (a canon-level pref with no UI was a TH1-only allowance);
    confirmed the `@fontsource` Rajdhani/Chakra Petch imports actually load
    fonts, not just declare slot-var strings. Opacity-envelope scaling is a
    **sanctioned deferral** to the hardware-tuning pass, recorded as such.
    R3 — closed the mandated sweep's residuals (`ImportDraft`'s own
    heading, the sprint-toggle's "Binder view" aria-label ×2) plus a
    closing grep-audit that found and fixed 9 more: JournalEntry's notebook
    nav + copy-text controls, PageEditor's imported-tag + copy-text
    controls, WritingIncentives' milestone aria-label, BoardEditor's text-box
    aria-label, ModeStage's sealed-AI aria-label/copy. Exempted (recorded,
    not swept): store-level Plateau-only strings (`WHISPER`) and documented
    prose judgment calls (marketing copy, `SCRAP_HEADING`). **Advisories:**
    A1 (block caret goes stale on scroll/resize — harness-invisible,
    recorded, joins the hardware-gate feel items) and A2 (Firewall chip
    correct today/coupled tomorrow if Voice Wall grows a second message
    kind — recorded) carried as-is; A3 (ThemePanel's picker-order law
    belongs at the site that will enforce it) folded — one comment citing
    `theme-arc.md`; A4 (blur(8px) on the glow, fixed spark count/angles,
    `--ink-stroke`/`--paper-glow` left inherited, interpolated-token inline
    flags) ratified as-is, the pattern for future theme packs.
    `scripts/harness/th2.mjs` grew 35 -> 43 checks (two of the new checks
    needed a second pass: the celebrate-color sample had to move past the
    fill's own .35s background transition, and the dial-100 floor check
    moved from flaky real-timer DOM observation — independently-scheduled
    loops coincidentally overlap by chance — to asserting the exported
    `clampedIntervalMs` math directly). Ran the full suite (`tsc` ×2 +
    `build:web` + selftest + `j4.mjs` 26/26 + `j5.mjs` 40/40 + `s1.mjs`
    87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 + `m1.mjs` 33/33 + `th1.mjs`
    26/26 + `th2.mjs` 43/43) green on the fold commit, `th2.mjs` stable
    ×3, fast-forward merged to `main` @ `6c5b948` (no divergence — clean
    fast-forward), full suite + `th2.mjs` re-run and green a second time
    (×3 more, 6 consecutive green `th2.mjs` runs total) on merged `main`,
    `railway up` — confirmed live (`200` on `/healthz` and `/`, `401` on
    `/auth/me`, unauthenticated as expected), pushed. **Zero-schema
    deploy** — liveness check only. See
    `docs/backlog.md`. Fable's delta spot-check runs post-merge
    (fix-forward). Flux ships to prod at merge; the ticket itself closes
    only on Nick's device verdict (item 2's tenth cluster) — born in a
    mockup, graduates on hardware.
22. **J2/W1 S25 fix brief.** **BUILT + PUSHED — 2026-07-14, device gate
    open.** Built on `j2-s25-fixes` off `main` @ `6c8a9eb`: S1 eraser
    22px→11px (ring follows), S2 quiet square-cornered SVG tool icons, S3
    the toggle shows the TARGET tool, S4 S-Pen barrel toggle wired with a
    mid-stroke guard + a committed hardware probe log (code-complete,
    unverifiable without real S-Pen hardware), S5 the ink-room rule
    (incentive row fades on stylus, restores on keyboard, reusing
    `--fade-dur`). `tsc` + `build:web` + selftest + full harness green
    (`w1.mjs` 24/24, up from 18 — gained a genuine CDP pen-stroke check
    pair). Independently re-verified, no fixes needed. One commit `eae41e9`,
    pushed to `origin/j2-s25-fixes` — **not merged**, per the brief's own
    "merge on Nick's word." See `docs/backlog.md`. Device gate: S4's
    barrel-bit assumption + S3's target-tool interpretation both want Nick's
    two-minute pen check before merge, independent of the AB-arc (item 21).
23. ~~**AB3 — the Drawer and the Homes.**~~ **CLOSED — 2026-07-16,
    Nick's word.** Merged 2026-07-15.
    `docs/wrizo-alpha/ab3-drawer-and-homes-brief.md` built
    S0-S7 on `ab3-drawer-and-homes` off `main` @ `73150ea`. **S0 — the
    arc's first schema change:** nullable `origin` text column
    (`'journal'|'project'|'loose'`) on entries, additive-only
    (`add column if not exists`, no default, no CHECK — matching the
    `script`-column precedent exactly), both sync-mapper directions.
    S1-S7: `Drawer.tsx` (tools/page/place faces composing AB2's
    `ToolRail` verbatim, fixed geometry via `--drawer-width`),
    `PageFace.tsx` (subject-based per amendment A1 — title/star/tags/
    Where-it-lives/Move/Copy/Port), the below-page metadata retired
    when framed (parked, byte-identical below the gate), origin stamped
    at every creation door (Journal/Catch → journal; project doors →
    project, invisible to the Journal; the Desk's start-writing door →
    loose, never nudged), the Journal-forgets-nothing law, `PlaceFace.tsx`,
    `ab3.mjs` (30 checks) with the ab2.1 geometry-floor lesson applied
    from day one; `ab2.mjs` grew 3 parked checks (A4-named species,
    quoted history + opposite reassertion) for the AB3-superseded claims.
    Mid-build, `main` advanced three commits (the canon landing +
    ledger updates) — the build agent noticed, read the newly-RULED
    canon in full, cross-checked every interpretive call against it
    (zero conflicts — the brief's paraphrase matched verbatim), and
    self-merged `main` into its branch before continuing, docs-only,
    zero code conflicts.
    **Independent review** re-derived the grandfather-clause proof from
    scratch (not trusting the build's own script — traced `origin`
    through every client mutation path and both sync-mapper directions
    by hand, confirmed a genuine unconditional null↔undefined fixed
    point), live-exercised all three creation doors through the harness
    including a manual end-to-end screenplay-door check, and found
    **zero bugs — the first AB-arc review to make no code changes at
    all.** Judged five interpretive calls: four sustained outright (no
    rename pipe ever existed for a page title — confirmed by grep, not
    a miss; Drawer wiring scoped to JournalEntry/PageEditor only, Script/
    Board untouched this ticket; `getNotebookPages()` deliberately not
    origin-aware, keeping J5's Spread-grid harness green; Move/Copy/Port
    expanded from loose-only to all pages, traced safe against Law 3).
    **One flagged as a genuine Nick-level call, not resolved by either
    agent:** S4's brief text names "the timer readout, the quiet
    progress bar" as journal furniture that should re-mount in the
    rail; only typewriter/ink/forward-lock actually were. Not in the
    DoD's lived tests or S7's own minimum-assert list, and no
    regression (framed surfaces never showed it before AB3 either) —
    recommended as a small fast-follow rather than blocking. `tsc`
    (desktop + server) + `build:web` + server build + selftest + the
    full 11-script suite (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/
    `ab1`/`ab2`/`ab3`) green, independently re-run a THIRD time by CC on
    merged `main` (matching both prior reports exactly) before push.
    Fast-forwarded to `main` @ `b9993a6`, pushed.
    **Deployed — 2026-07-16**, Nick's word ("Push everything that's
    ready live"): `railway up` on `main` @ `32db861` (carrying AB1's
    ab1.1 fold, AB2's ab2.1 fold, and AB3's ab3.1 fold together),
    confirmed live (`200` on `/healthz` and `/`, `401` on `/auth/me`).
    **Correction (Fable's AB3 review, R5, 2026-07-15):** the AB1/AB2
    merge pre-authorization was a **zero-schema** precedent — it does
    not generalize to schema-touching tickets. AB3 is the arc's first
    schema ticket and merged ahead of Fable's review **on Nick's go**,
    not on any standing pre-authorization; schema tickets carry no
    standing pre-auth, full stop. Post-merge review gating the close
    (the AB1 pattern) remains lawful. **Fable's AB3 review landed
    GREEN — 2026-07-15** (`docs/wrizo-alpha/ab3-review-fable.md`): zero
    product-code defects, independently reconfirmed. Required — 5, all
    harness/docs, none code (see the ab3.1 fold entry below). Awaiting
    the fold's own spot-check and Nick's device look (likely folding
    into a larger look alongside item 21's remaining gate). See item 24
    for the canon-doc resolution.
    **ab3.1 folded — 2026-07-15:** R1(a) `ab3.mjs` asserts the loose
    fixture carries none of the journal furniture (the one origin value
    with no negative guard before — `journal`/null covered in `ab3.mjs`,
    `project` in `ab2.mjs`, `loose` nowhere); R1(b) asserts framed
    PageEditor also carries no below-page metadata cluster (it never
    had one — the brief named both surfaces, only JournalEntry's
    absence was ever checked; the law now has its missing guard). R2
    clicks `.desk-toolrail-forwardlock` on the null-origin legacy
    fixture and asserts `dataset.on` actually flips and
    `wrizo-forward-lock` writes — presence isn't function, and this is
    the first assertion that the control's click handler is wired at
    all. R3 asserts the drawer's active pull's computed border-color is
    not brass (the ab2.1 F3 pattern — a negative guard while olive
    stays a working value). R4 corrects a comment in `ab3.mjs`'s A2
    section that claimed the project-origin negative was local; it
    lives in `ab2.mjs`. Brief errata added to
    `ab3-drawer-and-homes-brief.md`: S2's rename assumption withdrawn
    (no title/rename pipe ever existed); S5's "notebook nav" clarified
    per Ruling 3 (the Spread's flip-through is the loose notebook's own
    sequence, not part of the Journal's memory — Nick-vetoable at the
    device look). Full suite re-verified green, pushed.
    **Fable's ab3.1 spot-check — DONE, GREEN, no findings.** Verified
    against `86623dd` + `5072892` full patches; the review doc confirmed
    on disk verbatim. **Close conditions per Fable: (1) build→review→
    merge→push — DONE; (2) Fable's spot-check of the ab3.1 delta —
    DONE; (3) Nick's device look — the sole remaining gate**, one
    sitting now serving AB1, AB2, and AB3 together.
    **Nick's first device sitting — PARTIAL, 2026-07-16** (full verdict
    recorded under item 21, same event, one sitting for both items):
    the notebook felt-check (this item's own Ruling 3) was **not yet
    reached** — still open for a later sitting. Item 23 does not close
    on this sitting either.
24. ~~**Gap: `docs/wrizo-alpha/page-and-homes-canon.md` never
    landed.**~~ **RESOLVED — 2026-07-15.** Relayed by Nick directly
    into chat; committed at `14d846e` — the eight laws, the four ranges
    of attention, the vocabulary/theme-boundary sections, and the
    proposed AB3→AB4→AB5→I1 ladder, all matching the AB3 brief's own
    paraphrase with no discrepancies found on comparison. Status
    flipped PROPOSED → RULED and the ratification record (amendments
    A1 the drawer's subject, A2 the grandfather clause) appended per
    the brief's own instruction — both steps CC had explicitly skipped
    while the file was missing (see AB3's build report, item 23). No
    rework owed to the in-flight AB3 build: the brief it was built from
    already carried everything operative from this canon.
25. ~~**FX1 — the First Sitting.**~~ **CLOSED — 2026-07-16, Nick's
    word.** Merged 2026-07-16.
    `docs/wrizo-alpha/fx1-first-sitting-brief.md` built S1-S7 on
    `fx1-first-sitting` off `main` @ `c9767f7` — the six fixable verdicts
    from Nick's first device sitting (see item 21's sitting record; the
    composition verdict that sitting also returned is NOT this ticket's
    — it drives a separate, not-yet-written committee-pass brief). Zero
    schema, zero new deps. S1: the typewriter feel rewritten
    (`useTypewriterFade.ts`) — no per-line pop, a real fade band, fresh
    pages start near vertical center; shared by prose, script, and the
    Journal. S2: the screenplay paper now mounts prose's own geometry
    class (was collapsed/misaligned), courier font restored, typewriter
    defaults on for both surfaces. S3: **the forward lock ruled mode
    furniture** — mounts on every page's Free Write rail regardless of
    origin (ink and capture items stay journal furniture, unchanged);
    the strike/erase mechanic itself verified engaging, not just the
    control. **Provisional canon note:** Law 2's furniture list amends
    in practice pending the committee pass's formal ratification — the
    canon doc itself was not touched this ticket. S4: square corners
    (`--radius-sm`/`--radius-md`/`--radius` → 0, hardcoded literals
    swept). S5: the empty bottom bar renders nothing (`DeskFrame.tsx`
    gained a `meter` prop) — the 260px corkboard track explicitly left
    alone (named non-goal). S6: brass-at-rest swept off the Structure
    picker's active state, the rail's eyebrow labels, and the
    typewriter glyph — `--accent-rest`/quiet text now, olive law
    applied fresh. New `apps/desktop/scripts/harness/fx1.mjs` (25
    checks). **The A4 harness-parking law, exercised precisely**: two
    forward-lock-absence checks this ticket supersedes (`ab2.mjs`'s
    live project-origin check, `ab3.1`'s R1(a) loose check) were parked
    verbatim rather than edited — **except the independent review
    caught that the build had silently edited `ab2.mjs`'s check in
    place instead**, a direct violation of the exact discipline this
    ticket's own brief states in so many words; fixed by adding the
    missing quoted-history PARKED entry (SUPERSEDED species) before
    merge. `ab3.mjs`'s R1(a) treatment was correct from the first pass.
    `tsc` + `build:web` + selftest + the full 12-script suite
    (`j4`/`j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`/`ab1`/`ab2`/`ab3`/`fx1`)
    green, independently re-run a THIRD time by CC on merged `main`
    before push (`th2.mjs` hit its known transient timing flake once
    during CC's own pass — 2/43 — cleared cleanly on two immediate
    re-runs with zero code changes between attempts, consistent with
    its documented history, not a regression). Fast-forwarded to `main`
    @ `72cb547`, pushed. **Not deployed** — the brief's own DoD gates
    redeploy on both Fable's post-merge review and Nick's word.
    **Two items flagged for Nick/Fable, not resolved by either agent:**
    (1) `JournalEntry.tsx`'s window-scroll typewriter fade got the S1
    fade-band recalibration but deliberately NOT the centered-start
    treatment (ink-stroke coordinate risk) — a disclosed scope call,
    worth an explicit feel-test on the Journal surface specifically
    since the brief's DoD says "writing starts centered" without
    carving that surface out; (2) the S3 canon amendment stays
    provisional by design — the committee pass owns the formal
    ratification. **Per the corrected rule (item 23's R5): this ticket
    is zero-schema, so merge pre-authorization stood on its own — no
    separate Nick's-go was needed for the merge itself.**
    **Fable's post-merge review landed — 2026-07-16**
    (`docs/wrizo-alpha/fx1-review-fable.md`): **GREEN — zero
    product-code defects.** S3's gate change and the harness law
    verified patch-by-patch; S1/S2/S4/S5/S6 verified at census level
    (exactly the five named files touched, no schema/sync surface) plus
    behaviorally via `fx1.mjs`'s 25 checks. Five rulings of record: (1)
    the Journal's centered-start skip **sustained** (ink-coordinate
    risk is real; a felt inconsistency becomes a real ticket, never a
    tweak); (2) the `ab1` meter-track supersession **ratified as
    precedent** — A4's park law applies to any check a fix falsifies,
    brief-enumerated or not; (3) double supersession **ratified as
    house pattern** — an already-parked check going stale again still
    must pass under `HARNESS_PARKED=1`, generations accrete, all
    preserved; (4) **Fable's own R1(a) owned as vacuous, not the
    build's defect** — a loose page opens in Draft by default (no
    pageType, the support-page rule), so a Draft rail never carries
    journal furniture regardless of origin, meaning the original check
    never exercised the origin gate until this fold's fixtures clicked
    Free Write explicitly; standing lesson recorded: a check reading a
    mode-dependent surface sets the mode explicitly, never assumes a
    fixture's default. New committee docket item surfaced here: which
    mode should a loose page open in — Draft today by mere inheritance;
    Free Write is arguably the true home-base posture; the incoming
    HB-arc's first-run forces Free Write regardless — the committee
    reconciles, not this ticket; (5) the A4 in-place-edit catch
    (`72cb547`) **endorsed as the review process working as designed**,
    noted without drama. **Advisory:** `th2.mjs` now stands at two
    flake events (the ab3.1 fold, this ticket's first full-suite run) —
    a third within the month arms a standing deflake micro-pass.
    **Close conditions per Fable: (1) this review committed, ledger
    notes GREEN — DONE, this entry; (2) redeploy on Nick's word — DONE,
    see the deploy record below; (3) Nick's next sitting** (the six FX1
    felt checks, plus items 21/23's carried-over notebook felt-check
    and olive rail read) **— open; one sitting can close three ledger
    items (21, 23, 25).**
    **Deployed — 2026-07-16**, Nick's word ("go ahead and deploy"):
    `railway up` on `main` @ `6f1eff8`, confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). The live site now carries
    FX1.
    **Committee docket addition (from Fable's review, Ruling 4): the
    loose page's default mode** — Draft today (inheritance, not a
    ruling), Free Write arguably the true home-base posture, the
    incoming HB-arc's first-run forcing Free Write regardless. Relevant
    to both the standing composition committee pass (this item's
    sitting record above) and the new HB-arc threshold workstream
    (`docs/wrizo-alpha/hb-arc-handoff.md`) — ownership for whichever
    committee reconciles it first, not ruled here.
    **Items 21, 23, and 25 CLOSED together on Nick's word, 2026-07-16.**
    Two standing rulings remain **vetoable at any future sitting** and
    **block nothing** now that these items are closed: item 23's Ruling
    3 (the notebook felt-check — file a page, flip the notebook, does
    its absence *feel* like forgetting) and FX1's Journal centered-start
    skip (the ink-coordinate-risk scope call). Either can still reopen
    with a real ticket if Nick's eye finds them wanting; neither owes
    anything until then.
26. ~~**CD1 — the Composed Desk.**~~ **BRIEF RATIFIED, BUILD AUTHORIZED —
    2026-07-16.** The second committee double-pass
    (`docs/wrizo-alpha/composed-desk-committee-pass.md`) proposed
    consolidating the tool sliver, the drawer's slimming, the far-left
    rail's retirement, the mode strip's move to the top line, a
    wide-viewport composition cap, and a coverage-never-verdict goal/glow
    system into one zero-schema ticket. **Nick's ratifications,
    2026-07-16:** amendments A3-A7 RATIFIED (recorded in
    `docs/wrizo-alpha/page-and-homes-canon.md`'s second ratification
    record); Script scope APPROVED (`ToolRail` retires entirely); glow
    DEFAULT-ON; **Catch SCRAPPED from the UI** — parked, not rehomed,
    future home undecided, overruling the committee's own top-bar
    proposal (the top-right cluster is Done alone). Build brief:
    `docs/wrizo-alpha/cd1-composed-desk-brief.md`, S0-S9, authorized to
    build immediately on `cd1-composed-desk` off `main`. Zero-schema —
    merge pre-authorized per the standing rule; Fable reviews
    post-merge, gating close and deploy. **S9's park sweep is the
    ticket's real test**: the far-left rail's retirement and `ToolRail`'s
    death falsify live checks across `ab1`/`ab2`/`ab3`/`fx1` and the
    older `j`/`s` harnesses (every `.desk-rail` presence assert, the
    zones check's wayfinding clause, every `.desk-toolrail-*` selector) —
    every one must park per A4, quoted verbatim, SUPERSEDED species, in
    its own file, with the full sweep enumerated in the fold's commit
    message.
    **MERGED, NOT CLOSED — 2026-07-16.** Built S1-S9 on
    `cd1-composed-desk` off `main` @ `ac396f5` (S0's records were done
    directly on `main` by CC before the build started — no separate
    build work there). `components/ToolRail.tsx` deleted entirely; its
    estate divides between the new paper-edge `Sliver.tsx` (hand tools,
    overlays the stage margin, paper rect provably never moves — position:
    absolute anchored purely off the paper's own canonical measure, no
    JS measurement) and nothing (the drawer's tools face retires,
    `Drawer.tsx` rests on Page + Places only). `DeskRail.tsx` stops
    mounting framed (`useDeskFrameMounted()`), and its reserved gutter is
    reclaimed via a `.app-main[data-desk-frame-active='true']{padding-
    left:0}` rule beating every width-keyed padding rule on specificity —
    empirically verified at the exact 1099px/1100px boundary, not just
    trusted. The mode strip moves to the header row, the top-bar title
    retires (the paper names itself), **Catch scrapped from the UI**
    (Desk.tsx's own "+ Catch a thought" button and DeskRail's affordance
    both parked, code intact). New `store/writingGoal.ts` +
    `store/lineEquivalents.ts`: one writer-level target in
    line-equivalents at the paper's canonical measure (viewport-
    independent), default 24 lines, driving the progress hairline + the
    new `GoalGlow.tsx` — warmth only, hard-capped, no numbers/completion
    event/deficit state, glow **default-on**. Script gains the drawer +
    sliver, matching prose exactly. New `apps/desktop/scripts/harness/cd1.mjs`
    (26 checks) — **the largest park sweep in the project's history**,
    enumerated in full in commit `bd43fb6`'s message: 24 checks newly
    parked (`ab1` +4, `ab2` +6, `ab3` +7, `fx1` +7), all SUPERSEDED
    species, quoted verbatim.
    **Independent review** found two real defects and fixed both: (1) a
    genuine, if lesser, parking-discipline gap — three `ab2.mjs` parked
    reassertions had their selectors updated (`.desk-toolrail-*` →
    `.wz-sliver-*`) without their own name string disclosing that CD1
    touched them, inconsistent with this same commit's own correctly-done
    entries and with the FX1 review's own Ruling 5 precedent (rewrite the
    stale comment, don't hide the touch) — fixed by adding the missing
    inline chain-link disclosure to all three; (2) the sliver's timer was
    anchoring to its own mount rather than the first keystroke (matching
    the pre-existing `ModeStage` timer's `firstWriteRef` pattern), meaning
    idle reading time before typing silently counted as writing time — a
    real semantic bug, not cosmetic, fixed in `Sliver.tsx`. The review
    also independently re-derived the CSS-specificity gutter-reclaim
    claim empirically (not just read the code) and confirmed the park
    sweep's completeness by grepping every one of the 12 pre-CD1 harness
    files against their pre-CD1 state. `tsc` + `build:web` + selftest +
    the full 13-script suite green, independently re-run a THIRD time by
    CC on merged `main` (matching the review's counts exactly:
    `j4` 26, `j5` 40, `m1` 33, `s1` 87, `th1` 26, `th2` 43, `w1` 18,
    `w2` 31, `ab1` 37/45 armed, `ab2` 42/52 armed, `ab3` 34/41 armed,
    `fx1` 25/32 armed, `cd1` 26/26 armed) before push. Fast-forwarded to
    `main` @ `389e674`, pushed.
    **Deployed — 2026-07-16**, Nick's word ("Deploy it"): `railway up`
    on `main` @ `6126055`, confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`). The live site now carries CD1.
    **`th2.mjs`'s known transient flake hit a 4th time** (once during the
    review's PARKED pass, once again on CC's own merged-`main` run) —
    cleared cleanly both times on immediate re-run, not a regression, but
    this is now well past Fable's own standing rule ("a third within the
    month triggers the deflake micro-pass") — **a deflake pass is
    overdue and unscheduled.**
    **Three items surfaced by review, left open as genuine calls — not
    resolved by any agent:** (1) the top-right cluster's "Done alone" law
    holds for PageEditor and ScriptEditor but not JournalEntry, whose
    "← The journal" link sits on the LEFT paired with the mode strip (a
    pre-existing, pre-CD1 idiom, not something this ticket introduced) —
    rename/reposition vs. preserve the distinct wayfinding idiom is
    Nick's call; (2) the canon's bolded "Catch is SCRAPPED from the UI
    **entirely**" vs. the build brief's narrower framed-surface-only
    scope — Desk.tsx's own Catch button (outside the framed/legacy split
    entirely) was left untouched, a defensible literal reading of the
    *brief* that may not satisfy the *canon's* broader language; (3)
    JournalEntry's paper stays at a pre-existing 720px while
    PageEditor/ScriptEditor use 760px/60ch, so the sliver's canonical-
    width anchor sits ~20px off true-flush there specifically — static,
    cosmetic, the hard "paper never moves" invariant still holds
    regardless. **Per the standing rule: this ticket is zero-schema, so
    merge pre-authorization stood on its own** — no separate Nick's-go
    was needed for the merge itself. Close awaits Fable's post-merge
    review.
    **Fable's post-merge review: GREEN with a fold, cd1.1 — 2026-07-16**
    (`docs/wrizo-alpha/cd1-review-fable.md`, committed). Toggle removal
    ruled Fable's own brief defect (erratum on S1, not the build's);
    Catch's scrap ruled to extend to Desk.tsx too (Nick's "Done alone"
    word was unqualified); the ~20px JournalEntry width gap ruled not a
    defect (Nick's eye rules); the park/timer/disclosure precedents from
    the independent review all ratified.
    **cd1.1 folded and pushed — 2026-07-16**, commit `1c8de6b`: (1) the
    Pages/Plan flight toggle restored beside Done on both PageEditor's
    and ScriptEditor's framed headers (new capability on ScriptEditor,
    which never had one); (2) Desk.tsx's Catch button parked (code
    intact, unreachable); (3) `th2.mjs`'s celebrate-window brass-color
    check deflaked — the old fixed-`sleep()`-then-separate-`evalJs`
    pattern raced the celebrate window's own auto-clear; now stashes the
    matched value inside the same predicate that observes it, plus a
    widened 6s budget on the preceding class-appears wait after
    intermittent fresh-browser first-timer latency (not a race —
    `CELEBRATE_MS` is 1100ms, `waitFor` polls every 100ms); (4) full
    suite verified green: `tsc`, `build:web`, selftest, all 13 harness
    scripts under both `HARNESS_PARKED` settings (`cd1` 27/27 armed).
    **Fold-time incident, no data lost:** a concurrent session (HB1,
    building on `hb1-threshold` in the same checkout) switched branches
    mid-fold and silently clobbered three of the four uncommitted fold
    edits plus one already-verified `th2.mjs` deflake pass. Caught before
    any commit via `git status`/`reflog`; `main` itself was never at
    risk. HB1's own in-progress work was preserved with a checkpoint
    commit on its own branch before redoing the fold cleanly on `main`.
    **Redeploy NOT bundled with this fold** — Nick's call per Fable's own
    review, whether to deploy now or hold.
    **Fable's cd1.1 spot-check: DONE, GREEN, no findings — 2026-07-16**
    (verified against `1c8de6b`'s full patch; review doc confirmed on
    disk verbatim). **Close conditions 1 and 2 satisfied — only Nick's
    device-look sitting remains.**
    **cd1.1 deployed — 2026-07-16**, Nick's word ("Deploy"): `railway up`
    on `main` @ `2103b1c` (deployment `bbb3c88d`, SUCCESS). Confirmed
    live: `200` on `/healthz` and `/`, `401` on `/auth/me`. The toggle
    restoration, Desk's Catch parking, and the th2 deflake are all now
    on the live site. Only Nick's device-look sitting remains to close
    item 26.
    **Item 26 stays OPEN — 2026-07-16.** The device-look sitting
    returned two findings; both are recorded against this item and
    ticketed as their own build (item 28, FX2) rather than folded here
    — the fold cycle for cd1.1 is done. Nick's remaining sitting
    verdicts (the glow, the journal-paper question, the drawer at
    rest, the wide field) arrive on his own clock and aren't presumed
    by FX2 or anything else; item 26 doesn't close until his sitting
    is fully spent.
    **CLOSED — 2026-07-17, Nick's word.** The sitting was delivered:
    FX2 (item 28) shipped its two fixable findings. The remainder (the
    glow, the journal-paper question, the drawer at rest, the wide
    field) is not left dangling — folded forward into FX3 (item 29)
    and the Cascade committee pass (item 30), both from Nick's own
    follow-on desktop sitting. Nothing here was dropped, only re-homed.
27. **HB1 — the Threshold.** **MERGED, DEPLOYED (retroactively found —
    see below), NOT CLOSED — 2026-07-17.** Brief:
    `docs/wrizo-alpha/hb1-threshold-brief.md`. Charter:
    `docs/wrizo-alpha/hb-arc-handoff.md`. Nick's direct word waived the
    committee double-pass for this ticket; R1 (Flux stands in for Machina
    at the unlock, data not hardcode) and R2 (a visible locked door is
    accepted, once, for the first-run threshold only — M1 governs in full
    everywhere after the veil lifts) recorded in the brief itself.
    **Pre-build discovery, ruled before any code was written:** the app
    already had a second, unrelated pre-auth front door —
    `components/HomeFlow.tsx` ("HOME port v6"), a 50-word forced-write
    gate + reward + account flow that fully owned every anonymous visitor
    (mounted BEFORE the router; route `/`, where the brief specs Arrival,
    was literally unreachable pre-login). Neither the brief nor the
    charter named it. Flagged to Nick directly; his word: **Arrival
    replaces HomeFlow too, not just the Desk room** — Write works with no
    account (local-first, persists immediately, per Journal-forgets-
    nothing), account creation deferred and reachable via Open's sign-in
    (F2), not resolved to a specific ritual moment (an open call, not this
    ticket's to close — the charter's own "Write-before-signup" tension,
    left unresolved when the committee pass was waived). This roughly
    doubled the ticket's real scope beyond the brief's literal S1-S6 text:
    `App.tsx`'s auth-gated routing restructured so the router mounts
    regardless of auth state (Journal/Shelf/Drawers/Project already
    operate on local data with or without a session; only `startSync()`
    stays authed-only, untouched).
    **The build (S1-S6), all six slices.** New `components/Arrival.tsx` —
    route `/` for every boot, authed or not: the mark, a real-readiness
    boot bar (doors disable until `authState` resolves), Write (primary,
    local-first, no account) and Open (quiet-secondary, F2: authed with a
    resume target → lands on it directly; anon → the existing sign-in,
    relocated from `HomeFlow` verbatim, not rebuilt). New
    `store/firstRun.ts` (the once-per-device flag, F3), `store/
    firstRunGateActive.ts` (a `deskFrameActive.ts`-shaped ephemeral signal
    so `App.tsx`'s `GlobalHeader` goes fully absent — not just collapsed —
    while the gate holds), `store/themeTerritories.ts` (R1's data-not-
    hardcode offered/future lists — Machina arms later by moving one
    entry, no component changes). New `components/FirstRunGate.tsx`
    (`FirstRunVeil` — inert + aria-hidden + blurred, renders children with
    NO wrapper at all when inactive so `.hb1-veil` stays a true "gate is
    live" signal on every other page in the app; the monotonic word
    counter, F1's "monotone under forward lock" — struck-run flicker in
    the derived text never reads backward; a glow mirroring `GoalGlow`'s
    exact rendering contract, fed the gate's word fraction instead of
    line-equivalents, "consume don't fork" per the brief's own seam) and
    `components/UnlockCeremony.tsx` (the S4 rite: Plateau/Flux offered,
    Machina/Nomad/Volant grayed in that order; a transient single-valued
    `.chosen` flash is the only brass on screen, never a resting
    `.btn-brass`, so the house "exactly one brass per screen" law holds).
    `PageEditor.tsx`'s framed branch wires it together: the top chrome
    row, the Drawer, and the Sliver all veiled; `ModeStage` gained an
    optional `firstRunGateActive` prop (default false, byte-identical
    everywhere else) so its OWN chrome — the reveal handle and the
    settings gear — veils too (see independent review, below). S5 rehomed
    the Desk's orphans: the resume pointer into Open; Begin Project/the
    recent-drawers glance into the Drawer's existing Places faces (already
    the AB3-era interim home); `CreateProject.tsx`/`Drawers.tsx`'s stale
    "← Desk" back-links relabeled "← Home". `Desk.tsx` and `HomeFlow.tsx`
    both PARKED (unimported, not deleted, headed with a pointer to this
    entry). Every one of the 13 pre-existing harness fixtures' cold-boot
    helper updated (`.wz-desk`→`.wz-arrival`, `.wz-start-writing`→
    `.wz-arrival-write`, `wrizo-first-run-complete=1` seeded alongside
    every `localStorage.clear()` so old fixtures get an ordinary,
    non-gated Write — the FX1 review's own standing lesson, "never assume
    a fixture's default," applied fresh). One check, `s1.mjs`'s "the
    Desk's mirror surfaces the SCRIPT tag unprompted," PARKED as
    **DORMANT** (not superseded — no successor proves the same unprompted-
    glance truth, because Arrival deliberately shows none; the resume
    pointer itself still resolves correctly, just behind a click now) —
    whether an unprompted mirror belongs on Arrival is flagged for Fable/
    Nick, not resolved either way. New `apps/desktop/scripts/harness/hb1.mjs`
    (28 checks) + a small fix to the shared `runtime-verify.mjs` (its own
    `--selftest` and `freshSprint()` read `.wz-desk` too; a new `WS_ANON`
    env var already existed there, unused until now, driving the anon-path
    fixtures).
    **Independent review** (a separate subagent pass, adversarial, before
    any commit) found two real defects and fixed both: **(1, HIGH)** the
    veil covered DeskFrame's toolRail/sliver/top-row but NOT `ModeStage`'s
    own chrome — the reveal handle and, critically, the settings gear,
    which exposes a live Theme switch and the Typewriter toggle. A writer
    could open the gear mid-gate and pick a theme directly, or turn the
    forced typewriter off, bypassing both the accessibility invariant
    ("AT perceives exactly one path") and R2's actual premise (a theme
    *earned* by writing). Fixed by giving `ModeStage` the `firstRunGateActive`
    prop and veiling the handle + gear cluster; the empty-page F6 "invite a
    first line?" affordance (a second voice alongside the gate's own
    instruction) suppressed the same way. **(2, lower)** below 1100px no
    ceremony ever exists to flip `firstRunComplete`, so every Write from
    Arrival kept re-forcing forward-lock/typewriter back on — silently
    clobbering a sub-1100px writer's own later preference change, not just
    a one-time founding default. Fixed: `Arrival.tsx` flips the flag itself
    on a sub-1100px Write (via `useDeskFrameViewport()`), once, since no
    rite will ever complete there. Both fixes added their own `hb1.mjs`
    checks (25→28) — the review's own lesson embedded: a raw `.hb1-veil`
    count assertion had missed the gap, so a defense-in-depth check now
    walks every `button/a/[role=button]` on the gated page and asserts
    each sits inside an `[inert]` ancestor. One open call was left standing
    at build time — `UnlockCeremony` was `aria-modal="true"` without a real
    focus trap, so the editor behind it (deliberately left interactive,
    "the one path") stayed Tab-reachable while the ceremony was up — left
    for Fable rather than silently patched; **fixed in the hb1.1 fold,
    below.**
    **A concurrent-checkout collision, twice** (see item 26's own account
    of the first): the shared `writer-studio` checkout was switched to
    `main` mid-build by CD1's session, once during the original stash-vs-
    WIP discovery and once again mid-review. Both times a checkpoint
    commit (`2200302`, `3ea2e6e`) preserved every uncommitted edit before
    the switch — no data lost either time — but it happened twice in one
    day on this exact ticket pair, which is what triggered the new **ONE
    CHECKOUT PER AGENT** standing rule (this file, TOOLING STATUS, below).
    HB1 now builds at `../wrizo-hb1` on `hb1-threshold`, its own worktree;
    this entry's own verification (below) is the first full run from
    there, clean. Merged `main` (through the cd1.1 fold, `fccddcc`) into
    `hb1-threshold` mid-build — one real conflict, in `PageEditor.tsx`'s
    header row (both tickets touched it: cd1.1 restored the Pages/Plan
    toggle, HB1 added the veil wrapper) — resolved by wrapping cd1.1's
    toggle inside HB1's veil (it's chrome, it belongs gated too).
    **Verified, from the clean worktree, after the collision:** `tsc`
    (desktop + server) clean; `build:web` clean; `verify:runtime
    --selftest` PASS; the full 14-script suite green —
    `j4` 26, `j5` 40, `m1` 33, `s1` 86 (87 armed), `th1` 26, `th2` 43,
    `w1` 18, `w2` 31, `ab1` 37 (45 armed), `ab2` 42 (52 armed), `ab3` 34
    (41 armed), `fx1` 25 (32 armed), `cd1` 27 (27 armed, nothing new
    parked), `hb1` 28/28 — zero failures, both `HARNESS_PARKED` settings
    where applicable.
    **Two more genuine open calls, disclosed, not resolved by any agent:**
    (1) S5's brief text — "loose pages' `backTo '/'` exit: remove the
    room-change... not a navigation to `/`" — read here as satisfied by
    the Desk room's own retirement (there is no more literal "room" to
    navigate to; `/` is Arrival now, a legitimate permanent destination,
    not a special case), so `PageEditor.tsx`'s existing `backTo` logic for
    loose pages was left pointing at `/`, unchanged; a stricter reading
    (Done should never target `/` at all) was not built. (2) Account-
    creation timing, per the HomeFlow-retirement ruling above — reachable,
    not ritualized to a specific moment.
    **Fable's review landed — GREEN with a fold, hb1.1 — 2026-07-16**
    (`docs/wrizo-alpha/hb1-review-fable.md`, committed): verdict GREEN,
    merge on Nick's word after the fold. Verification method disclosed and
    checked, not trusted — the tail merge (`b8c3b72`) audited and confirmed
    docs-only, so the reviewed state is byte-for-byte the build's own
    verified tip. Five rulings of record: (1) the defense-in-depth harness
    pattern (walk the DOM for violators, never just count wrapper nodes)
    ratified as house precedent — "the gear bug is exactly what enumeration
    misses"; (2) the checkpoint-blob rescue commits accepted **this once**
    (the collision made them the right call in the moment) but slice-commits
    remain the law going forward — a future ticket arriving as preservation
    blobs gets returned for re-staging, not reviewed; (3) `.hb1-veil`
    existence ⇔ gate active recorded as a load-bearing selector contract,
    so a future refactor doesn't reintroduce a dormant veil node and
    silently break the harness's own meaning; **(4) mid-gate refresh
    dropping the veil (the gate's one-shot nav-state design means a reload
    mid-rite lands the writer on their page unveiled, rite incomplete, next
    Arrival re-gates on a fresh page) ruled a *mercy valve, kept* —
    "trapping a writer under blur is a worse failure than letting one slip
    the rite," deliberate not accidental, standing until Nick overrules it
    at the device sitting;** (5) Open's no-resume `/journal` fallback ruled
    a fine interim home, revisited when the Places-rail work lands (the
    origin chat's own seam, not re-ruled here).
    **hb1.1 folded and pushed — 2026-07-16**, commit `2a606d2`: **F-1**
    (code) — `UnlockCeremony` now moves focus to the first offered
    territory on mount and contains Tab within its two buttons while open
    (Shift+Tab from the first wraps to the last, Tab from the last wraps to
    the first), making the `aria-modal="true"` claim actually true; no
    Escape-dismiss, by design, noted in a comment — the rite resolves in a
    choice, not a cancel. `hb1.mjs` grew 28 → 31 checks (the mount-focus
    assertion plus both wrap directions). **F-2** (no code) — ruling 4's
    mercy valve recorded above, closed as *decided* rather than left
    pending. F-3 (HomeFlow/Desk parked-shim wording, the `backTo '/'`
    sweep entries, s1.mjs's DORMANT entries) is Fable's own spot-check at
    fold time, riding this delta — not this fold's to action.
    **Re-verified after the fold:** `tsc` (desktop + server) clean;
    `build:web` clean; the full 14-script suite green — `hb1` now 31/31,
    every other count unchanged from the pre-fold run above — zero
    failures.
    **Pushed to `origin/hb1-threshold`.** Per the brief's own DoD and the
    review's own sequencing: Fable's fold-delta spot-check (F-3 riding
    along) is next, then Nick's merge word, then the device sitting on
    `main`, then deploy on Nick's word — one merge, one sitting, one deploy
    decision, in that order. The stash left behind by the first collision
    (`cd1.1 erratum WIP...`) stays put per the review's own housekeeping
    note — forensic material for item 26's still-open close conditions, not
    this ticket's to drop.
    **Merged — 2026-07-17**, Nick's word ("let's merge it"), ahead of
    Fable's F-3 fold-delta spot-check (not yet landed on disk at merge
    time — Nick's merge word stands on its own per house law; F-3 still
    rides the delta whenever Fable next looks). Merged from the isolated
    `../wrizo-hb1` worktree (no shared checkout touched, per ONE CHECKOUT
    PER AGENT): `origin/main` was first merged into `hb1-threshold` to
    reconcile — one real conflict, both sessions having independently
    claimed **item 27** for their own ticket (this one and FX2, born from
    Nick's CD1 device sitting in the interim); resolved by chronology
    (this item's own item-27 commit landed 2026-07-16 17:24, FX2's
    2026-07-17 07:16 — FX2 renumbered to **item 28**, its self-reference
    and item 26's cross-reference both corrected, no content lost either
    side). Full suite re-verified green post-merge (`tsc` ×2, `build:web`
    byte-identical output, selftest, all 14 harness scripts, `hb1` 31/31)
    before `origin/main` was fast-forwarded to `hb1-threshold`'s tip
    (`df88ff5` → `8674f87`, confirmed ancestor-checked, no force needed).
    **Not deployed.** Per the review's own sequencing, the device sitting
    on `main` is next, then deploy on Nick's word. The other session's
    `writer-studio` checkout (on `main`) will read as behind `origin/main`
    until its own next fetch/pull — expected, not a conflict, since only
    the remote ref moved.
    **Fable's F-3 fold-delta spot-check landed — GREEN — 2026-07-17**
    (`docs/wrizo-alpha/hb1-review-fable-addendum.md`, committed; blob hash
    independently verified against the live file, `c6ddbd5`, matches). The
    late paper CC flagged missing at merge time — the spot-check ran
    in-session before Nick's merge word, this is the record catching up,
    not a skipped step. All four hb1.1 commits verified by SHA; the review
    doc's own blob confirmed unchanged. F-1's focus trap independently
    re-confirmed real (one harmless transient noted: both territory
    buttons disable during the chosen-flash, freeing Tab for ~500ms over
    an otherwise-inert page). F-2's ledger record confirmed complete. The
    merge itself re-verified: fast-forward `df88ff5 → 7e7d7f4` audited,
    the item-27 chronology resolution endorsed as-is.
    **Four findings, none required fixes — handed to the device sitting:**
    (1) the parked `HomeFlow` ("HOME port v6") is prior art of the rite
    itself, park quality called exemplary; two things it knew that HB1's
    rite doesn't are named as open, hb1.2-sized design questions for
    Nick's sitting — **the echo** (v6 showed the writer their own words
    back on reward; HB1's ceremony announces only the theme) and **the
    mercy** (v6 idle-nudged a stuck newcomer; HB1's gate stays silent by
    the "speaks once" ruling); (2) `s1.mjs`'s DORMANT park ruled A4
    discipline done right, and its own honest flag reframed as a live
    sitting question — **the glance** — should Arrival stay austere or
    offer a quiet unprompted trace of where the writer left off; (3) an
    **F5 correction against the brief's own claim**: the paste seam is
    likely already closed (the Voice Wall blocks foreign paste on script;
    the forward-only surface has carried a paste block since the v6 era)
    — one Ctrl+V at the gate during the sitting confirms, then the ledger
    takes a one-line correction at next docs touch, not presumed here;
    (4) `Desk.tsx`'s parked-shim prose accepted at census level only (not
    eyeballed line-by-line) — flagged for the next actual touch of that
    file, not actioned now.
    **Post-merge landscape, for orientation:** FX2 (item 28, born from
    Nick's CD1 sitting) merged into `main` after HB1 in the other session
    — `ee69bbc` → `25644ea` → `2b866c8`, `fx2.mjs` fixtures adapted to
    HB1's post-merge world (`.wz-desk`→`.wz-arrival`), one import-block
    conflict in `PageEditor.tsx` resolved kept-both. Full 15-script suite
    reconfirmed green from `../wrizo-hb1` after fast-forwarding to this
    state — `hb1` 31/31, `fx2` 33/33, every other count unchanged. FX2's
    own post-merge review belongs to the origin chat's Fable by lineage,
    not annexed here. **The device sitting now happens on a main carrying
    both tickets** — Nick's two FX2 findings can be felt in the same
    sitting as HB1's, verdicts routed to their own tracks. Sitting list:
    the original review's felt checks, plus the echo, the mercy, the
    glance, the Ctrl+V, and one poke at any in-app "Done" that still
    targets `/`.
    **Retroactive finding — HB1 shipped to production already, 2026-07-17
    — corrects the "Not deployed" claim above.** The FX2 deploy (item 28,
    `railway up` on `main` @ `740b572`, deployment `66837d33`, Nick's
    word "Go ahead and deploy") shipped a SHA that has `7e7d7f4` (HB1's
    own merge commit) as an ancestor — confirmed by `git merge-base
    --is-ancestor`, not assumed. That deploy's own ledger entry says so
    explicitly in hindsight ("Item 27 (HB1) is untouched by this review —
    stays with its own session's Fable") but named only FX2/CD1 in the
    deploy word itself; HB1 rode along unnamed. **Net effect: the
    Threshold — a first-screen surface, the boot experience for every
    device — has been live since 2026-07-17, with NEITHER its own device
    sitting NOR an explicit per-ticket deploy clearance ever given.** No
    rollback taken; the code is the reviewed, fold-verified, F-3-spot-
    checked tip, not unvetted work — this is a process-record gap, not a
    known defect in front of writers. Flagged plainly so Nick's felt
    checks (the sitting list above) happen against what's ACTUALLY live,
    not a staging assumption. This is the exact failure mode the
    deploy-manifest rule below now exists to close.
    **Deploy-manifest rule — ratified 2026-07-17 (Fable), citing this
    exact incident as the trigger, standing across all tracks.** A
    deploy ships a SHA, not a ticket. Before any `railway up`, the
    deploying session enumerates every merged-but-undeployed ticket
    contained in the target SHA and names them ALL in the deploy
    request; Nick's deploy word is valid only against that enumeration.
    If any named ticket lacks its own deploy clearance, the deploy waits
    — or ships from the last cleared SHA instead. (Recorded in full,
    TOOLING STATUS, below.)
    **Standing: the stash held for CD1.** The `cd1.1 erratum WIP` stash
    stays held per the review's own instruction, until CD1's own
    origin-chat close conditions clear — unrelated to the deploy finding
    above.
    **Dropped — 2026-07-18** (TU1's own S0 instruction): its hold
    condition (item 26's close) cleared 2026-07-17; content was long
    since superseded by the actual cd1.1 fold, merged and deployed.
    `git stash drop`, confirmed empty stash list after.
    **Carry for the HB1 session — Fable, via FX3's review, 2026-07-17
    (relayed here; no direct channel to that chat exists, this ledger
    IS the relay).** Root-causing FX3's own `hb1.mjs` PARKED-check
    flake (this item's harness, item 29's own investigation) surfaced
    a real product-level finding, not just a test artifact: the
    first-run veil's mount RACES the app's own first paint on Arrival
    after a hard reload — confirmed via direct diagnostic that the
    gate's arming state (`location.state.firstRunGate`, Write's
    disabled state) reads correctly in EVERY case, pass or fail, yet
    the veil itself sometimes doesn't mount in time regardless. The
    harness fix (an explicit settle wait before clicking Write) is
    correct FOR THE TEST — it makes the check reliably observe the
    eventual, correct state — but it does NOT touch the underlying
    race. On a real first-run writer's actual device, the same race
    means a genuine flash risk: a brief instant where the gate's own
    chrome (gear, drawer, sliver, reveal handle) may render unveiled
    before the gate catches up. This belongs to HB1's own ticket/owner
    to investigate and fix at the product level — not actioned here,
    not in FX3's or CD2's scope.
    **HB1-track Fable's response to the carry — 2026-07-18.** The
    first-mount race finding is acknowledged and accepted. An earlier
    "human-unreachable" read of this same race (this session's own —
    never landed on disk, chat-only, so nothing to link back to) is
    **withdrawn**; the origin Fable's product-level ruling directly
    above **stands** as the record. **hb1.2** (the fix ticket) is
    briefed only after Nick's device sitting — the hammer-test result
    (rapid reload-and-Write, by hand) feeds its severity; not presumed
    or pre-scoped here. **Constraint on the eventual fix, recorded now
    so the brief doesn't re-derive it:** the gate's mount must become
    deterministic and fail-closed — a race resolves to STILL VEILED,
    never to accidentally-unveiled chrome — while preserving ruling 4's
    refresh mercy valve (a mid-gate reload still drops the veil and
    re-gates on the next Write; fail-closed governs the fresh-mount race
    window, not the deliberate refresh escape). **One unconfirmed lead
    for whoever briefs hb1.2** (CC's own hypothesis, not a finding):
    `FirstRunVeil` (`components/FirstRunGate.tsx`) applies the DOM
    `inert` attribute inside a `useEffect`, which runs after first
    paint — a `useLayoutEffect`, or setting `inert` synchronously off a
    ref callback instead of an effect, would close exactly that gap.
    Unverified; worth checking first, not assumed correct.
28. ~~**FX2 — the Second Sitting.**~~ **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-16.** Two findings from Nick's device-look sitting with the
    composed desk (item 26): (1) on his laptop, the sliver's grip
    overlaps the writing surface — new law: persistent chrome never
    enters the text measure, at any viewport (the grip clamps to ride
    the paper's border/padding on narrow screens rather than crossing
    into the text column; cd1.mjs's own geometry asserts never tested
    a laptop width, only ~1400px/2200px); (2) Draft should open with
    the typewriter active unless the page already holds 10+
    line-equivalents (reading posture vs. forward-flow posture),
    explicit toggle always wins for the rest of the session, Free
    Write unchanged. Build brief:
    `docs/wrizo-alpha/fx2-second-sitting-brief.md`, S1-S3, authorized
    to build immediately on `fx2-second-sitting` off `main`.
    Zero-schema — merge pre-authorized per the standing rule; Fable
    reviews post-merge, gating close and redeploy. New
    `apps/desktop/scripts/harness/fx2.mjs` required (S3): grip/text
    disjointness at 1280px AND 2200px, sliver open/closed; the Draft
    threshold both sides plus explicit-toggle persistence; full suite
    green both `HARNESS_PARKED` settings.
    **BUILT — 2026-07-17, not merged/not pushed.** Built S1-S3 on
    `fx2-second-sitting` off `main` @ `df88ff5`, in an isolated worktree
    per the standing ONE CHECKOUT PER AGENT rule. **S1 — empirically
    diagnosed first (headless CDP, 1100-2200px), per the brief's own
    "verify before fixing" instruction, and the ACTUAL bug turned out
    narrower than the brief's working hypothesis:** the grip itself was
    already always exactly flush with the paper (its right edge rides
    the anchor's own right edge, which cancels out to the paper's left
    edge by construction, at every width — confirmed to sub-pixel
    rounding only, never a real breach). The real, measured defect: the
    sliver anchor's flat, unconditional 200px width had no floor on
    actual available margin — at DeskFrame's own 1100px gate its LEFT
    edge landed ~77px INSIDE the Drawer track (and since `.wz-sliver`
    carries no `pointer-events:none`, that invisible overlap silently ate
    hit-testing meant for the Drawer's own pull tabs; the OPEN panel's
    opaque background visibly painted over part of the Drawer too) —
    "chrome overlapping chrome," not the grip touching a word. Fixed by
    clamping the anchor's WIDTH (right edge stays pinned to the paper) to
    the actual Drawer-to-paper margin, expressible in pure CSS (no JS
    measurement, per CD1's own precedent) since the Drawer's own width
    cancels out of that distance, leaving only the grid's column-gap
    (promoted to a `--frame-gap` token so it can't drift from
    `.desk-frame-grid`'s own value); below that margin the anchor may dip
    into the paper's own left padding (`.mode-page`'s 38px) rather than
    the text, hard-capped at that depth so "never covers text" is a
    provable guarantee, not a target a font metric could blow through.
    Verified at 1100/1150/1200/1250/1280/1400/2200px: Drawer overlap zero
    at every width (was ~77px/53px/30px/6px at the four narrowest below
    ~1265px); wide screens byte-identical to pre-fix geometry, so none of
    `cd1.mjs`'s own checks needed parking (re-run, still 27/27, file
    untouched). **S2** — `store/writingSettings.ts` gains
    `seedTypewriterDefault`/`setTypewriterExplicit` plus a module-level,
    in-memory-only `explicitlySetThisSession` flag (never persisted — a
    fresh app load is a fresh session); `PageEditor.tsx`/`ScriptEditor.tsx`
    each seed once in a mount-scoped effect (empty deps; both hosts
    already remount per page via `key={id}`, so mid-session mode switches
    within one mount can't re-fire it); `Sliver.tsx`'s and
    `ModeStage.tsx`'s own hand-click toggles now route through
    `setTypewriterExplicit` so neither can be silently overridden by a
    later Draft-open seed. `store/writingSettings.ts`'s own stale
    "never in Draft" comment (flagged in the brief) corrected in place,
    no behavior change. New `apps/desktop/scripts/harness/fx2.mjs`, 24
    checks (S1 disjointness/persistence/opacity/paper-invariance at
    1280px+2200px closed+open; S2 both threshold sides, the explicit
    round trip, Free Write unchanged). `tsc` + `build:web` + selftest +
    the full 14-script suite (`ab1`/`ab2`/`ab3`/`cd1`/`fx1`/`fx2`/`j4`/
    `j5`/`m1`/`s1`/`th1`/`th2`/`w1`/`w2`) green under BOTH default and
    `HARNESS_PARKED=1`, re-run a second time on the fully committed tree
    before reporting (`th2.mjs` hit its documented transient flake once
    across the whole verification pass — 2/43 on an early run — cleared
    on immediate re-runs with zero code changes, consistent with its
    known history, and was fully green on both final passes). Visual
    eyeball check done via a new `app.screenshot()` harness helper
    (raw CDP, not used by any committed check) at 1280px/2200px,
    closed/open — geometry confirmed sane by direct look, not rects
    alone. Three commits on `fx2-second-sitting`
    (`86edfe7`/`655576a`/`a70ab13`), **not merged, not pushed** — the
    branch sits in an isolated worktree, ready for review. Awaits
    Fable's/Nick's word on the merge per the brief's own zero-schema
    pre-authorization.
    **Independent review — 2026-07-17, in a separate worktree, own
    checkout.** **S1's revised diagnosis holds up empirically, not just
    on read-through:** re-measured directly (rect reads, not the
    harness's own new `screenshot()` alone) at 1100/1150/1200/1250/1280/
    1400/2200px, sliver both states — then the pre-fix CSS was swapped
    back in on disk, rebuilt, and re-measured at the SAME widths for a
    real before/after diff (not trusted from the commit's own comments).
    Confirmed both halves: the grip's right edge tracks the paper's own
    left edge to sub-pixel rounding in BOTH the old and new code at
    every width 1100-2200px — it was never the problem, in either
    version. The Drawer overlap was real and is now gone: independently
    measured ~75.7/52.2/28.7/5.2px at 1100/1150/1200/1250px pre-fix
    (matching the build's own ~77/53/30/6px within fixture noise),
    ~0-1px post-fix at the same widths. **One flag, not resolved:** at
    1280px specifically — the brief's own "laptop" checkpoint — pre-fix
    and post-fix geometry are BYTE-IDENTICAL; the clamp is a total no-op
    there (`--sliver-margin` already clears the 200px cap on its own).
    The Drawer overlap this ticket fixes only ever existed below
    ~1265px. That means the fix is real and the text-safety law holds
    everywhere tested, but whether "1280px" is actually representative
    of Nick's own laptop viewport — as opposed to something narrower,
    which is where the original bug lived — is unconfirmed by anything
    in this ticket. Not a defect; a question only Nick's own window
    width (or Fable re-asking him) can settle.
    **S2: one real bypass found and fixed.** Grepped every
    `setWritingSettings({...typewriter...})` call site in
    `apps/desktop/src` (not just the two the build's own report named).
    `JournalEntry.tsx:885` — the unframed Journal entry's own typewriter
    toggle (`authored && !framed` only; the sliver takes over once
    framed) — still called the bare setter, never arming
    `explicitlySetThisSession`. Since that flag is module-scoped (one
    bundle, shared with every Draft-open seed), a writer's explicit
    choice made on THAT route could be silently overwritten by a later
    Draft-page seed elsewhere in the same session — exactly the bypass
    S2's own rule forbids. Fixed in `de60636`: routed through
    `setTypewriterExplicit`, matching Sliver.tsx/ModeStage.tsx's own two
    sites.
    **The dropped "second page" S2 check: the build's own reasoning
    checks out, but there was a way around it.** Read
    `store/persistence.ts`: `cache.journalEntries` hydrates once, at
    module load — confirms a raw localStorage write made after the
    app's first boot really is invisible to it, as the report claimed.
    But seeding BOTH fixture pages in the SAME pre-boot write sidesteps
    that entirely; navigating between them afterward is a bare hash
    change, no second reload needed. Implemented as `freshTwoDraftPages`
    in `2ab78e1` — 5 new checks proving `explicitlySetThisSession`
    survives a genuine page/mount boundary, not just the same-page mode
    switch the original suite covered, which is the specific claim
    `writingSettings.ts`'s own comment makes for why the flag is
    module-scoped rather than a page-level ref (previously asserted,
    never actually tested).
    **A second harness gap, found independently (not something the
    build's report flagged):** the committed S1 loop only runs at the
    brief's own two named widths (1280/2200) — per the flag above, ONLY
    widths where the width-clamp fix is a byte-identical no-op. A
    regression of the clamp mechanism itself would pass that loop
    silently. Added a `DESKFRAME_MIN_WIDTH` (1100px) regression block in
    `2ab78e1`: anchor-vs-Drawer disjointness (the actual mechanism)
    closed+open, plus grip-vs-text-column at the floor width. That last
    one needed a new `textColumnOf` helper — `.mode-pagecol`/`.mode-page`
    share one border box (padding included), which the ORIGINAL 1280px/
    2200px checks quietly treat as "the text column" (harmless there,
    since the padding-dip never engages at those widths) but is the
    wrong rect at 1100px, where the anchor legitimately dips into the
    padding gutter by design (the brief's own allowance). `textColumnOf`
    reads the paper's own live computed left padding instead of
    asserting against the padding-inclusive box; first written without
    it, the new 1100px checks failed against fully-compliant geometry,
    caught and fixed before commit. `fx2.mjs`: 24 -> 33 checks.
    **`--frame-gap` and `app.screenshot()`, judged:** both reasonable,
    not scope creep. `--frame-gap` is load-bearing for the fix's own
    correctness (the clamp math needs the SAME column-gap value
    `.desk-frame-grid` uses; a hand-synced literal risks silent drift
    the way the brief itself warns against elsewhere) and changes no
    existing value. `app.screenshot()` is additive-only, explicitly
    disclaimed as unused by any committed check, and is exactly the kind
    of low-risk harness capability this review's own S1 empirical
    approach leans on.
    **Full bar re-run independently, from a clean worktree, dependencies
    installed fresh:** `tsc --noEmit`, `build:web`, `--selftest`, and the
    full 14-script suite all green under both `HARNESS_PARKED` settings
    on the fully committed tree (`ab1` 37/45, `ab2` 42/52, `ab3` 34/41,
    `cd1` 27/27 — file untouched, confirmed via `git diff`, zero lines —
    `fx1` 25/32, `fx2` 33/33, `j4` 26, `j5` 40, `m1` 33, `s1` 87, `th1`
    26, `th2` 43, `w1` 18, `w2` 31). `th2.mjs` hit its documented
    transient flake once (2/43) on the default-mode pass, cleared on two
    immediate re-runs with zero code changes — consistent with its known
    history, not a regression. Two commits added on top of the build's
    own three (`de60636`, `2ab78e1`) — history not rewritten. **Still
    NOT merged, NOT pushed** — awaits the orchestrating session's own
    final check before merge, per this ticket's instructions.
    **MERGED, PUSHED — 2026-07-17.** `origin/main` had moved since this
    branch's base (`df88ff5`) — HB1 (item 27) merged in the interim, in
    its own isolated worktree, per the standing rule. Local `main`
    fast-forwarded to `origin/main` first (`df88ff5` -> `7e7d7f4`), then
    `fx2-second-sitting` merged in: one real conflict, `PageEditor.tsx`'s
    import block (both branches appended new imports after the same
    shared line — the exact collision the independent review's own
    `git merge-tree` dry run had already predicted), resolved by keeping
    both. `fx2.mjs` itself needed a post-merge fixture fix neither build
    nor review could have caught (their branch predates HB1's merge):
    `freshDesk`/`freshLoosePage`/`freshDraftPage`/`freshTwoDraftPages`
    still bootstrapped against the retired `.wz-desk`/`.wz-start-writing`
    — the same class of fix `cd1.mjs`/`th2.mjs` already got when HB1
    first landed (`.wz-arrival`, `wrizo-first-run-complete` seeded so
    HB1's first-run gate doesn't interfere with FX2's own fixtures).
    Fixed in `25644ea`, re-verified 33/33. One false alarm chased down
    and closed, not left as a loose thread: `s1.mjs` read 86 checks
    default / 87 armed post-merge, against this ledger's own earlier
    "s1 87" (flat, no split) baseline recorded elsewhere. Isolated via a
    throwaway worktree at `7e7d7f4` (HB1-merged, pre-FX2) — already
    86/87 there, `s1.mjs` itself byte-identical to its pre-HB1 content —
    then confirmed the file has always carried its own one-check PARKED
    section (`grep HARNESS_PARKED apps/desktop/scripts/harness/s1.mjs`),
    matching every other split-count file's pattern exactly. Not a
    regression from HB1 or FX2; the earlier flat "87" was simply
    imprecise. Full suite green on the fully merged, pushed tree: `tsc`,
    `build:web`, selftest, all 15 harness files (`ab1` 37/45, `ab2`
    42/52, `ab3` 34/41, `cd1` 27/27, `fx1` 25/32, `fx2` 33/33, `hb1`
    31/31, `j4` 26, `j5` 40, `m1` 33, `s1` 86/87, `th1` 26, `th2` 43,
    `w1` 18, `w2` 31) under both `HARNESS_PARKED` settings. Pushed to
    `origin/main` @ `25644ea`. **Not deployed** — redeploy is Nick's
    call, and Fable's own post-merge review (gating close) hasn't landed
    yet; the S1 1280px-vs-Nick's-actual-laptop-width question the
    independent review flagged is still open and unresolved by anything
    in this ticket.
    **Fable's review: GREEN at record depth — 2026-07-17.** Read the
    ledger's own account whole, verified the merge tip (`2b866c8`),
    cited the suite facts recorded above — did NOT read S1's clamp or
    S2's seeding line-by-line against the actual diff, disclosed as
    such rather than implied as a full code review. Close conditions
    (three, not yet all met): this review (now landed); Nick's laptop
    check post-deploy, specifically resolving S1's own open question —
    did the observed grip/Drawer overlap actually resolve on his
    machine, and is his laptop's width above or below the ~1265px
    threshold where the fix's clamp actually engages (at 1280px it's a
    provable no-op, per the independent review); and his word. Item 26
    stays open in parallel — his remaining sitting verdicts (the glow,
    the journal-paper question, the drawer at rest, the wide field) are
    served by this SAME laptop session, not a separate one. Item 27
    (HB1) is untouched by this review — stays with its own session's
    Fable.
    **Deployed — 2026-07-17**, Nick's word ("Go ahead and deploy"):
    `railway up` on `main` @ `740b572` (deployment `66837d33`, SUCCESS).
    Confirmed live: `200` on `/healthz` and `/`, `401` on `/auth/me`.
    Two of three close conditions now met (the review, and this
    deploy) — the third, Nick's laptop check resolving S1's own open
    question (did the grip/Drawer overlap actually resolve, and is his
    width above or below the ~1265px clamp threshold), remains, on his
    own clock. Item 26 stays open in parallel, served by the same
    session.
    **CLOSED — 2026-07-17, Nick's word.** The grip fix confirmed
    working on his laptop — the ~1265px width question is moot (the
    fix works regardless of which side of that threshold his own
    laptop sits on).
29. **FX3 — the Proportions.** **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-17.** From Nick's desktop sitting (the same sitting behind
    the Cascade committee pass, item 30) — including a verdict he
    wrote directly into the test page itself (S3: the typewriter start
    reads too far down, broken to a fresh eye). Six slices: S1 the
    paper fills down to near the stage's bottom on desktop (no fixed
    aspect, no height cap short of the stage); S2 the paper SCALES on
    wide screens (type + paper dimensions grow together so the measure
    — readable line length — is preserved, not widened; a tuned CSS
    scale token, 1.0 at <=1440px ramping to ~1.2 at >=1920px); S3 the
    typewriter start offset lowers (~30-35% of stage height, from 45%)
    and the scroll/fade engages within the first few lines rather than
    lagging (Journal's own start-offset carve-out unchanged); S4 the
    top bar's modes go right-aligned as a TRIAL (one-line revert if
    Nick's eye rejects it — a working-value experiment, not law); S5
    the settings gear leaves the paper entirely — the sliver's foot
    gains an icon row (typewriter as icon-only, the gear, and a NEW
    instruments icon opening a minimal progress/glow panel); S6 new
    `apps/desktop/scripts/harness/fx3.mjs`, geometry checks at both
    reference widths (standing law). Build brief:
    `docs/wrizo-alpha/fx3-proportions-brief.md`, authorized to build
    immediately on `fx3-proportions` off `main`. Zero-schema — merge
    pre-authorized per the standing rule; Fable reviews post-merge,
    gating close and redeploy. Non-goals (explicit): the Cascade (item
    30, awaits Nick's ratification), the Wall/AB4 (re-scoped by the
    Cascade pass, not this ticket), any measure widening, canon edits.
    **MERGED, PUSHED — 2026-07-17.** Built S1-S6 on `fx3-proportions`
    off `main`, in an isolated worktree. **S1** — the paper's height
    chain was purely intrinsic (no definite height anywhere from
    `#root` to `.mode-page`), so a naive `height:100%` silently no-ops;
    fixed by giving `.desk-frame-stagecol` ONE definite height
    (`calc(100vh - var(--fx3-chrome-budget))`, a hand-measured 167px
    constant — same idiom as `CANONICAL_MEASURE_CH`, empirically
    verified to hold with zero drift at BOTH 1280px and 2200px, fence
    a clean 40px at both, no scrollbar) with everything below riding
    ordinary flex-grow off that one anchor. Also caught and fixed: the
    goal glow's pre-existing CSS now bled past the viewport at some
    heights (a taller stage stretches its anchor proportionally),
    fixed with `overflow:hidden` on `.desk-frame-host` — independently
    verified this clips no `position:fixed` element anywhere in the
    route (none of `.desk-frame-host`/its ancestors establish a new
    containing block). **S2** — new `--paper-scale` token (stepped
    1.0/1.1/1.2 at 1440/1680/1920px — CSS `calc()` can't derive a
    dimensionless ratio from a viewport length without a JS-computed
    property, so stepped rather than continuous) applied to BOTH the
    paper's width AND its own font-size at the SAME element, so `ch`
    (which resolves against whichever element declares it) scales in
    lockstep — independently re-derived algebraically (not just
    visually eyeballed) that characters-per-line is provably
    scale-invariant, `CANONICAL_MEASURE_CH` untouched. Also fixed a
    real bug this surfaced: the sliver/goal-glow anchors' own
    `min(380px,30ch)`-style formulas didn't scale, a 61.5px
    misalignment at 2200px, fixed by pinning the same scaled font-size
    baseline there too. **S3** — `START_FRACTION`: 0.45 -> 0.29 in
    `useTypewriterFade.ts` (below the brief's literal 30-35% text, but
    independently hand-calculated — not just trusted — to land at
    ≈33.3% once `.mode-page`'s own padding/border are counted the same
    way `fx1.mjs`'s own pre-existing measurement method does; the
    *visual* result matches the brief's intent even though the raw
    constant reads lower). Also fixed a genuine PRE-EXISTING bug found
    along the way: `setScrolled()`'s container-mode branch compared an
    internal scroll offset against a viewport-space Y coordinate — a
    real unit mismatch, independently confirmed correct. **S4** — top
    bar right-aligned as a trial, scoped to `.desk-frame-host
    .sprint-nav`; independent review found a real, undisclosed gap:
    `JournalEntry.tsx`/`BoardEditor.tsx` carry pre-existing inline
    `justifyContent:'space-between'` styles that silently beat the new
    CSS rule (inline always wins). Investigated further: BoardEditor's
    row has no ModeStrip at all — S4 doesn't conceptually apply there,
    not a real gap. JournalEntry's row does carry one and does diverge
    — left AS-IS and flagged rather than force-matched, consistent
    with this project's own prior ruling that JournalEntry's top-right
    cluster is a deliberately distinct idiom from PageEditor/
    ScriptEditor's (CD1's own review, item 26). **S5** — gear travels
    WHOLE into the sliver's foot (settings + theme panel stay bundled,
    a documented judgment call — the brief names only three foot
    icons and never a fourth destination for Theme); icon-only
    typewriter toggle confirmed via direct render read (one button,
    SVG only, no text node); new `store/writingGoalUnit.ts` confirmed
    honestly self-documented as display-only, no real per-unit
    conversion yet (deferred to the Cascade's own instruments-panel
    refinement, item 30). **S6** — new `fx3.mjs` (30 checks). **The
    park sweep grew beyond the brief's own cd1/fx2 guess** — real
    supersessions turned up in `ab1.mjs`/`ab2.mjs`/`fx1.mjs`/`hb1.mjs`
    too (`fx2.mjs` needed only plain selector updates, no park;
    `cd1.mjs` needed zero changes, confirmed byte-identical). Every
    parked check independently audited against this project's own
    A4/FX1-Ruling-5 precedent (quoted verbatim, genuinely superseded,
    live successor exists, the check's own name discloses the touch)
    — all correct, including `ab2.mjs`'s novel "layered park" (a park
    entry parking an already-parked entry a second time) and `hb1.mjs`
    getting its first-ever PARKED scaffold.
    **A real, reproducible defect found and fixed post-review:**
    `hb1.mjs`'s new PARKED veil-count check (S5's own successor to
    HB1's S3 wrapper-count check) flaked ~40-50% (confirmed via 5
    direct runs after an independent reviewer surfaced it, having
    first been told — wrongly — it was "deterministic"). Root-caused
    via direct diagnostic instrumentation: the app's own gate-arming
    state (`location.state.firstRunGate`, the Write door's disabled
    state) read CORRECTLY in every single run, pass or fail — the
    veil itself sometimes just never mounted on Arrival's very FIRST
    paint after a hard reload, a genuine first-mount timing
    sensitivity, not a fixture logic bug. This file's own LIVE S3
    check never showed it (4/4 clean) purely because its fixture
    detours through Open->back before Write, and that unrelated
    navigation's own async settling happened to absorb the same
    window by accident. Fixed with an explicit settle wait in
    `freshArrival` itself (protects every section using it
    deterministically, not by borrowing an unrelated detour's luck) —
    19/19 clean after the fix, across two separate machines/worktrees.
    Also directly measured and closed out (not merely trusted) the
    reviewer's own flagged-but-unfinished concern that a
    `@media(min-width:1700px)` top-bar font bump might drift
    `--fx3-chrome-budget`'s hand-measured 63px component at 2200px:
    empirically zero drift, nav height exactly 63px at both 1280px and
    2200px, fence exactly 40px at both, no scrollbar either width —
    the theoretical concern doesn't materialize in practice.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 16 harness files (`ab1` 35/45, `ab2`
    42/53, `ab3` 34/41, `cd1` 27/27, `fx1` 23/32, `fx2` 33/33, `fx3`
    30/30, `hb1` 31/32, `j4` 26, `j5` 40, `m1` 33, `s1` 86/87, `th1`
    26, `th2` 43, `w1` 18, `w2` 31) under both `HARNESS_PARKED`
    settings. `cd1.mjs` hit one isolated "CDP page target never
    appeared" crash during the review's own run, cleared on immediate
    retry, byte-identical to `main` — an infra flake, not a code
    regression (same class as the documented `th2.mjs`/`m1.mjs`
    flakes). Pushed to `origin/main` @ `f87295e`.
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always.
    **Fable's review: GREEN at census + record depth — 2026-07-17.**
    Merge `f87295e` census-verified (16 harness files as named, zero
    schema surface). **Ruling on S4:** the JournalEntry divergence
    (its top bar doesn't pick up the right-alignment trial, left as-is
    per prior precedent) is tolerable AS A TRIAL ONLY — if Nick
    ratifies right-alignment as permanent law rather than a working
    trial, it unifies across all hosts at that point, JournalEntry
    included. Not an action item now; a condition on any future
    ratification. Nick's own FX3 device-look sitting (the laptop-width
    question from item 28's own S1, plus a fresh look at S1-S5 here)
    can ride the same sitting as CD2's (item 30) or come sooner — his
    call, not scheduled by anything in this ticket.
    **Deployed — 2026-07-18**, Nick's word ("Deploy," naming FX3+CD2+
    cd2.1 together, "the whole new desk in one deploy"). Deploy-
    manifest rule (TOOLING STATUS) satisfied: enumerated every commit
    since the last deploy (`740b572` → `HEAD`) — resolves to exactly
    FX3 and CD2 (HB1 was already live, an ancestor of `740b572`
    itself; cd2.1 is docs-only, no separate deployable surface); no
    unnamed rider this time. `railway up` on `main` @ `6692c00`
    (deployment `1fa52774`, SUCCESS), confirmed live: `200` on
    `/healthz` and `/`, `401` on `/auth/me`.
30. **The Cascade — committee double-pass.** **PROPOSED — 2026-07-17.**
    Commissioned by Nick from the desktop sitting: the left drawer
    becomes a pop-out cascade from a persistent vertical strip —
    categories each opening a reach panel (layer 2), with a third
    pop-out survey layer (layer 3) for browsing contents as large
    thumbnails. Committee record: `docs/wrizo-alpha/cascade-committee-
    pass.md`. **Architects' review: sound — completes the canon's
    attention ladder.** The strip is glance; the category panel is
    reach (drawer-pull semantics carried forward whole); the survey
    layer names a range the canon never had (seeing a container's
    contents without traveling into it). Mechanics: layers 2-3 overlay
    only (paper never reflows, standing law), dissolve on keystroke via
    the one vanishing engine, the strip persists like the grip. **The
    pass's biggest call:** the reserved right track was AB4's (the
    Wall) — the cascade (as first proposed, right-sided) would own that
    edge, and Nick's own Plan example (cards as large thumbnails beside
    a focused page) IS the Wall's browsing posture; recommended AB4
    formally re-scope onto the cascade. Two-pass complete with trims
    (image-only thumbnails per Brand over Growth's richer ask; no
    pinned rows, no per-category settings, no strip customization this
    ticket, breadcrumbs rejected).
    **Correction, Nick's word, 2026-07-17: the cascade lives on the
    LEFT, not the right** (`cascade-committee-pass.md` carries the
    correction note; every "right" reading in the pass's own text is
    superseded, its underlying reasoning otherwise unchanged). With the
    cascade back on the left, the Wall/AB4 re-scoping question stood
    independent of "who owns the right edge" — ruled on its own merits
    (T2, below).
    **Nick's ratifications, 2026-07-17 — T1-T4 all resolved, CD2
    AUTHORIZED TO BUILD:** T1 — **A8-A11 RATIFIED**, A8 corrected to
    "persistent **left** strip" (blockquote note beside A8, original
    text preserved); **A11's roster is Nick's own re-sectioning**, not
    the pass's flat list — four sections: **A** Journal, **B** Page ·
    Plan, **C** Drawers · Shelf, **D** (strip's foot) Settings
    (site-wide) · Change Theme — D is new, not in the pass's original
    proposal. T2 — **the Wall folds onto the cascade, RULED YES**; AB4
    formally re-scopes (survey layer = how boards/walls are browsed;
    pinning/threads build ON this system as the next arc ticket; the
    reserved corkboard track retires from the plan). T3 — **Journal
    first** (per A11's own roster above, not the pass's original
    Page-first draft). T4 — **Delete is Delete, RULED AGAINST the
    pass's own lean**: disclosure + one plain confirm, NO
    "Move to Shelf instead" soft-path offer (the confirm alone is the
    data-safety floor) — overrides the pass's PASS TWO recommendation.
    **Plus one addition beyond the pass's own four tensions: THE DOCK**
    — a deliberate-keep affordance for the survey layer (close/reopen
    slide, ~180ms, reduced-motion honored), with its own vanishing-law
    rider (a docked survey survives keystrokes; undocked layers still
    dissolve as before) and a small-screen rule (transient layers may
    overlay the paper rather than reflow it at laptop widths; a docked
    survey compresses to a 120px floor instead of occluding the
    measure, or the dock affordance is simply unavailable below it).
    **Build brief:** `docs/wrizo-alpha/cd2-cascade-brief.md`, S0-S6,
    authorized to build on `cd2-cascade` off `main` — **after FX3
    (item 29) merges**, not concurrently (one checkout per agent; no
    mid-flight collision surface). Zero-schema — merge pre-authorized
    per the standing rule; Fable reviews post-merge, gating close and
    redeploy. S0 requires the canon touch (A8-A11 + the ratification
    record, A11's roster verbatim as sectioned) as part of the build
    itself, not done here. New `apps/desktop/scripts/harness/cd2.mjs`
    required (S6), plus the largest park sweep since CD1's own S9 — the
    left drawer's retirement falsifies `cd1.mjs`'s drawer-track
    geometry and face checks (and likely others); every falsified check
    parks per A4, enumerated in the fold's own commit message.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S6 on `cd2-cascade` off
    `main`, in an isolated worktree, after FX3 (item 29) had already
    merged. **Architecture:** `DeskFrame.tsx`'s `toolRail` prop retires
    entirely, replaced by two: `strip` (a grid track, `.desk-frame-
    strip`, deliberately carrying NO `chrome-fade`/`desk-dissolve`
    classes — S1's "never dissolving" law enforced structurally, not
    just behaviorally) and `cascadeLayers` (a stage overlay, mirroring
    the sliver's own anchor pattern but growing rightward from the
    strip instead of leftward from the paper — same structural
    immunity proof). Both come from one new hook, `useCascade()` in
    `components/Cascade.tsx`. Layers 2-3 dissolve via an explicit
    keydown listener (generalizing AB3's own pre-existing Drawer
    keystroke-reset pattern), not the ambient fade engine — deliberate,
    since the strip must never fade and there's no shared "this family
    fades" class to lean on. **The dock:** a fixed 180ms collapse
    (mounted throughout, never unmounting, so rapid dock/undock can't
    race); layer 3 slides into layer 2's slot via ordinary flex reflow;
    a docked survey clamps to a 120px floor. A real bug the build found
    in its OWN code and fixed: Chromium does not resolve `calc()`/
    `min()` inside a CSS custom property via `getComputedStyle()` — it
    returns the literal formula string, silently `NaN`-ing the dock-
    floor law; fixed by measuring real DOM rects instead of trusting
    the custom property.
    **S1-S5:** the strip (84px, `--strip-width`, replacing the 200px
    `--drawer-width`, feeding the freed width to FX3's scaled paper),
    A11's 4-section/7-category roster verbatim, all 7 category panels
    (Page reuses `PageFace` whole; Drawers lists drawer *entities*, not
    a flat page list — richer than the retired PlaceFace; Settings is
    genuinely site-wide via a new `logoutRequest.ts` pub-sub reaching
    App.tsx's real `handleLogout`, distinct by law from the sliver-foot
    gear), the survey layer, Delete as Nick actually ruled it (one
    plain confirm, no Shelf-instead offer — overriding the committee
    pass's own softer lean). `Drawer.tsx` and `PlaceFace.tsx` deleted
    outright.
    **Independent review — verified the hard claims directly, not by
    re-reading the build's own report.** Paper-rect invariance and
    strip-never-dissolve confirmed via direct harness execution.
    **All four dock state transitions tested directly** (the build's
    own harness only covered two — keystroke-survives and close/
    reopen; the review wrote and ran independent scripts for the other
    two, Escape-dismisses-docked and category-switch-dismisses-docked
    — both correct). The calc()/getComputedStyle claim independently
    reproduced with a generic, app-unrelated test case — confirmed
    general Chromium behavior, not a build assumption. Delete
    independently traced to match Nick's actual ruling, not the pass's
    original lean. Full 17-file suite reconfirmed from a clean install
    with zero count discrepancies and zero flakes (including `m1`/`th2`,
    both historically flake-prone, clean on the first try).
    **One real, if minor, product-scope tension surfaced by the build
    itself and independently resolved by the review:** S3's own text
    says the Plan category's survey shows the board LIST; the brief's
    own DoD line describes "a board's cards surveyed as thumbnails
    beside a focused page" — Nick's original commissioning image. The
    review's independent judgment: the DoD line describes the FULL
    vision spanning CD2+AB4 (the committee pass's own ratified
    reasoning explicitly re-scopes that exact posture onto AB4, "built
    ON the cascade as the next arc ticket"; `BoardEditor.tsx` never
    got the cascade wired in this ticket, a disclosed non-goal with
    direct AB3-era precedent for excluding Board) — not a CD2 defect.
    Recorded as a DoD erratum for Fable/Nick, not unbuilt scope.
    **Park sweep — every entry individually audited against this
    project's own A4/FX1-Ruling-5 disclosure precedent; one false
    citation fixed, one consistency gap found and fixed.** Touched
    `ab1.mjs` (3 parked), `ab2.mjs` (1 parked), `ab3.mjs` (7 newly
    parked + 4 chain-extended + 7 adapted-in-place doorway checks, the
    largest single pass), `cd1.mjs` (2 parked, its first-ever), `fx1.mjs`
    (2 parked) — all verified verbatim-quoted, genuinely superseded
    (`Drawer.tsx`/`PlaceFace.tsx` confirmed actually deleted), with real
    live successors. The review fixed a false "layered park" precedent
    citation in `ab3.mjs`'s own comment (`bc4d560`) and flagged
    `fx2.mjs`'s two Drawer-named checks as inconsistently classified —
    edited in place rather than parked, despite naming "the Drawer" by
    name the same way the parked checks elsewhere in this identical
    sweep did. **Fixed directly** (not left as a flag) — parked both
    per A4, quoted verbatim, live successors already existed; also
    fixed the file's own tail, which only checked `checks` and never
    `parkedChecks`, meaning a failing parked check couldn't have failed
    the process (`fx2.mjs`: 33/33 -> 33/35).
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 17 harness files under both
    `HARNESS_PARKED` settings. `th2.mjs` hit its documented transient
    flake once during this final pass (2/43), cleared on 3 immediate
    reruns — consistent with its known history, not a regression.
    Pushed to `origin/main` @ `402a6ba`.
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always. The instruments panel (per the
    brief) remains committee-owned, untouched by this build.
    **Fable's review: GREEN with a fold, cd2.1 — 2026-07-18**
    (`docs/wrizo-alpha/cd2-review-fable.md`, census + record depth,
    standing on the independent review's own direct-testing
    verification as the deep pass). **Three rulings of record:** (1)
    the Plan-survey erratum SUSTAINED — the brief's own DoD line
    described AB4's eventual destination, not this ticket's floor;
    ruled Fable's own defect (her third of the run), not the build's;
    Nick-vetoable if he wants cards in the survey ahead of AB4. (2)
    the park-sweep consistency fix and the `fx2.mjs` latent-bug fix
    RATIFIED, with a fold to close the whole class. (3) the
    independent review's own practice — writing test coverage the
    build's harness lacked, rather than re-reading its self-report —
    ratified as the standing review method for transition-heavy
    tickets. **The fold does NOT gate deploy** — redeploy gate open
    on Nick's word regardless.
    **cd2.1 R1 folded — 2026-07-18, no code changes required.**
    Audited all 17 harness files' own exit logic for the exact class
    of bug `fx2.mjs` had (a `parkedChecks` array declared and
    populated under `HARNESS_PARKED=1` but never included in the
    final `pass` computation, so a failing parked check couldn't fail
    the process): `ab1`/`ab2`/`ab3`/`cd1`/`fx1`/`fx2`/`hb1`/`s1` all
    correctly use `checks.concat(parkedChecks)`; `cd2`/`fx3`/`j4`/
    `j5`/`m1`/`th1`/`th2`/`w1`/`w2` have no `parkedChecks` array at
    all (never parked anything — `cd2.mjs`'s and `fx3.mjs`'s own
    PARKED sections are honest empty scaffolds, print "armed but
    empty," claim no false pass). The one real instance of this class
    was `fx2.mjs`, already found and fixed during CD2's own merge
    (`a1da007`) — the audit confirms the class is now closed
    everywhere, nothing further to fix. Full suite reconfirmed green,
    both `HARNESS_PARKED` settings, all 17 files (`th2.mjs` hit its
    documented flake once more, cleared on 3 immediate reruns).
    **Close conditions: 1 and 2 now met** (review on disk, cd2.1
    folded, suite green). **3 and 4 remain** — redeploy on Nick's
    word, and his device-look sitting (the cascade at his left hand,
    the dock, the strip's four sections, the theme panel with no
    locked doors, FX3's own verdicts riding the same look).
    **Close condition 3 met — Deployed 2026-07-18**, Nick's word
    ("Deploy," FX3+CD2+cd2.1 together). `railway up` on `main` @
    `6692c00` (deployment `1fa52774`, SUCCESS), confirmed live. Full
    enumeration/detail recorded once, against item 29 (same deploy,
    same SHA, same word). **Close condition 4 (Nick's device-look
    sitting) remains** — item 30 does not close until it's spent.
31. **AB4 — the Wall.** **BRIEF COMMITTED, BUILD AUTHORIZED —
    2026-07-18.** Authority: the Tutor committee pass
    (`docs/wrizo-alpha/tutor-committee-pass.md`) as ratified by Nick —
    **A12-A15 RATIFIED** (A12 the two-sides law: the cascade serves
    known needs, the Tutor unknown ones; A13 the ghostwriter rail,
    constitutional — the Tutor speaks about the writing, never as it,
    reference yes/composition never, no Tutor output ever enters a
    writing surface by any affordance; A14 the room never knocks — the
    Tutor may write, never call, no badges/toasts/counts/dots ever;
    A15 the Tutor inherits the vanishing law with the dock rider), the
    composition line made LAW **with Nick's own revisit note verbatim:
    "if it's overly restrictive later, we can always revisit"**, Wall
    built first then TU1 (sequencing ratified), per-page Tutor threads
    in v1. This ticket discharges CD2's own Wall-fold ruling and
    Ruling 2's carries. Six slices: S1 the CD2 Plan-survey erratum
    comes true — picking a board swaps the survey to that board's
    CARDS as large thumbnails, fully dockable (the PowerPoint moment);
    S2 Pin as a fourth sending verb (membership, not capture — home/
    origin untouched, a page-pin card joins the board, a truthful
    "Also pinned to X" membership line, unpinning removes the card
    never the page); S3 threads (a connect-mode toggle draws hairlines
    between cards, stored in `boxes`, confirm-free deletion); S4 card
    resize (persisted) + double-click travel with a guaranteed way
    back (text cards keep today's inline-edit behavior, untouched);
    S5 BoardEditor finally joins the cascade system — gains the
    sliver (Add card, Connect toggle, nothing else v1), declares
    `pageKind='board'` (the standing prose-assumption cleanup lands),
    completing the "every surface carries strip/sliver/top-line, no
    pre-cascade wiring survives anywhere" claim. **Zero schema, zero
    new deps** — everything rides the existing `boxes` jsonb; any
    slice wanting a column is a STOP-and-report, this ticket carries
    no schema pre-authorization. Merge pre-authorized as zero-schema;
    Fable reviews post-merge, gating close and redeploy. New
    `apps/desktop/scripts/harness/ab4.mjs` required (S6) plus a park
    sweep — the cd2.1 audit now guards the whole "silently-skipped-
    parked-checks" class for every file this falsifies.
    **TU1 — the Tutor — queued next, SCHEMA FLAG standing.** Per the
    Tutor committee pass's own recommendation: a right-edge panel
    mirroring the sliver's geometry, persisted Tutor threads (the
    arc's second schema addition after `origin`). **Carries NO merge
    pre-authorization — Nick's explicit merge go is required** (the
    corrected zero-schema-vs-schema rule's first scheduled real use
    since the correction). TU1's own brief follows AB4's review, per
    the one-brief rhythm. Not started; brief not yet written.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S6 on `ab4-wall` off
    `main`, in an isolated worktree. **Zero-schema independently
    verified TRUE, twice** (build's own check + the review's own
    separate `git diff main..ab4-wall -- apps/server/`, byte-empty —
    `migrate.ts`/`sync.ts` untouched). **S3's design choice — the
    ticket's real engineering call:** the brief's own framing
    suggested a sibling jsonb field for `connections`, but the build
    found (and the review independently re-verified by reading
    `migrate.ts`/`sync.ts` directly) that `script`'s own existing
    sibling-column precedent actually needs its own migration + sync
    wiring — NOT zero-schema despite looking like one at the TS-type
    level. Chose instead to store connections as plain elements of
    the SAME flat `boxes` array (a new `'connection'` `Box.kind`
    carrying endpoint ids, position always derived live from the two
    endpoints' current rects, never stored — drag/resize moves
    hairlines for free). Independently stress-tested: live drag
    verified, and an orphan-on-delete scenario the brief itself
    flagged but the build's own harness didn't cover — deleting a
    card also cleanly removes every connection referencing it, no
    crash, no orphan, unrelated cards/connections untouched.
    **S4's way-back mechanism** (a one-shot `location.state`, F2's
    own warm-start pattern reused) independently traced end-to-end
    and confirmed it returns to the SPECIFIC originating board by id,
    not just "a board"; reload-loses-state confirmed to degrade
    gracefully (no chip, no crash) rather than break.
    **S1/S2** verified; the build's own self-flagged interpolation (a
    non-pin survey card now travels to the board on click, rather
    than staying inert) independently judged reasonable by the review
    — every other survey item in the app is already click-to-travel,
    making an inert card the actual anomaly, not this choice.
    **Legacy BoardEditor confirmed byte-identical** — not trusted from
    a diff summary; the review extracted both branches' actual JSX
    and ran a literal `diff`.
    **Park sweep:** the build's own audit found nothing needing a
    real park (structural, non-content-comparing checks throughout
    the suite are naturally immune to Board gaining chrome for the
    first time) — the review independently re-swept and confirmed
    this, but caught one thing the build's own audit missed: a stale
    comment in `ab1.mjs`'s own PARKED section still narrated "Board
    still passes no strip content," now false. Comment-only (the
    underlying check compares rects, never content, so nothing was
    actually falsified) — fixed directly by the review (`6c8975c`),
    re-verified unchanged counts.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 18 harness files (`ab1` 33/46, `ab2`
    41/53, `ab3` 24/38, `cd1` 27/29, `cd2` 50/50, `fx1` 23/34, `fx2`
    33/35, `fx3` 30/30, `hb1` 31/32, `j4` 26, `j5` 40, `m1` 33, `s1`
    86/87, `th1` 26, `th2` 43, `w1` 18, `w2` 31, `ab4` 36/36 — new)
    under both `HARNESS_PARKED` settings, zero count discrepancies
    between build/review/this session's own three independent runs.
    `th2.mjs` hit its documented transient flake once during this
    final pass (2/43), cleared on 3 immediate reruns. Pushed to
    `origin/main` @ `f1ba899`.
    **Fable's review: GREEN, zero required fixes — 2026-07-18**
    (`docs/wrizo-alpha/ab4-review-fable.md`, census + record depth,
    standing on the independent review's own direct testing —
    including its delete-with-active-connections script — as the
    deep pass). **Ruling: S3's brief sketch (a sibling-field shape)
    was Fable's own erratum**, not the build's — the build's verified
    zero-schema shape (connections as same-array elements) is
    correct; no STOP was owed since the investigation found the
    lawful shape rather than hitting a wall. Deletion cleanup, the
    legacy-reading distinction, and the "nothing to park" audit all
    endorsed. **Three advisories carried, none blocking:** A1 —
    self-pin is reachable (no self-guard on `pinPageToBoard`; harmless,
    idempotent, nonsense composition — fold candidate at next touch,
    not now); also noted, a board-to-board pin travels correctly but
    renders no way-back chip (the chip is prose/script-only v1,
    acceptable). A2 — the empty-state copy implies filing is required
    to pin when it isn't (membership ≠ filing); truthful copy is "create
    a project first," a wording fix at next touch. A3 — `goalText=""`
    on boards SUSTAINED (a board holds arrangement, not writing; a
    board-native measure is a future committee question, not a fold).
    **Deployed — 2026-07-18**, Nick's word ("deploy AB4"). Deploy-
    manifest rule satisfied — independently re-enumerated (not just
    trusted from the review's own claim): every commit since the last
    deploy (`6692c00` → `HEAD`) resolves to exactly AB4's own commits
    plus docs-only entries, no unnamed riders. `railway up` on `main`
    @ `d1a6696` (deployment `1276bb33`, SUCCESS), confirmed live:
    `200` on `/healthz` and `/`, `401` on `/auth/me`.
    **Close conditions 1 and 2 met.** Condition 3 (Nick's device look
    per the brief's DoD) remains — may ride the consolidated sitting
    or its own, his call. TU1 remains queued next, schema-flagged,
    awaiting its own brief and Nick's explicit merge go; its order
    against hb1.2 also rides his word.
32. **Nick's desktop sitting — 2026-07-18. PARTIAL** — served items
    30 (CD2) and 31 (AB4) in part; item 27's (HB1) own list untouched.
    **Verdicts, feeding a future FX4** (brief follows TU1's review;
    zero-schema): the typewriter start moves to 25% from the top of
    the stage; scroll/fade engages within ~10 lines; the retune
    applies to ALL surfaces including the Journal — its own
    start-offset carve-out RETIRES (the ink-coordinate risk that
    justified the carve-out is to be SOLVED, not skipped past); the
    goal glow gets a verify-then-retune pass to an actually
    perceivable state (the hard intensity-cap law itself still
    holds, only the tuning changes); the strip sits flush to the
    screen's own left edge (not the frame's); the Board's own
    strip/sliver anchoring is flush too, with an ANCHORING DEFECT
    SUSPECTED there specifically (not yet diagnosed); cards resize on
    BOTH axes (was one); the board canvas itself resizes on both axes
    too; and hover-restore of already-faded chrome, currently broken,
    gets repaired.
    **Rulings recorded (verdicts on standing questions, not FX4
    slices):** card editing moves to a POPUP over a blurred board,
    the popup carrying the card's own minimal strip — this SUPERSEDES
    Nick's own prior standing rider (notecards keep inline editing,
    no sliver interference, reaffirmed as recently as AB4's own S4) —
    **pending his explicit confirm**, not yet final. Cards carry
    neither a typewriter nor a progress instrument (furniture that
    doesn't apply to arrangement, same reasoning as AB4's own
    `goalText=""` sustain). A visible thin sheet-break line where
    continuous scroll crosses a page boundary is ruled AB5's own
    input, not this sitting's to solve — it amends Law 8's own
    "silent turnover" letter, a canon touch for AB5 to carry, not a
    ratification landed here. The sliver's "Instruments" icon
    renames to "Progress Bar," gaining strip/disabled/bottom
    placement options — handed to the instruments-panel's own owner
    (the Cascade committee pass), not built here. Three typewriter
    sub-toggles (Forward Momentum / Text Fade / Page Scroll) move
    behind the sliver's Typewriter icon. The "Controls"/"Forward
    lock" labels retire (superseded terminology, park the strings
    per the usual lexicon discipline whenever code catches up).
    **A new committee pass convened, Nick's own commission** (not yet
    delivered — a future doc, not this entry): per-mode tool strips
    (a formatting LIST for Draft vs. its own frozen-markdown storage
    reality — the cost of reconciling them is to be NAMED, not
    assumed; a schema touch here would be LOUDLY flagged, same
    standing discipline as AB4's own; custom-font upload wakes as a
    later question, gated behind progressive disclosure); a staged
    vanish that includes the strip itself (a real A8 touch — the
    strip's own "never dissolving" law softening — amendment drafted,
    NOT yet ratified, awaits Nick's word); framework beats (from the
    progress-milestones/Plan system) surfacing as board cards (named
    as the P-arc's own doorway, not this sitting's to build).
    **Read-backs open, unresolved by this sitting** at the time it
    was recorded — **all three now RULED, per FX4's own authority
    line (item 33):** copy-out is Publish-only; handle-drag replaces
    the connect-toggle; the card-editing popup supersession is
    confirmed (Nick's own word, no longer pending). See item 33 for
    the verbatim rulings and their build implications.
    **Mockups delivered, still not committed:** `board-card-studies.html`
    (card treatments A-D plus the popup editor) — Nick's own pick
    landed (Stacked, variant B, per item 33/FX4's own S7), but the
    file itself has not actually reached this session by any channel
    yet (checked broadly, genuinely absent) — still not on disk, not
    committed. FX4's own S7 carries enough written specification
    (lighter stock, 1px hairline, 2px offset hard edge + soft shadow,
    square corners) to build from without the mockup file itself, but
    the file remains owed as the historical design reference `docs/
    design/` is meant to hold.
    **What remains open:** item 30 (CD2) — the dock, pin/membership,
    thread round-trip, and resize-across-reload are all still
    UNVERDICTED (this sitting didn't reach them); item 31 (AB4) —
    same, still open. Item 27 (HB1)'s own full sitting list is
    entirely untouched by this pass. Neither item 30 nor 31 closes on
    this sitting alone.
33. **FX4 — the Fourth Sitting.** **BRIEF COMMITTED, BUILD AUTHORIZED
    — 2026-07-18.** Authority: item 32's sitting record, plus **four
    of Nick's rulings, verbatim:** copy-out is Publish-only (no new
    clipboard door this ticket); handle-drag (double-click the
    card's own brass resize handle, drag, release inside a target
    card) REPLACES the sliver's Connect toggle for thread-drawing —
    the toggle itself retires; the card-editing popup (blurred board
    behind, the card's own minimal strip) SUPERSEDES inline
    contenteditable card editing — confirmed, no longer pending
    (item 32's own read-back closed); **Stacked** (variant B of
    `board-card-studies.html`) is the ratified card treatment —
    lighter stock, 1px hairline, thickness told by a 2px offset hard
    edge + soft shadow, square corners.
    **The trash bin — recorded here as QUEUED, not this ticket's
    build:** pages are cheap to trash (`deletedAt` already
    soft-deletes them, a door just needs building); cards and
    threads are NOT cheap — they need new deletion semantics of
    their own before a bin can honestly represent them. T4's own
    interaction pattern (disclosure, one plain confirm) is the noted
    starting point whenever this gets its own ticket. Not FX4's to
    build.
    **The intro-screen table, recorded here:** item 27 (HB1) stays
    open; hb1.2 (its own next fold) is queued; **the hammer test
    leads its severity ranking** — whichever finding the hammer test
    surfaces worst is what hb1.2 addresses first, when it's built.
    **Nine slices (S0-S9):** S1 the typewriter start retunes to 25%
    across EVERY surface including the Journal — its carve-out
    RETIRES, the ink-coordinate risk gets SOLVED not re-skipped (a
    seeded-stroke byte-truth fixture is the proof; if it can't be
    proven safe, STOP and report rather than ship half); S2 the goal
    glow gets a render-verified-first, then-retuned pass (defect vs.
    tuning diagnosed before any value changes, FX2's own law), plus a
    harness luminance floor so "too subtle to see" can't silently
    regress again; S3 the strip goes flush to the screen's own left
    edge (not the frame's), and the Board's own strip/sliver
    anchoring — suspected defect, not yet diagnosed — gets measured
    and fixed at the root; S4 cards AND the board canvas both gain
    both-axis resize, canvas dimensions persisting as a new
    `'board-meta'` array element (the `'connection'`-kind precedent
    from AB4, still zero-schema — STOP-and-report if that shape
    fights in practice); S5 the popup editor lands (Bold/Italic only,
    the frozen markdown set does NOT unfreeze here), inline editing
    retires, `ab4.mjs`'s own inline-editing check parks per A4; S6
    the handle-drag thread gesture replaces Connect, parking
    `ab4.mjs`'s exact-two-tools count and its connect-toggle checks;
    S7 Stacked ships as CSS; S8 hover-restore on faded chrome gets
    repaired as a defect fix, explicitly NOT a redesign (the staged
    vanish itself stays the committee's). New
    `apps/desktop/scripts/harness/fx4.mjs` required (S9) plus the
    park sweep named above. **Zero schema, zero new deps** — merge
    pre-authorized per the standing rule; Fable reviews post-merge,
    gating close and redeploy; any slice wanting a column is a
    STOP-and-report, same discipline as AB4. **Sequencing:** builds
    after TU1's review lands, OR in parallel on Nick's explicit word
    — the two tickets share one seam (PageEditor/DeskFrame host
    wiring) that needs coordination if run concurrently, nowhere
    else. Committed:
    `docs/wrizo-alpha/fx4-fourth-sitting-brief.md`.
    **`board-card-studies.html` landed and is committed** —
    `docs/design/board-card-studies.html` (moved from where it first
    arrived, per S0's own instruction).
    **Build starting — 2026-07-18**, Nick's word ("Build FX4 first
    then TU1") — sequential, not parallel, so the brief's own
    shared-seam coordination concern doesn't apply this time.
    **MERGED, PUSHED — 2026-07-18.** Built S0-S9 on `fx4-fourth-
    sitting` off `main`, via a Workflow-orchestrated build+review
    pipeline (ultracode). **All three named STOP-and-report clauses
    investigated; none fired** — S1's ink-coordinate risk, S4's
    board-meta shape, and the general schema clause were each worked
    through to a lawful, zero-schema, empirically-proven answer
    rather than skipped.
    **S1 (the highest-risk slice) — proven safe two ways.** CSS
    box-model reasoning (padding-top grows an element's height, never
    moves its own border-box top; the ink canvases are absolutely
    positioned against that same box, so the whole coordinate space
    is structurally immune) PLUS a committed, permanent harness fixture:
    seed a stroke at known coordinates, toggle the new start-offset
    live, confirm `top`/`left`/`width` byte-identical (only `height`
    differs), confirm real ink pixels land at the predicted screen
    position. The independent review didn't just re-read this — it
    ran an ADVERSARIAL MUTATION TEST (swapped `padding-top` for
    `margin-top`, a plausible real regression), confirmed the
    fixture correctly failed five checks including its own core
    rect-invariant, then reverted and reconfirmed clean. The proof is
    real, not a rubber stamp. Getting there also surfaced and fixed
    THREE previously-undiscovered defects unrelated to the
    coordinate risk itself: `.desk-frame-host{overflow:hidden}` (an
    FX3-era rule) silently capped Journal's own legitimate growth;
    a caret-detection fallback mis-measured on Journal's plaintext
    editable (no per-run wrappers) and fired the hold-band almost
    immediately regardless of typing; the same fallback caused a
    **fresh, untouched page to auto-scroll on mount**, undoing "starts
    a quarter down" before a single keystroke. All three fixed;
    START_FRACTION -> 0.25 (measured the fx1.mjs way, not just set).
    **S2 (the glow)** — diagnosed first, per FX2's own law: a real
    rendering defect, not a tuning gap (`z-index:-1` escaping to the
    document root because its parent never established a stacking
    context). One-line fix (`isolation:isolate`), then retuned.
    Independently reconfirmed by hand-computing the eased curve at
    50% progress and matching the harness's own live-read value
    exactly (0.232 both ways).
    **S3 (flush chrome)** — the strip's own inset killed; the
    Board's sliver anchor was using the WRONG formula entirely (a
    prose constant on a differently-sized surface, ~242px off,
    measured not guessed) — fixed at the root. Flagged, not a defect:
    flush-left necessarily breaks CD1's own prior symmetric-margins
    framing at wide viewports — the independent review's own read is
    that this isn't actually an open question (the brief's own
    language is explicit and unconditional), just a visible
    compositional change worth Nick's eye.
    **S4 (resize + board-meta)** — both-axis resize for cards and the
    canvas; board-meta storage followed AB4's own `'connection'`-kind
    precedent, checked against every existing `boxes` consumer before
    shipping. The review found one real (minor) gap in the build's
    OWN harness check — a dead boolean clause (operator-precedence
    bug) that made a value-comparison structurally unreachable, so
    the check only ever proved the element's existence, not its
    correctness — fixed directly (`573f76c`), not a product defect.
    **S5 (popup, inline retires)** — reused this codebase's own
    existing pieces throughout (`draftFormat`'s markdown conventions,
    the iA dimmed-syntax register Draft mode already uses, hb1.1's
    own focus-trap pattern) rather than inventing new ones. A pen-
    discipline guard the retired inline editor carried was nearly
    dropped — caught during the build's OWN park-sweep audit, fixed
    before commit.
    **S6 (handle-drag threads)** — Connect toggle genuinely gone
    (confirmed by the review via a repo-wide grep, not just a UI
    check); the underlying connection storage/de-dupe/deletion is
    unchanged from AB4, only the gesture differs. The review wrote
    its own independent probe for a scenario neither brief nor
    harness named (Escape pressed mid-drag, pointer still held) and
    confirmed correct behavior via live testing, not code-reading
    alone.
    **S7 (Stacked)** matched the mockup's own literal values.
    **S8 (hover-restore)** — a genuine, subtle, previously-unknown
    defect, found live: the dissolve/resurface state only ever reset
    on a LATER "not at edge" report, never when its own dwell timer
    fired — so the FIRST cycle after mount always worked and EVERY
    SUBSequent cycle within the same session silently failed. Exactly
    the pattern a real writer would hit and no prior single-cycle
    check could have caught. Fixed at the root.
    **Park sweep — 8 files, fully enumerated and independently
    re-audited.** `fx3`/`cd1`/`fx1` (a documented SECOND-generation
    supersession, the "layered park" precedent used again), `w2`
    (its first-ever PARKED section), `ab1`/`j4` (`j4`'s own first-ever
    PARKED section), `ab4` (10 checks, the largest single share). The
    independent review didn't just check the enumerated files — it
    swept the ENTIRE harness tree itself for retired-mechanism
    strings, and specifically stress-tested `w1.mjs` (not in the
    sweep at all, but exercising adjacent code) to confirm it was
    genuinely unaffected, plus empirically re-verified `w2.mjs`'s own
    specific numeric reasoning rather than trusting it on paper.
    **Full suite green on the fully merged, pushed tree:** `tsc`,
    `build:web`, selftest, all 19 harness files (`ab1` 29/44, `ab2`
    41/53, `ab3` 24/38, `cd1` 26/29, `cd2` 50/50, `fx1` 23/34, `fx2`
    33/35, `fx3` 27/30, `fx4` 61/61 — new, `hb1` 31/32, `j4` 24/27,
    `j5` 40, `m1` 33, `s1` 86/87, `th1` 26, `th2` 43, `w1` 18, `w2`
    31/32, `ab4` 25/35) under both `HARNESS_PARKED` settings — zero
    discrepancies across build/review/this session's own three
    independent runs, all from genuinely clean installs. `th2.mjs`
    hit its documented transient flake once during this final pass
    (2/43), cleared on 3 immediate reruns. Pushed to `origin/main` @
    `94466fa`.
    **Judgment calls disclosed, none blocking:** S1's cross-surface
    visual-percentage spread (prose ~29-30%, script/Journal ~25%,
    all "about a quarter" but not identical — a structural artifact
    of prose's own extra chrome padding, not a bug); a new
    `MIN_TEXT_H` constant by analogy, not brief-named; a commit-
    granularity compromise on `index.css`/`BoardEditor.tsx` (genuinely
    interleaved code across slices, disclosed plainly rather than
    force-split and risk the tree).
    **Not deployed** — Fable's post-merge review hasn't landed;
    redeploy is Nick's call, as always.
    **Fable's review: GREEN, zero required fixes — 2026-07-18**
    (`docs/wrizo-alpha/fx4-review-fable.md`, census + record depth,
    standing on the three independent zero-discrepancy verification
    runs and the review's own adversarial mutation test on S1's
    ink-coordinate proof). **All five defects found and fixed along
    the way — the Journal overflow clip, the caret-detection
    fallback, the fresh-page auto-scroll, the glow's stacking-context
    escape, the hover-restore reset bug — ratified in-scope**, every
    one inside a surface this ticket's own slices already own,
    diagnosed before tuning per FX2's standing law. The board-meta
    un-normalized `canvasW`/`canvasH` decision, the `fx1.mjs`
    generation-2 double-supersession precedent, and the `w2.mjs`
    park all explicitly ratified as correct calls.
    **One advisory carried, not blocking (Nick's eye, first on his
    glance list):** the desk grid now left-anchors at wide viewports
    (S3's own flush-left requirement) rather than centering — a
    lawful reading of the brief, but a visible departure from CD1's
    own prior symmetric-margins framing; a one-line revert if his own
    verdict goes the other way.
    **Close conditions:** (1) review on disk, met. (2) redeploy on
    Nick's word — deploy manifest already enumerated by the review
    itself: `d1a6696..HEAD` = FX4 (the one code ticket) plus named
    doc riders (item 32's sitting record, the FX4/TU1 briefs and
    items 33/34, `board-card-studies.html`, the stash-drop record,
    this review) — no unnamed code riders. (3) Nick's own FX4 DoD
    script plus the A1 wide-desk glance — remains open. **TU1
    proceeds on its own branch in parallel** — Fable reviews there
    when its build reports; merge needs Nick's explicit go
    regardless of this item's own status.
    **Close condition 2 met — Deployed 2026-07-18**, Nick's word
    ("Yeah, deploy") — confirmed TU1's own concurrent build doesn't
    affect this: it's a schema ticket with no merge pre-authorization,
    building on its own separate, unmerged branch, so `main`'s own
    state (independently re-enumerated: `d1a6696..HEAD` = FX4 + docs
    only, matching the review's own manifest exactly) was untouched
    by it. `railway up` on `main` @ `1dc0003` (deployment `0e1fc3b7`,
    SUCCESS), confirmed live: `200` on `/healthz` and `/`, `401` on
    `/auth/me`. **Close condition 3 (Nick's own FX4 DoD script + the
    A1 wide-desk glance) remains open** — item 33 doesn't close until
    it's spent.
    **Nick's FX4 DoD verdict sheet — 2026-07-19.** PASS: strip flush,
    board chrome flush, Stacked cards ("happy for now"), popup+blur,
    start position. FAIL: thread gesture (handle-dblclick dead under
    real pointer; superseded by Nick's pin-circle ruling), hover-
    restore (dead on real hardware despite the four-cycle synthetic
    proof), glow (imperceptible), engage motion (multi-line jerk).
    New rulings from the sitting: scroll freedom (typing never snaps
    the page back; fade tracks the viewport top, not absolute text
    position), fade band one line lower, em-dash autocorrect, notecard
    clamp on ported pages, free card movement + overlap + a quiet
    layer icon, the olive pin as the connection grab, a connection
    footer + its own toggle, no visible asterisks on cards, Plateau-
    styled scrollbars. Parked by Nick's own word: the momentum
    scroller. Restated, committee-owned: staged vanish including full
    disappearance after sustained writing. Card committee
    COMMISSIONED by Nick: titles, tags, metadata footer fields,
    organization/tracking. A1 wide-desk glance: still open at this
    point (closed separately below). Item 33 **closes PARTIAL** — the
    DoD verdict sheet is now fully recorded and answered by FX5's own
    brief (queued behind TU1's branch review, now committed); the
    route from here is FX5, not a further fold of FX4 itself. Lesson
    recorded, now standing law in FX5's own preamble: synthetic-event
    harness proofs are not the same claim as a trusted real pointer
    gesture — every input-gesture claim from here on reproduces with
    the closest-to-trusted event stream the harness can produce and
    documents the residual gap honestly, in the check itself.
    **A1 (the wide-desk glance) — CLOSED, Nick's verdict, 2026-07-19:**
    the paper sat visibly off-center (right gap wider than left).
    Ruled: center the paper, keep the strip flush at the screen's own
    left edge — recorded as FX5's own S10 amendment. Nick's forward
    note recorded for the record: the right margin is TU1's own room
    by design; any further remainder stays unallocated by his word,
    not silently claimed by any future ticket.
34. **TU1 — the Tutor.** **BRIEF COMMITTED — 2026-07-18.**
    `docs/wrizo-alpha/tu1-tutor-brief.md`. **SCHEMA TICKET — NO MERGE
    PRE-AUTHORIZATION**, the corrected zero-schema-vs-schema rule's
    first real ticket to actually reach build. One nullable `tutor`
    jsonb column on `journal_entries` (the arc's second schema
    addition after `origin`), a right-edge sliver-mirrored panel
    (A15, dock rider inherited whole), three offline/client-only
    lenses (Consistency/Structure/Fragments), nudges as letters never
    calls (A14, absolute — no badge/toast/count/dot/interruption
    anywhere in this ticket), and the model conversation itself bound
    by A13's ghostwriter rail (speaks about the writing, never as it;
    no insert/apply/copy-into-page affordance of any kind — the
    future paste rail is the mechanical backstop, not built here).
    **Build and push only — no merge.** Report = push; Fable reviews
    ON THE BRANCH; merge happens only on Nick's explicit go. The S1
    schema precedent's live prod round-trip (a scratch account
    pushes/pulls a populated thread byte-for-byte) is REQUIRED after
    deploy, not optional.
    **Queued behind FX4 (item 33)** per Nick's own sequencing word —
    not started yet. S0's own deeper record-keeping (item 27's
    HB-arc-stewardship consolidation note, dropping the `cd1.1
    erratum WIP` stash) is this ticket's own build-time work, not
    done here — deferred to when TU1 actually builds, matching every
    prior ticket's own S0-at-build-time pattern. (The stash-drop was
    in fact done directly on `main` ahead of the build, once FX4's
    own build had started — see this same section's own earlier
    entry.)
    **BUILT, INDEPENDENTLY REVIEWED, AND PUSHED — 2026-07-19. NOT
    MERGED (at build time) — expected and correct for a schema
    ticket, not an incomplete state; see the merge record below,
    dated the same day.** Built S0-S6 on `tu1-tutor` off `main` @
    `5ed923c`, in its own isolated worktree per the ONE CHECKOUT PER
    AGENT rule, via a Workflow-orchestrated build+review pipeline
    (ultracode) — the same two-stage discipline every zero-schema
    ticket has gotten this session, just without the merge step this
    ticket's own brief explicitly withholds. **Schema, exactly as
    declared:** one nullable `tutor` jsonb column (`add column if
    not exists`, no default, no CHECK) plus both sync-mapper
    directions, matching the `origin`/`script` three-touch-point
    recipe exactly — independently hand-verified by the review
    (counted `$N` placeholders against the column list and VALUES
    tuple, confirmed byte-identical in shape). Server surface stayed
    within the brief's own enumeration (one column, two mapper
    touches, one route, `POST /api/tutor/chat`) — no STOP-and-report
    triggered, confirmed independently.
    **A real geometry defect found and fixed mid-build, measured not
    guessed:** a single Sliver-shaped anchor can't hold both the
    grip's own FX2-clamped box and a genuine ~300px open panel — at
    1280px the naive version silently clipped ~20px of the panel
    against `.desk-frame-host`'s own `overflow:hidden` (an unrelated
    FX3-era rule). Fixed with two separate DeskFrame overlay anchors
    instead of one. The review independently re-measured the CSS
    formulas byte-for-byte against the sliver's own left-edge
    version and confirmed the FX2 clamp technique is genuinely
    reused, not approximated. **Two further fixes landed the same
    way, caught live not guessed:** a Consistency-lens gap where
    ALL-CAPS/lowercase case variants of an already-known name were
    invisible to a Title-Case-only harvest (a second, targeted
    case-insensitive pass fixes it); and every raw-localStorage seed
    site in `tu1.mjs` itself mutates from the Desk, never while the
    entry's own page is mounted — a live reconfirmation of this
    project's own documented harness-seeding-vs-flushNow race
    (see memory).
    **The grandfather (null⇔undefined) proof — independently traced
    through the actual code, not just the test.** The review read
    `persistence.ts`'s own `clone()`/`upsert()`/sync-apply paths by
    hand and confirmed there is no "create empty thread" call site
    anywhere — the field is born only on a page's first real sent
    message. Server-side mapper correctness is proven by structural
    identity with `script`/`origin`'s own already-production-proven
    recipe, not a live database test (this environment has no test
    DB and `apps/server` carries no test harness of its own) —
    disclosed plainly by both build and review, not glossed over.
    **A13's ghostwriter rail — verified as GENUINELY structural, the
    exact discipline the brief asked for by name.** The review
    confirmed the harness's own sweep walks the live DOM generically
    (every button species found, not a hand-picked "known safe"
    list) and separately read `Tutor.tsx` itself: rendered messages
    are inert `<div>` text with no interactive children anywhere,
    and the component's own closure holds no editor ref or text
    setter at all — architecturally, no control in the file COULD
    reach a writing surface regardless of intent, not merely "none
    currently do."
    **S5's live-model path — both build and review equally honest
    about the same real limitation.** No `TUTOR_API_KEY` exists in
    either agent's own environment; a genuine end-to-end model
    round-trip was never attempted by either, and neither faked
    verification of it. What WAS verified thoroughly, live, by both:
    the offline/unconfigured path end-to-end (fails fast before any
    SDK object is even constructed, degrades to one quiet status
    line, never hangs, never crashes).
    **S3's Consistency lens — the review hand-traced the actual
    algorithm** against the harness's own seeded fixture and
    reproduced its exact two observations by hand, confirming
    determinism and correctness, not just "a check exists and
    passes." Structure/Fragments confirmed genuinely reusing
    pre-existing AB3/AB4-era functions, not re-derived under new
    names.
    **Full suite: 20 harness files (19 pre-existing + new `tu1.mjs`,
    96 checks), both `HARNESS_PARKED` settings, `tsc` (desktop AND
    server) + `build:web` + selftest — all green, 40/40 harness runs
    across BOTH the build's own pass and the review's fully
    independent, from-clean-install re-run. Zero discrepancies. Park
    sweep genuinely empty (a purely additive ticket), armed-but-empty
    gate matching the cd2/fx3/ab4 precedent.**
    **The review's own verdict: GREEN, no defects found, nothing
    fixed, nothing pushed by the review itself** — the first ticket
    this session where independent review found nothing rising to
    even a minor direct fix. One cosmetic-only item flagged, not
    fixed: a dead `deskLexicon` entry (`tutorDockReopen`) that the
    dock button doesn't actually use (a hardcoded glyph instead,
    same idiom as the grip's own hardcoded arrows elsewhere in the
    same file — not an accessibility gap, the aria-label routes
    through the lexicon correctly; purely a "not worth its own commit"
    inconsistency).
    **Judgment calls disclosed, independently reviewed and agreed
    with, none dissented:** the two-anchor geometry departure from a
    literal single-anchor mirror; the model default
    (`claude-opus-4-8`, independently confirmed current, not a stale
    guess); PageEditor's first-run gate rendering the Tutor absent
    outright rather than veiled-but-mounted like the sliver;
    Consistency's stoplist-heuristic honestly documented as "v1,
    not real NER."
    **Pushed and confirmed on `origin/tu1-tutor` @ `3b062df`** —
    verified independently by both agents via fresh fetches, not
    assumed. **The S1-precedent live prod round-trip remains
    explicitly outstanding**, owed after Nick's own merge-and-deploy
    cycle, not attempted or faked by either agent, exactly as the
    brief's own words require. Item 27's own HB-arc-stewardship
    consolidation note remains genuinely undone (out of any build
    agent's own visibility/authority, honestly disclosed rather than
    fabricated by either agent) — a human-session task, not a build
    task.
    **Fable's on-branch review landed — 2026-07-19**
    (`docs/wrizo-alpha/tu1-review-fable.md`, committed): **GREEN on
    the branch (`3b062df`), required 0** — the deepest depth
    disclosed of the run where it counts (full line-by-line read of
    the entire schema surface and the entire server route, not
    census-level). Six rulings of record, all RATIFIED/VERIFIED/
    ENDORSED: the grandfather is structural not guarded (no
    empty-thread writer exists anywhere); A13 architectural at every
    layer; privacy mechanically true to the disclosure's own wording;
    the two-anchor geometry deviation; the server-surface enumeration
    holds (SDK dependency accepted within the route's envelope); the
    truthful test double (`runtime-verify.mjs`) endorsed for proving
    the quiet-degrade path end-to-end rather than by inspection alone.
    **A1 (condition, not defect):** the live model path stays
    unexercised until `TUTOR_API_KEY` lands on Railway — Nick's own
    config step, his own timing; the quiet-degrade path is the proven
    net beneath it in the meantime.
    **MERGED — 2026-07-19, Nick's explicit word** ("TU1: MERGE" —
    Fable's GREEN on-branch review as the required condition, met).
    `tu1-tutor` merged into `main` (one expected conflict in this
    ledger's own item 34 — the branch's own build-time note
    superseded by this section's fuller record, resolved in favor of
    the more current text, two genuine fix details folded in above:
    the Consistency-lens case-insensitivity fix and the flushNow-race
    reconfirmation). `tsc` (desktop + server) + `build:web` + selftest
    + the full 20-script harness suite green on merged `main`,
    independently re-run by CC before push (matching both the build's
    and the review's own from-clean-install counts exactly — zero
    discrepancies). Pushed to `origin/main`.
    **Not deployed — Nick's deploy word comes separately, as always.**
    On deploy: manifest enumerated as always; AFTER deploy, the
    REQUIRED prod round-trip (scratch account, populated tutor
    thread, byte-for-byte both directions — the S1 precedent) before
    this item can close. Nick's own DoD sitting follows — the
    conversation half stays pending his own `TUTOR_API_KEY`.
    **Deployed — 2026-07-19**, Nick's word ("DEPLOY — Nick's word is
    given"), the manifest rule's first two-ticket deploy: `1dc0003..
    HEAD` = TU1 + FX5 (both named), plus docs riders only,
    independently re-enumerated before shipping — no unnamed code
    riders. `railway up` on `main` @ `6759777` (deployment
    `39bbe424`, SUCCESS), confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`).
    **The REQUIRED S1-precedent prod round-trip — RUN, PASS,
    2026-07-19.** A scratch account registered live, pushed a
    `journal_entries` row with a populated three-message `tutor`
    thread via `/api/sync`, then pulled it back via a second
    `/api/sync` call simulating a second device: **the thread matched
    byte-for-byte, key-order-insensitive** (Postgres `jsonb` storage
    normalizes key order — array/message order itself, which carries
    real meaning, was preserved and verified exactly). A second push
    with no `tutor` field at all confirmed the grandfather clause live
    in production, not just in the harness: the pulled row carried
    **no `tutor` key whatsoever** (not `null`, not `{}`) — the
    resulting Object.keys() list confirmed by direct inspection. Both
    scratch entries soft-deleted after. **Item 34 does not fully close
    yet** — Nick's own DoD sitting remains, the conversation half
    pending his own `TUTOR_API_KEY` landing on Railway, his timing.
    The lenses and panel work fully without it in the meantime.
35. **FX5 — the Felt Verdicts.** **BRIEF COMMITTED — 2026-07-19.**
    `docs/wrizo-alpha/fx5-felt-verdicts-brief.md`, S1-S9 plus the S10
    center-the-paper amendment (item 33's own A1 close, folded in
    before build). Authority: Nick's FX4 verdict sheet, recorded under
    item 33 above. Zero schema (card titles/tags/metadata are
    explicitly NOT this ticket — card-committee material;
    STOP-and-report if any slice wants a column). Merge pre-authorized
    per the standing zero-schema rule; Fable reviews post-merge. Nine
    slices: the typewriter's manners (per-line engage motion, fade
    band one line lower, scroll freedom — typing never snaps back,
    viewport-top fade), the glow retuned to actually be perceptible by
    mid-goal, board surface polish (Plateau scrollbars, notecard-
    clamped page-pins, both-axis page-pin resize diagnosed and fixed),
    free card movement with permitted overlap and a quiet layer-order
    icon, the olive pin replacing the dead handle-gesture as the
    connection grab (footer line + its own toggle), no visible
    asterisks in the card popup, em-dash autocorrect, hover-restore
    diagnosed live on real hardware (root cause, not a re-guess), plus
    `fx5.mjs` and its own park sweep. A standing discipline born in
    this brief's own preamble: for every input-gesture claim,
    reproduce with the closest-to-trusted event stream the harness can
    produce, document the residual gap honestly in the check itself —
    FX4's own thread gesture and hover-restore both passed synthetic
    proofs and both failed under Nick's real hand. Report = push
    (merge pre-authorized).
    **Build starting — 2026-07-19**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-TU1-merge `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S9 + S10 on `fx5-felt-verdicts` off `main`
    @ `9ddd192`, in its own worktree. S0's own ledger work was already
    done directly on `main` before the build started (see item 33's
    close above); the build agent began at S1.
    **S1 (the big one) — the engage jump fixed by construction, not
    tuning.** Rewrote the typewriter's catch-up from an absolute
    "recenter to the band" jump to a relative, one-line-at-a-time
    step tracked in scroll-independent "document space" — the same
    mechanism kills both the multi-line jerk AND the snap-back-on-type
    bug at once, since the engine only ever nudges `scrollTop` by a
    delta on top of wherever it already sits, never recomputing an
    absolute target. Fade band moved one line lower via a new
    `--tw-fade-start` token.
    **S2 (the glow)** — easing exponent 0.55→0.28; measured, not
    guessed: computed opacity at 50% progress now reaches ~82% of the
    untouched cap (was ~68%). Did not fight the ceiling; no
    STOP-and-report needed.
    **S3 — the content-minimum trap, correctly re-diagnosed.** The
    brief's own prose named `page-pin`; empirically that was already
    fine. The real, reproducible trap lived in PORTED text cards
    instead — fixed there, judgment call disclosed in both code and
    harness rather than fixing where the words pointed and the bug
    wasn't. Plateau scrollbars added to the board canvas.
    **S4 — drag friction root-caused.** Missing early
    `setPointerCapture`: the old code only captured once the 6px drag
    threshold was crossed, leaving a real gap where a fast genuine
    drag's move/up events could route away from the canvas entirely.
    Fixed by capturing on the first pointerdown. Overlap was already
    permitted; a quiet layer-order icon added on selected overlapping
    cards.
    **S5 — the pin.** The dead handle-double-click gesture removed
    whole; a new olive pin-circle drag-and-release mints a thread in
    one continuous motion. Connections footer + its own toggle
    (`board-meta.footerOn`, riding the same zero-schema precedent as
    `canvasW`/`canvasH`).
    **S6 — asterisks, diagnosed not assumed.** Reveal-adjacent-to-
    caret chosen over hide-always after a real live finding:
    `display:none`/`visibility:hidden` on markers would have silently
    corrupted storage, since the popup's own `onInput` reads
    `Element.innerText`, which excludes both. Markers stay real
    characters, `font-size:0` when not adjacent to the caret.
    **S7 — the em dash, two real defects found and fixed.** (1) Native
    undo (`execCommand('undo')` AND a real Ctrl/Cmd+Z) turned out not
    to work AT ALL in either editor — both rewrite their entire
    contenteditable's `innerHTML` on every input, invalidating
    Chromium's own undo manager, a pre-existing architectural
    condition this ticket doesn't fix wholesale but disclosed plainly;
    a purpose-built one-step undo shim delivers the felt result
    honestly instead. (2) the post-substitution caret landed short of
    the untouched trailing space — fixed by computing the target
    position directly rather than trusting the post-`execCommand` DOM
    caret. Ships on Draft + the card popup only; Journal/Free Write's
    incompatible undo models are out of this ticket's scope,
    disclosed not silently dropped.
    **S8 — hover-restore, a SECOND real defect invisible to FX4's own
    four-cycle synthetic proof.** Reproduced with genuinely trusted
    CDP `Input.dispatchMouseEvent` (new `mouseMove`/`mouseDown`/
    `mouseUp` harness primitives — `isTrusted:true`, independently
    confirmed by the review, not synthetic `PointerEvent` dressed up).
    A real hand's natural jitter at an edge repeatedly crosses the
    strict `EDGE_PX` boundary, instantly cancelling the dwell every
    time — fixed with a short leave-grace window. FX4's own multi-
    cycle fix re-verified correct under real events, untouched.
    **S10 — the paper re-centers.** Strip pulled out of the grid into
    `position:absolute` (flush at screen x=0); the grid drops the
    strip's own column and regains true `margin:0 auto` centering.
    This exposed and required fixing a real regression in the
    sliver's own `--sliver-margin` formula (its "adjacent grid
    column" assumption broke) — caught by `fx2.mjs`'s own
    **pre-existing** floor check, not guessed, not a new assertion
    written to paper over it.
    **S9 — `fx5.mjs`, 65→66 checks after review, park sweep across 5
    files** (`fx4.mjs`'s whole S6 handle-gesture section parks with a
    live successor in `fx5.mjs`'s own S5; `ab4.mjs`'s second-
    generation park of the same lineage parks a third time —
    generations accrete, the house pattern; `cd1.mjs`'s symmetric-
    margins check gains a generation-2 note, S10's symmetry is a
    successor, not a restoration; `fx3.mjs`'s engage-line-count fence
    bumps 6→7, the documented consequence of S1's rewrite; `j4.mjs`'s
    port-then-edit flow gets a one-line gesture swap, old sequence
    parked). `fx2.mjs`/`cd2.mjs` needed zero check changes — confirmed
    by the review, not assumed.
    **Independent review — GREEN, with two real defects found and
    fixed at the root, neither trivial.** (1) `useTypewriterFade.ts`:
    S1's new multi-line catch-up chains a second
    `requestAnimationFrame` call OUTSIDE the tracked `raf` variable
    the effect's own cleanup actually cancels — a big catch-up
    interrupted mid-chain by a live writing-settings toggle (the
    scroll container persists across that, it's not a full unmount)
    leaves a zombie frame chain still nudging `scrollTop` on the
    still-mounted box: precisely the "page moves on its own" class of
    bug this entire ticket exists to eliminate. Fixed by folding the
    chained frame into the same tracked variable; behavior confirmed
    unchanged (identical 29px `maxStep` before/after). (2) `fx5.mjs`'s
    own S5 pin-drag gesture ran on synthetic `PointerEvent` dispatch
    only, sharing the identical early-`setPointerCapture` mechanism
    S4(a) itself proved needs a genuinely trusted press to mean
    anything — yet carried **zero fidelity-gap disclosure**, a direct,
    undisclosed violation of this ticket's own standing discipline
    (the brief's own S9 text names this exact gap by name). Fixed for
    real, not just disclosed: a genuinely trusted CDP press-drag-
    release proof added (mirroring S4(a)/S8's own technique), plus
    honest disclosure comments on the remaining synthetic branch-logic
    checks.
    **The review independently re-derived every load-bearing claim
    rather than trusting the build's report**: zero-schema confirmed
    via an empty `git diff` on `apps/server/` plus a full grep for any
    new box `kind:` literal (none); the A4 park-sweep audited against
    every harness file for anything FX5 could have falsified outside
    the declared sweep (found two benign non-issues, confirmed by
    hand, not just re-asserted); ink-coordinate safety confirmed via a
    byte-identical diff on `JournalEntry.tsx`/`store/ink.ts` plus the
    review's own live re-proof of `useTypewriterFade.ts`'s byte-truth
    fixture, run twice; the S10 composition law re-measured live at
    1280px/2200px/the 1100px floor, independently, not re-read from
    the build's own numbers.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 21 harness files (added `fx5.mjs`,
    65 checks) green under both `HARNESS_PARKED` settings, re-run
    after every commit. Review: same suite, from a genuinely clean
    worktree install, 21/21 green both settings (one transient
    `w1.mjs` CDP-connection flake on its first sweep — "CDP page
    target never appeared" — confirmed non-reproducible, clean on
    immediate retry and clean again on both full post-fix sweeps;
    infra flake, not a code defect). CC's own third independent pass
    on the fast-forwarded `main`: `tsc` (desktop+server) + `build:web`
    clean, full 21-file/42-run suite green, zero discrepancies against
    both prior runs.
    **Judgment calls disclosed, all independently reviewed, none
    dissented:** S3's fix landing on ported-text cards rather than
    literal `page-pin` (the words vs. the reproducible bug); S7's
    em-dash scope (Draft + card popup only, Journal/Free Write's
    incompatible undo models out of scope); S7's custom undo shim (a
    pre-existing native-undo architectural gap this ticket doesn't
    fix wholesale, disclosed not hidden); S4(a)'s fidelity gap (a
    trusted CDP press proves the fix; only Nick's own hand proves a
    fast real mouse drag never breaks); the CSS commit-granularity
    compromise (S1/S3/S4/S5/S6/S10 hunks interleaved by line range,
    committed as one clearly-labeled commit after CRLF-blocked
    patch-splitting attempts, every other file cleanly per-slice).
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule — no separate Nick's-go needed for the merge
    itself). Fast-forwarded `main` to `9c26de5` (no divergence, clean
    fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, two advisories, 2026-07-19**
    (`docs/wrizo-alpha/fx5-review-fable.md`). Census at the two widest
    commits, record depth via the build's own diagnostic commit
    messages, the independent review's two real catches, and CC's own
    clean third pass (42/42). **The standing trusted-gesture
    discipline vindicated three ways**, all ENDORSED: S8's true root
    cause (edge-jitter cancelling the dwell clock) was physically
    invisible to synthetic dispatch, found only under trusted CDP
    events; the review caught the build violating the ticket's OWN
    discipline (S5's pin-drag proven synthetic-only, undisclosed) and
    closed it with a genuinely trusted proof, not just a disclosure
    note; the review's second catch (the untracked rAF chain) is
    exactly the chartered "page moves on its own" defect class.
    Rulings: the olive pin circle's square-corners exception
    RATIFIED with provenance (Nick's own words specified it); S6's
    reveal-adjacent-to-caret RATIFIED with its documented spec reason;
    S7's em-dash undo shim ACCEPTED as disclosed; S4's pointer-capture
    root cause and the S10-regression catch (by `fx2.mjs`'s own
    pre-existing floor check) both confirmed the estate working as
    designed. **A1 KEPT, Nick's own word, 2026-07-19:** cards
    are not meant to be the place where writers do a lot of text
    editing — the popup's own reveal-adjacent-to-caret asterisk
    treatment and the editing model both stand as built; ported cards
    keep their double-click travel to the source page, "Edit copy"
    edits the card itself. Not a defect, not reopened. **A2
    commissioned → FX6:** undo/redo, real Ctrl/Cmd+Z, restored in
    Draft's free editor and the card popup ("Yeah, let's fix this.
    It's only typewriter mode where I want to limit how much
    backspacing/deletion occurs" — forward-lock's own deletion
    discipline stays untouched everywhere it applies; full undo
    freedom is the goal everywhere else).
    **Deployed — 2026-07-19**, Nick's word, in the same two-ticket
    deploy as item 34 above: `railway up` on `main` @ `6759777`
    (deployment `39bbe424`, SUCCESS), confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). Manifest `1dc0003..HEAD`
    = TU1 + FX5 + docs riders only, independently re-enumerated
    before shipping. **Close pending Nick's own device-look sitting**
    against the brief's own Definition of Done (per-line engage
    motion, scroll freedom, the glow arriving by mid-goal, free card
    movement + overlap + the layer icon, the olive-pin thread gesture,
    no visible asterisks, the em dash, hover-restore on real hardware,
    the recentered paper).
36. **COMMITTEE MATERIAL — Boards-all-the-way-down architecture.**
    **RECORDED, NOT RATIFIED — 2026-07-19.** Nick, verbatim: "The
    entire Journal module and experience is totally broken. Needs to
    be retired until we fix it based on the new Page is Primary
    architecture. The Journal should essentially just be a pre-built
    custom Board that gets its own default menu link. Projects are
    really now just Boards that have a pre-built set of cards to be
    filled out by the user once they are walked through their
    structure options. The Shelf is just a Board where anything that
    hasn't been connected to another Board is placed for later
    organization. We also need a Trash option that clears unwanted
    docs but keeps them in memory for later retrieval. The big
    difference between Drawers and Boards, then, is that Drawers can
    contain multiple Boards. I'm not sure if we want to require all
    Pages and research docs to be added to a Board to be in a Drawer,
    but my lean is that when Drawers is selected, the cascading menu
    shows large thumbnails with each Board and doc listed, with the
    last-opened Board or doc displaying where our home Page is
    anchored. The committees review this before we go further with it
    in a future build." **NOTHING BUILDS from this block until the
    committee pass lands and Nick ratifies it.** Absorbs and
    supersedes the standalone Trash queue item once ratified (the
    Trash build is now architecture-linked, not a free-standing
    ticket — see item 33's own prior QUEUED note). Absorbs the
    Journal-retirement question raised across several prior sittings
    (items 25's committee docket addition, item 32).
    **RATIFIED — 2026-07-19.** The Boards committee pass
    (`docs/wrizo-alpha/boards-committee-pass.md`, committed) resolved
    the collapse-vs-dress fork the note above implies: system Boards
    (Journal/Shelf/Trash/eventually Projects) carry membership DERIVED
    from the existing stored truth (origin/deletedAt/projectId, A2
    untouched) while arrangement stays authored — zero data
    migration, chosen unanimously over a literal-collapse migration
    path. R1/R3/R4/R5/R7 approved, A16/A17/A18 ratified, B1–B3
    confirmed as phases (Journal+Trash → Shelf+Drawers → Projects as
    seeded Boards). R2's own concern and R6's own wizard-clarification
    (both Nick's verbatim words, with dispositions) are recorded in
    full at `docs/wrizo-alpha/boards-ratification-record.md`
    (committed) — R6 in particular stands as B3's own binding design
    authority once that brief is written, nothing builds from it
    before then. First phase's brief committed, queued: see item 38
    (B1).
    **B3's own material grows — "Card Deck," Nick's coinage, recorded
    2026-07-20.** A deck is a preset: an optional wizard that narrows
    choices, then deals a pre-built, fully-editable card set onto a
    board in the writer's drawer — B3's true shape is now the deck
    ENGINE plus the deck LIBRARY, not a bespoke wizard-per-project
    idea. `docs/wrizo-alpha/card-deck-catalog.md` committed (the
    Experts' pass): five structural laws binding every deck (ordinary,
    fully-editable cards, nothing locked or mandatory; the blank board
    stays first-class, decks are invitations never homework,
    anti-solicitation absolute; wizards obey the already-ratified R6
    rulings verbatim; deck DEFINITIONS are static zero-schema app
    data, DEALING one is ordinary card creation owing nothing to its
    template afterward; every deck names its own few, concrete,
    clickable narrowing choices) plus 21 catalogued decks across seven
    writer-population rooms (Fiction, the Speculative Annex, Screen,
    the Academy, the Business Desk, the Newsroom) and a v1 ship-set
    recommendation (six flagships, one per room, Character Study as a
    budget-permitting seventh). **NOTHING BUILDS from the catalog
    until B3's own brief** — Nick ratifies the ship set, cuts, or
    promotes at that brief, not here.
37. **FX6 — Undo and the Doors.** **BRIEF COMMITTED — 2026-07-19.**
    `docs/wrizo-alpha/fx6-undo-and-doors-brief.md`. Authority: item
    35's own A2 commissioning (real undo/redo in Draft's free editor
    and the card popup, forward-lock's deletion discipline explicitly
    untouched — "it's only typewriter mode where I want to limit how
    much backspacing/deletion occurs"); a newly recorded New Page
    discoverability gap, Nick's own word: "I often have no idea how
    to simply start a New Page from either the Page menu or the
    Board"; two one-line advisories carried since AB4's review
    (self-pin, the truthful no-projects empty-state line). Zero
    schema, merge pre-authorized; Fable reviews post-merge.
    **S1 — undo restored**, root cause already diagnosed at FX5's own
    S7 (both editors rewrite contenteditable innerHTML wholesale on
    every input, invalidating the browser's native undo stack); CC
    chooses empirically between a surgical-update path and an
    app-level snapshot stack, disclosed. The scope law is load-bearing
    and must not drift: forward-lock's own deletion discipline stays
    exactly as it is everywhere it applies — undo restoration is
    everywhere ELSE. **S2 — the doors**: an unmissable New Page action
    at the cascade's Page section head, a board-side "New page card"
    that creates a real page AND pins it in one act, quiet empty-state
    pointers — doorknobs only, no architecture movement (that's
    item 36's own gate). **S3 — the AB4 fold sweep**: self-pin closed
    at both ends, the empty-state line corrected to "create a project
    first." **S4 — `fx6.mjs`**, keyboard claims held to the same
    trusted-event discipline FX5 established for pointer gestures.
    Report = push (merge pre-authorized).
    **Build starting — 2026-07-19**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-FX5 `main`.
    **First attempt ORPHANED, not a loop — root-caused, not
    guessed.** The build sub-agent's own transcript shows its last
    event was `[Request interrupted by user]` mid-file-read, at the
    exact moment an unrelated interrupt in this session's own
    foreground turn landed (the B1 brief paste) — the same signal
    appears to have killed the background agent's turn too, and
    nothing ever resumed it; the workflow's own journal recorded only
    a `started` event, no result, no review phase ever begun. Found
    via direct transcript/timestamp inspection (10 hours of silence
    on a file that should have been growing), not assumed. Its
    partial S1 work (real, uncommitted) was checkpoint-committed and
    the branch renamed to `fx6-undo-and-doors-wip-interrupted-
    2026-07-19` for reference only — explicitly unverified, not
    trusted — then the worktree freed and a fresh build+review
    launched with one process change: agents now commit incrementally
    per slice, not in one final commit, so a future interruption loses
    less.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S4 on `fx6-undo-and-doors` off `main` @
    `ee3907d`, in its own worktree. S0's own ledger work was already
    done directly on `main` before the build started.
    **S1 — real undo/redo, mechanism chosen empirically and
    disclosed.** Both surfaces rewrite their contenteditable's
    innerHTML wholesale on every input (required for live markdown-
    mark decoration), confirmed live to invalidate Chromium's own
    undo manager — the same root cause FX5 S7 diagnosed. Chose an
    app-level coalesced snapshot stack (`store/textUndo.ts`) over
    surgical DOM updates: the decoration engine has no cheap way to
    know which spans elsewhere in the line an arbitrary keystroke
    might affect, so "surgical" would mean rewriting it into an
    incremental diff engine — larger and riskier than this ticket's
    own invariant that Draft's dimmed-syntax register stays untouched.
    Coalescing granularity (word-ish steps, CC's own disclosed call):
    one real defect found and fixed during the build itself — the
    boundary character completing a word was initially recorded as
    its own isolated step rather than merging into the word it
    closed, caught via the harness's own parked proof, fixed by
    exempting that transition. The em-dash shim (FX5's own S7) is
    retired entirely — the substitution now records as two ordinary
    undo steps, so one Ctrl+Z reverts just the dash AND further walks
    back keep working, unlike the old shim's narrower "immediately
    after" case.
    **THE SCOPE LAW — verified live, not assumed, by both agents
    independently.** Every changed hunk in `ForwardOnlyEditor.tsx`
    confirmed by line range to fall strictly inside the `drafting`
    branch; `store/forwardOnly.ts`/`store/forwardLock.ts` carry zero
    diff, confirmed with an explicit stat. Live-exercised with a
    genuinely trusted CDP Ctrl+Z inside forward-locked Free Write:
    complete no-op, text byte-for-byte unchanged, backspace still
    strikes rather than erasing.
    **S2 — the doors.** An unmissable "New Page" button heads the
    cascade's Page section, routing through the same `
    createLooseHomePage()` door Arrival's own "Start writing" already
    uses (a judgment call: the build first reached for the journal-
    homed helper matching an unrelated pre-existing button, then
    reconsidered — `/page/:id` is the consistent landing surface for
    a project/board-adjacent "just give me a page" ask, not
    `/journal/:id`). The board sliver gains "New page card" — creates
    a page through the same door and pins it in one act. Two quiet
    one-line empty-state pointers added. **Park sweep required and
    done:** a third sliver tool falsified three pre-existing
    exact-tool-count assertions, parked per A4 with live successors
    (`ab4.mjs`'s park reaches generation-3, `fx4.mjs`'s reaches
    generation-2 — the accretion precedent holding).
    **S3 — self-pin closed at both ends** (the Pin sheet's leaf filter
    AND `pinPageToBoard` itself); the no-projects empty-state line
    corrected to "create a project first," matching AB4's own review
    A2 wording exactly.
    **S4 — `fx6.mjs`, 39 checks.** `runtime-verify.mjs` permanently
    gained `app.keyCombo`, a genuinely trusted CDP modifier-key
    dispatch, closing FX5 S7's own disclosed keyboard-fidelity gap
    rather than repeating it. Two harness-only defects found and fixed
    while building it (not product bugs): a raw DOM node returned from
    an eval crashed CDP's own serializer; and a board fixture seeded
    while a page was still mounted got silently clobbered by that
    page's own unmount flush — this project's own documented
    seed-then-reload/flushNow race (see memory), fixed by seeding from
    the Desk, matching every other fixture's already-proven pattern.
    **Independent review — GREEN, no genuine defects, nothing
    changed on the branch.** One process note: since the build's own
    worktree still held the branch checkout (ONE CHECKOUT PER AGENT),
    the review created a differently-named local branch tracking the
    same pushed tip to work in its own isolated worktree without
    colliding — same content, same commit, no shortcut taken. The
    review independently re-verified everything by diff and live
    exercise rather than trusting prose: zero-schema (explicit diff
    on `apps/server`, zero lines), the full park-sweep's generation
    numbering, THE SCOPE LAW by line-range diff inspection PLUS a
    live trusted Ctrl+Z inside forward-lock, the em-dash fold by
    hand-tracing the coalescing state machine AND exercising it live
    (substitute → undo → redo → walk further back, all correct), both
    self-pin guards via a UI-level check AND a direct function call
    bypassing the UI entirely, and confirmed every keyboard claim in
    `fx6.mjs` genuinely uses the new trusted dispatch (none synthetic
    except one deliberate, correctly-disclosed exception testing the
    old shim's own retirement). **One candidate finding chased down
    and honestly retracted**: a bare-literal string in
    `PinToBoardSheet.tsx` looked like a deskLexicon-discipline miss
    until the review checked the actual file and found it already
    uses bare literals + `themeLexicon` throughout, never importing
    deskLexicon at all — FX6's edit matches that file's own
    pre-existing local convention; the four genuinely new strings
    elsewhere correctly do route through deskLexicon.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 22 harness files (new `fx6.mjs`, 39
    checks) green under both `HARNESS_PARKED` settings. Review: same
    suite, from a genuinely clean install, 22/22 green both settings,
    zero failures. CC's own third independent pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean.
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule). Fast-forwarded `main` to `6bdea06` (no divergence,
    clean fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, one advisory — 2026-07-20**
    (`docs/wrizo-alpha/fx6-review-fable.md`). Record depth on the
    slice messages, the independent review's own zero-defect result
    (the first fully clean FX-arc review since TU1), and the full
    suite green both PARKED settings. **The interrupted-then-recovered
    build ratified as standing process** — the wedged-session
    discipline applied correctly, on the record so it stays the
    standard. Seven rulings: the undo mechanism (path b) RATIFIED with
    its documented reasoning; the scope law held at three independent
    levels (diff, live trusted proof, existing asserts); the em-dash
    fold ENDORSED as landing better than specified (generalizes past
    "immediately after," unlike the old shim); **a new lane-law
    precedent named**: at-rest affordances stay OUT of the brass lane
    (nothing-orange-at-rest holds) — a persistent door like "New Page"
    wears olive-as-contrast, now the standing answer for every future
    resting action-door; the `window.wrizoPinPageToBoard` inspection
    seam ACCEPTED as established pattern; `app.keyCombo` confirmed to
    close FX5's own disclosed keyboard-fidelity gap with no residual
    left; the `ab4.mjs` generation-3 park and the review's own
    retracted candidate finding both ENDORSED as the accretion
    precedent and anti-false-positive honesty working as designed.
    **A1 answered — no fold needed.** `store/textUndo.ts` already caps
    stack depth: `MAX_DEPTH = 500`, enforced via `past.shift()` on
    overflow (the build's own code, confirmed by direct read, not
    asked-and-assumed); `future` is bounded by construction since it's
    always cleared on a fresh edit, so it can never exceed `past`'s own
    momentary size. Cap already shipped; the advisory closes as
    already-satisfied, not as a new fold.
    **Deploy state, for Nick's word whenever he gives it:** manifest
    since `6759777` = FX6 alone (one code ticket) + docs riders,
    enumerated and ready. FX6 may ride alone or share a deploy with B1
    later — Nick's call, whichever ships gets its own manifest
    enumeration at the time.
    **Close conditions:** (1) review on disk — met; (2) B1 unblocked
    by this review — met, see item 38; (3) deploy on Nick's word —
    **MET, see below**; (4) Nick's own FX6 DoD script — remains open.
    **Deployed — 2026-07-20**, Nick's word ("deploy everything that's
    ready to go live"), in the same two-ticket deploy as item 38
    below: manifest `6759777..HEAD` independently re-enumerated by CC
    before shipping (FX6 + B1 code commits, docs riders only, matching
    Fable's own manifest exactly) — `railway up` on `main` @
    `5a2babc` (deployment `fca07345`, SUCCESS), confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). **Item 37 stays open
    — Nick's own FX6 DoD script remains the sole condition.**
38. **B1 — the Journal Reborn (+ the Trash).** **BRIEF COMMITTED —
    2026-07-19.** `docs/wrizo-alpha/b1-journal-reborn-brief.md`.
    **UNBLOCKED — 2026-07-20**, Fable's FX6 review (item 37) was
    B1's own gate; met. **Build starting**, via a Workflow-
    orchestrated build+review pipeline (ultracode), off post-FX6
    `main`.
    **Authority — the Boards committee pass**
    (`docs/wrizo-alpha/boards-committee-pass.md`, committed same day):
    a double-pass triggered by item 36's own architecture note,
    resolving the fork between two ways to make "Journal is a Board"
    true. **R2 — the dress, not the collapse** (the Architects'
    unanimous choice): homes/origins/projectId/deletedAt stay the
    stored truth, A2's provenance law untouched; system Boards are
    REAL board pages whose card sets are DERIVED from that truth
    while arrangement stays authored — zero data migration, existing
    pages appear correctly on day one. **R1** names the Board the
    only arrangement primitive (Journal/Shelf/Trash/Projects all
    become system Boards wearing dresses; Drawers contain Boards).
    **R3** — membership is never required; keeping is never
    conditioned on filing. **R4** — Trash is a quiet move to a
    derived board (existing `deletedAt`, unsurfaced today), the
    Delete-is-Delete anti-nag core preserved, only finality amended;
    card/thread trash stays out of v1. **R5** — Drawers become the
    large-thumbnail shelf of Boards (a canon amendment, not a silent
    restyle), scoped against file-manager drift by keeping thumbnails
    to the cascade's reach-range panel only. **R6** — Projects
    convergence (seeded Boards + the wizard-cards commission) is one
    design landing with the P-arc walkthrough as the last, biggest
    phase (B3) — done once, done right, explicitly not rushed for the
    onboarding story. **R7** — phase order serves Nick's own named
    constraint (blocked constantly by the broken Journal; each phase
    must leave the app more usable than before it), Journal-first.
    **A16 (the Arrangement Law), A17 (the Drawer Law), A18 (the Trash
    Amendment)** — full text in the committee-pass doc itself, quoted
    in this brief's own preamble. **Five named tensions carried
    honestly, not resolved by fiat** (T1 a future "remove from
    Journal Board" gesture is design work, not plumbing; T2 whether
    hand-removal of system cards exists at all in v1 — arrange-only
    for now, Nick may overrule at the device; T3 the Shelf's own
    "unconnected" definition, ruled at B2's own brief; T4 the
    Board/Drawer/Shelf naming-legibility lexicon pass, before B2's
    chrome; T5 first-run's no-resume fallback re-pointing, landing in
    B1 itself). **Authority gap CLOSED — 2026-07-19**, superseding
    the earlier flag: `docs/wrizo-alpha/boards-ratification-record.md`
    (committed) carries Nick's R2 concern and R6 wizard rulings
    verbatim, with dispositions. R2's concern (a strong-bones worry,
    not a data-safety one — dev data explicitly disposable) SUSTAINED
    the dress on merits alone, independent of the migration-cost
    argument; three concrete waiver effects recorded there, including
    the vestigial `shelved` flag's own retirement landing at B2. R6's
    wizard clarification is APPROVED AS MODIFIED and stands as **B3's
    own binding design authority** once that brief is written — opt-in
    pop-out wizard, click-first/text-never-required, ends on a Board
    with plan cards laid out, a "Start Here" mark on the first card
    that vanishes on any card's completion (an open definition,
    flagged for B3's own brief to rule). Nothing builds from R6 before
    B3. The flag-not-invent call itself is noted in the record as
    correct.
    **The mechanism (S1-S6), not yet built:** system Boards as real
    board pages, find-or-create idempotent, marked by a new optional
    `systemKind: 'journal' | 'trash'` field on the existing
    `board-meta` element (the FX4 board-meta precedent, zero schema);
    derived-membership reconcile on mount (idempotent, authored
    positions never moved); arrange-never-author on system boards (no
    Add, inert Delete on derived cards, unpinnable); the Trash
    surfaced with a quiet Restore action, permanent purge explicitly
    out of v1; the old Journal module surface retired the same day
    its replacement ships (retirement-by-replacement, capture flow
    byte-identical, no 404 hole); `b1.mjs`. Zero schema expected,
    STOP-and-report the moment any slice wants a column; merge
    pre-authorized; Fable reviews post-merge.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-19.** Built S1-S6 on `b1-journal-reborn` off `main` @
    `7c5124e`, in its own worktree. **Zero schema — confirmed, not
    just claimed**: every slice lived in `origin` (a new `'system'`
    value), the existing `board-meta` element (`systemKind:
    'journal'|'trash'`), and `deletedAt`. No STOP-and-report
    triggered.
    **S1 — a latent blind spot found and closed before it could
    bite.** Every board pre-B1 always carried a `projectId`, so
    `inJournalView`'s own legacy fallback never had to consider a
    project-less board — a system Journal Board without an exclusive
    origin would have wrongly satisfied that fallback and appeared
    inside its own derivation. Closed with the new `origin:'system'`
    value; `getNotebookPages()` and `getResumeTarget()` hardened
    against the same "first board with no project" blind-spot class
    on the same pass.
    **S2 — the reconcile reuses the canonical membership rule**
    (`getJournalPages()`), not a re-derived one; returns `null` when
    nothing changed, so idempotence is checkable, not just asserted.
    Wired to `persistence.subscribe`, so a capture/delete/restore
    anywhere reaches whichever system board is open, live.
    **S3 — arrange-never-author, with a gap closed pre-review.** The
    sliver's Add is genuinely absent (not disabled — an optional
    prop, not a conditional render). While writing the harness, the
    build itself found and closed a real gap: `pinPageToBoard` had no
    code-level guard against pinning a system board onto a real
    board (only the UI path was closed) — fixed to match FX6's own
    self-pin precedent, belt-and-suspenders.
    **S4 — Trash surfaced, deletion mechanism untouched.**
    `restoreEntry()` clears only `deletedAt`. One deliberate exception
    to this file's deletion-filtered reads
    (`getJournalEntryIncludingDeleted()`) lets Trash cards show real
    titles instead of "Missing page." Restore is a plain button, no
    fidelity claim needed — disclosed explicitly rather than silently
    assumed.
    **S5 — the room retired, zero 404 holes, confirmed by direct
    enumeration.** `pages/Journal.tsx` deleted outright; `/journal`
    now resolves through a find-or-create gate. Every pre-existing
    caller (`DeskRail`, `JournalEntry`'s back-links, Arrival's
    no-resume fallback, every writing surface's own `backTo`) needed
    **zero changes** — they all already navigated to the literal
    string `'/journal'`. New stable `/trash` route added alongside.
    **Three real defects surfaced by the retirement itself, found and
    fixed, not papered over:** (1) a MOVES-verb toast that rode router
    history state into the now-deleted list surface, silently dropped
    — rewired through the new gate's own one-shot consume-and-replace
    effect; (2) the way-back return chip silently suppressed on
    arrival at the Journal Board (`isWritingRoute()` had matched every
    `/page/:id` unconditionally, `/journal` used to be exempt) — fix
    scoped to system boards only; (3) fixing THAT exposed a SECOND,
    previously-unreachable race — `useWayBack`'s unconditional
    capture-on-unmount would now clobber the very slot the visible
    chip depends on — closed with a new `participatesInWayBack` flag,
    defaulted true so every other caller is unaffected, system boards
    alone opt out. A large harness-fixture repair followed across
    `ab3`/`cd1`/`cd2`/`fx1`/`fx6`/`j4`/`j5`/`m1`/`th1`/`th2`/`w1`/`w2`
    — the old Journal list surface's retirement rippling exactly as
    far as it should and no further.
    **S6 — `b1.mjs`**, 51 checks at build time, growing to 53 after
    the review's own fix (below).
    **A16's own law — proven two ways, not just asserted.** Code-level:
    `reconcileSystemBoard` only ever adds/removes `page-pin` boxes,
    never touches `origin`/`projectId`/`deletedAt`; `restoreEntry`
    destructures away only `deletedAt`. Live: a sibling card's exact
    authored `x/y/w/h` survives idempotent re-runs, a delete, a
    Trash-side restore, and a full round trip byte-for-byte.
    **Independent review — GREEN, one genuine defect found and fixed,
    not caught by the build's own harness.** `describePageHome` never
    learned about `origin:'system'` — both system Boards fell through
    its generic else-branch and reported **"In the Journal"** as their
    own home, flatly false for the Trash Board (directly contradicts
    S1's own "no project home") and self-referential nonsense for the
    Journal Board itself. Verified live before fixing (stood on the
    Trash Board, opened its own Page panel, saw the false label) —
    exactly the same "first thing with no project" blind-spot class
    the build had already found and closed elsewhere, missed here
    because the harness asserted Pin/Move-Copy inertness but never the
    label text. Fixed at the `BoardEditor.tsx` call site only (every
    ordinary page's home label stays byte-identical), two new
    deskLexicon terms, two new regression checks added.
    **The review independently re-derived every load-bearing claim**,
    including writing and running its OWN throwaway harness script
    (not reusing `b1.mjs`) that performed a genuinely trusted
    pointerdown→multi-step-pointermove→pointerup drag, a real
    resize-handle drag, and a real overlap, then reloaded — 9/9
    checks confirmed the underlying pages' full record stayed
    byte-identical while the arrangement itself genuinely persisted,
    so the "untouched" claim is meaningful, not vacuous. The retired
    room's absence was confirmed by enumerating every `'/journal'`
    call site in the codebase by hand, not sampled — `DeskRail.tsx`,
    `JournalEntry.tsx`, `Spread.tsx`, `DrawersTree.tsx` confirmed as
    genuinely 0-diff files.
    **Judgment calls disclosed, none dissented:** Move/Copy made inert
    on a system board's own page face alongside Pin (the brief only
    named Pin; filing a system board into a project would break "no
    project home" the same way pinning would) — Port stays live,
    harmless (copies text only); no new page-delete UI added (the
    only pre-existing manual delete affordance, the Plan panel's
    board-delete, carries its own T4-ruled confirm dialog, left
    untouched as pre-existing, out-of-scope policy); legacy (<1100px)
    DeskRail gains no Trash item — reachable via the cascade or the
    new `/trash` URL only below the floor, a real reachability gap
    flagged rather than silently decided, following the standing
    "legacy chrome stays byte-identical" law.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 23 harness files (new `b1.mjs`)
    green under both `HARNESS_PARKED` settings. Review: same suite,
    from its own clean run, all green, `b1.mjs` at 53/53 post-fix.
    CC's own third independent pass on the fast-forwarded `main`:
    `tsc` (desktop+server) + `build:web` clean.
    **Merged — 2026-07-19** (zero-schema, merge pre-authorized per the
    standing rule). Fast-forwarded `main` to `0147d8b` (no divergence,
    clean fast-forward, zero conflicts), pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review. Manifest
    since `6759777` now also carries B1 (a second code ticket) plus
    docs riders, alongside FX6 — enumerate whichever ships when Nick's
    word arrives.
    **Fable's post-merge review landed and is committed — GREEN,
    required 0, one advisory — 2026-07-20**
    (`docs/wrizo-alpha/b1-review-fable.md`). **The first ticket judged
    under A16 itself**, and every one of the law's own load-bearing
    claims held under the strongest proof style this house has
    produced yet: arrangement-never-alters-truth proven TWICE (the
    build's own fixtures AND the review's from-scratch throwaway
    harness) — the skeptical second proof named as the standing
    A16-era review bar; idempotence proven the strong way (two mounts
    against unchanged truth, byte-identical, `null` returned when
    nothing changed); authored arrangement proven to survive the full
    delete→Trash→restore→Journal round trip byte-for-byte; arrange-
    never-author confirmed structurally absent (undefined handlers,
    not hidden buttons — the stronger form) rather than merely hidden;
    capture confirmed byte-identical via 0-diff files, not sampled.
    Five rulings of record: `origin:'system'` RATIFIED as a vocabulary
    addition, not a schema change (CHECK-free column, A2's
    null-grandfather untouched); **the three-bug chain RATIFIED
    in-scope** — fix-reveals-the-next, all three chased to root,
    existing only because nothing had ever made the Journal Board a
    real destination before; **the review's own defect AND its
    method both matter** — "verification by inhabitation, not
    inspection" named as the standard (the reviewer stood on the
    Trash Board and watched the false home-label render before
    fixing it); retirement-by-replacement executed with zero blast
    radius, the `/trash` route accepted as consistent with the
    letter and spirit both; the park sweep at its largest scale yet
    (nine harness files), including `th2`'s own "canonical /journal"
    claim correctly parked (retirement means the URL deliberately no
    longer stays canonical). **A1 accepted with eyes open**: the
    sub-1100px Trash reachability gap rides under the standing
    legacy-chrome-byte-identical rule until that regime's own
    reckoning or B2's chrome pass — no writer loses data, only a
    door, on one device class, temporarily. **No fold needed.**
    **B1's build side is closed.**
    **Deployed — 2026-07-20**, Nick's word ("deploy everything that's
    ready to go live"), together with item 37 (FX6) in one deploy:
    manifest `6759777..HEAD` independently re-enumerated by CC before
    shipping — FX6 + B1 code commits, docs riders only, matching
    Fable's own manifest exactly, no unnamed code riders. `railway up`
    on `main` @ `5a2babc` (deployment `fca07345`, SUCCESS), confirmed
    live (`200` on `/healthz` and `/`, `401` on `/auth/me`). **Item 38
    stays open pending Nick's own DoD sitting** (both FX6's and B1's
    scripts). Next brief awaits Nick's one-word queue decision (B2,
    already authorized by the standing B1–B3 confirmation — or V1
    first, if he ratifies the second sitting's four points) — nothing
    builds until it arrives.
39. **B2 (v2) — the Shelf, the Drawers, and the Places.** **BRIEF
    COMMITTED — 2026-07-20.**
    `docs/wrizo-alpha/b2-shelf-and-drawers-brief-v2.md` is the build
    text; `docs/wrizo-alpha/b2-shelf-and-drawers-brief.md` (v1) stays
    on disk as record per v2's own supersession note. **No in-flight
    v1 work existed to reconcile** — checked directly (no
    `b2-shelf-and-drawers` branch, no commits referencing it anywhere
    in history) before concluding this, not assumed.
    **Nick's sketch, verbatim (2026-07-20):** "the Page pop-out offers
    kinds of pages (New Journal Entry, New Page, Add Page) with
    toggled lists of drawers and New Drawer; pages join locations by
    checkbox — a journal page shows Journal checked, plus checkable
    boards/drawers." T3 (the Shelf's law) carries forward unchanged
    from v1, Nick-ratified: not deleted, not a system board, no
    project home, not journal-homed, zero user-board pins — starring
    irrelevant; pinning anywhere removes it at next reconcile.
    **The Architects' rulings on Nick's sketch, recorded:** (1) the
    checkbox panel is TWO ZONES, not one — Boards as true many-of
    checkboxes (pin/unpin, pure membership) vs. Home as single-select
    (Journal / a Drawer / Loose) because the one-home law (A16, R2's
    own dress) is stored truth, not membership — changing home is the
    real filing act, carries its existing one-shot confirmation, and
    no checkbox ever deletes; (2) **DRAWER SUBSUMES PROJECT IN
    CHROME** — storage keeps `projectId` (zero schema), only the
    writer-facing word "Project" retires app-wide in favor of
    "Drawer"; B3's future wizard seeds "the plan board in your
    drawer"; (3) the Journal Board's own membership law PINNED:
    origin `'journal'` AND no project home — filing removes a page
    from the Journal Board, origin (provenance) never changes, new
    journal entries appear with no sorting, ever; (4) "Add Page" read
    as the Board's own Add flow gaining an existing-page picker, the
    Page pop-out staying creation-plus-Places — Nick may flip this
    reading by one line, it is not a hard gate.
    **Two pending one-word gates, both explicit in the brief's own
    text, neither builds past its gate without Nick's word:** the
    Drawer chrome word-swap (S6) — **GATED, build LAST, STOP before
    it and report with the swap staged but uncommitted if the word
    hasn't arrived by the time every other slice is done**; the
    "Add Page" reading (S5) is NOT gated the same way — it proceeds
    on the Architects' own reading above, flaggable/flippable by one
    line at Nick's word, not blocking the build.
    Eight slices: S1 the third system Board (Shelf, every B1
    system-board law by the same code paths, not copies); S2 the
    Shelf's own Pin-to-a-Board action; S3 the legacy `shelved` flag's
    retirement (column dormant, never dropped, effect honestly
    audited); S4 the Places panel (the two-zone checkbox truth,
    superseding the old Moves "Add to..." flow entirely — its store
    paths are exactly what Places calls, its harness checks park at
    A4); S5 the Page pop-out's reordered roster + the board-side
    Existing-page picker; S6 the gated word swap; S7 the Journal
    Board's derivation pinned to the amended law + the Drawers panel
    (A17's chrome, derived grouping, Shelf as the first tile,
    anti-file-manager rule binding, no counts/badges/timestamps
    anywhere); S8 `b2.mjs`. Zero schema expected, STOP-and-report if
    any slice wants a column; merge pre-authorized; Fable reviews
    post-merge; per-slice commits from the start (the FX6 practice).
    **Build starting — 2026-07-20**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B1-deploy `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-20.** Built S1-S5, S7-S8 on `b2-shelf-and-drawers` off
    `main` @ `5374694`, in its own worktree. S0's own ledger work was
    already done directly on `main` before the build started.
    **S6 (the gated word swap) — CC's own disclosed deviation from
    the brief's literal instruction, orchestrated before the build
    even started.** The brief said "STOP and report with the swap
    staged but uncommitted" if Nick's word hasn't arrived; since a
    build worktree gets removed after its own turn ends, uncommitted
    staged changes there would simply be LOST, defeating the brief's
    own intent. CC instructed the build to touch ZERO "Project"
    strings and instead produce a complete file-by-file, string-by-
    string inventory — nothing shipped, nothing lost either. **The
    inventory landed, and it's substantial**: every literal
    writer-facing "Project" occurrence across ~16 files enumerated by
    exact file and line (`CreateProject.tsx`, `ProjectHome.tsx`,
    `kindLabels.ts`'s three domain labels, `DrawersTree.tsx`,
    `Desk.tsx` — flagged unreachable/orphaned, `StructureWizard`/
    `StructureBoard`/`BeatWizard`'s "Back to project", `QuickSprint`'s
    save labels, `PinToBoardSheet`/`PortToBoardSheet`'s empty-state
    copy, `ImportDraft`, three `deskLexicon` `boardHomeLabel*` terms,
    `ModeStage`'s Progress selector, and `JournalEntry.tsx`'s own
    legacy (<1100px) scrap-routing block — plus the seven `/project/*`
    route paths, flagged as a URL-scheme decision, not resolved here).
    **Two genuine open questions surfaced for the eventual fold, not
    adjudicated here:** whether "Drawer" is also meant to replace
    `themeLexicon`'s existing "Binder" term (the brief's own S6 text
    names only "Project," never "Binder") — a real ambiguity the
    brief doesn't resolve; and a **naming collision** between this
    ticket's new "Drawer" (a chrome word for Project) and the
    codebase's own pre-existing `Drawer` stored entity (`types/
    index.ts`, `/drawers` route, `DrawersTree.tsx` — an older,
    different ontology, one level above binders) — both now coexist
    under the same English word for two different things, flagged
    plainly rather than silently glossed over.
    **Three real defects found and fixed by the build itself, root
    cause not symptom** (all downstream of the `shelved` flag's
    retirement, S3): `describePageHome` never learned to read
    un-filed `origin:'project'` pages truthfully — a pre-existing
    latent bug the old `shelved` flag had accidentally papered over,
    surfaced fresh once Places made un-filing reachable; `getNotebook
    Pages()`'s own filter read the flag directly rather than a truth
    predicate, so once `shelved` stopped being written the filter
    would have silently gone vacuous — fixed with T3's own predicate,
    correctly distinguishing "still journal-homed" from "now
    Shelf-eligible" in a way the flag never could; the same class of
    fix applied to `resume.ts`.
    **Judgment calls disclosed, one a genuine literal-text deviation
    made for engineering-risk reasons — worth Fable's own read:** (1)
    the brief's own words ("system boards stay OUT of the tile
    roster, except the Shelf") read strictly as "the Shelf loses its
    own strip door, becomes tile-only" — the build did NOT do that;
    it kept the Shelf's own door (an 8-item strip count is asserted
    as a magic number across five unrelated, pre-existing harness
    files) AND additionally gave the Shelf the first-tile presence
    functionally, judged as the lower-risk reading of an ambiguous
    clause rather than a misreading of a clear one — disclosed
    plainly, not silently decided; (2) JournalEntry's own legacy
    (<1100px) Add flow left completely untouched — "superseded by
    Places" can only mean the framed doorway, since legacy chrome
    never had Places at all; (3) "Loose" and "Journal" resolve to the
    exact same store act post-retirement (T3 derives which pool a
    just-un-filed page lands in, purely from its own origin — judged
    the more honest design than any button dictating the outcome);
    (4) Pin stays as its own separate verb alongside the new Places
    checkboxes, a disclosed real redundancy — the brief names only
    Move/Copy as superseded, not Pin, and retiring it would have
    broken pre-existing Pin coverage across three other harness files
    for no textual justification; (5) "last-opened" approximated by
    `updatedAt` (no dedicated opened-at stamp exists, and adding one
    is schema this ticket doesn't get to spend); (6) three commits
    grouped thematically rather than strictly one-per-slice (every
    commit independently green against the full suite regardless).
    **A16 — proof on every single Places action, not just believed.**
    `b2.mjs` carries an explicit before/after origin+projectId
    snapshot assertion on every Home-zone and Boards-zone action
    (New-Drawer create-and-file, Loose for both journal- and
    project-origin pages, Boards-zone check/uncheck, the Existing-page
    picker) — confirming precisely which stored field each act is and
    isn't allowed to touch, verified live, not read off a comment.
    **Independent review — GREEN, one genuine defect found and fixed,
    invisible to the build's own harness because it was a truthfulness
    bug in unrelated legacy UI, not a functional one.** `AddToSheet
    .tsx`'s own "File to Shelf" toast had gone quietly FALSE as a pure
    side effect of S3/S7's own changes: under the new pinned Journal
    law, its only two reachable call sites can only ever see
    journal-homed pages, which can never actually leave the Journal
    by that click alone anymore — the toast kept insisting the page
    "left the Journal" while the page provably never moved. The
    reviewer proved the no-op live before touching anything, then
    fixed the CLAIM rather than the control (removing the button
    outright would have left that menu's root with zero destinations
    in the harness's own zero-drawer fixture state — a worse,
    actionless dead end than a corrected message). Old assertions
    parked per A4 with live successors in `j5.mjs`.
    **The review independently re-derived A16 exhaustively**, not
    just at the sites the build's own report pointed to: grepped
    every `.origin =` and `.projectId =` mutation site in the entire
    `apps/desktop/src` tree (not just the diff) and confirmed exactly
    seven origin-assignment sites (all record-creation, never
    mutation) and exactly two projectId-mutation sites (both inside
    `setPageHome`, the only place it's ever touched) exist anywhere in
    the codebase. Spot-checked roughly a dozen of the build's own S6
    inventory rows directly against source by line number — all
    matched — then independently grepped all 34 files containing
    "Project" for anything the inventory might have missed; found
    nothing missing.
    **Disclosed incompleteness in the review's own final sweep,
    honestly reported by the reviewer itself:** its first full 24-file
    sweep (pre-fix, both settings) matched the build's own table
    exactly; its SECOND sweep (post-fix, meant to be the clean final
    proof) completed only 14 of 24 files before the reviewer's own
    time constraints cut it short — backed by a static blast-radius
    grep showing only `j5.mjs` could be touched by the fix, but not a
    completed live run of all 24. **CC's own third pass below closes
    this gap fully, independently, from a genuinely clean state.**
    **Full suite, CC's own independent pass, all 24 files, both
    settings, from a clean install on the fast-forwarded `main`:**
    `tsc` (desktop+server) clean, `build:web` clean, and the complete
    48-run harness suite **green, 48/48, zero failures** — closing the
    review's own disclosed sweep gap fully; zero discrepancies against
    both the build's and the review's own partial/full runs.
    **Merged — 2026-07-20** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema by the review's
    own `apps/server`/`packages` diff, empty). Fast-forwarded `main`
    to `33351d4` (no divergence, clean fast-forward, zero conflicts),
    pushed to `origin/main`.
    **Not deployed** — Fable's post-merge review hasn't landed yet;
    redeploy is Nick's call, as always, after that review.
    **Gate 1 CLEARED — 2026-07-20, Nick's word verbatim: "retire the
    word project as having any unique architectural purpose."** S6
    (the Drawer word swap) is now UNGATED — builds from the complete
    inventory the B2 build itself already produced, storage
    identifiers untouched as briefed. The Binder-vs-Drawer question
    (whether "Drawer" also retires `themeLexicon`'s existing "Binder"
    term) remains open — not resolved by this word, folded into the
    S6 build's own scope to judge and disclose.
    **Gate 2 CLEARED — the "Add Page" reading KEPT** as built: the
    Existing-page picker lands on the Board's own Add flow exactly as
    S5 already shipped it. No rebuild owed — a pure ratification of
    work already merged.
    **S6 folded, built, independently reviewed, merged, and pushed —
    2026-07-20.** Built on `b2-1-drawer-word-swap` off `main` @
    `b257344`, in its own worktree, using the B2 build agent's own
    inventory as its precise starting map (re-verified fresh via the
    same greps before executing, not assumed stale-safe). **A genuine
    omission the original inventory missed, found and fixed**:
    `CreateProject.tsx`'s own "Something else" note ("Opens the
    project home…") — caught via re-grep, not carried over blind.
    **Both open questions judged and disclosed, not silently
    resolved:** Q1 (Binder vs. Drawer) kept genuinely distinct where
    the older stored-Drawer entity's own name shares a screen with
    the generic word — those sites reuse the pre-existing `themeLexicon`
    "Binder" term instead of colliding with it, a literal reading of
    Nick's own word (he named "project" specifically); Q2
    (`DrawersTree.tsx`'s own "New Project" button, sitting directly
    under its own "+ New Drawer") swapped to "New Binder" to resolve
    the same-screen collision. Storage identifiers, `/project/*`
    routes (a disclosed, deliberate scope boundary — bigger structural
    call than the word itself commissioned, flagged for a future
    explicit ruling if routes are wanted too), the pre-existing Drawer
    stored-entity system, and `Desk.tsx`'s confirmed-still-unreachable
    "Begin project" were all left genuinely untouched, confirmed by
    re-grep, not assumed.
    **Independent review — GREEN, two real defects found and fixed,
    not theoretical.** The build's own Q1/Q2 reasoning was sound
    *per screen* but never traced *through navigation*: two buttons
    deliberately labeled "Binder" to avoid an on-screen collision each
    navigated one click later to a screen that unconditionally said
    "Drawer" for the exact same entity — deferring the same collision
    Q2 claimed to resolve, not preventing it. `DrawersTree.tsx`'s own
    "New Binder" row landed on `CreateProject.tsx` headlined "NEW
    DRAWER" regardless of context — fixed by threading the same
    `drawerId` query param the button already constructs, so Binder
    context now composes only when it applies. `QuickSprint.tsx`'s own
    "Save to/as Binder" landed on `ProjectHome.tsx`, which unconditionally
    read "Drawer" — but deeper investigation found the build's own
    collision justification for THIS one didn't actually hold (the
    breadcrumb it cited renders a proper noun, `drawer.name`, never
    the bare word "Drawer" — a proper noun beside a generic word
    doesn't collide, the same reason "My Documents" beside a "New
    Folder" button doesn't) — reverted to "Save to/as Drawer",
    restoring the majority, consistent convention rather than trading
    one mismatch for another. **Independent, load-bearing
    confirmation the gap was real, not theoretical**: fixing the
    second one broke `m1.mjs` — a harness file the ORIGINAL BUILD
    ITSELF had edited at this exact spot as "plumbing, not a park" —
    crashing outright on the stale button text, a third, independent
    signal the destination-mismatch was genuinely live.
    **Full suite, both passes, CC's own third independent run
    included.** Build: `tsc` (desktop+server) + `build:web` + selftest
    + all 25 harness files (new `b2-1.mjs`, 30→31 checks post-review)
    green under both `HARNESS_PARKED` settings. Review: same suite,
    its own clean run, 100% green, zero crashes. CC's own pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean,
    full 25-file/50-run suite **green, 50/50, zero failures** — zero
    discrepancies against both prior runs.
    **Merged — 2026-07-20** (zero-schema, matching B2's own standing
    authorization — pure chrome swap, storage untouched, confirmed by
    both agents independently). Fast-forwarded `main` to `4817ca1` (no
    divergence, clean fast-forward, zero conflicts), pushed to
    `origin/main`.
    **Fable's B2.1/S6 fold spot-check — DONE, GREEN, 2026-07-20.**
    Census-verified against `7bcebb7`: 15 files, all client chrome +
    lexicon, zero storage/route/server surface — the harness proof and
    the `m1.mjs` third-signal confirmation both noted. **Spot-check
    close condition satisfied.** Ruling recorded, now the standing
    disambiguation law for this whole naming space: "Binder" only
    where a bare "Drawer" would collide with another bare "Drawer" on
    one screen; a proper noun never collides with a generic. The
    `QuickSprint.tsx` reversion (Binder→Drawer, restoring the majority
    convention) SUSTAINED; the `/project/*` routes deferral
    acknowledged, still awaiting a future explicit ruling if Nick ever
    wants them renamed too.
    **Deployed — 2026-07-20**, Nick's word ("Deploy approved"),
    manifest independently re-enumerated by CC before shipping:
    `5a2babc..HEAD` = B2 + B2.1/S6 code commits, docs riders only —
    matching Fable's own manifest exactly (`main @ 13d4a62`), no
    unnamed code riders. `railway up` on `main` @ `13d4a62` (deployment
    `b101a08f`, SUCCESS), confirmed live (`200` on `/healthz` and `/`,
    `401` on `/auth/me`). **Item 39 closes on Nick's own device
    sitting** (the brief's own Definition of Done — Places panel,
    Journal-uncheck-on-file, the Shelf, Drawers, and the "Project"
    word gone from the desk) — remains open.
40. **B3 — Projects as Seeded Boards.** **BRIEF COMMITTED —
    2026-07-21.** `docs/wrizo-alpha/b3-seeded-boards-brief.md`.
    **Authority — item 36's own B3 pointer** (B3's true shape is the
    deck ENGINE plus the deck LIBRARY, Nick's "Card Deck" coinage,
    recorded 2026-07-20) **and the catalog**
    (`docs/wrizo-alpha/card-deck-catalog.md`, the Experts' pass: five
    structural laws, 21 catalogued decks, a v1 ship-set
    recommendation). The catalog is this brief's own material; the
    brief is the ticket — nothing beyond this brief builds from the
    catalog.
    **The ship-set decision, recorded as Fable's own call, explicitly
    Nick-vetoable at any point before merge:** seven decks ship, not
    six — the committee's own six flagships (Three-Act Structure,
    Worldbuilding, Feature Screenplay, Thesis/Dissertation, Grant
    Application, Feature Story) plus Character Study, promoted by
    Fable's own reasoning that once the engine exists a deck's
    marginal cost is a definition file, and Character Study is the
    threads mechanism's own best demonstration.
    **Zero schema is this ticket's constitution, not just a rule**:
    the catalog's own Law 4 — deck definitions are static app data,
    dealing a deck is ordinary card creation on an ordinary board
    (`boxes` jsonb only), dealt cards owe nothing to their template
    afterward (no back-reference, no deck identity persisted beyond
    ordinary card data — asserted directly in the harness). STOP-and-
    report the instant any slice wants a column.
    **The R6 wizard rulings (already ratified,
    `boards-ratification-record.md`) bind the engine verbatim, per
    catalog Law 3**: opt-in always, appearing only behind two
    deliberate doors, never suggested; a step-by-step pop-out over the
    faded board, never reflowing what's underneath; clickable-first
    narrowing questions, text permitted where a deck allows it,
    required never; ending on the dealt board, wizard gone; a quiet
    "Start Here" hint on the first dealt card that vanishes on the
    writer's first edit to ANY dealt card and never returns — ruled
    lawful orientation on an artifact the writer just asked for,
    earning no color in the orange lane.
    **Two doors only, both places the writer already deliberately
    went**: drawer creation (Blank stays first-class and first-listed,
    byte-identical to today; "Start from a deck…" sits beneath it) and
    any board's own existing Add flow ("From a deck…" beside its
    current options). No third door, no strip presence, no Tutor
    mention — anti-solicitation absolute.
    **Named non-goals, explicit boundaries not oversights**: the
    fourteen second-wave decks; cross-deck threading (a delight
    deferred with its own decks); the Résumé deck entirely (its
    tailoring card entangles the future paste-rail design, the
    catalog's own flag honored); the fate of the pre-existing
    `StructureWizard`/`BeatWizard`/`StructureBoard` trio (a future
    explicit ruling once the engine stands — this ticket adds beside
    them, touches them not at all, the `/project/*` deferral's own
    sibling); user-authored decks; deck editing after dealing (nothing
    to edit — a dealt card is just a card).
    Zero schema, zero new deps; merge pre-authorized; Fable reviews
    post-merge, gating close and redeploy.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B2/S6-deploy `main`
    (the gate condition — "once the B2+S6 deploy lands" — already
    satisfied).
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED — 2026-07-21.**
    Built S1-S4 on `b3-seeded-boards` off `main` @ `317c2cb`, in its
    own worktree. S0's own ledger work was already done directly on
    `main` before the build started.
    **S1 — the engine, proven genuinely generic, not asserted.** A
    `DeckDefinition` is a plain static object (id, room, nameTerm,
    questions, a `deal(answers)` function); `DeckWizard.tsx` renders
    whatever the definitions declare and names no deck/card/room
    anywhere in its own code — the review independently read the
    engine's own source specifically hunting for hidden per-deck
    branching and found none. `materializeDeck` is pure (no I/O),
    minting real ids and deduped connection threads from a deck's own
    declared card list. "Start Here" (`store/deckHint.ts`) uses this
    project's own established per-entity-scoped local-flag shape
    (`firstRun.ts`/`tutorDisclosure.ts`'s pattern) — its full lifecycle
    independently live-verified against the brief's own exact fence:
    dealt a deck, edited a DIFFERENT card than the hinted one, hint
    still died; edited a third card after, hint stayed dead; moving
    (not editing) a card does not dismiss it.
    **A genuine architectural finding, not a stylistic choice**: the
    two doors use different persistence calls on purpose — door 2
    (Board's own Add flow) uses the existing debounced `setBoxes`
    autosave since a live BoardEditor is mounted; door 1 (drawer
    creation) calls `saveBoardBoxes` directly since its board has no
    live mounted component yet to race against. Diagnosed as a real
    race, not discovered and quietly worked around.
    **S2 — all seven decks, verbatim from the catalog.** Three-Act
    Structure, Worldbuilding, Feature Screenplay, Thesis/Dissertation,
    Grant Application, Feature Story, Character Study. **One real
    defect caught by the build's own pre-run counting, before the
    harness ever ran**: Feature Story was missing its own declared
    Kicker B card (the lexicon term existed, the deal function never
    used it) — fixed before first execution.
    **Judgment calls disclosed, all independently reviewed and
    sustained:** Three-Act's own proportional card counts (9/8/6 for
    novel/novella/short story — the catalog says "proportionately,"
    gives no numbers); Grant Application and Feature Story each
    invented one light wizard question the catalog names none for,
    since catalog Law 5 requires every deck to have narrowing
    questions; Character Study drops a single-character option
    outright, since a lone character can carry no relationship card,
    which would falsify the deck's own reason for promotion ("dealt
    pre-threaded"); relationship cards thread hub-and-spoke to BOTH
    sides separately rather than one line per pair, read as the more
    literal match to "wire the cast together" — independently
    live-verified by the review (3 characters, 14 cards, 4 real
    connection boxes, every endpoint traced to real ids from that
    exact deal).
    **S3 — the two doors, and only these two, structurally absent
    everywhere else.** Door 2 is genuinely absent on system boards
    (same law as the sliver's other three tools); Blank's own path
    through `CreateProject.tsx` confirmed line-by-line unchanged by
    the review — the only diff is an additive, CSS-inert-when-closed
    wrapper around the pre-existing picker, nothing touched inside it.
    **S4 — `b3.mjs`, 63 checks.** Board geometry proven byte-identical
    with the wizard open vs. closed (canvas pixel dimensions AND a
    pre-existing card's own rect, JSON-equal, at both reference
    widths) — not eyeballed. **A maintenance trap surfaced and
    disclosed, not silently absorbed**: adding a fifth sliver control
    falsified three separately-parked "sliver carries EXACTLY N tools"
    checks across `ab4.mjs`/`fx4.mjs`/`fx5.mjs` — an established
    re-derive-in-place lineage (distinct from a verbatim-park), each
    extended to its own next generation (5/4/3 respectively); one
    prior generation's own pointer to a "live successor in `b2.mjs`"
    turned out to name a check that never actually existed there
    (`b2.mjs` uses presence-only `.includes()`, never an exact count)
    — caught and corrected, not perpetuated. **Flagged plainly for a
    future ticket**: this three-copy lineage is real ongoing
    maintenance debt; every future sliver-tool addition must hunt down
    and re-derive all three copies by hand.
    **Two harness-methodology bugs found and fixed by the build
    itself** (not product bugs): an anti-solicitation check scanning
    `document.body.innerText` for "deck" false-flagged the sliver's
    own *closed* panel (DOM always present, CSS-hidden — true of every
    pre-existing Add door); an assertion expected 2 connections from
    Character Study's 3-character deal, when the deck's own real
    hub-and-spoke design mints 4 — both fixed to assert the actual
    intent, not the wrong number.
    **Independent review — GREEN, no defects found, nothing changed
    on the branch.** The review specifically hunted for six failure
    classes and found none: hidden deck-id branching in the "generic"
    engine; a smuggled-in `Box` field; a special-cased dealt-card
    type; a hint listening only to its own card; any UI reachable
    without a click; drift in the blank path. Zero-schema confirmed
    two ways: `apps/server` diff empty, AND `types/index.ts` (the
    `Box` interface itself) doesn't even appear in the changed-files
    list — no field was added anywhere, not even an optional one.
    Zero back-reference confirmed live, not just by grep: dealt every
    deck through the harness, read the resulting boxes directly,
    cross-checked every key against the real `Box` interface's own
    field set — zero foreign keys, both plain and threaded cards.
    Ordinary-card-ness confirmed live: dragged, edited, and deleted a
    dealt card through the real UI, no special-cased code path exists
    anywhere in `BoardEditor.tsx` for one. One imprecise number in the
    build's own prose caught and corrected (it said "22-file suite,"
    the actual pre-existing count was 25) — noted as a documentation
    slip, not a code defect.
    **Full suite, both passes.** Build: `tsc` (desktop+server) +
    `build:web` + selftest + all 26 harness files (new `b3.mjs`, 63
    checks) green under both `HARNESS_PARKED` settings. Review: same
    suite, its own clean run, 26/26 green both settings — including
    independently confirming the new sliver-count generations 5/4/3
    all pass live. CC's own third independent pass on the
    fast-forwarded `main`: `tsc` (desktop+server) + `build:web` clean,
    full 26-file/52-run suite **51/52 green on the first pass** — one
    transient failure, `j4.mjs` under `HARNESS_PARKED=1`, a CDP-level
    `SecurityError: localStorage access denied` unrelated to any
    assertion in the file (which B3's own diff never touches at all).
    Re-ran `j4.mjs`'s parked pass in isolation TWICE, both clean
    (28/28 both times, all four PARKED successors green) — confirmed
    a genuine transient browser-state flake, not a regression, and
    recorded honestly rather than silently re-run into a clean summary.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema by the review's
    own two-way check). Fast-forwarded `main` to `5f64194` (no
    divergence, clean fast-forward, zero conflicts), pushed to
    `origin/main`.
    **Deploy authorization on record, standing, given ahead of the
    usual per-instance word:** Nick, 2026-07-21 — "Review and deploy
    B3 whenever it's ready. I need to get eyes on these builds to
    know what's working/what isn't anyway." Per this explicit advance
    word, deploy proceeds on CC's own merge+verify pass completing,
    WITHOUT waiting for a separate Fable post-merge review first — a
    deliberate, disclosed departure from every prior ticket's own
    sequencing this session, where her review landed before deploy
    every time. Her review still lands and folds in normally
    afterward, same as several post-deploy folds already have.
    **Deployed — 2026-07-21**, manifest `13d4a62..HEAD` independently
    re-enumerated by CC before shipping (B3's own code commits, docs
    riders only, no unnamed code riders). `railway up` on `main` @
    `65a4fa9` (deployment `bfd3e8f2`, SUCCESS), confirmed live (`200`
    on `/healthz` and `/`, `401` on `/auth/me`). **Item 40 stays open
    pending Fable's post-merge review** (still owed, per the brief's
    own gating language, even though deploy itself didn't wait for
    it) **and Nick's own device sitting.**
    **Fable's post-merge review landed and is committed — GREEN, no
    fold — 2026-07-21** (`docs/wrizo-alpha/b3-review-fable.md`).
    Census-verified on the two widest commits (S1's seven client-only
    files including the full seven-deck lexicon load; S3's exactly
    three files, all additive call sites into existing store
    functions) — the zero-schema claim confirmed census-level, not
    taken on faith. **Explicitly ratified as lawful, not just
    accepted**: the deploy that preceded this review (Nick's standing
    word, manifest independently re-enumerated). **Five rulings of
    record**: (1) the two-doors persistence asymmetry SUSTAINED and
    RATIFIED as a durable pattern — lawful specifically because it was
    diagnosed, reasoned, and disclosed, made safe to reason about by
    the engine's own purity (`materializeDeck` never touches
    persistence, callers own the one mutation); (2) the sliver-tool-
    count lineage's own structural end RATIFIED — b3.mjs's ordered-
    labels roster check ends the magic-number generation pattern
    outright, and the generation-4 stale-pointer catch elevates a new
    standing rule: **a park's own live-successor pointer is now part
    of what every fold must verify**, not just the check's own
    content; (3) Character Study's never-one-character exclusion
    RATIFIED as by-design, not by luck; (4) **one open item, a
    question not a defect verdict**: "Start Here" wears brass where
    the brief said it earns no color in the orange lane — the build's
    own reasoning ("brass, not orange — no new color lane") sits in
    real tension with the house's own th2 precedent (brass for
    earned, evental moments only) — **Nick's own sitting rules it**:
    if it reads as a quiet mark, it stands; if it reads as an at-rest
    glow in the action lane, a b3.1 fold moves it to a muted ink tone,
    one token; (5) **the `j4.mjs` flake tracking formally opens at
    occurrence 1** — transient, clean twice in isolation, unrelated to
    B3's own diff — under the standing `th2.mjs` rule: a third
    occurrence within the tracking window triggers a scheduled
    deflake pass, not another note.
    **Close conditions: (1) this review on disk — met, this commit;
    (2) Nick's own sitting — the sole remaining gate.** His DoD walk
    (Blank first and untouched; two clicks into Three-Act's nine
    cards; the hint dying on his own first edit; a drag and a delete,
    no protest; no deck ever offered unasked) plus two named looks:
    Character Study's pre-threading (three characters, four threads)
    and the Start Here color question (Ruling 4 — his eye rules brass
    or ink).
41. **Nick's second desktop sitting — 2026-07-21. PARTIAL, relayed
    directly to CC, no Fable brief.** Eleven findings across two
    messages, Nick's own words, recorded verbatim before any triage or
    fix:
    1. **"New Page" while in the Journal lands on an older version of
       the Journal Page** — "which now should be just a regular Free
       Write page with typewriter mode, etc. defaulted to on."
    2. **Screenplay/script pages are broken**: "the tool and tutor
       menus are floating away from the page; the page itself is in
       a different location, way too small, and not centered. There
       are probably a number of other problems with how the
       screenplay/script page type is currently working" — Nick's own
       instruction: "do a thorough review there."
    3. **Free Write's own tool set is too sparse** — "the user should
       still be able to bold/italicize, bare minimum, and there
       should also be ink options for when we reinstate the ink
       feature."
    4. **The cascade's own submenus float away from the main strip**
       — "not rolling out from the edge and flush against the main
       menu... they float away from it, leaving a gap between the
       main strip and the sub-menu."
    5. **Scrollbars need a systemic pass** — "all scroll bars need to
       be restyled to be much more minimal and consistent with the
       colors and mood of each unique theme. Right now, they are
       bulky and mostly white, which makes them dominate visually,
       distracting from what a user will actually be trying to focus
       on."
    6. **Deck-dealt cards are not editable** — "double clicking on
       them did nothing."
    7. **Deck-dealt cards are not deletable** — "Nor can I seem to
       delete them."
    8. **Card resize is one-directional** — "once a card is upsized in
       any direction, it doesn't seem like it can be downsized."
    9. **The card layer-arrangement feature is not working.**
    10. **The deck wizard doesn't actually walk the user through a
        proper wizard** — "not doing it with pop-ups over a blurred
        out board like the way we've styled the card editor. Right
        now, it seems like the Plot Structure option is just leading
        back to the old, deprecated wizard."
    11. **Long file-listing menu sections should be collapsible** —
        "all menu sections that will have lists of previous Pages,
        Boards, or other file types should all be on toggles so the
        menus don't get dominated by long lists of files."
    **Triaged, Nick's own word, 2026-07-21.** Split per his own
    instruction: findings 2-10 build directly, no Fable brief — CC's
    own call on each, including root-causing whether 6-9 are genuine
    regressions or the project's own recurring synthetic-vs-real-
    hardware gesture gap (the same class FX4/FX5's hover-restore and
    drag-friction bugs were), and whether 10 is a genuine bug in B3's
    own new door or Nick reaching the older, pre-existing
    StructureWizard doorway instead. **Findings 1 and 11 held for
    Fable**: 1 is a real architectural question (JournalEntry.tsx's
    own fate as a distinct writing surface, per B1's explicit "the
    paper stays" ruling); 11 is a UX pattern spanning multiple menu
    sections needing a real spec (which sections, default state) not
    a guess. **Building now**: `FX7`, CC-authored (no Fable brief,
    explicit Nick authorization on record) — see item 42.
42. **FX7 — the second sitting's fixable bugs.** **BRIEF COMMITTED —
    2026-07-21, CC-authored, not Fable.**
    `docs/wrizo-alpha/fx7-second-sitting-fixes-brief.md`. Covers
    findings 2-10 of item 41's sitting (screenplay/script geometry, a
    thorough review per Nick's own instruction; Free Write's tool rail
    — Bold/Italic + ink affordances; the cascade submenu flush-gap;
    a systemic theme-aware scrollbar restyle; four board-card
    interaction bugs on deck-dealt cards — edit, delete, resize-down,
    layer-arrangement, each root-caused rather than assumed, given
    B3's own review just proved the same mechanisms working live
    minutes earlier; the deck wizard's own routing, investigated to
    determine whether Nick reached B3's genuine door or a separate,
    pre-existing doorway). Findings 1 and 11 explicitly excluded, held
    for Fable. Zero schema expected, STOP-and-report if any slice
    wants a column; merge pre-authorized as zero-schema. **Deploy is
    explicitly NOT pre-authorized** — Nick's own "deploy whenever
    it's ready" word was scoped to B3 by name, not read as a standing
    policy; redeploy here waits for his own word, same as the default
    for every ticket before B3.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-B3-deploy `main`.
43. **TU2 — the Listener.** **BRIEF COMMITTED — 2026-07-21.**
    `docs/wrizo-alpha/tu2-listener-brief.md`. **Authority:** the Tutor
    committee pass as ratified (A12-A15 whole) and the Tutor's own
    second sitting of 2026-07-21 (Nick's six additions reviewed and
    shaped by Fable; sequence ruled TU2->TU6: TU2 the Listener (this
    ticket), TU3 Ledger, TU4 Mechanics+cards, TU5 Memory, TU6
    Accounts). **This is the first record in this repo of that
    sitting and its sequence ruling** — no prior doc names TU3-TU6
    before this brief. **TU5 (Memory) is explicitly NOT settled by
    this sequencing**: its memory-rules wording still awaits Nick's
    own review; recorded here as an OPEN ratification item, not
    assumed.
    Five build slices: S1 provider-agnostic config (DeepSeek V4 Flash
    default; `TUTOR_BASE_URL`/`TUTOR_MODEL`/`TUTOR_API_KEY`/
    `TUTOR_MAX_TOKENS`, server census locked to exactly `env.ts`,
    `tutor.ts`, `.env.example`); S2 delta reads on a persisted cursor
    — **a charter amendment to TU1 S1's "nothing else is ever
    persisted," made on Nick's word at this brief's ratification**:
    `lastRead?: { at, chars }` joins the `tutor` jsonb; S3 disclosure
    v2 (versioned, shown once per version, new wording since page
    text now travels); S4 the panel's geometry retrofit (grip flush
    to the page's right edge mirroring the strip; presence extends to
    `pageKind='board'`); S5 the session meter (client-only, no
    schema). **ZERO MIGRATION — merge pre-authorized as zero-
    migration per the AB4 precedent**, with the three-file server
    census as the hard boundary — anything more is STOP-and-report.
    Report = push; Fable reviews post-push; deploy is Nick's separate
    word, manifest enumerated as always.
    **Build starting — 2026-07-21**, on `tu2-listener` off `main` in
    its own worktree, per ONE CHECKOUT PER AGENT.

## CANON DEBTS — Fable's, actionable after the gate session
7. **Rev 3 of `docs/state-of-wrizo-2026-07.md`.** A week of TTFK data now
   exists on prod; Rev 3 folds it in, plus: the ink canon, the reframed
   gate language ("merge+deploy is the test; verdicts close tickets"), the
   "Your order"/Journal-only vocabulary ruling, and the J-arc verdicts.
   Trigger: Nick's session verdicts land.
8. **F5 TTFK DoD-6 empirical close.** One small CC task: run the
   sessions_log queries against prod (non-null `surface` +
   `desk_opened_at` rows). Fold into the Rev 3 prep relay.

## POST-ARC QUEUE — unblocks when J5 ships + gates close
9. ~~**Fragments-under-Pages committee pass.**~~ **RULED — 2026-07-11**
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
10. **B3 atmosphere pass · B4 ember accent finish · W5 responsive** — were
    deferred until Journal UI surfaces existed; the Spread and the Board now
    exist. B4 intersects the Journal sprint reward surface (design together).
11. **HOME verification remainder**: bighead art, sort-hint.
12. ~~Page-is-primary committee pass~~ **RULED — 2026-07-12**
    (`docs/page-primacy-canon.md`, on Nick's delegated word via Fable): tools
    orbit, navigation departs with a guaranteed way back; overlay-Drawers
    trimmed to horizon; metadata-below-page blessed final; Plan-beside-page
    pull-forward declined with reason. Build: **W2 — the way back**
    (`docs/w2-way-back-brief.md`) — **DONE, see item 6 above.**
13. ~~Progress-milestones committee pass~~ **RULED — 2026-07-12**
    (`docs/progress-milestones-canon.md`, on Nick's delegated word via
    Fable): coverage, never verdicts — circles project beat facts read-only;
    no marking gestures on writing surfaces; word targets vetoed; notecards
    get the status-dot, not a bar; one celebration grammar, B4 the final
    authority. Build: **M1 — milestone circles + notecard dots.** **DONE —
    merged/deployed 2026-07-13.** Built per `docs/m1-milestones-brief.md` on
    `m1-milestones` @ `44afe2f`, off post-W2 `main` — a read-only projection
    of a StoryPlan's beat coverage onto writing surfaces (a new
    Progress:Project setting, offered only when a StoryPlan exists — no
    greyed states) and onto Structure Board's pre-existing notecard
    status-dots (celebration-on-transition added; the Board's own
    empty/started/done vocabulary kept as shipped). Celebration tracking is
    scoped per StoryPlan — bare beat ids are framework-authored strings
    ('midpoint', 'climax', ...) shared verbatim across every project on the
    same framework, so an unscoped id space cross-talks the moment two
    projects share one (an adversarial review caught this pre-merge;
    `m1.mjs`'s fixture 3 reproduces both the false-celebration and the
    swallowed-celebration direction) — seeded from the plan's full
    unwindowed lit set, with the seen-commit deferred to the celebration
    timer's completion so App.tsx's persistence-notify force-render can't
    silently consume an unpainted celebration mid-navigation. Fable's
    review (`docs/m1-review-fable.md`) returned REQUIRED — 1 (small), 3
    advisories, two doc promotions — "best-engineered ticket of the arc,"
    no data-loss-class or architecture findings, zero-schema confirmed.
    **Folded before merge:** R1 — `Timer: On` is an independent toggle
    designed to survive every Progress value, but `showMilestones` replaced
    `ProgressBar` wholesale, silently losing the session clock under
    Progress:Project; fixed by giving `MilestoneBar` the same `rightSlot`
    `ProgressBar` already had (page number + timer ride alongside the
    circles). A1 — qualified `useMilestoneCelebration`'s header comment: the
    "still celebrates" claim holds only once the plan's scope has already
    been established by a prior render; completing a beat while Progress is
    Words and switching to Project later in the same app-load seeds that
    beat quiet on first look — inherent to storage-free session memory,
    erring in the correct (missed-pulse, not false-pulse) direction, not a
    bug. Two doc promotions: AGENTS.md gained "the harness seeding law"
    (`flushNow()`'s unconditional full-cache-flush can clobber a raw
    fixture seed made while a flush-handler surface is still mounted — seed
    from Desk instead); this file's HORIZON gained item 18 (App.tsx's
    force-render-on-every-write is a real perf ceiling eventually — no
    ticket yet). `scripts/harness/m1.mjs` grew 32 → 33 checks (Timer:On +
    Progress:Project renders both the circles and the clock). **Ruled:** the
    canon's Q4 "in the same three states" was loose drafting; keeping the
    Board's pre-existing three-state vocabulary and adding only celebration
    is the conservative, correct reading — overwriting Plan-authored
    `started` with attachment-driven `kindled` would have destroyed
    information on the one surface where status is authored. Ran the full
    suite (`tsc` ×2 + `build:web` + selftest + `j4.mjs` 26/26 + `j5.mjs`
    40/40 + `s1.mjs` 87/87 + `w1.mjs` 18/18 + `w2.mjs` 31/31 + `m1.mjs`
    33/33) green on merged `main`, pushed, `railway up`, confirmed live.
    **Zero-schema** — no server files anywhere in this diff, liveness check
    only. See `docs/backlog.md`. M1's own S25 + desktop gate items join the
    consolidated hardware session (item 2, now a ninth cluster) — Nick's
    device verdict closes the ticket. `docs/w1-close-handoff.md` Step 4:
    struck as executed on this merge — the handoff is fully spent
    (archive-headed).

## HORIZON — no ticket yet, on the map
14. **User-authored identity / rhizomatic personalization**: wordmark
    replaceable with the writer's own hand; four launch themes (Plateau,
    Flux, Volant, Nomad); single hard invariant = the orange accent.
    -> converted to TH-arc 2026-07-13 (items 19-20); wordmark replacement
    and Volant/Nomad remain horizon.
15. **Reciprocity gate** for the future workshop feature (review before
    submitting).
16. **wrizo.app Cloudflare resolution** (domain plumbing).
17. **USPTO "Wrizo" search** before significant brand investment (one
    low-threat prior use known: a throwaway utility on pi7.org).
18. **App.tsx force-renders the whole routed tree on every persistence
    write** (its sync/reactive-screens `subscribe(forceRender)` — one
    listener, every `save*`/`upsert` call notifies it). Harmless at current
    scale; a real perf ceiling eventually as the app and its write volume
    grow. M1's deferred-seen-commit in `useMilestoneCelebration` is the
    local workaround pattern for one symptom of this (an interim render mid-
    navigation-away) — not a fix for the underlying cost. No ticket yet.

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
- **ONE CHECKOUT PER AGENT — ratified 2026-07-16 (Fable), citing this
  same day's CD1.1-fold incident (item 26) as the trigger.** Concurrent
  sessions never share a working tree. Uncommitted edits sitting in a
  tree another session can `git checkout` out from under are now a LAW
  VIOLATION, not just a risk — this happened twice in one day on this
  exact pair of tickets (CD1.1's fold vs. HB1's build), the second time
  even after the first collision had already been caught and flagged.
  Each concurrent agent gets its own `git worktree` off the same repo
  (same remotes, fully separate working trees, no collision surface) —
  never a re-clone. To add one: `git worktree add ../<name> <branch>`
  from the repo root (the branch must not already be checked out
  elsewhere — switch it out first if it is). `git worktree list` shows
  every live worktree. HB1 now builds at `../wrizo-hb1` on
  `hb1-threshold`; CD1's session keeps the original checkout
  (`writer-studio`) on `main`. Any future third concurrent agent gets
  its own worktree the same way before it writes a single file.
- **Erratum vs. supersession, for harness checks — ratified 2026-07-16
  (Fable, cd1.1 spot-check).** Two different situations, two different
  moves. A check falsified because the DESIGN changed (a surface
  retires, a selector's target is genuinely gone) parks per A4:
  original moved verbatim (quoted, SUPERSEDED/DORMANT species, one-line
  reason) into its own file's PARKED section, a NEW live check asserts
  the new truth. A check falsified because an EARLIER REVIEW's own
  brief reading was wrong (an erratum — the code was right, the
  ground-truth call was the defect) updates IN PLACE instead: same
  check, corrected assertion, renamed with the fold's label (e.g.
  `S1/cd1.1: ...`) so its diff discloses the touch — no parking, since
  nothing about the design was ever superseded. cd1.mjs's S1 check
  (Pages/Plan toggle) is the worked example of the second case.
- **DEPLOY-MANIFEST RULE — ratified 2026-07-17 (Fable), standing across
  all tracks.** Trigger: the FX2 deploy (`railway up` @ `740b572`,
  Nick's word "Go ahead and deploy") shipped a SHA that also carried
  HB1's merged-but-not-yet-sat-with code as an unnamed rider — HB1's
  own device sitting had not happened, and no deploy clearance was ever
  given for it by name (see item 27's own retroactive-finding note).
  **A deploy ships a SHA, not a ticket.** Before any `railway up`, the
  deploying session enumerates every merged-but-undeployed ticket
  contained in the target SHA and names them ALL in the deploy request
  — Nick's deploy word is valid only against that enumeration. If any
  named ticket lacks its own deploy clearance, the deploy waits, or
  ships from the last cleared SHA instead. Practically: before typing
  "deploy," run `git log <last-deployed-SHA>..<target-SHA> --oneline`
  (or read the ledger's own merged-not-deployed items) and name every
  ticket that turns up, not just the one the request was about.
