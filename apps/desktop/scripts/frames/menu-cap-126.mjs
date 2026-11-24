// #126 frames (Fable, Nov 24 11:15 am: "Frames at 2560 x 1440 in all three themes, both tones"): the Front menu on its TEXT tab (FONT, the Find
// scope) and the Back menu on ASSETS, at 1366x768, 1920x1080 and 2560x1440 (#126 and #130, one type pass), each theme as it is live. Each screen sets its OWN window (the job's widths are
// 1366 and 1920 only, as reorg-scale.mjs does), so name one width and every screen still shoots at its own size:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=machina,plateau,flux -f widths=1920 \
//      -f screens_file=apps/desktop/scripts/frames/menu-cap-126.mjs -f screens=cap-front-1366,cap-front-1920,cap-front-2560,cap-back-1366,cap-back-1920,cap-back-2560
// The fixture is made through the app's own seams; the page is her first Part. Nothing here judges: menu-cap-126.mjs (harness) does.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const SIZE = { 1366: 768, 1920: 1080, 2560: 1440 };
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);

async function fixture(app) {
  return app.evalJs(`(() => {
    const W = window;
    const ids = { one: 'mcf-1', notes: 'mcf-n' };
    if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === ids.one)) return ids;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
    page(ids.one, ${q(['Chapter One', ...LINES].join('\n'))}, { origin: 'project', projectId: mill.id, orderIndex: 0 });
    page('mcf-2', 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: mill.id, orderIndex: 1 });
    page('mcf-3', 'Chapter Three\\nThe flood.', { origin: 'project', projectId: mill.id, orderIndex: 2 });
    page(ids.notes, 'Research notes\\nMill wheels turn at about twelve turns a minute.', { origin: 'loose' });
    W.wrizoFlushNow();
    return ids;
  })()`);
}
async function at(app, w, ids) {
  await app.emulateDpr(1, w, SIZE[w]);
  // no pin: each theme as it is live (the reorg asked for in the URL, which wins over the harness's off-switch)
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1#/page/${ids.one}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'her Part', timeout: 20000 }).catch(() => {});
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await sleep(900);
}
async function drawer(app, grip, root, tabs, want) {
  const open = `document.querySelector(${q(root)})?.getAttribute('data-open') === 'true'`;
  if (!(await app.evalJs(open))) await app.evalJs(`document.querySelector(${q(grip)})?.click(); null`);
  await app.waitFor(open, { label: `${root} open`, timeout: 5000 }).catch(() => {});
  await sleep(500);
  // the tab by its NAME (never an index); the drawer's own first tab if no such tab
  await app.evalJs(`(() => { const t = [...document.querySelectorAll(${q(tabs)})].find((x) => ${want}.test((x.textContent || '').trim())); if (t) t.click(); return !!t; })()`);
  await sleep(800);
}
async function report(app, name) {
  const r = await app.evalJs(`(() => { const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
    return { win: [innerWidth, innerHeight], theme: document.documentElement.getAttribute('data-theme'), k: document.documentElement.style.getPropertyValue('--wz-chrome-k') || null,
      paper: box('.mode-page'), rail: box('.desk-frame-strip'), front: box('.wz-sliver-panel'), back: box('.wz-tutor-panel') }; })()`);
  console.log(`MENU-CAP-FRAME ${name} ${JSON.stringify(r)}`);
}
const front = (w) => async (app) => { const ids = await fixture(app); await at(app, w, ids); await drawer(app, '.wz-sliver-grip', '.wz-sliver', '.wz-sliver [role="tab"]', '/^TEXT/i'); await app.mouseMove(4, 4); await sleep(300); await report(app, `cap-front-${w}`); };
const back = (w) => async (app) => { const ids = await fixture(app); await at(app, w, ids); await drawer(app, '.wz-tutor-grip', '.wz-tutor-panel', '.wz-tutor-panel [role="tab"]', '/^ASSET/i'); await app.mouseMove(4, 4); await sleep(300); await report(app, `cap-back-${w}`); };
export default {
  'cap-front-1366': front(1366), 'cap-front-1920': front(1920), 'cap-front-2560': front(2560),
  'cap-back-1366': back(1366), 'cap-back-1920': back(1920), 'cap-back-2560': back(2560),
};
