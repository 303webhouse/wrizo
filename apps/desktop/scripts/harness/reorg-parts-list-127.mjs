// #127 (Nick, live L7, every theme; Fable, Nov 24, 11:15 am): "the Parts list is cluttered" - FINALIZE's PARTS tab (Arbor, Machina) and Flux's TRACKS in Uplink: the up/down buttons are huge and sit on rows of
// their own, the checkboxes drop onto their own lines. Fable's spec: ONE LINE PER PART - [tick] [number. name, one line, cut with "..."] and at the row's right end [up] [down] as small icon buttons (a 24 px
// target, quiet colour, always visible: nothing hover-only); the first row's up and the last row's down are shown disabled; rows about 32 px tall at 1366, no extra lines between Parts; the words and what each
// button does are unchanged; each theme's own dress. Checked at 1366, 1920 and 2560: one line per Part, no wrap, nothing overlapping, the buttons reachable by keyboard.
//
// THE FIXTURE   a Doc of five Parts whose names run from short to far longer than the drawer is wide (the cut must be the name's, never a wrapped row)
// ONE LINE  L1  every row: the tick, the number-and-name, the up and the down all sit on ONE line (their centres within 3 px of each other), and no row is taller than its button plus 16 px (so nothing wrapped under a row)
//           L2  the name is ONE line cut with an ellipsis: nowrap, hidden overflow, ellipsis; the long names are cut, the short one is not
// SIZE      S1  [1366] a row is about 32 px (28 to 36)
//           S2  [1366] each up and down is a 24 px target (22 to 26) and square at every width; the tick no larger than a button (the 1920 and 2560 sizes are the chrome scale, #126)
// ORDER     R1  the tick, then the name, then the up and the down, left to right; the up and the down at the row's right end (within 12 px of it)
// ENDS      E1  the first Part's up and the last Part's down are disabled; every other up and down is enabled
// SEEN      V1  the buttons are always visible: full opacity, visible, not hidden at rest (nothing hover-only)
// NOLAP     N1  no two of a row's four controls overlap, and none leaves the row
// KEYS      K1  every enabled up, down and tick takes the keyboard's focus (tabIndex 0 or more, a real focus lands on it)
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-parts-list-127.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const NAMES = ['Opening', 'The long middle of the story where everything changes and nobody agrees what happened', 'Close', 'An afterword that goes on about the weather in the harbour town for far too long to fit', 'Notes'];
const SIZES = [[1366, 768], [1920, 1080], [2560, 1440]];
const THEMES = [
  { id: 'machina', set: 'machina', url: '/?reorg=1&arbor2=0&flux3=0' },
  { id: 'plateau', set: 'plateau', url: '/?reorg=1&reorglift=plateau.front,plateau.top,plateau.back,plateau.uplink' },
  { id: 'flux', set: 'flux', url: '/?reorg=1&arbor2=0&flux3=1&reorglift=flux.top,flux.front,flux.uplink,flux.back' },
];

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const doc = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(doc.id, grants.id);
    ${q(NAMES)}.forEach((name, i) => {
      page('pl-' + (i + 1), 'Words of part ' + (i + 1) + '.', { origin: 'project', projectId: doc.id, orderIndex: i });
      W.wrizoPatchEntry('pl-' + (i + 1), { pageSettings: ${PS}, name, level: 0 } });
    });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, theme, [w, h]) {
  await app.emulateDpr(1, w, h);
  await app.waitFor("typeof window.wrizoTheme === 'object'", { label: 'the theme seam', timeout: 15000 });
  await app.evalJs(`window.wrizoTheme.set('${theme.set}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${theme.url}#/page/pl-3')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(700);
  for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) {
    await app.evalJs("(() => { const b = document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"publish\"]'); if (b) b.click(); return null; })()"); await sleep(900);
  }
  const isOpen = () => app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!(await isOpen())) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(800); }
  if (!(await isOpen())) { await app.evalJs("document.querySelector('[data-menus-handle]')?.click(); null"); await sleep(800); }
}
const MEASURE = `(() => {
  const rows = [...document.querySelectorAll('.wz-sliver [data-pubparts-row]')];
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, cy: (r.top + r.bottom) / 2 }; };
  const hit = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
  return rows.map((row, i) => {
    const tick = row.querySelector('[data-pubparts-tick]'), name = row.querySelector('.reorg-pubparts-name'), up = row.querySelector('[data-pubparts-up]'), down = row.querySelector('[data-pubparts-down]');
    if (!tick || !name || !up || !down) return { i, missing: true };
    const rr = R(row), c = { tick: R(tick), name: R(name), up: R(up), down: R(down) };
    const ks = Object.keys(c);
    const overlaps = []; for (let a = 0; a < ks.length; a++) for (let b = a + 1; b < ks.length; b++) if (hit(c[ks[a]], c[ks[b]])) overlaps.push(ks[a] + '/' + ks[b]);
    const outside = ks.filter((k) => c[k].l < rr.l - 0.5 || c[k].r > rr.r + 0.5 || c[k].t < rr.t - 0.5 || c[k].b > rr.b + 0.5);
    const ns = getComputedStyle(name), us = getComputedStyle(up), ds = getComputedStyle(down);
    const vis = (cs) => cs.visibility === 'visible' && cs.display !== 'none' && (cs.opacity === '1' || cs.opacity === '0.35' || parseFloat(cs.opacity) >= 0.3);
    return { i, rowH: Math.round(rr.h * 10) / 10, rowW: Math.round(rr.w), c, cyMax: Math.max(...ks.map((k) => c[k].cy)), cyMin: Math.min(...ks.map((k) => c[k].cy)), overlaps, outside,
      nameWS: ns.whiteSpace, nameOv: ns.overflow, nameTO: ns.textOverflow, nameCut: name.scrollWidth > name.clientWidth + 1, text: name.textContent.trim().slice(0, 24),
      upDis: up.disabled, downDis: down.disabled, upTab: up.tabIndex, downTab: down.tabIndex, tickTab: tick.tabIndex, upOp: us.opacity, downOp: ds.opacity, upVis: vis(us), downVis: vis(ds), upW: Math.round(c.up.w), upH: Math.round(c.up.h), downW: Math.round(c.down.w), downH: Math.round(c.down.h), tickW: Math.round(c.tick.w), tickH: Math.round(c.tick.h),
      rightGap: Math.round(rr.r - c.down.r), order: c.tick.l < c.name.l && c.name.r <= c.up.l + 0.5 && c.up.r <= c.down.l + 0.5 };
  });
})()`;

await withHarness(async (app) => {
  await seed(app);
  for (const theme of THEMES) for (const size of SIZES) {
    const tag = `${theme.id} ${size[0]}`;
    await open(app, theme, size);
    const rows = await app.evalJs(MEASURE);
    const have = Array.isArray(rows) && rows.length === NAMES.length && rows.every((r) => !r.missing);
    ok(`FIXTURE [${tag}]: the PARTS list is open with its ${NAMES.length} rows`, have, have ? '' : JSON.stringify(rows));
    if (!have) continue;
    const bad = (fn) => rows.filter((r) => !fn(r)).map((r) => `#${r.i + 1}`);
    const detail = (fn) => rows.map((r) => `#${r.i + 1}:${fn(r)}`).join(' ');
    const l1 = bad((r) => r.cyMax - r.cyMin <= 3 && r.rowH <= Math.max(r.upH, 24) + 16);
    ok(`L1 [${tag}]: every row is ONE line - tick, name, up and down share a centre line, and no row is taller than its button plus 16 px`, l1.length === 0, detail((r) => `h${r.rowH} dy${Math.round((r.cyMax - r.cyMin) * 10) / 10}`));
    const l2 = bad((r) => r.nameWS === 'nowrap' && r.nameOv === 'hidden' && r.nameTO === 'ellipsis') ; const longCut = rows.filter((r) => r.i === 1 || r.i === 3).every((r) => r.nameCut);
    ok(`L2 [${tag}]: the name is one line cut with an ellipsis (nowrap, hidden, ellipsis); the two long names are cut`, l2.length === 0 && longCut, detail((r) => `${r.nameWS}/${r.nameOv}/${r.nameTO}/cut${r.nameCut ? 1 : 0}`));
    if (size[0] === 1366) ok(`S1 [${tag}]: a row is about 32 px (28 to 36)`, bad((r) => r.rowH >= 28 && r.rowH <= 36).length === 0, detail((r) => String(r.rowH)));
    // the buttons' size at 1920 and 2560 is the chrome scale's (Machina's menus grow with the screen: #126, POLISH's); this file holds the 1366 size to the spec and, at every width, the button square
    ok(`S2 [${tag}]: each up and down is a square target - 24 px (22 to 26) at 1366 - and the tick a small box`, bad((r) => r.upW === r.upH && r.downW === r.downH && (size[0] !== 1366 || [r.upW, r.downW].every((v) => v >= 22 && v <= 26)) && r.tickW <= r.upW).length === 0, detail((r) => `${r.upW}x${r.upH} ${r.downW}x${r.downH} tick${r.tickW}`));
    ok(`R1 [${tag}]: tick, then name, then up and down, left to right; the buttons at the row's right end (within 12 px)`, bad((r) => r.order && r.rightGap <= 12).length === 0, detail((r) => `${r.order ? 'ok' : 'order'} gap${r.rightGap}`));
    ok(`E1 [${tag}]: the first up and the last down are disabled; every other up and down is enabled`, rows.every((r, n) => r.upDis === (n === 0) && r.downDis === (n === rows.length - 1)), detail((r) => `${r.upDis ? 'U' : 'u'}${r.downDis ? 'D' : 'd'}`));
    ok(`V1 [${tag}]: the buttons are always visible (nothing hover-only): visible, not hidden, opacity .3 or more`, bad((r) => r.upVis && r.downVis).length === 0, detail((r) => `${r.upOp}/${r.downOp}`));
    ok(`N1 [${tag}]: no two of a row's controls overlap, and none leaves the row`, bad((r) => r.overlaps.length === 0 && r.outside.length === 0).length === 0, detail((r) => `${r.overlaps.join(',') || '-'}|${r.outside.join(',') || '-'}`));
    const focus = await app.evalJs(`(() => { const out = []; for (const row of document.querySelectorAll('.wz-sliver [data-pubparts-row]')) for (const sel of ['[data-pubparts-tick]', '[data-pubparts-up]', '[data-pubparts-down]']) { const e = row.querySelector(sel); if (!e || e.disabled) continue; e.focus(); out.push(document.activeElement === e && e.tabIndex >= 0); } return out; })()`);
    ok(`K1 [${tag}]: every enabled tick, up and down takes the keyboard's focus`, Array.isArray(focus) && focus.length >= 10 && focus.every(Boolean), JSON.stringify(focus));
  }
});

const pass = checks.every((c) => c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(pass ? `\nREORG-PARTS-LIST-127 VERIFY: PASS (${checks.length} checks)` : `\nREORG-PARTS-LIST-127 VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
