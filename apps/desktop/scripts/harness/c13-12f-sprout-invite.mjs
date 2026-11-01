// #13 step 12f (Fable, Nov 1): the Sprout door AND the first-line invite it turned on are deleted, everywhere, forever.
// The invite's stored pref keys stay as data, untouched (law 4). RED on main first (the door and the invite are there), green
// on the deletion. The checks the deletion falsifies are parked verbatim in their own files (bg1, bg2, escexit, fx15, fx16,
// item109, page-size, page-templates, sprout-invite-scope, sprout-invite-scope-logic), each naming this file.
//   N1 a blank Free Write page: no beginnings row, no Sprout door, no invite; also with the pref seeded 'on' on the bare key
//      and on a writer-scoped key (signed out, so nothing reads either; with the code gone nothing reads any)
//   N2 the stored pref keys are byte-identical after a boot of the new build, and after typing on the page
//   N3 the caret is live with nothing clicked and the first key lands (the TTFK path), and the page rect does not move
//   N4 the source: nothing imports the invite, the global CSS has no .fl-* rule and no page-row rule, the lexicon has no beginSprout
// Run: node apps/desktop/scripts/harness/c13-12f-sprout-invite.mjs  (from apps/desktop, dist-web built).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
import { globalCss } from '../global-css.mjs';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const KEYS = { 'wrizo-first-line-invite': 'on', 'wrizo-first-line-invite:c13-12f-writer': 'on', 'wrizo-first-line-invite-migrated': '1' };

// ---- N4, browserless: the source ----
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const code = walk(SRC).filter((f) => /\.(ts|tsx)$/.test(f));
const importers = code.filter((f) => /from '[./]+components\/useFirstLineInvite'|from '\.\/useFirstLineInvite'/.test(fs.readFileSync(f, 'utf8')));
ok('N4: no source file imports the first-line invite, and its module is gone', importers.length === 0 && !fs.existsSync(path.join(SRC, 'components', 'useFirstLineInvite.tsx')),
  J({ importers: importers.map((f) => path.relative(SRC, f)) }));
const css = globalCss(SRC);
const flRules = css.match(/(^|\n)[^\n/*]*\.fl-(invite|prompt|affordance|never)\b[^{\n]*\{/g) || [];
const pageRow = css.match(/[^\n]*\[data-beginnings='page'\][^{\n]*\{/g) || [];
ok('N4: the global CSS carries no .fl-* rule and no page-row rule ([data-beginnings=\'page\'])', flRules.length === 0 && pageRow.length === 0, J({ flRules, pageRow }));
const lex = fs.readFileSync(path.join(SRC, 'store', 'deskLexicon.ts'), 'utf8');
ok('N4: the lexicon has no beginSprout key', !/\bbeginSprout\b/.test(lex));

const freshDesk = async (app) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, 1366, 768);
};

// A blank loose page through the seam, from the Desk (the seeding law); `keys` are seeded raw on purpose: they are the invite's
// own stored values, which no app seam writes any more, and nothing in the app reads them (that is the claim).
const openBlank = async (app, id, keys) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: '', projectId: null, origin: 'loose', source: 'page', createdAt: new Date().toISOString() })})`);
  if (keys) await app.evalJs(`(() => { const k = ${J(keys)}; for (const [n, v] of Object.entries(k)) localStorage.setItem(n, v); })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after seed' });
  await app.evalJs(`location.hash = '#/page/' + ${J(id)}`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `page ${id}` });
  await sleep(600);
};

const state = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('.forward-only-editor'); const r = ed && ed.getBoundingClientRect();
  return {
    row: !!document.querySelector('.wz-beginnings[data-beginnings="page"]'),
    sprout: !!document.querySelector('[data-beginning="sprout"]'),
    invite: !!document.querySelector('.fl-invite, .fl-prompt, .fl-never'),
    seam: typeof window.wrizoFirstLineInvite,
    caretInEditor: !!ed && (ed === document.activeElement || ed.contains(document.activeElement)),
    rect: r ? [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] : null,
    text: ed ? ed.textContent : null,
  }; })()`);
const keysNow = (app) => app.evalJs(`(() => { const o = {}; for (const n of ${J(Object.keys(KEYS))}) o[n] = localStorage.getItem(n); return o; })()`);

await withHarness(async (app) => {
  // N1 - nothing seeded
  await openBlank(app, 'c13-12f-blank', null);
  const s0 = await state(app);
  ok('N1: a blank page, nothing seeded: no beginnings row, no Sprout door, no invite, no invite seam', !s0.row && !s0.sprout && !s0.invite && s0.seam === 'undefined', J(s0));

  // N1 + N2 - the pref seeded 'on' (bare and writer-scoped)
  await openBlank(app, 'c13-12f-on', KEYS);
  const s1 = await state(app);
  ok('N1: with the invite pref seeded "on" (bare key and a writer-scoped key): still no row, no Sprout door, no invite', !s1.row && !s1.sprout && !s1.invite, J(s1));
  const k1 = await keysNow(app);
  ok('N2: after a boot of the new build the three stored invite keys are byte-identical (no code reads, migrates or deletes them)', J(k1) === J(KEYS), J(k1));

  // N3 - the TTFK path and the page rect
  ok('N3: the caret is live in the editor with nothing clicked (the TTFK path)', s1.caretInEditor === true, J(s1));
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('x');
  await sleep(500);
  const s2 = await state(app);
  ok('N3: the first key lands on the page', (s2.text || '').includes('x'), J(s2));
  ok('N3: the page rect does not move from load to the first key (law 1)', J(s1.rect) === J(s2.rect) && !!s1.rect, J({ before: s1.rect, after: s2.rect }));
  await sleep(1200);
  const k2 = await keysNow(app);
  ok('N2: after typing on the page the stored invite keys are still byte-identical', J(k2) === J(KEYS), J(k2));
  return checks;
});

// eslint-disable-next-line no-console
console.log(J(checks));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nC13-12F VERIFY: PASS (${checks.length} checks)` : `\nC13-12F VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
