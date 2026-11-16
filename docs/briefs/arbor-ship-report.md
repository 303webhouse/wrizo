# Arbor redesign: ship report (gate 2)

**ARBOR · Nov 16, 2026.** For Fable, Chat 1 and the Wrizors. The tree is `arbor/ship-merged` @ `945c0b13`: the ship candidate `1d155ee2` merged onto main `6d04dfad`, with no conflicts. Nothing is merged into main.

## 1. What a writer sees in Arbor by default after this ship

**As merged: nothing new.** The redesign is on only with `?arbor2=1` in the URL. `src/arbor2/flag.ts` stores no flag and adds no localStorage key. Without that URL parameter, Arbor (`data-theme='plateau'`) draws as it does today. Every Arbor test on the box and on Actions ran with the flag on.

**Waiting on Fable (decision before the train):**
- **(a) Turn the redesign on by default for Arbor.** For example, `isArbor2()` true on plateau unless `?arbor2=0`. Every harness file that runs Arbor unflagged would then test the redesign, so this needs its own pair and its own box turn.
- **(b) Ship it behind the flag.** It goes live dark, and writers see no change.
- I lean (a) ("Ship it"), but it is a product change that no gate has measured yet.

## 2. What the redesign shows (with `?arbor2=1`)

- **The room:** by day or night, set by the clock. By day, the pergola's shade crosses the room, the page and the menus; the leaves stop at the first key and the shade fades out over about 6 s as the vines come in. On a pause the vines go and the shade returns over about 3 s.
- **The room's details:** the sun's leaves, the espresso menu bars in both rooms, the splash and logo, and the dark page (paper `#1A1510`, ink `#EFE4CB`).
- **The caret:** the browser's own caret. It is ink `#241A10` on the light page and on the board card's sheet in both page tones, and brass on the dark page.
- **Typewriter:** in its zoom, the Tools and Tutor opener handles are hidden (`13-desk-frame.css` §12b); Ctrl+/ still opens Tools.

## 3. The switches that remain

| Switch | What it does | Who sees it |
|---|---|---|
| `?arbor2=1` | the whole redesign | anyone with the URL |
| `&arbor2room=day\|night` | holds the room whatever the clock says; never stored | test-only (harness) |
| `&arbor2caret=off` | **inert** since the drawn caret was scrapped | nothing reads it |
| **The "Arbor mockup" bar** (on screen, under the flag) | Logo (Sage / Brass o); **Mood** switches: Day shadows, Afternoon lengthening, Leaf flutter, Rhizome variation, Drawer pull motion, Coloured tabs, Dim room with drawer open ("Lamp as progress" is retired); a Room row (By the clock / Day / Night); Night browns. State lasts for the session only. | **every flagged writer** |

**Waiting on Fable:** the mockup bar is a design-review tool. For the ship I propose it is removed, or hidden behind its own test-only switch, with the Mood switches fixed at their ruled defaults.

## 4. What is removed

- **The drawn caret:** `src/arbor2/edgedCaret.tsx` and its CSS (Nick, Nov 14, 8:15 pm). Its checks are parked verbatim with successors (`frames/arbor2-r22.mjs`), and `arbor2-caret-latency.mjs` is retired, kept verbatim below an early exit.
- **Old capture scripts:** none are left in `harness/`. Main had moved `arrival-signin-capture`, `flux-screens`, `splash-sweep-capture`, `theme-leftovers-capture` and `tutor-drawer-probe` to `scripts/captures/`, and that move applied in the merge.

## 5. The product diff against main, by file

56 files: 38 added and 20 modified, all under `apps/desktop/src`.
- **Added:** `src/arbor2/*` (the redesign's own modules: room, pergola, sun, vines, paper, front layer, logo, flag, mount and others), `styles/arbor-v2.css`, and the pergola SVG.
- **Modified:** `App.tsx`, `main.tsx`, `ModeStage.tsx` (bug #80: `--fade-dur` written on `#root` and the bar, not on `<html>`, under the flag), `Arrival.tsx`, `ConnectionsDrawerPanel.tsx`, `RhizomeField.tsx`, `SideDrawer.tsx`, `Sliver.tsx`, `Splash.tsx`, `SplashMark.tsx`, `ThemePicker.tsx`, `Tutor.tsx`, `TypeControl.tsx`, `WrizoMark.tsx`, `board/useBoardBox.ts`, `store/persistence/entries.ts` and `journal.ts`, `styles/06-flux-v2.css` (Arbor-scoped menu and room tokens), and `styles/13-desk-frame.css` (§12b).

## 6. The gates

| # | Gate | Where it stands |
|---|---|---|
| 1 | Merge onto main | **done:** `945c0b13`, no conflicts |
| 2 | This report | open; **two questions for Fable** (§1, §3) |
| 3 | Actions pair; browserless | **done:** pair `43731468749` 295/297 each leg (only `flux-v2-part2` and `polish10-14-frames`, both no-verdict as on main); `browserless.yml` green (`43781076155`) |
| 4 | Box, merged tip vs main | **FAIL**, then attributed. The same turn has the native-caret build at **PASS 12/12** and the merged tip at **FAIL 1/12** (2 steady keys over 40). Control keys over 40: merged 19, native 10, main 0. Main's #101 empty-ink-canvas layer is under A/B on Actions. |
| 5 | Nov 9–10 checks | next, on Actions from the merged tip |
| 6 | #87 driver; Arrival retires | open; see the question to Fable on FIX |
| 7 | Wrizors' frames | next, from the merged tip |
