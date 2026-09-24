# ITEM 181 — FILES ON A JOURNAL BOARD: DESIGN PASS ON THE LEANS
### PLAN desk · 2026-09-24 · **design pass — written on the leans while 181-Q1/Q2/Q3 are with Nick** · reads with `b181-objects-on-a-journal-board-charter.md`

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `5011234`. Line numbers are a courtesy.
> **⚠ 181-Q1 IS A SCHEMA STOP — NO DEFAULT, HIS WORD ALONE.** *(A table and an upload endpoint on the server; the
> standing law stops it at chat 1 → Nick.)* **This pass works out everything AROUND the storage decision and marks
> exactly what each of Q1, Q2, Q3 would change (§8).** **Nothing here is a brief, nothing gates a builder, and
> there is no mockup** *(the charter's rule: a drawing of a photo on a page would answer where the photo lives).*
> **One storage decision serves TWO items:** *the writer's-own-images item chat 1 registered when Nick answered
> "external sources" (images as supplemental material on the rail) is the SAME storage as this item.* **Ask Nick
> once** *(I did not find that item's number in the entry I read; Fable/chat 1 merge the two questions).*

---

## §0 · HIS WORDS, AND THE ACT

> *"Users should also be able to import images/docs onto a Journal "board." These files should open to full size
> when they are double-clicked on."*
**Ruled earlier (Fable): TWO ACTS.** *165's Import Sources turns research documents into PAGES; 181 keeps a file AS
A FILE — an object on a board, opened full size on a double-click.*

## §1 · WHAT EXISTS, AND ONE NEW MEASUREMENT THAT SHARPENS THE CHARTER'S TRAP

The charter's finding stands (no file input, no blob store, `boxes`/`strokes` are jsonb on the entry's own record,
sync ships the record whole). **New, measured this pass:**
- **`apps/server/src/index.ts:19` — `express.json({ limit: '5mb' })`.** **That is the body limit of the WHOLE
  `/sync` push, all records together.** **So the charter's "inline base64" trap is not only wasteful — it is a
  SYNC OUTAGE:** *base64 inflates a file by a third, so a 3.75 MB photo alone fills the entire push; a phone photo
  is often 3–5 MB; two or three inline photos anywhere in a user's dirty records make the push fail with a 413,
  and `/sync` awaits all its pulls in one handler with no per-table catch.* **The failing push is EXPECTED to be retried and fail again (S0 confirms the client's retry
  behaviour) — the writer's account stops syncing, and nothing on screen says why.** **Inline is therefore
  refused for anything but a small thumbnail (§8, Q1's rival), and this desk does not present it as a real
  alternative.**
- **The server has no upload handling** (no `multer`/`busboy`; JSON bodies only). **A file endpoint is new
  server code, and it is not `/sync`.**
- **A drop of a file onto the app window today is UNGUARDED — UNMEASURED.** *In a browser or Electron a file dropped
  where nothing handles it can NAVIGATE the window to the file, replacing the app.* **S0 probes it; the design
  below guards the window either way (§4).**

## §2 · THE SHAPE ON THE LEAN — (b) a blob store, with an id on the Box

**The Box kind, additive (jsonb, no column — the `board-meta`/`connection` precedent):**
`{ id, kind: 'file', fileId, mime, name, byteSize, aspect, x, y, w, h?, z? }` — **a REFERENCE and the stored
geometry, never the bytes.** **It is CONTENT THE BOARD OWNS** *(one home, like a text card)*, so **168's Trash rules
apply to it and item 201's Delete Permanently reaches it** *(§6)*. **It is a card**, so **Experiment 1's link to a
card (`kind: 'card'`, `targetBoxId`) already reaches it with no change** — *this is how "images … as supplemental
material" on the rail works once the object exists.*
**The server: ONE new table** `user_files (id, user_id, mime, name, byte_size, bytes, created_at)` — **and two
backends this desk names honestly, so the schema question is a real choice:**
| backend | what it is | cost |
|---|---|---|
| **Postgres `bytea` — LEAN for v1** | bytes in the table (TOASTed); no new infrastructure or credentials | database size and backups grow with every photo; large rows; fine to tens of MB per file, wrong at scale |
| an object store (a bucket) | the table holds only the key | **new infrastructure, new credentials, a new attack surface (AEGIS's lane), a second thing to back up** — the right home at scale, more than v1 needs |
**Either way it is a schema/server change: Nick's word first, and the plain-English question is in §8.**
**The upload path:** a separate authenticated endpoint (`requireAuth`, raw body, **its own size limit, never the 5 MB
JSON limit**), **per-user scoped like every `/sync` query.** **The download path: the same endpoint family, by id.**

**On the device:** **bytes go to IndexedDB** *(`localStorage` is ~5 MB and JSON — wrong for blobs)*. **The
writer's file is stored locally FIRST, the Box is written at once, and the upload runs in the background** — *so
nothing waits on the network to appear on the page.* **The record can reach another device BEFORE the bytes do:**
**that device shows the object as a labelled placeholder (name, dimensions) and fetches on view, retrying on 404
until the upload lands.** **A device offline shows the placeholder and never an error.**

## §3 · THE FILE'S RULES — what is accepted, and what is refused with a sentence

**v1 accepts images only (181-Q3's lean):** **PNG, JPEG, WebP, GIF. Refused, each with one plain sentence and never
silently:**
- **SVG** — *it can carry script and is rendered from writer-supplied bytes;* not in v1.
- **HEIC/HEIF** — *the default iPhone photo format; Chromium cannot draw it in an `<img>`.* **The sentence says
  so and says how ("export it as a JPEG").** *(A mobile file picker often converts on the way in; a desktop drag
  does not — the refusal covers the gap.)*
- **A PDF or any document** — ***"PDFs come in through Plan → Organize Research → Import Sources, as pages."***
  **This keeps the two acts from growing into one door** (the charter's §6 warning) **and is exactly Q3's lean made
  visible.**
- **Over the size cap** — **proposed 10 MB per file (UNMEASURED — an operating number for Nick/Fable, driven by
  storage cost).** **A per-user storage cap is a product and cost decision this desk does not invent.**
**EXIF:** *a photo's bytes carry location and camera metadata.* **Lean: keep the original bytes ("a file kept AS A
FILE" is his act) and never display metadata;** **the risk is on any future sharing/export — and export names files
it leaves out, as it already does for ink** *(the Experiment 1 rule).* **The rival — re-encode through a canvas on
ingest to strip EXIF and downscale:** *it protects privacy and saves bytes, and it changes the file.* **Hand-up
for Fable; the lean is to keep bytes.**

## §4 · HOW A FILE ARRIVES — and where it lands (181-Q2's lean: the page you are on)

- **Door 1 — DRAG FROM THE OS onto the page.** **A window-level guard stops the browser's default for any file
  drop** *(so a miss never navigates the app away)*; **a drop on the page places the object; a drop elsewhere does
  nothing and says nothing.**
- **Door 2 — "Image…" in the board's Add flow** *(the flow already offers "Existing page…" and "New page",
  `boardAddExistingPage` and its siblings — one new row, one lexicon term)*. **This is the keyboard path and the
  touch path**, **and it opens the platform's file picker (`<input type=file accept="image/…">`).**
- **NOT in v1: paste-to-import.** *The Journal page is a text surface with its own paste discipline (the
  foreign-voice / anti-slop paste rail, AGENTS.md's queue) — an image paste handler there is a collision this
  item does not open.*
- **It lands ON THE PAGE THE WRITER IS ON** *(172: a card on a Book's page is displayed, fully editable, no green
  pin — the Journal is a Book-type board)*, **and stays there.** **Birth shape follows item 138's rule — what is
  born decides its own shape: the image's own aspect at a default width, aspect-locked on resize.** **Its name
  is its filename until renamed** *(167's stand-in; the name is also the `<img>`'s alt text)*.
- **Design for ANY board, ship where he asked** *(the charter)*: **`kind: 'file'` renders on a Default board's
  canvas by the same code; the Journal is the first home, not the only one.**

## §5 · "OPEN TO FULL SIZE" — the viewer
**Double-click opens the object at full size, scaled to fit, in the Card pop-up's own frame** *(item 166's
transient-surface class — the one overlay allowed over the page)*. **Enter on a focused object does the same**
*(keyboard)*. **A VIEWER, not an editor:** no crop, no rotate, no edit. **Escape and a close control leave.** **A
placeholder (bytes not yet here) opens to the same frame showing the name and *"Not downloaded yet"* — never a
blank frame.** **Double-click on a `file` card does not compete with a text card's double-click** *(different
kinds, different handler)*; **drag/select/resize are the ordinary card grammar.**

## §6 · WHAT IT MEETS — the interactions this pass names
- **Item 168/201 — the blob's lifecycle.** **A trashed file card keeps its bytes** *(Restore must work).*
  **A PURGED file card orphans a blob — and a blob can be SHARED**: *copying a card (item 123, copy-only, and the
  Duplicate item) copies the Box, which references the SAME `fileId`* — **so the server cannot delete a blob when
  ONE card is purged. Lean: no reference counts; a periodic MARK-AND-SWEEP** *(the server scans the user's
  `boxes` for `fileId`s — trashed and live alike — and deletes a blob that nothing references)* **with a GRACE
  PERIOD (proposed ~30 days, UNMEASURED)** **because 168-F1's known limit lets a purged card come back to the
  Trash for a while: a resurrected card whose bytes were swept must show *"This file is no longer available"* with
  its name — never a broken box.** **The sweep is server code inside the same schema decision.**
- **Item 202 (a per-card server merge)** *would close that resurrection window and shorten the grace; it is not a
  dependency.*
- **Item 169's move (resolved COPY):** *a copied file card shares the blob (above).*
- **Item 172:** *obeys the Book's page rule (§4).* **Item 166:** *the viewer is the Card pop-up's exception.*
- **Item 167:** *the name.* **Sync (`/sync`):** *a `file` Box adds ~250 bytes to a record — asserted, because the
  whole point of (b) is that the push stays small.*

## §7 · WHAT MAY START BEFORE HIS WORD, AND WHAT WAITS
**Not gated by the schema word:** the `'file'` Box kind and its renderer *(additive jsonb)* · the IndexedDB local
store · the viewer · the Add-flow row · the window drop-guard · the accept/refuse rules and their sentences.
**Gated on Q1:** the `user_files` table, the upload/download endpoints, the sweep — **and therefore the OTHER
devices seeing the file.** **Until then a `file` card is a single-device object; the placeholder rule (§2) must
already say "not available on this device" rather than pretend.**

## §8 · WHAT EACH OPEN QUESTION WOULD CHANGE — the marking

| question | the LEAN this pass is built on | if it comes back the other way |
|---|---|---|
| **181-Q1 — where the file lives** *(schema stop)* | **(b) the server stores it — one table, an upload endpoint; `bytea` first** | **INLINE in the board's record:** *§1 makes it a sync outage beyond a thumbnail — so it degrades to "small, downscaled images only": a client-side re-encode to a few hundred KB, a hard cap on TOTAL inline bytes per board (proposed ~1 MB, well under the 5 MB push), and the file is no longer "kept AS A FILE" (it is a downscaled copy).* **Then §2's server half, §6's sweep and the placeholder-fetch vanish** — *and so does any image over the cap.* **A LOCAL-ONLY file** *(the charter's option c)* **is §7's interim state made permanent — it breaks on the second device, which is the app's whole premise.** |
| **181-Q2 — where it lands** | **the page you are on** | **A NEW PAGE PER FILE:** *the import creates a page in the spine holding one `file` object; §4's birth shape moves to that page's centre; the "which page" question disappears; an import of ten photos makes ten pages* — **a page-creation side effect the charter's own note warned "onto a board is a placement, not a page-creation".** |
| **181-Q3 — images first** | **images in v1; PDFs are Import Sources' job** | **BOTH AT ONCE:** *§3's PDF refusal is deleted and a document viewer (pages, scroll, its own dependency) joins §5 — a build of its own, and it overlaps 165-B's parser; this desk would ask that the two share one dependency review.* |

**The plain-English lines for Nick (Fable checks against his words; Q1 marked as the schema stop):**
- **181-Q1 (schema stop, no default):** *To keep a real photo on your Journal page — visible on every device —
  Wrizo needs to store the photo on its server: one new database table and an upload path. The alternative is to
  shrink photos and tuck them inside the page itself, which is smaller but can't keep the original. Which?*
  **Lean: store it on the server.** *(The same storage would also let you add your own images as sources in the
  side rail — one decision, not two.)*
- **181-Q2:** *When you drop a photo on a Journal page, should it land on the page you're on (default), or create
  a new page for it?*
- **181-Q3:** *Photos first, and PDFs come in through Import Sources as pages (default) — or both at once?*

## §9 · THE CHECKS OWED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **park, never edit; audit the park COUNT** — on the TWO-DEVICE DOUBLE where a second device is involved)
1. **A photo places and survives:** drop/choose a PNG → a `file` card on the page, **stored locally at once**, present after a reload.
2. **Refusals, each with its sentence and nothing written:** SVG · HEIC · a PDF (*the Import Sources sentence*) · over the cap.
3. **The push stays small:** the `/sync` body for a record with a `file` Box grows by **hundreds of bytes, not the file's size** *(the check that (b) is what was built)*.
4. **The record before the bytes:** device B receives the Box while the upload is unfinished → **a labelled placeholder, then the image when the bytes land; never an error, never a blank.**
5. **Offline:** placeholder, no error; **online again: it resolves.**
6. **The window guard:** a file dropped where nothing handles it **does not navigate the app** *(S0 probes today's behaviour first)*.
7. **Double-click / Enter → the full-size viewer in the Card pop-up frame; Esc and the close control leave; nothing is editable;** the placeholder opens to *"Not downloaded yet"*.
8. **It is a card:** it drags, resizes aspect-locked, trashes and restores like one (168), **and a link to it (Experiment 1's `kind: 'card'`) resolves.**
9. **Delete Permanently (201) purges the card; the bytes survive until the sweep, and a card resurrected inside the grace period still resolves; after the sweep it reads "no longer available" with its name.**
10. **Copy shares the blob** *(two cards, one `fileId`)*; **purging one does not delete it.**
11. **Export names files it leaves out.**
12. **`alt` = the name.**
13. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

**§10 · What this pass does NOT do.** No mockup, no code, no harness, no build, and **no schema**. **It does not answer
181-Q1, Q2 or Q3**; it marks what each would change and says what may start.
