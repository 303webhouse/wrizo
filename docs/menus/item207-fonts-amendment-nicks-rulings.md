# ITEM 207 — FONTS, AMENDED TO NICK'S RULINGS (Q1, Q2, Q3, Q5) AND HIS MINIMAL-INTERFACE LAW
### PLAN desk · 2026-09-24 · **amendment to `item207-fonts-design.md`** (merged `3bfb70a`) · chat 1's record at `4a4e463`

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4a4e463`. Line numbers are a courtesy.
> **Nothing in the merged design is rewritten in place** — §10 names what is superseded, kept as written.
> **Where this file says "ruled" it means his words as relayed and recorded by chat 1; the ledger governs if the two differ.**

---

## §0 · HIS WORDS, VERBATIM — and what they do to this desk's defaults

> *"Q1: We also need Times New Roman, add to Atkinson Hyperlegible a more standard sans serif like Arial. Q2: Have
> Free Write show all fonts that have been added previously, too, but do not include an option in Free Write to add
> new fonts. That feature should only be available in Draft and Revise mode. Q3: Cards should default to the
> everyday font, but the font options should be available in the Card's tool strip menu, but the interface should
> be as minimal as possible (same goes for all strip menus). Q5. Let's make font size adjustable with a "+" and "-"
> symbol that also moves the font size number. The number should be able to be manually adjusted, too, though,
> because sometimes writers are following style guides with precise font styles/sizes. Leave the manual number
> selector off of the Free Write options, though. Keep that just a plus/minus with no number displayed. The steps on
> the +/- should start at 11 and go up and down in one point increments with limits: lower limit should be 6pt, and
> the upper limit should be 18 at which point fonts should get larger in 2pt increments up to 30, and then 4pt
> increments up to some reasonable limit (120pt, maybe?)"*

**HIS Q2 AND Q3 SUPERSEDE THIS DESK'S DEFAULTS** (*"still right — no font choice in Free Write"*; *"cards use the everyday
font, no per-card choice"*). **Two of this desk's readings fall with them, recorded as such:** *the analog law's
"a typewriter does not offer you a typeface" no longer bars the picker from Free Write* **(his own 2026-09-06 law,
narrowed by his own 2026-09-24 words — the ADD door alone stays in Draft and Revise)**; **and "card-level fonts: none in
v1" was Fable's framing, not his** — **his Q3 puts font options in the card's tool strip.**
**A STANDING LAW, HIS: *"the interface should be as minimal as possible (same goes for all strip menus)."*** (§3.)
**Chat 1 records a ruling (Fable, 206): *styled text RENDERS in every mode; only the styling TOOLS stay where they were
ruled — "rendering is not styling."*** *This amendment's face and size follow it.*

## §1 · WHAT CHANGES — old → new

| | the merged design said | NOW |
|---|---|---|
| **roster** | Crimson Pro · Lora · EB Garamond · Figtree · Atkinson Hyperlegible · Courier Prime | **the same, plus Times New Roman and Arial** (§2) |
| **Free Write** | nothing mounted | **the face picker (bundled + every font added before) and size +/− with NO number; NO "Add a font…"** |
| **Draft / Revise** | the Type section: face, four size steps, "Add a font…" | **face, +/− WITH a typeable number, "Add a font…" (the row arrives with Route A, 207b)** |
| **cards** | no font choice; a per-board card face as a later maybe (207d) | **face and size in the card's tool-strip menu; default = the everyday font; 207d (per-board) is WITHDRAWN** |
| **size** | four steps (Small · Regular · Large · Larger) | **points: 11 default; the lattice of §4** |
| **typewriter on (Draft)** | the control hidden (177-Q3's default) | **present — the typewriter's tool menu is Free Write's options, which now include the picker and +/−** |

## §2 · THE ROSTER — Times New Roman and Arial, licensed, so NAMED and never shipped

**Both are proprietary (Monotype/Microsoft): neither ships inside the app.** **Fable's rule, adopted: name the
installed font first; bundle a METRIC-COMPATIBLE open face as the fallback — Tinos for Times New Roman, Arimo for
Arial** *(the Croscore faces, designed to match those metrics glyph-for-glyph in advance width; Apache-2.0 — S0
confirms the package licence).*
- **Mechanism, one line each:** *a single `@font-face` per roster face whose `src` is `local('Times New Roman'),
  local('TimesNewRomanPSMT'), url(<bundled Tinos>)` (and Arial → Arimo) — so the machine's own font wins when it has
  it, Tinos loads only when it does not.* **The roster names the face "Times New Roman" / "Arial"** *(what he asked
  for, and what a style guide says)*; **the stored `face` is `{ name: 'Times New Roman', generic: 'serif', source:
  'named', fallback: 'Tinos' }`.** **New `source` value: `'named'`** *(an installed-first face with a bundled
  fallback — distinct from `'device'`, which is a font the writer ADDED).*
- **Where they sit in the roster:** **Arial beside Atkinson Hyperlegible in the sans group; Times New Roman with the
  serifs** *(his sentence: "add to Atkinson Hyperlegible a more standard sans serif")* — **eight faces now, not seven;
  it stays a lexicon list and a data table, one entry each.**
- **Dependencies:** `@fontsource/tinos` and `@fontsource/arimo` *(each a new package — `AGENTS.md`'s "no new deps unless the
  ticket needs them": this ticket does, and the roster is the dependency list)*; **loaded on choose or on a page's
  opening, as the merged design's strategy has it.**
- **No "Substituted on this device" mark for these two** *(the fallback is metric-compatible by design — a mark
  would nag about a difference the writer cannot see);* **the mark stays for `'device'` and `'file'` faces.**
- **Export:** **DOCX names "Times New Roman"/"Arial" — correct on any machine that has them; a PDF the app renders
  itself uses the installed face or Tinos/Arimo (embedded, open licence).** *(S0 reads what the exporter does today.)*

### ⚠ A CLAIM CORRECTED — what the metric-compatible fallback does and does not buy
*The brief says it lets "a style guide's line lengths hold on a machine without" the font.* **It does one thing:**
**identical advance widths, so the same text breaks at the same places on a machine WITH the font and one WITHOUT it.**
**It does NOT make the on-screen page match the style guide's line length — that is a property of the SHEET, not the
font** *(a guide's 65-character line assumes a Letter page with one-inch margins; the prose paper is not that sheet —
`index.css` says so in terms: "prose has no true size", against the screenplay sheet, which IS Letter at a true 12pt).*
**§4 states the consequence and hands up the fork.**

## §3 · WHERE THE WRITER CHOOSES — and the law that governs how it looks

**HIS LAW: "as minimal as possible (same goes for all strip menus)."** **Read as a design law, and stated for every
strip menu, not only this one:** *a strip menu carries the fewest controls that do the act, each with the fewest
marks; a control that a mode does not need is ABSENT, not greyed (G3); no captions, no helper text, no second row
of options — the accessible name carries what a caption would.* **For chat 1 to record in the laws band; this design is
its first application.**

| surface | what the Type control is | its whole content |
|---|---|---|
| **Free Write** (the tool strip) | **the smallest form** | **ONE face button** *(shows the current face's name in its own face; opens the roster, each row in its own face, the current one marked olive)* **and a `−` `+` pair. NO number. NO "Add a font…".** |
| **Draft and Revise** (the Desk drawer's Type section, 112-C's mount) | **the full form** | **the face button (same roster) with "Add a font…" as its last row; `−` [ number ] `+`, the number typeable.** |
| **A board's text card** (the card's tool strip menu — *this desk reads it as the card's Styling dock (item 159); S0 confirms which surface he means*) | **the smallest form, per card** | **the face button and `−` `+`, no number** *(a call, not his word: "minimal" and "the manual number is off the Free Write options" point the same way; **Nick can ask for the number on cards**)* |
| **Screenplay** | **nothing** | its face is the format's (Courier, fixed) — **absent, not greyed** |
| **Ink, page-pin, file cards** | **nothing** | not text surfaces |

- **Free Write's roster is the FULL roster: the bundled eight plus every font ever added** *(§6)*, **and it has no add
  door — the only difference from Draft/Revise's list is that last row.**
- **Rendering is not styling (206): a page's or card's face and size RENDER in every mode.** *A page dressed in Lora
  in Draft shows in Lora in Free Write and Revise; the picker in Free Write lets the writer change it — the writer's
  own act.*
- **The strip law — "every clickable tool in the left strip (other than INK or settings) is something that happens to
  a portion of the page that is selected or where the cursor is" — is honoured, and named:** **on a PAGE the face and
  size are a SETTING of the page (PW's strip audit already excepts "page-setup chips … settings"), not a selection
  act; on a CARD they act on the card, the selected object, which the law lawfully allows.** **RV2's wall stands: neither
  control ever reaches a selection or a span** *(emphasis stays the markdown set).*
- **What this supersedes of the analog law:** *"the FONT control lives in Draft and Revise, NOT Free Write"* (112-C §11,
  Amendment 1's exclusion) **is narrowed by his own words: the PICKER and +/− are in Free Write; the ADD door and the
  typed number are not.** **RV1's page-level scope, RV4's live-on-paper, and R6's voice/sheet split are untouched.**
  **177-Q3 ("Typewriter ON: typeface hidden?") is STRUCK — his words answer it: typeface is shown** *(its
  size-and-spacing half: size is shown; spacing was never in his sentence — left as built).*

## §4 · SIZE — points, the lattice, and what "11" MEANS

**The lattice — 41 stops, computed:** **6, 7, 8 … 18** *(1 pt; 13 stops)* · **20, 22, 24, 26, 28, 30** *(2 pt; 6)* ·
**34, 38, 42 … 118** *(4 pt; 22).* **Default: 11.** **`+` moves to the smallest stop above the current value, `−` to the
largest below it** *(so it works from any value the writer typed: at 25, `+` → 26 and `−` → 24; at 32, `+` → 34 and `−` → 30).*
**At an end of the lattice the button is INERT and says so to a screen reader** *(a stepper at its limit is a limit, not an
unbuilt capability — G3's "absent" does not apply).*
- **THE 118 / 120 WRINKLE — with him, default (vetoable, not his text): `+` tops out at 118; a TYPED size may be 120.**
  **`−` from 120 or from 119 → 118.** *(Four-point steps from 30 land on 118, never 120.)*
- **THE TYPED NUMBER (Draft and Revise): range 6–120; HALF-POINTS ARE ALLOWED — this desk's call**, *because style
  guides do use 10.5 and 11.5;* **the field rounds a typed value to the nearest 0.5 and clamps to 6–120; it displays
  "10.5", never "10.50"; anything not a number is refused with the previous value kept.** **From a half-point value,
  `+` and `−` go to the neighbouring lattice stops** *(10.5 → 11 / 10).*
- **Stored as the NUMBER OF POINTS** *(`pageSettings.size?`, absent-never-null, read through the default 11; a card's
  `fontSize?`)* — **never a step index**, so the lattice can be changed later without touching a page.

### ⚠ WHAT "11" MEANS — a fork this desk cannot close, and a change it will not make quietly
**Measured (`index.css`, `PageEditor.tsx`):** **prose text is `17px × --paper-scale` today (12.75 pt at scale 1, up to
15.3 pt at 1.2)**; **the screenplay sheet is Letter at a true 12 pt (816 px, deliberately NOT scaled).** **His default is
11.** **If "11 pt" is a TRUE point size (1 pt = ⁴⁄₃ px), every existing prose page would shrink by ~14% the moment this
ships — a visible change to every page in the app, from a fonts ticket.**
- **(R) — LEAN: the number is the DOCUMENT's point size (what exports and prints), and the screen is a uniform zoom of
  the page. "11" IS today's rendering, exactly** *(`px = 17 × (n ⁄ 11) × --paper-scale`)* — **no existing page moves a
  pixel; 12 looks 9% larger than 11 on screen, as it should; export/print use the number as literal points.**
  *It matches the code's own statement that prose has no true screen size, and the merged design's rule that the
  paper's RECT never changes.* **Its cost: the on-screen line breaks are NOT the style guide's** *(the sheet is not a
  Letter page — §2's correction)* — **a writer checking a guide's line length against the screen will be misled.**
- **(T) THE RIVAL, IN ITS STRONGEST FORM: the prose page becomes a TRUE Letter sheet, like the screenplay** *(pt = ⁴⁄₃ px
  at 100%; the whole sheet scales as one object below its natural width; margins are the guide's one inch)* **— then
  "12 pt Times New Roman, double-spaced" on screen IS the guide, and the metric-compatible fallback makes it true on
  every machine.** **That is what "writers following style guides with precise font styles/sizes" ultimately asks for.**
  **Its cost is large and is not a fonts change: it re-sets the prose page's measure, changes the look of every
  existing page (or grandfathers them), and touches page setup and the measure law (FX3 Law 1).** **The unmeasured
  risk sits on the lean:** *nobody has measured how many writers check guide line lengths against the screen.*
- **Handed up to Fable, with the plain-English line for Nick if Fable wants it asked:** *"Should the page on screen
  become a true Letter-sized sheet (so 12-point on screen matches 12-point on paper, like the screenplay page), or
  keep today's flexible page where the number is the size it prints at?"* **Default: keep today's page (R).**
  **A pure S0 measurement is owed either way: the prose column's px width at scale 1 against a Letter measure.**

## §5 · CARDS — font options, per card

- **`Box.fontFace?` and `Box.fontSize?`** — *additive, in `boxes` (jsonb), zero schema, absent on every existing card* — **on
  TEXT cards only.** **Default = the everyday font** *(precedence: the card's own → the user's default face → the
  `voice` dial → the theme — the page precedence of the merged §4, minus the page rung).* **The opened card (its
  pop-up) shows the same values, edited from the same control.**
- **Copy, Duplicate and every site that rebuilds a `Box` must carry the two keys** *(the census the `eraserWidth` and
  `page_links` lessons demand — a fifth time)*; **the Trash and Restore leave them untouched.**
- **RV2's wall is not crossed** *(a card is a whole surface; a span is not — and neither control reaches a selection).*
- **The merged design's 207d — a per-board "card face" — is WITHDRAWN:** *his Q3 gives per-card options, and a board-level
  default would be a third place to decide the same thing.*
- **The unmeasured risk, named:** *a board of ten cards in ten faces is noise, and "minimal" argues for a quiet
  control — not for a hidden one; **nobody has measured whether writers will style cards at all.*** *(Cheap to
  build, additive to remove.)*

## §6 · THE LIBRARY — "every font that has been added previously"
**Where the added fonts live (so Free Write can list them without an add door):**
- **Route A (device fonts):** *a per-device list of `{ name, generic }` in `localStorage`* (the `wrizo-theme-prefs`
  precedent) — **device fonts are device-local by nature; the list follows the device.**
- **Route B (uploaded files, when Q4 lands):** *the account's `user_files` rows of kind font* — **the server IS the
  library; nothing else is stored.**
- **Free Write lists the union.** **A page that references a face absent from this device's library still RENDERS**
  *(the stored `generic` class makes the fallback faithful — merged §5)* **and marks it *"Substituted on this
  device"* inside the control only.**
- **Q4 (uploads) still WAITS** *(Fable: until uploads are next)* **— but the design above needs no change when it lands.**

## §7 · THE SEQUENCE, UPDATED
**207a — NOW: the eight-face roster (Times New Roman/Arial named-first with Tinos/Arimo), the Type control in Free
Write (picker + ±), in Draft/Revise (picker + ± + number), and in the card's strip (picker + ±); size in points.** **207b: Route A AND the "Add a font…" row together** *(an offered door with nothing behind it is a mute grey — **207a
ships without the row; 207b adds the row and the route at once**; RV3's door is offered the day it opens).* **207c: uploads (Q4, after 181).** **207d: withdrawn.**

## §8 · WHAT NICK IS ASKED, AND WHAT IS ALREADY WITH HIM
- **WITH HIM (chat 1): the 118/120 wrinkle** — *default: `+` stops at 118, typing allows 120.*
- **This desk's calls, recorded (not his words; vetoable): half-points allowed (0.5, range 6–120); no number on the card's
  strip; the lattice's inert ends.**
- **For Fable to decide whether to ask (§4): the "true Letter sheet" fork — default: keep today's page.**

## §9 · THE CHECKS, AMENDED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **park, never edit; audit the park COUNT**)
1. **Free Write:** *a face button and `−` `+` exist; NO number field; NO "Add a font…"; the roster lists the bundled eight
   plus a font added earlier (seeded through the seam).* **Draft and Revise:** *the number field exists; "Add a font…"
   exists (207b).* **Screenplay: nothing.** **Ink / page-pin / file cards: nothing.**
2. **The lattice, asserted as a sequence:** *from 11, `+` ×N visits …18, 20, 22 … 30, 34 … 118 and then is inert; `−`
   walks it back to 6 and is inert; from 25, `+` → 26 and `−` → 24; from a typed 10.5, `+` → 11, `−` → 10; typing 119 and
   120 is accepted and `−` → 118; typing 5 or 121 clamps.* **The stops are asserted by value, never by count** *(41 is the
   check's own arithmetic, not a fixture)*.
3. **"11 = today":** *a page that never chose renders byte-identically to the prior build at 11 (computed style
   equal); 12 renders `17 × 12⁄11` px × the paper scale.* **(Only under the lean (R); if Nick chooses (T) this check
   is a park.)**
4. **Times New Roman / Arial:** *the stored `face.source` is `'named'`; on a machine (or a forced font-blocking
   context) lacking the font the computed layout equals the Tinos/Arimo layout, and with the font present it is used;
   **neither font file is in the build output**.* **(A build-output scan for any Times/Arial font file — the licence
   guard.)**
5. **Cards:** *the face and size write to that Box only; a Duplicate carries them; the rest of the board is unchanged;
   a card that never chose is byte-identical.*
6. **Rendering in every mode (206):** *a page dressed in Draft renders identically in Free Write and Revise.*
7. **Minimal:** *the Free Write and card controls contain exactly the elements in §3's table — a count of interactive
   controls asserted per surface, so an added button fails the check* **(his law, made assertable).**
8. **The merged design's checks 1, 7 and the "no control in Free Write" clauses are PARKS: SUPERSEDED with a pointer
   here, kept verbatim — never edited; audit the park COUNT.**
9. **No new column, table or `sync.ts` mapper** *(`page_settings`, `page_defaults` and `boxes` are existing jsonb).*

## §10 · WHAT THIS SUPERSEDES — marked, never erased
- **Merged §2** *(roster of seven at most)* → **eight, §2 above.** **Merged §3's "Free Write mounts nothing"** and **"Typewriter
  on: the control is absent"** → **§1/§3.** **Merged §3's "four steps — Small · Regular · Large · Larger"** → **§4.**
  **Merged §6 "Board cards — v1 gives cards no font choice … 207d"** → **§5 (his Q3).** **Merged §8 Q2, Q3, Q5** →
  **ANSWERED (his words); Q1 answered; Q4 unchanged (waits).** **Merged §5's route table** → *unchanged, plus `'named'` (§2).*
- **112-C §11 Amendment 1's Free Write exclusion** → **narrowed by his words (§3).** **177-Q3** → **struck.**
- **Unchanged:** RV1, RV2, RV4, R6, the page-primacy rect invariance, precedence (page → user default → voice → theme),
  the load-on-choose strategy, Route A/B's shape, the `generic` fallback class, item 205/206's territory.

---

## §11 · THIRD NOTE, 2026-09-24 late — Source Serif 4 joins; TUTOR's review folded in; size ruled

**Nick, verbatim (Fable's relay): *"3. Add Source Serif confirmed."*** **Fable's rulings: Source Serif 4 joins the roster;
EB Garamond STAYS** *(he approved the list — a demotion is not on offer);* **size is RULED: 11 means today's rendering, the
number is the printed size, the screen is a zoom — lean (R) of §4 adopted, and the "true Letter sheet" question is NOT
asked of Nick.** **TUTOR's craft review (`tutor/item207-fonts-tutor-craft-review.md`) is folded in below.**

- **THE ROSTER IS NINE:** **Crimson Pro** *(default)* · **Lora** · **EB Garamond** · **Source Serif 4** · **Times New Roman**
  *(named-first, Tinos fallback)* · **Figtree** · **Atkinson Hyperlegible** · **Arial** *(named-first, Arimo fallback)* ·
  **Courier Prime.** **There is no "core" and "optional" tier** *(TUTOR's request to move EB Garamond out of a core slot
  is moot — he approved the list; the constraint it argued from, "legibility outranks taste", stands for any FUTURE
  addition).* **Merged §2's "seven at most, five to start" is WITHDRAWN.**
- **⚠ A NUMBER THIS DESK GOT WRONG, CORRECTED (TUTOR, measured from the packages):** *merged §2 said each family is
  "~100–300 KB per style".* **Measured: ONE style is ~20.7 KB; a family's whole prose set (regular, bold, italic, bold
  italic) is 45–99 KB; all seven families × four styles is 534 KB.** **The figure was off by roughly five to fifteen times,
  and the byte-fear it fed was the reason for the cap. The cap is withdrawn. Load-on-choose with the default eager STAYS —
  on its own merits, not on a mis-stated cost.** *(The two Croscore fallbacks and Source Serif 4 add to that;
  the S0 total is a measurement, not a claim.)*
- **THE LOADER IS MIXED-MODE (TUTOR §1.1) — one line for the brief so a builder does not discover it at the import.**
  *Today two of the five bundled families are `@fontsource-variable/` (Figtree, Crimson Pro) and three are static
  `@fontsource/` (Courier Prime, Rajdhani, Chakra Petch).* **Variable packages EXIST for Lora, EB Garamond and Source Serif
  4; they do NOT exist for Atkinson Hyperlegible or Courier Prime (both 404).** **So the roster is necessarily
  variable-and-static, the two forms are different `@font-face` blocks and cost models, and §3's per-face `size-adjust`
  must be written for both.**
- **COURIER PRIME IS THE WORST CASE in §3's chars-per-line measurement** *(a monospace face moves characters-per-line
  far more than any proportional face — the S0 names it and reports it separately; an average across the roster would
  understate the one face that breaks the measure).*
- **OPENDYSLEXIC: the exclusion is UPHELD** *(Atkinson Hyperlegible answers the need it is usually reached for; TUTOR flags
  its "no measurable benefit" evidence claim as UNVERIFIED — this desk does not assert it as fact).* **Italics: all
  families have the four prose styles; all are OFL-1.1** *(the two proprietary faces are named, never shipped — §2).*
- **SIZE — RULED (Fable): no question to Nick.** **§4's fork is CLOSED: (R). 11 = today's rendering (`17px` at scale 1);
  the number is the printed size; the screen is a uniform zoom. The rival (a true Letter prose sheet) is NOT taken; it
  stays available as a separate future item if he ever asks, and §8's "for Fable to decide whether to ask" line is
  STRUCK.** *Check 3 of §9 (11 = today) is therefore live, not a park.*
- **THE FACE ACROSS MODES (TUTOR §5, offered as Nick's reading) is SETTLED by his own words and a ruling** *(his Q2: Free Write
  shows the picker; Fable's 206 ruling: styled text renders in every mode)* — **a page's face renders in every mode; the
  rival ("Free Write always renders the machine's face") is not taken.**
- **Q4 (uploads) still WAITS.** **207a is unchanged in scope; the roster it ships is nine.**
