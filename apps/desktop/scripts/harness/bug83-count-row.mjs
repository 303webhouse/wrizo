// BUG #83 - ARBOR'S COUNT-ROW LABEL (Fable's GO, Nov 11, 8:00 pm; the Wrizors named the colour). The label under the page ("0 words", .mode-pmeta's own text) drew --text-low #80766A on
// live Arbor: 3.82:1 against the desk under the page, under the 4.5:1 text floor. Arbor now draws it #9C9081 (5.46:1 on #201B17, 5.39:1 on #221C17); the token is untouched.
//   ROW-COLOUR  the label's computed colour is #9C9081 on live Arbor, in both Page tones (source-free)
//   ROW-PIXELS  read from the DRAWN pixels of the label's own box (a 2x screenshot clipped to it): the desk it sits on (the box's commonest colour), the glyph's fullest pixel (the one
//               farthest from the desk) = #9C9081 within 12 a channel, and the computed colour stands 4.5:1 or better against the drawn desk
//   ROW-LIVE    the fixture is the live Arbor build: theme plateau, no ?arbor2 flag, the Page tone as asked, the label is the page's count row (framed or not, printed)
//   ROW-SCOPE   the colour sits under [data-theme='plateau'] only: Flux and Machina still draw their own --text-low there (a probe row read live), and the source has one such rule, scoped
//   MUT-ROW-OLD the OLD colour (#80766A, forced) turns the colour and the pixel readers RED in both tones        MUT-ROW-LAW the readers go RED on synthetic bad values
// Run: node scripts/harness/bug83-count-row.mjs   (from apps/desktop; a box turn or Actions: it drives a browser)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HERE = path.dirname(fileURLToPath(import.meta.url));
const TARGET = '#9C9081', OLD = '#80766A';
const LABEL = '.mode-pmeta > span:first-child';
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const reads = {};
const scope = {};
const fresh = async (app, theme, tone) => {
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme',${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' }));`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash', timeout: 15000 }).catch(() => {});
};
await withHarness(async (app) => {
  for (const tone of ['dark', 'light']) {
    await app.emulateDpr(2, 1366, 900);
    await fresh(app, 'plateau', tone);
    const id = `b83-page-${tone}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'kettle', createdAt: new Date().toISOString(), origin: 'journal', source: 'page' })})`);
    await sleep(450);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor(`!!document.querySelector(${JSON.stringify(LABEL)})`, { label: 'count row', timeout: 12000 });
    await sleep(1200);
    const read = async (label) => {
      const info = await app.evalJs(`(() => { const s = document.querySelector(${JSON.stringify(LABEL)}); if (!s) return null; const r = s.getBoundingClientRect(); const root = document.documentElement;
        return { framed: !!s.closest('.desk-frame-instrument'), text: s.textContent, color: getComputedStyle(s).color, l: r.left, t: r.top, w: r.width, h: r.height, theme: root.getAttribute('data-theme'), tone: root.getAttribute('data-page'), arbor2: root.hasAttribute('data-arbor2'), search: location.search }; })()`);
      if (!info || !(info.w > 4 && info.h > 4)) { reads[`${tone}-${label}`] = { error: 'no label box', info }; return; }
      const clip = { x: Math.max(0, Math.floor(info.l) - 3), y: Math.max(0, Math.floor(info.t) - 3), width: Math.ceil(info.w) + 6, height: Math.ceil(info.h) + 6, scale: 1 };
      const data = (await app.cdp('Page.captureScreenshot', { format: 'png', clip })).data;
      const px = await app.evalJs(`(async () => { const img = new Image(); img.src = 'data:image/png;base64,${data}'; await img.decode(); const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const D = x.getImageData(0, 0, c.width, c.height).data;
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const lum = (p) => 0.2126 * lin(p[0]) + 0.7152 * lin(p[1]) + 0.0722 * lin(p[2]); const cr = (p, q) => (Math.max(lum(p), lum(q)) + 0.05) / (Math.min(lum(p), lum(q)) + 0.05);
        // the desk = the box's commonest colour (the glyphs are sparse in their own box); the glyph's fullest pixel = the one farthest in contrast from the desk (at 2x a stem is 2 px wide, so it is fully covered)
        const count = new Map(); for (let i = 0; i < D.length; i += 4) { const k = D[i] + ',' + D[i + 1] + ',' + D[i + 2]; count.set(k, (count.get(k) || 0) + 1); }
        const deskKey = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0]; const desk = deskKey.split(',').map(Number);
        let peak = desk, best = 1; for (let i = 0; i < D.length; i += 4) { const p = [D[i], D[i + 1], D[i + 2]]; const k = cr(p, desk); if (k > best) { best = k; peak = p; } }
        const m = /(\\d+(?:\\.\\d+)?),\\s*(\\d+(?:\\.\\d+)?),\\s*(\\d+(?:\\.\\d+)?)/.exec(${JSON.stringify(info.color)}); const comp = m ? [+m[1], +m[2], +m[3]] : null;
        return { w: c.width, h: c.height, desk, deskShare: +(count.get(deskKey) / (D.length / 4)).toFixed(2), peak, peakContrast: +best.toFixed(2), computedContrast: comp ? +cr(comp, desk).toFixed(2) : null }; })()`);
      reads[`${tone}-${label}`] = { ...info, px };
    };
    await read('now');
    // the OLD colour as a mutant: --text-low #80766A, forced over the fix
    await app.evalJs(`(() => { const s = document.createElement('style'); s.id = 'mut-old'; s.textContent = ':root .mode-pmeta{ color:${OLD} !important; }'; document.head.appendChild(s); })()`);
    await sleep(200); await read('old');
    await app.evalJs("document.getElementById('mut-old').remove()"); await sleep(150);
  }
  // ROW-SCOPE live: under Flux and Machina a probe row (the same classes, in the body) still draws that theme's own --text-low, never the Arbor colour
  for (const theme of ['flux', 'machina']) {
    await app.emulateDpr(1, 1366, 900);
    await fresh(app, theme, 'dark');
    scope[theme] = await app.evalJs(`(() => { const d = document.createElement('div'); d.className = 'mode-pmeta'; d.innerHTML = '<span>0 words</span>'; document.body.appendChild(d); const c = getComputedStyle(d.firstChild).color;
      const t = document.createElement('div'); t.style.color = 'var(--text-low)'; document.body.appendChild(t); const tl = getComputedStyle(t).color; d.remove(); t.remove(); return { theme: document.documentElement.getAttribute('data-theme'), color: c, textLow: tl }; })()`);
  }
}).catch((e) => { ok('the run reached its end', false, String((e && e.stack) || e).split('\n').slice(0, 3).join(' | ')); });

// ---- the checks ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const nums = (s) => (/(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)/.exec(s || '') || []).slice(1).map(Number);
const near = (a, b, tol) => !!a && !!b && a.length === 3 && b.length === 3 && a.every((v, i) => Math.abs(v - b[i]) <= tol);
const colourOk = (r) => !!r && !!r.color && near(nums(r.color), rgb(TARGET), 1);
const pixelsOk = (r) => !!r && !!r.px && near(r.px.peak, rgb(TARGET), 12) && r.px.computedContrast >= 4.5 && r.px.deskShare >= 0.25;
const TONES = ['dark', 'light'];
const cell = (t, s = 'now') => reads[`${t}-${s}`];
const show = (t, s = 'now') => { const r = cell(t, s); return r && r.px ? `${t}${s === 'now' ? '' : ' ' + s}: "${r.text}" ${r.color} drew rgb(${r.px.peak}) on desk rgb(${r.px.desk}) = ${r.px.computedContrast}:1 (peak ${r.px.peakContrast}:1)` : `${t} ${s}: no reading`; };
console.log('ROW readings: ' + TONES.map((t) => show(t)).join(' | '));
console.log('ROW mutant (old colour): ' + TONES.map((t) => show(t, 'old')).join(' | '));
console.log('ROW scope: ' + JSON.stringify(scope));
for (const t of TONES) {
  ok(`ROW-COLOUR ${t}: the count-row label's computed colour is ${TARGET}`, colourOk(cell(t)), JSON.stringify(cell(t) && { color: cell(t).color, text: cell(t).text }));
  ok(`ROW-PIXELS ${t}: read from the drawn pixels of its own box, the glyph drew ${TARGET} (within 12 a channel) and stands 4.5:1 or better on the drawn desk (printed: ${cell(t) && cell(t).px ? cell(t).px.computedContrast + ':1' : 'n/a'})`, pixelsOk(cell(t)), JSON.stringify(cell(t)));
}
ok('ROW-LIVE the fixture was the live Arbor build: theme plateau, no ?arbor2 flag, the Page tone as asked, the label is the count row ("<n> word(s)")', TONES.every((t) => { const r = cell(t); return r && r.theme === 'plateau' && r.arbor2 === false && !/arbor2/.test(r.search || '') && r.tone === t && /^\d+ words?$/.test((r.text || '').trim()); }), JSON.stringify(TONES.map((t) => cell(t) && { theme: cell(t).theme, tone: cell(t).tone, arbor2: cell(t).arbor2, text: cell(t).text, framed: cell(t).framed })));
const CSS = fs.readFileSync(path.join(HERE, '..', '..', 'src', 'styles', '12-studio-chrome.css'), 'utf8');
const rules = CSS.split('\n').filter((l) => /\.mode-pmeta\b/.test(l) && /9C9081/i.test(l));
ok(`ROW-SCOPE the colour lives under [data-theme='plateau'] only: ${rules.length} rule, scoped; Flux and Machina draw their own --text-low there`, rules.length === 1 && /^:root\[data-theme='plateau'\] \.mode-pmeta\{/.test(rules[0].trim())
  && ['flux', 'machina'].every((th) => { const s = scope[th]; return s && s.theme === th && s.color === s.textLow && !near(nums(s.color), rgb(TARGET), 1); }), JSON.stringify({ rules: rules.map((l) => l.slice(0, 70)), scope }));
ok(`MUT-ROW-OLD the colour and pixel readers go RED on the OLD colour (${OLD}, forced) in both tones`, TONES.every((t) => { const r = cell(t, 'old'); return r && r.px && !colourOk(r) && !pixelsOk(r); }), JSON.stringify(TONES.map((t) => show(t, 'old'))));
ok('MUT-ROW-LAW the readers go RED on synthetic bad values: a glyph under 4.5:1, a wrong colour, a box that is not mostly desk; and GREEN on the good one',
  !pixelsOk({ px: { peak: rgb(TARGET), computedContrast: 3.8, deskShare: 0.8 } }) && !pixelsOk({ px: { peak: rgb(OLD), computedContrast: 5.4, deskShare: 0.8 } }) && !pixelsOk({ px: { peak: rgb(TARGET), computedContrast: 5.4, deskShare: 0.1 } })
  && !colourOk({ color: 'rgb(128, 118, 106)' }) && colourOk({ color: 'rgb(156, 144, 129)' }) && pixelsOk({ px: { peak: rgb(TARGET), computedContrast: 5.46, deskShare: 0.8 } }), '');
const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nBUG83-COUNT-ROW VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nBUG83-COUNT-ROW VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
