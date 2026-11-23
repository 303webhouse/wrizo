// THE REORG'S SPLIT SCREEN IN FLUX (THE DOCK), ITS STYLESHEET, BROWSERLESS (Fable, Nov 22, 9:20 pm: "Flux's split and Uplink"; claude/wrizors/flux-reorg-spec.md section 8, on the redesign): "Dock is Flux's word for Open Beside, and the split is the Dock. The docked half: node dress.
// The grip: a 1 px cyan line with a port-shaped handle. Scrollbars hidden; both hands off in a split. The page side is unchanged (law 1)." No browser, no box: styles/24-reorg-flux-split.css is read as text; each law is given a mutant (a text rewrite)
// that must LAND and turn its own check red. The twin of reorg-arbor-split-css-unit.mjs.
//   SCOPED   every rule is under :root[data-flux3][data-theme='flux'] (the redesign: the plain Flux and every other theme are untouched)
//   SURFACE  the docked half is in node dress: fill #04141A, a 1 px #7EB4C4 edge
//   GRIP     a 1 px line in cyan (--line-active), a port-shaped handle (a 1 px #7EB4C4 edge on the node fill, chamfered) that lights cyan on hover and on keyboard focus
//   SCROLL   scrollbars hidden on the stage's scrollers in a split and on the docked half; both still scroll (no overflow rule here, no ::-webkit-scrollbar)
//   QUIET    the page side is unchanged: no rule touches .mode-stage, the page's column, paper or editor, and no rule moves, resizes or hides anything but the docked half, the grip and the count row
//   COUNT    the count row under the page takes the page's own shift (--wz-split-shift), so it stands under HER page (the Arbor pass's split NIT, as a rule from the first frame)
//   PALETTE  every hex colour is one of Flux's (TK6: no green-grey tier); BRASS no brass anywhere in the split (brass is her act, never a box's outline)
// Run: node scripts/harness/reorg-flux-split-css-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { globalCssParts } from '../global-css.mjs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const CSS = rd('styles/24-reorg-flux-split.css');
const FX = ":root[data-flux3][data-theme='flux']";
const rules = (css) => { const t = css.replace(/\/\*[\s\S]*?\*\//g, ''); const out = []; let i = 0; while (i < t.length) { const o = t.indexOf('{', i); if (o < 0) break; const c = t.indexOf('}', o); if (c < 0) break; out.push({ sel: t.slice(i, o).trim().replace(/\s+/g, ' '), body: t.slice(o + 1, c).trim().replace(/\s+/g, ' ') }); i = c + 1; } return out; };
const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d += 1; else if (ch === ')') d -= 1; if (ch === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += ch; } out.push(cur.trim()); return out.filter(Boolean); };
const hexes = (s) => (s.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toUpperCase());
const find = (R, re) => R.filter((x) => re.test(x.sel));
const has = (R, selRe, bodyRe) => find(R, selRe).some((x) => bodyRe.test(x.body));
const PALETTE = new Set(['#04141A', '#7EB4C4', '#00C2FF', '#5F8F95', '#020C10', '#E7F4F1', '#9AD7EA']);

function suite(css) {
  const R = {};
  const rs = rules(css);
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('SCOPED', () => { const bad = rs.filter((x) => !topSplit(x.sel).every((p) => p.startsWith(FX))).map((x) => x.sel.slice(0, 80)); return { pass: rs.length >= 7 && bad.length === 0, detail: J({ rules: rs.length, bad: bad.slice(0, 4) }) }; });
  t('SURFACE', () => {
    const fill = has(rs, /\.wz-split-asset$/, /background:\s*#04141A/i);
    const edge = has(rs, /\.wz-split-asset$/, /border-color:\s*#7EB4C4/i);
    return { pass: fill && edge, detail: J({ fill, edge }) };
  });
  t('GRIP', () => {
    const line = has(rs, /\.wz-split-grip::before$/, /width:\s*1px/) && has(rs, /\.wz-split-grip::before$/, /background:\s*var\(--line-active\)/);
    const handle = has(rs, /\.wz-split-grip::after$/, /background:\s*#04141A/i) && has(rs, /\.wz-split-grip::after$/, /border:\s*1px solid #7EB4C4/i) && has(rs, /\.wz-split-grip::after$/, /clip-path:\s*polygon\(/);
    const lit = has(rs, /\.wz-split-grip:hover::after/, /border-color:\s*var\(--line-active\)/) && has(rs, /\.wz-split-grip:focus-visible::after/, /border-color:\s*var\(--line-active\)/);
    return { pass: line && handle && lit, detail: J({ line, handle, lit }) };
  });
  t('SCROLL', () => {
    const stage = has(rs, /desk-frame-stage\[data-split='true'\] \*$/, /scrollbar-width:\s*none/);
    const asset = has(rs, /:is\(\.wz-split-asset, \.wz-split-asset \*\)$/, /scrollbar-width:\s*none/);
    const noWebkit = !rs.some((x) => /::-webkit-scrollbar/.test(x.sel));
    const noOverflow = !rs.some((x) => /overflow\s*:\s*hidden/.test(x.body) && /desk-frame-stage|mode-stage/.test(x.sel));
    return { pass: stage && asset && noWebkit && noOverflow, detail: J({ stage, asset, noWebkit, noOverflow }) };
  });
  t('QUIET', () => {
    const touches = rs.filter((x) => /\.mode-stage|\.mode-pagecol|\.mode-page\b|\.forward-only-editor|\.mode-paper/.test(x.sel)).map((x) => x.sel.slice(0, 70));
    const geometry = rs.filter((x) => /(^|[\s;{])(width|height|left|right|top|bottom|margin|transform|position)\s*:/.test(x.body) && !/\.wz-split-(asset|grip)/.test(x.sel) && !/\.desk-frame-instrument$/.test(x.sel)).map((x) => x.sel.slice(0, 70));
    return { pass: touches.length === 0 && geometry.length === 0, detail: J({ touches, geometry }) };
  });
  t('COUNT', () => {
    const r = has(rs, /desk-frame-stage\[data-split='true'\] \.desk-frame-instrument$/, /left:\s*calc\(50% \+ var\(--wz-split-shift, 0px\)\)/);
    return { pass: r, detail: J({ r }) };
  });
  t('PALETTE', () => { const all = hexes(css); const bad = all.filter((h) => !PALETTE.has(h)); return { pass: all.length >= 3 && bad.length === 0, detail: J({ n: all.length, bad }) }; });
  t('BRASS', () => ({ pass: css.length > 0 && !/var\(--brass\)|#C9A46B|--orange/i.test(css.replace(/\/\*[\s\S]*?\*\//g, '')), detail: 'no brass in the split' }));
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['SCOPED', 'SURFACE', 'GRIP', 'SCROLL', 'QUIET', 'COUNT', 'PALETTE', 'BRASS']) ok(`${k} on the real 24-reorg-flux-split.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : '24-reorg-flux-split.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
const PARTS = (() => { try { return globalCssParts(SRCDIR).map((p) => p.name); } catch { return []; } })();
const at = PARTS.findIndex((p) => /23-reorg-back\.css$/.test(p));
ok('WIRED the global stylesheet lists 24-reorg-flux-split.css after the Machina reorg sheets', at >= 0 && PARTS.some((p, i) => i > at && /24-reorg-flux-split\.css$/.test(p)), J({ at }));

const MUT = [
  ['a rule escapes the Flux scope', 'SCOPED', (t) => t.replace(`${FX} .wz-split-asset{`, () => '.wz-split-asset{')],
  ['the docked half loses its node fill', 'SURFACE', (t) => t.replace('background:#04141A', () => 'background:#0B1F27')],
  ['the docked half loses its edge', 'SURFACE', (t) => t.replace('border-color:#7EB4C4', () => 'border-color:#5F8F95')],
  ['the grip line is 2 px', 'GRIP', (t) => t.replace('width:1px', () => 'width:2px')],
  ['the handle is a plain rectangle', 'GRIP', (t) => t.replace(/clip-path:\s*polygon\([^)]*\);?/, () => '')],
  ['the handle lights nothing on hover', 'GRIP', (t) => t.replace(':hover::after{ border-color:var(--line-active)', () => ':hover::after{ border-color:#7EB4C4')],
  ['the handle lights brass on hover', 'BRASS', (t) => t.replace(':hover::after{ border-color:var(--line-active)', () => ':hover::after{ border-color:var(--brass)')],
  ['a ::-webkit-scrollbar rule is added to the split sheet', 'SCROLL', (t) => `${t}\n${FX} .wz-split-asset::-webkit-scrollbar{ width:0; }\n`],
  ['the stage keeps its scrollbars in a split', 'SCROLL', (t) => t.split('scrollbar-width:none').join('scrollbar-width:auto')],
  ['the count row stays at the unshifted centre', 'COUNT', (t) => t.replace('left:calc(50% + var(--wz-split-shift, 0px))', () => 'left:50%')],
  ['a green-grey surface enters the palette', 'PALETTE', (t) => `${t}\n${FX} .wz-split-asset{ background:#2A3B38; }\n`],
  ['the page side is moved', 'QUIET', (t) => `${t}\n${FX} .mode-stage{ left:40px; }\n`],
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
console.log(bad ? `\nREORG-FLUX-SPLIT-CSS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-FLUX-SPLIT-CSS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
