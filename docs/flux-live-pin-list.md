# Flux live: the pin list

For Fable's reading before Flux live (ruling of Nov 23, 2:30 pm). Join: `ink/flux-live` @ c72a2af8, on L3 live. The driver pin is merged (`ink/flux-driver-pin` e09a6629).

## The answer

- **141 browser harness files name Flux.** The driver pins each to `?flux3=0` wherever it opens a page without its own query.
- **104 keep their subject:** they also pass on the Flux a writer gets.
- **20 changed subject.** They hold 48 writer-facing promises: 9 have a successor on default Flux, 11 are retired by a ruling, **24 need a new successor**, and **4 may be real bugs**.
- **11 were red for another reason** (listed below). Two of them found real bugs, both now fixed on the join.
- **6 are box-only** and have no live reading yet.

The 24 successors are not built yet.

## Your rulings

1. **The double Log (row 33).** On a Log page the rail shows her place as LOG and the LOG door below it, unmarked (`ReorgRail.tsx:46-51, 121, 146-151`). The L2 plan was "duplicate Log fix first". Lean: a bug; mark the door as her place and drop the second word.
2. **The "?" on Inputs and Presets (row 22).** Flux has neither, and no file in `reorg/` uses HelpButton. Arbor keeps Inputs' on its prose pages (`Tutor.tsx:1136`: `arbor2 && !arborBoard`). Lean: add both, through the lexicon.
3. **A screenplay's templates (row 13).** The host still passes five, but the Front menu hides them and the kind menu reads none. **The same rule applies to Arbor** (`frontKindHead` covers `plateau` and `flux`), so this is not Flux-only and is already live in Arbor. Not yet confirmed on a frame. Lean: a separate ticket, not a Flux live blocker.
4. **The room's drifting points (row 31).** They pause at whatever opacity they had when she types (read: 0.23 and 0.9), so they stay painted, against "nothing off the page paints while typing". The room ground's own spec says "pause" and "never flash". Lean: fade them with the chrome.

## How this was read

- Run 45287446449 ran all 135 Actions-runnable files on `ink/flux-live-read`, a probe that is never merged: a file that does not ask gets the redesign, with the reorg on for pages **loaded with Flux stored**.
- **Limit:** a file that switches to Flux after the page loads read the redesign without the reorg, a pair no writer gets. flux-v2 F6, F7, F8 and F14 are in that group, and other green files could be too.
- The promise map was drafted by a read-only agent. I checked rulings 1 to 3 against the source. The other rows are its reading of code and logs, and no frame was taken.
- `flux-reorg-spec.md` is not in the repo, so a RETIRED row quotes code and harness comments. The spec could change a row.
- hb1, polish-arbor-chrome and scrollbar-flush crashed before printing, so their earlier checks have no live reading.

## The promises (48 rows)

| # | File, check | Writer-facing promise | What live Flux does | Verdict and evidence |
|---|---|---|---|---|
| 1 | flux-v2 F6 | Orange appears only in the allowed places | The two offenders were the old rail's place block. The redesign makes her place orange (`flux3/flux-v3.css:183, 200-205`). The reorg's place box carries `aria-current` (`reorg/ReorgRail.tsx:146-148`), which F6's allow-list accepts | **NEEDS NEW SUCCESSOR.** R4 reads her place's orange but nothing scans the whole live page |
| 2 | flux-v2 F7 | Every rail item is a 44 px target | 39 px was the Trash door on the old rail. The reorg rail has no Trash door (`ReorgRail.tsx:138-141, 174`) | **NEEDS NEW SUCCESSOR.** No live check reads target size |
| 3 | flux-v2 F8 (2 checks), name half | The default Drive reads New Drive, a renamed one keeps her name, the stored name is untouched | `useProjectName` draws it (`ReorgRail.tsx:43`) | **NEEDS NEW SUCCESSOR.** No live check reads `.wz-reorg-where-name` as text |
| 4 | flux-v2 F8 (2), F14, hover title half | Hover shows "DRIVE ▸ name" | Hover shows what the count counts (`ReorgRail.tsx:148`) | **RETIRED BY DESIGN.** `flux3/flux-v3.css:182-183`: "Each carries one TRUE reading under its name ... and its hover hint says what the number counts." Side flag in the last section |
| 5 | flux-v2 F14, one line | The place name stays on one line | Two lines, then an ellipsis (`styles/24-reorg-flux-rail.css:13-14`) | **RETIRED BY DESIGN.** `flux-v3.css:195-196`: "two lines at most ... flux-v2 §8 made it one nowrap line: here it wraps to two" |
| 6 | flux-v2 F12, the mark | Flux shows its own orange WRIZO mark, top left | v5 app mark (`App.tsx:228`, `flux3/fluxMark.tsx:172-178`) | **SUCCESSOR EXISTS.** flux-mark-splash MS18, both tones |
| 7 | flux-v2 F12 + F19, no PNG | Arbor's wrizo PNG is never drawn in Flux | Flux draws its own mark. The run's F12 read `bad: []` | **NEEDS NEW SUCCESSOR.** No live check keeps this clause |
| 8 | flux-v2 F19, door colour | The Write door is the choice colour, not brass | The door is `[ COMPOSE ]` in ink with a cyan ring and a hidden brass bar (`flux3/FluxFive.tsx:158-165`) | **NEEDS NEW SUCCESSOR.** MS7 checks brass on the node boxes only, not the doors |
| 9 | flux-v2 F19, logo | The arrival wears Flux's own wordmark | v5 mark in the door frame (`FluxFive.tsx:182`) | **SUCCESSOR EXISTS.** flux-mark-splash MS1, MS2 |
| 10 | drawers-p1-live L5 Free Write TEXT, INK | Free Write's drawer offers TEXT and INK | No Front menu in Free Write | **RETIRED BY DESIGN.** `pages/PageEditor.tsx:1362-1364`: "SPRINT HAS NO MENUS ... each other theme takes it with its own reorg build ... no Text, Ink or Parts tools and no pen". FF10 holds the new state |
| 11 | drawers-p1-live L5 Draft, contents | Draft offers Typeface, Format, Actions, Templates, page kind | Typeface, marks and Commands on MARKUP; Presets and the rest in TRACKS' head menu (`reorg/frontTabs.ts:18-26`) | **SUCCESSOR EXISTS.** reorg-flux-front-live FF2, FF3, FF19 |
| 12 | drawers-p1-live L5 Draft, order | The sections run in a fixed order | MARKUP keeps its own order | **NEEDS NEW SUCCESSOR.** FF2 reads presence, not order |
| 13 | drawers-p1-live L5 Screenplay | A screenplay's drawer offers its templates | The log reads no section heads on MARKUP. The host still passes five templates (`components/ScriptEditor.tsx:609-615`), but `frontTabs.ts:25` hides them and the head menu "read[s] none of it" (`reorg/DocKindMenu.tsx:21`) | **POSSIBLE REAL BUG.** A writer opens the Front menu on a screenplay and MARKUP has no tools but Find, and the empty-screenplay template switch cannot be reached. Needs a frame to confirm |
| 14 | drawers-p1-live L6 | An open drawer's tab shows where she is, never brass | L6 threw because Free Write has no drawer | **NEEDS NEW SUCCESSOR.** FF6 covers the open tab's mark; nothing reads the grip on live Flux |
| 15 | drawers-p1-live L9 tablist, arrows, grips (4 checks and the throw) | The drawer's tabs work by keyboard and report their state | The tab row exists in Draft (MARKUP, TRACKS). L9 looked in Free Write | **NEEDS NEW SUCCESSOR.** No Flux Front menu check presses arrow keys |
| 16 | drawers-p1-live L9 Typewriter + Progress | No Typewriter toggle in Draft; the Progress toggle is there and reports its state | Progress moved to DOCS' Session (`components/Sliver.tsx:356-358`) | **NEEDS NEW SUCCESSOR.** R21 reads the label, not the state |
| 17 | guided-w1-part2, view list | A Board offers its views in order | Five views: Live, Sequence, Spine, Trace, Stack | **NEEDS NEW SUCCESSOR.** flux3-s4b-l3 VIEWS [board, 1920] holds the words but not the order (line 55) |
| 18 | guided-w1-part2, hover | Hovering the strip spells out the words | The words always show, with no icons | **RETIRED BY DESIGN.** `flux-v3.css:208-210`: "names its views as WORDS ... instead of icons that spell out on hover" |
| 19 | hb1 F3 (crash at line 271), doors | A second boot shows the front door | v5 door, with no button named Write (`components/Arrival.tsx:318-324`) | **SUCCESSOR EXISTS.** flux-mark-splash MS9, MS14 |
| 20 | hb1 F3, after the crash | Write after the first run has no veil and no gate | Same handler (`Arrival.tsx:185-242`) | **NEEDS NEW SUCCESSOR.** MS11 reaches the editor but reads no veil |
| 21 | hb2 S2 | Arrival keeps its doors under the stored theme | v5 doors (`FluxFive.tsx:201-202`) | **SUCCESSOR EXISTS.** MS9 signed out, MS14 signed in, both with the theme stored. COMPOSE is read signed out only; the product draws it in both states |
| 22 | help-buttons S1 Templates, S1 Grafts/Links | Each themed word has its own "?" with one plain sentence | Neither Presets nor INPUTS has a "?". No file in `reorg/` uses HelpButton. `components/Tutor.tsx:1136` passes it only when `arbor2` | **POSSIBLE REAL BUG.** A Flux writer loses the plain sentence for Inputs and Presets, while Arbor keeps Inputs'. The Nov 19 removal ruling names the stage strip only (`help-buttons.mjs:148-150`) |
| 23 | help-buttons S1b | Each of the five picker rows has a "?" | The five rows are gone | **RETIRED BY DESIGN.** `DocKindMenu.tsx:18-19`: "Presets are the draft's 18"; `frontTabs.ts:18` puts the ready-made starts in the head menu |
| 24 | page-templates-r2 X1 rows | The picker reads Raw, Script, Spine, Cover, Sources | Replaced by the head menu | **RETIRED BY DESIGN.** Same quotes as row 23. See the capability list below |
| 25 | page-templates-r2 X1 heads | Heads read Typeface and Presets | Typeface on MARKUP, Presets in TRACKS' menu | **NEEDS NEW SUCCESSOR.** FF3 holds the word Presets; FF2 finds the Typeface section but not its word |
| 26 | polish10-linkdock K1, K5, K7, K8 | Dock a linked item and read it beside the page, one at a time, then undock | Open Beside opens the split (`reorg/backMenu/AssetGroupsList.tsx:104-107`) | **NEEDS NEW SUCCESSOR.** reorg-flux-split-live opens by seam (line 53) and checks dress and rects, not the press, the words, the swap or the close |
| 27 | polish10-linkdock K2 | The reader stays visible while she types | Split asset | **NEEDS NEW SUCCESSOR.** No Flux split check types |
| 28 | polish10-linkdock K3 | The reader is read-only | Stated in `reorg/split/SplitHost.tsx:18` | **NEEDS NEW SUCCESSOR.** No Flux check presses or types in it |
| 29 | polish10-linkdock K6 | A reload keeps the dock | A reload forgets it | **RETIRED BY DESIGN.** `reorg/split/splitStore.ts:9`: "which asset is beside the page: never kept ... a reload, another page or a close forgets it" |
| 30 | polish10-page P5 (4 checks) | In the zoom, a drag on the page draws ink | Free Write has no INK tab | **RETIRED BY DESIGN.** `PageEditor.tsx:1362-1364` (row 10); `sprint-no-menus.mjs:1-2`: "T1, I1, P1 retire (the pen too)" |
| 31 | polish10-recede R1 (known) | Nothing off the page paints while typing | The room ground's drifting points stay painted (`components/DeskInstrument.tsx:48`) | **POSSIBLE REAL BUG.** Carried as given: an open question for Fable |
| 32 | polish10-recede R8 | A docked panel stays visible while typing | The dock button is on OPERATOR only (`Tutor.tsx:888-896`) and the Back menu opens on INPUTS (`Tutor.tsx:184`), so the check never docked | **NEEDS NEW SUCCESSOR.** No live check docks the panel |
| 33 | rail-bug4: Log once, icon-only door, pin marked (3 checks) | In the Log, the rail says Log once and marks where she is | Her place box reads LOG and the LOG door stands below it, unmarked (`ReorgRail.tsx:50-51, 121, 146-151`; the log counts 2) | **POSSIBLE REAL BUG.** The double Log is back. Fable's L2 plan was "with the duplicate-Log fix first" (`flux3-s4b-l2.mjs:1`). I found no ruling reversing it, but the spec is unreadable |
| 34 | rail-bug4, door to the Drawers | From the Log she can reach her Drives | The DRIVES door is always drawn (`ReorgRail.tsx:118`) | **NEEDS NEW SUCCESSOR.** R5, R6 and R15 press it from a Drive page only |
| 35 | rail-bug4, in a Drawer | The place names the Drive and Log is not marked | Drawn by `ReorgRail.tsx:146-151` | **NEEDS NEW SUCCESSOR.** No check reads the name text on live |
| 36 | scrollbar-flush (crash at line 87, first Flux cell) | The page's scrollbar sits flush at every margin setting | PAGE SETUP moved to TRACKS' Frame (FF3), so the old door is gone | **NEEDS NEW SUCCESSOR.** No Flux cell ran on live |
| 37 | size-box B Free Write | Free Write's size box sits between - and + | No Front menu in Free Write | **RETIRED BY DESIGN.** `PageEditor.tsx:1362-1364`; `size-words.mjs:119` states the same |
| 38 | size-words F and its mutant | Free Write has no size box | The Sliver is not mounted at all (`PageEditor.tsx:1367`), so the anchor those checks read is absent | **SUCCESSOR EXISTS.** reorg-flux-front-live FF10 |
| 39 | sprint-no-menus N1 (Flux) | Flux's Free Write keeps today's drawer | Flux took the rule with its reorg | **RETIRED BY DESIGN.** `sprint-no-menus.mjs:2-3`: "each other theme takes it with its own reorg build, parking that theme's Free Write checks then" |
| 40 | th2 proseSerif (2 checks) | Flux's default writing face is the ruled one | Crimson Pro on the redesign (`flux-v3.css:18-20`), and the picker names it (`store/fontRoster.ts:69-70`) | **SUCCESSOR EXISTS.** flux3-s4c NEWPAGE-14, on the Nov 9 ruling in that CSS comment |
| 41 | th2 R2 | Flux's fonts are really loaded | The log reads Chakra Petch as not loaded; Rajdhani loaded | **NEEDS NEW SUCCESSOR.** Cause not determined (last section) |
| 42 | polish-arbor-chrome P7 (crash at line 179) | Arbor's polish does not change Flux's chrome | Flux has its own reorg rail | **NEEDS NEW SUCCESSOR.** R2 reads door dress only, not glyph sizes, tab size or the rail edge |
| 43 | polish-arbor-chrome P8, never reached | The paper is the same size in all three themes | Not read on live | **NEEDS NEW SUCCESSOR.** flux3-page-rect compares Flux with and without the flag, not across themes, and not with the reorg |
| 44 | wa-red-popout, opening (crash at line 61) | The Log in door opens the pop-out | The door is `[data-flux-door=login]`, not `.wz-arrival-signin` | **SUCCESSOR EXISTS.** flux-mark-splash MS13 |
| 45 | wa-red-popout, P1 to P28 on Flux | The panel's words, colours, fit, focus, 18+ tick, Esc and errors | None of these ran on the v5 door | **NEEDS NEW SUCCESSOR.** Open the panel through the v5 door. P7 also needs a new reading, because the real Write door is gone |
| 46 | bug50 (not in reds.json) | Flux's caret reads clearly on the light page | Green 7/7 unpinned in this run. `flux-v3.css:178` holds the colour | **NEEDS NEW SUCCESSOR.** The pair pins this file to `?flux3=0`, and it is the only harness holding `#A84E00`. It needs a live arm |
| 47 | bug57 LINK-PIXELS (3, known) | Board links draw in the approved colours and hold contrast | Strokes are right; a 1 px line on a fractional pixel reads about 14 off; contrast passes | **SUCCESSOR EXISTS.** flux-zoom-link-colours COL-rest, COL-hot, CON-*, drawn pixels on `?flux3=1`, both tones, green in this run |
| 48 | bug57 LINK-LIVE | The fixture is the live Flux build | It reads `data-flux3` as absent, and live Flux now carries it | **RETIRED BY DESIGN.** `flux3/flag.ts:3`: "the redesign is ON by default". The check's premise is what the switch-over reversed; its restatement is one token |

## Every Flux file

| File | Opens through | Live read | Did the redesign change its subject? |
|---|---|---|---|
| arbor-canvas | driver + own URL | green | No |
| arbor-default-on | driver + own URL | green | No |
| arbor2-1 | driver + own URL | green | No |
| bg2 | driver (pinned) | green | No |
| board-context-menu | driver (pinned) | green | No |
| bug50-flux-light-caret | driver + own URL | green | **Yes**: rows 46 |
| bug57-live-board-links | driver (pinned) | red | **Yes**: rows 47, 48 |
| bug83-count-row | driver (pinned) | green | No |
| card-close-x | driver (pinned) | green | No |
| card-label-contrast | driver (pinned) | green | No |
| cascade-motion | driver (pinned) | green | No |
| cd2 | driver (pinned) | green | No |
| deck-rows | driver (pinned) | green | No |
| deckwizard-backdrop | driver (pinned) | green | No |
| drawer-mirror | driver (pinned) | green | No |
| drawers-p1-live | driver (pinned) | red | **Yes**: rows 10, 11, 12, 13, 14, 15, 16 |
| esc-returns-caret | driver + own URL | green | No |
| faint-text-sweep | driver (pinned) | green | No |
| fit-icon | driver (pinned) | green | No |
| flux-card-ink | driver (pinned) | green | No |
| flux-caret-settle | driver + own URL | green | No |
| flux-ghost-probe | driver (pinned) | green | No |
| flux-mark-splash | driver + own URL | green | No |
| flux-page-ink | driver (pinned) | green | No |
| flux-rename-field | driver + own URL | green | No |
| flux-v2-part2 | driver (pinned) | red | Not a check of its own: a module flux-v2 runs. |
| flux-v2 | driver (pinned) | red | **Yes**: rows 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| flux-wirein-flagoff | driver + own URL | green | No |
| flux-wirein-latency | driver + own URL | not read (box-only) | Unknown until the box turn |
| flux-zoom-link-colours | driver + own URL | green | No |
| flux-zoom-link-contrast | driver + own URL | green | No |
| flux-zoom-links | driver + own URL | green | No |
| flux-zoom1 | driver + own URL | green | No |
| flux3-current | driver + own URL | green | No |
| flux3-default-on | driver + own URL | green | No |
| flux3-latency-zoom | driver + own URL | green | No |
| flux3-latency | driver + own URL | green | No |
| flux3-other-themes-dom | driver + own URL | green | No |
| flux3-page-rect | driver + own URL | green | No |
| flux3-s1 | driver + own URL | red | Names its own URL. Red only because the read forced the reorg onto its `?flux3=1` arm. Green on the pinned run. |
| flux3-s2 | driver + own URL | red | Names its own URL. Red only because the read forced the reorg onto its `?flux3=1` arm. Green on the pinned run. |
| flux3-s3 | driver + own URL | green | No |
| flux3-s4b-l1 | driver + own URL | green | No |
| flux3-s4b-l2 | driver + own URL | red | Names its own URL. Red only because the read forced the reorg onto its `?flux3=1` arm. Green on the pinned run. |
| flux3-s4b-l3 | driver + own URL | red | Names its own URL. Red only because the read forced the reorg onto its `?flux3=1` arm. Green on the pinned run. |
| flux3-s4b-l4 | driver + own URL | green | No |
| flux3-s4b-l5 | driver + own URL | green | No |
| flux3-s4b-l6 | driver + own URL | green | No |
| flux3-s4b-l6t | driver + own URL | green | No |
| flux3-s4b-n5 | driver + own URL | green | No |
| flux3-s4c | driver + own URL | red | **Found a real bug, fixed:** in Wire In the Back menu's anchor swallowed every press on the page. 78/78 with the reorg on after the fix. |
| fog-a-speed | driver + own URL | green | No |
| fog-a | driver + own URL | green | No |
| font-span | driver (pinned) | green | No |
| freewrite-typewriter | driver + own URL | green | No |
| fx5 | driver (pinned) | green | No |
| fx7 | driver (pinned) | green | No |
| glitch-meter | driver (pinned) | not read (box-only) | Unknown until the box turn |
| guided-add-scenes-part2 | driver (pinned) | green | No |
| guided-w1-part2 | driver (pinned) | red | **Yes**: rows 17, 18 |
| guided-w2-part2 | driver (pinned) | green | No |
| guided-w3-part2 | driver (pinned) | green | No |
| guided-w5-part2 | driver (pinned) | green | No |
| hb1 | driver (pinned) | red | **Yes**: rows 19, 20 |
| hb2 | driver (pinned) | red | **Yes**: rows 21 |
| help-buttons | driver (pinned) | red | **Yes**: rows 22, 23 |
| help-choose | driver (pinned) | green | No |
| keyflip-live | driver + own URL | green | No |
| l-method | driver + own URL | not read (box-only) | Unknown until the box turn |
| machina-look | driver + own URL | green | No |
| machina-step | driver (pinned) | green | No |
| outline-blur-part2 | driver (pinned) | green | No |
| page-open-scroll | driver + own URL | green | No |
| page-size | driver (pinned) | green | No |
| page-templates-r2 | driver (pinned) | red | **Yes**: rows 24, 25 |
| pagebreaks | driver (pinned) | green | No |
| plain-tracker | driver + own URL | green | No |
| polish-arbor-chrome | driver (pinned) | red | **Yes**: rows 42, 43 |
| polish-arbor-room | driver (pinned) | green | No |
| polish10-12-part2 | driver (pinned) | not read (box-only) | Unknown until the box turn |
| polish10-13-part2 | driver (pinned) | green | No |
| polish10-14-frames | driver (pinned) | red | Not a check: it needs an output folder. Non-OK on L2 too. |
| polish10-anchor | driver (pinned) | green | No |
| polish10-board | driver (pinned) | green | No |
| polish10-card | driver (pinned) | green | No |
| polish10-caret | driver (pinned) | green | No |
| polish10-ground | driver (pinned) | green | No |
| polish10-hint | driver (pinned) | green | No |
| polish10-linkdock | driver (pinned) | red | **Yes**: rows 26, 27, 28, 29 |
| polish10-page | driver (pinned) | red | **Yes**: rows 30 |
| polish10-recede | driver (pinned) | red | **Yes**: rows 31, 32 |
| polish10-size | driver (pinned) | green | No |
| rail-bug4 | driver (pinned) | red | **Yes**: rows 33, 34, 35 |
| reduced-burst-holds | driver + own URL | green | No |
| reflow-open | driver (pinned) | green | No |
| reorg-backmenu | driver + own URL | green | No |
| reorg-flux-back-live | driver + own URL | green | No |
| reorg-flux-front-live | driver + own URL | green | No |
| reorg-flux-rail-live | driver + own URL | red | R0 reads the reorg switch itself, which the read overrode. |
| reorg-flux-split-live | driver + own URL | green | No |
| reorg-flux-top-live | driver + own URL | red | T0 reads the reorg switch itself, which the read overrode. |
| reorg-front-menu | driver + own URL | green | No |
| reorg-part-moves | driver + own URL | green | No |
| reorg-parts-ui | driver + own URL | green | No |
| reorg-publish-live | driver + own URL | green | No |
| reorg-rails | driver + own URL | green | No |
| reorg-switchover | driver + own URL | red | Reads the reorg switch itself, which the read overrode. |
| reorg-top-rail | driver + own URL | green | No |
| rhizome-goal | driver (pinned) | not read (box-only) | Unknown until the box turn |
| sc1 | driver (pinned) | green | No |
| sc2 | driver (pinned) | green | No |
| scrollbar-flush | driver (pinned) | red | **Yes**: rows 36 |
| size-box | driver (pinned) | red | **Yes**: rows 37 |
| size-words | driver (pinned) | red | **Yes**: rows 38 |
| sized-by-hand | driver (pinned) | green | No |
| splash | driver (pinned) | not read (box-only) | Unknown until the box turn |
| sprint-no-menus | driver + own URL | red | **Yes**: rows 39 |
| strip-no-help | driver (pinned) | green | No |
| th-machina | driver (pinned) | green | No |
| th1 | driver (pinned) | green | No |
| th2 | driver (pinned) | red | **Yes**: rows 40, 41 |
| theme-picker | driver (pinned) | green | No |
| typewriter-open-settles | driver + own URL | green | No |
| vw1 | driver (pinned) | green | No |
| wa-red-103 | driver (pinned) | green | No |
| wa-red-60 | driver (pinned) | green | No |
| wa-red-61 | driver (pinned) | green | No |
| wa-red-62 | driver (pinned) | green | No |
| wa-red-63 | driver (pinned) | green | No |
| wa-red-64 | driver (pinned) | green | No |
| wa-red-65 | driver (pinned) | green | No |
| wa-red-66 | driver (pinned) | green | No |
| wa-red-67 | driver (pinned) | green | No |
| wa-red-69 | driver (pinned) | red | **Found a real bug, fixed:** the board rename box was near-white on white. Successor: `flux-rename-field` 5/5. Its caret detector also reads the room's moving points on live Flux. |
| wa-red-72 | driver (pinned) | green | No |
| wa-red-73 | driver (pinned) | green | No |
| wa-red-78 | driver (pinned) | green | No |
| wa-red-93 | driver (pinned) | green | No |
| wa-red-popout | driver (pinned) | red | **Yes**: rows 44, 45 |
| walk-open-select | driver (pinned) | green | No |
| width-gate | driver (pinned) | green | No |
