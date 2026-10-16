// TOOLS DRAWER vs TUTOR DRAWER, SIDE BY SIDE - THE FRAMES (this desk's capture script), from the worktree named by WT (its own dist-web).
// Per theme (Arbor, Flux dark) and surface (a page, a board): closed / Tools open / Tutor open / both open.
// Per frame: the grips' and the open panels' tab rows' rectangles, whether each grip intersects its OWN open tab row, and the grip rect over a short settle window.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const COMBOS = [
  { id: 'arbor', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux-dark', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
];
const SURFACES = {
  page: { id: 'da-page', row: `{ id: 'da-page', text: 'A loose page with a few words in it, and a second line to read.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' }`, ready: '.forward-only-editor' },
  board: { id: 'da-board', row: `{ id: 'da-board', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null, boxes: [{ id: 'da-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Card words here' }] }`, ready: '.desk-frame' },
};
const facts = (app) => app.evalJs(`(() => {
  const rc = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left * 10) / 10, t: Math.round(r.top * 10) / 10, r: Math.round(r.right * 10) / 10, b: Math.round(r.bottom * 10) / 10 }; };
  const hit = (a, b) => !!(a && b && a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t);
  const sliver = document.querySelector('.wz-sliver'), tutor = document.querySelector('.wz-tutor-panel');
  const lg = rc(document.querySelector('.wz-sliver-grip')), rg = rc(document.querySelector('.wz-tutor-grip'));
  const lrow = rc(sliver && sliver.querySelector('[role=tablist]')), rrow = rc(tutor && tutor.querySelector('[role=tablist]'));
  return { bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''),
    toolsOpen: !!(sliver && sliver.getAttribute('data-open') === 'true'), tutorOpen: !!(tutor && tutor.getAttribute('data-open') === 'true'),
    toolsGrip: lg, toolsTabRow: lrow, toolsGripHitsOwnTabRow: hit(lg, lrow), tutorGrip: rg, tutorTabRow: rrow, tutorGripHitsOwnTabRow: hit(rg, rrow) }; })()`);

await withHarness(async (app) => {
  for (const combo of COMBOS) for (const [kind, s] of Object.entries(SURFACES)) {
    await app.emulateDpr(1, 1280, 800);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(combo.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`window.wrizoCreateJournalPage(${s.row})`);
    await sleep(500);
    await app.evalJs(`location.hash = '#/page/${s.id}'`);
    await waitSoft(app, `!!document.querySelector('${s.ready}')`, { label: kind, timeout: 9000 }); await sleep(900);
    const shoot = async (state) => {
      await sleep(1100);
      const name = `${combo.id}-${kind}-${state}`;
      writeFileSync(join(OUT, `${name}.png`), Buffer.from(await app.screenshot(), 'base64'));
      const row = { frame: name, file: `${name}.png`, ...(await facts(app)) }; rows.push(row); console.log(JSON.stringify(row).slice(0, 900));
    };
    await shoot('1-closed');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await shoot('2-tools-open');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(700);
    await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await shoot('3-tutor-open');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await shoot('4-both-open');
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`DRAWER ARROW FRAMES (${process.env.WT}): ${rows.length} frames -> ${OUT}`);
