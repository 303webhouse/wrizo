# Wrizo — Architecture Decisions: Modes, Drawers, Customization

Captured from the design session. Basis for (a) the build-plan update CC should log, and (b) the upcoming **main writing interface** brief.

---

## The four writing modes

One writing surface, mode-parameterized (compose-don't-rebuild). The modes are the life-stages of a piece:

| Mode | Stage | Mechanics | Status |
|---|---|---|---|
| **Journal** | generate (divergence) | forward-only runway + stylus overlay; external paste blocked | **core — build now** |
| **Drafting** | revise (convergence) | free editing; internal paste (same project) allowed; external paste blocked; **guarded AI allowed** (momentum/mechanics, never prose-generation) | **core — build now** |
| **Formatting** | polish to convention | screenplay / APA / AP-style / bibliography conventions; **AI assistance permitted (mechanics only)** | **deferred — log in build plan** |
| **Workshop** | share | social / P2P / future social app | **deferred — log in build plan** |

**AI boundary (thesis):** The line is **function-based, not location-based.** One hard rule — **no AI in Journal mode, ever** (the pure divergence space; momentum is most fragile there). Everywhere else (Drafting, Formatting, Workshop) AI is allowed, governed by a **principle, not a fixed ruleset**: AI may **serve the writer's momentum and creative agency, but never do the creative writing for them.** It never ghostwrites prose. It MAY handle momentum-protecting and mechanical work — e.g. generating candidate names, or answering a worldbuilding/research query inline so the writer doesn't leave the page and lose the session to a rabbit hole. The test: *does it keep the human writing and in control, or does it do the creative work for them?*

## Mode-switcher UI

- A **nearly-invisible mode icon** while writing (chrome-fade consistent). Click → the four modes appear as **text tabs across the top of the writing page**, current mode highlighted in **theme orange**.
- Each mode has a **unique left-side menu** (mode-specific tools), revealed only on **hover** or after **5 min idle** — hidden while writing.
- **Mobile:** an icon toggles the side menu open.
- **Menu contents: TBD** — defined per mode at the build phase (Nick + chat to nail before the brief).

## Drawers — information architecture (3 levels)

`User → Drawers → Binders/Folders → Pages`

- **Drawer** = top-level category (e.g. "Creative Writing", "Journal Sketches"). Multiple per user — a desk has multiple drawers.
- **Binder/Folder** = a collection within a drawer. Multiple per drawer.
- **Page** = a document within a binder — any kind, up to a full rough draft of a book. Multiple per binder.
- **"+ New Drawer"** (top of the Drawers list) creates a top-level drawer.
- Drawer expansion: list pages/binders (10 + "more" toggles another 10), sorted **most-recently-opened, then by name**.
- The home **recent-items list is removed** — but ONLY once the Drawers list replaces it (don't remove before → navigation regression).
- New **Drawers landing page** (full browsing), reachable from the "Open a Drawer" home button AND the top-bar nav.
- OPEN for the Drawers build: is "Binder" == a "Project-with-plot-structure," or distinct?

## Desk home screen

- **Headline:** user's **first name in serif (Crimson Pro)**, top-left, above a **"Writing Desk"** graphic — Figtree text placeholder now → hand-drawn graphic later. At the customization milestone, both the serif name and the placeholder are replaced by the user's own graphic.
- **Subheading:** "Scribble, draft, plot, revise, or share (coming soon)".
- **Primary:** Keep writing (resume logic per the cleanup brief).
- **Secondary:** Open a Drawer · Journal · Workshop (greyed).
- Recent-items list gone (replaced by Drawers).

## Top menu bar

- **Icons (right):** Settings gear (= **Customize**, relocated here from a Desk button), **Full Screen** (now an icon, not text), the auto-saved indicator.
- **Text nav:** mirrors the home-screen buttons — Open a Drawer (→ Drawers landing page), Journal, Workshop (greyed) — linking to the same destinations.

## Signup / onboarding

- **At signup:** email + password + **name** (name is new — needed for the headline).
- **Post-signup, gentle prompt** ("Help us organize your desk" or similar): the **"What do you write?"** multi-select — Fiction / Poetry / Essays / Articles / Screenplays / Business Docs (any number). Deferred out of signup to avoid friction right after the gate's momentum.

## Customization principle — build seams now, features later

The user can eventually unlock customization of **every** window / page / module / menu — resize the writing page to any proportion (others auto-adjust), move elements freely. **All milestone-gated, buried in settings.**
- **Now (cheap, do while building):** every surface = discrete, well-bounded components; layout driven by config/tokens, not hardcoded dimensions, where easy.
- **Later (the feature):** the drag/resize/rearrange controls + milestone unlock. NOT built now (core-first).
- One of a **family** of milestone-gated customizations (handwriting headings, layout, color themes) — apply seam-now/feature-later to each.

## Build-plan additions (defer, but log now)

- Formatting mode (conventions + AI mechanics).
- Workshop mode (social/sharing).
- Customizable layout (resize/move/rearrange), milestone-gated.
- Drawers landing page; the 3-level Drawer/Binder/Page model.
- (Already tracked: handwriting-heading customization; color themes; passwordless auth.)

## Sequencing (confirmed)

1. **Cleanup** (bugs + name/headline + resume) — in flight.
2. **Main writing interface** — mode-aware editor (Journal + Drafting live; Formatting + Workshop greyed), the hidden-icon → orange-tab switcher, the hover/5-min-idle side-menu reveal (+ mobile toggle). Menu contents TBD.
3. **Drawers** — the 3-level IA + the home/top-bar restructure.
