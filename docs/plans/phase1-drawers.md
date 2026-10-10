# PHASE 1 — one shared drawer system for the page and the card

**Status: PLAN ONLY — no code. For Fable's review, then Nick's rulings on §10.**
**Branch:** `phase1-drawers` off `main` @ `76916ec8`. **Author:** INK. **Date:** 2026-10-09.
**Source of truth for the design:** the board/card/page build plan (§1 + §3) lives in Nick's claude.ai project, not the repo (ledger,
"NICK APPROVED THE BOARD/CARD/PAGE DESIGN"). INK has the brief as relayed plus the mockups, not the plan text. Anything below that
leans on the plan's wording is marked *(per the brief)*; if the plan says otherwise, the plan wins.
**Mockups read** (HTML/CSS/JS, via git; the PNGs were not viewed): `cursor/r7-mockup` @ `1eb2773` (`docs/mockups/r7/`),
`cursor/card-mockup` and `cursor/rail-mockup` (round 6, frozen; `docs/mockups/{cards,rail}/`). The rail file is byte-identical on
the r7 branch.

**Naming.** In this repo "Drawers" already means the filing containers (D1, `/drawers`, "Add to…"). This plan says **side drawer**
for the new tool panels and `SideDrawer` in code, and never "Drawers" for them. UI strings stay as the mockups have them (no word
"drawer" is shown to the writer).

---

## 0. What Nick has ruled, as I am building to it

| # | Ruling | Where it lands |
|---|---|---|
| R1 | ONE drawer system for page and card | §1 `SideDrawer`; page now, card by the same component (§4 for the P2 boundary) |
| R2 | Fixed arrow tabs; **only the arrow flips** | §2.2 |
| R3 | **Motion: the menu SLIDES out from behind the tab AND FADES in, together; closing slides back AND fades out. Reduced motion: fade only, short.** *(Nick, Oct 9)* | §2.3 |
| R4 | Brass marks every choice | §2.4 |
| R5 | Icons over words | §2.5 |
| R6 | Thin scrollbars | §2.6 |
| R7 | Left drawer: TEXT \| INK, then TYPEFACE, FORMAT, ACTIONS, TEMPLATES. Free Write gets only the simplified Typeface/Format set + INK | §3 |
| R8 | Right drawer: TUTOR \| CONNECTIONS, Connections empty for now | §3.4 |
| H1 | Do not touch `PageEditor.tsx`'s typing path (FIX's typing-speed work) | §6 |
| H2 | No schema change | nothing here needs one (§7) |
| H3 | Templates stay exactly as shipped (`25e6610`) | §3.3, §8 |

---

## 1. Components

The framed layout (≥1100px) already has the two drawers this plan unifies: the **Sliver** (left, tools; `Sliver.tsx`, 1174 lines)
and the **Tutor** (right; `Tutor.tsx`, 1239 lines), plus a third, smaller copy in the board's **card popup dock**
(`BoardEditor.tsx`, `.board-popup-dock`). They are three hand-built shells. Phase 1 gives them one shell and re-sorts the content.

**New (all under `apps/desktop/src/`):**

| Component / module | What it is |
|---|---|
| `components/SideDrawer.tsx` | The shell. Props: `side: 'left' \| 'right'`, `open`, `onToggle`, `tabs`, `activeTab`, `onTab`, `label`, `drawerId` (registers with `menusDrawers`), children = the panel body. Renders `.wz-drawer[data-side][data-open]` > `.wz-drawer-clip` > `.wz-drawer-panel`, and the fixed `button.wz-drawer-tab`. Owns the motion (§2.3), the arrow (§2.2), focus/inert while closed, Escape. Knows nothing about page, card or Tutor. |
| `components/DrawerTabs.tsx` | The tab row (TEXT \| INK, TUTOR \| CONNECTIONS): `role=tablist`, `data-on` = brass (§2.4). Replaces `InkSwitch.tsx`. |
| `components/DrawerSection.tsx` | A heading (`10px`, uppercase, `--accent-rest`) plus body, the mockups' `.h` / `.sec`. |
| `components/DrawerIcons.tsx` | The inline-SVG icon set (§2.5): `viewBox 0 0 16 16`, `stroke currentColor`, `1.2`. |
| `store/drawerSet.ts` | **A pure function** `drawerSet({ surface, kind, instrument })` returning `{ tabs, sections }`. The single table that says what each surface shows (§3). Browserless-testable; the components just render it. |
| `components/drawers/TextDrawerPanel.tsx` | Typeface / Format / Actions / Templates, driven by `drawerSet`. Wraps the existing `TypeControl`, the existing Format section, the existing Templates strip (moved, byte-for-byte behaviour), and the new Actions section. |
| `components/drawers/InkDrawerPanel.tsx` | The existing `SliverInkZone` (tip, nib, ink, eraser) re-homed; Move added only if it already exists as an INK-mode act (§10 Q8). |
| `components/drawers/ConnectionsDrawerPanel.tsx` | The empty Connections pane (Phase 3 fills it). |

**Changed, not new:** `Sliver.tsx` becomes the left drawer's *content builder* wrapped in `SideDrawer` (the foot, goal hairline,
timer and ⋯ instruments row stay exactly as they are); `Tutor.tsx` swaps its own grip/panel markup for `SideDrawer` and puts its
existing content under the TUTOR tab; `BoardEditor.tsx`'s card-popup dock swaps its markup for `SideDrawer` (§4).

**Kept as they are:** `DeskFrame.tsx` and its out-of-flow anchors (`.desk-frame-sliver-anchor`, the Tutor's two anchors), the
Cascade, `menusDrawers.ts` (the two-drawer law), `useChromeDissolve`, `TypeControl.tsx`, the Templates code and CSS.

---

## 2. The system itself

### 2.1 Geometry and the page-primacy law

Today's drawers are **out of flow**: the paper never moves, the drawer overlays the margin (`.desk-frame-*-anchor`). The mockups
instead *reserve* 248px / 236px columns beside the paper even when closed. **I keep the app's way**, not the mockups': reserving
columns would shrink or shift the paper, which `docs/page-primacy-canon.md` forbids. The drawer is still a 16px tab plus a panel;
only the shell's inside changes. Self-check from `AGENTS.md`: (1) page rect unchanged when a drawer opens or closes; (2) the
editor never unmounts; (3) a drawer is a tool, not a departure, so no return chip is needed. §8 turns each into a check.

### 2.2 The fixed arrow tab

`button.wz-drawer-tab`: 16 × 34 at `top: 16px`, on the page-side edge, identical to today's `.wz-sliver-grip` /
`.wz-tutor-grip` (so no geometry change). **Only the glyph changes** between states (`‹`/`›`, mirrored for the right drawer); the
tab's rect, class list and position are constant, and the glyph rule is one pure function `arrow(side, open)` shared by both drawers
(today the two components each hand-write it). `aria-expanded`, `aria-controls`, an accessible name per side.

### 2.3 Motion — Nick's ruling

*Open:* the panel starts clipped behind the tab and **translates in from behind it while its opacity rises, on one transition,
together.* *Close:* the reverse, together.* Concretely:

```
.wz-drawer-clip   { overflow: hidden; position: absolute; … ends 16px short of the tab }   /* "from behind the tab" */
.wz-drawer-panel  { transform: translateX(±100%); opacity: 0; visibility: hidden;
                    transition: transform var(--drawer-dur) var(--drawer-ease),
                                opacity   var(--drawer-dur) var(--drawer-ease),
                                visibility 0s linear var(--drawer-dur); }          /* hidden only AFTER it has faded */
.wz-drawer[data-open='true'] .wz-drawer-panel
                  { transform: none; opacity: 1; visibility: visible; transition-delay: 0s; }
@media (prefers-reduced-motion: reduce)
  .wz-drawer-panel { transform: none; transition: opacity var(--drawer-dur-reduced) linear,
                                                 visibility 0s linear var(--drawer-dur-reduced); }
```

Tokens: `--drawer-dur: .2s`, `--drawer-ease: ease` (the mockups' value), `--drawer-dur-reduced: .12s`. Reduced motion: **no slide, fade
only, short**.

Three traps the plan designs around:
1. **Do not use `--fade-dur`.** The mockups name their slide duration `--fade-dur`, but in the app `--fade-dur` is *written at
   runtime* by `useChromeDissolve` (seconds, up to 120s on resurface; 2.8s on a write). Today's Sliver rides it
   (`.wz-sliver-panel{ transition: opacity var(--fade-dur,.2s)…}`), so a drawer opened while writing would crawl. The new tokens are
   dedicated and never written by JS.
2. **Two opacities on one element.** The Sliver panel is also `chrome-fade desk-dissolve` (chrome dissolves with the writing
   session). Open/close opacity and dissolve opacity must not fight, so **the dissolve classes stay on the outer `.wz-drawer`, and the
   open/close motion lives on the inner panel**.
3. **A closed panel must not be reachable.** Opacity 0 alone leaves controls focusable and clickable. `visibility: hidden` after
   the fade (and `inert` on the panel) fixes it; today's panel only has `pointer-events: none`.

Today's actual motion is a 6px nudge plus fade (`translateX(6px)`), not a slide — so this *is* a visible behaviour change on the
existing Sliver and Tutor, not just a new drawer.

### 2.4 Brass marks every choice

One rule, one place: a chosen option (the active tab, the current face, B/I/U on, the chosen tip/nib/ink, the applied template,
the current scope) wears **brass** — `--brass` text and border, `color-mix(brass 12–16%)` fill — never a filled bar. This is the
mockups' `[data-on]` family and the app's existing `.mode-tbtn[data-on]` / `.wz-template-live[aria-pressed]`. I reuse those
classes rather than add a parallel set, so Templates stay exactly as shipped. **Mismatch to rule on (§10 Q5):** the mockups also turn
the *open tab* brass; the app deliberately wears `--accent-rest` (olive) on an open grip ("where you are", Plateau foundations),
brass being reserved for a *choice*. I keep olive for the tab and brass for choices unless Nick says otherwise.

### 2.5 Icons over words

Tools and actions are icons with a `title` and an `aria-label` (the mockups do this); headings and the four tab labels stay words.
Icons are inline SVG (no new dependency): Pen, Pencil, Marker, Eraser, Move (INK); Tags, Copy, Delete, Header/Footer (Actions).
Templates keep the glyphs that shipped (`BEGINNING_GLYPH`, `TemplateIcon`). The Sprout door is unchanged.

### 2.6 Thin scrollbars

The app already has the global thin scrollbar (`index.css` ~L319, 8px) and a 4px left-hand one on the Sliver panel (`direction: rtl`
trick). The drawer panel gets **one** rule — the Sliver's 4px thin bar, on the panel's *outer* edge for both sides — so the two
drawers match; no new global rule. (`cursor/drawer-handles` @ `ef714d4`, CSS only, is cleared for Batch 12 and also touches
scrollbar rules; I rebase on it if it lands first — §9.)

---

## 3. What moves where

### 3.1 The left drawer: one table (`store/drawerSet.ts`)

| Surface (framed) | Tabs | Sections, in order |
|---|---|---|
| **Free Write** (`mode==='journal'`) | TEXT \| INK | TEXT: Typeface (simplified: face + size −/+, no number box). INK: tip, nib, ink, eraser. *(Forward Lock toggle, Capture list, goal foot: unchanged, kept below the sections.)* |
| **Draft** (`'drafting'`) | TEXT | Typeface (full), Format, Actions, Templates (Screenplay live + 4 coming-soon, as shipped); the existing page-kind chips stay where they are |
| **Revise** | TEXT | Typeface (full) only (the standing "empty drawer opens" ruling) |
| **Screenplay host** | TEXT | Templates only (Screenplay chosen), as today |
| **Board** (page-level) | — | the existing board tools arm unchanged for now (§4, Q9) |
| **Card popup** | TEXT | the existing card dock (B/I/U + small Typeface), moved onto `SideDrawer` unchanged (§4) |

Today's differences from the mockups, all deliberate and listed for review: Free Write has **no Format group** (item 121 I6 / R15,
"no digital styling") though r7 shows B/I/U — see **Q1**; the **INK tab exists only in Free Write** in the app (the instrument
switch is a Free Write notion; Draft "is a word processor, not in TEXT", `PageEditor.tsx` comment at the switch) though r7 shows
it in Draft — see **Q2**.

### 3.2 What moves out of the old places

| From | To |
|---|---|
| The TEXT \| INK hover menu under the Free Write tab (`ModeStrip.tsx`: `.desk-mode-freewrite > .wz-ink-menu > InkSwitch`) | The drawer's tab row. Same state (`PageEditor` `instrument`, `useState<'text'\|'ink'>`, unchanged); only the control moves. |
| `SliverInkZone` (in `Sliver.tsx`) | The INK tab (`InkDrawerPanel`). Unchanged behaviour. |
| The Sliver's Typeface / Format / Templates / page-kind blocks | `TextDrawerPanel`, in the order of §3.1. Templates markup, classes and data attributes untouched. |
| The Tutor's hand-built grip and panel shell | `SideDrawer` (right). Content under the TUTOR tab, untouched. Its measured-width/dock logic and the two anchors stay. |
| The card popup dock's grip and panel (`.board-popup-dock-grip`, `.board-popup-dock`) | `SideDrawer` anchored to the card (§4). |

### 3.3 Templates — exactly as shipped (H3)

Templates are rendered in the Draft arm, `Sliver.tsx` L724–740, from `content.templates` (`{key:'screenplay', label, selected?,
onApply}`), with four disabled stand-ins (Outline, Title page, Bibliography, Custom) and the 16px glyph fix (`645fdf6`). I move the
*block* into `TextDrawerPanel` and change nothing inside it: same classes (`.wz-template-live`, `.wz-template-btn`), same
`data-template`, same `aria-pressed`, same `applyScreenplayTemplate` path. `page-templates.mjs` (119 checks) and
`scripts/page-templates-mutants.mjs` must pass **unchanged**; that is the proof (§8).

### 3.4 The right drawer

TUTOR \| CONNECTIONS. TUTOR = today's Tutor, unchanged inside. CONNECTIONS = an empty panel (Phase 3). The label does not fit a 10.5px
tab (every mockup hacks it to 7.5px) — see **Q10**. Default open state: unchanged from today (closed), not the mockups' "both open".

### 3.5 Actions (new section — the one place Phase 1 adds capability)

No "Actions" menu exists today. Each verb must call something that already exists:

| Verb | Calls | Note |
|---|---|---|
| Copy | `store/clipboard.ts` `copyText` (what Publish → Copy My Words uses) | no new behaviour |
| Header/Footer | the `pageSettings` headers/footers toggles (`PageSetupZone`) | no new behaviour |
| Tags | opens the page's existing tag editor (`PageFace`) | needs a small popover decision |
| Delete | `softDeleteEntry` + the Trash board, behind a "Send this page to Trash?" confirm | **new on a page** — today only board cards and boards can be deleted from chrome. See **Q3** |

---

## 4. The card, and the Phase 2 boundary

Phase 2 (FIX) rebuilds the card. Phase 1 must not do FIX's work, so it stops at the shell: `SideDrawer` supports
`anchor: 'page' | 'card'` (the card mockup hugs the card's edges, the page mockup the page column), and the existing card-popup dock
is re-homed onto it **with its current content only** (B/I/U + small Typeface). The card mockup's fuller left drawer (Actions,
INK, "new INK card" template, the `Connect` button, the fade-while-composing) is Phase 2's content, built on the shell this phase
delivers. *(Confirm: Q7.)*

---

## 5. What gets retired

| Retired | When |
|---|---|
| `InkSwitch.tsx` and `.wz-ink-menu` / `.desk-mode-freewrite` hover menu + CSS (`index.css` ~L3568–3575, ~L4935–4952) | S2 (replaced by `DrawerTabs`) |
| The Sliver's and the Tutor's separate grip/panel markup and their open/close CSS (the 6px nudge, the `--fade-dur` dependence) | S1 (replaced by `.wz-drawer*`) |
| The card dock's separate grip/panel CSS | S4 |
| The three hand-written arrow glyph expressions | S1 (`arrow()`) |

**Not retired in Phase 1, on purpose:** the old class names. ~25 harness files bind to `.wz-sliver-*` / `.wz-tutor-*` /
`data-menus-*` (ab2 alone has ~107 references). So the new shell elements carry **both** class sets (`wz-drawer` *and* the old
`wz-sliver-*` / `wz-tutor-*`) and every `data-menus-*` hook is preserved. The old names go in a later cleanup batch, in one sweep,
with the parks done once. Also not retired: the legacy unframed chrome (`ModeSwitcher`, `ModeStage` bar/rails/gear, `DeskRail`) —
see **Q6**.

---

## 6. Hard limits, and how the plan keeps them

- **H1 — PageEditor typing path.** I will not edit input handlers, `onChange`/`keydown`, `ForwardOnlyEditor`, or anything the
  typing-speed work touches. The **only** `PageEditor.tsx` hunk is the `sliverContent` builder (~L1049–1124) and its `instrument`
  wiring, and I propose moving the builder into a new module (`store/pageDrawerContent.ts`) so the diff in `PageEditor.tsx` is a
  one-line call. A **browserless guard** (§8) fails if `git diff` of `PageEditor.tsx` against `main` leaves that hunk. If FIX
  prefers, that one hunk waits until their work lands (S2 is sequenced late for exactly this).
- **H2 — no schema change.** Nothing here stores anything new. Drawer open/closed state is session state as today. (Q10 below
  proposes keeping it unpersisted.)
- **H3 — Templates.** §3.3.
- **Harness law.** No harness run without Chat 1's grant, browserless included; grant file read first. Every superseded check is
  parked verbatim with a successor, never edited (the standing "park, never edit" rule).

---

## 7. Build slices (each its own commit; the order is the risk order)

| Slice | Content | Product files |
|---|---|---|
| **S0** | Verify + sweep, no code: re-read each pin in §8's park list against the live source; a behaviour sweep (what the change *does*, not what it renames) of the 25 files; confirm Fable's rulings on §10. | none |
| **S1** | `SideDrawer`, `DrawerTabs`, `DrawerSection`, tokens, motion, `arrow()`, closed-panel inert. **Sliver and Tutor adopt the shell with their content untouched** (dual classes). | new components, `Sliver.tsx` shell, `Tutor.tsx` shell, `index.css` |
| **S2** | `drawerSet`, `TextDrawerPanel`, `InkDrawerPanel`, `DrawerIcons`, TEXT\|INK tabs, hover menu retired, Actions. The `PageEditor.tsx` `sliverContent` hunk (§6). | `Sliver.tsx`, `ModeStrip.tsx`, `PageEditor.tsx` (one hunk) |
| **S3** | Right drawer: TUTOR \| CONNECTIONS tabs, empty Connections. | `Tutor.tsx`, new panel |
| **S4** | Card popup dock onto `SideDrawer`, content unchanged. | `BoardEditor.tsx` (dock block only) |
| **S5** | Dead-CSS removal for what S1–S4 replaced; evidence frames; the live walk. | `index.css`, docs |

---

## 8. Harness checks

**New, browserless** — `scripts/harness/drawers-p1.mjs`:
- `drawerSet` table: every surface/kind row of §3.1 (tabs and section ids), including *Free Write has no Format, no Templates, no
  Actions; Draft has all four; Revise has Typeface only; Screenplay has Templates only*. Mutants: add Format to Free Write; drop
  Templates from Draft; give Draft an INK tab.
- `arrow(side, open)` truth table (both sides, both states, and that left/right are mirrors).
- Source pins on the CSS: the panel's transition lists `transform` **and** `opacity` with the same duration and easing; uses
  `--drawer-dur`, never `--fade-dur` (mutant: swap in `--fade-dur`); the reduced-motion block has **no** transform and keeps opacity;
  `visibility` is hidden after the fade; the dissolve classes are on the outer element, the motion on the inner; the tab is 16×34 and
  has no transform/transition on its box (only on colour).
- The H1 guard: `PageEditor.tsx` diff vs `main` is confined to the declared hunk (mutant: touch a handler).
- Thin-scrollbar rule present on the drawer panel.
- Templates block byte-identical to `main`'s (a hash of the extracted block) — the cheap early tripwire for H3.

**New, browser (needs a grant)** — `scripts/harness/drawers-p1-live.mjs` (framed, 1280×800; Plateau and Flux):
- **Page-primacy self-check:** the paper's rect before/during/after open and close of each drawer, each tab, and both at once —
  identical (check 1); the editor node is the same node throughout (check 2).
- **Motion, measured:** sample computed `transform` and `opacity` mid-transition on open *and* on close: both strictly between
  their end values at the same sample (proves "together"); the tab's rect never changes; with `prefers-reduced-motion` emulated
  (`Emulation.setEmulatedMedia`), `transform` stays `none` throughout and opacity still changes, over a shorter time.
- **Arrow:** only the glyph differs between states (rect, classes, position equal).
- **Closed means closed:** every control inside a closed panel is non-focusable and not hit-testable.
- **Content per surface** (control counts, in the style of `item207`): Free Write, Draft, Revise, Screenplay, Board, card popup.
- **Brass marks:** chosen face/tab/template compute to brass; unchosen do not; the open tab is olive (or brass if Q5 flips it).
- **Two-drawer law** still holds at 1280 (both may open) and 1100 (the later open closes the other).
- **Scrollbar:** at 1366×768 with long content the panel shows the thin bar, on the outer edge.

**Existing — must stay green unchanged:** `page-templates.mjs` (119), `page-templates-mutants.mjs`, `tu1/tu2/tu5` (Tutor), `item207`,
`item121`'s ink behaviour (not its switch location), `w2`, `fx2`/`fx3` geometry, `cd2` (Cascade), `ab2` (dual classes keep its pins).

**To park with successors** (the checks whose *claim* changes, found by the survey; S0 re-verifies each): `item121` (the TEXT|INK
hover-menu location), `item83f` (open/close timing on `--fade-dur`, the 6px nudge), `fx18` (drawer arrows mirror), `fx1`/`fx3`
(sliver open/close timing where pinned), `menus-probe` (dock/handle geometry — expected to survive via `data-menus-*`). Estimated: 4–6 files, a handful of checks each.

**Mutation law:** every new check above has a mutant that turns it red; each mutant asserts it *landed* before the red is believed.

---

## 9. Screenshot list (one box turn, after S5; both themes unless noted)

Plateau dark and Flux, 1280×800 unless noted. "O" = open, "C" = closed.

1. Free Write, text, left O — Typeface only (simplified).
2. Free Write, **INK tab**, left O — tip/nib/ink/eraser.
3. Free Write blank: both C, Sprout door.
4. Free Write typed: both C.
5. Draft, left O — Typeface, Format, Actions, Templates.
6. Draft with the Screenplay template pressed (brass).
7. Revise, left O — Typeface only.
8. Screenplay host, left O — Templates only.
9. Right drawer O, TUTOR tab.
10. Right drawer O, CONNECTIONS tab (empty).
11. Both drawers O at 1280; at 1100 (the later one closes the other) — two frames.
12. Board (page-level): left tools arm O, right drawer O.
13. Card popup with its dock O (re-homed, content unchanged).
14. **Motion strips:** left drawer at t≈0, 100, 200 ms on open and on close (three frames each), plus the same under reduced motion
    (fade only, no slide) — the evidence for R3.
15. States: tab hover, tab keyboard-focus ring, a chosen vs unchosen choice (brass mark), a coming-soon Template (dim), an Action
    hover with its tooltip.
16. Scrollbar: Draft drawer at 1366×768 with the page-kind block expanded.
17. Delete confirm ("Send this page to Trash?") if Q3 is yes.

≈ 30 frames. Captured by an evidence tool in `scripts/evidence/` (never `scripts/harness/`, which `run-suite` enumerates).

---

## 10. Questions for Fable / Nick (each with my lean)

1. **Free Write Format (B/I/U).** r7 shows it; the app has none in Free Write by ruling (item 121 I6 / R15), and making B/I/U work in
   Free Write means formatting in the forward-only editor — **a typing-path change (H1)**. *Lean:* Free Write = Typeface + INK in
   Phase 1; B/I/U waits for FIX's typing-path work and a ruling. (The alternative, a dead group, I would not ship.)
2. **INK tab in Draft/Revise?** r7 shows TEXT\|INK everywhere; the app today offers the instrument switch in Free Write only, on
   purpose. *Lean:* Free Write only; Draft/Revise show TEXT with no tab row.
3. **Actions.** Which verbs, and is **Delete** wanted on a page (new capability; soft delete to Trash with a confirm)? Tags needs a
   small popover. *Lean:* Copy, Header/Footer, Tags now; Delete only on Nick's word.
4. **Widths.** Mockup drawer = 220px (204 panel + 16 tab); app Sliver ≈200, Tutor panel measured 280+. *Lean:* keep today's widths
   (changing them re-tunes the two-drawer coexist math and ~10 geometry checks for no visible gain).
5. **Open-tab colour.** Mockup brass; app olive (Plateau). *Lean:* olive for the tab, brass for choices (§2.4).
6. **Narrow screens and phone.** The mockups include ≤720px drawer layouts; the app's framed layout is ≥1100px, below which the
   legacy chrome shows (and `QuickSprint` is always legacy). *Lean:* Phase 1 is framed only; narrow/phone is its own slice after the
   tablet gate, and I would not guess the phone arrow direction (the mockup's phone arrows look un-mirrored; unverified without the
   PNG).
7. **Card scope vs Phase 2.** §4: shell + current dock content only. *Confirm.*
8. **INK "Move"** (r7 lists a Move tool next to Eraser): does an INK-mode move act exist today? If not it is Phase 4 (page ink), not here.
9. **Board left drawer.** r7 shows none on the board; the app's board has a tools arm (Add card, New page card, Existing page…, From a
   deck…) with no other home until R13.iv. *Lean:* keep it, on the new shell.
10. **Connections tab label.** Too long for the tab at 10.5px (every mockup shrinks it to 7.5px, which makes the two right-hand tabs
    uneven). *Options:* (a) the word, smaller, as mocked; (b) all four tabs (TEXT, INK, TUTOR, CONNECTIONS) as icons with a tooltip and an
    `aria-label`, in keeping with "icons over words"; (c) shorter label. *Lean:* (b) is the consistent answer to the brief's rule, (a) is
    the cheapest; Nick's call.
11. **Drawer open/closed persistence.** *Lean:* none (session state), as today; avoids any storage question.
12. **Terminology.** "Side drawer" in code/plan; the writer never sees the word. Confirm no UI string should say "drawer".

---

## 11. Risks

- **Harness volume.** ~25 files touch these surfaces. The dual-class migration is the lever that keeps the parks to 4–6 files.
- **The `--fade-dur` trap** (§2.3) — the most likely silent bug; it has its own check.
- **Two opacities** (open/close vs chrome dissolve) — same.
- **`Tutor.tsx` is 1239 lines and FIX/TU lanes touch it**: S3 is a shell-only edit, and I will rebase just before it.
- **`PageEditor.tsx` collision with FIX** — mitigated by the single declared hunk and the guard; S2 is sequenced late.
- **`cursor/drawer-handles`** (CSS-only scrollbar/handle work, Batch 12) overlaps §2.6; whichever lands second rebases.
- **Unverified here:** the PNG renders of all three mockups; the phone arrow direction; whether `Move` exists as an INK act.

## 12. What I need to start

Fable's read of this plan and Nick's rulings on Q1–Q6 and Q10 (the rest I can lean on). A box grant for the S5 frames and the live
check; no harness run before then. S0 and S1 can start on approval — both are small and low-risk.

---

## Addendum A — Nick's answers (Oct 9), S0 findings, and S1 as built

### A.1 Rulings received
| Q | Answer | Effect on the plan |
|---|---|---|
| Q1 | **A.** Free Write = typeface choices + INK in Phase 1; B/I/U after FIX's typing work | §3.1 Free Write row stands as written (no Format group) |
| Q5 | The open tab stays **olive** ("not a choice the user makes") | §2.4 stands: tab olive, choices brass |
| Q10 | **No icons.** "Connections" is **renamed app-wide, per theme**: Flux = LINK/LINKS; Arbor's word is pending Nick (TIES likely) | The right-hand tab label is read from the per-theme vocabulary (`deskLexicon`) in S3; the word drops in later with no code change. Tab labels stay words. |
| new | **Brass-outlined choices lose their light-orange fill — outline only** | The new shell's choice mark is a brass outline (and brass text), no `color-mix` fill. TOOLS cleans up the rest of the app. This replaces the "12-16% brass fill" in §2.4 for everything the drawers draw. Templates stay exactly as shipped (H3), so their existing fill is TOOLS' to change, not mine. |
| new | Plateau's display name becomes "Arbor" (id stays) | TOOLS does it. Nothing in the drawers hard-codes the word "Plateau". |
Q2, Q3, Q4, Q6-Q9, Q11, Q12 were not answered; I proceed on my stated leans, none of which S1 depends on.

### A.2 S0 — what the sweep found (static reading; nothing was run)
S1 changes two things the harness can see: the **shape of the panels' motion** and **reduced motion**. Everything else the survey listed
(pointer-events and opacity semantics under dissolve and the pop-out hold; the grip's rect and visibility; the anchors; the two-drawer
law; the Tutor's measured width; geometry) is unchanged, because the panel element keeps its box, its `data-open`, its dissolve
classes, its opacity transition on `--fade-dur`, and `pointer-events`.

Pins that S1 falsifies (all in `fx10.mjs`, the Tutor's FX10 S1 motion section) - **parked verbatim with successors in the S1 commit**:
1. "the tutor panel animates opacity + transform" - parked (the panel now animates opacity only);
2. "the sliver panel's reference shape is unchanged (opacity + transform)" - parked (same reason);
   → both folded into ONE successor that measures the panel (opacity, never width/border) *and* its sliding layer (transform), same
   duration and easing on both hands;
3. "the panel's own transform changes open vs closed" - parked; successor measures the **sliding layer** and asserts the panel itself
   stays put;
4. "A15: reduced motion → transition collapses to ~0" - parked; Nick's ruling is fade-only-short, not none; successor asserts the
   panel still fades in a short, non-zero time and the layer has no travel.
Park count: 4 parked, 3 successors (two fold into one).

Pins that **hold** (checked by reading, to be confirmed by the run): `e3` S3 (the two panels' transition duration, properties and
timing function are equal - both are now `opacity var(--fade-dur,.2s) ease`); `fx10` S1 duration/easing equality; `item83f` E1 S5 (the
transition is identical held and unheld); `fx3` S5, `cd1`, `fx10` S3, `e3` S4 (pointer-events and opacity under dissolve/closed).

Not hand-verified, to confirm on the first grant: whether any check reads the panel's own **background or border colour** (none found by
search), and `menus-probe` geometry (dock and handle rects are unchanged by construction).

### A.3 S1 as built - and where it departs from §1/§2.3 (flagging, not hiding)
- **No `SideDrawer` component in S1.** The plan said both drawers would adopt a new shell. On reading the Sliver's shell I found its
  panel carries `chrome-fade desk-dissolve` *and* the pop-out-hold law (`data-popout-hold`, with a long comment explaining why the hold must
  ride **that** element: an ancestor's opacity caps every descendant's). Moving those onto a new wrapper element would re-open settled
  decisions for no gain. So S1 changes the motion **in place** and adds one inner element. `SideDrawer`/`DrawerTabs` arrive in S2, where
  tabs actually need a home.
- **The two-opacities "trap" in §2.3 was mis-stated.** The existing design already multiplexes open/close and dissolve on the one
  `opacity` through `--fade-dur`; that is deliberate and stays. What S1 adds is only the slide.
- **How "together" is achieved:** the panel (outer) stays the clip and the scroller and keeps the fade on `opacity var(--fade-dur,.2s)`;
  the box (background, border) and the slide move onto a new inner `.wz-drawer-slide`, which transitions `transform` on the dedicated
  `--drawer-dur`/`--drawer-ease` (never `--fade-dur`). The `.2s` fallback of the fade and the `.2s` slide token are the same value, so at
  rest the two run together. **Known limit:** while the vanish engine has written a different `--fade-dur` (mid-dissolve), the fade
  follows it and the slide does not; that is the dissolve doing its job.
- **Closed = unreachable:** `setDrawerInert` makes a closed panel `inert` on both hands (`drawerShell.ts`, which also holds the one
  shared `drawerArrow(side, open)`). The Tutor's E3 comment says adding an `inert` there would "diverge from the mirror" - it is added to
  **both** hands, so the mirror holds.
- **Reduced motion:** panels fade over `--drawer-dur-reduced` (.12s, linear); the sliding layer has no transform and no transition.
- **Files:** `index.css` (tokens, panel rules, sliding layer, reduced-motion block), `Sliver.tsx` (arrow, ref, wrapper), `Tutor.tsx`
  (arrow, ref, wrapper), new `store/drawerShell.ts`, new `scripts/harness/drawers-p1.mjs`, `fx10.mjs` parks. **`PageEditor.tsx` and
  `ForwardOnlyEditor.tsx`: not touched** (the harness asserts it).
- **Tests:** `drawers-p1.mjs` (browserless; written, **not yet run - it needs Chat 1's grant**). Browser confirmation (the measured slide,
  reduced motion, the rects) is the S1 frames/live turn, also unrun.

### A.4 For S3 (Fable, Oct 9, from Nick)
The right drawer's second tab reads **GRAFTS in Arbor** and **LINKS in Flux**, taken from the per-theme vocabulary (`deskLexicon`), not
hard-coded. **Arbor's word carries a small "?" beside it.** Plan for it: the tab label is a lexicon term (one key, two theme values), the
"?" is a separate, theme-conditional element that appears only when the theme's term has an explainer (Arbor's does; Flux's does not),
opens a short note on press or focus (keyboard-reachable, `aria-label`, dismisses on Escape/blur, an overlay that displaces nothing),
and is not part of the tab's hit area, so pressing it does not switch tabs. **Open:** the explainer's wording (Nick's) and whether the
"?" is a tooltip or a pressable note; I will build it as a pressable note unless told otherwise, because a hover-only tooltip is not
reachable by keyboard or touch. The earlier Q10 (icons) is closed: words, per theme.

**A.4 decided (Fable, Oct 9):** the "?" is a **pressable note** (keyboard and touch; Escape or blur closes it), not a hover tooltip.
Draft copy for Arbor's note, Nick may edit: *"Grafts join pages, cards and boards so your ideas can grow together. Use + to graft something here."*
(One lexicon key for the note, Arbor-only; Flux has none.)

### A.5 S2a as built (off the box; nothing run)
**S2 is split.** S2a (this commit) adds the shared frame and the tab row and keeps the band's TEXT|INK hover menu; S2b retires the menu.
Reason: `item121` and `item126` drive their fixtures through `.wz-ink-switch .wz-ink-switch-side` (about 6 call sites, plus `item121`'s
"switch in the band" claims). Re-pointing and parking 1,300 lines of browser harness without being able to run it would be guessing, so
S2b waits for a browser turn. Until then both controls exist and share ONE state (`PageEditor`'s `instrument`); S2a is a branch state,
not something to ship.

**Built:** `store/drawerSet.ts` (the pure table: `leftTabsFor`, `sectionsFor`, `sectionAllowed`); `components/DrawerTabs.tsx` (a real
tablist, roving tabindex, `nextTab()` for Left/Right/Home/End; the chosen tab is a **brass outline, no fill**; the arrow tab stays
olive); `components/SideDrawer.tsx` (the sliding layer, the optional tab row, the tab panel, and a `foot` slot for the standing
furniture so the goal foot and the instruments row sit outside the tab panel). **Both hands now render through `<SideDrawer>`**; the
Sliver asks the table before every section (ink, typeface, forwardLock, format, templates, pageKind, capture, boardTools); the Free
Write arm gains an optional `instrument` and only that arm shows a tab row. Tab words are the existing lexicon terms
(`inkModeText`, `inkModeInk`, `inkInstrument`).

**The one `PageEditor.tsx` hunk:** three added lines in the Free Write `sliverContent` (a two-line comment and
`instrument: { value: instrument, onChange: setInstrument }`). Nothing removed or changed; `ForwardOnlyEditor.tsx` untouched; the
browserless guard (D1a/D1b) fails if the diff leaves that shape.

**Tests (browserless, written, not run):** `drawers-p1.mjs` grows E (the table), F (the tab keys, ARIA, brass-outline-no-fill, arrow
stays olive), H (both hands use `SideDrawer`, every Sliver section is gated), and 10 more mutants. Two S1 checks that pinned the
hand-written wrapper (C3, C4) are parked with H1 as their successor.

**A design cost to name.** Item 121's I3 said "which instrument am I" must be readable **with the drawer shut**. With the choice now a tab
inside the drawer, a closed drawer does not show it. What still shows it: the paper wears the instrument (`data-instrument`, the
caret sleeps in INK), and the band's menu does until S2b. If Nick wants it readable at rest after S2b, the cheap answer is for the
fixed arrow tab to carry a tiny instrument mark (the tab stays olive; the mark is not a choice). Not built; **for a ruling**.

**Browser turn will need to look at (found by reading, likely to shift because the Free Write drawer gains a row at its top and a
`.wz-drawer-body` wrapper):** `item121`, `item126`, `item207` (control counts), `item83f` and `fx1`/`fx3` (drawer layout), `ab2`
(Free Write contents). None is expected to need a *claim* changed except the two `item121`/`item126` switch locations in S2b.
