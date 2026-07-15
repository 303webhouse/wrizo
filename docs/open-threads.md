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
21. **The AB-arc.** Canon ratified 2026-07-14 — Nick's word, rulings folded
    into `docs/wrizo-alpha/ab1-page-frame-brief.md` (mode strings, flourishes
    unmounted, theme-scoped module names) and `docs/wrizo-alpha/the-desk-design.md`
    Part 6 (now RULED). Briefs per `docs/wrizo-alpha/fable-week-plan.md`.
    Supersedes item 2's remaining gates (see above). Blocks: AB2/AB3 briefs,
    the succession dossier.

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
