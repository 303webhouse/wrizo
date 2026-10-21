# Typewriter scoping — plan (no code yet)

**STATUS: PLAN ONLY.** No product code touched. Written against `origin/main` at `13db00cc`
(help-buttons shipped), read-only — no harness run, per Chat 1 holding the box.

**Ordered by:** Fable, relaying Nick's routing of page-readiness item #3 (`docs/reviews/page-readiness-survey.md`).

## The architecture as it stands today (verified, not assumed)

`store/writingSettings.ts` keeps **one shared, live, persisted boolean** (`current.typewriter`,
L40/99) that every consumer subscribes to via `useWritingSettings()`/`getWritingSettings()`. Two
different scoping ideas are layered on top of that one field, and neither is visible to the
other:

- **Draft and Screenplay already have per-PAGE memory.** `enterPageTypewriter(id, empty)`
  (`writingSettings.ts:195-200`) reads `wrizo-typewriter-page-<id>` (`pageKey`, L168-178) —
  a saved value for this exact page, else the theme's default for an empty page, else OFF — and
  **mirrors that into the one shared `current.typewriter`**. `holdTypewriterPage(id)`
  (L183-186) separately records which page is "live" right now (`heldPageId`), so the next
  explicit toggle (`setTypewriterExplicit`, L189-192) writes back to *that* page's own key. Both
  `PageEditor.tsx` (L487-496) and `ScriptEditor.tsx` (L529-535) call this once per mount, and both
  components remount fresh per page — `<PageEditorView key={id} .../>` / `<ScriptEditor
  key={id} .../>` (`PageEditor.tsx:1712/1725/1777/1784`), confirmed by reading the route/render
  call sites directly, not assumed. So Draft→Draft navigation between two *different* pages does
  correctly re-seed the mirror from each page's own memory on every open.
- **Free Write has no per-page memory at all, by standing ruling.** The comment at
  `writingSettings.ts:165` is explicit: "FREE WRITE IS UNCHANGED: it never calls this and a
  toggle there writes no page value." Free Write's own toggle calls `setTypewriterExplicit`
  with `heldPageId` null, writing **only** the shared mirror.

**The gap this leaves:** the shared mirror is the *only* thing any reader can see, and nothing
marks whose write is currently valid. `ModeStage.tsx:188`
(`settings.typewriter`), `Sliver.tsx:630` (`useWritingSettings().typewriter`), and the Ctrl+B
gate itself, `PageEditor.tsx:1143-1146`'s `applyRailFormat` (`if (getWritingSettings().typewriter)
return;`), all read the same ambient value with no idea which surface or which page last wrote
it. Reading the mount/remount logic closed off the theory that this is a stale-component-instance
bug (it isn't — `key={id}` already guarantees a fresh read per Draft/Screenplay page); what's left
is that **Free Write's own unscoped write, and any secondary render path that reads
`settings.typewriter` without going through `holdTypewriterPage`, can leave the mirror holding a
value that doesn't belong to the page currently asking Ctrl+B's gate about it.** Pinning the
*exact* live sequence precisely needs the box (next step, not this one); the plan below removes
the class of bug regardless of which sequence triggers it, by making "whose write is this"
unaskable — there is no longer a shared answer to misread.

## The plan

**1. Which surface owns the setting.**
Nobody "owns" the live mirror today — it's last-writer-wins across three independent sites
(Free Write's toggle, Draft's per-page seed, Screenplay's per-page seed). The fix removes the
shared mirror as a *cross-surface* source of truth entirely. Each surface type keeps (or gains)
its own storage, and a reader asks for **its own current page's** value — never an ambient
global that could have been written by somebody else's page.

**2. The scoping rule.**
- **Draft and Screenplay: per-page** (unchanged — this part is already correct and is reused
  verbatim: `pageKey(id)`, `readPageTypewriter(id)`, the empty/saved/theme-default resolution
  order in `enterPageTypewriter`).
- **Free Write: per-device** (unchanged — Nick's own standing ruling, quoted above, is that Free
  Write deliberately has no per-page memory; this plan does not re-open that ruling).
- The difference from today: Draft/Screenplay's per-page value stops being *mirrored* into the
  same field Free Write's device-wide value lives in. They become two genuinely separate reads,
  the way `item171-typewriter-scope` (below) already modeled for the surface-type split, extended
  here to the page-grain main's Phase 1 (S5) already built.

**3. How Draft's Ctrl+B gate stops reading another surface's write.**
Replace every reader's `settings.typewriter` / `getWritingSettings().typewriter` with a lookup
scoped to *the page actually asking*:
- A new accessor, e.g. `typewriterForPage(id, empty): boolean` — the same resolution
  `enterPageTypewriter` already does (`readPageTypewriter(id) ?? (empty ?
  THEME_CONFIG[getTheme()].typewriterDefault : false)`), but as a **pure read**, callable from
  anywhere that already knows the page id, instead of only being knowable via the shared mirror
  `enterPageTypewriter` happens to have last written.
- `PageEditor.tsx`'s `applyRailFormat` (L1143-1146), `ModeStage.tsx:188`, and `Sliver.tsx:630`
  each already have the page's `id` in scope (it's a prop/closure they already carry) — they
  switch to this accessor instead of the ambient global. None of them can be answered by a
  *different* page's write anymore, because none of them ask an ambient question.
- Free Write keeps reading the shared `typewriter` field exactly as today (it has no id-scoped
  concept, by ruling) — this plan does not touch Free Write's own read/write path, only stops
  Draft/Screenplay from sharing a field with it.
- `setTypewriterExplicit`'s `heldPageId` mechanism (`writingSettings.ts:182-192`) stays for the
  *write* side (the toggle still needs to know which page it's currently toggling) — only the
  *read* side changes, from "ask the mirror" to "ask this page's own storage."

**4. What this reuses from `item171-typewriter-scope`.**
That branch (last commit `980360c3`, 2026-09-22) already modeled exactly this shape — a named
pure accessor pair instead of one shared field read directly everywhere:
`typewriterValueFor(isDraft: boolean)` / `setTypewriterFor(isDraft: boolean, on: boolean)`
(`writingSettings.ts:208-214` on that branch), plus a `typewriterAvailable` prop so a surface like
Screenplay/Board can truthfully report "not available" instead of silently inheriting a toggle
that lies about what it controls. **It predates main's current per-page architecture** (Phase 1
S5 landed `5bbe6f47`, 2026-10-13, three weeks after item171's last commit) and splits only by
*surface type* (`isDraft`), not by *page* — so it is not a drop-in; `git merge-base
--is-ancestor item171-typewriter-scope main` confirms it was never merged. What's reused is the
**shape**, not the code: a named accessor pair instead of a bare shared field, and the
`typewriterAvailable` idea for Screenplay (which still doesn't run the fade engine at all —
`ScriptEditor.tsx:500-505` — so its own toggle should keep saying so truthfully, same concern
item171 raised, still open on main).

## What this plan does NOT decide
- The exact live sequence that currently leaves Ctrl+B blocked (needs the box to confirm against
  a real session trace, not source reading).
- Whether Screenplay's typewriter toggle should become genuinely functional (wire the fade
  engine) or stay honestly disabled — that's item 183's own open question on main too
  (`ScriptEditor.tsx:500-505`'s own comment), out of scope for this scoping fix.
- Any schema/server change — none is proposed; this stays localStorage-only, the same footprint
  Phase 1 (S5) already chose.

## Next step
On Fable's ruling: a FIX-owned branch implementing the accessor split above, confirmed against a
live repro once Chat 1 releases the box (to nail the exact trigger sequence before calling the
fix proven, per this project's own "test the premise, not the shape" standing lesson).
