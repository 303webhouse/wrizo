// THE REORG'S TOP RAIL IN FLUX, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 4:07 pm: Flux piece 2 carries on; the Wrizors' Flux Back menu pass 1, REAL 2: "Uplink breaks the top bar: the crumb turns into white buttons and stacks above the stage strip, the search door drops below, and the bar grows about 45 px; the page moves 43 px (law 1). Fix: the bar keeps its one row and height in every stage").
// The top rail (TopRail.tsx) is drawn the same in every stage; what broke was that in Flux none of its markup was dressed, so its names were the browser's own buttons and nothing kept it on one row. No browser, no box: styles/24-reorg-flux-top.css is read as text, against 23-reorg-top.css's Machina rules; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED   every rule is under :root[data-flux3][data-theme='flux'] (the Flux REDESIGN)
//   COVER    every Machina rule that dresses the top rail (.reorg-top*, [data-reorg-top-row]) has a Flux twin
//   ONEROW   the rail's row, its names and its Part never wrap (flex-wrap: nowrap), and the rail may shrink (min-width 0): it keeps one row and its height, so the page under it never moves
//   RAW      nothing in the rail is the browser's own control: the name, Part count, Connect and search buttons are reset (no white fill, no default border) and Connect and search wear Flux's 1 px #5F8F95 edge
//   PALETTE  every hex colour is Flux's (blue above green: TK6) and the Machina greys are gone
//   BRASS    no brass: brass is her act, and nothing here is one
// Run: node scripts/harness/reorg-flux-top-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/24-reorg-flux-top.css');
const FX = ":root[data-flux3][data-theme='flux']";
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') }); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const has = (R, selRe, bodyRe) => R.filter((x) => selRe.test(x.sel)).some((x) => bodyRe.test(x.body));
const PALETTE = new Set(['#04141A', '#7EB4C4', '#5F8F95', '#0A2A33', '#1F5560']);   // Flux's node dress and its tiers: every one has blue above green (TK6)
const MACHINA_GREYS = ['#D2D6DA', '#6A727B', '#525A62', '#5A626B', '#F4F5F6', '#3A4047', '#E6E8EA', '#3F6183', '#23272B'];
const TOPRE = /\[data-reorg-top-row\]|\.reorg-top(?![a-z])|\.reorg-top-/;
const strip = (p) => p.replace(`${FX} `, '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim();
const machinaSelectors = () => {
  const out = new Set();
  for (const x of rules(rd('styles/23-reorg-top.css'))) for (const p of topSplit(x.sel)) if (p.startsWith("[data-theme='machina']") && TOPRE.test(p)) out.add(p.replace("[data-theme='machina'] ", '').replace(/:(hover|focus-visible|focus-within)\b/g, '').replace(/\[aria-[a-z]+='[a-z]+'\]/g, '').trim());
  return [...out];
};

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => { const bad = rs.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(FX))).map((x) => x.sel.slice(0, 80)); return { pass: rs.length >= 30 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) }; });
  t('COVER', () => {
    const want = machinaSelectors();
    const have = new Set(rs.flatMap((x) => topSplit(x.sel).map(strip)));
    const missing = want.filter((w) => !have.has(strip(w)));
    return { pass: want.length >= 30 && missing.length === 0, detail: J({ want: want.length, missing: missing.slice(0, 6) }) };
  });
  t('ONEROW', () => {
    const row = has(rs, /\[data-reorg-top-row\]$/, /flex-wrap:\s*nowrap/);
    const rail = has(rs, /\.reorg-top$/, /min-width:\s*0/) && has(rs, /\.reorg-top$/, /display:\s*flex/);
    const names = has(rs, /\.reorg-top-names, :root\[data-flux3\]\[data-theme='flux'\] \.reorg-top-part$|\.reorg-top-names,/, /flex-wrap:\s*nowrap/);
    return { pass: row && rail && names, detail: J({ row, rail, names }) };
  });
  t('RAW', () => {
    const reset = rs.some((x) => /\.reorg-top-name-btn, [^{]*\.reorg-top-part-count, [^{]*\.reorg-top-connect, [^{]*\.reorg-top-search/.test(x.sel.replace(/:root\[data-flux3\]\[data-theme='flux'\] /g, '')) && /background:\s*none/.test(x.body) && /border:\s*0/.test(x.body));
    const edge = rs.some((x) => /\.reorg-top-connect, [^{]*\.reorg-top-search$/.test(x.sel.replace(/:root\[data-flux3\]\[data-theme='flux'\] /g, '')) && /border:\s*1px solid #5F8F95/i.test(x.body) && /color:\s*var\(--text-hi\)/.test(x.body));
    return { pass: reset && edge, detail: J({ reset, edge }) };
  });
  t('PALETTE', () => { const all = hexes(css); const bad = all.filter((h) => !PALETTE.has(h) || MACHINA_GREYS.includes(h)); return { pass: all.length >= 4 && bad.length === 0, detail: J({ n: all.length, bad }) }; });
  t('BRASS', () => ({ pass: css.length > 0 && !/var\(--brass\)|var\(--orange\)|#C9A46B|#FF9800/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: 'no brass' }));
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'COVER', 'ONEROW', 'RAW', 'PALETTE', 'BRASS']) ok(`${k} on the real 24-reorg-flux-top.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '24-reorg-flux-top.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /24-reorg-flux-uplink\.css$/.test(p));
ok('WIRED the global stylesheet lists 24-reorg-flux-top.css right after 24-reorg-flux-uplink.css', at >= 0 && /24-reorg-flux-top\.css$/.test(PARTS[at + 1] || ''), J({ at, next: PARTS[at + 1] }));

const MUT = [
  ['a rule escapes the redesign scope (the plain Flux gets it)', 'SCOPED', (t) => t.replace(`${FX} .reorg-top-spring{`, () => ":root[data-theme='flux'] .reorg-top-spring{")],
  ['a rule escapes to every theme', 'SCOPED', (t) => t.replace(`${FX} .reorg-top-spring{`, () => '.reorg-top-spring{')],
  ['the search door loses its twin', 'COVER', (t) => t.split('.reorg-top-search-wrap').join('.reorg-top-searched-wrap')],
  ['the row may wrap again', 'ONEROW', (t) => t.replace(`${FX} [data-reorg-top-row]{ flex-wrap:nowrap; }`, () => `${FX} [data-reorg-top-row]{ flex-wrap:wrap; }`)],
  ['the names may wrap again', 'ONEROW', (t) => t.replace('.reorg-top-part{ flex-wrap:nowrap; }', () => '.reorg-top-part{ flex-wrap:wrap; }')],
  ['the name button is the browser\'s again', 'RAW', (t) => t.replace('background:none; border:0; font:inherit; color:inherit;', () => 'font:inherit; color:inherit;')],
  ['Connect loses its Flux edge', 'RAW', (t) => t.replace('border:1px solid #5F8F95; color:var(--text-hi);', () => 'border:1px solid #888888; color:var(--text-hi);')],
  ['a Machina grey creeps back', 'PALETTE', (t) => t.replace('#5F8F95', () => '#6A727B')],
  ['brass marks the rail', 'BRASS', (t) => t.replace(`${FX} :is(.reorg-top-connect, .reorg-top-search):hover{`, () => `${FX} :is(.reorg-top-connect, .reorg-top-search):hover{ color:var(--orange);`)],
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
console.log(bad ? `\nREORG-FLUX-TOP-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-TOP-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
