// THE REORG'S SPLIT SCREEN IN ARBOR, ITS STYLESHEET, BROWSERLESS (Fable, Nov 21, 4:58 pm; claude/wrizors/arbor-reorg-spec.md section 8): "the asset's half sits on Arbor's raised surface: #F6F1E4 by day, #261A12 by night; the grip is a 1 px line in Arbor's line colour, with a 6 px handle that fills olive
// on hover; scrollbars hidden (Nick, all themes); both drawers off in a split; the page side is unchanged (law 1)". No browser, no box: styles/25-reorg-arbor-split.css is read as text; each law is given a mutant (a text rewrite) that must LAND and turn its own check red.
//   SCOPED   every rule is under :root[data-arbor2][data-theme='plateau'] (the live Arbor: no other theme is touched)
//   SURFACE  the asset's half: #F6F1E4 by day (data-arbor2-room='day'), #261A12 by night (data-arbor2-room='night')
//   GRIP     a 1 px line in --arbor-line, a 6 px handle that fills olive (#56632E) on hover and on keyboard focus
//   SCROLL   scrollbars hidden on the stage's scrollers in a split and on the asset's half (the Machina rules' Arbor twins), both still scroll (no overflow rule here)
//   QUIET    the page side is unchanged: no rule touches .mode-stage, the page's column, paper or editor, and no rule moves, resizes or hides anything but the asset's own half and the grip
//   PALETTE  every hex colour is one of Arbor's; BRASS no brass anywhere in the split (brass is her act)
// Run: node scripts/harness/reorg-arbor-split-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/25-reorg-arbor-split.css');
const AR = ":root[data-arbor2][data-theme='plateau']";
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') }); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));
const PALETTE = new Set(['#56632E', '#7FA0BC', '#A8392F', '#17454E', '#C9A46B', '#39414A', '#3A4322', '#241912', '#EFE4CB', '#2B1D12', '#9C8A6E', '#F6F1E4', '#261A12', '#6B5F4E', '#B9AA8C']);

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => { const bad = rs.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(AR))).map((x) => x.sel.slice(0, 80)); return { pass: rs.length >= 8 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) }; });
  t('SURFACE', () => {
    const day = has(rs, /data-arbor2-room='day'\] \.wz-split-asset$/, /background:\s*#F6F1E4/i);
    const night = has(rs, /data-arbor2-room='night'\] \.wz-split-asset$/, /background:\s*#261A12/i);
    return { pass: day && night, detail: J({ day, night }) };
  });
  t('GRIP', () => {
    const line = has(rs, /\.wz-split-grip::before$/, /width:\s*1px/) && has(rs, /\.wz-split-grip::before$/, /background:\s*var\(--arbor-line\)/);
    const handle = has(rs, /\.wz-split-grip::after$/, /width:\s*6px/);
    const fill = has(rs, /\.wz-split-grip:hover::after/, /background:\s*#56632E/i) && has(rs, /\.wz-split-grip:focus-visible::after/, /background:\s*#56632E/i);
    return { pass: line && handle && fill, detail: J({ line, handle, fill }) };
  });
  t('SCROLL', () => {
    const stage = has(rs, /desk-frame-stage\[data-split='true'\] \*$/, /scrollbar-width:\s*none/) && has(rs, /desk-frame-stage\[data-split='true'\] \*::-webkit-scrollbar$/, /display:\s*none/);
    const asset = has(rs, /:is\(\.wz-split-asset, \.wz-split-asset \*\)$/, /scrollbar-width:\s*none/) && has(rs, /:is\(\.wz-split-asset, \.wz-split-asset \*\)::-webkit-scrollbar$/, /display:\s*none/);
    const noOverflow = !rs.some((x) => /overflow\s*:\s*hidden/.test(x.body) && /desk-frame-stage|mode-stage/.test(x.sel));
    return { pass: stage && asset && noOverflow, detail: J({ stage, asset, noOverflow }) };
  });
  t('QUIET', () => {
    const touches = rs.filter((x) => /\.mode-stage|\.mode-pagecol|\.mode-page\b|\.forward-only-editor|\.mode-paper/.test(x.sel)).map((x) => x.sel.slice(0, 70));
    const geometry = rs.filter((x) => /\b(width|height|left|right|top|bottom|margin|transform|position)\s*:/.test(x.body) && !/\.wz-split-(asset|grip)/.test(x.sel)).map((x) => x.sel.slice(0, 70));
    return { pass: touches.length === 0 && geometry.length === 0, detail: J({ touches, geometry }) };
  });
  t('PALETTE', () => { const all = hexes(css); const bad = all.filter((h) => !PALETTE.has(h)); return { pass: all.length >= 3 && bad.length === 0, detail: J({ n: all.length, bad }) }; });
  t('BRASS', () => ({ pass: css.length > 0 && !/var\(--brass\)|#C9A46B|--orange/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: 'no brass in the split' }));
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'SURFACE', 'GRIP', 'SCROLL', 'QUIET', 'PALETTE', 'BRASS']) ok(`${k} on the real 25-reorg-arbor-split.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '25-reorg-arbor-split.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
ok('WIRED the global stylesheet lists 25-reorg-arbor-split.css after the Machina reorg sheets', at >= 0 && PARTS.some((p, i) => i > at && /25-reorg-arbor-split\.css$/.test(p)), J({ at }));

const MUT = [
  ['a rule escapes the Arbor scope', 'SCOPED', (t) => t.replace(`${AR}[data-arbor2-room='day'] .wz-split-asset{`, () => ".wz-split-asset{")],
  ['the day surface drifts', 'SURFACE', (t) => t.replace('background:#F6F1E4', () => 'background:#F5F0E3')],
  ['the night surface is the day one', 'SURFACE', (t) => t.replace('background:#261A12', () => 'background:#F6F1E4')],
  ['the grip line is 2 px', 'GRIP', (t) => t.replace('width:1px', () => 'width:2px')],
  ['the handle is not 6 px', 'GRIP', (t) => t.replace('width:6px', () => 'width:12px')],
  ['the handle fills brass on hover', 'BRASS', (t) => t.replace(':hover::after{ background:#56632E', () => ':hover::after{ background:var(--brass)')],
  ['the stage keeps its scrollbars in a split', 'SCROLL', (t) => t.replace("[data-arbor2-room]", () => '[data-arbor2-room]').split('scrollbar-width:none').join('scrollbar-width:auto')],
  ['the page side is moved', 'QUIET', (t) => `${t}\n${AR} .mode-stage{ left:40px; }\n`],
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
console.log(bad ? `\nREORG-ARBOR-SPLIT-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-ARBOR-SPLIT-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
