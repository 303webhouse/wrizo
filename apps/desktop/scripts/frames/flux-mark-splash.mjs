// FLUX'S MARK AND SPLASH (S5, v5) as named screens for the frames job, for the Wrizors' guards (the build sheet's list), every one at ?flux3=1&reorg=1:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=flux -f tones=light,dark -f widths=1366,1920 -f screens_file=apps/desktop/scripts/frames/flux-mark-splash.mjs
//     -f screens=flux5-out,flux5-in,flux5-focus,flux5-short,flux5-reduced,flux5-signin,flux5-app,flux5-app-tear,flux5-app-decode,flux5-app-signal
//   flux5-out / -in     the held frame, signed out (LOG IN, COMPOSE) and signed in (RESUME, COMPOSE)
//   flux5-focus         Tab on a door: the command cyan, the brass bar, the ring (guard 3)
//   flux5-short         a 560 px tall window (guard 2)
//   flux5-reduced       reduced motion: the finished frame, a steady cursor (guard 4)
//   flux5-signin        LOG IN's pop-out over the finished frame
//   flux5-app           the in-app mark, top-left (guard 6), in both page tones
//   flux5-app-tear / -decode / -signal   the mark caught in each idle glitch (the page's animation frames are stopped on the glitch's first frame, for the still)
// NOT HERE: the run itself (the boot, the wiring, signal loss at 2.9 s). ci-frames refuses any frame with the splash on screen, so guard 1 (flashes) needs that exception on ci/actions-harness first.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const QUERY = 'flux3=1&reorg=1';
const LIVE = "(() => { const d = document.querySelector('.wz-flux5 [data-flux-door=compose]'); return !!d && !d.hasAttribute('data-wait'); })()";

const front = async (app, { anon = true, reduced = false } = {}) => {
  process.env.WS_ANON = anon ? '1' : '0';
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }]);
  await app.evalJs(`history.replaceState(null, '', '/?${QUERY}#/'); null`);
  await app.reload();
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  const up = await waitSoft(app, LIVE, { label: 'the doors', timeout: 10000 });
  if (!up) throw new Error('the v5 doors did not come up');
  await sleep(500);
};

const page = async (app, id) => {
  process.env.WS_ANON = '0';
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'The morning light came in low across the table, and she began to write.', createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); window.wrizoFlushNow && window.wrizoFlushNow(); history.replaceState(null, '', '/?${QUERY}#/page/${id}'); null`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  if (!(await waitSoft(app, "!!document.querySelector('[data-flux-appmark]')", { label: 'the in-app mark', timeout: 5000 }))) throw new Error('the in-app mark is not on the page');
  await sleep(700);
};

// waits for this glitch, and stops the page's animation frames on it, so the still shows it
const caught = async (app, mode) => {
  await app.evalJs(`(() => { const m = document.querySelector('[data-flux-appmark] [data-flux-mark]'); window.__f5Caught = false;
    new MutationObserver(() => { if (m.getAttribute('data-glitch') === ${JSON.stringify(mode)}) { window.requestAnimationFrame = () => 0; window.__f5Caught = true; } }).observe(m, { attributes: true, attributeFilter: ['data-glitch'] });
    window.__f3MarkIdleShift = 61; return true; })()`);
  if (!(await waitSoft(app, 'window.__f5Caught === true', { label: `the ${mode} glitch`, timeout: 12000 }))) throw new Error(`the ${mode} glitch did not come`);
  await sleep(40);
};

export default {
  'flux5-out': async (app) => { await front(app); },
  'flux5-in': async (app) => { await front(app, { anon: false }); },
  'flux5-focus': async (app) => {
    await front(app);
    await app.key('Tab');
    await sleep(200);
    if (!(await app.evalJs("!!(document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-flux-door]'))"))) await app.evalJs("document.querySelector('.wz-flux5 [data-flux-door=compose]').focus(); null");
    await sleep(150);
  },
  'flux5-short': async (app, ctx) => { await app.emulateDpr(1, ctx.width, 560); await front(app); },
  'flux5-reduced': async (app) => { await front(app, { reduced: true }); },
  'flux5-signin': async (app) => {
    await front(app);
    await app.evalJs("document.querySelector('.wz-flux5 [data-flux-door=login]').dispatchEvent(new MouseEvent('click', { bubbles: true })); null");
    await waitSoft(app, "!!document.querySelector('.wz-popout[data-popout=signin]')", { label: 'the pop-out', timeout: 4000 });
    await sleep(500);
  },
  'flux5-app': async (app, ctx) => { await page(app, `f5-app-${ctx.tone}-${ctx.width}`); },
  'flux5-app-tear': async (app, ctx) => { await page(app, `f5-t-${ctx.tone}-${ctx.width}`); await caught(app, 'tear'); },
  'flux5-app-decode': async (app, ctx) => { await page(app, `f5-d-${ctx.tone}-${ctx.width}`); await caught(app, 'decode'); },
  'flux5-app-signal': async (app, ctx) => { await page(app, `f5-s-${ctx.tone}-${ctx.width}`); await caught(app, 'signal'); },
};
