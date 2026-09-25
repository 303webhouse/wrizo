# ITEM 204 PART 2 — THE GRAMMAR ENGINE — S0

*The item-84 desk (TUTOR), 2026-09-24. Docs-only. Nothing in `apps/` is touched.*

**Every number in this document was produced by a run in the session that wrote it.** Nothing
is quoted from memory. The earlier checker report (`3b58b27`) deliberately declined to give
figures for exactly this reason, and that refusal was ruled right; this document is the
measurement that refusal was waiting for. The scripts are named in §1 and were run
browserlessly — **no box turn was used or needed.**

---

## 0 · WHAT THIS ANSWERS TO

**Nick, verbatim** (ledger, 2026-09-24):

> "Red squiggles for typos/misspellings, olive green squiggles for grammar errors, and only
> when the User is in Revise mode"

**His ruling supersedes the recorded default** ("on outside Free Write"): proofing marks show
**only in Revise** — never in Free Write or Draft. His standing law binds the engine: **grammar
and spelling are NEVER AI** — built in, or a reliable open-source library.

**Item 204 is in two parts.** **Part 1** — spelling, red, interim, owner INK. **Part 2** — the
grammar engine — is this document. **PLAN DESK designs how the marks and suggestions appear;
a builder follows.** This desk measures and recommends; it does not build.

---

## 1 · THE INSTRUMENT

Browserless Node (v24.13.0). Scripts: `fixture.mjs`, `run.mjs`, `diag.mjs`, `final.mjs`,
`normalize.mjs`, `gap.mjs`, `cfg.mjs`, written to this desk's scratchpad and **not committed**
— they are the method, and the method is restated here in full so the numbers can be
re-derived without them.

**OFFLINE IS PROVED, NOT CLAIMED.** Before any engine loaded, `fetch`, `net.connect`,
`net.createConnection`, `tls.connect`, `http.request`, `http.get`, `https.request`,
`https.get`, `dns.lookup` and `dns.promises.lookup` were each replaced with a function that
records the attempt and throws. **The run completed and the recorded attempt list was empty.**
A README that says "on-device" is a claim; a completed run with every outbound primitive
booby-trapped is a measurement.

**THE FIXED TEST TEXT** — 935 characters of novelist's prose, not test-suite prose:

- **6 planted misspellings** (`recieve`, `seperate`, `occured`, `definately`, `accomodate`, `teh`)
- **6 planted grammar errors** (`He have written`, `A apple`, `Their going`, `She don't know`,
  `The the room`, `Between you and I`)
- **4 invented proper nouns** (`Aelinor`, `Karrowmere`, `Vhasir`, `Sethlin`) carried as
  **false-positive traps**. A spellchecker that underlines a character's name is the failure
  mode that matters most in Wrizo and it appears in no generic benchmark.

Every planted error is resolved to **exact character offsets**, and the fixture **throws** if
any key string drifts or occurs twice. A hit counts when its range **overlaps** the key span —
overlap, not equality, because engines legitimately differ on how much context they underline
and Nick's spec is about *which words go coloured*, not about matching this desk's span choice.

**Speed** was measured on a 60,000-character page (~10,000 words — a long chapter), median of
five runs.

---

## 2 · THE FIELD, AND WHAT DIED

| Candidate | Verdict | Measured basis |
|---|---|---|
| **`nlprule`** | **DOES NOT EXIST** | `npm view nlprule` → **404 Not Found.** Named in the earlier report; removed by measurement, not by opinion. |
| **LanguageTool** | **NOT AVAILABLE OFFLINE AS A LIBRARY** | Every LanguageTool package on npm is an **HTTP wrapper**; `languagetool-api` unpacks to **0.01 MB** — it is a client, not an engine. Offline LanguageTool means a **Java server + JVM**, which is not a thing this app can carry. |
| **`retext`** (english + `indefinite-article`, `repeated-words`, `contractions`) | **INSUFFICIENT** | **2/6 grammar, 0/6 spelling.** Confirms the earlier report's instinct that the family is mostly *style*, which RS7 drops. |
| **`nspell` + `dictionary-en`** | **SPELLING ONLY** | **6/6 spelling, 0/6 grammar** (by design). 0.20 MB gzip, ~5 ms on 60k chars. Returns a **boolean per word** — ranges are the caller's to compute. |
| **`harper.js` 2.10.0** | **THE ONLY VIABLE GRAMMAR ENGINE** | §3. |

**The field collapses to one.** That is the central finding, and it is why the size question
in §6 cannot be answered by "pick the smaller one" — there is no smaller one.

---

## 3 · `harper.js` 2.10.0 — MEASURED

| | |
|---|---|
| **Licence** | **Apache-2.0** |
| **Publisher** | Automattic (`github.com/automattic/harper`), published **2026-09-10** — actively maintained |
| **Runtime deps** | **one** (`fflate`) |
| **Spelling** | **6/6** |
| **Grammar** | **5/6** normalized · 4/6 raw (§5) |
| **False positives** | **4/4 invented names** · plus `grey` (American dialect) |
| **Speed** | **median 435 ms** on 60,000 chars (~10k words); runs 413, 420, 435, 454, 538 |
| **Ranges** | **`Span { start, end }` — exact character indices** |
| **Offline** | **PROVED** (§1) |
| **Rules** | **885**, individually toggleable; 873 on by default, 12 off |

**Shipped bytes, raw and gzipped, because gzip is what crosses the wire:**

| File | Raw | Gzip |
|---|---|---|
| `harper_wasm_bg.wasm` (full) | 15.42 MB | **7.78 MB** |
| `harper_wasm_slim_bg.wasm` (slim) | 15.20 MB | **7.69 MB** |
| `index.js` | 0.15 MB | 0.03 MB |

**The npm page's 71.71 MB is the sum of every variant** (both binaries plus two base64-inlined
copies). **The shipped cost is one binary.** **Full and slim scored identically on this text**
— same 6/6, same 5/6, same false positives — so **slim carries no measured accuracy penalty
here** and is the correct choice.

---

## 4 · THE TWO COLOURS COME OUT OF THE ENGINE

`Lint.lint_kind()` returns one of 21 kinds, and it **already separates Nick's two classes**:

- **RED** — `Spelling`, `Typo`
- **OLIVE** — `Agreement`, `Grammar`, `Repetition`, `Usage`, `WordChoice`, `Punctuation`,
  `Capitalization`, `BoundaryError`, `Malapropism`, `Eggcorn`, `Nonstandard`, `WordOrder`,
  `Redundancy`, **`Miscellaneous`**
- **DROPPED** — `Style`, `Readability`, `Enhancement`, `Formatting`, `Regionalism`

**Observed on the fixture**, each planted error with the colour it actually came back as:

```
recieve, seperate, occured, definately, accomodate  → RED   (Spelling)
teh                                                 → RED   (Typo)
He have written                                     → OLIVE (Agreement)
Their going                                         → OLIVE (Grammar)
The the room                                        → OLIVE (Repetition)
A apple                                             → OLIVE (Miscellaneous)
She don't know                                      → OLIVE (Agreement)  — only after §5
Between you and I                                   → not detected       — §7
```

**We write no classifier.** The engine names the class; the map above turns the name into a
colour. That is what Fable's ruling *"the colour map comes from the RULE"* means in practice.

### ⚠ 4.1 · THE FILTER MUST RUN AT READ TIME, NOT IN CONFIG

**Measured:** `getStructuredLintConfig()` groups the 885 rules by **human label** ("Proper
Nouns", …) with descriptions. **A rule's `LintKind` is not exposed in the configuration at
all.** So "switch the style rules off by name" cannot be written from the config surface —
there is no rule-name → kind mapping to drive it.

**The reliable mechanism is to drop by `lint_kind()` on the way out**, as the DROPPED set
above does. Turning named groups off in config is an **optimization** available where the
group is known; it is not the guarantee. **The guarantee is the read-time filter**, and it is
the one that was measured.

*Why this is load-bearing: `Style` / `Readability` / `Enhancement` are not merely noise. On
the fixture, harper offered* `"very cold"` → *"A more vivid adjective would better capture
extreme cold." That is composition — it is what **TD1** forbids (if the reply could be pasted
into the page and improve it, it composed) and what **RS7** drops. The filter is not tidiness;
it is the law.*

---

## 5 · TYPOGRAPHIC QUOTES — RULED, AND MEASURED

**Ruled (Fable):** normalize typographic quotes to ASCII **in a same-length copy** before
linting; every span then maps back unchanged.

**This desk verified the ruling rather than taking it, and it holds in all three parts:**

1. **Width** — all 11 mapped characters (`' ' ‚ ‛ " " „ ‟ ′ ″ ʼ`) and all their replacements
   are **exactly one UTF-16 unit**; 0 mappings are not 1:1.
2. **Length** — original **935**, normalized **935** → **INVARIANT.**
3. **Alignment** — a same length is not a same alignment, so every index was compared:
   **0 characters changed without being a mapped quote.** Alignment holds.

**MAP-BACK PROOF.** The span the normalized run returns for the agreement error is
`[469, 474)`. Sliced out of the **original** text that is `"don’t"` — curly apostrophe intact —
while the normalized copy reads `"don't"`. **The writer's own characters are never touched;
only the copy handed to the linter is.**

**THE EFFECT, MEASURED:**

| | Spelling | Grammar |
|---|---|---|
| **Raw (curly `’`)** | 6/6 | **4/6** |
| **Normalized** | 6/6 | **5/6** |

Without normalization, `"She don’t know"` returns **zero hits**; with it, `Agreement`. **A sixth
of the grammar yield hangs on one character**, and the normalizer is three lines.

**⚠ CORRECTION TO THE RULING'S EXPECTATION, and this desk will not round it up.** Fable asked
to *"Measure 6/6 with it in the S0."* **It measures 5/6, not 6/6.** The sixth is not an encoding
artefact and no normalizer reaches it — see §7. **The normalization ruling is correct and is
adopted; only the number attached to it is corrected.**

---

## 6 · SIZE, AND WHY IT IS AFFORDABLE

**Accepted by Fable: the 7.7 MB web download, Revise-only and cached.** Recorded here with the
reasoning that makes it affordable:

- **`apps/desktop` bundles for Electron** — on the desktop target the binary is a local asset
  and the download is **zero**.
- **The web target pays once.** Loaded **only when Revise is entered** — never at boot, never
  in Free Write, never in Draft — and cached thereafter. A writer who never opens Revise never
  pays anything.

**THREADING IS NOT OPTIONAL.** **435 ms on a long chapter would freeze the writing surface.**
`WorkerLinter` exists for exactly this and the types say plainly that `LocalLinter` is the
Node one. **`PAGE IS PRIMARY` forbids the main-thread version** — a proofing pass that stalls
typing has moved the page, whatever the bounding rect says. **Ruled: harper runs in a worker.**

---

## 7 · WHAT harper DOES NOT DO — A CLASS, NOT AN INSTANCE

`Between you and I` is **not detected**, and this desk tested the engine fairly before calling
it a gap. **Six probes across both American and British dialects, every one `NO HIT`:**

```
Between you and I, the thing was finished.   → NO HIT
between you and I, the thing was finished.   → NO HIT
This is between you and I.                   → NO HIT
She gave the letter to he and I.             → NO HIT
Me and him went to the tower.                → NO HIT
Who did you give it to?                      → NO HIT
```

**Searching the 885 rule descriptions for pronoun/case/objective/nominative returns 52 keyword
coincidences and no pronoun-case rule.** (`NotBeAfterNot`, `APart`, `QuiteQuiet` … — the word
"between" inside a description, not a rule about pronouns.)

**FINDING: harper has no pronoun-case coverage.** Not a tuning gap, not a phrasing problem — a
**whole class it does not check.** This is the honest ceiling on the recommendation and it
should be known before anyone measures the shipped feature against a writer's expectations.
It does not change the ruling: **there is no rival engine to lose it to** (§2).

---

## 8 · THE FALSE POSITIVES ARE THE REAL COST

**Accuracy is not the problem. The false positives are.**

**4 of 4 invented names were flagged red** — `Aelinor` ("Did you mean `Elinor`?"),
`Karrowmere` ("Did you mean `Narrower`?"), `Vhasir`, `Sethlin` — plus `grey`, correct British
spelling read as an American misspelling.

**A fantasy writer opening Revise gets a red squiggle under every character and place name in
the chapter.** On a 935-character fixture with four names that is four; on a novel it is
hundreds, and it makes the feature feel broken while working exactly as designed.

**THIS IS WHY THE PER-WRITER DICTIONARY IS REQUIRED, and Fable has ruled it so.** The engine
side exists and was read in the type surface: `ignoreLint(source, lint)`, `ignoreLints`,
`ignoreLintHash`, `exportIgnoredLints()`, `importIgnoredLints(json)`, `clearIgnoredLints()`,
and `contextHash(source, lint)`.

**ROUTED, NOT DESIGNED HERE: the dictionary's home is PLAN DESK's to design** (Fable, this
relay). What this desk hands over is the requirement and the seam, not a design:

- it must be **per writer** and must **persist** and **travel** (`export`/`importIgnoredLints`
  are JSON, so the storage question is open, not blocked);
- `grey` shows the **dialect** setting is part of the same question — `Dialect` offers
  American, British, Australian, Canadian, Indian, and the fixture was scored on American;
- **adding a name must not be the only escape**, because the first encounter is mid-reading.

---

## 9 · THE RECOMMENDATION, AND THE RULING IT MET

**This desk's lean, given before the ruling:** harper.js (slim) in a `WorkerLinter`,
Revise-only, style rules off, `Spelling`/`Typo` → red, the rest → olive, per-writer ignore
list, and **nothing added for spelling** — harper's 6/6 equals nspell's at no extra bytes, so
pairing two spell engines buys only disagreement.

**RULED (Fable), item 204 part 2 — and it is the lean, adopted:** the grammar engine is
**harper.js (slim), Apache-2.0**, run in a **worker**, **loaded only when Revise is entered and
cached**; style / readability / enhancement **off**; **the colour map comes from the RULE**
(spelling/typo → red, the rest → olive); **a per-writer dictionary is required**; **the
browser's built-in checker exposes no ranges to JS, so once harper lands it owns BOTH colours
and the native checker goes off**; **INK's one-liner (`revise-spelling` @ `cbd4dc6`) is the
interim red until then**, as item 204 part 1; **the 7.7 MB web download is accepted.**

**Nick's standing law is met: harper is a rule engine, not a model.** Nothing here consults
anything. The check that proves it is §1's blocked-primitive run.

**The open claim from this desk's report is closed by Fable, and recorded as answered rather
than as measured by this desk:** the browser's built-in checker exposes no ranges to JS — CSS
can restyle its squiggle, and Electron hands over one word only on right-click. **This desk did
not measure that and does not claim to have.**

---

## 10 · CORRECTIONS THIS DESK MAKES AGAINST ITS OWN WORK

Kept on the page with the error named, per this desk's standing habit.

1. **`Miscellaneous` was bucketed as style in the first run, and it is not.** It carries
   "Incorrect indefinite article" — a real grammar error. The first run therefore reported
   harper's grammar as **3/6 when it was 4/6**, and reported `A apple` as an engine miss when
   **the engine caught it and this desk dropped it.** Corrected in §4; the lesson is §4.1.
2. **`She don't know` was reported as an engine miss; it was this desk's own fixture.** The
   curly apostrophe came from writing realistic prose, and the miss was an encoding artefact,
   not a gap. §5.
3. **The first harness run failed on a Windows path bug in harper's *Node* loader** —
   `fs.readFile(new URL(u).pathname)` yields `/C:/…`, which Node resolves to `C:\C:\…` →
   ENOENT. **The browser path uses `fetch` and is unaffected, so the product is untouched.**
   Recorded because a future Node-side harness on Windows will meet it; worked around by
   serving the local bytes through a `fetch` shim, which kept the network genuinely blocked.
4. **`6/6` was asked for and `5/6` is what there is.** §5.

---

## 11 · WHAT IS OWED, AND WHAT IS NOT THIS DESK'S

**Not this desk's, and named so it is not dropped:**

- **The per-writer dictionary — PLAN DESK**, with the dialect question beside it (§8).
- **How the marks and suggestions appear — PLAN DESK**, per the item-204 registration.
- **Part 1's interim red — INK** (`revise-spelling` @ `cbd4dc6`, not merged, not offered here).
- **The build — a builder lane**, from a brief that does not exist yet.

**Open, and this desk's when asked:**

- **A build brief for part 2** has not been written. This is an S0; it recommends and measures.
  This desk writes the brief on the word.
- **The pronoun-case gap (§7)** is recorded, unowned, and needs no action — there is no rival
  engine to move to.

**Still on this desk's queue, unchanged by item 204:** the preset day-one contents (`e45517b`)
and the right-strip automation proposal (`44cd0db`), both awaiting Nick; and tier-1
claim-checking, the Bibliography preset and continuity, all still blocked on PLAN DESK's
Record primitive.

---

*Measured browserlessly; no box turn used. Tree clean at writing; this document is the only
change in its commit.*

— the item-84 desk (TUTOR), 2026-09-24
