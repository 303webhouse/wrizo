// TRAIN 3 REVIEW FRAMES (Fable, Nov 12, 1:17 pm): one frame per theme after OPENING AN OLD /project/<id> LINK on train 3 (12a: the old project screens are gone; the
// route stays only as a redirect by the door ruling).
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<train-3 frames sha> -f themes=plateau,flux,machina -f screens=old-link-pages,old-link-empty \
//      -f widths=1366 -f screens_file=apps/desktop/scripts/frames/train3-old-link.mjs
//   old-link-pages  /project/<id> of a project WITH pages: lands on the project's FIRST page (editor mounted)
//   old-link-empty  /project/<id> of a project with NO pages, in a Drawer that holds a page: lands on that Drawer's first page with the Pages pop-out open (frame width)
// Seeded through the app's own seams (window.wrizo*), never raw storage; the shot is taken after the redirect has landed and the editor is up.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const J = (v) => JSON.stringify(v);
const soft = async (app, expr, label) => { try { await app.waitFor(expr, { label }); } catch { /* the frame is taken either way; frames.json shows what landed */ } };

const seed = (withEmpty) => `(() => {
  const D = window.wrizoCreateDrawer('Lighthouse drawer');
  const book = window.wrizoCreateBinder('The lighthouse book', 'book', D.id);
  const at = (n) => '2026-04-0' + n + 'T00:00:00.000Z';
  window.wrizoCreateJournalPage({ id: 'ol-b', text: 'Second page: the keeper climbs the stairs again.', projectId: book.id, origin: 'journal', source: 'page', pageType: 'manuscript', createdAt: at(2) });
  window.wrizoCreateJournalPage({ id: 'ol-a', text: 'First page: the keeper wakes before the light goes out.', projectId: book.id, origin: 'journal', source: 'page', pageType: 'manuscript', createdAt: at(1) });
  const empty = ${withEmpty ? "window.wrizoCreateBinder('An empty book', 'book', D.id)" : 'null'};
  window.wrizoFlushNow();
  return { book: book.id, empty: empty ? empty.id : null };
})()`;

const open = async (app, key) => {
  const ids = await app.evalJs(seed(key === 'empty'));
  await sleep(500);
  await app.goto('/project/' + (key === 'empty' ? ids.empty : ids.book));
  await soft(app, `!!document.querySelector('${ED}')`, 'redirect landed on a page');
  await sleep(1300);
};

export default {
  'old-link-pages': async (app) => { await open(app, 'pages'); },
  'old-link-empty': async (app) => { await open(app, 'empty'); },
};
