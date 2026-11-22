// THE REORG'S UPLINK (THE PUBLISH VIEW) IN FLUX, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 4:07 pm: Flux piece 2 carries on; the Wrizors' Flux Back menu pass 1, REAL 1, 2 and 3: no browser-white buttons or ticks, the bar keeps its one row, no brass box: the view is "the whole Doc in one read-only scroll, in place of the page view, in node dress", claude/wrizors/flux-reorg-spec.md section 9).
// No browser, no box: styles/24-reorg-flux-uplink.css is read as text, against 23-reorg-top.css's Machina rules; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED   every rule is under :root[data-flux3][data-theme='flux'] (the Flux REDESIGN)
//   COVER    every Machina rule that dresses the publishing sheet (.reorg-pub*) has a Flux twin: nothing is left to the browser's raw buttons and ticks
//   SHEET    the sheet lies exactly over the page (absolute, inset 0, the page's own fill and ink) and shows no box of its own: no outline, no border (the orange box was the browser's focus ring)
//   BUTTONS  node dress: fill #04141A, 1 px #7EB4C4, text-hi; the pointed one fills #0A2A33; the focus ring is Flux's cyan
//   TICKS    the ticks take Flux's cyan (--line-active), never the browser's blue
//   PALETTE  every hex colour is Flux's (blue above green: TK6) and the Machina greys are gone
//   BRASS    no brass: brass is her act, and nothing here is one
//   FOOT     the foot's second row fits one line (the side padding is capped, the gaps tighten, a button never breaks inside its label)
// Run: node scripts/harness/reorg-arbor-publish-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/24-reorg-flux-uplink.css');
const AR = ":root[data-flux3][data-theme='flux']";
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') }); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));
const PALETTE = new Set(['#04141A', '#7EB4C4', '#5F8F95', '#0A2A33', '#1F5560']);   // Flux's node dress and its tiers: every one has blue above green (TK6)
const MACHINA_GREYS = ['#D2D6DA', '#6A727B', '#525A62', '#F4F5F6', '#3A4047', '#E6E8EA', '#3F6183'];
const norm = (p) => p.replace(`${AR} `, '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/:not\(\[disabled\]\)/g, '').replace(/\[disabled\]/g, '').trim();

const machinaSelectors = () => {
  const out = new Set();
  for (const x of rules(rd('styles/23-reorg-top.css'))) for (const p of topSplit(x.sel)) if (p.startsWith("[data-theme='machina']") && /\.reorg-pub(?![a-z])|\.reorg-pub-/.test(p) && !/pubparts/.test(p)) out.add(p.replace("[data-theme='machina'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/:not\(\[disabled\]\)/g, '').replace(/\[disabled\]/g, '').trim());
  return [...out];
};

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => { const bad = rs.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(AR))).map((x) => x.sel.slice(0, 80)); return { pass: rs.length >= 20 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) }; });
  t('COVER', () => {
    const want = machinaSelectors();
    const have = new Set(rs.flatMap((x) => topSplit(x.sel).map(norm)));
    const missing = want.filter((w) => !have.has(w));
    return { pass: want.length >= 18 && missing.length === 0, detail: J({ want: want.length, missing: missing.slice(0, 6) }) };
  });
  t('SHEET', () => {
    const sheet = rs.filter((x) => /\.reorg-pub$/.test(x.sel));
    const over = sheet.some((x) => /position:\s*absolute/.test(x.body) && /inset:\s*0/.test(x.body) && /background:\s*var\(--paper\)/.test(x.body) && /color:\s*var\(--ink-on-paper\)/.test(x.body));
    const noBox = sheet.length > 0 && sheet.every((x) => /outline:\s*none/.test(x.body) && !/(^|[\s;])border(-[a-z]+)?\s*:\s*[^;]*\d/.test(x.body.replace(/border-radius:[^;]*;?/g, '')));
    return { pass: over && noBox, detail: J({ over, noBox }) };
  });
  t('BUTTONS', () => {
    const base = has(rs, /\.reorg-pub-btn$/, /border:\s*1px solid #7EB4C4/i) && has(rs, /\.reorg-pub-btn$/, /background:\s*#04141A/i) && has(rs, /\.reorg-pub-btn$/, /color:\s*var\(--text-hi\)/) && has(rs, /\.reorg-pub-btn$/, /height:\s*24px/);
    const hover = has(rs, /\.reorg-pub-btn:hover/, /background:\s*#0A2A33/i);
    const focus = has(rs, /\.reorg-pub-btn:focus-visible$/, /outline:\s*1px solid var\(--line-active\)/);
    return { pass: base && hover && focus, detail: J({ base, hover, focus }) };
  });
  t('TICKS', () => ({ pass: has(rs, /\.reorg-pub-tick input$/, /accent-color:\s*var\(--line-active\)/), detail: 'the tick takes Flux cyan' }));
  t('PALETTE', () => { const all = hexes(css); const bad = all.filter((h) => !PALETTE.has(h) || MACHINA_GREYS.includes(h)); return { pass: all.length >= 1 && bad.length === 0, detail: J({ n: all.length, bad }) }; });
  t('BRASS', () => ({ pass: css.length > 0 && !/var\(--brass\)|#C9A46B|--orange/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: 'no brass' }));
  t('FOOT', () => {
    // the Wrizors' pass 1, NIT: "Web (HTML)" wrapped onto its own line under the other two. The foot's second row (Copy text, Copy formatted, EXPORT, Markdown, Plain text, Web (HTML)) must fit one line in the page's width: the foot's side padding is capped (the page's own margin was 75 px here), the gaps tighten, and a button never breaks inside its label
    const pad = has(rs, /\.reorg-pub-foot$/, /padding-inline:\s*min\(var\(--wz-page-pad-x, 38px\), 28px\)/);
    const gap = has(rs, /\.reorg-pub-foot$/, /column-gap:\s*6px/);
    const nowrap = has(rs, /\.reorg-pub-btn$/, /white-space:\s*nowrap/) && has(rs, /\.reorg-pub-btn$/, /padding:\s*0 8px/);
    return { pass: pad && gap && nowrap, detail: J({ pad, gap, nowrap }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'COVER', 'SHEET', 'BUTTONS', 'TICKS', 'PALETTE', 'BRASS', 'FOOT']) ok(`${k} on the real 24-reorg-flux-uplink.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '24-reorg-flux-uplink.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /24-reorg-flux\.css$/.test(p));
ok('WIRED the global stylesheet lists 24-reorg-flux-uplink.css right after 24-reorg-flux.css', at >= 0 && /24-reorg-flux-uplink\.css$/.test(PARTS[at + 1] || ''), J({ at }));

const MUT = [
  ['a rule escapes the Flux scope', 'SCOPED', (t) => t.replace(`${AR} .reorg-pub-label{`, () => '.reorg-pub-label{')],
  ['the foot keeps the page margin (75 px) on its sides', 'FOOT', (t) => t.replace('padding-inline:min(var(--wz-page-pad-x, 38px), 28px)', () => 'padding-inline:var(--wz-page-pad-x, 38px)')],
  ['a button may break inside its label again', 'FOOT', (t) => t.replace('padding:0 8px; white-space:nowrap;', () => 'padding:0 8px;')],
  ['the buttons lose their twin', 'COVER', (t) => t.split('.reorg-pub-btn.is-quiet').join('.reorg-pub-btn.is-loud')],
  ['the sheet gets a box (the focus ring comes back)', 'SHEET', (t) => t.replace('outline:none;', () => '')],
  ['the sheet no longer covers the paper', 'SHEET', (t) => t.replace('inset:0', () => 'inset:auto')],
  ['the sheet draws a border', 'SHEET', (t) => t.replace(`${AR} .reorg-pub{`, () => `${AR} .reorg-pub{ border:2px solid #7EB4C4;`)],
  ['a button goes back to the browser grey', 'BUTTONS', (t) => t.replace('background:#04141A', () => 'background:#EFEFEF')],
  ['the tick turns the browser blue', 'TICKS', (t) => t.split('accent-color:var(--line-active)').join('accent-color:#3F6183')],
  ['a Machina grey creeps back', 'PALETTE', (t) => t.replace('#7EB4C4', () => '#6A727B')],
  ['brass marks a button', 'BRASS', (t) => t.replace(`${AR} .reorg-pub-btn:focus-visible{`, () => `${AR} .reorg-pub-btn:focus-visible{ border-color:var(--orange);`)],
];
for (const [name, key, fn] of MUT) {
  const after = CSS ? fn(CSS) : CSS;
  const landed = !!CSS && after !== CSS;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-ARBOR-PUBLISH-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-PUBLISH-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
