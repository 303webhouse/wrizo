// #138 - the frames Nick judges: a Draft page closed, with the Front menu open and with the Back menu open, at 1366x768, 1536x864 and 1920x1080.
// Extra screens for frames.yml (scripts/ci-frames.mjs). Each screen sets its OWN viewport, so dispatch with widths=1366 only:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=plateau,flux,machina -f tones=light -f widths=1366 \
//     -f screens=p138-1366-rest,p138-1366-front,p138-1366-back,p138-1536-rest,p138-1536-front,p138-1536-back,p138-1920-rest,p138-1920-front,p138-1920-back \
//     -f screens_file=apps/desktop/scripts/frames/page-138.mjs
// THE PRODUCT'S OWN LOOKS, as page-133.mjs takes them: ci-frames' driver pins the older themes and the reorg off, so each screen lifts both pins
// and refuses to photograph anything else. A frame whose menu did not open is refused too.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PARA = 'The lamp was still on when she came back to the page. Outside, the tide had turned and the boats were swinging round on their moorings. ';
const TEXT = [PARA.repeat(4), PARA.repeat(3), PARA.repeat(5)].join('\n\n');
const SIZES = { 1366: [1366, 768], 1536: [1536, 864], 1920: [1920, 1080] };
const SIDE = {
  front: { grip: '.wz-sliver-grip', open: "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'" },
  back: { grip: '.wz-tutor-grip', open: "document.querySelector('.wz-tutor-grip')?.getAttribute('aria-expanded') === 'true'" },
};
const MARK = { plateau: 'data-arbor2', flux: 'data-flux3', machina: 'data-machina2' };

const screen = (size, side) => async (app, { theme, tone }) => {
  const [w, h] = SIZES[size];
  await app.emulateDpr(1, w, h);
  process.env.WS_REORG = '1';
  const query = theme === 'plateau' && tone === 'dark' ? '?arbor2room=night' : '';
  await app.evalJs(`history.replaceState(null, '', '/${query}#/')`);
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (!(await app.evalJs(`document.documentElement.hasAttribute('${MARK[theme]}') && !window.__wrizoReorgOff`))) throw new Error(`not the product look: ${MARK[theme]} is missing or the reorg is off`);
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-138', text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-fr-138', 'drafting'); window.wrizoFlushNow()");
  await sleep(400);
  await app.evalJs("location.hash = '#/page/fr-138'");
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page')", { label: 'the page', timeout: 10000 });
  await sleep(1500);
  await app.evalJs("(() => { document.activeElement?.blur(); const s = document.querySelector('.mode-scroll'); if (s) s.scrollTop = 0; })()");
  if (side) {
    await app.evalJs(`document.querySelector('${SIDE[side].grip}')?.click()`);
    await sleep(1200);
    if (!(await app.evalJs(SIDE[side].open))) throw new Error(`the ${side} menu did not open`);
  }
  await sleep(1200);
};

export default Object.fromEntries(Object.keys(SIZES).flatMap((size) => ['rest', 'front', 'back'].map((side) => [`p138-${size}-${side}`, screen(size, side === 'rest' ? null : side)])));
