// THE CLIENT STORE IN NODE (Delete for good, Oct 18) - the app's REAL store modules (persistence, sync, the delete seams), bundled with the
// repo's own esbuild and run in Node with just enough of a browser around them: their own localStorage, a window and document that accept
// listeners, and a fetch that resolves the app's relative URLs against one server and keeps that device's own session cookie. One process is
// one device: two child processes are two devices on one account, against one real server (delete-for-good-e2e.mjs), and the browserless
// check (delete-for-good-check.mjs) runs one with no server at all.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const DESKTOP = join(here, '..', '..');
const ROOT = join(DESKTOP, '..', '..');

/** A Map-backed Storage. */
function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    clear: () => { m.clear(); },
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

/** Put a browser shell around this process. `base` is the server the app's relative URLs go to (or null: fetch fails, as offline).
 *  `hostname` is what location.hostname reads (the destructive gate's test unlock checks it). */
export function installClientGlobals({ base = null, hostname = '127.0.0.1' } = {}) {
  const noop = () => {};
  globalThis.localStorage = memoryStorage();
  globalThis.sessionStorage = memoryStorage();
  globalThis.window = globalThis;
  globalThis.addEventListener = noop;
  globalThis.removeEventListener = noop;
  globalThis.dispatchEvent = () => true;
  globalThis.location = { hostname, origin: base || `http://${hostname}`, href: (base || `http://${hostname}`) + '/#/', hash: '#/', pathname: '/', search: '' };
  globalThis.document = { visibilityState: 'visible', hidden: false, addEventListener: noop, removeEventListener: noop, querySelector: () => null, querySelectorAll: () => [] };
  if (!globalThis.requestAnimationFrame) globalThis.requestAnimationFrame = (fn) => setTimeout(() => fn(Date.now()), 16);
  if (!globalThis.cancelAnimationFrame) globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
  // fetch: relative URLs go to `base`, with this device's own cookie
  let cookie = '';
  const realFetch = globalThis.fetch;
  globalThis.__deviceFetchCount = 0;
  globalThis.fetch = async (url, opts = {}) => {
    if (!base) throw new TypeError('offline (no server in this check)');
    const u = String(url).startsWith('http') ? String(url) : base + String(url);
    const headers = { ...(opts.headers || {}) };
    if (cookie) headers.cookie = cookie;
    globalThis.__deviceFetchCount += 1;
    const res = await realFetch(u, { ...opts, headers, credentials: undefined });
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of set) { const kv = c.split(';')[0]; if (kv.startsWith('connect.sid=') || kv.includes('=')) cookie = kv; }
    return res;
  };
}

/** Bundle the app's store modules (one fresh copy per call) and import them. `extra` adds more store modules by name. */
export async function loadClientStore(extra = []) {
  const pnpmDir = join(ROOT, 'node_modules', '.pnpm');
  const esbuildPkg = existsSync(pnpmDir) ? readdirSync(pnpmDir).find((d) => /^esbuild@/.test(d)) : null;
  const esbuildBin = esbuildPkg && join(pnpmDir, esbuildPkg, 'node_modules', 'esbuild', 'bin', 'esbuild');
  if (!esbuildBin || !existsSync(esbuildBin)) throw new Error('esbuild not found under node_modules/.pnpm');
  const tmp = mkdtempSync(join(tmpdir(), 'wz-client-'));
  const entry = join(tmp, 'entry.ts');
  const store = join(DESKTOP, 'src', 'store').replace(/\\/g, '/');
  const mods = ['persistence', 'sync', 'destructiveGate', 'currentUser', ...extra];
  writeFileSync(entry, mods.map((m) => `export * as ${m} from '${store}/${m}';`).join('\n') + `\nimport '${store}/deleteSeams';\n`);
  const out = join(tmp, 'bundle.mjs');
  execFileSync(process.execPath, [esbuildBin, entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${out}`, '--log-level=error',
    '--external:@fontsource/*', '--external:@fontsource-variable/*', '--define:import.meta.env.DEV=false', '--define:import.meta.env.PROD=true',
    '--define:import.meta.env.MODE="production"'], { stdio: 'pipe' });
  return import(pathToFileURL(out).href);
}
