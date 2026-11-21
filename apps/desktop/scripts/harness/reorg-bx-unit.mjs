// REORG BEFORE YOU EXPORT, THE RULES, BROWSERLESS (reorg-plan-v2, INK queue item 4; the stage menus, F4: "Blocks the export (only what makes it impossible): no Part ticked to go out. Doesn't block, but is announced
// (each line a count she can click to jump to it): Parts with no words" - and the lines whose data does not exist yet are NOT built here: possible grammar or spelling issues left, Plan rows never attached to a Part,
// quotations with no source filled in, assets she chose to attach; see reorg/beforeExportRules.ts). No browser, no box: the real beforeExportRules.ts is transpiled and run; each law is given a mutant (a text rewrite of
// the source) that must LAND and turn its own check red.
//   BLOCK   nothing ticked in a Doc of two or more Parts blocks the export and says why; one tick, or a one-Part Doc (which has no ticks), blocks nothing
//   NOTE    "Parts with no words" counts only the Parts that GO OUT (an empty Part she ticked out is not announced), names them in the Doc's order, and is absent at zero; it never blocks
//   PLAN    (Nov 21; train E is live, FIX's partOfRow) "Plan rows never attached to a Part" is a count the caller reads (the rows of the open page's Plan with no Part), announced as a note BEFORE "Parts with no words" (the stage menus' order), absent at zero or on a bad count, a whole number, and never a block
//   ATTACH  (item 5b, Nov 21) the assets she ticked to attach are a REMINDER: a count beside the notes (0 when none), never a block and never a note; with the export blocked (nothing ticked to go out) there is nothing going out to remind of
//   QUIET   the answer is a pure reading: the same input twice gives the same answer, and the input is not changed
// Run: node scripts/harness/reorg-bx-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
let SRC = '';
try { SRC = lf(fs.readFileSync(new URL('../../src/reorg/beforeExportRules.ts', import.meta.url), 'utf8')); } catch { SRC = ''; }

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
function load(src) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'module', 'exports', out)((p) => { throw new Error('unstubbed import ' + p); }, m, m.exports);
  return m.exports;
}
const P = (n, empty = false) => ({ id: 'p' + n, n, heading: 'Part ' + n, empty });

function suite(src) {
  const R = {};
  const BX = load(src);
  const run = (parts, off) => { try { return BX.beforeExport(parts, new Set(off)); } catch (e) { return { threw: String(e.message) }; } };
  const three = [P(1), P(2, true), P(3)];
  // BLOCK
  {
    const none = run(three, ['p1', 'p2', 'p3']), one = run(three, ['p1', 'p3']), all = run(three, []);
    const solo = run([P(1)], []), soloOff = run([P(1)], ['p1']), nothing = run([], []);
    R.BLOCK = { pass: none.blocked === true && Array.isArray(none.blocks) && none.blocks.length === 1 && none.blocks[0].kind === 'noneTicked'
      && one.blocked === false && one.blocks.length === 0 && all.blocked === false && solo.blocked === false && soloOff.blocked === false && nothing.blocked === false,
    detail: J({ none, one, all, solo, soloOff, nothing }) };
  }
  // NOTE
  {
    const all = run(three, []), out2 = run(three, ['p2']), none = run([P(1), P(2), P(3)], []), solo = run([P(1, true)], []), blocked = run(three, ['p1', 'p2', 'p3']);
    const many = run([P(1, true), P(2), P(3, true), P(4, true)], ['p4']);
    const note = (r) => (r.notes || []).find((x) => x.kind === 'emptyParts');
    R.NOTE = { pass: !!note(all) && note(all).count === 1 && J(note(all).partIds) === J(['p2']) && all.blocked === false
      && !note(out2) && !note(none) && (none.notes || []).length === 0 && !!note(solo) && note(solo).count === 1 && J(note(solo).partIds) === J(['p1'])
      && !!note(many) && note(many).count === 2 && J(note(many).partIds) === J(['p1', 'p3']) && !note(blocked),
    detail: J({ all, out2, none, solo, many, blocked }) };
  }
  // QUIET
  {
    const parts = [P(1), P(2, true)], off = new Set(['p1']);
    const before = J(parts) + J([...off]);
    const a = J(BX.beforeExport(parts, off)), b = J(BX.beforeExport(parts, off));
    R.QUIET = { pass: a === b && before === J(parts) + J([...off]), detail: J({ a, b }) };
  }
  // PLAN
  {
    const two = BX.beforeExport(three, new Set(), 0, 2), kinds = (r) => r.notes.map((n) => n.kind).join(','), one = BX.beforeExport(three, new Set(), 0, 1);
    const zero = BX.beforeExport(three, new Set(), 0, 0), bad = [-3, NaN, 'x', undefined].map((v) => kinds(BX.beforeExport(three, new Set(), 0, v)));
    const frac = BX.beforeExport(three, new Set(), 0, 2.9), solo = BX.beforeExport([P(1)], new Set(), 0, 3);
    const note = (r) => r.notes.find((n) => n.kind === 'planRows');
    R.PLAN = { pass: kinds(two) === 'planRows,emptyParts' && note(two).count === 2 && note(one).count === 1 && two.blocked === false && kinds(zero) === 'emptyParts' && bad.every((k) => k === 'emptyParts') && note(frac).count === 2 && kinds(solo) === 'planRows' && note(solo).count === 3 && typeof two.attached === 'number', detail: J({ two, one, zero, bad, frac, solo }) };
  }
  // ATTACH
  {
    const none = run(three, []), two = BX.beforeExport(three, new Set(), 2), blocked = BX.beforeExport(three, new Set(['p1', 'p2', 'p3']), 2), odd = BX.beforeExport(three, new Set(), -1);
    R.ATTACH = { pass: none.attached === 0 && two.attached === 2 && two.blocked === false && two.notes.length === 1 && blocked.attached === 0 && odd.attached === 0, detail: J({ none, two, blocked, odd }) };
  }
  return R;
}

let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['BLOCK', 'NOTE', 'PLAN', 'ATTACH', 'QUIET']) ok(`${k} on the real beforeExportRules.ts`, !!base && base[k] && base[k].pass, base ? base[k].detail : 'beforeExportRules.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

// the mutants: [name, the check it must turn red, the rewrite]
const MUT = [
  ['the block ignores the ticks', 'BLOCK', (t) => t.replace('parts.length > 1 && going.length === 0', () => 'false')],
  ['a Doc with no Parts at all is blocked', 'BLOCK', (t) => t.replace('parts.length > 1 && going.length === 0', () => 'going.length === 0')],
  ['the empty Parts are counted among the ones ticked OUT too', 'NOTE', (t) => t.replace('const empties = going.filter', () => 'const empties = parts.filter')],
  ['a zero count is announced', 'NOTE', (t) => t.replace('if (empties.length > 0) notes.push', () => 'if (true) notes.push')],
  ['the empty Parts are listed in a changed order', 'NOTE', (t) => t.replace('partIds: empties.map((p) => p.id)', () => 'partIds: empties.map((p) => p.id).reverse()')],
  ['the attached count is not given at all', 'ATTACH', (t) => t.replace('attached: blocks.length > 0 ? 0 : Math.max(0, Math.trunc(attached))', () => 'attached: 0')],
  ['the attached count is shown while the export is blocked', 'ATTACH', (t) => t.replace('blocks.length > 0 ? 0 : Math.max(0, Math.trunc(attached))', () => 'Math.max(0, Math.trunc(attached))')],
  ['a reminder of the assets blocks the export', 'ATTACH', (t) => t.replace('const blocked = blocks.length > 0', () => 'const blocked = blocks.length > 0 || attached > 0')],
  ['the Plan rows are announced after the empty Parts', 'PLAN', (t) => t.replace("  if (rows > 0) notes.push({ kind: 'planRows', count: rows });\n", () => '').replace('  const blocked = blocks.length > 0', () => "  if (rows > 0) notes.push({ kind: 'planRows', count: rows });\n  const blocked = blocks.length > 0")],
  ['a zero count of Plan rows is announced', 'PLAN', (t) => t.replace('if (rows > 0) notes.push', () => 'if (true) notes.push')],
  ['a Plan row with no Part blocks the export', 'PLAN', (t) => t.replace('const blocked = blocks.length > 0', () => 'const blocked = blocks.length > 0 || notes.some((n) => n.kind === "planRows")')],
  ['an empty Part blocks the export', 'NOTE', (t) => t.replace('const blocked = blocks.length > 0', () => 'const blocked = blocks.length > 0 || notes.length > 0')],
];
for (const [name, key, fn] of MUT) {
  const after = SRC ? fn(SRC) : SRC;
  const landed = !!SRC && after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-BX-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-BX-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
