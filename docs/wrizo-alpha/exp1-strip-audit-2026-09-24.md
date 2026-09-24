# EXPERIMENT 1 §4 — THE STRIP AUDIT, COMPLETED
### PW build lane · 2026-09-24 · the audit Nick's law demands, and what it falsified

**HIS LAW, verbatim:** *"every clickable tool in it (other than INK or settings) is something that
happens to a portion of the page that is selected (or in the case of an indent or bullet, something
that happens where the cursor is currently positioned)."*

**INSTRUMENT:** `apps/desktop/scripts/exp1-strip-audit.mjs` — browserless, parses
`components/Sliver.tsx` with the TypeScript compiler and prints every clickable and every component
tool slot with the section it sits in. **The brief seeded seven rows; the parsed population is 31
clickables across 8 sections.** A seeded table is research, and a 1,175-line component read by eye
produces a count that looks measured and is not.

**The script classifies nothing.** A verdict against his law is a reading; the script's job is to
guarantee the reading covers every clickable rather than the ones someone noticed.

---

## 1 · THE POPULATION, MEASURED

| section | clickables | tool slots |
|---|---|---|
| `inkTip` | 1 | — |
| `inkNib` | 1 | — |
| `railInk` | 2 | `<SliverInkZone>` |
| `railControls` | **0 buttons** | **1 — `<SliverToggle label={railForwardLock}>`** |
| `railFormat` | 13 | — |
| `railStructure` | 3 | — |
| `corkboardJournalTab` | 0 | — |
| `railBoard` | 4 | `<SliverToggle label={boardFooterToggle}>` |
| *(the grip, above every section)* | 1 | — |
| *(helper components: toggle, goal foot, instrument row)* | 7 | — |

**⚠ COUNTING BUTTONS IS NOT COUNTING TOOLS, and this audit nearly made that mistake.**
`railControls` reported **zero** clickables, which is false as a statement about the strip: its tool
is rendered through `<SliverToggle>`, so the *button* lives in the helper while the *tool* lives in the
section. Nick's law is about tools. Component usages inside a sectioned component are therefore
counted as tool slots, which is the only reason `railControls` appears here at all.

---

## 2 · THE VERDICTS

| tool | acts on | verdict |
|---|---|---|
| `railFormat`'s 13 (B/I/U/strike, headings, bullet, quote, align, indent) | the SELECTION, or the caret for indent/bullet | **LAWFUL** — exactly the two cases his sentence names |
| `inkTip`, `inkNib`, `railInk`, `<SliverInkZone>` (4 + 1) | ink | **EXCEPTED by his own sentence** |
| the settings gear (`footProgress`) | settings | **EXCEPTED by his own sentence** |
| the grip | opens the sliver | **NOT A TOOL** — it is the strip's own door, and it acts on no part of the page |
| `railControls` → `forwardLock` | the page | **⚠ UNLAWFUL AS WRITTEN** — confirmed, and it is the brief's one correct ⚠ row |
| `railStructure`'s two `role=radio` chips (`onPickKind`, `onPickStyleGuide`) | the page | **EXCEPTED — they ARE settings.** See §3 |
| `railStructure`'s `wz-cascade-action` (the structure verb) | the page | **⚠ UNLAWFUL AS WRITTEN, and it cannot be moved.** See §3 |
| `railBoard`'s 4 + its footer toggle | the board | **OUT OF THE LAW'S SCOPE.** See §3 |
| the goal block (`SliverGoalFoot`, 3) | the page | **⚠ UNLAWFUL AS WRITTEN** — confirmed |
| typewriter (`SliverInstrumentRow`) | the page | **⚠ UNLAWFUL AS WRITTEN** — but see §4: it is not where the brief says |

---

## 3 · THE THREE RULINGS THE BRIEF LEFT TO S0

**(a) `onPickKind` / `onPickStyleGuide` — EXCEPTED, because they are settings.**
They set the page's *declared kind* and its *style guide*: two `role=radio` chips in a zone whose own
class is `wz-page-setup-chip`. His sentence excepts "settings", and page setup is settings — the
markup says so in its own class name, chosen before this experiment existed. Reading them as
unlawful would make his exception apply only to the gear, which is narrower than he wrote.
**This desk's lean, offered for ratification rather than assumed.**

**(b) The Structure zone's verb (`wz-cascade-action`) — UNLAWFUL AS WRITTEN, AND IT MUST STAY.**
It is the confirm-gated Prose→Screenplay verb. It acts on the whole page and it is not settings, so
it fails the law's letter. **But it cannot move behind a settings row, because it is not a setting:**
PB1's amendment ruled that *"a screenplay page is a different document, not a differently-dressed
one"* and that the act is *"closer in kind to pairing a board than to toggling a setting."* A durable
authorial commitment filed under Page settings would be a worse lie than the one the law is
catching. **So this is a genuine exception to his sentence, not a violation to fix — and naming it is
the honest outcome of the audit rather than quietly passing it.** Routing is Fable's.

**(c) `railBoard`'s tools — OUT OF SCOPE, not lawful-or-unlawful.**
His law speaks of *"a portion of the page that is selected"*, which presumes the text surface. The
Board section renders only on a board, where the analogue of a selected portion is a card, and "Add
card" acts where the writer is on the canvas. Judging these by a text law would be judging them by
the wrong law. **Flagged, not ruled.**

---

## 4 · WHERE THE BRIEF'S SEEDED TABLE IS STALE — three falsifications

The seeded row **"typewriter · full screen · print — ⚠ MOVE behind *Page settings*"** does not
survive contact with the source:

1. **"print" IS NOT IN THE STRIP AT ALL.** Zero print control in `Sliver.tsx` — the row names a tool
   that does not exist there.
2. **FULL SCREEN IS NOT A STRIP TOOL.** `FullscreenToggle` comes from `ChromeControls`, and **item 83
   errata E2 already moved it out of the instrument cell** — its own comment in this file says so
   ("FULL SCREEN LEAVES THIS CELL"). It lives on the progress bar's line in the foot.
3. **TYPEWRITER IS IN THE FOOT'S INSTRUMENT ROW, beside the settings gear** — not in a tools section.
   Still page-level, so still unlawful as written, but not where the table places it.

**And `railControls` holds ONE tool, not three:** the forward lock. The brief's row is right about
the lock and wrong about its neighbours.

---

## 5 · THE MOVES ARE NOT IN THIS SLICE — and the reason is the acceptance claim

The seeded table marks four things **"⚠ MOVES behind one *Page settings* row."** Those moves are a
**reorganisation of v1 chrome**, and §0's acceptance claim is the thing that makes shipping inside
the real app safe:

> **WITH THE SWITCH OFF, THE APP IS v1.** *The existing suite passes unchanged, and the page renders
> with no mark on it.*

A move cannot be gated on the flag without the strip rearranging itself when an experiment is
switched on, which is a worse outcome than either state. And ungated, it changes v1 whether the
experiment is on or off. **So the moves belong to their own item, exactly as styling was ruled to
stay put and join the menu in item 186's own build.** This slice adds three selection-based tools and
touches nothing standing. *Same shape, same reason — consistency, not convenience.*

---

## 6 · WHAT THIS SLICE ADDS, AND WHY IT IS LAWFUL

**Link to… · Note This · Make a card** — all three act on the writer's SELECTION, which is the law's
first case. **"Note This" additionally survives a bare caret**, which is the law's SECOND case (the
indent/bullet class) and is the only door to EXP1-Q6's caret note. Ruled by Fable, 2026-09-24.

**AND FREE WRITE: *connects and notes, never styles*** — **the "never styles" half is ALREADY THE
SHIPPED STATE, and it was not this experiment that made it so.** Free Write's content member carries
**no `format` at all**: item 121 I6 retired styling from that surface on Nick's own analog law
("no digital styling, no fonts, no formatting on that surface"), by absence rather than by a disabled
mount. So §4's line describes something already true for a different and older reason, and this slice
has **no removal to make** — only the three acts to add. Said plainly so nobody implements a
subtraction that would be a second, redundant retirement.

**BUILT.** The zone is `railConnect`, on both text surfaces, rendered only when the host passes
`connect` — which it does only when the switch is on, so with it off the zone is absent from the DOM
rather than hidden. The audit re-run shows it: **34 clickables across 9 sections**, three of them in
`railConnect`.

**⚠ AND ONE TRAP THE NEIGHBOURS HAD ALREADY LEARNED.** The zone carries
`onMouseDown={e => e.preventDefault()}`, because a sliver button is **outside the contenteditable** and
a normal click's mousedown blurs it and **collapses the selection** — the format row says exactly this
above itself. Without it, "Link to…" and "Make a card" would every time act on an empty selection and
**silently become spot-notes** instead of failing loudly. Borrowed from the neighbour rather than
rediscovered.

---

## 7 · WHAT THIS AUDIT DOES NOT COVER — the honest bound

- **`Sliver.tsx` only.** The strip is this component; a tool reached from the strip but rendered
  elsewhere (Full Screen, via `ChromeControls`) is named above but not enumerated by the script.
- **Reachability is not audited.** The script finds a tool in the markup; whether a given surface
  renders it (`content` is a discriminated prop) is a separate question, and "present in source" is
  not "offered to this writer". An unreachable tool would pass this audit silently.
- **Not run.** No browser, no box turn. Nothing here needed one; nothing here is a runtime claim.
