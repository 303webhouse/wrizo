// PRESETS-B: the PARTS Presets list (34 standard picks) and the PLAN Presets list (15), as frames, in Machina, Arbor and Flux (?flux3=1&reorg=1), through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f screens=presets-parts-list,presets-parts-note,presets-plan-list -f themes=machina,plateau,flux -f tones=light,dark -f widths=1366 -f screens_file=apps/desktop/scripts/frames/presets-b.mjs
// (Fable, Nov 23, 6:14 pm: "frames at 1366 x 768 of the open PLAN list (15) and the PARTS list (34) in Machina, Arbor and Flux. Flux has no .reorg-dockind-prow rule, so I need to see that row.")
// presets-parts-list   the kind menu's Presets unfolded, at its own scroll
// presets-parts-note   the same, scrolled to the first new row (Class Essay) with its "?" OPEN: the row with the "?" beside it, and the note
// presets-plan-list    the PLAN tab's Presets list open (Machina and Flux; Arbor has no Plan tab: its frame shows the drawer as it stands, the Sections list)
// A frame is a LOOK, never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const LIFT = 'plateau.front,plateau.top,plateau.back';

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const doc = W.wrizoCreateProject('Novel'); W.wrizoSetProjectDrawer(doc.id, drawer.id);
    ['one', 'two', 'three'].forEach((w, i) => page('pb-' + (i + 1), 'The harbour was quiet when she arrived, chapter ' + w + '.', { origin: 'project', projectId: doc.id, orderIndex: i }));
    page('pp-1', 'The harbour was quiet when she arrived.', { origin: 'loose' });
    W.wrizoFlushNow();
    return null;
  })()`);
  await sleep(500);
}
const search = (theme) => (theme === 'flux' ? '?flux3=1&reorg=1' : theme === 'plateau' ? `?reorg=1&reorglift=${LIFT}` : '?reorg=1&arbor2=0');
async function open(app, theme, tone, id) {
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); history.replaceState(null, '', '/${search(theme)}#/page/${id}'); null`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && (!!document.querySelector('.wz-sliver-grip') || !!document.querySelector('.wz-tutor-grip'))", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  if (theme === 'plateau') await app.evalJs(`document.documentElement.setAttribute('data-room', ${q(tone === 'dark' ? 'dark' : 'light')}); null`);
  if (theme === 'machina') await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  else await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()");
  await sleep(900);
}
async function partsPresets(app, theme, tone) {
  await open(app, theme, tone, 'pb-2');
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(500);
  await app.evalJs("document.querySelector('.wz-sliver [data-reorg-parts] [data-doc-kind]')?.click(); null"); await sleep(400);
  await app.evalJs("document.querySelector('[data-doc-menu] [data-doc-menu-item=\"presets\"]')?.click(); null"); await sleep(500);
}
const SCREENS = {
  'presets-parts-list': async (app, ctx) => { await seed(app); await partsPresets(app, ctx.theme, ctx.tone); },
  'presets-parts-note': async (app, ctx) => {
    await seed(app); await partsPresets(app, ctx.theme, ctx.tone);
    await app.evalJs("(() => { const r = document.querySelector('[data-preset-row=\"class-essay\"]'); if (r) r.scrollIntoView({ block: 'center' }); return null; })()"); await sleep(300);
    await app.evalJs("(() => { const b = document.querySelector('[data-preset-note=\"class-essay\"] .wz-drawer-note-btn'); if (b) { b.focus(); b.click(); } return null; })()"); await sleep(500);
  },
  'presets-plan-list': async (app, ctx) => {
    await seed(app);
    await open(app, ctx.theme, ctx.tone, 'pp-1');
    if ((await app.evalJs("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'")) !== true) { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click(); null"); await sleep(700); }
    await app.evalJs("document.getElementById('wz-tutor-tab-plan')?.click(); null"); await sleep(500);
    await app.evalJs("document.querySelector('[data-plan-presets]')?.click(); null"); await sleep(500);
    // Arbor has no Plan tab: open its drawer as it stands, so the frame is of what a writer sees there
    if (!(await app.evalJs("!!document.querySelector('[data-plan-preset-list]')")) && !(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  },
};
export default SCREENS;
