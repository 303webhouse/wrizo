// arbor2-flag-unit.mjs - BROWSERLESS pin for Fable's ruling (a), Nov 7: isArbor2() (src/arbor2/flag.ts) returns false - never throws - when there is a
// window without a location. Why: since r17 newPageSize calls isArbor2 at every page birth, and the sample seed's Node shim once had a window with no
// location, so the seed threw and the play server died (Nick's walk turn 1, Nov 8). The seed's shim now carries a location (ruling (b)); this pins the
// app side so main's seed never breaks again.
//   F1  no window at all -> false.
//   F2  a window WITHOUT a location -> false, and it does not throw (the guard).
//   F3  liveness: ?arbor2=1 in the search -> true; in the hash's query -> true; ?arbor2=0 -> false; nothing -> false (a pin that cannot pass is not run).
//   F4  the reason still stands: page birth (store/newPageSize or arbor2/newPageSize) still calls isArbor2 - if it stops, this pin can retire.
//   MUT the guard removed from the source (in memory, the file untouched): F2 must go red - the mutant landed and was caught.
// Run: node apps/desktop/scripts/harness/arbor2-flag-unit.mjs  ->  "ARBOR2-FLAG VERIFY: PASS (n checks)" or FAIL with the numbers. No browser, no box turn.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const DESKTOP = path.resolve(here, '..', '..');
const FLAG = path.join(DESKTOP, 'src', 'arbor2', 'flag.ts');
const results = [];
const ok = (name, pass, detail = '') => { results.push({ name, pass: !!pass }); console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${detail ? ' :: ' + detail : ''}`); };

const require = createRequire(path.join(DESKTOP, 'package.json'));
const { transform } = createRequire(require.resolve('vite'))('esbuild');
let nonce = 0;
const load = async (src) => {
  const out = await transform(src.replace(/\r\n?/g, '\n'), { loader: 'ts', format: 'esm' });
  nonce += 1;
  return import('data:text/javascript;base64,' + Buffer.from(`${out.code}\n// load ${nonce}`).toString('base64'));
};
// one call under a given global window (undefined = no window); returns { value } or { threw }
const call = (mod, win) => {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'window'), was = globalThis.window;
  if (win === undefined) delete globalThis.window; else globalThis.window = win;
  try { return { value: mod.isArbor2() }; } catch (e) { return { threw: String(e && e.message || e) }; }
  finally { if (had) globalThis.window = was; else delete globalThis.window; }
};
const at = (search, hash) => ({ location: { search, hash } });

const src = fs.readFileSync(FLAG, 'utf8');
const real = await load(src);

const f1 = call(real, undefined);
ok('F1 no window -> false', f1.value === false, JSON.stringify(f1));
const f2 = call(real, { addEventListener() {} });
ok('F2 a window without a location -> false, no throw (the guard)', f2.value === false && !f2.threw, JSON.stringify(f2));
const live = { search1: call(real, at('?arbor2=1', '#/')), hash1: call(real, at('', '#/page/x?arbor2=1')), off: call(real, at('?arbor2=0', '#/')), none: call(real, at('', '#/')) };
ok('F3 liveness: ?arbor2=1 (search) -> true, in the hash query -> true, ?arbor2=0 -> false, none -> false',
  live.search1.value === true && live.hash1.value === true && live.off.value === false && live.none.value === false, JSON.stringify(live));

const births = ['src/arbor2/newPageSize.ts', 'src/store/newPageSize.ts'].map((p) => path.join(DESKTOP, p)).filter((p) => fs.existsSync(p));
const calls = births.filter((p) => /\bisArbor2\s*\(/.test(fs.readFileSync(p, 'utf8')));
ok('F4 the reason stands: page birth (newPageSize) still calls isArbor2', calls.length > 0, JSON.stringify(births.map((p) => path.relative(DESKTOP, p))));

// MUT: the guard removed, in memory only
const GUARD = "if (typeof window === 'undefined' || !window.location) return false;";
const landed = src.includes(GUARD);
const mutant = landed ? await load(src.replace(GUARD, "if (typeof window === 'undefined') return false;")) : null;
const m2 = mutant ? call(mutant, { addEventListener() {} }) : null;
ok('MUT premise: the guard is in the source as pinned, and the mutant replaced it', landed && !!mutant, '');
ok('MUT the guard-less mutant FAILS F2 (it throws or does not return false on a window without a location)', !!m2 && (!!m2.threw || m2.value !== false), JSON.stringify(m2));

const failed = results.filter((r) => !r.pass);
console.log(failed.length ? `ARBOR2-FLAG VERIFY: FAIL (${failed.length} of ${results.length})` : `ARBOR2-FLAG VERIFY: PASS (${results.length} checks)`);
process.exit(failed.length ? 1 : 0);
