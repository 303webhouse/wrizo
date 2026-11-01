# HOME Port — Final Build Brief for CC (v3, ratified)

**Branch:** `home-port` off `main` / `m1-creative-flow` (clean, current).
**Status:** committee-reviewed (SME + design panels), ratified by Nick.
**Hard gate:** nothing in the HOME shell starts until `wrizo-home-v6.html` is in the working tree (`apps/desktop/scratch/`).

## Read first
1. Confirm v6 on disk before the shell — source of truth for landing layout, motion, timing, reward. If absent, build only the two v6-independent tasks (bottom) and wait.
2. Compose, don't rebuild. One prose surface (`WritingSession` → `ForwardOnlyEditor` + `useChromeFade`), mounted in journal + project Start Writing. The gate mounts that same component. Zero editor logic.

## Verify 3 repo claims
1. External-paste block — exists? (gate works without it; must NOT block shell)
2. Struck words drop from derived/saved prose — confirmed? (critical for account step; struck stay visible but must not leak into saved)
3. Nudge pool = canonical curated 25 (4 registers), not CC's rewrite. Reconcile to canonical (verbatim lines in prototype/transcript).

## Already built — inherit
- Prose surface: `WritingSession`/`ForwardOnlyEditor`/`useChromeFade` (runway, strikethrough, chrome-fade, pre-wrap caret).
- Nudges: live, re-tuned this pass.
- Brand tokens: `--font-display`/`--font-ui`=Figtree; `--font-prose`=Crimson Pro; `--brass`=#FF9800; `--ink-950`=#110600. Consume, don't re-install.

## Mission
Port v6 into apps/desktop as the front door: warm-dark landing → forced first-write gate → account → launchpad, on the existing prose surface.

## Design tokens — ratified
- Corners square (`border-radius: 0`). Borders thin + solid. Translucency = de-emphasis signal only, never default border.
- Ground: deeper, richer dark-roast espresso (not "leather couch" brown). Deepen base AND tame ambient glow/lift washing it to mid-brown. Dark richer ground makes #FF9800 pop. (Final richness = hardware-tuning value.)
- Accent #FF9800 locked, filled-orange primary buttons.
- Writing surface dark, not cream. Gate is dark-only (customization earned). Dark/light writing toggle = post-gate Desk feature, separate ticket; keep tokens theme-ready.
- Type: Figtree (titles/UI/buttons/labels) + Crimson Pro (body, writing surface, quoted words, italic nudges).
- Reduced-motion: glows/blooms → instant/minimal.

## Flow
1. **Hero** — wordmark = Nick's real hand-drawn Wrizo logo (swappable slot; Figtree placeholder for now). Tagline "For humans writing" (Figtree). Espresso ground, subtle ambient ember glow (quiet so completion bloom is the one crescendo). Beat heading "You're already writing" (Figtree, swappable slot). Leads straight into gate; no separate signup CTA.
2. **Gate (core)** — framing paragraph lowers stakes explicitly (permission to write badly; brain into writing mode, not great prose — pedagogical). Writing area = shared `ForwardOnlyEditor` (inherits runway, struck-drop, paste block, nudges, IME/tablet). `WORD_GOAL` ~50 (lowerable for testing). BOTH progress signals: fill-track under text AND subtle ember-grow (glow ~0.4→1.0). On goal: bloom + one-time visceral audio-visual reward showing user their own words (no sensory toggle; reduced-motion still shows words statically).
3. **Account — "Save it to your desk"** — email field. On signup, gate entry persists as the user's CLEAN first journal entry (derived prose, not raw struck buffer). NON-NEGOTIABLE: don't risk losing/mangling it; "saving not signing up" is the emotional spine.
4. **Launchpad — "You're ready to keep writing"** — filled-orange Keep writing (primary); quiet New page / Begin project; grayed Customize + tooltip (anticipation: themes + AI help earned at milestones, never expire).

## Idle nudges — RE-TUNED (global; standalone v6-independent task)
- Cadence: first nudge after 3 min idle; second after 2 more min; third after 1 more min, then HOLDS. (~6 min total to held.)
- First two dissolve in and back out after 10s (ephemeral). Third persists until typing resumes.
- Any keystroke resets the cycle to the 3-min countdown.
- Crimson Pro italic. Canonical 25-prompt pool.

## Paste blocking — confirmed, default ON
- Block external paste in all writing areas. Exempt: text written within the app (internal copy/paste allowed). Ideally app-written text not pastable into other apps (intercept copy/cut/paste; do what's achievable in Electron/web; don't over-promise exfiltration-proofing).
- Disabling: togglable but behind friction + warning about importing AI-generated writing. Deliberate, uncomfortable.
- Deferred: legitimate "draft started elsewhere, import it" case.

## Heading slots — swappable (build slot now)
- Three beat headings as Figtree text now; generously-spaced art-agnostic slots so hand-drawn art swaps without relayout. Hand-drawn used sparingly (major section headers only). Slot = swappable text/image component; same mechanism as future milestone-gated user-handwriting reward (gating deferred, slot now).

## Out of scope
Hand-drawn heading art (Figtree placeholders); themes/AI behind Customize (grayed + tooltip only); Desk interior; dark/light writing toggle (tokens theme-ready); recurring reward mechanisms (Desk/journal, customizable + togglable — separate); milestone-gated handwriting (slot now, gating later); backend auth changes beyond wiring existing register; pixel parity with v6.

## DoD
- Ember homepage gone → hero → gate → account → launchpad.
- Tokens: square + thin solid borders (translucent=de-emphasis), dark-roast espresso, dark writing surface, Figtree+Crimson Pro, #FF9800.
- Gate uses shared `ForwardOnlyEditor`; `WORD_GOAL` gates; both fill-track + ember-grow; bloom + one-time reward (reduced-motion shows words).
- Account persists gate paragraph as clean first journal entry (non-negotiable).
- Launchpad: filled-orange Keep writing, quiet secondaries, grayed Customize + tooltip.
- Nudges re-tuned (3→2→1, first two dissolve 10s, third holds, keystroke resets).
- Paste block ON by default, disable behind friction + AI-slop warning.
- Reduced-motion respected; heading slots swappable.
- tsc + build:web pass. DO NOT railway up until the tablet pass — leave for review.

## Backlog to log
import-external-draft case; recurring-reward Desk feature (customizable triggers + sensory toggle); milestone-gated user-handwriting customization; dark/light Desk toggle.

## Two v6-independent tasks startable NOW (keep out of HOME shell until v6)
1. Nudge re-tune (above).
2. Structured-notes font cleanup (beat notes + Setup field → Figtree + brand tokens, NOT Crimson Pro, no forward-only).
