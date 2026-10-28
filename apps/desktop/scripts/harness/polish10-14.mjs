// POLISH #10 ITEM 14 (INK) - Flux: the rail's place label "RACK > The Well" stays on ONE line, with an ellipsis; the full name on hover/focus. BROWSERLESS (source) half; the live half is the F14 successor in
// flux-v2-part2.mjs (a box turn). Falsifies FX V2's F14 ("wraps, white-space normal, no ellipsis"): that check is PARKED verbatim there (SUPERSEDED) with its successor beside it.
// Every check has a mutant, its landing asserted.   Run: node scripts/harness/polish10-14.mjs   (from apps/desktop; no box needed)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..', '..', 'src');
const noCR = (t) => t.replace(/\r\n?/g, '\n');
const readRaw = (rel) => noCR(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// The value `prop` takes on the LAST rule whose selector list ends with exactly `selector` (the cascade's winner when nothing out-ranks it), or null.
function last(css, selector, prop) {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let v = null;
  for (const m of css.matchAll(new RegExp(`(?:^|[}\\n,])\\s*${esc}\\s*\\{([^}]*)\\}`, 'g'))) {
    const d = new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;}]+)`).exec(m[1]);
    if (d) v = d[1].trim();
  }
  return v;
}
const FLUX = "[data-theme='flux'] .wz-place-block .wz-place-name";

function suite(css, pb) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail }; } catch (e) { R[id] = { pass: false, detail: String(e.message || e) }; } };
  chk('P1', () => { const w = last(css, FLUX, 'white-space'); return [w === 'nowrap', `Flux: the place name does not wrap (white-space ${w})`]; });
  chk('P2', () => { const t = last(css, FLUX, 'text-overflow'); const o = last(css, FLUX, 'overflow'); return [t === 'ellipsis' && o === 'hidden', `Flux: it ends in an ellipsis (text-overflow ${t}, overflow ${o})`]; });
  chk('P3', () => { const w = last(css, FLUX, 'overflow-wrap'); return [w === null || w === 'normal', `Flux: no break-anywhere rule left to defeat the one line (overflow-wrap ${w})`]; });
  chk('P4', () => [/<button[^>]*className=\{`wz-strip-item wz-place-block[^>]*title=\{label\}/s.test(pb), 'the full name is on the button as its title (hover); aria-label keeps the plain name for a reader']);
  return R;
}

const MUT = [
  { name: 'the Flux place name wraps again', file: 'css', find: /(\[data-theme='flux'\] \.wz-place-block \.wz-place-name\{[^}]*?)white-space:nowrap;/, to: '$1white-space:normal;', red: ['P1'] },
  { name: 'the ellipsis is gone', file: 'css', find: /(\[data-theme='flux'\] \.wz-place-block \.wz-place-name\{[^}]*?)text-overflow:ellipsis;/, to: '$1text-overflow:clip;', red: ['P2'] },
  { name: 'break-anywhere comes back', file: 'css', find: /(\[data-theme='flux'\] \.wz-place-block \.wz-place-name\{[^}]*?)text-align:center;/, to: '$1text-align:center; overflow-wrap:anywhere;', red: ['P3'] },
  { name: 'the title is dropped', file: 'pb', find: / title=\{label\}/, to: '', red: ['P4'] },
];

const css0 = readRaw('index.css'), pb0 = readRaw('components/PlaceBlock.tsx');
const res0 = suite(css0, pb0);
for (const [k, v] of Object.entries(res0)) ok(k, v.pass, v.detail);
let landed = 0, killed = 0;
for (const m of MUT) {
  const css = m.file === 'css' ? css0.replace(m.find, m.to) : css0;
  const pb = m.file === 'pb' ? pb0.replace(m.find, m.to) : pb0;
  const did = css !== css0 || pb !== pb0;
  const red = did ? Object.entries(suite(css, pb)).filter(([, v]) => !v.pass).map(([k]) => k) : [];
  const dead = did && m.red.every((k) => red.includes(k));
  if (did) landed++;
  if (dead) killed++;
  ok(`mutant "${m.name}": landed and turns ${m.red.join('+')} RED`, dead, JSON.stringify({ did, red }));
}
ok(`all ${MUT.length} mutations landed and ${MUT.length} were killed`, landed === MUT.length && killed === MUT.length, `${landed} landed / ${killed} killed`);

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(`POLISH10-14 VERIFY: ${failed.length ? `FAIL - ${failed.length}/${checks.length}` : `PASS (${checks.length} checks)`}`);
process.exit(failed.length ? 1 : 0);
