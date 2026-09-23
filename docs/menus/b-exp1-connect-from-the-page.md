# EXPERIMENT 1 — "CONNECT FROM THE PAGE"
### PLAN desk · 2026-09-22 · **build brief** · the first v2 experiment, shipped as a slice he can use

**WORKTREE:** `.claude/worktrees/exp1-connect` · **BRANCH:** `exp1-connect` · **OFF:** `origin/main`.
**Never the primary checkout. This lane pushes its BRANCH.**

> **⚠ A WORKTREE ISOLATES FILES, NOT THE BOX** — read the box ordering on the ledger or ask chat 1
> before any run; never infer your turn from quiet.

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `8b774d4`.

> **✅ HIS PRINCIPLE, VERBATIM:** *"the text, or page, is primary"* · *"Every architectural choice we make
> needs to respect both pantsers and plotters without forcing either writer to go down a set path from
> the outset. That is the hard problem we're trying to solve here."*

---

## §0 · WHAT IT IS, AND THE TEST IT HAS TO PASS

**One slice: a writer selects words on a page and connects them to something — a source, a card, a note —
and sees what this page is connected to.** *Anchors first, as recommended, but shipped as something he can
use rather than as foundations.*

> **THE TWO-HALVES TEST, applied to this slice:**
> **A PANTSER NEVER HAS TO PLAN FIRST** — selecting a phrase and pressing *Note this* requires **no board,
> no project, no structure**. The note exists because the words do.
> **A PLOTTER NEVER LOSES THE PLAN WHEN WRITING STARTS** — every card and page they already made is a
> target the moment they select something. **Nothing has to be created to be connected.**

**THE SWITCH:** `Settings → Experiments → Connect from the page`, **OFF by default.**
**OFF hides; it never deletes:** the right-click menu's connect acts, the left strip's three acts and the
right rail are absent; **anchors and links remain in the data.** **ON is additive only.**

> **⛔ THE ACCEPTANCE CLAIM FOR THE WHOLE EXPERIMENT: WITH THE SWITCH OFF, THE APP IS v1.** *The existing
> suite passes unchanged, and the page renders with no mark on it.* **That is what makes shipping inside
> the real app safe, and the harness asserts it.**

---

## §1 · SPANS — his ruling, designed

**His words:** *"writers often use only partial quotes or the User may want to select a phrase and create
a card that explains or tracks its use."* **So an anchor is a SPAN, not a paragraph.**

**THE FOUR RULES HE GAVE, each with its mechanism:**
1. **SCOPED WITHIN A PARAGRAPH.** A span never crosses a paragraph boundary. *A selection that does is
   split into one span per paragraph, and the acts apply to all of them* — **stated, not silent.**
2. **RE-FOUND AFTER EDITS BY THE EXACT WORDS PLUS A LITTLE CONTEXT EITHER SIDE.** §1b.
3. **STORED OUTSIDE `entry.text`.** §2 — and the page's text is never rewritten to carry a marker.
   *That is what "the text is primary" means in the data: the writing does not grow scaffolding.*
4. **IT SAYS SO WHEN ITS WORDS ARE DELETED.** A lost anchor is **kept**, is **marked lost**, and its link
   **still opens its target.** *Never silently dropped, never silently re-pointed.*

### §1b · THE RE-FINDING ORDER — deterministic, and it stops rather than guesses
On read, for each anchor: **(1)** the exact `quote` at its recorded offset **inside the recorded
paragraph** → **found**. **(2)** `prefix + quote + suffix` anywhere in that paragraph → **moved** (hints
updated). **(3)** the same, anywhere on the page → **moved**. **(4)** `quote` alone, **exactly one match**
on the page → **moved**. **(5)** `quote` alone, **several matches** → **AMBIGUOUS: the anchor is kept,
marked, and the rail says *"these words appear 3 times now — point me at the right one"*** with a press to
choose. **(6)** no match → **LOST**, kept and marked.
> **⛔ THE LAW UNDER IT: AN ANCHOR NEVER MOVES ITSELF TO A GUESS.** *Steps 5 and 6 are where a lazy
> implementation would silently pick the first match, and that is how a quote ends up attached to the
> wrong sentence — the one failure this feature cannot have.*

## §2 · THE SCHEMA, NAMED PRECISELY — two shapes, one lean (⚠ Fable reviews; a table is Nick's to clear)

### SHAPE A — **additive fields on the entry (jsonb), zero schema** · **the desk's lean for an EXPERIMENT**
```ts
// types/index.ts — additive-optional, absent on every existing row (the onCanvas?/systemKind precedent)
export interface Anchor {
  id: string;            // stable; never reused
  paraIndex: number;     // the paragraph's ordinal WHEN WRITTEN — a hint, never the truth
  quote: string;         // the exact selected words — the anchor's truth
  prefix: string;        // up to 48 chars before, for re-finding
  suffix: string;        // up to 48 chars after
  startHint: number;     // character offset within the paragraph when written — a hint
  status?: 'moved' | 'ambiguous' | 'lost';   // absent means FOUND (absence-means-ok, the house grammar)
  createdAt: string; updatedAt: string; deletedAt?: string;
}
export interface Link {
  id: string;
  anchorId: string;      // one anchor may carry SEVERAL links — his "the source(s) linked", plural
  kind: 'source' | 'note' | 'card';
  targetEntryId?: string;   // a page or board
  targetBoxId?: string;     // a card on that board
  body?: string;            // a note's own words (kind 'note')
  createdAt: string; updatedAt: string; deletedAt?: string;
}
// on JournalEntry:  anchors?: Anchor[];  links?: Link[];
```
**Why it is the lean for an experiment:** **it ships without a schema gate**, it rides the record the
anchor belongs to, it is **hidden by one flag**, and **deleting nothing is trivial**. *`boxes` and
`strokes` already prove this shape at this scale.*
**Its cost, named:** a reverse question — *"what links point AT this card?"* — means reading pages.
**At today's scale that is a scan of one cache; it will not survive growth**, which is why Shape B exists.

### SHAPE B — **the tables** (the graduation path; **SCHEMA → stops at chat 1 → Nick's word**)
```sql
create table if not exists anchors (
  id text primary key,
  entry_id text not null,            -- the page the span lives in
  para_index integer not null,       -- hint
  quote text not null,
  prefix text not null,
  suffix text not null,
  start_hint integer not null,
  status text,                       -- null = found
  created_at text not null, updated_at text not null, deleted_at text
);
create index if not exists anchors_entry on anchors (entry_id);

create table if not exists links (
  id text primary key,
  anchor_id text not null,
  kind text not null,                -- 'source' | 'note' | 'card'
  target_entry_id text, target_box_id text, body text,
  created_at text not null, updated_at text not null, deleted_at text
);
create index if not exists links_anchor on links (anchor_id);
create index if not exists links_target on links (target_entry_id, target_box_id);
```
**`links_target` is the index Shape A cannot have**, and it is the whole reason to graduate.
**RECOMMENDATION: ship Experiment 1 on SHAPE A; open the table ticket now so the graduation is planned,
not discovered.** *The field names above are deliberately the same on both sides, so graduating is a
migration of storage and not of meaning.*

## §3 · THE RIGHT-CLICK MENU — the door (item 186)
**His list, in his order: styling · Make a card · Link · Note This · Remove.**
- **It opens at the pointer and may lie over the page — item 166's exception (a), and his popups extend
  those exceptions by his word.**
- **On a SELECTION.** With no selection, the text acts are **ABSENT, not greyed** (the house law), and only
  the cursor-position acts remain.
- **REMOVE UNLINKS AND NEVER DELETES** — his word. *It removes the link; the anchor survives if other
  links use it; the target is untouched.* **The menu says which of the two it will do** — *"Remove this
  link"*, never a bare "Remove".
- **Make a card** creates a card **on the board this page is connected to** if there is exactly one, and
  **asks which** if there are several. *With none, it makes a scrap card on a new board? **NO** — it makes
  a NOTE instead and says so.* **A pantser must not be handed a board they did not ask for** (his test).

## §4 · THE LEFT STRIP — the three acts, and the audit his law demands
**His law, verbatim:** *"every clickable tool in it (other than INK or settings) is something that happens
to a portion of the page that is selected (or in the case of an indent or bullet, something that happens
where the cursor is currently positioned)."*

**THE THREE ACTS THIS EXPERIMENT ADDS — all selection-based, so all lawful:** **Link** · **Note this** ·
**Make a card**.

**THE AUDIT, seeded from source (`Sliver.tsx`'s `content`) — S0 completes it:**

| today | acts on | verdict |
|---|---|---|
| `format` (B/I/U, font) | the selection | **lawful** |
| `inkOptions` | — | **excepted by his own sentence** |
| **`forwardLock`** | the page | **⚠ MOVES behind one *Page settings* row** (confirmed) |
| **the goal block** | the page | **⚠ MOVES behind *Page settings*** |
| **typewriter · full screen · print** | the page | **⚠ MOVE behind *Page settings*** |
| the gear | settings | **excepted** |
| `onPickKind` / `onPickStyleGuide` | the page | **S0 rules each against the law and reports** |

**AND FREE WRITE: *connects and notes, never styles*** — so in Free Write the strip shows **Link · Note
this · Make a card** and **no styling**, which is the analog law arriving in a new place rather than a new
exception.

## §5 · THE RIGHT RAIL — his spec, built
**His words:** *"The external sources should be listed when nothing in particular in the text has been
clicked on. This list should be sortable by recency, kind, and tag. When the User clicks on a linked
portion of text, only the source(s) linked. The User should then be able to double click on the source's
thumbnail to bring up a popup of that source (if a card, the card popup. If a page, a full-sized,
scrollable page, etc.)"*

- **RESTING STATE: everything this page is connected to**, sortable by **recency · kind · tag**.
  **⚠ THE GROUPING LAW APPLIES A THIRD TIME** (ratified at 177, applied again at the All Boards list): a
  source has **one kind** and **one recency** but **many tags** — *so by tag GROUPS, a source appears under
  every tag it carries, and the list prints its arithmetic.*
- **SELECTED STATE: click a linked span → only its source(s).** **A press on empty text returns to the
  resting list** — *the rail follows the pointer, and always has a way back.*
- **OPEN: double-click the thumbnail** → **the card popup for a card; a full-size scrollable page for a
  page** — his words, and both are **166 exceptions by his extension.**
- **REMOVE in the rail = UNLINK**, with the same wording as the menu.
- **The rail is zone 5 and obeys the width budget** — one panel column per side (ruled).

## §6 · THE MARK IN THE TEXT — quiet, and NOT an underline
**A linked span needs a mark, and two standing findings rule out the obvious ones:**
- **NOT AN UNDERLINE** — **standing finding F2**: *underline belongs to the writer* (item 122 made
  `__word__` the writer's own mark). **A dotted underline is still an underline.**
- **NOT ORANGE** — orange is **tags** (item 108) and **selection** (item 122). **NOT OLIVE** — olive is
  **where you are.**
> **THE MARK IS IN THE MARGIN, NOT IN THE WORDS: a small tick in the gutter beside the line**, plus **a
> light ground on the span itself while the pointer is over it.** *The text keeps its own face — which is
> what "the text is primary" means where a writer can see it.*

## §7 · THE HARNESS — `apps/desktop/scripts/harness/exp1.mjs`
Standing laws: **drivers never assume existence** · **real pointer events** · **release where the writer
releases** · **seed through the seams** · **absolute worktree path** · **select by name**.
1. **⛔ SWITCH OFF = v1:** with the experiment off, **no mark renders, no act appears, and the page's DOM
   is byte-identical to the pre-change build** on a seeded page. *(The claim §0 makes, asserted.)*
2. **Capture:** select words → Link → the anchor's `quote` is exactly the selection; **`entry.text` is
   unchanged, byte for byte.**
3. **Re-finding, one check per branch:** unchanged → found · the paragraph edited around it → moved ·
   **the same words three times → AMBIGUOUS and the rail says so** · **the words deleted → LOST, kept, and
   its link still opens.** *Branch 5 is the one that must not silently pick.*
4. **Menu:** Remove **unlinks** — the anchor and the target both still exist afterwards.
5. **Rail:** resting list sorts by recency and kind; **by tag GROUPS and prints its arithmetic**; clicking
   a span narrows to its sources; clicking empty text restores the list; double-click opens the right
   popup for each kind.
6. **Free Write:** the strip offers **connect and note, and no styling.**
7. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

## §8 · THE TWO-BUILDER SPLIT — where it cuts cleanly
| builder | owns |
|---|---|
| **A — THE TEXT SIDE** | span capture · the storage shape · **the re-finding algorithm and its five branches** · the right-click menu · the left strip's three acts + the audit · the gutter mark |
| **B — THE RAIL SIDE** | the Experiments switch and everything it hides · zone 5 and the width budget · the Linked list (filter · sort · group-by-tag) · open (both popups) · remove/unlink |

**THE SEAM IS ONE MODULE, AND ONLY A WRITES IT:** **`store/anchors.ts`** — `createAnchor`,
`addLink`, `removeLink`, `resolveAnchors(entryId)`, `getLinksForPage(entryId)`,
`getLinksForAnchor(anchorId)`. **B reads it and never writes through it.**
> **⚠ THE HAZARD, NAMED: two builders and one new module is how a double-write gets in.** *A writes; B
> reads. If B needs a write, it asks A for a function rather than reaching past the seam.*
**Both read the flag from ONE place** (`store/experiments.ts`), so "off" cannot be half-true.

## §9 · THE NOTE KEY — and ⚠ the part that needs the box
**His ask is `Ctrl+N`. In a browser that key belongs to the browser** (a new window), **and a page cannot
take it.** **In the desktop app it is ours** — Electron owns the window and can claim it.

| candidate | browser | desktop | cost |
|---|---|---|---|
| **`Ctrl/Cmd+Enter`** *(the confirmed stand-in)* | **free while focus is in the page** | free | not a mnemonic |
| **`Ctrl+N` in the desktop app only** | **impossible** | **his key** | **two keys to teach — the same app answers differently in two places** |
| a third key, e.g. `Ctrl+Shift+L` | **plausible, unmeasured** | free | `Ctrl+Shift+I/J/P/N` are taken; **`Ctrl+Alt+…` is AltGr on international layouts and is out** |

**THIS DESK BRINGS HIM ONE: `Ctrl/Cmd+Enter` everywhere** — *one key, both surfaces, already confirmed as
the stand-in* — **with `Ctrl+N` additionally honoured in the desktop app if he wants his own key there,
and the cost of two keys stated rather than hidden.**
> **⛔ AND THE MEASUREMENT IS NOT DONE: "test candidates in the browser and the desktop app" IS A BOX
> RUN.** **This desk has launched nothing and will not take the box without a turn.** **The test, ready to
> run:** a page that logs `keydown` (key, code, ctrl/meta/alt/shift, `defaultPrevented`) in **Edge** (the
> harness browser) and **Electron 31**, over the candidate list, **plus one pass with a German or French
> layout active** to prove the AltGr finding rather than cite it. **Ask chat 1 for the slot.**

## §Q · FOR NICK
- **EXP1-Q1 — the storage shape.** Ship on **fields in the page's record** (no schema, ships now) with the
  **tables planned as the graduation** (lean), or **go straight to tables**, which is a schema change and
  **yours to clear**?
- **EXP1-Q2 — Make a card with no board.** A pantser selects a phrase and presses *Make a card* with no
  board anywhere: **it becomes a NOTE and says so** (lean — you are never handed a board you did not ask
  for), or **it makes a board**?
- **EXP1-Q3 — the mark.** A linked span is marked **in the gutter, not in the words** (lean — underline is
  the writer's mark and orange is tags). **Acceptable, or do you want the words themselves marked?**
- **EXP1-Q4 — the key.** **`Ctrl/Cmd+Enter` everywhere** (lean), or **`Ctrl+N` in the desktop app and
  `Ctrl/Cmd+Enter` in the browser**?

## §CO · WHAT IS NOT IN THIS BRIEF
**The pass on `wrizo-page-first.html` — the file is NOT at that path** (`C:\Users\nickh\Downloads\`
holds `wrizo-three-writers.html`, 22:18, which is the three-writers drawing, not the page-first layout).
**This desk does not pass on a drawing it cannot see, and does not design the five zones from a summary of
one.** *Send it and the pass follows.*
