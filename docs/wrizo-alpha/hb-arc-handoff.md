# HB-arc handoff — the Threshold · for a new Fable session · 2026-07-16

**You are Fable** — architecture lead, design lead, canon keeper for
Wrizo. This document hands you a new workstream: **completely reimagine
the startup / home-screen / first-run experience** around the ruled
truth that **the Page is the home base.** Nick has asked, explicitly,
that you run his vision below **through the committee double-pass**
(Experts frame the why · Architects shape the how · Marketing runs
opposition, growth vs. brand plus a skeptical writer-advocate) before
any brief is written. Panels propose, critique, trim, deliver ONE
recommendation with named tensions. Nick ratifies; he holds all merge
words and device verdicts.

## Boot order (do this before design work)

1. `docs/wrizo-alpha/fable-session-handoff-v2.md` — house laws, tools,
   communication laws (plain language to Nick; engineering dialect
   fenced and CC-facing only; scannable bold micro-leads; decisive
   calls over option menus).
2. `docs/open-threads.md` — the ledger. Items 21/23 (AB-arc closes),
   the FX1 entry when it lands.
3. `docs/wrizo-alpha/page-and-homes-canon.md` — **RULED.** The eight
   laws, four ranges, amendments A1/A2. Your work must answer to it or
   amend it formally.
4. `docs/wrizo-alpha/ab3-review-fable.md` + `fx1-first-sitting-brief.md`
   — the current state of the drawer, the homes, and the in-flight
   fixes.
5. GitHub connector is READ-ONLY; the delivery path is relay-to-CC
   (Nick pastes). Chat-only = lost; every durable decision goes to
   disk. Report = push. Verify against code, never reports.

## Where the app stands (mid-July 2026)

AB1–AB3 shipped: DeskFrame (≥1100px gate, legacy byte-identical
below), the mode strip, the Drawer (tools / Page / Places faces, fixed
geometry), provenance (`origin: 'journal'|'project'|'loose'`, null =
grandfathered), Journal-forgets-nothing, anti-solicitation throughout.
**FX1 is building now:** typewriter feel (no pop, top-fade band, start
near vertical center), screenplay paper restored to the one measure,
**forward lock reinstated as MODE furniture** (all origins, Free
Write), square corners, olive-law sweep. **A second committee pass is
running in the origin chat** on: the page-adjacent tool sliver + panel
architecture + far-left rail revision, mode strip to the top line,
wide-monitor composition, and the glow/progress/goal system (lines,
not words; one goal source; M1 coverage-never-verdicts; the field
never burns).

**The seam between that chat and yours:** you own ARRIVAL — the
threshold, the first run, the landing, the death of the Desk room.
The origin chat owns the working page's panel architecture. You meet
at the left-hand side: consume its committee outcome as an input when
it lands; where it hasn't yet, design against its direction and flag
the dependency — do not re-rule panel IA here.

## Nick's vision (the spec — faithful; committee shapes, Nick rules)

1. **A loading screen:** the Wrizo logo, a progress bar, and two
   options — **Write** and **Open**. Open is selectable only if the
   user has logged in before / has an account.
2. **First Write:** lands directly on the home-base Page. All menus
   and options **blurred out**. One visible direction: **"Write 100
   words to unlock your desk"** — plus the progress bar and the
   background glow.
3. **Forced first-session defaults:** Free Write mode, typewriter ON,
   backspace restraint (forward lock) ON — the signature practices
   introduced by being lived, not explained.
4. **At 100 words:** an animated pop-up — they've **unlocked a second
   theme** — and the choice of **Plateau or Machina** as their first
   preferred theme. The other three themes shown as future options,
   grayed out.
5. **Theme chosen → box closes → full app, unblurred.**
6. **The Desk room dies.** Scrap the Writing Desk graphic and the
   entire home page with the Drawers listed. **The Page is home**; the
   options live on the left-hand side. (Park the graphic asset, don't
   delete — flourishes are parked, per house law.)

## What this gets deeply right (carry into the Experts' framing)

The door to the app is a hundred words of the writer's own. The thesis
— writing is a process, the app shows rather than tells — made
mechanical at minute zero. And it re-enacts the founding story for
every writer: the Wrizo logo was drawn in the app's own Journal in one
unrevised pass, the first thing that came out. Now every writer's first
artifact is the same kind of object: unrevised, theirs, made under the
forward lock. That first page's provenance should be **loose** (the
home-base door; "belongs nowhere yet"; never nudged) — confirm in
committee, since it is every user's first artifact.

## Canon touchpoints and named tensions (the committee's real work)

- **M1 anti-gamification vs. the unlock ceremony.** M1: progressive
  disclosure, coverage-never-verdicts, **never a visible locked
  door.** The spec contains: a gate ("unlock your desk"), an animated
  reward pop-up, and three grayed-out themes — a literal visible
  locked door. The strongest reconciliation to test: **first-run is a
  distinct regime** — a rite of passage that happens once, teaches the
  practice, and whose "reward" is agency (the theme choice), not a
  recurring loop. The grayed themes are the hardest piece; weigh
  Nick's explicit spec against availability-never-invitation (e.g., a
  quiet line that other territories exist and are found by writing).
  Present both honestly; Nick rules. Note the Volant unlock mechanics
  already parked in the user-authored-identity backlog under exactly
  this frame — this flow intersects that parked work.
- **The one sanctioned instruction.** Anti-solicitation is a hard
  invariant; "Write 100 words to unlock your desk" is a direct
  instruction. Frame it as the threshold's single sanctioned utterance
  — the app speaks once, at the door, then never solicits again — or
  reshape it.
- **Write-before-signup.** First Write happens before any account
  exists (local-first makes this real). The committee must place
  account creation: after the unlock? at first sync need? at Open?
  Nick did not specify — design it, don't assume it.
- **Open's gating.** Disabled-quiet (the Peek pattern: aria-disabled,
  no greyed ceremony) vs. simply absent for brand-new visitors.
- **The Desk's functions must rehome.** Killing the Desk room orphans:
  the resume pointer (does Open land on the last-edited page — the
  resume pointer BECOMES the landing?), Begin Project, the recent
  drawers/Shelf glance, the `Start writing` door (arrival IS that
  door now), and loose pages' `backTo '/'` exit target. Route `/`
  itself re-targets. Every one needs a named new home.
- **The gate's measure.** Nick just ruled the progress/glow system
  measures **lines, not words** (poetry and screenplay count) — and
  this spec says **100 words.** Different instruments may be fine;
  surface the inconsistency and let the committee/Nick pick one
  deliberately.
- **Law 8 / typewriter at first run.** The forced typewriter default
  uses FX1's refined feel (no pop, top-fade, centered start). The full
  sheet system is AB5 — nothing here should pre-build it.
- **Blur accessibility.** Blur-plus-one-path needs a keyboard and
  screen-reader story; the gate must not be a wall for assistive tech.
- **The glow at the gate** is item 8's glow — one implementation, one
  goal source, shared with the origin chat's committee outcome. The
  field never burns: chroma capped even at full progress.

## Hard dependencies (state these to Nick early)

1. **Machina is designed, not built.** Live themes today: Plateau and
   Flux. The Plateau-or-Machina pair as specced requires arming
   Machina (foundations at `docs/theme-foundations/machina-foundations.md`
   — achromatic, CAST temperament dial, Atkinson Hyperlegible /
   IBM Plex Serif) — or the pair changes. Nick's call after the
   committee weighs cost against the first impression Machina's
   austerity makes next to Plateau's warmth.
2. **FX1 must land first** (forward lock as mode furniture; typewriter
   defaults and feel) — the forced first-session defaults ride it.
3. **The goal/glow system** rides the origin chat's committee pass —
   consume, don't fork.

## Deliverables expected from your session

1. The committee double-pass on the whole flow (this document's
   tensions are the docket floor, not its ceiling).
2. One recommendation with named tensions, for Nick's ratification —
   including drafted canon amendments where the flow touches law (the
   Desk's retirement; the threshold's sanctioned instruction; the
   first-run regime's relationship to M1).
3. The **HB-arc brief(s)** (working name — propose better if the
   committee finds it), decision-complete, one brief per ticket,
   harness alongside, geometry floors from day one, in the house
   format: branch, why, slices, non-goals, invariants, definition of
   done. Zero-schema unless declared loudly; any schema addition needs
   Nick's explicit merge go (schema tickets carry no standing
   pre-authorization — corrected rule, ledger item 23).
4. Relay this handoff to CC for commit at
   `docs/wrizo-alpha/hb-arc-handoff.md` if Nick hasn't already, so the
   workstream survives the session.

**What you do NOT own:** FX1's review (origin chat), the panel-IA /
tool-sliver committee (origin chat), AB4 the Wall, AB5 the Sheets.

— Fable, for Fable, 2026-07-16
