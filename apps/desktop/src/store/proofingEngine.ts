/**
 * ITEM 204 PART 2 — THE ENGINE HALF. harper.js in a worker, behind Revise.
 *
 * Built from `docs/menus/tutor/item204-part2-build-brief-engine.md` (TUTOR) and its
 * S0, with every API in here READ OFF `harper.js@2.10.0`'s own `.d.ts` rather than
 * taken from the brief's prose — the brief cites `getStructuredLintConfig()` and
 * `lint_kind()` correctly, but a builder who trusts a citation instead of the
 * package has no way to notice the day it stops being true.
 *
 * ⛔ THIS FILE STOPS SHORT OF THE PAINT, BY RULING (Fable, 2026-09-30). It returns
 * CHARACTER RANGES INTO THE SOURCE TEXT and nothing else: no Range, no Highlight,
 * no DOM. §11's handover is the boundary. The paint builds once FIX's r3
 * (`markRuns.ts`) lands with Batch Eight, and the ORDER is Experiment 1's
 * `visibleText` re-derivation first, then this. A span produced here is mapped
 * through markRuns' spans there — never by a second offset walk written next to
 * this one, which is how two formulas for one number get into a codebase.
 *
 * ⛔ GRAMMAR AND SPELLING ARE NEVER AI. harper is a rule engine, not a model, and
 * nothing in this file reaches the network after the binary is fetched. That is
 * Nick's standing law, not a performance note.
 *
 * WHAT IS DELIBERATELY *NOT* HERE: the debounce interval as FELT (PLAN DESK's —
 * this ships a default and exposes the parameter), the colours' exact values, the
 * suggestion presentation, and the dialect SETTING's UI. Also not here: applying a
 * suggestion. ⚠ A13 — the Tutor holds no editor reference and no text setter, and
 * `tu1.mjs` asserts it; `applySuggestion` IS a text write, so it belongs to
 * whatever owns the editor and must not be wired through this seam. This file
 * exposes no way to write text, which is the same "the destructive form is
 * unsayable" discipline `store/proofing.ts` uses for `mergeRemote`.
 */
// ⚠ TYPE-ONLY, AND THAT IS LOAD-BEARING. `import type` is ERASED at build time, so
// naming harper's own types here costs nothing in the bundle and keeps this file from
// carrying a hand-copied paraphrase of an API it does not own. The VALUE import stays
// dynamic (see `buildLinter`), which is what makes the lazy load real.
import type { Dialect, Linter as HarperLinter, Lint as HarperLint } from 'harper.js';
import type { ProofingDialect, ProofingRecord } from '../types';
import { PROOFING_DEFAULT_DIALECT } from '../types';
import { getProofing, proofingWordSet } from './proofing';

// ---------------------------------------------------------------------------
// THE HANDOVER SHAPE (§11)
// ---------------------------------------------------------------------------

/** Red for spelling and typos, olive for grammar. Nick's words, and the only two. */
export type ProofColour = 'red' | 'olive';

export interface ProofFinding {
  /** Character offsets into the SOURCE text the caller passed in — never into the
   * normalized copy, and never into the DOM. See `normalizeQuotes`. */
  start: number;
  end: number;
  colour: ProofColour;
  /** harper's own `lint_kind()`, carried through so the caller can group or explain. */
  kind: string;
  message: string;
  suggestions: string[];
}

// ---------------------------------------------------------------------------
// §9 — THE READ-TIME DROP AND THE COLOUR MAP. THIS IS THE GUARANTEE.
// ---------------------------------------------------------------------------

/**
 * ⛔ WHY THIS IS A READ-TIME FILTER AND NOT A CONFIG ACT. Measured by the S0:
 * `getStructuredLintConfig()` groups harper's 885 rules by HUMAN LABEL ("Proper
 * Nouns", …) and a rule's `LintKind` is not exposed in configuration at all — so
 * there is no rule-name → kind mapping to drive a by-name switch-off. Config-off
 * is an optimization where a group happens to be known; the read-time drop is the
 * guarantee, and only one of the two may be relied on.
 *
 * ⛔ AND IT IS A LAW, NOT TIDINESS. On the S0's fixture harper offered
 * "very cold" → "A more vivid adjective would better capture extreme cold." That
 * is COMPOSITION, which TD1 forbids (if the reply could be pasted into the page
 * and improve it, it composed) and RS7 drops. A style suggestion reaching the
 * writer is a law breach, not a rough edge.
 *
 * ⚠ `Miscellaneous` IS OLIVE, NOT DROPPED. It carries "Incorrect indefinite
 * article" — a real grammar error. TUTOR's desk got this wrong first and corrected
 * it on the record; the mistake cost one of six grammar hits and was misreported as
 * an engine miss.
 */
const KIND_COLOUR: Record<string, ProofColour | 'drop'> = {
  // RED — spelling and typos.
  Spelling: 'red',
  Typo: 'red',
  // OLIVE — grammar, in the broad sense Nick's ruling means.
  Agreement: 'olive',
  Grammar: 'olive',
  Repetition: 'olive',
  Usage: 'olive',
  WordChoice: 'olive',
  Punctuation: 'olive',
  Capitalization: 'olive',
  BoundaryError: 'olive',
  Malapropism: 'olive',
  Eggcorn: 'olive',
  Nonstandard: 'olive',
  WordOrder: 'olive',
  Redundancy: 'olive',
  Miscellaneous: 'olive',
  // DROP — never shown, on the law above.
  Style: 'drop',
  Readability: 'drop',
  Enhancement: 'drop',
  Formatting: 'drop',
  Regionalism: 'drop',
};

/**
 * Every kind harper 2.10.0 declares, as a value this file can COUNT. The `.d.ts`
 * gives `LintKind` as a union, which a runtime check cannot enumerate, so the proof
 * reads the union out of the installed package and compares it against this list —
 * if a future harper adds a kind, the proof goes red HERE rather than the new kind
 * arriving silently in front of a writer.
 */
export const HARPER_LINT_KINDS: readonly string[] = Object.keys(KIND_COLOUR);

/**
 * ⛔ UNKNOWN KINDS DROP. DEFAULT-DENY, AND THE DIRECTION IS DELIBERATE.
 *
 * `lint_kind()` returns a plain `string`, not the union — so a harper upgrade can
 * hand this function a kind the map has never seen. Showing it would be the
 * friendlier default and the wrong one: an unknown kind may well be a new STYLE
 * kind, and letting one through is a TD1 breach, which is the single thing §9
 * exists to prevent. Dropping a genuine new grammar kind costs a missed hint; the
 * other way round costs the law.
 *
 * So unknowns drop, and they are RECORDED (`unknownKindsSeen`) so the gap is
 * visible rather than silent — a guard that quietly discards is how a population
 * of zero gets mistaken for coverage.
 */
const unknownKinds = new Set<string>();

export function classifyKind(kind: string): ProofColour | null {
  const c = KIND_COLOUR[kind];
  if (c === 'red' || c === 'olive') return c;
  if (c === undefined) unknownKinds.add(kind);
  return null;
}

/** Kinds this session saw that the map does not know. Empty is the expected state. */
export function unknownKindsSeen(): string[] { return [...unknownKinds].sort(); }

// ---------------------------------------------------------------------------
// §5 — QUOTE NORMALIZATION. A 1:1 CHARACTER MAP, NEVER A REGEX.
// ---------------------------------------------------------------------------

/**
 * ⛔ WHY A MAP AND NOT A REGEX, AND WHY IT MATTERS MORE THAN IT LOOKS.
 *
 * harper scores typographic quotes as foreign characters: "She don't know" with a
 * curly apostrophe returns ZERO hits, and with an ASCII one returns `Agreement`.
 * A sixth of the grammar yield on the S0's fixture hangs on that one character.
 *
 * So the text is normalized before linting — but the writer's text is NEVER
 * touched, and the copy must be the SAME LENGTH, because every span harper returns
 * is an index into the copy and is handed back as an index into the original. A
 * replacement that changed length would shift every span after it and land the
 * marks on the wrong words: a failure that reads exactly like an engine bug and is
 * not one. All 11 mappings are verified one UTF-16 unit on both sides.
 *
 * A regex could do this in one line and could also, one careless edit later, match
 * two characters and emit one. A per-code-unit map cannot: it is a lookup, so
 * length invariance is structural rather than tested. The proof asserts it anyway.
 */
const QUOTE_MAP: Readonly<Record<string, string>> = {
  '‘': "'", // ' left single
  '’': "'", // ' right single (the apostrophe that costs the Agreement hit)
  '‚': "'", // ‚ single low-9
  '‛': "'", // ‛ single high-reversed-9
  'ʼ': "'", // ʼ modifier letter apostrophe
  '′': "'", // ′ prime
  '“': '"', // " left double
  '”': '"', // " right double
  '„': '"', // „ double low-9
  '‟': '"', // ‟ double high-reversed-9
  '″': '"', // ″ double prime
};

export function normalizeQuotes(text: string): string {
  let out = '';
  for (const unit of splitUnits(text)) out += QUOTE_MAP[unit] ?? unit;
  return out;
}

/**
 * Iterate UTF-16 CODE UNITS, not code points, because harper's spans are UTF-16
 * indices and this walk is index-aligned with them BY CONSTRUCTION rather than by an
 * argument about what the map happens to contain.
 *
 * ⚠ AN EARLIER VERSION OF THIS COMMENT OVERSTATED THE HAZARD, and the mutation
 * roster is what corrected it. Swapping this for `for (const c of text)` — a
 * code-POINT walk — was expected to break length invariance and did not: the pair
 * is yielded as one two-unit string, no QUOTE_MAP key is a surrogate pair, so
 * `QUOTE_MAP[pair]` misses and the pair is re-emitted unchanged. The two walks are
 * SEMANTICALLY EQUIVALENT here, and the mutant survived because there was nothing to
 * catch, not because a check was missing. Said plainly because a comment claiming a
 * bug that cannot happen teaches the next reader something false.
 *
 * The code-unit walk stays: it is the unit harper measures in, so it needs no such
 * argument to stay correct if a non-BMP character is ever added to the map.
 */
function* splitUnits(text: string): Generator<string> {
  for (let i = 0; i < text.length; i += 1) yield text[i]!;
}

// ---------------------------------------------------------------------------
// THE DIALECT
// ---------------------------------------------------------------------------

/**
 * The five dialects, and they line up exactly with `ProofingDialect` — harper's own
 * `Dialect` enum is American/British/Australian/Canadian/Indian, which is why the
 * shape report's fifth member is INDIAN and not New Zealand. (A first draft of that
 * report wrote en-NZ from memory; the package says otherwise, and the package wins.)
 *
 * Numeric literals rather than the imported enum ON PURPOSE: importing `Dialect`
 * from 'harper.js' at module scope would pull the package into the main bundle and
 * defeat the lazy load below. The proof asserts these five numbers against the
 * installed enum, so the shortcut cannot drift silently.
 */
const DIALECT_CODE: Record<ProofingDialect, number> = {
  'en-US': 0, // Dialect.American
  'en-GB': 1, // Dialect.British
  'en-AU': 2, // Dialect.Australian
  'en-CA': 3, // Dialect.Canadian
  'en-IN': 4, // Dialect.Indian
};

export function dialectCode(d: ProofingDialect | undefined | null): number {
  return DIALECT_CODE[d ?? PROOFING_DEFAULT_DIALECT] ?? DIALECT_CODE[PROOFING_DEFAULT_DIALECT];
}

// ---------------------------------------------------------------------------
// §3 / §4 — THE WORKER, AND THE LAZY LOAD
// ---------------------------------------------------------------------------

/** The modes the editor knows (`ForwardOnlyEditor.tsx:51`). */
export type ProofMode = 'journal' | 'drafting' | 'revise';

/**
 * ⛔ REVISE ONLY, ENFORCED HERE AND NOT LEFT TO THE CALLER. Nick's ruling is
 * "only when the User is in Revise mode", and §12's second check calls it the whole
 * of the ruling and the easiest thing to regress. A gate that lives only in the
 * component is one refactor from being lost, so the engine itself refuses: there is
 * no way to spell "lint this in Free Write" through this module.
 */
export function proofingAllowedIn(mode: ProofMode): boolean {
  return mode === 'revise';
}

/**
 * The lint language. ⚠ OPEN IN THE BRIEF (§8) AND NOT GUESSED HERE: harper defaults
 * to `markdown`, the S0 measured `plaintext` on plain prose, and the Revise buffer
 * IS markdown. The brief says to measure both on a page with real markdown syntax
 * and take the one that does not flag the syntax itself.
 *
 * `item204-engine-proof.mjs` runs that measurement, and this default records its
 * RESULT rather than a preference. It stays a parameter so the finding can be
 * revisited without editing call sites.
 */
export const PROOF_LANGUAGE_DEFAULT: 'plaintext' | 'markdown' = 'markdown';

/**
 * §3 — the debounce ships a DEFAULT and stays a parameter. The felt value is PLAN
 * DESK's; the engine has no opinion it could defend. The trigger is the writer
 * pausing, not the writer typing.
 */
export const PROOF_DEBOUNCE_MS_DEFAULT = 600;

/**
 * ⚠ NO HAND-ROLLED SHAPE FOR THE LINTER. An earlier draft of this file declared its
 * own `HarperLinter`/`HarperLint` interfaces listing the methods it calls.
 * They typechecked and they were a second copy of someone else's API — the shape
 * that keeps compiling long after the package has moved. harper's own `Linter` and
 * `Lint` are used instead, so a breaking change upstream is a compile error here
 * rather than a runtime surprise, and `item204-engine-proof.mjs` still asserts the
 * installed package against the ambient declaration that supplies them.
 */
/**
 * ⛔ THE CACHE IS A PROMISE, AND THAT IS THE WHOLE OF "LOAD ONCE".
 *
 * Caching the LINTER after loading leaves a window: two Revise entries in quick
 * succession both see an empty cache and both start a 7.7 MB fetch. Caching the
 * in-flight PROMISE closes it — the second caller awaits the first one's work. This
 * is the same reason `setup()` is awaited inside the promise rather than beside it.
 *
 * ⚠ AND THE IMPORT IS DYNAMIC FOR A REASON A STATIC ONE WOULD SILENTLY BREAK.
 * `harper.js/slimBinary` creates its BinaryModule at module scope, so a static
 * import at the top of this file would put harper in the MAIN bundle and a writer
 * who never opens Revise would pay for it — "never at boot, never in Free Write,
 * never in Draft" would be false while every function here still looked right.
 * `await import(...)` is what makes Vite split it out.
 */
let linterPromise: Promise<HarperLinter> | null = null;

async function buildLinter(): Promise<HarperLinter> {
  const [{ WorkerLinter }, { slimBinary }] = await Promise.all([
    import('harper.js'),
    import('harper.js/slimBinary'),
  ]);
  // SLIM, and one binary only (§4). The npm page's 71.71 MB is every variant
  // summed — two binaries plus two base64-inlined copies; the inlined ones exist to
  // embed the wasm in JS and would roughly triple the cost. Slim and full scored
  // IDENTICALLY on the S0's fixture, so slim carries no measured accuracy penalty.
  const linter: HarperLinter = new WorkerLinter({
    binary: slimBinary,
    dialect: dialectCode(getProofing().dialect) as Dialect,
  });
  await linter.setup();
  return linter;
}

/**
 * Load harper, or return the load already in flight. Refuses outside Revise, so the
 * "never at boot" rule cannot be broken by a caller who means well.
 */
export function ensureProofingEngine(mode: ProofMode): Promise<HarperLinter> | null {
  if (!proofingAllowedIn(mode)) return null;
  if (!linterPromise) linterPromise = buildLinter();
  return linterPromise;
}

/** Has harper been loaded (or started loading) this session? For the proof and the harness. */
export function proofingEngineLoaded(): boolean { return linterPromise !== null; }

/**
 * ⚠ TEST SEAM, AND IT IS NOT A BACK DOOR FOR PRODUCTION. A harness cannot run
 * `WorkerLinter` in Node — harper's own types say it "will not work properly in
 * Node" — so the proof injects a `LocalLinter`. It cannot inject text into the
 * page and it cannot bypass the Revise gate, which still guards every read below.
 */
export function __setProofingEngineForTests(l: HarperLinter | null): void {
  linterPromise = l ? Promise.resolve(l) : null;
}

// ---------------------------------------------------------------------------
// THE PASS
// ---------------------------------------------------------------------------

export interface ProofPassOptions {
  mode: ProofMode;
  language?: 'plaintext' | 'markdown';
  /** Defaults to the live record; passed explicitly by the proof. */
  record?: ProofingRecord | null;
}

/**
 * Lint `text` and return findings as character ranges into THAT text.
 *
 * Returns [] rather than throwing outside Revise: a caller that asks in the wrong
 * mode gets nothing, which is the behaviour the ruling describes, and the refusal
 * is not an error condition the UI has to handle.
 */
export async function proofText(text: string, opts: ProofPassOptions): Promise<ProofFinding[]> {
  if (!proofingAllowedIn(opts.mode)) return [];
  const linter = ensureProofingEngine(opts.mode);
  if (!linter) return [];
  const l = await linter;

  const record = opts.record === undefined ? getProofing() : opts.record;

  // THE WRITER'S OWN WORDS GO IN THROUGH HARPER'S DICTIONARY. Batched in one call,
  // because harper's own docs call importWords "a significant operation".
  const words = proofingWordSet(record ?? null);
  await l.clearWords();
  if (words.size > 0) await l.importWords([...words]);

  // The ignore set, if the writer has one. Stored as harper's own hash JSON, so it
  // goes back the way it came out — this module does not reinterpret it.
  await l.clearIgnoredLints();
  if (record?.ignored) {
    try { await l.importIgnoredLints(record.ignored); } catch { /* a corrupt list is not a reason to stop proofing */ }
  }

  await l.setDialect(dialectCode(record?.dialect) as Dialect);

  // §5 — lint the same-length copy. `text` itself is never modified.
  const normalized = normalizeQuotes(text);
  const lints = await l.lint(normalized, { language: opts.language ?? PROOF_LANGUAGE_DEFAULT });

  const out: ProofFinding[] = [];
  for (const lint of lints) {
    const kind = lint.lint_kind();
    const colour = classifyKind(kind);
    if (!colour) { lint.free?.(); continue; }

    const span = lint.span();
    const start = span.start;
    const end = span.end;

    // ⛔ THE READ-TIME DICTIONARY DROP — THE GUARANTEE BESIDE THE MECHANISM.
    // `importWords` above is harper's own way to accept the writer's names, and it
    // is the right mechanism. This is the guarantee, and §9's reasoning is why both
    // exist: if the import is skipped, fails, or races a dictionary edit, the cost
    // is hundreds of red squiggles under a novelist's own character names — the
    // exact experience the S0 measured (4 of 4 invented proper nouns flagged red).
    // Dropping at read time makes that impossible from one direction regardless of
    // what happened in the other. Only RED is dropped this way: the writer's
    // dictionary says "this is a word", not "this phrase is grammatical".
    if (colour === 'red' && words.size > 0) {
      const surface = text.slice(start, end);
      if (words.has(surface) || words.has(surface.toLowerCase())) { lint.free?.(); continue; }
    }

    const suggestions: string[] = [];
    for (const s of lint.suggestions()) {
      suggestions.push(s.get_replacement_text());
      s.free?.();
    }

    out.push({ start, end, colour, kind, message: lint.message(), suggestions });
    // harper's Lint is wasm-backed. Freeing it after the plain object is built keeps
    // a long Revise session from accumulating wasm memory the GC cannot see.
    lint.free?.();
  }
  return out;
}

// ---------------------------------------------------------------------------
// THE RUNNER — the debounce, and the superseded-pass rule
// ---------------------------------------------------------------------------

export interface ProofRunner {
  /** Ask for a pass. Later calls supersede earlier ones. */
  request(text: string, mode: ProofMode): void;
  /** Drop any pending pass (leaving Revise, unmounting). */
  cancel(): void;
}

/**
 * ⛔ A SUPERSEDED PASS MUST NOT DELIVER. The writer types, pauses, a pass starts,
 * the writer types again: the first pass's spans now point into text that no longer
 * exists, and delivering them paints marks on the wrong words. So every pass
 * carries a sequence number and a stale result is DISCARDED rather than raced.
 *
 * The text is captured at request time and the result is delivered WITH it, so the
 * caller can assert the spans belong to the text it is about to paint instead of
 * assuming the editor has not moved on.
 */
export function createProofRunner(
  onResult: (findings: ProofFinding[], forText: string) => void,
  opts: { debounceMs?: number; language?: 'plaintext' | 'markdown' } = {},
): ProofRunner {
  const wait = opts.debounceMs ?? PROOF_DEBOUNCE_MS_DEFAULT;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let seq = 0;

  const clear = () => { if (timer !== null) { clearTimeout(timer); timer = null; } };

  return {
    request(text, mode) {
      clear();
      if (!proofingAllowedIn(mode)) return;
      const mine = ++seq;
      timer = setTimeout(() => {
        timer = null;
        void proofText(text, { mode, language: opts.language }).then((findings) => {
          if (mine !== seq) return; // superseded — discard, do not deliver
          onResult(findings, text);
        }).catch(() => { /* a failed pass shows no marks; it never breaks typing */ });
      }, wait);
    },
    cancel() { clear(); seq += 1; },
  };
}
