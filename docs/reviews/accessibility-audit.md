# Accessibility audit — Wrizo | Write — Cloud lane, 2026-09-30

**STATUS: REPORT ONLY. Nothing was changed.** No product code, no config, no production, no
secrets.

**Ordered by:** Fable (task 3 of 3), including Fable's adjustment 4 (hit-target sizes).

**What was audited:** `origin/main` at `9695504`. That tree includes Nick's Cursor display pass
**`aa11f58`** ("Ship the framed-desk display pass"), confirmed with
`git merge-base --is-ancestor aa11f58 origin/main`.

**How:**
- **The app:** it ran on a throwaway cloud machine:
  - the real server (`apps/server`) and the built web app;
  - a throwaway embedded Postgres;
  - four throwaway accounts (`…@example.invalid`), one per theme and screen size;
  - content seeded **through the app's own `window.wrizo*` seams** (per `AGENTS.md`): a binder
    "The Long Winter" with three chapters, a board, a Journal page, and one card added through
    the board's own **New Card**.
- **Tools:** Chromium via Playwright, and **axe-core 4.13.0** (WCAG 2.0 / 2.1 / 2.2, levels A and
  AA, plus best-practice).
- **Coverage:** both shipped themes (**Plateau** and **Flux**, default page settings), at
  **1366×768** and **390×844**. That makes **62 screen audits**, plus targeted follow-ups.
- **Each screen got:**
  - the automated rules;
  - a **keyboard walk** (Tab, recording each stop: what it is, whether you can see it, and
    whether focus visibly changes);
  - **hit-target** boxes against **44px (house law)** and **24px (WCAG 2.2 SC 2.5.8, the
    floor, with its spacing exception applied)**;
  - **door tests** (open with the keyboard, see where focus lands, try Tab, try Esc);
  - measured contrast.
- **Reproducible:** every number below is measured, and the scripts that produced it are in
  `docs/reviews/evidence/a11y/`.

**Screens:**
- Arrival (signed out and signed in) and sign-in;
- the page in Free Write and Draft;
- the Publish dialog;
- every rail panel (Page, Plan, Drawers, Journal/Log, Shelf, Settings, Themes, Trash);
- the Tutor;
- a board (empty, and with a card);
- the Journal, Shelf, Drawers and Trash boards;
- the phone layout (bottom bar and phone mode tabs).

**Ranks, by impact on a writer:**
- **Blocker:** a keyboard or screen-reader writer cannot do the task.
- **Serious:** they can, but only with real difficulty, or they miss information.
- **Moderate:** friction or a standards failure with a workaround.
- **Minor:** polish.

---

## FOR NICK (plain English — the short version)

**What's good.**
- **The rail is big enough to tap everywhere.** Its buttons measure 82×57.5px, and the smaller
  bottom group (Settings, Themes, Trash) 82×46.1px. On a phone, the bottom bar is 78×48px. All
  of them clear the house's 44px rule.
- **Every visible button has a name** a screen reader can read, and a brass focus ring shows
  where you are.
- **Your writing is very readable.** Page text scores 16:1 (Plateau) and 17:1 (Flux) against its
  paper; the minimum is 4.5:1.
- **Other good habits:**
  - toast messages are announced;
  - the "Before you ask" notice for the Tutor is built correctly;
  - reduced-motion settings are respected.

**Fix first (top three, for Fable):**
1. **A keyboard user gets stuck in the page** (Blocker).
   - Once the cursor is in the writing surface, Tab, Shift+Tab and Esc all keep it there.
   - A writer without a mouse can't get back to the menus, the rail or the modes.
   - The code's own comment says Esc should get you out; it doesn't.
2. **Invisible buttons steal the keyboard** (Serious).
   - The hidden tool drawer, the hidden Tutor and the faded toolbars still take keyboard focus.
   - Of the 47 Tab stops on a Draft page, **27 are invisible**.
   - A screen reader reads out controls that aren't on screen.
3. **Sign-in has two dead links and faint labels** (Blocker).
   - "New here? Create an account" and "← back" are plain text a keyboard can't reach.
   - The only labels on the email and password boxes are faint hints at **1.78:1** (the minimum
     is 4.5:1).

**Also:**
- The Publish dialog and the rail panels don't move the keyboard into themselves, and Esc
  doesn't close them.
- Cards on a board can't be reached by keyboard, except through the Outline view.
- The Tutor never announces its replies to a screen reader.

**Hit targets (Fable asked):**

| What | Size | House law (44px) | WCAG floor (24px) |
|---|---|---|---|
| Rail, main places | 82×57.5 | ✓ | ✓ |
| Rail, bottom group (Settings, Themes, Trash) | 82×46.1 | ✓, by 2px | ✓ |
| Phone bottom bar | 78×48–49 | ✓ | ✓ |
| Mode tabs, laptop | 33–34 tall | ✗ | ✓ |
| Mode tabs, phone | 38–39 tall | ✗ | ✓ |
| Tool-drawer grip and a panel's Close, together (Plateau, laptop) | 16×34 and 14×18, too close | ✗ | **✗: the only two floor failures** |

- **About your display pass (`aa11f58`):** it made the tabs about 2px shorter and about 18%
  narrower. But they were **already under 44px before it** (35–36px, measured with the old
  styles put back). The fix doesn't need bigger text: make each tab's *clickable area* 44px tall
  and leave the look alone.
- **The bottom group:** its 7.2px labels are the smallest text in the app. They pass contrast,
  but they're hard to read, and the group clears the 44px rule by only 2px.

**Two small design choices for you** (they don't block the fixes above):

| # | Question | My recommendation |
|---|---|---|
| 1 | Mode tabs: grow the invisible click area to 44px and keep today's look? Or change the look? | **Grow the click area; keep the look.** It meets the house law with no visual change. |
| 2 | The bottom group's 7.2px labels: keep them, or go back up to the 10.8px the other rail labels use? | **At least 9px.** They pass contrast but are hard to read, and a little more size also gives the 44px margin some room. |

---

## FINDINGS (ranked by impact; every one has a proposed fix)

| # | Rank | Finding | Where | One-line fix |
|---|---|---|---|---|
| A1 | **Blocker** | Keyboard trap in the writing surface: Tab, Shift+Tab, and Esc then Tab or Shift+Tab never leave it | Page, Free Write and Draft, both themes, both sizes | Esc moves focus to the page's toolbar/mode strip (as the code comment already promises); say so in a hidden hint |
| A2 | **Blocker** | Sign-in's "New here? Create an account" and "← back" (and the account screen's "← back") are `<span>`s: not reachable by keyboard | Sign-in / account screens | Make them `<button type="button" class="wz-link">` |
| A3 | **Serious** | Hidden panels still take focus (`aria-hidden="true"` on focusable content); faded toolbars take focus at opacity 0 | Page, board, every rail panel | `inert` on closed panels; faded chrome reappears on `:focus-within` |
| A4 | **Serious** | Publish dialog: focus stays on the tab, Tab walks the page behind it, Esc does nothing, no `aria-modal`, focus not returned | Page, laptop and phone, both themes | The standard dialog pattern (and the Press must follow it) |
| A5 | **Serious** | Rail panels: focus stays on the rail, the panel comes after every rail item in Tab order, and Esc is ignored while focus is on the rail or in the panel | All 8 rail panels | Move focus into the panel on open; Esc closes from anywhere and returns focus to the rail item |
| A6 | **Serious** | Board cards aren't focusable (`tabindex=-1`, no role) in the Open and Storyboard views. Only Outline gives keyboard access (to the text). Arranging is mouse-only | Boards | Make each card a focusable, named element; Enter opens it; offer a keyboard "Move" |
| A7 | **Serious** | Text below 4.5:1 in several places (table in A7) | Sign-in, crumbs, board, word count, pins, Drawers, Tutor | Token nudges, listed with exact values |
| A8 | **Serious** | Tutor: no live region (replies are never announced), input labelled only by a placeholder, Esc from inside doesn't close, focus drops to the page start after "Got it" | Tutor | `role="log"` / `aria-live="polite"` on the thread; a real label; Esc closes and returns focus |
| A9 | Moderate | Mode strips use `role="tablist"`/`"tab"` with no tab panels, a non-tab child (Free Write's menu wrapper) and an action (Publish). On phone, names run together: "Free writegenerate", "Publishexport" | Page and board mode strips | Plain buttons with `aria-pressed`/`aria-current`; a separator in the phone names |
| A10 | Moderate | Hit targets: tabs under 44px (laptop and phone); two controls fail the 24px floor when a rail panel is open; many small controls pass only by the spacing exception | See the hit-target section | Enlarge click areas (padding or `::before`), not the type |
| A11 | Moderate | No `<main>`, no `h1`, most content outside landmarks (axe `region`, 21 screens) | Every screen | `<main>` around the routed surface; an `h1` per surface (it can be visually hidden) |
| A12 | Minor | Rail bottom-group labels are 7.2px; mode tab text is 10.4px | Rail, mode strip | Nick's design call (card, question 2) |
| A13 | Minor | The active phone ink swatch shows no focus change; Arrival's "Enter full screen" takes focus while covered | Phone page, Arrival | Give the swatch the focus ring; don't mount a covered control |
| A14 | Minor | A scrollable Journal pin card on phone can't be scrolled by keyboard (axe `scrollable-region-focusable`) | Phone Journal board | `tabindex="0"` plus a label on the scroll box |

### A1 · BLOCKER — the writing surface is a keyboard trap (measured)

- **The keyboard walk:** on every page screen (Free Write and Draft; Plateau and Flux; laptop
  and phone), focus entered the writing surface ("Page writing surface", `role="textbox"`) and
  never left.
- **The direct check** (`evidence/a11y/trapcheck.mjs`), with focus in the surface, in both Free
  Write and Draft:

  | Key | Where focus went |
  |---|---|
  | Tab | stays in the surface (the text changed) |
  | Shift+Tab | stays |
  | Esc | stays |
  | Esc, then Tab | stays |
  | Esc, then Shift+Tab | stays |

- **Why:** `apps/desktop/src/pages/PageEditor.tsx:505-545` captures Tab on purpose:
  - it indents in Draft and Revise;
  - it inserts a paragraph tab on an empty Free Write line;
  - on a written Free Write line it does **nothing but still blocks focus**.
- **The broken promise:** its comment says *"Escape is what leaves the surface"*. There's no
  Esc handler that does that, and none was measured.
- **Rule:** WCAG 2.1.2 No Keyboard Trap (Level A). Capturing Tab is allowed *only if* a way out
  exists and the writer is told about it.
- **Fix:**
  - Keep Tab-to-indent for writers.
  - Make **Esc move focus to the page's mode strip** (the nearest chrome), and state it in a
    visually hidden hint on the surface: *"Esc to leave the page"*.
  - In Free Write, when Tab would do nothing (a written line), let it move focus normally.
  - This also unlocks A5: Esc from the page is the only way the rail panels close today.

### A2 · BLOCKER — sign-in's two links can't be reached (measured + code)

- **The walk:** on the sign-in screen, the keyboard reached only these, then cycled:
  1. email;
  2. password;
  3. **Sign in**;
  4. "Enter full screen".
- **"New here? Create an account" and "← back" were never reached.** They're
  `<span className="wz-link" onClick=…>` (`apps/desktop/src/components/Arrival.tsx:140, 143`),
  and so is the account screen's "← back" (`:160`).
- **So:** a keyboard user on the sign-in screen can't switch to creating an account, and can't
  go back.
- **Rule:** WCAG 2.1.1 Keyboard (Level A).
- **Fix:** make them `<button type="button">`, styled the same.

### A3 · SERIOUS — invisible controls take keyboard focus (measured)

**Invisible Tab stops** (on screen, but at 0% opacity or covered):

| Screen (laptop, both themes) | Tab stops | Invisible |
|---|---|---|
| Page, Free Write | 32 | **11** |
| Page, Draft | 47 | **27** |
| Board | 34 | **12** |

The invisible stops are:
- **the closed tool drawer** (`.wz-sliver-panel`, `aria-hidden="true"`): Forward lock, Goal,
  Typewriter, Progress, and on boards Add card, New page card and more;
- **the closed Tutor** (`.wz-tutor-panel`, `aria-hidden="true"`): presets, "Close, keep dock",
  the question box, the note box;
- **the faded Draft toolbar:** Bold, Italic, Underline, Strikethrough, Heading, List, Quote,
  Outdent, Indent, Line spacing, and the three alignments;
- **the page-setup chips.**

- **axe** reports `aria-hidden-focus` on **15 screens**: hidden content that is still focusable.
- **Why it matters:**
  - A sighted keyboard user presses Tab and sees nothing happen, up to 27 times.
  - A screen-reader user hears controls that "aren't there".
- **Rules:** WCAG 2.4.7 Focus Visible, 2.4.3 Focus Order, 4.1.2 Name/Role/Value.
- **Fix:**
  - Put the `inert` attribute on the tool drawer and the Tutor whenever `data-open="false"`. That
    removes them from Tab order and from screen readers in one line each.
  - For chrome that *dissolves while writing*, make it reappear on `:focus-within`. The chrome
    already reappears on hover, so this is the keyboard twin.

### A4 · SERIOUS — the Publish dialog doesn't take the keyboard (measured)

- **Opened by keyboard** (Enter on **Publish**): the dialog opens (`role="dialog"`, labelled
  "Publish"), but **focus stays on the Publish tab**.
- **The next 20 Tab stops are all behind the dialog,** covered by its backdrop: Plan →, Pages,
  every rail item, the toolbar.
- **Esc doesn't close it.** Only the backdrop (mouse) or its **Close** button, reached after
  that walk, does.
- **No `aria-modal`, and focus isn't returned** afterwards.
- **Same on the phone, in both themes.**
- **Screenshot:** `evidence/a11y/screens/plateau-desktop-publish-dialog.png`.
- **Rule:** WCAG 2.4.3 Focus Order, plus the WAI-ARIA dialog pattern.
- **Fix:**
  - On open, move focus to the dialog's first control (or its title).
  - Keep Tab inside the dialog.
  - Esc closes it.
  - On close, return focus to the Publish button.
  - Add `aria-modal="true"`.
- **Note for the Publish lane:** this dialog is retired by the Press ("B only",
  `docs/publish/pub-committee-pass.md`). The Press's own panels must follow this pattern from
  day one. The "Convert to Screenplay" dialog shares this markup (`PageEditor.tsx:1059`); it is
  likely the same, but it wasn't measured.

### A5 · SERIOUS — rail panels don't take the keyboard, and Esc can't close them (measured)

**What happened for each of the 8 panels** (laptop, both themes), opening it with Enter on its
rail item:

| Step | Result |
|---|---|
| Open | The panel opened, but **focus stayed on the rail item** |
| Press Tab | Focus went to the **next rail item**, not the panel. The panel's own controls come after the whole rail: from **Page**, that's 8 Tabs (past the other 7 rail items). Only from **Trash** (the last item) did one Tab enter the panel |
| Esc, with focus on the rail | **Didn't close** it |
| Esc, with focus in the panel | **Didn't close** it |
| Esc, with focus in the page | Closed it |

- **Why:** `Cascade.tsx:258-266` ignores keys that start in `.wz-strip` or
  `.desk-frame-cascade-anchor`.
- **Why that's worse than it looks:** because of A1, a keyboard user *can't be* in the page and
  then leave it, so for them the panels never close by keyboard.
- **Fix:**
  - On open, move focus to the panel's first control.
  - Esc closes from the rail or the panel, and returns focus to the rail item.
  - Use `aria-expanded` and `aria-controls` on the rail items. Today it's `aria-pressed`, which
    says "toggle", not "opens a panel".

### A6 · SERIOUS — board cards are mouse-only, except in Outline (measured)

- **The card:** one made through the board's own **New Card**. It's a `div.board-box` with
  `tabindex=-1`, no role, and no focusable parts.
- **The walk:** in the Open and Storyboard views, **45 Tabs never reached it**.
- **Outline view** gives each card a text box (`input.board-outline-text`), so a keyboard user
  *can* edit card text there.
- **Mouse-only:** placing, moving and connecting cards on the canvas.
- **Rule:** WCAG 2.1.1 Keyboard (Level A), for the spatial board.
- **Fix:**
  - Make each card focusable (`tabindex="0"`) with a name (its first line) and a role.
  - Enter opens it.
  - Add a keyboard "Move" (arrow keys, or a "Move to…" menu), and announce the new position.
  - Point keyboard users to Outline in the board's help line until this lands.

### A7 · SERIOUS — text below 4.5:1 (measured)

Axe plus direct measurement, at normal text sizes (4.5:1 required):

| Where | Theme | Colours | Ratio | Smallest fix |
|---|---|---|---|---|
| **Sign-in field hints**: "you@example.com", "password" (the *only* labels) | both | `#463B2C` on `#150A04` | **1.78** | Hint colour ≥ `#817A70` (4.6:1), **and** add real labels (see A8's label fix) |
| **Board-name button** ("Chapter beats") | both | pale text on the **browser's default grey button face** `#EFEFEF` | **2.0 / 1.96** | It's missing `background:none`; see `screens/plateau-desktop-board.png` |
| Breadcrumb binder name, greyed Workshop tab, board note "The plan serves the page." | Plateau | `--text-low #80766A` on `#1F1A16` | **3.87** | `--text-low` ≥ `#8A8176` (4.5:1). Flux's `#6E958D` passes at **5.21** |
| Word count on the page (phone) | Plateau | `--ink-on-paper-low #8A7C68` on `#F3EDE1` | **3.48** | ≥ `#756958` (4.6:1) |
| Word count on the page (phone) | Flux | `#0B7C9E` on `#EDF6F3` | **4.34** | ≥ `#0B7899` (4.59:1) |
| Journal pin card: the olive "Board pin" badge / excerpt (phone) | both | olive / chrome text on a light card `#FBF6EA` | **2.6 / 2.14** | Use the page's ink tokens on light cards, not chrome tokens |
| Drawers "move" control | Plateau / Flux | `#635A51` / `#567069` on `#1F1A16` | **2.55 / 3.21** | `--text-mid` |
| Tutor question box hint | both | browser default `#757575` on `#2A241E` | **3.33** | A themed `::placeholder` (`--text-mid`) |
| Phone bottom-bar labels (9px) | Plateau | `#80766A` on `#110600` | **4.49** | The same `--text-low` nudge |

**What passes** (measured):
- page prose: 16.16 (Plateau) and 17.11 (Flux);
- mode tabs: 7.47 / 7.63 inactive, 13.91 / 14.83 active;
- Plan door: 6.14;
- rail labels, including the 7.2px bottom group: 13.91 (Plateau) and 14.8 (Flux);
- Arrival's "Open" and the sign-in links: 5.18.

The brass focus ring is 8:1 against the dark chrome, but **1.85:1 on paper**. That only matters
for controls sitting on the page itself; none failed in this audit.

### A8 · SERIOUS — the Tutor for screen-reader and keyboard users (measured)

- **No live region.** The Tutor panel contains no `aria-live`, `role="log"` or `role="status"`,
  so a screen reader will not announce an answer arriving.
  - *Measured in the DOM.* A live model reply wasn't exercised: by house rule, no Tutor key was
    used.
- **No label on the question box.** It has no `<label>` and no `aria-label`, only the
  placeholder "Ask a question…" (which also fails contrast, A7). The same goes for "Note a fact
  to remember…".
- **Esc from inside the Tutor doesn't close it.** That's by design in `Tutor.tsx:444-452`: keys
  inside `.wz-tutor-zone` are ignored. Only Esc from outside closes it.
- **The first-run notice ("Before you ask"):**
  - it's correctly a labelled modal (`role="dialog"`, `aria-modal="true"`), and focus lands on
    **Got it**. Good.
  - But **one Tab leaves it** (to "Show controls").
  - After **Got it**, focus drops to the top of the page instead of the Tutor's question box.
- **Fix:**
  - `role="log"` (polite) on the conversation;
  - `aria-label` on both inputs;
  - Esc closes the Tutor from inside, and returns focus to its grip;
  - keep Tab inside the notice;
  - after **Got it**, focus the question box.
- **Also noted (not a failure):** at phone width the Tutor has no opener at all.

### A9 · MODERATE — the mode strips pretend to be tabs (measured)

- **What axe says:** `aria-required-children` (which axe rates "critical") on **14 screens**.
  - `.desk-mode-strip`, `.board-mode-strip` and the phone `.mode-tabs` are `role="tablist"`,
    but they contain things that aren't tabs:
    - Free Write's wrapper with the Text/Ink menu;
    - on phone, the **Workshop** and **Publish** action buttons.
  - None of the "tabs" controls a tab panel.
- **What a screen reader says:** "tab, 2 of 5" for what is really a set of mode buttons.
- **On phone, the names run together:** "Free write**generate**", "Draft**mark**",
  "Publish**export**", and Flux's "Connect**export**". The subtitle is glued to the name with no
  space.
- **Fix:**
  - Drop the tab roles: a labelled group of buttons, with `aria-pressed` (or `aria-current`) on
    the active mode.
  - Publish/Connect/Relay is a separate button.
  - On phone, add a space or an `aria-label` like "Free write — generate".

### A10 · MODERATE — hit targets (Fable's adjustment 4; see the next section)

Two controls fail the WCAG 24px floor:
- the tool-drawer grip ("Open hand tools", **16×34**);
- the rail panel's **Close** (**14×18**).

When any rail panel is open in Plateau at laptop size, they sit closer than 24px to each other,
so the spacing exception doesn't save them. Everything else under 24px passes only through
spacing. The mode tabs miss the house's 44px everywhere.

### A11 · MODERATE — no landmarks or headings (measured)

- axe: `landmark-one-main` (17 screens), `page-has-heading-one` (16 screens) and `region`
  (21 screens, 252 elements outside any landmark).
- A screen-reader user can't jump to "main" or to the page's heading. They have to read from the
  top every time.
- **Fix:**
  - `<main>` around the routed surface (`AppMain`);
  - one `h1` per surface: the page or board title (it can be visually hidden);
  - the phone rail is already a labelled `<nav>` ("Desk areas"). The laptop rail is a labelled
    `<aside>` (`DeskFrame.tsx:231`); a `<nav>` would describe it better.

### A12–A14 · MINOR

- **A12, small type.**
  - Rail bottom-group labels are **7.236px** (`index.css`, from `aa11f58`).
  - Mode tabs and the Plan door are **10.4px**, uppercase.
  - They pass contrast, and browser zoom still works, so this isn't a WCAG failure. It's a
    legibility cost that Nick may weigh (card, question 2).
- **A13, focus polish.**
  - The active phone ink swatch shows no focus change when focused (both themes).
  - Arrival's "Enter full screen" (58.7×14) takes focus while covered by the hero.
- **A14, phone Journal.** A scrollable pin card isn't keyboard-scrollable.

### What holds (measured)

- **Rail items are named.** Glyphs are `aria-hidden`, text labels are present, and the rail uses
  `aria-current` / `aria-pressed`. The phone rail is a labelled `<nav>`.
- **The focus ring works.** It's a 2px brass ring on every button and link, and every *visible*
  Tab stop except two (A13) showed a focus change. The writing surface shows its caret instead,
  which is normal for text.
- **Toasts are announced** (`ActionToast`, `role="status"`). The page has `lang="en"`, and
  reduced motion is honoured in `index.css`.
- **The Tutor's first-run notice** is a proper labelled modal that receives focus.

---

## HIT TARGETS (Fable's adjustment 4)

- **What's measured:** the bounding box of each control, in CSS pixels.
- **What passes:** **≥ 44** means the house law. **≥ 24** means the WCAG 2.2 SC 2.5.8 floor; a
  smaller control still passes if a 24px circle on its centre touches nothing else.
- **Data:** `evidence/a11y/summary.txt`, "RAIL + MODE TABS" and "ALL TARGETS UNDER 24".

### The rail

| Rail | Plateau, laptop | Flux, laptop | 44 | 24 |
|---|---|---|---|---|
| Page, Plan, Drawers, Journal/Log, Shelf | 82 × 57.5 | 82 × 57.5 | ✓ | ✓ |
| **Bottom group: Settings, Themes, Trash** | **82 × 46.1** | **82 × 46.1** | ✓ (by 2.1px) | ✓ |
| Phone bottom bar: Catch, Journal/Log, Shelf/Cache, Drawers/Racks, Library | 78 × 48 | 78 × 49 | ✓ | ✓ |

### The mode tabs and their neighbours

| Control | Plateau, laptop | Flux, laptop | Plateau, phone | Flux, phone | 44 | 24 |
|---|---|---|---|---|---|---|
| Mode tabs (Free Write … Publish) | 64.8–95.9 × **33** | 56.8–82.9 × **34** | 60–97 × **37.6** | 63–91 × **38.6** | ✗ | ✓ |
| Plan → | 38.9 × 31 | 35.6 × 32 | 38.9 × 31 | 35.6 × 32 | ✗ | ✓ |
| Pages / Docs toggle | 60 × 25 | 49 × 26 | 60 × 25 | 49 × 26 | ✗ | ✓ |
| Board tabs (Open, Storyboard, Outline) | 66–121 × 27 | 64–118 × 29 | 66–121 × 27 | 64–118 × 29 | ✗ | ✓ |

### Before and after `aa11f58`

Measured on the same page by putting back the old tab rules: 13px text, 9px 16px padding, 2px
gap, no spread.

| | Before `aa11f58` | After (today) |
|---|---|---|
| Mode tabs, Plateau | 79–117 × **35** | 65–96 × **33** |
| Mode tabs, Flux | 72–104 × **36** | 57–83 × **34** |
| Plan →, Plateau | 55.9 × 25 | 38.9 × 31 |

So the pass cost about 2px of height and about 18% of width. **The tabs missed 44px before it
too.**

### Controls under 24px

**Fail the 24px floor** (Plateau, laptop, whenever a rail panel is open):
- "Open hand tools" (16×34);
- the panel's "Close" (14×18).

They sit closer than 24px to each other.

**Under 24px but passing by spacing:**
- "Show controls" 10×10;
- "Enter full screen" 58.7×14;
- "Sign out" 44×14;
- "Open the Tutor" 16×34;
- "Close, keep dock" 90×17;
- tag "Add" 21×14;
- "☆ Star" 38×15;
- board-name rename 28–40×19;
- phone ink swatches 22×22.

**Proposed fix (keeps the look):**
- Grow each control's *click area*, not its text: vertical padding, or an invisible `::before`
  that extends the target.
- Tabs: `padding-block` to reach 44 (about 5.5px more top and bottom on laptop). Or an absolutely
  positioned 44px-tall `::before` inside the band.
- The grip and the panel's Close: at least 24×24, and at least 24px apart. 44 by house law.

---

## Proposed order of fixes (for Fable)

1. **A1 (the trap) and A2 (sign-in links).** Both are small, and both are Level A.
2. **A3 (`inert` on closed panels; chrome reappears on focus).** A few lines, and it removes most
   of the invisible stops.
3. **A5 and A4 (panels and the dialog take focus; Esc closes; focus returns).** One shared
   "door" helper for the rail, the dialogs and the coming Press.
4. **A7 (contrast):**
   - the Plateau `--text-low` and `--ink-on-paper-low` nudges;
   - the board-name button's missing `background:none`;
   - themed placeholders and real labels on sign-in and the Tutor.
5. **A8 (the Tutor live region and labels) and A9 (the mode strip roles and phone names).**
6. **A10 (hit areas, with Nick's word on card question 1), A11 (landmarks), then A12–A14.**

The **Publish lane** should build the Press to pass A4, A5, A9 and A10 from its first ticket.

## What this audit did not cover (named, not guessed)

- **Real screen readers** (NVDA, JAWS, VoiceOver, TalkBack). Names, roles and live regions were
  checked in the accessibility tree and with axe, not listened to.
- **Pen and ink:** the ink canvas, and whether ink is accessible at all. Also Revise mode and the
  Screenplay room.
- **Windows High Contrast / forced colours.** Also 200%/400% zoom reflow.
- **A live Tutor reply** (no key, per house rules).
- **The board with many cards.** One card was made through the real UI. The seeded pins didn't
  render as cards in the Open view, so it was left at one.
- **Electron.** This is the web build, which is the primary target.

## Evidence (`docs/reviews/evidence/a11y/`)

| File | What it is |
|---|---|
| `audit.mjs` | The main audit. It runs 62 screens with axe, targets, the keyboard walk, door tests and contrast. It makes throwaway accounts with random passwords |
| `analyze.py` → `summary.txt` | The tables this report quotes, by rule, screen, theme and size |
| `results.json.gz` | Every raw record: axe nodes, every target box, every Tab stop, every door test |
| `trapcheck.mjs` | A1: Tab, Shift+Tab and Esc inside the writing surface |
| `followup.mjs` → `followup.json` | The phone Publish dialog; Esc and labels inside the Tutor; the Tutor's live regions |
| `boardcards.mjs` → `boardcards.json`, `outline.mjs` | A6: a card made through New Card; keyboard reach in Open, Storyboard and Outline |
| `tabsbefore.mjs` | The mode tabs with the pre-`aa11f58` rules put back, for comparison |
| `screens/*.png` | Six screenshots: page, Settings panel, board (the grey name button), Publish dialog, sign-in, Flux phone |
| `aria/*.yml` | Accessibility-tree snapshots (page, sign-in, board, Tutor) |

*Standards: WCAG 2.2 (W3C Recommendation, 2023), SC 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.5.8, 1.4.3,
3.3.2, 4.1.2, 4.1.3; WAI-ARIA Authoring Practices (dialog, tabs); axe-core 4.13.0 rule
descriptions.*
