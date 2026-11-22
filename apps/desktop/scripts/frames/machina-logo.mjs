// MACHINA'S MARK, BEFORE AND AFTER (Nick, Nov 21, via Fable 1:30 pm: the corner mark becomes the mockup's WRIZO with its brass notch centred on the
// O). Machina with its look on, a page, in the Day room and the Night room (the look's own harness clock); the job's widths 1366 and 1920.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=machina -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/machina-logo.mjs \
//      -f screens=logo-day,logo-night,logo-reorg-day,logo-reorg-night
// logo-*: the page with its flush bar (the mark is the bar's nameplate); logo-reorg-*: the same page under the reorg (the corner mark).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PAGE = 'mlogo-page';

async function open(app, reorg, clock) {
  await app.evalJs(`(() => { if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === '${PAGE}')) return true;
    return !!window.wrizoCreateJournalPage({ id: '${PAGE}', text: 'The mill stood at the river, and the river was up past the second step.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' }); })()`);
  await sleep(400);
  await app.evalJs(`history.replaceState(null, '', '${reorg ? '/?reorg=1' : '/'}#/page/${PAGE}'); null`);
  await app.reload();
  await app.waitFor("document.documentElement.getAttribute('data-machina2') === 'true' && !!document.querySelector('.forward-only-editor')", { label: 'the page with the look', timeout: 20000 }).catch(() => {});
  await app.evalJs('document.fonts && document.fonts.ready.then(() => true)');
  await app.evalJs(`window.machina2Clock ? window.machina2Clock('${clock}') : null`);
  await sleep(900);
  await app.mouseMove(700, 400); await sleep(400);
  const r = await app.evalJs(`(() => { const dots = document.documentElement.getAttribute('data-machina2-dots') === 'in'; const h = dots ? document.querySelector('.machina2-nameplate') : document.querySelector('.brand-mark');
    if (!h) return null; const b = h.getBoundingClientRect(); return { dots, room: document.documentElement.getAttribute('data-machina2-room'), text: (h.textContent || '').trim(), box: [b.left, b.top, b.width, b.height].map((n) => Math.round(n * 10) / 10) }; })()`);
  console.log(`MACHINA-LOGO-FRAME ${reorg ? 'reorg' : 'page'} ${clock} ${JSON.stringify(r)}`);
}

export default {
  'logo-day': (app) => open(app, false, '12:00'),
  'logo-night': (app) => open(app, false, '23:00'),
  'logo-reorg-day': (app) => open(app, true, '12:00'),
  'logo-reorg-night': (app) => open(app, true, '23:00'),
};
