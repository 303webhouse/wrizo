// ARBOR'S TOP BAR ON THE REORG, for the Wrizors (claude/wrizors/arbor-reorg-spec.md §3 and §10: "the top bar on a Page and on a Canvas with no
// Page", both rooms, 1366 and 1920). Arbor as it ships, ?reorg=1 with INK's preview doors (&reorglift=plateau.rail,plateau.top: Arbor's cells stay
// off until the Wrizors pass), the room pinned by Arbor's test-only ?arbor2room. A Drawer "Fiction" holds "The Mill" (three Sections, the second
// tagged C) and a Canvas "Plot canvas" that serves no Page.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=plateau -f widths=1366,1920 -f tones=light \
//      -f screens_file=apps/desktop/scripts/frames/arbor-reorg-top.mjs -f screens=top-page-day,top-page-night,top-canvas-day,top-canvas-night,top-search-day
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setUp(app, room, id) {
  await app.evalJs(`(() => { if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === 'atf-2')) return true;
    const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    const page = (pid, text, extra) => W.wrizoCreateJournalPage({ id: pid, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    page('atf-1', 'Chapter One\\nThe rain had not stopped.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('atf-2', 'Chapter Two\\nThe second morning, the river was up past the second step of the mill.', { origin: 'project', projectId: mill.id, orderIndex: 1, pageSettings: undefined });
    page('atf-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('atf-c', 'Plot canvas', { origin: 'loose', pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(400);
  await app.evalJs(`localStorage.setItem('wrizo-theme', 'plateau'); history.replaceState(null, '', '/?reorg=1&reorglift=plateau.rail,plateau.top&arbor2room=${room}#/page/${id}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.reorg-top')", { label: 'the reorg top bar in Arbor', timeout: 20000 }).catch(() => {});
  await app.evalJs("window.wrizoParts && window.wrizoParts.setPartColor && window.wrizoParts.setPartColor('atf-2', 'c'); null");
  await sleep(1200);
}
const report = async (app, name) => console.log(`ARBOR-TOP-FRAME ${name} ${JSON.stringify(await app.evalJs(`(() => { const t = document.querySelector('.reorg-top'); if (!t) return null; const b = t.closest('.sprint-nav'); return { kind: t.getAttribute('data-reorg-top'), text: (t.textContent || '').trim().slice(0, 160), bar: b ? getComputedStyle(b).backgroundColor : null }; })()`))}`);

export default {
  'top-page-day': async (app) => { await setUp(app, 'day', 'atf-2'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'top-page-day'); },
  'top-page-night': async (app) => { await setUp(app, 'night', 'atf-2'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'top-page-night'); },
  'top-canvas-day': async (app) => { await setUp(app, 'day', 'atf-c'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'top-canvas-day'); },
  'top-canvas-night': async (app) => { await setUp(app, 'night', 'atf-c'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'top-canvas-night'); },
  'top-search-day': async (app) => {
    await setUp(app, 'day', 'atf-2');
    const p = await app.evalJs("(() => { const b = document.querySelector('.reorg-top .reorg-top-search'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (p) { await app.mouseMove(p.x, p.y); await sleep(900); }
    await report(app, 'top-search-day');
  },
};
