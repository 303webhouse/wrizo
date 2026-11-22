// THE REORG'S PUBLISH VIEW IN ARBOR, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md section 9: "the whole Page in one scroll, read-only, on the live page ... 'Copy text' · 'Copy formatted' · 'Export ▸' (Web (HTML) · Markdown · Plain text), as small buttons in the drawer's own style";
// the Wrizors' pass 1 on the Flux Uplink, REAL 1 and 3: no browser-white buttons or ticks, and no brass box: the sheet is the page's own paper, laid exactly over it). No browser, no box: styles/25-reorg-arbor-publish.css is read as text; each law is given a mutant (a text rewrite) that must
// LAND and turn its own check red.
//   SCOPED   every rule is under :root[data-arbor2][data-theme='plateau'] (the live Arbor)
//   COVER    every Machina rule that dresses the publishing sheet (.reorg-pub*, 23-reorg-top.css) has an Arbor twin: nothing is left to the browser's raw buttons and ticks (the Front menu's SECTIONS list, .reorg-pubparts*, is ARBOR's)
//   SHEET    the sheet lies exactly over the paper (absolute, inset 0, the paper's own fill and ink) and shows no box of its own: no outline, no border (the brass-coloured box was the browser's focus ring)
//   BUTTONS  the buttons are small, in the drawer's own style: a 1 px --arbor-line edge, transparent, the paper's ink; the pressed or pointed one fills the page's dim tone; the focus ring is Arbor's olive
//   TICKS    the ticks take Arbor's olive (#56632E), never the browser's blue
//   PALETTE  every hex colour is Arbor's, and the Machina greys (#D2D6DA, #6A727B, #525A62, #F4F5F6, #3A4047, #E6E8EA, #3F6183) are gone
//   BRASS    no brass: brass is her act, and nothing here is one
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
const CSS = rd('styles/25-reorg-arbor-publish.css');
const AR = ":root[data-arbor2][data-theme='plateau']";
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') }); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));
const PALETTE = new Set(['#56632E', '#7FA0BC', '#A8392F', '#17454E', '#C9A46B', '#39414A', '#3A4322', '#241912', '#EFE4CB', '#2B1D12', '#9C8A6E', '#F6F1E4', '#261A12', '#6B5F4E', '#B9AA8C']);
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
    const base = has(rs, /\.reorg-pub-btn$/, /border:\s*1px solid var\(--arbor-line\)/) && has(rs, /\.reorg-pub-btn$/, /background:\s*transparent/) && has(rs, /\.reorg-pub-btn$/, /color:\s*var\(--ink-on-paper\)/) && has(rs, /\.reorg-pub-btn$/, /height:\s*24px/);
    const hover = has(rs, /\.reorg-pub-btn:hover/, /background:\s*var\(--paper-dim\)/);
    const focus = has(rs, /\.reorg-pub-btn:focus-visible$/, /outline:\s*1px solid #56632E/i);
    return { pass: base && hover && focus, detail: J({ base, hover, focus }) };
  });
  t('TICKS', () => ({ pass: has(rs, /\.reorg-pub-tick input$/, /accent-color:\s*#56632E/i), detail: 'the tick takes olive' }));
  t('PALETTE', () => { const all = hexes(css); const bad = all.filter((h) => !PALETTE.has(h) || MACHINA_GREYS.includes(h)); return { pass: all.length >= 1 && bad.length === 0, detail: J({ n: all.length, bad }) }; });
  t('BRASS', () => ({ pass: css.length > 0 && !/var\(--brass\)|#C9A46B|--orange/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: 'no brass' }));
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'COVER', 'SHEET', 'BUTTONS', 'TICKS', 'PALETTE', 'BRASS']) ok(`${k} on the real 25-reorg-arbor-publish.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '25-reorg-arbor-publish.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
ok('WIRED the global stylesheet lists 25-reorg-arbor-publish.css after the Machina reorg sheets', at >= 0 && PARTS.some((p, i) => i > at && /25-reorg-arbor-publish\.css$/.test(p)), J({ at }));

const MUT = [
  ['a rule escapes the Arbor scope', 'SCOPED', (t) => t.replace(`${AR} .reorg-pub-label{`, () => '.reorg-pub-label{')],
  ['the buttons lose their twin', 'COVER', (t) => t.split('.reorg-pub-btn.is-quiet').join('.reorg-pub-btn.is-loud')],
  ['the sheet gets a box (the focus ring comes back)', 'SHEET', (t) => t.replace('outline:none;', () => '')],
  ['the sheet no longer covers the paper', 'SHEET', (t) => t.replace('inset:0', () => 'inset:auto')],
  ['the sheet draws a border', 'SHEET', (t) => t.replace(`${AR} .reorg-pub{`, () => `${AR} .reorg-pub{ border:2px solid #9C8A6E;`)],
  ['a button goes back to the browser grey', 'BUTTONS', (t) => t.replace('background:transparent', () => 'background:#EFE4CB')],
  ['the tick turns the browser blue', 'TICKS', (t) => t.split('accent-color:#56632E').join('accent-color:#3F6183')],
  ['a Machina grey creeps back', 'PALETTE', (t) => t.replace('#56632E', () => '#6A727B')],
  ['brass marks a button', 'BRASS', (t) => t.replace(`${AR} .reorg-pub-btn:focus-visible{`, () => `${AR} .reorg-pub-btn:focus-visible{ border-color:var(--brass);`)],
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
