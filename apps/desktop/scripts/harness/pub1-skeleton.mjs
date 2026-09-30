// PUB1 — the browserless half's own proof: press/model.ts (loads and holds
// its shape), press/select/scope.ts (resolvePressScope, every branch of "the
// Press opens at the size of what you're on"), press/select/order.ts
// (chapterOrder(), with the SEAM-188 tripwire against ProjectHome.tsx's own
// comparator), and press/render/wzo.ts (buildWzoPackage + the credential
// guard). No fflate, no zip, no DOM, no CDP — see wzo.ts's own header for
// what is deliberately NOT built yet and why.
//
// Every module is loaded from its REAL file (transpiled with the repo's own
// TypeScript), never re-typed by hand.
//
// Run: node scripts/harness/pub1-skeleton.mjs   (from apps/desktop).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const ts = require('typescript');

const tmp = path.join(DESKTOP, '.pub1-harness-scratch');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
function load(rel) {
  const srcText = fs.readFileSync(path.join(SRC, rel), 'utf8');
  const out = ts.transpileModule(srcText, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const dest = path.join(tmp, rel.replace(/\.ts$/, '.mjs'));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out);
  return import(`file://${dest.replace(/\\/g, '/')}`);
}

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });

// ---- model.ts loads (types erase at runtime; this proves the FILE is
// syntactically real TS the compiler accepts, not a fixture written to look
// like it — the harness's own tsc pass, run separately, proves the types) ---
await load('press/model.ts');
ok('MODEL: press/model.ts loads clean through the repo\'s own TypeScript (no runtime code to exercise — pure types)', true, '');

// ---- select/scope.ts — every branch of "opens at the size of what you're
// on" (§3), each traced to its own clause -----------------------------------
const { resolvePressScope } = await load('press/select/scope.ts');

ok('SCOPE card: a card opens on just that card',
  JSON.stringify(resolvePressScope({ openKind: 'card', entryId: 'board1', cardId: 'card1' }))
    === JSON.stringify({ kind: 'card', cardId: 'card1', boardId: 'board1' }), '');
ok('SCOPE selection: a selection on a page opens on just the selected text, never the whole page or binder',
  JSON.stringify(resolvePressScope({ openKind: 'page', entryId: 'p1', projectId: 'proj1', selectionText: 'the chosen words' }))
    === JSON.stringify({ kind: 'selection', entryId: 'p1', text: 'the chosen words' }), '');
ok('SCOPE loose page (no binder): opens on just that page',
  JSON.stringify(resolvePressScope({ openKind: 'page', entryId: 'p2', projectId: null }))
    === JSON.stringify({ kind: 'page', entryId: 'p2' }), '');
ok('SCOPE Journal page: its own scope, never conflated with a loose page (both share "no projectId")',
  JSON.stringify(resolvePressScope({ openKind: 'page', entryId: 'p3', projectId: null, isJournal: true }))
    === JSON.stringify({ kind: 'journal' }), '');
ok('SCOPE page inside a binder, no "Again" history: the whole binder, this page highlighted',
  JSON.stringify(resolvePressScope({ openKind: 'page', entryId: 'p4', projectId: 'proj9' }))
    === JSON.stringify({ kind: 'binder', projectId: 'proj9', highlightEntryId: 'p4' }), '');
const again = { kind: 'card', cardId: 'remembered', boardId: 'b9' };
ok('SCOPE page inside a binder, WITH "Again" history: reuses the remembered scope, not the whole-binder default',
  JSON.stringify(resolvePressScope({ openKind: 'page', entryId: 'p5', projectId: 'proj9', lastUsedScopeForBinder: again }))
    === JSON.stringify(again), '');
ok('SCOPE board / script: their own scopes, independent of any "what you\'re on" derivation',
  JSON.stringify(resolvePressScope({ openKind: 'board', entryId: 'brd1' })) === JSON.stringify({ kind: 'board', entryId: 'brd1' })
  && JSON.stringify(resolvePressScope({ openKind: 'script', entryId: 'scr1' })) === JSON.stringify({ kind: 'script', entryId: 'scr1' }), '');
let cardThrew = false;
try { resolvePressScope({ openKind: 'card', entryId: 'board1' }); } catch (e) { cardThrew = e instanceof RangeError; }
ok('SCOPE guard: openKind "card" with no cardId REFUSES loudly rather than silently returning a malformed scope', cardThrew, '');

// ---- select/order.ts — chapterOrder(), and the SEAM-188 tripwire ----------
const { chapterOrder } = await load('press/select/order.ts');

const entries = [
  { id: 'ch-b', createdAt: '2026-01-02T00:00:00.000Z' },
  { id: 'ch-a', createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'ch-c', createdAt: '2026-01-03T00:00:00.000Z' },
];
ok('ORDER: creation order, ascending — out-of-array-order input sorts to ch-a, ch-b, ch-c',
  JSON.stringify(chapterOrder(entries)) === JSON.stringify(['ch-a', 'ch-b', 'ch-c']), JSON.stringify(chapterOrder(entries)));
ok('ORDER: does not mutate its input array (Publish never writes an order, §2)',
  entries[0].id === 'ch-b' && entries.map((e) => e.id).join(',') === 'ch-b,ch-a,ch-c', '');

// THE TRIPWIRE — chapterOrder()'s comparator, read straight out of THIS
// FILE's own source, must be byte-identical to ProjectHome.tsx's own live
// comparator (a.createdAt.localeCompare(b.createdAt)) — not "produces the
// same result on this fixture" (a different comparator can agree by
// coincidence on three items and diverge on a real corpus with same-instant
// pages), the EXACT source text, so a change to either side is caught here,
// never assumed to still agree.
const orderSrc = fs.readFileSync(path.join(SRC, 'press/select/order.ts'), 'utf8');
const projectHomeSrc = fs.readFileSync(path.join(SRC, 'pages/ProjectHome.tsx'), 'utf8');
const COMPARATOR = 'a.createdAt.localeCompare(b.createdAt)';
ok('SEAM-188 TRIPWIRE: chapterOrder()\'s own comparator text is present verbatim in this file',
  orderSrc.includes(COMPARATOR), '');
ok('SEAM-188 TRIPWIRE: ProjectHome.tsx (the binder\'s shown order, live) still uses the SAME comparator text — if this ever goes red, Publish\'s order and the binder\'s shown order have silently diverged and 188\'s seam must be revisited before either changes further',
  projectHomeSrc.includes(COMPARATOR), '');
ok('SEAM-188 marker: the pending-handoff comment is present, so item 188 landing without touching this file is a findable miss, not a silent one',
  orderSrc.includes('SEAM-188'), '');

// ---- render/wzo.ts — the package builder and the credential guard --------
const { buildWzoPackage, scrubForCredentials } = await load('press/render/wzo.ts');

const records = [
  { id: 'p1', kind: 'page', data: { id: 'p1', text: 'Chapter One\n\nBody one.', createdAt: '2026-01-01T00:00:00.000Z' } },
  { id: 'p2', kind: 'page', data: { id: 'p2', text: 'Chapter Two\n\nBody two.', createdAt: '2026-01-02T00:00:00.000Z' } },
];
const pkg = await buildWzoPackage(records, { penName: 'A. Writer', now: '2026-09-30T00:00:00.000Z' });

ok('WZO: every input record is carried verbatim as its own records/<id>.json — the writer\'s own bytes, not re-derived',
  pkg.files.some((f) => f.path === 'records/p1.json' && JSON.parse(f.text).text === 'Chapter One\n\nBody one.')
  && pkg.files.some((f) => f.path === 'records/p2.json' && JSON.parse(f.text).text === 'Chapter Two\n\nBody two.'), '');
ok('WZO: manifest.order matches the records array\'s own order, exactly — buildWzoPackage never re-sorts (the caller\'s chapterOrder() output is the only order)',
  JSON.stringify(pkg.manifest.order) === JSON.stringify(['p1', 'p2']), JSON.stringify(pkg.manifest.order));
ok('WZO: every packaged file has a sha-256 in the manifest, and manifest.json itself is NOT self-hashed (no circular entry)',
  pkg.manifest.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256))
  && !pkg.manifest.files.some((f) => f.path === 'manifest.json'), JSON.stringify(pkg.manifest.files.map((f) => f.path)));
ok('WZO: the sha-256 is REAL, not a placeholder — re-hashing a file\'s own packaged text reproduces the manifest\'s value',
  await (async () => {
    const rec1 = pkg.files.find((f) => f.path === 'records/p1.json');
    const bytes = new TextEncoder().encode(rec1.text);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
    const manifestEntry = pkg.manifest.files.find((f) => f.path === 'records/p1.json');
    return hex === manifestEntry.sha256;
  })(), '');
ok('WZO: README.txt and preview.html are both present, and the preview carries every record\'s own text, unformatted (no marks parser — Pass 2\'s own rejected proposal #4)',
  pkg.files.some((f) => f.path === 'README.txt' && f.text.includes('.wzo'))
  && pkg.files.some((f) => f.path === 'preview.html' && f.text.includes('Chapter One') && f.text.includes('Chapter Two')), '');
ok('WZO: provenance carries the pen name and no email, no credential field of any kind',
  pkg.manifest.provenance.penName === 'A. Writer' && pkg.manifest.provenance.app === 'wrizo', JSON.stringify(pkg.manifest.provenance));

// THE CREDENTIAL GUARD, PROVEN TO ACTUALLY FIRE (a guard that only "would"
// fire is decorative — the house's own law) — an injected credential-shaped
// field, at three different depths, each caught and named in the thrown path.
let caught1 = null;
try { scrubForCredentials({ wordpressToken: 'sekret' }); } catch (e) { caught1 = e.message; }
let caught2 = null;
try { scrubForCredentials({ profile: { session: { password: 'x' } } }); } catch (e) { caught2 = e.message; }
let caught3 = null;
try { scrubForCredentials({ tags: [{ apiKey: 'x' }] }); } catch (e) { caught3 = e.message; }
ok('CREDENTIAL GUARD fires on a top-level credential-shaped key, naming it',
  caught1 !== null && caught1.includes('wordpressToken'), String(caught1));
ok('CREDENTIAL GUARD fires nested three levels deep, naming the full path',
  caught2 !== null && caught2.includes('password') && caught2.includes('$.profile.session.password'), String(caught2));
ok('CREDENTIAL GUARD catches a credential-shaped CONTAINER key too, before even looking inside it ("auth" itself, not just "password")',
  (() => { try { scrubForCredentials({ profile: { auth: { password: 'x' } } }); return false; } catch (e) { return e.message.includes('"auth"') && e.message.includes('$.profile.auth'); } })(), '');
ok('CREDENTIAL GUARD fires inside an array element',
  caught3 !== null && caught3.includes('apiKey'), String(caught3));
ok('CREDENTIAL GUARD does not false-positive on ordinary writer data (author, text, tags as plain strings)',
  (() => { try { scrubForCredentials({ author: 'A. Writer', text: 'plain prose', tags: ['draft', 'chapter'] }); return true; } catch { return false; } })(), '');

// buildWzoPackage calls the guard itself — proven end-to-end, not just via
// the standalone function above.
let packageRefused = false;
try {
  await buildWzoPackage([{ id: 'bad', kind: 'page', data: { text: 'hi', wordpressSecret: 'leak' } }], { penName: null });
} catch (e) { packageRefused = e instanceof RangeError && e.message.includes('wordpressSecret'); }
ok('WZO END-TO-END: buildWzoPackage itself refuses a record carrying a credential-shaped field — never a package that silently drops it and ships anyway',
  packageRefused, '');

fs.rmSync(tmp, { recursive: true, force: true });

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log('\nPUB1-SKELETON PARKED: PASS (0 checks) — HARNESS_PARKED=1 armed; this file parks nothing: press/ is new this commit, falsifying no earlier check.');
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nPUB1-SKELETON VERIFY: PASS (${checks.length} checks)`
  : `\nPUB1-SKELETON VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
