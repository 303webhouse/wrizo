# ITEM 204 PART 2 — REVISE'S PROOFING: THE WRITER-FACING HALF
### PLAN desk · 2026-09-24 · **design** · the dictionary, the dialect, where a suggestion appears · builds on TUTOR's S0 (`tutor/item204-part2-grammar-engine-s0.md`, `5ef55e0`) · TUTOR writes the engine half of the brief

> **⚠ SYMBOLS ARE THE ANCHOR.** Read at `4a4e463`. Line numbers are a courtesy.
> **Nothing here is a build, no schema is written, and there is no mockup** *(the pencil is down).* **Every engine
> fact below is TUTOR's measurement, quoted; every fact about the app is this desk's read of the tree.**

---

## §0 · WHAT IS RULED, AND WHAT THIS DESK DESIGNS

**His words (ledger, 2026-09-24):** *"Red squiggles for typos/misspellings, olive green squiggles for grammar errors,
and only when the User is in Revise mode."* **His standing law: grammar and spelling are NEVER AI — built in, or a
reliable open-source library.** **Fable's rulings (item 204 part 2):** *harper.js (slim), Apache-2.0, in a worker,
loaded only when Revise is entered and cached; style / readability / enhancement OFF (a read-time drop on
`lint_kind()`); the colour map comes from the RULE (Spelling/Typo → red, the rest → olive); harper owns BOTH
colours once it lands and the native checker goes off; INK's `revise-spelling` one-liner is the interim red; a
per-writer dictionary is REQUIRED.* **This desk designs: (§1) where a suggestion appears, (§2) the dictionary and
where it lives, (§3) the dialect, and (§4) how the marks behave.**

**The laws this design lives inside, each measured against the tree or the charter:**
- **Revise is the free-editing surface** (RS3) — *text is editable there; the forward-only instrument does not mount.*
- **RS5 — "DR7's exception is the lens's alone: the unbidden exception authorizes error marks and NOTHING ELSE;
  counsel still never solicits, type never suggests."** **So the MARKS are lawful unbidden; a SUGGESTION is a
  reply to the writer's act, never a thing that appears by itself.**
- **The two hands are asymmetric by constitution: the Desk (left) can change the page; the Counsel (right) only
  SAYS** *(A12–A15).* **Applying a fix changes the page — it is a page-side act, never the Counsel's.**
- **The Tutor never supplies the writer's words** *(TD1)* — **harper is a rule engine, not a model, so a spelling
  or grammar fix is a mechanical correction of the writer's own word, not composition; the DROPPED kinds (Style,
  Readability, Enhancement) are what would compose, and stay off.**
- **Page primacy** — *tools overlay without displacing; the page's rect never changes; the editor never unmounts.*
- **Item 166's guideline** *(its Q5: text-bound popups open AT the text and are not panels)* **and Nick's minimal-
  interface law: "as minimal as possible (same goes for all strip menus)."**
- **No ambient counts** *(A14/A18: a count is lawful only inside a destructive confirmation)* — **so no "12 issues"
  badge anywhere.**

---

## §1 · WHERE A SUGGESTION APPEARS — on the mark, on the writer's act, as a small card at the word

**A press on a marked word (click, tap, or Enter with the caret in it) opens ONE small card anchored to that word** —
*a text-bound popup, the same class as the screenplay's autocomplete and the right-click menu on text (166's
exception (a) and Q5): it may lie over the page, it is dismissed by Esc or a press outside, and it moves nothing.*
**A right-click on a marked word opens the SAME card** *(never a second menu with different contents — 168 §4's rule).*
**It is NOT in the Counsel's panel** *(the Counsel says; it must not hold a control that changes the page)* **and NOT
a side list** *(a panel that lists issues is unbidden solicitation and a count in disguise).*
- **The card's whole content (the minimal law, counted):**
  1. **the category, in words** — *"Spelling"* or *"Grammar"* *(it is also the accessible name and the non-colour cue,
     §4)*; **the engine's own one-line message when it has one** *(e.g. "Did you mean…")*;
  2. **up to THREE suggestions**, each **one press to APPLY** *(replace, remove or insert — as the engine states it);*
  3. **"Ignore"** and, **on a SPELLING flag only, "Add to dictionary"** *(§2)*;
  4. **on a SPELLING flag only, the dialect as a small quiet label — "American English"** *(a press opens the five
     dialects, §3).*
  **Nothing else: no rule id, no "learn more", no explanation paragraph, no "fix all".** *(Composition-adjacent text
  such as harper's "a more vivid adjective…" is a DROPPED kind and never reaches the card.)*
- **"Adding a name must not be the only escape, because the first encounter is mid-reading" (TUTOR §8) — so the
  escapes are TWO, and they differ in scope, and the card says which in its words:**
  **"Ignore"** = *this flag, here* (`ignoreLint` — keyed by `contextHash(source, lint)`, so it returns if the
  surrounding words change); **"Add to dictionary"** = *this word, everywhere, for this writer.* **Both are ONE press
  and both are UNDOABLE from a whisper** *(**"Added "Aelinor" — Undo"**; the whisper is the house's post-act
  feedback and carries no count).*
- **Applying a suggestion is ONE atomic step in the editor's own undo stack** *(FX6 S1's registered steps, the same as a
  rail Bold/Italic click)* — **Ctrl/Cmd+Z returns the original word exactly.**
- **Keyboard and screen reader:** **A "next issue" key (Word's F7 habit) is NOT proposed** *(it would be a solicitation loop)*; **the
  keys are: arrow the caret into a marked word, Enter opens the card, arrow keys move within it, Enter applies,
  Esc closes.** **The card is a `role="dialog"` named by its category; a marked word carries an `aria-description`
  ("Spelling: 3 suggestions").** *(No live-region chatter — the marks are silent until the writer asks.)*
- **What is deliberately absent:** *a review list, a "next issue" cycle, a summary, a score, "resolve all", a
  sidebar, a badge.* **The unmeasured risk, named:** *a writer who wants to sweep a chapter for issues has only their
  eyes and the marks — Word's next-issue habit is not offered.* **The rival — a "next issue" key** *(a real workflow
  for a copy-edit pass; it is a writer's own act, not unbidden)* **costs one keystroke and one design decision (it
  moves the caret, which is the writer's territory). Hand-up; the lean is to ship without it and see.**

## §2 · THE DICTIONARY — per writer, ours not the engine's, and where it lives

**What TUTOR measured:** *harper exposes `ignoreLint`, `exportIgnoredLints()` / `importIgnoredLints(json)` and
`contextHash` — that is an IGNORE list keyed by context. **It does not (in what TUTOR read) expose an "add this
word to the dictionary" call.*** **This desk therefore designs the dictionary as OUR list, applied at read time
beside the kind filter — engine-agnostic:** *a flagged Spelling/Typo span whose text (case-insensitive) is in the
writer's word set is DROPPED before painting* — **the same mechanism as the style-off drop (§4.1 of the S0), so it
works whether or not harper later grows a word-import API.** **(If it does, S0 may push the words into the engine as
an optimisation; the read-time drop stays the guarantee — TUTOR's own ruling for the kind filter.)**

**Two stores, one record:**
```
proofing = { dialect, words: { "<word>": { addedAt, removedAt? } }, ignored: "<harper's exported JSON>", engine: "<version>" }
```
- **`words`** — *the personal dictionary.* **A map keyed by the word (lower-cased for matching; the writer's own
  casing kept as the value's display), each entry stamped, and REMOVED words kept as `removedAt` — because two
  devices editing a set offline must converge, and last-writer-wins on a bare list LOSES words** *(the same
  whole-blob limit item 202 names for board boxes).* **The client MERGES per key by the later stamp when it applies
  a remote record and before it pushes** *(a small function; a LWW-element-set)* **— so a word added on a phone and
  another added on the laptop both survive.**
- **`ignored`** — *harper's own exported ignore list, stored as an OPAQUE string with the engine version;* **if a
  future engine cannot import it, it is dropped and rebuilt — an ignore is a convenience, never data.** **Capped**
  *(proposed 500 entries, oldest dropped — UNMEASURED)*; **a stale hash is harmless** *(it matches nothing).*
- **`dialect`** — §3.

**WHERE IT LIVES — the schema question, laid out.** **The record is small (hundreds of words at a novelist's
extreme; a few KB) and per WRITER, not per page — so it is not `pageSettings`, and it must not be smuggled into
`page_defaults`** *(that column is the writer's starting DRESS, written only by the explicit "set as my defaults"
act — R6; proofing is a different concept and would overload it).* **The options:**
| option | what it is | verdict |
|---|---|---|
| **(1) ONE nullable jsonb column `users.proofing` — LEAN** | additive, no default, no backfill — **exactly `users.page_defaults`' recipe** (`migrate.ts:169`) | **the minimal honest shape; travels with the account to every device.** **A column → it stops for Nick.** *Edit sites: the migration line, the read/write of the users record, the client store, plus the per-key merge above.* |
| (2) per-word records in a NEW TABLE `user_dictionary` | one row per word, `deleted_at`, LWW per row | **converges without a merge function and scales to thousands of words, and it is a new `/sync` collection — a client contract change and a table.** *More than a few hundred words does not need it.* |
| (3) a hidden system PAGE whose text is the word list | zero schema | **REJECTED — a synced page is whole-record LWW (words lost), it appears in lists and export, and it makes a settings blob into a document.** |
| (4) per device only (`localStorage`) | zero schema | **does not travel — fails the requirement Fable states — but it is the INTERIM below.** |
**INTERIM, BEHIND ONE SEAM (so nothing waits on the schema word):** *the store is written per device
(`localStorage`, the `wrizo-theme-prefs` recipe) through a single `proofingStore` interface; when Nick clears the
column, the same interface writes `users.proofing` and the first sync merges the device's words in.* **No writer loses
words to the switch: the migration is a union.**
**The plain-English question for Nick (Fable checks it against his words; a schema word, NO default):** ***"To keep
your personal dictionary — the character names and made-up words you tell Wrizo not to flag — on every device, Wrizo
needs one small database addition (a settings record on your account). Is that OK? Until you say yes, your
dictionary stays on the device you added the words on."***
**Scope — a second, smaller question (default: all your work):** *"Should your dictionary be shared across all your
projects, or kept separately for each project?"* **Lean: all your work** *(one writer, one dictionary — and it is the
requirement as Fable states it).* **The rival, in its strongest form — per project/drawer:** *a fantasy writer's
"Karrowmere" is noise in the writer's memoir; a series bible is naturally per-project.* **Its cost:** *a second
axis to manage and to explain, and a name added in one book still flagged in the next.* **The unmeasured risk sits on
the lean.**
**A writer must be able to SEE and REMOVE words** *(an accidental "Add" of a real typo would hide that error forever):*
**Settings › a "Proofing" row drills into the dictionary — a list of words, each with a remove `×`, and ONE add field
that accepts pasted lines (a cast list in one paste).** **Nothing else** *(minimal; no sort, no search until it is
needed).* **It is the only place the dictionary is edited except the two card escapes.**

## §3 · THE DIALECT
**Harper offers five: American, British, Australian, Canadian, Indian** *(TUTOR §8; the fixture was scored on
American).* **DEFAULT: American English (Fable's stated default), CHANGEABLE.** **Stored in `proofing.dialect`**
*(synced with the dictionary when the column lands; per device until then)*, **changed in two places:**
1. **Settings › Proofing — a plain choice of the five.**
2. **The card's quiet dialect label on a spelling flag (§1)** — *the escape that meets a British writer at the exact moment
   "colour" is underlined, mid-read; the label is one press away, and it changes the engine's dialect and re-lints.*
**Nothing prompts for it** *(no first-run "which English do you write in?" — an unbidden question in the surface where
"never solicits" is law).* **The unmeasured risk, named:** *a British writer's first Revise session is a page of red
until they find the label — TUTOR's `grey` false positive is exactly this.* **The rival: a one-time first-load
question** *(cheap, discoverable, and the only unbidden prompt in the mode — it breaks the RS5 wall by one
sentence).* **Lean: no prompt.** **`Regionalism` lints stay DROPPED** *(it is the "this is an American/British word"
kind, and style is off).*

## §4 · HOW THE MARKS BEHAVE

- **Only in Revise** *(his words)* **— never in Free Write or Draft, never in the Counsel, never on a screenplay page in
  v1** *(a screenplay's structured blocks — character cues in capitals, sluglines — are a flood of false positives; a
  script page's proofing is its own design; **S0 confirms whether Revise even mounts on a script page**).*
- **Two classes, from the RULE:** **Spelling/Typo → RED; everything else that survives the filter → OLIVE**
  (`Agreement, Grammar, Repetition, Usage, WordChoice, Punctuation, Capitalization, BoundaryError, Malapropism, Eggcorn,
  Nonstandard, WordOrder, Redundancy, Miscellaneous`). *(TUTOR §4; `Miscellaneous` is olive — "incorrect indefinite
  article" lives there.)*
- **A NON-COLOUR CUE, because red and olive are close for the most common colour-blindness:** **spelling is a
  WAVY underline; grammar is a wavy underline of a visibly lighter, thinner stroke** *(both "squiggles", as he asked);*
  **the card always names the category in words; the marked word's `aria-description` does too.** *(A call — Nick asked
  for colour; the stroke difference is added to it, never instead.)*
- **THE COLOURS ARE TOKENS, hand-computed, never `color-mix()`** *(the standing rule)*: **olive is `--accent-rest`
  (#96a05a, "where you are") — his word; **RED IS A NEW COLOUR in a palette with an ember ceiling** *(Plateau's
  "colour spent" law)* **— it is his explicit ask, so it is built, and it needs a contrast check on paper light AND dark
  in every theme (S0).** *(One more thing red must not be: it must not read as item 108's tag orange or as a
  destructive confirm's danger register — two neighbours already use red-ish meanings.)*
- **How they are DRAWN:** *painted, never wrapped in DOM* — **the house's law for any mark on writer text (TRR14: a
  marker element would be SAVED INTO THE MANUSCRIPT; `draftDecoration.ts` rule 1 refuses to rewrite the DOM under a
  selection).** **This design therefore SHARES the paint layer with Experiment 1's link tint and item 145's tint —
  the `CSS.highlights` / `::highlight()` measurement PW owns; it is done once.** **Two consequences to measure, not
  assume: (a) `::highlight()` supports `text-decoration` in Chromium, but a word that is BOTH marked and covered by a
  link tint AND carries the writer's own `__underline__` (item 122 — F2: "underline belongs to the writer") stacks
  three things on one word; (b) a squiggle under a writer-underlined word must stay distinguishable from it.**
  *Until the paint layer exists, INK's interim (the native checker, red only) is what runs.*
- **WHEN THEY APPEAR (the timing, so typing is never chased):** *harper lints when Revise is entered (after the worker
  loads — nothing shows, no spinner, no message, until it has produced a result) and on an idle pause after an edit,
  the changed PARAGRAPH only, never the word being typed until the caret leaves it;* **a mark under the caret's own
  word is held until it moves** *(so "teh" is not red mid-"then")*. **Never on the main thread** *(TUTOR §6: 435 ms
  on a chapter would stall typing — page primacy).* **The idle delay (proposed ~800 ms) is UNMEASURED.**
- **HANDOVER, so spelling never vanishes:** *the native checker (INK's interim) goes OFF only when harper has
  produced its first result for that page in that session; if the worker fails to load (offline, first web use), the
  native red STAYS on.* **A writer is never left with less than they had.**
- **The engine's ceiling is stated to the writer nowhere and must not be oversold in copy:** *harper has no
  pronoun-case rule — "between you and I" is never caught (TUTOR §7).* **No feature copy says "checks your
  grammar"; the Settings row says "Proofing".**
- **Privacy:** *nothing leaves the device; harper is offline (TUTOR proved it with every outbound primitive
  booby-trapped).* **The dictionary syncs to Wrizo like any of the writer's data (§2) — and to nobody else.**

## §5 · WHAT NICK IS ASKED — plain English, a default each (Fable checks them against his words)
- **P1 — the dictionary follows you** *(a database addition; NO default; his word alone)*: **as §2's sentence.**
  **Until he answers: per device.**
- **P2 — one dictionary or one per project?** **Default: one for all your work.**
- **Calls, recorded, not asked (vetoable): the card at the word (no side panel, no issue list, no "next issue");
  American English by default, changeable in Settings and from the card; a lighter stroke for grammar beside the colour.**
- **A hand-up for Fable, not Nick:** *the "next issue" key (§1) and the first-load dialect question (§3) — both leans are
  "no", both rivals are real.*

## §6 · THE CHECKS OWED (standing laws: drivers never assume existence · real pointer events · seed through the seams · absolute worktree path · select by name · **park, never edit; audit the park COUNT**)
1. **Revise only:** *marks exist in Revise and NOT in Free Write, Draft, the Counsel, or a screenplay page.*
2. **Colour by the rule:** *a planted misspelling paints RED, a planted agreement error OLIVE, a Style/Readability lint paints
   NOTHING (the read-time drop, asserted by a fixture that yields a Style lint) — and the stroke weights differ.*
3. **The card:** *a press on a marked word opens ONE card at the word; a right-click opens the SAME card; its controls
   are exactly the §1 list (a control count, so an added button fails); Esc closes it; the page's rect is byte-
   identical open and closed.*
4. **Apply is one undo step; Ignore and Add each show an Undo whisper; neither shows a count.**
5. **Two escapes, two scopes:** *Ignore hides this flag and it RETURNS when its context changes; Add hides the word on
   every page and every later session.*
6. **The dictionary is OURS:** *a word in `proofing.words` is dropped from a Spelling flag at read time with harper's
   own import NOT used* — **and a word REMOVED from Settings is flagged again.**
7. **Convergence (two-device double):** *device A adds "Aelinor", device B adds "Karrowmere" offline; after sync both
   devices hold both; a remove on one propagates and a later add of the same word wins by stamp.* **(When the column
   exists; until then the check is the union-migration of the per-device store.)**
8. **No unbidden anything but marks:** *no toast, no badge, no count, no first-run prompt, no "next issue"; a spy asserts
   the card never opens without a writer's act.*
9. **Timing and threading:** *typing in a long page never blocks (the worker is asserted to be a worker); a mark is not
   painted under the caret's own word until it moves; the native checker is off only after harper's first result and ON
   when the worker fails to load.*
10. **Dialect:** *"colour" is flagged under American and NOT under British after the change, and the card's label shows
    the current dialect and is present only on a Spelling flag.*
11. **No schema before Nick's word:** *until then no column, table or `sync.ts` mapper is touched — the store is
    `localStorage`.* **A source scan asserts it.**
12. **Both `HARNESS_PARKED` settings CLEAN; park count audited.**

## §7 · WHAT THIS SETTLES AND WHAT IT LEAVES
**Settles (for the brief TUTOR writes and a builder follows): where a suggestion appears, that the dictionary is ours
and per writer, its shape and merge, where it lives (one column, stopped for Nick; a per-device interim behind one
seam), the dialect and its two doors, and the marks' behaviour.** **Leaves, named: the paint layer (PW's measurement),
red's contrast, whether Revise mounts on a script page, the idle delay and the ignore cap (both unmeasured), and the two
hand-ups in §5.** **Does NOT touch part 1** *(INK's interim red — `revise-spelling` @ `cbd4dc6`, not merged).*

---

## §8 · RULED SINCE THIS DESIGN WAS WRITTEN — Nick's P1 and P2, and the olive reconciliation

**Nick, verbatim (Fable's relay): *"1. Yes 2. One for all writing 3. Add Source Serif confirmed."*** *("1" and "2" answer P1 and
P2 of §5; "3" is item 207's.)* **Chat 1 records "yes" as his schema word.**

- **P1 — RULED YES: `users.proofing` is cleared as a column** *(§2's option 1, the lean).* **What that does NOT do: nothing
  writes until the builder's S0 shape report clears Fable's review** *(the standing sequence, as item 201's `purged_at`
  and item 181's `user_files`)*, **and if the minimum lawful shape turns out to be a table rather than a column, Fable
  tells Nick in plain words first.** **The per-device interim (§2) is now ONLY the bridge until the column ships; its
  migration is the union already designed — no word is lost to the switch.** **Five edit sites and the client census**
  *(the `page_links` recipe)* **plus the per-key merge are the builder's; §2's merge function is part of the build, not
  a follow-up.**
- **P2 — RULED: ONE DICTIONARY FOR ALL HIS WRITING.** **§2's lean is now his word: the record is per writer, not per
  project or drawer; the rival (per-project) is not taken and needs no column axis.** **§5's two "Nick" lines are
  STRUCK.**
- **What is left with nobody:** *the calls in §5 (vetoable, not asked), the two hand-ups for Fable (a "next issue" key; a
  first-load dialect question), and the S0 items in §7.*

### THE OLIVE RECONCILIATION (Fable, item 5 of his relay — PW reports olive already means "where you are")
**His ruling is unchanged: grammar squiggles are OLIVE.** **This design does not change his colour.** **It keeps the two
meanings apart by FORM and by PLACE, and makes that assertable:**
- **FORM.** *The proofing mark is ONLY ever a thin WAVY UNDERLINE drawn on writer text* **(a `text-decoration` on the
  paint layer); the "where you are" olive (`--accent-rest`) is ONLY ever a SOLID fill, a solid rule, or a solid marker
  on chrome** *(the current tab, the current row, the olive ring).* **The two never share a shape: a wavy olive line is
  never a "you are here" and a solid olive block is never an error.**
- **PLACE.** *The proofing mark exists only INSIDE THE PAPER, only in Revise, only on the writer's own words.* **The
  "where you are" markers exist only in CHROME (rails, tabs, rows, the two hands) and never on the paper's text.**
  **The single overlap — the Counsel hand and the paper sit in one view in Revise — is separated by the page's own
  edge: nothing wavy is drawn outside the paper; nothing solid-olive is drawn inside its text column.**
- **A colour-blind-safe reading is already in the design** *(§4: the grammar stroke is lighter and thinner than the
  spelling stroke, and the card names the category in words)* — **which also helps a writer who cannot tell olive from a
  chrome marker.**
- **Checks (added to §6):** *(a) every proofing mark's computed `text-decoration-style` is `wavy` and its
  `background`/`border` is never the olive token; (b) no element outside the paper (`.mode-page`) carries a wavy decoration in Revise;
  (c) no `--accent-rest` where-you-are marker is wavy.* **The unmeasured risk, named: an olive squiggle beside an
  olive current-row in the Counsel on a narrow window — S0 looks at 1100/1280 in Revise with both visible.**
