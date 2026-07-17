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
26. **CD1 — the Composed Desk.** **BRIEF RATIFIED, BUILD AUTHORIZED —
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
    ticketed as their own build (item 27, FX2) rather than folded here
    — the fold cycle for cd1.1 is done. Nick's remaining sitting
    verdicts (the glow, the journal-paper question, the drawer at
    rest, the wide field) arrive on his own clock and aren't presumed
    by FX2 or anything else; item 26 doesn't close until his sitting
    is fully spent.
27. **FX2 — the Second Sitting.** **BRIEF COMMITTED, BUILD AUTHORIZED —
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
