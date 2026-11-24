// TUTOR-B ITEM 1, THE CLIENT'S ONE LINE (Fable, Nov 23, 5:20 pm, call 2) — the request body carries the theme's NAME. BROWSERLESS, NO KEY, NO BOX TURN: the real apps/desktop/src/store/api.ts is transpiled with the
// server's own TypeScript into a scratch folder under apps/server, run with a stub `document` and a stub `fetch`, and the body it builds is then fed to the REAL /tutor/chat route against a stand-in model,
// so the whole chain (theme -> body -> voice) is read, not assumed.
//   TW1  each theme the app has sends its name: plateau -> "arbor", flux -> "flux", machina -> "machina" (the voice names the server's fixed list holds)
//   TW2  the name is ALL that is added: the body's keys are exactly the old ones plus `theme`; nothing of her words is in it; a body with no delta/bible/selection still sends none of those keys
//   TW3  no theme (no document, no data-theme, or one the app does not know) sends NO theme key at all (absent stays absent); the server then sends the neutral prompt
//   TW4  the whole chain: the body each theme's ask builds, sent to the real route, makes the model receive that theme's own voice block (and none of the others)
//   MUT1 the theme line removed from api.ts: TW1 goes RED   MUT2 plateau sent as its own name (not "arbor"): TW1/TW4 go RED
// Run (from apps/desktop): node scripts/harness/tutor-theme-wire.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadServer, findHandler, callRoute, SERVER, svRequire } from '../../../server/scripts/tutor-eval/load-server.mjs';
import { startStandInModel } from '../../../server/scripts/tutor-eval/stand-in-model.mjs';
import { withDepartures } from '../../../server/scripts/tutor-eval/kit-departures.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const STORE = path.resolve(here, '..', '..', 'src', 'store');
const ts = svRequire('typescript');
let fails = 0; let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 400)}]` : ''}`); if (!cond) fails += 1; };

let n = 0;
// the real client modules (api.ts and the one file it imports as a value, markRuns.ts), optionally with ONE in-memory edit
function loadClient(mutate) {
  const tmp = path.join(SERVER, `.tutor-eval-scratch-wire-${process.pid}-${n++}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  for (const f of ['api.ts', 'markRuns.ts']) {
    let src = fs.readFileSync(path.join(STORE, f), 'utf8');
    if (mutate && f === 'api.ts') src = mutate(src);
    fs.writeFileSync(path.join(tmp, f.replace(/\.ts$/, '.js')), ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText);
  }
  const api = createRequire(path.join(tmp, 'x.js'))(path.join(tmp, 'api.js'));
  return { api, cleanup: () => fs.rmSync(tmp, { recursive: true, force: true }) };
}
const realFetch = globalThis.fetch; // the stand-in model below is reached through the real one
// run one ask through the client with a given data-theme on the root; returns the body it sent (parsed) or null
async function bodyFor(api, dataTheme, args = [[{ role: 'writer', text: 'Where does this drag?' }]]) {
  let sent = null;
  globalThis.fetch = async (_p, init) => { sent = init && init.body; return { ok: true, json: async () => ({ configured: true, reply: 'ok' }) }; };
  if (dataTheme === undefined) delete globalThis.document;
  else globalThis.document = { documentElement: { getAttribute: (k) => (k === 'data-theme' ? dataTheme : null) } };
  try { await api.apiTutorChat(...args); } finally { globalThis.fetch = realFetch; delete globalThis.document; }
  return sent ? JSON.parse(sent) : null;
}

const c = loadClient();
const NAMES = { plateau: 'arbor', flux: 'flux', machina: 'machina' };
const got = {};
for (const t of Object.keys(NAMES)) got[t] = await bodyFor(c.api, t);
ok(Object.entries(NAMES).every(([t, v]) => got[t] && got[t].theme === v), 'TW1 each theme sends its voice name: plateau -> "arbor", flux -> "flux", machina -> "machina"', JSON.stringify(Object.fromEntries(Object.entries(got).map(([t, b]) => [t, b && b.theme]))));

const full = await bodyFor(c.api, 'flux', [[{ role: 'writer', text: 'Where does this drag?' }], 'new page words', 'a bible fact', 'a selected stretch']);
ok(full && JSON.stringify(Object.keys(full).sort()) === JSON.stringify(['bible', 'delta', 'messages', 'selection', 'theme']), 'TW2 the body is the old four keys plus `theme`, and nothing else', full && Object.keys(full).join(','));
const plain = got.machina;
ok(plain && JSON.stringify(Object.keys(plain).sort()) === JSON.stringify(['messages', 'theme']) && !('delta' in plain) && !('bible' in plain) && !('selection' in plain), 'TW2 an ask with no delta, bible or selection still sends none of those keys', plain && Object.keys(plain).join(','));
ok(full && typeof full.theme === 'string' && full.theme.length <= 8 && !JSON.stringify(full.theme).includes('Where does this drag') && Object.values(NAMES).includes(full.theme), 'TW2 the theme value is one of the three fixed names, never her words');

const none = await bodyFor(c.api, undefined);
const unknown = await bodyFor(c.api, 'volant');
const empty = await bodyFor(c.api, '');
ok(none && !('theme' in none) && unknown && !('theme' in unknown) && empty && !('theme' in empty), 'TW3 no document, an unknown data-theme or an empty one sends NO theme key at all', JSON.stringify([none && Object.keys(none), unknown && Object.keys(unknown), empty && Object.keys(empty)]));

// ---- TW4: the whole chain through the real route ----
const model = await startStandInModel();
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = `http://127.0.0.1:${model.port}`;
process.env.TUTOR_DAILY_BUDGET = '500';
process.env.TUTOR_GLOBAL_DAILY_BUDGET = '5000';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
delete process.env.TUTOR_DISABLED;
const ORACLE = withDepartures(JSON.parse(fs.readFileSync(path.join(SERVER, 'scripts', 'tutor-eval', 'prompts-v0.3.json'), 'utf8')).blocks);
const voiceOf = { plateau: ORACLE.voiceArbor, flux: ORACLE.voiceFlux, machina: ORACLE.voiceMachina };
const srv = loadServer();
const handler = findHandler(srv.load('tutor.ts').tutorRouter, '/tutor/chat');
const chain = async (client, t) => { const body = await bodyFor(client.api, t); model.reset(); model.say('Which sentence carries the claim?\nRead: Part 1.'); await callRoute(handler, body, 'u-tw4-' + t); return String((model.requests[0] || {}).system || ''); };
const bad = [];
for (const t of Object.keys(voiceOf)) {
  const sys = await chain(c, t);
  const own = sys.includes(voiceOf[t]);
  const others = Object.entries(voiceOf).filter(([k]) => k !== t).some(([, v]) => sys.includes(v));
  if (!own || others) bad.push(t);
}
ok(bad.length === 0, 'TW4 the body each theme\'s ask builds, sent to the real route, makes the model receive that theme\'s own voice block and none of the others', bad.join(' '));
const sysNone = await (async () => { const body = await bodyFor(c.api, undefined); model.reset(); model.say('x?\nRead: Part 1.'); await callRoute(handler, body, 'u-tw4-none'); return String((model.requests[0] || {}).system || ''); })();
ok(!Object.values(voiceOf).some((v) => sysNone.includes(v)), 'TW4 with no theme the route sends the neutral prompt: no voice block');
c.cleanup();

// ---- mutants ----
{
  const m1 = loadClient((s) => { if (!s.includes('theme: tutorThemeName(),')) throw new Error('mutant anchor missing'); return s.replace('theme: tutorThemeName(),', ''); });
  const b = await bodyFor(m1.api, 'flux');
  ok(!(b && b.theme === 'flux'), 'MUT1 the theme line removed from api.ts: TW1 goes RED');
  m1.cleanup();
  const m2 = loadClient((s) => { if (!s.includes("t === 'plateau' ? 'arbor'")) throw new Error('mutant anchor missing'); return s.replace("t === 'plateau' ? 'arbor'", "t === 'plateau' ? 'plateau'"); });
  const b2 = await bodyFor(m2.api, 'plateau');
  model.reset(); model.say('x?\nRead: Part 1.'); await callRoute(handler, b2, 'u-tw4-m2');
  ok(!(b2 && b2.theme === 'arbor') && !String((model.requests[0] || {}).system || '').includes(ORACLE.voiceArbor), 'MUT2 plateau sent as its own name: TW1/TW4 go RED (the writer in Arbor gets no voice)');
  m2.cleanup();
}
srv.cleanup();
model.close();
console.log(fails === 0 ? `\nTUTOR-THEME-WIRE VERIFY: PASS (${checks} checks)` : `\nTUTOR-THEME-WIRE VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
