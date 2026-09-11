# ITEM 130 + THE NARROW SHELL'S "INK" BAR — S0 SURVEY
### tools lane · worktree `.claude/menus-130` · branch `item130-strip-hittest`
### off `origin/main` @ `c2d5539` · 2026-09-09 · NO BEHAVIOUR CHANGE

Read from code, not from memory. Every claim below carries the file and line
that proves it, and the two that were guesses when this lane was handed the
work are marked as corrected.

---

## §1 · ITEM 130 — THE STRIP IS HALF-UNREACHABLE. MECHANISM CONFIRMED.

PW1's finding (its own ledger band, `pw1-records` @ `826f7ef`) reproduces from
source. Nothing here is re-measured from the browser yet — that is the probe's
job, and it comes after this commit.

**The two boxes, and why the later one wins:**

- `.desk-frame-strip` — `index.css:2668` — `position:absolute; top:-16px;
  left:calc(-1 * var(--frame-host-pad-x)); width:var(--strip-width)`.
  `--strip-width: 84px` (`index.css:108`).
- `.desk-frame-stagecol` / `.desk-frame-stage` — `index.css:2683`, `2709` —
  normal-flow siblings that **follow the strip in the DOM**
  (`DeskFrame.tsx:231` then `:234`), beginning at the host's own padding-left
  (`.desk-frame-host`, `index.css:2616`).
- `--frame-host-pad-x: clamp(16px, 3vw, 40px)` (`index.css:127`). At 1280px,
  `3vw` = 38.4px.

So the strip is pulled out to x=0 and spans **0–84**, while the stage begins at
**38.4** and runs right. **Neither carries a `z-index`** — a grep of the whole
of `index.css` finds no `z-index` on `.desk-frame-strip`, `.desk-frame-stage`,
`.desk-frame-stagecol` or `.wz-cascade-panel`. Both are `auto`, so painting
order is DOM order, and the later sibling wins. The stage covers the strip's
**38.4–84** band — 45.6 of 84px, the ~54% PW1 measured — and a strip item's own
centre (x≈42) lands inside it.

**Why no harness caught it:** every existing driver reaches these controls with
`.click()`, which dispatches on a node it already holds and never consults the
hit-testing stack. `pw1.mjs` found it only because it drives real CDP pointer
events. This is the probe law's second half doing exactly what it is for.

**THE FIX IS STACKING, NOT GEOMETRY — and the distinction is load-bearing.**
Moving the stage clear of the strip would move the paper. **Paper never
reflows for chrome**, and the probe asserts the dock flush at 0.00px; a
geometry fix would trade one law for another. The strip must instead win its
own band in the stacking order.

**The overlap census, which is the safety argument for raising it:**

| what | where it lives | can a raised strip cover it? |
|---|---|---|
| cascade panel/layers | absolutely positioned **inside** `.desk-frame-stage` (`DeskFrame.tsx:105-106`) | no — anchored flush at the strip's right edge, x=84 |
| tool sliver | absolutely positioned inside the stage (`DeskFrame.tsx:118`) | no — paper-mounted, right of the band |
| tutor panel/grip | absolutely positioned inside the stage (`DeskFrame.tsx:125`, `:142`) | no — right-edge anchored |
| modals, backdrops, toasts | `position:fixed`, z-index **80–300** | no — far above any low z on the strip |

Nothing legitimately overlaps the strip's band, so nothing falls under it.

---

## §2 · THE NARROW SHELL'S "INK" BAR — A DIAGNOSIS CORRECTED BY MEASUREMENT

**The bar Nick sees on his phone is the OLD `PEN_INKS` text-colour bar. It is
NOT the Ink wave's options zone.** The desk's first reading — a locked door,
the Ink wave's zone rendering where the stratum never mounts — is **falsified**,
and the correction is the whole value of this survey.

`ModeStage.tsx:413-429`:

```jsx
{!framed && (
  <div className="mode-bar mode-dissolve" role="toolbar"
       aria-label={rail.tools === 'pen' ? 'Pen' : 'Format'}>
    {rail.tools === 'pen' ? (
      <>
        <span className="mode-tlabel">ink</span>
        {PEN_INKS.map(...)}
        <button className="mode-nib" title="Nib styles — coming soon">nib · fine ▾</button>
```

**Five facts settle it:**

1. **`{!framed && ...}`** — the bar renders ONLY below the gate. The narrow
   shell is unframed, which is precisely why it appears on the phone and
   nowhere else.
2. **The swatches are `PEN_INKS`** (`ModeStage.tsx:45`) — three TEXT colours,
   `#1a0f06 / #b8231f / #1f4fb8`. Not stroke inks.
3. **The label is the literal lowercase `ink`**, uppercased by CSS — the "INK"
   he read.
4. **`nib · fine ▾` predates the Ink wave by ten weeks.** Introduced
   `d65065c`, **2026-06-28**; the Ink wave's own `inkNibFine` landed
   `af3c79c`, **2026-09-07**. The shared word "nib" is what made this look
   like Ink-wave evidence. It is a 2026-06 placeholder.
5. **The Ink options zone is elsewhere and never mounts here** — it lives in
   `Sliver.tsx:410-415` behind the framed path, using `t('inkNib')` and the
   lexicon's `nibLabel`, not hardcoded strings.

**Consequence: there is no locked door to gate.** G3 is already satisfied by
construction on this surface — the Ink zone cannot render there. What is
wanted instead is the rename.

**And the rename has an argument of its own the survey turned up:** that bar's
`aria-label` is **already `'Pen'`** in pen mode. The same control carries two
names — assistive tech has been getting the right one while the eye gets the
wrong one. Renaming makes the eye agree with the aria-label rather than the
reverse.

### The one real locked door on that bar

`nib · fine ▾` is `title="Nib styles — coming soon"` — a control promising a
capability the narrow shell does not have. That IS G3's locked door, in
miniature, and it goes **absent** (never grayed: what isn't built doesn't
render) until item 131 brings real nibs to the phone.

---

## §3 · SCOPE — SIBLINGS FOUND, DELIBERATELY NOT TOUCHED

Named here so they are not mistaken for oversights, and so a later lane can
find them:

- **`ModeStage.tsx:433` — `<span className="mode-tlabel">format</span>`** is
  the same inline-literal species as the `ink` label being renamed, on the same
  bar. The ruling is "nothing else on that bar changes", so it stays. It is a
  real instance of the strings-enter-the-lexicon rule and belongs to whoever
  takes that bar next.
- **`Spread.tsx:332, 334-335`** — `'All'`, `'Text'`, `'Text+ink'` are inline
  literals beside the `'Ink'` chip that IS being folded in. Only line 333 was
  ratified; its three neighbours stay, for the same scope reason.

---

## §4 · WHAT THIS COMMIT CHANGES

**Nothing.** This is the survey, landed before any patch, so the reasoning
above can be checked against the code it describes before the code moves.
