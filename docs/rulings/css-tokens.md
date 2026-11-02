# Rulings: `apps/desktop/src/styles/01-tokens.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[tokens §n]` points here.

## tokens §1

From `apps/desktop/src/styles/01-tokens.css`, line 25 at `25112784` (the comment that stays: "the faint text tier is dark enough to clear 4.5:1 on the paper and on the card stock").

```css
/* faint-text-sweep (Fable, Oct 16: "the -low tier you flagged") — #8A7C68
     measured 3.49:1 against this theme's own --paper and 3.77:1 against
     --card-stock (card-label-contrast's own cream), both under the 4.5:1
     floor: every placeholder/ghost-text/page-title/word-count/footer that
     paints from this tier was faint by defect, not by design (the ONE
     deliberately faint exception, .fl-affordance/.fl-prompt/.fl-never's own
     opacity .55-.75, is untouched — that fade is a named choice, F6's own
     comment, not this tier's base colour). Darkened to the exact value
     --ink-on-card-meta already proved safe on cream (card-label-contrast):
     5.34:1 on --paper, 5.77:1 on --card-stock. */
```

## tokens §2

From `apps/desktop/src/styles/01-tokens.css`, line 37 at `25112784` (the comment that stays: "the four desk inks: a stroke stores the ink NAME, and --ink-walnut equals --ink-stroke so a stroke with no ink paints the same; Flux inherits the four").

```css
/* ITEM 121 I1/I4 — THE DESK'S FOUR INKS (item83-ink-pass.md §0.5: "a journal
     has the inks on the desk", never a colour picker). Plateau's four, named
     by the pass itself: walnut · iron · oxblood · sea. Strokes store the NAME,
     not the value (types/index.ts's StrokeInk), so a theme pack re-points
     these four and every stroke ever drawn re-colours with it.
     --ink-walnut IS --ink-stroke's own value, byte-for-byte, and that is
     load-bearing rather than a coincidence: an OLD stroke (no `ink` field)
     paints through --ink-stroke and a NEW stroke that chose walnut paints
     through this, so the default and the first swatch are the same ink and a
     page drawn before this ticket is pixel-identical after it. --ink-stroke
     itself is deliberately NOT redefined here — the whole no-migration
     argument rests on it not moving.
     ITEM 121 S0 §5.3 — THE FLUX VALUES ARE A STOP, HELD FOR NICK. No ruling
     or canon names an ink for any theme but Plateau, and TH2 explicitly
     declined to give Flux a pen ink at all ("Journal ink is its own sealed
     domain, out of TH2's scope", below). Flux therefore INHERITS these four
     rather than this lane inventing a theme's colours. Four values in one
     existing block whenever the word comes; no component line moves. */
```

## tokens §3

From `apps/desktop/src/styles/01-tokens.css`, line 70 at `25112784` (the comment that stays: "a card-scoped ink pair: the card stock stays cream in every theme, so card text cannot follow --ink-on-paper, which flips light on a dark page").

```css
/* flux-card-ink (Chat 1 ledger 47, Nick: Flux dark board, "nearly
     unreadable") — --card-stock is left un-themed on purpose (above): it's
     the SAME cream in every theme/tone. --ink-on-paper is NOT un-themed —
     Flux's dark page deliberately flips it light (#E3F1EC) to read against
     its own dark --paper, and a card's text/footer/label colour was wired
     straight to --ink-on-paper, which assumed that ink always lands on a
     light surface. It doesn't in Flux dark: the card still sits on the
     cream stock above, a light ink on a light ground. A card-scoped ink
     pair, aliased to --ink-on-paper/-low everywhere this is already true
     (Arbor, Flux light) and overridden only where it wasn't (Flux dark,
     below) — zero visual change outside that one tone. */
```

## tokens §4

From `apps/desktop/src/styles/01-tokens.css`, line 83 at `25112784` (the comment that stays: "card footer, badge and excerpt inks: one value each, readable on the cream card stock in every theme").

```css
/* card-label-contrast (Fable: Nick kept the footers, so they must be
     readable) — .board-card-footer/.board-layer-toggle/.board-pin-badge/
     .board-pin-excerpt (folded in, same ask, same rule) painted straight
     from the dark-chrome text tiers (--text-low/--text-mid/--accent-rest),
     tuned for --ink-900-family surfaces, not this card's own --card-stock.
     Since --card-stock is itself left un-themed (above), ONE value each
     clears the floor in every theme by construction, no per-tone
     divergence needed (unlike flux-card-ink's --ink-on-card just above,
     which genuinely flips light/dark by theme because --ink-on-paper
     does). --ink-on-card-meta is a darker step of --ink-on-paper-low's
     own warm-taupe family (~5.8:1 on --card-stock); --badge-on-card
     reuses the pin-grab gradient's own hand-darkened olive rim stop
     verbatim (#4F5730, below, ~7.1:1) rather than inventing a second
     olive the pin's own sphere doesn't use. */
```

## tokens §5

From `apps/desktop/src/styles/01-tokens.css`, line 104 at `25112784` (the comment that stays: "--choice colours a chosen, pressed or selected state: brass in Arbor, cyan in Flux").

```css
/* FLUX V2 (Fable's ruling): brass stays locked. CHOICE is the colour of a chosen / pressed / selected state: the same brass in Arbor, cyan under Flux. The selection selectors point here. */
```

## tokens §6

From `apps/desktop/src/styles/01-tokens.css`, line 115 at `25112784` (the comment that stays: "the active mode tab: brightened ink and a 1px olive hairline, no brass fill; a token, so the hue can change without touching a component").

```css
/* AB2 S7 — Nick's rulings, 2026-07-14: the mode strip's active tab loses
     its brass fill for a quieter resting register — brightened ink + a 1px
     olive hairline. A NEW token slot (the established theme seam pattern —
     store/theme*.ts's own convention, zero component edits to re-point it);
     the Plateau foundations doc locks the final hue and may change the
     value below without touching components/ModeStrip.tsx or index.css's
     selectors. Working value only. */
```

## tokens §7

From `apps/desktop/src/styles/01-tokens.css`, line 124 at `25112784` (the comment that stays: "the help "?" colour, never brass (brass means the current choice); Arbor aliases --accent-rest, Flux sets its own").

```css
/* help-buttons (Nick approved Oct 12, cursor/help-buttons @ d4d1c835) —
     the "?" affordance's own token, never brass (brass means "current
     choice", this means "more words available"). Arbor's own value is
     identical to --accent-rest's (both olive, this theme's one affordance
     colour), so it aliases rather than duplicating the literal; Flux does
     NOT share --accent-rest for this (that token has no Flux override at
     all today), so its own value is set explicitly, below. --help-hi is
     the hover/expanded step, lighter along the same hue. */
```

## tokens §8

From `apps/desktop/src/styles/01-tokens.css`, line 135 at `25112784` (the comment that stays: "the door olive: --accent-rest is too faint on the paper, so doors use a darker step of the same olive, set per theme with the paper they sit on").

```css
/* BG2 S1 (SV19/SV20, Nick's walk of the deployed P1 tree) — the DOOR olive.
     `--accent-rest` is tuned to mark "where you are" on dark chrome; on cream
     paper it measures 2.4:1 against `--paper`, which is exactly Nick's "can
     barely see." This is the same olive ramp stepped DOWN in value — the
     darkened end already in use as the board pin's hand-darkened rim (#4F5730)
     — not a new hue: olive still means "this is a door." Against `--paper`
     (#F3EDE1) it measures 6.6:1.
     A separate token rather than a re-tune of `--accent-rest` because the two
     do different jobs on different grounds; re-tuning the shared one would drag
     every mode-tab hairline and thread line with it.
     Slotted per theme, the established seam pattern: the ONLY ground the doors
     ever sit on is `--paper` (the page sheet and the board canvas both), so a
     theme that darkens the paper must lighten the door in step. */
```

## tokens §9

From `apps/desktop/src/styles/01-tokens.css`, line 177 at `25112784` (the comment that stays: "one token for the frame's side gutter, read by the host's padding and by the strip's negative offset, so the two cannot drift apart").

```css
/* FX5 S10 — Nick's A1 verdict: the strip stays flush at the SCREEN's own
     left edge (FX4 S3's win, untouched), but the PAPER goes back to
     viewport center — two different reference frames that used to be one
     (`.desk-frame-host`'s own left padding). A single named token, read by
     BOTH `.desk-frame-host`'s padding (symmetric again, restoring true
     viewport-centering for `.desk-frame-grid`'s own `margin:0 auto`) AND
     `.desk-frame-strip`'s own negative left offset (pulling it back OUT of
     that padding to the true x=0 edge) — so the two can never drift apart
     the way a hand-duplicated `clamp(16px,3vw,40px)` in two rules could. */
```

## tokens §10

From `apps/desktop/src/styles/01-tokens.css`, line 202 at `25112784` (the comment that stays: "the paper fills the stage height: the chrome budget is the host's fixed chrome above and below the grid (40 + 63 + 16 + 48 px, hand-synced; fx3.mjs measures it), the fence is the gap under the paper").

```css
/* FX3 S1 — the paper fills the stage's available height instead of
     sitting at its old fixed intrinsic size (Nick's "far too much dead
     space below the paper" desktop-sitting verdict). --fx3-chrome-budget is
     the desk-frame-host's own fixed chrome ABOVE and BELOW the frame grid —
     its top padding (2.5rem=40px) + the sprint-nav row's own rendered
     height (measured empirically via the runtime harness against the row's
     current font-size/padding: 63px) + the 16px spacer PageEditor.tsx/
     ScriptEditor.tsx place under it + the host's own bottom padding
     (3rem=48px) — 40+63+16+48=167px. Hand-synced the same way
     CANONICAL_MEASURE_CH/--sliver-paper-pad already are elsewhere in this
     file (CSS can't read a sibling's rendered height) — if a later ticket
     changes the top bar's own size, this needs re-measuring too, and the
     fx3.mjs harness's own dual-width geometry checks will catch a drift.
     --fx3-paper-fence is S1's own margin between the paper's bottom edge
     and the stage's (brief's fence: 32-48px; tuned to 40px, the middle). */
```

## tokens §11

From `apps/desktop/src/styles/01-tokens.css`, line 257 at `25112784` (the comment that stays: "the rhizome's rest colour: one step above the desk ground, barely visible; a token, so a theme reskins it in one place").

```css
/* M2 S2 — the Rhizome's rest color. Plateau default: a light brown ONE
     STEP above the desk ground (--desk-ground/--chrome-surface = --ink-900
     #1F1A16 here) — barely visible by design, per Nick's own words. Token-
     driven throughout the component (RhizomeField.tsx never reads a
     Plateau literal), so a future theme reskins the growth-form by
     re-pointing this one slot, the same seam pattern as --chrome-surface/
     --rail-surface/--desk-ground above (the growth-form principle's
     mechanical half — the theme ARC itself is parked, this ticket only
     cuts the seam). Orange/brass lane law holds: this is warm brown, never
     orange, at rest — the flash (below) is the only evental exception. */
```

## tokens §12

From `apps/desktop/src/styles/01-tokens.css`, line 267 at `25112784` (the comment that stays: "the roots are the house olive, stepped down to --accent-door on the cream page so they still read behind the words").

```css
/* 2026-10-07 — the roots are the house olive. Nick: olive green roots on
     the page background, brass when the goal lands. --accent-rest is that
     olive (no new literal). On the cream page the on-page layer steps down
     to --accent-door so the same olive still reads behind the words. */
```

## tokens §13

From `apps/desktop/src/styles/01-tokens.css`, line 280 at `25112784` (the comment that stays: "each theme's default writing face; the face list reads this token, so its label cannot drift from what renders").

```css
/* TOOLS #10 item 10 (Nick, Oct 24): each theme's DEFAULT writing face rides this token - Arbor EB Garamond (here, the root), Flux Titillium Web, Machina Source Sans 3 (their blocks below); Nomad Figtree and Volant
     Crimson Pro when those themes exist. A page or card that never chose a face wears it ("Default (<face>)" in the list); the list's label is read from the resolved token, so it can never drift from what renders. */
```

## tokens §14

From `apps/desktop/src/styles/01-tokens.css`, line 300 at `25112784` (the comment that stays: "square corners everywhere: the radius slots are 0").

```css
/* FX1 S4 — Nick's ruling as creative director: square over rounded,
     everywhere. Both slots (and --radius, which re-points to --radius-md)
     go to 0 — a working value, not a foundations-doc change (that rides the
     committee pass; theme-foundations docs are untouched this ticket). */
```
