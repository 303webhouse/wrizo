# ITEM 121 · THE INK WAVE — S0 SURVEY
### ink lane · 2026-09-07 · worktree `.claude/worktrees/item121-ink` · branch `item121-ink` off `origin/main` @ `2b8e5b4`
### Read FROM DISK at the branch point. Where this survey and the build brief disagree, DISK WINS and the brief is amended by the finding, not the finding by the brief.

---

## §0 · WHAT THIS SURVEY IS FOR

The brief (`item121-ink-build-brief.md` §S0) asks six questions before any
patch. All six are answered below with file and line. **Four of the answers
are not what the brief assumed**, and one of them (§3, the mount) makes the
brief's own I2 instruction unbuildable as written. Those are collected in
§7 · SEAMS, each marked either **BUILD-LANE CALL** (decided here, disclosed)
or **STOP** (held for Nick's word, nothing built).

**The headline, first, because it is the one the brief made a gate:**
**THE STROKE STORAGE IS ZERO SCHEMA. There is no schema stop on I1.**

---

## §1 · THE J-SERIES INVENTORY, AS IT STANDS TODAY

### 1.1 · Drift since the pass read them (2026-09-06)

**NONE.** The branch point IS the pass's own commit (`2b8e5b4`), and the
three files the pass read have not moved for far longer than that:

| file | last touched | commit |
|---|---|---|
| `apps/desktop/src/store/ink.ts` | 2026-07-09 | `d9140d1` (J2 — the eraser) |
| `apps/desktop/src/pages/JournalEntry.tsx` | 2026-08-25 | `4dc330a` (item 84 deck phase) |
| `apps/desktop/src/types/index.ts` | 2026-09-03 | `8ef2615` (item 114 — `pageSettings.kind`; **did not touch `Stroke`**) |

The pass's §0 inventory is therefore accurate to the byte. What follows
adds the line numbers the build needs, not a correction.

### 1.2 · `store/ink.ts` — 109 lines, the isolated renderer

- `INK_LINE_WIDTH = 1.4` — [ink.ts:8](apps/desktop/src/store/ink.ts#L8)
- `ERASER_WIDTH = 22` — [ink.ts:9](apps/desktop/src/store/ink.ts#L9)
- `inkColor()` — [ink.ts:13-18](apps/desktop/src/store/ink.ts#L13-L18). Reads
  `--ink-stroke`, falls back to `--ink-on-paper`, then the literal `#1A1206`.
  Guards `typeof getComputedStyle === 'undefined'` (SSR/test safety).
- `renderStroke(ctx, stroke, sheetW, color, lineWidth?)` —
  [ink.ts:29-65](apps/desktop/src/store/ink.ts#L29-L65). The whole painting
  surface, exactly as J9 promised. Note three properties I5 must preserve:
  - **Both axes denormalize by `sheetW`** ([ink.ts:45](apps/desktop/src/store/ink.ts#L45),
    `p.x * sheetW, p.y * sheetW`) — a circle stays a circle. `y` is
    deliberately unbounded above 1.0; a tall sheet is normal, not a bug.
  - `save()`/`restore()` bracket the whole body because callers loop mixed
    ink/erase strokes without resetting context state between calls
    ([ink.ts:26-28](apps/desktop/src/store/ink.ts#L26-L28)).
  - `lineWidth` already defaults through the stroke: `stroke.eraser ?
    ERASER_WIDTH : INK_LINE_WIDTH` ([ink.ts:34](apps/desktop/src/store/ink.ts#L34)).
    **I5's per-tip/per-nib widths land in exactly this default expression** —
    the signature does not need to change and no caller needs to learn a width.
- `renderThumbnail(canvas, strokes, size, color?)` —
  [ink.ts:70-109](apps/desktop/src/store/ink.ts#L70-L109). DPR-synced, bbox-fit,
  excludes eraser points from the bbox so an erase sweep cannot shrink the fit.

**Isolation is real and holds.** Nothing outside this file computes a colour
or a width for a stroke. I5 can land wholly inside it.

### 1.3 · `JournalEntry.tsx` — the capture pipeline

| piece | line | note |
|---|---|---|
| `syncCanvas` (DPR backing store) | [84-91](apps/desktop/src/pages/JournalEntry.tsx#L84-L91) | ports verbatim |
| `paintCommitted` | [98-106](apps/desktop/src/pages/JournalEntry.tsx#L98-L106) | denormalizes by `sheet.getBoundingClientRect().width` |
| `LastAction` union | [120](apps/desktop/src/pages/JournalEntry.tsx#L120) | `{type:'text',before} \| {type:'stroke'} \| null` |
| strokes state, seeded from the entry | [156](apps/desktop/src/pages/JournalEntry.tsx#L156) | |
| `eraserArmed` + its ref mirror | [161-163](apps/desktop/src/pages/JournalEntry.tsx#L161-L163) | session-scoped; pen re-arms on open |
| refs (`ring`, `sheet`, `committed`, `active`, `strokes`, `activeStroke`) | [164-171](apps/desktop/src/pages/JournalEntry.tsx#L164-L171) | |
| repaint on stroke-set change | [279-282](apps/desktop/src/pages/JournalEntry.tsx#L279-L282) | |
| `ResizeObserver` repaint (width AND height) | [286-293](apps/desktop/src/pages/JournalEntry.tsx#L286-L293) | |
| `normPoint` (normalize by width, pressure captured) | [302-307](apps/desktop/src/pages/JournalEntry.tsx#L302-L307) | **pressure IS already captured today** — see §1.5 |
| `paintActive` ("rubbing not stamping") | [316-331](apps/desktop/src/pages/JournalEntry.tsx#L316-L331) | an in-progress erase paints straight onto the COMMITTED canvas |
| `persist` (merges live text) | [340-345](apps/desktop/src/pages/JournalEntry.tsx#L340-L345) | `saveJournalEntry({...latest, text: pageTextRef.current, strokes: next})` |
| `onDown` | [347-388](apps/desktop/src/pages/JournalEntry.tsx#L347-L388) | pen-only gate at [348](apps/desktop/src/pages/JournalEntry.tsx#L348) |
| I0 slice-2 hardening (blur + drop `contenteditable`) | [359-361](apps/desktop/src/pages/JournalEntry.tsx#L359-L361) | |
| selection suppression | [365-368](apps/desktop/src/pages/JournalEntry.tsx#L365-L368) | |
| hardware eraser bit (`buttons & 32`) | [380](apps/desktop/src/pages/JournalEntry.tsx#L380) | |
| `onMove` / `onUp` / `onCancel` | [390-437](apps/desktop/src/pages/JournalEntry.tsx#L390-L437) | |
| eraser ring `onHover`/`onLeave` | [445-453](apps/desktop/src/pages/JournalEntry.tsx#L445-L453) | bubble-phase, **passive** — never intercepts |
| **capture-phase registration** | [462-471](apps/desktop/src/pages/JournalEntry.tsx#L462-L471) | `{passive:false, capture:true}` on the SHEET, not the canvas |
| unified one-level `undo` | [755-781](apps/desktop/src/pages/JournalEntry.tsx#L755-L781) | |
| the two canvases + ring + toggle JSX | [847-903](apps/desktop/src/pages/JournalEntry.tsx#L847-L903) | both canvases `pointer-events:none` |

**The load-bearing shape of the port:** listeners live on the **sheet**, and
the canvases are always `pointer-events:none`. The canvas is a *display
surface only*; routing is the sheet's job. I2/I3's "in INK it intercepts
everything on the paper" is therefore **not** a `pointer-events` flip on the
canvas — it is a mode gate inside the sheet's own capture-phase handlers.
Building it as a `pointer-events:auto` canvas would break the eraser's
"rubbing" model and the hover ring at once.

### 1.4 · What ports whole vs. what is new

**PORTS WHOLE (no change of kind):** `syncCanvas`, `paintCommitted`,
`renderStroke`/`renderThumbnail`, the normalized-by-width geometry, the
ResizeObserver repaint, the two-canvas active/committed split, the eraser's
`destination-out` + rubbing model, the ring preview, `onCancel`'s repaint
recovery, the one-level undo union, the persist-merged-with-live-text rule,
and the I0 slice-2 blur/selection hardening.

**NEW, and named as new:** per-stroke `tip`/`nib`/`ink` (I1, I5); the mode
gate (I3) — the Journal has no TEXT/INK mode, it is *always* inking and
decides by device; the pointer contract by instrument rather than device
(I3); the four theme ink tokens (**they do not exist** — §5); and the
stratum's mount, which is **not** the Journal's mount (§3).

### 1.5 · Two corrections to the brief's own assumptions about the J-series

1. **Pressure IS already captured and persisted today.** The brief's I5 says
   "Pressure is not stored and not read in this wave." `StrokePoint.p` exists
   ([types/index.ts:152](apps/desktop/src/types/index.ts#L152)) and
   `normPoint` writes it on every point where the device reports it
   ([JournalEntry.tsx:306](apps/desktop/src/pages/JournalEntry.tsx#L306)). What
   is true is that nothing *reads* it — `renderStroke` ignores `p` entirely.
   The brief's intent is preserved exactly by leaving the renderer
   pressure-blind; the wording "not stored" is simply already false and is
   corrected here rather than silently built around.
2. **The Journal's eraser is already tip-agnostic by construction**, because
   the Journal has no tips. The open word ("eraser bound to pencil only?")
   therefore costs nothing to leave open: **as built** is the zero-work
   default, exactly as the brief instructs.

---

## §2 · WHERE STROKES LIVE — **ZERO SCHEMA. NO STOP.**

### 2.1 · The answer

`strokes` is **a real `jsonb` column on `journal_entries`**, and
`journal_entries` is **the single table every page of every kind is a row
in**. Every page carries the field. Per the brief's own decision rule
(§S0.2, first branch): **I1 changes the field's SHAPE only. There is no
column, no table, no migration, and no schema stop.**

### 2.2 · The evidence, end to end

| layer | where | what it says |
|---|---|---|
| type | [types/index.ts:156-160](apps/desktop/src/types/index.ts#L156-L160) | `interface Stroke { points: StrokePoint[]; eraser?: true }` |
| type | [types/index.ts:189](apps/desktop/src/types/index.ts#L189) | `strokes?: Stroke[]` on **`JournalEntry`** |
| type | [types/index.ts:203-209](apps/desktop/src/types/index.ts#L203-L209) | `pageType?: 'manuscript' \| 'character' \| … \| 'board' \| 'script'` — **on the same interface**. `JournalEntry` is not "a journal entry"; it is THE page record. A Free Write page, a Board, a script and a Journal capture are all rows of it. |
| DDL | [migrate.ts:44-59](apps/server/src/migrate.ts#L44-L59) | `create table if not exists journal_entries ( … strokes jsonb, … )` — **the column is in the original table body**, not a later `alter table`. |
| push | [sync.ts:252-273](apps/server/src/sync.ts#L252-L273) | `strokes = excluded.strokes`, bound as `JSON.stringify(e.strokes ?? null)` |
| pull | [sync.ts:115](apps/server/src/sync.ts#L115) | `strokes: r.strokes ?? undefined` |

Adding three optional keys to each object **inside** that jsonb array is
invisible to Postgres: no DDL, no backfill, no round-trip change. This is
precisely Nick's "inside an existing blob is zero schema."

Corroborating precedent in the same column family, stated by the codebase
itself: `boxes` is "a JSON column exactly like strokes"
([types/index.ts:222-223](apps/desktop/src/types/index.ts#L222-L223)) and
`script` "jsonb, same recipe as boxes"
([migrate.ts:95-97](apps/server/src/migrate.ts#L95-L97)). Both grew their
inner shapes across tickets without a migration.

### 2.3 · **STOP-ADJACENT SEAM: I1's server-side enum validation cannot be built as written**

The brief's I1 says: *"Server validation accepts the three new optional
fields and rejects values outside their enums."*

**The server does not validate jsonb shapes, as a stated and reasoned law:**

> *"the server does not re-validate a shape the client owns, exactly as
> `tutor`/`boxes`/`script` jsonb already work here."*
> — [sync.ts:314-317](apps/server/src/sync.ts#L314-L317)

`upsertJournalEntries` checks `id`/`updatedAt`/`createdAt` and nothing else
([sync.ts:249](apps/server/src/sync.ts#L249)); every jsonb column is a bare
`JSON.stringify`. Building enum rejection would (a) invent a second
validation policy on one column family, contradicting the file's own
recorded reasoning, and (b) be a **SERVER-BEHAVIOUR change**, which under
the standing posture ships only on Nick's separate word (the item-113
precedent). It would also convert a currently zero-schema, zero-deploy wave
into one that cannot reach production without a server ship.

**BUILD-LANE CALL, disclosed:** validation lands **client-side at the READ
boundary**, where the shape's owner lives — `renderStroke` coerces any
unrecognized `tip`/`nib`/`ink` to the same defaults an absent field gets.
This is strictly stronger than server rejection for the property that
actually matters (a bad value can never mis-paint a page, including on rows
written by an older or newer client), it keeps the wave zero-schema AND
zero-server, and it keeps `apps/server` untouched so the ship-word
precondition `git diff … -- apps/server …` stays empty. **The server is not
touched by this wave.** If Nick wants true server-side rejection, it is a
separate server ticket and this survey is the place it was surfaced.

---

## §3 · THE PAPER'S CONTAINER — **the brief's I2 mount does not fit the live geometry**

### 3.1 · The three boxes, and which is which

| element | line | CSS | what it is |
|---|---|---|---|
| `.mode-pagecol` | [ModeStage.tsx:402](apps/desktop/src/components/ModeStage.tsx#L402) | [index.css:2261](apps/desktop/src/index.css#L2261) `position:relative; width:min(700px,64vw); display:flex; flex-direction:column` — framed prose overrides to `width:min(760px*--paper-scale, 60ch)` at [index.css:2734-2737](apps/desktop/src/index.css#L2734-L2737) | **the paper COLUMN.** This is the canonical width the Tools dock/sliver anchors against. It is *not* the sheet — it is a column that also contains the (unframed) format bar. |
| `.mode-page` | [ModeStage.tsx:446-448](apps/desktop/src/components/ModeStage.tsx#L446-L448), `ref={surfaceRef}` | [index.css:2279-2282](apps/desktop/src/index.css#L2279-L2282) `position:relative; background:var(--paper); padding:30px 38px; height:min(60vh,580px); display:flex; flex-direction:column; overflow:hidden` | **the lit sheet** — the thing that looks like paper. **FIXED HEIGHT. `overflow:hidden`.** |
| `.mode-scroll` | [ModeStage.tsx:463-466](apps/desktop/src/components/ModeStage.tsx#L463-L466) | [index.css:2318-2320](apps/desktop/src/index.css#L2318-L2320) `position:relative; z-index:1; flex:1; min-height:0; overflow-y:auto; padding-bottom:30vh` | **the scroller.** The editor lives inside it and grows; the sheet does not. |

### 3.2 · Why the brief's instruction breaks here

The brief says: *"Mount a `<canvas>` as a child of the Free Write paper
column, `position:absolute; inset:0` — the canvas fills the paper by
layout."*

That instruction was written from the Journal's geometry, where the sheet
(`.entry-full`) **grows with its text** (`minHeight:60vh`, no inner
scroller, [JournalEntry.tsx:804-808](apps/desktop/src/pages/JournalEntry.tsx#L804-L808))
and the window scrolls. A canvas at `inset:0` there genuinely covers the
whole sheet, forever.

On a Free Write page the sheet is a **fixed-height window with an inner
scroller**. A canvas at `inset:0` on `.mode-pagecol` or `.mode-page` would
cover only the *visible* portion. The writer would scroll, the text would
move, and the ink would stay nailed to the viewport — ink drawn beside a
sentence on screen two would land on top of screen one's ink. That is not
the sheet-anchoring tradeoff J9 documented and R15 ratified; it is a
*different and worse* anchoring (viewport-anchored) that no ruling asked for.

### 3.3 · **BUILD-LANE CALL: the stratum mounts inside `.mode-scroll`**

The canvas becomes an absolutely positioned child of `.mode-scroll`
(`top:0; left:0; width:100%`, height driven to the scroller's full
`scrollHeight`), so it **scrolls with the text as one sheet**. This is the
faithful port of J9's model, not a departure from it: the "sheet" the
strokes normalize to is the scrollable content box, exactly as the Journal's
sheet is its full grown height.

Consequences, all of them wanted:
- The width the strokes normalize by is still the paper's measure (the
  scroller inherits `.mode-pagecol`'s width, less `.mode-page`'s padding) —
  Law 1 is untouched.
- `y > 1.0` is normal and already supported (§1.2) — a long page is a tall
  sheet, exactly as in the Journal.
- **I7's anchor check must compare the canvas to the SCROLL CONTENT box, not
  to the paper rect.** Comparing it to `.mode-page`'s rect would assert the
  wrong law and would fail by design the moment a page is longer than one
  screen. The brief's I7 wording ("canvas rect equals paper rect") is
  amended to: *the canvas's left/right edges equal the scroller's content-box
  left/right edges at both widths, and its height equals the scroller's
  `scrollHeight`* — still two independently measured boxes, still the anchor
  law, now aimed at the right pair.

This is a mechanism correction inside the brief's own stated intent ("the
stratum lies over the text, sheet-anchored"), not a change of design, so it
is taken as a build-lane call and disclosed here rather than held. **The
alternative reading — give up the inner scroller and let the Free Write
sheet grow like the Journal's — is NOT taken:** it would move the paper's
rect, break the typewriter fade's hold band
([useTypewriterFade.ts](apps/desktop/src/components/useTypewriterFade.ts), driven
off `.mode-scroll`), and violate PAGE IS PRIMARY. Named so the road not
taken is on the record.

---

## §4 · THE BAND — **there is no location line in the framed band, and the band has no fixed height**

### 4.1 · What the band actually is

Free Write's framed composition renders **two different bands** depending on
the viewport gate (`DESKFRAME_MIN_WIDTH = 1100`,
[DeskFrame.tsx:59-61](apps/desktop/src/components/DeskFrame.tsx#L59-L61)):

- **FRAMED (≥1100px — both reference widths):**
  [PageEditor.tsx:956-983](apps/desktop/src/pages/PageEditor.tsx#L956-L983).
  `div.chrome-fade.chrome-top.sprint-nav` containing exactly
  **`<ModeStrip>`** (left) and **`.sprint-actions`** (right: the Pages
  toggle, back-to-board, the PLAN → door). **No crumb. No location line.**
  The crumb deliberately retired in CD1 S1 — the Page face carries the
  title and the where-it-lives chain now
  ([PageEditor.tsx:940-946](apps/desktop/src/pages/PageEditor.tsx#L940-L946)).
- **UNFRAMED (<1100px):**
  [PageEditor.tsx:1087-1094](apps/desktop/src/pages/PageEditor.tsx#L1087-L1094).
  Same `.sprint-nav` class, and this one **does** carry
  `div.sprint-crumb[aria-label="Location"]`.

Mockup B seats the switch between the crumb and the mode strip
([item83-mock-ink-b.html:208-221](docs/menus/item83-mock-ink-b.html#L208-L221)) —
a band that has a crumb, a switch and a strip. **The live framed band has
the strip but not the crumb.** The mockup is design research; disk wins.

### 4.2 · The band has NO fixed height, and it WRAPS

[index.css:4535-4537](apps/desktop/src/index.css#L4535-L4537):

    .sprint-nav{ display:flex; align-items:center; gap:14px; flex-wrap:wrap;
      background:var(--ink-900); border:1px solid var(--ink-border);
      border-radius:var(--radius-md); padding:8px 14px; }

Height is content-derived, and `flex-wrap:wrap` means the failure mode at
1366 is not a few pixels of growth — it is **a whole second row**. The
brief's "the band does not grow" is therefore a genuine, measurable risk and
I7's band check is the right guard. The height to fit under is set by the
existing controls: `.sprint-toggle-btn` at `font-size:13px; padding:5px 12px`
([index.css:4562-4563](apps/desktop/src/index.css#L4562-L4563)) and
`.sprint-nav .btn-quiet` at 13px ([index.css:4560](apps/desktop/src/index.css#L4560)).

### 4.3 · **BUILD-LANE CALL: the switch's seat**

The switch mounts **in the framed band, immediately before `<ModeStrip>`** —
i.e. it keeps mockup B's *relative* position (switch to the left of the mode
strip) against the one landmark the live band shares with the mockup. "Beside
the location line" is honoured as far as the live band permits: there is no
location line to sit beside, and re-introducing the retired crumb to create
one would reverse CD1 S1 on this lane's own authority, which it will not do.

**Below the gate (<1100px) the switch does not mount and INK does not exist**
— the surface stays byte-identical to today. This follows the 112-A rider's
precedent verbatim (below the gate a surface keeps its pre-existing terms and
gains no new geometry). **This is disclosed as a reach cost, not hidden:** the
tablet posture §4 of the pass describes is a ≥1100px posture. A tablet in
portrait below 1100 gets today's page and no ink. If Nick wants ink below the
gate, it is one more ticket and no line of this wave's design changes.

---

## §5 · THE INK TOKENS — **the theme's four inks DO NOT EXIST**

### 5.1 · What exists

**Exactly one ink token, and it is deliberately un-themed:**

- `--ink-stroke: #1A1206` — [index.css:26](apps/desktop/src/index.css#L26)
- It is **not** re-pointed by the Flux pack, with the reason stated inline:
  *"`--ink-stroke` (pen ink) and `--paper-glow` are left INHERITED — no Flux
  value is specified anywhere in the brief or canon, and Journal ink is its
  own sealed domain, out of TH2's scope"* —
  [index.css:378-384](apps/desktop/src/index.css#L378-L384).

### 5.2 · The themes that actually exist

**Two: Plateau (the bare `:root`) and Flux (`:root[data-theme='flux']`,
[index.css:385](apps/desktop/src/index.css#L385)),** plus Flux's two page
variants ([index.css:409](apps/desktop/src/index.css#L409),
[index.css:421](apps/desktop/src/index.css#L421)). The ink pass §5 names
"Plateau's Crimson Pro, Machina's Plex, Volant's Manrope" — **Machina and
Volant are not in the tree.** They belong to the theme arc, which the pass
itself defers to.

### 5.3 · **STOP — HELD FOR NICK'S WORD: the non-Plateau ink palette**

The pass names Plateau's four inks explicitly — **walnut · iron · oxblood ·
sea** — so Plateau's palette is ruled and this lane can mint it. **No other
theme's inks are named anywhere**, and Flux's own canon deliberately declined
to specify a pen ink at all.

- **BUILT:** four new tokens on `:root` (Plateau) — the four inks the pass
  named — plus `--ink-stroke` left exactly as it is so **every existing
  Journal stroke renders byte-identically** (a stroke with no `ink` field
  reads the current token, unchanged).
- **NOT BUILT, and this is the STOP:** Flux values for the four inks. Under
  the cascade Flux inherits Plateau's four, which is the honest
  zero-invention outcome and matches how Flux already treats `--ink-stroke`.
  **Inventing a Flux ink palette would be designing a theme's colours on a
  build lane's authority.** Surfaced, not built. If Nick or the theme arc
  wants Flux inks, it is four values in one existing block and no component
  line moves.

Storing the ink **by token name** (the brief's I1) is what makes this stop
cheap: the day Flux gets its own four values, every stroke ever drawn
re-colours correctly, because no page ever stored a hex.

---

## §6 · THE STYLING MOUNT (I6's target), AND TWO THINGS THE BRIEF DID NOT KNOW ABOUT

### 6.1 · The exact mount to retire

- **Render:** [Sliver.tsx:412-446](apps/desktop/src/components/Sliver.tsx#L412-L446)
  — `content.kind === 'freewrite' && content.format` → the `stylingHeading`
  zone with B · I · U.
- **Feed:** [PageEditor.tsx:782](apps/desktop/src/pages/PageEditor.tsx#L782)
  — `format: { onFormat: applyFreeWriteFormat, boldOn, italicOn, underlineOn }`.
- **Type:** [Sliver.tsx:89-94](apps/desktop/src/components/Sliver.tsx#L89-L94)
  — the `format?` member of the `freewrite` arm.
- **Lexicon:** `stylingHeading`/`stylingBold`/`stylingItalic`/`stylingUnderline`
  — [deskLexicon.ts:753-756](apps/desktop/src/store/deskLexicon.ts#L753-L756).
  **`stylingBold`/`stylingItalic`/`stylingUnderline` are SHARED with Draft's
  own zone** ([Sliver.tsx:477-479](apps/desktop/src/components/Sliver.tsx#L477-L479)) —
  only `stylingHeading` becomes orphanable, and only if Draft's zone stops
  using it too (it uses `railFormat`, [Sliver.tsx:470](apps/desktop/src/components/Sliver.tsx#L470),
  so `stylingHeading` **does** orphan). The brief's "orphaned lexicon keys
  swept" must sweep exactly one key, not four. Sweeping the other three
  would break Draft.
- **Draft's zone, untouched:** [Sliver.tsx:468-500+](apps/desktop/src/components/Sliver.tsx#L468).

### 6.2 · **Free Write's Tools drawer ALREADY HAS AN "INK" ZONE — and it is about TEXT COLOUR**

[Sliver.tsx:366-403](apps/desktop/src/components/Sliver.tsx#L366-L403) renders a
zone headed `t('railInk')` = **"Ink"** ([deskLexicon.ts:561](apps/desktop/src/store/deskLexicon.ts#L561))
on `content.kind === 'freewrite'`. It contains colour swatches driven by
`content.ink.penColor` / `PEN_INKS` / `onChoosePen`
([Sliver.tsx:67-71](apps/desktop/src/components/Sliver.tsx#L67-L71)).

**Those swatches do not colour ink. They colour the TYPED TEXT:**

- `PEN_INKS = ['#1a0f06', '#b8231f', '#1f4fb8']` — three **hardcoded hex**
  values, [ModeStage.tsx:45](apps/desktop/src/components/ModeStage.tsx#L45).
- `penColor` flows to the editor and lands as
  `{ color: penColor, caretColor: penColor }` —
  [ForwardOnlyEditor.tsx:637](apps/desktop/src/components/ForwardOnlyEditor.tsx#L637),
  documented at [ForwardOnlyEditor.tsx:63](apps/desktop/src/components/ForwardOnlyEditor.tsx#L63)
  as *"Journal pen ink (sets text + caret colour)"*.
- It is fed only when `journalFurniture` is true
  ([PageEditor.tsx:770](apps/desktop/src/pages/PageEditor.tsx#L770)).

So I4 would mount a **second zone with the same name and heading**, meaning
something entirely different, on the same surface. That is a collision the
brief could not have known about.

**BUILD-LANE CALL:** the existing text-colour zone **retires from Free Write
alongside STYLING, in I6, on the same authority and for the same reason.**
Colouring the typewriter's text is digital styling on a surface R15 rules
does not decorate — it is the same class of thing as B·I·U, differing only in
which property it sets. The analog law's own test settles it: *what the
analog page cannot do, the chrome does not offer* — a typewriter does not
change ink colour mid-page; a **pen** does, which is exactly where I4 puts
the swatches. The name "Ink" then means one thing on the surface, and it
means the true thing.

**Precisely scoped, so nothing else moves:** only the `ink` member of the
**`freewrite`** sliver arm and its `PageEditor` feed are removed. `PEN_INKS`,
`penColor` and `ModeStage`'s own unframed pen bar
([ModeStage.tsx:410-425](apps/desktop/src/components/ModeStage.tsx#L410-L425))
stay for the **legacy/unframed** path and for **QuickSprint**
([QuickSprint.tsx:486](apps/desktop/src/pages/QuickSprint.tsx#L486)), neither of
which is named by R15 and neither of which this wave touches. Disclosed
rather than assumed, because "remove the ink zone" could very easily have
been read as "delete `PEN_INKS`" and broken two other surfaces.

### 6.3 · The inert placeholder is already gone — the grayed-door law is already satisfied

`inkToolPlaceholder: false` at
[PageEditor.tsx:791](apps/desktop/src/pages/PageEditor.tsx#L791), with M4/G3's
reasoning recorded inline: *"a greyed control for an unbuilt capability is a
locked door wearing paint."* Nothing to undo; I4's "absent, never grayed"
inherits a surface that already obeys it. The now-dead
`inkToolPlaceholder` member and its `railInkTool`/`railInkToolInert` lexicon
keys ([deskLexicon.ts:567-568](apps/desktop/src/store/deskLexicon.ts#L567-L568))
are the real orphans, and they sweep with I6.

### 6.4 · **THE GATE THIS WAVE MUST OPEN: I0's pen seal**

[ForwardOnlyEditor.tsx:510-543](apps/desktop/src/components/ForwardOnlyEditor.tsx#L510-L543):

> *"I0 — pen discipline. Ink is SEALED IN THE JOURNAL; the ForwardOnlyEditor
> is a NON-Journal surface (the sprint, the page in BOTH modes, the gate), so
> the stylus must be INERT here: zero characters, zero OS handwriting
> recognition, metaphor-coherent (typewriters ignore pens)."*

It runs unconditionally: `touch-action:none`, `handwriting=false`, and a
capture-phase `neutralizePen` that `preventDefault()` **and**
`stopPropagation()`s every `pointerType === 'pen'` event
([ForwardOnlyEditor.tsx:530-538](apps/desktop/src/components/ForwardOnlyEditor.tsx#L530-L538)).
This is the live behaviour: **a stylus tap on a Page does nothing at all —
not even caret placement.**

Three things follow, and they are the whole shape of I3's mechanism:

1. **Event order is already in our favour.** The stratum's listeners mount on
   an **ancestor** (`.mode-scroll`) of the editor. Capture phase runs
   root→target, so the stratum sees the pen **before** `neutralizePen` does.
   No change to `ForwardOnlyEditor`'s listener is needed for INK to work; the
   stratum stops propagation and the seal simply never fires.
2. **In TEXT the seal must remain exactly as it is** — byte-identical, on
   this surface and on every other `ForwardOnlyEditor` host (QuickSprint, the
   drafting mode, the first-run gate). Those hosts are not in this wave and
   must not observe any difference.
3. **This is a REVERSAL OF A STANDING PRODUCT DECISION, and it is R15's to
   make, not this lane's.** The seal's own comment calls ink "SEALED IN THE
   JOURNAL," and [ForwardOnlyEditor.tsx:17](apps/desktop/src/components/ForwardOnlyEditor.tsx#L17)
   calls it "the locked product decision." **R15 is the founder ruling that
   unlocks it, and item 121 is the charter that spends it** — so the lane is
   authorized. It is recorded here explicitly, and the seal's comment will be
   amended in place (not deleted) to name R15 as what narrowed it, so the
   next reader finds the reversal documented at the mechanism.

---

## §7 · POINTER + S-PEN HARNESS COVERAGE TODAY — **the drivers all exist; no new CDP work**

`apps/desktop/scripts/runtime-verify.mjs` already provides every leg of I7's
device matrix, trusted (CDP `Input.*`, `isTrusted:true`), not synthetic:

| driver | line | what it sends |
|---|---|---|
| `app.penStroke(sel, points, {pressure})` | [runtime-verify.mjs:424-445](apps/desktop/scripts/runtime-verify.mjs#L424-L445) | `Input.dispatchMouseEvent` with **`pointerType:'pen'`** + `force` (pressure); down → moves → up over a selector's box, points normalized 0..1 |
| `app.touchDrag(sel, points)` | [runtime-verify.mjs:602-618](apps/desktop/scripts/runtime-verify.mjs#L602-L618) | `Input.dispatchTouchEvent` — **finger/palm** |
| `app.mouseDown/mouseMove/mouseUp` | [runtime-verify.mjs:459-470](apps/desktop/scripts/runtime-verify.mjs#L459-L470) | `Input.dispatchMouseEvent` with `pointerType:'mouse'` |

**Existing coverage that touches this ground:**
- `j4.mjs` / `j5.mjs` are the only `penStroke` callers today
  ([j4.mjs:346](apps/desktop/scripts/harness/j4.mjs#L346)); `j4.mjs:349`
  already carries a **parked** assertion about pen-on-editable producing zero
  characters, re-derived against `BoardCardPopup`.
- `s1.mjs:318` asserts the I0 guard's *static* signature
  (`touch-action:none` + `handwriting=false`) on the script surface.
- **No test anywhere asserts the I0 seal on a Free Write page**, and none
  asserts stroke persistence on a Page. I7 is writing new ground, not
  re-deriving.

**The one real fidelity gap to design around, recorded now:** the harness
runs headless Edge/Chromium with **no pen present in the session**, so the
brief's *"finger does NOT draw when a pen is present"* leg cannot be
established by simulating a pen and a finger in one session — CDP has no
"a stylus is attached" state to set. That leg is provable only as *"a touch
event does not create a stroke while the page's own pen-present flag is
set,"* i.e. it tests **our** branch, not the platform's. It will be written
that way and **labelled as testing the branch, not the device** — and the
real-device sitting on Nick's tablet is named in the offer as the gate that
actually closes it, exactly as the brief instructs. Two other legs
(barrel-button, true palm rejection) stay hardware-only and unasserted
rather than faked.

---

## §8 · SEAMS LEDGER — everything above, in one place

### STOPS (nothing built; held for Nick's word)
1. **§5.3 — Flux's four ink values.** Not named in any ruling or canon; Flux
   already declines to specify a pen ink. Flux inherits Plateau's four under
   the cascade. Four values in one existing block whenever the word comes.

### BUILD-LANE CALLS (decided here, built, disclosed in the offer)
2. **§2.3 — validation is client-side at the read boundary, not server-side.**
   The server's stated no-revalidation law governs; `apps/server` stays
   untouched and the wave stays zero-schema *and* zero-server.
3. **§3.3 — the stratum mounts inside `.mode-scroll`, not at `inset:0` on the
   paper column.** The brief's mount was written from the Journal's growing
   sheet; Free Write's sheet is fixed-height with an inner scroller. I7's
   anchor check is re-aimed at the scroller's content box accordingly.
4. **§4.3 — the switch seats immediately before `ModeStrip`** (mockup B's
   relative order), because the framed band has no location line; the retired
   crumb is not resurrected. **Framed (≥1100px) only**, per the 112-A rider.
5. **§6.2 — the existing text-colour "Ink" zone retires from Free Write with
   STYLING in I6.** Same surface, same ruling, same analog test; `PEN_INKS`,
   the unframed pen bar and QuickSprint are untouched.

### CORRECTIONS TO THE BRIEF (recorded, not silently absorbed)
6. **§1.5 — pressure is already stored** (`StrokePoint.p`); what is true is
   that nothing reads it. Intent unchanged: the renderer stays pressure-blind.
7. **§6.1 — exactly ONE lexicon key orphans** (`stylingHeading`); the other
   three styling keys are shared with Draft and must survive.
8. **§7 — the "finger does not draw when a pen is present" leg cannot be
   established headless.** It will assert our branch and say so, with the
   device sitting named as the real gate.

### OPEN WORDS, UNTOUCHED (per the brief and Nick)
9. Eraser tip binding — **as built** (tip-agnostic). Zero-work default (§1.5).
10. The typewriter FACE question — Nick's, with the theme arc.
11. The S-Pen barrel button — hardware-reserved.
12. Pressure as a render input — a later slice.
