// PUB1 — the Press shell, browserless proof. The door handler (FIX's grant,
// after r3) and the actual interactive verification (click the return chip,
// walk the running order, fire a download/copy) are NOT this file's job —
// they need a real writing surface to navigate FROM, which this ticket does
// not yet have a way to reach. What IS provable without a browser: the
// route exists and is lazy (the main-bundle budget's own mechanism), the
// lexicon carries every string the shell reads, R2 is honored (no other
// lane's file imported), and — when a build is present — the real measured
// chunk split.
//
// Run: node scripts/harness/pub1-press-shell.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- ROUTE: App.tsx registers /press as a lazy route -----------------------
const appSrc = fs.readFileSync(path.join(SRC, 'App.tsx'), 'utf8');
ok('ROUTE: Press is imported via React.lazy(() => import(\'./pages/Press\')) — the main-bundle budget\'s own mechanism (Pass 2 #8)',
  /const Press = lazy\(\(\) => import\(['"]\.\/pages\/Press['"]\)\)/.test(appSrc), '');
ok('ROUTE: "/press" is registered, wrapped in <Suspense>, never rendered eagerly',
  /<Route path="\/press" element=\{<Suspense[^>]*><Press \/><\/Suspense>\}/.test(appSrc), '');

// ---- LEXICON: every press* term the shell reads exists, with real English -
const lexSrc = fs.readFileSync(path.join(SRC, 'store/deskLexicon.ts'), 'utf8');
const pressSrc = fs.readFileSync(path.join(SRC, 'pages/Press.tsx'), 'utf8');
const termCalls = [...pressSrc.matchAll(/\bt\(['"]([a-zA-Z0-9]+)['"]\)/g)].map((m) => m[1]);
const uniqueTerms = [...new Set(termCalls)];
ok('LEXICON: Press.tsx calls t(...) at least once for every one of its own section labels (title/return/runningOrder/justThis/wholeBinder/moreFormats/copy/empty)',
  ['pressTitle', 'pressReturn', 'pressRunningOrder', 'pressJustThis', 'pressWholeBinder', 'pressMoreFormats', 'pressCopy', 'pressEmpty']
    .every((k) => uniqueTerms.includes(k)), JSON.stringify(uniqueTerms));
const missingFromUnion = uniqueTerms.filter((k) => !new RegExp(`'${k}'`).test(lexSrc));
ok('LEXICON: every term Press.tsx calls is a real DeskTermId (present in deskLexicon.ts\'s own union) — a typo here would be a silent runtime undefined, not a compile error, since t() is a string-keyed call',
  missingFromUnion.length === 0, JSON.stringify(missingFromUnion));

// Load the REAL lexicon module and call deskTerm() for each press* key —
// proves the default (Plateau) string actually resolves, not just that the
// key exists in the union.
const tmp = path.join(DESKTOP, '.pub1-press-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
function load(rel) {
  const srcText = fs.readFileSync(path.join(SRC, rel), 'utf8');
  let out = ts.transpileModule(srcText, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  // Node's ESM loader needs an explicit extension on a relative specifier;
  // deskLexicon.ts's real (non-type-only) import of './theme' has none.
  out = out.replace(/from (['"])(\.\.?\/[^'"]+)\1/g, (m, q, spec) => `from ${q}${spec}.mjs${q}`);
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return import(`file://${dest.replace(/\\/g, '/')}`);
}
await load('store/theme.ts'); // deskLexicon.ts's own dependency
const { deskTerm } = await load('store/deskLexicon.ts');
const pressDefaults = {
  pressTitle: 'Publish', pressReturn: 'Return to your page', pressRunningOrder: 'Running order',
  pressJustThis: 'Just this', pressWholeBinder: '← whole binder', pressMoreFormats: 'More formats',
  pressCopy: 'Copy', pressEmpty: 'Nothing to publish from here yet.',
};
for (const [key, expected] of Object.entries(pressDefaults)) {
  ok(`LEXICON VALUE: deskTerm('${key}') resolves to its real, ratified default string`,
    deskTerm(key) === expected, JSON.stringify({ key, got: deskTerm(key), expected }));
}
ok('LEXICON: the two new copy-button labels reuse E1\'s OWN literal English, unchanged — a writer who sees the Press\'s Copy buttons today sees the exact words the old dialog already shipped',
  deskTerm('publishCopyWords') === 'Copy My Words' && deskTerm('publishCopyFormatted') === 'Copy Formatted', '');
fs.rmSync(tmp, { recursive: true, force: true });

// ---- R2: no other lane's file is imported ----------------------------------
// FIX owns PageEditor.tsx/ScriptEditor.tsx (the door handler, a later
// grant). The Press shell calls their SHARED seams (store/pageExport.ts,
// store/download.ts, store/clipboard.ts, store/draftFormat.ts,
// store/persistence.ts, store/wayBack.ts, components/ActionToast.tsx) —
// every one of them already a multi-caller module, never those two files
// themselves.
const runningOrderSrc = fs.readFileSync(path.join(SRC, 'press/select/runningOrder.ts'), 'utf8');
const forbidden = /from ['"].*\/(PageEditor|ScriptEditor)['"]/;
ok('R2: Press.tsx imports nothing from PageEditor.tsx or ScriptEditor.tsx (FIX\'s files; the door handler is a separate, later grant)',
  !forbidden.test(pressSrc), '');
ok('R2: press/select/runningOrder.ts imports nothing from PageEditor.tsx or ScriptEditor.tsx either',
  !forbidden.test(runningOrderSrc), '');

// ---- THE BUNDLE BUDGET, measured for real when a build is present ---------
// Soft check: dist-web is a build artifact (gitignored), not guaranteed to
// exist at harness-run time. When it does, the Press's own chunk must be its
// own file, separate from the main bundle, and small — the real evidence
// behind Pass 2 #8's "≤15 KB gzipped main-bundle growth" ruling, not an
// assumption. Skipped (not failed) when no build is present.
const distWeb = path.join(DESKTOP, 'dist-web', 'assets');
if (fs.existsSync(distWeb)) {
  const pressChunk = fs.readdirSync(distWeb).find((f) => /^Press-.*\.js$/.test(f));
  ok('BUNDLE: a build is present, and the Press has its OWN chunk file, separate from index-*.js — the lazy import actually split, not just declared',
    !!pressChunk, pressChunk ? `found ${pressChunk}, ${fs.statSync(path.join(distWeb, pressChunk)).size} bytes` : 'no Press-*.js chunk found');
  if (pressChunk) {
    const bytes = fs.statSync(path.join(distWeb, pressChunk)).size;
    ok(`BUNDLE: the Press chunk (${bytes} bytes, uncompressed) is well under the 1 MB ceiling Fable ratified`,
      bytes < 1024 * 1024, String(bytes));
  }
} else {
  ok('BUNDLE: no dist-web present — the chunk-split check is skipped, not failed (run `pnpm run build:web` first to exercise it for real)', true, 'skipped');
}

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nPUB1-PRESS-SHELL PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: the Press shell is new this commit, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nPUB1-PRESS-SHELL VERIFY: PASS (${checks.length} checks)`
  : `\nPUB1-PRESS-SHELL VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
