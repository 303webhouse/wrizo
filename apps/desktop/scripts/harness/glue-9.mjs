// GLUE #9 - the seams between W2 (FIX), W5 (INK) and TOOLS #9 on train #9's tree. Browserless; no box turn. Run: node scripts/harness/glue-9.mjs (from apps/desktop).
//   G1 the Walk's door order is Notes - W2's doors (Write this, Place a page...) - [Add scenes... joins here when it lands] - Mark lit (LIT IS LAST)
//   G2 celebrateReturnChip is wired into FIX's chip, on BOTH of its renderings, and only where data-return-chip is "step" (a page born from a step), through ONE stable ref callback
//   G3 the glow is the W5 export: once per element, idempotent (the real module, a fake element)
//   G4 nothing else calls it (W5 exports it; FIX's chip is the one caller)
//   G5 Flux's walkReadoutPlan is "Circuit" (Fable's ruling Oct 26) - W1's L2 (no Arbor noun under Flux) goes green on train #9's tree
// Every check has a mutant, its landing asserted.
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
const readRaw = (rel) => (fs.existsSync(path.join(SRC, rel)) ? noCR(fs.readFileSync(path.join(SRC, rel), 'utf8')) : '');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

let nonce = 0;
async function load(over = {}) {
  nonce += 1;
  const res = await build({
    stdin: { contents: `export const __n = ${nonce}; export { celebrateReturnChip } from './store/deckRewards'; export { deskTerm } from './store/deskLexicon';`, resolveDir: SRC, loader: 'ts' },
    bundle: true, write: false, format: 'esm', platform: 'node', logLevel: 'silent', nodePaths: [path.join(DESKTOP, 'node_modules')], external: ['@fontsource/*', '@fontsource-variable/*'],
    plugins: [{ name: 'ov', setup(b) { b.onLoad({ filter: /\.ts$/ }, (args) => { const rel = path.relative(SRC, args.path).split('\\').join('/'); const text = noCR(fs.readFileSync(args.path, 'utf8')); return { contents: over[rel] ? over[rel](text) : text, loader: 'ts' }; }); } }],
  });
  const map = new Map();
  globalThis.window = { addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; }, matchMedia: () => ({ matches: false }), innerWidth: 1400 };
  globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {}, querySelectorAll: () => [], documentElement: { getAttribute: () => null } };
  globalThis.localStorage = { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => { map.set(k, String(v)); }, removeItem: (k) => { map.delete(k); }, clear: () => map.clear() };
  return import('data:text/javascript;base64,' + Buffer.from(res.outputFiles[0].text).toString('base64'));
}

function suite(M, rd) {
  const R = {};
  const chk = (id, fn) => { try { const [pass, detail] = fn(); R[id] = { pass: !!pass, detail: detail || '' }; } catch (e) { R[id] = { pass: false, detail: 'threw: ' + String((e && e.message) || e).split('\n')[0].slice(0, 160) }; } };
  const wk = rd('components/Walk.tsx'), pe = rd('pages/PageEditor.tsx');
  chk('G1', () => { const i = wk.indexOf("key: 'notes'"), e = wk.indexOf('p.extraDoors'), l = wk.indexOf("key: 'lit'"); return [i > 0 && e > i && l > e && wk.lastIndexOf("key: '") === l, `Notes (${i}) < W2's doors (${e}) < Mark lit (${l}), and Lit is the last door declared`]; });
  chk('G2', () => { const refs = [...pe.matchAll(/<button[^>]*data-return-chip=[^>]*>/g)].map((m) => m[0]); const calls = (pe.match(/celebrateReturnChip\(/g) || []).length; return [refs.length === 2 && refs.every((r) => /ref=\{(fromStepLabel \? )?glowStepChip(\s*: undefined)?\}/.test(pe.slice(pe.indexOf(r) - 80, pe.indexOf(r) + r.length)) || /glowStepChip/.test(r)) && /const glowStepChip = \(el: HTMLElement \| null\): void => \{ if \(el\) celebrateReturnChip\(el\); \};/.test(pe) && calls === 1 && /import \{ celebrateReturnChip \} from '\.\.\/store\/deckRewards';/.test(pe), `${refs.length} chips, one stable callback, ${calls} call`]; });
  chk('G3', () => { const el = { attrs: {}, classList: { add() {}, remove() {} }, setAttribute(k, v) { this.attrs[k] = v; }, hasAttribute(k) { return k in this.attrs; } }; const a = M.celebrateReturnChip(el), b = M.celebrateReturnChip(el); return [a === true && b === false && M.celebrateReturnChip(null) === false, 'once per element, then nothing']; });
  chk('G4', () => { const hits = []; const walk = (d) => { for (const f of fs.readdirSync(path.join(SRC, d), { withFileTypes: true })) { const rel = path.posix.join(d, f.name); if (f.isDirectory()) walk(rel); else if (/\.(ts|tsx)$/.test(f.name) && /celebrateReturnChip\(/.test(rd(rel))) hits.push(rel); } }; walk('.'); return [hits.sort().join() === 'pages/PageEditor.tsx,store/deckRewards.ts', 'callers: ' + hits.join(', ')]; });
  chk('G5', () => { const f = M.deskTerm('walkReadoutPlan', 'flux'), a = M.deskTerm('walkReadoutPlan', 'plateau'), m = M.deskTerm('walkReadoutPlan', 'machina'); return [f === 'Circuit' && a === 'Board' && m === 'Plan' && !/\b(boards?|pages?)\b/i.test(f), `Flux ${f} / Arbor ${a} / Machina ${m}: a Flux board is a Circuit, never an Arbor noun`]; });
  return R;
}
const MUT = [
  { name: 'Lit moves before W2\'s doors', file: 'components/Walk.tsx', find: /    \.\.\.\(p\.extraDoors \?\? \[\]\),\n/, to: '', red: ['G1'] },
  { name: 'the first chip is not wired', file: 'pages/PageEditor.tsx', find: /<button type="button" ref=\{fromStepLabel \? glowStepChip : undefined\} /, to: '<button type="button" ', red: ['G2'] },
  { name: 'the phone chip is not wired', file: 'pages/PageEditor.tsx', find: /ref=\{glowStepChip\} className="btn-quiet wz-back-to-board" data-return-chip="step"/, to: 'className="btn-quiet wz-back-to-board" data-return-chip="step"', red: ['G2'] },
  { name: 'Flux says Board again', file: 'store/deskLexicon.ts', find: /walkReadoutPlan: 'Circuit',/, to: '', red: ['G5'] },
];
const rdOver = (over) => (rel) => { const t = readRaw(rel); return over[rel] ? over[rel](t) : t; };
const M0 = await load();
for (const [k, v] of Object.entries(suite(M0, rdOver({})))) ok(k, v.pass, v.detail);
let killed = 0;
for (const m of MUT) {
  let did = false;
  const over = { [m.file]: (t) => { const o = t.replace(m.find, () => m.to); if (o !== t) did = true; return o; } };
  const res = suite(await load(over), rdOver(over));
  const red = Object.entries(res).filter(([, v]) => !v.pass).map(([k]) => k);
  if (!did) { ok(`mutant "${m.name}" LANDED`, false, 'no match'); continue; }
  const hit = m.red.every((k) => red.includes(k));
  if (hit) killed += 1;
  ok(`mutant "${m.name}" is KILLED (reddens: ${red.join(', ') || 'none'})`, hit);
}
ok(`all ${MUT.length} mutations landed and were killed`, killed === MUT.length, `${killed}/${MUT.length}`);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGLUE-9 VERIFY: FAIL - ${failed.length}/${checks.length}` : `\nGLUE-9 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
