// BUG 32 - THE ROW-FIT RULE, BROWSERLESS (Fable, Oct 30, #12). decks/rowFit.ts is the one pure rule (fitDealtRows) behind "a dealt deck's rows fit their cards"; deck-rows.mjs is its live half.
//   R1 a pass in which no dealt card grew returns the SAME array (nothing moves, nothing is written)       R2 a grown card carries the cards under it down by exactly its growth (the deal's gaps survive)
//   R3 the shorter cards of a grown row grow to the row's height, and the row keeps ONE y               R4 the carry cascades down the column and the other columns follow their own row
//   R5 only DEALT cards (deckStep) are touched: a freeform card, a deleted card, a pin are returned as they were    R6 a card that was never stacked clear below the grown one (the deal's own tight spot) is not moved
//   R7 it is idempotent: fitting its own output changes nothing                  R8 it adds no key to any card (only x / y / h move)         R9 the editor calls it from the reflow effect (source)
// Run: node scripts/harness/deck-rows-logic.mjs      (browserless; no box turn)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

const res = await build({ entryPoints: [path.join(SRC, 'decks', 'rowFit.ts')], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
const { fitDealtRows } = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));

const W = 0.3, H = 0.105, GAP = 0.02, X = [0.03, 0.35, 0.67];
const card = (id, col, row, extra = {}) => ({ id, kind: 'text', x: X[col], y: 0.04 + row * (H + GAP), w: W, h: H, z: 1, text: id, deckStep: { deck: 't', step: id }, ...extra });
const lattice = () => [card('a0', 0, 0), card('b0', 1, 0), card('c0', 2, 0), card('a1', 0, 1), card('b1', 1, 1), card('c1', 2, 1), card('a2', 0, 2), card('b2', 1, 2), card('a3', 0, 3)];
const near = (a, b) => Math.abs(a - b) < 1e-6;
const byId = (bs, id) => bs.find((b) => b.id === id);
const grow = (bs, id, h) => bs.map((b) => (b.id === id ? { ...b, h } : b));

{ const before = lattice(); const out = fitDealtRows(before, before); ok('R1: nothing grew - the SAME array comes back', out === before); }
{
  const before = lattice(); const grown = grow(before, 'a1', 0.165); const out = fitDealtRows(before, grown);
  ok('R2: the cards under the grown one move down by exactly its growth (a2 and a3)', near(byId(out, 'a2').y, byId(before, 'a2').y + 0.06) && near(byId(out, 'a3').y, byId(before, 'a3').y + 0.06), JSON.stringify([byId(out, 'a2').y, byId(out, 'a3').y]));
  ok('R2b: the gap between a1 and a2 is the deal\'s gap again', near(byId(out, 'a2').y - (byId(out, 'a1').y + byId(out, 'a1').h), GAP));
  ok('R3: the row-mates of the grown card grow to its height and the row keeps one y', near(byId(out, 'b1').h, 0.165) && near(byId(out, 'c1').h, 0.165) && near(byId(out, 'b1').y, byId(out, 'a1').y) && near(byId(out, 'c1').y, byId(out, 'a1').y));
  ok('R4: the other columns\' lower rows follow the row (b2 moves with a2)', near(byId(out, 'b2').y, byId(out, 'a2').y));
  ok('R4b: the first row is untouched', ['a0', 'b0', 'c0'].every((id) => near(byId(out, id).y, byId(before, id).y) && near(byId(out, id).h, H)));
  const again = fitDealtRows(out, out);
  ok('R7: idempotent - fitting the output changes nothing (the same array)', again === out);
  ok('R8: no key is added to any card; only x / y / h can change', out.every((b, i) => Object.keys(b).sort().join() === Object.keys(before[i]).sort().join()));
}
{
  const before = [...lattice(), { id: 'free', kind: 'text', x: 0.03, y: 0.3, w: 0.3, h: H, z: 1, text: 'mine' }, { ...card('gone', 0, 5), deletedAt: 'x' }, { id: 'pin', kind: 'page-pin', x: 0.03, y: 0.5, w: 0.2, h: 0.1, z: 1 }];
  const out = fitDealtRows(before, grow(before, 'a1', 0.165));
  ok('R5: a freeform card, a deleted card and a pin are returned exactly as they were', ['free', 'gone', 'pin'].every((id) => byId(out, id) === byId(before, id)));
}
{
  // a tight spot the deal itself made (b stands 0.05 under a, inside a's height): growing a must not "repair" it by moving b
  const a = card('ta', 0, 0), b = { ...card('tb', 0, 0), y: 0.09 }, c = card('tc', 0, 1);
  const before = [a, b, c]; const out = fitDealtRows(before, grow(before, 'ta', 0.165));
  ok('R6: a card that never sat clear below the grown one stays where the deal put it', near(byId(out, 'tb').y, 0.09), JSON.stringify(byId(out, 'tb').y));
}
{
  // sideways neighbours that do not overlap the grown card's column are not carried by it (a staggered / circle deal)
  const l = card('l', 0, 0), r = { ...card('r', 2, 1) };
  const before = [l, r]; const out = fitDealtRows(before, grow(before, 'l', 0.165));
  ok('R6b: a card in another column, not under the grown one, is not carried', near(byId(out, 'r').y, byId(before, 'r').y));
}
const src = fs.readFileSync(path.join(SRC, 'components', 'BoardEditor.tsx'), 'utf8').replace(/\r\n/g, '\n');
// PARKED (Fable, Oct 30, #12b): R9 as first written - SUPERSEDED: a pass on a plain OPEN no longer hands the boxes to rowFit (opening saves nothing); successor R9b. Kept verbatim:
// ok('R9: BoardEditor imports fitDealtRows and the reflow effect hands it the before and the grown boxes', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /if \(changed\) setBoxes\(fitDealtRows\(boxes, next\)\);/.test(src));
// PARKED (Fable, Oct 30, #12b): R9b as first written - SUPERSEDED: rowFit now applies on screen on a plain open too (never saved on its own); successor R9c. Kept verbatim:
// ok('R9b: BoardEditor imports fitDealtRows and hands it the before and the grown boxes only when a change by the writer is waiting (boxes !== the saved mark); a plain open is corrected on screen with no rowFit', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /else setBoxes\(fitDealtRows\(boxes, next\)\);/.test(src) && /if \(boxes === lastSavedRef\.current\) \{\s*lastSavedRef\.current = next;\s*setBoxes\(next\);/.test(src));
ok('R9c: BoardEditor imports fitDealtRows and hands it the before and the grown boxes on EVERY reflow pass (a plain open too: on screen), and moves the saved mark with the result only when no change by the writer is waiting', /import \{ fitDealtRows \} from '\.\.\/decks\/rowFit';/.test(src) && /const fitted = fitDealtRows\(boxes, next\);\s*if \(boxes === lastSavedRef\.current\) lastSavedRef\.current = fitted;\s*setBoxes\(fitted\);/.test(src));
{
  // the mutant: without the carry (the rule's second half), R2 must go RED - the check can see the bug
  const mutated = fs.readFileSync(path.join(SRC, 'decks', 'rowFit.ts'), 'utf8').replace('carry = Math.max(carry, (rowShift.get(rowKey(A)) ?? 0) + growth(A));', 'carry = carry;');
  const r2 = await build({ stdin: { contents: mutated, resolveDir: path.join(SRC, 'decks'), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  const m = await import('data:text/javascript;base64,' + Buffer.from(r2.outputFiles[0].text).toString('base64'));
  const before = lattice(); const out = m.fitDealtRows(before, grow(before, 'a1', 0.165));
  ok('MUTANT: with the carry removed, the cards under the grown one do NOT move (R2 goes red - the mutation LANDED)', mutated.includes('carry = carry;') && near(byId(out, 'a2').y, byId(before, 'a2').y), JSON.stringify(byId(out, 'a2').y));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 300)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDECK-ROWS-LOGIC VERIFY: PASS (${checks.length} checks)` : `\nDECK-ROWS-LOGIC VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
