// FLUX REORG: THE SPLIT SCREEN IN FLUX, THE DOCK (flux-reorg-spec section 8), on the Flux REDESIGN (?flux3=1), as frames: the dark room only (Flux's light page is not live), at 1366 and 1920, through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f screens=flux-dock-page,flux-dock-card -f themes=flux -f tones=dark -f screens_file=apps/desktop/scripts/frames/flux-reorg-split.mjs
// The piece is not switched on in reorg/themeGate.ts for Flux yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=flux.back,flux.split): the door only shows a piece, it flips no cell.
// A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const card = (id, text, seq, y) => ({ id, kind: 'text', x: 0.05, y, w: 0.3, h: 0.1, z: seq + 1, text, seq });
const link = (id, boxId, toEntry) => ({ id, aEntryId: 'fb-own', aBoxId: boxId, bEntryId: toEntry, createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' });
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('fb-own', 'Plan board', { origin: 'loose', pageType: 'board', boxes: ${q([card('c1', 'The opening image', 0, 0.05), card('c2', 'The turn', 1, 0.2), card('c3', 'The close', 2, 0.35)])} });
    page('fb-note', 'Field notes\\nThe rain came late, and the river ran brown for a week.', { origin: 'loose' });
    page('fb-1', 'The harbour was quiet when she arrived. Nobody met her at the quay.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('fb-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    W.wrizoPatchEntry('fb-1', { pageSettings: ${PS}, name: 'Arrival', level: 0 }, planBoardId: 'fb-own' });
    W.wrizoPatchEntry('fb-2', { pageSettings: ${PS}, name: 'The town', level: 0 } });
    W.wrizoPatchEntry('fb-own', { pageLinks: ${q([link('l1', 'c1', 'fb-1')])} });
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}
async function open(app, lift, mode) {
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0&flux3=1&reorglift=${lift}#/page/fb-1')`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  if (mode === 'journal') { await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*wire in\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(900); }
}
const SCREENS = {
  // a page docked beside the one she is writing (the Open Beside act, through the reorg's seam); the long page scrolls in its half
  'flux-dock-page': async (app) => {
    await seed(app); await open(app, 'flux.back,flux.split');
    await app.evalJs("(() => { window.wrizoCreateJournalPage({ id: 'fb-long', text: 'Field notes\\n' + 'The rain came late, and the river ran brown for a week. '.repeat(40), createdAt: '2026-04-02T00:00:00.000Z', origin: 'loose', source: 'page' }); window.wrizoSplit && window.wrizoSplit.open('fb-1', { entryId: 'fb-long' }); return null; })()");
    await sleep(1100);
  },
  // one card of a circuit docked beside the page
  'flux-dock-card': async (app) => {
    await seed(app); await open(app, 'flux.back,flux.split');
    await app.evalJs("(() => { window.wrizoSplit && window.wrizoSplit.open('fb-1', { entryId: 'fb-own', boxId: 'c2' }); return null; })()");
    await sleep(1100);
  },
};
export default SCREENS;
