// §3b item 4, pass 2 PROBE (no product change): at 2560 under the chrome scale, where the crumb's Part, the "...", the search door and the
// readout sit in the DOM, what colours and boxes they read, and how far the window overflows. Readings go to the job log (SCALE-PROBE ...).
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=machina -f widths=1920 -f tones=dark -f screens_file=apps/desktop/scripts/frames/scale-probe.mjs -f screens=scale-probe
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);
const READ = `(() => {
  const path = (e) => { const out = []; for (let n = e; n && n !== document.body && out.length < 7; n = n.parentElement) out.push(n.tagName.toLowerCase() + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\\s+/).slice(0, 3).join('.') : '')); return out.join(' < '); };
  const info = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return { path: path(e), box: [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10), color: s.color, bg: s.backgroundColor, pos: s.position, zoom: s.zoom, font: s.fontSize, text: (e.textContent || '').trim().slice(0, 40) }; };
  const byText = (re) => [...document.querySelectorAll('.chrome-top *')].filter((e) => e.children.length === 0 && re.test(e.textContent || ''));
  const se = document.scrollingElement;
  const tall = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > innerHeight + 0.5 && getComputedStyle(e).position !== 'fixed' && r.height > 0; }).slice(0, 8).map((e) => ({ p: path(e), bottom: Math.round(e.getBoundingClientRect().bottom * 10) / 10 }));
  return { win: [innerWidth, innerHeight], scroll: { h: se.scrollHeight, w: se.scrollWidth, ch: se.clientHeight, cw: se.clientWidth, bodyH: document.body.scrollHeight }, budget: getComputedStyle(document.documentElement).getPropertyValue('--fx3-chrome-budget'),
    k: document.documentElement.style.getPropertyValue('--wz-chrome-k'), part: byText(/Part \\d+ of \\d+/).map(info), bar: info(document.querySelector('.chrome-top.sprint-nav')),
    dots: info(document.querySelector('.gh-corner-glyph')), dotsParent: info(document.querySelector('.gh-corner-glyph')?.parentElement), search: [...document.querySelectorAll('[data-search-door], .reorg-search-door, .reorg-top-search, [aria-label*="Search"], [aria-label*="Find"]')].slice(0, 3).map(info),
    run: info(document.querySelector('.machina-run')), count: byText(/page \\d+ of \\d+/i).map(info).concat([...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /page \\d+ of \\d+/i.test(e.textContent || '')).slice(0, 2).map(info)),
    tall }; })()`;

export default {
  'scale-probe': async (app) => {
    await app.evalJs(`(() => { const W = window; if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === 'sp-1')) return true;
      const drawer = W.wrizoCreateDrawer('Fiction'); const mill = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(mill.id, drawer.id);
      W.wrizoCreateJournalPage({ id: 'sp-1', text: ${q(['Chapter One', ...LINES].join('\n'))}, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: mill.id, orderIndex: 0 });
      W.wrizoCreateJournalPage({ id: 'sp-2', text: 'Chapter Two', createdAt: '2026-04-01T00:00:00.000Z', source: 'page', origin: 'project', projectId: mill.id, orderIndex: 1 });
      W.wrizoFlushNow(); return true; })()`);
    for (const [w, h] of [[1366, 768], [2560, 1440]]) {
      await app.emulateDpr(1, w, h);
      await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/sp-1'); null");
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.reorg-top')", { label: 'the reorg page', timeout: 20000 }).catch(() => {});
      await sleep(1200);
      await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
      await sleep(1500);
      console.log(`SCALE-PROBE ${w} ${JSON.stringify(await app.evalJs(READ))}`);
    }
  },
};
