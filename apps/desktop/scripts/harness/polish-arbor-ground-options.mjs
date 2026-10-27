// POLISH — ARBOR'S ROOM COLOUR: OPTIONS TO LOOK AT (not a verdict check; a capture).
//
// Nick (Oct 27): "I'm not sure I'm happy with the current dark brown background in Arbor ... a few other options ... that still work well with
// the brass and olive green accents ... an even darker espresso, or something a bit darker but with more orange to enrich the colour."
//
// Each option re-points Arbor's own room tokens LIVE (a <style> on :root[data-theme='plateau'], nothing built, nothing saved), then photographs
// the real writing screen and the real home screen. It also MEASURES, for each option, the contrast of every word and mark that sits on the room
// (cream text, the two quieter text tiers, olive, brass, the bronze rule) against the room and the hover tile.
//
// Run: WS_BOX_TURN=<token> node scripts/harness/polish-arbor-ground-options.mjs   (from apps/desktop, dist-web freshly built)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', '..', '..', 'docs', 'evidence', 'polish-arbor-ground');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ink-950 = the deepest ground (splash, legacy rail), ink-900 = THE ROOM (desk ground, chrome), ink-800 = raised / hover tile,
// border / strong = the 1 px lines. `lamp` = the four stops of the lamplight pool behind the home screen.
const OPTIONS = {
  '0-current':        { label: 'Now',                  t: { i950: '#110600', i900: '#1F1A16', i800: '#2A241E', b: '#332C25', bs: '#453B31', lamp: ['#36240F', '#251810', '#170F0A', '#100B07'] } },
  'A-deep-espresso':  { label: 'A  Deep espresso',     t: { i950: '#0A0503', i900: '#150F0B', i800: '#1F1711', b: '#2A2018', bs: '#3A2D22', lamp: ['#2A1A0C', '#1C1209', '#110B07', '#0B0704'] } },
  'B-roasted-amber':  { label: 'B  Roasted amber',     t: { i950: '#130700', i900: '#221208', i800: '#2D190B', b: '#3A2412', bs: '#55371C', lamp: ['#4A2A0E', '#301A0A', '#1D1006', '#130A04'] } },
  'C-mahogany':       { label: 'C  Mahogany',          t: { i950: '#120603', i900: '#21120D', i800: '#2C1A13', b: '#382319', bs: '#52372A', lamp: ['#40200F', '#28150C', '#190D08', '#110805'] } },
  'D-ember-black':    { label: 'D  Ember black',       t: { i950: '#0C0500', i900: '#170C05', i800: '#21130A', b: '#2E1B0E', bs: '#47301A', lamp: ['#3A2008', '#24140A', '#150C05', '#0F0803'] } },
};

const css = (t) => `:root[data-theme='plateau']{ --ink-950:${t.i950}; --ink-900:${t.i900}; --ink-800:${t.i800}; --ink-border:${t.b}; --ink-border-strong:${t.bs};
  --lamp-glow: radial-gradient(135% 95% at 50% -8%, ${t.lamp[0]} 0%, ${t.lamp[1]} 38%, ${t.lamp[2]} 70%, ${t.lamp[3]} 100%); }`;

const apply = (app, t) => app.evalJs(`(() => { let s = document.getElementById('polish-opt'); if (!s) { s = document.createElement('style'); s.id = 'polish-opt'; document.head.appendChild(s); } s.textContent = ${JSON.stringify(css(t))}; return true; })()`);
const clear = (app) => app.evalJs(`(() => { const s = document.getElementById('polish-opt'); if (s) s.remove(); return true; })()`);
const snap = async (app, name) => {
  const b64 = (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(b64, 'base64'));
};

// WCAG ratio, in node, from hex.
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = (h) => { const n = parseInt(h.slice(1), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const ratio = (a, b) => { const x = L(a), y = L(b); return +((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2); };
// the words and marks that live on the room (index.css :root): text-hi, text-mid, text-low, olive (--accent-rest), brass, bronze rule.
const INKS = { 'cream text (--text-hi)': '#EDE6DA', 'quiet text (--text-mid)': '#B5A998', 'quietest text (--text-low)': '#80766A', 'olive': '#96A05A', 'brass': '#FF9800', 'bronze rule': '#8F7A4C' };

const table = {};
for (const [k, o] of Object.entries(OPTIONS)) {
  table[k] = { label: o.label, room: o.t.i900, tile: o.t.i800, onRoom: {}, onHoverTile: {} };
  for (const [n, hex] of Object.entries(INKS)) { table[k].onRoom[n] = ratio(hex, o.t.i900); table[k].onHoverTile[n] = ratio(hex, o.t.i800); }
}
fs.writeFileSync(path.join(OUT, 'contrast.json'), JSON.stringify(table, null, 2));

await withHarness(async (app) => {
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  // --- the writing screen
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'editor' });
  await splashGone(); await sleep(700);
  // open the Themes panel so a panel (olive/brass accents, cards) shows too? keep the plain writing screen: the room is what is being judged.
  for (const [k, o] of Object.entries(OPTIONS)) { await apply(app, o.t); await sleep(350); await snap(app, `write-${k}`); }
  await clear(app);

  // --- the comparison sheet: every option's real screenshot, plus its palette and measured contrast, on ONE page
  const b64 = (f) => fs.readFileSync(path.join(OUT, f)).toString('base64');
  const chip = (hex, txt, fg) => `<span style="display:inline-block;background:${hex};color:${fg};padding:3px 8px;margin:0 4px 4px 0;font:12px/1.2 sans-serif;border:1px solid #5a4a38">${txt}</span>`;
  const cells = Object.entries(OPTIONS).map(([k, o]) => {
    const r = table[k];
    return `<div style="width:900px"><div style="color:#EDE6DA;font:600 20px sans-serif;margin:0 0 6px">${o.label}</div>
      <img src="data:image/png;base64,${b64('write-' + k + '.png')}" style="width:900px;display:block;border:1px solid #333">
      <div style="margin-top:6px">${chip(o.t.i900, 'room ' + o.t.i900, '#EDE6DA')}${chip(o.t.i800, 'tile ' + o.t.i800, '#EDE6DA')}${chip(o.t.i950, 'deepest ' + o.t.i950, '#EDE6DA')}</div>
      <div style="margin-top:2px">${chip(o.t.i900, 'cream ' + r.onRoom['cream text (--text-hi)'] + ':1', '#EDE6DA')}${chip(o.t.i900, 'olive ' + r.onRoom['olive'] + ':1', '#96A05A')}${chip(o.t.i900, 'brass ' + r.onRoom['brass'] + ':1', '#FF9800')}${chip(o.t.i900, 'quiet ' + r.onRoom['quiet text (--text-mid)'] + ':1', '#B5A998')}${chip(o.t.i900, 'quietest ' + r.onRoom['quietest text (--text-low)'] + ':1', '#80766A')}</div></div>`;
  });
  const html = `<html><body style="margin:0;background:#000;padding:20px;width:2800px;display:grid;grid-template-columns:repeat(3,900px);gap:28px 30px">${cells.join('')}</body></html>`;
  fs.writeFileSync(path.join(OUT, 'sheet.html'), html);
  await app.emulateDpr(1, 2860, 1560);
  await app.cdp('Page.navigate', { url: 'file:///' + path.join(OUT, 'sheet.html').replace(/\\/g, '/') });
  await sleep(1500);
  await snap(app, 'compare');
  return [];
}, { label: 'polish-arbor-ground-options' });

console.log(JSON.stringify(table, null, 1)); // eslint-disable-line no-console
