// #135 (Fable, Nov 25: "at 1536, Arbor's Board drawer squeezes the Board and covers its zoom control... The same rule as #133: panels may lie over the
// margin, never over the Board's own controls"). THE REAL BOARD in Arbor's own look, at 1366x768, 1536x864 and 1920x1080, the tool drawer opened by
// its own tab:
//   S  the drawer is not squeezed: it is as wide as Arbor's drawer beside a page (264 px) and nothing in it runs past its edge
//   C  no control of the Board (its zoom row, any button drawn on it) lies under the open drawer or its tab, and each takes a press
//   B  the Board never moves or resizes when the drawer opens (page primacy; r22: the Board keeps its rect)
//   G  closed, the drawer's tab stands on the Board's left edge, as before
//   MUT the open drawer forced to the full height covers the zoom row - C's reading must see it
// THE PRODUCT'S OWN LOOKS (the driver pins older themes and the reorg off for files that do not ask).
// Run: node scripts/harness/arbor-135-board-drawer.mjs   (from apps/desktop, dist-web built)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default' });
const { withHarness } = await import('../runtime-verify.mjs');

const SHOTS = process.env.WS_135_SHOTS || null;
const snap = async (app, name) => { if (!SHOTS) return; mkdirSync(SHOTS, { recursive: true }); writeFileSync(join(SHOTS, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PROBE = `(() => {
  const box = (e) => { if (!e) return null; const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return null;
    const b = e.getBoundingClientRect(); return b.width > 1 && b.height > 1 ? [b.left, b.top, b.right, b.bottom].map(Math.round) : null; };
  const cross = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && b[0] < a[2] - 0.5 && a[1] < b[3] - 0.5 && b[1] < a[3] - 0.5;
  const wrap = document.querySelector('.board-canvas-wrap') || document.querySelector('.board-canvas');
  const open = document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true';
  const panel = open ? document.querySelector('.wz-sliver-panel') : null;
  const grip = document.querySelector('.wz-sliver-grip');
  // the Board's own controls: every button drawn on the Board that is not one of its cards
  const controls = [...document.querySelectorAll('.board-zoom button, .board-canvas-wrap button, .board-canvas button')]
    .filter((b, i, all) => all.indexOf(b) === i && !b.closest('[data-box-id], .board-box, .wz-sliver, .wz-tutor-panel') && box(b));
  const under = []; const dead = [];
  for (const c of controls) { const r = box(c); const name = (c.getAttribute('aria-label') || c.textContent || c.className).trim().slice(0, 30);
    if (cross(r, box(panel)) || (open && cross(r, box(grip)))) under.push(name);
    if (r[2] <= innerWidth && r[3] <= innerHeight) { const hit = document.elementFromPoint((r[0] + r[2]) / 2, (r[1] + r[3]) / 2); if (!hit || !(hit === c || c.contains(hit) || hit.contains(c))) dead.push(name); } }
  let past = 0, width = null;
  if (panel) { const pb = panel.getBoundingClientRect(); width = Math.round(pb.width);
    for (const e of panel.querySelectorAll('button, [role="tab"], input, select, h3, label')) { const q = e.getBoundingClientRect(); if (q.width > 1 && box(e)) past = Math.max(past, Math.round(q.right - pb.right), Math.round(pb.left - q.left)); }
    past = Math.max(past, panel.scrollWidth - panel.clientWidth); }
  return { open, width, past, controls: controls.length, under, dead, board: box(wrap), grip: box(grip), panel: box(panel), zoom: box(document.querySelector('.board-zoom')), arbor: document.documentElement.hasAttribute('data-arbor2') };
})()`;

await withHarness(async (app) => {
  await app.emulateDpr(1, 1536, 864);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','plateau')");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("window.wrizoCreateJournalPage({ id: 'b135', text: 'Plot board', pageType: 'board', boxes: [{ id: 'c1', kind: 'text', text: 'Alpha', x: 0.3, y: 0.08, w: 0.25, h: 0.15, z: 0 }], createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' }); window.wrizoFlushNow()");
  for (const [w, h] of [[1366, 768], [1536, 864], [1920, 1080]]) {
    const at = `Arbor Board ${w}x${h}`;
    await app.emulateDpr(1, w, h);
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs("location.hash = '#/page/b135'");
    await app.waitFor("!!document.querySelector('.board-canvas') && !!document.querySelector('.wz-sliver-grip')", { label: 'the Board', timeout: 12000 });
    await sleep(1500);
    const rest = await app.evalJs(PROBE);
    ok(`${at} (premise): Arbor's look, a Board with its zoom row, the drawer closed`, rest.arbor && !rest.open && !!rest.zoom && rest.controls >= 3, rest);
    ok(`${at} G: closed, the drawer's tab stands on the Board's left edge, and the closed drawer takes no press from the Board`, !!rest.grip && !!rest.board && Math.abs(rest.grip[2] - rest.board[0]) <= 2 && rest.dead.length === 0, { grip: rest.grip, board: rest.board, dead: rest.dead });
    await app.evalJs("document.querySelector('.wz-sliver-grip').click()");
    await sleep(1200);
    const s = await app.evalJs(PROBE);
    await snap(app, `board-${w}`);
    ok(`${at} (premise): the drawer opened`, s.open && !!s.panel, s);
    ok(`${at} S: the drawer is not squeezed (264 px, nothing past its edge)`, s.width >= 263 && s.past <= 1, { width: s.width, past: s.past, panel: s.panel });
    ok(`${at} C: no control of the Board under the drawer or its tab, and each takes a press`, s.under.length === 0 && s.dead.length === 0, { under: s.under, dead: s.dead, panel: s.panel, zoom: s.zoom });
    ok(`${at} B: opening the drawer never moves or resizes the Board`, JSON.stringify(s.board) === JSON.stringify(rest.board), { rest: rest.board, open: s.board });
    if (w === 1536) {
      await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); p.style.setProperty('height', '100%', 'important'); p.style.setProperty('width', '264px', 'important'); p.style.setProperty('left', '16px', 'important'); p.style.setProperty('right', 'auto', 'important'); })()");
      await sleep(400);
      const m = await app.evalJs(PROBE);
      ok('MUT the drawer forced wide over the full height covers the zoom row, and the reading sees it', m.under.length > 0 || m.dead.length > 0, { under: m.under, dead: m.dead, panel: m.panel, zoom: m.zoom });
      await app.evalJs("(() => { const p = document.querySelector('.wz-sliver-panel'); ['height', 'width', 'left', 'right'].forEach((k) => p.style.removeProperty(k)); })()");
    }
    await app.evalJs("document.querySelector('.wz-sliver-grip').click()");
    await sleep(1200);
    const back = await app.evalJs(PROBE);
    ok(`${at} G2: closed again, the tab is back on the Board's left edge and the Board takes its presses`, !back.open && JSON.stringify(back.grip) === JSON.stringify(rest.grip) && back.dead.length === 0, { open: back.open, grip: back.grip, rest: rest.grip, dead: back.dead });
  }
});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nARBOR-135-BOARD-DRAWER VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
