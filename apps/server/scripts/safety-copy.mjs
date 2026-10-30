// THE SAFETY COPY: before an account is wiped, a full copy of it lands on the owner's own computer (docs/plans/delete-for-good.md section 5; the
// brief: "an export of every page, board, card, binder, drawer, Journal, Bible fact and Tutor thread"). Two parts, through the app's own paths:
//   1. account-pull.json - the account's COMPLETE /api/sync pull (projects, story plans, sessions, drafts, drawers, journal entries - the Bible, boards,
//      cards, Tutor threads and links live inside those records), exactly as the server holds them. It is a PULL ONLY: it writes nothing, ever.
//   2. Everything.md     - the app's own "Everything" markdown export (store/pageExport.ts exportEverythingDocument, bundled and run here, on the pulled
//      records), live pages first and the Trash after them.
// plus counts.txt: rows per collection (total / live / in the Trash / purged) and the pages in Everything.md, so the owner can SEE what was saved.
//
// IT REFUSES (exit 1, and says "do NOT delete") when: sign-in or the pull fails; the file cannot be read back with the same counts; the Everything export
// throws; or Everything.md holds no pages while the pull holds some. An account with no rows at all exits 2 ("EMPTY"): a copy of nothing is not a copy.
// It only prints SAFETY COPY: OK when every one of those held.
//
// RUN (a terminal on the owner's own computer; the email is shown as typed, the password is hidden; neither is ever printed, written or logged):
//   node apps/server/scripts/safety-copy.mjs [--base https://host] [--out <folder>]
// The folder defaults to ~/Downloads/wrizo-safety-copy-<UTC stamp>; an existing folder is never reused. HTTPS only (plain http only for 127.0.0.1 /
// localhost, which is how the proof runs). The run signs in, pulls once, and signs out; it prints status words and counts only.
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeEmail, readLine } from './set-password.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_BASE = 'https://writer-studio-app-production.up.railway.app';
// the pull's collections, and the localStorage key the app hydrates each from (store/persistence.ts KEYS): the Everything export reads the app's own cache
const COLLECTIONS = {
  projects: 'writer-studio-projects',
  storyPlans: 'writer-studio-story-plans',
  sessions: 'writer-studio-sessions',
  drafts: 'writer-studio-drafts',
  drawers: 'writer-studio-drawers',
  journalEntries: 'writer-studio-journal-entries',
};

export function assertSafeBase(base) {
  let u;
  try { u = new URL(base); } catch { throw new Error('bad-base'); }
  if (u.protocol === 'https:') return;
  if (u.protocol === 'http:' && (u.hostname === '127.0.0.1' || u.hostname === 'localhost')) return;
  throw new Error('unsafe-base');
}

// Signs in, pulls once, signs out. Returns the pull object; throws a short code on any failure. Never reads a body except the pull's own.
export async function pullAccount(base, email, password) {
  assertSafeBase(base);
  let cookie = '';
  const call = async (method, path, body) => {
    const res = await fetch(base + path, {
      method, redirect: 'manual',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method === 'POST' ? { Origin: base } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const set = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
    if (set.length) cookie = set.map((c) => c.split(';')[0]).join('; ');
    return res;
  };
  const login = await call('POST', '/auth/login', { email, password });
  await login.arrayBuffer().catch(() => {});
  if (login.status !== 200) throw new Error(`login-${login.status}`);
  let pull;
  try {
    const res = await call('POST', '/api/sync', { lastSyncAt: null, push: {} });
    if (res.status !== 200) { await res.arrayBuffer().catch(() => {}); throw new Error(`pull-${res.status}`); }
    pull = (await res.json()).pull;
  } finally {
    const out = await call('POST', '/auth/logout', {}).catch(() => null);
    if (out) await out.arrayBuffer().catch(() => {});
  }
  if (!pull || typeof pull !== 'object') throw new Error('pull-shape');
  return pull;
}

export function countsOf(pull) {
  const out = {};
  for (const k of Object.keys(COLLECTIONS)) {
    const rows = Array.isArray(pull[k]) ? pull[k] : [];
    const purged = rows.filter((r) => r && r.purgedAt).length;
    const trashed = rows.filter((r) => r && !r.purgedAt && r.deletedAt).length;
    out[k] = { total: rows.length, live: rows.length - purged - trashed, trashed, purged };
  }
  return out;
}

// The app's own "Everything" export, run in node: the real module bundled by the desktop's esbuild, a fake browser around it (the harness's own pattern,
// scripts/harness/polish10-board.mjs), the pulled records seeded as the app's cache. Returns { filename, content, count }.
export async function everythingFrom(pull) {
  const desktop = resolve(HERE, '..', '..', 'desktop');
  const dreq = createRequire(join(desktop, 'package.json'));
  const { build } = createRequire(dreq.resolve('vite'))('esbuild');
  const res = await build({
    stdin: { contents: "export { exportEverythingDocument } from './store/pageExport';", resolveDir: join(desktop, 'src'), loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [join(desktop, 'node_modules')],
    external: ['@fontsource/*', '@fontsource-variable/*'],
  });
  const map = new Map();
  for (const [k, key] of Object.entries(COLLECTIONS)) map.set(key, JSON.stringify(Array.isArray(pull[k]) ? pull[k] : []));
  const fakes = {
    window: { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }) },
    document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } },
    location: { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' },
    localStorage: { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() },
  };
  const had = {};
  for (const k of Object.keys(fakes)) { had[k] = Object.getOwnPropertyDescriptor(globalThis, k); Object.defineProperty(globalThis, k, { value: fakes[k], configurable: true, writable: true }); }
  try {
    const M = await import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
    return M.exportEverythingDocument();
  } finally {
    for (const k of Object.keys(fakes)) { if (had[k]) Object.defineProperty(globalThis, k, had[k]); else delete globalThis[k]; }
  }
}

// The whole copy. Returns { ok, code, dir, counts, pages }; `ok` is true only when every refusal rule held. Never prints.
// `exporter` and `afterWrite` are seams for the proof (scripts/harness/account-tools.mjs); the CLI never passes them.
export async function makeSafetyCopy({ pull, outDir, exporter = everythingFrom, afterWrite = null }) {
  const counts = countsOf(pull);
  const rows = Object.values(counts).reduce((n, c) => n + c.total, 0);
  if (rows === 0) return { ok: false, code: 'EMPTY', counts, pages: 0 };
  if (existsSync(outDir)) return { ok: false, code: 'FOLDER-EXISTS', counts, pages: 0 };
  let every;
  try { every = await exporter(pull); } catch { return { ok: false, code: 'EXPORT-FAILED', counts, pages: 0 }; }
  const entryPages = counts.journalEntries.live + counts.journalEntries.trashed;
  if (!every || typeof every.content !== 'string') return { ok: false, code: 'EXPORT-FAILED', counts, pages: 0 };
  mkdirSync(outDir, { recursive: true });
  const jsonFile = join(outDir, 'account-pull.json');
  writeFileSync(jsonFile, JSON.stringify(pull, null, 2), { flag: 'wx' });
  writeFileSync(join(outDir, 'Everything.md'), every.content, { flag: 'wx' });
  if (afterWrite) afterWrite(jsonFile);
  // read it BACK: the same counts, from the file on disk
  let back;
  try { back = countsOf(JSON.parse(readFileSync(jsonFile, 'utf8'))); } catch { return { ok: false, code: 'READBACK-FAILED', counts, pages: every.count, dir: outDir }; }
  if (JSON.stringify(back) !== JSON.stringify(counts)) return { ok: false, code: 'READBACK-MISMATCH', counts, pages: every.count, dir: outDir };
  if (entryPages > 0 && !(every.count > 0)) return { ok: false, code: 'EVERYTHING-EMPTY', counts, pages: every.count, dir: outDir };
  const lines = ['Wrizo safety copy - rows per collection (total / live / in the Trash / purged)'];
  for (const [k, c] of Object.entries(counts)) lines.push(`${k.padEnd(15)} ${c.total} / ${c.live} / ${c.trashed} / ${c.purged}`);
  lines.push(`Everything.md   ${every.count} pages`);
  writeFileSync(join(outDir, 'counts.txt'), lines.join('\n') + '\n', { flag: 'wx' });
  return { ok: true, code: 'OK', dir: outDir, counts, pages: every.count };
}

function stamp() { return new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, 'Z'); }
function argAfter(flag) { const i = process.argv.indexOf(flag); return i >= 0 ? process.argv[i + 1] : null; }

async function main() {
  if (!process.stdin.isTTY) { console.error('Run this in a terminal you are typing into (it reads the email and password from the keyboard).'); process.exit(2); }
  const base = argAfter('--base') || DEFAULT_BASE;
  try { assertSafeBase(base); } catch { console.error('The base address must be https:// (plain http only for localhost).'); process.exit(2); }
  const outDir = resolve(argAfter('--out') || join(homedir(), 'Downloads', `wrizo-safety-copy-${stamp()}`));
  const email = normalizeEmail(await readLine('Account email: ', { hidden: false }));
  const password = await readLine('Password (typing is hidden): ', { hidden: true });
  if (!email || !password) { console.error('Email and password are required. Nothing was saved.'); process.exit(2); }
  let pull;
  try { pull = await pullAccount(base, email, password); } catch (err) {
    console.error(`SAFETY COPY: FAILED (${err && err.message ? err.message : 'error'}) - do NOT delete anything.`);
    process.exit(1);
  }
  const r = await makeSafetyCopy({ pull, outDir });
  for (const [k, c] of Object.entries(r.counts)) console.log(`${k.padEnd(15)} ${c.total} rows (${c.live} live, ${c.trashed} in the Trash, ${c.purged} purged)`);
  if (r.ok) { console.log(`Everything.md   ${r.pages} pages\nSAFETY COPY: OK - saved to ${r.dir}\nOpen the folder and look before anything is deleted.`); return; }
  console.error(`SAFETY COPY: ${r.code === 'EMPTY' ? 'EMPTY - the account has no rows, so there is nothing to copy' : `FAILED (${r.code})`} - do NOT delete anything.`);
  process.exit(r.code === 'EMPTY' ? 2 : 1);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((err) => { console.error(err && err.message === 'cancelled' ? 'Cancelled. Nothing was saved.' : 'SAFETY COPY: FAILED - do NOT delete anything.'); process.exit(1); });
}
