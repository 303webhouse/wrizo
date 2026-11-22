// ARBOR REORG: THE BACK MENU IN ARBOR (arbor-reorg-spec section 5), as frames: both rooms (day and night: the frames job's tones), at 1366 and 1920, through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f screens=arbor-back-plan,arbor-back-grafts,arbor-back-tutor,arbor-back-freewrite,arbor-back-publish -f themes=plateau -f tones=light,dark -f screens_file=apps/desktop/scripts/frames/arbor-reorg-back.mjs
// The piece is not switched on in reorg/themeGate.ts for Arbor yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=plateau.back): the door only shows a piece, it flips no cell. The Publish frame also lifts top and uplink (ARBOR's top bar is not built yet: that bar is raw there).
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
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&reorglift=${lift}#/page/fb-1')`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-tutor-grip')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  if (mode === 'journal') { await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*free write\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(900); }
}
async function backTab(app, id) {
  if (!(await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
  await app.evalJs(`document.getElementById('wz-tutor-tab-${id}')?.click(); null`); await sleep(600);
}

// THE ROOM (arbor2/room.ts): Arbor's room follows the clock unless data-room says otherwise (light = Always day, dark = Always night), so the job's tone is set as the room, and a frame is never two shots of the one room
const setRoom = async (app, tone) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${q(tone === 'dark' ? 'dark' : 'light')}); null`); await sleep(900); };
const SCREENS = {
  'arbor-back-plan': async (app) => { await seed(app); await open(app, 'plateau.back'); await backTab(app, 'plan'); },
  'arbor-back-grafts': async (app) => {
    await seed(app); await open(app, 'plateau.back');
    await app.evalJs("(() => { const D = window.wrizoDocSettings; if (D) { D.addAsset('fb-1', { entryId: 'fb-note' }); D.addAsset('fb-1', { entryId: 'fb-own', boxId: 'c2' }); window.wrizoFlushNow(); } return null; })()");
    await sleep(500);
    await backTab(app, 'links');
  },
  'arbor-back-tutor': async (app) => { await seed(app); await open(app, 'plateau.back'); await backTab(app, 'tutor'); },
  'arbor-back-freewrite': async (app) => { await seed(app); await open(app, 'plateau.back', 'journal'); await backTab(app, 'tutor'); },
  'arbor-back-publish': async (app) => {
    await seed(app); await open(app, 'plateau.back,plateau.top,plateau.uplink');
    await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(600);
    await backTab(app, 'tutor');
  },
};
export default Object.fromEntries(Object.entries(SCREENS).map(([name, fn]) => [name, async (app, ctx) => { await fn(app, ctx); await setRoom(app, ctx && ctx.tone); }]));
