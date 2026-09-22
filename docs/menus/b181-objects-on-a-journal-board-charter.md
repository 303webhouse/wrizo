# ITEM 181 — IMAGES AND DOCS ON A JOURNAL BOARD
### PLAN desk · 2026-09-22 · **charter** · **item 116's successor** (116 absorbed IN PART, ruled)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `33d352e`.

> **✅ PRIMARY TEXT — Nick's own words** (`55cf81c`, part 3d), **pasted by him and byte-checked.**

> *"Users should also be able to import images/docs onto a Journal "board." These files should open to
> full size when they are double-clicked on."*

**RULED (Fable, accepting this desk's reading): TWO ACTS, NOT ONE.** **165's *Import Sources*** turns
research documents into **PAGES** on a new board; **181 keeps a file AS A FILE** — an object on a board,
opened full size on a double-click. **116's original shape, with the fresher founder words.**

---

## §1 · WHAT EXISTS — and it is almost nothing, which is the finding
- **NO file input, no `FileReader`, no `createObjectURL`, no drop-to-import — anywhere in the app.**
- **No blob storage, client or server.** `boxes` and `strokes` are **jsonb on the entry's own record**, and
  **sync ships that record whole.**
- **`<img>` appears 8 times and never for a writer's content** (app chrome only). **`SurveyItem.image`
  exists as a field and is never set.**
- **A board renders four box kinds** (`text` · `ink` · `page-pin` · `connection`), each with its own face.

## §2 · ⛔ THE QUESTION THAT DECIDES THE ITEM: WHERE DOES THE FILE LIVE
*Everything else here is ordinary design. This is not, and it is not this desk's to rule.*

| | where | what it costs |
|---|---|---|
| **(a) inline in the board's `boxes`** (base64) | zero schema | **⛔ THE TRAP:** a 2 MB photo becomes ~2.7 MB of text **inside the board's own record**, which **every autosave writes and every sync ships whole** — and every reader of `boxes` now carries it. *Zero schema is not zero cost.* |
| **(b) a blob store, with an id on the Box** *(lean)* | a bucket or table + an id field | **SCHEMA AND SERVER — it STOPS at chat 1 and goes to Nick**, by the standing law. The only shape that survives a second device and a large file. |
| **(c) a local file reference** | nothing stored | **breaks the moment the writer opens another device** — and Wrizo syncs. |

**LEAN: (b), and the charter says plainly that it cannot be built until Nick clears the schema.**
*(a) is acceptable for one thing only — a small thumbnail beside a (b) reference — and only if measured.*

## §3 · WHAT AN OBJECT IS
**A new additive Box kind — `'file'`** — beside `text`, `ink`, `page-pin`, `connection`. *The kind list is
a closed switch the renderers already read; adding one is the established shape* (FX4's `board-meta`,
AB4's `connection`). **It carries a reference, a mime type, a name and its stored geometry** — **and
nothing about the file's bytes.**
- **It is CONTENT THE BOARD OWNS** — one home, like a text card — *so item 168's Trash rules and item
  169's held MOVE question both reach it.* **Named, because the move conflict's population is exactly
  "cards and 181's file objects."**
- **It is not a page, and not a membership.** *No green pin, no drawer, no crumb.*

## §4 · WHERE IT LANDS — his word is "a Journal board"
**The Journal is a BOOK-type board (item 172), and 172 already rules what a card does there:** *displayed
and fully editable as on a board, staying on the page it was added to, with no green pin.* **An imported
object follows that rule exactly: it lands ON THE PAGE THE WRITER IS ON, and stays there.**
- **⚠ 181-Q2:** or does each imported file become **its own new page** in the spine? *(Lean: on the current
  page — "onto a board" is a placement, not a page-creation.)*
- **Design it for ANY board, ship it where he asked.** *A Default board is the obvious next home; an object
  that only works on a Book would have to be re-invented the day he says so.*

## §5 · "OPEN TO FULL SIZE" — the viewer
**Double-click opens the object at full size**, scaled to fit, **in the Card pop-up's own frame** — which
**item 166 already excepts** as the one overlay that may cover the page. **It is a VIEWER, not an editor:**
no crop, no rotate, no edit. *Escape and a close control both leave.*
**⚠ A PDF IS NOT AN IMAGE.** *An image needs a frame; a PDF needs a document viewer with pages of its own.*
**LEAN: images in v1, PDFs named as their own build** (181-Q3) — *and "docs" in his sentence is what makes
this a question rather than an assumption.*

## §6 · WHAT IT TOUCHES
**167** (an object's name is its filename until renamed) · **168** (it trashes like a card) · **169** (it is
in the held MOVE population) · **172** (it obeys the Book's page rule) · **166** (its viewer is the card
pop-up's exception) · **165** (*Import Sources* is the other act, and the two must not grow into one door).

## §Q · FOR NICK
- **⭐ 181-Q1 — the schema.** Keeping a real file means **storing it on the server** (this desk's lean),
  which is **a schema change and therefore yours to clear.** The alternative — packing the file into the
  board's own record — **makes every save and every sync carry the photo.** *Which?*
- **181-Q2 — where a file lands on the Journal:** **on the page you are on** (lean), or **a new page per
  file**?
- **181-Q3 — images first?** **Images in v1, PDFs as their own build** (lean — a PDF viewer is a build, not
  a frame), or both at once?

## §CLOSE
**Not built here, and it cannot be: 181-Q1 is a schema question and the standing law stops it at chat 1.**
**No mockup until Q1 and Q3 are answered** — *a drawing of a photo on a page would imply an answer to
where the photo lives.*
