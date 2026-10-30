// CI-PLAN (Oct 29, the harness on GitHub Actions): turn "which files, which leg, how many shards" into the job matrix. Run by the workflow's
// plan job, from the TOOLING checkout, against the tree under test:
//   FILES_INPUT=<a.mjs,b.mjs | pair> LEG_INPUT=<default|parked|both> SHARDS_INPUT=<1-12> node scripts/ci-plan.mjs --tree <repo root under test>
// "pair" = every harness file in the tree that is not on ci-box-only.txt. Files are dealt to shards by their box seconds (ci-shard-weights.txt,
// longest first onto the lightest shard) so the shards finish together. Writes `matrix` (and prints a table) for the workflow; with no
// GITHUB_OUTPUT it prints the JSON, which is how it is tested by hand.
import { readFileSync, readdirSync, existsSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const TREE = path.resolve(arg('tree', path.join(HERE, '..', '..', '..')));
const fail = (m) => { console.error(`::error::${m}`); process.exit(2); };
const lines = (f) => readFileSync(f, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const boxOnly = new Set(lines(path.join(HERE, 'ci-box-only.txt')));
const weights = new Map(lines(path.join(HERE, 'ci-shard-weights.txt')).map((l) => { const [f, s] = l.split(/\s+/); return [f, Number(s) || 20]; }));
const harnessDir = path.join(TREE, 'apps', 'desktop', 'scripts', 'harness');
if (!existsSync(harnessDir)) fail(`no harness directory in the tree under test: ${harnessDir}`);
const present = readdirSync(harnessDir).filter((f) => f.endsWith('.mjs')).sort();

const want = (process.env.FILES_INPUT || 'machina-intake.mjs').trim();
let files;
if (want === 'pair') files = present.filter((f) => !boxOnly.has(f));
else {
  if (!/^[A-Za-z0-9_.-]+\.mjs(,[A-Za-z0-9_.-]+\.mjs)*$/.test(want)) fail('files must be comma-separated *.mjs names, or pair');
  files = [...new Set(want.split(','))];
  for (const f of files) {
    if (boxOnly.has(f)) fail(`${f} is on the box-only list (scripts/ci-box-only.txt): run it on the Windows box`);
    if (!present.includes(f)) fail(`no such harness file in the tree under test: ${f}`);
  }
}

const leg = (process.env.LEG_INPUT || 'both').trim();
if (!['default', 'parked', 'both'].includes(leg)) fail('leg must be default, parked or both');
const legs = leg === 'both' ? ['default', 'parked'] : [leg];

const asked = Number(process.env.SHARDS_INPUT || (want === 'pair' ? 8 : 1));
if (!Number.isInteger(asked) || asked < 1 || asked > 12) fail('shards must be a whole number from 1 to 12');
const n = Math.min(asked, files.length);

const bins = Array.from({ length: n }, () => ({ s: 0, files: [] }));
for (const f of [...files].sort((a, b) => (weights.get(b) ?? 20) - (weights.get(a) ?? 20) || a.localeCompare(b))) {
  bins.sort((a, b) => a.s - b.s);
  bins[0].files.push(f); bins[0].s += weights.get(f) ?? 20;
}
bins.sort((a, b) => b.s - a.s);
const include = [];
for (const l of legs) bins.forEach((b, i) => include.push({ leg: l, shard: i + 1, of: n, files: b.files.sort().join(',') }));

const matrix = JSON.stringify({ include });
console.log(`CI-PLAN: ${files.length} file(s), ${legs.join('+')} leg(s), ${n} shard(s) each, ${include.length} job(s); box seconds per shard ${bins.map((b) => b.s).join('/')}; box-only skipped: ${want === 'pair' ? [...boxOnly].join(', ') : 'n/a'}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`);
else console.log(matrix);
