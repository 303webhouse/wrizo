// SCREENPLAY ARROWS (POLISH; Fable, Nov 19 7:55 pm, ask (e): "screenplay arrows: next"). The Part arrows of reorg-part-moves.mjs, on a script
// page: a screenplay Part has the same two arrows, capping ITS scroller's bar (.desk-frame-scroll-cap, not the prose .mode-scroll). Machina
// only, behind ?reorg=1. The foot is not in this ask (the arrows only).
//
// The fixture (seeded through the app's own seams; WS_PLACE=1 so the account gets its Top Drawer and its app-made set):
//   Grants       a set she made, "Reel": three Parts in her order - "Reel one" (prose), a screenplay page (INT. GARAGE - NIGHT), "Reel three" (prose)
//   Top Drawer   its app-made set: a screenplay page alone (a one-Part Doc)
//
// OFF    M0  switch off in Machina, and on in Arbor and Flux: no arrows on the script page
// ARROWS A1  on the script Part (Part 2 of 3): "Previous Part: 1, Reel one" above and "Next Part: 3, Reel three" below, both live; the arrows sit
//            on the script stage itself (a direct child of .desk-frame-stage), never inside the scroller (they do not scroll with the sheet)
//        A2  they cap the script scroller's own bar: centred on its right-hand bar (its gutter is both-edges, so the bar is measured from the
//            content box, not halved from offsetWidth - clientWidth), the upper at its top and the lower at its bottom
//        A3  [1366, 1920] the script page's rect (scroller, column, first sheet) is the same with the switch off and on
//        K1  while she types 12 keys in the script, the arrows render ZERO times (window.wrizoPartMovesRenders; the counter is live)
//        A4  she types, then presses the lower arrow at once: her words are stored in the script page's own scenes, and Reel three opens
//            ("Part 3 of 3")
//        A5  on Reel three (prose) the upper arrow opens the script Part: the script sheet mounts, carrying its own arrows
//        F3  a one-Part screenplay has both its arrows, disabled
// QUIET  S1  two moves (script -> prose -> script) store nothing: every entry's text, script, boxes, page settings and links are byte-identical
//
// Run (repo root; a box turn, or the Actions harness):  node apps/desktop/scripts/harness/reorg-script-arrows.mjs
import { withHarness } from '../runtime-verify.mjs';

process.env.WS_PLACE = '1';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);

const SCRIPT = "(() => { const els = ['.desk-frame-scroll-cap', '.desk-frame-scroll-cap > .mode-pagecol', '.script-sheet'].map((s) => document.querySelector(s)); if (!els[0]) return null; return els.map((p) => { if (!p) return '-'; const r = p.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 10) / 10).join(','); }).join(' | '); })()";
const ENTRIES = "(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).map((e) => [e.id, e.text ?? null, e.script ?? null, e.boxes ?? null, e.pageSettings ?? null, e.pageLinks ?? null, e.projectId ?? null, e.orderIndex ?? null])";
const ARROWS = `(() => {
  const box = document.querySelector('[data-part-arrows]');
  const one = (k) => { const b = box && box.querySelector('[data-part-step="' + k + '"]'); return b ? { label: b.getAttribute('aria-label'), off: b.disabled } : null; };
  const stage = document.querySelector('.desk-frame-stage'), cap = document.querySelector('.desk-frame-scroll-cap');
  return { box: !!box, up: one('-1'), down: one('1'), onStage: !!(box && stage && box.parentElement === stage), inScroller: !!(box && cap && cap.contains(box)) };
})()`;
const PARTLINE = "(() => { const c = document.querySelector('.reorg-top [data-top-part-count]'); return c ? { text: (c.textContent || '').trim(), button: c.tagName === 'BUTTON' } : null; })()";
const at = (id) => `location.hash.indexOf('/page/${id}') >= 0`;
const SURFACE = "(!!document.querySelector('.script-sheet') || !!document.querySelector('.forward-only-editor'))";

async function seed(app) {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 });
  const topSet = await app.evalJs("(() => { const d = JSON.parse(localStorage.getItem('writer-studio-drawers')).find((x) => /^top-drawer-/.test(x.id)); const p = JSON.parse(localStorage.getItem('writer-studio-projects')).find((x) => x.drawerId === d.id); return p && p.id; })()");
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const script = (id, heading, extra) => W.wrizoCreateJournalPage({ id, text: '', pageType: 'script', script: { v: 1, scenes: [{ id: id + '-h', heading: { id: id + '-h', t: 'scene', text: heading }, body: [] }] }, createdAt: '2026-04-01T00:00:05.000Z', source: null, ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const reel = W.wrizoCreateProject('Reel'); W.wrizoSetProjectDrawer(reel.id, grants.id);
    script('sa-top-1', 'EXT. ROOF - DAY', { origin: 'project', projectId: ${q(topSet)}, orderIndex: 0 });
    page('sa-r-1', 'Reel one', { origin: 'project', projectId: reel.id, orderIndex: 0 });
    script('sa-r-2', 'INT. GARAGE - NIGHT', { origin: 'project', projectId: reel.id, orderIndex: 1 });
    page('sa-r-3', 'Reel three', { origin: 'project', projectId: reel.id, orderIndex: 2 });
    W.wrizoFlushNow();
    return null;
  })()`);
}

async function open(app, theme, reorg, id, w = 1366) {
  await app.emulateDpr(1, w, 768);
  await app.evalJs(`window.wrizoTheme.set('${theme}'); null`);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1&arbor2=0' : '/?arbor2=0'}#/page/${id}')`);
  await app.reload();
  await app.waitFor(`!!document.querySelector('.desk-frame-host .sprint-nav') && ${SURFACE}`, { label: `the page ${id}`, timeout: 15000 }).catch(() => {});
  await sleep(900);
}
async function arrived(app, id, sel) { await app.waitFor(`${at(id)} && !!document.querySelector(${q(sel)})`, { timeout: 8000, label: `arrived at ${id}` }).catch(() => {}); await sleep(700); }
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const storedScript = (id) => `JSON.stringify((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === ${q(id)}) || {}).script || null)`;

await withHarness(async (app) => {
  await seed(app);

  // ---- OFF -------------------------------------------------------------------------------------------------------------------------------
  const offs = {};
  for (const [theme, reorg] of [['machina', false], ['plateau', true], ['flux', true]]) {
    await open(app, theme, reorg, 'sa-r-2');
    offs[`${theme}.${reorg ? 'on' : 'off'}`] = await app.evalJs("(() => ({ sheet: !!document.querySelector('.script-sheet'), arrows: !!document.querySelector('[data-part-arrows]'), top: !!document.querySelector('.reorg-top') }))()");
  }
  ok('M0 switch off in Machina, and on in Arbor and Flux: the script page has no arrows', Object.values(offs).every((o) => o.sheet && !o.arrows && !o.top), offs);

  // ---- ARROWS ----------------------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'sa-r-2');
  const a1 = { arrows: await app.evalJs(ARROWS), line: await app.evalJs(PARTLINE), sheet: await app.evalJs("!!document.querySelector('.script-sheet')") };
  ok('A1 on the script Part (2 of 3): "Previous Part: 1, Reel one" above, "Next Part: 3, Reel three" below, both live; on the stage, not in the scroller',
    a1.sheet && a1.line && a1.line.text === 'Part 2 of 3' && a1.arrows.box && a1.arrows.up && a1.arrows.up.label === 'Previous Part: 1, Reel one' && !a1.arrows.up.off
      && a1.arrows.down && a1.arrows.down.label === 'Next Part: 3, Reel three' && !a1.arrows.down.off && a1.arrows.onStage && !a1.arrows.inScroller, a1);

  // the bar, measured without the scroller's own arithmetic: a probe child spans the content box; the bar is what lies right of it (less the
  // padding and border), in viewport pixels
  const cap = await app.evalJs(`(() => {
    const sc = document.querySelector('.desk-frame-scroll-cap'); const up = document.querySelector('[data-part-step="-1"]'); const dn = document.querySelector('[data-part-step="1"]');
    if (!sc || !up || !dn) return null;
    const probe = document.createElement('div'); probe.style.cssText = 'width:100%;height:0;margin:0;padding:0;border:0';
    sc.insertBefore(probe, sc.firstChild);
    const p = probe.getBoundingClientRect(); probe.remove();
    const s = sc.getBoundingClientRect(), u = up.getBoundingClientRect(), d = dn.getBoundingClientRect();
    const k = s.width / sc.offsetWidth || 1, cs = getComputedStyle(sc);
    const padR = parseFloat(cs.paddingRight) * k, bordR = parseFloat(cs.borderRightWidth) * k;
    const bar = s.right - bordR - (p.right + padR);
    const barMid = s.right - bordR - bar / 2;
    return { bar, barMid, upMid: (u.left + u.right) / 2, dnMid: (d.left + d.right) / 2, upTop: u.top - s.top, dnBottom: s.bottom - d.bottom, gutter: cs.scrollbarGutter, k };
  })()`);
  ok('A2 the arrows cap the script scroller\'s own bar: centred on its right-hand bar, the upper at its top and the lower at its bottom',
    !!cap && cap.bar > 0 && Math.abs(cap.upMid - cap.barMid) <= 2 && Math.abs(cap.dnMid - cap.barMid) <= 2 && cap.upTop >= 0 && cap.upTop <= 12 && cap.dnBottom >= 0 && cap.dnBottom <= 12, cap);

  const geo = {};
  for (const w of [1366, 1920]) {
    await open(app, 'machina', false, 'sa-r-2', w);
    const off = await app.evalJs(SCRIPT);
    await open(app, 'machina', true, 'sa-r-2', w);
    const on = await app.evalJs(SCRIPT);
    const arrows = await app.evalJs("!!document.querySelector('[data-part-arrows]')");
    geo[w] = { off, on, arrows };
  }
  ok('A3 [1366, 1920] the script page\'s rect (scroller, column, first sheet) is the same with the switch off and on (the arrows drawn)',
    Object.values(geo).every((g) => g.off && g.off === g.on && g.arrows), geo);

  // ---- SPEED, then A4: typed, then moved at once -------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'sa-r-2');
  const live0 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  await app.evalJs("document.querySelector('.script-el-active')?.focus(); null");
  await sleep(300);
  const k0 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  for (const ch of ' MOTORCYCLE') { await app.typeKeys(ch); await sleep(50); }
  await sleep(150);
  const k1 = await app.evalJs('window.wrizoPartMovesRenders ? window.wrizoPartMovesRenders() : null');
  const typed = await app.evalJs("(document.querySelector('.script-sequence')?.textContent || '').includes('MOTORCYCLE')");
  ok('K1 while she types 11 keys in the script, the arrows render zero times (the counter is live)',
    typeof live0 === 'number' && live0 > 0 && typed && k0 !== null && k1 === k0, { live0, k0, k1, typed });

  const moved = await app.evalJs(press('[data-part-step="1"]'));
  await arrived(app, 'sa-r-3', '.forward-only-editor');
  const a4 = { moved, hash: await app.evalJs('location.hash'), line: await app.evalJs(PARTLINE), stored: await app.evalJs(storedScript('sa-r-2')) };
  ok('A4 typed, then the lower arrow at once: her words are stored in the script page\'s scenes, and Reel three opens ("Part 3 of 3")',
    moved && /sa-r-3/.test(a4.hash) && /MOTORCYCLE/.test(a4.stored || '') && a4.line && a4.line.text === 'Part 3 of 3', a4);

  // ---- A5 and S1: prose -> script -> prose, nothing stored -------------------------------------------------------------------------------
  await open(app, 'machina', true, 'sa-r-3');
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400);
  const sQ0 = await app.evalJs(ENTRIES);
  const up5 = await app.evalJs(press('[data-part-step="-1"]'));
  await arrived(app, 'sa-r-2', '.script-sheet');
  const a5 = { up5, hash: await app.evalJs('location.hash'), arrows: await app.evalJs(ARROWS), line: await app.evalJs(PARTLINE) };
  ok('A5 on Reel three (prose) the upper arrow opens the script Part: the script sheet mounts with its own arrows ("Part 2 of 3")',
    up5 && /sa-r-2/.test(a5.hash) && a5.arrows.box && a5.arrows.onStage && a5.line && a5.line.text === 'Part 2 of 3', a5);
  const dn5 = await app.evalJs(press('[data-part-step="1"]'));
  await arrived(app, 'sa-r-3', '.forward-only-editor');
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(400);
  const sQ1 = await app.evalJs(ENTRIES);
  ok('S1 two moves (prose -> script -> prose) store nothing: every entry\'s text, script, boxes, page settings and links are byte-identical',
    dn5 && JSON.stringify(sQ0) === JSON.stringify(sQ1), { dn5, before: sQ0.length, after: sQ1.length, changed: sQ1.filter((r, i) => JSON.stringify(r) !== JSON.stringify(sQ0[i])).map((r) => r[0]) });

  // ---- ONE-PART SCREENPLAY ---------------------------------------------------------------------------------------------------------------
  await open(app, 'machina', true, 'sa-top-1');
  const f3 = await app.evalJs(ARROWS);
  ok('F3 a one-Part screenplay has both its arrows, disabled', f3.box && f3.up?.off && f3.down?.off && f3.onStage, f3);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1500)}`);
const EXPECTED = 9;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass
  ? `\nREORG-SCRIPT-ARROWS VERIFY: PASS (${checks.length} checks)`
  : `\nREORG-SCRIPT-ARROWS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
