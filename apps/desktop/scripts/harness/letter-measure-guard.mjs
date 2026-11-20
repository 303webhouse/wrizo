// THE LIVE PAGE, NEVER ITS MEASURING COPY (Fable's ruling, Nov 20, 3:40 pm, 2b). Page breaks keep a hidden copy of the page column at the foot of
// <body> (store/pageMeasure.ts, root .wz-letter-measure) with the page's class chain and data attributes. The product reads the page document-wide
// in Tutor.tsx, Cascade.tsx, menusDrawers.ts, arbor2/paper.ts, RhizomeField.tsx and reorg/split/splitStore.ts; where the live page misses the first
// selector, the copy can match first. Every one of those lookups goes through store/liveDom.ts (liveQuery / liveQueryAll: matches outside the copy)
// and registers itself there, so this check can HOLD THE COPY IN FRONT of the live page (moved to the start of <body>, where a plain querySelector
// meets it first) and ask each lookup what it finds.
//
// PREMISE G0  in Arbor and Machina, Draft and Free Write, the open page has its measuring copy (.wz-letter-measure, in <body>, outside #root)
// LIVE    G1  (each of the four) with the copy held first in <body>, every registered lookup is there, finds nothing inside the copy, and the page's
//             own lookups (the Tutor's, the Cascade's and the menus' paper, the visible page) each find the live page
// MUTANT  M1  the hold bites: with the copy first, a plain document.querySelector('.desk-frame-stage--prose .mode-page') returns the copy's page
// SOURCE  S1  in the six files no document.querySelector / querySelectorAll reads the page's chain raw (a chain class, or a selector held in a name)
//         S2  the census goes RED on a raw read planted in each file, and green on the files as they are
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/letter-measure-guard.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const NEED = ['tutor.stage', 'tutor.paper', 'cascade.stage', 'cascade.paper', 'menus.stage', 'menus.paper', 'arbor2.page', 'arbor2.progress', 'rhizome.rects', 'split.typewriter'];
const PAPERS = ['tutor.paper', 'cascade.paper', 'menus.paper', 'arbor2.page'];
const TEXT = Array.from({ length: 30 }, (_, i) => `Line ${i + 1} of the page, long enough to wrap across the measure at least once or twice.`).join('\n');

const HOLD = `(() => { const c = document.querySelector('.wz-letter-measure'); if (!c) return { copy: false };
  const outside = !c.closest('#root'); document.body.insertBefore(c, document.body.firstChild);
  const naive = document.querySelector('.desk-frame-stage--prose .mode-page');
  const L = window.wrizoLiveDom;
  return { copy: true, outside, first: document.body.firstChild === c, naiveInCopy: !!naive && !!naive.closest('.wz-letter-measure'), names: L ? L.names() : null, run: L ? L.run() : null }; })()`;

const results = {};
await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); null");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 }).catch(() => {});
  await app.waitFor('!!window.wrizoTheme && !!window.wrizoCreateJournalPage', { label: 'the seams', timeout: 20000 });
  for (const theme of ['plateau', 'machina']) {
    for (const mode of ['drafting', 'journal']) {
      const pid = `lmg-${theme}-${mode}`;
      await app.evalJs(`window.wrizoTheme.set(${J(theme)}); !!window.wrizoCreateJournalPage(${J({ id: pid, text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
      await app.evalJs(`localStorage.setItem('wrizo-mode-page-${pid}', '${mode}'); window.wrizoFlushNow && window.wrizoFlushNow(); location.hash = '#/page/${pid}'; null`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `${theme} ${mode}`, timeout: 15000 }).catch(() => {});
      await app.waitFor("!!document.querySelector('.wz-letter-measure')", { label: `the copy (${theme} ${mode})`, timeout: 8000 }).catch(() => {});
      await sleep(900);
      results[`${theme}.${mode}`] = await app.evalJs(HOLD);
      await app.evalJs("location.hash = '#/'; null"); await sleep(600);
    }
  }
});

const combos = Object.keys(results);
ok('G0 in Arbor and Machina, Draft and Free Write, the open page has its measuring copy (in <body>, outside #root)',
  combos.length === 4 && combos.every((k) => results[k] && results[k].copy && results[k].outside), Object.fromEntries(combos.map((k) => [k, results[k] && { copy: results[k].copy, outside: results[k].outside }])));
for (const k of ['plateau.drafting', 'plateau.journal', 'machina.drafting', 'machina.journal']) {
  const r = results[k];
  const run = (r && r.run) || {};
  const missing = NEED.filter((n) => !(r && r.names && r.names.includes(n)));
  const inCopy = Object.entries(run).filter(([, v]) => v.inCopy > 0).map(([n]) => n);
  const lost = PAPERS.filter((n) => !run[n] || run[n].n < 1);
  ok(`G1 [${k}] with the copy held first in <body>, every registered lookup is there, none finds the copy, and the page's own lookups find the live page`,
    !!r && r.copy && r.first && missing.length === 0 && inCopy.length === 0 && lost.length === 0 && Object.values(run).every((v) => v.connected), { missing, inCopy, lost, run });
}
ok('M1 the hold bites: with the copy first, a plain document.querySelector(\'.desk-frame-stage--prose .mode-page\') returns the copy\'s page',
  combos.length === 4 && combos.every((k) => results[k] && results[k].naiveInCopy), Object.fromEntries(combos.map((k) => [k, results[k] && results[k].naiveInCopy])));

// ---- SOURCE ------------------------------------------------------------------------------------------------------------------------------
const FILES = ['components/Tutor.tsx', 'components/Cascade.tsx', 'store/menusDrawers.ts', 'arbor2/paper.ts', 'components/RhizomeField.tsx', 'reorg/split/splitStore.ts'];
const CHAIN = ['.desk-frame-stage', '.mode-stage', '.mode-row', '.mode-pagecol', '.mode-page', '.mode-scroll', '.mode-progress', '.forward-only-editor', '.entry-full', '.board-canvas-wrap', '.wz-row'];
const strip = (t) => t.replace(/\r/g, '').replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map((l) => l.replace(/(^|[^:'"`\\])\/\/.*$/, '$1')).join('\n');
// a raw read: document.querySelector(All)( with a literal naming a chain class, or with anything but a literal (a selector held in a name)
const raws = (text) => {
  const out = [];
  for (const m of strip(text).matchAll(/document\.querySelector(?:All)?\(\s*([^)]*)\)/g)) {
    const arg = m[1].trim();
    const lit = /^(['"`])([\s\S]*)\1$/.exec(arg);
    if (!lit || CHAIN.some((c) => lit[2].includes(c))) out.push(arg.slice(0, 80));
  }
  return out;
};
const census = Object.fromEntries(FILES.map((f) => [f, raws(fs.readFileSync(path.join(SRC, f), 'utf8'))]));
ok('S1 in the six files no document.querySelector / querySelectorAll reads the page\'s chain raw (a chain class, or a selector held in a name)',
  Object.values(census).every((v) => v.length === 0), census);
const planted = FILES.every((f) => raws(fs.readFileSync(path.join(SRC, f), 'utf8') + "\nconst x = document.querySelector('.mode-page');\nconst y = document.querySelectorAll(SEL);\n").length >= 2);
ok('S2 the census goes RED on a raw read planted in each file (a chain literal and a held selector), and green on the files as they are', planted, { planted });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1800)}`);
const EXPECTED = 8;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nLETTER-MEASURE-GUARD VERIFY: PASS (${checks.length} checks)`
  : `\nLETTER-MEASURE-GUARD VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
