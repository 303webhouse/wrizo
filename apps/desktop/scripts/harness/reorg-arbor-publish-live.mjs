// THE REORG'S PUBLISH VIEW IN ARBOR, IN THE APP (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md section 9; the Wrizors' pass 1 on the Flux Uplink, REAL 1 and 3). The live Arbor (plateau, the redesign on by default), ?reorg=1 with the PREVIEW DOORS (&reorglift=plateau.top,plateau.uplink,plateau.back:
// reorg/themeGate.ts keeps them OFF in the table until Fable clears them; the doors only show the pieces; the top bar is ARBOR's, so the Publish stage is pressed on the reorg's own top bar here). The stylesheet's half is reorg-arbor-publish-css-unit.mjs; this proves what only the app can.
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": two pages -> two Sections, ap-1 "Arrival", ap-2 "The town".
//   AP1  the sheet is the page's own paper, laid exactly over it (inside the paper's own 1 px edge: the same inset on every side, 2 px at most): nothing of the page's own text shows through (the sheet is what stands at its centre)
//   AP2  the sheet has no box of its own: no outline (focused or not) and no border; it is not the browser's focus ring in orange
//   AP3  nothing is left raw: the foot's buttons are small and in the drawer's style (transparent, a 1 px --arbor-line edge, the paper's ink), the ticks are olive (#56632E)
//   AP4  Arbor's words: "Copy text", "Copy formatted", "Export", "Markdown", "Plain text", "Web (HTML)"
//   AP5  PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same closed, open and closed again; the editor is the same node
//   AP6  OFF: with the doors on plateau.top only (no plateau.uplink) the Publish stage draws no sheet
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-publish-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const PAGE = "(() => ['.mode-pagecol', '.mode-page', '.forward-only-editor'].map((s) => { const p = document.querySelector(s); if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(','); }).join('|'))()";
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const CS = (sel, props) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;
const PUB = '.reorg-top .desk-mode-tab[data-mode-key="publish"]';

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme', 'plateau'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('ap-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('ap-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('ap-1', { pageSettings: ${PS}, name: 'Arrival', level: 0 } });
    W.wrizoPatchEntry('ap-2', { pageSettings: ${PS}, name: 'The town', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
// SUPERSEDED (Nov 22, AP6's successor reads the classic Plateau: open() takes arbor2, as split-live's does): the original open(), verbatim:
// async function open(app, id, { w = 1366, lift = 'plateau.top,plateau.uplink,plateau.back' } = {}) {
// await app.evalJs(`history.replaceState(null, '', '/?reorg=1${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
// [successor] the same two lines with the arbor2 option:
async function open(app, id, { w = 1366, lift = 'plateau.top,plateau.uplink,plateau.back', arbor2 = true } = {}) {
  await app.emulateDpr(1, w, 768);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });
  await app.evalJs("window.wrizoTheme.set('plateau'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1${arbor2 ? '' : '&arbor2=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const sheetOpen = async (app) => { for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) { await app.evalJs(press(PUB)); await sleep(900); } };

await withHarness(async (app) => {
  await seed(app);
  await open(app, 'ap-1');
  await app.evalJs("window.__apEditor = document.querySelector('.forward-only-editor'); null");
  const closed0 = await app.evalJs(PAGE);
  await sheetOpen(app);
  const fit = await app.evalJs("(() => { const s = document.querySelector('[data-reorg-pub]'), p = document.querySelector('.mode-page'); if (!s || !p) return null; const a = s.getBoundingClientRect(), b = p.getBoundingClientRect(); const mid = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2); return { d: [a.left - b.left, a.top - b.top, a.width - b.width, a.height - b.height].map((v) => Math.round(v * 10) / 10), onTop: !!mid && !!mid.closest('[data-reorg-pub]') }; })()");
  ok('AP1 the sheet is the page\'s own paper, laid exactly over it: its rect is the paper\'s, and the sheet is what stands at its centre', !!fit && fit.d.every((v) => Math.abs(v) <= 2) && fit.d[0] === fit.d[1] && fit.d[2] === fit.d[3] && fit.d[2] === -2 * fit.d[0] && fit.onTop === true, fit);

  await app.evalJs("document.querySelector('[data-reorg-pub]').focus(); null"); await sleep(300);
  const box = await app.evalJs(CS('[data-reorg-pub]', ['outline-style', 'outline-width', 'border-top-width', 'border-left-width']));
  ok('AP2 the sheet has no box of its own: no outline (focused) and no border', !!box && (box['outline-style'] === 'none' || box['outline-width'] === '0px') && box['border-top-width'] === '0px' && box['border-left-width'] === '0px', box);

  const line = await app.evalJs("(() => { const t = document.createElement('i'); t.style.borderTop = '1px solid var(--arbor-line)'; document.body.appendChild(t); const c = getComputedStyle(t).borderTopColor; t.remove(); return c; })()");
  const btn = await app.evalJs("(() => { const bs = [...document.querySelectorAll('[data-reorg-pub] .reorg-pub-btn')]; const loud = bs.filter((b) => !b.classList.contains('is-quiet')); const c = (b) => getComputedStyle(b); return { n: bs.length, bad: loud.filter((b) => c(b).backgroundColor !== 'rgba(0, 0, 0, 0)' || c(b).borderTopColor !== window.__apLine || c(b).borderTopWidth !== '1px').length, h: loud.length ? c(loud[0]).height : null }; })()".replace('window.__apLine', JSON.stringify(line)));
  const tick = await app.evalJs("(() => { const i = document.querySelector('[data-reorg-pub] .reorg-pub-tick input'); return i ? getComputedStyle(i).accentColor : null; })()");
  ok('AP3 nothing is left raw: the foot\'s buttons are small and in the drawer\'s style (transparent, a 1 px --arbor-line edge), the ticks are olive (#56632E)', !!btn && btn.n >= 6 && btn.bad === 0 && btn.h === '24px' && tick === 'rgb(86, 99, 46)', { line, btn, tick });

  const words = await app.evalJs("(() => [...document.querySelectorAll('[data-reorg-pub] .reorg-pub-btn')].map((b) => (b.textContent || '').trim()))()");
  const exportWord = await app.evalJs("(() => (document.querySelector('[data-pub-exportlabel]')?.textContent || '').trim())()");
  ok('AP4 Arbor\'s words: "Copy text", "Copy formatted", "Export", "Markdown", "Plain text", "Web (HTML)"',
    ['Copy text', 'Copy formatted', 'Markdown', 'Plain text', 'Web (HTML)'].every((w) => words.includes(w)) && /^Export/.test(exportWord), { words, exportWord });

  await app.evalJs(press('[data-pub-back]')); await sleep(600);
  const closed1 = await app.evalJs(PAGE);
  const same = await app.evalJs("document.querySelector('.forward-only-editor') === window.__apEditor");
  const geo = { w1366: closed0 === closed1 && same };
  await open(app, 'ap-1', { w: 1920 });
  const c0 = await app.evalJs(PAGE);
  await sheetOpen(app);
  await app.evalJs(press('[data-pub-back]')); await sleep(600);
  geo.w1920 = c0 === (await app.evalJs(PAGE));
  ok('AP5 PAGE IS PRIMARY [1366, 1920]: the column, paper and editor rects are the same closed, open and closed again; the editor is the same node', geo.w1366 && geo.w1920, { geo, closed0, closed1, c0 });

  // SUPERSEDED (Nov 22, Fable 3:20 pm: all six Arbor cells are on and Arbor is on by default, so the cell is not off without the door): the original AP6, verbatim:
  // await open(app, 'ap-1', { lift: 'plateau.top' });
  // await app.evalJs(press(PUB)); await sleep(900);
  // const none = await app.evalJs("!!document.querySelector('[data-reorg-pub]')");
  // ok('AP6 OFF: with the doors on plateau.top only (no plateau.uplink) the Publish stage draws no sheet', none === false, { none });
  await open(app, 'ap-1', { arbor2: false });   // [successor] the classic Plateau (?arbor2=0) has no Publish sheet even though the cell is on
  await app.evalJs(press(PUB)); await sleep(900);
  const none = await app.evalJs("!!document.querySelector('[data-reorg-pub]')");
  ok('AP6 OFF [successor]: the classic Plateau (?arbor2=0) draws no Publish sheet even with the cell on (the redesign off: the reorg never draws there)', none === false, { none });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-PUBLISH-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-PUBLISH-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
