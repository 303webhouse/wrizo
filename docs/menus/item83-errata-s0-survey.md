# ITEM 83 ERRATA · S0 — THE SURVEY
### errata lane · worktree `.claude/errata` · branch `errata-build` off `origin/main` @ `7b78090`
### authority: `docs/menus/item83-errata-build-brief.md` §E0 · Nick's ledger words at `ef9f9ce`

**No behaviour change in this commit.** Everything below is read from the tree at
`7b78090`, with file:line citations, per the lane's own law: *maps are research,
disk wins.* Where a later slice will turn a reading into a MEASUREMENT, it is
flagged as a reading — the last errata's own new law (`READING CODE IS A
HYPOTHESIS, RUNNING IT IS A MEASUREMENT`) applies to this document too.

---

## (a) THE POP-OUT FADE PATH AND ITS CURRENT TIMER

**Vocabulary first, because the brief's word matters.** Per R10/R11
(`docs/menus/item83-nick-rulings-2026-08-03.md:164-201`), a *drawer* is the
sliver / cascade panel (slide-only, never a fade); a *pop-out* is the raised
tray that rises from the Tools foot — "Pop-outs from the Tools foot rise ABOVE
the drawer (a raised tray, drawer-width, never over the paper)." In built code
those pop-outs are exactly two components:

- `TypewriterMenu` — `apps/desktop/src/components/Sliver.tsx:694`
- `ProgressMenu` — `apps/desktop/src/components/Sliver.tsx:734`

both rendered as `.mode-settings.wz-sliver-instruments-panel`, mounted by
`SliverInstrumentRow` (`Sliver.tsx:682-687`) under a single-open discipline
(`const [open, setOpen] = useState<null | 'typewriter' | 'progress'>(null)`,
`Sliver.tsx:659`).

**THE POP-OUT HAS NO FADE PATH OF ITS OWN, AND NO TIMER OF ITS OWN.** It is a
plain child of the drawer panel and inherits the drawer's ambient dissolve.
The chain, end to end:

1. **The class carrier.** `.wz-sliver-panel` carries `chrome-fade desk-dissolve`
   unconditionally — `Sliver.tsx:239`. The pop-out is nested inside it
   (`Sliver.tsx:246-296`); Sliver's own comment states the intent: the pop-outs
   "dissolve on a keystroke through the exact same ambient mechanism, with no
   separate close-on-keystroke logic of its own."
2. **The CSS.** `index.css:3325-3327`
   - `.desk-dissolve{ transition:opacity var(--fade-dur,1.2s) ease; }`
   - `.desk-frame[data-writing='true'] .desk-dissolve{ opacity:var(--fade-min,.08); pointer-events:none; }`
   - `@media (prefers-reduced-motion:reduce){ .desk-dissolve{ transition:none; } }`

   A descendant selector, so the whole panel — pop-out included — goes to
   `--fade-min` together. There is no per-pop-out rule anywhere.
3. **The flag.** `data-writing` is written by `DeskFrame.tsx:224` from its
   `dissolved` prop; `PageEditor.tsx:997` passes `receded`; `receded` is fed by
   `ModeStage`'s `onDissolveChange` (`PageEditor.tsx:1004`, `ModeStage.tsx:183`).
4. **The engine.** `ModeStage.tsx:137` calls
   `useChromeDissolve({ surface:'sprint', rootRef: dissolveRootRef })`
   (`apps/desktop/src/components/useChromeDissolve.ts`).

### What starts it
`useChromeDissolve.noteWrite()` — `useChromeDissolve.ts:162-168`. It is called
from `ModeStage.noteWrite` (`ModeStage.tsx:149-155`), which the editor calls on
**every forward keystroke** (`PageEditor.tsx:537`, `onForward`). `noteWrite`
sets `--fade-dur` to `FADE_OUT_S` and flips `dissolved` **immediately** — there
is no debounce, no accumulation, no word count, no "after N ms of typing".

### What the numbers actually are
`useChromeDissolve.ts:26-41`

| constant | value | role |
|---|---|---|
| `FADE_OUT_S` | **2.8 s** | the recede curve — the whole visible "it faded away" |
| `WAIT_MS` | 180 000 ms (3 min) | pause after writing stops, before chrome returns |
| `FADE_IN_S` | 120 s | the slow return curve |
| `QUICK_S` | 0.7 s | explicit-summon return |
| `EDGE_PX` / `EDGE_DWELL_MS` | 56 px / 260 ms | the deliberate-reach summon zone |
| `LEAVE_GRACE_MS` | 150 ms | jitter grace on leaving that zone (FX5 S8) |

**So: the "short timer" a writer experiences is `FADE_OUT_S = 2.8s`, and it is
armed by the FIRST character typed, not by elapsed time.** One keystroke while a
pop-out is open, and 2.8 seconds later that pop-out is at `--fade-min`
(≈0.04–0.08 opacity) with `pointer-events:none`. That is the behaviour E1
replaces. Naming it precisely matters, because the brief says "the current short
timer": there is **no `setTimeout` that hides the pop-out**. The only timer in
this file is the 3-minute **return** timer (`returnTimer`,
`useChromeDissolve.ts:141,167`), which runs the other way.

### What cancels it (`resurface`, `useChromeDissolve.ts:155-159`)
- the 3-minute `returnTimer` firing (`:167`);
- **Esc** (`:252`);
- a **pointerdown outside** `editorSelector` (`:253-257`);
- a **dwell** at a viewport edge, or — since FX10 S3 — a dwell with the pointer
  **over any dissolved chrome rect** (`overDissolvedChrome`, `:100-110`, reached
  from `onMove` `:206-207`).

`Fade:off` (`themePrefs`) makes `noteWrite` a no-op and resurfaces immediately
(`:163`, `:178-181`).

### Consequence for E1, stated now so the slice is honest
The fade E1 must re-trigger is **shared** — it is the room's one vanishing
engine, and the pop-out has no separate switch. Retriggering *only pop-outs* on
15-words/period therefore cannot be done by changing `useChromeDissolve`'s
trigger; that would change every chrome surface, which §E1 forbids ("the vanish
engine's other chrome-recede fades are untouched"). The lawful shape is a
**pop-out-scoped gate on the same fade path**: the pop-out stops inheriting the
room's `data-writing` dissolve and carries its own dissolve flag, driven by a
composed-text trigger, reusing `.desk-dissolve`'s own curve, its `--fade-dur`
custom property and its reduced-motion rule rather than authoring a second fade.
§E1's own words — "The fade path itself is reused, not re-authored — only its
trigger changes" — are satisfiable exactly that way, and no other way I can see
at this branch point.

---

## (b) THE DRAFT FOOT'S MARKUP ORDER — AND PROGRESS vs FULL SCREEN TODAY

`.wz-sliver-panel` (`Sliver.tsx:246`) renders three children, in this DOM order:

```
.wz-sliver-panel                       (index.css:3437 — position:absolute;
                                        overflow-y:auto; NOT a flex container)
├── .wz-sliver-body        SliverToolsBody      (Sliver.tsx:247, :303)
│   ├── FORMAT section     (draft)              (Sliver.tsx:406-448)
│   └── STRUCTURE section  (draft)              (Sliver.tsx:450-473)
├── .wz-sliver-goal        SliverGoalFoot       (Sliver.tsx:248, :561)
│   ├── .wz-sliver-goal-timer        (timerOn only)          (:585)
│   ├── .wz-sliver-goal-hairline     ← THE PROGRESS BAR      (:587-591)
│   │   └── .wz-sliver-goal-hairline-fill
│   └── .wz-sliver-goal-edit / -edit-row                     (:593-616)
└── .wz-sliver-instruments SliverInstrumentRow  (Sliver.tsx:288, :661)
    ├── .wz-sliver-instruments-row   (display:flex; align-items:center; gap:8px)
    │   ├── button  Typewriter  (.wz-sliver-instruments-btn, 26×26 icon)  (:664)
    │   ├── button  Progress    (.wz-sliver-instruments-btn, 26×26 gear)  (:672)
    │   └── <FullscreenToggle/> ← FULL SCREEN                             (:682)
    └── the open pop-out, if any  (.wz-sliver-instruments-panel)          (:685-688)
```

**How they are laid out today, read off the rules rather than guessed:**

- The **progress bar** is `.wz-sliver-goal-hairline` —
  `height:2px; background:var(--ink-border)` (`index.css:3519`), fill
  `var(--accent-rest)` with a `.4s` width transition and a reduced-motion opt-out
  (`index.css:3520-3521`). It is a **column-flex child** of `.wz-sliver-goal`
  (`display:flex; flex-direction:column; gap:8px; padding:14px`,
  `index.css:3516-3517`), so it occupies its own full-width line.
- It renders only when `target != null && settings.instrumentsOn`
  (`Sliver.tsx:587`). The shipped default target is `24`
  (`writingGoal.ts:12,17`), so it is present by default — but a writer who
  clears the goal removes it, and E2's alignment therefore has to keep Full
  Screen's own line lawful when the hairline is absent.
- **Full Screen** is `FullscreenToggle` (`ChromeControls.tsx:34-99`), a **text**
  button rendering the literal string `Full screen` / `Exit full screen` (`:96`),
  styled by **inline style only** — `fontSize:'0.75rem'`, muted colour,
  underlined, **no class at all** (`:93`). It sits as the third cell of the
  horizontal `.wz-sliver-instruments-row`, beside two 26×26 icon buttons.
- **They are two different lines, in two different blocks**, separated by
  `.wz-sliver-instruments`'s own
  `margin-top:10px; padding-top:10px; border-top:1px solid var(--ink-border)`
  (`index.css:3539`). Full Screen's vertical centre cannot coincide with the
  hairline's today, by construction.

`FullscreenToggle` carries **no class and no data attribute**, so E2's probe
assertion needs a stable hook. The shared component must stay untouched (it also
serves App.tsx's corner cluster and the Cascade's Settings category —
`ChromeControls.tsx:4-13`), so the hook belongs on a wrapper in the sliver's own
markup.

**Two incidental findings, recorded so a later slice does not rediscover them:**

1. **`.wz-sliver-goal{ margin-top:auto }` (`index.css:3516`) is inert.**
   `margin-top:auto` resolves to `0` in block flow, and `.wz-sliver-panel` is a
   plain `overflow-y:auto` block (`index.css:3437-3439`), not a flex container.
   The goal block is not being pushed to the panel's bottom; it simply follows
   the body in normal flow. Nothing depends on it — recorded, not "fixed",
   because touching it is not in this brief.
2. **`footFullScreen: 'Full Screen'` exists in the lexicon
   (`deskLexicon.ts:768`) and is bound to nothing.** `FullscreenToggle`
   hardcodes its own `'Full screen'` / `'Exit full screen'`
   (`ChromeControls.tsx:91,96`). Named here so E2 does not reach into a shared
   component to marry them; the string stays unbound this wave.

---

## (c) THE STRUCTURE BLOCK — POSITION AND CONTENTS

**Position: it is ALREADY the last zone of the body, immediately above the
foot.** `Sliver.tsx:450-473`, inside `SliverToolsBody`. The body renders its
sections in source order, and every remaining section is gated to another
`content.kind` (`freewrite` ink / styling / forward-lock / capture, `board`), so
on a Draft page the rendered sequence is exactly **FORMAT → STRUCTURE**, with
`.wz-sliver-goal` as the next sibling.

**This is a finding E2 must reckon with, not a detail.** §E2's ruling — "the
Structure block moves to the **bottom** of the tab … Structure becomes the last
zone before the foot" — **is already true at this branch point.** The probe
assertion §E2 asks for ("Structure's block bottom precedes the foot's top")
therefore passes against unmodified `main`. It still earns its place as a guard
— that E4's new buttons land inside Structure, and that Structure never drifts
below the foot — but it is **not evidence that E2 changed anything**, and the
offer must say so rather than let a green check imply work. **The half of E2
with real work in it is Full Screen.** Surfaced; not resolved by me.

**Contents: exactly one control.**

```tsx
<div className="wz-sliver-section">
  <div className="wz-sliver-h">{t('railStructure')}</div>      // "Structure"
  <button className="wz-cascade-action" aria-haspopup="dialog"
          onClick={() => content.onSwitchStructure(
                     content.structure === 'prose' ? 'screenplay' : 'prose')}>
    {content.structure === 'prose'
       ? t('draftConvertToScreenplay')   // "Convert to Screenplay…"
       : t('draftConvertToProse')}       // "Convert to Prose…"
  </button>
</div>
```

`content.structure` is hardcoded `'prose'` at the one call site
(`PageEditor.tsx:769-771`), so in practice the row always reads **"Convert to
Screenplay…"**, carries `aria-haspopup="dialog"`, and opens the confirm modal at
`PageEditor.tsx:774-800`. Item 83 M5 retired the Prose | Screenplay **tablist**
that used to live here (`Sliver.tsx:452-462`; the swept CSS note at
`index.css:3502-3509`); the verb row is what replaced it.

**This is the E4 name-collision seam in the flesh** — see (f) below.

---

## (d) THE INDENT CONTROL — IS THERE AN OUTDENT PARTNER?

**No. The Draft sliver has a single arrow and no partner.**

- The control: one button, `title={t('draftIndent')}` (`"Indent"`,
  `deskLexicon.ts:774`), glyph `&rarr;` — `Sliver.tsx:441`. It sits in the second
  FORMAT row beside bullet `•`, quote `“`, and spacing `¶`.
- The action union has no outdent member:
  `export type FormatAction = 'bold'|'italic'|'underline'|'heading'|'spacing'|'bullet'|'quote'|'indent'|'align-left'|'align-center'|'align-right'`
  — `draftFormat.ts:12-15`.
- The implementation is **line-scoped, single-level, and a TOGGLE**:
  `if (action === 'indent') return toggleLinePrefix(text, start, LINE_DIRECTIVE.indent)`
  (`draftFormat.ts:144`), where `LINE_DIRECTIVE.indent = '\t'`
  (`draftFormat.ts:107`) and `toggleLinePrefix` (`:114-131`) adds the prefix when
  absent and **removes it when present** — on the caret's own line only. Never
  the paragraph, never the span a selection touches.
- Export already strips it plural: `.replace(/^\t+/, '')` in
  `stripMarkdownConventions` (`draftFormat.ts:184`) — so multi-level tabs strip
  correctly today with no change.

**Outdent exists twice elsewhere in the app, neither of them Draft's:**

- `BoardProjection.tsx:164,193-194` — the outline board's tree outdent (`←`,
  disabled when `!b.parentId`). A different model (parent/child nodes).
- `ModeStage.tsx:422` — the **legacy/unframed** stage format bar, an
  `Outdent`/`Indent` **pair** (`⇤`/`⇥`) driven by `document.execCommand`. A
  different mechanism entirely (contenteditable commands, not text prefixes), and
  not mounted on the framed Draft surface.

### ► SEAM 1 — SURFACED, NOT RESOLVED: the outdent question

§E3 asks me to report this with S0 and hold. Reporting, with the one nuance that
is easy to miss:

**Today there IS a way back, and it is the toggle itself.** Press Indent twice
and the line returns to exactly what it was — `toggleLinePrefix`'s own stated
purpose ("Toggling is what makes these honest: pressing twice returns the line to
exactly what it was", `draftFormat.ts:110-112`). **Repeatability consumes that
escape.** Once the arrow *increments* the level, the second press no longer
undoes the first — it deepens. So E3 does not merely *find* a one-way door: built
without a partner, **E3 CREATES one**, converting the app's only exit into
another step inward. A writer who indents four levels by accident would have no
control that walks it back.

**My recommendation, for Nick's word — I have not built it:** add the symmetric
outdent partner in the same slice, as `FormatAction 'outdent'`, decrementing one
leading tab, floored at zero (a no-op at level 0 — never an error, never a
disabled control). Three reasons: (1) the app already ships this exact pair on
its own legacy bar (`ModeStage.tsx:422`), so the shape is house precedent, not an
invention; (2) `stripMarkdownConventions` already handles `\t+`, so nothing
downstream changes; (3) the alternative — repeatable indent with no partner — is
the one shape that is strictly **worse than today** for a writer who overshoots.

**If Nick's word is "not now", E3's honest fallback is to leave Indent a toggle
and build nothing**, because a repeatable one-way indent is a regression wearing
a feature's clothes. **E3 is HELD on this word.** The rest of the wave is built
around it.

---

## (e) DOES THE PAGE-SETTINGS COLUMN EXIST AT THIS BRANCH POINT?

**YES. Item 4 has a lawful home; nothing is held for schema, and no migration is
needed.**

- **The column exists**:
  `alter table journal_entries add column if not exists page_settings jsonb` —
  `apps/server/src/migrate.ts:168`. Nullable jsonb, no default, no CHECK, no
  backfill.
- **A NAME CORRECTION, recorded rather than assumed.** The brief says
  `entries.page_settings`. **The table is `journal_entries`, not `entries`.** Not
  a new discovery — `migrate.ts:165-167` already carries the same correction
  against the same slip in an earlier brief: *"Note the table name:
  `journal_entries`, not the brief's `entries` — the brief named a table this
  schema does not have. Disk wins."* Same slip, same answer.
- **The wire is already whole**, so E4 adds no plumbing: `sync.ts:112`
  (`pageSettings: r.page_settings ?? undefined`), `sync.ts:254,267,273` (insert /
  on-conflict / `JSON.stringify(e.pageSettings ?? null)`).
- **The client mirror**: `JournalEntry.pageSettings?: PageSettings`
  (`types/index.ts:277`); the shape at `types/index.ts:285-291`; the floor
  `PAGE_SETTINGS_FALLBACK` at `:296-302`; read and written through the one funnel
  `PageSetupZone.patch` (`CascadePanels.tsx:363-368`).

**ZERO SCHEMA is satisfiable**: `kind` and `styleGuide` become **optional keys**
on the existing jsonb — absent, never null, on every grandfathered page, which is
the exact fixed point `tutor` / `origin` / `planBoardId` / `pageSettings` itself
all keep. **No STOP AND SURFACE is triggered by (e).**

### One thing in E4's path that the shape DOES resist — surfaced now

`PageSettings` is a **shared** shape: it is simultaneously the per-page value and
the per-user default, on purpose (`types/index.ts:281-284`,
`pageDefaults.ts:11-16`). And **"Set as my default" copies the whole object
verbatim** — `setUserPageDefaults(current)` at `CascadePanels.tsx:437`, into
`pageDefaults.ts:56`, from where `persistence.ts:795` stamps it onto every newly
born page.

So if `kind` / `styleGuide` simply join `PageSettings`, a writer who sets
defaults while a **Research** page is open makes **every future page Research** —
a page's *kind* is not its *dress*, and it would ride the dress channel by
accident. That is a real defect, not a style objection, and it is invisible until
someone presses one button on the wrong page.

**This needs no column and no ruling** — it sits inside E4's own "or the shape
resists" clause, and the resistance is answerable within zero schema: store the
two keys in `page_settings` exactly as the brief rules, and **strip them at the
defaults boundary** (`setUserPageDefaults` takes the dress, never the kind). E4
will build it that way and the offer will say so. Recorded here so the decision
is visible before the code exists.

---

## (f) ► SEAM 2 — SURFACED, NOT RESOLVED: the Screenplay name collision

§E4 asks me to report this with my own recommendation and resolve nothing. The
collision is real, and it is worse than "two similar labels".

**In one zone, under one heading `Structure`, E4 would place:**

- a **kind button** reading `Screenplay` — a *setting*: reversible, page-local, a
  radio state, no confirm, changing nothing about the writer's text; and
- the existing row reading **`Convert to Screenplay…`** (`Sliver.tsx:469`,
  `deskLexicon.ts:780`) — a *conversion*: a consequential one-way act behind a
  confirm dialog (`PageEditor.tsx:774-800`, "Each paragraph becomes an action
  line in a fresh script") that rewrites the page's body and moves the writer to
  another surface.

They will sit inches apart, sharing the word that names the destination of one
and the identity of the other. **The failure mode is specific and one-way**: a
writer who means to mark the page's kind clicks the row whose ellipsis they did
not read, confirms a dialog whose text they skim, and their prose is rebuilt as a
screenplay. There is no symmetric mistake in the other direction.

**Three things the built code already gives us, which shape the recommendation:**

1. The verb row's own bench law is *destination-named verbs, never a bare
   "Convert"* — `Sliver.tsx:450-462`, `deskLexicon.ts:778-779`. Renaming it to
   `Convert…` to dodge the collision would violate the law that put the word
   there.
2. `content.structure` is hardcoded `'prose'` (`PageEditor.tsx:770`), so the
   conversion row is effectively one-directional in practice today.
3. The M5 note records that the Prose | Screenplay **tablist** was withdrawn from
   exactly this zone precisely because *"a tablist's dress promises free
   switching; conversion is a consequential one-way act"* (`Sliver.tsx:452-462`).
   **E4's kind buttons are, visually, that tablist returning** — three chips
   promising free switching — now standing beside the very control whose clothes
   were taken away for promising it.

**My recommendation, for Nick's word — I have built nothing:**

> **Keep both, separate them structurally, and let the conversion row keep its
> name.** Inside `Structure`, render the three kind chips as their own labelled
> group (a `role="radiogroup"` with its own sub-label — *what this page is*),
> then a rule, then the conversion row under its own sub-label naming it as an
> act (*change the page itself*). Different control shape (chips vs. a
> full-width action button), different resting treatment (olive selection state
> vs. the existing `.wz-cascade-action`), and the `…` plus the confirm dialog
> stay exactly as they are. **Do not rename either control**, and **do not merge
> them** — merging would make a reversible setting inherit a destructive act's
> confirm, or an act inherit a setting's silence.

**A second, cheaper option if Nick prefers minimum surface area:** move the
`Convert to Screenplay…` row **out of Structure entirely** — it is an act on the
work, not a description of it — leaving `Structure` to hold only what the page
*is*. That removes the adjacency rather than dressing around it. I did not take
it myself because moving a DR3-placed control is a ruling-level change, and §E4
forbids me to resolve this silently.

**Neither is built. Structure keeps its existing row untouched until Nick speaks;
E4 renders the kind chips so they cannot be mistaken for it; the offer carries
this seam to chat 1 verbatim.**

---

## STATE OF THE WAVE AFTER S0

| item | status entering the build |
|---|---|
| **E1** fade timing | **BUILDABLE.** Path fully traced. The trigger is a shared engine, so the slice must scope a gate to the pop-out rather than retune `useChromeDissolve`. |
| **E2** layout | **HALF BUILDABLE.** Full Screen ↔ progress bar is real work. **Structure-to-the-bottom is already true** at `7b78090`; the assertion goes in as a guard, and the offer will not claim it as a change. |
| **E3** indent | **HELD ON NICK'S WORD.** No outdent partner exists; repeatability would *create* the one-way door by consuming today's toggle-as-escape. Recommendation above. |
| **E4** item 114 placeholders | **BUILDABLE, ZERO SCHEMA.** `journal_entries.page_settings` jsonb exists (`migrate.ts:168`); two optional keys, absent-not-null. The `setUserPageDefaults` leak is answered inside the brief's own clause. The **Screenplay name collision is surfaced above and stays unresolved.** |
| **E5** proof + offer | pending the above. |

**Nothing was migrated. Nothing was renamed. Nothing was merged. Two seams stand
open for Nick's word, and one item (E3) is held on the first of them.**

---

## CORRECTION — APPENDED 2026-09-03, NOT REWRITTEN

**S0 read §E3's seam clause too widely, and the table above is wrong on one
row.** It says *"E3 — HELD ON NICK'S WORD."* The brief holds **the outdent
question**, not the item: §E3 carries its own commit line
(`Errata: indent — the arrow indents a whole paragraph, repeatable (item 102's
Tab untouched)`), so the ruled behaviour was always meant to be built, and only
the partner control is the invention I must not make.

**E3 IS BUILT** — paragraph-scoped and repeatable, at `draftFormat.ts`'s new
`indentParagraphs`. **The outdent question stands open exactly as (d) states
it**, with the same recommendation, for Nick's word.

**One thing (d) did not have in front of it, and it changes the severity, not
the question.** `applyRailFormat` records an atomic step into the editor's own
undo stack for every rail click (`PageEditor.tsx:606`, FX6 S1), so **Ctrl+Z
walks an indent level back reliably.** The way back after this ticket is UNDO,
and undo alone. That is a real way back — it is not a dedicated one, and it is
not discoverable from the drawer. The recommendation in (d) stands unchanged.
