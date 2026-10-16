// THE PAGES PANEL, A ROW CLICKED OPEN - the live frame for the tutor-drawer-mirror revert (this desk). Worktree named by WT (its runtime-verify);
// WS_TARGET_URL (+ WS_BOX_TURN) point it at production. Throwaway anonymous profile. A loose page is open, the Page hand is opened by a REAL click on the
// Page strip item, the hit-test at the target row's centre is recorded (who is topmost there), then a REAL click on the row; the URL and the crumb after.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const { withHarness } = await import(`file:///C:/Users/nickh/writer-studio/.claude/worktrees/${process.env.WT}/apps/desktop/scripts/runtime-verify.mjs`);

const OUT = process.env.FRAMES_OUT;
mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PAGE_STRIP = '.wz-strip-item[data-category="page"]';
const rowSel = (id) => `.wz-open-pages-row[data-page-id="${id}"]`;
const PAGES = [
  { id: 'pr-journal', text: 'Journal note alpha', createdAt: '2026-05-01T00:00:00.000Z', origin: 'journal' },
  { id: 'pr-loose', text: 'Loose draft bravo', createdAt: '2026-05-02T00:00:00.000Z', origin: 'loose' },
  { id: 'pr-third', text: 'Third page charlie', createdAt: '2026-05-03T00:00:00.000Z', origin: 'journal' },
];
const centreOf = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return null; return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const wake = async (app, sel) => { const pt = await centreOf(app, sel); if (!pt) return; await app.mouseMove(pt.x + 40, pt.y + 40); await app.mouseMove(pt.x, pt.y); await sleep(250); };
const click = async (app, sel) => { const pt = await centreOf(app, sel); if (!pt) return false; await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(450); return true; };
const rows = [];

await withHarness(async (app) => {
  for (const combo of [{ id: 'arbor', theme: 'plateau' }, { id: 'flux', theme: 'flux' }]) {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
      localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' }))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(combo.theme)});
      localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await app.evalJs(`(() => { ${PAGES.map((p) => `window.wrizoCreateJournalPage(${JSON.stringify(p)});`).join(' ')} })()`);
    await sleep(700);
    await app.evalJs("location.hash = '#/page/pr-loose'");
    await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 9000 }); await sleep(900);
    await wake(app, PAGE_STRIP); await click(app, PAGE_STRIP);
    const listOpen = await waitSoft(app, "!!document.querySelector('.wz-open-pages')", { label: 'Open Pages list', timeout: 4000 }); await sleep(600);
    const target = '#/page/pr-third';
    const probe = await app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(rowSel('pr-third') + ' .wz-open-pages-open')}); if (!e) return { row: false };
      e.scrollIntoView({ block: 'center' }); const b = e.getBoundingClientRect(); const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      return { row: true, rect: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)], reachable: !!(top && (top === e || e.contains(top))),
        topmost: top ? (typeof top.className === 'string' ? top.className.slice(0, 60) : top.tagName) : null }; })()`);
    writeFileSync(join(OUT, `${combo.id}-1-pages-list.png`), Buffer.from(await app.screenshot(), 'base64'));
    const clicked = await click(app, `${rowSel('pr-third')} .wz-open-pages-open`); await sleep(600);
    const after = await app.evalJs(`({ hash: location.hash, crumb: (document.querySelector('.crumb-here') || {}).textContent || null, bundle: ([...document.scripts].map((s) => s.src).find((s) => s.indexOf('assets/index-') >= 0) || '').replace(/^.*assets\\//, ''), origin: location.origin })`);
    writeFileSync(join(OUT, `${combo.id}-2-row-opened.png`), Buffer.from(await app.screenshot(), 'base64'));
    const row = { combo: combo.id, listOpen, probe, clicked, after, opened: after.hash === target }; rows.push(row); console.log('PAGESROW ' + JSON.stringify(row));
  }
});
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2) + '\n');
console.log(`PAGESROW FRAMES: ${rows.length} combos -> ${OUT}; opened ${rows.filter((r) => r.opened).length}/${rows.length}`);
