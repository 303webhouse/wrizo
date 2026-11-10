// PROBE (not a check; never merged): what r5-contrast's ground() walks for the rail's "Journal" label after main's merge (r5 1:1 sage on sage).
// Prints each text element named Journal in the rail and its ancestors' class, background colour and background image.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const screens = {
  'probe-journal': async (app) => {
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'probe-j', text: 'A page.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/probe-j')"); await app.reload();
    await app.waitFor("!document.querySelector('.wz-splash') && !!document.querySelector('.forward-only-editor')", { timeout: 20000 }).catch(() => {});
    await sleep(1500);
    const r = await app.evalJs(`(() => { const rail = document.querySelector('.desk-frame-strip'); if (!rail) return { rail: false };
      const els = [...rail.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() === 'Journal');
      return els.map((el) => { const chain = []; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const cs = getComputedStyle(n);
        chain.push({ tag: n.tagName.toLowerCase(), cls: String(n.className || '').slice(0, 80), bg: cs.backgroundColor, img: cs.backgroundImage.slice(0, 160), color: n === el ? cs.color : undefined }); if (chain.length > 7) break; }
        return chain; }); })()`);
    console.log(`PROBE-J ${JSON.stringify(r)}`);
  },
};
export default guarded(screens, { verdict: ['PROBE-J'] });
