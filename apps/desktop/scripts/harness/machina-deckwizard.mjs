// MACHINA'S DECK WIZARD (Nick, Oct 24: under Machina, Board -> Presets -> "CHOOSE A DECK" was a tall cream panel with near-invisible pale text). The wizard is portalled to <body>, so it reads :root tokens; Machina sets
// the card family (--card-stock, --ink-on-card) only inside `.board-canvas`, so at :root they fell through to Arbor's CREAM stock while --ink-on-paper is the dark page's PALE ink - pale on cream. The fix is Machina's own dress,
// on theme tokens only: chrome surface, a 1px hairline, square, no shadow, Plex; names >= 7:1, labels >= 4.5:1; COOL + NEUTRAL, dark + light page.
//   PART 1 (browserless, no grant)   the stylesheet's rules, read as text, with mutants
//   PART 2 (a box turn)              the real wizard, computed: not cream, the chrome surface, square, no shadow, a 1px hairline, Plex faces, the contrast floors on every text, in the library step AND a question step
//
// Run (repo root):  node apps/desktop/scripts/harness/machina-deckwizard.mjs        BROWSERLESS_ONLY=1 runs part 1 alone;  MDW_FRAMES=<dir> saves frames
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, '..', '..', 'src');
const css = readFileSync(join(SRC, 'index.css'), 'utf8').replace(/\r\n/g, '\n');
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? '  ' + String(detail).slice(0, 260) : '')); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

// ---------------------------------------------------------------- PART 1 - the rules
const rules = (text) => [...strip(text).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim().replace(/\s+/g, ' '), m[2].trim()]);
const mw = (text) => rules(text).filter(([sel]) => sel.split(',').every((s) => s.trim().startsWith("[data-theme='machina'] .deck-wizard") || s.trim().startsWith("[data-theme='machina'] .deck-wizard-dialog")));
const find = (text, sel) => (mw(text).find(([s]) => s.split(',').map((x) => x.trim()).includes(sel)) || [null, ''])[1];
const dressOk = (text) => {
  const dlg = find(text, "[data-theme='machina'] .deck-wizard-dialog");
  const eyebrow = find(text, "[data-theme='machina'] .deck-wizard-eyebrow");
  const row = find(text, "[data-theme='machina'] .deck-wizard-deck-row");
  const head = find(text, "[data-theme='machina'] .deck-wizard-room-heading");
  const q = find(text, "[data-theme='machina'] .deck-wizard-question");
  const brass = find(text, "[data-theme='machina'] .deck-wizard-dialog .btn-brass");
  return {
    surface: /background:\s*var\(--chrome-surface\)/.test(dlg) && /color:\s*var\(--text-hi\)/.test(dlg),
    hairlineSquareFlat: /border:\s*1px solid var\(--ink-border-strong\)/.test(dlg) && /box-shadow:\s*none/.test(dlg) && /border-radius:\s*0/.test(dlg),
    plex: /font-family:\s*var\(--font-contentLabel\)/.test(dlg) && /font-family:\s*var\(--font-chromeLabel\)/.test(eyebrow) && /font-family:\s*var\(--font-chromeLabel\)/.test(head),
    names: /color:\s*var\(--text-hi\)/.test(row) && /color:\s*var\(--text-hi\)/.test(q),
    labels: /color:\s*var\(--text-mid\)/.test(head),
    noTextAccent: !/color:\s*var\(--(accent-rest|orange|choice|line-active)\)/.test([dlg, eyebrow, row, head, q, brass].join(';')),
  };
};
const real = dressOk(css);
ok('M1: Machina\'s wizard sits on the CHROME surface with the theme\'s own text (not the cream card stock the :root fallthrough gave it)', real.surface, JSON.stringify(real));
ok('M2: a 1px hairline, square, NO shadow', real.hairlineSquareFlat, '');
ok('M3: Plex - the small labels in the chrome-label face, the names in the content-label face', real.plex, '');
ok('M4: names (deck titles, the question) are --text-hi and labels (room headings) --text-mid; the carrier colour (--accent-rest) is a bar / border, never a text colour', real.names && real.labels && real.noTextAccent, '');
{
  const land = (from, to) => { const next = css.replace(from, to); return next === css ? null : next; };
  const noSurface = land("[data-theme='machina'] .deck-wizard-dialog{ background:var(--chrome-surface);", "[data-theme='machina'] .deck-wizard-dialog{");
  ok('MUTANT: the surface rule dropped (the cream card stock returns) - M1 must go RED (the mutation LANDED)', noSurface !== null && !dressOk(noSurface).surface && real.surface, '');
  const shadow = land("border:1px solid var(--ink-border-strong); box-shadow:none; border-radius:0; font-family:var(--font-contentLabel); }", "border:1px solid var(--ink-border-strong); box-shadow:0 14px 44px rgba(0,0,0,.5); border-radius:0; font-family:var(--font-contentLabel); }");
  ok('MUTANT: Arbor\'s drop shadow back on the dialog - M2 must go RED (the mutation LANDED)', shadow !== null && !dressOk(shadow).hairlineSquareFlat && real.hairlineSquareFlat, '');
  const accentText = land("[data-theme='machina'] .deck-wizard-deck-row{ font-family:var(--font-contentLabel); font-size:14px; color:var(--text-hi);", "[data-theme='machina'] .deck-wizard-deck-row{ font-family:var(--font-contentLabel); font-size:14px; color:var(--accent-rest);");
  ok('MUTANT: a deck row coloured with the carrier colour (steel / orange TEXT) - M4 must go RED (the mutation LANDED)', accentText !== null && !dressOk(accentText).names && !dressOk(accentText).noTextAccent && real.names, '');
}
ok('M5: nothing outside Machina changed - every added rule is scoped under [data-theme=\'machina\'] (the Arbor / Flux wizard rules are untouched)', rules(css).filter(([sel]) => /deck-wizard/.test(sel) && !sel.startsWith("[data-theme='machina']")).length >= 18, '');

// ---------------------------------------------------------------- PART 2 - the real wizard (a box turn)
if (!process.env.BROWSERLESS_ONLY) {
  const { withHarness } = await import('../runtime-verify.mjs');
  const FRAMES = process.env.MDW_FRAMES || null;
  const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const SCAN = `(() => { const d = document.querySelector('.deck-wizard-dialog'); if (!d) return null;
    const rgb = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c || ''); if (!m) return null; const v = m[1].split(',').map((x) => parseFloat(x)); return { c: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 }; };
    const lum = ([r, g, b]) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
    const ground = (el) => { for (let n = el; n; n = n.parentElement) { const bg = rgb(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.5) return bg.c; } return [0, 0, 0]; };
    const NAMES = '.deck-wizard-deck-row, .deck-wizard-question, .deck-wizard-option-btn, .deck-wizard-page-btn';
    const rows = [];
    for (const el of d.querySelectorAll('*')) { const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (!own) continue; const col = rgb(getComputedStyle(el).color); if (!col) continue;
      rows.push({ cls: String(el.className || el.tagName).slice(0, 40), kind: el.matches(NAMES) ? 'name' : 'label', ratio: Math.round(ratio(col.c, ground(el)) * 100) / 100 }); }
    const cs = getComputedStyle(d); const bg = rgb(cs.backgroundColor).c;
    const probe = document.createElement('i'); probe.style.background = 'var(--chrome-surface)'; document.body.appendChild(probe); const chrome = rgb(getComputedStyle(probe).backgroundColor).c; probe.remove();
    const eyebrow = d.querySelector('.deck-wizard-eyebrow'); const row = d.querySelector('.deck-wizard-deck-row, .deck-wizard-option-btn');
    return { bg, chrome, lum: Math.round(lum(bg) * 1000) / 1000, radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.borderTopWidth + ' ' + cs.borderTopStyle, borderL: cs.borderLeftWidth,
      eyebrowFont: eyebrow ? getComputedStyle(eyebrow).fontFamily : null, rowFont: row ? getComputedStyle(row).fontFamily : null,
      names: rows.filter((r) => r.kind === 'name'), labels: rows.filter((r) => r.kind === 'label'),
      minName: rows.filter((r) => r.kind === 'name').reduce((m, r) => Math.min(m, r.ratio), 99), minLabel: rows.filter((r) => r.kind === 'label').reduce((m, r) => Math.min(m, r.ratio), 99) }; })()`;
  const boot = async (app, { cast, page }) => {
    await app.emulateDpr(1, 1366, 768);
    await app.goto('/');
    await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina'); localStorage.setItem('wrizo-machina-cast','${cast}');`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
    try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
    await app.evalJs(`window.wrizoTheme.set('machina'); window.wrizoCast && window.wrizoCast.set('${cast}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
    await sleep(500);
    // the Boards door's own address: an unborn board with the deck wizard open on its library (an unknown deck id opens the list)
    await app.evalJs("location.hash = '#/page/new?kind=board&deck=library'");
    await app.waitFor("!!document.querySelector('.deck-wizard-dialog')", { label: 'the deck wizard', timeout: 12000 }).catch(() => {});
    await sleep(1400);   // Machina's faces load with the theme
  };
  await withHarness(async (app) => {
    for (const cast of ['cool', 'neutral']) {
      for (const page of ['dark', 'light']) {
        await boot(app, { cast, page });
        const lib = await app.evalJs(SCAN);
        const label = `${cast}/${page}`;
        ok(`W1 [${label}, library]: not the cream card - the dialog is the theme's CHROME surface (computed ${lib ? lib.bg.join(',') : '?'}), dark (luminance ${lib ? lib.lum : '?'})`, !!lib && lib.bg.join() === lib.chrome.join() && lib.lum < 0.1, JSON.stringify(lib && { bg: lib.bg, chrome: lib.chrome, lum: lib.lum }));
        ok(`W2 [${label}, library]: square, no shadow, a 1px hairline on every side`, !!lib && parseFloat(lib.radius) === 0 && lib.shadow === 'none' && lib.border === '1px solid' && lib.borderL === '1px', JSON.stringify(lib && { radius: lib.radius, shadow: lib.shadow, border: lib.border, borderL: lib.borderL }));
        // ORIGINAL (this file's own live W3, pre Machina Forms; parked verbatim): ok(`W3 [${label}, library]: Plex - the eyebrow in IBM Plex Mono, the deck names in IBM Plex Sans`, !!lib && /IBM Plex Mono/.test(lib.eyebrowFont || '') && /IBM Plex Sans/.test(lib.rowFont || ''), JSON.stringify(lib && { eyebrow: lib.eyebrowFont, row: lib.rowFont }));
        // ORIGINAL W4 (parked verbatim): ok(`W4 [${label}, library]: names >= 7:1 (min ${lib ? lib.minName : '?'}) and labels >= 4.5:1 (min ${lib ? lib.minLabel : '?'}) - ${lib ? lib.names.length : 0} names and ${lib ? lib.labels.length : 0} labels measured`, !!lib && lib.names.length >= 10 && lib.labels.length >= 3 && lib.minName >= 7 && lib.minLabel >= 4.5, JSON.stringify(lib && { names: lib.names.slice(0, 2), labels: lib.labels }));
        // SUPERSEDED (train #7 red 8, Oct 25 - Machina Forms): under Machina the deck LIBRARY step is the Forms panel (.forms-row rows), so the .deck-wizard-deck-row nodes the originals read do not exist there (row: null x12 on the pair:
        // W3, W4 and W5 at four cast / page combinations). The dress claims are unchanged and are re-asserted below on the Forms rows (machina-forms.mjs holds the panel's own full set); the originals are recorded by the PARKED RECORD below.
        ok(`W3 [${label}, library - Forms successor]: Plex - the eyebrow in IBM Plex Mono, the deck names (.forms-name) in IBM Plex Sans`, !!lib && /IBM Plex Mono/.test(lib.eyebrowFont || '') && /IBM Plex Sans/.test(lib.formsFont || ''), JSON.stringify(lib && { eyebrow: lib.eyebrowFont, forms: lib.formsFont }));
        ok(`W4 [${label}, library - Forms successor]: names >= 7:1 (min ${lib ? lib.minName : '?'}) and labels >= 4.5:1 (min ${lib ? lib.minLabel : '?'}) - ${lib ? lib.names.length : 0} names and ${lib ? lib.labels.length : 0} labels measured`, !!lib && lib.names.length >= 12 && lib.labels.length >= 8 && lib.minName >= 7 && lib.minLabel >= 4.5, JSON.stringify(lib && { names: lib.names.slice(0, 2), labels: lib.labels }));
        ok(`W3/W4 [${label}, PARKED RECORD]: the library the originals read is gone under Machina - zero .deck-wizard-deck-row nodes (${lib ? lib.deckRows : '?'}), the Forms rows in their place (${lib ? lib.formsRows : '?'} >= 12)`, !!lib && lib.deckRows === 0 && lib.formsRows >= 12, JSON.stringify(lib && { deckRows: lib.deckRows, formsRows: lib.formsRows }));
        if (page === 'dark') await frame(app, `library-${cast}`);
        // a question step: the first deck row
        await app.evalJs("document.querySelector('.forms-row[data-deck-id=\"three-act\"]')?.click()");
        await sleep(500);
        const qs = await app.evalJs(SCAN);
        // ORIGINAL (the click that opens the question step; parked verbatim): await app.evalJs("document.querySelector('.deck-wizard-deck-row[data-deck-id=\"three-act\"]')?.click()");
        // ORIGINAL W5 (parked verbatim): ok(`W5 [${label}, question]: the question step is dressed the same - chrome surface, names >= 7:1 (min ${qs ? qs.minName : '?'}), labels >= 4.5:1 (min ${qs ? qs.minLabel : '?'})`, !!qs && qs.bg.join() === qs.chrome.join() && qs.names.length >= 3 && qs.minName >= 7 && qs.minLabel >= 4.5, JSON.stringify(qs && { names: qs.names, labels: qs.labels }));
        // SUPERSEDED (train #7 red 8): the question step is reached from a Forms row now; successor below (same claim, the same SCAN).
        ok(`W5 [${label}, question - Forms successor]: the question step is dressed the same - chrome surface, names >= 7:1 (min ${qs ? qs.minName : '?'}), labels >= 4.5:1 (min ${qs ? qs.minLabel : '?'})`, !!qs && qs.bg.join() === qs.chrome.join() && qs.names.length >= 3 && qs.minName >= 7 && qs.minLabel >= 4.5, JSON.stringify(qs && { names: qs.names, labels: qs.labels }));
        if (page === 'dark') await frame(app, `question-${cast}`);
      }
    }
    // Arbor control: the wizard under Arbor is UNCHANGED (still its own cream card)
    await app.goto('/');   // off the wizard route first (the hash survives a reload), then switch the theme and reload onto the Desk
    await app.evalJs("localStorage.setItem('wrizo-theme','plateau')"); await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk (Arbor)' });
    await app.evalJs("location.hash = '#/page/new?kind=board&deck=library'");
    await app.waitFor("!!document.querySelector('.deck-wizard-dialog')", { label: 'the deck wizard (Arbor)', timeout: 12000 }).catch(() => {});
    await sleep(600);
    const arbor = await app.evalJs("(() => { const d = document.querySelector('.deck-wizard-dialog'); return d ? { bg: getComputedStyle(d).backgroundColor, shadow: getComputedStyle(d).boxShadow } : null; })()");
    ok('W6 [Arbor control]: the wizard under Arbor keeps its cream card and its shadow (the Machina rules did not leak)', !!arbor && arbor.bg === 'rgb(251, 246, 234)' && arbor.shadow !== 'none', JSON.stringify(arbor));
  });
} else console.log('(BROWSERLESS_ONLY: part 2 skipped - the live checks need a box turn)');

const bad = checks.filter((c) => !c.pass).length;
console.log(bad === 0 ? `\nMACHINA-DECKWIZARD VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-DECKWIZARD VERIFY: FAIL - ${bad}/${checks.length} failed`);
process.exit(bad === 0 ? 0 : 1);
