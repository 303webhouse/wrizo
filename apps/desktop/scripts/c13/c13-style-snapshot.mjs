#!/usr/bin/env node
// #13 step 5 (deploy-13-brief.md, Phase B): THE STYLE PROBE, the instrument steps 6-12 compare against. Needs a box turn (a browser).
// It lives in scripts/c13/, not scripts/harness/: run-suite runs every .mjs in harness/, and one run of this writes tens of MB.
//
// For every screen in every skin it records each element that has a box: its DOM path, tag, class list, rect, and its computed style
// (every property, ::before and ::after included when they have content). A style is stored as its difference from an `all: initial`
// element in the same document, plus that reference, so the record is complete and small; identical styles are stored once.
// It also reports, per CSS selector (with its @media / @supports context), whether any element on any screen matched it (step 11).
//
//   node scripts/c13/c13-style-snapshot.mjs --out <dir> [--compare <baseline dir>] [--screens a,b] [--skins a,b] [--plant padding|rect]
//        (from apps/desktop, dist-web built) writes <dir>/snapshot.json and <dir>/selectors.json; with --compare, every difference
//        goes to <dir>/compare.txt and the verdict line says IDENTICAL or DIFFERENT (exit 1).
//   node scripts/c13/c13-style-snapshot.mjs --diff <a dir> <b dir>       the same compare, browserless, on two saved runs
//   node scripts/c13/c13-style-snapshot.mjs --selftest --out <dir>       THE PROOF: two full runs compare identical; a planted 1px padding
//        on one class is reported (that property, on that class); a planted move of the page is reported (the page's rect)
//
// Make the baseline and the run it is compared with in the same box turn: the Desk greets by the time of day, so a baseline from another
// day or hour can differ for that reason alone.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const arg = (name, dflt = null) => { const i = process.argv.indexOf('--' + name); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : dflt; };
const has = (name) => process.argv.includes('--' + name);
const list = (s) => String(s).split(',').map((x) => x.trim()).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const W = 1366, H = 768;
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write.';
const PLANT_CLASS = 'wz-strip-item';
const PLANTS = {
  padding: `.${PLANT_CLASS} { padding-left: 1px !important; }`,
  rect: `${ED} { translate: 0 1px !important; }`,
};

// ---------------------------------------------------------------------------------------------------------------------------------------
// The five skins (brief, step 5): Arbor, Flux dark-page, Flux light-page, Machina cool, Machina neutral.
const SKINS = {
  arbor: { theme: 'plateau' },
  'flux-dark': { theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  'flux-light': { theme: 'flux', prefs: { voice: 'serif', page: 'light', fade: 'on' } },
  'machina-cool': { theme: 'machina', cast: 'cool' },
  'machina-neutral': { theme: 'machina', cast: 'neutral' },
};

const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const need = async (app, expr, label, timeout = 8000) => { if (!(await waitSoft(app, expr, { label, timeout }))) throw new Error(`not reached: ${label}`); };

const freshDesk = async (app, skin) => {
  const s = SKINS[skin];
  await app.emulateDpr(1, W, H);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50');
    localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-theme', ${J(s.theme)});
    ${s.prefs ? `localStorage.setItem('wrizo-theme-prefs', ${J(J(s.prefs))});` : ''}
    ${s.cast ? `localStorage.setItem('wrizo-machina-cast', ${J(s.cast)});` : ''}`);
  await app.reload();
  await need(app, "!!document.querySelector('.wz-arrival')", 'the Desk');
  await need(app, "!document.querySelector('.wz-splash')", 'the splash gone', 15000);
};

// A seed goes through the app's own seams (AGENTS.md, "HOW TO SEED A FIXTURE"); every window.wrizo* seam flushes before it returns.
const pageWithWords = async (app) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: 'c13s-words', text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await app.evalJs("location.hash = '#/page/c13s-words'");
  await need(app, `!!document.querySelector('${ED}')`, 'the writing page');
  await sleep(900);
};
const zoomOn = (app) => app.evalJs("document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true'");
const sliverOpen = (app) => app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
const setZoom = async (app, on) => {
  if ((await zoomOn(app)) === on) return;
  const wasOpen = await sliverOpen(app);
  if (!wasOpen) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(600); }
  await need(app, "!!document.querySelector('[data-mode-toggle=\"typewriter\"]')", 'the Typewriter toggle', 3000);
  await app.evalJs("document.querySelector('[data-mode-toggle=\"typewriter\"]').click()");
  await sleep(900);
  if (!wasOpen) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(700); }
  if ((await zoomOn(app)) !== on) throw new Error(`the Typewriter zoom did not turn ${on ? 'on' : 'off'}`);
};
const openPanel = (category) => async (app) => {
  await pageWithWords(app);
  await setZoom(app, false);
  const sel = `[data-category="${category}"]`;
  await need(app, `!!document.querySelector(${J(sel)})`, `the ${category} strip item`, 3000);
  await app.evalJs(`document.querySelector(${J(sel)}).click()`);
  await sleep(900);
};

const SCREENS = {
  desk: async (app) => { await sleep(900); },
  page: async (app) => { await pageWithWords(app); await setZoom(app, false); },
  typewriter: async (app) => { await pageWithWords(app); await setZoom(app, true); },
  screenplay: async (app) => {
    await app.goto('/project/new');
    await need(app, "!!document.querySelector('[data-kind=\"screenplay\"]')", 'the screenplay kind');
    await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
    await app.click('Start writing');
    await need(app, "!!document.querySelector('.script-el-active')", 'the screenplay page');
    await sleep(900);
  },
  board: async (app) => {
    const boxes = [
      { id: 'c13s-a', kind: 'text', x: 0.08, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card A' },
      { id: 'c13s-b', kind: 'text', x: 0.4, y: 0.3, w: 0.2, h: 0.1, z: 2, text: 'Card B' },
    ];
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: 'c13s-board', text: 'Board', pageType: 'board', boxes, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: null })})`);
    await sleep(300);
    await app.evalJs("location.hash = '#/page/c13s-board'");
    await need(app, "!!document.querySelector('.board-canvas')", 'the board', 9000);
    await sleep(900);
  },
  tutor: async (app) => {
    await pageWithWords(app);
    await setZoom(app, false);
    await need(app, "!!document.querySelector('.wz-tutor-grip')", 'the Tutor grip', 3000);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await need(app, "document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'", 'the Tutor open', 3000);
    await sleep(400);
    await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()");
    await need(app, "document.querySelector('.wz-tutor-panel')?.getAttribute('data-docked') === 'true'", 'the Tutor docked', 3000);
    await sleep(900);
  },
  'panel-page': openPanel('page'),
  'panel-plan': openPanel('plan'),
  'panel-drawers': openPanel('drawers'),
  'panel-journal': openPanel('journal'),
  'panel-settings': openPanel('settings'),
  'panel-theme': openPanel('theme'),
  'panel-trash': openPanel('trash'),
};

// ---------------------------------------------------------------------------------------------------------------------------------------
// In the page. Plain functions, sent as source (no escaping).
function inPageSnapshot() {
  // Flux's Signal Loss pulses are random by design (store/signalLossEvents.ts) and each lasts at most ~1s. Every one asks the flash budget, which
  // calls window.__wzOnFlashGrant; the caller stamps the time. Refuse to read within 1.2s of a grant (this function is synchronous, so none can
  // land while it reads); the caller waits and asks again.
  if (performance.now() - (window.__c13Flash || -1e9) < 1200) return { busy: true };
  // Settle every CSS animation and transition: a looping one is paused at its start, a finite one jumps to its end. Without this a run reads
  // a glow or a pulse wherever it happens to be (two runs of one build differed only by these).
  for (const an of document.getAnimations()) {
    try { const t = an.effect && an.effect.getComputedTiming(); if (t && t.endTime === Infinity) { an.pause(); an.currentTime = 0; } else an.finish(); } catch { /* an animation that cannot settle is read as it is */ }
  }
  // Inside the FX layer the pulses leave random positions and classes behind (shear and noise move their own element; sync adds jmp). Those
  // properties and the x/y of the rect are not recorded there; the throwaway children (macroblocks, tear lines) are skipped. All else is.
  const FX = '.theme-fx-layer, .theme-fx-shear, .theme-fx-noise, .theme-fx-backlight';
  const TRANSIENT = /(^|\s)theme-fx-(macroblock|tear)(\s|$)/;
  const VOLATILE = /^(top|left|right|bottom|opacity|transform|translate|--op|animation(-.*)?)$/;
  const PULSE_CLASS = /(^|\s)(on|jmp|jmp2)(?=\s|$)/g;
  const ref = document.createElement('div');
  ref.setAttribute('style', 'all: initial');
  document.documentElement.appendChild(ref);
  const rcs = getComputedStyle(ref);
  const names = []; for (let i = 0; i < rcs.length; i++) names.push(rcs[i]);
  const refVals = {}; for (const n of names) refVals[n] = rcs.getPropertyValue(n);
  ref.remove();
  const styles = []; const index = new Map();
  const intern = (cs, fx = false) => {
    const o = {};
    for (const n of names) { if (fx && VOLATILE.test(n)) continue; const v = cs.getPropertyValue(n); if (v !== refVals[n]) o[n] = v; }
    const k = JSON.stringify(o); let id = index.get(k);
    if (id === undefined) { id = styles.length; styles.push(o); index.set(k, id); }
    return id;
  };
  const els = [];
  const walk = (el, p) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    if (el.getClientRects().length) {
      const r = el.getBoundingClientRect();
      const fx = !!el.closest(FX);
      let c = typeof el.className === 'string' ? el.className : (el.className && el.className.baseVal) || '';
      if (fx) c = c.replace(PULSE_CLASS, '$1').replace(/\s+/g, ' ').trim();
      const rect = [r.left, r.top, r.width, r.height].map((x) => Math.round(x * 100) / 100);
      const e = { p, t: el.tagName.toLowerCase(), c, r: fx ? [null, null, rect[2], rect[3]] : rect, s: intern(cs, fx) };
      for (const [pe, key] of [['::before', 'b'], ['::after', 'a']]) {
        const pcs = getComputedStyle(el, pe); const ct = pcs.getPropertyValue('content');
        if (ct && ct !== 'none' && ct !== 'normal') e[key] = intern(pcs, fx);
      }
      els.push(e);
    }
    let i = 0;
    for (const ch of el.children) {
      const t = ch.tagName.toLowerCase();
      if (TRANSIENT.test(typeof ch.className === 'string' ? ch.className : '')) continue; // not counted, so a stable sibling keeps its index
      i += 1;
      if (t === 'script' || t === 'style' || t === 'link' || t === 'meta') continue;
      walk(ch, `${p}>${t}:${i}`);
    }
  };
  walk(document.body, 'body');
  const de = document.documentElement;
  // a page the wizard makes has a fresh random id each run; a fixture's id (c13s-*) is kept
  const meta = { hash: location.hash.replace(/^#\/page\/(?!c13s-)[^/?]+/, '#/page/<made>'), theme: de.getAttribute('data-theme'), page: de.getAttribute('data-page'), cast: de.getAttribute('data-cast'), voice: de.getAttribute('data-voice'),
    zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') ?? null, vw: innerWidth, vh: innerHeight };
  return { meta, ref: refVals, styles, els };
}

function inPageSelectors() {
  const DYN = /:(hover|active|focus-visible|focus-within|focus|visited|target|link|any-link|-webkit-autofill|autofill|placeholder-shown|user-invalid|user-valid|popover-open|modal|fullscreen)(?![\w-])/g;
  const PSEUDO_EL = /::?(before|after|placeholder|selection|marker|backdrop|first-letter|first-line|file-selector-button|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g;
  const split = (s) => { const out = []; let depth = 0, cur = '';
    for (const ch of s) { if (ch === '(' || ch === '[') depth += 1; if (ch === ')' || ch === ']') depth -= 1; if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; }
    if (cur.trim()) out.push(cur.trim()); return out; };
  const res = {};
  const visit = (rules, ctx) => {
    for (const r of rules) {
      if (r.selectorText !== undefined && r.style) {
        for (const sel of split(r.selectorText)) {
          const key = ctx ? `${ctx} ${sel}` : sel;
          if (res[key] === 1) continue;
          let probe = sel.replace(PSEUDO_EL, '').replace(DYN, '').replace(/:(is|where|not|has)\(\s*\)/g, '').trim();
          if (!probe || /[>+~]$/.test(probe)) probe = (probe + ' *').trim();
          if (sel.includes('&')) { res[key] = res[key] ?? -1; continue; }
          try { res[key] = document.querySelector(probe) ? 1 : (res[key] ?? 0); } catch { res[key] = res[key] ?? -1; }
        }
      }
      const c = r.media ? `@media ${r.media.mediaText}` : r.conditionText !== undefined && r.constructor.name === 'CSSSupportsRule' ? `@supports ${r.conditionText}` : r.name !== undefined && r.constructor.name === 'CSSLayerBlockRule' ? `@layer ${r.name}` : null;
      if (r.cssRules && !(r.selectorText !== undefined)) visit(r.cssRules, c ? (ctx ? `${ctx} ${c}` : c) : ctx);
    }
  };
  for (const sh of document.styleSheets) { try { visit(sh.cssRules, ''); } catch { /* a sheet we may not read */ } }
  return res;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// One run: every chosen skin x screen. Styles are interned again across screens, so the file holds each distinct style once.
async function runOnce(app, { skins, screens, plant, label }) {
  const styles = []; const index = new Map();
  const glob = (o) => { const k = JSON.stringify(o); let id = index.get(k); if (id === undefined) { id = styles.length; styles.push(o); index.set(k, id); } return id; };
  const out = { label, built: null, screens: {}, failed: {}, styles };
  const sel = {};
  for (const skin of skins) for (const screen of screens) {
    const key = `${skin}/${screen}`;
    try {
      await freshDesk(app, skin);
      // the flash budget's own harness hook (store/flashBudget.ts): stamp each granted pulse, so the snapshot can wait one out
      await app.evalJs('window.__c13Flash = -1e9; window.__wzOnFlashGrant = () => { window.__c13Flash = performance.now(); };');
      await SCREENS[screen](app);
      if (plant) {
        await app.evalJs(`(() => { const s = document.createElement('style'); s.id = 'c13-plant'; s.textContent = ${J(PLANTS[plant])}; document.head.appendChild(s); })()`);
        await sleep(300);
      }
      let snap = null;
      for (let tries = 0; tries < 40; tries += 1) {
        snap = await app.evalJs(`(${inPageSnapshot.toString()})()`);
        if (!snap || !snap.busy) break;
        await sleep(250);
      }
      if (snap && snap.busy) throw new Error('a Signal Loss pulse every 1.2s for 10s: no quiet moment to read');
      if (!snap || !snap.els) throw new Error('the snapshot returned nothing');
      const ref = glob(snap.ref);
      out.screens[key] = { meta: snap.meta, ref, els: snap.els.map((e) => ({ ...e, s: glob(snap.styles[e.s]), ...(e.b !== undefined ? { b: glob(snap.styles[e.b]) } : {}), ...(e.a !== undefined ? { a: glob(snap.styles[e.a]) } : {}) })) };
      const m = await app.evalJs(`(${inPageSelectors.toString()})()`);
      for (const [k, v] of Object.entries(m || {})) { const cur = sel[k] || (sel[k] = { matched: 0, first: null, invalid: false }); if (v === 1) { cur.matched += 1; cur.first = cur.first || key; } if (v === -1) cur.invalid = true; }
      console.log(`  ${label} ${key}: ${snap.els.length} elements, ${snap.styles.length} styles`);
    } catch (e) { out.failed[key] = String(e && e.message || e).slice(0, 300); console.log(`  ${label} ${key}: FAILED -- ${out.failed[key]}`); }
  }
  return { snap: out, sel };
}

function writeRun(dir, { snap, sel }) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'snapshot.json'), JSON.stringify(snap));
  const keys = Object.keys(sel).sort();
  const unmatched = keys.filter((k) => !sel[k].matched && !sel[k].invalid);
  const unknown = keys.filter((k) => !sel[k].matched && sel[k].invalid);
  fs.writeFileSync(path.join(dir, 'selectors.json'), JSON.stringify({ screens: Object.keys(snap.screens).length, total: keys.length, matched: keys.length - unmatched.length - unknown.length, unmatched, unknown, perSelector: sel }, null, 1));
  console.log(`C13-STYLE SELECTORS: ${keys.length} selectors; ${keys.length - unmatched.length - unknown.length} matched on some screen; ${unmatched.length} matched nothing; ${unknown.length} could not be tested (nested or invalid)`);
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The compare. Elements are matched by DOM path; a style difference is listed per property, resolved against each run's own reference.
function compare(a, b) {
  const lines = [];
  const sty = (run, id, refId) => ({ ...run.styles[refId], ...run.styles[id] });
  const propDiff = (sa, sb) => { const out = []; for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) if (sa[k] !== sb[k]) out.push(`${k}: ${J(sa[k] ?? null)} -> ${J(sb[k] ?? null)}`); return out; };
  const keys = [...new Set([...Object.keys(a.screens), ...Object.keys(b.screens), ...Object.keys(a.failed), ...Object.keys(b.failed)])].sort();
  for (const key of keys) {
    const A = a.screens[key], B = b.screens[key];
    if (!A || !B) { lines.push(`${key} | screen | ${A ? 'present' : `missing (${a.failed[key] || 'not run'})`} -> ${B ? 'present' : `missing (${b.failed[key] || 'not run'})`}`); continue; }
    for (const k of new Set([...Object.keys(A.meta), ...Object.keys(B.meta)])) if (A.meta[k] !== B.meta[k]) lines.push(`${key} | meta | ${k}: ${J(A.meta[k])} -> ${J(B.meta[k])}`);
    const ma = new Map(A.els.map((e) => [e.p, e])), mb = new Map(B.els.map((e) => [e.p, e]));
    for (const [p, e] of ma) if (!mb.has(p)) lines.push(`${key} | ${p} (${e.t}.${e.c}) | element removed`);
    for (const [p, e] of mb) if (!ma.has(p)) lines.push(`${key} | ${p} (${e.t}.${e.c}) | element added`);
    for (const [p, ea] of ma) {
      const eb = mb.get(p); if (!eb) continue;
      const who = `${key} | ${p} (${eb.t}.${eb.c})`;
      if (ea.t !== eb.t) lines.push(`${who} | tag: ${ea.t} -> ${eb.t}`);
      if (ea.c !== eb.c) lines.push(`${who} | class: ${J(ea.c)} -> ${J(eb.c)}`);
      if (J(ea.r) !== J(eb.r)) lines.push(`${who} | rect [x,y,w,h]: ${J(ea.r)} -> ${J(eb.r)}`);
      for (const [f, name] of [['s', ''], ['b', '::before '], ['a', '::after ']]) {
        if (ea[f] === undefined && eb[f] === undefined) continue;
        if (ea[f] === undefined || eb[f] === undefined) { lines.push(`${who} | ${name || 'style '}${ea[f] === undefined ? 'appeared' : 'went away'}`); continue; }
        for (const d of propDiff(sty(a, ea[f], A.ref), sty(b, eb[f], B.ref))) lines.push(`${who} | ${name}${d}`);
      }
    }
  }
  return lines;
}
const readRun = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'snapshot.json'), 'utf8'));
function report(dir, lines, title) {
  if (dir) fs.writeFileSync(path.join(dir, 'compare.txt'), lines.join('\n') + '\n');
  const per = {}; for (const l of lines) { const k = l.split(' | ')[0]; per[k] = (per[k] || 0) + 1; }
  for (const l of lines.slice(0, 30)) console.log('  ' + l.slice(0, 400));
  if (lines.length > 30) console.log(`  ... ${lines.length - 30} more${dir ? ` in ${path.join(dir, 'compare.txt')}` : ''}`);
  console.log(lines.length ? `${title}: DIFFERENT (${lines.length} differences on ${Object.keys(per).length} screens: ${Object.entries(per).slice(0, 8).map(([k, n]) => `${k} ${n}`).join(', ')})` : `${title}: IDENTICAL`);
  return lines.length === 0;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
if (has('diff')) {
  const i = process.argv.indexOf('--diff'); const [da, db] = [process.argv[i + 1], process.argv[i + 2]];
  process.exit(report(null, compare(readRun(da), readRun(db)), 'C13-STYLE COMPARE') ? 0 : 1);
}

const { withHarness } = await import(pathToFileURL(path.join(here, '..', 'runtime-verify.mjs')).href);
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), `c13-style-${Date.now()}`)));
const SK = list(arg('skins', Object.keys(SKINS).join(',')));
const SC = list(arg('screens', Object.keys(SCREENS).join(',')));
const bad = [...SK.filter((s) => !SKINS[s]), ...SC.filter((s) => !SCREENS[s])];
if (bad.length) { console.error(`C13-STYLE: unknown skin/screen: ${bad.join(', ')}. Skins: ${Object.keys(SKINS).join(', ')}. Screens: ${Object.keys(SCREENS).join(', ')}`); process.exit(2); }
const plant = arg('plant');
if (plant && !PLANTS[plant]) { console.error(`C13-STYLE: --plant is ${Object.keys(PLANTS).join(' or ')}`); process.exit(2); }
console.log(`C13-STYLE START out=${OUT} skins=${SK.length} screens=${SC.length}${has('selftest') ? ' SELFTEST' : ''}${plant ? ` PLANT=${plant}` : ''}`);

let ok = true;
await withHarness(async (app) => {
  if (!has('selftest')) {
    const run = await runOnce(app, { skins: SK, screens: SC, plant, label: plant ? `plant-${plant}` : 'run' });
    writeRun(OUT, run);
    const failed = Object.keys(run.snap.failed).length;
    if (failed) { ok = false; console.log(`C13-STYLE: ${failed} screen(s) FAILED to reach their state`); }
    if (arg('compare')) ok = report(OUT, compare(readRun(path.resolve(arg('compare'))), run.snap), 'C13-STYLE COMPARE') && ok;
    return;
  }
  // THE PROOF (brief, step 5): A and B are two full runs on the same build; C and D plant one change each on the writing page in every skin.
  const A = await runOnce(app, { skins: SK, screens: SC, label: 'A' }); writeRun(path.join(OUT, 'A'), A);
  const B = await runOnce(app, { skins: SK, screens: SC, label: 'B' }); writeRun(path.join(OUT, 'B'), B);
  const failed = Object.keys(A.snap.failed).length + Object.keys(B.snap.failed).length;
  const same = report(path.join(OUT, 'B'), compare(A.snap, B.snap), 'C13-STYLE SELFTEST 1 (two runs, same build)');
  const sub = (snap) => ({ ...snap, screens: Object.fromEntries(Object.entries(snap.screens).filter(([k]) => k.endsWith('/page'))), failed: {} });
  const C = await runOnce(app, { skins: SK, screens: ['page'], plant: 'padding', label: 'C' }); writeRun(path.join(OUT, 'C'), C);
  const lc = compare(sub(A.snap), C.snap); report(path.join(OUT, 'C'), lc, 'C13-STYLE SELFTEST 2 (planted 1px padding)');
  const padOk = SK.every((s) => lc.some((l) => l.startsWith(`${s}/page |`) && l.includes(PLANT_CLASS) && / \| padding-left: /.test(l)));
  const D = await runOnce(app, { skins: SK, screens: ['page'], plant: 'rect', label: 'D' }); writeRun(path.join(OUT, 'D'), D);
  const ld = compare(sub(A.snap), D.snap); report(path.join(OUT, 'D'), ld, 'C13-STYLE SELFTEST 3 (planted page move)');
  const rectOk = SK.every((s) => ld.some((l) => l.startsWith(`${s}/page |`) && l.includes('forward-only-editor') && l.includes('| rect ')));
  console.log(`C13-STYLE SELFTEST: identical=${same} padding-reported=${padOk} page-rect-reported=${rectOk} failed-screens=${failed}`);
  ok = same && padOk && rectOk && failed === 0;
  console.log(ok ? 'C13-STYLE SELFTEST: PASS' : 'C13-STYLE SELFTEST: FAIL');
}, {});
process.exit(ok ? 0 : 1);
