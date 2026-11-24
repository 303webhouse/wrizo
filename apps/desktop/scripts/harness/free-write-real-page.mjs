// #123 - FREE WRITE ON A REAL PAGE (Nick, Nov 24: "Free Write is broken in every theme: typing does nothing and the text keeps flashing"; Nick's page has saved text AND saved ink).
// L6's Free Write host (#110 / #82 / #117) shipped past every Free Write file because each of them types into a bare page: no ink, a short text, one width. This file is the page Nick has.
// Per arm (theme x width): ONE loose page with a saved page (a bare line of 150 words, and a real page: title, forty paragraphs, curly quotes, a trailing line break) and three saved ink strokes, opened as a loose page opens (Free Write in Arbor and Machina; Wire In, the Corridor, in Flux), the live
// defaults of every redesign (no pin: WS_ARBOR2 / WS_MACHINA2 = default; Flux's FLUX3 is on by default), 20 keys typed 90 ms apart at the end of the page:
//   FW1  every one of the 20 keys is in the editor (the page's text then is the saved words + what she typed, once)
//   FW2  and in the stored page (the record holds the same words)
//   FW3  the host stops changing once she stops: no node added, removed or changed in the editor for 5 s (the "flashing")
//   FW4  and never went backwards while she typed (no frame shows fewer of her words than the frame before: the text did not flash away)
//   P1   premises: the theme is the one asked for, the page has ink (strokes stored) and its words are on the page, Wire In is up in Flux and only there
//   MUT  the FW1 judge goes RED on a dropped key
// Themes: plateau (Arbor, the redesign), machina (the redesign), flux. Widths 1366 x 768 and 2560 x 1440.
// Run: node scripts/harness/free-write-real-page.mjs   (from apps/desktop; Actions or the box). FWR_THEMES=plateau,machina,flux and FWR_VIEWS=1366,2560 narrow it.
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 600) : ''}`); };
const THEMES = (process.env.FWR_THEMES || 'plateau,machina,flux').split(',');
const WIDTHS = (process.env.FWR_VIEWS || '1366,2560').split(',').map(Number);
const SIZES = { 1366: [1366, 768], 2560: [2560, 1440] };
// the saved text, in the shapes a writer's page has: a bare line of words, and a real page (a title line, forty paragraphs with blank lines, curly quotes and dashes, ending on a new line as a page does after she hits Enter)
const PARA = (i) => `Paragraph ${i} of the draft: “she kept going” — the river ran under the window of the room where she had left her coat, and word${i} stayed.`;
const SEEDS = {
  line: Array.from({ length: 150 }, (_, i) => 'word' + i).join(' '),
  page: ['A Title For The Page', ...Array.from({ length: 40 }, (_, i) => PARA(i))].join(String.fromCharCode(10, 10)) + String.fromCharCode(10),
};
const QUIET_MS = 5000;
const SEED_NAMES = (process.env.FWR_SEEDS || 'line,page').split(',');
const KEYS = 'abc def ghi jkl mnop';   // 20 keys
const INK = [
  { points: [{ x: 0.12, y: 0.10 }, { x: 0.30, y: 0.14 }, { x: 0.48, y: 0.11 }, { x: 0.60, y: 0.17 }] },
  { points: [{ x: 0.15, y: 0.30 }, { x: 0.28, y: 0.36 }, { x: 0.41, y: 0.31 }] },
  { points: [{ x: 0.55, y: 0.50 }, { x: 0.70, y: 0.46 }, { x: 0.82, y: 0.55 }] },
];
const nw = (s) => String(s || '').replace(/[\s​ ]/g, '');   // no white space at all: a line break may be a <br> with no character of its own
// the one verdict, used for every arm and for the mutant
const landed = (shown, seed, typed) => nw(shown) === nw(seed) + nw(typed);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const hashTo = async (h) => { await ev(`location.hash = ${JSON.stringify(h)}; true`); await sleep(300); };
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const ID = `fwr-${Date.now()}`;
  let first = true;
  for (const sn of SEED_NAMES) {
  const SEED = SEEDS[sn];
  for (const theme of THEMES) {
    for (const w of WIDTHS) {
      const tag = `${theme} ${w} ${sn}`;
      await app.emulateDpr(1, ...SIZES[w]);
      // off the page (the Desk has no flush handler): the page is made (or reset) through the app's seams, then the theme, then the page
      await hashTo('#/');
      await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before seed', timeout: 15000 });
      if (first) { await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: ID, text: SEED, strokes: INK, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })}); window.wrizoFlushNow(); true`); first = false; }
      else await ev(`window.wrizoPatchEntry(${JSON.stringify(ID)}, { text: ${JSON.stringify(SEED)}, strokes: ${JSON.stringify(INK)} }); window.wrizoFlushNow(); true`);
      await ev(`localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: 'dark', fade: 'on' })); localStorage.removeItem('wrizo-mode-page-${ID}'); history.replaceState(null, '', '/#/page/${ID}'); true`);
      await app.reload();
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: `the page (${tag})` }).catch(() => {});
      await splashGone();
      await sleep(theme === 'flux' ? 4600 : 1800);   // Flux: Wire In's entry line (3 s + 0.6 s fade) has gone first
      const where = await ev(`(() => { const r = document.documentElement; const ed = document.querySelector('.forward-only-editor'); return { theme: r.getAttribute('data-theme'), jacked: r.hasAttribute('data-flux3-jacked'), editor: !!ed, text: ed ? ed.textContent.replace(/\\u200b/g, '').length : -1, w: innerWidth }; })()`);
      const stored0 = await ev(`(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || 'null'); return rows ? (rows.find((x) => x.id === ${JSON.stringify(ID)}) || {}).strokes?.length || 0 : -1; })()`).catch(() => -1);
      ok(`P1 ${tag}: the theme and the page stood as asked (theme ${where.theme}, Wire In ${where.jacked}, editor ${where.editor}, ${where.text} chars, width ${where.w}, ink strokes stored ${stored0})`,
        where.editor && where.theme === theme && where.jacked === (theme === 'flux') && where.text >= nw(SEED).length - 2 && where.w === w && stored0 !== 0, JSON.stringify(where));
      // the meters: the editor's own mutations after she stops, and the frame-to-frame count of her words while she types
      await ev(`(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd();
        window.__fwr = { regress: 0, last: 0, muts: 0, quiet: false, on: true };
        const count = () => ed.textContent.replace(/\\u200b/g, '').length;
        const tick = () => { if (!window.__fwr.on) return; const n = count(); if (n < window.__fwr.last) window.__fwr.regress += 1; window.__fwr.last = n; requestAnimationFrame(tick); };
        window.__fwr.last = count(); requestAnimationFrame(tick);
        window.__fwr.what = [];
        new MutationObserver((m0) => { const m = m0.filter((r) => !(r.type === 'attributes' && r.attributeName === 'data-flux-caret-active')); /* Flux's own caret indicator blinks on the editor (the same on 1bc2cda5): it is not the host changing */ if (window.__fwr.quiet) { window.__fwr.muts += m.length; for (const r of m.slice(0, 3)) if (window.__fwr.what.length < 6) window.__fwr.what.push({ t: r.type, a: r.attributeName, n: (r.target.nodeType === 3 ? '#text' : r.target.tagName.toLowerCase() + '.' + String(r.target.className || '').split(' ')[0]), add: r.addedNodes.length, rem: r.removedNodes.length, at: Math.round(performance.now() - window.__fwr.t0) }); } }).observe(ed, { subtree: true, childList: true, characterData: true, attributes: true });
        return true; })()`);
      for (const ch of KEYS) { await app.typeKeys(ch); await sleep(90); }
      await sleep(400);
      const shown = await ev("document.querySelector('.forward-only-editor') ? document.querySelector('.forward-only-editor').textContent.replace(/\\u200b/g, '') : ''");
      ok(`FW1 ${tag}: all 20 keys landed in the editor, once`, landed(shown, SEED, KEYS), JSON.stringify({ tail: shown.slice(-40), len: nw(shown).length, want: (nw(SEED) + nw(KEYS)).length }));
      await ev('window.__fwr.quiet = true; window.__fwr.t0 = performance.now(); true');
      await sleep(QUIET_MS);
      const meter = await ev('({ regress: window.__fwr.regress, muts: window.__fwr.muts, what: window.__fwr.what })');
      ok(`FW3 ${tag}: the host stops changing once she stops (${meter.muts} changes in ${QUIET_MS / 1000} s)`, meter.muts === 0, JSON.stringify(meter));
      ok(`FW4 ${tag}: her words never went backwards while she typed (${meter.regress} frames showed fewer)`, meter.regress === 0, JSON.stringify(meter));
      await ev('window.__fwr.on = false; window.wrizoFlushNow(); true');
      await sleep(500);
      const stored = await ev(`(() => { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || 'null'); const r = rows && rows.find((x) => x.id === ${JSON.stringify(ID)}); return r ? r.text : null; })()`).catch(() => null);
      ok(`FW2 ${tag}: and in the stored page`, stored !== null && landed(stored, SEED, KEYS), JSON.stringify({ tail: stored ? String(stored).slice(-40) : stored }));
    }
  }
  }
  ok('MUT-FW1 the FW1 judge goes RED on a dropped key', landed(SEEDS.line + ' ' + KEYS.slice(0, 19), SEEDS.line, KEYS) === false && landed(SEEDS.line, SEEDS.line, KEYS) === false && landed(SEEDS.line + ' ' + KEYS, SEEDS.line, KEYS) === true);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
console.log(bad ? `\nFREE-WRITE-REAL-PAGE VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFREE-WRITE-REAL-PAGE VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
