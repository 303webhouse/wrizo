// ITEM 204 PART 2 — THE PROOFING MERGE. Browserless proof.
//
// This is the function that loses a writer's words if it is wrong, so it is proven
// against the REAL module: `store/proofing.ts` transpiled and imported, with only
// `localStorage` stubbed. Nothing here re-implements the merge.
//
// The four rulings it has to satisfy:
//   1 · CONVERGENCE (A) — a per-key merge on both sides; the boot pull MERGES and
//       never replaces; the seam makes the destructive form UNSAYABLE.
//   2 · TOMBSTONES — compaction, not a cap: a `removedAt` older than 180 days is
//       dropped, and a device offline longer than that may bring a word back.
//   3 · THE LOGOUT SWEEP — the mirror goes out with everything else.
//   4 · SCOPE — unaffected.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const require = createRequire(join(repo, 'apps/server/package.json'));
const ts = require('typescript');

let failures = 0;
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const ok = (m) => console.log('  ok   ' + m);

// --- a localStorage stub, so the real module can load ---------------------
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => { mem.set(k, String(v)); },
  removeItem: (k) => { mem.delete(k); },
};

const tmp = join(tmpdir(), 'wrizo-item204-proof');
mkdirSync(tmp, { recursive: true });
const tr = (src) => ts.transpileModule(src, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;

// `proofing.ts` imports only from '../types', and the two values it needs are
// plain constants — so the type-only import erases and the constants are inlined
// into a tiny stub. Nothing else is stubbed.
const PROOFING_SRC = readFileSync(join(repo, 'apps/desktop/src/store/proofing.ts'), 'utf8');
let js = tr(PROOFING_SRC);
const beforeStub = js;
js = js.replace(/^import \{ PROOFING_DEFAULT_DIALECT, PROOFING_TOMBSTONE_DAYS \} from '\.\.\/types';$/m,
  "import { PROOFING_DEFAULT_DIALECT, PROOFING_TOMBSTONE_DAYS } from './types.mjs';");
if (js === beforeStub || /^import .*\.\.\/types';/m.test(js)) {
  console.log("FAIL — proofing.ts's imports changed; this proof could not stub them and would be testing a stale copy.");
  process.exit(1);
}
// The constants are read OUT OF THE REAL types file, not restated here — or the
// 180 this proof checks could drift from the 180 the app ships.
const TYPES_SRC = readFileSync(join(repo, 'apps/desktop/src/types/index.ts'), 'utf8');
const dialect = TYPES_SRC.match(/PROOFING_DEFAULT_DIALECT: ProofingDialect = '([^']+)'/);
const days = TYPES_SRC.match(/PROOFING_TOMBSTONE_DAYS = (\d+)/);
if (!dialect || !days) { console.log('FAIL — could not read the constants from types/index.ts'); process.exit(1); }
writeFileSync(join(tmp, 'types.mjs'),
  `export const PROOFING_DEFAULT_DIALECT = '${dialect[1]}';\nexport const PROOFING_TOMBSTONE_DAYS = ${days[1]};\n`, 'utf8');
writeFileSync(join(tmp, 'proofing.mjs'), js, 'utf8');
const P = await import(pathToFileURL(join(tmp, 'proofing.mjs')).href);

console.log(`read from types: default dialect="${dialect[1]}" | tombstone days=${days[1]}\n`);

const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString();
const DAY = 24 * 60 * 60 * 1000;
const rec = (words, extra = {}) => ({ dialect: dialect[1], words, ignored: '', engine: '', ...extra });

console.log('CLAIM 1 — TWO DEVICES, TWO WORDS: both survive (the requirement)');
{
  const phone = rec({ karrowmere: { display: 'Karrowmere', addedAt: iso(2 * DAY) } });
  const laptop = rec({ tessaly: { display: 'Tessaly', addedAt: iso(1 * DAY) } });
  const m = P.mergeProofing(phone, laptop);
  const keys = Object.keys(m.words).sort();
  if (keys.join(',') !== 'karrowmere,tessaly') fail(`expected both words, got ${keys.join(',') || '(none)'}`);
  else ok('a word added on a phone and another on a laptop both survive');
}

console.log('CLAIM 2 — the merge is COMMUTATIVE and IDEMPOTENT');
{
  const a = rec({ one: { display: 'One', addedAt: iso(3 * DAY) }, shared: { display: 'Shared', addedAt: iso(5 * DAY) } });
  const b = rec({ two: { display: 'Two', addedAt: iso(2 * DAY) }, shared: { display: 'Shared', addedAt: iso(1 * DAY) } });
  // ⚠ COMPARED BY CONTENT, NOT BY KEY ORDER — and the first version of this check
  // got that wrong. It used `JSON.stringify`, which is order-sensitive, and
  // reported "merge is not commutative" against a merge whose two results held
  // IDENTICAL entries in a different insertion order. Commutativity of a SET is a
  // claim about members, not about ordering; demanding order would have left this
  // red forever against correct code, and "fixing" the merge to satisfy it would
  // have been the instrument dictating the product.
  const canon = (words) => JSON.stringify(Object.entries(words).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)));
  const ab = P.mergeProofing(a, b);
  const ba = P.mergeProofing(b, a);
  if (canon(ab.words) !== canon(ba.words)) {
    fail(`merge is not commutative:\n       a,b = ${canon(ab.words)}\n       b,a = ${canon(ba.words)}`);
  } else ok('merge(a,b) and merge(b,a) agree by CONTENT — order of arrival cannot change the result');
  const again = P.mergeProofing(ab, b);
  if (canon(again.words) !== canon(ab.words)) fail('merge is not idempotent — re-merging a record changes it');
  else ok('re-merging changes nothing — the same function can serve the pull AND the push');
}

console.log('CLAIM 2b — a LATER STAMPED CLEAR survives the merge, in BOTH orders');
{
  // Fable's review, 1. The `||` fallback chain could not represent a clear: un-ignore
  // the last item on A (`ignored: ''` with a later stamp) and `'' || a || b` quietly
  // resurrected B's older list. A clear is a WRITE; a merge that cannot carry one
  // silently undoes the writer.
  const before = failures;
  const cleared = { ...rec({}), ignored: '', ignoredAt: iso(1 * DAY), engine: '' };
  const stale = { ...rec({}), ignored: '["old","list"]', ignoredAt: iso(5 * DAY), engine: 'h1' };
  for (const [label, m] of [['clear first', P.mergeProofing(cleared, stale)], ['clear second', P.mergeProofing(stale, cleared)]]) {
    if (m.ignored !== '') fail(`a later stamped CLEAR lost (${label}): ignored is ${JSON.stringify(m.ignored)}`);
    if (m.engine !== '') fail(`engine came from the losing side (${label}): ${JSON.stringify(m.engine)} — a version must describe the blob it arrived with`);
  }
  // And the reverse must still hold: a later stamped VALUE beats an older clear.
  const older = { ...rec({}), ignored: '', ignoredAt: iso(9 * DAY) };
  const newer = { ...rec({}), ignored: '["kept"]', ignoredAt: iso(1 * DAY), engine: 'h2' };
  if (P.mergeProofing(older, newer).ignored !== '["kept"]') fail('a later stamped value lost to an older clear');
  if (failures === before) ok('a stamped clear wins in both orders, and a later value still beats an older clear');
}

console.log('CLAIM 2c — SCALAR ties break by VALUE, so the merge is EXACTLY commutative');
{
  // Fable's review, 2. Local-wins-on-tie made merge(a,b) != merge(b,a) whenever
  // stamps tied and values differed, so two devices could each keep their own value
  // forever — every merge confirming its own side. Breaking by value is arbitrary but
  // SYMMETRIC, and symmetry is the property that converges.
  const before = failures;
  const at = iso(2 * DAY);
  const x = { ...rec({}), dialect: 'en-GB', dialectAt: at };
  const y = { ...rec({}), dialect: 'en-US', dialectAt: at };
  const xy = P.mergeProofing(x, y);
  const yx = P.mergeProofing(y, x);
  if (xy.dialect !== yx.dialect) fail(`a tied scalar is not commutative: ${xy.dialect} vs ${yx.dialect} — each device would keep its own forever`);
  else ok(`a tied dialect resolves to "${xy.dialect}" from either side`);
  // Unstamped ties too — the pre-amendment record.
  const u1 = { ...rec({}), dialect: 'en-AU' };
  const u2 = { ...rec({}), dialect: 'en-CA' };
  if (P.mergeProofing(u1, u2).dialect !== P.mergeProofing(u2, u1).dialect) fail('an UNSTAMPED tied scalar is not commutative');
  if (failures === before) ok('stamped and unstamped ties both resolve the same from either side');
}

console.log('CLAIM 2d — a MALFORMED remote merges as null, never as a record');
{
  // Fable's review, 3. The remote comes from the wire and the PUT deliberately does
  // not validate a shape the client owns, so the client is the only place that can.
  const before = failures;
  const good = rec({ keep: { display: 'Keep', addedAt: iso(1 * DAY) } });
  for (const junk of ['a string', 42, [], [1, 2], null, undefined, true, { dialect: 'en-US' }, { words: {} }]) {
    let m;
    try { m = P.mergeProofing(good, junk); }
    catch (e) { fail(`a malformed remote THREW instead of merging as null: ${JSON.stringify(junk)} -> ${e.message}`); continue; }
    if (!P.proofingWordSet(m).has('keep')) fail(`a malformed remote destroyed the good record: ${JSON.stringify(junk)}`);
  }
  // ...and in the other position too.
  for (const junk of ['x', 7, [], { words: {} }]) {
    try {
      const m = P.mergeProofing(junk, good);
      if (!P.proofingWordSet(m).has('keep')) fail(`a malformed LOCAL record lost the good remote: ${JSON.stringify(junk)}`);
    } catch (e) { fail(`a malformed local record THREW: ${JSON.stringify(junk)} -> ${e.message}`); }
  }
  if (failures === before) ok('13 malformed inputs merge as absent — none threw, none destroyed the good record');
}

console.log('CLAIM 3 — a REMOVE is a tombstone, and the LATER act wins either way');
{
  const before = failures;
  // remove after add → the word is gone from the live set
  const removed = P.mergeProofing(
    rec({ w: { display: 'W', addedAt: iso(5 * DAY) } }),
    rec({ w: { display: 'W', addedAt: iso(5 * DAY), removedAt: iso(1 * DAY) } }),
  );
  if (P.proofingWordSet(removed).has('w')) fail('a remove did not win over an older add');
  if (!removed.words.w) fail('the tombstone was deleted instead of kept — the set can no longer converge');
  // re-add after remove → the word is back
  const readded = P.mergeProofing(
    rec({ w: { display: 'W', addedAt: iso(5 * DAY), removedAt: iso(3 * DAY) } }),
    rec({ w: { display: 'W', addedAt: iso(1 * DAY) } }),
  );
  if (!P.proofingWordSet(readded).has('w')) fail('a re-add did not win over an older remove');
  if (failures === before) ok('remove beats an older add, an add beats an older remove, and the tombstone is KEPT');
}

console.log(`CLAIM 4 — COMPACTION, NOT A CAP: a tombstone older than ${days[1]} days is dropped`);
{
  const before = failures;
  const old = P.compactProofing(rec({
    stale: { display: 'Stale', addedAt: iso(400 * DAY), removedAt: iso(200 * DAY) },
    fresh: { display: 'Fresh', addedAt: iso(30 * DAY), removedAt: iso(10 * DAY) },
    live: { display: 'Live', addedAt: iso(5 * DAY) },
  }));
  if (old.words.stale) fail('a 200-day-old tombstone survived compaction');
  if (!old.words.fresh) fail('a 10-day-old tombstone was dropped — too eager');
  if (!old.words.live) fail('a LIVE word was dropped by compaction — this is the cap failure the ruling avoids');
  if (failures === before) ok('stale tombstone gone, fresh tombstone kept, live words never touched');
}

console.log('CLAIM 4b — and the named consequence is REAL, not hypothetical');
{
  // A device offline longer than the window brings the word back, because the
  // tombstone that would have suppressed it has been compacted away. Ruled benign
  // — but it should be demonstrable, or the note in the offer is a guess.
  const server = P.compactProofing(rec({ w: { display: 'W', addedAt: iso(400 * DAY), removedAt: iso(300 * DAY) } }));
  const staleDevice = rec({ w: { display: 'W', addedAt: iso(400 * DAY) } });
  const m = P.mergeProofing(server, staleDevice);
  if (!P.proofingWordSet(m).has('w')) ok('(the resurrection did not occur in this arrangement — recorded, not assumed)');
  else ok('a device offline past the window DOES bring the word back — the named consequence, demonstrated');
}

console.log('CLAIM 5 ⛔ THE DESTRUCTIVE FORM IS UNSAYABLE');
{
  const before = failures;
  // The ruling: "mergeRemote only, with no setFromServer anywhere." Proven against
  // the module's real exports, not against a grep of my own intentions.
  const exported = Object.keys(P);
  if (!exported.includes('mergeRemote')) fail('mergeRemote is not exported — the only lawful door is missing');
  for (const forbidden of ['setFromServer', 'setProofing', 'replaceProofing', 'hydrateProofing']) {
    if (exported.includes(forbidden)) fail(`\`${forbidden}\` is exported — a caller can replace the local set, and §2(a)'s data loss is one line away`);
  }
  // And no such name may exist in the source either, exported or not.
  const code = PROOFING_SRC.replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  for (const forbidden of ['setFromServer', 'replaceProofing']) {
    if (code.includes(forbidden)) fail(`\`${forbidden}\` appears in the source (outside comments) — the destructive form is sayable after all`);
  }
  if (failures === before) ok(`mergeRemote exported; no replacing door exists (${exported.length} exports checked)`);
}

console.log('CLAIM 6 — the logout sweep clears the mirror, and persistence calls it');
{
  const before = failures;
  if (typeof P.clearProofingLocal !== 'function') fail('clearProofingLocal is not exported');
  else {
    P.addProofingWord('Ephemeral');
    if (!P.proofingWordSet(P.getProofing()).has('ephemeral')) fail('a word could not be added — the fixture, not the product');
    P.clearProofingLocal();
    if (P.proofingWordSet(P.getProofing()).size !== 0) fail('clearProofingLocal left words behind');
  }
  const PERS = readFileSync(join(repo, 'apps/desktop/src/store/persistence.ts'), 'utf8')
    .replace(/\/\/[^\n]*/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');
  if (!/clearProofingLocal\(\)/.test(PERS)) fail('resetLocalData does not call clearProofingLocal — a signed-out device would keep the dictionary');
  if (failures === before) ok('the mirror clears, and resetLocalData calls it (code, not comments)');
}

console.log('CLAIM 7 — the five dialects are the design\'s five');
{
  const m = TYPES_SRC.match(/export type ProofingDialect =\s*([^;]+);/);
  if (!m) fail('could not read ProofingDialect');
  else {
    const got = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]).sort();
    const want = ['en-AU', 'en-CA', 'en-GB', 'en-IN', 'en-US'];
    if (got.join(',') !== want.join(',')) fail(`dialects are ${got.join(',')}, the design names ${want.join(',')}`);
    else ok(`${got.join(', ')} — American, British, Australian, Canadian, Indian (NOT New Zealand, which a first draft of the shape report wrote from memory)`);
  }
}

console.log('\nSTATED BOUNDS — not provable here:');
console.log('  · the column and the two endpoints are server-side; a real round trip is owed at offer');
console.log('  · the residual: a word can be briefly MISSING on another device until its adding device syncs');

console.log('\n' + (failures === 0
  ? 'ITEM 204 MERGE PROOF: CLEAN'
  : `ITEM 204 MERGE PROOF: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
