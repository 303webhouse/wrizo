# Writing-screen redesign — Version B + dissolve-to-bare (CC brief)

**Branch:** `writing-screen-redesign` off `m1-creative-flow`.
**Order:** assumes D1 (Drawers) shipped and D2 (Pages/Shelf) is shipping. This relocates the desk-area nav (Journal / Shelf / Drawers / Library) from the top bar to a left rail — superseding D1's and D2's top-bar nav placement. Grey any area or mode not yet live (as Formatting/Workshop already are).

## Why
The mode-aware editor works, but its chrome model predates the three-levels split and the desk-area IA. This redesign makes the screen express the model we settled — desk-area locations in a left rail, page postures on the file, the binder's Plan as a sibling view, Workshop/Publish as actions — and resolves the chrome into a clean two-layer recede so the page is bare while you write without losing the incentive mechanics.

## The model — two layers
- **Navigation layer (recedes on write):** the left desk-area rail, the file's mode tabs, the Pages/Plan toggle, the Workshop/Publish actions, the breadcrumb. At rest these are present (Version B); a keystroke dissolves them to a bare page; deliberate summon (edge / Esc / tap-off) brings them back fast. This is the EXISTING `useChromeDissolve` engine — the work is applying the dissolve to the NEW chrome elements.
- **Incentive layer (persists while writing):** the ambient glow (word-count-tied), the progress bar (Words/Time/Off), the optional timer (when on), the caret, the page. These NEVER carry the dissolve class — the engine already exempts the glow, progress bar, editor, and caret, so "keep them while writing" is its existing behavior; the timer joins this layer.

## Scope — build this

### Slice 1 — Modes renamed; Workshop/Publish become actions
- `ModeSwitcher`: the page postures are **Free write** (live; forward-only, the idea-generation default) · **Draft** (live; free edit) · **Format** (greyed/coming — not built). Remove **Workshop** from the switcher.
- Workshop + Publish become **action buttons** on the file (top-right): Workshop (greyed/coming) and **Publish -> a context dialog** — stub for now (wire the button + a placeholder dialog whose options will later be tailored to the Binder/Page type, destination, and format; real export logic deferred).
- AI frame: the existing "sealed in Journal / open elsewhere" behavior re-maps with the rename — **AI sealed in Free write** (the forward-only generative posture stays AI-free), open in Draft/Format. Frames only; no AI wired.

### Slice 2 — Left desk-area rail (Version B)
- A slim left rail of the desk-area LOCATIONS: **Journal · Shelf · Drawers · Library** (icons + labels), replacing D1's top-bar "Open a Drawer" nav. The `/drawers` and `/shelf` routes stay. Library is a stubbed area for later (greyed or a placeholder route); Shelf lights up with D2.
- The rail is global nav and a **WritingSession reader** — it carries the dissolve class so it recedes while writing, exactly as the global header does today.

### Slice 3 — Recede on the new chrome + the reworked timer
- Apply the dissolve class to the navigation-layer elements (rail, mode tabs, Pages/Plan toggle, actions, breadcrumb). Reuse `useChromeDissolve` UNCHANGED — same timings (1.2s recede, 3-min wait, 2-min slow return, 0.4s summon) and summon signals (56px edge / Esc / tap-off-editor). Confirm the glow, progress bar, timer, caret, and page stay exempt, so while writing only the incentive layer remains (the bare page).
- **Timer rework — kill the big sprint-timer box.** The timer becomes **opt-in** (off by default) and, when on, a single slim readout in the incentive layer, beside or merged with the progress bar (its "Time" metric IS the session clock — one element, not two), **persisting while writing** (it's incentive, not chrome). **Free write and Draft only**; absent in Format/Plan. Move the old finish/beat affordances out of the timer's footprint — a quiet action, not a box.
- Settings gear: update to the new chrome — recede depth for the rail/chrome (replacing "top-bar dissolve/dim"), timer on/off; keep the progress metric and typewriter toggle.

### Slice 4 — Binder surface toggle + the file's place
- A **Pages <-> Plan** toggle on the file (binder-level): Pages = the binder's page list (D2); **Plan -> the existing StructureBoard** for that binder. Side-by-side / notecard Plan is deferred — this is the toggle + route only.
- Breadcrumb: Drawer / Binder / Page, quiet, in the navigation layer.

## Non-goals — explicitly deferred, do NOT build
- **Plan side-by-side / dual-window / movable notecards** — Slice 4 is the toggle + the existing board only. The pane-beside-page (reusing the dissolve engine on a second pane) and free-positioned notecards are later.
- **Publish's real export logic** — button + stub dialog now; tailored format/destination options later.
- **Format mode** — stays greyed; not implemented here.
- **Full mode-aware editing of arbitrary pages** (opening any Page into Free write / Draft) — that's the page-editor wiring on top of D2; this brief is the chrome/hierarchy.
- **AI wiring** — frames only; the seal/open mapping is visual.
- Drag-and-drop anything.

## Invariants / guardrails
- Reuse `useChromeDissolve` as-is — do NOT change its timings or summon logic. The only change is WHICH elements carry the dissolve class (the new navigation layer), plus confirming the incentive layer stays exempt.
- The incentive layer (glow, progress bar, optional timer, caret, page) never dissolves.
- Grey, don't hide, not-yet-live areas/modes (Library, Shelf-until-D2, Format, Workshop) — consistent with the current greyed pattern.
- No new deps; minimal changes; no refactors outside scope (AGENTS.md hard rules).

## Definition of Done
- `tsc` + `pnpm build:web` clean.
- At rest: Version B — left rail (Journal/Shelf/Drawers/Library), file with Free write / Draft / Format tabs + Pages/Plan toggle + Workshop/Publish actions + breadcrumb.
- On keystroke: the navigation layer dissolves to a bare page; the glow, progress bar, and (if on) the timer remain. Edge / Esc / tap-off resurfaces fast.
- Free write is forward-only by default; Draft free-edits; Format greyed; Workshop greyed; Publish opens the stub dialog.
- Timer: off by default; when on, a slim readout merged with the progress bar, only in Free write / Draft, persisting while writing.
- Pages/Plan toggle: Plan opens the binder's StructureBoard.
- Settings reflect the new chrome.
- Harness selftest green; CDP check that a keystroke dissolves the rail + tabs while the progress bar and glow remain, and Esc resurfaces.
- `pnpm install` + typechecks + web build + harness before done.
