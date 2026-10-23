# Page size — the letter page and the zoom (FIX, Oct 23)

Status: PLAN + red-first harness. Code branches from `main` only after deploy #4 (`fix/blank-page-click`) merges, because both change
`ModeStage.tsx`. Nick approved the build; Fable's brief (Oct 23) is the order.

## Sources

- Fable's brief, Oct 23 (points 1-5, quoted under each section below).
- Cursor's mockup: `origin/cursor/page-size-mockup` @ e3c4e462 (07:49, the final frames: "Fade older typewriter lines into the desk"),
  `docs/mockups/page-size/index.html` and its 26 frames.
- **Not on this box:** `live-feedback-oct23.md` (the 7:42 am section). It is in no branch, worktree, `~/.wrizo/notes` or `Downloads`.
  This plan is built from the brief and the mockup's own code. If the doc says something different, the doc wins and this plan
  changes before any code.

## 1. What the mockup actually computes (read from its code, not its pictures)

```
textW  = width of a 75-character English line at 16px Crimson Pro, + 14px
pageW  = textW / (6.5 / 8.5)      -> the text column is a letter page's 6.5in between 1in margins
pageH  = pageW * 11 / 8.5         -> letter proportions
padX   = (pageW - textW) / 2      -> one letter-inch
padY   = padX * 0.85
zoom   = the same page at scale 1.6, writing line held at 60% of the stage height (--anchor), the sheet bleeding a full stage
         height above and below so the paper itself runs off into the desk
```

At both 1366 and 1920 that is **620 x 803 at 16px (12 pt)**. The page does NOT grow at 1920. Cursor shot the normal-view frames at
1366x1120 and 1920x1200 (tall enough to show the whole sheet) and the zoom frames at 1366x768 and 1920x1080.

The zoom's FINAL mask (e3c4e462) is on the whole stage, so text AND paper fade into the desk together. In line-heights from the
anchor: 0 at the stage top, .12 at -6.6, .40 at -4.2, .72 at -2.2, full from -0.15 to +1.45 (the writing line alone), .40 at +2.8,
0 from +4.4. Read as lines: the writing line at 1.0, then about .88 / .75 / .59 / .43 / .31 for 1-5 lines above. About ten lines are
visible in all.

## 2. Normal view (brief point 2)

> letter proportions, 12 pt, ~75 chars/line, matching cursor/page-size-mockup frames at 1366 + 1920. Per-page margins 26/38/58 still apply;
> coordinate with TOOLS' scrollbar-flush (--wz-page-pad-x).

**One source for the page's size.** A new `--wz-page-w` / `--wz-page-h` pair on the prose stage, derived from one letter-inch token
`--wz-letter-in` (620 / 8.5 = 72.94px). Everything that today hand-copies the page's width reads that pair instead:
`.desk-frame-stage--prose .mode-pagecol` (today `min(760px * scale, 60ch)`), the Sliver's and Tutor's `--sliver-paper-half` /
`--tutor-paper-half` (today `min(380px * scale, 30ch)`, hand-synced), and the 1700px rule's `min(760px, 46vw)`. The prose page's height
becomes `min(pageH, the stage's available height)`; the text keeps scrolling inside `.mode-scroll` exactly as today.

**Margins.** `--wz-page-pad-x` stays the ONE margin variable (pageDress.ts writes it, index.css scales it). TOOLS' `scrollbar-flush`
@ 3793c641 (not merged) cancels `.mode-scroll`'s edge against that same variable. I do not touch `.mode-scroll`'s margin/padding rules;
whichever of us merges second merges main and re-runs both harnesses.

**Screenplay is unchanged.** It is already 8.5in wide by law (SC1). **The legacy unframed Journal surface** (`.entry-full`) is out of
scope. QuickSprint renders ModeStage and comes along automatically.

## 3. The zoom (brief point 3)

> Typewriter / Terminal / Flow State / Vision: the SAME page scaled ~1.6x with the SAME line breaks (scale, never reflow); band of ~8-10
> lines, panels tucked; older lines fade as they rise; bottom fade starts below the writing line; writing line always full strength;
> glide one line at a time; reduced motion = no glide.

- **Keyed on `typewriterOn`, not on a theme.** Only Arbor (`plateau`) and Flux are registered; Flow State and Vision belong to themes
  not yet in the union (`store/theme.ts`). Arbor's default is Typewriter ON, so **an Arbor page opens zoomed** unless the writer turns it off.
- **Scale, never reflow:** `transform: scale(1.6)` on the page, never a bigger font or a wider box. A transform does not lay the
  text out again, so line breaks are identical by construction. Bigger type in a wider box could break lines differently, because
  font hinting is not linear. The editor never unmounts; caret, selection, text and scroll are kept. Leaving the zoom returns the
  exact normal rect.
- **Panels tucked:** entering the zoom closes the Sliver and Tutor drawers (they are tools; collapsing is allowed by page primacy).
  Their grips stay.
- **The band:** ONE mask on the stage, Cursor's final stops (section 1) as named constants, anchored to the writing line's hold
  point. That replaces today's top-of-scroller mask (`.mode-scroll[data-typewriter][data-scrolled]`, a .15 floor and a 3-line ramp).
  The sheet bleeds a full stage height above and below while zoomed, so the paper fades into the desk as in the frames.
- **Writing line held at 60%** of the stage (Cursor's `--anchor`), up from today's 46% (`CONTAINER_HOLD_BAND`), in the zoom only.
- **Glide:** the engine already advances one line per step with a smooth scroll and goes instant under reduced motion. Under the
  transform, the engine must convert screen pixels to layout pixels (divide by the scale) before comparing them to the scroller.
- **Page primacy:** the zoom changes the page's rect on purpose. The Oct 12 plan already ruled the typewriter's widening the ONE
  exception. The build adds that line to `docs/page-primacy-canon.md` and to AGENTS.md's PAGE IS PRIMARY section.
- **Supersedes** the Oct 12 typewriter-redesign width rule (122% text, 74ch measure). The redesign was never built; its mask and
  hold designs carry over as above.
- **The Flux block caret** goes stale when the layout moves under it (Oct 13 addendum, still open on main). The build redraws it
  when the zoom toggles.

## 4. Checks — `apps/desktop/scripts/harness/page-size.mjs` (brief point 4)

Both themes. Normal view at Cursor's normal frame sizes (1366x1120, 1920x1200); zoom at Cursor's zoom frame sizes (1366x768, 1920x1080).
Seeding through the seams; trusted CDP input; opacity is read from the SCREENSHOT (decoded in the page through a canvas, no new dep), so
it measures what is painted, masks included.

| id | check |
|----|-------|
| R  | page ratio: `.mode-page` width / height = 8.5 / 11 (within 1%), width within 3% of 620 |
| C  | chars per line at the default: the median full line of a seeded paragraph holds 72-78 characters |
| F  | the editor's font is 16px (12 pt) at both widths |
| S  | (lean (d) below) at 1366x768 the page keeps the 1366x1120 width and fits the stage |
| Z  | zoom: the page's painted width is 1.6x its normal width (within 0.03) |
| B  | identical line-break offsets in both views (same page, same text, toggled live) |
| U  | the editor is the SAME node before, during and after the zoom (no unmount) |
| X  | leaving the zoom returns the exact normal rect (within 0.5px) |
| P  | panels tucked: Sliver and Tutor drawers closed in the zoom |
| W  | the writing line paints at full strength (ink ratio >= 0.9); premise: the instrument reads >= 0.9 on the same line in normal view |
| T  | the top fade is present: older lines fade as they rise - 1 above > 3 above > 5 above (each by .08+), 5 above <= 0.5 |
| G  | glide: a new line moves the scroll over more than one frame, by about one line; under reduced motion, in one frame |

Mutants, each asserting it LANDED before its predicate is read: MR (page forced to 760px wide), MC (editor at 14px), MB (letter-spacing
changed only while zoomed -> breaks differ), MW (the writing row at opacity .5), MT (every mask in the stage removed).

## 5. Parks to expect, and the sweep (Fable, Oct 21: every harness that reads the surfaces the branch changes)

Grep of the harness folder for the page's geometry, `--paper-scale`, the typewriter mask and hold, and the margin variable:
**33 of 174 files** - ab1 ab2 bg2 cd1 cd2 clickhead flux-page-ink flux-v2-part2 fx1 fx10 fx18 fx2 fx3 fx5 fx7 fx9 item112a item121
item207-core item207 item83f item84b j6 m4 one-drawer page-templates-r2 sc1 tu1 tu2 tu5 typewriter-fade w1 w2.
These are CANDIDATES. Most compare rects before and after (the page did not move) and survive. Absolute measures (fx3's 760px/60ch and
paper-scale > 1 at 1920, item207's 17px base, typewriter-fade/fx1/fx5's top-of-box mask) will need park + successor. Each is
audited against its source at build time, never parked from the grep.

## 6. The pair (brief point 5)

Full pair, including typing-latency-scroll, page-scroll-return, typewriter-fade, typewriter-page, typewriter-scope, blank-page-click
and page-size. The latency probe at 5k and 50k runs WITH the transform on. Screens vs Cursor's final frames (both themes, dark and light,
1366 + 1920, normal and zoom) for Fable's clear.

## 7. Conflicts handed up (each with a lean)

a. **"12 pt" vs item 207's scale.** `fontSize.ts` defines 11 "pt" = 17px (today's rendering), so the mockup's 16px is "10.4" on the
   app's own dial. *Lean:* make the number true: 12 = 16px (`px = 16 x n / 12`, real CSS points), default 12. A page that chose a size
   keeps its number and renders 6% smaller. *Rival:* keep 17px = 11 and call the mockup's 16px "10.5"; the frames still match, the
   label lies.
b. **Margins 26/38/58 vs a letter page.** The frames' margin is one letter-inch (73px), not 38. If the page stays letter at 620, the
   literal 38px gives an ~88-character line. *Lean:* the page is fixed (paper is paper, as in print); the margin choice moves the text
   inside it, kept in the same ratio to normal: narrow 0.68in (~82 chars), normal 1in (75), wide 1.53in (~64). *Rival:* keep 26/38/58px
   literally and size the page from the text column outward, so the page is 550 wide at normal and changes width with the margin.
   That is letter-proportioned, but it is not Cursor's frames.
c. **1920 and up.** Main scales the page 1.1x at 1680 and 1.2x at 1920 (`--paper-scale`, FX3), and 19px at 1700+. The frames keep 620
   at 1920. *Lean:* follow the frames: the prose page stops scaling with the screen (letter is letter; the zoom is the big-type view).
   `--paper-scale` stays for everything else. *Rival:* keep scaling the page at wide screens for the 32" monitor (B5).
d. **A short screen (1366x768).** A 803px-tall page does not fit a 768px laptop. *Lean:* the width never changes with the height; the
   page's height is capped to the stage, and the text scrolls inside it as today. *Rival:* the stage scrolls the whole sheet, which
   moves every scroll owner the latency and return harnesses depend on.
