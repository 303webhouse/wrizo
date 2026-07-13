# TH2 — Flux (build brief)

**Place at:** `docs/th2-flux-brief.md`. Fable, 2026-07-13. Canon:
`docs/flux-theme-canon.md` (all sections). Normative visual reference:
`docs/design/flux-rc2.html` — where prose and RC-2 disagree, RC-2 wins.
Branch: `th2-flux`, off post-TH1 `main`. **Armed only after TH1's
review/merge cycle closes.**

## Goal

Ship Flux as the first alternate theme, implemented entirely as TH1 seam
data plus the theme's effect parameters. If any slice needs a component fork,
stop and flag — that is a TH1 seam gap, not a TH2 workaround.

## Slices

**Slice 0 — theme pack registration.**
Token pack (canon §3, RC-2 values), font-slot values (canon §4), lexicon
values (canon §5). Flux selectable via the theme pref; switching back to
Plateau is instant and lossless.

**Slice 1 — chrome fade extension + Fade pref.**
Extend W1's dissolve machinery (shared constants, no new timers) to cover
rail and bottom bar plus page metadata, per canon §10. Wire the Fade on|off
pref (TH1 Slice 3). Implement the celebrate-summon rule: completion surge
overrides the bottom-bar fade ~2.5s, then re-fades. This behavior is
cross-theme; Flux is merely its first full expression — land it behind the
pref so Plateau gains it identically.

**Slice 2 — sprint bar, Flux styling.**
Restyle W1's WritingIncentives bar per canon §9: lime fill, blue caret notch
pulsing 1.8s; completion = ignition sweep → orange handoff → 14-spark burst →
calm orange rest. Predictable, one-shot ≤1.6s, peripheral, no sound,
reduced-motion = plain crossfade. One celebration grammar; B4 finish
authority noted in code comments. Checkpoints (M1 surface) are untouched and
never surge.

**Slice 3 — the glow (RESPONSE layer).**
Per canon §8 on the TH1 scaffold: progress-coupled scale/opacity, teal at
every level, 4.3s sputter cycle + jittered deep sputters, sputter paused
while typing, 600ms ease-down on deletion, teal brightness bloom on
completion. Anchor behind the page; verify no interaction with page shadow
tokens on the light-page pref.

**Slice 4 — texture scheduler (Signal Loss dialect).**
Per canon §7 on the TH1 scaffold: the six event types at RC-2 rates as
dial-center; the Ambiance dial scales interval and opacity envelopes; ≤3Hz
ceiling enforced structurally (minimum re-fire spacing per element), dial 0
static, reduced-motion zeroes. All events render behind the page and skip
while typing.

**Slice 5 — block caret + Firewall event chip.**
Wide orange block caret per canon §13, riding `store/caretOffset.ts` — hide
the native caret only where the block caret is active. Firewall transient
chip per canon §12: binds to the Voice Wall's existing blocking events; the
anti-paste rail is NOT built here.

## Constraints

Everything in TH1's constraints section, plus: no new schema, no server
files, no new npm deps beyond fontsource packages already landed in TH1.
Effects never enter the prose column. Report = push.

## Harness — `scripts/harness/th2.mjs` (committed with the ticket)

1. Flux token application spot-checks (per canon §3 table).
2. Lexicon renders on key surfaces (rail, tabs, Connect, board) while
   canonical search/routes still resolve.
3. Fade: typing applies fade classes to all three chrome regions + metadata;
   Fade-off pref suppresses; celebrate-summon overrides then re-fades.
4. Surge one-shot: crossing the goal fires exactly once; no re-fire on
   further input; deletion below goal does not un-done within a session.
5. Scheduler: concurrency caps honored; zero spawns while typing-state
   active; dial 0 = zero events; reduced-motion = zero events.
6. Glow math: opacity/scale track the progress variable; deletion eases
   (assert transition, no instant drop).
7. Plateau regression: with theme = Plateau, harness th1.mjs still green.

## Hardware gate (joins the consolidated session — verdict closes the ticket)

S25 + desktop: glitch feel at real refresh rates and GPU/battery draw on the
S25; glow warmth and legibility on both page surfaces; Chakra endurance read
over a long session (the standing flag — this is where it is judged); fade +
summon feel (deliberate vs drive-by, W1's probe family); surge dopamine read
(reward vs interruption, A4's reset-drain probe); ≥1700px stability with the
effects layer live. Harness-invisible by definition — Nick's device verdict
is the close.

## DoD

All slices green + th2.mjs green and stable across 3 runs + th1.mjs and the
full prior suite green on the branch + Fable review + Nick's merge word +
(post-deploy) Nick's device verdict. Expected zero-schema deploy.

## Out of scope

Anti-paste rail (own horizon ticket). Volant, Nomad. Wordmark replacement.
Any Plateau visual change beyond gaining the Fade pref machinery.
