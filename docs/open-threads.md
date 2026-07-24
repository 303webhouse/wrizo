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
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-21.** Built S1-S9 on `fx7-second-sitting-fixes` off
    `main` @ `bb6f079`, in its own worktree.
    **S1 — the screenplay paper, root-caused as a genuine FX3
    regression, not a TU1 wiring defect.** FX3's own `flex:1 1 auto`
    on the stage's scroll-cap made the SCROLL-CAP itself the flex
    item filling the stage's own full width, so the script paper
    rendered flush-left instead of centered — exactly the "way too
    small, and not centered" verdict, and exactly why the sliver/Tutor
    anchors (whose math assumes a centered paper) read as floating
    away. `ScriptEditor.tsx` itself already used both of DeskFrame's
    own overlay anchors correctly — TU1's own two-anchor work was
    never at fault. Fixed by mirroring `.mode-stage`'s own zero-flex-
    grow pattern exactly.
    **S2 — Free Write's tool rail, one real implementation defect
    caught live before it shipped.** Bold/Italic added, reusing
    Draft's own `draftFormat.ts` marker convention. The first
    implementation (`execCommand('insertText', ...)`, this codebase's
    own established technique) was found NOT to reliably fire
    `beforeinput` in this harness's own Chromium build — silently
    dropping the marker on the next real keystroke's re-render — fixed
    with a new `insertMarkerRef` escape hatch calling the same
    `handleInput()` a keystroke calls. Forward-lock's own strike-
    never-erase discipline re-verified live, untouched. The ink
    affordance ships as a disclosed-inert placeholder (Journal's own
    pen/eraser icon shape, rendered disabled, tooltip: "Ink — coming
    soon outside the Journal") — not silently assumed functional.
    **S3 — the cascade gap, root-caused as an FX5 S10 regression.**
    FX5 S10 pulled the strip out of the grid's own flow
    (`position:absolute`, pinned to screen x=0) but the cascade
    anchor's own `left:0` was never updated to match — it stayed
    relative to the stage's own left edge, no longer adjacent to the
    strip. Measured, not guessed: the panel actually overlapped the
    strip by ~44-68px at ordinary widths and drifted to a ~228px gap
    past the wide-viewport seam. Fixed with a strip-relative offset.
    **S4 — scrollbars, a genuine inheritance bug found along the
    way.** The existing Plateau board-canvas treatment (FX5 S3a) was
    found LIVE to not actually inherit from its own `:root`-only
    declaration — promoted to a systemic `*` default reaching every
    scrollable region app-wide, with a paper-toned override for
    light-surface regions. One disclosed, deliberate exception left
    alone: `.beat-rail-dots`, whose own edge-fade mask depends on
    staying invisible.
    **S5-S8 — a single shared root cause found for two of the four
    deck-card bugs, proven not assumed.** FX5 S4(a)'s own "capture the
    pointer on pointerdown" drag-friction fix (still a genuinely
    needed improvement) had a side effect: it retargets every
    subsequent mouseup/click/dblclick to the canvas itself for the
    rest of that gesture — confirmed with genuinely trusted CDP
    events, and confirmed identically on both a real dealt card AND a
    hand-typed one, ruling out any deck-specific hit-testing
    explanation. **The diagnosis was proven experimentally, not just
    argued**: the fix was temporarily reverted, rebuilt, and the
    harness's own S5 check was confirmed to fail exactly as predicted
    before being reverted back clean. S5 (edit) and S8 (layer toggle)
    share this one cause, fixed respectively via `elementFromPoint`
    retargeting (the same technique `finishThreadDrag` already used)
    and an early-return guard mirroring the existing pin/handle
    pattern. **S6 (delete) turned out not to be an independent defect
    at all** — select reads `e.target` on the raw pointerdown, before
    capture ever engages, so it was never touched by the S5 bug;
    confirmed live that select-then-Remove already worked on an actual
    dealt card — pure downstream confusion from S5's own silent
    failure, disclosed plainly rather than a phantom fix invented to
    match the finding. **S7 (resize one-directional)** was a
    genuinely different mechanism: FX4/FX5's own reflow-floor effect
    re-fires on every intermediate `setBoxes` a resize drag emits, so
    a diagonal narrow-and-shrink drag could force an extra text-wrap
    line that the floor then immediately re-grew from, fighting the
    pointer in real time — fixed by standing the floor down for
    whichever box is actively mid-resize, reconciling once on release.
    **S9 — investigated, confirmed NOT a B3 bug.** Both of B3's own
    doors ("Start from a deck…" in `CreateProject.tsx`, "From a
    deck…" in the sliver) verified live to launch the genuine
    `DeckWizard` pop-out-over-blur correctly. What Nick actually
    reached was a DIFFERENT, PRE-EXISTING button — the Cascade's own
    "Plot a Story" (predating B3 entirely), which has always routed
    straight to the old `/project/:id/wizard` full-page
    `StructureWizard` route. Confirmed live by the page's own rendered
    body text. Per the brief's own explicit instruction, this old
    doorway was left completely untouched — its fate stays Fable/
    Nick's own call, exactly as B3's brief deferred it by name.
    **Independent review — GREEN, two real defects found and fixed,
    both in PRIOR TICKETS' OWN HARNESS FILES, not in FX7's own product
    diff.** The build's own final report was itself a stalled
    placeholder rather than an actual writeup (a background-monitor
    pattern that never resolved) — the review picked up the full
    verification load independently, from the actual git state, not
    from the build's own prose, and additionally discovered the
    branch had never actually reached `origin` (it existed only in a
    sibling worktree) — pushed it there itself, first time, disclosed
    plainly. **Gap 1**: S5's own correct `elementFromPoint` fix broke
    coordinate-less synthetic dblclick dispatch — the exact technique
    every prior ticket's own board-popup test has used since FX4 S5 —
    across five live files and two parked-only checks; fixed at all
    ~15 call sites by supplying real on-screen coordinates to the same
    dispatch, the identical "update the reach-mechanism, keep the
    claim" pattern FX4 S5 already established once before. **Gap 2**:
    S2's own deliberate Free Write format addition falsified three of
    `ab2.mjs`'s own checks asserting format's ABSENCE — a straight A4
    miss, caught only because the review ran the FULL historic suite
    where the build's own S10 had only run its own `fx7.mjs`. Parked
    per A4, live successor named. **The review went further than
    required on several claims**: took real CDP screenshots at all
    three widths to confirm S1's centering visually, not just via
    `getBoundingClientRect()`; found a sharper explanation than the
    build's own hand-wave for why B3's review missed S5 entirely (a
    fully synthetic `dispatchEvent` is structurally immune to
    pointer-capture retargeting regardless of trust level, not merely
    "probably tested something else").
    **Full suite, both passes.** Build: `fx7.mjs` reached 46/46 across
    its own four sections. Review: full historic 26-file suite
    re-run clean from scratch after its own two fixes, both
    `HARNESS_PARKED` settings; `fx7.mjs` unchanged, 46/46. `tsc`
    (desktop+server), `pnpm run build`, and `build:web` all clean.
    **A concurrent session discovered at merge time, resolved
    cleanly, no data at risk.** While this build was running, a
    SEPARATE, legitimate CC session opened TU2 (item 43, the
    Listener) directly on this same primary checkout's own `main` —
    confirmed genuinely unrelated (docs-only commits, zero file
    overlap with FX7's own diff) before merging, not assumed safe.
    Merged via an explicit merge commit (`git merge --no-ff`, fast-
    forward was no longer possible) rather than force-pushing or
    resetting anything. TU2's own worktree and branch were never
    touched. CC's own third independent verification pass: `tsc`
    (desktop+server) + `build:web` clean, full 27-file/54-run suite
    **green, 54/54, zero failures** — zero discrepancies against both
    the build's and the review's own runs.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule — confirmed genuinely zero-schema, `apps/server`
    diff empty). `origin/main` was still at this merge's own base
    (`bb6f079`) when pushed — TU2's own local commits hadn't reached
    origin yet from its own session — so this push carried both
    TU2's opening and FX7's full merge to origin in one clean
    fast-forward, `bb6f079..9148be0`. Pushed to `origin/main`.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold, one advisory — 2026-07-21**
    (`docs/wrizo-alpha/fx7-review-fable.md`). Census-verified, not
    taken on faith: the widest product commit confirmed at exactly
    seven `apps/desktop`-only files, zero server; depth resting on
    three upstream layers (`fx7.mjs`'s own 46 checks, the independent
    review's from-scratch verification including real screenshots and
    the full historic suite the build itself never ran, and CC's own
    54/54 third pass). **Seven rulings of record:** (1) **the revert-
    reproduce-restore proof RATIFIED as the standard** for any "prior
    ticket X caused this" claim going forward — diagnosis as
    experiment, not argument; (2) S6's own honest non-fix RATIFIED —
    "delete was never broken," said plainly rather than inventing a
    phantom fix to match the finding; (3) S9's untouched door
    RATIFIED — both of B3's own doors confirmed live-correct, the old
    wizard's own fate still parked, taken up with J6 or on its own;
    (4) **Gap 1's fix pattern promoted to standing practice**: a
    harness technique used across many files is itself a shared
    dependency — any change to input synthesis or hit-testing now
    runs the FULL historic suite before push, not just the ticket's
    own file, named directly as the lesson FX7's own build skipped and
    the review's own second net caught; (5) Gap 2's A4 parking
    verified at record depth; (6) **ADVISORY, for Nick's own eye**:
    the ink placeholder's visibly-disabled state sits in tension with
    M1's own "offered only when it exists, no greyed states" pattern —
    but item 41's own finding 3 asked for exactly this in Nick's own
    words, so his word outranks the generalization; standing as built,
    one word at the sitting settles it either way; (7) a commit-
    message imprecision noted without consequence (fe67f1a said "six
    findings," the record correctly holds eleven).
    **The concurrent-session collision — CC's own handling explicitly
    RATIFIED as exemplary** (verified non-overlap before touching
    anything, an explicit merge commit, no force or reset, TU2's own
    branch/worktree never touched, full disclosure) — named as the
    THIRD occurrence of this shared-tree class (after the two CD1.1/
    HB1 collisions on 2026-07-16). **The proposed "S0-push rule" —
    RATIFIED, 2026-07-21, Nick's word ("Sure, ratify S0-push rule").**
    Full text recorded under TOOLING STATUS, alongside ONE CHECKOUT
    PER AGENT. Binding practice from this point forward — this
    session's own future S0-style records commits land via a
    fast-forward push from a differently-parented branch, never as
    direct commits against the primary checkout's own local `main`.
    **Deployed — 2026-07-21**, Nick's word ("my go-ahead to deploy
    everything built"), manifest independently re-enumerated by CC
    before shipping: `65a4fa9..HEAD` = FX7's own four code commits +
    docs riders only (including TU2's own docs-only brief/ledger
    commits — TU2's actual code stayed unmerged, confirmed, so it
    rode along in none of this). `railway up` on `main` @ `e5b368e`
    (deployment `80b8f872`, SUCCESS), confirmed live (`200` on
    `/healthz` and `/`, `401` on `/auth/me`). **Close condition 2
    (Nick's deploy word) — MET, satisfied by the above, matching the
    review's own manifest exactly.** Close condition 3 (Nick's own
    device sitting, the S5-S8 gesture class and S1 screenplay geometry
    especially, per the trusted-pointer law) remains open. **Findings
    1 and 11 are ruled separately, briefs to follow TU2's own review**
    — finding 1 becomes `J6 — One Paper`; finding 11 becomes `FX9 —
    the Folded Lists` (renamed from the original `FX8` — see item 45's
    own record: the disk wins, the number is claimed by the ticket
    that actually opened as a ledger item, never by a review's forward
    reference in prose; a new standing rule, recorded under TOOLING
    STATUS).
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
    **BUILT, INDEPENDENTLY REVIEWED, AND PUSHED — 2026-07-21.** Built
    S1-S6 on `tu2-listener` off `main` @ `00bdc2e`, in its own
    worktree, via a Workflow-orchestrated build+review pipeline
    (ultracode).
    **S1 — the model id independently verified live, not carried over
    from training data.** Before the build started, the orchestrating
    session ran a live web search plus a direct fetch of
    api-docs.deepseek.com/quick_start/pricing and confirmed
    `deepseek-v4-flash` is DeepSeek's current V4 Flash id (alongside
    `deepseek-v4-pro`) and that `deepseek-chat`/`deepseek-reasoner`
    deprecate 2026-07-24 15:59 UTC — matching the brief's own claim
    exactly. `TUTOR_BASE_URL` (default DeepSeek's own
    Anthropic-compatible endpoint), `TUTOR_MODEL` (default
    `deepseek-v4-flash`), `TUTOR_MAX_TOKENS` (700) land in `env.ts`;
    the base URL wires into the SDK client's own option, no other
    route logic changes.
    **S2 — a real design call, disclosed, not buried.** The delta
    rides as its own capped top-level body field (not folded into the
    existing `messages` array), because the pre-existing 4000-char
    per-message validation would otherwise silently reject any real
    ~4k-token delta the first time one was actually sent — found and
    designed around rather than discovered later as a break. Conduct
    rule 37 lands in the system prompt; `usage`/`model` now ride the
    chat response so S5's meter needs no further server touch.
    **S4 — a "fix" that turned out to already be true, disclosed as
    such.** The grip-flush requirement was algebraically audited
    rather than assumed broken: the FX2-clamp formula already
    resolves to zero overflow at all three reference widths, so no
    CSS change was needed there — recorded as a verification, not
    invented as a fix. The open width now genuinely computes to `2 ×
    --strip-width` (168px) instead of a hardcoded guess. The
    A15-vs-strip-easing tension the brief anticipated was checked by
    reading Cascade's own live CSS rather than assumed — Cascade's
    own transition is itself a bare hardcoded 180ms literal, not the
    shared `--ease`/`--t-state` tokens, so no real conflict existed
    once measured; Tutor's own 180ms is left untouched, matching
    Cascade's real value exactly.
    **Width correction — 2026-07-21, per FX10's brief, spec error not
    build error.** The `2 × --strip-width` (168px) open width above
    was built exactly as this ticket's own brief specified, and the
    build's own algebraic audit was sound against that spec. **The
    spec itself was wrong** — Fable's own words, on the record: "the
    number was wrong." Nick's device findings the same day showed the
    resulting panel unusable at that width. FX10 (item 51) corrects
    it to `clamp(320px, 34% of the viewport, 460px)`, further clamped
    against the paper's own clearance law. Recorded here so this
    item's own history reads honestly rather than silently
    superseded.
    **S6 — the park sweep was empirically reran, not just grepped.**
    All 26 pre-existing harness files were actually re-executed
    against the TU2 diff, not just text-searched; exactly two TU1
    assertions came up genuinely stale (the old unversioned
    disclosure-seen check; the old ~300px docked-width-reaches-cap
    check) and were parked per A4 with live successors in the new
    `tu2.mjs` (102 checks). One harness fixture (`tu1.mjs`'s
    `freshDesk`) needed a seed-key fix to keep working under the new
    versioned disclosure flag — a fixture repair, not a parked
    assertion, disclosed as such.
    **Independent review — four parallel lenses (server census +
    zero-migration, listener invariants, geometry/A13/A15, fresh-eyes
    defect hunt), all GREEN or GREEN WITH ADVISORIES, zero STOP
    conditions.** One real defect found and fixed: `env.ts`'s own
    comment had claimed the model-id verification as settled fact
    while a sibling file's comment (`tutorCostEstimates.ts`, same
    build, same date) admitted the *build agent's own* live-search
    attempt had hit repeated tool errors — an unexplained
    inconsistency on the brief's single most consequential
    requirement. Corrected to accurately attribute the verification
    to the orchestrating session's own successful check (above),
    rather than leave either a false claim or a falsely-uncertain one.
    Advisories carried forward, none blocking: an empty/whitespace
    model reply silently no-ops with no writer-facing status line; the
    cost-estimate table's dollar figures are explicitly disclosed
    placeholders (the review's own live pricing search also hit
    repeated errors); Tutor's and Cascade's 180ms transitions are two
    independently-hardcoded literals that happen to match, not a
    shared token; Cascade's own pre-existing (not this ticket's)
    dock-floor gate is still vacuously permissive on Board surfaces, the
    identical defect class TU2 S4 just fixed for Tutor; the
    tokens-only meter line's "est." label reads as a minor
    self-contradiction next to "no cost estimate."
    **Zero migration and the three-file server census independently
    reconfirmed a third time**, by the orchestrating session itself
    after the workflow finished, by direct `git diff` against
    `apps/server` (exactly `env.ts`/`tutor.ts`/`.env.example`, nothing
    else) and a full-diff grep for any `package.json`/lockfile/
    migration/schema touch (none, anywhere in the 17-file diff).
    **Full suite green**: `tsc` ×2, `build:web`, selftest, all 27
    harness files (new `tu2.mjs`) under both `HARNESS_PARKED`
    settings — one documented pre-existing `th2.mjs` flake (its own
    known celebration-animation timing race, unrelated to this diff)
    cleared 42/42 on three immediate reruns, exactly per this
    project's own standing practice.
    **Pushed to `origin/tu2-listener`, then MERGED — 2026-07-21.**
    Fable's own on-branch review landed GREEN, required 0
    (`docs/wrizo-alpha/tu2-review-fable.md`, committed by that
    session); Nick's own merge word followed in that same session's
    own conversation, not this one. Merge commit `c04a1f1` (parents
    `d45f7f7`/`45ea10e`) confirms it directly. **Correction, sourced
    from git truth, not this session's own narrative** — the fuller
    build/review/merge record for this ticket belongs to the session
    that ran it; this note exists only so the ledger doesn't sit
    stale claiming "not merged" when `main` itself already disagrees.
    **Deployed — 2026-07-21**, Nick's word ("Deploy TU2"). Manifest
    `e5b368e..HEAD` independently re-enumerated by CC before shipping
    — TU2's own eight code commits plus docs riders only (including
    FX8's own brief commit, docs-only; FX8's actual code stayed
    unmerged, confirmed, so it rode along in none of this). **CC's
    own full independent verification, run fresh rather than trusted
    from the other session's own relay**: `tsc` (desktop+server) +
    `build:web` clean; the full 28-file/56-run harness suite hit real
    friction along the way, root-caused rather than waved through —
    a first pass (accidentally run in parallel with an isolated
    single-file re-check, CC's own error) produced contention noise
    (`EBUSY`, a stray "CDP page target never appeared"); a second
    attempt crashed outright partway through from an orphaned,
    still-running `fx5.mjs` process left over from the first pass,
    found and killed by process name (an accidental self-match on the
    first kill attempt terminated the PowerShell session running it,
    but not before the real targets were already gone — confirmed by
    a clean process-list check immediately after); a third, fully
    clean pass then reached its own summary cleanly: 54/56 green,
    with `tu2.mjs` failing in BOTH `HARNESS_PARKED` settings within
    the suite specifically. **Investigated, not dismissed**: three
    separate isolated re-runs (twice alone, once in direct
    tu1-then-tu2 sequence matching the suite's own order) all came
    back 102/102 clean — meeting this project's own standing bar for
    calling a suite-context failure a genuine transient (load/timing
    under a long sequential CDP-browser run), not a code regression,
    disclosed here rather than silently re-run past. `railway up` on
    `main` @ `368fb10` (deployment `b73e35d6`, SUCCESS), confirmed
    live (`200` on `/healthz` and `/`, `401` on `/auth/me`).
44. **DeepSeek API account — Nick's own note, 2026-07-21.**
    "I have set up a DeepSeek v4 API account and topped it up with $10
    for testing." This is the credential TU2's own S1 (provider-
    agnostic seat, DeepSeek V4 Flash default) is built to consume via
    `TUTOR_API_KEY`/`TUTOR_BASE_URL`/`TUTOR_MODEL`.
    **`TUTOR_API_KEY` now SET on Railway — 2026-07-21**, confirmed by
    that session directly (a minor self-disclosed hygiene note there:
    a check command printed the raw key into that session's own
    context once, caught and not repeated — noted here as project
    history, not a live exposure, key not repeated in this record
    either). `TUTOR_BASE_URL`/`TUTOR_MODEL` deliberately left UNSET —
    TU2's own `env.ts` already defaults to exactly the right values
    (`https://api.deepseek.com/anthropic` / `deepseek-v4-flash`) once
    TU2's code actually deploys, so an explicit override would only
    risk drifting stale later. Open for Nick's own word if he'd rather
    have them explicit anyway.
    **Currently deployed code predates TU2** — no `TUTOR_BASE_URL`
    support yet, so this DeepSeek-shaped key would fail auth against
    Anthropic's own real endpoint if actually invoked right now. The
    live Tutor is therefore showing its own quiet-degrade line at
    present — TU1's own established unconfigured/offline path,
    expected and by design, not a new defect. Resolves itself the
    moment TU2's own code ships; not something to chase before then.
    **House ruling — rotate `TUTOR_API_KEY` (Fable's FX8 review,
    2026-07-21).** The raw value was printed into a model's own
    context during the OTHER/TU2 session's own work (the self-
    disclosed hygiene note above) — not anything that happened in
    this session, and not a breach, but the key now lives in at least
    one transcript. Rotation is free and is the honest response: new
    DeepSeek key, set on Railway in place of this one, revoke the old.
    That session's own unprompted self-disclosure of the mistake is
    exactly the conduct the house runs on, and is ratified as such.
    Not yet actioned — Nick's own call on timing, no urgency implied.
45. **FX8 — card affordances.** **BRIEF COMMITTED — 2026-07-21,
    CC-authored, not Fable.**
    `docs/wrizo-alpha/fx8-card-affordances-brief.md`. Four small
    UI/interaction fixes from Nick's direct feedback (relayed while
    FX7's own review file was still pending, same standing
    authorization): the olive pin restyled as a dimensional sphere-top
    rather than a flat outlined circle; the brass resize handle
    shrunk, its border removed; a `grab`-family cursor added on card-
    body hover (excluding the pin/handle/layer-toggle, each keeping
    their own cursor) — **CC confirmed by reading the code first that
    the drag-anywhere mechanism itself already works** (FX5 S4(a) +
    FX7 S5-S8's own fixes), so this slice is cursor/CSS-only, not a
    new interaction. Zero schema; merge pre-authorized as zero-schema.
    **Deploy explicitly NOT pre-authorized**, same default as FX7.
    **Build starting — 2026-07-21**, via a Workflow-orchestrated
    build+review pipeline (ultracode), off post-FX7-deploy `main`.
    **NAME COLLISION with Fable's own upcoming brief for item 41's
    finding 11 ("FX8 — the Folded Lists," per her FX7 review's own
    close conditions) — flagged, not resolved.** This item is a
    DIFFERENT ticket (card affordances, Nick's direct request,
    2026-07-21) that happened to claim the same short name first.
    Needs a rename on one side before the Folded Lists brief lands.
    **RESOLVED — 2026-07-21, Fable's own FX8 review: the disk wins.**
    This ticket holds the `FX8` number — it opened as item 45, built,
    and merged first. Fable's own planned "the Folded Lists" becomes
    **FX9**, spec unchanged. New standing rule recorded under TOOLING
    STATUS: a ticket number is claimed by its own ledger item, never
    by a review's forward reference in prose.
    **FX9 — the Folded Lists is now item 50** (brief committed
    2026-07-21) — see there for the actual ticket; this note is the
    rename's own history, kept here so a future reader who only knows
    "FX8" as the Folded Lists can trace how the number moved.
    **BUILT — 2026-07-21.** Built S1-S4 on `fx8-card-affordances` off
    `main` @ `6b5a20e`, in its own worktree.
    **S1 — the pin, domed via a radial gradient + shadow**, same
    ~12px size, same one recorded circular exception, highlight
    upper-left matching the card's own drop-shadow's own light
    direction. Verified with a real screenshot, cropped/zoomed.
    **S2 — the handle shrunk 14px→10px, border dropped whole.**
    **Live cursor investigation, not a guess**: `nwse-resize` left
    unchanged — the handle only ever renders on the selected box, at
    its own bottom-right corner, resizing freeform on both axes from
    there (FX4 S4), so a plain diagonal cursor is textually correct;
    no fix invented for a problem that wasn't real.
    **S3 — the card-body grab cursor, with a genuine structural
    finding**: no exclusion selector was needed at all — reading the
    actual JSX showed `.board-pin-grab`/`.board-handle`/
    `.board-layer-toggle` are DOM SIBLINGS of the card-face element,
    never descendants, so the browser's own hit-testing already
    resolves each one's own cursor correctly with zero CSS
    interaction — confirmed live via `getComputedStyle` on each
    element individually. **A disclosed, optional judgment call
    taken**: a small read-only `isDragging` flag added (set only in
    `beginMove`, cleared in `finish` on every gesture end) driving a
    `cursor:grabbing` swap during an actual active drag — the state
    machine's own `phase` transitions themselves untouched.
    **S4 — `fx8.mjs`, 25 checks.** Both drag-still-works and double-
    click-still-opens re-proven live with genuinely trusted CDP
    events, given this exact file's own recent history of pointer-
    capture bugs. **One real finding on a stated assumption**: the
    board editor is NOT entirely framed-only as the brief's own
    context note assumed — the legacy (<1100px) branch renders the
    identical card-canvas tree, only the surrounding chrome differs
    — so this ticket's pure-CSS changes correctly reach the legacy
    view too (verified, asserted), while legacy CHROME (what "byte-
    identical" actually protects) stays untouched.
    **Full historic suite run by the build itself**, all green except
    one already-known pre-existing `fx5.mjs` flake (confirmed
    unrelated by checking out the pre-ticket baseline and reproducing
    the identical failure there, then confirming clean on a later
    re-run).
    **Independent review never completed — a real process gap, not a
    silent one.** The review agent's own final report was a stalled
    placeholder ("I'll stop polling now and wait for the Monitor's
    notification…") — the same background-monitor-stall class this
    session has now hit three times (FX7's build, this review). Zero
    review-fix commits landed on the branch; only the build's own
    three commits exist. **CC's own merge-time verification therefore
    stood in for the missing second pass**, more thoroughly than a
    routine merge check: `tsc` (desktop+server) + `build:web` clean;
    both merges (FX8 then M2, see item 46) auto-resolved cleanly by
    git's own 3-way merge against `index.css`/`BoardEditor.tsx` (TU2's
    own prior changes sat nearby but never on the same lines,
    confirmed by inspecting both conflict hunks directly before
    trusting the auto-resolve); full 30-file/60-run suite — see this
    session's own next ledger commit for exact figures.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized per the
    standing rule). Merge commit (not fast-forward — `main` had
    advanced past FX8's own base via TU2's merge), pushed to
    `origin/main`.
    **Not deployed** — deploy was never pre-authorized for this
    ticket; also, Fable's own post-merge review is still owed given
    the automated review never actually ran — flagged as a genuine
    open item, not silently treated as satisfied.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold, three advisories (one a real cosmetic defect) — 2026-07-21**
    (`docs/wrizo-alpha/fx8-review-fable.md`). **Depth deliberately
    raised, named explicitly**: since the automated review never ran,
    this review carries the second net ALONE — read at full patch for
    S1-S3, the built `index.css`/`BoardEditor.tsx` fetched at the
    merge SHA and read directly (every claim stands on the file, never
    a commit comment). **Four claims independently re-verified, not
    taken on the build's word**: the cursor cascade (traced source-
    order/specificity by hand, confirmed `.board-pin-missing` still
    wins at rest correctly); the drag-swap's own reach to pins/ported
    cards (the exact point most likely to have a hole — confirmed by
    specificity math, not assumed complete); the sibling-not-descendant
    claim; the state-machine claim (walked every handler by hand, not
    read from the comment).
    **A1 — a real leak path found, cosmetic, narrow**: the pointer
    effect's own cleanup never clears `isDragging`, so a viewport
    resize mid-drag would leave the canvas stuck on `grabbing` until
    the next drag completes — self-healing, data-safe, queued as a
    one-liner for a future fix, Nick's call whether it waits. **A2 —
    a real affordance trade, for Nick's own eye**: FX5's own
    `cursor:pointer` was the only at-rest signal a page-pin/ported
    card is a door; FX8 supersedes it with `grab`, so the door is now
    discoverable only by trying the double-click — stands as built
    since Nick asked for the grab directly, but the trade is real,
    noted for the sitting. **A3 — the legacy-reach disclosure RULED,
    not just accepted**: the byte-identical law binds the frame's own
    CHROME, not board-card behavior, which was already shared across
    both paths before this ticket — recorded so a future ticket
    doesn't re-litigate it.
    **A new pre-check practice RATIFIED**: grepping `scripts/harness/`
    for existing assertions BEFORE changing any CSS value (done three
    times this ticket, correctly found nothing to park each time) is
    now the expected first move on any CSS-value change.
    **Close conditions: (1) review on disk — met; (2) Nick's own
    deploy word — FX8 + M2 together, plus docs riders, one word
    lawfully carries both (manifest: TU2 already shipped at `368fb10`;
    merged-unshipped is FX8 + M2); (3) Nick's own device sitting** —
    the grab/grabbing feel and the pin's new dome read are explicitly
    named as device-sitting business, trusted-CDP harness proof
    notwithstanding.
    **Deployed — 2026-07-21**, Nick's word ("Deploy everything that's
    ready"). Manifest independently re-enumerated before shipping:
    `git log 368fb10..HEAD` — exactly FX8's 3 code commits, M2's 5
    code commits, the two merge commits, and 3 docs-only ledger/
    backlog commits; zero unnamed riders. Re-verified clean at the
    exact deploy HEAD (`7a618c8`) before shipping, not carried over
    from the merge-time check: `tsc --noEmit` clean, `build:web`
    clean. **One disclosed operational hiccup**: `railway up` returned
    after upload without attaching to the log stream (non-TTY
    context), so its actual completion wasn't visible from the first
    call — re-ran it once to get status, which meant two separate
    deployments were triggered (`d225ab87`, `78d1adc9`) instead of
    one. Harmless: Railway itself superseded/removed the first
    (`d225ab87`, still INITIALIZING) the moment the second began
    building, so only one deployment ever reached SUCCESS and only
    one ever served traffic — confirmed via `railway deployment list`
    showing `d225ab87` as REMOVED and `78d1adc9` as the sole SUCCESS.
    `railway up` on `main` @ `7a618c8` (deployment `78d1adc9`,
    SUCCESS), confirmed live via fresh `railway logs`. **Close now
    rests on Nick's own device sitting** (per A2 above and item 46's
    own sitting questions).
46. **M2 — the Rhizome.** **BRIEF COMMITTED — 2026-07-21.**
    `docs/wrizo-alpha/m2-rhizome-brief.md`. An opt-in alternate
    progress visualization — a Progress-style setting (Bar, the
    shipped default | Rhizome), offered only under Progress:Words per
    M1's own precedent, never greyed. **Authority — Nick's commission
    plus eight of Fable's own design rulings**, recorded here: session-
    scoped forward-only growth (never persisted across sessions, its
    own future ticket if ever wanted); seeded determinism (a tiny
    in-repo PRNG, no dependency — same session, same seed, identical
    growth, re-renders never reshuffle); ground never paper (the
    paper's own rect is inviolate — a growing segment that would enter
    it turns away by reflection instead); the rightSlot and the
    background glow's own progress coupling both survive untouched in
    either style (the M1 R1 regression guarded by name); milestones
    are the EXISTING celebration grammar's own events only — nothing
    new invented; offered-never-greyed (the control itself follows the
    same M1 pattern as every other conditional setting); decaying
    growth (per-event caps that shrink the visual load over a long
    session: 200/400/600 segments, 600/24 hard caps, never removing a
    segment — forward-only is the app's own thesis carried into the
    ground itself); and **the growth-form principle recorded as
    PROPOSED CANON, awaiting Nick's own ratification** — every visual
    token-driven (a new `--rhizome-ink` term), zero Plateau literals in
    the engine itself, so a future theme reskins the growth-form
    without touching the mechanism.
    **The milestone burst directly exercises the orange/brass lane
    law** (item 39's own B3 review Ruling 4 territory, now answered in
    the brief's own text): a flash from the rest-state `--rhizome-ink`
    (barely visible, a light brown one step above ground) into the
    theme's own ember/orange token, held ~400ms, eased back over
    ~800ms — ruled EVENTAL, not at-rest, so the lane law holds; B4
    named as the ember treatment's own final authority, literals used
    only where no token yet exists, each commented as B4-provisional.
    **Zero schema, zero new deps** — STOP-and-report if any slice wants
    either; merge pre-authorized as zero-schema per the AB4 precedent;
    Fable reviews post-merge.
    **Gate cleared — 2026-07-21.** TU2 merged (item 43, `c04a1f1`);
    M2's own stated start condition is met. **"No surface overlap"
    with FX8 — CORRECTED at merge time**: both tickets DID touch
    `index.css` (M2's own new `--rhizome-ink` token and stage-anchor
    rules landed near the root CSS variables / goal-glow section;
    FX8's own card-visual rules landed in the board-card section
    entirely elsewhere in the same file) — genuinely non-overlapping
    LINES, not non-overlapping FILES as the earlier note implied;
    git's own 3-way merge auto-resolved both cleanly, confirmed by
    reading each conflict hunk directly rather than trusting the
    auto-resolve blind. **Build starting — 2026-07-21**, via a
    Workflow-orchestrated build+review pipeline (ultracode), off
    post-TU2-merge `main`.
    **BUILT, INDEPENDENTLY REVIEWED, MERGED, AND PUSHED —
    2026-07-21.** Built S1-S5 on `m2-rhizome` off `main` @ `f53a413`,
    in its own worktree.
    **S1 — the setting**, stored on the existing writing-settings
    object, offered via a new `Seg` in the shared settings panel.
    **A disclosed scope-narrowing beyond the brief's own literal
    words**: the control (and the whole growth engine) is gated on
    `framed` in addition to `progress==='words'` — because the framed
    desk stage (≥1100px) has NO incentive row / rightSlot at all in
    either style (a pre-existing AB1-era gate, confirmed by tracing
    `ModeStage.tsx`'s own `{!framed && ...}` condition, not invented
    for this ticket) — building a second, cramped legacy mount point
    for a feature the brief's own reference widths (1100/1280/2200)
    never actually exercise below the frame gate would have meant
    either untestable proofs or reviving a law (`FX1 S5`'s "meter
    track stays empty" below the gate) the brief never asked reopened.
    Legacy stays byte-identical regardless of stored style —
    STRICTER than the brief's own literal wording, matching its own
    higher-order invariant.
    **S2 — the engine**: a pure, framework-free ~10-line PRNG plus a
    reflection-based paper/stage-avoidance algorithm with a
    mathematically-guaranteed convexity-based escape fallback (never a
    silent clip). **One real defect caught by the build's own
    empirical testing before it ever reached the harness**: the
    boundary-avoidance check re-flagged a shoot's own already-valid
    origin tip as "touching" the paper (since the origin sits exactly
    on the paper's own edge by definition) — a from-scratch Node run
    producing zero segments is what surfaced it; fixed by starting the
    avoidance sample one step past the tip, re-verified with a
    40-seed/250-event stress sweep, zero violations.
    **S4 — the milestone burst**, reusing the real `--ember` token and
    the real `CELEBRATE_MS` constant (only its own module-private-ness
    removed, value untouched) — confirmed by the review as genuinely
    pre-existing, not newly introduced to look reused.
    **A second real defect, a React StrictMode hazard**: the growth/
    burst effects' own functional `setState` updaters would have
    double-invoked under StrictMode's dev-only double-render,
    silently burning extra PRNG draws — caught and fixed with a
    `stateRef`-mirrored plain-value `setState`, preserving the same
    cross-effect ordering guarantee without the hazard (dev-only
    exposure, never shipped, still fixed at the root rather than left).
    **A pre-existing, unrelated defect found and plainly NOT fixed,
    named for the record**: `store/deskFrameActive.ts`'s own `active`
    flag can go stale after certain in-app navigation sequences
    revisit a framed route without a reload — reproduces on `main`
    with zero Rhizome code involved, confirmed via a bare repro; only
    affected the build's own harness methodology (worked around by
    comparing growth shape rather than absolute coordinates), never
    any invariant this ticket owns. Out of file scope, flagged not
    fixed — a real candidate for a future small ticket.
    **Independent review — GREEN, no fold, zero genuine defects.**
    Went well past the build's own proof depth: 180 runs (60 seeds ×
    300 events × 3 deliberately hostile geometries — paper covering
    90%+ of a small stage, a paper pinned into a stage corner, a
    thin-sliver stage) generating 45,000 segments with zero paper/
    stage violations, specifically targeting the origin-on-boundary
    edge case the build's own fix addressed; independently hand-
    derived the decay/cap schedule from the brief's own prose alone
    (without reading the implementation first) and matched every
    checkpoint from 50 to 1500 events; traced the M1 R1 regression
    guard to where it actually matters (the legacy 900px width, since
    the framed width has no rightSlot to protect either way — a
    clarification of the build's own claim, not a contradiction of
    it). **The review ran the ENTIRE 30-file/60-run historic suite
    itself**, in one continuous pass, achieving zero FAIL/ERROR
    anywhere — including on the two files (`fx5.mjs`, `fx7.mjs`) the
    build's own report had flagged as flaky under contention, both
    clean this time — DESPITE confirmed genuine concurrent resource
    contention from other active sessions' own harness processes
    running in parallel on the same shared machine at the time.
    **Full suite, CC's own third independent pass on the combined
    (FX8+M2) merged `main`**: `tsc` (desktop+server) + `build:web`
    clean; full 30-file/60-run suite — 57/60 green on the first pass,
    3 confirmed transient on isolated re-checks (`tu2.mjs` default+
    parked, unrelated to this merge since neither FX8 nor M2 touch any
    Tutor file, its 4th clean isolated confirmation this session;
    `w2.mjs` parked, a `SecurityError: localStorage access denied`
    matching the same environmental class already seen with `j4.mjs`
    earlier, clean on its own single re-check). All 60 accounted for.
    **Merged — 2026-07-21** (zero-schema, zero-deps, merge pre-
    authorized per the standing rule — confirmed by both build and
    review independently, `apps/server`/`package.json`/lockfiles all
    empty-diff). Merge commit on top of FX8's own merge, pushed to
    `origin/main`.
    **Not deployed** — Fable's post-merge review still owed; redeploy
    is Nick's call, as always, after that review.
    **Fable's post-merge review landed and is committed — GREEN, no
    fold — 2026-07-21** (`docs/wrizo-alpha/m2-review-fable.md`).
    **Standing on the independent review's own already-thorough
    work** (two real defects found/fixed, 45,000 stress-tested
    segments, the full historic suite run clean under real
    contention) — this review does not duplicate that, it verifies
    the shape of the decisions around it. **Five rulings of record:**
    (1) **the S3 scope deviation ACCEPTED, and the BRIEF ruled wrong,
    not the build** — Fable's own S2/S3 assumed an incentive row
    exists in the framed path to anchor the rhizome to and to keep
    intact; it doesn't (FX1 S5's own parked "meter track stays empty"
    law, cited by both `PageEditor.tsx` and `JournalEntry.tsx`'s own
    framed-branch comments) — the build's own substitution (the
    paper's bottom-center), disclosed twice (component header AND at
    the exact substitution line), and its refusal to un-park a parked
    decision just to satisfy a brief written on a false premise, both
    ruled correct in full — Fable's own error, on the record, not the
    build's; (2) framed-only mounting and the offered-never-greyed
    gating both RATIFIED, with a named consequence: the Rhizome is a
    desk feature, not a narrow-viewport one, matching the actual
    laptop/tablet-first target rather than fighting it; (3) the
    boundary-avoidance fix RATIFIED as the empirical standard applied
    to a math bug — same family as the revert-reproduce-restore proof
    ratified at FX7; (4) the StrictMode fix independently re-verified
    IN THE FILE (traced the ref/setState ordering by hand, confirmed
    both effects read/write the same ref, no desync path found); (5)
    token discipline RATIFIED — `--rhizome-ink` genuinely new, `--ember`
    genuinely pre-existing (not a fresh literal dressed up), reduced-
    motion verified in the stylesheet itself.
    **Two sitting questions, Nick's own eye rules, recorded plainly as
    open, not pre-answered**: Q1 — because the framed path carries no
    bar at all, choosing Rhizome doesn't replace a visible line, it
    appears where nothing was; whether the framed desk should carry a
    visible progress row at all is FX1 S5's own parked question
    reopening, its own future ticket, not a rhizome fix (the M1 R1
    rightSlot guard is noted to pass vacuously in framed mode as a
    named consequence, not a gap). Q2 — `--rhizome-ink` computes to
    roughly 1.5:1 contrast against the desk ground, matching the
    literal ask but close enough to the floor that a dim/glossy panel
    may render it effectively invisible until the ember flash; one
    token line to warm if Nick's own eye says so.
    **One advisory**: S5's own "unit-agnostic" proof (per-event and
    bulk growth byte-identical) is a real property but a narrower one
    than the brief's own literal "growth on both unit settings" words
    — honestly disclosed by the build already, low risk given the
    engine taps the same `unitCount` the bar already consumes, noted
    here so it isn't mistaken for coverage it doesn't actually have.
    **Close conditions: (1) review on disk — met; (2) Nick's own
    deploy word — FX8 + M2 together, one word lawfully carries both;
    (3) Nick's own device sitting** — the growth wandering out from
    under the paper, the ember flare on goal, the ground filling
    without ever touching the page, and the two sitting questions
    above answered by eye.
    **Deployed — 2026-07-21**, Nick's word ("Deploy everything that's
    ready"), same deploy as item 45 (one word, one manifest, both
    tickets — see item 45 for the full manifest re-enumeration, the
    fresh `tsc`/`build:web` re-check at deploy HEAD, and the disclosed
    duplicate-deployment-trigger hiccup, harmless, resolved). `railway
    up` on `main` @ `7a618c8` (deployment `78d1adc9`, SUCCESS),
    confirmed live. **Close now rests on Nick's own device sitting** —
    both close conditions above, Q1 and Q2 included.
47. **A pre-existing geometry-measurement defect, lifted off a
    harness comment onto its own ledger item — 2026-07-21, per
    Fable's own M2 review's explicit instruction.** `store/
    deskFrameActive.ts`'s own `active` flag (driving `App.tsx`'s
    `.app-main[data-desk-frame-active]` DeskRail-gutter reservation
    switch, a 64px measure) can go transiently stale across an
    in-app navigation that revisits a framed route WITHOUT a full
    reload — first found and disclosed by M2's own build (item 46),
    now formally "twice-sighted" per Fable's own review of the same
    ticket. **Effect, precisely**: the gutter's own reserved-width
    state can differ from what a fresh mount would compute, shifting
    any ABSOLUTE stage/paper rect measurement taken during that
    window by a constant horizontal offset — WITHOUT any actual
    change to real layout, rendering, or the paper's own true
    position; a live `getBoundingClientRect()` read during the stale
    window would report a coordinate that doesn't match a fresh
    mount's own read of the same visual state. **Confirmed genuinely
    pre-existing and unrelated to M2's own code**: reproduces on
    `main` with zero Rhizome involved, via a bare `App.tsx`/
    `DeskFrame.tsx`-only repro (M2's own build report). **Impact
    disclosed as narrow so far**: only M2's own determinism harness
    check was actually affected (worked around there by comparing
    growth SHAPE, normalized to the first segment's own start point,
    rather than absolute coordinates — `scripts/harness/m2.mjs`'s own
    Section A comment carries the full technical account this item
    summarizes). No other harness file's own absolute-geometry
    assertion is yet known to be affected, but none has been swept
    for this specific class either — a real candidate first step for
    whoever picks this up. ~~**Not yet triaged into a brief; not yet
    built.**~~ **FOLDED IN — 2026-07-21.** Triaged into item 49 (J6 —
    One Paper) as S1, the fix that must land first since J6's own S2
    is navigation across framed routes and cannot honestly prove
    geometry on a substrate that goes stale on exactly the transitions
    it touches. This item stays open as the historical record of the
    find (M2's build, then Fable's review) and **closes on J6's own
    merge**, not before — see item 49 for the actual fix scope.
48. **The deflake pass — queued, 2026-07-21, per Fable's FX8 review's
    house ruling 4b.** Aggregate transient/contention-suspected
    harness failures logged this session crossed the handoff's own
    threshold for scheduling a dedicated pass rather than continuing
    to re-confirm case-by-case. **Known members, as of this writing**:
    `j4.mjs` (occurrence 1, `SecurityError` reading `localStorage`,
    class later repeated by `w2.mjs`); `fx5.mjs`'s own per-line engage
    motion (confirmed pre-existing against a baseline checkout, not a
    regression); `tu2.mjs` (suite-context-only, never isolated —
    4 total clean isolated confirmations across the session); `w2.mjs`
    (parked check, one suite-context failure, one clean isolated
    32/32 re-run); **`th2.mjs`** (a celebration-animation timing race
    on the goal-fill's brass flash — two flaky modes seen this
    session, an Edge sync-popup crash and this flash-timing wait);
    **`m2.mjs`** (added 2026-07-22 — the SAME celebration/milestone-
    flash timing wait as `th2`, "flash engaged on goal crossing"
    `waitFor` timeout; clean 4/5 in isolation, only fails under
    full-suite/concurrent-build contention on `HARNESS_PARKED=1`,
    never a logic assertion — a timing race, not a regression).
    **Common factor across all**: every failure
    surfaced only inside a full historic-suite run under genuine CDP/
    browser resource contention, several coinciding with a concurrent
    session's own build — never in true isolation. **Scope for the
    eventual ticket**: sweep all (plus whatever the item 47
    geometry-defect investigation turns up) under the newly-ratified
    contention-reproduction practice (see TOOLING STATUS), and decide
    per-check whether each is genuinely transient-under-load-only or
    hiding a real defect the contention just makes more likely to
    surface. **Not yet triaged into a brief; not yet built; not yet
    sequenced** — Nick's own call on timing.
    **RIDER — parked-entry history audit (added on Fable's word,
    2026-07-22, from the CD3 incident, item 53).** When the CD3 fix
    pass's own independent review traced one parked `ab3.mjs` entry
    through its FULL history, it found the entry had been silently
    mutated in-place once BEFORE CD3 ever existed (by B1, `9ce8f6b`) —
    a pre-law violation of the now-ratified parked-entries-immutable
    rule, undetected until that deep trace. B1's specific instance is
    closed (ruled a violation, pre-law, no further action). But the
    systematic question stands: **are there OTHER undetected in-place
    mutations of parked entries anywhere across `scripts/harness/`?**
    This rider queues a one-time systematic sweep — for every parked
    (`pok()` / `HARNESS_PARKED`-gated) entry in every harness file,
    trace it to the commit that FIRST parked it and diff its own
    recorded original text against that commit's text; flag any that
    were later rewritten in place rather than layered. Practice note
    the review raised: "sweep all parked entries" must mean
    full-lineage-to-origin, not just since a ticket's own base commit.
    Folds into this pass's own scheduling — Nick's call on timing.
    **BRIEFED + BUILD STARTING — 2026-07-24 (chat 3), as DF1 — the
    Deflake Pass** (`docs/wrizo-alpha/df1-deflake-brief.md`,
    Fable-authored, from this item + the review riders). **HARNESS-ONLY**
    (zero `src/`/schema/server/deps); if a flake's root cause is a real
    product bug, STOP that slice and report — product fixes do not ride a
    deflake ticket. Founded off `main` (M3 `7ebe703` + CD4 already landed;
    disjoint from everything in flight), own worktree, guard-rail before
    every commit, ledger on `main` only; the brief-commit + this ledger
    entry go straight to `main` via the fast-forward records push (the
    S0-push law's own provision — chat 1's lane is for merges, untouched).
    Merge rides the zero-schema pre-auth through chat 1's lane; Fable
    reviews post-merge; harness files ship nothing (no deploy). Slices:
    **S1** `fx5` per-line-engage/scrollTop flake root-caused + the
    isolation-rerun crutch retired (wait-for-condition on the observable,
    never a longer sleep; the assertion must not weaken — else a proper A4
    park); **S2** `th2`+`j4` verified mid-suite ×5 (fix per S1 or record
    CLEARED with evidence — the list shrinks only on evidence); **S3** `e1`
    anchor hardening (parser-side ONLY — the exported bytes never change —
    corpus-aware count/split with the anchors as cross-checks + one hostile
    `# `/marker fixture); **S4** the parked-entry history audit (a reusable
    `scripts/audit-parked-records.mjs` + `docs/wrizo-alpha/parked-records-
    audit-2026-07.md`, corroborating — not rediscovering — B1's `9ce8f6b`
    pre-law bump). **DoD is empirical: THREE consecutive full-suite runs,
    both settings, deterministic, zero isolation reruns** — the crutch
    formally retired for every file cleared, the known-flake list updated
    to the truth, the audit report on disk. After DF1, a red suite means
    something is wrong — nothing else. Drift-check: ZERO structural drift;
    the only delta is the suite count — **39 files now** (`cd4.mjs` landed
    since the brief's "38"), the DoD reads "the full suite" against that.
49. **J6 — One Paper.** **BRIEF COMMITTED — 2026-07-21, Fable-authored**
    (`docs/wrizo-alpha/j6-one-paper-brief.md`). **Authority**: item 41
    finding 1 (Nick's second sitting — the Journal's "New Page" routing
    finding, held for Fable rather than built directly with FX7), and
    Fable's own ruling that it becomes J6. **Scope, in her own words**:
    the literal finding is one `navigate()` call; the real finding is
    that the app has no single source of routing truth, and fixing
    that properly first requires evidence this ticket doesn't yet
    have — so this ticket deliberately does NOT flip the
    `JournalEntry.tsx`/`PageEditor.tsx` routing predicate. Four slices:
    **S1** fixes item 47's own geometry substrate (folded in here,
    cross-referenced above — lands first because S2's whole subject is
    navigation across framed routes); **S2** extracts today's
    duplicated-in-four-places routing predicate into one
    `routeForEntry` call, behavior-identical, STOP-and-report on any
    landing-surface diff; **S3** authors
    `docs/wrizo-alpha/j6-parity-census.md` from the code — every
    capability each of the two surfaces has that the other lacks, with
    a port-now/port-later/retire/needs-its-own-ticket recommendation
    per item — the ticket's real deliverable, and what J7 gets briefed
    from; **S4** harness (`j6.mjs`) plus the full historic suite.
    **Zero schema, zero server files, zero new deps** — merge
    pre-authorized as zero-schema per the AB4 precedent. **Deploy
    explicitly NOT pre-authorized** — Nick's separate word, standing
    default. **Build starting — 2026-07-21**, on `j6-one-paper` off
    post-FX8/M2-deploy `main`, own worktree per ONE CHECKOUT PER AGENT.
    **FX9 (the Folded Lists) may run in parallel** in its own worktree
    per Nick's own word — no surface overlap (cascade menu chrome vs.
    routing/geometry substrate) — FX9's own brief landed and its build
    started the same sitting; see item 50.
    **Built S1-S4 on `j6-one-paper` off `main` @ `b3b1cfb`, in its own
    worktree — 2026-07-21.** **A genuine mid-build incident, disclosed
    in full**: this build's own agent completed all four slices
    cleanly (each its own commit) and had launched its own full
    historic-suite verification when an UNRELATED interrupt in the
    orchestrating session's own conversation cascaded down and killed
    its foreground turn — the agent never wrote a final report, and
    (per the newly-relevant half of the already-ratified
    placeholder-report rule) that silence was treated as exactly what
    it was: no report exists, full stop, not "probably fine." The
    orchestrating session recovered the actual state directly rather
    than re-building blind: confirmed all 4 commits intact with a
    clean working tree; recovered the build's own already-running
    background suite log, which had in fact reached completion after
    the interrupt (the AGENT's foreground wait died; the underlying
    suite process did not) — 30/30 files green under both
    `HARNESS_PARKED` settings, with exactly one crash
    (`th2_parked1`), traced to a stray Edge sync-confirmation popup
    interrupting page navigation mid-test (every real assertion in
    that file had already passed immediately before the crash) —
    re-ran 3/3 clean in true isolation, confirmed transient, unrelated
    to any code in this diff. Independently re-ran `tsc --noEmit` and
    `build:web`, both clean. Pushed the verified branch to origin
    (the build's own "report = push" step never happened; the
    orchestrating session completed it).
    **S1's real root cause, more precise than the brief's own
    framing** (found by the independent review, not assumed from the
    brief): `DeskFrame` and its three top-level subscribers
    (`AppMain`/`GlobalHeader`/`DeskRail`) can race on the app's very
    first commit (a hard reload landing directly on an already-framed
    route) because React fires passive mount effects bottom-up — a
    narrower mechanism than "stale across an in-app navigation," but
    the fix (`useSyncExternalStore`, reading the snapshot synchronously
    on every render) closes the whole class, not just the narrow repro
    shape, and exceeds the brief's own literal ask. Item 47 CLOSES
    here, on this fix landing — see item 47 for the full original
    defect record.
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21**, run fresh after the recovery above (the ticket's own
    automated review never ran for the same reason its build never
    finished its own report — this review carries that net alone, and
    says so). Re-verified independently, not on the build's word: S1's
    fix mechanism (traced by hand, cross-checked against M2's own
    build-report observation of the same defect from a different
    angle); S2's `routeForEntry` byte-for-byte match against every
    migrated call site, including a bonus site the build found and
    disclosed beyond the brief's own list (`store/resume.ts`'s
    `fromEntry`); zero-schema/zero-server/zero-deps by direct diff
    census; `tsc`, both build paths, and `j6.mjs` all re-run
    independently from a cold `node_modules` install — 36/36 checks,
    matching the commit's own claimed count. **Two real, cosmetic
    defects found in `j6-parity-census.md`** (not in any shipped
    code): §1.1 claims no ink import exists in `BoardEditor.tsx` —
    one does (`renderStroke`, read-only display of an already-ported
    ink box, not authoring; the census's actual conclusion still
    holds, the literal sentence doesn't); §2.1 cites
    `ForwardOnlyEditor.tsx` as 717 lines, actual is 625. Neither
    changes any recommendation in the document. Worth a one-line fix
    before J7 is briefed off this document — Nick's call whether it
    waits.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized).
    `git merge --no-ff origin/j6-one-paper` onto `main` @ `b66ad81` —
    clean, no conflicts. Re-verified at the merge HEAD: `tsc`
    clean, `build` clean; the full historic suite was re-run again
    across the combined J6+FX9 tree (see item 50's own record for the
    shared `CascadePanels.tsx` merge and that suite run's result).
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — `railway up` @ `b936f67`, deployment
    `70181bfe`, SUCCESS; see item 54 for the full manifest. **Close
    now rests on Nick's own device sitting.**
50. **FX9 — the Folded Lists.** **BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/fx9-folded-lists-brief.md`).
    **Authority**: item 41 finding 11 (Nick's second sitting —
    collapsible list menus), Fable's ruling naming it FX9 (renamed
    from the FX8 collision per the ledger-item-claims-the-number rule
    — see item 45 for the rename's own history). **Scope**: every
    list-bearing section in the cascade's panels
    (`DrawersPanel`'s per-project clusters + its documents list,
    `JournalPanel`'s recent list, `ShelfPanel`, `TrashPanel`) gains a
    header disclosure toggle — the whole header is the hit target, an
    olive (never brass/orange) chevron per the lane law, ~180ms house
    timing with a reduced-motion instant-toggle branch, proper button
    semantics (`aria-expanded`, keyboard-operable, focus-visible).
    **S2** persists open/closed state per-section, client-local only
    (`firstRun.ts`/`tutorDisclosure.ts` shape, zero schema), keyed by
    stable id never title; **first-ever default**: sections with more
    than six items open collapsed, six or fewer open expanded, and any
    explicit writer toggle is sovereign thereafter. **S3 — a design
    law, not a preference**: a folded header may carry its own name
    and chevron and NOTHING else — no counts, no badges, no dots; a
    build that adds one is STOP-and-report (A14's spirit; M1's
    coverage-never-verdicts, extended here). **S4** harness
    (`fx9.mjs`) including a mandatory negative assertion (no collapsed
    header anywhere renders a numeral or badge) and the geometry
    invariant that folding a list must never move the paper. **Zero
    schema, zero server files, zero new deps** — merge pre-authorized
    as zero-schema per the AB4 precedent. **Deploy explicitly NOT
    pre-authorized.** **Build starting — 2026-07-21**, on
    `fx9-folded-lists` off `main`, own worktree per ONE CHECKOUT PER
    AGENT, in parallel with J6 (item 49) per Nick's own word — J6 owns
    routing/geometry, FX9 owns cascade panel chrome; **if both touch
    `CascadePanels.tsx`, first to merge wins the base and the other
    rebases** (Nick's own sequencing rule, recorded here so whichever
    session merges second knows to check first).
    **Built S1/S2/S4 on `fx9-folded-lists` off `main` @ `2c1e18d`, in
    its own worktree — 2026-07-21** (S3 is a design constraint, not a
    separate code slice — verified inside S4's own harness).
    **The same mid-build incident as item 49, disclosed the same
    way**: this build's own agent completed its real work cleanly
    (all commits landed, working tree clean) but its own foreground
    verification turn was killed by the same unrelated session
    interrupt described in item 49, mid-poll on its own background
    suite log. The orchestrating session recovered the state
    directly: confirmed commits + clean tree; recovered the build's
    own already-completed `HARNESS_PARKED=0` pass (30/30 green); ran
    the still-missing `HARNESS_PARKED=1` pass itself (properly
    tracked the second time — the first attempt broke its own
    background tracking by nesting a shell `&` inside the tool's own
    backgrounding, a self-inflicted, disclosed process error, not a
    suite result). That parked=1 pass showed three apparent failures
    (`b2-1`, `fx5`, `j4`) — re-run in true isolation: `b2-1` and `j4`
    came back clean (contention artifacts, other tickets' own harness
    runs sharing the machine at the time); `fx5`'s own "S1(a):
    per-line engage motion" check failed 3/3 times even in true
    process isolation — **confirmed as the exact SAME pre-existing
    flake already tracked at item 48**, not a new regression: FX9's
    own diff (`CascadePanels.tsx`, `index.css`, `store/sectionFold.ts`,
    its own harness) has zero overlap with the typewriter-fade/scroll
    code that check exercises, and the ledger already carries this
    check's own prior "confirmed pre-existing against a baseline
    checkout" record from before this ticket existed. Independently
    re-ran `tsc --noEmit` and `build:web`, both clean. Pushed the
    verified branch to origin (again, the build's own "report = push"
    step never happened; completed by the orchestrating session).
    **Independent post-build review — GREEN, zero defects found —
    2026-07-21**, run fresh after the recovery above for the same
    reason as item 49 (the automated review never ran; this review
    carries that net alone). Genuinely thorough, not a rubber stamp:
    independently re-ran `tsc` (both invocations), `build:web`, and
    `fx9.mjs` itself (41/41, both `HARNESS_PARKED` settings, from a
    cold `node_modules` install); independently re-ran the TWO other
    harness files the build's own park-sweep comment named as the
    only other hits on the fold's touched selectors (`cd2.mjs` 50/50 +
    3 parked, `b2.mjs` 84/84 + 2 parked) rather than trusting that
    claim; wrote and deleted a throwaway CDP screenshot script to
    visually confirm collapse/expand states and the total absence of
    any numeral; confirmed the header hit-target, olive-only chevron,
    real `aria-expanded`, id-keyed persistence, and the mandatory
    no-badge negative assertion all by reading the actual code and
    re-running the actual assertions, not by reading the harness's own
    comments. **One real, honestly-handled divergence from the brief's
    own text, not a build defect**: the brief's own "verified
    structure" section claimed `ShelfPanel`/`TrashPanel` "render their
    own lists" — they don't; both were already retired to single
    door-buttons by earlier tickets (B2 S1/S3, B1 S5). The build
    caught this live, declined to fold what doesn't exist, and the
    harness carries two dedicated checks disclosing exactly this — the
    same "brief's premise was stale, build's own read of the live code
    correctly won" pattern already seen at J6's S1 and M2's S3.
    Two advisories for Nick's own eye, non-blocking: an UNTOUCHED
    section's fold state recomputes live from the current item count
    on every render (a project cluster you've never manually folded
    could visibly snap shut mid-session past its 7th item) — a
    deliberate, correct reading of the brief, but a state change with
    no click from you, worth a glance live; hover feedback is
    intentionally subtle (only the title brightens, the chevron never
    changes) per S1's own law, worth confirming it reads as
    "responsive" rather than "inert" at a real device.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 49's own merge tip. **The anticipated
    `CascadePanels.tsx` overlap with J6 (item 49), handled exactly as
    the sequencing rule above intended**: J6 merged first (its own
    entry), FX9 merged second; git's own 3-way merge auto-resolved
    `CascadePanels.tsx` with no conflict markers — verified directly
    rather than trusted: read the merged file, confirmed J6's
    `routeForEntry(entry)` calls and FX9's `FoldSection`/
    `useSectionFold` machinery both genuinely coexist (the fold wraps
    list items that themselves call the new routing helper on click —
    the two tickets' own concerns compose exactly as the "different
    surfaces" sequencing note predicted, not merely avoid colliding).
    Re-verified at the merge HEAD: `tsc` clean, `build` clean. The
    full historic suite was re-run a third time across the combined
    J6+FX9 tree specifically to catch any interaction defect neither
    ticket's own isolated testing could have — **clean, `ALL DONE`,
    one failure (`th2_parked1`, 2/42), re-run 3/3 clean in true
    isolation.** This is a DIFFERENT known `th2.mjs` flake than the
    Edge-popup crash disclosed earlier in this item (a celebration-
    animation timing race on the goal-fill's brass flash, already
    documented from TU2's own deploy verification) — `th2.mjs` now
    carries two independently-confirmed pre-existing flaky failure
    modes on record, neither touched by J6 or FX9's own diff (routing
    and cascade-fold code, nowhere near a celebration animation). No
    interaction defect found between J6 and FX9.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting.**
51. **E1 — Get My Words Out.** **P0 — BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/e1-get-my-words-out-brief.md`).
    **Outranks every ticket in the queue, including J6 and FX9 in
    flight.** Nick departs 2026-08-04 intending to draft his own book
    in this app; verified at his device the same day, Publish's "Copy
    My Words"/"Copy Formatted" read as dead and there is no file
    export of any kind. Nick's own finding, quoted: a writer who
    cannot get his words out of Wrizo cannot safely write in Wrizo.
    **Authority**: Nick's survival check 0.1, failed, 2026-07-21; the
    ratified anti-slop rail's own "the writer's own text must remain
    copyable OUT" clause. **S1** diagnoses the two Publish buttons
    live before touching them — genuinely broken vs. working-but-
    silent is a different fix, root cause reported first, no
    guessing. **S2** makes both buttons work and SAY SO (a house-
    register confirmation via `deskLexicon`, reusing the existing
    toast/quiet-line pattern). **S3 — the ticket's reason for
    existing**: a Download action on Publish, three scopes (this page
    as `.md`+`.txt`; this binder as ordered per-page files or one
    clear-separated document, builder's call, disclosed; **Everything
    — every page the writer owns, the vacation insurance, the most
    important item in this brief**). Non-prose kinds export honestly
    rather than perfectly (Script via `serializeScriptDoc`; Board as
    a plain card-text list; ink as a named placeholder line, never
    silently dropped) — nothing a writer typed may be missing from a
    claimed-complete export. **S4** keeps the coming-soon line but the
    surface no longer reads as a dead end. **S5** harness (`e1.mjs`)
    proves round-trip byte content for page/binder/Everything against
    a seeded corpus, asserts exported-document count equals the
    writer's own page count (no silent omissions), safe filenames on
    Windows and macOS, and — the check this ticket exists for — every
    export path proven **with the network fully unavailable**. Zero
    schema, zero server files, zero new deps (client-side by
    construction, which is also what makes it work on a plane). Merge
    pre-authorized as zero-schema. **Deploy explicitly NOT
    pre-authorized** — though given the P0 urgency and the 2026-08-04
    deadline, expect Nick's own deploy word to follow close behind a
    clean review, not to wait for a routine sitting. **Build starting
    — 2026-07-21**, on `e1-words-out` off `main`, own worktree, IN
    PARALLEL with J6 and FX9 (Nick's own explicit word — the brief's
    stated priority over the in-flight tickets does not mean queued
    behind them, it means it does not wait for them).
    **Built S1-S5 on `e1-words-out` off `main` @ `30961fc`, in its own
    worktree — 2026-07-21.** **A separate, independent occurrence of
    the already-ratified placeholder-report class**: this build's own
    agent completed all five slices cleanly (4 commits, clean working
    tree) but its own final message was a stalled status line ("I'll
    end this turn now... then proceed with verification...") rather
    than an actual completion report — NOT caused by the session
    interrupt that hit J6/FX9 (this build finished on its own timeline,
    unrelated), a genuinely separate instance of the same bug class.
    Treated the same way regardless of cause: no report exists, no
    close condition rests on one. The orchestrating session pushed the
    branch itself (the build's own "report = push" step never ran).
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21**, dispatched because the automated review's own build
    handoff claimed a push that hadn't happened — the review caught
    this itself (`git ls-remote origin` showed no `e1-words-out`) and
    disclosed it plainly rather than silently working around it.
    Genuinely thorough: fresh `pnpm install`, `tsc` ×2 and `build:web`
    re-run clean; `e1.mjs` re-run fresh, 32/32; the S1 diagnosis
    checked against the actual pre-image code (confirmed accurate —
    a discarded promise with an unreachable fallback on the failure
    path, not just "silent"); the Everything export exercised against
    a real seeded corpus with the counting logic traced to its actual
    source functions, not taken on faith; the offline proof
    independently re-tested beyond the harness's own claim (a
    standalone script confirming real `fetch()` calls genuinely fail
    with the network cut, both external and same-origin); the
    `safeFilenameBase` function copied verbatim into ~25 adversarial
    inputs, all sanitized safely; Windows reserved device names
    (`CON`, `NUL`, etc.) traced all the way to an actual CDP download,
    confirmed Chromium's own download manager auto-renames them,
    non-issue in practice, verified not assumed.
    **One real, moderate defect found, and fixed before merge — a
    judgment call, disclosed as such.** The review reproduced, via
    the identical CDP download mechanism the harness itself relies on
    for every other byte-level claim in this ticket: two different
    pages sharing a first line, downloaded individually via "This
    Page," computed the same filename and the second download
    silently overwrote the first on disk — no error, no warning, one
    page's words gone. Root cause: `dateStampFallback()` has no time
    component, and no id-based disambiguator existed at all, so any
    two same-titled (or two same-day-blank) pages collided
    deterministically. Given this ticket exists specifically so Nick
    can trust his words are safe before his 2026-08-04 departure, and
    the reviewer characterized the fix as cheap, the orchestrating
    session implemented it directly rather than deferring to a
    follow-up ticket: `exportPageFiles` now always appends a short,
    stable suffix from the entry's own id, so re-downloading the SAME
    page stays idempotent while two DIFFERENT pages can never collide
    regardless of title or date. Added a new harness check proving two
    same-titled entries now produce two distinct files with BOTH
    pages' own distinct words intact (caught and fixed one bug in the
    check's own test fixture along the way — two contrived entry ids
    that happened to share their own first 6 characters, defeating the
    very disambiguator under test; not a real-world risk, since
    production ids are opaque random tokens, but disclosed since it's
    exactly the kind of self-inflicted false-negative this house's
    own harness discipline exists to catch). Re-verified clean: 34/34,
    both `HARNESS_PARKED` settings, `tsc` clean.
    **CORRECTION OF RECORD — 2026-07-23, per Fable's E1 post-merge
    review + E1.1's own S5 (item 55). THE CLAIM ABOVE IS FALSE: that
    filename-collision fix never landed on `main`.** The fix WAS made
    — but in the E1 build worktree only, uncommitted; the branch
    (`origin/e1-words-out`) never carried it, and E1's own merge
    pulled the branch, so `main` shipped WITHOUT it. The paragraph
    above wrongly recorded a worktree edit as a merged fix. Verified
    2026-07-23: `exportPageFiles` carried no id-suffix on `main`,
    `e1.mjs` carried no collision check on `main`. **E1.1 (item 55)
    lands the fix for real** — adopting the orphaned worktree change,
    then hardening it (the orphaned `slice(0,6)` drew from the id's
    TIMESTAMP head and would still collide same-tick pages; E1.1 uses
    `slice(-6)`, the random tail) and doing the harness parking
    lawfully (the orphaned version had edited the original assertion
    in place — an immutability violation E1.1 did not repeat). No
    euphemism: the record was wrong, and this is what actually
    happened. See item 55.
    **The self-inflicted test-fixture bug the false paragraph
    describes ("two contrived entry ids that happened to share their
    first 6 characters") was, ironically, the true tell** — those
    shared-prefix ids only collided under `slice(0,6)` (the head), the
    exact bug E1's own fix carried; the "fix" to the fixture (making
    the ids differ) masked the algorithm's own head-slice hole rather
    than exposing it. E1.1's harness deliberately restores shared-head
    ids to prove `slice(-6)` closes it.
    **Two cosmetic advisories from the review, not actioned, low
    priority**: `MultiDocResult.count` is computed but never consumed
    by any caller (the harness verifies count independently via the
    file's own bytes instead — arguably the stronger test regardless);
    "Copy My Words"/"Copy Formatted" button labels remain hardcoded
    strings, pre-existing from AB2, not introduced by this ticket.
    **Full historic suite: clean except the already-tracked item 48
    flake, re-confirmed with zero code-path overlap.** One failure
    (`fx5.mjs`'s own "S1(a): per-line engage motion" check) — E1's own
    diff to `PageEditor.tsx` was read line-by-line and confirmed
    confined entirely to the Publish dialog (the new download/copy
    wiring); it touches no scroll or typewriter-fade code at all, so
    this is the same pre-existing, already-ledgered flake reproducing
    again, not a regression.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 50's own merge tip. Clean, no conflicts (zero file
    overlap with J6/FX9). Re-verified at the merge HEAD: `tsc` clean,
    `build` clean.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. The P0 "vacation insurance" (the offline
    export path) is now live ahead of Nick's 2026-08-04 departure.
    **Close now rests on Nick's own device sitting.**
52. **FX10 — the Room's Edges.** **P0 alongside E1 — BRIEF COMMITTED —
    2026-07-21, Fable-authored**
    (`docs/wrizo-alpha/fx10-rooms-edges-brief.md`). Nick confirmed the
    Tutor is answering from DeepSeek — and that the panel itself is
    unusable, so unusable a writer "wouldn't even be able to tell."
    TU5 (the Tutor's memory) is pointless until the room it lives in
    is habitable, so this ticket gates the rest of the Tutor arc.
    **Authority**: Nick's device findings, 2026-07-21, quoted per
    slice in the brief. **Fable's own error acknowledged on the
    record** (see item 43's own new correction note above): TU2's
    brief specified the panel's open width as "exactly 2× the tool
    strip's width token" (~168px), the build implemented that
    faithfully, and the number itself was wrong — this brief corrects
    it, not the build. **S1**: the Tutor becomes a genuine horizontal
    drawer opening rightward flush from the paper's edge, the exact
    mirror of the tool pop-out's own motion (constants reused,
    measured not approximated); width becomes a real reading measure,
    `clamp(320px, 34% viewport, 460px)`, further clamped against the
    paper's own clearance law (FX2), overlaying below that per the
    existing CD2 law; no scroll-within-scroll — the panel scrolls as
    one column; the conversation becomes the panel's own center of
    gravity now that the room is wider. **S2**: the left rail's own
    exemption from the vanishing law is a real bug — root-caused
    before fixed, then wired to the same one vanishing engine
    everything else obeys. **S3**: a dissolved-but-open menu must
    restore on pointer APPROACH, not require a click — root-caused
    first; if shared machinery, fixed at the source for every
    dissolved surface. **S4**: the scrollbar moves flush to the
    paper's outer right edge, zero gap, without changing the text
    measure (FX2's clearance law). **S5** harness (`fx10.mjs`):
    open-width-matches-clamp at 1100/1280/2200; grip flush closed and
    open; paper rect invariant across every state; no descendant of
    the panel owns its own scrollbar; motion duration/easing read
    live and asserted equal to the tool pop-out's own values; rail
    dissolves with the rest of chrome; **hover-restore proven with a
    genuine trusted pointer move and no click** — trusted-pointer law,
    synthetic dispatch does not count; scrollbar flush with zero gap,
    text measure byte-identical. TU1/TU2 geometry checks superseded by
    S1 parked per A4, live successors named. Zero schema, zero server
    files, zero new deps. Merge pre-authorized as zero-schema.
    **Deploy explicitly NOT pre-authorized**, same P0-urgency
    expectation as item 51. **Build starting — 2026-07-21**, on
    `fx10-rooms-edges` off `main`, own worktree, IN PARALLEL with E1
    (different surfaces) and with J6/FX9 (Nick's own explicit word).
    **Noted overlap risk, per the brief's own words: if J6 lands
    first, FX10 rebases** — J6 and FX9 already carry the analogous
    `CascadePanels.tsx` first-to-merge-wins rule (item 50); this is
    the same class of risk on a different file, disclosed the same
    way.
    **Built S1-S4 on `fx10-rooms-edges` off `main` @ `82d8917`
    (7 commits), own worktree — 2026-07-21. A genuinely complete
    build report this time, no placeholder.** Two of S1's own facts
    corrected beyond the brief's own literal words, both found by
    measuring the real code rather than assuming: TU2's own earlier
    retrofit had mirrored the WRONG constant (Cascade's dock-panel
    timing, not the tool sliver's own) — the panel now genuinely
    matches the sliver's real transition property-for-property. S2's
    root cause was NOT a broken subscription — `DeskRail` never
    mounts on a framed surface at all; the actual element was
    `.desk-frame-strip`, DELIBERATELY exempted from the vanishing law
    by an earlier ticket (CD2 S1) — now wired into the same one
    engine. S3's root cause: every dissolved surface carries
    `pointer-events:none`, so hover could never fire in the first
    place, and the existing edge-detection zone didn't reach a panel
    sitting well inland — fixed at the source (a window-level
    coordinate sweep, same dwell/jitter state machine, no second
    implementation), confirmed shared across two independent
    surfaces. **Two of the build's own bugs found and fixed during
    its own park sweep, disclosed as such**: a closed sliver panel
    twice miscounted as "reachable" (first via a width-only check,
    then via an opacity-only check that also failed once the room
    itself was dissolving) before landing on the only reliable
    signal, the component's own `data-open` attribute. S4's flush fix
    proven algebraically, not just measured to look right. Park sweep
    found ONE MORE genuine falsification beyond the brief's own
    anticipated `tu2.mjs` checks — `cd2.mjs`'s own "strip never
    dissolves" check, found via the full-suite run itself, correctly
    parked with a live successor; its own sibling check (opacity
    within 150ms of a keystroke) was NOT falsified and correctly left
    live, a real distinction drawn rather than parking defensively.
    Full suite run twice — first pass found and fixed the two real
    regressions above, plus two self-inflicted crashes from the
    build's own concurrent `build:web` clobbering `dist-web` mid-test,
    disclosed as such; second, undisturbed pass: 61/62 clean, the one
    exception being the same `fx5.mjs` pre-existing flake — **applied
    the contention-reproduction practice rigorously**: 7 isolated
    re-runs across both passes, 4/7 failed (~57%, consistent with a
    genuine wall-clock-sensitive timing flake), while every one of
    the build's OWN S3 hover-restore checks passed 7/7, positively
    confirming the flake is unrelated to this ticket's own scope
    rather than just asserting it. `tsc`, both build paths, and
    `build:web` all clean. One open question honestly left open
    rather than silently assumed: S4's fix is confirmed live only for
    prose/`.mode-scroll`; Screenplay's differently-nested scroll
    container couldn't get a live repro this session, flagged for
    Nick's own eye.
    **Independent post-build review — GREEN WITH ADVISORIES,
    2026-07-21.** All nine requested verification items, including
    both invariants flagged high-severity if broken (the trusted-
    pointer proof; the single-vanishing-engine rule), checked out
    against the actual code and live harness re-runs, not the build's
    prose. S1's motion equality verified byte-for-byte in the actual
    CSS (identical property list, custom property, easing — only the
    mirrored `translateX` sign differs). S3's trusted-pointer claim
    traced all the way to `runtime-verify.mjs`'s own CDP call and
    confirmed the harness's S3 section never calls
    `mouseDown`/`mouseUp`/`click` anywhere in the actual restore
    proof. **A genuine bonus check, not requested**: noticed the
    branch's own merge-base predated J6+FX9+E1 landing on `main` and
    the brief's own explicit rebase instruction had not been followed
    — test-merged current `main` into the branch locally (`git merge
    --no-commit`, nothing committed), built it, and ran `fx10.mjs`,
    `fx9.mjs`, and `j6.mjs` against the REAL merged tree: all clean,
    zero conflicts — lower actual risk than the staleness alone
    implied, but correctly flagged that a real rebase or fresh
    full-suite pass against the merged tree should still happen
    before landing. **Three defects found, all cosmetic/low-severity,
    none blocking**: a stale doc comment in `DeskFrame.tsx` (pre-
    existing, untouched by this diff) now contradicts a second,
    correctly-updated comment 150 lines later — the file
    self-contradicts on whether the strip still "never dissolves,"
    worth a one-line fix; the never-rebased branch itself, addressed
    below; a minor perf note (a DOM scan per `pointermove` while
    chrome is dissolved) — correctly gated behind a rare/short-lived
    state, unlikely to be perceptible.
    **Merged — 2026-07-21** (zero-schema, merge pre-authorized), onto
    `main` @ item 51's own merge tip — addressing the review's own
    rebase advisory with a real merge rather than a spot-check.
    `git merge --no-ff origin/fx10-rooms-edges` — clean, no
    conflicts, `index.css` auto-resolved (matching the review's own
    test-merge finding exactly). Re-verified at the merge HEAD: `tsc`
    clean, `build` clean.
    **The attempted full-suite re-run across the combined tree was
    contaminated and its own result is void — see item 53 for the
    full account.** In short: while chasing two apparent failures
    (`fx9`, `hb1`) in that run, this session discovered a SEPARATE,
    concurrent session had been editing 11 files directly in this
    same shared primary checkout, uncommitted — a real
    ONE-CHECKOUT-PER-AGENT violation on that other session's part.
    The `build:web` this suite run used had silently picked up that
    session's own in-progress edits (including a since-ruled-correct
    removal of PageEditor's "Done" button), which is what produced
    the apparent failures — neither was a real FX10 defect. FX10
    itself remains fully verified clean on its own terms: its own
    build ran the full 30-file suite twice pre-merge (61/62 clean,
    one already-tracked flake), its own independent review
    additionally test-merged current `main` and re-ran `fx10`/`fx9`/
    `j6` clean, and this session's own `tsc`/`build` checks at the
    actual merge HEAD were clean throughout. **A true full-suite run
    across the final combined tree (J6+FX9+E1+FX10+CD3) is deferred
    to CD3's own merge** (item 53), rather than run twice.
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting** (the Tutor drawer, the rail dissolve, hover-restore, the
    scrollbar flush).
53. **CD3 — the Strip's Order.** **P0-adjacent — a genuine cross-
    session collision, disclosed in full, 2026-07-21/22.** A second,
    concurrent Claude session — working directly with Nick and Fable,
    outside this ledger's own conversation — did real, Nick-approved
    work on the left menu strip and top-bar chrome DIRECTLY in this
    shared primary checkout, uncommitted: a ONE-CHECKOUT-PER-AGENT
    violation on that session's part (its own later brief explicitly
    names the rule it broke: "own worktree — never the primary
    checkout"). Independently, Fable wrote a revised "FX10" brief to
    absorb this same chrome work — **not knowing this session had
    already built, reviewed, and merged the real FX10 (item 52)
    earlier the same sitting.** Two genuine misses compounding, not
    bad faith on any side. **Discovered** when this session's own
    post-merge full-suite verification (see item 52) picked up the
    other session's uncommitted edits and produced two apparent
    failures that traced back to a stray, unrelated working tree, not
    a real defect.
    **Handling, in order**: (1) the 11 files of uncommitted work were
    committed verbatim to a new branch, `cd3-strip-and-chrome`, and
    pushed, protecting them from loss — the code itself (left-strip
    reorder/recolor/resize, Trash-to-foot, "Themes" rename, a
    separator, flush-to-topbar, the Done-button removal from Page and
    Script) was never touched or altered. (2) Fable's own revised
    brief was preserved verbatim under a new filename,
    `docs/wrizo-alpha/cd3-strip-and-chrome-brief.md` (NOT left at
    `fx10-rooms-edges-brief.md`, which is the path the REAL, merged
    FX10 was actually built from — overwriting it there would have
    corrupted that build's own historical record), with a clearly-
    separated editorial note explaining the collision. (3) An
    independent audit (Workflow, isolated worktree) ran Fable's own
    S1 audit methodology from that brief against the actual committed
    diff.
    **Audit findings, 2026-07-21**: the underlying visual/functional
    work verified genuinely sound (DOM queries, computed styles, live
    geometry, forced-hover rendering, a real trusted-pointer click
    proving a legacy-width exit exists via `DeskRail` — a separate,
    pre-existing rail, distinct from the framed-only strip — so the
    Done-button removal's own safety premise holds). **But two real
    defects found, both process, not product**: (a) a SYSTEMIC A4
    violation — of 9 harness assertions the strip's changes falsified
    across 5 files (`ab3.mjs`, `b1.mjs`, `cd1.mjs` ×3, `cd2.mjs` ×3,
    `fx3.mjs`), **zero** were properly parked; every one was edited in
    place to agree with the new code, including one case of directly
    mutating an ALREADY-parked historical entry in `cd2.mjs` — exactly
    the failure mode Fable's own brief named and told the audit to
    catch. (`fx9.mjs`'s own edit — index renumbering only, no
    assertion content changed — was legitimate, not a violation.)
    (b) `hb1.mjs` was left untouched entirely despite asserting the
    Done button's own presence — now genuinely, deterministically
    failing (3/3), a real live gap, not a false alarm.
    **Fix authorized directly by Fable, 2026-07-22**: "fix it
    yourself [not the other session] — sending it back costs days and
    the other session doesn't hold the audit." Scope: recover each of
    the 9 original assertions' exact text from git history (never
    reconstructed from context — `main` @ `8884d49` is the only
    acceptable source), park each properly (SUPERSEDED marker,
    one-line reason, live successor), sweep ALL parked entries across
    all six touched files for additional mutations beyond the one(s)
    already found (the two sessions' own reports disagreed on which
    file held the mutated entry — `cd2.mjs` per this session's audit,
    `ab3.mjs` per the other session's own report — both being checked,
    plus every other parked entry in all six files), fix `hb1.mjs`
    with a live successor scoped to Page and Script ONLY (the Board
    face keeps its own Done button by explicit ruling — it has no
    rail and no Pages/Plan toggle, Done is its only exit there), and
    add two new canon checks the audit didn't cover: nothing brass at
    rest across the WHOLE reordered strip (not a single spot-check),
    and the paper's own rect + text measure genuinely unchanged at
    1100/2200 (a real equality proof against `main`'s own pre-CD3
    geometry, not an inference from the breathing-room number).
    **New standing law proposed by Fable, Nick's own ratification
    still pending, NOT yet in force as of this writing**: parked
    entries are immutable — may be superseded again, re-pointed at a
    new successor, or annotated, but a parked entry's own recorded
    original text is never rewritten. Recorded here as PROPOSED per
    the house's own standing practice of never marking a rule ratified
    without Nick's own explicit word in the same turn — see the
    S0-push rule's own history for the same discipline applied
    before.
    **Fix pass launched, independent review to follow before any
    merge — Fable's own explicit condition: "this doesn't merge on
    the fix pass's own word."**
    **Fix pass + independent review both COMPLETE — 2026-07-22,
    verdict GREEN WITH ADVISORIES, no STOP.** Fix pass (isolated
    worktree, primary checkout never touched): all 9 falsified
    assertions recovered VERBATIM from `main` @ `8884d49` (never
    reconstructed from context) and parked properly — original quoted,
    SUPERSEDED marker + one-line reason, a NEW live successor
    asserting the current truth, each verified live. The two
    already-parked entries that had been mutated in place (ab3.mjs's
    nav-shape `pok()` and cd2.mjs's roster `pok()` — the audit's own
    "most serious" finding, now confirmed as TWO of the nine, both
    `HARNESS_PARKED`-gated) restored to their own prior-generation
    text verbatim, with a fresh third-generation `pok()` added for
    CD3's truth rather than any further in-place edit — honoring the
    proposed immutability law. `hb1.mjs`'s own Done-reachability check
    parked verbatim (original from commit `2200302`, 2026-07-16) with
    a live successor **scoped to Page/Script only** (asserts the
    Publish tab is reachable post-unlock, function-tested by an actual
    click) — the Board's own Done button left entirely untouched
    (verified: `BoardEditor.tsx` keeps all three Done instances,
    `b2.mjs`'s Board-Done checks byte-identical and green). Two new
    canon checks added to `cd2.mjs`: nothing-brass-at-rest swept
    across ALL 8 strip items under a genuine trusted pointer-away, and
    the paper's own rect + text measure proven byte-identical to a
    real rebuild of `main` @ `8884d49` at 1100/2200 (a 10px Y-shift
    found, traced exactly to the `.desk-mode-strip` border/padding
    removal, asserted as a bounded delta so any further drift fails).
    Full suite: 34/34 files, both settings, 68/68 runs green (1539
    unparked / 1625 parked checks, zero failures); `tsc`/`build:web`
    clean. The independent review re-derived every claim itself
    (its own `git show 8884d49` diffs, its own from-scratch paper-
    geometry baseline rebuild, its own full-suite run) — nothing
    taken on the fix pass's word.
    **ONE MATERIAL NEW FINDING from the review, non-blocking but
    Fable's/Nick's to rule on** — directly bears on the immutability
    law now up for ratification: tracing `ab3.mjs`'s nav-shape
    `pok()` through its ENTIRE history (not just since CD3's base),
    the review found it had **already been mutated once before CD3
    ever existed — by ticket B1** (`commit 9ce8f6b`, 2026-07-19): the
    CD2-generation entry's own tested CONDITION was changed in place
    (`stripItemCount === 7` → `=== 8`, "seven categories" → "eight...
    B1's Trash included") without the quote-old-generation/add-new
    layering this same file uses correctly elsewhere. No comment
    anywhere preserves CD2's true original "seven categories" text; a
    stale orphaned comment at ab3.mjs ~655-661 still says "seven" and
    now contradicts the `pok()`'s own "GENERATION 2 (CD2, as B1 left
    it)" label. **This predates CD3, is outside the fix pass's own
    authorized scope** (Fable named `8884d49` as the sole source), so
    it is NOT a CD3 defect — but it means the "parked entries are
    immutable" premise had already silently failed once, undetected,
    and it raises a real question the pending law should answer:
    was B1's change a "plain incidental count bump" (the `fx2.mjs`-
    precedent style B1 itself invoked, arguably exempt) or a genuine
    immutability violation needing retroactive cleanup? **Open for
    Fable's/Nick's ruling — not actioned.**
    **MERGED — 2026-07-22, on Fable's own explicit word** (her
    required "before merge" review gate met by her direct ruling,
    after seeing the fix + review outcome and the B1 finding).
    `git merge --no-ff origin/cd3-strip-and-chrome` onto `main` @
    `4780193` — clean, no conflicts (everything on `main` since CD3's
    own `8884d49` merge-base was docs-only, so zero code overlap
    despite touching shared chrome). Re-verified at the merge HEAD:
    `tsc` clean, `build` clean; the full historic suite across the
    true final combined tree (J6+FX9+E1+FX10+CD3) re-run, both
    settings — **34/34 files, only two failures, both confirmed
    transient contention flakes, neither a CD3 regression**: `j4`
    (`HARNESS_PARKED=1`, "CDP page target never appeared" — a browser
    that couldn't even spin up; clean 3/3 in isolation) and `m2`
    (`HARNESS_PARKED=1`, the milestone-flash `waitFor` timeout — the
    same celebration-animation timing race already on record for
    `th2`; clean 4/5 in isolation, the one re-fail while BM1's build
    was still contending). Both passed clean on the OTHER setting in
    the same run, and CD3's own diff (strip chrome, Done removal, top
    bar) has zero code-path overlap with either `j4`'s box-undo or
    `m2`'s Rhizome/flash code. Note: this suite ran alongside BM1's
    own build starting up — exactly the "sweep alongside another
    session's build" the contention practice warns manufactures this
    class. `m2` folds into item 48's flake set (see below).
    **Fable's rulings of record at merge, 2026-07-22**:
    — **The paper's 10px rise is ACCEPTED as intended** (the
    `.desk-mode-strip` border/padding removal, Nick's own "redundant
    separator" cleanup), **flagged for Nick's own eye** at a sitting —
    the canon check now binds it as an exact bounded delta, so any
    FURTHER drift fails, but this specific 10px is lawful, not a
    regression.
    — **The Board's own Done button is INTERIM and CONDEMNED.** Nick's
    ruling stands whole: Done is deprecated dead EVERYWHERE, the Board
    included. CD3 correctly LEFT the Board's Done in place, because
    it is the Board's only exit today (no rail, no Pages/Plan toggle
    there) — but it survives ONLY until FX10's named return reaches
    the Board (BM1's own PAGE → door is that successor, item 54 S3).
    Recorded as a standing condemnation, not a present action: do NOT
    remove the Board's Done before its replacement lands, and do NOT
    treat its continued presence as permanent.
    **BM1 (item 54) is now UNGATED — CD3 has merged.**
    **DEPLOYED — 2026-07-22** (Nick's word "Deploy everything"), in the
    all-six-ticket deploy — deployment `70181bfe`, SUCCESS; see item
    54 for the manifest. **Close now rests on Nick's own device
    sitting** (the strip's new colors/order/size, the flush top bar,
    the Done-button removal from Page/Script — plus A1's own
    still-open immutability-law question).
54. **BM1 — the Board's Own Modes.** **BRIEF COMMITTED — 2026-07-21,
    Fable-authored** (`docs/wrizo-alpha/bm1-board-modes-brief.md`).
    From the Board Modes second pass as ruled by Nick, 2026-07-21.
    **THIS IS A SCHEMA TICKET — merge requires Nick's own explicit
    word, no standing pre-authorization** (S2 adds a 1:1 page⇄board
    pairing relation, `planBoardId`). Everything else client-side,
    zero new deps. **Nick's rulings, T1-T5, recorded verbatim from
    the brief's own authority line**: **T1** — three modes
    OPEN/STORYBOARD/OUTLINE plus the PAGE → door; the fourth
    ("Commonplace") mode SCRAPPED, card-linking absorbed into Open.
    **T2** — the arrow is the door's dress (resolved by T1). **T3** —
    build-it-all tempo (all three modes this ticket, not staged);
    side-by-side held as BM2 by Fable's own sequencing call,
    vetoable. **T4** — StoryPlan fold-in authorized (S1 reconciles
    whether StoryPlan's own shape can serve as the Storyboard
    projection's data, or whether that fold becomes its own later
    ticket — reported before S4+ builds, never silently a second plan
    system). **T5** — schema pre-cleared for flagging, **explicit go
    still required at merge.** Also recorded per the brief's own S0:
    Commonplace's scrapping (linking absorbed into Open); the
    menus/toolbars rethink DEFERRED by Nick's own word as
    non-loadbearing; **BM2 (side-by-side) queued for its own brief
    after BM1's review.**
    **The projection seam is the ticket's non-negotiable core**: decks
    are DATA (one structure description per deck), modes are
    PROJECTIONS (renderers of that description) — a deck never knows
    which projection draws it; any slice that pressures a per-mode
    deck fork is STOP-and-report. Two hard floors: OUTLINE must render
    AND edit genuine nesting or it does not ship this ticket (becomes
    BM1.1, never ships flat — "the Grammarian's floor"); the paper's
    own rect and text measure on the page side stay inviolate (PLAN →
    is bar chrome only).
    **GATE CLEARED — CD3 (item 53) merged 2026-07-22.** The brief's
    gate (`bm1-board-modes` branches from `main` ONLY after FX10's fix
    pass / CD3 merged — both rewrite the board's top bar, and BM1
    inherits FX10's named return as the PAGE → door's own ancestor)
    is now satisfied; BM1 branches from post-CD3 `main`. **E1 (item
    51) outranks BM1 if capacity contends** — but E1 is already
    merged, so no live contention. Built on `bm1-board-modes` off
    post-CD3 `main`, own worktree.
    **BUILT — 2026-07-22, all 9 slices, pushed to `origin/
    bm1-board-modes` @ `06d0291` (5 commits), NOT merged (schema).**
    **S1 reconciliation reported choice (b), with reasoning**:
    StoryPlan CANNOT fold in as Storyboard's data in v1 without
    breaking M1 or building a second plan system — a board pairs to a
    PAGE but StoryPlan is per-PROJECT (scope mismatch), `beatNotes`
    are note-strings+status vs. positioned boxes (model mismatch), and
    frameworks have no add/reorder/delete-beat API (M1 would break on
    a draggable beat-lane). So Storyboard v1 projects the board's own
    deck/box structure; the StoryPlan fold becomes its own later
    ticket; the cascade Plan panel stays a door to the paired face.
    BM1 claims to touch ZERO StoryPlan code, so M1's consumers are
    unaffected by construction. **S2 schema** kept the briefed nullable
    `planBoardId` (not a pairs table): one `plan_board_id text` column,
    absent on grandfathered rows, migration + both sync mappers
    (placeholder count 22→23), the board's own record untouched
    (back-reference derived by scan). Lazy birth on first flip;
    unpair/orphan by derivation. **S4 projection seam**: a pure
    `boardStructure.ts` selector, additive optional Box fields
    (`seq`/`laneId`/`parentId`), OPEN never reads them (claims
    seven-deck library byte-identical, `materializeDeck` + all 7 deck
    defs untouched). **S7 OUTLINE claims the nesting floor MET**
    (renders AND edits genuine `parentId` nesting, ships not BM1.1).
    Build claims `bm1.mjs` 36 checks + full historic suite all green
    both settings, one A4 park (cd1.mjs's prose-bar check, PLAN → adds
    a third button) handled per the immutability law. Two overlaps
    the build flagged for review: the Board's own Done left in place
    alongside PAGE →; the page's project-level Page/Plan toggle
    coexisting with the new per-page PLAN → door.
    **BOTH AUTOMATED REVIEWS STALLED — the placeholder-report class,
    TWICE, named plainly per the ratified rule.** The first review
    agent did ~22 min of real STATIC analysis then got stuck in a
    background-monitor polling loop ("wait for the monitor's
    completion event"), never running its own dynamic verification or
    writing a verdict. A second review was re-dispatched with the
    monitor pattern EXPLICITLY forbidden — and it stalled the SAME
    way (it did complete its own independent 10-check schema/
    grandfather verifier — all derived memberships identical — and got
    27/35 suite files green, but again ended on "I'll wait for the
    completion notification" with an explicit "(Interim checkpoint —
    not the verdict.)"). **Diagnosis: these workflow sub-agents cannot
    reliably self-drive a long suite to a verdict — they background it
    and their own turn ends, which the harness captures as a
    placeholder result.** Per the ratified rule, neither stalled pass
    counts as a review.
    **COMPENSATING INDEPENDENT VERIFICATION performed by the
    orchestrating session directly (the main loop does not stall),
    2026-07-22 — VERDICT: GREEN WITH ADVISORIES.** All 9 review items
    verified against the actual committed code in an isolated worktree
    (`git status` clean throughout), nothing on the build's word:
    (1) **Schema** — placeholder count hand-counted 23/23/23, aligned
    at position 23, `null↔undefined` recipe, additive `if not exists`
    migration, board row untouched; grandfather byte-identity
    confirmed by `bm1.mjs` AND the redo-review's own 10-check
    verifier. (2) **Projection seam** — `boardStructure.ts` genuinely
    mode-agnostic (the "mode" mentions are all comments), OPEN doesn't
    read it (byte-identity proven), decks untouched by the diff,
    order single-sourced by construction — NO per-mode fork.
    (3) **OUTLINE nesting floor MET** — genuine recursive tree render
    PLUS real indent/outdent (`withParent`: indent → child of
    preceding sibling, outdent → sibling of parent) PLUS text-edit
    round-trip; not a flat list, ships not BM1.1. (4) **Ordering
    single-sourced** — shared tree/comparator + `bm1.mjs` proves
    reorder-in-OUTLINE reflects in STORYBOARD. (5) **Doors/flip** —
    `trustedClick` uses genuine CDP `mouseMove/Down/Up`; both doors
    travel (paired + unpaired fallback); lazy birth proven; door-
    never-selected asserted; flip preserves mode. (6) **No knocks,
    nothing orange** — no badge/dot/count on the doors; every BM1
    board CSS rule is `--text-*`/olive `--accent-rest` at rest, zero
    brass/ember. (7) **A4/immutability — see the ADVISORY below.**
    (8) **Zero new deps** confirmed by diff census. (9) **Full
    historic suite 70/70 green both settings** (all 34 files +
    `bm1.mjs`, zero failures — cleaner than any sweep this session,
    `fx5` included); `tsc` ×2 and `build:web` clean.
    **ADVISORY A1 — an immutability-law GRAY AREA, Fable's/Nick's to
    rule, arising ironically on the very next ticket after
    ratification.** BM1's `cd1.mjs` A4 park kept the parked entry's
    recorded-original NAME byte-identical AND added a proper new park
    cycle for the actual supersession — but it also UPDATED that
    parked entry's live-reverification CONDITION in place
    (`['Pages','Plan']` → `['Pages','Plan','Plan →']`), following the
    exact "parked live-probe" pattern **CD3 itself established** (CD3
    set that same probe's condition to live reality `['Pages','Plan']`
    while its NAME quotes the frozen original — verified in `main`).
    Under the strictest reading of the just-ratified law (Fable's B1
    ruling: a change to a parked entry's own tested CONDITION is a
    violation "regardless of how small"), this is a gray area needing
    an explicit ruling: **does the immutable record cover only a
    parked entry's frozen NAME/quote, or also its live-reverification
    CONDITION?** Leans lawful here (name frozen, condition is a
    designed live-probe CD3 itself blessed at the same merge the law
    was ratified), but the law as written carved out no such category.
    **ADVISORY A2 (Nick's eye)** — the Board's own Done now coexists
    with PAGE →, its own intended named-return successor. Leaving Done
    was correct (the brief's S3 didn't remove it) — but the CD3
    condemnation's precondition (the named return reaching the board)
    is now MET, so Done is ready to retire; Nick may want to schedule
    that (a one-liner, its own tiny follow-up or a BM1 addendum).
    **ADVISORY A3 (Nick's eye)** — two "Plan" controls now sit on the
    page bar: the pre-existing project-level Pages/Plan toggle (to the
    project's StoryPlan board) and the new per-page PLAN → door (to
    THIS page's paired plan board) — different destinations, same
    word. A real clarity question for a sitting, not a defect.
    **ADVISORY A4 (device sitting)** — the flip's feel, the telos
    line's read, the linking curves.
    **MERGE-TIME NOTE**: BM1's branch predates the CD3-era ledger
    commits, so `git diff main..bm1` shows an apparent `docs/
    open-threads.md` regression — pure branch-age skew, NOT BM1
    touching the ledger; the merge must take `main`'s newer ledger
    (reconcile the docs conflict in main's favor).
    **MERGED — 2026-07-22, on Nick's own explicit word ("Merge and
    push live / Deploy everything")** — the schema-merge authorization
    T5 required. `git merge --no-ff origin/bm1-board-modes` onto
    `main` @ `49e27ba` — auto-resolved cleanly (BM1's branch never
    touched the ledger files, so `main`'s newer ledger was kept with
    no conflict — the merge-time note above proved moot in practice).
    Re-verified at the merge HEAD: `tsc` (desktop AND server) clean,
    `build` clean. Merge commit `b936f67`, pushed.
    **DEPLOYED — 2026-07-22, same word ("Deploy everything").** This
    shipped the whole merged-but-unshipped backlog at once — J6
    (49) + FX9 (50) + E1 (51) + FX10 (52) + CD3 (53) + BM1 (54) —
    the first deploy since FX8+M2 (`7a618c8`). Manifest independently
    enumerated (`git log 7a618c8..HEAD`): exactly those six tickets'
    own code plus docs riders, every code file attributable, zero
    unnamed riders. **BM1's additive schema migration ran on the
    production boot** (`add column if not exists plan_board_id text` —
    grandfathered, null→undefined) — the server came up clean and the
    healthcheck passed, so the migration applied without incident.
    `railway up` on `main` @ `b936f67` (deployment `70181bfe`,
    SUCCESS, healthcheck `/healthz` passed), confirmed live
    (`Writer Studio server listening on :8080`).
    **ADVISORY A1 — RESOLVED 2026-07-22 (Fable's ruling, committed at
    `docs/wrizo-alpha/a1-immutability-ruling-2026-07-22.md`): LEGAL,
    no remediation.** The BM1 (and the CD3) parked-probe condition
    updates are lawful — the record is the quoted non-executing text
    (byte-identical); the probe is the live re-verification instrument
    (it never matched the frozen text, tracking current reality by
    construction). Ratified codicil: a parked probe may update in
    place only in a commit that ALSO records the supersession event
    (new park cycle + live successor), disclosed by name in the
    message — see TOOLING STATUS. A2/A3/A4 remain Nick's device-sitting
    eye.
    **Close now rests on Nick's own device sitting** — the three
    modes, both doors, the flip, the telos line, the linking curves,
    and the two overlap questions (A2/A3) answered by eye.
55. **E1.1 — Words Out, Made Whole.** **BRIEF COMMITTED — 2026-07-23,
    Fable-authored** (`docs/wrizo-alpha/e1-1-words-out-fix-brief.md`).
    **P0-adjacent — lands before the Aug 1 freeze.** A fix ticket off
    E1 (item 51), from Fable's own E1 post-merge review + Nick's
    2026-07-23 ratifications. **THREE things to make whole**: (S1) the
    filename-collision fix — **and a hard, self-disclosed correction
    of record**: E1's own merge record (item 51) claimed the
    collision fix was "fixed by the orchestrating session post-review"
    — **it is NOT on `main`.** Verified 2026-07-23: `exportPageFiles`
    carries no id-suffix on `main`, `e1.mjs` carries no collision
    check on `main`. The fix was real but ORPHANED — this session made
    it in the E1 build worktree (`wf_ae92f9fa-728-1`, still present)
    and merged `origin/e1-words-out`, which never carried it; the
    merge record wrongly claimed it landed. **The orphaned fix is
    still uncommitted in that worktree** (`pageExport.ts`'s `${title}
    (${entry.id.slice(0,6)})` + `e1.mjs`'s collision checks) — E1.1's
    S0 finds and ADOPTS it rather than re-deriving, disclosed, with
    the harness change redone per A4 + the ratified immutability law
    (park the original round-trip assertion, add the suffixed
    successor — never edit in place, unlike the orphaned worktree's
    own in-place edit). (S3) **the Trash rides along** (Nick's word,
    2026-07-23): "Everything" gains an honest `## From the Trash`
    section — every soft-deleted page's block via the same `pageBlock`
    machinery, marked and separated after the live pages, read-only
    (never resurrect/mutate a deleted row), system Boards still
    excluded; the doc-count assertion names live + trashed as two
    numbers. (S4) **the whitelist inverted**: `boardBody()` currently
    silently drops any non-text/ink/page-pin box kind — E1.1 makes an
    unrecognized kind export a named placeholder (`[A card of an
    unrecognized kind — not exported as text.]`), never silence
    (`connection` explicitly skipped by name — a link, no writer
    text). (S5) **the record corrected**: E1.1's own records commit on
    item 51 states plainly the claimed fix didn't land, per the
    stalled-report law — no euphemism. **ZERO SCHEMA, zero server,
    zero new deps** — merge pre-authorized as zero-schema; deploy is
    Nick's separate word. **Build starting — 2026-07-23**, on
    `e1-1-words-out-fix` off `main`, own worktree.
    **BUILT + INDEPENDENTLY REVIEWED — GREEN WITH ADVISORIES —
    2026-07-23.** S0 found the orphaned fix still uncommitted in the E1
    worktree and ADOPTED it (disclosed). Immutability discipline done
    right this time (verified by the review, diffing against `git show
    main`): the three assertions E1.1's changes falsified (the
    round-trip filename, the doc-count, the trash-exclusion) were each
    parked VERBATIM with SUPERSEDED markers + named authority + live
    successors — NOT edited in place (the exact thing the orphaned
    e1.mjs had done wrong). Read-only Trash seam (`getDeletedEntries`,
    clones only, never mutates `deletedAt`); `## From the Trash`
    header is body text, not lexicon-routed; whitelist inversion with
    `connection`/`board-meta` skipped by name.
    **Both review advisories RULED BY FABLE, 2026-07-23:**
    — **A1 (the real one) — endorsed, and FIXED before merge.** The
    adopted orphaned suffix used `entry.id.slice(0,6)` — but
    `generateId()` is `Date.now().toString(36)` (an 8-char timestamp)
    + random, so the head-slice is 100% clock: two pages born the same
    tick (bulk import, template, rapid duplicate) share it and would
    STILL collide — a hole in S1's own "must produce two distinct
    filenames." Hardened to `slice(-6)` (the random tail, 36^6 ≈ 2.2B,
    collision-safe same-tick); the harness fixture rebuilt to prove it
    (two ids sharing head `dupehe`, differing only in tail
    `alpha6`/`beta66` — the same-tick shape the old fixture never
    exercised). Fable's own words: a genuine catch; the immutability
    handling lawful on both counts (frozen parked originals
    byte-identical; the never-shipped `e1-rou`→`ndtrip` successor
    references on an unmerged branch are "construction, not records —
    edit them freely," per the A1 codicil).
    — **A2 (lane/section titles) — ruled a RIDER to FX11, not an E1.1
    reopen.** BM1's `board-meta` now carries writer-authored lane/
    section titles; E1.1 skips `board-meta` by name, so those words
    stay out of a "complete" export. Fable: lane and section titles
    ARE writer words and the never-missing law reaches them — but a
    gated build does not grow scope mid-suite, and this is no
    regression (the old whitelist dropped `board-meta` too). **FX11
    carries it**: board blocks render writer-authored lane titles when
    present (minimal form — one `Lanes:` line per board; per-lane
    grouping only if trivially cheap), harness seeds a titled lane and
    asserts presence. Logged here as FX11's own rider.
    **Suite read to completion, synchronously, per the ratified law**
    (a merge may follow only a suite verdict the main loop read in
    full): 70/70 runs both settings, all green except the known
    E1.1-unrelated `fx5` per-line-engage flake (item 48), confirmed
    intermittent (2/3 clean isolated); `e1.mjs` green both settings;
    `tsc` (desktop + server) + `build` clean.
    **MERGED — 2026-07-23, on Nick's word ("permission to merge and
    deploy whenever you're finished")**, zero-schema. TRUE 3-way onto
    `main` @ `31f652f` (E1.1's base `5c5f720` predated the A1 ruling
    doc + the 9 review-brief commits; verified at the merge HEAD that
    `a1-immutability-ruling-2026-07-22.md` and all nine briefs SURVIVED
    — zero docs deleted by the merge, per Fable's mechanics
    condition). `tsc` (desktop + server) + `build` clean at the merge
    HEAD. Merge commit **`0c472c2`**. **Item 51's record corrected**
    above (the false collision-fix claim, made true here). Fable's
    post-merge review follows same-day.
    **DEPLOYED — 2026-07-23, Nick's word** (same message as the merge).
    Manifest re-enumerated since the last deploy (`b936f67`): the only
    code is E1.1's own three files (`pageExport.ts`, `persistence.ts`,
    `e1.mjs`) plus docs riders — zero schema, no server/migration
    change, no unnamed riders. `railway up` on `main` @ `0afebcf`
    (deployment `35207e0a`, SUCCESS), confirmed live (`Writer Studio
    server listening on :8080`). **The collision fix E1's own record
    once falsely claimed is now genuinely live** — same-titled and
    same-tick pages export as distinct files, both sets of words
    intact; trashed words ride along in "Everything"; no box kind
    silently vanishes.
    **Fable's post-merge review landed and is committed — GREEN —
    2026-07-23** (`docs/wrizo-alpha/e1-1-review-fable.md`). Read at
    house depth (full-patch line-by-line on all three files; the
    park-quoted originals compared against the deleted live text IN
    THE SAME DIFF — verbatim identity confirmed by direct comparison,
    not the commit's claim). "The record is true, the words are whole,
    and the immutability law was honored under conditions that would
    have excused sloppiness." Named a new standing PRACTICE: the live
    section and the parked probes share module-scope fixtures, so
    successors re-prove the same reality with the same numbers, never
    a drifted copy. **Three non-blocking advisories, dispositions:**
    (A1) the 80-char cap now governs the TITLE component; the full
    base can reach ~89 with the ≤9-char suffix — endorsed, disclosed
    in-code, no action. (A2) `board-meta`'s "zero writer text" comment
    is already stale (BM1's lanes carry writer-authored titles) — the
    FX11 rider corrects that comment in the same pass it renders the
    titles. (A3) the harness's `^# `/`## From the Trash` anchors are
    writer-text-fragile (a page whose own first line is `## From the
    Trash` would confuse the split) — pathological, harness-only, no
    product defect; folded into item 48's deflake-pass rider territory.
    **Items 51 and 55 close together on Nick's own device sitting** —
    agenda now includes the Trash spot-check (a known trashed page's
    words present under the marker, wifi off).
56. **TU5 — the Tutor's Memory (the Book's Bible).** **BRIEF COMMITTED
    — 2026-07-23, Fable-authored** (`docs/wrizo-alpha/
    tu5-tutors-memory-brief.md`). **SCHEMA TICKET — NO merge
    pre-authorization.** Nick's explicit word at merge, which in the
    same breath ratifies (a) the S6 disclosure-v3 string verbatim and
    (b) the two S5 prompt paragraphs; deploy is his separate word.
    **Authority**: the Listener-day queue (TU5 confirmed over TU4 as
    THE pre-vacation Tutor ticket); TU2 review ruling 3 ("the Tutor
    has ears as of TU2; memory of the book is TU5's charter").
    **Sequencing gates — ALL MET as of this writing, so the build is
    authorized to start**: (1) E1.1 merged (item 55 — the A1 ruling
    file on disk, the standing gate); (2) E1.1's post-merge review
    landed (item 55, GREEN, committed). Fable's own E1.1 review names
    it: "With this review on disk, TU5's build gate is fully met."
    **Scope — L4 of the Tutor's five-layer memory, alone**: L1 the
    constitution (TU1), L2 the ears/page-delta (TU2), L3 the page
    thread (TU1/TU2) — all shipped; **L4 the book's Bible — durable,
    writer-owned facts of the project — THIS ticket**; L5 the writer's
    profile deferred. The bible is the BOOK's memory: it rides the
    project, so loose/journal pages keep ears + thread only and show
    NO Bible section (quiet absence, not a disabled door). **Three
    decisive calls (Fable's, vetoable at the schema word)**: (1)
    per-project, ONE additive nullable `projects.tutor` jsonb column —
    never a new table (the BM1 charter's own reasoning); (2)
    **writer-authored ONLY — the Tutor cannot write to the bible, not
    even by proposal** (structured model output becoming app state is
    a cousin of the A13-forbidden affordance; the prompt may suggest
    in plain words that the writer note something, the hands stay the
    writer's); (3) no Voice Wall on the bible input (a reasoned
    exclusion — the wall guards writing surfaces, the bible is desk
    furniture, and A13 already seals the only dangerous direction).
    **S1 schema**: `alter table projects add column if not exists
    tutor jsonb` (additive, idempotent, no backfill, the exact
    `origin`/`journal_entries.tutor` recipe); both project mappers;
    `upsertProjects` 14→15 columns, `$15::jsonb`, placeholder count
    **15/15/15 — Fable hand-verifies at review, per the house rule**;
    grandfather fixed point (a project never touched by the bible is
    byte-identical, absent never null). Shape `{ v:1, facts: Fact[] }`,
    per-fact text cap 300. **S6 ships disclosure v3** (the mechanism
    exists per TU2 review ruling 4). **Server surface touched is
    exactly `tutor.ts` + `migrate.ts`/`sync.ts` (S1); zero new deps;
    key presence-never-value at deploy.** **The Aug 1 freeze is named
    honestly**: TU5 merges before it or waits for post-vacation — E1.1
    merged 2026-07-23 (well ahead of the ~July 29 slip line), so the
    gate is clear.
    **BUILT + PUSHED — 2026-07-23, on `tu5-bible`** (re-founded — see the
    anomaly below), all eight slices S0-S7, on `origin/tu5-bible`. S0 the
    tutor-rules.md living-document disk home (shipped `SYSTEM_PROMPT` verbatim
    + tentative-ratification header); S1 `projects.tutor` jsonb (both mappers,
    upsert 14->15, `$15::jsonb`, 15/15/15 hand-verified, grandfather
    byte-identity — a project never touched by the bible is absent-not-null);
    S2 `store/tutorBible.ts` (read/add/edit/delete, the advanceTutorCursor
    conjure-refusal, wrizoBible seam); S3 the Bible section (LAST in the FX10
    cluster per Fable's ruling, `projectId`-gated so loose/journal pages show
    nothing, no counts, A13-clean); S4 the wire (`bible?` field, `<book-bible>`
    spliced BEFORE the delta, the persisted thread byte-free of any bible turn,
    roles still writer|tutor); S5 the prompt (the Bible-conduct paragraph + the
    fifth-bullet truth-repair, mirrored BYTE-IDENTICAL into `tutor-rules.md` in
    the same commit); S6 disclosure v3 (Candidate A minimal-insertion). `tsc`
    x2 + `build:web` clean; S7 `tu5.mjs` PASS 91 both HARNESS_PARKED settings;
    the disclosure-v3 park sweep landed empirically (skipDisclosure seed
    '2'->'3' in tu1/tu2/fx10/m2 fixtures; tu1's "(v2 key)" ack check + tu2's
    three disclosure-v2 checks parked A4-style, verbatim, with live successors
    in tu5.mjs; full historic suite re-run GREEN — 36 harnesses, 0 failures).
    **NOT merged — schema ticket: awaiting Fable's review + Nick's explicit
    schema word, which in the same breath ratifies the S6 v3 disclosure string
    and the two S5 prompt paragraphs. Deploy is Nick's separate word. The
    server's own `<book-bible>` wrapping (tutor.ts) owes a prod round-trip
    after deploy, the TU2 precedent.**
    **ANOMALY — two claimants, branch re-founded.** The brief named
    `tu5-tutors-memory`; a second CC session (chat 1) started a parallel build
    on that name off Fable's mis-traveled phrasing, then removed its worktree
    mid-flight. A `cd` into the orphaned (now `.git`-less) directory walked git
    UP to the main repo and put a stray 4-doc commit on LOCAL `main` (the four
    pre-existing untracked docs; unpushed; `reset --mixed` to origin/main,
    nothing lost, nothing ever pushed). Fable ruled a distinct name to end the
    contention structurally: **re-founded as `tu5-bible`** off fresh `main` @
    309ab78, every slice re-authored from session history (the orphaned dir's
    work files were confirmed deleted — raw `find` — nothing recovered from
    disk; the reconstruction validated by `tsc` x2 + the 15/15/15 recount +
    tu5.mjs). **New standing law, ratified by Fable: before ANY commit,
    `git rev-parse --show-toplevel` must confirm the expected worktree root** —
    the exact check whose absence caused the stray commit. `tu5-tutors-memory`
    is the contested name that died unreferenced; `tu5-bible` is the clean,
    single-author line. **Report = push; Fable reviews before a merge
    recommendation; schema merge on Nick's own explicit word only.**
    **MERGED — 2026-07-24, on Nick's own explicit schema word, quoted
    verbatim: "Ratified".** Its scope, named by Nick: (1) the merge itself;
    (2) the S6 disclosure-v3 string as shipped (Candidate A); (3) the two S5
    prompt texts as shipped (the Bible-conduct paragraph + the repaired fifth
    bullet) — all three verbatim in place on the branch, quoted in Fable's
    review (`tu5-review-fable.md`, its "What Nick's word ratifies" section).
    Fable's pre-merge schema review landed GREEN and rode `main` into the
    merge (committed `9eb8d8f`). **Executed in the primary checkout by the
    orchestrating (chat 1) session per Fable's close directive** — guard-rail
    (`git rev-parse --show-toplevel`) confirmed before every commit. TRUE
    3-way `git merge --no-ff origin/tu5-bible` (`ba364b8`) onto `main` @
    `9eb8d8f` (merge-base `309ab78`) — auto-resolved clean, zero conflicts.
    At the merge HEAD: `tu5-review-fable.md`, `tutor-rules.md`, the A1 ruling
    doc, and every prior review/brief verified SURVIVING (zero docs deleted);
    `tsc` (desktop + server) + `build:web` clean; **`tu5.mjs` re-proven at
    the exact shipped SHA — PASS 91 both `HARNESS_PARKED` settings, verdict
    read to completion in the main loop** (it parks nothing of its own; the
    superseded disclosure-v2 checks live in `tu2.mjs`'s parked section).
    Merge commit **`a079c27`**, pushed. Server surface exactly `tutor.ts` +
    `migrate.ts` + `sync.ts`; zero new deps.
    **DEPLOY HELD — NOT covered by the "Ratified" word** (Nick's own scope);
    awaits his separate say. When given: the manifest names everything in the
    target SHA beyond the last deploy (`35207e0a`) — TU5's eight slices plus
    the docs records commits, nothing unnamed; and AFTER deploy SUCCESS, the
    one-time production round-trip proof of the server's own `<book-bible>`
    splice is owed and on the checklist by name (advisory 3 below; the TU2
    server-route precedent — the client harness captures the client body
    only).
    **CLOSE-PENDING: Nick's own device sitting** (his eye on the Bible
    section) **+ the post-deploy `<book-bible>` round-trip check.** Then item
    56 closes.
    **NEXT-TOUCH NOTES (Fable's review advisories 1 & 2, non-blocking,
    logged for whoever next touches these files)**: (1) `tu2.mjs`'s surviving
    fresh-device check still carries a "Disclosure v2:" label while asserting
    a version-agnostic truth (the key is null) — a stale label on a live
    check, rename on next touch; (2) `addFact` re-stamps `{ v: 1, ... }`
    while `editFact` spreads the existing bible — no live effect (`v` is
    literally type `1`), harmonize on next touch.
    **DEPLOYED — 2026-07-24, on Nick's own separate word ("Deploy").**
    Manifest independently re-enumerated since the last deploy (`0afebcf`,
    deployment `35207e0a`): TU5's eight slices (S0-S7) + the merge + the
    docs records commits — nothing unnamed; the only NEW code is TU5's
    (server surface exactly `tutor.ts`/`migrate.ts`/`sync.ts`, zero new
    deps). **The `projects.tutor` migration ran on the production boot**
    (additive `if not exists` — server came up clean, healthcheck passed).
    `railway up` on `main` @ `5dfdcc8` (deployment `08676e48`, SUCCESS),
    confirmed live at `writer-studio-app-production.up.railway.app`.
    **ADVISORY 3 DISCHARGED — the post-deploy `<book-bible>` server-splice
    round-trip proof PASSED (2026-07-24).** One production round-trip
    (open-registration throwaway account → authed `POST /api/tutor/chat`
    with a `bible` field carrying a distinctive seeded fact, "Hero name:
    Quillon Vane"): the server returned `HTTP 200
    {configured:true, reply:"Quillon Vane", model:"deepseek-v4-flash"}` —
    the model echoed the exact seeded fact, proving end-to-end that the
    PRODUCTION server accepted the `bible` field, spliced it as the
    `<book-bible>` wire turn, and it reached the model (the gap the client
    harness could not cover — the TU2 server-route precedent, satisfied).
    Footprint disclosed: the proof created one inert throwaway user row in
    the prod `users` table (a `@wrizo-test.invalid` email, no data, cannot
    receive mail/log in) — left in place rather than risk an unprompted
    prod-DB delete; trivially removable on Nick's word if wanted.
    **That throwaway row was DELETED — 2026-07-24, on Nick's ruling**,
    scoped precisely to that one identity (id `61019985-…`, guarded on
    the `@wrizo-test.invalid` email suffix): 1 row deleted, confirmed 0
    remaining. The prod `users` table carries no test residue.
    **ITEM 56 NOW CLOSES ON NICK'S OWN DEVICE SITTING ALONE** — his eye on
    the Bible section (the last remaining condition; every other gate —
    schema word, merge, deploy, the server round-trip proof — is met).
57. **FX11 — the Board's Hands.** **BRIEF COMMITTED — 2026-07-24,
    Fable-authored** (`docs/wrizo-alpha/fx11-boards-hands-brief.md`, at
    `e6431ac`). **A fix ticket — ZERO SCHEMA, zero server files, zero new
    deps; merge pre-authorized as zero-schema, Fable reviews post-merge,
    deploy is Nick's separate word.** One ticket retires FIVE accrued
    board-hand debts, cargo enumerated by source: **(S1)** the `isDragging`
    cleanup leak — FX8 review A1: the delegated pointer effect (deps
    `[pageWidthPx]`) tears down its listeners without clearing `isDragging`,
    so a viewport resize mid-drag leaves `data-dragging='true'` and every
    face stuck `cursor:grabbing`; the fix clears the flag in the cleanup.
    **(S2)** resize-then-can't-move — Nick's device glitch: reproduce under
    trusted pointer FIRST, NAME the root cause in the commit, fix at that
    root, and diagnose the kinship with S1 explicitly (related-or-distinct
    until shown). **(S3)** lane titles ride the export — E1.1 review advisory
    2, ruled a RIDER to FX11 (BM1's writer-authored lane titles are real
    writer words; E1.1 skipped `board-meta` by name): `boardBody()` emits a
    `Lanes:` line when named lanes exist, and the now-stale "zero writer
    text" comment is corrected in the same touch. **(S4)** the rootless-cycle
    guard, both layers — BM1 review advisory 1: `withParent` walks the
    ancestor chain and refuses a cycle (clean no-op, boxes unchanged);
    `buildNodes` promotes orphan-cycle members to roots instead of dropping
    them (the never-silently-missing law for projections, defending
    already-cyclic sync data from an older client). **(S5)** FX10's missing
    leg — FX10 review advisory 2: `fx10.mjs`'s S4 scrollbar-flush /
    text-measure asserts gain the 2200 width. **Sequencing: FX11 builds
    first; M3 (the Rhizome Roams) builds only after FX11's post-merge
    review lands** — both zero-schema, both before the Aug 1 freeze.
    **BUILT + PUSHED — 2026-07-24, on `fx11-boards-hands`** (off `main` @
    `4839858`, own worktree, guard-rail before every commit; ledger edits on
    `main` only), all six commits on `origin/fx11-boards-hands`. A verify-
    before-build drift-check returned ZERO drift across all five slices.
    S1/S3/S4/S5 as briefed; **S2 shipped as a regression GUARD + documented
    investigation on Nick's own word** — the glitch could not be reproduced
    under trusted MOUSE pointer across every condition (grow both axes, shrink,
    an immediate move, a viewport-resize between), root-caused PROVABLY
    DISTINCT from S1 (a card resize never changes `pageWidthPx`, so the pointer
    effect never re-runs on a card resize), the sole residual the S-Pen
    long-press path for Nick's device sitting; no blind patch. `tsc` x2 +
    `build:web` clean. Harnesses: `fx11.mjs` PASS 19 both HARNESS_PARKED
    settings (S1 fix, the S2 DoD guard, S4 both layers); `e1.mjs` 36→38 (S3
    lane titles); `fx10.mjs` 119→122 (S5's 2200 leg). Full historic suite
    re-run: 36/37 deterministic GREEN, only the known pre-existing `fx5`
    timing flake (a typing-scroll check, unrelated to FX11; passes 2/3).
    **Merge rides the zero-schema pre-authorization; Fable reviews post-merge;
    deploy is Nick's separate word. M3 (item 58) unblocks when FX11's
    post-merge review lands.**
    **MERGED — 2026-07-24, under the zero-schema merge pre-authorization**
    (the brief's own standing rule — no explicit word needed for the merge;
    Fable reviews post-merge). Executed in the primary checkout by the
    orchestrating (chat 1) session per Nick's directive, the TU5 close
    pattern exactly — guard-rail (`git rev-parse --show-toplevel`) confirmed
    before every commit. TRUE 3-way `git merge --no-ff origin/fx11-boards-hands`
    (`fe3ce82`) onto `main` @ `76d6342` (merge-base `48398585`, `main`
    docs-only since) — auto-resolved clean, zero conflicts. At the merge
    HEAD: all prior docs verified SURVIVING (reviews, briefs, the A1 ruling,
    `tutor-rules.md` — zero docs deleted); `tsc` (desktop + server) +
    `build:web` clean; **`fx11.mjs` re-proven PASS 19 both `HARNESS_PARKED`
    settings, verdict read to completion in the main loop** (it parks
    nothing — mostly additive), and the two harnesses FX11 also touched came
    up green (`e1.mjs` 38/41, the S3 lane titles; `fx10.mjs` 122, the S5
    2200 leg). Merge commit **`7f8e943`**. Zero schema, zero server files,
    zero new deps.
    **DEPLOYED — 2026-07-24, at `375c10f`, on Nick's one batched word ("Deploy
    375c10f").** The whole batch shipped together: FX11 + CD4 + CD4.1 + M3 + all
    docs records (manifest `57f56d5..375c10f`, nothing unnamed). `railway up --ci`
    to writer-studio-app / production; **verified live** — HTTP 200, the new build
    (`index-Bvs9khZ7.js` / `index-DFzjCY9E.css`) serving, server healthy (401 on
    `/auth/me`). Client-only batch, zero server/schema change.
    **CLOSE-PENDING Nick's own device sitting**: his eye on the five retired
    debts, AND — the one thing no harness can reach — the S2 **S-Pen
    resize-then-move attempt on his actual device** (the mouse/CDP trusted-
    pointer harness proves the gesture chain structurally, but the stylus
    long-press path is his to try; the build named it the sole residual, no
    blind patch). Then item 57 closes. Fable's post-merge review follows;
    M3 (item 58) unblocks when it lands.

59. **CD4 — the Two Retirements.** **OPENED — 2026-07-24 (S0).**
    **OWNER REASSIGNED chat 1 by Nick's word of 2026-07-24** (Nick's
    parallelization word, Fable's ruling — this ticket was briefed to chat 3
    and is now built and merged in this, the orchestrating, session). Brief:
    `docs/wrizo-alpha/cd4-two-retirements-brief.md` (committed `541f435`).
    Zero schema, zero server files; merge pre-authorized as zero-schema;
    Fable reviews post-merge; deploy rides the batched word with FX11 + M3.
    Runs between FX11's post-merge review (landed on `main` `541f435`) and M3.
    **Authority — Nick's words of 2026-07-24, quoted:** "Done should die
    everywhere. A writer is never Done — they may choose to finally share a
    piece they've written, but that option lives under Publish or Workshop."
    And on the old beats control: "I'm not really sure how this fits in with
    the new architecture" — ruled by Fable as retirement of the control, the
    system dormant beneath it.
    **S1 — Done dies everywhere:** the Board's Done (the last one standing) is
    removed; PAGE → becomes the Board's only exit (its unpaired fallback
    already proven under trusted pointer in `bm1.mjs`). Grep-first for every
    "Done" control across surfaces; stragglers die in the same pass.
    **S2 — the old Plan control retires:** the page bar's legacy beats control
    (the elder "Plan") is removed; the arrow-dressed PLAN → door becomes the
    bar's only Plan word (resolving the A3 collision by retirement, not
    rename). The beats system goes DORMANT, not dead — `beat_id` and
    `story_plan_id` stay in the schema untouched and grandfathered; no data
    migration, no deletion. Successor is the Thread arc (`thread-arc-seed.md`,
    post-vacation).
    **Park obligation, per the immutability codicil:** the b2/hb1 Board-Done
    checks and cd1's successors falsified by S1, and the live gen-3 bar check
    (`['Pages','Plan','Plan →']`) falsified by BOTH slices, carry their full
    A4 park cycles — verbatim originals, superseding authority (Nick's word,
    quoted), live successors (S2's gen-4 asserting `['Pages','Plan →']`) — in
    the SAME commits as the removals. **Build + merge in progress this
    session (E1.1 pattern); SHA reported on close.**
    **MERGED — 2026-07-24, merge commit `4777d19`** (build `1fdd6f4` on
    `cd4-two-retirements`), built + merged in this session per the E1.1 pattern,
    guard-rail (`git rev-parse --show-toplevel`) confirmed before every commit.
    TRUE 3-way `--no-ff` onto `main` @ `d9f0800`; docs survived (zero deleted);
    `tsc` ×2 EXIT 0; `build:web` clean. Zero schema, zero server files, zero deps.
    **S1 — Fable's ruling amended the brief (drift I caught pre-build):** removing
    the Board's Done would have STRANDED framed system boards (Shelf/Trash/Journal
    ≥1100px) — PAGE → was `!isSystemBoard`, the rail is null when framed, the crumb
    inert. Fable ruled (relayed by Nick): system boards mount the SAME PAGE → door
    (its existing unpaired branch → `backTo`, which for a system board is already
    `'/'` — the cold-load fallback lands at Arrival, itself a page, HB1); no new
    door/relabel/crumb change; the label stays exactly "Page →". Built exactly so.
    **S2 — the elder "Plan" flight tab (→ the legacy StructureBoard) retired** from
    PageEditor (prose framed + legacy) and ScriptEditor (script): prose bar now
    `['Pages','Plan →']`, script `['Pages']`. The beats system is dormant-not-dead
    (route + StructureBoard + `beat_id`/`story_plan_id` untouched, grandfathered).
    **Park cycles (immutability codicil — RECORD names byte-frozen, PROBEs follow
    reality, all in THIS commit with the removals):** b2.mjs (Shelf-Board Done →
    PAGE → door + door→'/'); cd1.mjs (gen-3 prose bar + script check → CD4 gen-4,
    prior gens parked verbatim, three parked probes updated); **th1.mjs** (its
    "Plan toggle reads exactly 'Plan'" check read the retired `.sprint-toggle-btn:
    nth-child(2)` — CAUGHT BY THE FULL-SUITE RE-RUN, not the grep sweep; parked
    verbatim, successor verifies the lexicon "plan" term directly); hb1.mjs/bm1.mjs
    (cross-reference disclosures only — their "Board keeps Done" mentions are in
    still-passing checks). New `cd4.mjs` (purely additive, PASS 20 both settings).
    **Full historic suite read to completion in the main loop: 37/38 deterministic
    GREEN** — the only failure the known `fx5` per-line-engage-motion transient
    flake (item 48 deflake set; confirmed PASS 2/2 in isolation, unrelated to CD4).
    **DISCLOSED RESIDUALS for Fable's post-merge review:** (a) StructureBoard stays
    reachable via its secondary access — ProjectHome "View board" / BeatWizard /
    QuickSprint's toggle — left dormant-not-dead (the StructureWizard precedent the
    brief cites); full unreachability would retire those too, flagged not assumed.
    (b) Two literal "Done" labels remain OUT of scope — the card-edit popup's close
    button (fx4-proven) and Spread's select-mode toggle — transient
    action-completion affordances, not the Board's exit Done; retiring them needs
    replacement labels (a design call), flagged for Fable's DoD ruling.
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** (FX11 + CD4 + CD4.1 + M3 + docs) — see item 57's deploy record. Verified live.
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/cd4-review-fable.md`):
    both retirements verified at their sources, the ruling implemented exactly as
    amended, the four-generation `cd1.mjs` park chain and the three lawful park
    modes all sound. **Residual (a) — StructureBoard's secondary access — ENDORSED
    as correctly scoped** (ProjectHome "View board" / BeatWizard / QuickSprint are
    the legacy system's remaining doors; their sentencing is the Thread committee's,
    with W1 or earlier — recorded as a Thread-committee agenda item, `thread-arc-
    seed.md` inherits it). **Residual (b) — the two transient "Done" labels — RULED:
    they die → CD4.1 (item 61), directed to chat 1.**
    **CLOSE-PENDING CD4.1 merged + Nick's device sitting** (his hand through all
    three system-board doors, his eye on the bar that finally holds one Plan). Then
    item 59 closes — and no completion verb remains anywhere a writer can see.
61. **CD4.1 — the Last Two Words.** **OPENED — 2026-07-24 (S0), owner chat 1**
    (directed by Fable's CD4 post-merge review, `cd4-review-fable.md`). The last
    two literal "Done" labels a writer can see — the card-edit popup's close button
    (`board-popup-done`) and Spread's select-mode exit toggle — both become
    **"Close"** (Nick's word categorical; the DoD says no surface says Done; the
    Spread pair reads Select/Close — a door word, never a completion word). Micro:
    two strings; the fx4 `board-popup-done` check gets its park cycle + successor,
    the Spread `app.click('Done')` action becomes `'Close'` (fixture maintenance),
    and `cd4.mjs` gains a no-"Done"-anywhere structural sweep as the standing guard
    — all in the same commit. Zero schema, zero server; rides the batched deploy
    with FX11 + CD4 + M3. Build + merge this session (E1.1 pattern); SHA on close.
    If either word reads wrong under Nick's hand, it's one string at the sitting.
    **MERGED — 2026-07-24, merge commit `f1be3dd`** (build `a48f445`), built +
    merged in this session (E1.1 pattern), guard-rail confirmed before every
    commit. TRUE 3-way `--no-ff` onto `main` @ `8a8ce85`; docs survived (zero
    deleted); `tsc` ×2 EXIT 0; `build:web` clean. Zero schema, zero server, zero
    deps. Both strings landed: the card-edit popup's close button (`board-popup-
    done` class + `onClose` behavior unchanged) and Spread's select-mode exit
    toggle now read **"Close"** — the Spread pair is Select/Close.
    **Park cycle (immutability, same commit):** `fx4.mjs` — the "S5: Done closes
    the popup…" check parked VERBATIM in the house pok-record form (fx4 has a
    parked section), its probe re-verifying the CURRENT label directly (a fresh
    card's popup carries a close button reading exactly "Close"), with the live
    successor asserting the "Close" button still closes/un-blurs/commits; `j5.mjs`
    — the Spread `app.click('Done')` exit ACTION → `'Close'` (fixture maintenance,
    not an assertion); `j4`/`ab4`/`ab1`'s frozen records that MENTION the popup's
    "Done" button left as-is (they close by CLASS, probes pass, history accurate —
    no park manufactured). `cd4.mjs` gained the **no-"Done"-anywhere structural
    sweep** as the standing guard (the popup reads "Close", the Spread reads
    Select/Close, and no control reads exactly "Done" on the popup, the Spread, a
    system board, a prose page, or a script page).
    **Full historic suite re-run to completion in the main loop: 38/38
    deterministic GREEN** (zero flakes this run). cd4.mjs 27 both settings; fx4.mjs
    49 / PARKED 3 (the CD4.1 pok re-verifies).
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** — see item 57's deploy
    record. Verified live. **CLOSE-PENDING Nick's sitting** — his eye on the two "Close" words
    (one string each if either reads wrong). **This also satisfies CD4's (item 59)
    remaining gate: item 59 now close-pends ONLY Nick's device sitting.**
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/cd4-1-review-fable.md`):
    the two strings landed exactly as directed; all three park modes applied
    correctly again; the no-"Done" sweep is the DoD's regression tripwire. Three
    non-blocking advisories: (1) "Close"/"Select" are literals (as "Done" was) —
    the popup foot, the Spread toggle, and the neighboring "Undo" migrate to
    `deskLexicon` together at next touch (parity today, debt named); (2) the
    sweep's surface list extends opportunistically as new surfaces mount; (3) a
    frozen record gains a cross-reference annotation only if it ever makes a
    present-tense structural Done claim (none does today). **Item 61 close-pends
    Nick's sitting alone.**
58. **M3 — the Rhizome Roams.** **BRIEF COMMITTED — 2026-07-24,
    Fable-authored** (`docs/wrizo-alpha/m3-rhizome-roams-brief.md`).
    **ZERO SCHEMA, zero server files, zero new deps; merge pre-authorized as
    zero-schema, Fable reviews post-merge, deploy is Nick's separate word;
    before the Aug 1 freeze.** M2 shipped the rhizome GREEN; Nick's device eye
    ruled three verdicts and M3 is those made real, nothing else: **(S1)** the
    ink warmed — `--rhizome-ink` `#4A3A28`→`#7A6242` (~2.9:1, a bounded delta
    for the sitting). **(S2)** the roam — the field already spans the whole
    ground, so the single paper-bottom-center origin becomes SEVEN, blue-noise
    scattered via best-candidate sampling (~10 candidates/point, farthest from
    every placed origin + the paper rect), paper's bottom-center kept as origin
    one, all from the entry-id PRNG (deterministic); the paper-avoidance law
    (`segmentTouchesRect`) unmoved and re-proven at full scale (40-seed stress
    sweep, zero paper violations the only acceptable number); the 7 is a
    bounded delta. **(S3)** essay-length saturation — coverage driven by TOTAL
    word count through `CAP·(1−e^(−words/K))`, K≈834 so 95% of CAP at ≈2,500
    words, grow toward the target each event, hard-stop at CAP (the exponential
    IS the organic law); replaces M2's event-decay bands; NO
    numbers/percentages/counts/meters anywhere (the anti-gamification frame
    binds absolutely); K a bounded delta. **(S4)** determinism (seeded by entry
    id + session, M2's discipline) + reduced-motion extended. The DoD ("Nick
    opens a page he has truly written, and the ground is alive to the edges")
    settles the driver as TOTAL words, so M3 supersedes M2's mount-empty
    behavior. **The M2 review is the foundation document; its rulings stand
    except where a verdict supersedes.** S5: `m3.mjs` + the M2 park sweep (the
    paper-bottom-center origin anchor, the mount-empty/no-catch-up behavior the
    total-word driver supersedes, the decay-band schedule — parked A4-style with
    live successors); **Q1 stays parked** (assert the framed desk still has NO
    progress row — no answering a parked question by the back door). Owner
    chat 3; CD4 (item 59, chat 1) builds in parallel, files disjoint, both
    merges serialize through chat 1's lane. **Build starting — 2026-07-24, on
    `m3-rhizome-roams` off the FX11-review-carrying `main`, own worktree,
    guard-rail before every commit; ledger edits on `main` only.** `tsc` x2 +
    `build:web`; both HARNESS_PARKED settings; report = push. Drift-check: ZERO
    structural drift; the S2/S3 design (7, K) Fable-ruled, vetoable at the
    sitting.
    **BUILT — 2026-07-24 (chat 3), on `m3-rhizome-roams` (`ccf643b`); pushed,
    merge rides the zero-schema pre-auth through chat 1's lane, Fable reviews
    post-merge, deploy is Nick's word.** All five slices landed — S1 ink
    `#7A6242`; S2 seven blue-noise origins; S3 saturation `CAP·(1−e^(−words/K))`
    K=834 (total-word driver, no numbers); S4 determinism + reduced-motion.
    `m3.mjs` 33/33, `m2.mjs` 54/54, both HARNESS_PARKED settings; `tsc` x2 +
    `build:web` clean; full historic suite green (fx5's known per-line flake
    passes on re-run). **M2 park sweep** found only the mount-empty behavior
    falsified (NOT the anticipated origin-anchor or decay-band checks — M3 keeps
    origin one = paper bottom-center, and the M2 engine primitives
    `growMany`/`bandRate` coexist untouched): four `m2.mjs` checks (the two
    remount-EMPTY / replay-same-shape determinism checks; the two goal-crossing
    burst checks — the 245+6=251 fixture crosses the goal during "…six", not on
    the "seven" they bracket) kept verbatim + SUPERSEDED + successor-pointer
    A4-style, live successors in `m3.mjs` (revisit reproduces the byte-identical
    saturated ground; crossing the goal lands ≤+12 burst-flagged segments, growth
    kept whole). Q1 stays parked. **ONE JUDGMENT CALL for review — a
    geometry-drift refit** (`outsidePaper` origin nudge + a `RhizomeField`
    re-fit): the harness surfaced that the field grows against the boot-time
    paper, then the chrome-recede settle raises the paper ~30–40px into the
    now-static ground (worst at narrow widths; invisible — the field is
    z-beneath the paper — but a real gap in "the roam avoids the paper", and it
    IS the DoD path: open an already-written page). S2's verdict is only real if
    the live roam avoids the paper's SETTLED place, so the field now RE-FITS —
    rebuilds its ground from the same seed (deterministic; same seed+geo ⇒ same
    scatter) to a high-water target (forward-only preserved) whenever the
    measured geometry materially changes (boot-settle + window resize), via a
    ResizeObserver + one deferred settle-tail re-sync. A behavioral addition to
    the shipped M2 component beyond the three verdicts, flagged against "nothing
    else" for Fable to ratify/veto; it partially addresses item 60's root at the
    boot-settle manifestation, item 60's revisit-raw-coordinate question still
    open. Touch: `RhizomeField.tsx`, `rhizomeEngine.ts`, `m2.mjs`, `m3.mjs`
    (new); guard-rail before the commit; this ledger edit on `main`.
    **MERGED — 2026-07-24, merge commit `7ebe703`.** Built by chat 3
    (`m3-rhizome-roams` @ `ccf643b`); merged by chat 1 in the serialized lane,
    the standard sequence, guard-rail confirmed. TRUE 3-way `--no-ff` onto `main`
    @ `a896923` (merge-base `541f435`; `main` advanced with all of CD4/CD4.1 +
    records since) — **auto-resolved CLEAN, zero conflicts**: M3 touched only
    `RhizomeField.tsx`, `rhizomeEngine.ts` (new), `index.css`, `m2.mjs`, `m3.mjs`
    (new), no overlap with the CD4/CD4.1 files. At the merge HEAD: docs survived
    (zero deleted); `tsc` ×2 EXIT 0; `build:web` clean; **`m3.mjs` PASS 33 and
    `m2.mjs` PASS 54, both `HARNESS_PARKED` settings, read to completion in the
    main loop**; integration spot-check `cd4`/`cd1`/`m1` GREEN (the M3 + CD4/CD4.1
    union is clean). Zero schema, zero server files, zero deps.
    **Fable's ruling on the geometry-drift RE-FIT: ENDORSED — within M3's own
    mandate** (the boot-settle + window-resize re-sync that makes S2's paper-
    avoidance verdict real against the paper's settled place). **Item 60 STAYS
    OPEN** for the revisit-determinism (revisit-raw-coordinate) question proper —
    the re-fit addresses only the boot-settle manifestation of item 60's root.
    **DEPLOYED — 2026-07-24 (`375c10f`), with the batch** — see item 57's deploy
    record. Verified live. Merge rode the zero-schema pre-authorization; Fable reviewed post-merge (GREEN).
    **CLOSE-PENDING** Fable's post-merge review + Nick's device sitting (his eye
    on the ground roaming warm to the edges, an essay's worth of fill, never
    touching his words). Then item 58 closes.
    **REVIEW LANDED GREEN — 2026-07-24** (`docs/wrizo-alpha/m3-review-fable.md`):
    the three device verdicts real (ink `#7A6242` with contrast arithmetic; seven
    blue-noise origins, paper double-walled, 40-seed sweep zero violations at full
    saturation; `SAT_K=834` curve — coverage/monotonicity/bounded-tail proven); the
    geometry-drift RE-FIT ratified IN FULL ("the mandate holding, the implementation
    better than the flag suggested" — the ground the deterministic image of (seed,
    geometry, total words), forward-only preserved by the high-water mechanism); the
    park sweep "lighter than briefed and correct" (only four component-observing
    checks falsified, all quoted verbatim). Non-blocking advisories: (1) the four m2
    parks use the comment-record form (th1 precedent, lawful) — migrate to the
    pok-record form at next touch (m2 has a parked block); (2) `growTo`'s 200-skip
    bailout (liveness over completeness) named for a future "ground came up short"
    report; (3) item 60's scope refined below. **Item 58 close-pends Nick's sitting
    alone; with this review the whole batch is merged AND reviewed — the deploy word
    is unblocked.**
60. **The Rhizome revisit-geometry defect** (lifted from `m2.mjs`'s Section A
    comment per the M2 review's standing ask + M3 S0 — its RECORD is M3's
    scope, its FIX is not). On revisiting the SAME entry within a session the
    measured ABSOLUTE stage/paper rect can shift by a constant offset, so raw
    growth coordinates differ across an in-app revisit even though the seeded
    PRNG's SHAPE is byte-identical; `m2.mjs`'s determinism check sidesteps this
    by shape-normalizing every coordinate to the first segment's own start
    point (intent: growth SHAPE not raw pixels — kept per A4). The primary
    known cause — App.tsx's `.app-main[data-desk-frame-active]` DeskRail-gutter
    switch leaving the 64px reservation transiently mis-stated — was **fixed at
    source by J6 S1 (`store/deskFrameActive.ts`, item 47 closed)**; whether a
    residual absolute-shift remains, and whether the normalization sidestep can
    now retire to a raw-coordinate assertion, is the open question this item
    surfaces so the next session finds it OUTSIDE a code comment. **Fix
    deferred — not any ticket's scope until claimed; M3 only lifted the
    record.**
    **REFINED by the M3 review (advisory 3, 2026-07-24):** the boot-settle
    manifestation is now closed at its root by M3's refit (`syncField` resets the
    PRNG to the entry's seed and regrows deterministically on a >1px geometry
    change). What remains is the ABSOLUTE-OFFSET question proper — live determinism
    is proven under normalization to the first segment's start; whether that
    normalization can be dropped (absolute determinism) or the frame-offset variance
    is inherent-and-benign is a small post-vacation investigation. Item 60 closes
    when that's answered either way.
62. **The SC arc — the Script's Own Room.** **FOUNDED — 2026-07-24 (S0 records
    push).** Nick's first screenplay sitting (laptop-class ~2560px framed, Flux
    theme, a Page converted to Screenplay, DRAFT on the mode strip) produced
    seven verdicts, recorded in his words as the spec per the M3 precedent —
    `docs/wrizo-alpha/sc-defect-verdicts.md`. **SC-V1** the room's placement
    ("the page is in a weird spot, the side menus are floating in space");
    **SC-V2** the type ("the font is too big"); **SC-V3** the arc's
    constitutional verdict — the page is not a page ("1 page roughly equals 1
    minute of screen time … our screenplay page needs to comport to those
    standards"); **SC-V4** the caret's home ("the cursor starts by floating in
    the middle of the page"); **SC-V5** the trade's tools, a verdict of absence
    (Fable's census attached: `retype()` is reachable ONLY by keyboard —
    **no pointer path to an element type exists**, a usability defect on a
    laptop/tablet-first product, not a missing feature); **SC-V6** the Tutor's
    ear; **SC-V7** the storyboard one gesture away. Evidence screenshot belongs
    alongside at `docs/wrizo-alpha/sc-evidence/screenplay-1-flux.png` — **not yet
    in the tree; rides the next records push when Nick drops the file.** The
    committee sat a double pass (`docs/wrizo-alpha/sc-committee-pass.md`) with a
    guest bench of working screenwriters by Nick's word — Feature Dramatist,
    Room Writer, Half-Hour Writer, Genre Spec Writer — and pinned the standard
    for the record: US Letter, Courier 12pt at 10 cpi / 6 lpi, margins
    1.5/1/1/1, ~55 lines, the element grid, page numbers top-right from page
    two. Its diagnosis of V2+V3+V4 as one defect wearing three faces stands as
    the arc's frame: **the room was furnished with prose furniture.** Marketing's
    five objections (runway, the first number, the BM1 flip-flop,
    storyboard-by-default, scope gravity) all resolved in session; the line
    drawn on the record — **Wrizo's screenplay room is a writing room, not a
    production office** (deferred + named: SC2.1 `(MORE)`/`(CONT'D)`, dual
    dialogue, title page; out of alpha entirely: revision colors, locked pages,
    production numbering).
    **RULINGS LANDED — 2026-07-24** (`docs/wrizo-alpha/sc-ratification-record.md`,
    the R4-ruled version). **R1 APPROVED** — page numbers as document furniture,
    top-right from page two, page one bare; the bright line travels with it (the
    number lives on the page artifact only, no aggregate of it ever surfaces
    anywhere; the anti-gamification frame amended by exactly this one line).
    **R2 APPROVED** — the script page's door, amending BM1's script-bar ruling on
    the record: the arrow-dressed **PLAN →** door, a board first born from a
    script page wakes in STORYBOARD, remembered mode governs thereafter (lands in
    SC3). **R3 HELD** — TS1 (the committee's Second Sitting, chamber 1, the PROSE
    page's per-mode strips) awaits ratification; Nick's word: wait and note it for
    revisit → a post-vacation agenda item. Fable's ruling under the hold: SC3's
    script strip rides the AB2 strip system that already exists as its own
    surface — SC3 is unblocked. **R4 RULED** (Nick: "I agree with you about R4",
    ratifying Fable's split) — (a) the **craft ear** ships pre-vacation as **SC4 —
    the Tutor's Script Ear**, the arc's final micro-ticket after SC3
    (server-touching prompt work, zero schema, disclosed at brief); (b) the
    **FORMAT lens** (a fourth programmatic offline lens, mechanical format linting
    against the grid) is a feature under the freeze and queues as **the first
    post-vacation TU ticket**, on the horizon for the Write/TU line to claim and
    number. **R5 RATIFIED** — `scriptKeys.ts` stands exactly as shipped; the bench
    confirmed both AMENDABLE cells match the trade's muscle memory (Enter after
    dialogue → action; Tab from character → transition); the 2026-07-11 loop
    closes, the in-file AMENDABLE comments update to RATIFIED as a rider on SC3.
    **R6 — Nick's word, overruling the committee's recommendation:** "I want to
    get this fixed before I go so I can start working on a screenplay." The arc
    builds **pre-vacation**; his condition (no architectural conflict with the
    pending device sitting) cleared by Fable on the record, and the
    deploy-manifest recommendation is already satisfied — the batch shipped at
    `375c10f` before any SC merge, so SC earns its own deploy word separately.
    **Sequencing ruled: SC1 → SC2 → SC3 (+ the door + the R5 comment rider) →
    SC4.** All fixes, all zero schema, all freeze-lawful.
    **SC1 BRIEFED — 2026-07-24, Fable-authored**
    (`docs/wrizo-alpha/sc1-true-geometry-brief.md`): the Room's True Geometry, the
    arc's heart — S1 the true page (Letter proportions, bundled Courier Prime
    under SIL OFL as an asset with its license, the whole-sheet scaling law), S2
    the element grid (single-sourced, replacing `elementStyle()`'s
    approximations), S3 the caret's home (reproduce-then-root-cause; the
    typewriter yields until the natural position passes the stage's center), S4
    the seated room (reproduced on default chrome + two themes including Flux,
    with any Flux-ONLY residue recorded to the parked theme arc and never
    chased), S5 the `sc1.mjs` geometry floor (aspect + grid ratios at full and
    scaled widths, display-uppercase vs. unchanged storage, S3 under genuine
    trusted CDP pointer + real keystrokes, both `HARNESS_PARKED` settings,
    grep-first `scripts/harness/` with lawful park cycles in the same commits).
    Owner CC (SC line), one worktree off `main` at or after the M3 merge
    (`7ebe703`); merge rides the zero-schema pre-authorization through chat 1's
    serialized lane; Fable reviews post-merge; deploy is Nick's separate word.
    **The arc seed** (`docs/wrizo-alpha/sc-arc-seed.md`) is already on `main` at
    `375c10f`. **Item 62 tracks the whole arc: SC1 building, SC2/SC3/SC4 queued
    behind it in that order.**

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
- **THE S0-PUSH RULE — ratified 2026-07-21 (Nick, "Sure, ratify
  S0-push rule"), proposed by Fable's own FX7 review citing the
  shared-tree collision class's THIRD occurrence** (the two CD1.1/HB1
  collisions on 2026-07-16, then item 42's own concurrent-TU2 incident
  on 2026-07-21). ONE CHECKOUT PER AGENT closed the build-time version
  of this problem (concurrent agents never share a working TREE); this
  closes the remaining gap — concurrent ORCHESTRATING SESSIONS sharing
  the same primary checkout's own `main` for docs/ledger commits. **A
  session's own S0-style records commits (a brief, a ledger open, a
  status note) are never committed directly against the primary
  checkout's own local `main`.** Instead: branch off the current
  `origin/main` tip (a throwaway locally-named branch is fine, in the
  primary checkout or a worktree, either is safe since the branch
  itself never collides), commit there, then land it with a
  fast-forward-only push directly to the remote ref —
  `git push origin <local-branch-or-sha>:main` — never a plain
  `git push origin main` from a local `main` that was committed to
  directly. If that fast-forward is rejected (origin/main moved),
  fetch and re-parent before retrying — never force. **The primary
  checkout's own local `main` is reserved for MERGE operations only**
  (a ticket branch's own code merging in), each one serialized by
  Nick's own merge word, exactly as every ticket in this ledger
  already does. This preserves the exact thing that let FX7's own
  session discover TU2's concurrent work at all (an early, honest,
  disk-first ledger) while removing the shared-tree surface that made
  the discovery necessary in the first place.
- **THE PLACEHOLDER-REPORT RULE — ratified 2026-07-21 (Fable's FX8
  review), occurrence 2 in one day** (FX7's own build report, then
  FX8's own review report — both ended their turn on a stalled
  background-monitor placeholder instead of an actual completed
  report). **A stalled or placeholder report is a report that does
  not exist.** No close condition is ever satisfied by a report that
  was never written, and no agent may record a verification whose
  output it did not itself read. A ticket whose build or review
  stalls this way may still merge/close only when (a) the gap is
  named plainly in the ledger and (b) the merging agent performs its
  own compensating verification and discloses it — never silently
  treated as netted just because an agent was dispatched.
- **CONTENTION-SUSPECTED FAILURES MUST BE RE-RUN IN ISOLATION —
  ratified 2026-07-21 (Fable's FX8 review, Ruling 4a).** A harness
  check failing only inside a full-suite run, never in isolation, is
  not to be called transient on the strength of that pattern alone —
  re-run it 2-3+ times in genuine isolation first, and disclose the
  actual pattern (isolated-clean count vs. suite-failure count)
  either way. Practice note from the same ruling: a sweep whose
  result gates a merge should not itself be run alongside another
  session's own build — that is what manufactures the contention this
  rule exists to catch.
- **PARKED ENTRIES ARE IMMUTABLE — RATIFIED 2026-07-22 (Fable's word,
  the CD3 incident, item 53), NO incidental exemption.** A parked
  assertion may be superseded again (its own new park cycle, with its
  own fresh SUPERSEDED marker and successor), re-pointed at a different
  successor, or annotated with a comment — but a parked entry's own
  recorded ORIGINAL text, once parked, is never rewritten. Touching a
  parked entry's original text is never a fix. **No "plain incidental
  count bump" exemption** — the question was raised (B1's own
  `9ce8f6b` in-place edit of an already-parked `ab3.mjs` entry,
  `stripItemCount 7→8`, invoking an `fx2.mjs`-style incidental-bump
  precedent) and RULED against: a change to a parked entry's own
  tested condition is a violation regardless of how small, because the
  whole point of the frozen record is that it stays byte-true. **B1's
  count bump ruled a violation — but pre-law, already remediated (the
  CD3 fix pass restored the parked text and added a fresh generation
  rather than mutating further), no further action on that specific
  instance.** Trigger: a concurrent session's own harness edits
  mutated an already-parked historical entry in-place rather than
  starting a new park cycle (CD3), discovered by an independent audit;
  the review then found the same class had ALREADY happened once
  before, undetected (B1). The systematic question — are there OTHER
  undetected pre-law mutations across the harness tree? — becomes a
  parked-entry history-audit rider on item 48 (not this specific
  entry's concern).
  **CODICIL — ratified 2026-07-22 (Fable's A1 ruling, items 53/54;
  `docs/wrizo-alpha/a1-immutability-ruling-2026-07-22.md`), the
  RECORD-vs-PROBE distinction.** A parked check is two parts: the
  RECORD (the quoted, non-executing name/original text — frozen) and
  the PROBE (the boolean that runs, re-verifying that current reality
  still justifies the park — an instrument, never part of the record;
  it has never had to match the frozen text). **A parked entry's
  probe MAY update in place — but ONLY in a commit that also records
  the supersession event that moved reality (a fresh park cycle for
  the superseded generation + a live successor), with the probe
  update disclosed by name in the commit message.** A probe update
  arriving WITHOUT that same-commit supersession record is treated as
  a record mutation and remediated as one. The bright line: the
  record is the quoted non-executing text; the probe is what runs; a
  probe may move only when reality moved, and the record of reality
  moving must travel in the same commit. (CD3's and BM1's instances
  both satisfy it; E1.1's own `e1-rou→ndtrip` probe update rode the
  same commit that hardened the suffix, disclosed.)
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
