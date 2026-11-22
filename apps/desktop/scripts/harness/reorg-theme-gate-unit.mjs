// THE REORG'S THEME GATE, BROWSERLESS (Fable, Nov 21, 3:20 pm: "FLUX piece 1: the four Machina-only literals behind ONE table, reorg/themeGate.ts: six pieces x theme, Machina all on, Arbor and Flux empty; a mutant per gate site; the Machina
// suites unchanged. A Flux piece is switched on in the table only when its frames pass the Wrizors."). No browser, no box. The real themeGate.ts is transpiled and run; each law is given a mutant (a text rewrite of the source) that
// must LAND and turn its own check red; the gate SITES are read as source (a census), each with a mutant that puts its old Machina-only literal back.
// The table's themes are the app's own ThemeId: 'plateau' is the theme Arbor dresses (arbor2), so its column is Arbor's.
//   TABLE  the six pieces are rail, top, front, back, split, uplink; Machina has every one; Plateau (Arbor) and Flux have none; a theme the table does not know has none
//   HOOK   useReorgPiece reads the table for the current theme under the switch, and with the switch off returns false and calls NO hook (the hook order never changes)
//   LIFT   lifting a Flux piece is ONE cell: with only flux.back flipped, exactly that cell changes and every other (piece, theme) reads as before
//   LIFTQ  (Flux piece 2, Nov 21) the PREVIEW DOOR: ?reorglift=flux.back (comma-separated theme.piece) shows a piece of a theme without flipping the table's cell, so frames and the Wrizors' review can see it; honoured only with the switch on, read once at load, a token that is not a real theme.piece is ignored, it only ADDS (Machina never loses a piece), and with no parameter nothing changes
//   ARBOR2 (Nov 21) Arbor's column is the live Arbor, the redesign (arbor2/flag.ts arbor2Enabled: on by default, ?arbor2=0 test-only): a plateau cell is on only while the redesign may run; with it off a plateau cell the table has switched on, and the preview door, read OFF; Machina and Flux do not read it
//   [Nov 21, ARBOR's rail ON] TABLE, LIFTQ, ARBOR2 and the "Arbor has a piece on" mutant parked with successors: Arbor's column is the cells the Wrizors
//          passed (ARBOR_ON: the rail), each other plateau cell still off
//   SITES  each gate site in the app reads the table for its own piece and the Machina-only literal is gone from it: Cascade (rail), useReorg (top), Sliver (front), Tutor (back and split), BoardEditor (the Plan presets, back), PageEditor (uplink)
// Run: node scripts/harness/reorg-theme-gate-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { srcText } from '../global-css.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => { try { return lf(fs.readFileSync(new URL('../../src/' + p, import.meta.url), 'utf8')); } catch { return ''; } };
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const SRCDIR = fileURLToPath(new URL('../../src', import.meta.url));
// a split file (BoardEditor.tsx) is read as its module and its parts, joined (the 10g readers rule)
const rdSite = (p) => (p === 'components/BoardEditor.tsx' ? lf(srcText(SRCDIR, p)) : rd(p));
const GATE = rd('reorg/themeGate.ts');
const PIECES = ['rail', 'top', 'front', 'back', 'split', 'uplink'];
// the cells of Arbor's column the table has switched on, each only after the Wrizors passed its frames (Fable, Nov 21 9:40 pm: the rail)
// Nov 22 (Fable 3:20 pm, train K): + 'top' (ARBOR's flip). Was: const ARBOR_ON = ['rail'];
const ARBOR_ON = ['rail', 'top'];
// the plateau line as the table holds it, whatever cells it carries (the anchor the ARBOR2 law and its mutant rewrite)
const PLATEAU_LINE = /  plateau: \{ \.\.\.ALL_OFF[^}\n]*\},/;
const THEMES = ['machina', 'plateau', 'flux'];

function load(src, { reorg = true, theme = 'machina', calls = { n: 0 }, search = '', arbor2 = true } = {}) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const mods = { '../store/theme': { useTheme: () => { calls.n += 1; return theme; } }, './flag': { REORG: reorg }, '../arbor2/flag': { arbor2Enabled: () => arbor2 } };
  const m = { exports: {} };
  new Function('require', 'exports', 'module', 'location', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, m.exports, m, { search });
  return m.exports;
}

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  t('TABLE', () => {
    const G = load(src);
    const cells = {};
    for (const th of [...THEMES, 'arbor', 'nonsense']) for (const p of [...PIECES, 'nope']) cells[th + '.' + p] = G.themeHas(p, th);
    // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty). The original, verbatim:
    // const want = (th, p) => th === 'machina' && PIECES.includes(p);
    const want = (th, p) => (th === 'machina' && PIECES.includes(p)) || (th === 'plateau' && ARBOR_ON.includes(p));   // [ARBOR_ON successor]
    const wrong = Object.entries(cells).filter(([k, v]) => { const [th, p] = k.split('.'); return v !== want(th, p); }).map(([k]) => k);
    return { pass: J(G.REORG_PIECES) === J(PIECES) && wrong.length === 0, detail: J({ pieces: G.REORG_PIECES, wrong }) };
  });
  t('HOOK', () => {
    const on = { n: 0 }, off = { n: 0 };
    const A = load(src, { reorg: true, theme: 'machina', calls: on }), B = load(src, { reorg: false, theme: 'machina', calls: off });
    const F = load(src, { reorg: true, theme: 'flux' });
    const r = [A.useReorgPiece('top'), A.useReorgPiece('uplink')], f = PIECES.map((p) => F.useReorgPiece(p)), o = [B.useReorgPiece('top'), B.useReorgPiece('rail')];
    // one piece lifted for Flux: the hook says yes to that piece and no to the others
    const lifted = src.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, back: true },');
    const L = load(lifted, { reorg: true, theme: 'flux' });
    const one = PIECES.filter((p) => L.useReorgPiece(p));
    return { pass: r.every((x) => x === true) && on.n === 2 && f.every((x) => x === false) && o.every((x) => x === false) && off.n === 0 && J(one) === J(['back']), detail: J({ r, f, o, one, onCalls: on.n, offCalls: off.n }) };
  });
  t('LIFT', () => {
    const lifted = src.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, back: true },');
    if (lifted === src) return { pass: false, detail: 'the flux cell is not where the unit looks' };
    const G0 = load(src), G1 = load(lifted);
    const diff = [];
    for (const th of THEMES) for (const p of PIECES) if (G0.themeHas(p, th) !== G1.themeHas(p, th)) diff.push(th + '.' + p);
    return { pass: J(diff) === J(['flux.back']), detail: J({ diff }) };
  });
  t('ARBOR2', () => {
    // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty; the anchor '  plateau: { ...ALL_OFF },' is gone). The original, verbatim:
    // const lifted = src.replace('  plateau: { ...ALL_OFF },', () => '  plateau: { ...ALL_OFF, back: true, split: true },');
    // if (lifted === src) return { pass: false, detail: 'the plateau cell is not where the unit looks' };
    const lifted = src.replace(PLATEAU_LINE, () => `  plateau: { ...ALL_OFF, ${ARBOR_ON.map((p) => `${p}: true, `).join('')}back: true, split: true },`);   // [ARBOR_ON successor]
    if (lifted === src) return { pass: false, detail: 'the plateau cell is not where the unit looks' };
    const on = load(lifted, { arbor2: true }), off = load(lifted, { arbor2: false });
    const cellsOf = (G, th) => PIECES.filter((p) => G.themeHas(p, th));
    const doorOff = load(src, { arbor2: false, search: '?reorg=1&reorglift=plateau.back,flux.rail,machina.rail' }), doorOn = load(src, { arbor2: true, search: '?reorg=1&reorglift=plateau.back' });
    const hooked = load(lifted, { arbor2: false, theme: 'plateau' }), hookedOn = load(lifted, { arbor2: true, theme: 'plateau' });
    const m = load(src, { arbor2: false });
    // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty). The original, verbatim:
    // return { pass: J(cellsOf(on, 'plateau')) === J(['back', 'split']) && cellsOf(off, 'plateau').length === 0 && doorOff.themeHas('back', 'plateau') === false && doorOff.themeHas('rail', 'flux') === true && doorOn.themeHas('back', 'plateau') === true && PIECES.every((p) => m.themeHas(p, 'machina')) && PIECES.every((p) => hooked.useReorgPiece(p) === false) && J(PIECES.filter((p) => hookedOn.useReorgPiece(p))) === J(['back', 'split']), detail: J({ on: cellsOf(on, 'plateau'), off: cellsOf(off, 'plateau'), doorOff: doorOff.themeHas('back', 'plateau'), doorOn: doorOn.themeHas('back', 'plateau') }) };
    const arborOn = PIECES.filter((p) => ARBOR_ON.includes(p) || p === 'back' || p === 'split');   // [ARBOR_ON successor]: the lifted line holds the passed cells and back, split
    return { pass: J(cellsOf(on, 'plateau')) === J(arborOn) && cellsOf(off, 'plateau').length === 0 && doorOff.themeHas('back', 'plateau') === false && doorOff.themeHas('rail', 'flux') === true && doorOn.themeHas('back', 'plateau') === true && PIECES.every((p) => m.themeHas(p, 'machina')) && PIECES.every((p) => hooked.useReorgPiece(p) === false) && J(PIECES.filter((p) => hookedOn.useReorgPiece(p))) === J(arborOn) && cellsOf(load(src, { arbor2: false }), 'plateau').length === 0, detail: J({ on: cellsOf(on, 'plateau'), off: cellsOf(off, 'plateau'), doorOff: doorOff.themeHas('back', 'plateau'), doorOn: doorOn.themeHas('back', 'plateau'), arborOn }) };
  });
  t('LIFTQ', () => {
    // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty: with no door it saw plateau.rail, a cell the TABLE holds, not the door). The original, verbatim:
    // const cells = (o) => { const G = load(src, o); const on = []; for (const th of [...THEMES, 'nonsense']) for (const p of PIECES) if (G.themeHas(p, th)) on.push(th + '.' + p); return on.filter((x) => !x.startsWith('machina.')); };
    // [ARBOR_ON successor] what the DOOR adds: the cells on, less Machina's and less the plateau cells the table itself holds
    const cells = (o) => { const G = load(src, o); const on = []; for (const th of [...THEMES, 'nonsense']) for (const p of PIECES) if (G.themeHas(p, th)) on.push(th + '.' + p); return on.filter((x) => !x.startsWith('machina.') && !ARBOR_ON.some((p) => x === 'plateau.' + p)); };
    const none = cells({ search: '?reorg=1' });
    const one = cells({ search: '?reorg=1&reorglift=flux.back' });
    // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty: plateau.rail is the table's now, so the door cannot be seen adding it). The original, verbatim:
    // const two = cells({ search: '?reorg=1&reorglift=flux.back,flux.top,plateau.rail' });
    // SUPERSEDED (the Wrizors' pass 6 passed Arbor's last pieces; Fable, Nov 22 3:20 pm: all six Arbor cells flip for train K, ARBOR flips plateau.top: plateau.top is the table's now). The [ARBOR_ON successor], verbatim:
    // const two = cells({ search: '?reorg=1&reorglift=flux.back,flux.top,plateau.top' });   // [ARBOR_ON successor]: a plateau cell still off
    const two = cells({ search: '?reorg=1&reorglift=flux.back,flux.top,plateau.front' });   // [ARBOR_ON successor 2]: front, a plateau cell still off on this branch
    const off = cells({ reorg: false, search: '?reorglift=flux.back' });
    const junk = cells({ search: '?reorg=1&reorglift=flux,back,flux.nope,nonsense.back,.back,flux.,FLUX.BACK, flux.back' });
    const M = load(src, { search: '?reorg=1&reorglift=machina.rail,-rail' });
    const hooked = load(src, { search: '?reorg=1&reorglift=flux.back', theme: 'flux' });
    return { pass: none.length === 0 && J(one) === J(['flux.back']) && J(two.slice().sort()) === J(['flux.back', 'flux.top', 'plateau.front']) && off.length === 0 && J(junk) === J(['flux.back']) && PIECES.every((p) => M.themeHas(p, 'machina')) && hooked.useReorgPiece('back') === true && hooked.useReorgPiece('rail') === false, detail: J({ none, one, two, off, junk }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(GATE); } catch (e) { baseErr = e; }
for (const k of ['TABLE', 'HOOK', 'LIFT', 'ARBOR2', 'LIFTQ']) ok(`${k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['a Flux cell is on before its frames pass', 'TABLE', (t) => t.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, rail: true },')],
  ['Machina loses a piece', 'TABLE', (t) => t.replace('  machina: { ...ALL_ON },', () => '  machina: { ...ALL_ON, uplink: false },')],
  // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty; its anchor is gone, so it no longer lands). The original, verbatim:
  // ['Arbor (the plateau theme) has a piece on', 'TABLE', (t) => t.replace('  plateau: { ...ALL_OFF },', () => '  plateau: { ...ALL_OFF, top: true },')],
  // SUPERSEDED (the Wrizors' pass 6 passed Arbor's last pieces; Fable, Nov 22 3:20 pm: all six Arbor cells flip for train K, ARBOR flips plateau.top: top is passed now, so adding it changes nothing). The [ARBOR_ON successor], verbatim:
  // ['Arbor (the plateau theme) has a piece on that the Wrizors have not passed [ARBOR_ON successor]', 'TABLE', (t) => t.replace(PLATEAU_LINE, (l) => l.replace(/\s*\},$/, ', top: true },'))],
  ['Arbor (the plateau theme) has a piece on that the Wrizors have not passed [ARBOR_ON successor 2]', 'TABLE', (t) => t.replace(PLATEAU_LINE, (l) => l.replace(/\s*\},$/, ', front: true },'))],
  ['Arbor loses a piece the Wrizors passed (the rail) [ARBOR_ON successor]', 'TABLE', (t) => t.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_OFF },')],
  ['a theme the table does not know is on', 'TABLE', (t) => t.replace('=== true', () => '!== false')],
  ['the hook ignores the switch', 'HOOK', (t) => t.replace('export const useReorgPiece: (piece: ReorgPiece) => boolean = REORG ?', () => 'export const useReorgPiece: (piece: ReorgPiece) => boolean = true ?')],
  ['the preview door is honoured with the switch off', 'LIFTQ', (t) => t.replace('const LIFT: ReadonlySet<string> = REORG && typeof location', () => 'const LIFT: ReadonlySet<string> = typeof location')],
  ['the preview door lifts a whole theme from a bare name', 'LIFTQ', (t) => t.replace("=== true || LIFT.has(", () => "=== true || [...LIFT].some((l) => l === theme || ") ],
  ['the preview door can turn a Machina piece off', 'LIFTQ', (t) => t.replace('=== true || LIFT.has(', () => '=== true && !LIFT.has(')],
  ['the Arbor column ignores the redesign flag', 'ARBOR2', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => '')],
  ['the flag also switches Machina off', 'ARBOR2', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => 'if (!arbor2Enabled()) return false;')],
  ['the hook reads one piece for every piece', 'HOOK', (t) => t.replace('(piece) => themeHas(piece, useTheme())', () => "() => themeHas('top', useTheme())")],
];
for (const [name, key, fn] of MUT) {
  const after = GATE ? fn(GATE) : GATE;
  const landed = !!GATE && after !== GATE;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

// SITES: each gate site reads the table for its own piece, and the Machina-only literal it had is gone
const SITES = [
  ['Cascade.tsx (the rail)', 'components/Cascade.tsx', "useReorgPiece('rail')", "REORG && useTheme() === 'machina'"],
  ['useReorg.ts (the top rail)', 'reorg/useReorg.ts', "useReorgPiece('top')", "useTheme() === 'machina'"],
  ['Sliver.tsx (the Front menu)', 'components/Sliver.tsx', "useReorgPiece('front')", 'useReorgTop() && !!front'],
  ['Tutor.tsx (the Back menu)', 'components/Tutor.tsx', "themeHas('back', tutorTheme)", "tutorTheme === 'machina'"],
  ['Tutor.tsx (the split)', 'components/Tutor.tsx', "themeHas('split', tutorTheme)", "{back && pageKind === 'prose' && <SplitHost"],
  ['BoardEditor.tsx (the Plan presets)', 'components/BoardEditor.tsx', "themeHas('back', theme)", "REORG && theme === 'machina' && !isSystemBoard"],
  ['PageEditor.tsx (Uplink, the publishing view)', 'pages/PageEditor.tsx', "useReorgPiece('uplink')", '{publishing ? <PublishView'],
];
const siteOk = (text, want, old) => text.includes(want) && !text.includes(old);
for (const [name, file, want, old] of SITES) {
  const text = rdSite(file);
  ok(`SITES ${name} reads the table (${want}) and the old literal is gone`, !!text && siteOk(text, want, old), J({ has: text.includes(want), oldLeft: text.includes(old) }));
  // the mutant puts the old Machina-only literal back: the census must see it
  const back = text ? text.replace(want, () => old) : '';
  ok(`MUT SITES ${name}: the old literal put back LANDS and the census goes RED`, !!text && back !== text && !siteOk(back, want, old), J({ landed: back !== text }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-THEME-GATE-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-THEME-GATE-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
