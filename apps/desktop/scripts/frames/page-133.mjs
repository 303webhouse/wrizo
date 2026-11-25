// #133 - the frames Nick and the Wrizors judge: the page closed at 1366x768, 1536x864, 1920x1080 and 2560x1440, and the three side panels at 1536.
// Extra screens for frames.yml (scripts/ci-frames.mjs). Each screen sets its OWN viewport, so dispatch with widths=1366 only:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=plateau,flux,machina -f tones=light,dark -f widths=1366 \
//     -f screens=p133-1366,p133-1536,p133-1920,p133-2560,p133-1536-pop,p133-1536-front,p133-1536-back -f screens_file=apps/desktop/scripts/frames/page-133.mjs
// Arbor's dark page exists only in its night room, so a dark Arbor frame pins the room (the app's test-only ?arbor2room=night).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PARA = 'The lamp was still on when she came back to the page. Outside, the tide had turned and the boats were swinging round on their moorings. ';
const TEXT = [PARA.repeat(4), PARA.repeat(3), PARA.repeat(5)].join('\n\n');
const SIZES = { 1366: [1366, 768], 1536: [1536, 864], 1920: [1920, 1080], 2560: [2560, 1440] };
const OPEN = {
  pop: "[...document.querySelectorAll('.desk-frame-strip button')].find((b) => /pages|docs/i.test(b.textContent))",
  front: "document.querySelector('.wz-sliver-grip')",
  back: "document.querySelector('.wz-tutor-grip')",
};

const screen = (size, panel) => async (app, { theme, tone }) => {
  const [w, h] = SIZES[size];
  await app.emulateDpr(1, w, h);
  if (theme === 'plateau' && tone === 'dark') {
    await app.evalJs("location.hash = '#/?arbor2room=night'");
    await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  }
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'fr-133', text: TEXT, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })})`);
  await app.evalJs("localStorage.setItem('wrizo-mode-page-fr-133', 'drafting'); window.wrizoFlushNow()");
  await sleep(400);
  await app.evalJs("location.hash = '#/page/fr-133'");
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page')", { label: 'the page', timeout: 10000 });
  await sleep(1500);
  await app.evalJs("(() => { document.activeElement?.blur(); const s = document.querySelector('.mode-scroll'); if (s) s.scrollTop = 0; })()");
  if (panel) await app.evalJs(`(${OPEN[panel]})?.click()`);
  await sleep(1200);
};

export default {
  'p133-1366': screen(1366),
  'p133-1536': screen(1536),
  'p133-1920': screen(1920),
  'p133-2560': screen(2560),
  'p133-1536-pop': screen(1536, 'pop'),
  'p133-1536-front': screen(1536, 'front'),
  'p133-1536-back': screen(1536, 'back'),
};
