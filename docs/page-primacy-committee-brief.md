# Page is primary — Drawers/Shelf as overlay, not navigation (committee brief for Fable)

**For:** Fable. Convene **the Experts** (Deleuzean philosopher, cognitive scientist, writing-craft
pedagogue, motivation psychologist, professional editor, discovery writer, structural writer) and
**the Architects** (frontend/app architect, systems engineer, interaction designer, visual/graphic
designer) per `AGENTS.md`'s roster, **at max thinking effort**, double-pass protocol (propose →
critique and trim → single recommendation). This is a non-trivial IA/architecture decision, not
routine work — convene in full, don't skip.

**Requested by:** Nick, 2026-07-11, alongside a batch of writing-surface fixes CC (Claude Code)
shipped directly this session (see "What CC already fixed" below — read that before designing,
so the committee isn't re-solving what's done).

**Deliverable:** a ratified canon decision (in the shape of `docs/fragments-under-pages-canon.md`
— a committee ruling, not a build brief) **plus** a CC-ready build brief in the existing format
(`docs/*-brief.md`: Why / Scope / Non-goals / Invariants / Definition of Done) so CC can implement
in one ticket without re-deriving the design.

---

## The principle, in Nick's words

> "The main page surface, whether a Journal page or other, should never move when the user is
> opening new tabs or sidemenus or interacting with the AI right-hand assist popout, etc. The PAGE
> IS PRIMARY. It never moves because that's where the writer's focus needs to be — everything else
> revolves around the page (this should be a rule for the project moving forward)."

This is being proposed as a **new hard rule**, alongside `AGENTS.md`'s existing "Keep changes
minimal," "No new deps," etc. The committee's job includes deciding its precise scope (see
Question 5) before it's written into canon.

## Why this needs a committee, not just a ticket

It's a real fork with philosophical and craft weight, not just a CSS fix:
- The Deleuzean angle: is Drawers/Shelf/Library **filing** (a low-stakes territorialization
  gesture — per the F-arc canon, "the Shelf already exists for exactly this") which argues for a
  quiet overlay that never interrupts capture — or is browsing a Drawer genuinely **divergence**,
  a deliberate context switch to a different document, which argues navigation is honest and an
  overlay would be a false promise of "you never left"?
- The cognitive-scientist angle: task-switching cost. An ADHD writer who taps "Shelf" to file a
  page and loses their open page (has to re-find it, re-orient) pays exactly the re-initiation tax
  the whole F-arc was built to eliminate (see `docs/state-of-wrizo-2026-07.md` Finding 2/3).
- The systems/frontend angle: this is a bigger lift than the CSS-only fixes CC made this session —
  it likely means Drawers/Shelf mount as a panel that can appear ALONGSIDE any surface (Journal,
  Page, ProjectHome, StructureBoard), not just as a route. That's a real component/routing
  redesign, worth an Architects pass on state ownership, not a quick patch.

## What CC already fixed this session (context, don't re-solve)

Verified in code, tested via the app's own CDP harness (`scripts/runtime-verify.mjs`) and the
`j4`/`j5`/`s1` regression suites — all green:

- **The one bug this session found that's IN SCOPE for "page is primary":** `ModeStage.tsx`'s
  three-column layout (`left rail | page | right rail`) used to be a centered flexbox, so
  collapsing/expanding the AI assist right rail (or the sealed↔open transition when switching
  Journal→Draft) **re-centered the whole row, shifting the page itself horizontally**. Fixed by
  switching `.mode-row` to a CSS grid with fixed-width side tracks
  (`grid-template-columns: 222px minmax(0,...) 222px`) so the page column's position is
  independent of rail content width — a rail narrower than its track just hugs the page instead of
  the whole row re-centering. This is a **contained, already-shipped fix** — mention it to the
  committee as prior art / the correct low-level pattern (fixed-track layout, not flex-centering),
  not something to redesign.
- **The AI assist right rail is already the correct HIGH-LEVEL pattern** to generalize:
  collapsible, persisted (`localStorage`), lives beside the page in the same mounted tree, never
  unmounts the editor. `ModeStage.tsx`'s `assistCollapsed`/`collapseAssist` is the reference
  implementation.
- Journal metadata (star, tags, copy/port/add-to buttons, routing, autosave note) — previously
  scattered above AND around the writing surface — now renders **below** the surface in
  `JournalEntry.tsx`, with only wayfinding (back link, notebook pager) and the document-type tabs
  (Free write/Draft/Format/Workshop/Publish) staying above it. This was the fast, safe interim
  answer to Nick's "no metadata above the surface" ask. **Whether it should instead move into a
  left panel (Nick's other suggestion) is Question 3 below** — don't assume "below the page" is
  final; it's a placeholder the committee should explicitly bless or override.

## What's NOT fixed — the actual ask for this committee

**Drawers, Shelf, and Library are still full route navigations**, not overlays:
- `DeskRail.tsx` — a fixed left icon rail (`/journal`, `/shelf`, `/drawers`, `/library`) — is
  itself fine (doesn't shift content: `.app-main{padding-left:64px}` reserves static space,
  confirmed in code).
- But clicking any of those links does a **React Router navigation** to `Drawers.tsx` / `Shelf.tsx`
  — ordinary full-page list views mounted in `.app-main`. If a writer is mid-page and taps
  "Drawers" to file the current page, the page **unmounts entirely** and is replaced by the
  Drawers tree. This is the literal violation of "the page never moves" — it doesn't move, it
  *disappears*.

## Questions for the committee

1. **Overlay or navigation?** Should Drawers/Shelf/Library become a slide-out panel anchored to
   the left rail — appearing beside/over the current page without unmounting it, mirroring the AI
   assist rail's pattern — for the *browsing/filing* action itself? Or is opening a Drawer
   genuinely "go to a different document," where navigation is honest and page-primacy should only
   bind *ancillary tools* (menus, AI, settings), not primary IA destinations? The Deleuzean/
   cognitive-scientist pair should lead this call; the pantser's and plotter's voices (per
   `AGENTS.md`) are relevant too — a plotter reorganizing a Drawer mid-thought vs. a pantser who
   just wants to stash a scrap and keep writing may want different things.
2. **If overlay: what's the interaction model?** Does the panel slide from the left rail and push
   the page over (like the assist rail can), or float above it? Does *selecting* a Binder/Drawer
   row inside the panel navigate away (since that IS "open a different document," legitimately),
   or does the panel support an inline preview/rename/move without ever leaving the current page?
   Where's the line between "browse" (stay) and "open" (go)?
3. **Does Journal metadata belong in this same left-panel system?** It's currently below the page
   (CC's interim fix) — Nick's original ask floated a left sidebar as an alternative he wasn't
   sure about ("which may require a new build — I'm not sure"). Should star/tags/routing/copy
   actions eventually live in the same panel system as Drawers/Shelf (one consistent "everything
   about this document and where it lives" panel), or is "below the page" the right permanent
   home for document-local metadata, with the left panel reserved for cross-document browsing?
4. **Does this reach ProjectHome / StructureBoard?** The Pages⟷Plan toggle on a Page currently
   navigates to `/project/:id/board` — is that exempt (legitimately "go to a different view of the
   binder"), or should Plan also become an overlay/pane-beside-page per the deferred idea already
   logged in `docs/writing-screen-redesign-brief.md`'s non-goals ("Plan side-by-side... reusing the
   dissolve engine on a second pane... is later")? If Fable judges that idea is now ready to pull
   forward, say so explicitly; if not, log it back to backlog with a reason.
5. **Ratify the rule's precise scope.** Write the actual `AGENTS.md` hard-rule language: which UI
   categories are "chrome/tools" (must never move or unmount the page — AI assist, settings gear,
   format bar, any future menu) vs. "navigation" (may legitimately replace the page — opening a
   different document, a different binder). Vague enough to be a real principle, precise enough
   that a future CC ticket can self-check against it without asking Fable each time.

## Invariants / guardrails for whatever the committee lands on

- No new deps; minimal changes; reuse the AI assist rail's collapse/persist pattern
  (`localStorage`-backed boolean, same key convention as `ASSIST_COLLAPSED_KEY`) rather than
  inventing a new state mechanism.
- Must not break `useChromeDissolve` (the dissolve/glow/progress engine) — any new panel is
  chrome, so it should carry the dissolve treatment like the existing rails, not be exempt.
- Zero/minimal schema — this is a client-side layout question; don't reach for new persisted
  fields unless a genuine new capability (e.g., "pinned open") demands one.
- Grey/stub Library exactly as it is today if it's not being built out further here.

## Definition of done (for the eventual CC ticket, once ratified)

- Opening Drawers/Shelf (in whatever form the committee ratifies) never unmounts the current
  writing surface if the ruling is "overlay"; if the ruling is "navigation is correct here," the
  brief should say so explicitly with the committee's reasoning, not leave it ambiguous.
  Left-rail links doing today.
- The `AGENTS.md` hard-rule addition is drafted, precise, and ready to merge alongside the ticket.
- Harness scenario (CDP) proving the page's bounding rect / mount identity is unchanged across a
  Drawers/Shelf open+close cycle, per `AGENTS.md`'s "harness scenarios persist" rule.
