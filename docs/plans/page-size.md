# Page size — the letter page and the zoom (FIX, Oct 23)

Status: PLAN + red-first harness. Code branches from `main` only after deploy #4 (`fix/blank-page-click`) merges, because both change
`ModeStage.tsx`. Nick approved the build; Fable's brief (Oct 23) is the order.

## Sources

- Fable's brief, Oct 23 (points 1-5, quoted under each section below).
- Cursor's mockup: `origin/cursor/page-size-mockup` @ e3c4e462 (07:49, the final frames: "Fade older typewriter lines into the desk"),
  `docs/mockups/page-size/index.html` and its 26 frames.
- **The spec** (`live-feedback-oct23.md`, 7:42 am; not on this box, so Fable folded it in here on Oct 23, verbatim in substance):
  *Normal, every theme: letter paper, 12 pt default, ~75 chars/line. Zoom (Typewriter / Terminal / Flow State / Vision): the SAME page
  ~1.6x, SAME line breaks (scale, never reflow), band ~8-10 lines, panels tucked, older lines fade upward, bottom fade below the writing
  line, writing line opacity 1, glide one line, reduced motion = no glide.* Build from the mockup @ e3c4e462, FINAL. Fable confirmed
  the 60%-height anchor and the pixel-read T check.

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

At both 1366 and 1920 the mockup draws **620 x 803 at 16px (12 pt)**: that is the page at scale 1.0, the floor. Under Nick's ruling (c)
the page GROWS smoothly with the stage (section 2). Cursor shot the normal-view frames at 1366x1120 and 1920x1200 (tall enough to show
the whole sheet) and the zoom frames at 1366x768 and 1920x1080; the build is tested at Nick's four sizes instead (section 4).

The zoom's FINAL mask (e3c4e462) is on the whole stage, so text AND paper fade into the desk together. In line-heights from the
anchor: 0 at the stage top, .12 at -6.6, .40 at -4.2, .72 at -2.2, full from -0.15 to +1.45 (the writing line alone), .40 at +2.8,
0 from +4.4. Read as lines: the writing line at 1.0, then about .88 / .75 / .59 / .43 / .31 for 1-5 lines above. About ten lines are
visible in all.

## 2. Normal view (brief point 2)

> letter proportions, 12 pt, ~75 chars/line, matching cursor/page-size-mockup frames at 1366 + 1920. Per-page margins 26/38/58 still apply;
> coordinate with TOOLS' scrollbar-flush (--wz-page-pad-x).

**PAGE UNITS - one source for the page's size.** One letter-inch token, `--wz-letter-in`, 72.94px at scale 1.0 (620 / 8.5). The page is
`8.5 x 11` of it, its margins are in it, and its type is in it: 12 pt = 16px x the page scale k (ruling a).

**The page scale (ruling c, Nick).** k comes from the STAGE's size alone, never from open panels (paper never reflows for chrome). It
is smooth, not stepped: the largest k at which the whole letter page fits the stage height with a small margin, never below 1.0.
The stage becomes a size container (`container-type: size`; Electron 31 is Chromium 126, so container units are supported). That
lets the whole law be pure CSS, using only length x number, never the length / length that calc() cannot do:

```
--wz-letter-in: max(72.94px, min((100cqh - <fence>) / 11, (100cqw - 2 * <panel reserve>) / 8.5))
```

The width term is a CONSTANT reserve for the two drawers' open widths, never their open state. So the page sits between both panels
whether or not they are open, and opening one never moves it (checks K and N). No JS runs on the normal view's sizing path. Main's
stepped `--paper-scale` (1.1 at 1680, 1.2 at 1920) and the 1700px `font-size:19px` stop applying to the prose page. `--paper-scale`
stays for everything else. **The 1366 rule (Fable, Oct 23).** The page never goes below 1.0 and never moves. If both drawers do not fit
beside it, they narrow to a minimum (one token, `DRAWER_MIN`, today's 200px Tools width, scrolling inside with thin scrollbars). Below
that minimum, opening one drawer closes the other (Nick's Oct 7 rule). **This changes main:** `store/menusDrawers.ts` (Phase 1, Fable
Oct 12) closes the other drawer at EVERY width ("this one never asks"). Under the new rule that exclusivity becomes width-measured, the
same way the cascade-vs-Tools law beside it already is. Both drawers open together wherever their minimums fit, and only below that
does one close the other.

**Ruled (Fable, Oct 23): page-size REPLACES the Oct 12 Phase 1 rule** with this measured one (Nick's own original ask in that file's
header). The store's guard is written as exactly `if (stands.has(rival) && !canHoldBoth())`, because one-drawer.mjs's successor
mutants anchor on that text. `canHoldBoth()` reads `.mode-page` against `.desk-frame-stage`: at least `DRAWER_MIN` of desk on each
side. Both are measured with the drawers in any state, because the page never moves. The cascade-vs-Tools law beside it is unchanged.

**Parks for the rule change: 14 check sites in 3 files**, each parked VERBATIM with a measured successor and a parked record
(`pok`). Censused by grep, then each read against its source:
- `drawers-p1-live.mjs` L7 x2: the right-then-left and left-then-right hand-overs, at 1100/1280/1400, per theme.
- `item112a.mjs` x5, each at both reference widths: S7 (the Desk yielded), S7 (Desk-only), S7 §8 (the open hand closes), S3 (taking
  turns) and S5 (taking turns). The file's stated park count goes from 6 to 16 records.
- `one-drawer.mjs` x7: O1, O2, O5b's Tutor half, and four mutants (two mutate the unconditional exclusion; two take their witness from
  O1 or O5b). The successors are O1m, O2m and O5m under ROOM/TIGHT fake documents, plus four measured mutants.

Read and NOT parked (their predicates hold under the new rule): fx18 S1's successor (it opens each drawer alone); drawers-p1-live L1
(the page rect never changes, whatever the hand-over); one-drawer O3-O7 and its hand-close mutant; item83e E1 S3 and item112a's S5 at
WIDE (both test Tools against the far-left cascade, not Tools against the Tutor). Implicit fixture reliance that no grep can see will
surface in page-size's FULL PAIR, which carries all of this.

Everything that today hand-copies the page's width reads the one pair `--wz-page-w` / `--wz-page-h` instead:
`.desk-frame-stage--prose .mode-pagecol` (today `min(760px * scale, 60ch)`), the Sliver's and Tutor's `--sliver-paper-half` /
`--tutor-paper-half` (today `min(380px * scale, 30ch)`, hand-synced), and the 1700px rule's `min(760px, 46vw)` and `font-size:19px`.
Because the type, the margins and the paper all scale by the same factor, a wider screen grows the page in shape only, and every line
breaks where it did (check L). The prose page's height is `min(pageH, the stage's available height)` (ruling d); the text keeps
scrolling inside `.mode-scroll` exactly as today.

**Type size (ruling a).** `fontSize.ts` becomes real points in page units: `px = 16 x n / 12 x page scale`, PAGE default 12. Cards keep
their own default 11 and their own formula, so `SIZE_DEFAULT` splits into a page default and a card default. **No data rewrite:**
a page that never chose (the key absent) reads through the new default and renders at 12 pt = 16px (today 17px). A page that stored a
size keeps its number, which now means real points, so a stored 11 renders 14.7px where it rendered 17px.

**Margins (ruling b).** Fixed paper; the margin choice moves the text inside it: narrow 0.68in (~82 chars), normal 1in (~75), wide
1.53in (~64). `pageDress.ts` maps the choice to a letter-inch multiple and keeps writing ONE variable, `--wz-page-pad-x`, now in page
units. TOOLS' `scrollbar-flush` @ 3793c641 (not merged) cancels `.mode-scroll`'s edge against that same variable. **To agree with TOOLS
before code:** the variable's name and that it carries a finished length (no longer a base measure that index.css multiplies by
`--paper-scale`), so their edge cancellation must not multiply it again. I do not touch `.mode-scroll`'s margin/padding rules; whichever
of us merges second merges main and re-runs both harnesses.

**Screenplay is unchanged.** It is already 8.5in wide by law (SC1). **The legacy unframed Journal surface** (`.entry-full`) is out of
scope. QuickSprint renders ModeStage and comes along automatically.

## 3. The zoom (brief point 3)

> Typewriter / Terminal / Flow State / Vision: the SAME page scaled ~1.6x with the SAME line breaks (scale, never reflow); band of ~8-10
> lines, panels tucked; older lines fade as they rise; bottom fade starts below the writing line; writing line always full strength;
> glide one line at a time; reduced motion = no glide.

- **Keyed on `typewriterOn`, not on a theme.** Only Arbor (`plateau`) and Flux are registered; Flow State and Vision belong to themes
  not yet in the union (`store/theme.ts`). Arbor's default is Typewriter ON, so **an Arbor page opens zoomed** unless the writer turns it off.
- **Scale, never reflow:** a `transform: scale(z)` on the page, never a bigger font or a wider box. z is ~1.6 from the current base
  scale, capped to the largest that fits the stage's width with the panels tucked (ruling c). Unlike the base scale, a transform needs
  a plain number, so z is written as `--wz-zoom` by one ResizeObserver on the stage. That observer runs on resize, never on typing.
  A transform does not lay the text out again, so line breaks are identical by construction. Bigger type in a wider box could break lines differently, because
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

Both themes, every check at Nick's four sizes: 1366x768, 1920x1080, 2560x1440 (his 27" 4K at 150%), 3840x2160.
Seeding through the seams; trusted CDP input; opacity is read from the SCREENSHOT (decoded in the page through a canvas, no new dep), so
it measures what is painted, masks included. The page scale k is MEASURED (page width / 620) and then held to ruling (c)'s law.

| id | check |
|----|-------|
| R  | at k = 1: 620 wide (within 3%) and capped to the stage (ruling d). Above 1: letter (8.5 / 11 within 1%), inside the stage, and the largest that fits (its height within 96px of the stage's) |
| C  | chars per line at the default: the median full line of a seeded paragraph holds 72-78 characters |
| F  | the editor's type is 12 pt in page units: 16px x k (within 1%) |
| L  | every size breaks its lines exactly where 1366x768 does (it grows, it never reflows) |
| K  | opening the panels never moves or rescales the page |
| N  | where both drawers fit beside the page at `DRAWER_MIN` (measured: the desk on each side of the page), BOTH stand open, each `DRAWER_MIN`+ wide, and the page sits fully between them; where they do not, opening the Tutor closed the Sliver and the Tutor sits clear of the page |
| Z  | zoom: the page paints ~1.6x its normal width (within 0.03), or, where that would not fit, the largest that fits the stage's width (within 96px); never overflowing the stage |
| B  | identical line-break offsets in both views (same page, same text, toggled live) |
| U  | the editor is the SAME node before, during and after the zoom (no unmount) |
| X  | leaving the zoom returns the exact normal rect (within 0.5px) |
| P  | panels tucked: Sliver and Tutor drawers closed in the zoom |
| W  | the writing line paints at full strength (ink ratio >= 0.9); premise: the instrument reads >= 0.9 on the same line in normal view |
| T  | the top fade is present: older lines fade as they rise - 1 above > 3 above > 5 above (each by .08+), 5 above <= 0.5 |
| G  | glide: a new line moves the scroll over more than one frame, by about one line; under reduced motion, in one frame |

Mutants, each asserting it LANDED before its predicate is read: MR (page forced to 760px wide), MC (editor at 14px), MB (letter-spacing
changed only while zoomed -> breaks differ), MW (the writing row at opacity .5), MT (every mask in the stage removed), MK (the page
rescaled while the Tutor is open -> K fails).

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
normal and zoom) at Nick's four sizes, plus both panels open at each, for Fable's clear.

## 7. Rulings (Fable, Oct 23)

a. **Type size: YES, real points in PAGE units.** 12 = 16px, scaled with the page; 12 is the default for new pages; NO data rewrite
   (section 2, Type size).
b. **Margins: YES, fixed paper; the margins move the text.** Normal 1in ~75, narrow ~82, wide ~64. Agree `--wz-page-pad-x` with TOOLS
   (section 2, Margins).
c. **Big screens (Nick, Oct 23): the page GROWS.** The scale comes from the screen/stage size only, never from open panels (paper
   never reflows for chrome). Smooth, not stepped: the largest scale where the whole letter page fits the stage height with a small
   margin, never below 1.0 (620x803 at 1366x768). Same line breaks at every scale. Zoom modes: ~1.6x from the current base scale,
   capped to the largest that fits with the panels tucked. Test sizes 1366x768, 1920x1080, 2560x1440, 3840x2160; with both panels
   open, the page sits fully between them at every size (section 2, The page scale; section 4).
d. **Short screens: YES, cap the page to the stage**; the text scrolls inside it.

Park audit at build time: accepted. Chat 1 grants the short red run after the blank-page merged run. Code branches from main after
deploy #4 (blank-page) merges.

## 8. Stored sizes - what the code says (Fable's first question under ruling a)

**Pages store an explicit size only after a writer chose one.** `pageSettings.size` is absent on every page that never chose
(types/index.ts, item 207). Two paths write it:

1. **The Type control** (PageEditor.tsx `onSize` -> `patchPageSettings({ size })`). That covers `+`, `-` and a typed number. It
   can store 11: a writer who stepped to 12 and back, or typed 11.
2. **"Set as my default"** (CascadePanels.tsx -> `setUserPageDefaults(current)`). It copies the open page's whole `pageSettings`,
   size included, because `dressOnly` (pageDefaults.ts) strips only kind, styleGuide and template. `createJournalPage` then stamps those
   defaults on every page born afterwards (persistence.ts, `pageSettings: getUserPageDefaults()`). One press on a page that stored
   a size gives every later page that same explicit size.

**Ruled (Fable, Oct 23): NO probe, NO data rewrite.** A pinned size keeps its number, read in the new point scale. The deploy note
tells Nick to press `+` if a page looks small.

## 9. As built (branch `page-size`) - where the build differs from the sections above, and why

- **The base scale is MEASURED, not a container query.** `container-type: size` on the stage would make it the containing block for every
  `position: fixed` element inside it (the stage holds the Sliver, the Tutor, the cascade and the page; index.css has 39 fixed rules).
  Instead, one ResizeObserver in DeskFrame writes `--wz-letter-in` and `--wz-zoom` on the prose stage, in a layout effect, on resize only,
  never on typing. The law itself lives in `store/pageScale.ts` (pure). The page's top is read through `offsetTop`, so the zoom's transform
  can never feed back into the base scale.
- **The zoom holds the writing line's TOP at 60%** (Cursor's mockup places the caret's top at the anchor). So the engine holds the caret's
  bottom one line below that, inside the mask's full-strength band (-0.15 to +1.45 lines). One anchor: `ZOOM_ANCHOR` in pageScale.ts; the
  engine writes it to the column as `--tw-anchor`, and the CSS 60% is only the fallback.
- **The band mask is on the page COLUMN**, which widens to the stage while zoomed. The page keeps an explicit width, so widening the column
  never re-lays a line. The mask clips the transformed page to the column's box, so no `overflow` rule is needed.
- **`scrollbar-gutter: stable` on the prose scroller.** Main's one REAL red in run 143 (B, Arbor 3840: 34 -> 35 lines) was a scrollbar
  appearing when Typewriter's start offset made the content taller, narrowing the column. With the gutter reserved, no scrollbar can move a
  line break.
- **Margins travel as a multiplier** (`--wz-page-margin-in`: 0.684 / 1 / 1.526), never as `--wz-page-pad-x` inline. Inline, it would
  override the stylesheet's derivation. Off the letter page the multiplier gives exactly 26/38/58px again.
- **The Flux block caret** redraws on scroll (capture), resize and ModeStage's `wz-caret-moved`, batched into one frame. On those triggers it
  never inserts its empty-line probe, which would mutate the editor on every scroll frame while the typewriter engine observes mutations.
- **The vignette** (Fable, Oct 23, folded in) sits behind the page in EVERY theme: `body::after` at z-index -1, with `body` given
  `isolation: isolate` so it stays visible on the room (html carries its own background, so a bare -1 would vanish under the lamp). Checks V,
  V-room and MV.
- **One grey-band rule, not three** (Fable, Oct 23, for train #7): Flux's `[data-theme='flux'] body::after{ z-index:-1; }` (flux-inputs) is
  removed. Its source check `flux-v2.mjs` VG1 and VG1's mutant are parked verbatim, with successor VG1b: the BASE rule is -1, body is isolated,
  and no theme raises it again. The runtime check `flux-v2-part2` F9 is kept unchanged and still holds. **Machina's copy**
  (`[data-theme='machina'] body::after{ z-index:-1; }`, TOOLS' machina-build, train #6) is not on main yet. When page-size rebases after #6,
  remove it the same way and park `th-machina-source.mjs`'s two source reads of it (the presence regex and its mutant) with the same successor.
  Each theme keeps its own check; page-size V runs in every registered theme.
- **Scope:** the framed prose page (PageEditor at 1100px and wider: Draft, Free Write, Revise). QuickSprint is not framed and keeps its own
  sheet; the unframed narrow layout and the legacy Journal surface are unchanged.

