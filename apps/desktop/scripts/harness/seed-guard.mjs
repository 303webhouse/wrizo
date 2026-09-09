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
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.join(HERE, '..', '..');
const PERSISTENCE = path.join(DESKTOP, 'src', 'store', 'persistence.ts');

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
// MEASURED 2026-09-09 against `main` @ c2d5539, not estimated: 56 files, which
// is the population AFTER item 129 migrated bm1's seeding.
//
// ► IT IS 56, NOT 54, AND THE DIFFERENCE IS A REAL WIDENING OF THE EXPOSURE.
// Item 85's record measures `writer-studio-journal-entries` alone and counts 54.
// Two further files — b2-1.mjs and j5.mjs — write `projects` / `story-plans` /
// `drawers` raw and never touch journal-entries, so they fall outside that
// count. `flushNow()` iterates EVERY key in KEYS, so their coin flip is
// identical in kind. Both numbers are right about what they measure; only the
// six-key one is right about the hazard.
//
// THIS LIST IS A RATCHET, NOT AN AMNESTY. A file NOT in it that writes raw is a
// FAILURE — that is the guard. A file IN it that no longer writes raw is ALSO a
// failure, so a migration must delete its line here in the same change; without
// that the list would rot into a permanent excuse and quietly re-authorise what
// it was built to end.
//
// The entries are UNCLASSIFIED debt except where a reason is given. I have read
// one of the 56 closely enough to classify it, and I am not going to label the
// other 55 from a grep — classification belongs to whoever migrates each file.
const DELIBERATE = new Map([
  ['scripts/harness/bm1.mjs',
    'a two-device TOMBSTONE simulation, not a seed: the write sets deletedAt on an existing row and '
    + 'reloads, because the scenario under test IS a row vanishing under a mounted surface and the app '
    + 'has no seam for "another device deleted this". Item 129 migrated this file\'s SEEDING and kept '
    + 'this deliberately.'],
]);

const BASELINE = new Set([
  'scripts/harness/ab1.mjs', 'scripts/harness/ab2.mjs', 'scripts/harness/ab3.mjs',
  'scripts/harness/ab4.mjs', 'scripts/harness/b1.mjs', 'scripts/harness/b2-1.mjs',
  'scripts/harness/b2.mjs', 'scripts/harness/b3.mjs', 'scripts/harness/bg1.mjs',
  'scripts/harness/bg2.mjs', 'scripts/harness/bm1.mjs', 'scripts/harness/cd1.mjs',
  'scripts/harness/cd2.mjs', 'scripts/harness/cd4.mjs', 'scripts/harness/e1.mjs',
  'scripts/harness/e3.mjs', 'scripts/harness/fx1.mjs', 'scripts/harness/fx10.mjs',
  'scripts/harness/fx11.mjs', 'scripts/harness/fx12.mjs', 'scripts/harness/fx13.mjs',
  'scripts/harness/fx14.mjs', 'scripts/harness/fx15.mjs', 'scripts/harness/fx16.mjs',
  'scripts/harness/fx17.mjs', 'scripts/harness/fx18.mjs', 'scripts/harness/fx2.mjs',
  'scripts/harness/fx3.mjs', 'scripts/harness/fx4.mjs', 'scripts/harness/fx5.mjs',
  'scripts/harness/fx6.mjs', 'scripts/harness/fx7.mjs', 'scripts/harness/fx8.mjs',
  'scripts/harness/fx9.mjs', 'scripts/harness/hb1.mjs', 'scripts/harness/hb2.mjs',
  'scripts/harness/item118.mjs', 'scripts/harness/item83f.mjs', 'scripts/harness/item84.mjs',
  'scripts/harness/item84b.mjs', 'scripts/harness/item9192.mjs', 'scripts/harness/j4.mjs',
  'scripts/harness/j5.mjs', 'scripts/harness/j6.mjs', 'scripts/harness/m1.mjs',
  'scripts/harness/m2.mjs', 'scripts/harness/m3.mjs', 'scripts/harness/m4.mjs',
  'scripts/harness/pb1.mjs', 'scripts/harness/sc2.mjs', 'scripts/harness/tu1.mjs',
  'scripts/harness/tu2.mjs', 'scripts/harness/tu5.mjs', 'scripts/harness/underline.mjs',
  'scripts/harness/w1.mjs', 'scripts/harness/w2.mjs',
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
    againstEmpty.length === offenders.length && offenders.length >= 54,
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
