// FLUX'S RAIL ON THE REORG (flux-reorg-spec sections 1, 2, 7, 10 and 11), on the Flux REDESIGN (?flux3=1), as frames: the dark room only, at 1366 and 1920.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<full sha> -f screens=flux-rail-rest,flux-rail-orphans,flux-rail-drives,flux-rail-docs -f themes=flux -f tones=dark -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/flux-reorg-rail.mjs
// The piece is not switched on in reorg/themeGate.ts for Flux yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=flux.rail): the door only shows a piece, it flips no cell.
// A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const press = (sel) => `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const fiction = W.wrizoCreateDrawer('Fiction');
    const grants = W.wrizoCreateDrawer('Grants');
    const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, fiction.id);
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('fr-1', 'Chapter One\\nThe rain had not stopped for nine days, and the river had begun to climb the mill wall.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('fr-2', 'Chapter Two\\nThe river rose.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('fr-c', 'Plot circuit', { origin: 'project', projectId: mill.id, pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The mill floods' }] });
    page('fr-b', 'The ask, in one page.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('fr-l1', 'A loose page about the harbour.', { origin: 'loose' });
    page('fr-l2', 'Notes on the second act.', { origin: 'loose' });
    page('fr-l3', 'Loose circuit', { origin: 'loose', pageType: 'board', boxes: [{ id: 'k2', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'An orphaned node' }] });
    W.wrizoFlushNow();
    window.__frameGrants = grants.id;
    return null;
  })()`);
  await sleep(500);
}
async function open(app) {
  const grants = await app.evalJs('window.__frameGrants || null');
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0&flux3=1&reorglift=flux.rail#/page/fr-1')");
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('[data-reorg-rail]')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  // a pinned Drive (no colour of its own: node dress) and her own Drive in lime, by the rail's own controls
  await app.evalJs(press("[data-reorg-rail] [data-category='reorg-projects']")); await sleep(500);
  if (grants) { await app.evalJs(press(`[data-reorg-pin-toggle="${grants}"]`)); await sleep(250); }
  await app.evalJs(press('.wz-reorg-box-settings-head')); await sleep(300);
  await app.evalJs(press('.wz-reorg-swatches [data-swatch="#B7FF3C"]')); await sleep(300);
}
const door = async (app, cat) => { await app.evalJs(press(`[data-reorg-rail] [data-category='${cat}']`)); await sleep(650); };
const rest = async (app) => { await app.mouseMove(900, 420); await sleep(350); };

export default {
  'flux-rail-rest': async (app) => { await seed(app); await open(app); await door(app, 'reorg-projects'); await rest(app); },
  'flux-rail-orphans': async (app) => { await seed(app); await open(app); await door(app, 'reorg-unfiled'); await rest(app); },
  // DRIVES with Box settings open: the six signals by number, Custom…
  'flux-rail-drives': async (app) => { await seed(app); await open(app); await rest(app); },
  'flux-rail-docs': async (app) => {
    await seed(app); await open(app); await door(app, 'reorg-docs');
    await app.evalJs(press('.wz-cascade-panel [data-session-fold]')); await sleep(350);
    await app.evalJs("(() => { const s = document.querySelector('.wz-cascade-panel [data-session-fold]'); if (s) s.scrollIntoView({ block: 'start' }); return null; })()");
    await rest(app);
  },
};
