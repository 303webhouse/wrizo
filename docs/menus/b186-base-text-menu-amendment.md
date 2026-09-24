# ITEM 186 — THE RIGHT-CLICK MENU IS THE APP'S: A BASE MENU (B / I / U), WITH THE CONNECT ACTS GATED BY THE SWITCH
### PLAN desk · 2026-09-24 · **amendment to `b-exp1-connect-from-the-page.md` §3** (the door, item 186) · owner **PW**; the switch is **TOOLS'** (item 190)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `52578ee`. Line numbers are a courtesy.
> **Nothing in the Experiment 1 brief is rewritten in place** — §8 names what is superseded, kept as written.
> **The record:** Nick's words below reached this desk verbatim in Fable's relay; the ledger governs if the two differ.

---

## §0 · HIS WORDS, AND THE RULING

> *"Is B-I-U included in the right-click menu? If not, it should be."*

**Fable's ruling: item 186's BASE menu — B / I / U — joins the app itself, beside the strip's tools, OUTSIDE the
experiment; PW builds it. The menu is the app's; the CONNECT acts (Experiment 1's) are gated by the switch.**
*This is the build the earlier ruling anticipated: "Styling stays where it is today and joins the menu with item 186's own
build" (chat 1's entry on Experiment 1's right-click menu).* **The answer to his question is: not today — and now yes.**

## §1 · THE MENU, IN TWO PARTS

```
┌──────────────────────────┐
│  Bold                    │   ← the BASE menu: the app's own. Present with every switch off.
│  Italic                  │     Where the mode has styling tools, on a selection.
│  Underline               │
│  ────────────────        │
│  Cut                     │
│  Copy                    │
│  ══════════════════      │   ← below here: EXPERIMENT 1's connect acts — present ONLY with the switch ON,
│  Make a card             │     in his order; absent (never greyed) with it off.
│  Link to…                │
│  Note This               │
│  Remove this link        │   ← only on a linked span (the menu names which of the two it does)
└──────────────────────────┘
```
- **His order, kept:** *"styling · Make a card · Link · Note This · Remove"* — **styling first, then the connect acts.**
- **It opens at the pointer and may lie over the page** *(item 166's exception (a) — "a right-click menu on the text or
  surface"; the guideline's class of transient surfaces).* **It moves nothing** *(page primacy: the page's rect never
  changes and the editor never unmounts).*

## §2 · THE BASE MENU'S CONTENT — B, I, U, and two more this desk adds on purpose

- **Bold · Italic · Underline — his words.** **They are the SAME ACT as the strip's tools, not a second implementation:**
  **the menu calls the strip's own function** *(`applyRailFormat` → `applyFormat` in `store/draftFormat.ts`, guarded on the
  Draft mode today)* **and reads the same state** *(`marksAt`) so a row shows whether the selection already carries the
  mark.* **The mode's selection-based styling tools are read from ONE registry that both the strip and the menu render
  from — so they cannot diverge — S0 finds it (`Sliver.tsx`'s format cluster).** *"One menu, never a second menu with
  different contents."*
- **Where it exists = where the tools exist** *("the styling TOOLS stay where they were ruled", Fable's 206 ruling —
  rendering is not styling):* **today the rail's Bold/Italic/Underline act in Draft only; the menu appears in exactly
  those modes.** **Free Write (the forward-only typewriter), a screenplay page and Ink get NO base menu — they have no
  styling tools to mirror — and their right-click stays as it is.**
- **Only these three styling rows.** *Heading, Strike, Spacing, bulleting, indenting stay on the strip:* **his law is "as
  minimal as possible (same goes for all strip menus)", and the menu is a SHORTCUT to the three he named, not a mirror
  of the strip.** **On a selection only** *(the strip's own law: a tool is something that happens to a portion of the page
  that is selected, or where the cursor is; the cursor-position tools stay on the strip).*
- **CUT and COPY — this desk's call, with its reason.** **Today a right-click on text shows the BROWSER's own menu on the web
  (Cut, Copy, Paste, Select All); in an Electron shell Electron itself supplies no default context menu and no
  main-process file in this tree sets one — UNVERIFIED per shell, S0 confirms** *(and `ForwardOnlyEditor` sets
  `spellCheck={false}`, so no spelling suggestions live in it either).* **Once the app's menu
  takes the right-click on a selection, the web writer LOSES Cut and Copy from it — a regression nobody asked for.** **So
  they join, beneath the styling rows.** **PASTE IS DELIBERATELY NOT IN THE MENU:** *a menu "Paste" needs the async
  clipboard API (a permission prompt) or a blocked `execCommand`; Ctrl/Cmd+V works and is where the paste rail (the
  foreign-voice wall) already lives — a second paste door would be a second wall to police.* **Select All is not added
  (Ctrl/Cmd+A).** **A call, vetoable; Nick asked only for B/I/U.**
- **NO visible shortcut hints.** *Ctrl/Cmd+B/I/U currently DO NOTHING in the app's own editor (the writing-surface S0's
  finding 9) — a menu that printed "Ctrl+B" would promise what does not work.* **If item 206 lands the accelerators,
  hints may be added then; until then the rows carry only their words.**
- **A DEPENDENCY, NAMED, NOT THE MENU'S TO FIX:** *the strip's Bold "always wraps; there is no toggle" (S0 findings 4–5:
  pressing Bold twice makes `****Plain****`).* **The menu inherits whatever the strip does — item 206 owns the fix.**
  **The menu MUST NOT fork the behaviour (no menu-only toggle); it ships WITH or AFTER 206's formatting fixes**, *or its
  rows repeat a defect the founder is already reporting.*

## §3 · THE CONNECT ACTS — Experiment 1's, unchanged in content, gated in presence

**Make a card · Link to… · Note This · Remove this link** *(Experiment 1 §3, unchanged in behaviour: "Remove" unlinks and
never deletes; the row says "Remove this link"; Make a card lands on the connected board or the page's plan board)* **—
appearing ONLY when Experiment 1's switch is ON, and ABSENT (not greyed) when it is off.** **The gate is read from ONE
place — `store/experiments.ts` (item 190, TOOLS') — and PW builds NO second gate.**
- **With no selection:** *the text acts are absent (the house law); the cursor-position connect act — "Note This" at the
  caret — appears only with the switch ON.* **So with the switch OFF and no selection, the app's menu has NO rows — and
  does NOT open (§4).**
- **A selection inside a linked span** *(switch ON)* **adds "Remove this link" beside the others.**

## §4 · WHICH MENU OPENS — one handler, decided by the target (so nothing races)

**ONE `contextmenu` listener on the writing surface's root chooses; no two handlers.** *In this order:*
1. **A proofing-marked word in Revise → the proofing card** *(item 204 part 2 §1 — the same gesture, a different, targeted
   menu; marks exist only in Revise).*
2. **A non-text target — a card, a page card, a board-card, a list row, the canvas → NOT this handler:** *item 168-C's
   "thing" menu (the row/card's existing `⋯` contents) owns it* — **168 §4: "A text menu (cut, copy, format) is a different
   menu about a different thing."** **This amendment IS that text menu; the two never share a contents list.**
3. **A non-empty selection in a text surface whose mode has styling tools (Draft) → the base menu** *(plus the connect
   acts, if the switch is ON).*
4. **No selection: the switch ON → the cursor-position rows ("Note This"); the switch OFF → the app's menu has nothing to
   show, so it does NOT intercept: the platform's own right-click stands, exactly as today.** *(The app takes the
   right-click only when it has something to offer — so the writer's habits and the web's native menu are never removed for
   an empty box.)*
5. **Any other surface** *(Free Write, screenplay, ink, chrome)* **→ untouched.**
- **Touch and pen have no right-click.** **The strip remains the path.** *A touch gesture for the menu is the unresolved
  item 168 §4 already names (long-press is spent on native selection handles and card drags) — NOT decided here.*
- **Keyboard:** *the Menu key and Shift+F10 open the SAME menu at the selection.* **Esc closes; focus returns to the editor;
  the menu is `role="menu"` with `menuitemcheckbox` rows for Bold/Italic/Underline** *(the `marksAt` state is the checked
  state).*

## §5 · THE ACTS MUST NOT DISTURB THE SELECTION

*A menu press that collapses the selection would apply nothing or apply to the wrong range* — **`draftDecoration.ts`
rule 1 already refuses to rewrite the DOM under a non-collapsed selection, and the strip's rail clicks are the
working precedent.** **The menu's rows take the press without moving focus or selection** *(`pointerdown`'s default
prevented; the range is captured before the menu opens and restored after the act)*; **each act is ONE atomic step in the
editor's own undo stack** *(the rail click's FX6 S1 recipe)* — **Ctrl/Cmd+Z reverts exactly one press.**

## §6 · WHO BUILDS WHAT, AND THE ONE ASSERTION THIS CHANGES
- **PW** builds the menu component, the base rows, the dispatch (§4) and the connect rows; **TOOLS** owns the switch. **The
  base menu is NOT behind any switch** *(outside the experiment — Fable).*
- **⚠ THE EXPERIMENT'S PROMISE NEEDS ITS EXACT WORDS.** *Nick chose experiments with "one switch per piece, off by default —
  with every switch OFF, v2 behaves as v1, and that is assertable."* **The base menu is NEW app behaviour outside any
  switch, so the assertion must read: with every switch OFF the app is v1 PLUS EXACTLY the base menu (§1's upper half) —
  no connect act, no anchor, no rail Linked list.** **Experiment 1's "off = v1" check is re-scoped accordingly: the old
  assertion is SUPERSEDED with a pointer here, kept verbatim — never edited (park, don't edit) — and its successor
  asserts the base menu's exact rows.** **Audit the park COUNT against the list, never the pass/fail line.**

## §7 · THE CHECKS OWED (standing laws: drivers never assume existence · **real pointer events with `button: 2`** · seed through the seams · absolute worktree path · select by name)
1. **Switch OFF, Draft, a selection, right-click:** *the menu opens at the pointer with EXACTLY Bold, Italic, Underline, Cut,
   Copy* — **and no connect row exists in the DOM** *(absent, not `aria-disabled`).*
2. **Switch ON:** *the same rows, then Make a card · Link to… · Note This, in that order; "Remove this link" only on a linked
   span.*
3. **Bold applies exactly as the strip's Bold does** *(spy on the one function; the stored text is byte-identical to a
   strip click on the same selection)* — **including its current defect until 206 lands: the check asserts EQUALITY with the
   strip, never a hard-coded expectation.**
4. **The selection survives the press** *(the range before equals the range after; the editor is not unmounted; the page's
   rect is byte-identical open and closed)*; **one Undo reverts one press.**
5. **No selection + switch OFF: the app's menu does NOT open and the platform's right-click is not `preventDefault`ed**
   *(asserted by the event's `defaultPrevented`).* **No selection + switch ON: only "Note This" is offered.**
6. **Free Write, a screenplay page, an ink surface, a card, a page card, a board-card: NO base menu** *(a probe per
   surface; each asserts its own existing behaviour is untouched).*
7. **One handler:** *right-click on a proofing-marked word in Revise opens the proofing card and NOT this menu; the two never
   open together.*
8. **Keyboard:** *Shift+F10 opens it; Esc closes; focus returns to the editor; the rows expose `menuitemcheckbox` and their
   checked state from `marksAt`.*
9. **Release where the writer releases:** *right-click, then release and click OUTSIDE the menu → it closes and nothing is
   applied and nothing is left armed.*
10. **No visible shortcut text on any row** *(until 206 ships real accelerators).*
11. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

## §8 · WHAT THIS SUPERSEDES — marked, never erased
- **Experiment 1 §3's "His list, in his order: styling · Make a card · Link · Note This · Remove" and its "On a SELECTION.
  With no selection the text acts are ABSENT"** → **stand; "styling" is now BUILT (§2), and the menu's rows split into the
  app's base half and the experiment's gated half (§1).** **Chat 1's earlier line "Styling stays where it is today and joins
  the menu with item 186's own build" is FULFILLED by this amendment, not contradicted.**
- **Experiment 1's "with every switch off, v2 behaves as v1" assertion** → **re-scoped (§6).**
- **Unchanged:** the connect acts' behaviour, `store/anchors.ts` (PW is its sole writer), the switch (TOOLS'), 168's thing
  menu (168-C), 204's proofing card, item 166's transient-surface class.

## §9 · WHAT THIS DESK DOES NOT DO
*No mockup, no build, no harness.* **It does not fix the strip's non-toggle Bold (206's), does not decide touch, and does
not add Paste, Select All or shortcut hints.**
