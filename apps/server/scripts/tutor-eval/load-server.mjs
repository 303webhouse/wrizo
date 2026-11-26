// TUTOR-B · the loader the check scripts and the test runner share.
// It turns the server's own TypeScript (apps/server/src) into plain JS in a scratch folder under apps/server, so the SAME prompt builder, the SAME reply
// guard and the SAME route the server ships are the ones that get checked (nothing is copied or re-typed). Auth and the rate limiter are stood in (as the
// other server checks do); everything else is the real file. `mutate` lets a check run a copy of one file with ONE edit, in memory only.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER = path.resolve(here, '..', '..');
export const SERVER_SRC = path.join(SERVER, 'src');
export const svRequire = createRequire(path.join(SERVER, 'package.json'));
const ts = svRequire('typescript');

let n = 0;
// files: the src files to bring in (default: the Tutor route and everything it imports)
// mutate: { 'tutor.ts': (src) => newSrc }  (the anchor must be found, or it throws: a mutant that matched nothing proves nothing)
export function loadServer({ files = ['env.ts', 'asyncHandler.ts', 'logSafe.ts', 'tutorPrompts.ts', 'tutorGuard.ts', 'tutorNoteFilter.ts', 'tutorNotes.ts', 'tutorNotesRoutes.ts', 'tutor.ts'], mutate = {} } = {}) {
  const tmp = path.join(SERVER, `.tutor-eval-scratch-${process.pid}-${n++}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  for (const rel of files) {
    const p = path.join(SERVER_SRC, rel);
    if (!fs.existsSync(p)) continue; // a file the tree does not have yet: the check that needs it reports that, loudly
    let src = fs.readFileSync(p, 'utf8');
    if (mutate[rel]) src = mutate[rel](src);
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    fs.writeFileSync(path.join(tmp, rel.replace(/\.ts$/, '.js')), out);
  }
  // the ask now reads her notes on file (item 7 step 2): a stand-in database that holds none, unless the check brings its own db.js or the real db.ts
  if (!files.includes('db.ts')) fs.writeFileSync(path.join(tmp, 'db.js'), 'exports.pool = { query: async () => ({ rows: [], rowCount: 0 }) };' + String.fromCharCode(13, 10));
  fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  const load = (name) => svRequire(path.join(tmp, name.replace(/\.ts$/, '.js')));
  const has = (name) => fs.existsSync(path.join(tmp, name.replace(/\.ts$/, '.js')));
  const cleanup = () => fs.rmSync(tmp, { recursive: true, force: true });
  return { load, has, cleanup, tmp };
}

// a mutation helper: swap `from` for `to` in a source text, or throw
export const swap = (from, to) => (src) => {
  if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 70)}`);
  return src.replace(from, to);
};

export function findHandler(router, routePath) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && layer.route.methods.post) { const s = layer.route.stack; return s[s.length - 1].handle; }
  }
  return null;
}

// asyncHandler does not hand its promise back, so the answer is awaited (res.json, or an error passed to next), with a ceiling
export async function callRoute(handler, body, userId = 'u1') {
  const req = { body, session: { userId } };
  const res = { statusCode: 200, body: undefined };
  let finish;
  const done = new Promise((resolve) => { finish = resolve; });
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; finish(); return res; };
  let thrown = null;
  handler(req, res, (e) => { if (e) thrown = String((e && e.message) || e).slice(0, 200); finish(); });
  await Promise.race([done, new Promise((r) => setTimeout(r, 8000))]);
  return { status: res.statusCode, body: res.body, thrown };
}
