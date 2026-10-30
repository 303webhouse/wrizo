// THE APP'S OWN STORE, loaded in Node (sample-account seed). The real persistence.ts + the deck engine + grafts, bundled with esbuild against a FAKE BROWSER
// (the established pattern: apps/desktop/scripts/harness/big-projects-1a.mjs). The seed drives the app's own seams (createDrawer, createBinder, createBoardPage,
// saveBoardBoxes, materializeDeck, graftTo, saveScriptDoc, ...), then reads what the app would have PUSHED (getDirtyRecords): so a seeded row is exactly the
// row the app writes, defaults and all. Nothing here touches a database. The records are sent by sample-seed.mjs through the server's real syncRouter.
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DESKTOP = path.resolve(here, '..', '..', '..', 'desktop');
export const SRC = path.join(DESKTOP, 'src');

let nonce = 0;
const noCR = (t) => t.replace(/\r\n?/g, '\n');

/** Bundle + import a fresh copy of the app's store. `wrizoId` (optional) supplies the id generator so a re-run can be deterministic in tests. */
export async function loadAppStore() {
  const require = createRequire(path.join(DESKTOP, 'package.json'));
  const { build } = createRequire(require.resolve('vite'))('esbuild');
  const entry = [
    "export * from './store/persistence';",
    "export { createSet, ensureSet } from './store/place';",
    "export { graftTo } from './store/grafts';",
    "export { DECKS } from './decks/library';",
    "export { materializeDeck } from './decks/engine';",
    "export { addChildren, childWordOf } from './store/childSteps';",
    "export { createEmptyScriptDoc, newElement, groupIntoScenes } from './store/scriptDoc';",
    "export { serializeScriptDoc } from './store/scriptText';",
    "export { addFact } from './store/tutorBible';",
    "export { doorHome, withHomeView } from './store/boardKind';",
    "export { serializeTitlePage } from './store/titlePage';",
    "export { fontSlug } from './store/fontRoster';",
    "export { deskTerm } from './store/deskLexicon';",
  ].join('\n');
  const res = await build({
    stdin: { contents: entry, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', loader: { '.css': 'empty' },
    nodePaths: [path.join(DESKTOP, 'node_modules')],
    plugins: [{ name: 'lf', setup(b) {
      b.onLoad({ filter: /\.ts$/ }, async (args) => {
        const { readFileSync } = await import('node:fs');
        return { contents: noCR(readFileSync(args.path, 'utf8')), loader: 'ts' };
      });
    } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() {} };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.location = { protocol: 'https:', origin: 'https://app.test', href: 'https://app.test/#/' };
  Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Mozilla/5.0 Chrome/128' }, configurable: true, writable: true });
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  // a unique URL per load: an identical data: URL would hand back the SAME module (and its cache, its dirty set, a mutated registry)
  nonce += 1;
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text + `
// load ${nonce} ${Date.now()}`).toString('base64'));
}
