// #143 - the frames Fable asked for: a page born now with a few lines on it, as Draft shows it and as Free Write (Flux: Wire In) shows it, at 1366x768, his 1536x706
// and 1920x885. Extra screens for frames.yml (scripts/ci-frames.mjs). Each screen sets its OWN viewport, so dispatch with widths=1366 only:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=plateau,flux,machina -f tones=light -f widths=1366 \
//     -f screens=t143-1366-text,t143-1536-text,t143-1920-text,t143-1366-free,t143-1536-free,t143-1920-free \
//     -f screens_file=apps/desktop/scripts/frames/type-143.mjs
// THE PRODUCT'S OWN LOOK: the driver pins the older themes and the reorg off, so each screen lifts the reorg pin.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SIZES = { 1366: [1366, 768], 1536: [1536, 706], 1920: [1920, 885] };
const TEXT = 'The lamp burned low over the harbour, and Hannah waited by the door for a long while.\n\nWhen the tide turned she took the letter down from the shelf and read the second page again, slowly, the way her mother had read it to her.\n\nNobody came.';

const screen = (size, kind) => async (app) => {
  const [w, h] = SIZES[size];
  await app.emulateDpr(1, w, h);
  process.env.WS_REORG = '1';
  await app.evalJs("history.replaceState(null, '', '/#/')");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function' && typeof window.wrizoPatchEntry === 'function'", { label: 'the seams' });
  const id = await app.evalJs(`(() => { const e = window.wrizoCreateJournalPage(); window.wrizoPatchEntry(e.id, { text: ${JSON.stringify(TEXT)} }); localStorage.setItem('wrizo-mode-page-' + e.id, '${kind === 'free' ? 'journal' : 'drafting'}'); window.wrizoFlushNow(); return e.id; })()`);
  await sleep(400);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: 'the page', timeout: 15000 });
  await sleep(2500);
  await app.evalJs("(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); let t = null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if (n.data.length) t = n; ed.focus(); const r = document.createRange(); r.setStart(t, t.data.length); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); })()");
  await sleep(1500);
};

export default Object.fromEntries(Object.keys(SIZES).flatMap((size) => ['text', 'free'].map((kind) => [`t143-${size}-${kind}`, screen(size, kind)])));
