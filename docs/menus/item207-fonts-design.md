# ITEM 207 — FONTS: A SMALL BASIC SET, WHERE THE WRITER CHOOSES IT, AND ADDING ONE'S OWN
### PLAN desk · 2026-09-24 · **design** · reconciles item 83's page setup, 112-C's Type section, and RV3 · registered by chat 1 (`e8b7101`)

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `e8b7101`. Line numbers are a courtesy.
> **⚠ THE PRIORITY:** *"The writing surface comes first"* (Fable's ruling of 2026-09-24) — **this is the writing
> surface's second half beside item 206's formatting audit.**
> **Nothing here is a build. No schema is written. No mockup** *(the pencil is down; two faces on one page is a
> picture a builder can render in an hour — Fable draws if he wants the roster seen first).*

> **⚠ AMENDED 2026-09-24 — `item207-fonts-amendment-nicks-rulings.md`** (Nick's Q1/Q2/Q3/Q5: Times New Roman and Arial; Free Write shows the picker and +/− but never the add door; per-card font options in the card's tool strip; size in points with a typeable number; and his law — every strip menu as minimal as possible). **Where §2, §3, §6, §8 or 207d disagree, that file governs (its §10 lists them). Kept as written below.**

---

## §0 · HIS WORDS, AND WHAT THEY DO TO THE RECORD

> *"While they're building, most of the text formatting options (B-I-U, bulleting, indenting, etc.) are not
> displaying correctly. **Users still do not have basic font options with the option to add fonts, too.** We
> really need to get the basic writing experience cleaned up before I will be able to do thorough testing of the
> app since every time I write in the app, I hit formatting issues."*

**Two asks:** **(1) basic font options; (2) the option to add fonts.** **RV3 — item 83's "sought door … renders no
row and is NEVER offered" — is RESOLVED BY THESE WORDS (chat 1, `e8b7101`): the custom-font door IS OFFERED.**
*Item 83's text and 112-C §6 are left as written and marked (§9).*

## §1 · WHAT EXISTS — measured, not assumed

- **There is NO typeface choice anywhere in the app today** *(no `face`/`typeface`/`fontFace` key in `apps/desktop/src`
  — searched). **112-C's Type section — face and size, page-level — was designed twice (item 83 pass 6; the 112-C
  brief) and never built.** *"Users STILL do not have basic font options" is exactly true.*
- **The prose face is a SWITCH, not a choice:** `themePrefs.voice: 'serif' | 'sans'` re-points `--font-prose` between
  **Crimson Pro** (serif, the default) and **Figtree** (sans; Chakra Petch under one theme) — **a per-device
  preference in `localStorage` (`wrizo-theme-prefs`), not synced.** **Screenplay is fixed to Courier Prime.**
- **Five families are bundled** (`@fontsource` in `package.json`): Crimson Pro, Figtree, Chakra Petch, Courier Prime,
  Rajdhani — **imported eagerly in `main.tsx`.**
- **Where a page's own look lives:** `entry.pageSettings` (jsonb — **an existing column, zero schema**) with **absent-
  never-null optional keys read through defaults** (item 114's `kind` / `styleGuide` are the precedent), and
  **`users.page_defaults` (jsonb, exists)** written **only** by the Page menu's explicit *"set as my defaults"* act
  (`setUserPageDefaults`, one caller, a button press — R6).
- **The standing walls this design lives inside:** **RV1** page-level · **RV2 — no span-level typography, an
  overrule is a schema-flagged reopening** · **RV4 — live on the paper, no Apply, no preview modal** · **R6 — the page's
  *voice* (face, size) vs the page's *sheet* (margins, spacing, numbers, headers)** · **the ANALOG LAW — *"a typewriter does
  not offer you a typeface"*: the font control lives in Draft and Revise, NOT Free Write** *(Nick, 2026-09-06)* ·
  **G3 — absent, not greyed** · **166's guideline for the drawer that holds it.**

## §2 · THE BASIC SET — proposed, and TUTOR's to review

*His instruction (item 165): "have the Experts review all content-related additions." **A typeface roster is
content.*** **Constraints, all standing:** *open licences only (OFL/Apache) — bundled, redistributable; a face must
read well at prose length, not just look distinctive; **the audience is ADHD and dyslexic writers** (the product's
own premise) — so legibility outranks taste.*

| role | proposed | why |
|---|---|---|
| **serif (the default)** | **Crimson Pro** *(already bundled and today's face)* | changes nothing for any existing page |
| serif | **Lora** · **EB Garamond** | a warmer book serif; a classical one |
| sans | **Figtree** *(bundled; today's sans voice)* | changes nothing |
| sans, **legibility** | **Atkinson Hyperlegible** | designed for low-vision legibility — a principled answer to "a face that doesn't fight you" |
| typewriter | **Courier Prime** *(bundled)* | the screenplay face, offered on prose pages too for writers who want the feel |
| *(optional)* | **Source Serif 4** | a workhorse if TUTOR wants a third serif |
**Seven at most, five to start.** **"System default" is NOT a row** *(it is a moving target that renders differently
per device and defeats "the page reads the same everywhere" — it belongs to the adder, §5).* **A dyslexia-specific
face (OpenDyslexic) is deliberately NOT proposed:** *its evidence is contested, and TUTOR should say so or overrule
this desk.* **The roster is a lexicon list (one term per face) and a data table — adding a face later is one entry.**
**Cost, honestly:** *each family is ~100–300 KB per style; the eager imports in `main.tsx` do not scale to seven.*
**Loading strategy — the S0 measurement 112-C §5 said to stop and surface, surfaced here:** **load a face when it is
CHOSEN or when a page that uses it OPENS** *(a dynamic import of its CSS), never all at startup* — *and the default
(Crimson Pro) stays eager so a first-time writer never waits.* **This is the one place the app's font loading
changes, it is a build detail behind an unchanged CSS token, and S0 measures the startup delta before and after.**
**Dependencies:** *each new family is a new `@fontsource` package — `AGENTS.md` says no new deps unless the ticket
needs them; **this ticket needs them**, and each is OFL — recorded so a reviewer sees the dependency list is the
roster.*

## §3 · WHERE THE WRITER CHOOSES — one control, the placement already ruled

**THE TYPE SECTION (112-C, amended by the analog law): face and size, in the Desk drawer of Draft AND Revise — ONE
component, TWO mountings, one stored value on one store path** *(a font chosen in Draft IS the page's font in
Revise)*. **Free Write mounts nothing.** **Screenplay pages mount nothing — their face is the format's** (Courier,
fixed; **absent, not greyed**).
- **FACE:** the roster (§2) as a list *each row set in its own face*, the current one marked **olive** (where you
  are), **live on the paper (RV4)** — pointer hover previews **nothing**; *choosing is the preview, and reverting is
  choosing the previous one.* **The last row is the door: "Add a font…" (§5).** *(RV3, resolved.)*
- **SIZE:** **four steps — Small · Regular · Large · Larger** *(multipliers on the existing `--paper-scale`, e.g.
  0.92 / 1 / 1.12 / 1.28; **the numbers are UNMEASURED and S0 sets them**)* — **not a free number:** *a writer picking
  "16.5" is doing typography, and a step is a choice.*
- **⚠ THE MEASURE LAW (FX3 Law 1: "the measure, not the pixel width, is the constant").** *A wider face holds fewer
  characters per line in the same paper width.* **Two ways to keep the law; this desk leans to the first:**
  **(1) the paper's RECT is invariant (page-primacy: choosing a font never changes the page's bounding rect) and
  each face carries a normalising `size-adjust` in its `@font-face` so "Regular" looks the same size across
  faces** — *characters-per-line then varies a little by face, which is what a real book does;* **(2) the paper
  width follows the face (`ch` units) so characters-per-line is constant** — *it honours the measure literally and
  breaks the rect invariant, and it moves the page under the writer when they change face.* **The unmeasured risk sits
  on (1):** *nobody has measured how far chars-per-line drifts across the roster at 1100 / 1280 / 1920 — S0 does.*
- **A page's face shows in EVERY mode's rendering** *(the paper is the paper)* **but is editable only in Draft and
  Revise** — **a READING, handed up:** *the analog law keeps the CONTROL out of Free Write; it does not say the
  typewriter repaints a page dressed in Lora.* **The rival:** *Free Write always renders the machine's own face* —
  it honours "a typewriter has one typeface" and makes the same page look different in two modes. **Lean: the page's
  face everywhere.**
- **Typewriter on (Draft):** *"typeface hidden with Typewriter ON"* (177-Q3's standing default) — **the control is
  absent while the typewriter is on.**
- **THE PAGE MENU'S SHEET STAYS THE SHEET (R6):** *no face/size control moves there; the Type section is the page's
  VOICE.* **Item 205 (forward lock and the goal behind ONE Page settings row) is untouched.**

## §4 · PER PAGE, OR EVERYWHERE

- **Per page (the default act):** *choosing writes `pageSettings.face` / `pageSettings.size` for THIS page only* —
  **absent-never-null, read through the defaults, byte-identical on any page that never chose** *(the `kind`
  precedent; **NOT added to `PAGE_SETTINGS_FALLBACK`** — the fallback is the app's dress floor).*
- **Everywhere:** *the existing R6 act — "set as my defaults" at the foot of the Page menu — now carries face and
  size* (`dressOnly()` admits the two keys; **it remains the ONLY writer of `page_defaults`, never by
  propagation** — R6's own boundary, which `112-C §4` verified on disk).
- **The PRECEDENCE, stated once so nobody re-derives it:** ***page's own face → the user's default face
  (`page_defaults`) → the `voice` preference (serif/sans) → the theme's face.*** **`voice` stays exactly as built — a
  per-device dial that decides the face when nothing else has;** **a synced default face wins over it, so a writer who
  sets "everywhere" sees the same face on every device, and one who never does is unchanged.**
  **The unmeasured risk:** *two controls now decide the default face (Settings' voice and the Type section's
  "set as my default").* **Lean: keep both, and the voice dial's label says it is the fallback** *(one edit to its
  lexicon term).* **The rival — retire the voice dial into the roster: it removes the duplicate and a shipped
  setting, and it is a migration this item should not carry.**

## §5 · ADDING A FONT — the two routes, laid out (RV3 resolved: the door is offered)

**The door: "Add a font…" — the roster's last row.** **It drills in (166's R2; never a second panel) to the routes
below.** *No hint on any other surface; a writer looking for it finds it where they choose a face.*

| | **ROUTE A — a font already on this device** | **ROUTE B — upload a font file** |
|---|---|---|
| **how** | the browser's **Local Font Access** (`queryLocalFonts()`): the writer picks from the device's installed families | the writer chooses a `.ttf` / `.otf` / `.woff2`; it is registered with the `FontFace` API and cached on the device |
| **syncs?** | **the NAME syncs; the FONT does not** — on a device without it the page falls back | **the file syncs — it follows the account to every device** |
| **new storage** | **none** | **rides item 181's `user_files` (server storage — approved for PHOTOS, Nick "181: Yes").** ***It would be a new class of stored file. THAT IS A QUESTION FOR NICK (Q4), NOT AN ASSUMPTION.*** |
| **support** | **Chromium only** (Edge, Chrome, Electron 31) — *no Safari, no Firefox; **Electron's permission handling for the API is UNMEASURED (no handler exists in the app today)** and the browser shows a permission prompt* | every browser |
| **licensing** | the writer's own installed font — **no redistribution by Wrizo** | **the writer's file, on Wrizo's server** — *many desktop licences forbid embedding or serving; it goes only to the SAME writer's devices, and the door's words say the writer is responsible for the right to use it* |
| **privacy** | *enumerating installed fonts is a fingerprinting surface — it runs on the writer's explicit pick and reads nothing else* | the file is the writer's private storage, scoped per user like every row |
| **cost / risk** | **the page shows differently on another device — silently** *(the honest cost of not moving bytes)* | **storage cost; font-parsing attack surface (the browser's sanitiser, plus type/size limits — AEGIS's lane); a size cap (proposed 5 MB per file — UNMEASURED) and a count cap** |
**What both routes store on the page:** ***`face = { name, generic: 'serif' | 'sans-serif' | 'monospace', source: 'bundled' | 'device' | 'file', fileId? }`*** —
**the `generic` class makes the FALLBACK faithful in kind** *(a missing serif falls back to a serif, not a sans)*, and
`source` tells the reader how to resolve it. **An unavailable face renders in its fallback and the Type control marks
it *"Substituted on this device"* — a quiet mark inside the control, never a toast** *(the no-nagging law).*
**Export:** *bundled (OFL) faces can be named and, if the exporter embeds, embedded; a device or uploaded face is NOT
embedded (licence) and the export says so, as it already names ink and links it leaves out.*
**LEAN (a sequence, not a choice between them):** **(207a) the basic set + size ships FIRST — it needs no storage, no
permission and no new class of file, and it is what he called missing. (207b) Route A next — small, no storage.
(207c) Route B only after Nick's Q4 and after 181's storage exists** *(the ledger's box order puts the writing
surface first; Route B is the only piece that waits on someone else's build).*
**The rival, in its strongest form — Route B ONLY:** *one mechanism, the same on every device, no "shows differently
elsewhere" — the writer's page is the page everywhere, which is this product's whole premise for a writer on two
devices.* **Its cost is licensing exposure and a server file class, and it waits on 181.** **The unmeasured risk sits on
the lean:** *Route A alone ships a door that can quietly produce a page that looks wrong on the writer's phone.*

## §6 · BOARD CARDS — the one place his framing goes past RV2

**Fable's brief says "page, board card, per page or everywhere." His WORDS name none of the surfaces.** **A board card
is a whole small surface, not a span — RV2's wall (no span-level typography) is not crossed — but 112-C §1 excluded the
Board and no ruling has admitted it.** **This desk's lean: V1 GIVES CARDS NO FONT CHOICE OF THEIR OWN.** *Cards render in
the writer's default face (§4's precedence: the user's default → the voice dial → the theme) so a board is one
typographic voice; a board of ten card faces is noise, and every reader of `boxes` would gain a field.* **The rival, in
its strongest form — a per-board "card face" (one additive key in the board's `board-meta` box, no column):**
*a Worldbuilding board in a legible sans beside prose pages in a serif is a real want.* **Its cost is small and additive;
it is offered as 207d, not v1, and it is Q3 for Nick.** **Per-CARD faces are not proposed** *(the wall's spirit).*

## §7 · WHAT IS STORED, AND THE CENSUS THAT MUST RIDE WITH IT
- **`PageSettings.face?` and `.size?`** *(optional, absent-never-null; `dressOnly()` admits them; **the five-edit-site
  census does NOT apply — `page_settings` is already mapped whole**)* **but the CLIENT census does: every site that
  copies, rebuilds or defaults a `PageSettings` must carry the two keys** *(the `page_links` / `eraserWidth` lesson,
  applied a fourth time — S0 lists them).*
- **Uploaded fonts (207c):** *a `user_files` row (`mime` `font/*`) — 181's table, no new one* — **and 181's mark-and-sweep
  must count a font's `fileId` in `pageSettings`/`page_defaults` as a reference** *(else a page's font is swept as
  orphaned).* **A schema/server change in the 181 sense — Nick's word first (Q4).**
- **No new column for 207a/207b/207d.**

## §8 · THE QUESTIONS FOR NICK — plain English, a default each (Fable checks them against his words)
- **Q1 — which typefaces?** *Wrizo would offer about five to start: Crimson Pro (what you have now), Lora, EB
  Garamond, Figtree, Atkinson Hyperlegible (a very readable one), and Courier Prime (the typewriter look). Any you'd
  add or drop?* **Default: that list, reviewed by the Experts.**
- **Q2 — Free Write.** *Your rule is that Free Write is a typewriter, so it doesn't offer a font choice; Draft and Revise
  do. Still right — or should Free Write get one too?* **Default: still right (your own analog rule).** *(A page you
  dressed in Draft keeps that look when you open it in Free Write.)*
- **Q3 — board cards.** *Should cards on a board just use your everyday font (default), or should each board be able to
  have its own card font?* **Default: your everyday font; per-board later if you want it.**
- **Q4 — adding fonts (NO DEFAULT for the second half; it uses the photo storage you approved).** *Two ways: pick a
  font already installed on this computer (quick, but another device without it shows a stand-in), or upload a font
  file that follows you to every device (stored on Wrizo's server like your photos, and you'd be responsible for having
  the right to use the font). Which do you want?* **Default: installed fonts first; uploads only after you say yes to
  storing font files.**
- **Q5 — sizes.** *Four steps — Small, Regular, Large, Larger — instead of a number. OK?* **Default: yes.**

## §9 · WHAT THIS RECONCILES AND SUPERSEDES — marked, never erased
- **Item 83 pass 6 — "The sought door renders no row … is never offered" and RV3** → **SUPERSEDED: the door is offered
  (his words, `e8b7101`); its two "lawful seeking shapes" (the typed-name seek; the asked-and-answered path) are
  moot.** **112-C §6 — "RV3's SOUGHT DOOR — DESIGNED, NOT BUILT … renders no row"** → **superseded the same way.**
  **Both carry a pointer line to this file; nothing else in them changes.** **RV1, RV2, RV4, R6 and the analog law STAND.**
- **112-C's §5 S0 "face roster" stop-and-surface** → **answered here (§2).** **112-C §11 (two mountings; page-level; one
  store path)** → **adopted whole (§3).** **Item 83's "the page's typeface drawn from the theme's lawful faces under the
  cross-theme prose-pair seam"** → **the roster's serif/sans halves ARE that pair; the theme still supplies the CHROME
  faces (Rajdhani, Figtree) and no page choice reaches them.**
- **Item 205's Page settings row and 206's formatting audit** → **untouched; 207 is the voice, they are the sheet and the
  marks.**

## §10 · THE CHECKS OWED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **park, never edit; audit the park COUNT**)
1. **Choose a face in Draft:** the paper re-renders live, **`pageSettings.face` is written, no other key is; a page that
   never chose is byte-identical on disk.** **Revise shows the same value (one store path).** **Free Write shows the
   page's face and offers no control.** **A screenplay page offers no control and stays Courier.**
2. **Precedence, asserted rung by rung:** page face → user default → voice → theme, *each with the others absent.*
3. **"Set as my default" is the only writer of `page_defaults`** *(a spy on the seam: choosing a face on a page writes
   nothing there)*; **a NEW page is born with the default face; an existing page is not repainted.**
4. **The measure:** *at 1100 / 1280 / 1920, the paper's rect is byte-identical before and after choosing each face*
   (page-primacy) **and the chars-per-line spread across the roster is REPORTED, with the bound S0 sets.**
5. **Loading:** *the default face is present at first paint; another face is fetched only when chosen or when a page that
   uses it opens; startup bytes are compared before/after* — **a check that the eager list did not grow.**
6. **Fallback:** *a `face` whose source is absent renders in its `generic` class, and the control says "Substituted on
   this device" — no toast.*
7. **The door is offered:** *"Add a font…" is the roster's last row on a prose page in Draft and Revise; absent in Free
   Write and on a screenplay.* **RV3's old check (the door is never offered) is a PARK: SUPERSEDED with a pointer here,
   kept verbatim — never edited.**
8. **Route A (207b):** *the permission is asked on the pick, never on load; a refusal leaves the roster untouched with a
   plain sentence.* **(Edge and Electron 31 both — S0 probes Electron's handling first.)**
9. **Route B (207c, after Q4 and 181):** *type/size refusals with sentences; the file syncs to a second device and the
   page renders in it; 181's sweep does not collect a font a page references.*
10. **No new column, table or `sync.ts` mapper for 207a/b/d.**
11. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

**§11 · What this desk does NOT do.** No mockup, no build, no schema. **It does not choose the roster alone (TUTOR
reviews), does not answer Q1–Q5, and does not assume Route B's storage** *(that is Q4, Nick's)*.
