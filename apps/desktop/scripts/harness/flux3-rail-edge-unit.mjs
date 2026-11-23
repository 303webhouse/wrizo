// THE FLUX RAIL'S COMMAND-BOX EDGES HOLD 3:1 (Fable, Nov 22, 10:50 pm: "the rail's command-box edges (1.83:1, from L2) must reach 3:1. Yours"; the Wrizors' Flux rail pass 1, carry item 6 and the ship checklist, section A: "the command boxes' edges hold 3:1 on the rail"). Browserless: flux3/flux-v3.css is read as text, the contrast is computed from the tokens it
// and the Flux palette write, and each law has a mutant (a text rewrite) that must LAND and turn its check red.
//   TOKEN   --f3-box-edge is #5F8F95 in the Flux dark root (the edge colour TK6 and the field dress already use), and the light tone leaves the box edge to --f3-hair (the rail is dark in both tones: the room)
//   RULE    .desk-rail-item draws its edge from --f3-box-edge (its 1 px inset ring), and the active item is still the cyan ring
//   RATIO   the edge holds 3:1 against the rail's dark ground in every colour the rail can be (#101C24 the chrome surface, #05151B the rail panel, #020C10 the ink ground): computed, not asserted
//   KEEP    --f3-hair is unchanged (#1D4A52: the rail's own right edge, the strip's top edge and the node records still use it) and brass never draws a box edge
// Run: node scripts/harness/flux3-rail-edge-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';

const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const CSS = rd('flux3/flux-v3.css');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const GROUNDS = ['#101C24', '#05151B', '#020C10'];
const DARK_ROOT = ":root[data-flux3][data-theme='flux']{";
const LIGHT_ROOT = ":root[data-flux3][data-theme='flux'][data-page='light']{";
const block = (css, head) => { const i = css.indexOf(head); if (i < 0) return ''; const j = css.indexOf('}', i); return css.slice(i + head.length, j); };

function suite(css) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const dark = block(css, DARK_ROOT), light = block(css, LIGHT_ROOT);
  const edge = (/--f3-box-edge:\s*(#[0-9a-fA-F]{6})/.exec(dark) || [])[1];
  t('TOKEN', () => ({ pass: !!edge && edge.toUpperCase() === '#5F8F95' && !/--f3-box-edge/.test(light), detail: J({ edge, lightSetsIt: /--f3-box-edge/.test(light) }) }));
  t('RULE', () => {
    const flat = css.replace(/\n\s*/g, ' ');
    const rule = /:root\[data-flux3\]\[data-theme='flux'\] \.desk-rail-item\{[^}]*box-shadow:\s*inset 0 0 0 1px var\(--f3-box-edge, var\(--f3-hair\)\)/.test(flat);
    const active = /\.desk-rail-item\.active\{ box-shadow:\s*inset 0 0 0 1px var\(--f3-cyan\)/.test(flat);
    return { pass: rule && active, detail: J({ rule, active }) };
  });
  t('RATIO', () => { const rs = edge ? GROUNDS.map((g) => ({ g, r: Math.round(ratio(edge, g) * 100) / 100 })) : []; return { pass: rs.length === GROUNDS.length && rs.every((x) => x.r >= 3), detail: J(rs) }; });
  t('KEEP', () => ({ pass: /--f3-hair:\s*#1D4A52/.test(dark) && !/--f3-box-edge:\s*var\(--(orange|brass)\)/.test(css) && !/--f3-box-edge:\s*#(FF9800|C9A46B)/i.test(css), detail: 'hair kept, no brass' }));
  return R;
}

let base = null, baseErr = null;
try { base = suite(CSS); } catch (e) { baseErr = e; }
for (const k of ['TOKEN', 'RULE', 'RATIO', 'KEEP']) ok(`${k} on the real flux-v3.css`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'flux-v3.css: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['the edge goes back to the hairline colour (1.83:1)', 'TOKEN', (t) => t.replace('--f3-box-edge:#5F8F95', () => '--f3-box-edge:#1D4A52')],
  ['the edge is a colour under 3:1', 'RATIO', (t) => t.replace('--f3-box-edge:#5F8F95', () => '--f3-box-edge:#2F6870')],
  ['the rail item reads the hairline again', 'RULE', (t) => t.replace('inset 0 0 0 1px var(--f3-box-edge, var(--f3-hair))', () => 'inset 0 0 0 1px var(--f3-hair)')],
  ['the active item loses its cyan ring', 'RULE', (t) => t.replace('.desk-rail-item.active{ box-shadow:inset 0 0 0 1px var(--f3-cyan)', () => '.desk-rail-item.active{ box-shadow:inset 0 0 0 1px var(--f3-hair)')],
  ['the hairline itself is brightened (it is the rail’s other edges’ colour)', 'KEEP', (t) => t.replace('--f3-hair:#1D4A52', () => '--f3-hair:#5F8F95')],
  ['the light tone sets the box edge', 'TOKEN', (t) => t.replace('--f3-hair:#B7C9CC;', () => '--f3-hair:#B7C9CC; --f3-box-edge:#5F8F95;')],
];
for (const [name, key, fn] of MUT) {
  const after = CSS ? fn(CSS) : CSS;
  const landed = !!CSS && after !== CSS;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && !!res && res[key] && res[key].pass === false, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFLUX3-RAIL-EDGE-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFLUX3-RAIL-EDGE-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
