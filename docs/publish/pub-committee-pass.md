# PUB — Publish: the Experts + Architects committee pass

**STATUS: PARTLY RATIFIED (2026-09-30).**
- **Ratified by Nick:** §9 slate items 1–7, 11 and 12 (build order, dependencies, the five
  Publish laws, and the two Shelf defaults).
- **Also ruled by Nick:** the §11 scale question.
- **Still candidates:** everything else, including slate 8–10 and the §12 Journal-volume
  suggestion.

Nick's words are quoted verbatim in §9, §11 and §12 for chat 1 to register.
**Desk:** Publish lane (new), 2026-09-30. This is design only. **No app source file is
touched by this pass**, and everything it adds is new files under `docs/publish/`.
**Companion mockups:**
- `docs/publish/pub-mock-a-sheet.html`: A, *The Publish Sheet* (a door that opens a sheet).
- `docs/publish/pub-mock-b-press.html`: B, *The Press* (a door that opens a display).

**Numbering:**
- The arc prefix is **PUB**. "PB" is taken by PB1, item 71.
- Item numbers are chat 1's to assign; the next free was 212 at the last ledger read.
- This pass does not write `docs/open-threads.md`.

---

## NICK'S CARD (plain English — read this, skip the rest if you like)

**What this is.** Two advisory panels reviewed how Wrizo should let you get your writing
*out*: the Experts (craft and cognition) and the Architects (how it gets built). "Out" means:
- as files other apps can open (Word, PDF, e-book, web page, screenplay formats);
- as posts to WordPress, Substack and X;
- as a whole-book "Wrizo file" that keeps everything, ink included.

It has to work at every size, from one card to a whole book with a title page, chapters and a
bibliography.

**What they recommend, in one breath:**
1. Build one export engine that every format and destination shares.
2. Ship the simple **Publish Sheet** first (Mockup A). It slides out beside your page and never
   moves it, and asks three questions: **What** · **As** · **To**.
3. Later, grow **The Press** (Mockup B) for whole books: a full preview with the running order,
   title page and bibliography, and one tap back to where you were writing.

**What you've approved (2026-09-30)** (details in §9):

| Decision | Your word |
|---|---|
| Build order: engine → Sheet (A) → Press (B) | "Approved" |
| The code libraries for Word/e-book/PDF files (fflate, pdf-lib, fontkit), plus one test-only library | "Approved" |
| The five Publish laws (PUB-A1 to A5 in §6), e.g. "every send lands as a draft — nothing goes live from Wrizo" | "Approved" |
| The 90-day Shelf timer counts from the last edit | "Yes" |
| Journal pages don't move to the Shelf | "Yes, they should stay in the Journal" |

**Still open, for whenever you have a minute** (yes/no each, committee's lean in brackets):

| # | Decision | Lean |
|---|---|---|
| 8 | Your pen name / contact details live on this device for now; synced to your account later (a database change) | Yes |
| 9 | WordPress sign-in stays on your device only, after a security review | Yes |
| 10 | The starting list of Editions per kind of writing (§2) | Yes |
| 13 | A Journal volume holds 200 pages (or: one volume per year) | 200 pages |
| 14 | You can start a new Journal volume early (e.g. at New Year) | Yes |
| 15 | On a computer, a short hover on the Journal icon peeks at its menu (volumes included); long-press on touch; tap/click works everywhere | Yes |

**Your 2026-09-30 rulings, recorded** (§11, §12):
- You can move a Page, Board or Drawer to your Library. It also holds Wrizo's writing
  knowledge and your Tutor memory files.
- Unfiled Pages and Boards move to the Shelf after 90 days and stay there until you move them.
- Drawers stay put unless you move them.
- Fable is told the storage-full risk is urgent.
- Your idea: when the Journal gets full, it retires to the Library and is listed from the
  Journal icon. The Architects' take on it is §12 ("Journal volumes").

**Honest limits, found in research:**
- **Substack** has no way for apps to post. Wrizo can copy your piece ready to paste and open
  Substack for you.
- **X** can take one post free. A thread goes out one post at a time.
- **WordPress** can receive your piece as a draft that you publish there.
- **Book compiling** waits on stored chapter order (another lane's work), and the
  **bibliography** waits on Records.

### Publish TO-DO (living list — update as items close)
- [x] Committee pass written (this file)
- [x] Mockup A — The Publish Sheet
- [x] Mockup B — The Press
- [x] Nick's scale rulings recorded verbatim (§11)
- [x] Nick ratified slate 1–7, 11, 12 (2026-09-30)
- [x] The Architects' Journal-volumes suggestion written (§12)
- [ ] **Nick:** pass the storage-full note in §11 to Fable (ANNEX IV)
- [ ] **Nick:** look at both mockups; say which feels right (A first, B later is the lean)
- [ ] **Nick:** answer the still-open lines above (8, 9, 10, 13, 14, 15)
- [ ] **chat 1:** assign an item number to PUB; register the §9, §11 and §12 rulings in the ledger
- [ ] **Fable:** slot PUB0 (the survey) — it touches no code and can start any time
- [ ] **Fable:** assign the IndexedDB storage fix (§11, urgent, not a Publish ticket)
- [ ] **Fable:** give the Library, Shelf-aging and Journal-volume work (§11, §12) to the lane that owns the Journal and Library
- [ ] Later: PUB1 → PUB12 per §7, each waiting on the lanes named there

---

## §0 · THE CHARGE AND THE GROUND

**Nick's charge, verbatim (2026-09-29):**
> "I need to be sure that whatever I'm writing in Wrizo from here on out is going to be
> savable in various file formats, publishable as documents that can be opened by other
> applications, and even options to share my writing with other apps like WordPress,
> Substack, and Twitter. What also needs to be considered is how various kinds of writing
> should be published, given the various features we're building with the board
> architecture, bibliographies, etc. Writers needs the flexibility to export pieces of a
> project like a single card, but also an entire book of chapters and titles pages and
> bibliographies."

**His second question, added to this pass (2026-09-30):**
> "I'm wondering now if everything a user writes in their instance of the app shouldn't
> necessarily be saved in the app. Professional writers, for example, are going to have such
> a large database of writing at some point that it seems like the UI could become
> unwieldy/unusable, almost, and/or too much for the AI Tutor to reasonably hold in context …
> Should a User have a single project they are working on when they open the app, or should
> all of their projects be available, sortable, linkable, etc.? Or is there another option?"

That question is answered in §11.

**The ground: what exists today.**

**Publish is already a door.**
- It is the last word on the mode strip (`apps/desktop/src/components/ModeStrip.tsx:61`,
  `onPublish`).
- It opens a stub dialog (`pages/PageEditor.tsx:1121`, `components/ScriptEditor.tsx:1156`)
  with three things:
  - E1's Download (This Page .md/.txt · This Binder · Everything);
  - Copy My Words / Copy Formatted;
  - the still-true line "Publishing options — tailored to this work's type, destination,
    and format — are coming soon."
- The engine is `store/pageExport.ts`, `store/download.ts` and `store/clipboard.ts`.
- E1's laws stand: client-side, offline, the writer's words never altered, and an honest
  placeholder for anything a file cannot carry
  (`docs/wrizo-alpha/e1-get-my-words-out-brief.md`, `e1-review-fable.md`).

**Standing words that bind this pass:**
- **SV7** (Nick): "Publish real manuscripts: a Wrizo-native `.wzo` format plus `.pdf`,
  `.doc`, `.html`, WordPress, Substack." It was proposed as an arc, with a Nick-ratified
  dependency exception (T4). Neither was ever briefed or ratified
  (`docs/wrizo-alpha/batch-sitting-committee-pass.md`).
- **"Publish and Workshop are doors, not homes"** (`docs/wrizo-alpha/thread-arc-seed.md`).
- **DR4** (candidate): "Publish is the strip's door … never a mode tab again"
  (`docs/menus/item83-pass2-draft.md`).
- **Law 7, Assembly at Publish:** "sequencing pages or cells into a finished artifact — is
  Publish-mode work" (`docs/wrizo-alpha/page-and-homes-canon.md`).
- **The Voice Wall:** "finished work flowing out → his voice → always permitted"
  (`docs/PHILOSOPHY.md`).
- **PAGE IS PRIMARY** (`AGENTS.md`, `docs/page-primacy-canon.md`) and the b166 side-panel
  rule (`docs/menus/b166-guideline-amendment.md`).
- **The three-space canon** (surfaces / containers / displays;
  `docs/menus/pw-addendum-three-space-canon.md`).
- **Theme verbs:** Flux says **Connect** and Nomad says **Relay**
  (`docs/flux-theme-canon.md`).
- **Item 207 on fonts in files:** DOCX names Times New Roman / Arial; an app-made PDF embeds
  Tinos / Arimo (`docs/menus/item207-fonts-amendment-nicks-rulings.md`).

**How writing is stored.**
- **Every page, board and script is one kind of record.**
  - The code still calls it `JournalEntry` (table `journal_entries`). That is a leftover
    label from the original architecture, not a meaning.
  - Per SV6 the Journal is a system board of ordinary Pages, like Shelf and Trash.
  - Publish never uses the phrase "journal entry" (§2, vocabulary law).
- **A binder is a `Project` with a `kind`**: book, story, screenplay, essay, thesis, paper,
  article, report, proposal or other (`store/kindLabels.ts`).
- **Page text** is a plain string in Wrizo's own marks (`store/draftFormat.ts`).
- **Boards** hold cards and give a reading order (`store/boardStructure.ts`).
- **Scripts** carry a `ScriptDoc` and a pagination engine (`store/scriptPaginate.ts`).
- **The web app is the primary target** (Railway), so every format must be made in a phone
  or tablet browser.

**Not built, and Publish plans around it:**
- **Chapter order is not stored** (item 188; Experiment 2, "the board sets the chapter
  order", `docs/menus/conservative-v2-design.md`).
- **Bibliography** is a greyed board type that waits on Records (items 172 and 192).
- **Citation formatting** is not built (the TUTOR lane owns the style-guide asks).
- **Per-page fonts** (item 207) are not built.
- **Images in pages** (item 181) are not built.
- **Front-matter fields** don't exist beyond the binder title and the user's name.

**Wrizo | Read.**
- Its only endpoint is the Workshop intake (`wrizo-bridge/1`, work in progress, credits).
- The Reading Room for finished work (AX5) is not built.
- The Write-side bridge client is its own future ticket (`wrizo-read/docs/foundations/foundations.md`
  §1, §3, §12).

---

## §1 · THE EXPERTS — craft and cognition (the "why")

### Pass 1 — propose

**Deleuzean philosopher.**
- Publish is where the thesis stops being a metaphor: *convergence is the product*, and here
  the product is literally a file. Under the three-space canon Publish is a **display**: it
  shows surfaces and containers in a finished arrangement and owns none of them.
- Every export is a re-territorialization. The rhizome (boards, links, cards, pins) is folded
  into a line, a book.
- Only the native `.wzo` keeps the rhizome whole, as the line of flight back in. Every other
  format flattens, **so every other format must say what it flattened.**

**Cognitive scientist (ADHD, attention).**
- Finishing is the ADHD deficit, and this is the moment the app can make finishing cheap.
- **Three decisions at most** (what, as, to). The last choice is remembered, and a one-tap
  **"Again"** repeats it.
- It happens only at an edge, never mid-flow: Publish opens on the writer's act, never by
  itself.
- Formatting is a classic fidget trap ("I'll just tweak the margins"). **Choices are presets,
  not sliders.**

**Writing-craft pedagogue.** The Two Minds publish differently:
- The **Middle Door** writer ships fragments early: a card, a passage, a post. A card that
  goes out as a post *is* convergence for that writer.
- The **Trellis** writer compiles the whole and wants it right.

Both paths must be first-class. Neither is the "advanced" path.

**Motivation psychologist.**
- Sharing invites the audience into the room, and the audience brings the critic. So:
  - **no numbers ever come back** (likes, views, opens);
  - **no "unpublished" nudges**;
  - **no badge for publishing.**
- Every send is the writer's own act. It should land as a **draft**, a second gate that
  keeps the final "go" with the writer.

**Professional editor.**
- Conventions are the difference between "exported" and "submittable":
  - Standard Manuscript Format (Times 12, double-spaced, 1″ margins, "Surname / TITLE / page"
    header, `#` scene breaks, word count rounded on the title page);
  - industry screenplay format;
  - APA / MLA / Chicago page layout;
  - a hanging-indent, alphabetized bibliography.
- **Publish never "improves" the text.** It does not smarten quotes the writer didn't type,
  normalize spelling, or fix anything. The words are the writer's.

**Discovery writer (pantser).** "Let me get *this card* out as a post, right now, without
setting anything up."

**Structural writer (plotter).** "Let me trust the compile":
- the running order visible;
- front and back matter in their places;
- saved recipes (Editions) that give the same result every time.

### Pass 2 — critique and trim

| # | Proposal | Verdict |
|---|---|---|
| 1 | A typography panel (fonts, margins, sizes) | **Trimmed.** The look comes from **Editions**, with at most three toggles each. The Reading copy alone respects the page's own dress. |
| 2 | Auto-posting, scheduling, "best time to post", analytics | **Rejected.** They are a judge and an audience inside the room (Principles 5 and 8). |
| 3 | AI captions, summaries, hashtags, "make it punchier" for posts | **Rejected.** No AI in any conversion, and no foreign voice on the way out either (Voice Wall; Principle 7). |
| 4 | Images placed inside pages at Publish (Law 7) | **Deferred** until file objects (item 181) exist. |
| 5 | "Every file names what it leaves out" | **Promoted to law** (PUB-A1). E1 already practises it. |
| 6 | One-tap "Again" | **Promoted.** It is the single strongest finishing mechanic on the list. |
| 7 | X thread splitter | **Corrected.** It may only *cut*, never *change*: the posts joined back together must equal the source exactly. The writer sees every post before it goes. |
| 8 | "Publish your whole Journal" | **Kept, quietly.** The Journal is a board of pages and exports like any board, dated, as a reading copy. It is never suggested. |

**The Experts' charge to the Architects:**
- E1: at most three decisions.
- E2: presets, not sliders.
- E3: no numbers back.
- E4: sends are drafts.
- E5: words untouched.
- E6: every file names what it left out.
- E7: card-sized and book-sized paths are both first-class.

---

## §2 · THE ARCHITECTS — build and feel (the "how")

### Pass 1 — the engine

**One pipeline, five stages, one new folder.** Publish lives in `apps/desktop/src/press/`,
so no other lane's file is edited to build it.

```
Select  →  Assemble  →  Dress  →  Render  →  Deliver
(what)     (PressDoc)   (Edition)  (format)   (to)
```

**The model.** `press/model.ts` holds pure types:

```ts
PressDoc { v:1; meta; front: Matter[]; body: Part[]; back: Matter[]; omissions: Omission[] }
Part     { title?; chapters: Chapter[] }            // board lanes / Book sections
Chapter  { sourceId; navTitle; heading: 'from-body'|'numbered'|'none'; blocks: Block[] }
Block    = line (tabs, block indent, align, quote, bullet, runs) | heading | script
         | figure (ink) | placeholder | slot('bibliography'|'notes')
Matter   { role; generated; blocks }                // title page, dedication, bibliography…
```

**Rules the model enforces:**
- **Blocks are source lines.** Every line keeps its own directives, and blank lines become
  spacing. Grouping lines into paragraphs is a Dress decision, so the model can never lose a
  line.
- **Chapter headings never duplicate words.** If line 1 is a `#` heading, it becomes the
  chapter heading and leaves the body. Otherwise the Edition numbers the chapter, the way it
  adds page numbers.

**Readers, one per container** (`press/assemble/`):
- page;
- card;
- **board**, through `boardStructure(boxes)`: lanes become parts and outline depth becomes
  heading level;
- **Book-type board**: a stub until item 172;
- binder;
- script, which keeps the `ScriptDoc` structured;
- **the Journal board**, as a board of pages in its own stored order (`store/pageOrder.ts`);
- everything, including the Trash, per E1.

**Writers, one per format** (`press/render/`), each loaded only when used.

**Vocabulary law (the three-space canon, applied).**
- Publish speaks only of **surfaces** (Page, Card) and **containers** (Board, Binder, Drawer,
  and the system boards Journal, Shelf, Trash, and later the Library).
- It reads every record through `press/select/`. If the architecture lane renames the legacy
  `JournalEntry` type, one small Publish file changes.
- Publish proposes no rename itself (§10).

**Marks: one reader, never two.**
- Inline marks are read only through FIX's `store/markRuns.ts`: `readLead`, `readMarks`,
  `stripLine`, `BLOCK_TOKEN` (verified on `origin/item-writing-r3`).
- Only `press/assemble/inline.ts` imports it.
- There is no interim parser. Tickets that need marks wait for r3 to merge (PUB2); tickets
  that don't need marks ship first.

**Order: one function, never a second copy.**
- `press/select/order.ts` → `chapterOrder()`. Today its body is E1's creation-order sort,
  with a `SEAM-188` marker. When the chapter-order spine lands, its body becomes one call to
  that spine.
- **Publish never writes an order.** It never touches `orderIndex` or `seq`, and has no
  drag-to-reorder.
- A harness tripwire asserts Publish's order equals the binder's shown order, so a change
  to 188 fails loudly until the seam follows.

**Formats, and how each is made:**

| Format | Made by | Dependency |
|---|---|---|
| .txt · .md · .html (reading copy with print styles; a Gutenberg-block variant for WordPress) | hand-written | none |
| .docx | hand-written Word XML (document, styles, numbering, header/footer with page field, ink as images) | fflate (zip) |
| .epub (EPUB 3) | hand-written package + XHTML + nav, typographic cover | fflate |
| **.wzo** (Wrizo file) | zip of the writer's records verbatim + manifest with sha-256 + order + provenance + an HTML preview + README | fflate |
| .pdf, prose (manuscript / paper) | pdf-lib + fontkit; our own ragged-right line breaker (the submission convention), in a Worker | pdf-lib, @pdf-lib/fontkit |
| .pdf, screenplay | pdf-lib placing the lines from the existing `paginate(lineLedger(…))` | (same) |
| .fountain · .fdx | hand-written | none |
| PNG quote card | canvas, with the app's own fonts | none |

**Typeset book interiors** (justified, hyphenated) are *not* our PDF's job. They come from the
reading copy through the browser's own **Print…**, or from KDP's DOCX path.

**Fonts.**
- Tinos, Arimo (Apache-2.0) and Courier Prime (OFL) are vendored as **TTF** with their
  licences in `apps/desktop/public/press/fonts/`, because fontsource's WOFF2 files make
  pdf-lib write broken fonts.
- Faces are fetched per document, embedded as subsets only, and cached.
- DOCX names Times New Roman / Arial and embeds nothing (item 207).

**Editions (kind-aware presets).** At most three per scope plus the Wrizo file. The first is
the default. Plain .md/.txt live under "More formats".

| Scope / kind | Editions |
|---|---|
| Book | **Manuscript** (DOCX + PDF, Standard Manuscript Format) · **E-book** (EPUB) · **Reading copy** (HTML) |
| Story | Manuscript · Web post · E-book |
| Screenplay (or a script page) | **Screenplay** (PDF · Fountain · Final Draft FDX) |
| Essay | Paper · Web post · Post / thread |
| Thesis · Paper | **Paper** (DOCX + PDF per the page's style guide, MLA if none; the bibliography slot) · Reading copy |
| Article | **Web post** (WordPress draft · Copy for Substack · MD/HTML) · Document · Post / thread |
| Report · Proposal · Other | Document (DOCX + PDF) · Reading copy |
| A card | **Post** (X) · Quote card (PNG) · Text |
| A board | Outline document (DOCX / MD / HTML) · Reading copy |
| The Journal | Journal reading copy (dated) · E-book |
| Everything | **Wrizo archive** (.wzo, with the Trash) · E1's .md |

The only toggles are:
- *Number chapters*: book editions, on by default.
- *Copyright page*: e-book.
- *Number the posts*: X thread, off by default.

**Front and back matter, with zero schema.**
- **Generated title page:**
  - binder title;
  - pen name from this device's Publish profile, else the account name, never the email;
  - contact block, for manuscript format only;
  - word count, rounded, computed from the same canonical text the tests use.
  - Screenplays use `ScriptDoc.title` first.
- **Generated copyright page**, opt-in per edition.
- **Role pages are ordinary binder pages**, so the words always live in pages: Dedication,
  Epigraph, Foreword, Preface, Afterword, Acknowledgments, About the Author, Notes,
  Bibliography / Works Cited / References. A role comes from either:
  - the page's first line matching the role word (derived from text, so it syncs for free),
    or
  - a per-device override (`wrizo-press-prefs`, the `wrizo-board-mode` pattern).
- **The back-matter slot contract**, `press/matter/slots.ts`:

  ```ts
  registerMatterProvider(role: 'bibliography' | 'notes', provider: {
    entries(scope, styleGuide): { heading: string; blocks: Block[] } | null })
  ```

  - **Today:** a Bibliography-role page goes in verbatim, with a hanging indent.
  - **When Records / Citation (item 192) lands:** its lane registers a provider holding
    citation records. How they are formatted (CSL or a hand subset) is that lane's call;
    Publish only lays out what it is handed. This is how Publish is ready for bibliographies
    without waiting for them.
- **When Nick rules the schema (PUB-S)**, two additive, nullable fields:
  - `projects.publish`: roles, inclusions, last edition, subtitle.
  - `users.publish_profile`: pen name, contact, WordPress and Substack addresses.
  - Credentials are never stored in either.

**Destinations, with their honest limits:**
- **Share… (phone / tablet)**
  - Make first, then Share: two taps, because the file must exist before the system share
    sheet opens.
  - Android's share sheet carries PDF, text, HTML and images. DOCX, EPUB and .wzo fall back
    to Save. PUB0 verifies this on Nick's S25.
- **WordPress, self-hosted**
  - WordPress's own "Authorize Application" flow, then a **draft** post through the REST
    API, straight from the browser.
  - Some hosts strip the auth header. If so, Publish says so plainly and offers "Download
    HTML".
  - The credential is kept only if "Remember on this device" is ticked. It is never synced,
    never sent to Wrizo's server, and has a Forget button.
  - **Needs a security review before it ships.**
- **WordPress.com:** OAuth, which needs a registered app. A separate ticket.
- **Substack**
  - Substack has **no public posting API**, so there is **Copy for Substack** (rich HTML +
    plain text), a separate *Copy title*, and **Open Substack ↗**.
  - The pasted formatting may flatten in Substack's phone app, and the sheet says so.
- **X**
  - One post (280 or fewer): the free web intent, pre-filled.
  - Longer: the **thread splitter** cuts at paragraphs, then sentences, never inside a word.
    The writer steps through it ("Copy 2 of 6 → Open X").
  - The paid X API is not used.
- **Wrizo | Read:** later. The Reading Room (AX5) isn't built, and the Workshop intake is for
  work in progress, not Publish. Publish supplies the canonical text and the `.wzo`
  provenance when the bridge ticket comes.

**Testing law: every word, in order.** Each ticket's `scripts/harness/pub*.mjs` (E1's CDP
pattern, including offline) pulls the text back *out* of the file it made:
- DOCX and EPUB: unzip and walk the text nodes.
- PDF: pdfjs text extraction.
- .wzo: deep-equal of records plus sha-256.
- FDX: its text nodes.

After removing the edition's own added words (title page, numbers, headers), the sequence must
equal the canonical ledger **exactly**: nothing dropped, reordered or duplicated. The ledger is
`stripLine` over every source line, the same reader Copy My Words uses.

### Pass 2 — critique and trim

| # | Proposal | Verdict |
|---|---|---|
| 1 | The `docx` npm package | **Rejected.** About 200 KB+ for XML we can template in about 400 lines; fflate does the zip. |
| 2 | Two PDF libraries (one for prose, one for scripts) | **Trimmed to one.** pdf-lib does both; the S-arc already chose it. |
| 3 | A prose PDF with justified, hyphenated book typesetting | **Rejected for our PDF.** Browser print of the reading copy, or KDP's DOCX, does it better. |
| 4 | An interim marks parser until `markRuns.ts` merges | **Rejected.** Two readers is the defect FIX is closing. Mark-dependent tickets wait. |
| 5 | Drag-to-reorder chapters in the Press | **Deferred to the spine.** It writes through item 188's order when that lands, never a copy (T1). |
| 6 | A server relay for WordPress / X | **Deferred.** Browser-direct first; a relay needs Nick's word and a security review. |
| 7 | Publish as a new top-level mode with its own home | **Rejected.** Nick: doors, not homes. The Press is a display you pass through, with a return chip. |
| 8 | Main-bundle cost | **Budgeted.** Only the Sheet's shell is in the main bundle (≤15 KB gzipped, enforced by harness). Every writer loads lazily; PDF is about 400 KB and loads only when a PDF is made. |

---

## §3 · THE TWO SHAPES — the mockups

**A · The Publish Sheet** (`pub-mock-a-sheet.html`): **Publish → opens a sheet.**
- The sheet docks in the right margin *beside* the paper where the margin allows (b166). At
  narrower widths it overlays the page edge. **The page never moves or unmounts.**
- It asks three questions: **What** (selection · this card · this page · whole book · pick
  pages · everything), **As** (the kind-aware Editions), **To** (Download · Share · Copy ·
  WordPress · Substack · X).
- It shows a small preview, the honest "leaves out" line, one brass action, and a quiet
  "Again".
- Whole-book detail drills in inside the sheet and never opens a second pop-out.

**B · The Press** (`pub-mock-b-press.html`): **Publish → opens a display.**
- It is navigation, so it carries the return chip ("↩ Back to Ch. 7 — where you left off").
- **Left hand:** the **Running Order** (front / body / back matter, per-row include, "just
  this").
- **Centre:** a **live spread preview** of the finished thing (title page, chapter openers,
  scene breaks, bibliography).
- **Right hand:** **Edition · Dress · Deliver**, plus the writer's-choice line "Afterwards,
  move this to my Library" (§11).

**Recommendation: both, in order.**
- A covers every scope from a card up to a chapter, and every destination. It is the smaller
  build and touches the editor least.
- B is where Law 7's assembly and the book-sized compile are *felt*: seeing it become a book
  is itself the finishing reward.
- A's "Whole book" row gains **"Open the Press ›"** once B exists.
- Both run on the one engine, so nothing is built twice.

---

## §4 · THE RECOMMENDATION (single, unified)

- **R1.** Publish is a **door**. The Sheet is its first room; the Press is its book room.
  Neither is a home.
- **R2.** One engine: Select → Assemble → Dress → Render → Deliver, in `apps/desktop/src/press/`.
  No other lane's file is edited to build it.
- **R3.** Marks are read only through `markRuns.ts`; order is read only through
  `chapterOrder()`. Publish never keeps a second copy of either.
- **R4.** **Editions, not settings:** at most three per scope plus the Wrizo file, chosen by
  binder kind, with at most three toggles.
- **R5.** At most three decisions (What · As · To), the last choice remembered, and one-tap
  **Again**.
- **R6.** **Every file names what it leaves out**, in the file itself.
- **R7.** **Sends are drafts.** WordPress receives a draft; Substack and X receive the
  writer's paste or intent. Nothing goes live from Wrizo.
- **R8.** **No numbers come back.** No views, likes, opens, streaks or badges.
- **R9.** Front and back matter are ordinary pages with roles, plus a generated title page.
  The bibliography arrives through the slot contract when Records lands.
- **R10.** Formats come from hand-written writers plus three named dependencies (fflate,
  pdf-lib, @pdf-lib/fontkit), plus pdfjs-dist for tests only. Fonts are vendored TTF.
- **R11.** The `.wzo` Wrizo file is the whole-work and whole-account backup, **ink
  included**, and the way finished work can leave Wrizo whole (§11).
- **R12.** Every format passes "every word, in order" before it ships.

---

## §5 · NAMED TENSIONS

- **T1 · Law 7 versus item 188.**
  - Law 7 says sequencing is Publish work; Experiment 2 says the board sets the chapter
    order.
  - *Resolution:* Publish **shows** the one order and, once the spine lands, may reorder
    *through* it. It never stores its own. Until then, the Press says "Order comes from your
    binder — change it in Plan ›".
- **T2 · Zero-deps versus real formats.**
  - Word, e-book and PDF files can't be made honestly without a zip library and a PDF
    writer.
  - *Resolution:* SV7's T4 exception class, **named**: fflate, pdf-lib, @pdf-lib/fontkit,
    plus pdfjs-dist for tests only. Each lands in its own commit with its brief.
- **T3 · Door versus room.**
  - DR4 and "doors, not homes" pull toward a sheet; Law 7 and the plotter pull toward an
    assembly room.
  - *Resolution:* both, in order (§3). The room is a display you pass through, never a home.
- **T4 · Local-first versus connected destinations.**
  - WordPress needs a credential, and Wrizo's server stores none.
  - *Resolution:* the credential stays on the device, only if asked, and can be forgotten.
    A server relay waits for Nick's word and a security review.
- **T5 · Read's word "publish".**
  - Read calls its Workshop intake "the publish API", but that is work in progress, not
    Publish.
  - *Resolution:* Publish's Read destination is the future Reading Room (AX5), and it waits.
    The Workshop button remains Workshop's.

---

## §6 · CANON AMENDMENTS PROPOSED (Nick ratifies each by name)

- **PUB-A1 · The file names its omissions.** Anything a format can't carry (ink in plain
  text, links in a manuscript, a card's position) is named inside the file, never dropped
  silently.
- **PUB-A2 · Sends are drafts.** Nothing goes live from Wrizo. Every destination receives a
  draft, a paste, or a pre-filled compose box, and the writer presses the final button there.
- **PUB-A3 · No numbers come back.** Publish never shows an audience's response inside Wrizo.
- **PUB-A4 · Editions, not settings.** Publish offers presets with at most three toggles;
  the reading copy alone wears the page's own dress.
- **PUB-A5 · One reader, one order.** Publish reads marks through the one marks reader and
  order through the one order. It stores neither.

---

## §7 · THE PUB ARC (independently shippable)

Every ticket keeps the house rhythm: one brief; harness `scripts/harness/pub*.mjs` in the
same commit; report = push; Fable reviews; Nick's look closes.

| Ticket | Scope | Schema | New deps | Waits on |
|---|---|---|---|---|
| **PUB0** | Survey, no code: bundle budget; S25 share-sheet file types; WordPress CORS on a test site; Substack editor URL; font licences; the named-dependency brief | — | — | — |
| **PUB1** | Engine skeleton (model, scope, select, `chapterOrder()`); **.wzo** for page / binder / everything; the Sheet's shell; `triggerDownload` widened to accept a Blob | zero | fflate | — |
| **PUB2** | Marks via `inline.ts`; prose + Journal-board readers; txt / md / html; reading copy | zero | — | **FIX: r3 merged** (markRuns), 210 for titles |
| **PUB3** | DOCX; Manuscript / Document / Paper dress; generated title page; device Publish profile | zero | — | 207 names faces (reading copy only) |
| **PUB4** | Deliver: Share…, Copy for Substack, X post + thread splitter, quote card | zero | — | — |
| **PUB5** | Role pages; slot contract; **the Press** route with return chip | zero | — | **188** (order seam swap) |
| **PUB6** | EPUB 3 | zero | — | — |
| **PUB7** | Prose PDF (Worker, vendored Tinos / Arimo) | zero | pdf-lib, fontkit (+ pdfjs-dist, dev) | 207 |
| **PUB8** | Screenplay PDF · Fountain · FDX | zero | (PUB7's) | Screenplay lane: the printed-line function incl. (MORE) / (CONT'D) |
| **PUB9** | WordPress self-hosted draft; 9b WordPress.com | zero | — | Security review; Nick registers the WordPress.com app for 9b |
| **PUB10** | Board outline edition; card scope from boards | zero | — | Board lane wiring; **172** for Book boards |
| **PUB11** | Bibliography / notes live through the slot | zero | — | **192 Records**, Citation lane, 193 anchors |
| **PUB-S** | `projects.publish` + `users.publish_profile` synced | **yes — Nick's word** | — | the migration wave |
| **PUB12** | Wrizo \| Read — Reading Room destination | ? | — | Read bridge ticket + **AX5** |

---

## §8 · LANE MAP — what Publish never touches, and the few doors it must knock on

**Never touched by Publish:**
- **FIX:** `store/markRuns.ts`, `draftFormat.ts`, `draftDecoration.ts`, `pageExport.ts`, and
  PageEditor's `doCopy` block (in flight).
- **Read only** (never written):
  - `persistence.ts`; its only write is the existing `createBinderPage` for a new role page;
  - `types/index.ts`, `ink.ts`, `boardStructure.ts`, `script*.ts`, `kindLabels.ts`;
  - `ModeStrip.tsx` (already a door);
  - `apps/server` (until PUB-S or a relay).
- **Never written:** `orderIndex`, `seq`, or any order.
- **`docs/open-threads.md`** (chat 1's), `docs/menus/b*` (PLAN DESK's), `docs/menus/tutor/`
  (TUTOR's), and the Read repository.

**Touch points, in order, each by its owner's grant:**
1. **PUB1, after r3 merges:** in the two Publish dialogs (`PageEditor.tsx` about line 1143,
   `ScriptEditor.tsx` about line 1176), only the `publishComingSoon` paragraph is replaced by
   `<PressPanel/>`. E1's buttons and class names stay, so `e1.mjs` stays green.
2. **`store/download.ts`:** one additive widening (`string | Blob`). E1 is closed.
3. **`deskLexicon.ts`:** an appended `press*` block per ticket. Flux's "Connect" and Nomad's
   "Relay" come through `themeLexicon`. `publishComingSoon` retires at PUB5.
4. **`package.json` / lockfile:** dependencies in their own commits; the lockfile is
   regenerated, never hand-merged (it races 207's font packages).
5. **`App.tsx`:** one route for the Press (PUB5).

---

## §9 · RATIFICATION SLATE (Nick: yes / no per line)

**Nick, verbatim, 2026-09-30,** answering the five decisions put to him in chat: "1. Approved
2. Approved 3. Approved 4. Yes 5. Yes, they should stay in the Journal."

His chat numbering maps onto this slate as:
- chat 1 → slate 1;
- chat 2 → slate 2;
- chat 3 → slates 3–7;
- chat 4 → slate 11;
- chat 5 → slate 12.

1. Build order: **engine → Sheet (A) → Press (B)**. **RATIFIED 2026-09-30 ("Approved").**
2. The named dependency exception (T2): **fflate, pdf-lib, @pdf-lib/fontkit**, plus
   **pdfjs-dist** (tests only). **RATIFIED 2026-09-30 ("Approved").**
3. **PUB-A1** The file names its omissions. **RATIFIED 2026-09-30 ("Approved").**
4. **PUB-A2** Sends are drafts. **RATIFIED 2026-09-30 ("Approved").**
5. **PUB-A3** No numbers come back. **RATIFIED 2026-09-30 ("Approved").**
6. **PUB-A4** Editions, not settings. **RATIFIED 2026-09-30 ("Approved").**
7. **PUB-A5** One reader, one order. **RATIFIED 2026-09-30 ("Approved").**
8. The Publish profile (pen name, contact) lives **on this device now**, synced later (PUB-S,
   a schema change). *Open.*
9. WordPress credentials stay **on the device only**, behind a security review. *Open.*
10. The Editions table in §2 as the starting set. *Open.*
11. §11 follow-up (a): the 90 days counts from the **last edit**. **RATIFIED 2026-09-30
    ("Yes").**
12. §11 follow-up (b): **Journal pages do not** age out to the Shelf. **RATIFIED 2026-09-30
    ("Yes, they should stay in the Journal").**
13. §12: a Journal volume holds **200 pages** (the alternative is one volume per year).
    *Open.*
14. §12: the writer can **start a new volume early** from the Journal panel. *Open.*
15. §12: past volumes are listed in the Journal's rail panel on every device. A **short
    hover** on the Journal icon peeks at that same panel on mouse devices, and a
    **long-press** does it on touch. *Open.*

---

## §10 · WHAT THIS PASS DOES NOT DECIDE

- Whether the legacy `JournalEntry` record type is renamed to "Page". That is the
  architecture lane's call; Publish is insulated either way.
- The item number (chat 1), and when the arc starts relative to Batch Eight (Fable).
- Chapter-order storage (188), board types (172), Records and citation formatting (192), and
  fonts (207). Publish consumes each and owns none.
- Read's Reading Room (AX5), and whether a published piece is ever "hung" there.
- Importing a `.wzo` back into Wrizo. It's permitted in principle (the writer's own work
  flowing in), but proving a file is the writer's own sits beside the paste-rail lane.

---

## §11 · NICK'S SCALE QUESTION — should everything live in the app?

**The question** (quoted in §0): a professional's body of work could overwhelm the interface
and the AI Tutor. One project at open, all projects available, or something else?

### The facts the pass rests on (read from code or measured)

- **Everything loads at every start.**
  - `store/persistence.ts` loads every collection from the browser's localStorage when the
    app opens. localStorage holds **about 5 MB** per site.
  - Each collection is one stored value, so every save rewrites the whole collection.
- **When storage is full, saving silently stops, and it can happen now.**
  - The failed write is swallowed (`persistence.ts:253`, "never throw into a write path").
  - Online and signed in, the server still has a copy.
  - **Offline edits are lost on reload**, and a writer with no account has no other copy.
  - Where it bites: text at roughly **0.5–0.85 million words**. Heavy ink can reach it on
    **about one densely handwritten page**, because item 203 measured about 56 bytes per ink
    point (`docs/menus/item203-sync-body-limit-s0.md`).
  - **This is a data-safety risk today, not a someday feature.**
- **Every launch pulls the whole account** (`store/sync.ts` full pull; server
  `apps/server/src/sync.ts`), Trash and ink included. Merging is quadratic, lists are
  uncapped, and there's no list virtualization.
- **The Tutor does not grow with the corpus.**
  - It reads the current page (up to 16k characters), that page's own conversation, and the
    book's Bible (up to 8k characters). Nothing else (`apps/server/src/tutor.ts`,
    `components/Tutor.tsx`). The worst case is about 30k tokens.
  - Cross-project memory was a ruled non-goal (`docs/wrizo-alpha/tu5-tutors-memory-brief.md`).
  - Found in passing: any page's Tutor conversation over 20 messages fails on every send.
    That is filed separately, because it's the TUTOR lane's code.
- **There is no "current project."**
  - Open resumes whatever you last edited, from any project (F1, `store/resume.ts`).
  - Lists, links (Law 3, "one page, many memberships") and Nick's ruled search ("everything,
    anywhere, local, sends nothing", `docs/menus/item108-tags-as-sorting-pass.md`) all span
    everything.
- **Standing rulings:**
  - no completion states and no "mark done" (M1, HD and Thread arcs);
  - the Shelf's "loose forever";
  - the arrangement law (a condition is computed, not arranged).
- **The Library** was a tabled rail stub. Nick: "a stack of Pages that can be flipped
  through … or a thumbnail view … grouped into sections … That comes toward the end."

### Pass 1 / Pass 2

**(A) One project at open: rejected as a law.**
- It puts a gate at the front door, which costs time to first keystroke (TTFK), and F4 rules
  out any app-level mode.
- It breaks Law 3's cross-project memberships and Nick's everything-search.
- It punishes the Middle Door writer, who works by cross-pollination.
- A *focus lens* (a display that stores nothing) survives as an optional later idea.

**(B) Everything always present, as today: rejected.** It fails on device storage first, then
on list noise and startup cost.

**(C) The committee's first proposal, "Close at hand / In the Library":** recency would have
computed where work lives. **Superseded by Nick's rulings below**, and recorded here as the
proposal his word replaced.

### NICK'S RULINGS, verbatim, 2026-09-30 (for chat 1 to register)

1. "Yeah, let's allow users to move a Page, Board, or Drawer to their Library (which will
   also contain some preloaded writing knowledge as well as memory files the user would like
   to add to train their AI Tutor."
2. "After 90 days, all unfiled Pages/Boards should be moved to the Shelf, which is where they
   stay until/unless the User moves it somewhere else. Drawers stay where they are
   until/unless the User moves them to the Library."
3. On whether writers can put work away by hand: "Answered above". Yes, by the writer's own
   move.
4. On telling Fable the storage-full risk is urgent: "Yes."
5. On Journal pages and the Shelf: "Yes, they should stay in the Journal. But at some point,
   maybe the Journal should get full, at which point it gets retired to the Library and listed
   in a pop-out menu when the user hovers over the Journal icon? Open to suggestions from the
   Architects."

   The first sentence is ratified (slate 12). The rest is Nick's proposal; the Architects
   answer it in §12. It **amends one default below**: a full Journal volume becomes the **one
   automatic move into the Library**. Everything else still moves there only by the writer's
   own act.

### What the rulings make the model

- **The Library is a real container the writer chooses.** Pages, Boards and whole Drawers
  move there only by the writer's own act. The one exception is a full Journal volume, per
  ruling 5 and §12. It holds three things:
  - (a) the writer's moved work;
  - (b) **preloaded writing knowledge** from Wrizo, read-only and hideable (e.g. the story
    frameworks in `packages/modules-writing/data/frameworks`, style-guide references);
  - (c) **memory files** the writer adds for their Tutor.

  It returns to the rail as a container: it's no longer an empty door, which meets CD1's
  objection.
- **The Shelf gains one age rule.** Unfiled Pages and Boards move to the Shelf after 90 days
  and stay until the writer moves them. This is the app's only automatic move. Drawers never
  move by themselves.
- **Nothing is ever marked "done",** and there are no counts or nudges. Both moves are about
  *where*, never *finished*, so the no-completion-states law holds.

### Committee refinements carried to the builders (defaults; Nick can overrule any)

- **The 90 days counts from the last edit**, not creation. Opening a page without typing does
  not reset it. *(slate 11)*
- **"Unfiled" means not inside a Drawer.** Journal pages already have a home (the Journal
  board) and don't age out *(slate 12)*. Pages pinned to a board that lives in a Drawer count
  as filed.
- **A shelved item is sticky.** Editing it doesn't move it back ("stay until the User moves
  it"). That needs one stored field (e.g. `shelvedAt`), a schema change through chat 1. By
  Nick's word it supersedes the 2026-09-07 reading that the Shelf is *only* a computed
  condition, for aged items.
- **Library work stays fully the writer's:** searchable (everything-search), linkable
  (Law 3), publishable, and opens normally.
- **The Library is kept off the device's startup load.**
  - Its words are indexed for local search.
  - Its heavy parts (ink, later images) download when opened.
  - **This is how the Library also answers the scale problem.**
- **Tutor memory files** (TUTOR lane; amends TU5's "no cross-project memory" by Nick's word):
  - **"Train" means the Tutor *reads*** the relevant parts of the writer's chosen files when
    answering, within its context budget. No AI model is retrained.
  - The files are **sealed like reference images (Law 7).** They inform the Tutor, and their
    words never enter a Page. The Voice Wall stands: other people's text can be *read by* the
    Tutor, never *pasted into* the writer's prose.
- **The Tutor stays scoped** to the page, the book's Bible, and the Library memory files the
  writer has chosen. It never reads the whole body of work.

### Publish's part

- **The `.wzo` Wrizo file is "take it out whole."** With *Everything* it is the complete
  backup, **ink included**; E1's .md replaces ink with a placeholder line.
  - A finished book can leave Wrizo entirely (Principle 6: graduation, not retention) and
    come back whole later.
  - The backup includes the writer's own Library items and memory files, never Wrizo's
    preloaded knowledge.
- **The Press offers an unticked "Afterwards, move *this book* to my Library".** It is the
  writer's act, never automatic.
- **Library work publishes like any other work.**

### Architects' build notes (not Publish tickets — for Fable to assign)

1. **URGENT, and independent of everything else:** move the device store from localStorage
   to IndexedDB (hundreds of MB, not about 5), and **say so honestly** if storage ever does
   fill. This closes the silent-save-failure risk.
2. Sync by drawer and by need: fetch Library and aged work when opened, and stop
   re-downloading the whole account at every launch. A sync protocol change; Architects plus
   Nick.
3. The Library container: rail door; "Move to Library" for Page / Board / Drawer; contents
   loaded on demand. The Shelf's 90-day rule (`shelvedAt`). Schema, through chat 1.
4. Tutor memory files and preloaded knowledge (TUTOR lane): reading within the context
   budget, sealed from Pages.
5. Long lists virtualized.

### Note for Fable (ANNEX IV) — paste-ready

> **Urgent, per Nick 2026-09-30.** Wrizo's device storage (localStorage, ~5 MB) silently
> stops saving when full — `apps/desktop/src/store/persistence.ts:253` swallows the error, so
> offline edits are lost on reload and account-less writers have no other copy. Heavy ink can
> reach the limit on about one dense page; text at roughly 0.5–0.85M words. Please assign:
> move the device store to IndexedDB and surface storage-full honestly. Full context:
> `docs/publish/pub-committee-pass.md` §11. Nick's Library / Shelf rulings of the same day
> are in §11 verbatim for chat 1 to register.
>
> Also: Nick proposed that a full Journal retires to the Library. The Architects' design,
> "Journal volumes", is in §12, for whichever lane owns the Journal and the Library.

---

## §12 · THE JOURNAL FILLS — volumes (the Architects' suggestion to Nick's idea)

**Nick's proposal (2026-09-30, verbatim in §11 ruling 5):** "at some point, maybe the Journal
should get full, at which point it gets retired to the Library and listed in a pop-out menu
when the user hovers over the Journal icon? Open to suggestions from the Architects."

**STATUS: CANDIDATE.** This is the Architects' suggestion. Slate lines 13–15 carry the
choices. It is not a Publish ticket: it belongs to whichever lane owns the Journal and the
Library.

### What the design stands on (read from code and canon)

- **There is exactly one Journal board per account.** `getOrCreateSystemBoard('journal')` and
  `findSystemBoard` (`apps/desktop/src/store/persistence.ts`) exist to prevent duplicates.
- **Which pages are in the Journal is computed, not filed.** `inJournalView()` selects pages
  with origin `journal` and no binder. The order is by day written (`store/pageOrder.ts`;
  item 134: "a notebook's pages do not renumber themselves").
- **What the Journal should look like:**
  - Nick, 2026-09-11: it "should look sort of like a book that can be flipped through."
  - Item 172 made it a **Book**-style board. That type is designed but not built.
- **Nothing on volumes, page limits or a "full" journal exists yet.** J3's brief noted a
  horizon: "revisit if a notebook exceeds ~200 pages".
- **The rail today:**
  - On wide screens the Journal opens a click panel (`JournalPanel`,
    `components/CascadePanels.tsx`): Open the Journal · New page · Recent · All.
  - **There is no hover behaviour anywhere on the rail.**
  - On phones the rail becomes a bottom bar, with no room for a pop-out.
  - Nick's tablet (S25 + S-Pen) has no hover.
- **House rules in play:**
  - "Cascades drill in; they never stack" (b166).
  - "Nothing arrives unbidden" (FW6).
  - "No counts in chrome": a count is lawful only inside a destructive confirmation.
  - No completion states.
- **Weight.** Journal pages carry the most ink (about 56 bytes per ink point; item 203). That
  makes old volumes the biggest storage win once they rest in the Library.

### The suggestion

1. **A Journal is a notebook, and notebooks fill by pages.**
   - A **volume holds 200 pages** (a common notebook size, and J3's own horizon).
   - **No counter, meter or "nearly full" warning appears anywhere.** In the Book-style
     Journal the spine and page edge simply thicken, and an endpaper follows the last page.
   - Why pages rather than one volume per year (the alternative on slate 13): pages are what
     a real notebook runs out of.
2. **Retiring happens by itself, at an edge.**
   - Starting page 201 opens **Volume II**, and Volume I moves to the Library, named for its
     span, e.g. "Journal · Volume I · Mar 2026 – Jan 2027".
   - One quiet line appears at that page turn, never mid-keystroke: "Volume I is full. It's in
     your Library. This is Volume II."
   - The writer can also **start a new volume early** from the Journal panel, e.g. at a new
     year (slate 14).
3. **Old volumes stay whole and alive.**
   - A retired volume can still be flipped, searched, inked on and linked to. Pages keep
     their identity, so pins and links elsewhere keep working (Law 3). It just takes no new
     pages.
   - **Publish a volume:** the Journal reading copy or e-book edition (§2) turns a filled
     notebook into a finished book. That completion is a fact, not a judgment.
   - Its heavy ink downloads only when opened, via the Library's on-demand loading (§11 build
     notes 1–3).
4. **Finding past volumes: Nick's pop-out, fitted to every device.**
   - **Everywhere (tap or click):** the Journal's rail panel gains a **Volumes** group.
     "This volume (II)" comes first, then the past volumes, each opening from the Library.
     This is the one path that works on tablet, phone and desktop.
   - **Mouse devices:** a short hover (about half a second) on the Journal icon opens *that
     same panel* as a peek. It sits in the rail's panel track, so it never covers the page
     and never stacks a second column. Moving away closes it.
   - **Touch:** a long-press does the same.
   - The hover is a shortcut, never the only way. Because FW6 says nothing arrives unbidden,
     the hover-peek is Nick's call (slate 15).
   - Past volumes also appear in the Library under a **Journals** section.
5. **Data, for the builders** (the smallest honest shape):
   - The current Journal stays the **one** system board.
   - Volume boundaries live as a short list on its existing `board-meta` box, e.g.
     `volumes: [{ n: 1, closedAt }]`. That is a field inside the already-JSON `boxes` column,
     not a new table.
   - A past volume's pages are **computed** by date range (the arrangement law), so no page
     is ever re-filed. `inJournalView()` shows only pages after the last boundary.
   - This changes `persistence.ts` and the shape of `board-meta`, so it goes through the
     owning lane and a data-shape review via chat 1 / Fable.
   - **Sequencing:** after the storage fix (§11 note 1) and the Library container (§11
     note 3), ideally with the Book-style Journal (item 172).
6. **The Experts' short verdict.**
   - The Simulation gains its most physical truth: notebooks fill, and you start a new one.
   - A fresh volume is a clean start that loses nothing, which helps focus.
   - No number, badge or "nearly full" nag ever appears (Principle 5).

---

*Sources read for this pass:*
- `AGENTS.md`, `docs/PHILOSOPHY.md`, `docs/north-star.md`, `docs/page-primacy-canon.md`
- `docs/wrizo-alpha/`:
  - `e1-get-my-words-out-brief.md`, `batch-sitting-committee-pass.md`,
    `page-and-homes-canon.md`, `thread-arc-seed.md`, `app-bones-canon.md`,
    `hb1-threshold-brief.md`, `tu5-tutors-memory-brief.md`
- `docs/menus/`:
  - `item83-pass2-draft.md`, `b166-guideline-amendment.md`, `pw-addendum-three-space-canon.md`
  - `conservative-v2-design.md`, `item172-board-types-pass.md`
  - `item207-fonts-amendment-nicks-rulings.md`, `item108-tags-as-sorting-pass.md`
  - `item203-sync-body-limit-s0.md`, `b181-file-object-design-pass.md`,
    `architecture-double-pass.md`
- Other docs: `docs/flux-theme-canon.md`, `docs/s-arc-screenplay-plan.md`,
  `docs/writing-screen-redesign-brief.md`, `docs/f1-resume-repair-brief.md`
- The code named inline.
- `store/markRuns.ts` on `origin/item-writing-r3`.
- `wrizo-read/docs/foundations/foundations.md` and `wrizo-read/packages/contracts/src/bridge.ts`.
