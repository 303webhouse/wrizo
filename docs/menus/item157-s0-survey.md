# ITEM 157 · THE INK SHEET COVERS THE PAGE — S0 SURVEY
### ink lane · 2026-09-19 · worktree `.claude/worktrees/item157-ink-sheet` · branch `item157-ink-sheet` off `origin/main` **pinned at `4600d7f`**
### read from disk, browserless, no box taken. Nothing is patched until this is committed.

---

## §0 · THE FINDING, AND WHOSE IT IS

Nick, verbatim (founder sitting, Batch Three): *"The ink is hard limited to a
kind of text box, not the entire page surface like it should be."*
**Founder-ruled: the entire page surface.**

**The cause is this lane's own design decision in item 121**, and the record
shows it was half-seen at the time and misfiled. Stated plainly before anything
moves, because Fable asked for the purpose *before* the fix — and because the
purpose was real and still has to be honoured.

---

## §1 · WHAT THE SHEET IS BOUND TO TODAY

- `inkSheetRef` — [PageEditor.tsx:192](apps/desktop/src/pages/PageEditor.tsx#L192),
  bound at [:694](apps/desktop/src/pages/PageEditor.tsx#L694)
  (`ref={el => { warmWrapRef.current = el; inkSheetRef.current = el; }}`), passed
  to the stratum at [:767](apps/desktop/src/pages/PageEditor.tsx#L767).
- The element is `div.wz-ink-sheet` ([:695](apps/desktop/src/pages/PageEditor.tsx#L695),
  `position:relative; width:100%; minHeight:100%`) — **`editorBody`'s own
  wrapper**, rendered by `ModeStage` **inside `.mode-scroll`, inside `.mode-page`**.

The stratum uses that ONE element for **three** jobs: it is where the canvas
paints, where the pointer is heard, and the coordinate basis every stored point
is normalized against. §4 is about pulling those apart.

## §2 · WHAT THE SHEET LEAVES OUT (read from CSS; the harness measures it)

`.mode-page` — [index.css:2339](apps/desktop/src/index.css#L2339) and the framed
override at [:2887](apps/desktop/src/index.css#L2887) — is the paper:
`padding: calc(30px·scale) calc(var(--wz-page-pad-x, 38px)·scale)`, fixed height
(framed: fills the stage), `overflow:hidden`. `.mode-scroll` —
[:2378](apps/desktop/src/index.css#L2378) — sits inside it with
`padding-bottom:30vh`, and the sheet fills only the scroller's content box.

So the ink cannot reach:
- **the left and right margins** — the paper's horizontal padding;
- **the top margin**, and the page title when there is one;
- **the bottom margin, and the scroller's 30vh of run-out below the text.**

That is Nick's "kind of text box", on all four sides.

**⚠ The side margins are not a constant.** They come from **PAGE SETUP**
(`--wz-page-pad-x`, item 83 M3). A writer who chose wide margins lost *more* of
their page to this clipping than one who kept the default — so the defect
scaled with a setting the writer made on purpose.

## §3 · WHY ITEM 121 PUT IT THERE — THE PURPOSE, AND THE COST IT MISFILED

**The purpose was real, and it still holds.** Item 121's survey
([item121-s0-survey.md:217-223](docs/menus/item121-s0-survey.md#L217-L223)):
the paper is *"a fixed-height window with an inner scroller"*, so a canvas sized
to the paper *"would stay nailed to the viewport — ink drawn beside a sentence on
screen two would land on top of screen one's ink."* Binding to the scroller's
content wrapper made ink **scroll with the text**. That is still correct, and
this fix has to keep it.

**The cost was seen and misfiled.** The same survey
([:235-237](docs/menus/item121-s0-survey.md#L235-L237)) lists, under
**"Consequences, all of them wanted"**: *"the scroller inherits `.mode-pagecol`'s
width, less `.mode-page`'s padding."* It noticed the padding was excluded — and
recorded that as a detail of the normalization width, not as ink being unable to
reach the page's margins. Nobody reading it would have seen Nick's complaint in
it, including its author.

**And it moved away from the founder's reading.** Item 121's build brief said
*"canvas rect equals paper rect."* The survey amended that to *"the scroller's
content box"* ([:239-244](docs/menus/item121-s0-survey.md#L239-L244)) — for a
real reason, but the original wording is what Nick now says he wanted.

**So:** item 121 solved scroll-coupling by collapsing three roles into one
element, and the collapse is what cost the margins. The fix is to separate them
again, not to undo the scroll-coupling.

## §4 · THE DESIGN — THREE ROLES, SEPARATED

| role | today | after 157 |
|---|---|---|
| **coordinate basis** (origin + unit of every stored point) | the sheet | **the sheet — UNCHANGED** |
| **render surface** (where the canvas paints) | the sheet | **the paper** |
| **capture surface** (where pen, mouse, double-click are heard) | the sheet | **the paper** |

**⚠ THE BASIS MUST NOT MOVE — PRODUCTION HAS REAL INK ON IT.** Items 121 and 126
shipped in Batch Three (`c873216`, railway `5e06974f`), so writers have strokes
saved as *x and y over the sheet's width, from the sheet's top-left*. Change the
element that defines that, and every one of them shifts and rescales on screen —
a silent migration of the writer's own marks. So the sheet stays the basis;
margins simply become coordinates the basis already allows (x below 0 or above 1,
y below 0). **Zero migration; every existing stroke keeps its exact position.**
(Item 126's C14 already stores x below 0 — the format has room for this.)

**Render on the paper, with the sheet's live offset.** The canvases move to the
paper (`inset:0`, above the scroller, `pointer-events:none` always) and paint
through a translate of (sheet − paper) measured at paint time. When the scroller
scrolls, the sheet's offset changes and the ink repaints — **so ink still scrolls
with the text** (item 121's reason, kept) while covering the whole paper.

**Why a portal.** The stratum renders inside the sheet, inside `.mode-scroll`,
whose `overflow` clips its children. A canvas there can never reach the paper's
left or top margin. So the canvases are portalled into the paper element, found
from the sheet with `closest('.mode-page')` — `PageEditor` does not change.

### Roads not taken, named so the choice can be checked
- **A paper-sized canvas with no scroll repaint** — item 121's original worry,
  exactly: ink nailed to the viewport.
- **Restructure the CSS so the scroller spans the whole paper** — moves
  `.mode-page`'s padding into the scroller; touches PAGE IS PRIMARY, the
  typewriter fade's hold band, and `--wz-page-pad-x`'s plumbing. Far wider than
  the defect.
- **A canvas inside the scroller with negative offsets** — clipped at the
  scroller's left and top edges; could never cover those margins.

## §5 · WHAT CHANGES FOR THE THREE THINGS FABLE NAMED

**1. Hit-testing (`strokeAt`) — the function does not change.** It is pure and
takes basis coordinates. What changes is *where the double-click is heard*: on
the paper, so a drawing in the margin can be grabbed. The event is still
converted relative to the **sheet**, giving x below 0 in the left margin — which
`strokeAt` already handles. The miss path is unchanged: a double-click on bare
text still selects a word; one on a bare margin finds nothing and does nothing.

**2. The eraser — its geometry does not change.** An erase is a stroke in the
same basis, painted `destination-out` on the committed canvas (now paper-sized).
What moves is the **ring preview**: it was positioned in sheet coordinates inside
the sheet, so it could never appear over a margin. It moves to the paper and
tracks the pointer there.

**3. The group-move clamp — its bounds change, and so does its signature.**
Today `clampDelta(box, dx, dy, maxY)` stops a group at the **sheet's** edge
(x in 0..1, y in 0..height/width). The founder-ruled edge is the **paper's**. So
it takes a **bounds box** instead of a single `maxY`: the paper's left, right,
top and bottom expressed in sheet coordinates — measured at drag time, with the
top accounting for scroll (the page's top edge is above the sheet by the top
margin plus however far the writer has scrolled).

## §6 · A NEW HAZARD THIS FIX WOULD CREATE — NAMED BEFORE IT IS BUILT

Hearing the pointer on the **paper** means hearing it over the **scroller's
scrollbar** too, which the sheet never covered. In INK, a press on the scrollbar
would start a stroke instead of scrolling — **scrollbar-dragging would break in
INK mode.** The capture path must ignore presses in the scrollbar gutter, and the
harness must prove a scrollbar drag in INK still scrolls and draws nothing.

## §7 · THE PARK SURFACE — statically SIX, plus one sampler that could lie

Assertions this fix falsifies, because they equate the canvas with the sheet or
stop a move at the sheet's edge:

| file | line | claim | becomes |
|---|---|---|---|
| `item121.mjs` | [179](apps/desktop/scripts/harness/item121.mjs#L179) | S1 — canvas box IS the sheet's box (runs at 2 widths × drawer open/closed) | canvas box IS the **paper's** box |
| `item121.mjs` | [242](apps/desktop/scripts/harness/item121.mjs#L242) | S2 — canvas RESIZED with the sheet, "still one box" | canvas resizes with the **paper** |
| `item126.mjs` | [170](apps/desktop/scripts/harness/item126.mjs#L170) | C1 — canvas box IS the sheet's box (all three modes) | … IS the **paper's** box |
| `item126.mjs` | [419](apps/desktop/scripts/harness/item126.mjs#L419) | C8 — "x never below 0, y never below 0" | stops at the **paper's** edge |
| `item126.mjs` | [447](apps/desktop/scripts/harness/item126.mjs#L447) | C8b — stops at the edge, x0 ≥ 0 | stops at the **paper's** edge |

(S1 and C1 each run more than once — the *assertion lines* are six, the
*emitted checks* more. The count that matters is the executed one.)

**⚠ THE SAMPLER THAT WOULD PASS FOR THE WRONG REASON.**
[item121.mjs:463](apps/desktop/scripts/harness/item121.mjs#L463) — S7's eraser
check converts a stored point to a canvas pixel as `mid.x × canvasWidth`. That is
only right while the canvas *is* the sheet. Once the canvas is the paper — wider,
and offset by the margins — it samples the wrong spot, and the eraser check could
pass or fail having looked at empty paper. **This is not a park (the claim is
unchanged); it is a helper to re-point**, and it has to be proven to discriminate
again, not assumed to.

**Statically six. Not measured.** This lane has published an undercount before
(item 121: said 5, was 8, the missing three invisible to a green unparked run).
The count is settled by running both settings, and every park emits its JSON.

`fx4.mjs` and `fx5.mjs` mention `.ink-committed`, but only in comments about the
retired legacy Journal surface.

## §8 · WHAT THE HARNESS OWES (the brief's "stroke outside the text block")

1. A stroke drawn **in each margin** (left, right, top, bottom run-out) **persists
   and renders** — read back from storage *and* from painted canvas pixels at the
   right place.
2. **The canvas box IS the paper's box**, in all three modes, both widths.
3. **Existing ink does not move** — a stroke seeded in the old basis paints at the
   same screen position before and after (the zero-migration claim, measured).
4. **Ink still scrolls with the text** — scroll the page; the ink's screen
   position moves by exactly the scroll delta.
5. **Margin ink is grabbable in Draft** — double-click it, move it, it stops at
   the paper's edge.
6. **The ring shows over a margin** with the eraser armed.
7. **A scrollbar drag in INK scrolls and draws nothing** (§6).

## §9 · SEQUENCING

Branched from `4600d7f`, after items 121 and 126 merged and Batch Three shipped.
Item 126's worktree is retired (both its branches were on main first). Build and
browserless verification next; the suite waits for an announced turn.
