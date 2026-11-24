// #127: FINALIZE's PARTS tab (Arbor, Machina) and Flux's TRACKS in Uplink - one line per Part - as frames, in all three themes and both tones, through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f screens=parts-list -f themes=plateau,flux,machina -f tones=light,dark -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/parts-list-127.mjs
// A frame is a LOOK, never a verdict. The Doc's five Parts have names from short to far longer than the drawer is wide, so the cut ("...") shows.
// Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const NAMES = ['Opening', 'The long middle of the story where everything changes and nobody agrees what happened', 'Close', 'An afterword that goes on about the weather in the harbour town for far too long to fit', 'Notes'];
const URLS = {
  machina: '/?reorg=1&arbor2=0&flux3=0',
  plateau: '/?reorg=1&reorglift=plateau.front,plateau.top,plateau.back,plateau.uplink',
  flux: '/?reorg=1&arbor2=0&flux3=1&reorglift=flux.top,flux.front,flux.uplink,flux.back',
};
async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const doc = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(doc.id, grants.id);
    ${JSON.stringify(NAMES)}.forEach((name, i) => {
      page('pl-' + (i + 1), 'Words of part ' + (i + 1) + '.', { origin: 'project', projectId: doc.id, orderIndex: i });
      W.wrizoPatchEntry('pl-' + (i + 1), { pageSettings: ${PS}, name, level: 0 } });
    });
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}
const SCREENS = {
  'parts-list': async (app, ctx) => {
    await seed(app);
    await app.evalJs(`history.replaceState(null, '', '${URLS[ctx.theme] || URLS.plateau}#/page/pl-3'); null`);
    await app.reload();
    try { await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
    await sleep(900);
    if (ctx.theme === 'plateau') await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(ctx.tone === 'dark' ? 'dark' : 'light')}); null`);
    await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()"); await sleep(700);
    for (let i = 0; i < 3 && !(await app.evalJs("!!document.querySelector('[data-reorg-pub]')")); i += 1) {
      await app.evalJs("(() => { const b = document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"publish\"]'); if (b) b.click(); return null; })()"); await sleep(900);
    }
    const isOpen = () => app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
    if (!(await isOpen())) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(800); }
    if (!(await isOpen())) { await app.evalJs("document.querySelector('[data-menus-handle]')?.click(); null"); await sleep(800); }
  },
};
export default SCREENS;
