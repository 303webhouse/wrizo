// EMPTY-LINE-CARET (cursor/empty-line-caret @ 985588ba, Fable read it Oct 19; Nick's report: Enter after a title leaves the caret at the RIGHT edge).
// The end-of-file guard (the zero-width character that gives a trailing newline a caret target) used to be the editor's LAST CHILD, after the trailing empty row.
// The rows are width:100% inline-blocks, so a guard after one is laid out at the right edge and Chrome painted the caret there. The branch puts the guard INSIDE the
// trailing empty row (store/lineRows.ts lineHtml); the text is unchanged, and cards and the non-row editor are untouched.
//
//   PART 1  (browserless)  the REAL lineRows.ts bundled with esbuild against a recording stand-in for the editor element: a text ending in a newline mounts its guard INSIDE the
//                          last (empty) row and nowhere else; a text that does not end in a newline, a middle empty line and a one-line empty page carry no guard.
//                          Three mutants, each landing asserted: the guard back AFTER the row (the bug), a guard in every empty row, a guard on a one-line empty page.
//                          Source pins for the paths that cannot run without a layout: the same lineHtml is used on mount, region replace, kept-row write and reveal, and the caret
//                          point for the end of a newline-ended text is found inside the last row.
//   PART 2  (a box turn)   the real app, real keys: type a title and press Enter - the caret sits at the row's left padding (not at the right edge) and is INSIDE the last row;
//                          a second Enter does the same; typing carries on from the left and the stored text is exactly what was typed.
//
// Run: node scripts/harness/empty-line-caret.mjs   (from apps/desktop; PART 2 needs a box turn)      BROWSERLESS_ONLY=1 runs PART 1 alone
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const readSrc = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
const ZW = String.fromCharCode(0x200b);
const GUARD = `<span class="md-eof-guard" aria-hidden="true">${ZW}</span>`;

// ---- the real lineRows, bundled; the editor element is a recording stand-in (mountRows only assigns innerHTML and reads children / dataset) -------------------------------------
let nonce = 0;
async function load(transform) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __n = ${nonce};\nexport { mountRows } from './store/lineRows';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: rel === 'store/lineRows.ts' && transform ? transform(text) : text, loader: 'ts' };
      });
    } }],
  });
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}
const stand = () => ({ innerHTML: '', children: [], dataset: {}, classList: { contains: () => false } });
const mounted = (M, text) => { const el = stand(); M.mountRows(el, text, null); return el.innerHTML; };
const count = (s, sub) => s.split(sub).length - 1;

function suite(M) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };
  const a = mounted(M, 'Title\n');
  keep('G1', a.endsWith(`<span class="wz-row">${GUARD}</span>`) && count(a, GUARD) === 1 && count(a, '<span class="wz-row">') === 2, a);
  keep('G1b', !a.endsWith(`</span>${GUARD}`) && !a.includes(`</span>\n${GUARD}`), 'never after a row');
  const b = mounted(M, 'Title');
  keep('G2', count(b, GUARD) === 0, b);
  const c = mounted(M, 'A\n\nB');
  keep('G3', count(c, GUARD) === 0 && count(c, '<span class="wz-row">') === 3, c);
  const d = mounted(M, 'A\n\nB\n');
  keep('G4', count(d, GUARD) === 1 && d.endsWith(`<span class="wz-row">${GUARD}</span>`), d);
  const e = mounted(M, '');
  keep('G5', count(e, GUARD) === 0, e);
  const f = mounted(M, '\n');
  keep('G6', count(f, GUARD) === 1 && count(f, '<span class="wz-row">') === 2, f);
  return r;
}

const MUTANTS = [
  { name: 'the guard is back AFTER the trailing row (the bug)', edits: [
    ["return i === lines.length - 1 && lines.length > 1 && lines[i] === '' ? body + GUARD_HTML : body;", 'return body;'],
    ["el.innerHTML = bodies.map(rowSpan).join('\\n');", "el.innerHTML = bodies.map(rowSpan).join('\\n') + (text.endsWith('\\n') ? GUARD_HTML : '');"],
  ], red: ['G1', 'G1b'] },
  { name: 'a guard in EVERY empty row', edits: [["return i === lines.length - 1 && lines.length > 1 && lines[i] === '' ? body + GUARD_HTML : body;", "return lines.length > 1 && lines[i] === '' ? body + GUARD_HTML : body;"]], red: ['G3', 'G4'] },
  { name: 'a guard on a one-line empty page', edits: [["return i === lines.length - 1 && lines.length > 1 && lines[i] === '' ? body + GUARD_HTML : body;", "return i === lines.length - 1 && lines[i] === '' ? body + GUARD_HTML : body;"]], red: ['G5'] },
];

let loaded = null, loadErr = null;
try { loaded = await load(); } catch (err) { loadErr = String((err && err.message) || err).split('\n')[0].slice(0, 200); }
if (!loaded) ok('PART 1 loads the real lineRows.ts', false, loadErr);
else {
  const base = suite(loaded);
  for (const [k, v] of Object.entries(base)) ok(k, v.pass, v.detail);
  const src = readSrc('store/lineRows.ts');
  let landed = 0, killed = 0;
  for (const mu of MUTANTS) {
    const missing = mu.edits.filter(([from]) => src.split(from).length - 1 !== 1);
    if (missing.length) { ok(`mutant "${mu.name}": the mutation LANDED (each anchor found exactly once)`, false, missing.map((m) => m[0].slice(0, 60)).join(' | ')); continue; }
    landed += 1;
    let rr = {};
    try { rr = suite(await load((t) => mu.edits.reduce((acc, [from, to]) => acc.replace(from, to), t))); } catch (err) { rr = { __crash: String(err && err.message) }; }
    const went = mu.red.filter((k) => !rr[k] || !rr[k].pass);
    const crashed = !!rr.__crash;
    ok(`mutant "${mu.name}" is KILLED by a check, not a crash (reddens: ${mu.red.join(', ')})`, !crashed && went.length === mu.red.length, crashed ? `crash: ${rr.__crash}` : `red: ${went.join(', ') || 'none'}`);
    if (!crashed && went.length === mu.red.length) killed += 1;
  }
  ok(`all ${MUTANTS.length} mutations landed and ${MUTANTS.length} were killed`, landed === MUTANTS.length && killed === MUTANTS.length, `${landed} landed / ${killed} killed`);
  // the paths that need a layout, pinned in source
  ok('P1 one lineHtml feeds every write path: mountRows, replaceRegion, the kept-row compare, the revealed rows (writeRows and revealRowsAtCaret) - no path appends a guard after a row',
    (src.match(/lineHtml\(/g) || []).length === 5 &&!/\+ \(text\.endsWith\('\\n'\) \? GUARD_HTML : ''\)/.test(src) && !/\(next \? '\\n' : \(lastLine/.test(src), `lineHtml x${(src.match(/lineHtml\(/g) || []).length}`);
  ok('P2 the caret point for the end of a newline-ended text is found INSIDE the last row (rowsPointFor looks in R.rows[last], offset 0), not in an editor-level last child',
    /const last = R\.rows\[R\.rows\.length - 1\];\s*const g = last\?\.querySelector\('\.md-eof-guard'\);/.test(src) && !/el\.lastElementChild/.test(src.slice(src.indexOf('export function rowsPointFor'), src.indexOf('export function rowsPointFor') + 900)), '');
  ok('P3 the shadow-line verify reads a row\'s text without its guard (a row that holds the guard still equals its line)', /row\.textContent \?\? ''\)\.split\(EOF_GUARD\)\.join\(''\) !== R\.lines\[i\]/.test(src), '');
}

// ================================================================================================================================================================================
// PART 2 - the real app (a box turn). Real keys; the caret's place is READ from the selection (a collapsed range's client rect), never assumed.
// ================================================================================================================================================================================
async function part2() {
  const { withHarness } = await import('../runtime-verify.mjs');
  await withHarness(async (app) => {
    const sleep = sleepMs;
    const ED = '.forward-only-editor';
    const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
    const open = async (id, text) => {
      await app.emulateDpr(1, 1400, 900);
      await app.goto('/');
      await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
      await app.reload();
      await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
      await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
      await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
      await sleep(500);
      await app.evalJs(`location.hash = '#/page/${id}'`);
      if (!(await waitSoft(`!!document.querySelector('${ED}')`, { label: 'page framed' }))) return false;
      await sleep(500);
      await app.evalJs("(() => { const b = document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]'); if (b) b.click(); })()");
      await waitSoft(`!!document.querySelector('${ED} .wz-row')`, { label: 'Draft rows' });
      await sleep(600);
      return true;
    };
    const caret = () => app.evalJs(`(() => {
      const sel = getSelection(); if (!sel || !sel.rangeCount) return null;
      const r = sel.getRangeAt(0);
      const rows = [...document.querySelectorAll('${ED} .wz-row')]; const last = rows[rows.length - 1]; if (!last) return null;
      const rects = r.getClientRects(); const rc = rects.length ? rects[0] : r.getBoundingClientRect();
      const lr = last.getBoundingClientRect(); const pad = parseFloat(getComputedStyle(last).paddingLeft) || 0;
      return { x: Math.round(rc.left * 10) / 10, rowLeft: Math.round(lr.left * 10) / 10, pad, rowRight: Math.round(lr.right * 10) / 10, caretBottom: Math.round(rc.bottom * 10) / 10, rowBottom: Math.round(lr.bottom * 10) / 10, lh: parseFloat(getComputedStyle(last).lineHeight) || null, inLast: last.contains(r.startContainer), rows: rows.length, guards: document.querySelectorAll('${ED} .md-eof-guard').length };
    })()`);
    const stored = (id) => app.evalJs(`(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${JSON.stringify(id)}) || {}).text ?? null`);

    const up = await open('elc1', 'A title');
    ok('premise: the page opens in Draft as rows', up && (await app.evalJs(`!!document.querySelector('${ED} .wz-row')`)) === true, String(up));
    await app.evalJs(`document.querySelector('${ED}').focus()`);
    await app.typeKeys('\n');
    await sleep(500);
    const c1 = await caret();
    ok('E1 after Enter on a title the caret is INSIDE the new last row, at its left padding - not at the right edge (the bug put it at the row\'s right end)',
      !!c1 && c1.inLast === true && Math.abs(c1.x - (c1.rowLeft + c1.pad)) <= 2 && c1.x < c1.rowRight - 100, JSON.stringify(c1));
    ok('E1 and exactly one guard exists, inside that row', !!c1 && c1.guards === 1 && c1.rows === 2, JSON.stringify(c1));
    await app.typeKeys('\n');
    await sleep(400);
    const c2 = await caret();
    ok('E2 a second Enter (a blank line, then the empty last row): the caret is again at the left padding of the last row', !!c2 && c2.inLast === true && Math.abs(c2.x - (c2.rowLeft + c2.pad)) <= 2 && c2.rows === 3 && c2.guards === 1, JSON.stringify(c2));
    // fx1.mjs tracks the caret line by `ed.lastElementChild`'s bottom (its stand-in for what useTypewriterFade reads). With the guard inside the last row that child is the LAST ROW, whose bottom is the
    // line box's bottom - one half-leading below the caret's own glyph bottom (the guard span used to BE the caret's box). fx1 reads only line-to-line deltas of it, so a constant offset leaves
    // its checks standing; this holds the two claims that make that true: the offset is bounded by half a line, and it does not change from one Enter to the next.
    const off1 = c1 && c1.rowBottom - c1.caretBottom, off2 = c2 && c2.rowBottom - c2.caretBottom;
    ok('E4 the last row bottom (what the lastElementChild proxy in fx1.mjs now reads) is the caret line bottom to within half a line-height, and the offset is the SAME after a second Enter (so line-to-line deltas of the proxy are unchanged)',
      !!c1 && !!c2 && c1.lh > 0 && off1 >= -1 && off1 <= c1.lh / 2 + 1 && Math.abs(off2 - off1) <= 1, JSON.stringify({ off1, off2, lh: c1 && c1.lh }));
    await app.typeKeys('Next');
    await sleep(500);
    const c3 = await caret();
    const text = await stored('elc1');
    ok('E3 typing carries on from the left (the guard is gone once the row has a letter) and the stored text is exactly what was typed (no guard character stored)', !!c3 && c3.inLast === true && c3.x > c3.rowLeft + c3.pad && c3.x < c3.rowLeft + 200 && c3.guards === 0 && text === 'A title\n\nNext', JSON.stringify({ c3, text }));
  });
}

if (process.env.BROWSERLESS_ONLY !== '1') {
  try { await part2(); } catch (err) { ok('PART 2 ran to the end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }
} else console.log('(BROWSERLESS_ONLY: PART 2 skipped - the real-app scenario needs a box turn)');

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nEMPTY-LINE-CARET VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nEMPTY-LINE-CARET VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
