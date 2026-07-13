# Page is primary — the committee ruling · 2026-07-12

**Status: RULED — 2026-07-12, on Nick's delegated word via Fable** ("I'll
defer to you on the other options for now, but I want to prioritize
progress over perfection... as long as the architecture isn't fundamentally
broken." — see `docs/w1-close-handoff.md`).
**Answers:** `docs/page-primacy-committee-brief.md`. Convened per `AGENTS.md`:
the Experts + the Architects, double-pass (propose → critique/trim → single
recommendation). Marketing ran a light opposition check (reach vs. principle).
**Place at:** `docs/page-primacy-canon.md`.

## The ruling, in one paragraph

The rule is ratified with a scope split the brief's Question 1 was circling:
**tools orbit; navigation departs.** Anything that is *about* the current page
or *assists* the current session (AI rail, settings, sheets, format tools,
metadata, toasts) must never move, resize, or unmount the writing surface.
Anything that *opens different work* (a Drawer's contents, the Shelf, the
Library, another document, the Plan) is honest departure — and every honest
departure must offer a **stateful, one-tap way back**. We do **not** build
Drawers/Shelf as overlays. We build the way back. Filing-without-leaving
already shipped (J5's "Add to…" + "Port to…" on the page itself); the missing
half is return-fidelity, which is W2 (`docs/w2-way-back-brief.md`).

## Question 1 — overlay or navigation? → Navigation, with a guaranteed return

**Pass 1 (propose).** The Deleuzean framing settled the fork: *filing from the
page* is a convergence micro-act performed on the plane of composition — it
must cost nothing, and post-J5 it costs nothing (the Add to… sheet drills
Root → Drawer → Binder over the live page; the page never unmounts). *Browsing
a Drawer* is a different intentional object — attention has already left the
page before the finger moves. An overlay that renders the Drawers tree beside
the sheet promises "you never left" while your attention demonstrably did:
a false presence. The cognitive-scientist read agrees from the other side —
the re-initiation tax the F-arc exists to kill has two treatments: never
destroy the origin (right for sub-30-second filing acts, already shipped) or
make return instant and stateful (right for open-ended browsing). The pantser
added the sharpest opposition to overlay-Drawers: a full browse tree summonable
mid-draft is a **procrastination surface** — precisely what the dissolve engine
exists to keep out of reach. The plotter's actual need was never an overlay;
it was *"when I come back, my page is exactly as I left it."*

**Pass 2 (critique/trim).** The Architects priced overlay-Drawers honestly:
either `Drawers.tsx`/`Shelf.tsx` duplicate into panel variants (drift is
certain — the two-editor split is load-bearing by design; this one would be
debt by accident) or one component tree mounts in two containers with
divergent affordances (cramped at panel width). Largest build in the brief,
serving the least-validated need. **Trimmed to the horizon**, revisit only if
device use shows friction the return chip doesn't solve.

**Single recommendation.** Rail links stay navigation. A writing session that
departs gains a persistent, quiet return affordance — the ember **return
chip** — restoring scroll, caret, and mode in one tap. See W2.

## Question 2 — interaction model

Moot for Drawers-as-overlay (not built). For the sheets that already overlay
(Add to…, Port to…): selecting a leaf **acts** (MOVES/COPIES/LINKS — J5
canon); it never navigates as a side effect. The only navigation out of a
sheet is the user closing it and leaving deliberately. The **reference peek**
(reading another page beside the live one — the professional editor's
continuity-check case) is a real future capability, logged to the horizon
*with* the deferred Plan-beside-page idea; both want the ≥1700px real estate
and the W5 responsive pass, and neither is validated yet.

## Question 3 — Journal metadata: below the page stands, permanently

W1's relocation is **blessed as final**, not interim. Metadata is
document-local and read at boundaries, not mid-flow; a left panel would
promote it to persistent chrome — visual load fighting the dissolve. Below
the surface is the back of the page: skeuomorphically honest, zero chrome
cost, already shipped and harness-pinned (`w1.mjs` checks the DOM order).
No metadata panel system exists in v1; nothing is reserved for one.

## Question 4 — ProjectHome / StructureBoard / Pages⟷Plan: exempt

The Plan is a different view of the work; going there is honest navigation
and stays a route. **Plan-beside-page pull-forward: declined, explicitly** —
it's the strongest future claimant on the second pane (with the reference
peek), and it should be designed once, against real ≥1700px session data
from the hardware gates, not pulled forward piecemeal now. Logged back with
this reason.

## Question 5 — the AGENTS.md rule (ready to merge with W2)

> **PAGE IS PRIMARY.** While a writing surface is mounted, no tool, panel,
> menu, assistant, sheet, or setting may move, resize, or unmount it. Tools
> orbit the page: they collapse and expand inside fixed layout tracks,
> overlay without displacing, and dissolve with the chrome. Only an explicit
> act of departure — opening different work via wayfinding — may replace the
> page, and every departure must offer a stateful one-tap return (the return
> chip: scroll, caret, and mode restored).
>
> Self-check for any ticket touching a writing surface:
> 1. Does the page's bounding rect change when your feature opens or closes?
> 2. Does the editor unmount at any point your feature is used as intended?
> 3. If the user leaves through your feature, does one tap return them to
>    the exact writing state?
> "Yes / yes / no" on any line fails the rule. Prior art: W1's fixed-track
> grid (the rect half) and J5's Add to… sheet (the no-unmount half).

Category table for future self-checks — **tools/chrome** (never displace):
AI assist rail, settings gear, incentive row, format bar, Add to…/Port to…
sheets, toasts, any future panel or menu. **Navigation** (may replace, must
be return-faithful): DeskRail destinations, the notebook pager, Pages⟷Plan,
opening any document from any list.

## Opposition note (Marketing, for the record)

An overlay drawer demos flashier; the chip demos quieter. The principle *is*
the positioning — "the page never flinches" — and the chip is the honest
version of it. Reach defers to principle; the copy line is a keeper.

## Proposed ledger delta (replaces item 11 on commit)

> 11. ~~Page-is-primary committee pass~~ **RULED — 2026-07-12**
>     (`docs/page-primacy-canon.md`, pending Nick's word): tools orbit,
>     navigation departs with a guaranteed way back; overlay-Drawers trimmed
>     to horizon; metadata-below-page blessed final; Plan-beside-page
>     pull-forward declined with reason. Build: **W2 — the way back**
>     (`docs/w2-way-back-brief.md`), sequenced after the W1 merge; AGENTS.md
>     rule text ships with the W2 ticket.

— Fable, for the committee
