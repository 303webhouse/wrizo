// ITEM 204 PART 2 — IS THE OFFER'S PASTE ACTUALLY VERBATIM?
//
// Fable byte-reviews four pieces pasted into the offer: the migration line, both
// SQL statements, both route handlers, and `mergeRemote` with its scalar rule. A
// byte review of a paste is only worth anything if the paste is the code — so this
// asserts that every ```ts block in the offer appears BYTE-FOR-BYTE in a source
// file, rather than leaving the reviewer to notice a transcription slip.
//
// It also guards the likelier failure: the offer going STALE. The code moves, the
// document does not, and nobody re-reads a block they already approved. Run this
// again before any re-offer.
//
// Browserless. Run: node apps/desktop/scripts/item204-offer-verbatim-check.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '..', '..', '..');
const read = (rel) => readFileSync(join(repo, rel), 'utf8').replace(/\r\n/g, '\n');

const OFFER = 'docs/wrizo-alpha/item204-part2-storage-offer-2026-09-24.md';
const SOURCES = [
  'apps/server/src/migrate.ts',
  'apps/server/src/sync.ts',
  'apps/desktop/src/store/proofing.ts',
];

const offer = read(OFFER);
const sources = new Map(SOURCES.map((p) => [p, read(p)]));

const blocks = [...offer.matchAll(/```ts\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\n+$/, ''));
let failures = 0;

if (blocks.length === 0) {
  console.log('FAIL — no ```ts blocks found in the offer. Either the offer changed shape or this path is wrong; refusing to report a clean verbatim check over nothing.');
  process.exit(1);
}

console.log(`${OFFER}\n${blocks.length} pasted code blocks\n`);
blocks.forEach((body, i) => {
  const found = [...sources.entries()].find(([, src]) => src.includes(body));
  if (found) {
    console.log(`  ok   block ${i + 1}: verbatim in ${found[0]} (${body.length} chars)`);
  } else {
    failures += 1;
    console.log(`  FAIL block ${i + 1} (${body.length} chars) is NOT in any source — the offer has drifted from the code.`);
    console.log(`       first line: ${JSON.stringify(body.split('\n')[0].slice(0, 76))}`);
  }
});

// The four pieces Fable named must each be present, or the offer is incomplete
// even if everything it does paste is accurate.
const required = [
  ['the migration line', /alter table users add column if not exists proofing jsonb/],
  ['the GET handler and its SELECT', /syncRouter\.get\('\/proofing'[\s\S]*select proofing from users where id = \$1/],
  ['the PUT handler and its UPDATE', /syncRouter\.put\('\/proofing'[\s\S]*update users set proofing = \$2::jsonb where id = \$1/],
  ['mergeRemote', /export function mergeRemote\(/],
  ['the scalar rule', /const pickSide = /],
  ['the shape validator', /export function isProofingRecord\(/],
  ['the requireAuth citation', /syncRouter\.use\(requireAuth\)/],
];
console.log('');
for (const [name, re] of required) {
  if (!re.test(offer)) { failures += 1; console.log(`  FAIL the offer does not contain ${name}`); }
  else console.log(`  ok   the offer contains ${name}`);
}

console.log('\n' + (failures === 0
  ? 'OFFER VERBATIM CHECK: CLEAN — every pasted block is the code, and all four pieces are present'
  : `OFFER VERBATIM CHECK: ${failures} FAILURE(S)`));
process.exit(failures === 0 ? 0 : 1);
