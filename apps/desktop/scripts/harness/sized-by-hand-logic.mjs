// BUG 32c - sizedByHand, BROWSERLESS (Fable, Oct 30, #12b). The pure halves of the rule and the whole STORAGE story of the new optional Box field; sized-by-hand.mjs is the live half.
//   R10 a dealt card that SHRANK carries the cards under it back UP by exactly what it shrank (the deal's gaps survive), and its row-mates match its new height
//   R11 it is never pulled up past a card that did not move; a pass in which nothing changed returns the same array; fitting its own output changes nothing
//   R12 a card the writer sized by hand is never stretched (or shrunk) by its row, though it still counts toward the row's height
//   S1  the mark rides the box: a save of the boxes array (carryHiddenOnSave - the one write boundary of a board) keeps it, on a live box and a box carried through a tombstone round trip
//   S2  the mark survives the merge a sync pull / a stale tab's save goes through (mergeBoxLists), whichever side wins, and a JSON round trip (the jsonb the server stores)
//   S3  an edit by a build that has never heard of the field (a spread edit of x / y / text, the shape every older editor wrote) leaves it on the box
//   S4  source: the mark is set in exactly one place (the writer's own resize of a TEXT card), cleared in exactly one (the resize that lands on the content height), never by the reflow, a move, a deal or an edit
//   S5  no stored-shape plumbing strips it: the client pushes the record whole (JSON.stringify of the entry) and the server keeps `boxes` as jsonb as-is (no per-key mapping of a box anywhere in either)
// Run: node scripts/harness/sized-by-hand-logic.mjs      (browserless; no box turn)
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
const load = async (rel, mutate) => {
  const file = path.join(SRC, rel);
  const res = mutate
    ? await build({ stdin: { contents: mutate(fs.readFileSync(file, 'utf8')), resolveDir: path.dirname(file), loader: 'ts' }, bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' })
    : await build({ entryPoints: [file], bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
};
const { fitDealtRows } = await load(path.join('decks', 'rowFit.ts'));
const { mergeBoxLists, carryHiddenOnSave, tombstone, restoreBox } = await load(path.join('store', 'boxTombstones.ts'));

const W = 0.3, H = 0.105, GAP = 0.02, X = [0.03, 0.35, 0.67];
const card = (id, col, row, extra = {}) => ({ id, kind: 'text', x: X[col], y: 0.04 + row * (H + GAP), w: W, h: H, z: 1, text: id, deckStep: { deck: 't', step: id }, ...extra });
const lattice = () => [card('a0', 0, 0), card('b0', 1, 0), card('c0', 2, 0), card('a1', 0, 1), card('b1', 1, 1), card('c1', 2, 1), card('a2', 0, 2), card('b2', 1, 2), card('a3', 0, 3)];
const near = (a, b) => Math.abs(a - b) < 1e-6;
const byId = (bs, id) => bs.find((b) => b.id === id);
const setH = (bs, id, h) => bs.map((b) => (b.id === id ? { ...b, h } : b));

// R10 - the row of a1 was grown (a1 0.165, mates stretched), then a1 shrinks back: the cards under it come back up
{
  const grownRow = lattice().map((b) => (['a1', 'b1', 'c1'].includes(b.id) ? { ...b, h: 0.165 } : b)).map((b) => (['a2', 'b2'].includes(b.id) ? { ...b, y: b.y + 0.06 } : b.id === 'a3' ? { ...b, y: b.y + 0.06 } : b));
  const shrunk = fitDealtRows(grownRow, grownRow.map((b) => (['a1', 'b1', 'c1'].includes(b.id) ? { ...b, h: H } : b)));
  const orig = lattice();
  ok('R10: a shrunk row carries the cards under it back UP by exactly the shrink (a2 and a3 are where the deal put them)', near(byId(shrunk, 'a2').y, byId(orig, 'a2').y) && near(byId(shrunk, 'a3').y, byId(orig, 'a3').y), JSON.stringify([byId(shrunk, 'a2').y, byId(orig, 'a2').y]));
  ok('R10b: the other column\'s lower row follows it (b2 with a2)', near(byId(shrunk, 'b2').y, byId(shrunk, 'a2').y));
  // only a1 shrinks (its mates were never re-fit): the row's mates match the NEW tallest, the row is one band at the mates' height, and the cards under it move by what the ROW shrank
  const lone = fitDealtRows(grownRow, grownRow.map((b) => (b.id === 'a1' ? { ...b, h: H } : b)));
  ok('R10c: a lone shrink inside a row whose mates stayed tall: the row stays one band at the tallest (no ragged row) and nothing under it moves', ['a1', 'b1', 'c1'].every((id) => near(byId(lone, id).h, 0.165)) && near(byId(lone, 'a2').y, byId(grownRow, 'a2').y), JSON.stringify(['a1', 'b1', 'c1'].map((id) => byId(lone, id).h)));
  ok('R11: idempotent - fitting the output changes nothing (the same array)', fitDealtRows(shrunk, shrunk) === shrunk);
  ok('R11b: nothing changed - the SAME array comes back', fitDealtRows(grownRow, grownRow) === grownRow);
}
// R11 - never pulled up past a card that stayed
{
  // a tight spot: tb sits 0.05 under ta inside ta's height, tc is clear under BOTH; ta shrinks but tb is not a card that "sat clear below" ta - tc, which sat clear below tb only, must not move up past tb's bottom
  const a = card('ta', 0, 0, { h: 0.165 }), b = { ...card('tb', 0, 0), y: 0.09, h: H }, c = { ...card('tc', 0, 0), y: 0.04 + 0.165 + GAP };
  const before = [a, b, c]; const out = fitDealtRows(before, before.map((x) => (x.id === 'ta' ? { ...x, h: H } : x)));
  ok('R11c: a card is never pulled up past a card that did not move (tc stays clear of tb)', byId(out, 'tc').y >= byId(out, 'tb').y + byId(out, 'tb').h - 1e-6, JSON.stringify(byId(out, 'tc').y));
}
// R12 - a hand-sized card is never stretched or shrunk by its row
{
  const before = lattice().map((b) => (b.id === 'b1' ? { ...b, sizedByHand: true } : b));
  const out = fitDealtRows(before, setH(before, 'a1', 0.165));
  ok('R12: a hand-sized row-mate keeps its own height when its row grows (a1 and c1 match the tallest, b1 does not)', near(byId(out, 'a1').h, 0.165) && near(byId(out, 'c1').h, 0.165) && near(byId(out, 'b1').h, H), JSON.stringify(['a1', 'b1', 'c1'].map((id) => byId(out, id).h)));
  const tallHand = lattice().map((b) => (b.id === 'b1' ? { ...b, h: 0.2, sizedByHand: true } : b));
  const out2 = fitDealtRows(tallHand, setH(tallHand, 'a1', 0.15));
  ok('R12b: a hand-sized card still counts toward its row: the others match the TALLER of it and the grown card', near(byId(out2, 'a1').h, 0.2) && near(byId(out2, 'c1').h, 0.2) && near(byId(out2, 'b1').h, 0.2), JSON.stringify(['a1', 'b1', 'c1'].map((id) => byId(out2, id).h)));
}
// R-mutant: the carry may not be clamped at zero - clamped, the rows never come back up and R10 goes red (the mutation must LAND)
{
  const m = await load(path.join('decks', 'rowFit.ts'), (s) => { const r = s.replace('rowShift.set(k, carry ?? 0);', 'rowShift.set(k, Math.max(0, carry ?? 0));'); if (r === s) throw new Error('mutant target not found'); return r; });
  const grownRow = lattice().map((b) => (['a1', 'b1', 'c1'].includes(b.id) ? { ...b, h: 0.165 } : b)).map((b) => (['a2', 'b2', 'a3'].includes(b.id) ? { ...b, y: b.y + 0.06 } : b));
  const out = m.fitDealtRows(grownRow, grownRow.map((b) => (['a1', 'b1', 'c1'].includes(b.id) ? { ...b, h: H } : b)));
  ok('MUTANT: with the carry clamped at zero the rows do NOT come back up (R10 goes red - the mutation LANDED)', near(byId(out, 'a2').y, byId(grownRow, 'a2').y), JSON.stringify(byId(out, 'a2').y));
}

// S1 / S2 / S3 - the mark is just a key on a box object
const T = '2026-10-30T12:00:00.000Z', T2 = '2026-10-30T12:05:00.000Z';
const marked = { id: 'm1', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.4, z: 1, text: 'sized', sizedByHand: true };
const plain = { id: 'p1', kind: 'text', x: 0.5, y: 0.1, w: 0.3, h: 0.1, z: 2, text: 'auto' };
{
  const saved = carryHiddenOnSave([marked, plain], [marked, plain], T);
  ok('S1: a save of the boxes array (carryHiddenOnSave) keeps the mark, and gives the unmarked card none', byId(saved, 'm1').sizedByHand === true && !('sizedByHand' in byId(saved, 'p1')), JSON.stringify(saved));
  const tomb = tombstone(marked, T); const back = restoreBox(tomb, T2);
  ok('S1b: a card carried through delete + restore keeps its mark', tomb.sizedByHand === true && back.sizedByHand === true);
  const stale = carryHiddenOnSave([tomb], [marked], T2);
  ok('S1c: a stale editor saving over a tombstone does not lose or invent the mark', stale.length === 1 && stale[0].sizedByHand === true);
}
{
  const remote = { ...marked, x: 0.2, updatedAt: T2 }, local = { ...marked, updatedAt: T };
  const a = mergeBoxLists([remote], [local]), b = mergeBoxLists([local], [remote]);
  ok('S2: the merge (sync pull / stale tab) keeps the mark whichever side wins', a[0].sizedByHand === true && b[0].sizedByHand === true && a[0].x === 0.2 && b[0].x === 0.2);
  const clearedRemote = { id: 'm1', kind: 'text', x: 0.1, y: 0.1, w: 0.3, h: 0.1, z: 1, text: 'sized', updatedAt: T2 };
  const c = mergeBoxLists([clearedRemote], [local]);
  ok('S2b: a mark CLEARED on the newer copy stays cleared after the merge (the newer whole box wins; the key is not resurrected)', !('sizedByHand' in c[0]) && c[0].h === 0.1, JSON.stringify(c[0]));
  const wire = JSON.parse(JSON.stringify({ id: 'e', boxes: [marked, plain] }));
  ok('S2c: a JSON round trip (the record the client pushes; the jsonb the server stores) keeps `true` exactly and adds nothing', wire.boxes[0].sizedByHand === true && Object.keys(wire.boxes[0]).sort().join() === Object.keys(marked).sort().join() && !('sizedByHand' in wire.boxes[1]));
}
{
  // an OLDER build: it never reads or writes the field, it edits with spreads - move, retext, resize (its own resize wrote only w / h), then saves through the same boundary
  const olderMove = { ...marked, x: 0.2, y: 0.3 }, olderText = { ...marked, text: 'edited by an older build' }, olderResize = { ...marked, w: 0.35, h: 0.5 };
  const saved = carryHiddenOnSave([marked], [olderMove], T);
  const saved2 = carryHiddenOnSave([marked], [olderText], T);
  const saved3 = carryHiddenOnSave([marked], [olderResize], T);
  ok('S3: an older build\'s move, retext and resize of a marked card (spread edits through the same save boundary) leave the mark on the stored box', saved[0].sizedByHand === true && saved2[0].sizedByHand === true && saved3[0].sizedByHand === true);
  const pinned = carryHiddenOnSave([marked, plain], [marked, plain, { id: 'pin', kind: 'page-pin', x: 0, y: 0, w: 0.2, h: 0.1, z: 3 }], T);
  ok('S3b: an older build adding a card (another whole-array write: pin / deal) keeps every existing mark', byId(pinned, 'm1').sizedByHand === true);
}

// S4 / S5 - source: where the mark is set and cleared, and that nothing in the store or the server maps a box key by key
const norm = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const be = norm(path.join(SRC, 'components', 'BoardEditor.tsx'));
const uses = be.split('\n').map((l, i) => ({ l, i: i + 1 })).filter(({ l }) => /sizedByHand/.test(l) && !/^\s*\/\//.test(l));
const setLines = uses.filter(({ l }) => /sizedByHand: true/.test(l));
const clearLines = uses.filter(({ l }) => /const \{ sizedByHand: _s, \.\.\.rest \} = b/.test(l));
ok('S4: BoardEditor SETS the mark in exactly one place - the resize branch, for a text card only', setLines.length === 1 && /b\.kind === 'text'/.test(setLines[0].l) && /newW/.test(setLines[0].l), JSON.stringify(setLines));
ok('S4b: ... and CLEARS it in exactly one - the resize finish that landed on the content height', clearLines.length === 1);
ok('S4c: the reflow never writes the mark (no spread in it adds sizedByHand)', !/\.\.\.b, h: (targetPx|measuredPx) \/ pageWidthPx, sizedByHand/.test(be));
const types = norm(path.join(SRC, 'types', 'index.ts'));
ok('S5: the Box type declares it optional (`sizedByHand?: true`) and nothing else about boxes changed shape', /sizedByHand\?: true;/.test(types));
const persist = norm(path.join(SRC, 'store', 'persistence.ts')), sync = norm(path.join(SRC, 'store', 'sync.ts'));
ok('S5b: the client clones and pushes a journal record WHOLE (JSON round trip), with no per-key mapping of a box', /function clone<T>\(value: T\): T \{\s*return JSON\.parse\(JSON\.stringify\(value\)\) as T;/.test(persist) && /JSON\.stringify\(rec\)/.test(sync));
const serverSync = norm(path.join(DESKTOP, '..', 'server', 'src', 'sync.ts')), migrate = norm(path.join(DESKTOP, '..', 'server', 'src', 'migrate.ts'));
ok('S5c: the server keeps a board\'s boxes as ONE jsonb column, passed through as-is (migrate: `boxes jsonb`; sync: `boxes: r.boxes`)', /add column if not exists boxes jsonb/.test(migrate) && /boxes: r\.boxes \?\? undefined/.test(serverSync));

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 300)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nSIZED-BY-HAND-LOGIC VERIFY: PASS (${checks.length} checks)` : `\nSIZED-BY-HAND-LOGIC VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
