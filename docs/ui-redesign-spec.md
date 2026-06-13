# UI Redesign Spec — "The Lamplit Desk"

**Status:** Approved plan, ready for implementation
**Audience:** Claude Code (read AGENTS.md and PROJECT_RULES.md first; this doc authorizes specific exceptions)
**Scope:** Visual/interaction redesign of all 7 screens. No feature logic changes except where a D-ticket explicitly says so.
**Companion work:** The A-ticket fix list (autosave, file persistence, beat completion, nudge reset, sprint bridge) is separate. See "Sequencing" at the bottom for how D-tickets interleave with A-tickets.

---

## 1. The brief, distilled

From `docs/north-star.md`: *a writing studio that keeps you moving one step at a time. It does not write for you.*

The owner's added constraint: **a flat, dull UI is itself a distraction.** The target user (ADHD, prone to blocks) needs LOW ambient stimulation while writing but HIGH warmth and craft everywhere else — the app must feel like a place worth sitting down in. Testers should open the launcher and *want* to start the next piece of writing.

Design must therefore do four jobs:
1. Make the writing surface the most inviting object on screen.
2. Make "what do I do next" visually unmissable (one primary action per screen).
3. Reward completion without circus (one celebration moment, done well).
4. Look crafted within 5 seconds of launch — testers judge instantly.

---

## 2. Pass 1 — Independent reviews

### 2a. Creative Director (identity, mood, signature)

**Findings on current build:**
- Palette (`#1a1a2e` navy + `#e94560` red-pink) is the default "dev dashboard dark." It reads as a crypto tracker or game launcher, not a writing room. Worse: the primary action color is an *alarm* hue — every CTA raises arousal, the opposite of settling in to write.
- Zero identity. No wordmark treatment, no signature element, no material metaphor. The launcher is three stacked buttons — functionally a debug menu.
- System font stack is the single loudest "weekend project" tell. In a writing app, type IS the product surface.

**Proposed direction: "The Lamplit Desk."** A writing room at night. Warm ink-dark chrome (espresso, not navy), and one radical move: **the page is the light source.** When it's time to draft prose, a warm paper-toned writing surface glows against the dark chrome — eyes go to it involuntarily, like a lit page under a desk lamp. Planning screens stay in the warm dark; the page lights up only when you write. The signature behaves as information: *light = draft now.*

Accent system drawn from the desk: brass (lamplight) for primary actions, ink for structure, paper for prose, clay for cautions, brick reserved solely for "Discard."

### 2b. UX / ADHD-accessibility specialist (flow, load, motion)

**Findings:**
- Launcher: two equal-weight CTAs + a disabled "Coming Soon" button = three-way attention split before a single word is written. The disabled button is attention residue.
- Sprint textarea does not autofocus. An app promising words-in-2-minutes makes you click into the box.
- Structure Board status is text chips ("EMPTY/STARTED") — requires reading, not glancing. Beat Wizard's "All Beats" pills carry no progress information beyond color.
- Spacing is inconsistent (heavy inline styles, ad-hoc rem values) which reads as visual noise even when no single element is loud.
- The timer-finish card interrupts at the worst moment. No completion payoff anywhere (no word count, no acknowledgment).
- Nothing currently violates the "no auto-rotation / non-animated hints" guardrails — preserve that.

**Rules to encode:**
- Motion fires only on user action or task completion. Nothing ambient, nothing looping. 150–250ms, ease-out. One 420ms "finish moment" is the single permitted celebration. `prefers-reduced-motion` collapses everything to opacity/instant.
- One brass-filled button per screen, maximum. Everything else is ghost/quiet.
- Progress must be glanceable: ink-fill dots (empty ring → half → solid), not words.
- The returning-user launcher should weaponize the writer's own prose: show the last line they wrote, set beautifully. Re-reading your own last sentence is the oldest unblocking trick there is — make the UI perform it.

### 2c. Visual systems designer (tokens, type, feasibility)

**Findings:**
- `index.css` already uses CSS variables — good bones. The fix is replacing the variable *values* and adding a thin component layer, not a framework migration. **Do not add Tailwind**; it violates the minimal-change rule and the existing class system extends cleanly.
- Pages lean on inline styles. Full de-inlining is out of scope creep; instead, de-inline *only* the screens each D-ticket touches, replacing with the new component classes.
- Typography plan (three faces, three jobs, all offline-bundled via @fontsource — no CDN calls in a desktop app):
  - **Newsreader** (variable) — display + prose. Designed for on-screen reading, warm editorial voice, a genuinely beautiful italic for the "last line" lure. Deliberately not Playfair/Crimson (overused defaults).
  - **Figtree** (variable) — all UI: labels, buttons, body, notes. Friendly humanist sans, quieter than Inter-everywhere.
  - **Courier Prime** — timer digits, word counts, beat numbers. The screenwriter's monospace; the owner writes screenplays. Counters become a typewriter motif instead of dashboard digits. Use weight 400/700; tabular by nature.
- Semantic distinction worth enforcing: **serif-on-paper = prose; sans-on-dark = planning.** Beat notes stay sans (they're scaffolding); sprint drafting gets the full paper treatment.

### 2d. Voice / microcopy editor

**Findings:**
- Tone is inconsistent: "write fast, then save or discard" (good, kinetic) vs. "You've used 3 nudges - write for 3 minutes before asking for more" (a coach with a whistle).
- Voice principle: **a calm writing partner.** Encouraging, specific, zero exclamation marks. Buttons name what happens. Empty states are invitations, not absences.
- Every screen gets a copy pass in its D-ticket; the canonical table is §9.

---

## 3. Pass 2 — Cross-critique and resolutions

**Conflict 1 — UX challenges CD's light page on dark chrome:** "The brightness jump could be harsh at night — the bad kind of stimulating."
**Resolution:** Page tuned to warm off-white `#F3EDE1` (never pure white), edges softened with a 24px warm glow instead of a hard border, and chrome behind an active page dims one step (focus vignette). Fallback variant (elevated warm-dark page, light text) is one token-set swap if the owner dislikes it in practice — but ship the light page; it IS the thesis.

**Conflict 2 — Visual designer challenges UX's "no ambient motion" (the timer is ambient by nature):**
**Resolution:** Timer digits change with zero animation. The only continuous element is a 2px hairline under the timer that drains smoothly — task state, not decoration. Under `prefers-reduced-motion` it steps once per minute.

**Conflict 3 — CD wants the Resume card as launcher hero; UX asks what first-run testers see:**
**Resolution:** Launcher has two explicit states. First-run hero = "Start writing" (sprint) with one quiet line of invitation. Returning hero = Resume card with the last written line in Newsreader italic. Both states show exactly one brass button.

**Conflict 4 — Voice flags the nudge-lockout copy; the A-ticket list already implements a real 3-minute reset:**
**Resolution:** Copy becomes "Nudges return after a few minutes of writing." (D-ticket styles it; A-ticket implements the timer. If the A-ticket hasn't landed yet, keep current logic, new copy.)

**Conflict 5 — Everyone vs. scope: does beauty block durability?**
**Resolution:** No. D1–D2 (tokens, fonts, components) touch no logic and can land immediately. Screen redesigns (D3+) land after autosave (A1) so testers get safety and beauty in the same build.

**Unanimous calls:** kill the disabled "Open Existing Project" button; brass replaces alarm-red everywhere; brick appears on exactly one control in the entire app (Discard); the Academic tile on Create Project stays visible but reads as "later," not broken.

---

## 4. Decision summary

- **Thesis:** The page is the light source. Warm-dark chrome everywhere; a glowing paper surface appears exactly when it's time to draft prose.
- **Signature elements:** (1) the lit page; (2) ink-fill progress dots and the brass ink-line that draws itself as beats fill; (3) the finish moment — word count set in Courier Prime, counting up once.
- **One risk, spent deliberately:** the light-on-dark page. Everything else stays quiet and disciplined.

---

## 5. Token system (paste-ready)

Replace the `:root` block in `apps/desktop/src/index.css` with:

```css
:root {
  /* Ink — chrome and structure (warm, never blue) */
  --ink-950: #161210;   /* app background */
  --ink-900: #1F1A16;   /* cards, surfaces */
  --ink-800: #2A241E;   /* raised surfaces, hover, notes textarea */
  --ink-border: #332C25;
  --ink-border-strong: #453B31;

  /* Text on dark */
  --text-hi: #EDE6DA;
  --text-mid: #B5A998;
  --text-low: #80766A;

  /* Paper — the lit page (prose surfaces only) */
  --paper: #F3EDE1;
  --paper-dim: #E9E1D2;        /* page footer bar, inset wells */
  --ink-on-paper: #2B2014;     /* prose text */
  --ink-on-paper-low: #8A7C68; /* page metadata, placeholder */
  --paper-glow: 0 0 0 1px rgba(243,237,225,0.06), 0 4px 32px rgba(212,162,78,0.10), 0 2px 12px rgba(0,0,0,0.45);

  /* Brass — lamplight, primary action (exactly one per screen) */
  --brass: #D4A24E;
  --brass-hover: #E2B468;
  --brass-press: #C2913F;
  --on-brass: #1C1610;
```

```css
  /* Semantics */
  --sage: #93B08C;      /* success, saved, complete */
  --clay: #C97B5A;      /* warnings, sentence nudge */
  --brick: #B5543F;     /* destructive — Discard only */

  /* Type */
  --font-display: 'Newsreader Variable', Georgia, serif;
  --font-prose:   'Newsreader Variable', Georgia, serif;
  --font-ui:      'Figtree Variable', system-ui, sans-serif;
  --font-mono:    'Courier Prime', 'Courier New', monospace;

  /* Scale (px equivalents): display 28, title 19, body 15, small 13, micro 11 */
  /* Prose: 17/1.7 Newsreader. Timer: 32 Courier Prime. */

  /* Spacing: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 only. No ad-hoc values. */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  --radius-sm: 6px;   /* inputs, pills */
  --radius-md: 10px;  /* cards, page */

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --t-fast: 150ms; --t-state: 220ms; --t-moment: 420ms;
}
```

Keep legacy variable names (`--color-primary` etc.) as aliases to the new tokens during migration so untouched screens don't break; remove aliases in D8.

---

## 6. Typography rules

| Role | Face | Size/line | Notes |
|---|---|---|---|
| Page titles | Newsreader 500 | 28/34 | Slight negative tracking (-0.01em) |
| Eyebrows/labels | Figtree 600 | 11/16, caps | letter-spacing 0.07em, --text-low |
| Card titles | Figtree 600 | 19/26 | --text-hi |
| UI body | Figtree 400 | 15/22 | --text-mid for descriptions |
| Prose (sprint page) | Newsreader 400 | 17/1.7 | --ink-on-paper, max-width 68ch |
| Last-line lure | Newsreader 400 italic | 17/1.6 | opsz low, on paper-toned inset |
| Beat notes | Figtree 400 | 15/24 | Notes are scaffolding, never serif |
| Timer / counters | Courier Prime 400 | 32/1 (timer), 13 (counts) | Never animated digit-by-digit except the one finish moment |

Font install (the ONLY new dependencies this spec authorizes):
`pnpm add @fontsource-variable/newsreader @fontsource-variable/figtree @fontsource/courier-prime` (in `apps/desktop`). Import in `main.tsx`. Verify the app runs fully offline afterward.

---

## 7. Motion & accessibility guardrails

- Motion only on user action or completion. Nothing loops, nothing auto-plays, nothing rotates. (Extends the existing nudge/hint rules in `docs/roadmap-stage2.md`.)
- Durations: --t-fast hover, --t-state for state changes, --t-moment reserved for the sprint-finish card only.
- `@media (prefers-reduced-motion: reduce)`: transitions become opacity-only or instant; timer hairline steps per minute; finish count-up renders final number immediately.
- Focus: 2px brass `outline-offset: 2px` focus-visible ring on every interactive element. Never remove outlines without replacement.
- Contrast: all text ≥ 4.5:1 against its surface (--text-low is for non-essential metadata only, ≥ 3:1, never for instructions).
- Hit targets ≥ 36px tall. Keyboard: Enter submits the obvious thing on each screen; sprint textarea autofocuses (also an A-ticket; D4 includes it if not yet landed).

---

## 8. Component inventory (new `components` layer in index.css)

- **.btn-brass** — brass fill, --on-brass text, --radius-sm. The one primary per screen. Hover lightens, press darkens + 1px translate-y.
- **.btn-ghost** — transparent, 1px --ink-border, --text-hi. Secondary actions.
- **.btn-quiet** — borderless, --text-mid, underline on hover. Tertiary (Back links become this).
- **.btn-brick** — brick outline → brick fill on hover. Discard only. Never adjacent-touching the primary; min --space-4 gap.
- **.card** — --ink-900, 1px --ink-border, --radius-md, plus `inset 0 1px 0 rgba(237,230,218,0.04)` top highlight (light from above — the lamp).
- **.eyebrow** — the caps label style from §6.
- **.paper-page** — --paper background, --radius-md, --paper-glow shadow, padding --space-8, prose typography inside.
- **.status-dot** — 10px circle. Empty: 1.5px --ink-border-strong ring. Started: bottom-half filled --brass (a half-dipped ink dot via gradient). Done: solid --sage. Always paired with text label for a11y.
- **.ink-line** — 2px brass progress line, rounded caps, width transitions --t-state. Used in Beat Wizard rail and Project Home.
- **.hairline-timer** — 2px --ink-border track with --brass fill draining right-to-left.
- **.saved-stamp** — small --sage text that fades in --t-fast and out after 2s; replaces the current double "Saved" (button label AND adjacent span — pick the stamp, fix the button label back to "Save notes").
- **.nudge-slip** — small card tucked under the page's top edge, 1px --clay border, --ink-800 fill. Appears with a 6px slide, --t-state.

---

## 9. Microcopy (canonical; apply per screen)

| Where | Current | New |
|---|---|---|
| Launcher title | Writer Studio | WRITER STUDIO (eyebrow) over a Newsreader line: "The page is ready when you are." |
| Launcher CTA | Start Writing (Quick Sprint) | Start writing |
| Launcher secondary | Create New Project | Plan a project |
| Resume card meta | — | "Last touched 3 days ago · Next: The Catalyst" |

| Sprint subtitle | Pick a timer, write fast, then save or discard. | Timers are optional. The page isn't. |
| Timer helper | Timer is optional. Start one when you want, or just write. | (delete — subtitle covers it) |
| Nudge empty | Need a push? Ask for one nudge when you need it. | Stuck? Take one nudge. |
| Nudge lockout | You've used 3 nudges - write for 3 minutes before asking for more. | Nudges return after a few minutes of writing. |
| Idle hint | No typing for a minute. Tap Get Nudge for a prompt. | A minute of quiet. A nudge is there if you want one. |
| Finish (timer) | Time is up. | Time. {n} words in {m} minutes. |
| Finish (manual) | Sprint finished. | {n} words down. |
| Finish actions | Save as Project / Discard | Keep going (+5 min) · Save to project · Discard |
| Beat notes label | (bullets and fragments only) | Bullets and fragments — sentences are for the page. |
| Sentence warning | These lines look like full sentences... | These read like finished sentences. Save them for the draft, or keep them here: |
| Board empty beat | No notes yet | No notes yet — one bullet is enough. |
| Beat CTA | Continue Writing | Next beat: {beat name} |
| Academic tile | Coming soon | Arriving in Stage 2 |

Voice rules: sentence case everywhere except eyebrows. No exclamation marks. Buttons say what happens. Numbers in Courier Prime.

---

## 10. Per-screen specs

### D3 — Session Launcher ("The Desk")
Two states, both: centered column max 480px, eyebrow wordmark, Newsreader display line.
- **First run:** one brass "Start writing" (autofocus on mount so Enter starts a sprint), ghost "Plan a project" below, one line of --text-mid invitation copy. Nothing else.
- **Returning:** hero Resume card — project title as eyebrow, the last written line (last non-empty line of `sprintText`, else most recent beat note) in Newsreader italic on a `--paper-dim`-toned inset strip, meta line per §9, brass "Resume" routing to sprint (if sprintText exists) or current beat. Recent projects below as quiet rows (title + relative time), max 4. **Delete the disabled "Open Existing Project" button.**
- Optional greeting eyebrow computed once on mount by local hour ("THE LATE SHIFT" after 21:00, "FIRST LIGHT" before 7:00, else the wordmark). Static — never updates live.

### D4 — Quick Sprint ("The Page")
The centerpiece. Layout: slim top bar / the page / slim bottom bar.
- **Top bar (one row, --ink-900):** timer presets as three quiet pills + custom field collapsed behind a "Custom" pill; Courier Prime clock right-aligned; .hairline-timer beneath the bar when running. Inactive timer shows no `--:--` placeholder — just the pills.
- **The page:** .paper-page, centered, max-width 68ch, min-height 60vh. Textarea styled invisible on paper (no border, no focus box — the page IS the field; focus state = glow intensifies one step). Autofocus. Prose typography per §6. Word count bottom-right *on* the page in --ink-on-paper-low Courier Prime 13 — present, never animated while typing.
- **Nudges:** "Take a nudge" quiet button in top bar; result renders as .nudge-slip tucked under the page's top edge. Idle hint appears in the same slip position only after first keystroke + 60s quiet (gating is an A-ticket; style here).
- **Chrome dimming:** while the textarea has focus, top/bottom bars drop to 70% opacity (--t-state); restore on blur or hover.
- **Finish moment (the one --t-moment):** page dims one step, finish card rises 12px into view; word count counts up over 420ms in Courier Prime; actions per §9 with "Keep going (+5 min)" as the brass button — saving is the ghost, continuing is the invitation. Reduced-motion: instant, final number.

### D5 — Beat Wizard ("The Workbench")
- Header: eyebrow "BEAT 4 OF 8 · ACT 2 · STORY CIRCLE", beat name as page title, prompt as --text-mid lede. No card around the prompt — let it breathe.
- Notes textarea: --ink-800 surface (deliberately NOT paper — bullets are scaffolding), Figtree 15, monospace bullet glyphs not required.
- Sentence warning: .nudge-slip styling in --clay, copy per §9, "Keep anyway" as .btn-quiet. **Style only** — the save-blocking removal is an A-ticket.
- Bottom rail replaces the "All Beats" pill cloud: a horizontal .ink-line track with one .status-dot per beat sitting on it, current beat's dot ringed in brass, beat name under the current dot only. Click a dot to jump (existing behavior). The line's brass fill extends to the furthest started beat.
- Nav row: Previous (.btn-ghost) · Save notes (.btn-brass with .saved-stamp) · Next beat (.btn-ghost; becomes "Finish → Board" brass on last beat — exception to one-brass rule is acceptable here since Save converts to quiet once stamped... no: keep Save as the brass, Finish as ghost. One brass, always.)

### D6 — Structure Board ("The Corkboard at Night")
- Act headers as eyebrows with a hairline rule extending right.
- Beat cards: .card with .status-dot top-right (replaces text chips), notes preview unchanged, NEXT badge becomes a small brass bookmark tab breaking the card's top edge.
- Card actions: "Open" (.btn-ghost, full width) — "Set as next" appears as .btn-quiet on hover/focus-within only, reducing each card to one resting action.
- "Continue writing" in the header becomes brass "Next beat: {name}".

### D7 — Structure Wizard, Create Project, Project Home (polish pass)
- **Structure Wizard:** question options become selectable .cards with a brass left rule on hover/selected; progress as four .status-dots under the title. Recommendation step: primary framework card gets eyebrow "THE LIBRARIAN'S PICK" + 3px brass left border; alternate stays quiet; full list behind a .btn-quiet "See all frameworks". Beat preview list sits on an --ink-800 inset with eyebrow "PREVIEW — you'll fill these in next" (preserves P2's preview-only intent visually).
- **Create Project:** title input on a .paper-page-styled single-line field? No — keep dark; paper is for prose. Two type tiles as .cards, Creative selectable with brass border when active; Academic at 60% opacity with "Arriving in Stage 2" — visibly *later*, not broken. Continue (.btn-brass) disabled until title; Cancel becomes .btn-quiet.
- **Project Home:** becomes a true hub: title display, then ONE brass action computed from state ("Next beat: {name}" if plan exists, "Choose a structure" if not, "Resume sprint" if only sprintText). .ink-line under the structure card showing beats-started ratio. Sprint draft preview gets a small .paper-page (it's prose) capped at 6 lines with a fade-out mask + "Open sprint" quiet link.

---

## 11. Tickets for Claude Code

Branch per ticket off `m1-creative-flow` (pattern: `d1-foundations`). Run `pnpm install` and `pnpm dev` before declaring any ticket done. Screenshot the affected screens into `docs/screenshots/` (create it) named `{ticket}-{screen}.png`.

- **D1 — Foundations.** Add the three @fontsource deps (§6 — the only new deps authorized). New token block (§5) with legacy aliases. Wire fonts in `main.tsx`. Update base element styles (body, .page, headings) to new tokens/faces. *DoD:* app launches offline, every screen renders legibly, no layout breakage, fonts visibly active.
- **D2 — Component layer.** Implement §8 in `index.css` (or split `components.css` imported after tokens). Global focus-visible rule and reduced-motion block (§7). Touch no page files except where a class must replace a broken legacy reference. *DoD:* all §8 classes exist and render correctly when manually applied; legacy screens unaffected.
- **D3 — Launcher.** Per §10. Includes deleting the dead button. *DoD:* both launcher states match spec; Enter starts a sprint on first-run; keyboard path clean.
- **D4 — Quick Sprint.** Per §10 incl. finish moment + autofocus. Coordinate with A-tickets (autosave/keep-going logic); if A-tickets are unmerged, build the visual shell with current logic and leave `// A-TICKET:` markers. *DoD:* full sprint flow matches spec with motion rules honored; reduced-motion verified.
- **D5 — Beat Wizard.** Per §10. Style-only on the warning. *DoD:* rail reflects beat statuses live; saved-stamp replaces the double "Saved"; one brass per state.
- **D6 — Structure Board.** Per §10. *DoD:* glanceable dots, hover-revealed secondary actions keyboard-accessible (focus-within), bookmark NEXT.
- **D7 — Wizard + Create + Home.** Per §10. *DoD:* one brass per screen; Academic reads as deferred; Project Home's single computed action correct in all three states.
- **D8 — Sweep.** Remove legacy aliases and dead CSS; contrast audit (§7); de-inline stragglers on touched screens only; full screenshot set; update `docs/release-checklist.md` with a "Visual sanity" section (fonts load offline, one brass per screen, reduced-motion works). *DoD:* checklist updated, zero references to old hex values outside git history.

---

## 12. Sequencing against the A-ticket fix list

| Order | Ticket | Why |
|---|---|---|
| 1 | A1 autosave, A2 file persistence | Durability before testers. Non-negotiable. |
| 1 (parallel) | D1, D2 | Pure foundations; no logic, no conflicts. |
| 2 | D4 + A-tickets touching sprint (autofocus, keep-going, nudge reset, word-count finish) | Same screen — land together to avoid double work. |
| 3 | D3, D5, D6, D7 | Any order. D3 benefits from A3 (resume data). |
| 4 | A-beat-completion ("Mark done") | Lands best after D5/D6 dots exist. |
| 5 | D8 | Always last. |

## 13. Hard guardrails (Claude Code: re-read before every ticket)

1. No dependencies beyond the three fonts in §6. No Tailwind, no UI kits, no animation libraries.
2. No feature-logic changes inside D-tickets unless the ticket text says so. Style-only means style-only.
3. One brass-filled control per screen. If a design choice forces two, the design choice is wrong.
4. Nothing animates without user action, except the timer hairline and the single finish moment.
5. Brick color appears on Discard and nowhere else.
6. Paper surfaces carry prose only. Planning stays on ink.
7. Keep changes minimal per AGENTS.md; stop at DoD.

## 14. Definition of done for the whole overhaul

A first-time tester launches the app and, within five seconds, can identify exactly one thing to click. Within two minutes they are typing on a glowing page in a quiet dark room. When they finish, the app tells them what they made and offers more time before it offers an exit. Nothing on any screen blinks, rotates, or asks for attention it hasn't earned. It looks like someone cared — because four someones argued about it.
