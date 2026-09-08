// SEED-SEAM GUARD — item 85's ratchet, built out of item 129 (2026-09-08).
// Run: node scripts/harness/seed-seam-guard.mjs   (from apps/desktop)
//
// STATIC AND BROWSERLESS, the hooks-order.mjs shape: it reads the harness
// directory and compares it to a frozen baseline. No browser, no port, no
// contention — it costs the suite milliseconds and can run inside a box-quiet
// hold, which is when it was written.
//
// WHY IT EXISTS. Item 129 measured what a raw collection write actually costs.
// Every product write serialises the WHOLE in-memory persistence cache back
// over localStorage, and that cache never contains a raw-written row. So a
// fixture that writes a collection raw keeps its rows only until the next
// product write ANYWHERE in the run, and then loses them wholesale — with no
// timing signature, which is why no settle poll can rescue it and why it
// presents as a ~50% "flaky test". bm1.mjs's S2 cost a day to that before the
// mechanism was pinned; 55 other files carry the same latent shape today.
//
// WHAT THIS GUARD DELIBERATELY DOES **NOT** CLAIM — read this before tightening
// it. A raw write is NOT automatically a defect. The dangerous pattern is a raw
// SEED whose rows must survive later product writes. A raw write that is
// followed IMMEDIATELY by a reload, with no product write in between, is a
// legitimate and deliberate fixture idiom — bm1.mjs's own surviving raw write
// is exactly that: it sets `deletedAt` to exercise a LOAD PATH and reloads on
// the next line. Whether a given site is safe depends on what runs AFTER it,
// which a static scan cannot know. So this file asserts a POPULATION RATCHET,
// never a prohibition: the count may fall, and may not rise. Turning it into
// "no raw writes" would make it lie about sites like bm1's, and a guard that
// lies gets disabled.
//
// HOW TO SATISfY IT WHEN IT GOES RED: seed through the seam
// (`window.wrizoCreateJournalPage`, which item 129 widened with origin /
// pageType / projectId / boxes), then REMOVE the file from the baseline below.
// The third check makes that removal compulsory rather than optional.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, basename } from 'node:path';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// Absolute, from this file's own location — never a relative path off a
// persisted cwd, which is how a scan ends up reading a different worktree than
// the one it believes it is measuring.
const HERE = dirname(fileURLToPath(import.meta.url));

// The persisted collections. A raw write to any of these is serialised over by
// the next product flush; `drafts` and `sessions` are included for completeness
// even though no harness writes them today, so a first offender is caught.
const COLLECTIONS = [
  'journal-entries', 'projects', 'story-plans', 'drawers', 'drafts', 'sessions',
];
const RAW_WRITE = new RegExp(
  "localStorage\\.setItem\\('writer-studio-(" + COLLECTIONS.join('|') + ")'", 'g');

// THE FROZEN BASELINE — the population as measured on 2026-09-08, at the tree
// that closed item 129. Every entry is a latent coin flip awaiting a migration;
// none is an endorsement. Two of them (item118.mjs, underline.mjs) are the fix
// lane's own, named rather than quietly excluded.
const BASELINE = {
  'ab1.mjs': 4, 'ab2.mjs': 3, 'ab3.mjs': 4, 'ab4.mjs': 3,
  'b1.mjs': 4, 'b2-1.mjs': 6, 'b2.mjs': 19, 'b3.mjs': 2,
  'bg1.mjs': 2, 'bg2.mjs': 2,
  // bm1.mjs's single remaining write is NOT a seed: it sets `deletedAt` to
  // exercise a load path and reloads on the very next line. Item 129 migrated
  // its actual seeding to the seam. Kept at 1 deliberately, as the worked
  // example of a raw write that is correct.
  'bm1.mjs': 1,
  'cd1.mjs': 1, 'cd2.mjs': 9, 'cd4.mjs': 1,
  'e1.mjs': 2, 'e3.mjs': 1,
  'fx1.mjs': 1, 'fx10.mjs': 4, 'fx11.mjs': 1, 'fx12.mjs': 2, 'fx13.mjs': 1,
  'fx14.mjs': 2, 'fx15.mjs': 1, 'fx16.mjs': 1, 'fx17.mjs': 1, 'fx18.mjs': 1,
  'fx2.mjs': 2, 'fx3.mjs': 1, 'fx4.mjs': 5, 'fx5.mjs': 3, 'fx6.mjs': 5,
  'fx7.mjs': 1, 'fx8.mjs': 3, 'fx9.mjs': 5,
  'hb1.mjs': 1, 'hb2.mjs': 2,
  'item118.mjs': 1, 'item83f.mjs': 1, 'item84.mjs': 1, 'item84b.mjs': 1,
  'item9192.mjs': 1,
  'j4.mjs': 3, 'j5.mjs': 1, 'j6.mjs': 7,
  'm1.mjs': 11, 'm2.mjs': 1, 'm3.mjs': 1, 'm4.mjs': 1,
  'pb1.mjs': 2, 'sc2.mjs': 3,
  'tu1.mjs': 6, 'tu2.mjs': 3, 'tu5.mjs': 1,
  'underline.mjs': 3, 'w1.mjs': 1, 'w2.mjs': 1,
};

const files = readdirSync(HERE).filter((f) => f.endsWith('.mjs')).sort();
const actual = {};
for (const f of files) {
  const src = readFileSync(resolve(HERE, f), 'utf8');
  const n = (src.match(RAW_WRITE) || []).length;
  if (n > 0) actual[f] = n;
}

// ---- 1. NO NEW OFFENDER -----------------------------------------------------
const newcomers = Object.keys(actual).filter((f) => !(f in BASELINE));
ok('no NEW harness file writes a persisted collection raw — seed through the seam (window.wrizoCreateJournalPage, widened by item 129 with origin/pageType/projectId/boxes) so the rows survive the next product write',
  newcomers.length === 0,
  newcomers.length ? `new offenders: ${newcomers.join(', ')}` : `${Object.keys(actual).length} known, 0 new`);

// ---- 2. NO EXISTING OFFENDER GROWS -----------------------------------------
const grown = Object.keys(actual)
  .filter((f) => f in BASELINE && actual[f] > BASELINE[f])
  .map((f) => `${f}: ${BASELINE[f]} -> ${actual[f]}`);
ok('and no already-listed file adds MORE raw writes — the population may fall, never rise; a file being on the list is a debt, not a licence',
  grown.length === 0, grown.length ? grown.join('; ') : 'none grew');

// ---- 3. THE BASELINE IS SELF-CLEANING --------------------------------------
// The hooks-order precedent: the allowlist must describe only what it claims.
// A file migrated to the seam MUST leave this list, or the list quietly becomes
// a place where fixed things hide and the ratchet stops ratcheting.
const stale = Object.keys(BASELINE).filter((f) => !(f in actual));
const overcounted = Object.keys(BASELINE)
  .filter((f) => f in actual && actual[f] < BASELINE[f])
  .map((f) => `${f}: baseline ${BASELINE[f]}, actual ${actual[f]}`);
ok('the baseline still describes only files that ACTUALLY write raw, at their actual counts — migrate a file and this check makes removing it from the list compulsory, so the ratchet cannot rot into a hiding place',
  stale.length === 0 && overcounted.length === 0,
  [stale.length ? `no longer raw (remove from BASELINE): ${stale.join(', ')}` : '',
   overcounted.length ? `count fell (lower the BASELINE): ${overcounted.join('; ')}` : '']
    .filter(Boolean).join(' | ') || 'baseline exact');

// ---- 4. ITEM 129'S OWN MIGRATION CANNOT REGRESS -----------------------------
const bm1 = readFileSync(resolve(HERE, 'bm1.mjs'), 'utf8');
ok('item 129 stays fixed: bm1.mjs seeds through wrizoCreateJournalPage, and its ONLY raw write remains the deliberate load-path deletion — the file that cost a day to this class does not quietly regress',
  bm1.includes('window.wrizoCreateJournalPage(') && (bm1.match(RAW_WRITE) || []).length === 1,
  `seam=${bm1.includes('window.wrizoCreateJournalPage(')} rawWrites=${(bm1.match(RAW_WRITE) || []).length}`);

// ---- 5. THE SEAM CAN STILL SAY WHAT FIXTURES NEED --------------------------
// Item 129's finding: a seam that cannot express the fixture is bypassed
// QUIETLY. If these fields ever leave JournalPageSeed, the migrations that
// depend on them silently become impossible and the population starts growing
// again — so the guard watches the seam itself, not only its callers.
const seedSrc = readFileSync(resolve(HERE, '..', '..', 'src', 'store', 'persistence.ts'), 'utf8');
const iface = /export interface JournalPageSeed \{([\s\S]*?)\}/.exec(seedSrc);
const needed = ['id', 'text', 'createdAt', 'strokes', 'origin', 'pageType', 'projectId', 'boxes'];
const missing = iface ? needed.filter((k) => !new RegExp(`\\b${k}\\?`).test(iface[1])) : needed;
ok('the seam can still SAY what fixtures need — JournalPageSeed keeps every field a migration depends on (origin above all: it is written only at birth, and belongsOnShelf excludes anything journal-homed, so without it no seeded entry can be Shelf-eligible at all)',
  !!iface && missing.length === 0,
  missing.length ? `missing from JournalPageSeed: ${missing.join(', ')}` : 'all present');

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nSEED-SEAM-GUARD VERIFY: PASS (${checks.length} checks)`
  : `\nSEED-SEAM-GUARD VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
