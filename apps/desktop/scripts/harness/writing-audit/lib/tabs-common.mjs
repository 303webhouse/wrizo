// TWO OR THREE WINDOWS, shared by the #76 checks (refresh: tabs-refresh.mjs; keep both: tabs-merge.mjs). A same-origin <iframe> of the app is another window: its own JS realm and cache, the same localStorage.
// `runTabs({ title, cases })` boots the app once per config (WA_THEME / WA_FLAG / WA_TONE / WA_W / WA_H, as every audit file does), hands `cases` the helpers below, prints PASS/FAIL lines and FINDINGS, and exits 1 on a red when WA_STRICT=1.
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';

export async function runTabs({ title, cases }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'plateau', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const TAG = `${THEMES[cfg.theme].label}/${cfg.flag}/${cfg.tone}/${cfg.width}`;
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const out = (s) => console.log(s);
  const results = [];

  await withHarness(async (app) => {
    const d = makeDriver(app, cfg);
    out(`WRITING AUDIT ${title} [${TAG}] (${new Date().toISOString()})`);
    await d.boot();
    const ev = d.ev;
    const record = (id, name, fails, notes = []) => { results.push({ id, name, pass: !fails.length, fails, notes }); out(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ').slice(0, 1400) : ''}${notes.length ? '  notes: ' + notes.join('; ').slice(0, 700) : ''}`); };
    const run = async (id, name, fn) => {
      if (only && !only.has(id)) return;
      const e0 = d.errors.length; const fails = [], notes = [];
      try { await fn(fails, notes); } catch (e) { fails.push('harness: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | ').slice(0, 300)); }
      if (d.errors.length > e0) fails.push('console: ' + d.errors.slice(e0, e0 + 2).join(' | ').slice(0, 200));
      if (fails.length) await d.shot(`${TAG.replace(/\//g, '-')}-${id}`);
      record(id, name, fails, notes);
    };

    // windows: A is the page itself, B and C are same-origin iframes (each its own JS realm and cache, all on one localStorage)
    const win = (w) => (w === 'A' ? 'window' : `document.getElementById('wa-tab-${w.toLowerCase()}').contentWindow`);
    const tabWin = async (w) => {
      const id = `wa-tab-${w.toLowerCase()}`;
      await ev(`document.querySelectorAll('#${id}').forEach((f) => f.remove())`); await sleep(300);
      await ev(`(() => { const f = document.createElement('iframe'); f.id = '${id}'; f.src = location.href; f.style.cssText = 'position:fixed;${w === 'C' ? 'left' : 'right'}:0;top:0;width:700px;height:600px;z-index:99999;background:#fff;border:0'; document.body.appendChild(f); return true; })()`);
      await app.waitFor(`(() => { const f = document.getElementById('${id}'); try { return !!f.contentDocument.querySelector('.forward-only-editor') && !!f.contentWindow.__wa; } catch (e) { return false; } })()`, { timeout: 25000, label: `tab ${w}` });
      await sleep(900);
    };
    const h = {
      app, d, ev, run, sleep, win,
      stored: (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); return r ? r.text : null; } catch (e) { return 'ERR ' + e.message; } })()`),
      mkPage: async (pid, text) => {
        await ev(`document.querySelectorAll('#wa-tab-b,#wa-tab-c').forEach((f) => f.remove())`); await sleep(600);   // BEFORE the page is made: a closing window writes its whole, older store over this one's, and would take the new page with it
        await ev(`location.hash = '#/'`); await sleep(150);
        await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pid, text, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
        await ev(`localStorage.setItem('wrizo-mode-page-${pid}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${pid}', 'off')`);
      },
      openA: async (pid) => {
        await ev(`location.hash = '#/page/${pid}'`);
        await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'tab A' }); await sleep(700);
        await d.surface('.forward-only-editor', false);
      },
      tabB: () => tabWin('B'),
      tabC: () => tabWin('C'),
      tabRead: (w) => ev(`${win(w)}.__wa.read()`),
      // focus a window's editor and put the caret at plain offset `at`: a number, or an expression of the window's text `t` written as a string (see tabs-merge.mjs); default: the end
      tabFocus: async (w, at) => {
        const where = at === undefined ? 'n' : typeof at === 'number' ? String(at) : `(() => { const t = w.__wa.read().text; return ${at}; })()`;
        await ev(`(() => { const w = ${win(w)}; w.focus(); const e = w.document.querySelector('.forward-only-editor'); e.focus({ preventScroll: true }); const n = w.__wa.read().text.length; w.__wa.place(${where}); return n; })()`);
        await sleep(150);
      },
      // type into a window: the keys go to whichever window has focus, so the window is focused first
      typeIn: async (w, s, at) => { await h.tabFocus(w, at); await d.type(s); },
      keyIn: async (w, key, at) => { await h.tabFocus(w, at); await d.key(key); },
      shows: async (w) => { const r = await h.tabRead(w); return r && r.text; },
      waitShows: async (w, pred, ms) => { const t0 = Date.now(); let t = await h.shows(w); while (!pred(t) && Date.now() - t0 < ms) { await sleep(300); t = await h.shows(w); } return t; },
    };
    await cases(h);
  });
  const bad = results.filter((r) => !r.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, results }, null, 1));
  out(`\nFINDINGS [${TAG}]: ${bad.length} of ${results.length} cases failed${bad.length ? ': ' + bad.map((r) => r.id).join(' ') : ''}`);
  process.exit(env.WA_STRICT === '1' && bad.length ? 1 : 0);
}
