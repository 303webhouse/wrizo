# Ember — Branding Specification & Revision Tickets

**Status:** Approved, ready for implementation. The lockup is v1 — final 10% polish (exact flame lift, gap, gradient warmth) is expected once it is seen live; all of it is one-line CSS/SVG tweaks and does not block these tickets.
**Audience:** Claude Code. Read `docs/handoff-brief.md` and `docs/ui-redesign-spec.md` first — this document extends them. It does not replace the base token system in `ui-redesign-spec.md`; it adds the brand identity (name, mark, accent, atmosphere) on top.
**Precedence:** `handoff-brief.md` > this doc > `ui-redesign-spec.md`.

The app is being renamed from "Writer Studio" to **Ember**. These tickets carry that rename through the UI plus the visual identity that makes the app feel branded and lamplit rather than like a flat dark template.

---

## 1. Name & tagline

- **Name:** Ember
- **Tagline / north star:** *A collaborative writing studio*

The tagline is deliberately aspirational. Ember's roadmap is: solo writing core (now) → an AI tutor/editor in the drafting process → a social platform where creators workshop, brainstorm, and team up. "Collaborative" names that destination. It is a brand statement, not a description of current features. Do not change it to match the current solo-only state.

**Wordmark:** title case "Ember", set in Newsreader 500 (the display/prose face already used in the app), letter-spacing ~0.015em. Not all-caps, not lowercase. The capital E anchors the mark (see §3).

---

## 2. The mark

A single twisting-flame glyph that reads as flame first and, secondarily, as if it could have been made by one brush stroke. The glow is intrinsic to the fill — a radial gradient hottest in the belly, deepening to the edges — never a separate layered object.

**Source files (already in the repo):**
- `apps/desktop/public/brand/ember-mark.svg` — the flame on transparent, square 64-box. Use this for the in-app wordmark lockup and as the favicon source.
- `apps/desktop/public/brand/ember-icon.svg` — the flame on the dark espresso tile at 512×512 with maskable safe-zone padding. Use this as the source for the PWA maskable icon and apple-touch-icon.

**The path (canonical, in a 0 0 110 110 space):**
`M47 75 C38 62 44 46 56 38 C65 33 63 24 55 25 C60 29 57 40 54 49 C51 58 58 68 55 76 C53 79 49 78 47 75 Z`
Tight bounding box ≈ viewBox `37 21 30 59`. Use the tight viewBox for inline placement so there is no dead space around the glyph.

**The fill (canonical radial gradient — do not substitute):**
```
radialGradient cx=0.46 cy=0.62 r=0.62
  0%   #FFE6B8
  38%  #F4983F
  72%  #E06E27
  100% #93340F
```

**Do:** keep it one shape; keep the gradient hot-spot low (the coal glows at the base); render it on dark or light — it holds on both.
**Don't:** add a separate glow circle, add strokes/outlines, recolor it to flat brass, or stretch it non-proportionally.

---

## 3. The lockup (v1)

Primary lockup is **horizontal (Option A):** the mark sitting just left of the title-case wordmark, raised so its tip floats above the letters.

Exact construction as approved (display reference at 40px wordmark; scale proportionally):
- Wordmark: `Ember`, Newsreader 500, font-size 40px, letter-spacing 0.015em, color `--text-hi` (#EDE6DA on dark).
- Mark: `ember-mark.svg` (tight viewBox `37 21 30 59`), rendered at width 19px / height 38px.
- Alignment: flex row, `align-items: flex-end`, `gap: 8px`, mark `margin-bottom: 15px` (this is the "+33% lift" — the mark floats with daylight beneath it). **This lift is the v1 value most likely to be fine-tuned; keep it a single CSS variable so it is trivially adjustable.**
- Clear space: keep at least the mark's width of empty space around the whole lockup.

**Stacked lockup (Option B)** — mark centered above the wordmark — is the variant for square contexts (loading screen, hero). Same mark, same face.

**Minimum sizes:** wordmark legible to ~16px cap height; below that, use the mark alone (the favicon proves it survives to 15px).

Implement the lockup as a small reusable component/partial so every screen pulls the identical geometry (launcher eyebrow, login, etc.).

---

## 4. Color — base palette + the ember accent

Base chrome, paper, and brass tokens are defined in `ui-redesign-spec.md` §5 and are unchanged. This brand layer adds one accent family.

```css
/* Ember — the "live / alive / glowing" accent. NOT an action color. */
--ember:        #E0712C;   /* the live ember */
--ember-bright: #F4983F;   /* highlight within the glow */
--ember-deep:   #93340F;   /* deep edge / shadow of the coal */
```

**The one rule (this keeps the low-stimulation discipline intact):** brass (`--brass` #D4A24E) remains the single action color — the one thing per screen you click. Orange is never a button, never a clickable control, never competing with brass for "do this." Orange appears only as the *alive* signal:

- the lamp glow in the atmosphere layer (§5),
- the logo mark itself,
- the sprint **timer hairline while it is running** (idle = brass; warms to `--ember` once a sprint is live — a quiet "this is burning" cue),
- the **finish-moment count-up** number (the one celebration).

That is the complete list. If orange shows up anywhere a user taps, it is wrong.

---

## 5. Atmosphere — the lamplit pass

The screens currently have the right color but no light or material. Four ambient moves fix that. All are felt, not read; none add clutter; all are static and reduced-motion-safe.

1. **Light source.** Replace the flat app/background fill with a warm radial gradient — brightest just above the screen's focal point (the title / the page), falling to near-black at the corners. Reference:
   `radial-gradient(135% 95% at 50% -8%, #36240F 0%, #251810 38%, #170F0A 70%, #100B07 100%)`
   Provide it as a token (e.g. `--lamp-glow`). This single change is most of the effect.
2. **Vignette.** Darken the outer edges to pull the eye inward:
   `inset 0 0 170px 55px rgba(0,0,0,0.55)` on a non-interactive overlay (`::after`, `pointer-events:none`).
3. **Grain.** A static ~5% film-grain overlay to give the surface material. Implemented as a data-URI SVG `feTurbulence` (`baseFrequency ~0.9`), `opacity: 0.05`, `mix-blend-mode: overlay`, `pointer-events:none`. Static, so reduced-motion-safe by definition and ~free on mobile.
4. **Glints.** A 1px warm top-edge highlight on cards (`inset 0 1px 0 rgba(255,228,190,0.07)`) — light hitting the lip — and a faint warm bloom on the brass button (`box-shadow: 0 0 22px rgba(232,116,46,0.22)`) so it reads as catching lamplight rather than floating on glass.

**Guardrails:** nothing here animates. Under `prefers-reduced-motion` everything is already static, so no change needed — but verify no motion is introduced. Watch mobile paint cost: these are CSS gradients/shadows and one tiny tiled SVG; do not add real-time blur or canvas effects.

---

## 6. Typography

Unchanged from `ui-redesign-spec.md` §6 — Newsreader (display/prose), Figtree (UI), Courier Prime (timer/counters), all bundled offline via @fontsource. The wordmark uses Newsreader 500. Counters/word-counts stay Courier Prime. No new faces.

---

## 7. Voice

A calm writing partner: encouraging, specific, no exclamation marks, sentence case everywhere except where a small eyebrow label is set. Buttons name what happens. Empty states are invitations. (Full microcopy table is in `ui-redesign-spec.md` §9; keep "Ember" out of UI body copy — the app refers to itself by name only in the wordmark and the manifest, not in running text.)

---

## 8. Tickets for Claude Code (B-stream)

Branch per ticket off `m1-creative-flow` (pattern `b1-icon-set`). Run `pnpm install` and the relevant build before declaring done. These extend the visual work; keep the §4 accent rule and §5 motion guardrails in every one.

- **B1 — Icon set & favicon.** From `ember-mark.svg` / `ember-icon.svg`, generate and wire: `favicon.svg` + `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), and PWA icons (192, 512, plus a 512 maskable from `ember-icon.svg` with safe padding). Reference them from `index.html` and the web manifest. *DoD:* tab favicon, iOS add-to-home, and the installed PWA all show the flame; the flame reads clearly at 16px.
- **B2 — Wordmark / rename swap.** Replace every user-facing "Writer Studio" with the Ember lockup or the word "Ember": launcher eyebrow → the reusable lockup component (§3); document `<title>`; PWA manifest `name`/`short_name`; `theme_color`/`background_color` = `#161210`. *DoD:* no "Writer Studio" string remains in any rendered screen, tab title, or install prompt; the launcher shows the title-case lockup with the raised mark.
- **B3 — Atmosphere pass.** Apply §5 (light source, vignette, grain, glints) across all screens via shared tokens/classes. *DoD:* every screen reads as lamplit — warm pool of light, edges falling to shadow, faint grain, glints on cards and the brass button; no animation introduced; reduced-motion verified.
- **B4 — Ember accent wiring.** Add the §4 tokens; warm the running-timer hairline from brass to `--ember`; render the finish count-up number in `--ember`. Audit that orange touches nothing clickable. *DoD:* a live sprint shows an orange hairline and an orange finish count; no interactive element uses orange; brass remains the sole action color.

---

## 9. Sequencing

Slot the B-stream alongside the W5 responsive pass already next in the master order. Suggested:

| Order | Ticket | Note |
|---|---|---|
| 1 | B2 wordmark swap | Kills the stale name immediately; tiny, high-value. |
| 2 | B1 icon set | Pairs with W4 PWA work; the manifest is touched by both — do them adjacent. |
| 3 | B3 atmosphere | The big visible lift; pure styling via tokens. |
| 4 | B4 accent wiring | Small; lands cleanly after B3's tokens exist. |
| — | W5 responsive | Runs in/around the above; B3's tokens should be mobile-tested as part of W5. |

After B1–B4 + W5, fold a "Brand sanity" line into `docs/release-checklist.md`: flame favicon present, one brass action per screen, orange only on live/finish states, lamplit atmosphere on every screen, reduced-motion clean.

---

## 10. Hard guardrails (re-read before each B-ticket)

1. Brass is the only action color — one per screen. Orange is "alive," never clickable.
2. Nothing in the atmosphere or accent layer animates (except the already-approved timer hairline and the single finish-moment count-up).
3. The mark is one shape with the canonical gradient — no added glow object, no outline, no flat recolor, no non-proportional scaling.
4. The tagline stays "A collaborative writing studio."
5. No new dependencies beyond what the PWA/icon generation in B1 needs; no new fonts.
6. Keep the lockup geometry in one reusable component with the lift as a single variable, so the v1 → final polish is a one-line change.

---

## Revision 2 (2026-06-13) - Logo, tagline & asset reconciliation

Reflects decisions made after the original spec. **Supersedes Section 2 (The mark) and Section 3 (The lockup) above**, and supersedes the stale "WRITER STUDIO" launcher name in `ui-redesign-spec.md` Section 9 (the live wordmark is "Ember", shipped in B2). The S-twist flame is retired as the primary mark; `ember-mark.svg` / `ember-icon.svg` remain only as fallback util sources until the vector companion (B5) lands.

### 2R. The mark (replaces Section 2)

A hand-brushed, glowing lowercase script "e" - one calligraphic flame-stroke that reads as both a cursive "e" and an ember. Warm orange, visible brush texture, soft glow on dark.

- Primary asset: `apps/desktop/public/brand/Ember Logo Final 1.png` (raster, transparent bg).
- Nature & limits: this is a raster glow - the hero/identity asset, beautiful at display size. It does NOT reduce to a 16px favicon, cannot be recolored, and has no meaning on light/paper surfaces. A clean vector + flat monochrome companion is required (B5) before B1 (icons) can be built.

### 2R-rule. Threshold-only usage

The glowing mark is a threshold element. Allowed: launcher/splash, login, loading state, external marketing. Forbidden: appearing (glowing) inside the working chrome during a session - sprint page, beat wizard, board, etc. A glowing object in the periphery breaks the low-stimulation thesis (guardrail #4). Inside the app, identity is the wordmark + the flat monochrome mark, never the glow.

### 3R. The lockup (replaces Section 3)

- Display lockup (threshold): the glowing script-"e" above or left of the wordmark "Ember" in Newsreader 500. Brushed mark + literary serif is an intentional "handmade sign on a composed room" pairing - keep generous clear space.
- In-app / small / monochrome lockup: the flat single-color vector "e" (B5) beside "Ember", no glow. Used everywhere inside the product and anywhere the logo must go flat or tiny.
- One reusable component; mark/gap/lift stay single variables (per 10.6).

### Asset architecture (target)

1. Hero PNG (have) - threshold + marketing, display size only.
2. Clean vector "e" (B5) - favicon, app/PWA icons, in-app mark, any recolor/scale.
3. Flat monochrome variant (B5) - single-color in-app, light backgrounds, print.

### New / updated tickets

- B5 - Vector + monochrome companion (NEW; blocks B1). Trace the script-"e" into a clean SVG legible at 16px; produce a flat single-color variant; remove the residual Gemini sparkle watermark (bottom-right of the hero PNG) and export an optimized web-sized PNG (the 6.4MB source is far too large to ship). DoD: an SVG mark legible at 16px, a monochrome variant, and a watermark-free optimized hero PNG, all in public/brand/.
- B1 - Icon set (updated): generate favicon / apple-touch / PWA icons from the B5 vector, not the raster.
- B2 - Wordmark (done): the lockup component renders the display lockup at the threshold and the flat lockup in-app per 3R; wire the real mark once B5 lands.

### Tagline

North star **"A collaborative writing studio"** is retained as the vision statement (names the roadmap: solo -> AI tutor -> collaborative platform); stays on the about page and in positioning.

A separate, benefit-led hero line is recommended for acquisition surfaces only. Owner constraint: any hero line must be no longer than the north star, not sales-y, trading on subtlety / humanity / wit (AI-skeptical audience). Committee shortlist, lead first:

1. "You do the writing." - the quiet inversion: every AI tool offers to write FOR you; Ember hands it back. Same length, punchier, anti-pitch (promises work, not magic), never says "AI" - the dig is implied. [lead]
2. "Still your words." - three words; in an era of machine-made prose, the words stay yours. Understated, a little wry.
3. "For people who write." - the line between writers and prompters, without naming the enemy. Dry.
4. "Mind the spark." - the "mind the gap" echo; protective of the creative flame; warm, playful. (Ember-metaphor lane.)
5. "An unhurried writing studio." - minimal-change option: keeps the exact shape and un-salesy tone, swaps the overpromising "collaborative" for the true-today "unhurried".

Pending: quick availability/trademark scan on the chosen line. Decision: owner's. Committee recommendation: "You do the writing." as hero line; keep the north star as the vision.

---

## Decision (2026-06-13): hero tagline

Owner selected **"For humans who write"** as the working hero tagline for acquisition surfaces (landing hero, app store, social). Chosen for fit with the AI-skeptic, humanity-valuing audience: "humans" turns the writer-vs-prompter distinction into a quiet human-vs-machine allegiance, while staying four words and un-salesy.

- North star **"A collaborative writing studio"** is retained as the vision statement (about page, positioning, internal).
- This is a brand/marketing line, not in-app chrome: the launcher keeps its own copy and the bare wordmark "Ember"; the tagline is not pinned into the working UI.
- Pending before public use: quick availability/trademark sniff ("for humans" is a common sentiment - fine for a tagline, would not work as a name).
- Status: "for now" - revisit when the collaborative/social features ship and the front-facing story can widen.
