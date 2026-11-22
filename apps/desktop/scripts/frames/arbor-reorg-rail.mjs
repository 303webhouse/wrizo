// ARBOR'S RAIL ON THE REORG, for the Wrizors (claude/wrizors/arbor-reorg-spec.md §10: "the rail with a pinned box and SHELF open", both rooms,
// 1366 and 1920). Arbor as it ships, ?reorg=1 with INK's preview door (&reorglift=plateau.rail: Arbor's cell stays off until this pass), the
// room pinned by Arbor's test-only ?arbor2room. A Drawer "Fiction" holds "The Mill" (a Part) and is pinned through the rail's own DRAWERS pop-out.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=plateau -f widths=1366,1920 -f tones=light,dark \
//      -f screens_file=apps/desktop/scripts/frames/arbor-reorg-rail.mjs -f screens=rail-day,rail-night,rail-shelf-day,rail-shelf-night,rail-hover-day,rail-drawers-night
// Arbor's box swatches (spec §1: Olive · Sea · Cold blue · Madder · Honey · Iron, no brass): rail-boxset-day, rail-boxset-night - DRAWERS open, Box settings
// open, her box set to Sea
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setUp(app, room) {
  await app.evalJs(`(() => { if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === 'arf-1')) return true;
    const W = window; const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    W.wrizoCreateJournalPage({ id: 'arf-1', text: 'Chapter One\\nThe rain had not stopped for three days, and the river was up past the second step of the mill.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: mill.id, orderIndex: 0 });
    W.wrizoCreateJournalPage({ id: 'arf-l', text: 'A loose page on the shelf.', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'loose' });
    W.wrizoFlushNow(); return true; })()`);
  await sleep(400);
  await app.evalJs(`localStorage.setItem('wrizo-theme', 'plateau'); history.replaceState(null, '', '/?reorg=1&reorglift=plateau.rail&arbor2room=${room}#/page/arf-1'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('[data-reorg-rail]') && !!document.querySelector('.forward-only-editor')", { label: 'the reorg rail in Arbor', timeout: 20000 }).catch(() => {});
  await sleep(1200);
  // pin the Drawer once, through the rail's own DRAWERS pop-out (its row's pin), then close it
  const pinned = await app.evalJs("!!document.querySelector('[data-reorg-rail] .wz-reorg-pins')");
  if (!pinned) {
    await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700);
    await app.evalJs("document.querySelector('.wz-cascade-panel .wz-reorg-row-pin')?.click(); null"); await sleep(500);
    await app.evalJs("document.querySelector('[data-reorg-rail] [data-category=\"reorg-projects\"]')?.click(); null"); await sleep(700);
  }
}
const door = (cat) => `document.querySelector('[data-reorg-rail] [data-category="${cat}"]')`;
const report = async (app, name) => console.log(`ARBOR-RAIL-FRAME ${name} ${JSON.stringify(await app.evalJs(`(() => { const r = document.querySelector('[data-reorg-rail]'); return r ? [...r.querySelectorAll('.wz-strip-item')].map((b) => [(b.textContent || '').trim(), b.getAttribute('data-cloth'), getComputedStyle(b).backgroundColor, getComputedStyle(b).transform]) : null; })()`))}`);

async function boxSet(app) {
  await app.evalJs(`${door('reorg-projects')}?.click(); null`); await sleep(800);
  await app.evalJs("document.querySelector('.wz-reorg-box-settings-head')?.click(); null"); await sleep(500);
  await app.evalJs("document.querySelector('.wz-reorg-swatches [data-swatch=\"#17454E\"]')?.click(); null"); await sleep(500);
  await app.mouseMove(900, 400); await sleep(400);
}

export default {
  'rail-day': async (app) => { await setUp(app, 'day'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'rail-day'); },
  'rail-night': async (app) => { await setUp(app, 'night'); await app.mouseMove(700, 400); await sleep(400); await report(app, 'rail-night'); },
  'rail-shelf-day': async (app) => { await setUp(app, 'day'); await app.evalJs(`${door('reorg-unfiled')}?.click(); null`); await sleep(800); await app.mouseMove(700, 400); await sleep(400); await report(app, 'rail-shelf-day'); },
  'rail-shelf-night': async (app) => { await setUp(app, 'night'); await app.evalJs(`${door('reorg-unfiled')}?.click(); null`); await sleep(800); await app.mouseMove(700, 400); await sleep(400); await report(app, 'rail-shelf-night'); },
  'rail-hover-day': async (app) => {
    await setUp(app, 'day');
    const p = await app.evalJs(`(() => { const b = ${door('reorg-docs')}; if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (p) { await app.mouseMove(p.x, p.y); await sleep(500); }
    await report(app, 'rail-hover-day');
  },
  'rail-boxset-day': async (app) => { await setUp(app, 'day'); await boxSet(app); await report(app, 'rail-boxset-day'); },
  'rail-boxset-night': async (app) => { await setUp(app, 'night'); await boxSet(app); await report(app, 'rail-boxset-night'); },
  'rail-drawers-night': async (app) => { await setUp(app, 'night'); await app.evalJs(`${door('reorg-projects')}?.click(); null`); await sleep(800); await app.mouseMove(900, 400); await sleep(400); await report(app, 'rail-drawers-night'); },
};
