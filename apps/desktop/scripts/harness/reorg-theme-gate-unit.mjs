// THE REORG'S THEME GATE, BROWSERLESS (Fable, Nov 21, 3:20 pm: "FLUX piece 1: the four Machina-only literals behind ONE table, reorg/themeGate.ts: six pieces x theme, Machina all on, Arbor and Flux empty; a mutant per gate site; the Machina
// suites unchanged. A Flux piece is switched on in the table only when its frames pass the Wrizors."). No browser, no box. The real themeGate.ts is transpiled and run; each law is given a mutant (a text rewrite of the source) that
// must LAND and turn its own check red; the gate SITES are read as source (a census), each with a mutant that puts its old Machina-only literal back.
// The table's themes are the app's own ThemeId: 'plateau' is the theme Arbor dresses (arbor2), so its column is Arbor's.
//   TABLE  the six pieces are rail, top, front, back, split, uplink; Machina has every one; Plateau (Arbor) and Flux have none; a theme the table does not know has none
//   HOOK   useReorgPiece reads the table for the current theme under the switch, and with the switch off returns false and calls NO hook (the hook order never changes)
//   LIFT   lifting a Flux piece is ONE cell: with only flux.back flipped, exactly that cell changes and every other (piece, theme) reads as before
//   LIFTQ  (Flux piece 2, Nov 21) the PREVIEW DOOR: ?reorglift=flux.back (comma-separated theme.piece) shows a piece of a theme without flipping the table's cell, so frames and the Wrizors' review can see it; honoured only with the switch on, read once at load, a token that is not a real theme.piece is ignored, it only ADDS (Machina never loses a piece), and with no parameter nothing changes
//   ARBOR2 (Nov 21) Arbor's column is the live Arbor, the redesign (arbor2/flag.ts arbor2Enabled: on by default, ?arbor2=0 test-only): a plateau cell is on only while the redesign may run; with it off a plateau cell the table has switched on, and the preview door, read OFF; Machina and Flux do not read it
//   FLUX3  (Nick, Nov 21, 4:40 pm) the Flux column is the REDESIGN's: a Flux cell is on only when FLUX3 (?flux3=1, flux3/flag.ts) is on; with it off a Flux cell the table has switched on, and the preview door, read OFF; Machina and Arbor (plateau) do not read the flag
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
// the REAL reorg/flag.ts (the switch-over's rule lives there: REORG, REORG_ASKED, REORG_DEFAULT_ON, reorgFor), run with a page load's location: off is
// ?reorg=0, asked is ?reorg=1, the default is no query (POLISH, the bare-switch census, Nov 21: a hand stub would test the stub, not the rule)
const FLAG_SRC = rd('reorg/flag.ts');
const realFlag = (reorg, asked) => { const out = ts.transpileModule(FLAG_SRC, TS_OPTS).outputText; const m = { exports: {} };
  new Function('require', 'exports', 'module', 'location', 'window', out)((p) => { throw new Error('flag.ts imports nothing: ' + p); }, m.exports, m, { search: reorg === false ? '?reorg=0' : asked ? '?reorg=1' : '' }, undefined);
  return m.exports; };
const PIECES = ['rail', 'top', 'front', 'back', 'split', 'uplink'];
// the cells of Arbor's column the table has switched on, each only after the Wrizors passed its frames (Fable, Nov 21 9:40 pm: the rail)
// Nov 22 (Fable 3:20 pm, train K): + 'top' (ARBOR's flip). Was: const ARBOR_ON = ['rail'];
// Nov 22 (Fable 3:20 pm, train K, INK's flip): + front, back, split, uplink: all six Arbor cells are on (the Wrizors' passes 1, 2, 6 and the split and Publish). Was: const ARBOR_ON = ['rail', 'top'];
const ARBOR_ON = ['rail', 'top', 'front', 'back', 'split', 'uplink'];
// the plateau line as the table holds it, whatever cells it carries (the anchor the ARBOR2 law and its mutant rewrite)
// SUPERSEDED (Nov 22, all six on: the line is { ...ALL_ON }, no ALL_OFF in it): const PLATEAU_LINE = /  plateau: \{ \.\.\.ALL_OFF[^}\n]*\},/;
const PLATEAU_LINE = /  plateau: \{[^}\n]*\},/;   // [successor] whatever cells the line carries
const THEMES = ['machina', 'plateau', 'flux'];

function load(src, { reorg = true, theme = 'machina', calls = { n: 0 }, asked = false, search = '', arbor2 = true, flux3 = true } = {}) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const mods = { '../store/theme': { useTheme: () => { calls.n += 1; return theme; } }, './flag': realFlag(reorg, asked || /[?&]reorg=1(&|$)/.test(search)), '../arbor2/flag': { arbor2Enabled: () => arbor2 }, '../flux3/flag': { FLUX3: flux3 } };
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
  // SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm: the reorg is ON by default in Machina ONLY; Arbor and Flux keep ?reorg=1 until all six of their cells pass,
  // so a lifted Flux cell lights only when the page load ASKED: reorg/themeGate.ts reorgFor, REORG_DEFAULT_ON; POLISH, in the switch-over's merge of train H). The original, verbatim:
  // t('HOOK', () => {
  //   const on = { n: 0 }, off = { n: 0 };
  //   const A = load(src, { reorg: true, theme: 'machina', calls: on }), B = load(src, { reorg: false, theme: 'machina', calls: off });
  //   const F = load(src, { reorg: true, theme: 'flux' });
  //   const r = [A.useReorgPiece('top'), A.useReorgPiece('uplink')], f = PIECES.map((p) => F.useReorgPiece(p)), o = [B.useReorgPiece('top'), B.useReorgPiece('rail')];
  //   // one piece lifted for Flux: the hook says yes to that piece and no to the others
  //   const lifted = src.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, back: true },');
  //   const L = load(lifted, { reorg: true, theme: 'flux' });
  //   const one = PIECES.filter((p) => L.useReorgPiece(p));
  //   return { pass: r.every((x) => x === true) && on.n === 2 && f.every((x) => x === false) && o.every((x) => x === false) && off.n === 0 && J(one) === J(['back']), detail: J({ r, f, o, one, onCalls: on.n, offCalls: off.n }) };
  // });
  // [successor] the same readings, and the ruling: one Flux cell lifted lights ONLY when the page load asked (?reorg=1); unasked it stays dark
  t('HOOK2', () => {
    const on = { n: 0 }, off = { n: 0 };
    const A = load(src, { reorg: true, theme: 'machina', calls: on }), B = load(src, { reorg: false, theme: 'machina', calls: off });
    const F = load(src, { reorg: true, theme: 'flux' });
    const r = [A.useReorgPiece('top'), A.useReorgPiece('uplink')], f = PIECES.map((p) => F.useReorgPiece(p)), o = [B.useReorgPiece('top'), B.useReorgPiece('rail')];
    const lifted = src.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, back: true },');
    const Lask = load(lifted, { reorg: true, theme: 'flux', asked: true }), Lno = load(lifted, { reorg: true, theme: 'flux', asked: false });
    const one = PIECES.filter((p) => Lask.useReorgPiece(p)), dark = PIECES.filter((p) => Lno.useReorgPiece(p));
    return { pass: r.every((x) => x === true) && on.n === 2 && f.every((x) => x === false) && o.every((x) => x === false) && off.n === 0 && J(one) === J(['back']) && J(dark) === J([]),
      detail: J({ r, f, o, one, dark, onCalls: on.n, offCalls: off.n }) };
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
  // [successor] ARBOR2B (the switch-over, Fable, Nov 21, 9:40 pm and Nov 22, 3:05 am: the reorg is on by default in Machina ONLY; Arbor keeps ?reorg=1 until all six of its cells pass, so its hook lights a passed cell only when the page load asked; Actions 45047165459): the same law, Arbor's hook asked (it lights the passed cells) and not asked (it lights none)
  t('ARBOR2B', () => {
    const lifted = src.replace(PLATEAU_LINE, () => `  plateau: { ...ALL_OFF, ${ARBOR_ON.map((p) => `${p}: true, `).join('')}back: true, split: true },`);   // [ARBOR_ON successor]
    if (lifted === src) return { pass: false, detail: 'the plateau cell is not where the unit looks' };
    const on = load(lifted, { arbor2: true }), off = load(lifted, { arbor2: false });
    const cellsOf = (G, th) => PIECES.filter((p) => G.themeHas(p, th));
    const doorOff = load(src, { arbor2: false, search: '?reorg=1&reorglift=plateau.back,flux.rail,machina.rail' }), doorOn = load(src, { arbor2: true, search: '?reorg=1&reorglift=plateau.back' });
    const hooked = load(lifted, { arbor2: false, theme: 'plateau' }), hookedOn = load(lifted, { arbor2: true, theme: 'plateau', asked: true }), hookedOnNo = load(lifted, { arbor2: true, theme: 'plateau' });
    const m = load(src, { arbor2: false });
    const arborOn = PIECES.filter((p) => ARBOR_ON.includes(p) || p === 'back' || p === 'split');   // [ARBOR_ON successor]: the lifted line holds the passed cells and back, split
    // SUPERSEDED (Nov 22, Fable 3:20 pm: Arbor is ON by default now (REORG_DEFAULT_ON.plateau = true, all six cells on)): Arbor not asked lighted none; with the default on it lights its six, as when asked. The original return, verbatim:
    // return { pass: J(cellsOf(on, 'plateau')) === J(arborOn) && cellsOf(off, 'plateau').length === 0 && doorOff.themeHas('back', 'plateau') === false && doorOff.themeHas('rail', 'flux') === true && doorOn.themeHas('back', 'plateau') === true && PIECES.every((p) => m.themeHas(p, 'machina')) && PIECES.every((p) => hooked.useReorgPiece(p) === false) && J(PIECES.filter((p) => hookedOn.useReorgPiece(p))) === J(arborOn) && PIECES.every((p) => hookedOnNo.useReorgPiece(p) === false) && cellsOf(load(src, { arbor2: false }), 'plateau').length === 0, detail: J({ on: cellsOf(on, 'plateau'), off: cellsOf(off, 'plateau'), doorOff: doorOff.themeHas('back', 'plateau'), doorOn: doorOn.themeHas('back', 'plateau'), arborOn }) };
    return { pass: J(cellsOf(on, 'plateau')) === J(arborOn) && cellsOf(off, 'plateau').length === 0 && doorOff.themeHas('back', 'plateau') === false && doorOff.themeHas('rail', 'flux') === true && doorOn.themeHas('back', 'plateau') === true && PIECES.every((p) => m.themeHas(p, 'machina')) && PIECES.every((p) => hooked.useReorgPiece(p) === false) && J(PIECES.filter((p) => hookedOn.useReorgPiece(p))) === J(arborOn) && J(PIECES.filter((p) => hookedOnNo.useReorgPiece(p))) === J(arborOn) && cellsOf(load(src, { arbor2: false }), 'plateau').length === 0, detail: J({ on: cellsOf(on, 'plateau'), off: cellsOf(off, 'plateau'), doorOff: doorOff.themeHas('back', 'plateau'), doorOn: doorOn.themeHas('back', 'plateau'), arborOn }) };   // [successor] not asked: the default lights the passed cells
  });
  t('FLUX3', () => {
    const lifted = src.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, back: true, rail: true },');
    if (lifted === src) return { pass: false, detail: 'the flux cell is not where the unit looks' };
    const on = load(lifted, { flux3: true }), off = load(lifted, { flux3: false });
    const door = load(src, { flux3: false, search: '?reorg=1&reorglift=flux.back,plateau.rail,machina.rail' }), doorOn = load(src, { flux3: true, search: '?reorg=1&reorglift=flux.back' });
    const cellsOf = (G, th) => PIECES.filter((p) => G.themeHas(p, th));
    const hooked = load(lifted, { flux3: false, theme: 'flux' });
    const m = load(src, { flux3: false });
    return { pass: J(cellsOf(on, 'flux')) === J(['rail', 'back']) && cellsOf(off, 'flux').length === 0 && door.themeHas('back', 'flux') === false && door.themeHas('rail', 'plateau') === true && doorOn.themeHas('back', 'flux') === true && PIECES.every((p) => m.themeHas(p, 'machina')) && PIECES.every((p) => hooked.useReorgPiece(p) === false), detail: J({ on: cellsOf(on, 'flux'), off: cellsOf(off, 'flux'), door: door.themeHas('back', 'flux'), doorOn: doorOn.themeHas('back', 'flux') }) };
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
    // SUPERSEDED (Nov 22, all six Arbor cells on: front is the table's now, so the door cannot be seen adding it). The [ARBOR_ON successor 2], verbatim:
    // const two = cells({ search: '?reorg=1&reorglift=flux.back,flux.top,plateau.front' });   // [ARBOR_ON successor 2]: front, a plateau cell still off on this branch
    const two = cells({ search: '?reorg=1&reorglift=flux.back,flux.top,plateau.front,plateau.uplink' });   // [successor 3]: every plateau cell is the table's: the door adds only the Flux cells
    const off = cells({ reorg: false, search: '?reorglift=flux.back' });
    const junk = cells({ search: '?reorg=1&reorglift=flux,back,flux.nope,nonsense.back,.back,flux.,FLUX.BACK, flux.back' });
    const M = load(src, { search: '?reorg=1&reorglift=machina.rail,-rail' });
    const hooked = load(src, { search: '?reorg=1&reorglift=flux.back', theme: 'flux' });
    return { pass: none.length === 0 && J(one) === J(['flux.back']) && J(two.slice().sort()) === J(['flux.back', 'flux.top']) && off.length === 0 && J(junk) === J(['flux.back']) && PIECES.every((p) => M.themeHas(p, 'machina')) && hooked.useReorgPiece('back') === true && hooked.useReorgPiece('rail') === false, detail: J({ none, one, two, off, junk }) };
  });
  return R;
}

let base = null, baseErr = null;
try { base = suite(GATE); } catch (e) { baseErr = e; }
// SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm: the reorg is ON by default in Machina ONLY; Arbor and Flux keep ?reorg=1 until all six of their cells pass,
  // so a lifted Flux cell lights only when the page load ASKED: reorg/themeGate.ts reorgFor, REORG_DEFAULT_ON; POLISH, in the switch-over's merge of train H). The original, verbatim:
// for (const k of ['TABLE', 'HOOK', 'LIFT']) ok(`${k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
// [successor] HOOK reads through its successor (HOOK2: the ruling's asked / unasked lifted cell), named so in the run
// SUPERSEDED (train I, on main: the gate gained the ARBOR2 and LIFTQ laws; read with the switch-over's HOOK2). Main's line, verbatim:
// for (const k of ['TABLE', 'HOOK', 'LIFT', 'ARBOR2', 'LIFTQ']) ok(`${k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
// SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm and Nov 22, 3:05 am: the reorg is on by default in Machina ONLY; Arbor keeps ?reorg=1 until all six of its cells pass, so its hook lights a passed cell only when the page load asked; Actions 45047165459): ARBOR2 reads through ARBOR2B. The line, verbatim:
// for (const k of ['TABLE', 'HOOK2', 'LIFT', 'ARBOR2', 'LIFTQ']) ok(`${k === 'HOOK2' ? 'HOOK [successor: a lifted Flux cell lights only when asked]' : k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
// SUPERSEDED (Flux piece 2 on train K, Nov 22: the Flux column's FLUX3 law reads beside the successors; the line piece 2 carried, verbatim):
// for (const k of ['TABLE', 'HOOK', 'LIFT', 'ARBOR2', 'FLUX3', 'LIFTQ']) ok(`${k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));
for (const k of ['TABLE', 'HOOK2', 'LIFT', 'ARBOR2B', 'FLUX3', 'LIFTQ']) ok(`${k === 'HOOK2' ? 'HOOK [successor: a lifted Flux cell lights only when asked]' : k} on the real themeGate.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'themeGate.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['a Flux cell is on before its frames pass', 'TABLE', (t) => t.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, rail: true },')],
  ['Machina loses a piece', 'TABLE', (t) => t.replace('  machina: { ...ALL_ON },', () => '  machina: { ...ALL_ON, uplink: false },')],
  // SUPERSEDED (ARBOR's rail ON (Fable, Nov 21 9:40 pm: the Wrizors PASSED Arbor's rail, arbor-reorg-pass-1.md section 4; themeGate.ts plateau: { ...ALL_OFF, rail: true }): this read Arbor's column as empty; its anchor is gone, so it no longer lands). The original, verbatim:
  // ['Arbor (the plateau theme) has a piece on', 'TABLE', (t) => t.replace('  plateau: { ...ALL_OFF },', () => '  plateau: { ...ALL_OFF, top: true },')],
  // SUPERSEDED (the Wrizors' pass 6 passed Arbor's last pieces; Fable, Nov 22 3:20 pm: all six Arbor cells flip for train K, ARBOR flips plateau.top: top is passed now, so adding it changes nothing). The [ARBOR_ON successor], verbatim:
  // ['Arbor (the plateau theme) has a piece on that the Wrizors have not passed [ARBOR_ON successor]', 'TABLE', (t) => t.replace(PLATEAU_LINE, (l) => l.replace(/\s*\},$/, ', top: true },'))],
  // SUPERSEDED (Nov 22, all six on: there is no plateau cell left that the Wrizors have not passed). The [ARBOR_ON successor 2], verbatim:
  // ['Arbor (the plateau theme) has a piece on that the Wrizors have not passed [ARBOR_ON successor 2]', 'TABLE', (t) => t.replace(PLATEAU_LINE, (l) => l.replace(/\s*\},$/, ', front: true },'))],
  ['Arbor loses the Front menu the Wrizors passed [successor 3]', 'TABLE', (t) => t.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_ON, front: false },')],
  ['Arbor loses Uplink the Wrizors passed [successor 3]', 'TABLE', (t) => t.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_ON, uplink: false },')],
  ['Flux gains a piece beside Arbor\'s six [successor 3]', 'TABLE', (t) => t.replace('  flux: { ...ALL_OFF },', () => '  flux: { ...ALL_OFF, uplink: true },')],
  ['Arbor loses a piece the Wrizors passed (the rail) [ARBOR_ON successor]', 'TABLE', (t) => t.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_OFF },')],
  ['a theme the table does not know is on', 'TABLE', (t) => t.replace('=== true', () => '!== false')],
  // SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm: the reorg is ON by default in Machina ONLY; Arbor and Flux keep ?reorg=1 until all six of their cells pass,
  // so a lifted Flux cell lights only when the page load ASKED: reorg/themeGate.ts reorgFor, REORG_DEFAULT_ON; POLISH, in the switch-over's merge of train H). The originals, verbatim (the first still lands; the second's target string is gone from the hook):
  // ['the hook ignores the switch', 'HOOK', (t) => t.replace('export const useReorgPiece: (piece: ReorgPiece) => boolean = REORG ?', () => 'export const useReorgPiece: (piece: ReorgPiece) => boolean = true ?')],
  // ['the hook reads one piece for every piece', 'HOOK', (t) => t.replace('(piece) => themeHas(piece, useTheme())', () => "() => themeHas('top', useTheme())")],
  // [successors] the same two mutants against HOOK2; the second aimed at the hook as it now reads, plus the ruling's own: a theme on by default that is not Machina
  ['the hook ignores the switch', 'HOOK2', (t) => t.replace('export const useReorgPiece: (piece: ReorgPiece) => boolean = REORG ?', () => 'export const useReorgPiece: (piece: ReorgPiece) => boolean = true ?')],
  ['the hook reads one piece for every piece', 'HOOK2', (t) => t.replace('return reorgFor(t) && themeHas(piece, t);', () => "return reorgFor(t) && themeHas('top', t);")],
  ['a lifted cell lights without the ask (the switch-over ruling broken)', 'HOOK2', (t) => t.replace('return reorgFor(t) && themeHas(piece, t);', () => 'return themeHas(piece, t);')],
  // train I (on main): the preview door (LIFTQ) and the Arbor column on the redesign flag (ARBOR2)
  ['the preview door is honoured with the switch off', 'LIFTQ', (t) => t.replace('const LIFT: ReadonlySet<string> = REORG && typeof location', () => 'const LIFT: ReadonlySet<string> = typeof location')],
  ['the preview door lifts a whole theme from a bare name', 'LIFTQ', (t) => t.replace("=== true || LIFT.has(", () => "=== true || [...LIFT].some((l) => l === theme || ") ],
  ['the preview door can turn a Machina piece off', 'LIFTQ', (t) => t.replace('=== true || LIFT.has(', () => '=== true && !LIFT.has(')],
  // SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm and Nov 22, 3:05 am: the reorg is on by default in Machina ONLY; Arbor keeps ?reorg=1 until all six of its cells pass, so its hook lights a passed cell only when the page load asked; Actions 45047165459): keyed to ARBOR2. Verbatim:
  // ['the Arbor column ignores the redesign flag', 'ARBOR2', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => '')],
  ['the Arbor column ignores the redesign flag', 'ARBOR2B', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => '')],
  // SUPERSEDED (the switch-over, Fable, Nov 21, 9:40 pm and Nov 22, 3:05 am: the reorg is on by default in Machina ONLY; Arbor keeps ?reorg=1 until all six of its cells pass, so its hook lights a passed cell only when the page load asked; Actions 45047165459): keyed to ARBOR2. Verbatim:
  // ['the flag also switches Machina off', 'ARBOR2', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => 'if (!arbor2Enabled()) return false;')],
  ['the flag also switches Machina off', 'ARBOR2B', (t) => t.replace("if (theme === 'plateau' && !arbor2Enabled()) return false;", () => 'if (!arbor2Enabled()) return false;')],
  ['the Flux column ignores the redesign flag', 'FLUX3', (t) => t.replace("if (theme === 'flux' && !FLUX3) return false;", () => '')],
  ['the Flux flag also switches Machina off', 'FLUX3', (t) => t.replace("if (theme === 'flux' && !FLUX3) return false;", () => 'if (!FLUX3) return false;')],
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

// DEFAULT (Nick, Nov 22, 2:59 am, via Fable 3:05 am: "once all six Arbor pieces pass, the reorg turns on in Arbor too ... REORG_DEFAULT_ON.plateau becomes true only if all
// six plateau cells are on (a check: plateau default-on <=> every plateau cell on, with a mutant)"; POLISH, the switch-over on train I). The real flag.ts's default against
// the real table: Arbor is on by default exactly when every one of its six cells is on. Two mutants, one each way.
const flagFrom = (src) => { const out = ts.transpileModule(src, TS_OPTS).outputText; const m = { exports: {} };
  new Function('require', 'exports', 'module', 'location', 'window', out)(() => { throw new Error('flag.ts imports nothing'); }, m.exports, m, { search: '' }, undefined); return m.exports; };
const defaultLaw = (flagSrc, gateSrc) => {
  const F = flagFrom(flagSrc), G = load(gateSrc);
  const cells = G.REORG_THEME_GATE && G.REORG_THEME_GATE.plateau;
  const allOn = !!cells && PIECES.every((p) => cells[p] === true);
  return { pass: !!F.REORG_DEFAULT_ON && F.REORG_DEFAULT_ON.plateau === allOn, plateauDefault: F.REORG_DEFAULT_ON && F.REORG_DEFAULT_ON.plateau, allOn, on: cells ? PIECES.filter((p) => cells[p]) : null };
};
const dl = defaultLaw(FLAG_SRC, GATE);
ok('DEFAULT Arbor (plateau) is on by default exactly when all six of its cells are on (flag.ts REORG_DEFAULT_ON.plateau <=> every plateau cell in the table)', dl.pass, J(dl));
// SUPERSEDED (Nov 22, Fable 3:20 pm: Arbor is ON by default now (REORG_DEFAULT_ON.plateau = true, all six cells on)): the mutant started from a default that was off with a cell off. The original, verbatim:
// const flagEarly = FLAG_SRC.replace("plateau: false", () => 'plateau: true');
// ok('MUT DEFAULT Arbor turned on by default while a cell is still off: it LANDED and DEFAULT goes RED', flagEarly !== FLAG_SRC && !dl.allOn && !defaultLaw(flagEarly, GATE).pass, J({ landed: flagEarly !== FLAG_SRC, allOn: dl.allOn }));
const gateEarly = GATE.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_ON, uplink: false },');   // [successor] a cell off while the default is on
ok('MUT DEFAULT Arbor on by default while a cell is off [successor]: it LANDED and DEFAULT goes RED', gateEarly !== GATE && dl.allOn && !defaultLaw(FLAG_SRC, gateEarly).pass, J({ landed: gateEarly !== GATE, allOn: dl.allOn }));
// SUPERSEDED (Nov 22, Fable 3:20 pm: Arbor is ON by default now (REORG_DEFAULT_ON.plateau = true, all six cells on)): the original, verbatim:
// const gateAll = GATE.replace(PLATEAU_LINE, () => '  plateau: { ...ALL_ON },');
// ok('MUT DEFAULT all six plateau cells on while the default stays off: it LANDED and DEFAULT goes RED', gateAll !== GATE && !defaultLaw(FLAG_SRC, gateAll).pass, J({ landed: gateAll !== GATE }));
const flagOff = FLAG_SRC.replace('plateau: true', () => 'plateau: false');   // [successor] all six cells on while the default is off
ok('MUT DEFAULT all six plateau cells on while the default is off [successor]: it LANDED and DEFAULT goes RED', flagOff !== FLAG_SRC && !defaultLaw(flagOff, GATE).pass, J({ landed: flagOff !== FLAG_SRC }));

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 600)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-THEME-GATE-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-THEME-GATE-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
