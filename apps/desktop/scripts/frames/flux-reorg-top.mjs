// FLUX'S TOP BAR ON THE REORG (flux-reorg-spec sections 0, 3, 6, 10 and 11), on the Flux REDESIGN (?flux3=1), as frames: the dark room only, at 1366 and 1920.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<full sha> -f screens=flux-top-doc,flux-top-patch,flux-top-wirein,flux-top-uplink,flux-top-circuit -f themes=flux -f tones=dark -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/flux-reorg-top.mjs
// The piece is not switched on in reorg/themeGate.ts for Flux yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=...): the door only shows a piece, it flips no cell.
// The rail is lifted with it, so the two are read together. A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const fiction = W.wrizoCreateDrawer('Fiction');
    const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, fiction.id);
    page('tp-1', 'Chapter One\\nThe rain had not stopped for nine days.', { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('tp-2', 'Chapter Two\\nBy the second morning the river had begun to climb the mill wall.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('tp-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page('tp-c', 'Plot circuit', { origin: 'loose', pageType: 'board', boxes: [{ id: 'k1', kind: 'text', x: 0.08, y: 0.1, w: 0.3, h: 0.12, z: 1, text: 'The mill floods' }] });
    W.wrizoPatchEntry('tp-2', { pageSettings: ${PS}, name: 'Second morning', level: 0, color: 'c' } });
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}
async function open(app, id = 'tp-2', lift = 'flux.rail,flux.top') {
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0&flux3=1&reorglift=${lift}#/page/${id}')`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.reorg-top')", { label: 'the bar', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(1000);
}
const stage = async (app, key) => { await app.evalJs(`document.querySelector('.reorg-top .desk-mode-tab[data-mode-key="${key}"]')?.click(); null`); await sleep(1000); };
const rest = async (app) => { await app.mouseMove(900, 460); await sleep(350); };

export default {
  'flux-top-doc': async (app) => { await seed(app); await open(app); await rest(app); },
  'flux-top-patch': async (app) => { await seed(app); await open(app); await stage(app, 'revise'); await rest(app); },
  'flux-top-wirein': async (app) => { await seed(app); await open(app); await stage(app, 'freewrite'); await rest(app); },
  'flux-top-uplink': async (app) => { await seed(app); await open(app, 'tp-2', 'flux.rail,flux.top,flux.uplink'); await stage(app, 'publish'); await rest(app); },
  'flux-top-circuit': async (app) => { await seed(app); await open(app, 'tp-c'); await rest(app); },
};
