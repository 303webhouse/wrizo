// REORG COLOUR B ON ASSETS, BROWSERLESS (Fable, Nov 21, 1:40 pm: "setPartColor (and the card path) stores a slot a-f OR exactly #RRGGBB, validated; anything else refused; old names still read once as their slot"). The Parts half is COLB
// in reorg-parts-unit.mjs; this is the asset half: reorg/assetColour.ts (a card's Box.color, a page's or board's pageSettings.color through setPartColor). The real parts.ts, colourSlots.ts and assetColour.ts are transpiled and run
// over a stub store; each law is given a mutant (a text rewrite of assetColour.ts) that must LAND and turn its own check red.
//   CARD   a card's colour is a slot OR #RRGGBB, written in capitals (one spelling), stamped with the card's own updatedAt, and only that card changes; a slot replaces a hex and a hex replaces a slot; null removes the key (never null, never "")
//   REFUSE a short or long hex, no #, a stray word, an old colour name (a card never held one), an empty string: refused, nothing written; a gone card or page: false
//   SAME   the same colour again writes nothing
//   PAGE   a page's or board's colour goes through setPartColor (the one writer of that key), handed the value as it is stored (capitals)
//   READ   assetColour is the SLOT only (a hex reads none; an old name on a page reads as its slot, never on a card); assetHex is the hex only (a slot or an old name reads none); a read writes nothing
// Run: node scripts/harness/reorg-colour-hex-assets-unit.mjs   (from apps/desktop; browserless: needs no box turn)
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const lf = (s) => s.split('\r\n').join('\n');
const rd = (p) => lf(fs.readFileSync(new URL('../../src/reorg/' + p, import.meta.url), 'utf8'));
const TS_OPTS = { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } };
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const J = (v) => JSON.stringify(v);
const clone = (v) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));

function run(src, mods) {
  const out = ts.transpileModule(src, TS_OPTS).outputText;
  const m = { exports: {} };
  new Function('require', 'exports', 'module', out)((p) => { if (!(p in mods)) throw new Error('unstubbed import ' + p); return mods[p]; }, m.exports, m);
  return m.exports;
}
// the real parts.ts: every import of it is only used inside functions this file never calls, so each is a stub that throws if it is
const BOOM = new Proxy({}, { get: (_t, k) => (k === '__esModule' ? false : () => { throw new Error('parts.ts import used: ' + String(k)); }) });
const PARTS_MODS = new Proxy({ '../types': { PAGE_SETTINGS_FALLBACK: {} } }, { has: () => true, get: (t, k) => (k in t ? t[k] : BOOM) });
const PARTS = run(rd('parts.ts'), PARTS_MODS);
const SLOTS = run(rd('colourSlots.ts'), { './parts': PARTS });

function load(src) {
  const S = { entries: new Map(), saved: [], partCalls: [] };
  const mods = {
    '../store/persistence': { getJournalEntry: (id) => (S.entries.has(id) ? clone(S.entries.get(id)) : null), saveBoardBoxes: (id, boxes) => { S.saved.push({ id, boxes: clone(boxes) }); const e = S.entries.get(id); S.entries.set(id, { ...e, boxes: clone(boxes) }); } },
    '../store/boxTombstones': { liveBoxes: (b) => (b ?? []).filter((x) => !x.deletedAt && !x.purgedAt) },
    './parts': { ...PARTS, setPartColor: (id, c) => { S.partCalls.push([id, c]); return true; } },
    './colourSlots': SLOTS,
  };
  const A = run(src, mods);
  S.entries.set('board1', { id: 'board1', pageType: 'board', boxes: [{ id: 'c1', kind: 'text', text: 'one' }, { id: 'c2', kind: 'text', text: 'two', color: 'b' }, { id: 'c3', kind: 'text', text: 'three', deletedAt: '2026-01-01T00:00:00.000Z' }] });
  S.entries.set('page1', { id: 'page1', pageType: 'manuscript', text: 'words', pageSettings: {} });
  return { A, S };
}
const boxOf = (L, id) => L.S.entries.get('board1').boxes.find((b) => b.id === id);

function suite(src) {
  const R = {};
  const t = (name, fn) => { try { R[name] = fn(); } catch (e) { R[name] = { pass: false, detail: 'THREW ' + String(e.message).slice(0, 160) }; } };
  const card = (id) => ({ entryId: 'board1', boxId: id });
  t('CARD', () => {
    const L = load(src);
    const a = L.A.setAssetColour(card('c1'), '#3a7bd5');
    const c1 = boxOf(L, 'c1'), other = boxOf(L, 'c2');
    const stamped = typeof c1.updatedAt === 'string' && c1.updatedAt.length > 0;
    L.A.setAssetColour(card('c1'), 'd'); const slotAfter = { color: boxOf(L, 'c1').color };
    L.A.setAssetColour(card('c1'), '#00AAFF'); const hexAfter = { color: boxOf(L, 'c1').color };
    L.A.setAssetColour(card('c1'), null); const cleared = boxOf(L, 'c1'); const clearedOk = !('color' in cleared) && J(cleared).indexOf('null') < 0 && J(cleared).indexOf('""') < 0;
    return { pass: a === true && c1.color === '#3A7BD5' && stamped && other.color === 'b' && slotAfter.color === 'd' && hexAfter.color === '#00AAFF' && clearedOk, detail: J({ a, c1, other, slotAfter, hexAfter, cleared }) };
  });
  t('REFUSE', () => {
    const L = load(src);
    const bad = ['#FFF', '#12345', '#1234567', '3a7bd5', 'blue', 'moss', 'clay', '', ' #3A7BD5', 'g'].map((v) => L.A.setAssetColour(card('c1'), v));
    const gone = L.A.setAssetColour(card('c3'), '#3A7BD5'), noCard = L.A.setAssetColour(card('nope'), 'a'), noPage = L.A.setAssetColour({ entryId: 'nobody' }, '#3A7BD5');
    const pageBad = L.A.setAssetColour({ entryId: 'page1' }, '#12');
    return { pass: bad.every((b) => b === false) && gone === false && noCard === false && noPage === false && L.S.saved.length === 0 && pageBad === false && L.S.partCalls.length === 0, detail: J({ bad, gone, noCard, noPage, pageBad, saved: L.S.saved.length, calls: L.S.partCalls }) };
  });
  t('SAME', () => {
    const L = load(src);
    L.A.setAssetColour(card('c1'), '#3A7BD5');
    const n = L.S.saved.length;
    const again = L.A.setAssetColour(card('c1'), '#3a7bd5');
    const slotSame = L.A.setAssetColour(card('c2'), 'b');
    return { pass: again === true && slotSame === true && L.S.saved.length === n, detail: J({ again, slotSame, n, now: L.S.saved.length }) };
  });
  t('PAGE', () => {
    const L = load(src);
    L.A.setAssetColour({ entryId: 'page1' }, '#3a7bd5');
    L.A.setAssetColour({ entryId: 'page1' }, 'e');
    L.A.setAssetColour({ entryId: 'page1' }, null);
    return { pass: J(L.S.partCalls) === J([['page1', '#3A7BD5'], ['page1', 'e'], ['page1', null]]) && L.S.saved.length === 0, detail: J({ calls: L.S.partCalls }) };
  });
  t('READ', () => {
    const L = load(src);
    const w = () => L.S.saved.length + L.S.partCalls.length;
    const was = w();
    const set = (id, color) => L.S.entries.set(id, { ...L.S.entries.get(id), pageSettings: { color } });
    const page = {};
    for (const v of ['#3a7bd5', 'moss', 'c', '#12345', 'plum2']) { set('page1', v); page[v] = { slot: L.A.assetColour({ entryId: 'page1' }), hex: L.A.assetHex({ entryId: 'page1' }) }; }
    const e = L.S.entries.get('board1');
    L.S.entries.set('board1', { ...e, boxes: [{ id: 'k1', kind: 'text', color: '#3a7bd5' }, { id: 'k2', kind: 'text', color: 'moss' }, { id: 'k3', kind: 'text', color: 'c' }, { id: 'k4', kind: 'text', color: '#12' }, { id: 'k5', kind: 'text', color: '#00ff00', deletedAt: '2026-01-01T00:00:00.000Z' }] });
    const cards = Object.fromEntries(['k1', 'k2', 'k3', 'k4', 'k5'].map((k) => [k, { slot: L.A.assetColour(card(k)), hex: L.A.assetHex(card(k)) }]));
    const gone = { slot: L.A.assetColour({ entryId: 'nobody' }), hex: L.A.assetHex({ entryId: 'nobody' }) };
    const want = {
      page: { '#3a7bd5': { slot: null, hex: '#3A7BD5' }, moss: { slot: 'c', hex: null }, c: { slot: 'c', hex: null }, '#12345': { slot: null, hex: null }, plum2: { slot: null, hex: null } },
      cards: { k1: { slot: null, hex: '#3A7BD5' }, k2: { slot: null, hex: null }, k3: { slot: 'c', hex: null }, k4: { slot: null, hex: null }, k5: { slot: null, hex: null } },
    };
    return { pass: J(page) === J(want.page) && J(cards) === J(want.cards) && gone.slot === null && gone.hex === null && w() === was, detail: J({ page, cards, gone }) };
  });
  return R;
}

const SRC = rd('assetColour.ts');
let base = null, baseErr = null;
try { base = suite(SRC); } catch (e) { baseErr = e; }
for (const k of ['CARD', 'REFUSE', 'SAME', 'PAGE', 'READ']) ok(`${k} on the real assetColour.ts`, !!base && base[k] && base[k].pass, base && base[k] ? base[k].detail : 'assetColour.ts: ' + (baseErr ? String(baseErr.message).slice(0, 160) : 'missing'));

const MUT = [
  ['a card keeps the hex as typed (lower case)', 'CARD', (t) => t.replace('const value = colour === null ? null : colourToStore(colour);', () => 'const value = colour === null ? null : (colour as string);')],
  ['an invalid colour is written to a card', 'REFUSE', (t) => t.replace('if (colour !== null && value === null) return false;', () => '')],
  ['the same hex again is written again', 'SAME', (t) => t.replace('if ((card.color ?? null) === value) return true;', () => '')],
  ['a page is handed the colour as typed, not as stored', 'PAGE', (t) => t.replace('setPartColor(asset.entryId, value)', () => 'setPartColor(asset.entryId, colour as never)')],
  ['a card reads its hex as a slot too', 'READ', (t) => t.replace('return b && isColourSlot(b.color) ? b.color : null;', () => 'return b && (isColourSlot(b.color) || colorHex(b.color)) ? (b.color as never) : null;')],
  ['assetHex reads a slot as a hex', 'READ', (t) => t.replace('return b ? colorHex(b.color) : null;', () => 'return b ? ((b.color as never) ?? null) : null;')],
];
for (const [name, key, fn] of MUT) {
  const after = fn(SRC);
  const landed = after !== SRC;
  let res = null, err = null;
  try { res = landed ? suite(after) : null; } catch (e) { err = e; }
  const red = !!res && res[key] && res[key].pass === false;
  ok(`MUT ${name}: it LANDED and ${key} goes RED`, landed && !err && red, J({ landed, err: err && String(err.message).slice(0, 120), key, pass: res && res[key] && res[key].pass }));
}

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + String(c.detail).slice(0, 700)}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nREORG-COLOUR-HEX-ASSETS-UNIT VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nREORG-COLOUR-HEX-ASSETS-UNIT VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
