# ITEM 204 PART 2 — BUILD BRIEF — THE ENGINE HALF

*The item-84 desk (TUTOR), 2026-09-24. Docs-only. This desk does not touch `apps/`.*

**This is the ENGINE half only.** **PLAN DESK designs the writer-facing half** — how the marks
and suggestions appear, the per-writer dictionary's home, and the dialect setting. Where the
two halves meet is named in §11 and nowhere is it decided here.

**Its measurements are `item204-part2-grammar-engine-s0.md` (the S0).** Every file and line
cited below was read at `origin/main` `e8b7101` in the session that wrote this. **Where this
brief says "unmeasured", it means no run has established it and the builder must not assume
it** — two such items are §6 and §8, and **§6 gates the paint.**

---

## 1 · WHAT IS BEING BUILT

**Revise-mode proofing, grammar half.** `harper.js` (slim) runs in a worker, lints the page
when the writer is in Revise, and returns character ranges that get painted as coloured
squiggles — **red for spelling/typo, olive green for grammar** — via the CSS Custom Highlight
API.

**Nick, verbatim:** *"Red squiggles for typos/misspellings, olive green squiggles for grammar
errors, and only when the User is in Revise mode"*.

**Ruled (Fable, item 204 part 2):** harper.js (slim), Apache-2.0, in a **worker**, **loaded only
when Revise is entered and cached**; style / readability / enhancement **off**; **colour from the
rule**; **a per-writer dictionary is required**; the native checker **goes off** once harper
lands; the **7.7 MB web download is accepted**.

**Standing law it meets:** **grammar and spelling are NEVER AI.** harper is a rule engine, not a
model. **The S0's blocked-primitive run is the proof**, and the harness in §12 keeps it true.

---

## 2 · WHERE IT HOOKS — READ FROM DISK, NOT ASSUMED

| Fact | Site |
|---|---|
| Mode type is `'journal' \| 'drafting' \| 'revise'` | `apps/desktop/src/components/ForwardOnlyEditor.tsx:51` |
| `freeEdit = mode === 'drafting' \|\| mode === 'revise'` | `ForwardOnlyEditor.tsx:102` |
| **Revise renders the MARKDOWN-DECORATED branch**, not the runs branch | `ForwardOnlyEditor.tsx:631` (`freeEdit ? decorateMarkdownForCard(initialText, null) : …`) |
| The native checker is **already off** in the editor | `ForwardOnlyEditor.tsx:652` — `spellCheck={false}` |
| The editor **re-decorates imperatively on every keystroke** | `ForwardOnlyEditor.tsx:626–629` and its `onInput` |
| Markdown markers are wrapped in `<span class="md-mark">` / `md-mark-hidden` | `apps/desktop/src/store/draftDecoration.ts:148+` |
| **Nothing in the product uses the Custom Highlight API yet** | grep for `CSS.highlights` / `new Highlight(` in `apps/desktop/src` → no hits |

**⚠ THE STRUCK-RUN MODEL IS NOT IN PLAY HERE.** `derivedText()` (`store/forwardOnly.ts:23`)
drops struck runs, and the `fo-run` / `fo-struck` markup is the **Free Write** branch. **Revise
does not take it.** A builder who ports Free Write's offset arithmetic into Revise will be
correcting for struck runs that the Revise DOM does not contain. *This desk nearly wrote that
mistake into this brief and checked the branch condition instead.*

---

## 3 · THE WORKER — NOT OPTIONAL

**Measured: median 435 ms to lint 60,000 characters (~10k words).** On the main thread that is
a visible freeze of the writing surface on every pass.

- Use **`WorkerLinter`**, not `LocalLinter`. harper's own types say `LocalLinter` is the Node
  one and that `WorkerLinter` *"will not work properly in Node"* — so the product takes
  `WorkerLinter` and the harness (§12) may take `LocalLinter`.
- **`PAGE IS PRIMARY` is the reason, not performance taste.** A proofing pass that stalls
  typing has moved the page whatever its bounding rect says. The self-check's third line —
  *if the user leaves through your feature, does one tap return them?* — is not reached,
  because **this feature never takes the writer anywhere**: it must not mount, unmount,
  resize, or displace the surface, and the Custom Highlight API is chosen precisely because
  it paints **without adding anything to the DOM**.
- **Debounce the pass**; do not lint per keystroke. The trigger is the writer pausing, not the
  writer typing. **The exact interval is PLAN DESK's** (it is felt, not computed) — the engine
  exposes it as a parameter and ships a default.

---

## 4 · THE LAZY LOAD

- **Load on entry to Revise. Never at boot, never in Free Write, never in Draft.** A writer who
  never opens Revise pays nothing.
- **Cache after first load**; re-entering Revise must not re-download or re-instantiate.
- **Measured sizes** (the S0): **slim 15.20 MB raw / 7.69 MB gzip**; full 15.42 / 7.78; the
  loader JS 0.15 / 0.03. **Take slim** — full and slim scored **identically** on the fixture,
  so slim carries no measured accuracy penalty.
- **The npm page's 71.71 MB is every variant summed** (two binaries plus two base64-inlined
  copies). **Ship one binary.** Do not bundle `binaryInlined` / `slimBinaryInlined`; they exist
  to embed the wasm in JS and would roughly triple the cost.
- **On Electron the binary is a local asset and the download is zero.** The 7.7 MB is the web
  target only.

---

## 5 · QUOTE NORMALIZATION — RULED, AND VERIFIED

**Lint a same-length copy with typographic quotes mapped to ASCII. Never modify the writer's
text.**

Map (all verified **one UTF-16 unit** on both sides — 11 mappings, 0 not 1:1):

```
' ' ‚ ‛ ʼ  →  '        " " „ ‟  →  "        ′ → '        ″ → "
```

**Verified on the fixture:** length **935 → 935, invariant**; **0 characters changed without
being a mapped quote** (a same length is not a same alignment, so every index was compared);
and the **map-back proved** — the normalized run's span `[469,474)` sliced out of the
**original** reads `"don’t"`, curly apostrophe intact.

**Why it is not cosmetic: without it, `"She don’t know"` returns ZERO hits; with it,
`Agreement`. Grammar moves 4/6 → 5/6.** A sixth of the yield hangs on one character.

**⚠ BUILD IT AS A 1:1 CHARACTER MAP, NEVER A REGEX THAT CAN CHANGE LENGTH.** A length change
silently shifts every span after it and the marks land on the wrong words — a failure that
looks like an engine bug and is not. **The harness asserts length invariance (§12).**

---

## 6 · ⚠ THE PAINT — MEASURED IN PART, AND THE UNMEASURED PART GATES THE BUILD

**PROVED (PW, `3320c76`, 12/12, on the box):** the CSS Custom Highlight API is present in the
app's own engine (Edg/153, `HighlightRegistry`), **it paints — measured in pixels, mean channel
delta 113 on the marked word against a control word moving 0** — and **nothing enters the
manuscript**: no glyph, no sentinel, no element in the editor subtree.

**⚠ NOT PROVED, AND NICK'S SPEC DEPENDS ON IT: that a SQUIGGLE paints.** PW's probe used
`background-color` **only**, and its own comment says so — *"A faint tint, and ONLY a
background — no text-decoration, because F2 rules out the underline and a probe that painted
one would be measuring the wrong thing."* **PW proved a fill. Nick asked for squiggles.**

**REQUIRED BEFORE THE PAINT IS BUILT — a short box check:** does

```css
::highlight(wz-proof-red) { text-decoration: underline wavy <colour>; }
```

**actually paint in the app's own engine**, measured in pixels against a control, the way PW
measured the fill? **If it does not, the mark mechanism is not settled and that is a design
reversal, not a build detail** — it goes back to PLAN DESK and Nick, not around them.

**The band this desk is applying is already on the record:** ***A RULING CAN BE REFUSED BY THE
PLATFORM — MEASURE THE MECHANISM BEFORE PROMISING THE BEHAVIOUR.***

**⚠ SECOND PLATFORM FACT, ALREADY MEASURED AND ALREADY COSTLY ONCE:** **custom highlights
render BELOW `::selection`** (CSS Custom Highlight API §4.2.4), **and item 122's selection is
opaque** — a marked word under a selection measured **1.00:1**, i.e. invisible. **In Revise the
writer selects constantly.** The engine cannot fix this; **it is named here so PLAN DESK designs
with it rather than discovering it**, exactly as the earlier ruling discovered it.

---

## 7 · ⚠ RANGES DETACH — REBUILD, NEVER REGISTER ONCE

**The editor re-decorates its own DOM imperatively on every keystroke** (§2). A `Range` handed
to a `Highlight` points at **nodes**, so when those nodes are replaced the range is stale — it
silently stops painting, or paints the wrong characters.

**Therefore: re-resolve every span to fresh `Range`s after each re-decorate, and re-`set` the
highlights.** Registering once at mount and trusting it will pass a naive check and fail the
writer — **`CSS.highlights.has()` only proves the range was REGISTERED**, which is the trap
PW's commit names explicitly. **Assert paint, not registration** (§12).

---

## 8 · OFFSET MAPPING — AND ONE OPEN DECISION

`decorateMarkdownForCard` **wraps** markdown markers in spans; it does not delete characters
(the indent marker is kept visible precisely so the layout is not silently changed —
`draftDecoration.ts:163–171`). **So the DOM's text content is expected to equal the source
text**, and mapping a harper offset to a `Range` is a text-node walk.

**⚠ BUILDER MUST VERIFY THAT EQUALITY RATHER THAN ASSUME IT**, and the harness must assert it:
`textContent.length === sourceText.length` over the editor subtree, on a page carrying bold,
italic, a heading and a leading tab. **If any decoration path drops or adds a character, every
span after it is wrong** — the §5 hazard again, arriving from the other side.

**OPEN, AND IT NEEDS A MEASUREMENT, NOT A PREFERENCE: `language: 'plaintext'` or `'markdown'`?**
The S0 measured **plaintext on plain prose**. The Revise buffer **is** markdown. harper's
default is `markdown`. **Measure both on a page with real markdown syntax** and take the one
that does not flag the syntax itself. **This desk does not guess it** — it was not measured, and
the S0 says only what it measured.

---

## 9 · THE READ-TIME DROP, AND THE COLOUR MAP

**Filter at read time on `lint_kind()`. This is the guarantee.**

```
RED     Spelling · Typo
OLIVE   Agreement · Grammar · Repetition · Usage · WordChoice · Punctuation ·
        Capitalization · BoundaryError · Malapropism · Eggcorn · Nonstandard ·
        WordOrder · Redundancy · Miscellaneous
DROP    Style · Readability · Enhancement · Formatting · Regionalism
```

**⚠ `Miscellaneous` IS OLIVE, NOT DROPPED.** It carries *"Incorrect indefinite article"* — a
real grammar error. **This desk got that wrong first and corrected it on the record**; the
error cost one of six grammar hits and was wrongly reported as an engine miss.

**⚠ "STYLE OFF" CANNOT BE WRITTEN AS A CONFIG ACT.** Measured: `getStructuredLintConfig()`
groups the 885 rules by **human label** ("Proper Nouns", …) with descriptions — **a rule's
`LintKind` is not exposed in configuration at all**, so there is no rule-name → kind mapping to
drive a by-name switch-off. **Config-off is an optimization where a group is known; the
read-time drop is the guarantee.** Both are allowed; only one may be relied on.

**Why the drop is law and not tidiness:** on the fixture harper offered `"very cold"` → *"A more
vivid adjective would better capture extreme cold."* **That is composition — what TD1 forbids**
(*if the reply could be pasted into the page and improve it, it composed*) **and what RS7
drops.** A style suggestion reaching the writer is a law breach, not a rough edge.

---

## 10 · THE CEILING, NAMED

**harper has no pronoun-case coverage at all.** Measured: six probes across American **and**
British — *"Between you and I"*, *"This is between you and I"*, *"to he and I"*, *"Me and him
went"*, *"Who did you give it to?"* — **every one returned nothing**; searching all 885 rule
descriptions for pronoun/case/objective/nominative returns 52 keyword coincidences and **no
pronoun-case rule**.

**It is a class it does not check, not a tuning gap.** **It changes nothing** — the S0 showed
there is no rival engine to move to — **but it must not be discovered by a writer and reported
as a build defect.** Grammar scores **5/6** on the fixture and that is the honest ceiling.

**Equally: the false positives are the real cost, not the misses.** **4 of 4 invented proper
nouns were flagged red** (`Aelinor` → *"Did you mean `Elinor`?"*), plus `grey` read as an
American misspelling. On a novel that is hundreds of red squiggles under the writer's own
names, and it will feel broken while working exactly as designed. **This is why the dictionary
is a requirement and not a refinement — and it is PLAN DESK's to design, not this brief's.**

---

## 11 · THE SEAM TO THE OTHER HALF, AND ONE LAW THAT CONSTRAINS IT

**The engine half hands over:** for each finding — a **span** (`{start, end}` into the source
text), a **colour** (`red` | `olive`), the **rule kind**, the engine's **message**, and its
**suggestions**. Plus the ignore seam: `ignoreLint`, `ignoreLints`, `ignoreLintHash`,
`exportIgnoredLints()`, `importIgnoredLints(json)`, `clearIgnoredLints()`, `contextHash()`.

**⚠ A13 CONSTRAINS WHO MAY APPLY A SUGGESTION.** *The Tutor holds no editor reference and no
text setter, and `tu1.mjs` asserts it.* **Reading the page to lint it is fine; writing a
correction back is not, and `applySuggestion` is a text write.** So **accepting a suggestion
must not be wired through the Tutor** — it belongs to whatever owns the editor. **Named here so
the two halves do not meet in a place A13 forbids**; where it does belong is PLAN DESK's and
the builder's, not this desk's.

**TRR14 is satisfied by construction, and better than it asks.** *"A flag may only wrap existing
characters in a span and add nothing"* — the Custom Highlight API **does not even wrap**: it
paints a range with **no DOM mutation at all**, which is what PW's §6b result measured.
**Marks are CSS only. No inserted element, ever, and no character** — the marker build-breaker
already recorded twice against the mockups.

---

## 12 · THE HARNESS — `scripts/harness/item204.mjs`

Per `AGENTS.md`: the scenario is a committed artifact landing **in the same commit as the build
it verifies**, and it seeds **through the seams** (`window.wrizoCreateJournalPage` and
siblings), **never raw `localStorage`**.

**It must assert, at minimum:**

1. **No network.** Outbound primitives replaced with throwing recorders before load; the pass
   completes and **the attempt list is empty.** *This is the check that keeps Nick's "never AI"
   law true as the code changes, and it is cheap.*
2. **Marks appear in Revise and in NO other mode** — absent in Free Write, absent in Draft.
   **This is the whole of his ruling and the easiest thing to regress.**
3. **Nothing enters the manuscript.** Stored text after a proofing pass is **byte-identical** to
   the writer's text — no glyph, no sentinel, no element in the editor subtree.
4. **It PAINTS** — in pixels, against a control word on the same line, the way PW measured.
   **Never `CSS.highlights.has()` alone**: an API that registers and paints nothing passes every
   truthy check and fails the writer.
5. **It still paints after a keystroke** (§7) — the re-decorate rebuild, which is the regression
   a "register once" implementation will not survive.
6. **Length invariance of the normalizer** (§5), and **DOM/source length equality** (§8).
7. **No style-kind finding ever reaches the writer** (§9) — the TD1 guard.

**Waits exit on observable state, never on elapsed time** — the minifier deletes spin loops, and
a `Date.now()` wait can vanish from the bundle entirely.

---

## 13 · DEFINITION OF DONE

- Revise shows red squiggles for spelling/typo and olive for grammar; **no other mode shows
  any mark.**
- harper runs in a worker, loads on Revise entry, and is cached.
- The native checker is off wherever harper owns the colours (**the site is
  `ForwardOnlyEditor.tsx:652`, already `spellCheck={false}`** — confirm it is not re-enabled by
  part 1's interim landing first).
- §12's checks pass, both legs.
- `pnpm install` and `pnpm dev` run clean.
- **`harper.js` is a new dependency — ruled by Fable under this ticket**, which is the exception
  `AGENTS.md` requires. **Ship slim only.**

---

## 14 · WHAT IS **NOT** IN THIS HALF

**PLAN DESK's:** how the marks look (weight, exact colours, the olive), the suggestion
presentation, **the per-writer dictionary's home and storage**, the **dialect** setting
(`American` | `British` | `Australian` | `Canadian` | `Indian` — the fixture was scored
American, which is why `grey` was flagged), the debounce interval as felt, and what happens
when a mark sits under a selection (§6).

**INK's:** part 1, the interim red (`revise-spelling` @ `cbd4dc6`, not merged, not offered to
this desk). **It goes off when harper lands** — sequencing is chat 1's and Fable's.

**Not anyone's yet:** the pronoun-case gap (§10). Recorded, unowned, and needing no action.

---

*Written from the S0's measurements and from files read at `e8b7101`. Two items are marked
unmeasured on purpose — §6's squiggle and §8's lint language — and **§6 gates the paint.***

— the item-84 desk (TUTOR), 2026-09-24
