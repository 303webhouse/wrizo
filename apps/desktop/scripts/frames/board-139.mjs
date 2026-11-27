// #139 - the frames Nick judges: a Flux Board that takes the screen, closed, with the Front menu open and with the Back menu open, at 1366x768 and
// 1920x1080. Extra screens for frames.yml (scripts/ci-frames.mjs). Each screen sets its OWN viewport, so dispatch with widths=1366 only:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=flux -f tones=dark,light -f widths=1366 \
//     -f screens=b139-1366-rest,b139-1366-front,b139-1366-back,b139-1920-rest,b139-1920-front,b139-1920-back \
//     -f screens_file=apps/desktop/scripts/frames/board-139.mjs
// The third row of cards sits 0.55 of a Board-width down on purpose: cards keep their share of the Board's width, so a wider Board shows less of its height.
// THE PRODUCT'S OWN LOOK: the driver pins the older themes and the reorg off, so each screen lifts both pins and refuses to photograph anything else.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SIZES = { 1366: [1366, 768], 1920: [1920, 1080] };
const SIDE = {
  front: { grip: '.wz-sliver-grip', open: "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'" },
  back: { grip: '.wz-tutor-grip', open: "document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true'" },
};
const T = (id, x, y, z, text) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.1, z, text });
const L = (id, a, b, z) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
const BOXES = [
  T('a', 0.03, 0.04, 1, 'Opening: the lamp left burning'), T('b', 0.39, 0.04, 2, 'The tide turns'), T('c', 0.75, 0.04, 3, 'First letter arrives'),
  T('d', 0.03, 0.3, 4, 'She reads it twice'), T('e', 0.39, 0.3, 5, 'The harbour meeting'), T('f', 0.75, 0.3, 6, 'What the boatman saw'),
  T('g', 0.03, 0.55, 7, 'Third row: the night crossing'), T('h', 0.39, 0.55, 8, 'Third row: the second letter'), T('i', 0.75, 0.55, 9, 'Third row: the lamp goes out'),
  L('ab', 'a', 'b', 10), L('bc', 'b', 'c', 11), L('de', 'd', 'e', 12),
];

const screen = (size, side) => async (app) => {
  const [w, h] = SIZES[size];
  await app.emulateDpr(1, w, h);
  process.env.WS_REORG = '1';
  await app.evalJs("history.replaceState(null, '', '/#/')");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (!(await app.evalJs("document.documentElement.hasAttribute('data-flux3') && !window.__wrizoReorgOff"))) throw new Error('not the product look: data-flux3 is missing or the reorg is off');
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-139', text: 'Harbour story', pageType: 'board', boxes: BOXES, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(400);
  await app.evalJs("location.hash = '#/page/fr-139'");
  await app.waitFor("!!document.querySelector('.board-canvas') && !!document.querySelector('.wz-sliver-grip')", { label: 'the Board', timeout: 12000 });
  await sleep(2000);
  await app.evalJs('document.activeElement?.blur()');
  if (side) {
    await app.evalJs(`document.querySelector('${SIDE[side].grip}')?.click()`);
    await sleep(1200);
    if (!(await app.evalJs(SIDE[side].open))) throw new Error(`the ${side} menu did not open`);
  }
  await sleep(1200);
};

export default Object.fromEntries(Object.keys(SIZES).flatMap((size) => ['rest', 'front', 'back'].map((side) => [`b139-${size}-${side}`, screen(size, side === 'rest' ? null : side)])));
