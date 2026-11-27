// GLITCH v2 and Distraction Free (FIX, Nov 26) as named screens for the frames job, for Nick:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=fix-glitch-v2 -f themes=flux -f widths=1366 -f screens_file=apps/desktop/scripts/frames/fix-glitch.mjs -f screens=<the names below>
// The job offers 1366 and 1920 only, so the 1536 x 864 frames are screens of their own (names ending -1536) that set that window themselves.
// A beat lasts under a third of a second, so each glitch frame holds a COPY of the beat in hand (the same pieces, the same places), taken the moment it appears.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ID = 'fix-glitch-page';
const TEXT = Array.from({ length: 10 }, (_, i) => `Paragraph ${i} keeps going along the river under the window of the quiet room, with plain words to read.`).join(String.fromCharCode(10));

const open = async (app, { w, off = false, df = false } = {}) => {
  if (w) await app.emulateDpr(1, w, 864);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`);
  await app.evalJs(`(() => { localStorage.setItem('wrizo-writing-settings', JSON.stringify({ instrumentsOn: true, progress: 'words', themeTracker: true, flicker: true, typewriter: false }));
    localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: 500, unit: 'words' }));
    const at = new Date().toISOString(), p = {}; if (${off}) p.flourishOff = { at, fieldAt: { flux: at }, flux: true }; if (${df}) p.distractionFree = { at, on: true }; localStorage.setItem('wrizo-reorg-prefs', JSON.stringify(p));
    localStorage.setItem('wrizo-mode-page-${ID}', 'drafting'); history.replaceState(null, '', '/?flux3=1&reorg=1#/page/${ID}'); return true; })()`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.mode-page')", { label: 'the page', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.mouseMove(4, 300);
  await sleep(2400);
};

// tell the idle clock how long she has been still, and keep a copy of the first beat that has what is asked for
const hold = async (app, shift, wanted) => {
  const got = await app.evalJs(`new Promise((res) => { const L = document.querySelector('[data-flux3-idle]'); if (!L) { res('no layer'); return; }
    const mo = new MutationObserver(() => { if (!L.querySelector(${JSON.stringify(wanted)})) return; mo.disconnect(); const c = document.createElement('div'); c.className = L.className;
      L.querySelectorAll(':scope > :not(svg)').forEach((n) => c.appendChild(n.cloneNode(true))); document.body.appendChild(c); window.__f3IdleShift = 0; res(c.children.length); });
    mo.observe(L, { childList: true }); window.__f3IdleShift = ${shift}; setTimeout(() => { mo.disconnect(); res('no beat'); }, 15000); })`);
  console.log(`FIX-GLITCH-FRAME shift ${shift}: ${got}`);
};

const session = async (app, w) => {
  await open(app, { w });
  const click = (sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
  await click('[data-reorg-rail] [data-category="reorg-docs"]'); await sleep(600);
  await click('[data-reorg-group="session"] [data-session-fold]'); await sleep(600);
  await app.evalJs("(() => { const e = document.querySelector('[data-session-hint=\"flicker\"]'); if (e) e.scrollIntoView({ block: 'end' }); return !!e; })()"); await sleep(400);
};

const set = (w) => {
  const tag = w ? `-${w}` : '';
  return {
    [`g-30s${tag}`]: async (app) => { await open(app, { w }); await hold(app, 40, '.flux3-idle-word'); },
    [`g-2min${tag}`]: async (app) => { await open(app, { w }); await hold(app, 150, '.flux3-glitch-band, .flux3-glitch-fringe-top'); },
    [`g-5min${tag}`]: async (app) => { await open(app, { w }); await hold(app, 400, '.flux3-glitch-band, .flux3-glitch-fringe-top'); },
    [`g-15min${tag}`]: async (app) => { await open(app, { w }); await hold(app, 1000, '.flux3-glitch-band, .flux3-glitch-fringe-top'); },
    [`g-off${tag}`]: async (app) => { await open(app, { w, off: true }); },
    [`g-session${tag}`]: async (app) => { await session(app, w); },
    [`g-distraction-free${tag}`]: async (app) => { await open(app, { w, df: true }); },
  };
};

export default { ...set(0), ...set(1536) };
