// THE REORG'S SPLIT SCREEN IN ARBOR, IN THE APP (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md section 8). The live Arbor (plateau, the redesign on by default), ?reorg=1 with the PREVIEW DOORS (&reorglift=plateau.back,plateau.split: reorg/themeGate.ts keeps them OFF in the table until Fable
// clears them; the door only shows the pieces). The stylesheet's half is reorg-arbor-split-css-unit.mjs; this proves what only the app can. The split opens through the reorg's own seam (window.wrizoSplit, the Open Beside act).
// The fixture (seams only; WS_PLACE=1): a set she made, "Brief": one page, "Arrival" (as-1), and a long page, "Field notes" (as-note), that is opened beside it.
//   AS1  the asset's half sits on Arbor's raised surface: #F6F1E4 by day, #261A12 by night (both rooms are read)
//   AS2  the grip is a 1 px line in --arbor-line with a 6 px handle; focused, the handle fills olive (#56632E)
//   AS3  scrollbars are hidden on the stage's scrollers and on the asset's half (scrollbar-width none), the page's own included
//   AS4  both drawers are off in a split, and the page moves only by the reorg's SHIFT: the same top, width and height, left moved by --wz-split-shift (law 1)
//   AS5  OFF: with the door on only plateau.back (no plateau.split) the split never draws; and the classic Plateau (?arbor2=0) never draws it even through the door
//   AS6  the count row stands under her page: it ends before the docked half starts and is centred on the page (the Wrizors' pass 1)
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-arbor-split-live.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const PAGE = "(() => { const p = document.querySelector('.mode-page') || document.querySelector('.forward-only-editor'); if (!p) return null; const r = p.getBoundingClientRect(); return { left: Math.round(r.left * 10) / 10, top: Math.round(r.top * 10) / 10, width: Math.round(r.width * 10) / 10, height: Math.round(r.height * 10) / 10 }; })()";
const CS = (sel, props, pseudo) => `(() => { const e = document.querySelector(${q(sel)}); if (!e) return null; const c = getComputedStyle(e${pseudo ? ', ' + q(pseudo) : ''}); return ${q(props)}.reduce((o, p) => { o[p] = c.getPropertyValue(p); return o; }, {}); })()`;

async function seed(app, tone) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme-prefs', ${q(JSON.stringify({ voice: 'serif', page: tone, fade: 'on' }))}); localStorage.setItem('wrizo-theme', 'plateau'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('as-note', 'Field notes\\n' + 'The rain came late, and the river ran brown for a week. '.repeat(40), { origin: 'loose' });
    page('as-1', 'The harbour was quiet when she arrived.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    W.wrizoPatchEntry('as-1', { pageSettings: ${PS}, name: 'Arrival', level: 0 } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, { lift = 'plateau.back,plateau.split', arbor2 = true } = {}) {
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });
  await app.evalJs("window.wrizoTheme.set('plateau'); null");
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1${arbor2 ? '' : '&arbor2=0'}${lift ? '&reorglift=' + lift : ''}#/page/${id}')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
}
const split = async (app) => { await app.evalJs("(() => { const S = window.wrizoSplit; if (S) S.open('as-1', { entryId: 'as-note' }); return null; })()"); await sleep(900); };

await withHarness(async (app) => {
  const room = {};
  // the room follows the clock unless data-room says otherwise (arbor2/room.ts: dark = Always night, light = Always day): set it, then read the room in force
  for (const [tone, want] of [['dark', 'rgb(38, 26, 18)'], ['light', 'rgb(246, 241, 228)']]) {
    await seed(app, tone);
    await open(app, 'as-1');
    await split(app);
    await app.evalJs(`document.documentElement.setAttribute('data-room', ${q(tone)}); null`); await sleep(900);
    const r = await app.evalJs("document.documentElement.getAttribute('data-arbor2-room')");
    const bg = await app.evalJs(CS('.wz-split-asset', ['background-color']));
    room[tone] = { room: r, bg: bg && bg['background-color'], want };
  }
  ok('AS1 the asset\'s half sits on Arbor\'s raised surface: #F6F1E4 by day, #261A12 by night', Object.values(room).every((x) => x.bg === x.want) && room.dark.room === 'night' && room.light.room === 'day', room);

  await seed(app, 'dark');
  await open(app, 'as-1');
  const before = await app.evalJs(PAGE);
  await split(app);
  const line = await app.evalJs(CS('.wz-split-grip', ['width'], '::before'));
  const handle = await app.evalJs(CS('.wz-split-grip', ['width', 'border-top-width', 'background-color'], '::after'));
  await app.evalJs("document.querySelector('.wz-split-grip')?.focus(); null"); await sleep(300);
  const focused = await app.evalJs(CS('.wz-split-grip', ['background-color'], '::after'));
  const lineColour = await app.evalJs("(() => { const g = document.querySelector('.wz-split-grip'); const c = getComputedStyle(g, '::before').backgroundColor; const t = document.createElement('i'); t.style.backgroundColor = 'var(--arbor-line)'; document.body.appendChild(t); const v = getComputedStyle(t).backgroundColor; t.remove(); return { c, v }; })()");
  ok('AS2 the grip is a 1 px line in --arbor-line with a 6 px handle; focused, the handle fills olive (#56632E)',
    !!line && line.width === '1px' && lineColour.c === lineColour.v && !!handle && handle.width === '6px' && handle['border-top-width'] === '1px' && !!focused && focused['background-color'] === 'rgb(86, 99, 46)', { line, lineColour, handle, focused });

  const scr = await app.evalJs("(() => { const out = { stage: [], asset: [] }; for (const e of document.querySelectorAll('.desk-frame-stage[data-split=\"true\"] *')) { const c = getComputedStyle(e); if ((e.scrollHeight > e.clientHeight + 2 || e.scrollWidth > e.clientWidth + 2) && c.scrollbarWidth !== 'none') out.stage.push(e.className || e.tagName); } const a = document.querySelector('.wz-split-asset'); if (a) for (const e of [a, ...a.querySelectorAll('*')]) { if (getComputedStyle(e).scrollbarWidth !== 'none') out.asset.push(e.className || e.tagName); } out.hasAsset = !!a; return out; })()");
  ok('AS3 scrollbars are hidden on the stage\'s scrollers and on the asset\'s half', !!scr && scr.hasAsset === true && scr.stage.length === 0 && scr.asset.length === 0, scr);

  const after = await app.evalJs(PAGE);
  const shift = await app.evalJs("(() => { const s = document.querySelector('.desk-frame-stage'); return parseFloat(getComputedStyle(s).getPropertyValue('--wz-split-shift')) || 0; })()");
  const drawers = await app.evalJs("(() => { const v = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).visibility : 'absent'; }; return { tutor: v('.desk-frame-tutor-anchor'), tools: v('.desk-frame-sliver-anchor') }; })()");
  ok('AS4 both drawers are off in a split, and the page moves only by the reorg\'s shift: the same top, width and height, left moved by --wz-split-shift',
    !!before && !!after && before.top === after.top && before.width === after.width && before.height === after.height && Math.abs((after.left - before.left) - shift) <= 1 && drawers.tutor !== 'visible' && drawers.tools !== 'visible', { before, after, shift, drawers });

  // AS6 (the Wrizors' pass 1, split NIT): the count row stands under HER page: it ends at the page's right edge (never runs under the docked half) and is centred on the page, as the page is on the stage
  const cnt = await app.evalJs("(() => { const r = (sel) => { const e = document.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { left: Math.round(b.left * 10) / 10, right: Math.round(b.right * 10) / 10, width: Math.round(b.width * 10) / 10 }; }; return { row: r('.desk-frame-instrument'), page: r('.mode-pagecol') || r('.mode-page'), asset: r('.wz-split-asset') }; })()");
  const centred = !!cnt && !!cnt.row && !!cnt.page && Math.abs((cnt.row.left + cnt.row.width / 2) - (cnt.page.left + cnt.page.width / 2)) <= 2;
  ok('AS6 the count row stands under her page: it ends before the docked half starts and is centred on the page', centred && cnt.row.right <= cnt.asset.left + 1, cnt);

  // SUPERSEDED (Nov 22, Fable 3:20 pm: all six Arbor cells are on and Arbor is on by default, so the cell is not off without the door): the original AS5, verbatim:
  // await open(app, 'as-1', { lift: 'plateau.back' });
  // await split(app);
  // const noCell = await app.evalJs("!!document.querySelector('.wz-split-asset')");
  // await open(app, 'as-1', { arbor2: false });
  // await split(app);
  // const classic = await app.evalJs("!!document.querySelector('.wz-split-asset')");
  // ok('AS5 OFF: with the door on plateau.back only, the split never draws; and the classic Plateau (?arbor2=0) never draws it even through the door', noCell === false && classic === false, { noCell, classic });
  await open(app, 'as-1', { arbor2: false });   // [successor] the classic Plateau (?arbor2=0) never draws the split, door or no door
  await split(app);
  const classic = await app.evalJs("!!document.querySelector('.wz-split-asset')");
  ok('AS5 OFF [successor]: the classic Plateau (?arbor2=0) never draws the split (the redesign off: the reorg never draws there), though the back cell is on', classic === false, { classic });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 6;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-ARBOR-SPLIT-LIVE VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-ARBOR-SPLIT-LIVE VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
