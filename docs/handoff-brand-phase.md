# Ember - Brand & Visual Phase: CC Handoff (2026-06-13)

## Mission
All Ember brand decisions are now locked (logo, tagline, color, UI font). Your job: consolidate the work onto `m1-creative-flow`, get the rename live, and execute the remaining icon / atmosphere / accent / responsive tickets. Do NOT relitigate the locked decisions below.

## Read first (in this order)
1. `docs/branding-ember.md` - the brand spec. CRITICAL: read the "Revision 2" and "Decision (2026-06-13): hero tagline" sections at the bottom; they SUPERSEDE the original mark (Section 2) and lockup (Section 3).
2. `docs/ui-redesign-spec.md` - the Lamplit Desk visual system (tokens, type, motion guardrails, per-screen D-tickets). Authoritative for everything visual.
3. `docs/handoff-brief.md` - master build brief (A/W/D streams, schema, sync). Background.
4. `AGENTS.md` - working rules.

## Locked decisions (do NOT change)
- Name: **Ember**.
- Logo: the glowing brush-script "e" at `apps/desktop/public/brand/Ember Logo Final 1.png`. THRESHOLD-ONLY - launcher / splash / login / loading / marketing. NEVER glowing inside the working chrome (sprint page, beat wizard, board). See Revision 2 sections 2R / 2R-rule / 3R.
- Hero tagline: **"For humans who write."** North star (vision, about page / internal): "A collaborative writing studio."
- Color: Lamplit Desk palette - unchanged.
- UI sans font: **Mulish** (`@fontsource-variable/mulish`, CSS family `'Mulish Variable'`). Already wired on `try-hanken-grotesk` (uncommitted): import in `apps/desktop/src/main.tsx`, token `--font-ui` in `apps/desktop/src/index.css`. Figtree + Hanken remain installed but unused.

## Step 0 - Consolidate git, then deploy (do this first)
Current state: the brand commit `f6fef9d` (brand spec + assets) and the uncommitted Mulish swap both live on `try-hanken-grotesk`, NOT on `m1-creative-flow`. That branch also carries an abandoned Hanken-Grotesk trial commit (`04c202f`) we do NOT want.

Target end state on `m1-creative-flow`: the brand commit + a single clean Figtree->Mulish font change, with NO Hanken trial commit.

Recommended path:
1. `git checkout m1-creative-flow`.
2. Cherry-pick the brand commit: `git cherry-pick f6fef9d` (clean - all new files: branding-ember.md, handoff-brief.md, ui-redesign-spec.md, apps/desktop/public/brand/*).
3. Apply Mulish directly on m1 as ONE commit (do NOT cherry-pick the Hanken trial): ensure `@fontsource-variable/mulish` is a dependency in apps/desktop/package.json; set the font import in main.tsx to import the mulish package; set `--font-ui` in index.css to `'Mulish Variable', system-ui, sans-serif;`. Commit as "ui: set UI sans to Mulish".
4. Verify: `pnpm install && pnpm dev` in apps/desktop - app builds and UI renders in Mulish.
5. Delete the stale trial branch: `git branch -D try-hanken-grotesk`.
6. DEPLOY m1-creative-flow to the Railway URL per `docs/deploy.md`. This finally takes the B2 rename live (Ember name + Mulish UI). The new logo and atmosphere land with the tickets below and can be redeployed as they merge.

## Ticket queue (in order; branch per ticket off m1-creative-flow)
Full specs live in branding-ember.md (B-stream) and ui-redesign-spec.md (D-stream). Summary + sequence:

1. B5 - Vector + monochrome logo companion (NEW; blocks B1). From the script-"e" PNG: trace a clean SVG mark legible at 16px; produce a flat single-color variant; remove the residual Gemini sparkle watermark (bottom-right of the PNG); export an optimized web-sized PNG (the 6.4 MB source is too large to ship). Output all to apps/desktop/public/brand/. DoD: SVG legible at 16px + monochrome variant + watermark-free optimized PNG.
2. B1 - Icon set & favicon. Generate favicon / apple-touch-icon / PWA icons from the B5 VECTOR (not the raster). Wire into index.html + the web manifest. DoD: flame favicon in the tab, iOS add-to-home, and installed PWA all correct; legible at 16px.
3. B3 - Atmosphere pass. Apply the lamplit layer - warm radial light-source background, vignette, ~5% static grain, warm glints on cards + the brass button - across all screens via shared tokens (branding-ember.md Section 5). The big visible lift. DoD: every screen reads lamplit; NOTHING animates; reduced-motion verified.
4. B4 - Ember accent wiring. Add the ember tokens (--ember #E0712C etc.); warm the running sprint-timer hairline from brass to ember; render the finish count-up number in ember. Audit that orange touches nothing clickable. DoD: live sprint shows ember hairline + ember finish count; no interactive element uses orange; brass stays the sole action color.
5. W5 - Responsive ("don't break small screens"). Laptop/tablet is the PRIMARY target; make the phone case graceful degradation, NOT mobile-first. Test B3's atmosphere tokens at small sizes here. DoD: laptop/tablet polished; phone usable and uncramped; nothing breaks below ~380px.

## Guardrails (re-read before each ticket)
- Glowing logo is threshold-only; never in working chrome (Revision 2, 2R-rule).
- ONE brass-filled action per screen. Orange = "alive" signal only (logo, live timer hairline, finish count) - never a control.
- Nothing animates except the timer hairline and the single 420ms finish-moment count-up. Reduced-motion collapses everything.
- No new dependencies beyond what B5 (vectorization/optimization) and B1 (icon generation) require. No new fonts - Mulish is set.
- Minimal changes per AGENTS.md; stop at each DoD. Screenshot affected screens into docs/screenshots/.

## Phase definition of done
Ember is live at the Railway URL: rename shipped, flame favicon present, a lamplit atmosphere on every screen, the ember accent on live/finish states only, Mulish as the UI sans, and the small-screen layout intact. All brand assets + the vector companion committed on m1-creative-flow. Add a "Brand sanity" line to docs/release-checklist.md.