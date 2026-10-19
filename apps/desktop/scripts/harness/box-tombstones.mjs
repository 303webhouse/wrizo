// BOX TOMBSTONES (board-context-menu; Fable/Nick, Oct 15) - BROWSERLESS. A card deleted from a board is NOT removed from its `boxes`: it is stamped `deletedAt` IN PLACE (zero schema), hidden from every
// reader (liveBoxes), listed on the Trash board, restorable, and permanently deletable into an id-only marker. This file runs the REAL persistence.ts + boxTombstones.ts (bundled with esbuild against a
// fake browser - the drafts-integrity pattern) and proves, with mutants that each turn the right check RED:
//
//   T1  stash stamps the card (deletedAt + updatedAt) and touches nothing else - not the other cards, not the connection hanging off it; liveBoxes hides the card AND that connection
//   T2  the WRITE BOUNDARY: an editor autosave (live boxes only) can never strip a tombstone or the connection hanging off it
//   T3  a STALE view of a deleted card (an editor that still holds it live) cannot resurrect it
//   T4  an explicit Undo (the id named to the save) brings it back live, stamped newer than the tombstone, its connection live again
//   T5  Restore from Trash clears the flag and the connection returns with it; a second Restore is a no-op
//   T6  a permanent delete leaves ONLY an id-only marker (plus zeros); a stale save cannot resurrect it; it cannot be restored; it is not listed
//   T7  the Trash lists tombstoned CARDS of live ordinary boards - not purged ones, not those of a board that is itself in Trash
//   T8  the Trash board's reconcile gives each its card (trashedFrom), idempotently, and drops it when restored
//   T9  SYNC MERGE BY PER-BOX CHANGE TIME: a stale tab's save cannot strip a newer tombstone; a newer Restore beats an older tombstone and a newer tombstone beats an older live copy; a purge is final; a
//       hard delete behaves exactly as entry-level last-writer-wins always did; the merge applies when the remote wins AND when a local unsynced edit wins - and a survivor travels back (marked unsynced)
//   T10 membership readers skip tombstones: a tombstoned pin is no longer "pinned", and pinning again makes a live one
//   T11 THE READERS GUARD (source): every raw read of a board's `.boxes` in src is accounted for - a NEW one fails until it goes through liveBoxes or is added here with its reason
//
// Browserless. Run: node scripts/harness/box-tombstones.mjs   (from apps/desktop)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const SRC = path.join(DESKTOP, 'src');
const require = createRequire(path.join(DESKTOP, 'package.json'));
const { build } = createRequire(require.resolve('vite'))('esbuild');
const noCR = (t) => t.replace(/\r\n?/g, '\n');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

let nonce = 0;
async function load(overrides = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __nonce = ${nonce};\nexport * from './store/persistence';\nexport * from './store/boxTombstones';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'ov', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, (args) => {
        const rel = path.relative(SRC, args.path).split('\\').join('/');
        const text = noCR(fs.readFileSync(args.path, 'utf8'));
        return { contents: overrides[rel] ? overrides[rel](text) : text, loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  const mod = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
  return mod;
}

const T1 = '2026-01-01T00:00:00.000Z', T2 = '2026-06-01T00:00:00.000Z', T3 = '2027-01-01T00:00:00.000Z', REMOTE_NEWER = '2030-01-01T00:00:00.000Z';
const card = (id, extra = {}) => ({ id, kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: id, ...extra });
const conn = (id, a, b) => ({ id, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z: 9, connA: a, connB: b });
const seed = (m, id, boxes, extra = {}) => m.createJournalPage({ id, text: id, pageType: 'board', origin: null, source: null, boxes, ...extra });
const byId = (boxes, id) => (boxes || []).find((b) => b.id === id);
const stored = (m, id) => m.getJournalEntry(id)?.boxes ?? [];

// the whole suite, as a function of the module under test, returning a keyed result map (so a mutant run can be asked WHICH check went red)
async function suite(m) {
  const r = {};
  const keep = (k, pass, detail = '') => { r[k] = { pass: !!pass, detail }; };

  // ---- T1 stash
  seed(m, 'bd1', [card('A'), card('B'), conn('AB', 'A', 'B')]);
  const done = m.stashDeletedBoxes('bd1', ['A', 'AB']);
  let s = stored(m, 'bd1');
  keep('T1a', done.length === 1 && done[0] === 'A' && !!byId(s, 'A').deletedAt && byId(s, 'A').updatedAt === byId(s, 'A').deletedAt && !byId(s, 'B').deletedAt && !byId(s, 'AB').deletedAt && !byId(s, 'AB').updatedAt, JSON.stringify({ done, A: byId(s, 'A') }));
  const live1 = m.liveBoxes(s).map((b) => b.id).sort();
  keep('T1b', JSON.stringify(live1) === JSON.stringify(['B']), JSON.stringify(live1));
  const tombA = byId(s, 'A').deletedAt;

  // ---- T2 write boundary: an editor holds [B] only
  m.saveBoardBoxes('bd1', [card('B')]);
  s = stored(m, 'bd1');
  keep('T2', byId(s, 'A')?.deletedAt === tombA && !!byId(s, 'AB') && !!byId(s, 'B') && s.length === 3, JSON.stringify(s.map((b) => [b.id, !!b.deletedAt])));

  // ---- T3 stale view
  m.saveBoardBoxes('bd1', [card('A'), card('B')]);
  s = stored(m, 'bd1');
  keep('T3', byId(s, 'A')?.deletedAt === tombA, JSON.stringify(byId(s, 'A')));

  // ---- T4 explicit Undo
  m.saveBoardBoxes('bd1', [card('A'), card('B'), conn('AB', 'A', 'B')], ['A']);
  s = stored(m, 'bd1');
  const a4 = byId(s, 'A');
  keep('T4', !!a4 && !a4.deletedAt && a4.updatedAt >= tombA && m.liveBoxes(s).map((b) => b.id).sort().join() === 'A,AB,B', JSON.stringify(a4));

  // ---- T5 restore from Trash
  m.stashDeletedBoxes('bd1', ['A']);
  const r1 = m.restoreDeletedBox('bd1', 'A'), r2 = m.restoreDeletedBox('bd1', 'A');
  s = stored(m, 'bd1');
  keep('T5', r1 === true && r2 === false && !byId(s, 'A').deletedAt && !!byId(s, 'A').updatedAt && m.liveBoxes(s).map((b) => b.id).sort().join() === 'A,AB,B', JSON.stringify({ r1, r2 }));

  // ---- T6 purge
  m.stashDeletedBoxes('bd1', ['B']);
  const p1 = m.purgeDeletedBox('bd1', 'B');
  s = stored(m, 'bd1');
  const marker = byId(s, 'B');
  const markerKeys = Object.keys(marker || {}).sort().join();
  m.saveBoardBoxes('bd1', [card('A'), card('B')]);
  const afterStale = byId(stored(m, 'bd1'), 'B');
  keep('T6a', p1 === true && markerKeys === ['h', 'id', 'kind', 'purgedAt', 'w', 'x', 'y', 'z'].sort().join() && !marker.text, markerKeys);
  keep('T6b', !!afterStale?.purgedAt && !afterStale.text && m.restoreDeletedBox('bd1', 'B') === false && !m.getTrashedCards().some((t) => t.box.id === 'B'), JSON.stringify(afterStale));

  // ---- T7 Trash listing
  seed(m, 'bd2', [card('X'), card('Y')]);
  m.stashDeletedBoxes('bd2', ['X']);
  seed(m, 'bd3', [card('Z')]);
  m.stashDeletedBoxes('bd3', ['Z']);
  m.softDeleteEntry('bd3');
  m.stashDeletedBoxes('bd1', ['A']);
  const listed = m.getTrashedCards().map((t) => `${t.boardId}:${t.box.id}`).sort();
  keep('T7', JSON.stringify(listed) === JSON.stringify(['bd1:A', 'bd2:X']), JSON.stringify(listed));

  // ---- T8 Trash board reconcile
  const tb = m.getOrCreateSystemBoard('trash');
  const rec = m.reconcileSystemBoard(tb.id);
  const pins = (rec || []).filter((b) => b.kind === 'page-pin' && b.trashedFrom).map((b) => `${b.trashedFrom.boardId}:${b.trashedFrom.boxId}`).sort();
  m.saveBoardBoxes(tb.id, rec || []);
  const rec2 = m.reconcileSystemBoard(tb.id);
  m.restoreDeletedBox('bd2', 'X');
  const rec3 = m.reconcileSystemBoard(tb.id);
  const left = (rec3 || []).filter((b) => b.trashedFrom).map((b) => `${b.trashedFrom.boardId}:${b.trashedFrom.boxId}`).sort();
  keep('T8', JSON.stringify(pins) === JSON.stringify(['bd1:A', 'bd2:X']) && rec2 === null && JSON.stringify(left) === JSON.stringify(['bd1:A']), JSON.stringify({ pins, rec2: rec2 === null, left }));

  // ---- T9 sync merge by per-box change time
  const remoteOf = (id, boxes) => ({ ...m.getJournalEntry(id), id, boxes, updatedAt: REMOTE_NEWER });
  const cleanLocal = (id, boxes) => { seed(m, id, []); m.saveJournalEntry({ ...m.getJournalEntry(id), boxes }); m.markClean([{ collection: 'journalEntries', id }]); };
  const dirtyIds = () => new Set((m.getDirtyRecords().journalEntries || []).map((e) => e.id));
  // (a) a stale tab's save (live, unstamped copy of a card someone deleted) arrives as the NEWER entry: the tombstone stands, and it travels back
  cleanLocal('m1', [card('x'), card('t', { deletedAt: T2, updatedAt: T2 })]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m1', [card('x'), card('t')])] });
  let mb = stored(m, 'm1');
  keep('T9a', !!byId(mb, 't')?.deletedAt && dirtyIds().has('m1'), JSON.stringify({ t: byId(mb, 't'), dirty: dirtyIds().has('m1') }));
  // (b) a newer Restore (remote) beats an older tombstone (local)
  cleanLocal('m2', [card('t', { deletedAt: T1, updatedAt: T1 })]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m2', [card('t', { updatedAt: T3 })])] });
  mb = stored(m, 'm2');
  keep('T9b', !byId(mb, 't').deletedAt && byId(mb, 't').updatedAt === T3, JSON.stringify(byId(mb, 't')));
  // (c) a newer tombstone (remote) beats an older live copy (local)
  cleanLocal('m3', [card('t', { updatedAt: T1 })]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m3', [card('t', { deletedAt: T3, updatedAt: T3 })])] });
  mb = stored(m, 'm3');
  keep('T9c', byId(mb, 't').deletedAt === T3, JSON.stringify(byId(mb, 't')));
  // (d) a purge is final, whoever is newer
  cleanLocal('m4', [{ id: 't', kind: 'text', x: 0, y: 0, w: 0, h: 0, z: 0, purgedAt: T1 }]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m4', [card('t', { updatedAt: T3 })])] });
  mb = stored(m, 'm4');
  keep('T9d', !!byId(mb, 't').purgedAt && !byId(mb, 't').text, JSON.stringify(byId(mb, 't')));
  // (e) a hard delete is still entry-level last-writer-wins: the winner's list stands (a live box only the loser has stays gone; one only the winner has stays)
  cleanLocal('m5', [card('local-only'), card('shared')]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m5', [card('shared'), card('remote-only')])] });
  mb = stored(m, 'm5');
  keep('T9e', mb.map((b) => b.id).sort().join() === 'remote-only,shared' && !dirtyIds().has('m5'), JSON.stringify(mb.map((b) => b.id)));
  // (f) a local UNSYNCED edit wins the entry - but a newer remote tombstone still lands in it (and it stays unsynced)
  seed(m, 'm6', []);
  m.saveJournalEntry({ ...m.getJournalEntry('m6'), boxes: [card('t'), card('keep')] });
  m.applyRemoteRecords({ journalEntries: [remoteOf('m6', [card('t', { deletedAt: T3, updatedAt: T3 })])] });
  mb = stored(m, 'm6');
  keep('T9f', !!byId(mb, 't').deletedAt && !!byId(mb, 'keep') && dirtyIds().has('m6'), JSON.stringify(mb.map((b) => [b.id, !!b.deletedAt])));
  // (g) the unstamped, never-deleted world is byte-identical: no tombstones anywhere -> the remote entry is stored as it came (not marked unsynced)
  cleanLocal('m7', [card('p'), card('q')]);
  m.applyRemoteRecords({ journalEntries: [remoteOf('m7', [card('p'), card('q'), card('r')])] });
  keep('T9g', stored(m, 'm7').length === 3 && !dirtyIds().has('m7'), JSON.stringify(stored(m, 'm7').map((b) => b.id)));

  // ---- T10 membership readers
  seed(m, 'pg1', []); seed(m, 'bd4', [], {});
  m.pinPageToBoard('pg1', 'bd4', { display: true });
  const pinBox = stored(m, 'bd4').find((b) => b.kind === 'page-pin' && b.entryId === 'pg1');
  const before = m.getBoardsPinning('pg1').map((x) => x.id);
  m.stashDeletedBoxes('bd4', [pinBox.id]);
  const during = m.getBoardsPinning('pg1').map((x) => x.id);
  m.pinPageToBoard('pg1', 'bd4', { display: true });
  const live10 = m.liveBoxes(stored(m, 'bd4')).filter((b) => b.kind === 'page-pin' && b.entryId === 'pg1').length;
  keep('T10', before.includes('bd4') && !during.includes('bd4') && live10 === 1, JSON.stringify({ before, during, live10 }));
  // ---- T12 a Page / board delete is SOFT (Fable, Oct 15: "prove a Page/board delete still soft-deletes - deletedAt, appears in Trash, Restore works")
  seed(m, 'sd-page', [], { pageType: undefined });
  seed(m, 'sd-board', [card('Q')]);
  m.softDeleteEntry('sd-page'); m.softDeleteEntry('sd-board');
  const rowOf = (id) => JSON.parse(globalThis.localStorage.getItem('writer-studio-journal-entries') || '[]').find((e) => e.id === id);
  m.flushNow();
  const deletedIds = m.getDeletedEntries().map((e) => e.id);
  const tb2 = m.getOrCreateSystemBoard('trash');
  const rec12 = m.reconcileSystemBoard(tb2.id) || [];
  const pagePins = rec12.filter((b) => b.kind === 'page-pin' && b.entryId).map((b) => b.entryId);
  keep('T12a', !!rowOf('sd-page')?.deletedAt && !!rowOf('sd-board')?.deletedAt && (rowOf('sd-board').boxes || []).length === 1 && deletedIds.includes('sd-page') && deletedIds.includes('sd-board') && pagePins.includes('sd-page') && pagePins.includes('sd-board'), JSON.stringify({ deletedIds, pagePins }));
  m.restoreEntry('sd-page'); m.restoreEntry('sd-board'); m.flushNow();
  keep('T12b', !rowOf('sd-page')?.deletedAt && !rowOf('sd-board')?.deletedAt && !m.getDeletedEntries().some((e) => e.id === 'sd-page' || e.id === 'sd-board'), JSON.stringify({ page: rowOf('sd-page')?.deletedAt, board: rowOf('sd-board')?.deletedAt }));
  return r;
}

// ---- the readers guard (T11): raw reads of `.boxes`, per file, in src - comments stripped
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
function walk(dir, out = []) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name); if (e.isDirectory()) walk(p, out); else if (/\.(ts|tsx)$/.test(e.name)) out.push(p); } return out; }
function rawReads(srcDir, mutate = {}) {
  const out = {};
  for (const f of walk(srcDir)) {
    const rel = path.relative(srcDir, f).split('\\').join('/');
    const text = noCR(fs.readFileSync(f, 'utf8'));
    const lines = stripComments(mutate[rel] ? mutate[rel](text) : text).split('\n');
    let n = 0;
    for (const l of lines) {
      // a read of an entry's boxes that does NOT go through liveBoxes( on the same line
      for (const m of l.matchAll(/\.boxes\b/g)) { void m; if (!/liveBoxes\(/.test(l)) n += 1; }
    }
    if (n) out[rel] = n;
  }
  return out;
}
// The accounted-for raw reads: each is a read that must see EVERYTHING stored (a read-modify-write that preserves tombstones, a board-meta lookup, the system boards, the persistence layer's own seam).
const RAW_BASELINE = {
  // persistence.ts (30): the write boundary and the three acts (they must see everything stored), the Trash listing and one tombstone read, read-modify-write paths that SPREAD the stored boxes (so they carry
  // tombstones; each takes its geometry / membership decisions from liveBoxes), board-meta lookups, the system-board reconcile (no tombstones live on a system board), the sync merge, the seeding write, and the seams.
  'store/persistence.ts': 31,        // 30 + connector-b's describeEnd, which reads the OTHER end's box and refuses a tombstoned / purged one itself
  'components/ConnectionsDrawerPanel.tsx': 1,   // connector-b: the board's own published snapshot (the editor's LIVE boxes), handed to getLinkPeersOfCard
  'components/BoardEditor.tsx': 2,   // the board-meta lookup on open; a deck result's boxes (not stored ones)
  'pages/CreateProject.tsx': 1,      // a deck result's boxes
  'store/boardStructure.ts': 1,      // a spread of the caller's own list
  'store/pageExport.ts': 1,          // the board-meta lookup (lane titles) - the cards themselves go through liveBoxes
  'store/unbornPage.ts': 3,          // building a NEW page's boxes (writes)
};

const base = await load();
const res0 = await suite(base);
for (const [k, v] of Object.entries(res0)) ok(`${k} (baseline)`, v.pass, v.detail);

// the mutants: each must turn a SPECIFIC check red (and prove it landed)
const MUT = [
  ['liveBoxes forgets connections hang off a hidden card', 'store/boxTombstones.ts', (t) => t.replace("if (b.kind === 'connection' && ((b.connA && hidden.has(b.connA)) || (b.connB && hidden.has(b.connB)))) return false;", ''), ['T1b']],
  ['the save boundary stops carrying hidden boxes', 'store/boxTombstones.ts', (t) => t.replace('return [...kept, ...stashed];', 'return kept;'), ['T2']],
  ['a stale view resurrects a tombstoned card', 'store/boxTombstones.ts', (t) => t.replace('kept.push(c);                                                    // a stale view of a card someone deleted: the tombstone stands', 'kept.push(b);'), ['T3']],
  ['an explicit Undo does not stamp the restored card', 'store/boxTombstones.ts', (t) => t.replace('return { ...rest, updatedAt: now };', 'return { ...rest };'), ['T4']],
  ['a purge marker is no longer final in a merge', 'store/boxTombstones.ts', (t) => t.replace('if (isPurged(s)) { out.push(s); continue; }', ''), ['T9d']],
  ['the merge ignores the per-box change time', 'store/boxTombstones.ts', (t) => t.replace('out.push(changedAt(s) > changedAt(p) ? s : p);', 'out.push(p);'), ['T9a', 'T9f']],
  ['the sync pull never merges boxes', 'store/persistence.ts', (t) => t.split('mergeBoxLists(').join('((a) => a)('), ['T9a', 'T9f']],
  ['the Trash board forgets deleted cards', 'store/persistence.ts', (t) => t.replace("const trashedNow = kind === 'trash' ? getTrashedCards() : [];", 'const trashedNow: ReturnType<typeof getTrashedCards> = [];'), ['T8']],
  ['getBoardsPinning counts a tombstoned pin', 'store/persistence.ts', (t) => t.replace('liveBoxes(e.boxes).some(b => b.kind === \'page-pin\' && b.entryId === entryId))\n    .map(e => ({ id: e.id, title:', '(e.boxes ?? []).some(b => b.kind === \'page-pin\' && b.entryId === entryId))\n    .map(e => ({ id: e.id, title:'), ['T10']],
];
for (const [name, file, fn, expectRed] of MUT) {
  const orig = noCR(fs.readFileSync(path.join(SRC, file), 'utf8'));
  const mutated = fn(orig);
  const landed = mutated !== orig;
  let red = [];
  if (landed) { const mm = await load({ [file]: fn }); const rr = await suite(mm); red = Object.entries(rr).filter(([, v]) => !v.pass).map(([k]) => k); }
  ok(`MUTANT "${name}": the mutation landed and turns ${expectRed.join(' + ')} RED (and only checks that rely on it)`, landed && expectRed.every((k) => red.includes(k)), JSON.stringify({ landed, red }));
}

// T11 - the readers guard
{
  const now = rawReads(SRC);
  const keys = new Set([...Object.keys(now), ...Object.keys(RAW_BASELINE)]);
  const drift = [...keys].filter((k) => (now[k] || 0) !== (RAW_BASELINE[k] || 0)).map((k) => `${k}: now ${now[k] || 0}, accounted ${RAW_BASELINE[k] || 0}`);
  ok('T11: every raw read of a board\'s `.boxes` in src is ACCOUNTED FOR (through liveBoxes, or in this file\'s baseline with its reason) - a new reader fails here until it is one or the other', drift.length === 0, drift.join(' | ') || `${Object.keys(now).length} files`);
  const withNew = rawReads(SRC, { 'store/pageExport.ts': (t) => `${t}\nexport const sneaky = (e: { boxes?: unknown[] }) => e.boxes;\n` });
  const drift2 = Object.keys(withNew).filter((k) => (withNew[k] || 0) !== (RAW_BASELINE[k] || 0));
  ok('T11 (mutant): a NEW raw reader of `.boxes` added to a file turns the guard RED (the mutation landed)', drift2.includes('store/pageExport.ts'), JSON.stringify(drift2));
}

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : `  [${c.detail}]`}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nBOX-TOMBSTONES VERIFY: PASS (${checks.length} checks)` : `\nBOX-TOMBSTONES VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
