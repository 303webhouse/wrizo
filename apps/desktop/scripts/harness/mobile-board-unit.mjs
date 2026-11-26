// MOBILE slice 1 (MOBILE-B, Nov 26) - THE MOBILE BOARD (Fable's ruling (b), Nov 24) AND WHAT "SENT" MEANS. RED FIRST: written while src/mobile/mobileBoard.ts was a held stub.
// The ruling: an unfiled phone note goes to the Board named exactly "Mobile" (spaces trimmed, same case) in Unfiled, the earliest-made if several. None (renamed or deleted): the next unfiled note makes a new one.
// A note whose Board was deleted goes there too. Nothing is ever lost, and no field is added to a Board.
// This file bundles the REAL persistence, sync and src/mobile modules with the repo's own esbuild and runs them in Node against a stand-in account that keeps the real server's one rule that matters here:
// a push replaces a row only when its updatedAt is NEWER (apps/server/src/sync.ts), and an older one is dropped without a word.
//   MB-NEW       no Mobile Board: the note makes one in Unfiled, and it carries only the keys a loose Board born at the desk carries
//   MB-SAME      the next note lands on the same Board
//   MB-RENAME    she renames it: the next note makes a new one; the renamed one keeps its Card
//   MB-EARLIEST  two named "Mobile": the earliest-made
//   MB-CASE      "mobile" and "Mobile ideas" are not matched; "  Mobile  " is
//   MB-ELSEWHERE a "Mobile" Board filed in a Doc, one in the Notebook and a deleted one are not "in Unfiled"
//   MB-GONE      a note whose Board was deleted at the desk goes to Mobile, and the deleted Board is left alone
//   MB-NOSIGNAL  with no signal nothing is written on the phone: no Board, no Card; the send rejects (the note keeps waiting)
//   MB-THEIRS    the account already holds a Mobile Board this phone never saw: it is used, no second one is made
//   MB-LOSTACK   the account took the note, the answer was lost, she renames the Board: the resend adds nothing anywhere
//   MB-STALE     the push failed, then the desk changed the Board: the resend still lands the Card on the account and keeps the desk's change
//   MB-DENIED    the account never took it: the send rejects, so the note keeps waiting
//   MB-OTHER     the phone's session is now another account: nothing of the note is sent
// Browserless. Run: node scripts/harness/mobile-board-unit.mjs   (from apps/desktop)
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
const clone = (v) => JSON.parse(JSON.stringify(v));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const bundled = await build({
  stdin: {
    contents: [
      "export * as store from './store/persistence';",
      "export * as user from './store/currentUser';",
      "export * as send from './mobile/sendNote';",
      "export * as rail from './reorg/railData';",
    ].join('\n'),
    resolveDir: SRC, loader: 'ts',
  },
  bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent',
  nodePaths: [path.join(DESKTOP, 'node_modules')],
  loader: { '.css': 'empty', '.png': 'empty', '.svg': 'empty', '.woff2': 'empty' },
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': '"production"' },
});

// ---- the stand-in account ----------------------------------------------------------------------------------------------------------------------------------
const COLLECTIONS = ['projects', 'storyPlans', 'sessions', 'drafts', 'journalEntries', 'drawers'];
function makeAccount() {
  const S = { who: 'main', offline: false, failPush: false, dropAfterPush: false, ignorePush: false, tick: 0, rows: Object.fromEntries(COLLECTIONS.map((c) => [c, new Map()])), pushes: [] };
  const stamp = () => new Date(Date.UTC(2026, 10, 26, 12, 0, 0, S.tick++)).toISOString();
  const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => clone(body), headers: { get: () => null } });
  S.put = (coll, row) => { S.rows[coll].set(row.id, { row: clone(row), at: stamp() }); };
  S.get = (id, coll = 'journalEntries') => S.rows[coll].get(id)?.row ?? null;
  S.boards = () => [...S.rows.journalEntries.values()].map((v) => v.row).filter((r) => r.pageType === 'board');
  S.cardsWithId = (id) => S.boards().flatMap((b) => (b.boxes || []).filter((x) => x.id === id).map((x) => ({ board: b, box: x })));
  S.fetch = async (url, opts = {}) => {
    if (S.offline) throw new TypeError('no signal');
    if (String(url) === '/auth/me') return S.who ? json(200, { id: S.who, email: '' }) : json(401, {});
    if (String(url) !== '/api/sync') return json(404, {});
    const body = JSON.parse(opts.body);
    const pushing = COLLECTIONS.some((c) => (body.push?.[c] ?? []).length);
    if (pushing && S.failPush) throw new TypeError('signal dropped before the push arrived');
    for (const c of COLLECTIONS) for (const r of body.push?.[c] ?? []) {
      S.pushes.push(r.id);
      if (S.ignorePush) continue;
      const have = S.rows[c].get(r.id);
      if (!have || r.updatedAt > have.row.updatedAt) S.put(c, r);   // the real server's rule: newer wins, older is dropped without a word
    }
    if (pushing && S.dropAfterPush) { S.dropAfterPush = false; throw new TypeError('the account took it; the answer was lost'); }
    const since = body.lastSyncAt;
    const pull = Object.fromEntries(COLLECTIONS.map((c) => [c, [...S.rows[c].values()].filter((v) => !since || v.at > since).map((v) => v.row)]));
    return json(200, { serverTime: stamp(), pull: body.pull === false ? {} : pull, rejected: [] });
  };
  return S;
}

// ---- a phone: fresh storage, a fresh copy of the modules -----------------------------------------------------------------------------------------------------
let nonce = 0;
async function phone(account) {
  nonce += 1;
  const map = new Map();
  const storage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear(), key: (i) => [...map.keys()][i] ?? null, get length() { return map.size; } };
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {}, localStorage: storage, location: { hash: '' }, setTimeout, clearTimeout };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], querySelector: () => null, documentElement: { getAttribute: () => null, setAttribute() {} } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/m/', search: '', hash: '' };
  globalThis.localStorage = storage;
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128', onLine: true }, configurable: true, writable: true });
  globalThis.fetch = account.fetch;
  const src = `/* phone ${nonce} */\n` + bundled.outputFiles[0].text;
  const m = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
  m.user.setCurrentUser({ id: 'main', email: '' });
  return m;
}

const T0 = '2026-11-01T00:00:00.000Z';
const board = (id, name, extra = {}) => ({ id, text: name, projectId: null, pageType: 'board', boxes: [], source: 'page', origin: 'loose', createdAt: T0, updatedAt: T0, ...extra });
const note = (id, text, to = { kind: 'unfiled' }) => ({ id, text, to, madeAt: T0, account: 'main' });
const sends = async (m, n) => { try { await m.send.sendOne(n); return 'sent'; } catch (e) { return 'waits: ' + (e && e.message || e); } };
const named = (account, name) => account.boards().filter((b) => b.text === name && !b.deletedAt);

async function scenario(name, fn) {
  try { const [pass, detail] = await fn(); ok(name, pass, detail); } catch (e) { ok(name, false, 'the check threw: ' + (e && e.message || e)); }
}

await scenario('MB-NEW no Mobile Board: the note makes one in Unfiled, with only the keys a loose Board born at the desk carries', async () => {
  const a = makeAccount(); const m = await phone(a);
  const r = await sends(m, note('n-1', 'first thought'));
  const made = named(a, 'Mobile');
  const keys = made[0] ? Object.keys(made[0]).sort().join() : '';
  const want = ['boxes', 'createdAt', 'id', 'origin', 'pageType', 'projectId', 'source', 'text', 'updatedAt'].join();
  const inUnfiled = made[0] ? m.rail.unfiledMembers().some((e) => e.id === made[0].id) : false;
  return [r === 'sent' && made.length === 1 && made[0].projectId === null && made[0].origin === 'loose' && keys === want && inUnfiled && a.cardsWithId('n-1').length === 1, `${r}; boards=${made.length} keys=${keys} unfiled=${inUnfiled}`];
});

await scenario('MB-SAME the next note lands on the same Board', async () => {
  const a = makeAccount(); const m = await phone(a);
  await sends(m, note('n-1', 'one')); const r = await sends(m, note('n-2', 'two'));
  const made = named(a, 'Mobile');
  return [r === 'sent' && made.length === 1 && made[0].boxes.map((b) => b.id).sort().join() === 'n-1,n-2', `${r}; boards=${made.length} cards=${made[0]?.boxes.length}`];
});

await scenario('MB-RENAME she renames it: the next note makes a new Mobile Board', async () => {
  const a = makeAccount(); const m = await phone(a);
  await sends(m, note('n-1', 'one'));
  const first = named(a, 'Mobile')[0];
  await wait(5);
  a.put('journalEntries', { ...first, text: 'Ideas from the bus', updatedAt: new Date().toISOString() });
  const r = await sends(m, note('n-2', 'two'));
  const made = named(a, 'Mobile');
  return [r === 'sent' && made.length === 1 && made[0].id !== first.id && made[0].boxes.map((b) => b.id).join() === 'n-2' && a.get(first.id).boxes.map((b) => b.id).join() === 'n-1' && a.get(first.id).text === 'Ideas from the bus', `${r}; new=${made.length} old keeps=${a.get(first.id).boxes.length} oldName=${a.get(first.id).text}`];
});

await scenario('MB-EARLIEST two Boards named Mobile: the note goes to the earliest-made', async () => {
  const a = makeAccount();
  a.put('journalEntries', board('b-late', 'Mobile', { createdAt: '2026-11-10T00:00:00.000Z' }));
  a.put('journalEntries', board('b-early', 'Mobile', { createdAt: '2026-11-02T00:00:00.000Z' }));
  const m = await phone(a); const r = await sends(m, note('n-1', 'x'));
  const where = a.cardsWithId('n-1').map((c) => c.board.id).join();
  return [r === 'sent' && where === 'b-early' && named(a, 'Mobile').length === 2, `${r}; landed on ${where}`];
});

await scenario('MB-CASE "mobile" and "Mobile ideas" are not matched', async () => {
  const a = makeAccount();
  a.put('journalEntries', board('b-lower', 'mobile'));
  a.put('journalEntries', board('b-longer', 'Mobile ideas'));
  const m = await phone(a); const r = await sends(m, note('n-1', 'x'));
  const where = a.cardsWithId('n-1')[0]?.board;
  return [r === 'sent' && !!where && where.id !== 'b-lower' && where.id !== 'b-longer' && where.text === 'Mobile', `${r}; landed on ${where?.id} "${where?.text}"`];
});

await scenario('MB-TRIM "  Mobile  " is matched (spaces trimmed)', async () => {
  const a = makeAccount();
  a.put('journalEntries', board('b-spaced', '  Mobile  '));
  const m = await phone(a); const r = await sends(m, note('n-1', 'x'));
  const where = a.cardsWithId('n-1').map((c) => c.board.id).join();
  return [r === 'sent' && where === 'b-spaced' && a.boards().length === 1, `${r}; landed on ${where}; boards=${a.boards().length}`];
});

await scenario('MB-ELSEWHERE a Mobile Board filed in a Doc, in the Notebook, or deleted is not "in Unfiled"', async () => {
  const a = makeAccount();
  a.put('drawers', { id: 'd1', name: 'Novel', order: 0, createdAt: T0, updatedAt: T0 });
  a.put('projects', { id: 'p1', title: 'A Doc', type: 'creative', drawerId: 'd1', storyPlanId: null, createdAt: T0, updatedAt: T0 });
  a.put('journalEntries', board('b-filed', 'Mobile', { projectId: 'p1', origin: undefined }));
  a.put('journalEntries', board('b-notebook', 'Mobile', { origin: 'journal' }));
  a.put('journalEntries', board('b-deleted', 'Mobile', { deletedAt: '2026-11-05T00:00:00.000Z' }));
  const m = await phone(a); const r = await sends(m, note('n-1', 'x'));
  const where = a.cardsWithId('n-1').map((c) => c.board.id);
  return [r === 'sent' && where.length === 1 && !['b-filed', 'b-notebook', 'b-deleted'].includes(where[0]), `${r}; landed on ${where.join()}`];
});

await scenario('MB-GONE a note whose Board was deleted at the desk goes to Mobile', async () => {
  const a = makeAccount();
  a.put('journalEntries', board('b-x', 'Chapter notes'));
  const m = await phone(a);
  await sends(m, note('n-0', 'seen while it lived', { kind: 'board', id: 'b-x' }));
  await wait(5);
  a.put('journalEntries', { ...a.get('b-x'), deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  const r = await sends(m, note('n-1', 'after it went', { kind: 'board', id: 'b-x' }));
  const where = a.cardsWithId('n-1').map((c) => c.board.text).join();
  return [r === 'sent' && where === 'Mobile' && !!a.get('b-x').deletedAt && a.get('b-x').boxes.map((b) => b.id).join() === 'n-0', `${r}; landed on ${where}; deleted Board still deleted=${!!a.get('b-x').deletedAt}`];
});

await scenario('MB-NOSIGNAL with no signal nothing is written on the phone, and the note keeps waiting', async () => {
  const a = makeAccount(); const m = await phone(a); a.offline = true;
  const r = await sends(m, note('n-1', 'x'));
  const local = m.store.getJournalEntries().length;
  return [r.startsWith('waits') && local === 0 && a.boards().length === 0, `${r}; rows on the phone=${local}`];
});

await scenario('MB-THEIRS the account already holds a Mobile Board this phone never saw: no second one', async () => {
  const a = makeAccount(); a.put('journalEntries', board('b-desk', 'Mobile'));
  const m = await phone(a); const r = await sends(m, note('n-1', 'x'));
  return [r === 'sent' && a.boards().length === 1 && a.cardsWithId('n-1')[0]?.board.id === 'b-desk', `${r}; boards=${a.boards().length}`];
});

await scenario('MB-LOSTACK the account took it, the answer was lost, she renames the Board: the resend adds nothing', async () => {
  const a = makeAccount(); const m = await phone(a);
  a.dropAfterPush = true;
  const r1 = await sends(m, note('n-1', 'x'));
  const first = named(a, 'Mobile')[0];
  await wait(5);
  if (first) a.put('journalEntries', { ...first, text: 'Renamed', updatedAt: new Date().toISOString() });
  const r2 = await sends(m, note('n-1', 'x'));
  return [!!first && r2 === 'sent' && a.cardsWithId('n-1').length === 1 && named(a, 'Mobile').length === 0, `first: ${r1}; resend: ${r2}; copies=${a.cardsWithId('n-1').length} newBoards=${named(a, 'Mobile').length}`];
});

await scenario('MB-STALE the push failed, then the desk changed the Board: the resend lands the Card and keeps the desk change', async () => {
  const a = makeAccount(); a.put('journalEntries', board('b-x', 'Chapter notes'));
  const m = await phone(a);
  a.failPush = true;
  const r1 = await sends(m, note('n-1', 'from the phone', { kind: 'board', id: 'b-x' }));
  a.failPush = false;
  await wait(5);
  const now = new Date().toISOString();
  a.put('journalEntries', { ...a.get('b-x'), boxes: [{ id: 'desk-card', kind: 'text', x: 0.5, y: 0.5, w: 0.3, h: 0.1, z: 3, text: 'from the desk', updatedAt: now }], updatedAt: now });
  await wait(5);
  const r2 = await sends(m, note('n-1', 'from the phone', { kind: 'board', id: 'b-x' }));
  const ids = a.get('b-x').boxes.map((b) => b.id).sort().join();
  return [r1.startsWith('waits') && r2 === 'sent' && ids === 'desk-card,n-1', `first: ${r1}; resend: ${r2}; cards on the account: ${ids}`];
});

await scenario('MB-DENIED the account never took it: the note keeps waiting', async () => {
  const a = makeAccount(); a.put('journalEntries', board('b-x', 'Chapter notes'));
  const m = await phone(a); a.ignorePush = true;
  const r = await sends(m, note('n-1', 'x', { kind: 'board', id: 'b-x' }));
  return [r.startsWith('waits') && a.cardsWithId('n-1').length === 0, r];
});

await scenario('MB-OTHER the session is now another account: nothing of the note is sent', async () => {
  const a = makeAccount(); const m = await phone(a); a.who = 'sample';
  const r = await sends(m, note('n-1', 'main only'));
  return [r.startsWith('waits') && a.pushes.length === 0 && a.boards().length === 0, `${r}; pushes=${a.pushes.length}`];
});

const bad = checks.filter((c) => !c.pass);
for (const c of checks) console.log((c.pass ? 'PASS ' : 'FAIL ') + c.name + (c.detail ? '  [' + c.detail + ']' : ''));
console.log(`\n${checks.length - bad.length}/${checks.length} pass`);
process.exit(bad.length ? 1 : 0);
