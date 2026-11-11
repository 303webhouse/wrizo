// SESSION 6 (writing audit; Fable, Nov 11): TWO TABS on the same page, a 10,000-WORD page, WINDOW BLUR and RESIZE. FINDS AND REPORTS; FIXES NOTHING.
//   TWO TABS   a second app instance in a same-origin <iframe> is a second tab: its own JS realm and cache, the same localStorage (the app has no `storage` listener and flushes its cache wholesale). Type in one, then the other, reload each:
//              every word typed must be in the stored page, and each tab's reload must show it. A word missing is LOST TEXT and is reported first.
//   10,000 WORDS  a page of ~55,000 characters (400 paragraphs): typing and Enter at the end, Ctrl+Home, Ctrl+End, PageDown, many arrows, Backspace. After EVERY step: text, caret place, caret drawn, focus, page rect, console, and
//              that the line she is writing is IN the window (#64) - a step that scrolls on purpose is still held to that.
//   WINDOW     resize the viewport (1366 -> 1000 -> 1920 -> 1366) with the caret in the text, and a window blur / refocus: the text, the caret place, the painted caret and the focus survive; the page returns to its own rect.
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_ONLY WA_OUT WA_STRICT
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { Model, stepLabel } from './model.mjs';
import { verify } from './verify.mjs';

const WORDS = ['the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'writes', 'a', 'long', 'sentence', 'about', 'rain', 'light', 'morning', 'coffee', 'window', 'story', 'she', 'said', 'nothing', 'until', 'night'];
const bigText = () => Array.from({ length: 400 }, (_, p) => Array.from({ length: 25 }, (_, i) => WORDS[(p * 7 + i * 3) % WORDS.length]).join(' ')).join('\n');

export async function main({ title }) {
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
    const record = (id, name, fails, notes = []) => { results.push({ id, name, pass: !fails.length, fails, notes }); out(`${fails.length ? 'FAIL' : 'PASS'}  ${id} ${name} [${TAG}]${fails.length ? ': ' + fails.join(' || ').slice(0, 1100) : ''}${notes.length ? '  notes: ' + notes.join('; ').slice(0, 500) : ''}`); };
    const run = async (id, name, fn) => { if (only && !only.has(id)) return; const e0 = d.errors.length; const fails = [], notes = []; try { await fn(fails, notes); } catch (e) { fails.push('harness: ' + String((e && e.stack) || e).split('\n').slice(0, 2).join(' | ').slice(0, 300)); } if (d.errors.length > e0) fails.push('console: ' + d.errors.slice(e0, e0 + 2).join(' | ').slice(0, 200)); if (fails.length) await d.shot(`${TAG.replace(/\//g, '-')}-${id}`); record(id, name, fails, notes); };

    // ====================== TWO TABS ======================
    const stored = (id) => ev(`(() => { try { const rows = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const r = rows.find((x) => x.id === ${JSON.stringify(id)}); return r ? r.text : null; } catch (e) { return 'ERR ' + e.message; } })()`);
    const tabB = async () => {
      await ev(`(() => { const f = document.createElement('iframe'); f.id = 'wa-tab-b'; f.src = location.href; f.style.cssText = 'position:fixed;right:0;top:0;width:900px;height:700px;z-index:99999;background:#fff;border:0'; document.body.appendChild(f); return true; })()`);
      await app.waitFor(`(() => { const f = document.getElementById('wa-tab-b'); try { return !!f.contentDocument.querySelector('.forward-only-editor') && !!f.contentWindow.__wa; } catch (e) { return false; } })()`, { timeout: 25000, label: 'tab B' });
      await sleep(900);
    };
    const tabRead = (w) => ev(w === 'B' ? "document.getElementById('wa-tab-b').contentWindow.__wa.read()" : 'window.__wa.read()');
    const tabFocusEnd = async (w) => {
      const win = w === 'B' ? "document.getElementById('wa-tab-b').contentWindow" : 'window';
      await ev(`(() => { const w = ${win}; w.focus(); const e = w.document.querySelector('.forward-only-editor'); e.focus({ preventScroll: true }); const n = w.__wa.read().text.length; w.__wa.place(n); return n; })()`);
      await sleep(150);
    };
    const tabsCase = async (id, name, script) => run(id, name, async (fails, notes) => {
      const pid = `wa-tabs-${Date.now().toString(36)}`;
      await ev(`location.hash = '#/'`); await sleep(150);
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pid, text: 'Base. ', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
      await ev(`localStorage.setItem('wrizo-mode-page-${pid}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${pid}', 'off')`);
      await ev(`location.hash = '#/page/${pid}'`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'tab A' }); await sleep(700);
      await d.surface('.forward-only-editor', false);
      await tabB();
      const typed = [];
      const type = async (w, s) => { await tabFocusEnd(w); await d.type(s); typed.push({ w, s }); };
      await script({ type, sleep, tabRead });
      await sleep(1600);
      const storedNow = await stored(pid);
      const a = (await tabRead('A')).text, b = (await tabRead('B')).text;
      notes.push(`before any reload: A shows ${JSON.stringify(a)}, B shows ${JSON.stringify(b)}, stored ${JSON.stringify(storedNow)}`);
      const lost = typed.filter((t) => !String(storedNow).includes(t.s)).map((t) => `${t.s.trim()} (typed in tab ${t.w})`);
      if (lost.length) fails.push(`WORDS LOST from the stored page: ${lost.join(', ')}; stored ${JSON.stringify(storedNow)}`);
      // reload each tab: B first, then A
      await ev("document.getElementById('wa-tab-b').contentWindow.location.reload()"); await sleep(2500);
      const b2 = await tabRead('B'); const afterB = (b2 && b2.text) || null;
      await app.reload(); await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 20000, label: 'tab A after reload' }); await sleep(900);
      const afterA = (await d.read()).text;
      const afterStore = await stored(pid);
      if (afterB !== afterStore) fails.push(`tab B after its reload shows ${JSON.stringify(afterB)} but the stored page is ${JSON.stringify(afterStore)}`);
      if (afterA !== afterStore) fails.push(`tab A after its reload shows ${JSON.stringify(afterA)} but the stored page is ${JSON.stringify(afterStore)}`);
      const lost2 = typed.filter((t) => !String(afterStore).includes(t.s)).map((t) => t.s.trim());
      if (lost2.length && !lost.length) fails.push(`WORDS LOST by the reloads: ${lost2.join(', ')}`);
    });
    await tabsCase('TB1', 'tab A types, then tab B (opened before A typed) types; reload each', async ({ type, sleep: sl }) => { await type('A', 'Alpha one. '); await sl(1500); await type('B', 'Beta one. '); await sl(1500); });
    await tabsCase('TB2', 'both tabs type alternately at once, a word each way', async ({ type, sleep: sl }) => { await type('A', 'a1 '); await type('B', 'b1 '); await type('A', 'a2 '); await type('B', 'b2 '); await sl(1500); });
    await tabsCase('TB3', 'tab B types and the save settles; tab A (stale) types last', async ({ type, sleep: sl }) => { await type('B', 'Bee first. '); await sl(1500); await type('A', 'Ay second. '); await sl(1500); });

    // ====================== #76 PART 2: THE QUIET LINE WHEN THE SAME PAGE IS OPEN IN TWO WINDOWS ======================
    // Both windows show ONE quiet line ([data-same-page-elsewhere]): not a pop-up (no dialog, no button, nothing that takes focus), it never stops the writer typing, and it goes when the other window closes or leaves the page. It saves nothing: windows signal each other.
    const LINE = '[data-same-page-elsewhere]';
    const lineJs = (docExpr) => `(() => { const l = ${docExpr}.querySelector(${JSON.stringify(LINE)}); if (!l) return null; const r = l.getBoundingClientRect(); return { text: l.textContent.trim(), w: r.width, h: r.height, dialog: !!l.closest('[role=dialog],[role=alertdialog],dialog'), focusable: !!l.querySelector('button,input,a,select,textarea,[tabindex]') || l.hasAttribute('tabindex') }; })()`;
    const lineIn = (w) => ev(lineJs(w === 'B' ? "document.getElementById('wa-tab-b').contentDocument" : 'document'));
    const presence = (w) => ev(w === 'B' ? "JSON.stringify(document.getElementById('wa-tab-b').contentWindow.wrizoPresence && document.getElementById('wa-tab-b').contentWindow.wrizoPresence())" : 'JSON.stringify(window.wrizoPresence && window.wrizoPresence())');
    const lineWait = async (w, want, ms) => { const t0 = Date.now(); let v = await lineIn(w); while ((!!v) !== want && Date.now() - t0 < ms) { await sleep(400); v = await lineIn(w); } return v; };
    const mkPage = async (pid, text) => {
      await ev(`location.hash = '#/'`); await sleep(150);
      await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id: pid, text, createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
      await ev(`localStorage.setItem('wrizo-mode-page-${pid}', 'drafting'); localStorage.setItem('wrizo-typewriter-page-${pid}', 'off')`);
    };
    const dropFrames = async () => { await ev(`document.querySelectorAll('#wa-tab-b').forEach((f) => f.remove())`); await sleep(300); };   // a window of an earlier case must not stay open and answer for this one
    const openA = async (pid) => {
      await dropFrames();
      await ev(`location.hash = '#/page/${pid}'`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'tab A' }); await sleep(700);
    };
    await run('TW1', '#76 part 2: the same page open in two windows - both show the quiet line, it takes no focus and never blocks typing', async (fails, notes) => {
      const pid = `wa-warn-${Date.now().toString(36)}`;
      await mkPage(pid, 'Base. ');
      await openA(pid);
      const alone = await lineIn('A');
      if (alone) fails.push(`the line shows in a window that is the only one open: ${JSON.stringify(alone)}`);
      await tabB();
      const a = await lineWait('A', true, 9000), b = await lineWait('B', true, 9000);
      if (!a) fails.push('window A shows no quiet line though the same page is open in window B');
      if (!b) fails.push('window B shows no quiet line though the same page is open in window A');
      for (const [w, v] of [['A', a], ['B', b]]) {
        if (!v) continue;
        if (!(v.w > 0 && v.h > 0)) fails.push(`window ${w}'s line is not visible (${v.w}x${v.h})`);
        if (v.dialog) fails.push(`window ${w}'s line is a dialog, it must be a quiet line`);
        if (v.focusable) fails.push(`window ${w}'s line holds something that takes focus`);
        if (!v.text) fails.push(`window ${w}'s line is empty`);
      }
      notes.push(`A says ${JSON.stringify(a && a.text)}; B says ${JSON.stringify(b && b.text)}`);
      await tabFocusEnd('A'); await d.type('typed while warned ');
      const inA = (await tabRead('A')).text;
      if (!inA.includes('typed while warned')) fails.push(`typing in window A was blocked while the line showed: A reads ${JSON.stringify(inA)}`);
      const focused = await ev(`!!document.activeElement && !!document.activeElement.closest('.forward-only-editor')`);
      if (!focused) fails.push('the editor in window A lost focus while the line showed');
    });
    await run('TW2', '#76 part 2: the line goes when the other window closes', async (fails) => {
      const pid = `wa-warn2-${Date.now().toString(36)}`;
      await mkPage(pid, 'Base. ');
      await openA(pid);
      await tabB();
      if (!(await lineWait('A', true, 9000))) fails.push('no line to remove: window A never showed it');
      await ev(`document.getElementById('wa-tab-b').remove()`);
      if (await lineWait('A', false, 12000)) fails.push(`the line is still in window A twelve seconds after window B closed; A believes ${await presence('A')}`);
    });
    await run('TW3', '#76 part 2: a window on a DIFFERENT page shows no line; it shows once both are on the same page', async (fails) => {
      const p1 = `wa-warn3a-${Date.now().toString(36)}`, p2 = `wa-warn3b-${Date.now().toString(36)}`;
      await mkPage(p1, 'Page one. '); await mkPage(p2, 'Page two. ');
      await openA(p1);
      await tabB();
      await ev(`document.getElementById('wa-tab-b').contentWindow.location.hash = '#/page/${p2}'`); await sleep(3500);
      const a = await lineIn('A'), b = await lineIn('B');
      if (a || b) fails.push(`two windows on different pages show the line (A ${JSON.stringify(a && a.text)}, B ${JSON.stringify(b && b.text)}); A believes ${await presence('A')}; B believes ${await presence('B')}; B at ${await ev("document.getElementById('wa-tab-b').contentWindow.location.hash")}`);
      await ev(`document.getElementById('wa-tab-b').contentWindow.location.hash = '#/page/${p1}'`);
      if (!(await lineWait('A', true, 9000))) fails.push('window B came to the same page and window A shows no line');
      if (!(await lineWait('B', true, 9000))) fails.push('window B came to the same page and shows no line');
    });

    // ====================== 10,000 WORDS ======================
    await run('BG', 'a 10,000-word page: typing, Enter, Ctrl+Home, Ctrl+End, PageDown, arrows, Backspace at the end', async (fails, notes) => {
      const text = bigText();
      await d.surface('.forward-only-editor', false);
      await d.openPage(text, 'drafting', { typewriter: 'off' });
      await d.place(text.length); await sleep(400); await d.still();
      let m = new Model(text, text.length, text.length, 'linux');
      const steps = [
        { st: { k: 'type', s: ' The end.' }, label: 'type at the end' },
        { st: { k: 'key', key: 'Enter' }, label: 'Enter at the end' },
        { st: { k: 'type', s: 'New last line' }, label: 'type on the new line' },
        { st: { k: 'key', key: 'Home', ctrl: true }, label: 'Ctrl+Home', scroll: true },
        { st: { k: 'key', key: 'PageDown', prop: 'down' }, label: 'PageDown', scroll: true },
        { st: { k: 'key', key: 'PageDown', prop: 'down' }, label: 'PageDown again', scroll: true },
        { st: { k: 'key', key: 'End', ctrl: true }, label: 'Ctrl+End', scroll: true },
        ...Array.from({ length: 12 }, (_, i) => ({ st: { k: 'key', key: 'ArrowLeft' }, label: `Left ${i + 1}` })),
        { st: { k: 'key', key: 'Enter' }, label: 'Enter in the middle of the last line' },
        { st: { k: 'type', s: 'zz' }, label: 'type after it' },
        ...Array.from({ length: 4 }, (_, i) => ({ st: { k: 'key', key: 'Backspace' }, label: `Backspace ${i + 1}` })),
      ];
      for (let i = 0; i < steps.length; i++) {
        const { st, label, scroll } = steps[i];
        const before = await d.read(); const e0 = d.errors.length;
        const exp = m.clone(); if (!st.prop) exp.apply(st);
        await d.perform(st); await d.frames(); const early = await d.read(); await sleep(350); await d.still(); let late = await d.read();
        if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
        if (st.prop) { exp.a = exp.f = late.focus; if (!(late.focus > before.focus)) fails.push(`step ${i + 1} ${label}: the caret did not move forward (${before.focus} -> ${late.focus})`); }
        const box = exp.collapsed ? await d.box(exp.f) : null;
        const v = verify({ exp: exp.snapshot(), box, before, early, late, errors: d.errors.slice(e0), expect: { scroll: !!scroll } });
        if (v.fails.length) { fails.push(`step ${i + 1} ${label}: ${v.fails.map((f) => `${f.check} - ${f.detail}`).join(' | ').slice(0, 420)}`); if (fails.length <= 3) await d.shot(`${TAG.replace(/\//g, '-')}-BG-step${i + 1}`); if (fails.length >= 6) break; }
        m = exp;
      }
      notes.push(`${text.length} characters, ${text.split(/\s+/).length} words`);
    });

    // ====================== WINDOW: RESIZE AND BLUR ======================
    await run('WR', 'resize the window (1366 -> 1000 -> 1920 -> 1366) with the caret in the text: text, caret, focus survive; the page returns to its rect', async (fails, notes) => {
      await d.surface('.forward-only-editor', false);
      await d.openPage('Hello world\nSecond line', 'drafting', { typewriter: 'off' });
      await d.place(23); await sleep(300); await d.still();
      const start = await d.read(); const startPage = start.page;
      const seen = [];
      for (const [w, h] of [[1000, 700], [1920, 1080], [1366, 768]]) {
        await app.emulateDpr(1, w, h); await sleep(700); await d.still();
        let late = await d.read();
        if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
        const box = await d.box(late.focus);
        const v = verify({ exp: { text: 'Hello world\nSecond line', a: 23, f: 23 }, box, before: late, early: late, late, errors: [] });
        seen.push(`${w}x${h}: page ${late.page ? Math.round(late.page.w) + 'x' + Math.round(late.page.h) : '?'}`);
        for (const f of v.fails) if (f.check !== 'page') fails.push(`at ${w}x${h}: ${f.check} - ${f.detail}`);
      }
      const end = await d.read();
      const same = startPage && end.page && Math.abs(startPage.x - end.page.x) <= 1 && Math.abs(startPage.y - end.page.y) <= 1 && Math.abs(startPage.w - end.page.w) <= 1 && Math.abs(startPage.h - end.page.h) <= 1;
      if (!same) fails.push(`after returning to 1366x768 the page is ${JSON.stringify(end.page)}, it started as ${JSON.stringify(startPage)}`);
      await d.type('!'); const t = await d.read(); await sleep(200);
      if (t.text !== 'Hello world\nSecond line!') fails.push(`typing after the resizes gives ${JSON.stringify(t.text)}`);
      notes.push(seen.join('; '));
    });
    await run('WB', 'window blur and refocus (blur and visibilitychange events, focus emulation off and on): text, caret, painted caret, focus survive; typing goes on', async (fails, notes) => {
      await d.surface('.forward-only-editor', false);
      await d.openPage('', 'drafting', { typewriter: 'off' });
      await d.type('abc'); await sleep(400);
      const off = await app.cdp('Emulation.setFocusEmulationEnabled', { enabled: false }).then(() => true).catch(() => false);
      await ev("(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); window.dispatchEvent(new Event('blur')); document.dispatchEvent(new Event('visibilitychange')); })()");
      await sleep(1200);
      const mid = await d.read();
      await ev("(() => { delete document.visibilityState; delete document.hidden; window.dispatchEvent(new Event('focus')); document.dispatchEvent(new Event('visibilitychange')); })()");
      await app.cdp('Emulation.setFocusEmulationEnabled', { enabled: true }).catch(() => {});
      await sleep(600);
      const after = await d.read();
      await d.type('def'); await sleep(400); let late = await d.read();
      if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
      const box = await d.box(late.focus);
      const v = verify({ exp: { text: 'abcdef', a: 6, f: 6 }, box, before: late, early: late, late, errors: [] });
      notes.push(`focus emulation ${off ? 'toggled' : 'not available'}; during blur text ${JSON.stringify(mid.text)} focused=${mid.focused}; after refocus text ${JSON.stringify(after.text)} focused=${after.focused} selection ${after.anchor}..${after.focus}`);
      if (mid.text !== 'abc') fails.push(`during the blur the text is ${JSON.stringify(mid.text)}`);
      if (after.text !== 'abc' || after.focus !== 3) fails.push(`after refocus: text ${JSON.stringify(after.text)}, caret ${after.focus} (want "abc", 3)`);
      for (const f of v.fails) fails.push(`after typing on: ${f.check} - ${f.detail}`);
    });
  });
  const bad = results.filter((r) => !r.pass);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `findings-${title}-${TAG.replace(/\//g, '-')}.json`), JSON.stringify({ tag: TAG, cfg, results }, null, 1));
  out(`\nFINDINGS [${TAG}]: ${bad.length} of ${results.length} cases failed${bad.length ? ': ' + bad.map((r) => r.id).join(' ') : ''}`);
  process.exit(env.WA_STRICT === '1' && bad.length ? 1 : 0);
}
