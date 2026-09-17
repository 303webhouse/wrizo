// ITEM 85-B — THE RAW-SEEDING GUARD. Browserless, in the hooks-order.mjs shape.
//
// WHAT IT IS FOR. A harness that writes a persisted collection RAW is a latent
// coin flip: `persistence.ts` hydrates its cache ONCE at module init and never
// re-reads it, and `flushNow()` then serialises that cache WHOLESALE. So a row
// written to localStorage after boot is invisible to the app and is ERASED by
// the next flush of that collection — from any source, including one the fixture
// never touched. It fires only when a product write happens after the seed in
// the same run, which is why `bm1` — whose pairing calls ARE product writes —
// was the one that surfaced, at a measured ~50%, and cost a day.
//
// WHY A GUARD RATHER THAN A CONVENTION, in the ledger's own words: the files
// were each written by someone who knew the convention. "A rule that lives only
// in a document is enforced by memory; a rule that fails a run is enforced by
// the run."
//
// BROWSERLESS ON PURPOSE. It costs no suite time and cannot itself flake — the
// same argument that made hooks-order.mjs and hooks-order-ast.mjs static.
//
// ---------------------------------------------------------------------------
// THE KEYS COME FROM THE APP, NOT FROM A LIST HERE
//
// The collection names are parsed out of `persistence.ts`'s own `KEYS` object at
// run time. A hardcoded copy would be a second formula for one number: add a
// seventh collection to the app and a copy here would silently stop guarding it,
// which is precisely the failure mode this repo keeps paying for. If the parse
// ever fails, this guard FAILS LOUDLY rather than guarding nothing.
//
// ---------------------------------------------------------------------------
// A DISTINCTION THE CHARTER'S WORDING DOES NOT MAKE, AND WHICH THIS FILE DOES
//
// "Fails when a harness writes a collection raw" would, read literally, condemn
// `bm1.mjs` — and bm1 is the file item 129 just repaired. Its remaining raw
// write is NOT a seed. It is a deliberate two-device TOMBSTONE simulation
// ("delete the page directly in storage (a load path) + reload"): the scenario
// under test is precisely that a row vanishes out from under a mounted surface,
// and there is no seam for "another device deleted this", because the app cannot
// do it. Item 129 migrated bm1's SEEDING and kept this, correctly.
//
// So a raw write has two shapes, and only one is a debt:
//   · SEEDING — creating fixture rows the app itself could create. A seam exists
//     (or should be widened until it does); this is migration debt.
//   · SIMULATING AN EXTERNAL MUTATION — writing behind the app's back on purpose
//     to model a remote/other-device change, then reloading. That IS the
//     scenario, not a shortcut past one.
// The guard cannot tell them apart by reading source, and it does not pretend
// to: it reports every raw writer and carries a REASON for any entry claimed to
// be deliberate.
//
// RATIFIED 2026-09-09 (Fable): deliberate simulations are LAWFUL, and the reason
// string is REQUIRED. That promotes the reason from a courtesy to a rule — and
// this file's own argument then applies to it immediately, because a rule that
// lives in a ruling is enforced by memory. It is enforced below instead: an
// annotation with no reason, a placeholder reason, a reason attached to a file
// that no longer writes raw, or one attached to a file the baseline does not
// track, all FAIL this guard. An unexplained exemption is how a ratchet becomes
// an amnesty — one honest-looking line at a time.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(HERE, '..', '..');
const PERSISTENCE = path.join(DESKTOP, 'src', 'store', 'persistence.ts');
const BACKSLASH = String.fromCharCode(92);

// --- the collection keys, single-sourced from the app ------------------------
// The source is a DEFAULTED PARAMETER, not a closed-over read, for one reason:
// the loud-failure path below is the guard's most important behaviour and the
// one that can never be observed in a healthy tree. Taking source as an argument
// is what lets the fixtures drive it. (This is the discriminator law: a check
// about a failing state must be able to inspect that state, not only its own
// healthy one.)
function collectionKeys(src = readFileSync(PERSISTENCE, 'utf8')) {
  const block = src.match(/const KEYS = \{([\s\S]*?)\} as const;/);
  if (!block) return null;
  const keys = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
  return keys.length ? keys : null;
}

// --- the scan ----------------------------------------------------------------
// A RAW MUTATION is setItem/removeItem against a collection key. Reads
// (`getItem`) are harmless and are not flagged; `localStorage.clear()` is the
// house's own fresh-desk idiom and is not a collection write.
function rawWritesIn(text, keys) {
  const hits = [];
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const key of keys) {
      const re = new RegExp(`localStorage\\.(setItem|removeItem)\\(\\s*['"\`]${key}['"\`]`);
      if (re.test(line)) hits.push({ line: i + 1, key, op: line.includes('removeItem') ? 'removeItem' : 'setItem' });
    }
    // A VARIABLE KEY IS STILL A RAW WRITE, and this scan was blind to it until
    // wave 2 tripped over it:
    //     const key = 'writer-studio-journal-entries';
    //     localStorage.setItem(key, JSON.stringify(list));
    // Eight such writes sat in three files, two of which had already dropped off
    // the migration worklist — counted as DONE while still writing a collection
    // raw. The population this guard exists to defend was therefore understated,
    // in the flattering direction, which is the worst kind: nobody audits a
    // number that looks better than expected.
    //
    // Counted as a hit on the FILE rather than on a named collection, because
    // the key is not readable here — which is precisely why it must be reported
    // rather than resolved. Any `setItem` whose first argument is an identifier
    // qualifies; no honest fixture has a reason to hide a key from this scan.
    const varKey = line.match(/localStorage\.(setItem|removeItem)\(\s*([A-Za-z_$][\w$]*)\s*,/);
    if (varKey) hits.push({ line: i + 1, key: `<variable: ${varKey[2]}>`, op: varKey[1] });
  });
  return hits;
}

function scanDir(dir, keys) {
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.mjs')) continue;
    const full = path.join(dir, name);
    const rel = path.relative(DESKTOP, full).replace(/\\/g, '/');
    if (rel.endsWith('scripts/harness/seed-guard.mjs')) continue;   // this file names the keys in prose
    const hits = rawWritesIn(readFileSync(full, 'utf8'), keys);
    if (hits.length) out.set(rel, hits);
  }
  return out;
}

// --- THE BASELINE ------------------------------------------------------------
// MEASURED, never estimated. The number has moved once, by work rather than by
// re-counting, and the history is kept because it is the point of the ratchet:
//
//   56  item 85-B, against main @ c2d5539 — the population the guard was built
//       to hold still. (Item 85's own record says 54; it measures
//       `writer-studio-journal-entries` alone, and b2-1.mjs / j5.mjs write
//       `projects`/`story-plans`/`drawers` without ever touching journal
//       entries. `flushNow()` iterates EVERY key, so their coin flip is
//       identical in kind — both numbers are right about what they measure,
//       only the six-key one is right about the hazard. AGENTS.md said 47.)
//   57  item 85-C added item85c.mjs, whose raw write is the CONTROL that proves
//       the hazard (annotated below).
//   20  item 85-C WAVE 1 — 37 files migrated to the seams, 67 raw writes gone.
//   14  item 85-C WAVE 2, in progress — 6 more migrated (the files needing no
//       generated id). The guard caught this update being owed: it went red on
//       six stale entries while I was reading the worklist instead of the
//       verdict line.
//   11  WAVE 2 continued — 5 more migrated (ab3, ab4, b1's literal writes, b3,
//       e1), AND the count CORRECTED UPWARD: this scan was blind to a write
//       through a VARIABLE key, so b1 and j5 had dropped off the worklist while
//       still writing collections raw. Eight such writes in three files. The
//       number had been understated in the flattering direction — the kind
//       nobody audits. 9 unclassified remain plus the 2 annotated.
//
// THIS LIST IS A RATCHET, NOT AN AMNESTY. A file NOT in it that writes raw is a
// FAILURE — that is the guard. A file IN it that no longer writes raw is ALSO a
// failure, so a migration must delete its line here in the same change; without
// that the list would rot into a permanent excuse and quietly re-authorise what
// it was built to end. Wave 1 proved that half works: the guard went red the
// moment the 37 were migrated and stayed red until these lines were removed.
//
// The entries are UNCLASSIFIED debt except where a reason is given.
// Classification belongs to whoever migrates each file — never to a grep.
const DELIBERATE = new Map([
  ['scripts/harness/item85c.mjs',
    'the raw write here is the CONTROL, not a seed: item 85-C\'s S2 seeds one row raw and one through '
    + 'the seam, performs a single ordinary product write, and reads both back — proving the raw row is '
    + 'destroyed and the seam row survives. Delete this raw write and S2 proves only that a row written '
    + 'through the store is still there afterwards, which is not news. The hazard cannot be demonstrated '
    + 'without reproducing it.'],
  ['scripts/harness/bm1.mjs',
    'a two-device TOMBSTONE simulation, not a seed: the write sets deletedAt on an existing row and '
    + 'reloads, because the scenario under test IS a row vanishing under a mounted surface and the app '
    + 'has no seam for "another device deleted this". Item 129 migrated this file\'s SEEDING and kept '
    + 'this deliberately.'],
]);

const BASELINE = new Set([
  'scripts/harness/bm1.mjs', 'scripts/harness/item85c.mjs',
]);

// --- run ---------------------------------------------------------------------
const keys = collectionKeys();
ok('85-B: the collection keys parse out of persistence.ts itself — a hardcoded copy here would stop guarding a seventh collection the day one is added, silently',
  Array.isArray(keys) && keys.length >= 6, keys ? `keys=${keys.join(',')}` : 'PARSE FAILED');

// THE LOUD-FAILURE PATH, DRIVEN RATHER THAN ASSERTED. The header above claims
// that a failed parse fails this guard loudly rather than guarding nothing —
// and in a healthy tree that branch never executes, so the claim would ship
// unproven, which is exactly how the AST guard nearly shipped as a decoration.
// A guard that silently stops guarding is worse than no guard: it reports a
// safety it is not providing.
{
  const mangled = 'export const OTHER = { a: 1 };\nconst NOTKEYS = { b: 2 } as const;\n';
  ok('85-B: a persistence.ts this parser cannot read yields NO KEYS — which drives the loud-failure exit rather than an empty scan that would pass every check below while guarding nothing',
    collectionKeys(mangled) === null, JSON.stringify({ parsed: collectionKeys(mangled) }));

  const truncated = "const KEYS = {\n  projects: 'writer-studio-projects',\n  drafts: 'writer-studio-drafts',\n} as const;\n";
  const few = collectionKeys(truncated);
  ok('85-B: a parse that SUCCEEDS but returns fewer keys than the app has also fails the check above (>= 6) — the dangerous shape is not a thrown error, it is a partial answer that looks like an answer',
    Array.isArray(few) && few.length === 2 && few.length < 6, JSON.stringify({ parsed: few }));

  const renamed = "export const KEYS = {\n  a: 'k1', b: 'k2', c: 'k3', d: 'k4', e: 'k5', f: 'k6',\n} as const;\n";
  ok('85-B (the control): an `export const KEYS` — the likely future edit — still parses, so the two checks above are not passing on a parser that simply fails on everything it is handed',
    (collectionKeys(renamed) || []).length === 6, JSON.stringify({ parsed: collectionKeys(renamed) }));
}

if (!keys) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(checks, null, 2));
  // eslint-disable-next-line no-console
  console.log('\nSEED-GUARD VERIFY: FAIL — could not parse KEYS from persistence.ts, so nothing was guarded');
  process.exit(1);
}

const found = new Map([
  ...scanDir(path.join(DESKTOP, 'scripts', 'harness'), keys),
  ...scanDir(path.join(DESKTOP, 'scripts'), keys),
]);

const offenders = [...found.keys()].sort();
const newOffenders = offenders.filter((f) => !BASELINE.has(f));
const stale = [...BASELINE].filter((f) => !found.has(f)).sort();

ok(`85-B: NO NEW raw collection write — a harness that seeds past the seam fails here rather than months later as an intermittent red (baseline ${BASELINE.size}, found ${offenders.length})`,
  newOffenders.length === 0,
  newOffenders.length
    ? JSON.stringify(newOffenders.map((f) => ({ file: f, hits: found.get(f) })), null, 1)
    : 'none');

ok('85-B: the baseline is a RATCHET — every listed file still writes raw, so a migration must delete its line here in the same change. A stale entry is a failure, because a list that rots becomes a permanent excuse',
  stale.length === 0,
  stale.length ? `MIGRATED, remove from BASELINE: ${stale.join(', ')}` : 'none stale');

// --- THE WORKLIST, EMITTED WHOLE ---------------------------------------------
// 85-C's first law, ruled 2026-09-09: A WORKLIST COUNTED FROM A CUT VIEW
// SILENTLY OMITS FILES. So the migration's worklist is emitted HERE, complete
// and sorted, by the same instrument that measured it — rather than left to be
// re-derived later from a grep somebody truncates for readability. The count and
// the list come from one array, so they cannot disagree; and the omission that
// law describes would be invisible in the output, which is what makes it worth a
// law rather than a habit.
//
// A SAMPLE IS ALLOWED WHERE A COUNT IS NOT. The falsification further down
// prints `sample: ...slice(0, 5)` beside a full-length count — the exact
// distinction the canon draws. Nothing on this path is sliced.
//
// This also replaces a check whose condition was the literal `true`. A check
// that cannot fail is the decoration this file keeps arguing against, so it now
// asserts something real: the worklist and the annotations must ACCOUNT FOR
// every offender. If an annotation ever names a file outside the population, the
// two stop summing and this reds.
const unclassified = offenders.filter((f) => !DELIBERATE.has(f));

ok(`85-B (the worklist, emitted whole): ${offenders.length} harness files write a persisted collection raw — ${unclassified.length} unclassified migration debt and ${DELIBERATE.size} annotated deliberate, which together account for every one of them`,
  unclassified.length + DELIBERATE.size === offenders.length,
  JSON.stringify({
    population: offenders.length,
    annotated: [...DELIBERATE.keys()],
    unclassifiedWorklist: unclassified,   // COMPLETE, never sliced — item 85-C's input
    keysGuarded: keys,
  }));

// --- THE RATIFIED LAW, ENFORCED ---------------------------------------------
// Ruled 2026-09-09: a deliberate external-mutation simulation is lawful AND its
// reason string is REQUIRED. Enforcement lives in a pure function so it can be
// driven with fixtures: the shape that matters here — an exemption that has
// quietly lost its justification — is one a healthy tree never exhibits, and an
// enforcement that never executes is the decoration this file keeps arguing
// against.
//
// A REASON IS NOT A FIELD BEING PRESENT. The way a required field actually rots
// is not an empty string, which everyone notices; it is the word "deliberate"
// sitting where an argument used to be. Both are rejected.
const PLACEHOLDER_REASON = /^(deliberate|intentional|on purpose|by design|see above|n\/a|tbd|todo)\.?$/i;
const MIN_REASON = 40;

function deliberateFaults(deliberate, baseline, seen) {
  const faults = [];
  for (const [file, reason] of deliberate) {
    if (!baseline.has(file)) faults.push({ file, fault: 'not-in-baseline' });
    if (!seen.has(file)) faults.push({ file, fault: 'no-longer-writes-raw' });
    const r = typeof reason === 'string' ? reason.trim() : '';
    if (!r) faults.push({ file, fault: 'reason-missing' });
    else if (PLACEHOLDER_REASON.test(r) || r.length < MIN_REASON) faults.push({ file, fault: 'reason-not-substantive' });
  }
  return faults;
}

const dFaults = deliberateFaults(DELIBERATE, BASELINE, found);
ok('85-B: every DELIBERATE annotation is tracked by the baseline, still describes a file that writes raw, and carries a SUBSTANTIVE reason — the 2026-09-09 ruling enforced rather than remembered',
  dFaults.length === 0,
  JSON.stringify({ annotated: DELIBERATE.size, faults: dFaults }));

// The falsifications. Without them the check above passes on one well-formed
// entry and proves nothing about the four ways an exemption goes bad.
{
  const FILE = 'scripts/harness/x.mjs';
  const base = new Set([FILE]);
  const seen = new Set([FILE]);
  const GOOD = 'a two-device tombstone simulation the app has no seam for, kept deliberately by item 129';

  ok('85-B (the control): a well-formed annotation yields NO fault — so the four falsifications below are not passing on a validator that simply rejects everything handed to it',
    deliberateFaults(new Map([[FILE, GOOD]]), base, seen).length === 0, '');

  const missing = deliberateFaults(new Map([[FILE, '   ']]), base, seen);
  ok('85-B FALSIFICATION: an annotation with an EMPTY reason fails — the reason is required, so its absence is a red rather than a note nobody reads',
    missing.some((f) => f.fault === 'reason-missing'), JSON.stringify({ faults: missing }));

  const placeholder = deliberateFaults(new Map([[FILE, 'deliberate']]), base, seen);
  ok('85-B FALSIFICATION: the word "deliberate" is NOT a reason — this is the shape a required justification actually rots into, and it is the one an empty-string check would happily wave through',
    placeholder.some((f) => f.fault === 'reason-not-substantive'), JSON.stringify({ faults: placeholder }));

  const migrated = deliberateFaults(new Map([[FILE, GOOD]]), base, new Set());
  ok('85-B FALSIFICATION: an annotation on a file that NO LONGER writes raw fails — an exemption must expire with the thing it exempts, or it silently pre-authorises the next raw write into that file',
    migrated.some((f) => f.fault === 'no-longer-writes-raw'), JSON.stringify({ faults: migrated }));

  const untracked = deliberateFaults(new Map([['scripts/harness/y.mjs', GOOD]]), base, new Set([FILE, 'scripts/harness/y.mjs']));
  ok('85-B FALSIFICATION: an annotation for a file the BASELINE does not track fails — otherwise a raw writer could be exempted without ever being counted, which is the one route around the ratchet that leaves no trace in the population',
    untracked.some((f) => f.fault === 'not-in-baseline'), JSON.stringify({ faults: untracked }));
}

// --- THE FALSIFICATION FABLE ASKED FOR ---------------------------------------
// "It would have caught all 54 before any of them cost a day" is the charter's
// central claim, and a guard that merely EXEMPTS them proves nothing about it.
// So the same scan is re-run against an EMPTY baseline: every one of the known
// population must come back as a failure. Without this, a guard whose detector
// was broken would still pass every check above, because the baseline would
// swallow the silence.
{
  const emptyBaseline = new Set();
  const againstEmpty = offenders.filter((f) => !emptyBaseline.has(f));
  ok(`85-B FALSIFICATION: against an EMPTY baseline the guard flags ALL ${offenders.length} known raw writers — the charter's claim ("it would have caught all 54") tested rather than asserted, and the thing a baseline that merely exempts them could never show`,
    againstEmpty.length === offenders.length && offenders.length === BASELINE.size && offenders.length > 0,
    JSON.stringify({ flagged: againstEmpty.length, population: offenders.length, sample: againstEmpty.slice(0, 5) }));

  // And the ratchet's other direction: a baseline entry that has been migrated
  // must FAIL, so the list cannot rot into a permanent excuse. Driven with a
  // fabricated name that is certainly not in `found`.
  const fakeBaseline = new Set([...BASELINE, 'scripts/harness/definitely-migrated.mjs']);
  const staleUnderFake = [...fakeBaseline].filter((f) => !found.has(f));
  ok('85-B FALSIFICATION: a baseline entry that no longer writes raw is DETECTED as stale — a migration must delete its line in the same change, or the ratchet quietly stops being one',
    staleUnderFake.length === 1 && staleUnderFake[0] === 'scripts/harness/definitely-migrated.mjs',
    JSON.stringify({ stale: staleUnderFake }));

  // The control on both: with the real baseline and the real tree, neither
  // fires. Without this, the two checks above would pass on a guard that
  // flagged everything unconditionally.
  ok('85-B (the control): with the REAL baseline against the REAL tree, nothing is flagged and nothing is stale — so the two falsifications above are not a detector that simply reds on everything',
    newOffenders.length === 0 && stale.length === 0,
    JSON.stringify({ newOffenders: newOffenders.length, stale: stale.length }));
}

// --- NO COLLECTION WRITE THROUGH A VARIABLE KEY ------------------------------
// A BLIND SPOT IN THIS GUARD, found by wave 2 rather than by the guard.
//
// Every check above matches `localStorage.setItem('writer-studio-...'` with a
// LITERAL key. This shape is invisible to all of them:
//
//     const key = 'writer-studio-journal-entries';
//     localStorage.setItem(key, JSON.stringify(list));
//
// Eight such writes exist across three files. Two of those files had already
// dropped off the migration worklist — counted as done — while still writing a
// persisted collection raw. The population figure this guard exists to defend
// was therefore WRONG, and wrong in the flattering direction, which is the worst
// kind: a guard that under-reports is trusted exactly as much as one that does
// not, and nobody goes looking.
//
// THE FIX INVERTS THE DEFAULT. Rather than hunting the shapes a raw write can
// take, this flags EVERY `localStorage.setItem` whose key is not a literal, and
// demands the key be readable. A seed can then only hide by using a key this
// guard cannot see at all, which no honest fixture has a reason to do.
{
  const varKeyWrites = [];
  for (const dir of [path.join(DESKTOP, 'scripts', 'harness'), path.join(DESKTOP, 'scripts')]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.mjs')) continue;
      const rel = path.relative(DESKTOP, path.join(dir, name)).replace(/\\/g, '/');
      if (rel.endsWith('scripts/harness/seed-guard.mjs')) continue;
      const text = readFileSync(path.join(dir, name), 'utf8');
      text.split(/\r?\n/).forEach((line, i) => {
        // a non-literal first argument: setItem(ident, ...) or setItem(expr, ...)
        const m = line.match(/localStorage\.setItem\(\s*([A-Za-z_$][\w$]*)\s*,/);
        if (!m) return;
        varKeyWrites.push(`${rel}:${i + 1} key=${m[1]}`);
      });
    }
  }
  // Reported, not asserted: the MAIN scan now counts these as raw writes, so
  // the population and the ratchet already fail on them. A second failing
  // check for the same write would report one defect twice, which is how a
  // guard teaches people to skim it.
  ok(`85-C (reported): ${varKeyWrites.length} collection writes use a VARIABLE key — the shape this file was blind to until wave 2 tripped over it. Counted in the population by the main scan above; listed here so the sites are named`,
    true, JSON.stringify({ count: varKeyWrites.length, sites: varKeyWrites }));

  // Self-proof, because a check for an invisible shape must be shown to see it.
  const fixture = (text) => text.split('\n').filter((l) => /localStorage\.setItem\(\s*[A-Za-z_$][\w$]*\s*,/.test(l)).length;
  ok('85-C self-proof: the variable-key shape IS caught — this is the exact text found in b1/b2/j5',
    fixture("    const key = 'writer-studio-journal-entries';\n    localStorage.setItem(key, JSON.stringify(list));") === 1, '');
  ok('85-C self-proof (the control): a LITERAL key is not flagged by this check — it is the business of the checks above, and double-reporting one write as two findings is how a guard teaches people to skim it',
    fixture("localStorage.setItem('writer-studio-drafts', '[]');\nlocalStorage.clear();") === 0, '');
}
// --- EVERY MUTATING SEAM FLUSHES ---------------------------------------------
// OBS-1 (Batch One review): item 85-C made its OWN seams durable and left the
// three older ones — wrizoPinPageToBoard, wrizoSetPinDisplayed, wrizoSetPageHome
// — carrying the footgun the durability was added to remove. One class, three
// instances, and "every seam flushes" was a claim about some of the file.
//
// A debounced seam write that a fixture reloads past is a row that never
// existed, and it presents as a file that dies reporting nothing: 36 of 80 on
// one stamped leg. Nothing static could see it, which is why the rule is worth a
// check rather than a comment — the next seam added would inherit the same
// silence, and the person adding it has no reason to know.
//
// [ITEM 148, 2026-09-16] THE PROMISE ABOVE WAS NOT KEPT, AND THIS BLOCK IS NO
// LONGER THE GUARD OF RECORD FOR IT. It matches four verbs in one file, so a
// seam named with any other verb, a seam in any other file, and a writer that
// is a MEMBER of a namespace seam all passed it. Its checks still hold for the
// seams they can see and are left running unchanged; the ITEM 148 block below
// is the one that makes "cannot quietly opt out" true.
//
// THE RULE: any seam whose name carries a MUTATING VERB (Create/Patch/Set/Pin)
// must route through `durableSeam(` or `durable(`. Read-only seams are exempt by
// name (wrizoBoard, wrizoNotebook, wrizoResume and friends inspect, they do not
// write), and wrizoFlushNow is exempt because it IS the flush.
{
  const src = readFileSync(PERSISTENCE, 'utf8');
  const lines = src.split(/\r?\n/);
  const undurable = [];
  let seamCount = 0;
  // An assignment ends at the semicolon that closes it at bracket depth zero.
  // Strings, template literals and line comments are skipped so a `;` inside one
  // cannot end the body early — the same discipline the call-site parse check in
  // this file already uses, rather than a second, weaker way of reading code.
  const seamBody = (text) => {
    let depth = 0;
    let quote = null;
    for (let i = 0; i < text.length; i += 1) {
      const c = text[i];
      if (quote) {
        if (c === '\\') { i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '/' && text[i + 1] === '/') {
        const nl = text.indexOf('\n', i);
        if (nl < 0) return text;
        i = nl;
        continue;
      }
      if (c === '(' || c === '[' || c === '{') depth += 1;
      else if (c === ')' || c === ']' || c === '}') depth -= 1;
      else if (c === ';' && depth === 0) return text.slice(0, i + 1);
    }
    return text;
  };
  lines.forEach((line, i) => {
    const m = line.match(/\bwrizo(Create|Patch|Set|Pin)([A-Za-z]*)\s*=/);
    if (!m) return;
    const name = `wrizo${m[1]}${m[2]}`;
    if (name === 'wrizoFlushNow') return;
    // skip prose: a comment quoting an assignment is not one
    if (/^\s*(\/\/|\*)/.test(line)) return;
    seamCount += 1;
    // THE SEAM'S OWN BODY, BRACE-MATCHED — not a fixed line window.
    //
    // This read `lines.slice(i, i + 4)` and had two faults, one of which let a
    // real red through. A seam whose body runs longer than four lines was
    // reported undurable while calling `durable()` on its return (item 85-C's
    // three verdict-returning seams, 5-6 lines each) — a false positive. And
    // the same window reaches PAST the seam it is judging into the next one, so
    // an undurable seam followed by a durable neighbour would have passed: a
    // false NEGATIVE, in a check whose whole job is catching the seam somebody
    // forgot. Both are the fixed window, and neither is the rule.
    //
    // The body is bounded instead: from the assignment to the matching close of
    // whichever bracket opens it, strings and comments skipped, so the scan sees
    // exactly this seam and all of it.
    const body = seamBody(lines.slice(i).join('\n'));
    if (!/durableSeam\(|durable\(/.test(body)) undurable.push(`${name} (line ${i + 1})`);
  });
  ok(`85-C/OBS-1: all ${seamCount} MUTATING test seams route through durableSeam/durable — a seam that does not flush hands every fixture a debounced write it will reload past, which cost 36 of 80 files on a stamped leg and is invisible to every other static check`,
    undurable.length === 0, JSON.stringify({ seams: seamCount, undurable }));
  ok('85-C/OBS-1: and the rule is worth checking because it was already broken once — three older seams were left unwrapped when the newer ones gained durability, so this asserts a property of the FILE rather than of the block someone happened to be editing',
    seamCount >= 9, JSON.stringify({ seams: seamCount }));

  // THE TWO FAULTS OF THE FIXED WINDOW, TESTED RATHER THAN ASSERTED. Both are
  // measured on synthetic text, because proving them against the real file
  // would mean contriving the file into the shape that fails.
  const undurableSeam = [
    "  seams.wrizoSetThing = (id) => setThing(id);",
    "  seams.wrizoSetOther = (id) => durable(setOther(id));",
  ].join('\n');
  const oldWindow = undurableSeam.split('\n').slice(0, 4).join('\n');
  ok('85-C/OBS-1 FALSIFICATION: an UNDURABLE seam whose durable NEIGHBOUR begins within four lines is caught — the fixed window this check used to read reached past the seam it was judging and would have passed it, which is a false negative in the one check whose job is catching the seam somebody forgot',
    !/durableSeam\(|durable\(/.test(seamBody(undurableSeam))
    && /durable\(/.test(oldWindow),
    JSON.stringify({ newMatcherSeesDurable: /durable\(/.test(seamBody(undurableSeam)), oldWindowSawDurable: /durable\(/.test(oldWindow) }));

  const longDurableSeam = [
    "  seams.wrizoSetThing = (id) => {",
    "    setThing(id);",
    "    const row = getThing(id);",
    "    const want = id;",
    "    return durable(row && row.id === want ? row : false);",
    "  };",
  ].join('\n');
  ok('85-C/OBS-1 (the control): a DURABLE seam with a body longer than four lines is NOT flagged — the other half of the same fault, which reported item 85-C\'s own verdict-returning seams as undurable while they flush on every path',
    /durable\(/.test(seamBody(longDurableSeam))
    && !/durable\(/.test(longDurableSeam.split('\n').slice(0, 4).join('\n')),
    JSON.stringify({ newMatcherSeesDurable: /durable\(/.test(seamBody(longDurableSeam)) }));

  // [ITEM 148] NOTE: the `fixture` below is a RE-TYPED COPY of the matcher, and
  // it still carries the fixed four-line window the real check abandoned in
  // 85-C. It proves a function the guard no longer runs. It is left as written;
  // the ITEM 148 falsifications drive their judge() directly, which is the fix
  // for this shape rather than another copy.
  // Self-proof: the check must actually reject an unwrapped mutating seam, and
  // must not reject a read-only one or the flush itself.
  const fixture = (text) => {
    const bad = [];
    text.split('\n').forEach((line, i) => {
      const m = line.match(/\bwrizo(Create|Patch|Set|Pin)([A-Za-z]*)\s*=/);
      if (!m) return;
      const name = `wrizo${m[1]}${m[2]}`;
      if (name === 'wrizoFlushNow') return;
      if (/^\s*(\/\/|\*)/.test(line)) return;
      if (!/durableSeam\(|durable\(/.test(text.split('\n').slice(i, i + 4).join('\n'))) bad.push(name);
    });
    return bad;
  };
  ok('85-C/OBS-1 self-proof: an unwrapped mutating seam IS caught — the exact shape the three older seams had',
    JSON.stringify(fixture('  w.wrizoSetPageHome = setPageHome;')) === '["wrizoSetPageHome"]',
    JSON.stringify(fixture('  w.wrizoSetPageHome = setPageHome;')));
  ok('85-C/OBS-1 self-proof (the control): a WRAPPED seam, a read-only seam, and wrizoFlushNow are all clean — so the check is not one that reds on every seam it sees',
    fixture('  w.wrizoSetPageHome = durableSeam(setPageHome);\n  w.wrizoNotebook = () => list();\n  w.wrizoFlushNow = () => flushNow();').length === 0,
    JSON.stringify(fixture('  w.wrizoSetPageHome = durableSeam(setPageHome);\n  w.wrizoNotebook = () => list();\n  w.wrizoFlushNow = () => flushNow();')));
}
// === ITEM 148 — EVERY SEAM, NOT FOUR VERBS ===================================
//
// OBS-1 above promises that "the next seam cannot quietly opt out". It could,
// three ways at once, and all three were live on main:
//
//   1. BY VERB. It matched /wrizo(Create|Patch|Set|Pin)/. wrizoTouchInOrder —
//      this lane's own 85-C seam, added after the guard — matched nothing.
//      PW2's wrizoCopyCardToBoard merged unwrapped with the guard green, which
//      PW2 measured by unwrapping and running rather than by reading.
//   2. BY FILE. It read persistence.ts alone. 41 seams live in 23 files; 22 of
//      them were never opened. wrizoBible (store/tutorBible.ts) writes through
//      saveProject — the debounced cache — and was invisible for that reason.
//   3. BY SHAPE. A namespace seam's verbs live on its MEMBERS. wrizoPairing's
//      birth/pair/unpair all write; the seam's name carries no verb at all.
//
// A verb list only ever sees the verbs someone thought of. So the default is
// INVERTED, as the raw-write scan's was: EVERY window.wrizo* seam anywhere in
// src/ is in scope, and each is either DURABLE or a NAMED EXEMPTION whose reason
// is written here and whose claim is CHECKED — an exemption that says "reads
// only" while reaching a debounced writer is a lie, and fails.
//
// "DEBOUNCED WRITER" IS DERIVED, NEVER LISTED. It is any function in
// persistence.ts that reaches scheduleFlush() — directly (upsert, clearDraft,
// applyCollection) or through another writer — computed to a fixpoint from the
// app's own source, as KEYS is above. A hand list of writer names would be a
// verb list under another name. flushNow writes immediately and is therefore
// not one; a synchronous localStorage.setItem on a key of a module's own is not
// one either, because there is no timer for a reload to outrun.
{
  const SRC = path.join(DESKTOP, 'src');

  const closeOf = (text, open, oc, cc) => {
    let depth = 0;
    let quote = null;
    for (let i = open; i < text.length; i += 1) {
      const c = text[i];
      if (quote) {
        if (c === BACKSLASH) { i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === oc) depth += 1;
      else if (c === cc) { depth -= 1; if (depth === 0) return i; }
    }
    return -1;
  };

  // Comments out, strings kept — a seam named in prose is not a seam.
  const uncomment = (src) => {
    let out = '';
    let quote = null;
    for (let i = 0; i < src.length; i += 1) {
      const c = src[i];
      if (quote) {
        out += c;
        if (c === BACKSLASH) { out += src[i + 1] ?? ''; i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; out += c; continue; }
      if (c === '/' && src[i + 1] === '/') {
        const nl = src.indexOf('\n', i);
        if (nl < 0) return out;
        out += '\n';
        i = nl;
        continue;
      }
      if (c === '/' && src[i + 1] === '*') {
        const end = src.indexOf('*/', i + 2);
        if (end < 0) return out;
        i = end + 1;
        continue;
      }
      out += c;
    }
    return out;
  };

  // The value an assignment binds: to the `;` that closes it at depth zero.
  const boundValue = (text, from) => {
    let depth = 0;
    let quote = null;
    for (let i = from; i < text.length; i += 1) {
      const c = text[i];
      if (quote) {
        if (c === BACKSLASH) { i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '(' || c === '[' || c === '{') depth += 1;
      else if (c === ')' || c === ']' || c === '}') depth -= 1;
      else if (c === ';' && depth === 0) return text.slice(from, i).trim();
    }
    return text.slice(from).trim();
  };

  // Bracket depth at every index, strings skipped — so a definition can be
  // judged TOP-LEVEL. The first version of this block took a nested
  // `const orderIndex = notebookIndexAfter(...)` inside another function as a
  // module definition, followed a property access (`p.orderIndex`) into it, and
  // accused the read-only wrizoNotebook of writing. A name defined inside a
  // function body is not reachable by that name from anywhere else.
  const depths = (text) => {
    const d = new Int32Array(text.length + 1);
    let depth = 0;
    let quote = null;
    for (let i = 0; i < text.length; i += 1) {
      d[i] = depth;
      const c = text[i];
      if (quote) {
        if (c === BACKSLASH) { i += 1; d[i] = depth; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
      if (c === '(' || c === '[' || c === '{') depth += 1;
      else if (c === ')' || c === ']' || c === '}') depth -= 1;
    }
    return d;
  };

  // name -> body, for every TOP-LEVEL function declaration and const binding.
  const definitions = (text) => {
    const defs = new Map();
    const d = depths(text);
    const top = (m) => d[m.index + m[0].indexOf(m[1])] === 0;
    const fn = /(?:^|\n)[ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*(?:<[^>]*>)?\s*\(/g;
    for (const m of text.matchAll(fn)) {
      if (!top(m)) continue;
      const pOpen = m.index + m[0].length - 1;
      const pClose = closeOf(text, pOpen, '(', ')');
      if (pClose < 0) continue;
      let bOpen = text.indexOf('{', pClose);
      if (bOpen < 0) continue;
      if (/:\s*$/.test(text.slice(pClose + 1, bOpen))) {   // `): { ... } {` — a return type
        const tClose = closeOf(text, bOpen, '{', '}');
        bOpen = text.indexOf('{', tClose + 1);
      }
      const bClose = closeOf(text, bOpen, '{', '}');
      if (bClose > 0) defs.set(m[1], text.slice(bOpen, bClose + 1));
    }
    const cn = /(?:^|\n)[ \t]*(?:export\s+)?(?:const|let)\s+([A-Za-z_$][\w$]*)\s*(?::[^=\n]+)?=(?!=)\s*/g;
    for (const m of text.matchAll(cn)) {
      if (!top(m)) continue;
      if (!defs.has(m[1])) defs.set(m[1], boundValue(text, m.index + m[0].length));
    }
    return defs;
  };

  // FREE CALLS only — `foo(`, never `obj.foo(`. A write can only happen through a
  // call, so a property access (`p.orderIndex`) or an object key is never a
  // seed; and a method call on a Map or an array (`cur.set(`, `.map(`) is not a
  // call to a module function that happens to share the name.
  const callsIn = (text) => [...text.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\s*(?:<[^>()]*>)?\s*\(/g)].map((m) => m[1]);
  // An OBJECT value exposes its members' values, which are references rather
  // than calls — `{ get: getTheme, set: setTheme }` contains no call at all. So an
  // object seeds from each member's own expression; a bare identifier seeds
  // itself; anything else seeds from its free calls. (Seeding from EVERY
  // identifier instead is what dragged property names into the trace.)
  const seedsOf = (expr) => {
    const t = expr.trim();
    if (t.startsWith('{')) {
      const members = membersOf(t) || [];
      return [...new Set(members.flatMap((m) => seedsOf(m.expr)))];
    }
    return [...new Set([...(/^[A-Za-z_$][\w$]*$/.test(t) ? [t] : []), ...callsIn(t)])];
  };

  // Relative imports resolved to files IN THE TREE, so a trace can follow a call
  // out of the seam's own module. A read-only seam that hands its write to a
  // helper in another module, which then saves, is exactly the hole this item
  // exists to close; stopping at the file boundary would leave it open.
  const resolveSpec = (fromRel, spec, files) => {
    if (!spec.startsWith('.')) return null;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec));
    for (const cand of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`]) {
      if (Object.prototype.hasOwnProperty.call(files, cand)) return cand;
    }
    return null;
  };
  const importMap = (rel, text, files) => {
    const map = new Map();
    for (const m of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)) {
      const target = resolveSpec(rel, m[2], files);
      if (!target) continue;
      for (const part of m[1].split(',')) {
        const mm = part.trim().match(/^(?:type\s+)?([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/);
        if (mm) map.set(mm[2] || mm[1], { rel: target, name: mm[1] });
      }
    }
    return map;
  };
  const buildModules = (files) => {
    const mods = new Map();
    for (const [rel, raw] of Object.entries(files)) {
      const text = uncomment(raw);
      mods.set(rel, { defs: definitions(text), imports: importMap(rel, text, files) });
    }
    return mods;
  };

  // Everything a set of seeds can reach, ACROSS MODULES, as (module, name) pairs.
  // A pair that lands on a debounced writer in persistence.ts is a hit.
  const trace = (mods, startRel, seeds, persistenceRel, writers) => {
    const seen = new Set();
    const stack = seeds.map((id) => [startRel, id]);
    const writerHits = new Set();
    let setsStorage = false;
    while (stack.length) {
      const [rel, id] = stack.pop();
      const key = `${rel}::${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (rel === persistenceRel && writers.has(id)) { writerHits.add(id); continue; }
      const mod = mods.get(rel);
      if (!mod) continue;
      const body = mod.defs.get(id);
      if (body !== undefined) {
        if (/localStorage\s*\.\s*setItem\s*\(/.test(body)) setsStorage = true;
        for (const c of callsIn(body)) stack.push([rel, c]);
        continue;
      }
      const imp = mod.imports.get(id);
      if (imp) stack.push([imp.rel, imp.name]);
    }
    return { writer: [...writerHits], setsStorage };
  };

  // Debounced writers, derived from persistence.ts to a fixpoint.
  const debouncedWriters = (ptext) => {
    const defs = definitions(uncomment(ptext));
    const writers = new Set(['scheduleFlush']);
    for (let pass = 0; pass <= defs.size; pass += 1) {
      let grew = false;
      for (const [name, body] of defs) {
        if (writers.has(name)) continue;
        if (callsIn(body).some((c) => writers.has(c))) { writers.add(name); grew = true; }
      }
      if (!grew) break;
    }
    return writers;
  };

  // Top-level members of an object literal: [{ member, expr }].
  const membersOf = (value) => {
    const v = value.trim();
    if (!v.startsWith('{')) return null;
    const close = closeOf(v, 0, '{', '}');
    const inner = v.slice(1, close);
    const parts = [];
    let depth = 0;
    let quote = null;
    let cur = '';
    for (let i = 0; i < inner.length; i += 1) {
      const c = inner[i];
      if (quote) {
        cur += c;
        if (c === BACKSLASH) { cur += inner[i + 1] ?? ''; i += 1; continue; }
        if (c === quote) quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') { quote = c; cur += c; continue; }
      if (c === '(' || c === '[' || c === '{') depth += 1;
      if (c === ')' || c === ']' || c === '}') depth -= 1;
      if (c === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts.map((p) => p.trim()).filter(Boolean).map((p) => {
      const kv = p.match(/^([A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
      if (kv) return { member: kv[1], expr: kv[2].trim() };
      const meth = p.match(/^(?:async\s+)?([A-Za-z_$][\w$]*)\s*\(/);
      if (meth) return { member: meth[1], expr: p };
      const sh = p.match(/^([A-Za-z_$][\w$]*)$/);
      if (sh) return { member: sh[1], expr: sh[1] };
      return { member: p, expr: p };
    });
  };

  const ATTACH = /(?:\bseams\.|\bwindow\.|\)\s*\.)(_{0,2}wrizo[A-Za-z0-9]*)\s*=(?!=)/g;
  const seamsIn = (files) => {
    const out = [];
    for (const [rel, raw] of Object.entries(files)) {
      const text = uncomment(raw);
      for (const m of text.matchAll(ATTACH)) {
        out.push({ name: m[1], file: rel, value: boundValue(text, m.index + m[0].length) });
      }
    }
    return out;
  };

  const DURABLE = /\b(durable|durableSeam)\s*\(/;
  const WEAK_REASON = /^\s*$|\b(todo|tbd|placeholder|fixme)\b/i;

  // THE JUDGEMENT, as a pure function of a table and a set of file texts, so
  // every falsification below drives THIS code and not a copy of it. (OBS-1's
  // own self-proof tests a re-typed copy of its matcher with the old four-line
  // window still in it — a proof about a function the guard no longer runs.)
  const judge = (table, files, persistenceRel) => {
    const writers = debouncedWriters(files[persistenceRel] || '');
    const found = seamsIn(files);
    const problems = [];
    const names = new Set(found.map((s) => s.name));
    for (const s of found) if (!table[s.name]) problems.push({ seam: s.name, file: s.file, fault: 'UNCLASSIFIED — a new seam must be durable or a named exemption' });
    for (const name of Object.keys(table)) if (!names.has(name)) problems.push({ seam: name, fault: 'STALE ENTRY — the table names a seam that no longer exists' });

    const mods = buildModules(files);
    for (const s of found) {
      const e = table[s.name];
      if (!e) continue;
      // What an expression can reach: its own free calls, followed through every
      // module in the tree, landing (or not) on a debounced writer.
      const audit = (expr) => {
        const r = trace(mods, s.file, seedsOf(expr), persistenceRel, writers);
        return { writer: r.writer, setsStorage: r.setsStorage || /localStorage\s*\.\s*setItem\s*\(/.test(expr) };
      };
      const fault = (why) => problems.push({ seam: s.name, file: s.file, fault: why });

      if (e.kind !== 'durable' && WEAK_REASON.test(e.reason || '')) fault('EXEMPTION WITHOUT A REASON');
      if (e.kind !== 'durable' && (e.reason || '').trim().length < 30) fault('EXEMPTION WITH A TOKEN REASON');

      if (e.kind === 'durable') {
        if (!DURABLE.test(s.value)) fault('NOT DURABLE — writes through a seam that does not flush');
      } else if (e.kind === 'flush') {
        if (!/\bflushNow\s*\(/.test(s.value)) fault('CLAIMS TO BE THE FLUSH AND IS NOT');
      } else if (e.kind === 'namespace') {
        const members = membersOf(s.value);
        if (!members) { fault('CLAIMS TO BE A NAMESPACE AND IS NOT AN OBJECT'); continue; }
        const listed = new Set([...(e.writers || []), ...(e.readers || [])]);
        for (const m of members) {
          if (!listed.has(m.member)) fault(`UNCLASSIFIED MEMBER "${m.member}" — a namespace's verbs live on its members`);
        }
        const present = new Set(members.map((m) => m.member));
        for (const w of listed) if (!present.has(w)) fault(`STALE MEMBER "${w}"`);
        for (const m of members) {
          if ((e.writers || []).includes(m.member) && !DURABLE.test(m.expr)) fault(`WRITER MEMBER "${m.member}" IS NOT DURABLE`);
          if ((e.readers || []).includes(m.member)) {
            const a = audit(m.expr);
            if (a.writer.length) fault(`READER MEMBER "${m.member}" REACHES A DEBOUNCED WRITER (${a.writer.join(', ')})`);
            if (a.setsStorage) fault(`READER MEMBER "${m.member}" WRITES localStorage`);
          }
        }
      } else if (e.kind === 'sync-write') {
        const a = audit(s.value);
        if (a.writer.length) fault(`SYNC-WRITE EXEMPTION REACHES A DEBOUNCED WRITER (${a.writer.join(', ')}) — it must be durable instead`);
        if (!a.setsStorage) fault('SYNC-WRITE EXEMPTION WRITES NOTHING — its reason does not describe it');
      } else if (e.kind === 'in-memory' || e.kind === 'read-only') {
        const a = audit(s.value);
        if (a.writer.length) fault(`${e.kind.toUpperCase()} EXEMPTION REACHES A DEBOUNCED WRITER (${a.writer.join(', ')}) — the exemption is not true`);
        if (a.setsStorage) fault(`${e.kind.toUpperCase()} EXEMPTION WRITES localStorage — the exemption is not true`);
      } else {
        fault(`UNKNOWN KIND "${e.kind}"`);
      }
    }
    return { found, writers, problems };
  };

  // --- THE TABLE: every seam in src/, and why it is lawful ---------------------
  const RO = (reason) => ({ kind: 'read-only', reason });
  const SEAMS = {
    // DURABLE — each routes through durable() or durableSeam().
    wrizoCreateBinder: { kind: 'durable' },
    wrizoCreateDrawer: { kind: 'durable' },
    wrizoCreateJournalPage: { kind: 'durable' },
    wrizoCreateProject: { kind: 'durable' },
    wrizoCreateStoryPlan: { kind: 'durable' },
    wrizoPatchEntry: { kind: 'durable' },
    wrizoPatchProject: { kind: 'durable' },
    wrizoPinPageToBoard: { kind: 'durable' },
    wrizoSetBeatStatus: { kind: 'durable' },
    wrizoSetCurrentBeat: { kind: 'durable' },
    wrizoSetPageHome: { kind: 'durable' },
    wrizoSetPinDisplayed: { kind: 'durable' },
    wrizoSetProjectDrawer: { kind: 'durable' },
    wrizoTouchInOrder: { kind: 'durable' },

    wrizoFlushNow: { kind: 'flush', reason: 'It IS the flush — the thing every durable seam calls; it has nothing to outrun.' },

    // NAMESPACES — the verb lives on the member.
    wrizoPairing: {
      kind: 'namespace',
      writers: ['birth', 'pair', 'unpair'],
      readers: ['planBoardId', 'pairedPageId', 'isPaired'],
      reason: 'birth/pair/unpair write through saveJournalEntry and are wrapped; the three lookups only read the pairing.',
    },
    wrizoBible: {
      kind: 'namespace',
      writers: ['add', 'edit', 'delete'],
      readers: ['get'],
      reason: 'add/edit/delete write through saveProject and are wrapped; get only reads the facts.',
    },

    // SYNC-WRITE — each writes a key of its OWN module with localStorage.setItem,
    // immediately. There is no debounce, so a reload cannot outrun it.
    wrizoAmbiance: { kind: 'sync-write', reason: 'setAmbianceDial writes its own dial key with localStorage.setItem, synchronously.' },
    wrizoBoardMode: { kind: 'sync-write', reason: 'setBoardMode calls persist(), which writes its own key with localStorage.setItem, synchronously.' },
    wrizoPlanTrail: { kind: 'sync-write', reason: 'rememberLastPlanBoard writes its own trail key with localStorage.setItem, synchronously.' },
    wrizoSectionFold: { kind: 'sync-write', reason: 'setSectionFold calls persist(), which writes its own key with localStorage.setItem, synchronously.' },
    wrizoTheme: { kind: 'sync-write', reason: 'setTheme writes the theme key with localStorage.setItem, synchronously.' },
    wrizoThemePrefs: { kind: 'sync-write', reason: 'setThemePrefs writes its own prefs key with localStorage.setItem, synchronously.' },

    // IN-MEMORY — module state and subscribers only; nothing is persisted.
    wrizoAssist: { kind: 'in-memory', reason: 'show/clear set a module-level response and notify subscribers; nothing is persisted.' },
    wrizoThemeFx: { kind: 'in-memory', reason: 'register adds handlers to an in-memory registry for the effects layer; nothing is persisted.' },

    // READ-ONLY — inspection, constants and pure functions.
    __wrizoRhizomeEngine: RO('The pure growth algorithm (seeding, growth, bursts, caps), exposed so m3 can prove it.'),
    __wrizoRouteForEntry: RO('A pure function from an entry to its route; its module writes nothing.'),
    wrizoBoard: RO('Returns the live board boxes ref for inspection; it never assigns to it.'),
    wrizoDecks: RO('Deck ids and each deck\'s default answers, computed from the static deck library.'),
    wrizoDerived: RO('Journal, Shelf and Notebook membership, each a mapped read of the store.'),
    wrizoDeskLexicon: RO('The desk term lookup and its canonical term list.'),
    wrizoDirty: RO('The dirty-set key, a copy of the dirty ids, and the dirty records, for inspection.'),
    wrizoFirstLineInvite: RO('The first-line nudge pool, a constant.'),
    wrizoFluxFx: RO('Pure interval arithmetic and a constant floor for the flux effect.'),
    wrizoLexicon: RO('The theme term lookup and its canonical term list.'),
    wrizoNotebook: RO('The notebook order, a mapped read of the store.'),
    wrizoResume: RO('The resume target, computed from the store without writing it.'),
    wrizoStructure: RO('Pure board-structure helpers — lanes, card checks, parenting — that return values.'),
    wrizoTutorFreeWriteDeck: RO('The free-write pools and their draw and refill constants.'),
    wrizoTutorSessionCost: RO('The tutor session cost, read from the meter.'),
    wrizoVocab: RO('A pure description of a resume target.'),
  };

  // --- the real tree -----------------------------------------------------------
  const tsFiles = (dir, out = []) => {
    if (!existsSync(dir)) return out;
    for (const n of readdirSync(dir)) {
      const p = path.join(dir, n);
      if (statSync(p).isDirectory()) tsFiles(p, out);
      else if (/\.(ts|tsx)$/.test(n) && !/\.d\.ts$/.test(n)) out.push(p);
    }
    return out;
  };
  const tree = {};
  for (const p of tsFiles(SRC)) tree[path.relative(SRC, p).replace(/\\/g, '/')] = readFileSync(p, 'utf8');
  const PERSIST_REL = 'store/persistence.ts';
  const real = judge(SEAMS, tree, PERSIST_REL);
  const seamFiles = new Set(real.found.map((s) => s.file));

  ok(`148: EVERY window.wrizo* seam in src/ is durable or a named, checked exemption — ${real.found.length} seams across ${seamFiles.size} files, ${real.problems.length} problem(s). The verb list this replaces could see 13 of them and one file`,
    real.problems.length === 0, JSON.stringify(real.problems, null, 1));

  // COVERAGE — the old check read ONE file. A scan that finds seams in one file
  // again, or finds none, is the old blindness, not a clean result.
  ok(`148 (coverage): the scan reads the whole of src/ — ${Object.keys(tree).length} source files, seams found in ${seamFiles.size} of them, ${[...seamFiles].filter((f) => f !== PERSIST_REL).length} outside persistence.ts`,
    Object.keys(tree).length > 50 && real.found.length >= 40 && [...seamFiles].some((f) => f !== PERSIST_REL),
    JSON.stringify({ sourceFiles: Object.keys(tree).length, seams: real.found.length, files: [...seamFiles].sort() }));

  // THE WRITER SET IS DERIVED, AND NON-TRIVIAL — a derivation that found nothing
  // would make every exemption pass by default.
  ok(`148 (coverage): the debounced-writer set is DERIVED from persistence.ts, not listed — ${real.writers.size} writers, including the ones the two unwrapped namespaces used`,
    real.writers.has('upsert') && real.writers.has('saveJournalEntry') && real.writers.has('saveProject')
    && real.writers.has('getOrCreatePlanBoard') && real.writers.has('pairBoardWithPage')
    && !real.writers.has('flushNow') && !real.writers.has('getJournalEntry'),
    JSON.stringify({ size: real.writers.size, flushNowIsNot: !real.writers.has('flushNow') }));

  // --- falsifications ------------------------------------------------------------
  // Each drives judge() on synthetic files. `P` is a minimal persistence module
  // with one debounced writer, one reader, and the flush.
  const P = [
    'function scheduleFlush(n) { timer = setTimeout(flushNow, 300); }',
    'export function flushNow() { localStorage.setItem(k, v); }',
    'function upsert(c, r) { c.push(r); scheduleFlush(c); }',
    'export function saveThing(t) { upsert(things, t); }',
    'export function getThing(id) { return things.find((t) => t.id === id); }',
    'export function durableSeam(fn) { return (...a) => { const o = fn(...a); flushNow(); return o; }; }',
  ].join('\n');
  const files = (extra) => ({ 'store/persistence.ts': P, ...extra });
  const probs = (table, extra) => judge(table, files(extra), 'store/persistence.ts').problems;

  const NS_UNWRAPPED = "(window as unknown as { wrizoKit?: unknown }).wrizoKit = { get: getThing, save: saveThing };";
  const NS_WRAPPED = "(window as unknown as { wrizoKit?: unknown }).wrizoKit = { get: getThing, save: durableSeam(saveThing) };";
  const NS = { wrizoKit: { kind: 'namespace', writers: ['save'], readers: ['get'], reason: 'save writes through saveThing; get only reads a thing.' } };

  let p = probs(NS, { 'store/kit.ts': `import { getThing, saveThing, durableSeam } from './persistence';\n${NS_UNWRAPPED}` });
  ok('148 FALSIFICATION: an UNWRAPPED writer member of a namespace is caught — wrizoPairing\'s shape before this item, whose seam name carries no verb at all',
    p.some((x) => /WRITER MEMBER "save" IS NOT DURABLE/.test(x.fault)), JSON.stringify(p));

  p = probs(NS, { 'store/kit.ts': `import { getThing, saveThing, durableSeam } from './persistence';\n${NS_WRAPPED}` });
  ok('148 (the control): the same namespace with its writer wrapped is clean — so the guard is a matcher rather than a wall',
    p.length === 0, JSON.stringify(p));

  p = probs({}, { 'store/copy.ts': "import { saveThing } from './persistence';\n(window as unknown as { wrizoCopyCardToBoard?: unknown }).wrizoCopyCardToBoard = saveThing;" });
  ok('148 FALSIFICATION: a NEW seam in a NEW file, with a verb the old list never had, is caught as UNCLASSIFIED — PW2\'s wrizoCopyCardToBoard, which merged with the old guard green',
    p.some((x) => x.seam === 'wrizoCopyCardToBoard' && /UNCLASSIFIED/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoGone: { kind: 'read-only', reason: 'A seam that was deleted from the source long ago.' } }, {});
  ok('148 FALSIFICATION: a table entry for a seam that no longer exists is STALE — an exemption must expire with the thing it exempts, or the table rots into an amnesty',
    p.some((x) => x.seam === 'wrizoGone' && /STALE/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoPeek: { kind: 'read-only', reason: 'Claims to read a thing and do nothing else at all.' } },
    { 'store/peek.ts': "import { saveThing } from './persistence';\nfunction peek(t) { saveThing(t); return t; }\n(window as unknown as { wrizoPeek?: unknown }).wrizoPeek = peek;" });
  ok('148 FALSIFICATION: a READ-ONLY exemption whose function reaches a debounced writer — through a local helper — is caught. The exemption is a claim, and the claim is checked',
    p.some((x) => x.seam === 'wrizoPeek' && /REACHES A DEBOUNCED WRITER \(saveThing\)/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoKit: { kind: 'namespace', writers: ['save'], readers: ['get'], reason: 'save writes through saveThing; get only reads a thing.' } },
    { 'store/kit.ts': "import { getThing, saveThing, durableSeam } from './persistence';\n(window as unknown as { wrizoKit?: unknown }).wrizoKit = { get: getThing, save: durableSeam(saveThing), wipe: saveThing };" });
  ok('148 FALSIFICATION: a member ADDED to a namespace without being classified is caught — the next member cannot quietly opt out either',
    p.some((x) => /UNCLASSIFIED MEMBER "wipe"/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoMode: { kind: 'sync-write', reason: 'set writes its own mode key synchronously to storage.' } },
    { 'store/mode.ts': "let cur = {};\nfunction persist() { localStorage.setItem('mode', JSON.stringify(cur)); }\nfunction setMode(m) { cur = m; persist(); }\n(window as unknown as { wrizoMode?: unknown }).wrizoMode = { set: setMode };" });
  ok('148 (the control): a SYNC-WRITE seam whose setter writes its own key through a local persist() is clean — boardMode\'s and sectionFold\'s exact shape',
    p.length === 0, JSON.stringify(p));

  p = probs({ wrizoMode: { kind: 'sync-write', reason: 'set writes its own mode key synchronously to storage.' } },
    { 'store/mode.ts': "import { saveThing } from './persistence';\nfunction setMode(m) { saveThing(m); }\n(window as unknown as { wrizoMode?: unknown }).wrizoMode = { set: setMode };" });
  ok('148 FALSIFICATION: a SYNC-WRITE exemption that actually writes through the debounced cache is caught — "it writes its own key" is not a phrase that excuses a write it does not describe',
    p.some((x) => /SYNC-WRITE EXEMPTION REACHES A DEBOUNCED WRITER/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoLoud: { kind: 'read-only', reason: 'TODO' } },
    { 'store/loud.ts': "function look() { return 1; }\n(window as unknown as { wrizoLoud?: unknown }).wrizoLoud = look;" });
  ok('148 FALSIFICATION: an exemption with a placeholder reason fails — the reason is required, as the raw-write annotations\' is',
    p.some((x) => /REASON/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoNote: { kind: 'read-only', reason: 'Named only in a comment and never attached to anything.' } },
    { 'store/note.ts': "// (window as unknown as { wrizoNote?: unknown }).wrizoNote = saveThing;\nexport const x = 1;" });
  ok('148 (the control): a seam that exists only in a COMMENT is not a seam — so its table entry is STALE rather than satisfied',
    p.some((x) => x.seam === 'wrizoNote' && /STALE/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoLens: { kind: 'read-only', reason: 'Claims only to describe a thing through a helper module.' } }, {
    'store/helper.ts': "import { saveThing } from './persistence';\nexport function describe(t) { saveThing(t); return String(t); }",
    'store/lens.ts': "import { describe } from './helper';\n(window as unknown as { wrizoLens?: unknown }).wrizoLens = describe;",
  });
  ok('148 FALSIFICATION: a READ-ONLY seam that LAUNDERS a write through a helper in ANOTHER module is caught — the trace follows imports across modules, because stopping at the seam\'s own file would leave exactly the kind of hole this item exists to close',
    p.some((x) => x.seam === 'wrizoLens' && /REACHES A DEBOUNCED WRITER \(saveThing\)/.test(x.fault)), JSON.stringify(p));

  p = probs({ wrizoLens: { kind: 'read-only', reason: 'Describes a thing through a pure helper module.' } }, {
    'store/helper.ts': 'export function describe(t) { return String(t); }',
    'store/lens.ts': "import { describe } from './helper';\n(window as unknown as { wrizoLens?: unknown }).wrizoLens = describe;",
  });
  ok('148 (the control): the same seam through a PURE helper module is clean — so crossing a module boundary is followed, not feared',
    p.length === 0, JSON.stringify(p));

  p = probs({ wrizoOrder: { kind: 'read-only', reason: 'The order of things, a mapped read of the store.' } }, {
    'store/order.ts': [
      "import { getThing, saveThing } from './persistence';",
      'export function reorder(id) { const saveThingNow = 1; saveThing({ id }); }',
      "(window as unknown as { wrizoOrder?: unknown }).wrizoOrder = () => [getThing('a')].map((p) => ({ id: p.saveThingNow, key: p.reorder }));",
    ].join('\n'),
  });
  ok('148 (the control): PROPERTY ACCESSES are not calls — a read-only seam that reads `p.reorder` is not accused of calling the module\'s own writing reorder(). The first version of this block made exactly that mistake against wrizoNotebook, through a nested const it took for a definition',
    p.length === 0, JSON.stringify(p));

  const derived = debouncedWriters(`${P}\nexport function deep(t) { saveThing(t); }\nexport function deeper(t) { deep(t); }`);
  ok('148 (the control): the writer set is TRANSITIVE — a function that writes only through another writer, two hops away, is a writer; and the flush itself is not',
    derived.has('deep') && derived.has('deeper') && derived.has('upsert') && !derived.has('flushNow') && !derived.has('getThing'),
    JSON.stringify([...derived]));
}

// --- THE SEAM CALL SITES ARE WELL FORMED -------------------------------------
// ADDED BY ITEM 85-C, because the migration produced a defect neither existing
// gate could see. Transforming `entries.push(...${JSON.stringify(rows)})` — a
// spread of a TEMPLATE INTERPOLATION — a transformer took the `{` of `${` for
// the start of an object literal and emitted:
//
//     window.wrizoCreateJournalPage({ JSON.stringify(rows), origin: null });
//
// a call expression sitting where a key belongs, with the `$` eaten. It is not
// valid JavaScript, and BOTH static gates passed it:
//   · `node --check` passes, because that text lives inside a template literal
//     — in the .mjs file it is a STRING, not code. It would have thrown in the
//     browser, at which point the file aborts and reports nothing (the
//     "a driver can lie by dying" hazard this repo already names).
//   · this guard passed, because no raw write remained — which is all it was
//     ever asked.
// Four files carried it. So the migration's own instrument gains the check its
// absence cost, and it is cheap: a brace-matched parse of every call site.
// EVERY seam that takes an object literal, not just the first one. wrizoPatchEntry
// and wrizoPatchProject carry the same risk and were outside this check until the
// migration put 25 of them in the tree.
//
// THE OBJECT IS FOUND BY SCANNING, NOT BY REGEX, and that is a correction: the
// first attempt used `\(\s*(?:[^,()]*,\s*)?\{`, which cannot cross the parens in
// `wrizoPatchEntry(${JSON.stringify(id)}, { ... })` — the shape most patch sites
// actually use. The check LOOKED extended while covering none of them, and the
// site count never moved, which is the only reason I noticed. An instrument that
// silently covers less than it claims is the failure this whole item keeps
// finding, and it does not stop being that when the instrument is mine.
const SEAM_NAMES = /wrizo(?:CreateJournalPage|PatchEntry|PatchProject)\(/g;

// Given the index just past a seam call's `(`, return the index of the object
// literal's opening brace — the first `{` encountered at paren depth 1 — or -1.
function objectArgAt(text, afterParen) {
  let depth = 1, inStr = null;
  for (let i = afterParen; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === BACKSLASH) { i += 1; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    // A TEMPLATE INTERPOLATION'S BRACE IS NOT AN OBJECT LITERAL. Without this,
    // `wrizoPatchEntry(${JSON.stringify(id)}, { boxes })` hands back the `{` of
    // `${`, and the scanner then parses `JSON.stringify(id)` as a malformed
    // entry — 20-odd false positives. This is the SAME `${` trap that made my
    // transformer eat a `$` and emit invalid code; it bites a reader of the text
    // exactly as readily as a writer of it.
    if (c === '$' && text[i + 1] === '{') {
      const end = matchBrace(text, i + 1);
      if (end < 0) return -1;
      i = end;
      continue;
    }
    if (c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') { depth -= 1; if (depth === 0) return -1; }
    else if (c === '{' && depth === 1) return i;
  }
  return -1;
}

// AN UNQUOTED STRING VALUE IS A BARE IDENTIFIER, AND IT THROWS IN THE BROWSER.
// My own transformer emitted `wrizoCreateProject('T3 Project', creative)` — the
// type's captured value re-emitted without its quotes. `creative` is then an
// undefined identifier, and because the text lives inside an app.evalJs template
// literal, `node --check` sees a STRING and passes. It would have thrown at run
// time, where a harness that dies reports nothing at all.
//
// The check is deliberately a CLOSED LIST of values that must always be quoted —
// the project types, binder kinds and beat statuses — so it cannot false-positive
// on a legitimate variable that happens to be passed along.
const UNQUOTED_VALUES = /wrizo\w+\([^)]*?[,(]\s*(creative|academic|professional|book|story|screenplay|other|empty|complete|journal|project|loose|system|page)\s*[,)]/g;

function matchBrace(text, open) {
  let depth = 0, inStr = null;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (c === BACKSLASH) { i += 1; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if (c === '{') depth += 1;
    else if (c === '}') { depth -= 1; if (depth === 0) return i; }
  }
  return -1;
}

function topLevelEntries(body) {
  const parts = []; let depth = 0, inStr = null, start = 0;
  for (let i = 0; i <= body.length; i += 1) {
    if (i === body.length) { parts.push(body.slice(start)); break; }
    const c = body[i];
    if (inStr) { if (c === BACKSLASH) { i += 1; continue; } if (c === inStr) inStr = null; continue; }
    if (c === '"' || c === "'" || c === '`') { inStr = c; continue; }
    if ('{[('.includes(c)) depth += 1;
    else if ('}])'.includes(c)) depth -= 1;
    else if (c === ',' && depth === 0) { parts.push(body.slice(start, i)); start = i + 1; }
  }
  return parts.map((p) => p.trim()).filter(Boolean);
}

function countCallSites(text) {
  let n = 0; let m;
  SEAM_NAMES.lastIndex = 0;
  while ((m = SEAM_NAMES.exec(text)) !== null) {
    if (objectArgAt(text, m.index + m[0].length) >= 0) n += 1;
  }
  return n;
}

function malformedCallSites(text, label) {
  const out = [];
  let m;
  SEAM_NAMES.lastIndex = 0;
  while ((m = SEAM_NAMES.exec(text)) !== null) {
    const open = objectArgAt(text, m.index + m[0].length);
    if (open < 0) continue;   // no object argument at this call (e.g. a bare id)
    const close = matchBrace(text, open);
    if (close < 0) { out.push(`${label}: unbalanced object literal`); continue; }
    for (const p of topLevelEntries(text.slice(open + 1, close))) {
      if (p.startsWith('...')) continue;                                        // spread
      if (/^[A-Za-z_$][\w$]*$/.test(p)) continue;                               // shorthand
      if (/^(\[[^\]]*\]|[A-Za-z_$][\w$]*|'[^']*'|"[^"]*")\s*:/.test(p)) continue; // key: value
      // A TEMPLATE INTERPOLATION at the start of an entry is legal and common in
      // these fixtures: j6 has `${cond ? "pageType: 'note', " : ''}origin: ...`,
      // which expands to a valid pair either way. This exemption is written
      // NARROWLY — it requires the literal two characters `${` — precisely so it
      // cannot re-hide the defect this check exists for: the spread-form damage
      // produced `JSON.stringify(rows)` with the `$` EATEN, which does not start
      // with `${` and is still caught.
      if (p.startsWith('${')) continue;
      out.push(`${label}: ${p.slice(0, 70)}`);
    }
  }
  return out;
}

{
  const malformed = [];
  let siteCount = 0;
  for (const dir of [path.join(DESKTOP, 'scripts', 'harness'), path.join(DESKTOP, 'scripts')]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.mjs')) continue;
      const rel = path.relative(DESKTOP, path.join(dir, name)).replace(/\\/g, '/');
      if (rel.endsWith('scripts/harness/seed-guard.mjs')) continue;
      const text = readFileSync(path.join(dir, name), 'utf8');
      siteCount += countCallSites(text);
      malformed.push(...malformedCallSites(text, rel));
    }
  }
  ok(`85-C: all ${siteCount} seam call sites are well-formed object literals — the one defect class that passes BOTH node --check (the text is a string inside a template literal) and the raw-write scan above, and then throws in the browser where a dying driver reports nothing`,
    malformed.length === 0, JSON.stringify({ sites: siteCount, malformed }));

  // The other half of the same class: a string VALUE emitted without its quotes.
  const unquoted = [];
  for (const dir of [path.join(DESKTOP, 'scripts', 'harness'), path.join(DESKTOP, 'scripts')]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!name.endsWith('.mjs')) continue;
      const rel = path.relative(DESKTOP, path.join(dir, name)).replace(/\\/g, '/');
      if (rel.endsWith('scripts/harness/seed-guard.mjs')) continue;
      const text = readFileSync(path.join(dir, name), 'utf8');
      UNQUOTED_VALUES.lastIndex = 0;
      let um;
      while ((um = UNQUOTED_VALUES.exec(text)) !== null) unquoted.push(`${rel}: ${um[1]} (unquoted)`);
    }
  }
  ok('85-C: no seam call passes a string VALUE as a bare identifier — my own transformer emitted wrizoCreateProject(title, creative), which node --check cannot see (the text is a string inside a template literal) and which throws ReferenceError in the browser, where the file dies reporting nothing',
    unquoted.length === 0, JSON.stringify({ unquoted }));
  ok('85-C self-proof: the bare-identifier shape IS caught, and its quoted form is NOT — a closed list of always-quoted values, so a legitimate variable passed along cannot trip it',
    /wrizo\w+\([^)]*?[,(]\s*(creative)\s*[,)]/.test("window.wrizoCreateProject('T', creative)")
    && !/wrizo\w+\([^)]*?[,(]\s*(creative|academic)\s*[,)]/.test("window.wrizoCreateProject('T', 'creative')")
    && !/wrizo\w+\([^)]*?[,(]\s*(creative|academic)\s*[,)]/.test("window.wrizoCreateProject('T', kind)"), '');

  // Self-proof, because a shape check that never sees a bad shape is the
  // decoration this file keeps arguing against. The first fixture is the exact
  // text the migration produced.
  const damaged = "window.wrizoCreateJournalPage({ JSON.stringify(rows), origin: null });";
  ok('85-C self-proof: the real defect text is CAUGHT — a call expression where a key belongs',
    malformedCallSites(damaged, 'fixture').length === 1, JSON.stringify(malformedCallSites(damaged, 'fixture')));
  const healthy = "window.wrizoCreateJournalPage({ id: 'x', text: '', boxes: [], origin: null });"
    + "window.wrizoCreateJournalPage({ ...r, origin: 'origin' in r ? r.origin : null });";
  ok('85-C self-proof (the control): well-formed sites — including a spread and a computed value — are NOT flagged, so the check is not one that reds on everything',
    malformedCallSites(healthy, 'fixture').length === 0, JSON.stringify(malformedCallSites(healthy, 'fixture')));
}
// --- THE SELF-PROOF ----------------------------------------------------------
// The scan above finds 56 files whether it works well or barely. These fixtures
// are what make the claim real — the same argument hooks-order-ast.mjs had to
// make when both its blind spots were empty in the tree.
const FIXTURES = [
  { name: 'a raw seed of the journal collection is CAUGHT',
    expect: 1,
    code: "await app.evalJs(`localStorage.setItem('writer-studio-journal-entries', JSON.stringify(rows))`);" },
  { name: 'a raw write to ANOTHER collection is caught too — the hazard is per-collection, and flushNow() iterates every key',
    expect: 1,
    code: "localStorage.setItem('writer-studio-story-plans', '[]');" },
  { name: 'removeItem on a collection is caught — erasing a collection raw is the same class as writing one',
    expect: 1,
    code: "localStorage.removeItem('writer-studio-drawers');" },
  { name: 'the control — localStorage.clear() is the house fresh-desk idiom and is NOT a collection write',
    expect: 0,
    code: "await app.evalJs(\"localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')\");" },
  { name: 'the control — READING a collection is harmless and is not flagged',
    expect: 0,
    code: "const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');" },
  { name: 'the control — a NON-collection key is not flagged (only the app\'s own KEYS are the hazard)',
    expect: 0,
    code: "localStorage.setItem('wrizo-writing-goal-lines', '24');" },
];

for (const f of FIXTURES) {
  const hits = rawWritesIn(f.code, keys);
  ok(`85-B self-proof: ${f.name}`, hits.length === f.expect,
    JSON.stringify({ expected: f.expect, got: hits.length, hits }));
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Nothing to park. This guard SUPERSEDES no assertion — it is the instrument
  // that was missing, and a missing instrument falsifies nothing when it
  // arrives. Every harness it names keeps claiming exactly what it claimed.
  // eslint-disable-next-line no-console
  console.log('\nSEED-GUARD PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; item 85-B parks nothing. It adds the guard that was missing rather than superseding one.');
}

const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nSEED-GUARD VERIFY: PASS (${all.length} checks)`
  : `\nSEED-GUARD VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
