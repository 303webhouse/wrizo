# TH2 — Flux · Fable review · 2026-07-14

**Branch:** `th2-flux` @ `72341e8`, reviewed via the read pipe (full patch,
two paginated pulls, plus a direct read of `store/voiceWall.ts` on the
branch to settle the Firewall-chip question). Branch is a strict descendant
of `main` @ `a18a9fb` — fast-forwards cleanly.
**Merge state:** NOT pre-authorized — merge on Nick's word after the fold.
**Place this file at:** `docs/th2-review-fable.md`. Delivery channel this
time: **Nick places this file (and the still-uncommitted
`docs/th1-review-fable.md`) directly into the working tree** — the channel
that worked for the foundations files — and CC commits both with the fold.

## Verdict

**REQUIRED — 3** (one CSS-cascade defect, one brief mandate not implemented,
one small sweep completion), **4 advisories**, several ratifications. Plateau
byte-equivalence held for the third consecutive ticket, again by
construction (identity-default slots; `th1.mjs` still 26/26 on the branch).
The build's craftsmanship is the arc's best yet — the interpolated-token
inline flags are the model for every future theme pack, the ModeSwitcher
catch justified the sweep mandate with one real bug, and `th2.mjs` is the
finest harness in the suite (the pre-summon faded-state proof, A2's
double-proof on both the set-path and a genuine corrupted-storage reload,
and the reduced-motion check that correctly distinguishes persistent DOM
nodes from animating ones). The three REQUIRED are one sitting combined.

## Required

### R1 — the earn-the-orange handoff never fires (CSS source order)
Canon §9's core beat — the fill hands off from lime to orange at the surge —
is missing. `[data-theme='flux'] .mode-pfill { background: var(--signal-live) }`
ties Plateau's `.mode-pfill.celebrate` background at (0,2,0) specificity and
**wins by source order** (the Flux block sits later in the file), so the
fill stays lime straight through the celebrate window: ignition sweep,
orange notch, sparks — over a lime bar. The commit comment's "rests on
`.celebrate`'s already-brass background" describes a cascade that doesn't
resolve that way. The harness samples the class, never the color, so this
was structurally invisible to it.
**Fix:** add `[data-theme='flux'] .mode-pfill.celebrate { background: var(--brass); }`
— (0,3,0) beats the lime base cleanly.
**Harness (+1):** during the celebrate window under Flux, the computed
background of `.mode-pfill.celebrate` resolves to `#FF9800`.
**Canon errata (same fold):** one sentence appended to canon §9 and mirrored
in `flux-foundations.md` §3.7 — *in the app's lap mechanics, "rests calm
orange" means the celebrate window; each new lap charges lime afresh* —
reconciling the RC's single-goal demo language with W1's continuous laps.

### R2 — the dial is a boolean in disguise; the brief mandates scaling
`loop()` gates on `getDial() > 0`: dial 1 and dial 100 are identical. The
brief's Slice 4 and canon §7 both say the Ambiance dial **scales** rate;
"dial-center tuning is a build-and-verdict matter" is the standing plan, and
the hardware session cannot tune a switch. The commit message described only
the zeroing — scope-honest wording, but the reduction itself was never
flagged as a deviation, and it is one.
**Fix:** a pure, exported `dialIntervalScale(v)` — 50 → 1.0 (RC-2 center),
monotonic (1 → ~1.75×, 100 → ~0.55× intervals), read live per tick, with
each loop's result clamped to its own structural floor so no dial position
can breach the ≤3Hz-family spacing. Opacity-envelope scaling is **sanctioned
as deferred** to the hardware-tuning pass (rate covers the dial's purpose) —
record the deferral inline, this time as a deferral. Expose an **Ambiance**
row in ThemePanel (the existing Seg pattern; 0/25/50/75/100 stops suffice) —
a canon-level user pref with no UI is a TH1 allowance, not a TH2 one. And
one verification while in there: confirm the `@fontsource` CSS imports
actually exist from TH1 (the slot vars assert declared *strings*, which pass
whether or not a font file ever loads); if absent, add them, and either way
add a `document.fonts.check('12px Rajdhani')` harness probe post-load.
**Harness (+3):** `dialIntervalScale(50) === 1`, monotonic across
1/50/100 with the floor respected at 100; the Ambiance row renders and
writes the pref; the font-load probe.

### R3 — finish the mandated sweep
Two knowable residuals in swept files: `ImportDraft`'s own `<h1>` ("Which
binder?" — its sibling empty-state got swept in the same diff) and the
sprint-toggle's `aria-label="Binder view"` (PageEditor + QuickSprint). Run a
closing grep-audit of the 15 canonical nouns across JSX text, aria-labels,
placeholders, and titles; sweep what it finds. Exemption class, recorded:
store-level strings that only ever render under Plateau (the `WHISPER`
constant is the example — Flux replaces that element wholesale) and the
documented judgment calls (marketing prose, SCRAP_HEADING) stand.
**Harness (+1):** ImportDraft's heading under Flux reads "Which cartridge?".

## Advisories — record, don't change (unless trivially foldable)

- **A1 — block caret goes stale on scroll/resize.** `selectionchange`
  doesn't fire when the prose column scrolls under a visible caret; the
  fixed-position overlay floats detached until the next input. Reposition on
  rAF-throttled capture-phase scroll + resize, or hide-on-scroll. Harness-
  invisible; joins the hardware-gate feel items if not folded.
- **A2 — Firewall chip: correct today, coupled tomorrow.** Verified in
  `voiceWall.ts`: exactly one whisper kind exists, so the hardcoded "PASTE
  BLOCKED" is accurate (drops included, colloquially — accepted). Thread the
  event kind through `subscribeWhisper` when VW grows a second message. Also
  noted: Flux drops Plateau's Import-door pointer ("Import it from your
  binder if it's yours"). The terseness matches the RC and the register;
  accepting it is the default — Nick may word a quiet sub-line instead.
- **A3 — ThemePanel's future laws.** One comment at the `themeOpts` site
  citing `theme-arc.md`: picker presentation follows narrative order
  (Plateau → Machina → Flux → Nomad → Volant) and later territories arrive
  by progressive disclosure under the M1 anti-gamification frame. Two
  entries make it moot today; the law shouldn't live only in a doc when the
  site that will implement it already exists.
- **A4 — accepted deviations, ratified:** `blur(8px)` on the glow (the RC
  had none; smoother banding, compositor-friendly — approved); fixed spark
  count/angles (the *stricter*-correct reading of predictable-never-variable
  — approved and preferred); `--ink-stroke`/`--paper-glow` left inherited
  (Journal ink is a sealed domain — correct scoping); the interpolated token
  values with inline flags (approved; this is the pattern for Volant/Nomad/
  Machina packs).

## Merge / close protocol (recommendation)

All three REQUIRED are one sitting. The contingent rhythm fits: Nick's merge
word granted on the fold — CC folds R1+R2+R3 (+6 harness checks, `th2.mjs`
→ ~41), appends the canon §9 errata + the foundations §3.7 mirror, commits
both review docs (placed by Nick), re-runs the full suite + `th2.mjs` ×3,
fast-forward merges, deploys (zero-schema — liveness only), pushes. Fable's
delta spot-check runs post-merge, fix-forward.

**Ledger deltas (fold commit):** item 20 → DONE-at-merge (item-13 pattern),
recording R1–R3, the sanctioned opacity-scaling deferral, and A1–A3's
dispositions; hardware-gate item 2 gains the **tenth cluster** (TH2): glitch
feel at real refresh rates + S25 battery, Chakra long-session endurance (the
standing flag's judgment day), surge reward-vs-interruption read, fade +
celebrate-summon feel, block-caret feel incl. the A1 scroll case, ≥1700px
with the layer live, and the **Ambiance dial tuning session** R2 just made
possible. Flux ships to prod at merge, but the ticket closes only on Nick's
device verdict — the theme was born in a mockup; it graduates on hardware.

— Fable
