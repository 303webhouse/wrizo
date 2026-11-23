// FLUX REORG: THE FRONT MENU IN FLUX (flux-reorg-spec sections 4 and 6), on the Flux REDESIGN (?flux3=1), as frames: the dark room only (Flux's light page is not live), at 1366 and 1920:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f screens=flux-front-markup,flux-front-folds,flux-front-tracks,flux-front-kind,flux-front-presets,flux-front-colour,flux-front-uplink -f themes=flux -f tones=dark -f screens_file=apps/desktop/scripts/frames/flux-reorg-front.mjs
// The piece is not switched on in reorg/themeGate.ts for Flux yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=flux.top,flux.front: the Sliver gets its Front menu only under the top bar's piece): the door only shows a piece, it flips no cell.
// A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const LIFT = 'flux.top,flux.front';

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.slice(-1) + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('ff-note', 'Field notes\\nThe rain came late, and the river ran brown for a week.', { origin: 'loose' });
    page('ff-board', 'Plan board', { origin: 'loose', pageType: 'board', boxes: [{ id: 'c1', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'The opening image', seq: 0 }] });
    const parts = [['ff-1', 'Arrival', 'The harbour was quiet when she arrived. Nobody met her at the quay.', 'a'], ['ff-2', 'The town', 'By the second week the town had decided what she was.', 'b'], ['ff-3', 'The toll', 'The toll was paid in the spring.', 'c'], ['ff-4', 'The ice', 'The ice went out on a Tuesday.', 'd'], ['ff-5', 'The ferry', 'The ferry came back with no one on it.', 'e'], ['ff-6', 'The ledger', 'She read the ledger twice.', 'f'], ['ff-7', 'Her own', 'A Track in a colour of her own.', '#C04A2B'], ['ff-8', 'No colour', 'A Track with no colour at all.', null]];
    parts.forEach(([id, , text], i) => page(id, text, { origin: 'project', projectId: brief.id, orderIndex: i }));
    parts.forEach(([id, name, , color]) => W.wrizoPatchEntry(id, { pageSettings: ${PS}, name, level: 0, ...(color ? { color } : {}) } }));
    W.wrizoPatchEntry('ff-board', { pageLinks: [{ id: 'l1', aEntryId: 'ff-board', aBoxId: 'c1', bEntryId: 'ff-1', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' }] });   // a Part's badge counts what links to it (reorg/partAssets.ts), not the Doc's own assets
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}
async function open(app, lift = LIFT) {
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0&flux3=1&reorglift=${lift}#/page/ff-1')`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  if (!(await app.evalJs("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
}
const tab = async (app, id) => { await app.evalJs(`document.getElementById('wz-sliver-tab-${id}')?.click(); null`); await sleep(500); };

export default {
  'flux-front-markup': async (app) => { await seed(app); await open(app); await tab(app, 'text'); },
  // a DIAGNOSTIC frame, not for review: the MARKUP frame with a readout of where the block caret is drawn, what the selection says and what stands at the stray bar's place (x 479, y 459 at 1366)
  'flux-front-probe': async (app) => {
    await seed(app); await open(app); await tab(app, 'text');
    await app.evalJs("(() => { const c = document.querySelector('.flux-block-caret'); const r = c && c.getBoundingClientRect(); const s = getSelection(); let sr = null; try { if (s && s.rangeCount) { const x = s.getRangeAt(0).getClientRects()[0]; sr = x ? [Math.round(x.left), Math.round(x.top), Math.round(x.height)] : 'no rect'; } } catch { sr = 'threw'; } const a = document.activeElement; const info = { vw: innerWidth, caret: r ? [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] : null, sel: sr, anchor: s && s.anchorNode ? s.anchorNode.nodeName + ':' + s.anchorOffset : null, active: a ? String(a.className || a.tagName).slice(0, 30) : null, at: document.elementsFromPoint(479, 459).slice(0, 3).map((x) => String(x.className || x.tagName).split(' ')[0]) }; const d = document.createElement('div'); d.textContent = JSON.stringify(info); d.style.cssText = 'position:fixed;left:380px;top:300px;width:600px;z-index:99999;padding:8px;background:#000;color:#fff;font:13px monospace;word-break:break-all'; document.body.appendChild(d); return null; })()");
    await sleep(200);
  },
  'flux-front-folds': async (app) => {
    await seed(app); await open(app); await tab(app, 'text');
    for (let i = 0; i < 2; i += 1) { await app.evalJs("(() => { for (const b of document.querySelectorAll('.wz-sliver-panel [data-text-fold][aria-expanded=\"false\"]')) b.click(); return null; })()"); await sleep(300); }
  },
  'flux-front-tracks': async (app) => { await seed(app); await open(app); await tab(app, 'parts'); },
  'flux-front-kind': async (app) => { await seed(app); await open(app); await tab(app, 'parts'); await app.evalJs(press('[data-doc-kind]')); await sleep(400); },
  'flux-front-presets': async (app) => { await seed(app); await open(app); await tab(app, 'parts'); await app.evalJs(press('[data-doc-kind]')); await sleep(350); await app.evalJs(press('[data-doc-menu-item="presets"]')); await sleep(400); },
  'flux-front-colour': async (app) => {
    await seed(app); await open(app); await tab(app, 'parts');
    await app.evalJs(press('[data-part-more="ff-1"]')); await sleep(300);
    await app.evalJs(press('.reorg-part-colour-open')); await sleep(350);
    await app.evalJs(press('[data-colour-custom]')); await sleep(350);
  },
  'flux-front-uplink': async (app) => {
    await seed(app); await open(app, `${LIFT},flux.back,flux.uplink`);
    await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(700);
    if (!(await app.evalJs("document.querySelector('.wz-sliver-panel')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(600); }
  },
};
