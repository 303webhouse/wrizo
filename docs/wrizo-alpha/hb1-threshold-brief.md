# HB1 — the Threshold · build brief for CC · 2026-07-16

**Branch:** `hb1-threshold`
**Arc:** HB (arrival / first-run). First ticket. Charter: `docs/wrizo-alpha/hb-arc-handoff.md`.
**Authorization:** Nick, 2026-07-16, direct word. The committee double-pass named in the
charter is **waived by Nick's explicit ruling** for this ticket; the rulings that unblocked
it are recorded below so the decision survives the session. Chat-only = lost; this brief is
the disk record.

---

## Rulings of record (Nick, 2026-07-16)

**R1 — Flux stands in for Machina at the unlock.** The theme choice at the 100-word gate is
**Plateau or Flux** — Flux is built; Machina is designed but not armed. This is an interim
ruling ("for now"): build the pair as **data, not hardcode** (an ordered list of offered
territories), so Machina drops in by changing one list when it arms. The three grayed
future territories at the ceremony are therefore **Machina, Nomad, Volant**.

**R2 — First-run carve-out from M1.** Nick rules that M1's "never a visible locked door"
is a general principle that does not govern the first-run threshold, because the explicit
product goal here **is** a quick win plus reward reinforcement as the writer's first
experience. Scope of the carve-out, precisely: **the one-time threshold only** — the gate,
its instruction, the unlock ceremony, and the grayed future territories shown at that
ceremony. M1 governs in full everywhere after the veil lifts: no recurring unlock loops,
no locked doors in the working app, coverage-never-verdicts, availability-never-invitation.
Any future feature citing R2 outside the first-run threshold is out of scope of this ruling
and goes back to Nick.

## Fable's calls (veto-able at review — flag disagreement, don't silently change)

**F1 — The gate measures 100 words.** The working glow/goal system measures lines (origin-
chat ruling); the threshold is a distinct regime with its own one-time instrument. First
run forces Free Write prose, so lines-for-poetry/screenplay isn't in play at minute zero,
and "100 words" is legible to a brand-new writer in a way line counts aren't. Whitespace-
delimited tokens; count from the first page's live content.

**F2 — Open is always enabled.** Deviation from the spec letter ("selectable only if the
user has logged in before"). Reason: a returning user on a fresh device has an account but
no local marker — a disabled or absent Open strands them. Resolution honoring the spec's
intent: **Write is the dominant primary** (visual weight, default focus); Open is quiet-
secondary and routes by state — local session present → resume; none → existing sign-in.
No new visitor hits a login wall; no returning user is locked out.

**F3 — The rite runs once per device.** Local-first, pre-account: a local
`firstRunComplete` flag (client prefs store / localStorage — see zero-schema invariant).
Subsequent boots: arrival screen still renders (it is the boot), both doors live, no veil,
no gate. If an account later exists to carry preferences, the flag rides along; do not
build server persistence for it in this ticket.

**F4 — The threshold ships in the DeskFrame regime only (≥1100px).** Below the gate,
legacy remains byte-identical per the AB1 invariant. New sub-1100px users get no rite for
now — consistent with laptop/tablet-first law. Do not fork a small-screen arrival.

**F5 — The paste seam stays open.** The anti-slop paste rail is a planned future build;
this ticket does not implement paste detection at the gate. Known consequence: pasting can
cheat the 100 words. Accepted for now; the rail closes it later. Do not pre-build it.

---

## Why

The door to the app becomes a hundred words of the writer's own. The thesis — writing is
a process; the app shows rather than tells — made mechanical at minute zero, and the
founding story re-enacted for every writer: an unrevised first artifact, theirs, made
under the forward lock, the same kind of object as the logo itself. The Desk room dies;
the Page is home. Quick win, then reward reinforcement (R2): the writer earns a theme
choice by writing, not by reading about writing.

## The flow (normative)

1. **Arrival** (route `/`, cold boot): the Wrizo hand-drawn mark (use the shipped asset —
   no new vector export), a boot progress bar (real readiness, not theatrical duration;
   indeterminate → complete; doors enable when the app is ready), and two doors:
   **Write** (primary) and **Open** (quiet-secondary, per F2).
2. **Write, first run:** creates a new page, `origin: 'loose'` (the home-base door;
   belongs nowhere yet; never nudged), lands directly on it. Forced session defaults:
   **Free Write mode, typewriter ON, forward lock ON** — FX1's behavior unmodified; the
   practices are introduced by being lived, not explained.
3. **The veil:** all chrome blurred AND inert — `aria-hidden`, out of tab order, no
   pointer targets. One visible utterance: **"Write 100 words to unlock your desk"** —
   plus the gate progress bar and the background glow (see invariants: glow seam, chroma
   cap). This is the threshold's single sanctioned instruction; the app speaks once at
   the door and never solicits after the veil lifts.
4. **At 100 words:** the unlock ceremony — an animated pop-up (respects
   `prefers-reduced-motion`) announcing a second theme unlocked; the choice **Plateau or
   Flux** (R1); Machina, Nomad, Volant shown grayed as future territories. Ceremony copy
   from this spec is placeholder-final: Nick tunes wording at device review.
5. **Theme chosen → box closes → veil lifts** → full app, chosen theme applied,
   `firstRunComplete` set. The 100-word page remains open as a normal loose page in
   Free Write. Theme choice is a preference, not a lock — reversible wherever theme
   preference already lives.
6. **The Desk room dies.** Route `/` no longer renders it anywhere. **Park, don't
   delete:** the Writing Desk graphic and the room component move to the parked substrate
   per house law. Its functions rehome per S5.

## Slices

**S1 — Arrival.** Route `/` renders the arrival screen on cold boot: mark, boot bar, two
doors per flow §1 and F2. Retire the Desk room from routing; park graphic + component.
Geometry floors for the arrival layout land in this slice, day one.

**S2 — First-run state + forced defaults.** `firstRunComplete` flag (F3). Write during
first run → new loose page with forced Free Write / typewriter / forward lock (flow §2).
Write after first run → new loose page with normal defaults. Zero changes to FX1's
forward-lock or typewriter implementations — consume as shipped.

**S3 — The veil + the gate.** Blur + inertness per flow §3 (this is an accessibility
invariant, not a styling one: assistive tech must perceive exactly one path — the page,
the instruction, live progress). Word counter per F1, monotone under forward lock. Gate
progress bar + background glow driven by a single progress fraction. Geometry floors for
the veil in this slice.

**S4 — The unlock ceremony.** Crossing 100 → ceremony per flow §4–5. Theme application
uses the existing theme mechanism; offered-pair and grayed lists are data (R1). Reduced-
motion honored. Orange law: gate progress stays quiet (theme's capped progress
treatment); **orange fires once, at the unlock** — earned completion, a human acting.

**S5 — Rehoming the Desk's orphans.** Resume pointer → Open's landing (F2). Begin
Project and the recent/Shelf glance → the existing Drawer Places face, **as built** —
interim homes; the origin chat owns panel IA and this ticket does not re-rule it (seam
law from the charter). Loose pages' `backTo '/'` exit: remove the room-change; the
escape from any page is the left-hand side (drawer), not a navigation to `/`. Sweep all
routes/links targeting the dead room.

**S6 — Harness (`hb1.mjs`, committed alongside).** Minimum checks: cold boot renders
arrival with both doors in correct states; first-run Write lands on a loose page with the
three forced defaults ON; veiled chrome is `aria-hidden` and unfocusable; word 99 → no
ceremony, word 100 → ceremony; theme choice applies and persists; second boot shows no
veil and no gate; sub-1100px remains legacy byte-identical; `/` never renders the Desk
room. Never assume a fixture's default mode (standing lesson, FX1 review).

## Non-goals

Arming Machina. Building the goal/glow system (thin seam only — see invariants). The
anti-slop paste rail (F5). Any auth/signup changes (F2 routes to the *existing* sign-in).
Panel-IA or far-left-rail redesign (origin chat's table). AB5 sheet system. A sub-1100px
or phone arrival. Server persistence of first-run state. New copywriting systems —
ceremony strings are placeholder-final for Nick's device review.

## Invariants

- **Zero-schema, declared loudly.** All first-run state is client-local. If any slice
  turns out to need a server column or migration: **stop and surface** — schema carries
  no standing pre-authorization (ledger item 23) and needs Nick's explicit go.
- **Legacy byte-identical below 1100px** (AB1 law; F4).
- **FX1 lands first.** Forced defaults consume FX1's forward-lock-as-mode-furniture and
  typewriter feel unmodified. Branch from post-FX1 main; do not merge ahead of FX1's
  deploy.
- **Glow seam: consume, don't fork.** The gate's glow hangs off one progress fraction
  behind a single seam (one variable/prop), re-plumbed into the canonical glow system
  when the origin chat's pass lands. **The field never burns:** chroma capped even at
  full progress. During first run the gate is the only goal source alive.
- **Olive/orange law.** Olive marks where you are; orange marks what you do. Orange at
  the unlock moment only (S4); never as ambient gate decoration.
- **Anti-solicitation after the veil.** The threshold's utterance is the app's one
  sanctioned instruction; post-unlock surfaces added by this ticket solicit nothing.
- **Park, don't delete** — the Desk graphic and room join the parked substrate.
- **Journal-forgets-nothing** — the first artifact persists like any loose page.
- **Report = push.** One brief, one ticket, harness alongside, geometry floors day one.

## Definition of done

All six slices built on `hb1-threshold`; `hb1.mjs` green in CI; every S6 check passing;
no schema touched; report pushed with commit SHAs; Fable diff review (stats-first) before
merge; **merge word and device verdict are Nick's** — the threshold is the first thing
every writer will ever see, so the felt check on real hardware is the final gate.

— Fable, for CC, on Nick's word · 2026-07-16
