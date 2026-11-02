# Rulings: `apps/desktop/src/styles/04-flux.css`

Ruling histories moved verbatim out of the CSS by #13 step 7 (Fable's comment ruling, Oct 29). A comment in the CSS that
cites `[flux §n]` points here.

## flux §1

From `apps/desktop/src/styles/04-flux.css`, line 12 at `25112784` (the comment that stays: "ground").

```css
/* ground (Flux v2: was #04141A; hue 212 since Oct 23, was #020c10) */
```

## flux §2

From `apps/desktop/src/styles/04-flux.css`, line 13 at `25112784` (the comment that stays: "the teal twin of --lamp-glow, so the backdrop is not Arbor brown under Flux").

```css
/* theme-leftovers (Nick approved Oct 16) — the teal twin of --lamp-glow's
     own brown gradient: the SAME stop positions/lightness/saturation ramp,
     hue shifted to this theme's own register (~194deg, between --ink-950's
     196.4deg and the dark page's own --paper 190deg). Was unset, so body's
     backdrop stayed Arbor-brown under Flux wherever a route's own content
     doesn't paint full-bleed over it (the unframed page view, Journal/Shelf). */
```

## flux §3

From `apps/desktop/src/styles/04-flux.css`, line 19 at `25112784` (the comment that stays: "the room reads blue: every dark surface sits near hue 212; the warmth overlay grows with typing").

```css
/* FLUX V2 (Nick, live screenshot; Fable Oct 23): the room reads BLUE, not teal/green. Nick picked hue 212 (option B): every dark surface below sits at ~212 deg, the lightness it had at ~204, slightly more saturated. Dark at rest; the warmth overlay (--ember, below) grows it with typing. */
```

## flux §4

From `apps/desktop/src/styles/04-flux.css`, line 40 at `25112784` (the comment that stays: "a card is dark glass, and so are its pop-up and the deck wizard, in both page tones").

```css
/* FLUX V2 (Fable, Oct 22-23): a card is dark glass - and so are its pop-up and the deck wizard, which read the same tokens. Both tones: the glass is the glass, whatever the page is. */
```

## flux §5

From `apps/desktop/src/styles/04-flux.css`, line 50 at `25112784` (the comment that stays: "Flux's "?" colour: teal, never brass or olive").

```css
/* help-buttons (Nick approved Oct 12) — Flux's own "?" affordance colour,
     teal (never brass, never Arbor's olive --accent-rest). */
```

## flux §6

From `apps/desktop/src/styles/04-flux.css`, line 62 at `25112784` (the comment that stays: "Flux's default writing face is Titillium Web").

```css
/* TOOLS #10 item 10 (Nick, Oct 24): Flux's default writing face is Titillium Web. This SUPERSEDES the original line here -
     "--font-proseSerif is NOT overridden - Crimson Pro rides unchanged cross-theme, per canon §4's voice continuity across themes" - kept as the record. */
```

## flux §7

From `apps/desktop/src/styles/04-flux.css`, line 78 at `25112784` (the comment that stays: "the door colour follows the ground: on Flux's dark glass it is the palette's text accent, never olive").

```css
/* BG2 S1 — the door colour follows the ground. FLUX V2 (Nick, Oct 23: "any remaining green is lime, never Arbor olive"): Arbor's door olive (#4F5730, stepped up to #A9B56A here)
     is gone from Flux; the door reads the palette's text accent #57D0F5 on the dark glass (measured against this block's own --paper by bg2's S1). */
```

## flux §8

From `apps/desktop/src/styles/04-flux.css`, line 102 at `25112784` (the comment that stays: "the faint text tier is darkened one step down the teal ramp to clear 4.5:1 on the paper and on the card stock").

```css
/* faint-text-sweep (Fable, Oct 16: "the -low tier you flagged") — #0B7C9E
     measured 4.34:1 against this theme's own --paper and 4.43:1 against
     --card-stock, both under the 4.5:1 floor (the flux-dark override above
     quotes the same defect). Darkened one step down the same teal ramp to
     clear both: 5.65:1 on --paper, 5.77:1 on --card-stock. */
```
