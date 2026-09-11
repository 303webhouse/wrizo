# ITEM 126 · INK ACROSS MODES (121-B) — BUILD BRIEF
### drafted by the INK lane, browserless, 2026-09-08 · authority: **item 126, Nick's words on the ledger**
### worktree `.claude/worktrees/item126-ink-across-modes` · branch `item126-ink-across-modes` off `origin/main` — **never the primary checkout, never a shared tree**
### founding fact: **item 121's offer record §7A, the render table** (`docs/menus/item121-offer-2026-09-07.md`)

---

## §0 · STANDING RULES

Commit = push, to `origin item126-ink-across-modes` only — never `main`, never
force, never another lane's tree. **S0 FIRST: nothing is patched until the
survey is committed.** Disk wins over this brief — every line below was written
browserless from `origin/main @ 39eacae`, and anything that has moved since is
the disk's word, not this document's.

**A WORKTREE ISOLATES FILES, NOT THE BOX.** One machine, one browser pool; a run
from any tree is a run on the box. Take the box only in the announced order.

Anchor law is build law: the stratum is a **child of the paper**, anchored by
layout, never by script; every self-check compares two independently rendered
boxes. Plateau register: olive rests, brass is evental press; every new string
enters the lexicon. `prefers-reduced-motion` respected. **A NEW COLUMN IS A
SCHEMA STOP** — this brief authorizes no migration, and §B5 argues that none is
needed. **Merge and deploy are Nick's, separately.**

---

## §1 · THE CHARTER, VERBATIM

Nick, on the ledger at item 126:

> both text and ink should be editable and able to be overlapping in Free Write
> mode. Once the user switches to Draft or Revise mode, INK no longer becomes
> directly editable but can be moved around if the User double clicks on it.
> Text is not movable — only editable by standard in-line word processing led by
> a cursor.

**Ruled from it:** the ink stratum **renders in every mode** — it is *the page's
ink*, not Free Write's decoration. **Editable in Free Write. Locked-but-MOVABLE
on double-click in Draft/Revise. Text is never movable, in any mode.**

---

## §2 · THE FOUNDING FACT (item 121 §7A, measured)

| | today |
|---|---|
| **RENDER** | **Free Write only.** `{framed && mode === 'journal' && <InkStratum …/>}` — in Draft and Revise the component does not mount: `stratumMounted:false`, `canvasCount:0`. |
| **PERSIST** | **Fully intact.** A stroke survives Draft's autosave, Revise's autosave and a reload, carrying `tip`/`nib`/`ink`. Both save paths spread the latest row. |
| **RETURN** | **Byte-identical repaint** — 2035 painted pixels before, on return, and after reload. |

**So item 126 is a RENDER question, not a recovery one. The ink is already on the
row, in every mode, correct. NO MIGRATION IS OWED, and none may be invented.**

---

## §S0 · THE SURVEY — from disk, before any patch

Report, with file and line, from `origin/main` at the branch point. Six of these
this lane already answered browserlessly and they are given below as *claims to
verify, not facts to trust* — re-read them, because main has moved.

1. **The one gate.** `PageEditor.tsx` — the InkStratum mount (claim:
   line ~684, `{framed && mode === 'journal' && (`). Confirm it is the ONLY
   place the stratum's presence is decided.
2. **The sheet is already universal.** Claim: `.wz-ink-sheet` (`PageEditor.tsx`
   ~622) is rendered **unconditionally** inside `editorBody`, and `editorBody`
   is handed to **one** `ModeStage` for all three modes (~1153 framed, ~1221
   legacy). **If true, the mount extension is one condition, not a new
   surface** — the box the canvas anchors to already exists in Draft and Revise.
   *Verify this first; the whole shape of B1 depends on it.*
3. **The editor split.** `ForwardOnlyEditor.tsx` — claim: `const freeEdit = mode
   === 'drafting' || mode === 'revise'`. Draft and Revise share one editor path,
   so they share one permission state; Free Write is the odd one out, not them.
4. **What is NOT a mode.** The Screenplay surface is `ScriptEditor.tsx`, a
   different page KIND, and Board ink is `box.strokes` in `BoardEditor.tsx`.
   Neither is a "mode" of a prose page. Name them explicitly as out of scope, or
   surface them if you disagree.
5. **Existing double-click bindings, and the collision risk.** `BoardEditor.tsx`
   already binds `onDoubleClick` (text edit / page-pin travel) and a
   `.board-handle` dblclick (`armThreadDrag`), and **item 128 rules double-click
   as the gesture that travels INTO a nested board.** Census every dblclick on
   the page surface before adding one.
6. **What item 121's harness already asserts about Draft**, so you know what you
   will and will not falsify. Claim: `item121.mjs` S10 asserts the TEXT|INK
   switch does **not** mount on Draft (still true after this ticket — Draft gains
   no drawing and therefore no instrument switch), and asserts **nothing** about
   the stratum's absence in Draft. **If that second claim is wrong, the check it
   names is a park, and finding it is S0's job, not the suite's.**
7. **Sweep behaviours, not strings.** Grep for what this change DOES — "the
   stratum is Free Write's", "ink only renders in Free Write" — across harness
   files and comments, not just for the class names.

**Commit:** `Ink-B: S0 — survey (the one gate, the universal sheet, the editor
split, the dblclick census, the park surface)`

---

## §B1 · THE MOUNT EXTENDS — one condition, not a new surface

If S0 §2 holds, the mount becomes `{framed && (<InkStratum …/>)}`: the stratum
renders in **all three modes**, because it is the page's ink.

**`active: boolean` is retired for a three-state permission** (see B2) — the
current prop cannot express the new world, and a second boolean beside it would
let the two drift into an unrepresentable state.

**Framed-only stays.** Below the 1100px gate the page keeps its pre-121 terms,
per the 112-A rider; item 126 does not lift that, and lifting it silently would
be this lane widening its own charter. (Item 121's offer named the reach cost;
it is still open and still Nick's.)

**Accept:** the stratum's canvas box IS the sheet's box on every edge in **all
three modes**, at both reference widths, drawer open and closed — the same
two-independently-measured-boxes anchor check, three times. Ink drawn in Free
Write is visible at identical normalized geometry after switching to Draft and to
Revise (the founding fact's inversion, and the ticket's whole point).

**Commit:** `Ink-B: B1 — the stratum renders in every mode (the page's ink)`

---

## §B2 · THE PERMISSION MODEL — three states, one prop

| mode | instrument | permission | pointer on ink | keystrokes |
|---|---|---|---|---|
| Free Write | INK | **`edit`** | draws, erases, undoes (item 121, unchanged) | do not type |
| Free Write | TEXT | **`inert`** *(RULED — §3.1)* | nothing; passes through to the editor | type |
| Draft | — | **`movable`** | double-click arms a move; otherwise passes through | type |
| Revise | — | **`movable`** | double-click arms a move; otherwise passes through | type |

One prop, `permission: 'edit' | 'inert' | 'movable'`, replacing `active`.

**THE PAPER MUST WEAR IT.** `data-instrument` stays exactly what item 121 made it
— *which instrument the page IS*, Free Write only — and must **not** be
overloaded to mean permission; a Draft page is not "in TEXT", it is a word
processor. Add a separate attribute (`data-ink="edit|inert|movable"`) on the same
paper element, so the harness can read the permission independently of the mode
and the two can be caught disagreeing.

**THE LAW THAT OUTRANKS ALL THREE: TEXT IS NEVER MOVABLE, AND NEVER STOPS BEING
EDITABLE.** In `movable`, a double-click that lands on ink arms a move; a
double-click that lands on **text still selects the word**, exactly as it does
today. That is not a nicety — it is Nick's sentence, and it is the acceptance
check most likely to be quietly broken by an over-eager listener.

**Accept:** each mode's permission is what the table says; the paper's
`data-ink` and the mode never disagree; and in `movable` a dblclick over bare
text performs a normal word selection with no move armed.

**Commit:** `Ink-B: B2 — the mode-dependent permission model (edit · inert ·
movable)`

---

## §B3 · HIT-TESTING — the canvas stays inert; ink.ts answers "did I hit ink?"

**The canvases stay `pointer-events:none`, in every mode.** This is not
conservatism: item 121's routing law is that the *sheet* routes and the canvas
only displays, and it is load-bearing — the eraser's rubbing model paints onto
the committed canvas mid-stroke, and the hover ring reads positions
continuously. A canvas that swallowed events would also swallow every click the
text needs, which breaks Nick's "text is only editable by a cursor" in one line.

So: a **capture-phase `dblclick` listener on the sheet**, which
1. converts the event to normalized sheet coords (**both axes over the sheet's
   WIDTH** — item 121's J8 rule; see the note below, which has already cost this
   lane one wrong check),
2. asks `store/ink.ts` for the stroke under the point,
3. **hit → `preventDefault()` + `stopPropagation()`, arm the move;**
4. **miss → return, touch nothing.** The browser's word-select happens exactly as
   before.

**`strokeAt(strokes, x, y, tolerance)` belongs in `ink.ts` and nowhere else** —
the isolation J9 promised and I5 relied on: only that file knows a stroke's
shape, width or profile. Point-to-segment distance across the polyline;
tolerance derived from `strokeWidth(stroke)` (already exported) plus a named slop
constant, converted into normalized units by dividing by the sheet width, so a
broad marker is easier to hit than a fine pen — which is also true of paper.

> **⚠ THE COORDINATE TRAP, NAMED BECAUSE IT ALREADY BIT.** A stored
> `StrokePoint.y` is normalized by the sheet's **WIDTH**, not its height, and is
> unbounded above 1.0 on a long page. Item 121's first eraser check computed a
> sample point as a fraction of HEIGHT, read empty canvas, and **would have
> passed for the wrong reason** had the numbers fallen differently. Any code or
> check that converts between screen and stored coordinates must denormalize the
> way the renderer does.

**Accept:** a dblclick within tolerance of a stroke arms; one clearly outside it
does not and leaves a word selected; a broad marker's tolerance exceeds a fine
pen's; and `strokeAt` is the only new export outside `ink.ts` that knows stroke
geometry.

**Commit:** `Ink-B: B3 — dblclick hit-testing in ink.ts (the canvas stays inert)`

---

## §B4 · WHAT "MOVABLE" MEANS FOR A STROKE GROUP

Nick's word is *"it"* — the thing the writer double-clicked. Four readings, and
this brief recommends one:

- **(a) one stroke = one unit.** Honest, and useless: a sketch is thirty strokes
  and the writer would drag them one at a time.
- **(b) all ink on the page = one unit.** Predictable and trivial, but you could
  never reposition a single margin note.
- **(c) SPATIAL CLUSTER — RECOMMENDED.** The strokes whose bounding boxes are
  within a gap threshold of the hit stroke's, transitively. This is what the eye
  calls *that drawing*, and it needs **no stored state at all**: the group is
  DERIVED at double-click and discarded on release, so grouping can be re-tuned
  forever without touching a single saved page.
- **(d) temporal run** (strokes drawn in one burst). Cheap and wrong: two
  annotations made in one sitting on opposite margins would move together.

**THE ERASER CLAUSE, and it is not optional.** An erase is a stroke
(`eraser:true`) painted `destination-out`. **Every erase whose geometry falls
within the moved group's box must travel with the group.** Move the ink and leave
the erases behind, and the rubbed-out parts reappear at the old position while
the ink lands at the new one — the page would grow marks the writer had removed.
Assert this directly; it is invisible to a check that only counts strokes.

**The gap threshold** is a named constant with a reason, in normalized units
(≈ one line-height at the paper's measure is the suggested starting value, ≈0.04)
— tunable, asserted, and stated in the offer as a working value rather than a law.

**The move itself:** arm on dblclick → the group lifts with a quiet visible state
(olive at rest; brass only on the press — no new animation vocabulary; respect
`prefers-reduced-motion`) → pointer drag translates every point in the group by
the same normalized delta on both axes → release commits.

- **Clamp**, the exact partner of FX17's bottom stop: the group's bounding box may
  not leave the sheet. Floor and ceiling on both axes, in normalized units.
- **Escape cancels** an armed or in-flight move, restoring the pre-move geometry.
- **Undo is one level**, restoring the pre-move positions — item 121's law
  unchanged (the pen's undo, not the typewriter's; Free Write stays forward-only
  and Draft/Revise keep their own text stack untouched).
- **TEXT DOES NOT MOVE, MEASURED:** a text node's rect before and after a move is
  identical. The ink slides over the words; the words do not budge.

**Accept:** a dblclick on one stroke of a drawing arms the whole drawing and not
the annotation across the page; erases travel with it; the group cannot be pushed
off the sheet; Escape and undo both restore it exactly; the text's rect is
unmoved.

**Commit:** `Ink-B: B4 — the stroke group, its erases, and the clamped move`

---

## §B5 · PERSISTENCE — zero schema, and why no transform field

A move **rewrites the moved strokes' own points** (add the delta, both axes,
normalized units) and saves through the existing path, **merged with live text**
so a pending typed run is never clobbered — item 121's I2 rule, unchanged.

**DO NOT ADD A PER-GROUP TRANSFORM FIELD.** It would change the stored shape for
no gain, and it would force every renderer — `renderStroke`, `renderThumbnail`,
`BoardEditor`'s box ink, anything later — to learn about groups it has no other
reason to know. Rewriting points keeps the blob's shape **exactly** as item 121
left it: `strokes` is an existing `jsonb` column, three optional enums inside it,
and **a move adds nothing at all**. Zero DDL, zero migration, and the
`git diff … -- apps/server packages` check stays empty.

**Accept:** a move round-trips through a reload; `apps/server` and `packages` are
untouched; a page never moved is byte-identical on disk to before this ticket.

**Commit:** `Ink-B: B5 — a move persists as geometry (zero schema)`

---

## §B6 · HARNESS OBLIGATIONS — per mode, both widths

New suite legs, CDP-driven and **trusted** (`Input.dispatchMouseEvent` /
`dispatchTouchEvent` via `app.penStroke` / `app.mouseDown` / `app.doubleClick`),
never `element.dispatchEvent(new PointerEvent(...))`. **Probe before every
gesture** — a bare driver call on a missing node throws, aborts the file, and
reports NOTHING; item 121's `fx7` went `NOVERDICT` exactly that way.

**Per mode:**
- **Free Write / INK** — item 121's 43 checks still green, unchanged. Any red
  here is a regression, not a new law.
- **Free Write / TEXT** — the stratum RENDERS (ink visible while typing) and is
  **INERT** (§3.1, ruled). Item 121's S3 already asserts that inertness, so this
  is a REGRESSION leg, not a new law: a pen stroke makes no stroke, a keystroke
  types, and **a double-click arms NOTHING** — that last clause is new, and is
  the one that proves the ruling rather than assuming it.
- **Draft** — the stratum renders; keystrokes type normally; a pen and a mouse
  stroke create **no** stroke; dblclick on ink arms a move; **dblclick on bare
  text still selects a word**; drag moves the ink; the text's rect is unmoved.
- **Revise** — the same four legs. Not "assumed the same as Draft": they share an
  editor path, which is precisely why a single wrong gate would pass Draft and
  fail Revise, or vice versa.

**Cross-mode, the ticket's own claim:** draw in Free Write → switch to Draft →
the ink is present at identical normalized geometry → move it → switch to Revise
→ the move is there → back to Free Write → still there, and now editable again.

**Regression legs from §7A, re-asserted rather than trusted:** the stroke
survives Draft's autosave and Revise's autosave (type in each, wait past
`AUTOSAVE_MS`, re-read the row) and a reload.

**Also:** the band does not grow in any mode; zero network on every ink act
(fetch/XHR/beacon wrapped and counted, including a move); shots per mode at both
widths.

**Parks:** whatever S0 §6 finds. Originals kept **verbatim** with a successor
pointer, never rewritten. **Count the parks and run BOTH settings before
believing the count** — item 121 published "5" and the true number was 8, and the
three it missed were invisible to a green unparked run because they lived in
`HARNESS_PARKED` sections.

**Commit:** `Ink-B: B6 — harness: per-mode permission, the move, cross-mode
persistence`

---

## §B7 · PROOF AND OFFER

Full stamped suite **both settings** — clean, or every red named as a known
species and parked lawfully. A committed offer record + ledger entry: the offered
SHA; each ticket's commit; both suite runs verbatim; **what was surfaced, not
built**; the park COUNT audited in both settings; and the **real-device sitting**
named, since a move by finger and by stylus on real glass is no more provable
headless than item 121's palm rejection was. Offer to chat 1; hold.

**Commit:** `Ink-B: the wave offered — suite, surfaced seams, deferred list`

---

## §3 · WORDS — one RULED (3.1), the rest still open for Nick

1. **✅ RULED — INK IS *NOT* MOVABLE IN FREE WRITE / TEXT. IT STAYS INERT.**
   *(Fable, from the analog law, 2026-09-08. Nick may overrule.)*

   **The question, kept as it was asked**, because the answer is only legible
   beside it: Nick's sentence names Draft and Revise and is silent on Free
   Write's TEXT half. Two lawful readings were put up — **(a) inert, as item 121
   shipped** (R15 already ruled "in TEXT the stratum is inert", so do not reverse
   a standing ruling the new one is silent about — this brief's lean), and **(b)
   movable**, on the reading that "not currently drawing" is one state wherever
   it occurs. The brief also said plainly that (a) creates an asymmetry: ink
   movable in the two modes where you cannot draw it, and not in the one where
   you can.

   **THE RULING TAKES (a), AND TURNS THE ASYMMETRY FROM A HOLE INTO THE REASON —
   Fable's words:** *in Free Write the sketch pad is one press away (switch to
   INK to move or edit strokes); in Draft and Revise there is no INK to switch
   to, which is exactly why movable-on-double-click exists there.* **A typewriter
   doesn't move ink; a sketch pad does.**

   **What this settles for the build:** `movable` is reachable from Draft and
   Revise ONLY. Free Write keeps exactly two states — `edit` in INK, `inert` in
   TEXT — and both are byte-identical to what item 121 shipped. **The
   double-click listener must therefore be attached under `movable` alone**, not
   "whenever the writer is not drawing"; a listener armed by the absence of INK
   would quietly extend the gesture into Free Write's TEXT half and reverse this
   ruling without anyone typing a word about it. **B6's Free Write / TEXT leg
   asserts the negative** — a double-click there arms nothing.
2. **The gap threshold for a group** (§B4) ships as a working value, not a law.
3. **Double-click is getting crowded.** Item 128 makes it the gesture that
   travels into a nested board. Different surfaces today, so no collision — but
   worth a glance before it becomes three meanings on one gesture.
4. **Below the 1100px gate** ink still does not exist at all (item 121's reach
   cost). Item 126 does not change that, and this brief does not assume it will.

**Untouched from item 121, still open, still Nick's:** the eraser's tip binding
(tip-agnostic as built), the typewriter FACE (now item 127's), the S-Pen barrel
button (hardware-reserved), and pressure as a render input (already stored,
unread).
