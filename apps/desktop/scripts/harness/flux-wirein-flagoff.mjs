// FLUX WIRE IN, FLAG OFF (Fable, Nov 12 6:50 pm: "BUILD the Corridor on its own in today's Flux"; the Wrizors' spec claude/wrizors/flux-wire-in.md section 6a). A BROWSER harness (Actions or a box turn).
// The claim: WITHOUT ?flux3=1, Flux's free-writing mode (Wire In) is the Corridor, and NOTHING ELSE of the redesign appears. Every page below is opened at /#/page/<id> (no flag) unless a check says otherwise.
//   W1 FLAG-OFF     no data-flux3 on <html>; the flag's chunk (assets/boot-*) is never fetched; none of the redesign's own elements exists (the Schema layer and readouts, the doc gutter and ports, the room ground, the Glitch bar, the
//                   idle glitch); the Crimson Pro default Voice is not on (--font-proseSerif has no Crimson): "her words keep today's page font"
//   W2 MOUNT        Wire In mounts in Flux without the flag: data-flux3-jacked on <html>, the Corridor element, at least eight frames, the zoomed page, the entry line "WIRED IN · ESC TO UNPLUG"
//   W3 STYLED       the Corridor is DRAWN by its own stylesheet (flux-wirein.css, scoped to data-wirein): fixed to the window, the ground #020C10, the burst edge a 2 px fixed line; data-wirein is on <html>
//   W4 TOGGLES      the paper Typewriter's toggles are not offered in Flux (a real one, where one is rendered, and a probe of the rule itself): computed display none
//   W5 CHROME       no rail, strip or corkboard while wired in: computed opacity 0 and no pointer
//   W6 LEAVE-TEXT   an Esc tap leaves to TEXT (the Draft mode, stored as 'drafting') on the SAME doc, the caret at the END of her text, the chrome back
//   W7 TONE         Page = Light: Wire In is dark while it runs (data-page=dark), the stored preference is untouched, and leaving gives the light tone back
//   W8 NO-PAPER-TW  a TEXT page never runs the paper Typewriter in Flux, even with the shared setting ON and this page's own stored value ON (data kept: both are still in storage afterwards)
//   W9 FONT         her words keep today's page face inside the Corridor: the editor's computed font-family equals the same page's in TEXT
//   W10 OTHERS      Arbor and Machina are untouched: no Corridor, no marked root, and Arbor's Free Write Typewriter (its setting ON) still zooms the page
//   W11 FLAG-ON     with ?flux3=1 the redesign's other pieces still arrive (data-flux3, the room ground in TEXT) AND the Corridor still mounts: the flag gates the rest, not Wire In
//   W12 IDLE        the idle line shows after 4 s of rest (none at first; then KEEP THE SIGNAL · ANY WORD WILL DO, drawn: not display none, fixed, opaque once its fade is done, below the caret; the nudge's earliest is ~7.6 s after entry)
//   W12b IDLE-PIN   the wait is 4.0 s after her LAST KEY (not after entry): a key typed once the entry line has gone, the line absent 3.3 s later, shown 3.9-4.9 s after that key (the nudge's own timer: NUDGE_MS = 4000)
//   MUT-*           nine landed mutants of the served bundle (a regex found exactly once, replaced in flight), each turning ITS OWN check RED and no other clause: the flag leaks on (W1), the marker never set (W3), the
//                   toggles' rule gone (W4), Wire In mounting only when the flag says so (W2), the chrome rule not matching (W5), the idle line hidden by its rule (W12), the idle line's switch read as off (W12), the wait made 2 s and 6 s (W12b)
// FLUX_WIREIN_SHOTS=<dir> writes frames. Run: node scripts/harness/flux-wirein-flagoff.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FLUX_WIREIN_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${pass || !detail ? '' : `  [${String(detail).slice(0, 700)}]`}`); };
const SEED = Array.from({ length: 6 }, (_, i) => `zq${i} zq${i + 1} zq${i + 2}`).join('\n');

// the instrument, installed before any page script: the page's own state in one read
const INSTRUMENT = `(() => {
  if (window.__w) return;
  const W = window.__w = {};
  W.ed = () => document.querySelector('.forward-only-editor');
  W.toEnd = () => { const ed = W.ed(); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; };
  W.caret = () => { const ed = W.ed(), s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r0 = s.getRangeAt(0); const pre = document.createRange(); pre.selectNodeContents(ed); pre.setEnd(r0.startContainer, r0.startOffset); return { before: pre.toString().length, total: ed.textContent.length }; };
  const cs = (s, p) => { const e = document.querySelector(s); if (!e) return null; return getComputedStyle(e)[p]; };
  W.st = () => { const r = document.documentElement, col = document.querySelector('.mode-pagecol'); const ed = W.ed();
    return { theme: r.getAttribute('data-theme'), flag: r.hasAttribute('data-flux3'), marker: r.hasAttribute('data-wirein'), jacked: r.hasAttribute('data-flux3-jacked'), tone: r.getAttribute('data-page'), zoom: col ? col.getAttribute('data-zoom') : null,
      font: ed ? getComputedStyle(ed).fontFamily : null, serif: getComputedStyle(r).getPropertyValue('--font-proseSerif'), twAttr: !!document.querySelector('[data-typewriter="true"]') }; };
  W.redesign = () => ['[data-flux3-layer]', '.flux3-tele', '[data-flux3-gutter]', '[data-flux3-ports]', '[data-flux3-room-ground]', '.flux3-glitchbar', '[data-flux3-idle]', '.flux3-idle-layer'].map((s) => [s, document.querySelectorAll(s).length]).filter((x) => x[1] > 0);
  W.chunks = () => performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\\/assets\\/boot-[\\w-]+\\.(js|css)/.test(n));
  W.corridor = () => { const c = document.querySelector('[data-flux3-corridor]'); const x = document.querySelector('.flux3-exit-line'); const b = document.querySelector('.flux3-burst');
    return { has: !!c, frames: document.querySelectorAll('.flux3-cor-frame').length, pos: c ? getComputedStyle(c).position : null, bg: c ? getComputedStyle(c).backgroundColor : null, exit: x ? x.textContent : null,
      burst: b ? { h: getComputedStyle(b).height, pos: getComputedStyle(b).position } : null }; };
  W.chrome = () => ['.desk-rail', '.desk-frame-strip', '.desk-frame-corkboard'].map((s) => { const e = document.querySelector(s); if (!e) return [s, null, null]; const c = getComputedStyle(e); return [s, +c.opacity, c.pointerEvents]; });
  W.toggles = () => { const real = [...document.querySelectorAll('.typewriter-toggle, [data-mode-toggle="typewriter"]')].map((e) => getComputedStyle(e).display);
    const p = document.createElement('button'); p.className = 'typewriter-toggle'; p.id = '__w_probe'; document.body.appendChild(p); const probe = getComputedStyle(p).display; p.remove(); return { real, probe }; };
  W.tabs = () => [...document.querySelectorAll('[data-mode-key]')].map((e) => ({ key: e.getAttribute('data-mode-key'), t: (e.textContent || '').trim(), sel: e.getAttribute('aria-selected') }));   // ModeStrip's own marker: data-mode-key
})();`;

// the landed mutants: [regex, replacement, which asset it lives in]; found exactly once, replaced in flight
const MUTANTS = {
  flagLeak: [/get\("flux3"\)==="1"/g, 'get("flux3")!=="zz"', 'js'],
  markerGone: [/setAttribute\("data-wirein",""\)/g, 'setAttribute("data-wireinx","")', 'js'],
  jackNeedsFlag: [/([\w$]+)!=null&&((?:[\w$]+\.)?jsx\([\w$]+,\{on:[\w$]+,scrollRef:[\w$]+,unitCount:[\w$]+\}\))/g, '$1!=null&&!1&&$2', 'js'],
  togglesBack: [/(:root\[data-wirein\]\[data-theme=flux\] \.typewriter-toggle)\{display:none!important\}/g, '$1{display:inline-flex}', 'css'],
  chromeStays: [/\[data-flux3-jacked\] :is\(\.desk-rail/g, '[data-flux3-jackedx] :is(.desk-rail', 'css'],
  idleHidden: [/(\.flux3-nudge)\{(transform:translate\(-50%,-50%\))/g, '$1{display:none;$2', 'css'],
  idleSoon: [/([\w$]+)=4e3(?=[,;])/g, '$1=2e3', 'js'],
  idleLate: [/([\w$]+)=4e3(?=[,;])/g, '$1=6e3', 'js'],
  idleOff: [/[\w$]+\(\)\.idle==="off"/g, '!0', 'js'],
};
const countOf = (re, text) => { re.lastIndex = 0; let n = 0; while (re.exec(text)) n += 1; re.lastIndex = 0; return n; };

let failedRun = false;
try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const st = () => ev('window.__w.st()');
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const keyTap = async (key, code, vk, heldMs = 40) => {
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk });
    await sleep(heldMs);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  };

  let mutant = null;
  const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }, { urlPattern: '*/assets/index-*.css', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) {
        const [re, to, kind] = MUTANTS[mutant];
        const isCss = /\.css(\?|$)/.test(p.request.url);
        if ((kind === 'css') === isCss) { const n = countOf(re, text); landed[mutant] = (landed[mutant] || 0) + n; if (n === 1) text = text.replace(re, to); }
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  // pages through the app's seam (never raw storage), made from the Desk (a surface with no flush handler)
  let seq = 0;
  const fresh = async (text) => { const id = `fwi-${Date.now()}-${seq += 1}`; await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`); await sleep(300); return id; };
  const open = async ({ id, theme = 'flux', tone = 'dark', flag = false, mode = null, prefs = {}, pageTw = null } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-ambiance-dial', '50');
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      ${mode ? `localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)});` : `localStorage.removeItem('wrizo-mode-page-${id}');`}
      ${pageTw === null ? '' : `localStorage.setItem('wrizo-typewriter-page-${id}', ${JSON.stringify(pageTw ? 'on' : 'off')});`} })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    await ev('window.__w.toEnd()');
    await app.mouseMove(8, 8);
    await sleep(1400);
  };
  // a page made once and reopened by each probe (a probe opens it fresh: a reload each time)
  const pidMain = await fresh(SEED);

  // ---- the probes: each returns { pass, detail }; the mutants run the SAME probe and must fail it ----------------------------------------------------
  const probes = {
    async flagOff() {
      await open({ id: pidMain, tone: 'dark' });
      const s = await st(); const red = await ev('window.__w.redesign()'); const chunks = await ev('window.__w.chunks()');
      const pass = s.theme === 'flux' && !s.flag && red.length === 0 && chunks.length === 0 && !/crimson/i.test(s.serif || '');
      return { pass, detail: JSON.stringify({ flag: s.flag, redesign: red, chunks, serif: s.serif }) };
    },
    async mount() {
      await open({ id: pidMain, tone: 'dark' });
      const s = await st(); const c = await ev('window.__w.corridor()');
      const pass = s.theme === 'flux' && s.jacked && s.zoom === 'true' && c.has && c.frames >= 8 && /WIRED IN/i.test(c.exit || '') && /UNPLUG/i.test(c.exit || '');
      return { pass, detail: JSON.stringify({ jacked: s.jacked, zoom: s.zoom, frames: c.frames, exit: c.exit }) };
    },
    async styled() {
      await open({ id: pidMain, tone: 'dark' });
      const s = await st(); const c = await ev('window.__w.corridor()');
      const pass = s.marker && c.has && c.pos === 'fixed' && c.bg === 'rgb(2, 12, 16)' && !!c.burst && c.burst.pos === 'fixed' && c.burst.h === '2px';
      return { pass, detail: JSON.stringify({ marker: s.marker, pos: c.pos, bg: c.bg, burst: c.burst }) };
    },
    async toggles() {
      await open({ id: pidMain, tone: 'dark' });
      const t = await ev('window.__w.toggles()');
      const pass = t.probe === 'none' && t.real.every((d) => d === 'none');
      return { pass, detail: JSON.stringify(t) };
    },
    async chrome() {
      await open({ id: pidMain, tone: 'dark' });
      const c = await ev('window.__w.chrome()');
      const seen = c.filter((x) => x[1] !== null);
      const pass = seen.length >= 1 && seen.every((x) => x[1] === 0 && x[2] === 'none');   // the strip is the one of the three this layout renders (the rail and corkboard have their own class names); a missing one is not counted, a seen one must be gone
      return { pass, detail: JSON.stringify(c) };
    },
    // W12: left alone, the idle line comes after 4 s of rest (counted once the entry line has gone: ~7.6 s after entry). None at first, then the line, drawn.
    async idle() {
      await open({ id: pidMain, tone: 'dark' });
      const read = () => ev("(() => { const n = document.querySelector('.flux3-nudge'); if (!n) return null; const c = getComputedStyle(n); const r = n.getBoundingClientRect(); const k = document.querySelector('.flux-block-caret'); const kb = k ? k.getBoundingClientRect() : null; return { text: n.textContent, disp: c.display, pos: c.position, op: +c.opacity, w: Math.round(r.width), below: kb ? r.top > kb.bottom : null }; })()");
      const early = await read();
      let n = null; for (let i = 0; i < 110 && !(n && n.op >= 0.99); i += 1) { await sleep(150); n = await read(); }
      await snap('wirein-flagoff-idle');
      const pass = early === null && !!n && /^KEEP THE SIGNAL/i.test(String(n.text).trim()) && n.disp !== 'none' && n.pos === 'fixed' && n.op >= 0.99 && n.w > 100 && n.below === true;
      return { pass, detail: JSON.stringify({ early, n }) };
    },
    // W12b: the wait runs from her LAST KEY. A key once the entry line has gone (the count starts then), the line absent at 3.3 s, shown 3.9-4.9 s after the key.
    async idlePin() {
      await open({ id: pidMain, tone: 'dark' });
      await ev("(() => { const P = window.__pin = { key: null, shown: null }; document.addEventListener('keydown', () => { if (P.shown === null) P.key = performance.now(); }, { capture: true }); new MutationObserver(() => { if (P.key !== null && P.shown === null && document.querySelector('.flux3-nudge')) P.shown = performance.now(); }).observe(document.body, { childList: true, subtree: true }); })()");
      await sleep(4300);   // the entry line (3 s + 0.6 s fade) has gone, the first line has not come
      await app.typeKeys('x');
      await sleep(3300);
      const mid = await ev("({ el: Math.round(performance.now() - window.__pin.key), has: !!document.querySelector('.flux3-nudge') })");
      let d = null; for (let i = 0; i < 70 && d === null; i += 1) { await sleep(100); d = await ev('window.__pin.shown === null ? null : Math.round(window.__pin.shown - window.__pin.key)'); }
      const pass = mid.has === false && mid.el < 3900 && d !== null && d >= 3900 && d <= 4900;
      return { pass, detail: JSON.stringify({ mid, shownAfterKey: d }) };
    },
  };

  { const r = await probes.flagOff(); ok('W1 FLAG-OFF without ?flux3=1: no data-flux3, the flag\'s chunk is never fetched, none of the redesign\'s own elements exists (Schema, doc gutter and ports, room ground, Glitch bar, idle glitch), and her words keep today\'s page face (no Crimson Pro default)', r.pass, r.detail); }
  { const r = await probes.mount(); ok('W2 MOUNT Wire In mounts in Flux without the flag: the root is marked, the page zoomed, the Corridor is there with at least eight frames, and the entry line reads WIRED IN · ESC TO UNPLUG', r.pass, r.detail); await snap('wirein-flagoff-corridor'); }
  { const r = await probes.styled(); ok('W3 STYLED the Corridor is drawn by its own stylesheet: data-wirein on the root, the Corridor fixed to the window over the ground #020C10, the burst edge a fixed 2 px line', r.pass, r.detail); }
  { const r = await probes.toggles(); ok('W4 TOGGLES the paper Typewriter\'s toggles are not offered in Flux: a probe of the rule and every real one rendered compute display none', r.pass, r.detail); }
  { const r = await probes.chrome(); ok('W5 CHROME no rail, strip or corkboard while wired in (computed opacity 0, no pointer)', r.pass, r.detail); }
  { const r = await probes.idlePin(); ok('W12b IDLE-PIN the wait is 4.0 s after her LAST KEY: a key once the entry line has gone, the line is absent 3.3 s later and shown 3.9-4.9 s after that key', r.pass, r.detail); }
  { const r = await probes.idle(); ok('W12 IDLE left alone the idle line shows after 4 s of rest: none at first, then KEEP THE SIGNAL · ANY WORD WILL DO below her writing line, drawn (not display none, fixed, opaque once its fade is done)', r.pass, r.detail); }

  // W6 / W7: leave with Esc, from a LIGHT page
  {
    const id = await fresh(SEED);
    await open({ id, tone: 'light' });
    const wired = await st();
    const stored0 = await ev("JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}').page");
    await keyTap('Escape', 'Escape', 27);
    await sleep(1500);
    const after = await st();
    const mode = await ev(`localStorage.getItem('wrizo-mode-page-${id}')`);
    const caret = await ev('window.__w.caret()');
    const chrome = await ev('window.__w.chrome()');
    const tabs = await ev('window.__w.tabs()');
    const stored1 = await ev("JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}').page");
    const textSel = tabs.some((x) => x.key === 'draft' && /^text$/i.test(x.t) && x.sel === 'true');
    ok('W6 LEAVE-TEXT an Esc tap leaves Wire In to TEXT (the Draft mode) on the SAME doc, the caret at the END of her text, and the chrome comes back (the TEXT tab is the selected one)',
      wired.jacked && !after.jacked && after.zoom !== 'true' && mode === 'drafting' && !!caret && caret.before === caret.total && chrome.filter((x) => x[1] !== null).every((x) => x[1] === 1) && textSel,
      JSON.stringify({ wired: wired.jacked, after: { jacked: after.jacked, zoom: after.zoom }, mode, caret, chrome, tabs }));
    ok('W7 TONE with the saved Page = Light, Wire In is dark while it runs, the saved preference is untouched, and leaving gives the light tone back', wired.tone === 'dark' && stored0 === 'light' && stored1 === 'light' && after.tone === 'light', JSON.stringify({ wired: wired.tone, after: after.tone, stored0, stored1 }));
  }

  // W8: a TEXT page in Flux with the Typewriter ON everywhere it could be stored
  {
    const id = await fresh('First line.\nSecond line of a draft page.');
    await open({ id, tone: 'dark', mode: 'drafting', prefs: { typewriter: true }, pageTw: true });
    const s = await st();
    const stored = await ev(`({ page: localStorage.getItem('wrizo-typewriter-page-${id}'), shared: JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').typewriter })`);
    ok('W8 NO-PAPER-TW a TEXT page never runs the paper Typewriter in Flux, even with the shared setting ON and this page\'s own stored value ON (not zoomed, not wired in), and both stored values are still there afterwards (kept as data)',
      s.theme === 'flux' && !s.jacked && s.zoom !== 'true' && !s.twAttr && stored.page === 'on' && stored.shared === true, JSON.stringify({ s, stored }));
    // W9: her words keep today's page face in the Corridor
    const idw = await fresh('First line.\nSecond line of a draft page.');
    await open({ id: idw, tone: 'dark' });
    const wi = await st();
    ok('W9 FONT her words keep today\'s page face inside the Corridor: the editor\'s font-family equals the same kind of page\'s in TEXT, and is not Crimson Pro', !!wi.font && wi.font === s.font && !/crimson/i.test(wi.font), JSON.stringify({ wire: wi.font, text: s.font }));
  }

  // W10: other themes
  {
    const idA = await fresh(SEED);
    await open({ id: idA, theme: 'plateau', tone: 'light', prefs: { typewriter: true } });
    const a = await st(); const ca = await ev('window.__w.corridor()');
    const idM = await fresh(SEED);
    await open({ id: idM, theme: 'machina', tone: 'light', prefs: { typewriter: true } });
    const m = await st(); const cm = await ev('window.__w.corridor()');
    ok('W10 OTHERS Arbor and Machina are untouched: no Corridor, never marked wired in, and Arbor\'s Free Write Typewriter (its setting ON) still zooms the page', a.theme !== 'flux' && !ca.has && !a.jacked && a.zoom === 'true' && m.theme !== 'flux' && !cm.has && !m.jacked, JSON.stringify({ arbor: { theme: a.theme, zoom: a.zoom, jacked: a.jacked, corridor: ca.has }, machina: { theme: m.theme, jacked: m.jacked, corridor: cm.has, zoom: m.zoom } }));
  }

  // W11: the flag still gates the rest, and does not gate Wire In
  {
    const idT = await fresh('First line.\nSecond line of a draft page.');
    await open({ id: idT, tone: 'dark', mode: 'drafting', flag: true });
    const t = await st(); const groundText = await ev("document.querySelectorAll('[data-flux3-room-ground]').length");
    const idW = await fresh(SEED);
    await open({ id: idW, tone: 'dark', flag: true });
    const w = await st(); const cw = await ev('window.__w.corridor()');
    ok('W11 FLAG-ON with ?flux3=1 the redesign\'s other pieces still arrive (data-flux3 on the root, the room ground on a TEXT page) and the Corridor still mounts: the flag gates the rest, not Wire In', t.flag && groundText >= 1 && w.flag && w.jacked && cw.has && cw.frames >= 8, JSON.stringify({ textFlag: t.flag, ground: groundText, wireFlag: w.flag, jacked: w.jacked, frames: cw.frames }));
  }

  // ============================== the mutants: each must LAND and turn ITS check RED ==============================
  const mutantRun = async (name, probe, label) => {
    mutant = name; landed[name] = 0;
    let res;
    try { res = await probe(); } catch (e) { res = { pass: false, detail: 'threw ' + String(e.message || e).slice(0, 120) }; }
    mutant = null;
    ok(`MUT-${name} (${label}): the mutant LANDED (${landed[name]} anchor) and its check goes RED`, landed[name] === 1 && res.pass === false, `landed ${landed[name]}; ${res.detail}`);
  };
  await mutantRun('flagLeak', probes.flagOff, 'the flag reads on without the query -> W1');
  await mutantRun('jackNeedsFlag', probes.mount, 'Wire In mounts only when the flag says so -> W2');
  await mutantRun('markerGone', probes.styled, 'the stylesheet\'s marker never set -> W3');
  await mutantRun('togglesBack', probes.toggles, 'the toggles\' hiding rule gone -> W4');
  await mutantRun('chromeStays', probes.chrome, 'the chrome rule no longer matches a wired-in page -> W5');
  await mutantRun('idleHidden', probes.idle, 'the idle line hidden by its own rule -> W12');
  await mutantRun('idleOff', probes.idle, 'the idle line\'s switch read as off -> W12');
  await mutantRun('idleSoon', probes.idlePin, 'the wait made 2 s -> W12b');
  await mutantRun('idleLate', probes.idlePin, 'the wait made 6 s -> W12b');
  mutant = null;
}); } catch (e) { failedRun = true; console.error('HARNESS ERROR', e && e.stack ? e.stack : e); }

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nFLUX-WIREIN-FLAGOFF VERIFY: ${failedRun ? 'FAIL - the harness itself threw' : failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS (${checks.length} checks)`}`);
process.exit(failedRun || failed ? 1 : 0);
