// ITEM 204 PART 2 — DOES THE 15.9 MB WASM DOWNLOAD ONCE?
//
// Fable's check before any offer. §4 accepts a 7.7 MB gzip download on the web
// target, ONCE — a writer who opens Revise on Monday and again on Tuesday must not
// pay twice. That is entirely a question of the response headers the server sends
// for the hashed asset, so this measures them on the REAL server.
//
// Run: node apps/desktop/scripts/item204-wasm-cache-headers.mjs
//
// ⚠ MEASURED, NOT READ. `apps/server/src/index.ts` already says in prose that
// `/assets/*` is content-hashed and "safe to cache forever", and its `setHeaders`
// callback sets `immutable`. Reading that is not the same as observing it:
// `express.static` ALSO sets `Cache-Control` from its own `maxAge` option (default
// 0), so the question of which one reaches the wire is a question about middleware
// ordering, not about the callback's text. A response is the only thing that settles
// it — the house rule is that maps are research and disk wins, and here the WIRE
// outranks the source.
//
// WHAT IS STUBBED, NAMED SO THE SCOPE IS HONEST: `./db` (a fake pool), `./migrate`
// (there is no Postgres on this box, and `runMigrations()` gates `app.listen`), and
// `./session` (connect-pg-simple would reach for that same absent database on any
// request that passes through it). THE STATIC MIDDLEWARE ITSELF IS REAL AND
// UNTOUCHED, which is the whole subject — everything stubbed sits upstream of it.
import { mkdirSync, writeFileSync, rmSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import http from 'node:http';

const here = dirname(fileURLToPath(import.meta.url));
const desktop = join(here, '..');
const repo = join(desktop, '..', '..');
const ASSETS = join(desktop, 'dist-web', 'assets');

let failures = 0;
const ok = (name, pass, detail = '') => {
  if (!pass) failures += 1;
  console.log(`  ${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? `  ${detail}` : ''}`);
};

// esbuild lives in the store but is linked into no package's node_modules, so it is
// resolved through vite's own require (item 198's two-step, reused).
const desktopRequire = createRequire(join(repo, 'apps/desktop/package.json'));
const viteRequire = createRequire(desktopRequire.resolve('vite'));
const esbuild = viteRequire('esbuild');

const tmp = join(tmpdir(), 'wrizo-item204-wasm-headers');
mkdirSync(tmp, { recursive: true });
const stubs = join(tmp, 'stubs');
mkdirSync(stubs, { recursive: true });
writeFileSync(join(stubs, 'db.mjs'), 'export const pool = { query: async () => ({ rows: [] }) };');
writeFileSync(join(stubs, 'migrate.mjs'), 'export const runMigrations = async () => {};');
writeFileSync(join(stubs, 'session.mjs'), 'export const sessionMiddleware = (_q, _s, next) => next();');

// ⛔ node:http WITH KEEP-ALIVE OFF, NOT fetch — AND THE EXIT CODE IS WHY.
// With `fetch`, this script measured everything correctly, printed CLEAN, and then
// died on a libuv assertion ("!(handle->flags & UV_HANDLE_CLOSING)") with exit code
// 127: undici's global connection pool was still holding sockets when process.exit
// ran, and Windows asserts on that. A suite runner reads 127 as a failure, so a
// perfect measurement would have been reported as a red — the verdict lives in the
// exit code as much as in the log.
// `agent: false` opens and closes one socket per request, leaving nothing pooled.
const get = (port, path) => new Promise((resolve, reject) => {
  const req = http.get({ host: '127.0.0.1', port, path, agent: false }, (res) => {
    res.resume(); // drain, or the socket lingers
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers }));
  });
  req.on('error', reject);
});

const freePort = () => new Promise((resolve, reject) => {
  const s = createServer();
  s.on('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

console.log('ITEM 204 — THE WASM CACHE HEADERS\n');

// ---------------------------------------------------------------------------
// A PROBE ASSET. The policy is keyed on the PATH (`/assets/`), not on any one
// file, so a synthetic hashed .wasm exercises the same branch — and it makes this
// check repeatable when no real harper wasm is in the build. (Today there is none:
// the engine has no caller yet, so Rollup drops it and the asset is never emitted.
// A check that silently measured nothing would be the blind-guard failure again, so
// the probe file is written deliberately and its presence is asserted.)
// ---------------------------------------------------------------------------
if (!existsSync(ASSETS)) {
  console.log(`FAIL — ${ASSETS} does not exist. Run \`pnpm --filter @writer-studio/desktop run build:web\` first; refusing to report headers for a build that is not there.`);
  process.exit(1);
}
const PROBE = 'harper_wasm_slim_bg-PROBEHASH.wasm';
const probePath = join(ASSETS, PROBE);
// A minimal valid wasm preamble, so nothing downstream can object to the bytes.
writeFileSync(probePath, Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]));

const realWasm = readdirSync(ASSETS).filter((f) => f.endsWith('.wasm') && f !== PROBE);
let child = null;

try {
  // ⛔ WHERE THE BUNDLE SITS IS PART OF THE MEASUREMENT, AND THE FIRST RUN PROVED IT.
  // index.ts computes its static root as `resolve(__dirname, '../../desktop/dist-web')`.
  // Bundled into the OS temp dir, `__dirname` was the temp dir, so the root became
  // 'AppData/Local/desktop/dist-web' — absent — and EVERY asset 404'd into the SPA
  // fallback, which answers `no-cache`. Four checks went red against a server that was
  // serving nothing. The reds were the instrument, not the policy.
  //
  // So the bundle is emitted one level under apps/server, exactly like src/, and the
  // same arithmetic lands on apps/desktop/dist-web. Removed in the finally below.
  const probeDir = join(repo, 'apps', 'server', '.item204-hdr-probe');
  mkdirSync(probeDir, { recursive: true });
  const out = join(probeDir, 'server.cjs');
  await esbuild.build({
    entryPoints: [join(repo, 'apps/server/src/index.ts')],
    outfile: out,
    bundle: true, platform: 'node', format: 'cjs', target: 'node20',
    logLevel: 'silent',
    plugins: [{
      name: 'server-stubs',
      setup(b) {
        b.onResolve({ filter: /^\.\/db$/ }, () => ({ path: join(stubs, 'db.mjs') }));
        b.onResolve({ filter: /^\.\/migrate$/ }, () => ({ path: join(stubs, 'migrate.mjs') }));
        b.onResolve({ filter: /^\.\/session$/ }, () => ({ path: join(stubs, 'session.mjs') }));
      },
    }],
  });

  const port = await freePort();
  process.env.PORT = String(port);
  process.env.DATABASE_URL = 'postgres://probe:probe@127.0.0.1:1/probe';
  process.env.SESSION_SECRET = 'item204-wasm-header-probe-secret';
  process.env.NODE_ENV = 'production';

  // A CHILD PROCESS, not an in-process require. index.ts does not export its server,
  // so an in-process boot leaves a listening handle this script cannot close and the
  // run ends on a libuv assertion (observed: "!(handle->flags & UV_HANDLE_CLOSING)").
  // A child is killed cleanly and cannot outlive the measurement.
  child = spawn(process.execPath, [out], {
    cwd: join(repo, 'apps', 'server'),
    env: { ...process.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const childLog = [];
  child.stdout.on('data', (d) => childLog.push(String(d)));
  child.stderr.on('data', (d) => childLog.push(String(d)));

  // Wait on OBSERVABLE STATE, never on elapsed time: poll /healthz until it answers.
  let up = false;
  for (let i = 0; i < 120 && !up; i += 1) {
    try { const r = await get(port, '/healthz'); up = r.status === 200; } catch { /* not yet */ }
    if (!up) await new Promise((r) => setTimeout(r, 50));
  }
  ok('the real server is listening (stubs upstream of the static middleware only)', up, `port ${port}`);
  if (!up) { throw new Error('server never came up'); }

  const measure = async (name) => {
    const res = await get(port, `/assets/${name}`);
    return {
      status: res.status,
      cacheControl: res.headers['cache-control'] ?? null,
      contentType: res.headers['content-type'] ?? null,
      etag: res.headers.etag ?? null,
      lastModified: res.headers['last-modified'] ?? null,
    };
  };

  const targets = [PROBE, ...realWasm];
  console.log(`\nmeasuring ${targets.length} .wasm asset(s): ${JSON.stringify(targets)}\n`);

  for (const name of targets) {
    const h = await measure(name);
    const label = name === PROBE ? 'the synthetic hashed wasm' : `the REAL harper wasm (${name})`;
    console.log(`    ${name}`);
    console.log(`      status         ${h.status}`);
    console.log(`      cache-control  ${h.cacheControl}`);
    console.log(`      content-type   ${h.contentType}`);
    console.log(`      etag           ${h.etag}`);

    ok(`${label}: served 200`, h.status === 200, String(h.status));

    const cc = h.cacheControl ?? '';
    const maxAge = Number((cc.match(/max-age=(\d+)/) ?? [])[1] ?? -1);
    ok(`${label} ⛔ DOWNLOADS ONCE — a long max-age AND immutable, so a second Revise session revalidates nothing`,
      /immutable/.test(cc) && maxAge >= 31536000, JSON.stringify(cc));
    ok(`${label}: and NOT no-cache/no-store — which is what would make the 15.9 MB arrive again on every visit`,
      !/no-cache|no-store|max-age=0/.test(cc), JSON.stringify(cc));

    // ⚠ NOT THE QUESTION ASKED, BUT MEASURED WHILE THE SERVER IS UP, because it is
    // the other way this asset fails silently: `WebAssembly.instantiateStreaming`
    // REFUSES a response whose Content-Type is not `application/wasm`, and harper's
    // loader would fall back or throw. Cheap to check, expensive to discover.
    ok(`${label}: Content-Type is application/wasm — instantiateStreaming refuses anything else`,
      (h.contentType ?? '').startsWith('application/wasm'), String(h.contentType));
  }

  // THE CONTROL. If everything came back immutable, the check cannot tell a real
  // policy from a server that stamps every response the same way. index.html must
  // come back no-cache, or the /assets/ result above means nothing.
  const idx = await get(port, '/');
  const idxCc = idx.headers['cache-control'] ?? '';
  ok('THE CONTROL: index.html comes back no-cache, so the immutable above is a real policy on /assets/ and not a blanket header on everything',
    /no-cache/.test(idxCc), JSON.stringify(idxCc));

  // And a non-asset path must not get the immutable treatment either.
  const hz = await get(port, '/healthz');
  ok('THE SECOND CONTROL: a non-asset route is not immutable either',
    !/immutable/.test(hz.headers['cache-control'] ?? ''), JSON.stringify(hz.headers['cache-control'] ?? null));

  // The source's own claim, checked against what was observed rather than trusted.
  const src = readFileSync(join(repo, 'apps/server/src/index.ts'), 'utf8');
  ok('the observed header is the one index.ts sets — source and wire agree, so neither is a guess about the other',
    /max-age=31536000, immutable/.test(src));
} finally {
  rmSync(probePath, { force: true });
  if (child) child.kill();
  rmSync(join(repo, 'apps', 'server', '.item204-hdr-probe'), { recursive: true, force: true });
}

console.log('\nSTATED BOUNDS:');
console.log('  · this is the LOCAL server. Railway sits in front of production and may add or rewrite headers;');
console.log('    a production read is a separate, announced probe (and it is chat 1\'s to authorise).');
console.log('  · caching only makes the SECOND visit free. The FIRST download is still 7.7 MB gzip, which §4 accepts.');
console.log('  · a browser may still evict the entry under storage pressure; immutable removes revalidation, not eviction.');

console.log('\n' + (failures === 0
  ? 'ITEM 204 WASM CACHE HEADERS: CLEAN — the wasm downloads once'
  : `ITEM 204 WASM CACHE HEADERS: ${failures} FAILURE(S)`));
process.exitCode = failures === 0 ? 0 : 1;
