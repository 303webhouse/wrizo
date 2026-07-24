# SC1 — the Room's True Geometry · build brief · 2026-07-24

**Place at:** `docs/wrizo-alpha/sc1-true-geometry-brief.md` (records
lane). **Ticket:** SC1, the SC arc's heart. **Owner: CC (SC line), one
worktree** — `git worktree add ../wrizo-sc1 <branch>` off `main` AT OR
AFTER the M3 merge (`7ebe703`); guard-rail (`git rev-parse
--show-toplevel`) before every commit; ledger edits on `main` only via
the S0-push rule. **Zero schema, zero server files, zero new npm deps;
ONE new font asset (disclosed below).** Merge rides the zero-schema
pre-authorization through chat 1's serialized lane; Fable reviews
post-merge (`sc1-review-fable.md`); deploy is Nick's separate word with
a full manifest. A fix ticket — freeze-lawful.

**Authority:** Nick's first-sitting verdicts SC-V1–V4
(`sc-defect-verdicts.md`), the committee's Pass One standards
(`sc-committee-pass.md`), and his R6 word of 2026-07-24 ("I want to get
this fixed before I go"). The M3 precedent binds: the verdicts are the
spec; **reproduce before patch** (E1 S1's discipline) applies to every
slice — root cause named in the commit, no blind patches.

**What SC1 is NOT:** no pagination or page breaks (SC2), no page
numbers (SC2, under R1), no tool strip, no door, no `scriptKeys.ts`
comment updates (all SC3), no Tutor work (R4 pending). Until SC2, a
sheet that overflows 11 in simply grows taller — disclosed as the
lawful interim; the aspect assertions below apply to the at-or-under-
one-page state.

---

## The standard (the committee's Pass One, binding)

US Letter, Courier, the grid. In CSS terms:

```
Sheet:    width 8.5in; min-height 11in; padding 1in 1in 1in 1.5in
          (the padding already exists in .script-sheet — keep it)
Type:     Courier Prime 12pt; line-height exactly 6 lines/inch
          (12pt type at line-height 1.0 = 6 lpi; Courier's 0.6em
          advance at 12pt = 10 cpi — both fall out of the font)
Measure:  text area = 6.0in (8.5 − 1.5 − 1.0)
```

Element grid — offsets measured FROM THE TEXT AREA'S LEFT EDGE (the
1.5 in page padding already supplies the base margin):

```
scene heading   0        full 6.0in measure   UPPERCASE (display)
action          0        full 6.0in measure
dialogue        1.0in    3.5in wide
parenthetical   1.6in    ~2.0in wide
character cue   2.2in    —                    UPPERCASE (display)
transition      right-aligned to the measure  UPPERCASE (display)
shot            0        full measure          UPPERCASE (display)
general         0        full measure
```

Uppercasing is DISPLAY-LEVEL (`text-transform`), storage stays as
typed — E1's export already uppercases headings/transitions at
serialization and is NOT touched.

## The slices

**S1 — the true page.** `.script-sheet` becomes a Letter-proportioned
sheet per the block above. **Font:** bundle **Courier Prime** (SIL OFL
1.1) as a project asset — the four faces or at minimum
Regular + Bold, `@font-face`, with the OFL license file committed
alongside; stack `'Courier Prime', 'Courier New', Courier, monospace`;
audit `--font-script` and point it here. This is an asset, not a
dependency — disclosed in the commit and the report. **Scaling law:**
the sheet keeps TRUE proportions at every viewport — below its natural
width (~816 px + stage gutters) the WHOLE sheet scales as one object
(transform-scale the sheet or an equivalent single-source mechanism);
the grid never reflows, inches never compress independently. This is
the fix for SC-V2 (the type) and the proportional half of SC-V3.

**S2 — the element grid.** `elementStyle()`'s approximations are
replaced by the table above (one shared map, CSS-variable or
constant-table single-sourced — no per-element magic numbers scattered
inline). Ghost placeholders (`GHOST_TEXT`) and the autocomplete flyout
align to the same grid. The `.script-el-active` treatment survives
unchanged in meaning.

**S3 — the caret's home (SC-V4).** Page one begins at the top margin.
**Reproduce first, then root-cause:** determine whether the mid-paper
start is the typewriter hook centering `.script-el-active` without a
top clamp, a layout offset on the sheet, or both — NAME the root in the
commit. The fix at that root: the typewriter YIELDS while the active
line's natural position is above the stage's center (scroll offset
= max(0, natural − center)), then engages exactly as prose does. First
keystroke on a fresh script page happens at the top margin, visibly.

**S4 — the seated room (SC-V1).** Reproduce "the page is in a weird
spot, the side menus are floating in space" on the DEFAULT chrome and
on at least two themes including Flux, at framed and legacy widths.
Fix what roots in the SCRIPT SURFACE (stage centering, chrome
attachment, the framed host's geometry) at that root. **Anything that
reproduces ONLY under Flux is Flux-theme chrome: RECORD it (ledger
note + one line in the report) and do not chase it — the theme arc is
parked and SC does not scope-creep into it.**

**S5 — the harness, `sc1.mjs`.** Presence is not composition: the
geometry floor lands with the surface, day one.
- Sheet aspect ratio = 8.5 : 11 within tight tolerance on an
  at-or-under-one-page doc; padding ratios 1.5/1/1/1 verified.
- Grid offsets measured per element type (rendered geometry, not
  class presence): dialogue at 1.0 in, character at 2.2 in,
  parenthetical at 1.6 in, transition right-aligned — asserted as
  ratios of the measure so the scaling law is proven at BOTH a
  full-size and a scaled width.
- Display uppercase on scene/character/transition/shot; storage
  unchanged (type lowercase, read the doc back).
- S3 under GENUINE trusted CDP pointer + real keystrokes: open a
  fresh script page, first element renders at the top margin; type
  past center, the typewriter engages. (Gesture claims take
  trusted-pointer proofs — the synthetic harness does not substitute.)
- Width set per the cd4 pattern (floor / reference / wide-2200 /
  legacy), both `HARNESS_PARKED` settings, verdict read to completion
  in the main loop.
- **Grep-first `scripts/harness/`** for every assertion touching
  `script-sheet`, `script-el`, script fonts, or typewriter behavior on
  script BEFORE changing any value. Any check SC1 falsifies carries
  its lawful park cycle in the SAME commit — record frozen verbatim,
  probe follows reality, supersession travels with the change
  (the codicil; `cd1.mjs` is the textbook).

## DoD

Nick converts a page to Screenplay and page one is a true page:
Letter-proportioned at every width, Courier at the standard metric,
every element on the trade's grid, the caret waiting at the top
margin, and the room seated — paper centered, chrome attached — in
every theme he opens. `tsc` ×2 and `build:web` clean; `sc1.mjs` green
both settings; the full historic suite read to completion in the main
loop, any contention-suspected failure re-run in isolation and the
pattern disclosed. Report = push.

— Fable (SC line), briefing SC1, 2026-07-24
