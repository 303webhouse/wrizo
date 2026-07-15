# AB1 S0 — shell inventory (gate)

Every top-level composition wrapping a writing surface today, enumerated
before any DeskFrame code was written, classified keep-inside-frame /
absorb / delete. "Writing surface" = a place prose/script/board content is
actually authored (not a planning/browse view).

| # | Composition | Route(s) | Own top chrome today | Classification | Notes |
|---|---|---|---|---|---|
| 1 | `pages/PageEditor.tsx` — `PageEditorView` (text delegate) | `/page/:id` (pageType text/manuscript) | `sprint-nav`: breadcrumb, `ModeSwitcher`, Pages/Plan toggle, "Copy page text", Done | **keep-inside-frame** | Becomes DeskFrame's stage at ≥1100px (S1/S2). Breadcrumb + Pages/Plan toggle stay as page-level nav; "Copy page text" leaves top chrome (S4); ModeSwitcher replaced by the new unified `ModeStrip` inside the frame. `<1100px` renders its exact current JSX unchanged (non-goal: mobile keeps current behavior). |
| 2 | `components/BoardEditor.tsx` (board delegate) | `/page/:id` (pageType board), mounted by `PageEditor()`'s dispatcher | `sprint-nav`: breadcrumb, Undo, Done | **keep-inside-frame** | Mounts inside DeskFrame's stage at ≥1100px; no ModeStrip (Trellis-side by design, matches the existing `w1.mjs` "board never gets mode tabs" assertion). `<1100px` unchanged. |
| 3 | `components/ScriptEditor.tsx` (script delegate) | `/page/:id` (pageType script) | `sprint-nav`: breadcrumb, "Copy script text", Done | **keep-inside-frame** | Mounts inside DeskFrame's stage at ≥1100px, now WITH the ModeStrip (Draft live; Free Write/Revise/Workshop deferred — script forward-only is AB2). Gets the containment fix here — today it has **no scroll cap at all** (`.script-sheet` inside bare `.page`), which is finding 4's concrete bug. `<1100px` unchanged. |
| 4 | `components/ModeStage.tsx` | mounted by #1 (and by QuickSprint, #5) | rails (capture/sections stub panels), format/pen bar, gear, incentive row (progress/typewriter/milestones), ambient glow | **keep-inside-frame, restructured** | Gains a `framed` prop (S2): when framed, its own left/right rails, incentive row, and ambient glow do not mount (those zones/flourishes move to DeskFrame tracks or are parked); the pen/format bar, the page/scroll container (`.mode-page`/`.mode-scroll`, already height-capped + internally scrolling — no containment bug here), and the settings gear stay. `framed=false` (default, `<1100px` and QuickSprint) is byte-identical to today. |
| 5 | `pages/QuickSprint.tsx` | `/sprint`, `/project/:id/sprint` | Its own `sprint-nav` (breadcrumb, `ModeSwitcher`, Pages/Plan, "Take a nudge"), beat-context strip, nudge slip, bottom Save/Finish bar, finish-moment card | **absorb — deferred past AB1** | Not "the Page" (a distinct scratch/finish-ritual flow, not the manuscript-Page route family AB1's brief names). Left untouched this ticket; a later AB slice folds it into DeskFrame once the finish-moment's place in the new grammar is designed. Recorded here so the gate is honest about the fourth writing-adjacent composition that exists. |
| 6 | `pages/JournalEntry.tsx` | `/journal/:id` | Its own tab row, spread console, ink layer, star/metadata below the sheet | **absorb — deferred past AB1** | A separate world with its own ink-authoring substrate (editor-core, out of AB1's non-goals). Only its CAPTURE vocabulary (Spark deck / Fragments / Send → Drawer stub items, today ModeStage's left rail in `journal` mode) is pulled forward into DeskFrame's corkboard Journal tab per S2 — the JournalEntry *surface itself* is not touched or absorbed this ticket. |
| 7 | `pages/Spread.tsx` | `/journal/spread` | Multi-page browse console | **not a writing surface** | Browse-only (page-turning through existing entries); no authoring happens here. Untouched. |
| 8 | `pages/StructureBoard.tsx`, `pages/StructureWizard.tsx`, `pages/BeatWizard.tsx` | `/project/:id/board`, `/wizard`, `/beat` | Planning/notecard chrome | **not a writing surface** | Trellis-side planning, not prose/script authoring. Untouched. |
| 9 | `components/ModeSwitcher.tsx` | used by #1 and #5 | the current 3-tab (Free write/Draft/Format) + trailing action-tab strip | **delete (superseded, inside the frame only)** | Replaced by `components/ModeStrip.tsx` (the 5 ratified strings) wherever DeskFrame is active. `ModeSwitcher` itself is **not deleted from the codebase** — QuickSprint (#5, deferred) keeps using it unchanged, so removing the file would break that surface. |
| 10 | `components/WritingIncentives.tsx` (progress bar, typewriter toggle, celebration, milestone bar, ambient glow) | mounted by ModeStage's incentive row + `JournalEntry.tsx` | — | **absorb — parked, not deleted** | Per S2's ruling, none of this mounts inside DeskFrame's stage; the meter track stays empty/reserved for its return. The components stay in the codebase and stay mounted exactly as before on JournalEntry and on any `<1100px` / QuickSprint surface. Harness checks that assert its presence are audited in S6 (`ab1.mjs` header) — see the ship report for the actual disposition (none needed moving, given the viewport gate below). |
| 11 | `components/DeskRail.tsx` | global (`App.tsx`, every route) | the wayfinding rail (Journal/Shelf/Drawers/Library + way-back chip) | **keep, unchanged** | Already satisfies AB1's "wayfinding rail" track structurally: `position:fixed`, 64px wide, with `.app-main{padding-left:64px}` reserving its gutter globally. DeskFrame's own grid owns the other four tracks (tool-rail / stage / corkboard / meter) and is documented as sitting *beside* this pre-existing reserved column, not duplicating it. |
| 12 | `App.tsx`'s `GlobalHeader` (Fullscreen toggle, Sync indicator, Sign out) | global, every route | three independent top-right controls | **keep, restructured** | S4's "top-bar orphans collapse to one corner glyph + gear": `GlobalHeader` now collapses these three into one glyph + popover specifically while a DeskFrame is mounted (a small shared signal, `store/deskFrameActive.ts`), and renders exactly as it does today on every other route (Desk, Journal, Shelf, Drawers, Board, Script <1100px, QuickSprint) — zero behavior change there. |

## The ≥1100px gate (why so few things needed "parking")

S1 pins DeskFrame to "one component owning the viewport at **≥1100px**," and
the non-goals pin "mobile (<1100px) keeps current behavior." This build
takes that literally: every writing surface above branches on a live
`window.innerWidth >= 1100` signal (`useDeskFrameViewport()`), and the
`<1100px` branch is the **exact existing JSX**, untouched. The existing
harness suite (`w1`, `m1`, `s1`, `th1`, `th2`, `j4`, `j5`, `w2`) never sets a
viewport ≥1100px (checked directly against every `emulateDpr(...)` call in
`apps/desktop/scripts/harness/`, and headless Chromium's un-emulated default
window is well under 1100px), so none of the flourish-presence checks in
`w1.mjs`/`m1.mjs` actually observe DeskFrame's new, quieter frame — they
keep exercising the legacy branch and stay green with zero changes. This is
recorded plainly so a reviewer can independently re-verify it; see
`ab1.mjs`'s header comment for the resulting (near-empty) PARKED-section
disposition.
