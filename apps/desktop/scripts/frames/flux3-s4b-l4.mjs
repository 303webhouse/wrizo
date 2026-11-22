// FLUX3 S4b L4 - THE PAGE'S FRAME as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s4b-l4.mjs
// -f screens=doc-frame-l4). The doc flux3-s3's own frames screen seeds (the same words, links and Draft, through the app's seams, never raw storage), under
// ?flux3=1, photographed with what it stood on: where the readout header ends, where the page's scroller clips, the first row's box and its first glyph's ink,
// and how far the page rests scrolled ("FLUX3-S4B-L4-FRAME ..."). Law 1 (Fable, Nov 21, 6:00 pm): the header never covers a line.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const PARAS = [
  'The first paragraph runs long enough to wrap across a few lines of the page, so that the line holding the caret is only one of the several lines it fills with these plain words.',
  '',
  'A second block, shorter.',
  'Third block keeps going with plain words for the gutter count.',
  '',
  'Fourth and last block closes the page with a handful more words to read.',
];

const seed = async (app) => {
  const id = `f3l4-frames-${Date.now()}`;
  const at = new Date().toISOString();
  const mk = (row) => app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await mk({ id: `${id}-board`, text: 'Board S3', pageType: 'board', boxes: [{ id: 'f3-k', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Linked card' }], createdAt: at, origin: null, source: null });
  await mk({ id: `${id}-other`, text: 'Other page\nIts line.', createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id, text: PARAS.join('\n'), createdAt: at, origin: 'loose', source: 'page' });
  await app.evalJs(`window.wrizoAddPageLink(${JSON.stringify(id)}, { bEntryId: ${JSON.stringify(`${id}-board`)}, bBoxId: 'f3-k' })`);
  await app.evalJs(`window.wrizoAddPageLink(${JSON.stringify(id)}, { bEntryId: ${JSON.stringify(`${id}-other`)} })`);
  await sleep(400);
  await app.evalJs(`history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.evalJs("(() => { const b = document.querySelector('[data-mode-key=\"draft\"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); })()");
  await app.mouseMove(8, 8);
  await sleep(2400);
};

const stood = (app) => app.evalJs(`(() => {
  const page = document.querySelector('.mode-page'); if (!page) return null;
  const head = page.parentElement.querySelector(':scope > [data-flux3-dochead]'), sc = page.querySelector('.mode-scroll'), ed = page.querySelector('.forward-only-editor');
  const row = ed && ed.querySelector('.wz-row'); let ink = null;
  if (row) { const w = document.createTreeWalker(row, NodeFilter.SHOW_TEXT); const n = w.nextNode(); if (n) { const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 1); const g = r.getBoundingClientRect(); ink = { top: g.top, bottom: g.bottom }; } }
  const rr = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom, h: r.height }; };
  return { flag: document.documentElement.hasAttribute('data-flux3'), page: rr(page), head: rr(head), clip: sc ? sc.getBoundingClientRect().top : null, scrollTop: sc ? sc.scrollTop : null,
    row: rr(row), ink, active: document.activeElement ? document.activeElement.className : null, dpr: devicePixelRatio, inner: [innerWidth, innerHeight] };
})()`);

export default {
  'doc-frame-l4': async (app) => {
    await seed(app);
    console.log(`FLUX3-S4B-L4-FRAME doc-frame-l4 ${JSON.stringify(await stood(app))}`);
  },
};
