// FLUX3 S3 - THE DOC as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s3.mjs
// -f screens=doc-frame,doc-portbox,doc-idle,doc-hand). The page flux3-s3.mjs seeds (through the app's seams, never raw storage), in Draft, under
// ?flux3=1. doc-frame: the gutter, the ports and the Glitch bar at rest. doc-portbox: a port's box open. doc-idle: the idle glitch mid-word (the idle
// clock told it has been still 400 s). doc-hand: the TOOLS hand open (its tab's line). Each screen prints what it stood on ("FLUX3-S3-FRAME ...").
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
  const id = `f3s3-frames-${Date.now()}`;
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
const point = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const click = async (app, p) => {
  await app.mouseMove(p.x, p.y);
  await app.cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', buttons: 1, clickCount: 1, pointerType: 'mouse' });
  await app.cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', buttons: 0, clickCount: 1, pointerType: 'mouse' });
};
const stood = (app) => app.evalJs("({ flag: document.documentElement.hasAttribute('data-flux3'), page: document.documentElement.getAttribute('data-page'), mode: document.querySelector('[data-mode-key][aria-selected=\"true\"]')?.getAttribute('data-mode-key') || null, gutterRows: document.querySelectorAll('.flux3-gutter-row').length, ports: document.querySelectorAll('.flux3-port').length, glitchbar: !!document.querySelector('[data-flux3-glitchbar]'), box: !!document.querySelector('[data-flux3-port-box]'), idleWords: document.querySelectorAll('.flux3-idle-word').length, handOpen: document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') || null })");

export default {
  'doc-frame': async (app) => {
    await seed(app);
    console.log(`FLUX3-S3-FRAME doc-frame ${JSON.stringify(await stood(app))}`);
  },
  'doc-portbox': async (app) => {
    await seed(app);
    const p = await point(app, '.flux3-port');
    if (p) { await click(app, p); await sleep(500); }
    console.log(`FLUX3-S3-FRAME doc-portbox ${JSON.stringify(await stood(app))}`);
  },
  'doc-idle': async (app) => {
    await seed(app);
    await app.evalJs('window.__f3IdleShift = 400');
    await waitSoft(app, "document.querySelectorAll('.flux3-idle-word').length > 0", { label: 'a word glitching', timeout: 6000 });
    console.log(`FLUX3-S3-FRAME doc-idle ${JSON.stringify(await stood(app))}`);
  },
  'doc-hand': async (app) => {
    await seed(app);
    const g = await point(app, '.wz-sliver-grip');
    if (g) { await click(app, g); await app.mouseMove(8, 8); await sleep(1000); }
    console.log(`FLUX3-S3-FRAME doc-hand ${JSON.stringify(await stood(app))}`);
  },
};
