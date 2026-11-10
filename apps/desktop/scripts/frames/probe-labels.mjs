// PROBE (not a check; never merged): items 8 and 9 (Fable, Nov 10, 2:15 pm) - why the rail's "Journal" label reads 4.39 / 4.26:1 and "WORDS" 4.13:1.
// For each rail label and the count row's words, by day and by night, with the Tools drawer closed and open: its text, computed colour, font, and
// every ancestor (itself included) whose opacity is under 1 or that sets a filter - class and value.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const READ = `(() => { const chain = (el) => { const out = []; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n); if (Number(cs.opacity) < 1 || cs.filter !== 'none' || cs.mixBlendMode !== 'normal') out.push([String(n.className || n.tagName).slice(0, 50), cs.opacity, cs.filter, cs.mixBlendMode]); } return out; };
  const leaf = (root) => root ? [...root.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && e.getBoundingClientRect().width > 0) : [];
  const d = (e) => { const cs = getComputedStyle(e); return { text: e.textContent.trim().slice(0, 18), cls: String(e.className).slice(0, 50), color: cs.color, font: cs.fontFamily.slice(0, 30) + ' ' + cs.fontSize + ' ' + cs.fontWeight + ' ' + cs.fontVariantCaps, chain: chain(e) }; };
  const rail = document.querySelector('.desk-frame-strip');
  const count = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^words$/i.test((e.textContent || '').trim()) && e.getBoundingClientRect().width > 0);
  return { room: document.documentElement.getAttribute('data-arbor2-room'), dim: getComputedStyle(document.documentElement).getPropertyValue('--arbor2-dim').trim(),
    rail: leaf(rail).map(d), words: count.map(d), wordsParent: count.map((e) => getComputedStyle(e.parentElement).color) }; })()`;
const screens = {
  'probe-labels': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'probe-l', text: 'The morning light came in low across the table, and she began to write.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/probe-l')"); await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash') && !!document.querySelector('.forward-only-editor')", { timeout: 20000 }).catch(() => {});
    await sleep(900);
    await app.evalJs("document.querySelector('.desk-mode-tab[data-mode-key=\"draft\"]')?.click()"); await sleep(1200);
    await app.mouseMove(600, 300); await sleep(500);
    const out = {};
    for (const room of ['day', 'night']) {
      await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(1500);
      out[room + '-closed'] = await app.evalJs(READ);
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900);
      out[room + '-open'] = await app.evalJs(READ);
      await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900);
    }
    console.log(`PROBE-L ${JSON.stringify(out)}`);
  },
};
export default guarded(screens, { verdict: ['PROBE-L'] });
