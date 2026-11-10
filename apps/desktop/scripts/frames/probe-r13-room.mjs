// PROBE (not a check; never merged; on d8ee4198): r13-tools-fit's "cut" reader, read with the room pinned DAY and then NIGHT on the same page, with
// the Tools drawer open. Prints, per room: data-arbor2-room, and every leaf element inside the drawer's slide whose right edge passes the slide's,
// with its class, its own and its nearest .arbor2-pagesh ancestor's display and opacity, and whether r13's shown() would count it.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const READ = `(() => { const slide = document.querySelector('.wz-sliver-panel .wz-drawer-slide') || document.querySelector('.wz-sliver-panel'); if (!slide) return { slide: false };
  const S = slide.getBoundingClientRect();
  const shown = (e) => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let n = e; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === 'none' || cs.visibility === 'hidden') return false; } return true; };
  const over = [...slide.querySelectorAll('*')].filter((e) => e.children.length === 0).map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ r }) => r.width > 0 && r.right > S.right + 0.5);
  return { room: document.documentElement.getAttribute('data-arbor2-room'), dayness: document.documentElement.getAttribute('data-arbor2-dayness'), slideRight: Math.round(S.right),
    over: over.slice(0, 6).map(({ e, r }) => { const sh = e.closest('.arbor2-pagesh'); const cs = getComputedStyle(e); const shs = sh ? getComputedStyle(sh) : null;
      return { cls: String(e.className).slice(0, 60), right: Math.round(r.right), w: Math.round(r.width), display: cs.display, opacity: cs.opacity, shDisplay: shs ? shs.display : null, shOpacity: shs ? shs.opacity : null, shClass: sh ? String(sh.className).slice(0, 60) : null, countedByR13: shown(e) }; }) }; })()`;
const screens = {
  'probe-r13-room': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'probe-r13', text: 'A page in Draft, for the drawer.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/probe-r13')"); await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash') && !!document.querySelector('.forward-only-editor')", { timeout: 20000 }).catch(() => {});
    await sleep(900);
    await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()"); await sleep(1200);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900);
    const out = { clock: await app.evalJs("new Date().toISOString()") };
    for (const room of ['day', 'night']) {
      await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(1500);
      out[room] = await app.evalJs(READ);
    }
    console.log(`PROBE-R13 ${JSON.stringify(out)}`);
  },
};
export default guarded(screens, { verdict: ['PROBE-R13'] });
