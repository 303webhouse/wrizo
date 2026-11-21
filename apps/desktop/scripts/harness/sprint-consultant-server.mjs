// BROWSERLESS CHECK for SPRINT'S PROMPTS FROM THE CONSULTANT, THE SERVER'S HALF (Fable, Nov 21, 12:35 am: FIX's queue item 6, "SPRINT's prompts from the Consultant under the strict rules"; Nick approved the local deck for
// Monday, 4:15 pm Nov 20, and the Consultant's strict-rules prompts follow). The strict rules (machina-stage-menus-decide.md F1): one prompt at a time; short; aimed at getting her writing again; no questions back, no
// follow-ups, no conversation, no judging what she wrote; never prose for her page.
// A NEW route, POST /tutor/sprint-prompt (apps/server/src/tutor.ts), beside /tutor/chat and under the same auth, the same per-account rate limit and the same two daily budgets. It is not a chat: its body carries NOTHING OF
// HER PAGE and no conversation, only the prompts already shown this session (`seen`, to avoid repeats); its answer is ONE cleaned line. The REAL route is run (transpiled, the item215 pattern) against a stand-in model on
// localhost, so what reaches the model and what comes back are read, not assumed.
//   SP1  the body is `{ seen? }` and nothing else: a body that carries anything more (her page's words under `delta`, a `messages` thread, a `selection`, a `bible`) is a 400 and the model is never called
//   SP2  what reaches the model: the strict system prompt (one prompt, short, no question back, no follow-up, no conversation, no judging, never prose for her page) and ONE user turn that names only the `seen` prompts
//   SP3  what comes back is cleaned to ONE line: quotes, a "Here's a prompt:" preface, numbering, markdown, and a second line or paragraph are removed; the writer's page text never appears in the answer path
//   SP4  a reply that cannot be a prompt (empty, longer than 200 characters after cleaning, or two sentences of chat) is a 502 with the plain error shape, so the client falls back to the local deck
//   SP5  unconfigured and the kill switch answer the existing `{ configured: false }`; the model is not called
//   SP6  the per-account daily budget is shared with the Tutor: after it is spent the route answers 429 and the model is not called
//   MUT1 the strict-body gate removed: SP1 goes RED
//   MUT2 the cleaning removed: SP3 goes RED
//   MUT3 the strict system prompt blanked: SP2 goes RED
// RED on the tree without the route. Run (from apps/desktop): node scripts/harness/sprint-consultant-server.mjs
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SERVER = path.resolve(here, '..', '..', '..', 'server');
const SERVER_SRC = path.join(SERVER, 'src');
let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 600)}]` : ''}`); if (!cond) fails += 1; };

// ---- the stand-in model (an Anthropic-format endpoint on localhost) ----
let reply = 'Write about the last door you walked through.';
const seenRequests = [];
const model = http.createServer((req, res) => {
  let b = '';
  req.on('data', (c) => { b += c; });
  req.on('end', () => {
    try { seenRequests.push(JSON.parse(b)); } catch { seenRequests.push(null); }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ id: 'msg_1', type: 'message', role: 'assistant', model: 'stand-in', content: [{ type: 'text', text: reply }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 10, output_tokens: 10 } }));
  });
});
await new Promise((r) => model.listen(0, '127.0.0.1', r));
const port = model.address().port;

process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = `http://127.0.0.1:${port}`;
process.env.TUTOR_DAILY_BUDGET = '6';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';

const svRequire = createRequire(path.join(SERVER, 'package.json'));
const svTs = svRequire('typescript');
let n = 0;
function loadAll(mutate) {
  const tmp = path.join(SERVER, `.sprint-consultant-scratch-${n++}`);
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const put = (rel, text) => {
    const out = svTs.transpileModule(text, { compilerOptions: { module: svTs.ModuleKind.CommonJS, target: svTs.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    fs.writeFileSync(path.join(tmp, rel.replace(/\.ts$/, '.js')), out);
  };
  for (const rel of ['env.ts', 'asyncHandler.ts', 'logSafe.ts']) put(rel, fs.readFileSync(path.join(SERVER_SRC, rel), 'utf8'));
  fs.writeFileSync(path.join(tmp, 'auth.js'), 'exports.requireAuth = (req, res, next) => next();\r\n');
  fs.writeFileSync(path.join(tmp, 'rateLimit.js'), 'exports.rateLimit = () => (req, res, next) => next();\r\n');
  let src = fs.readFileSync(path.join(SERVER_SRC, 'tutor.ts'), 'utf8');
  if (mutate) src = mutate(src);
  put('tutor.ts', src);
  const mod = svRequire(path.join(tmp, 'tutor.js'));
  return { mod, tmp };
}
function findHandler(router, routePath) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.path === routePath && layer.route.methods.post) { const s = layer.route.stack; return s[s.length - 1].handle; }
  }
  return null;
}
const call = async (handler, body, userId = 'u1') => {
  const req = { body, session: { userId } };
  const res = { statusCode: 200, body: undefined };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  await handler(req, res, () => {});
  return { status: res.statusCode, body: res.body };
};
const mutate = (from, to) => (src) => { if (!src.includes(from)) throw new Error(`mutant anchor missing: ${from.slice(0, 60)}`); return src.replace(from, to); };

const base = loadAll();
const handler = findHandler(base.mod.tutorRouter, '/tutor/sprint-prompt');
if (!handler) {
  ok(false, 'SP1..SP6 the route POST /tutor/sprint-prompt exists');
  model.close();
  fs.rmSync(base.tmp, { recursive: true, force: true });
  console.log(`\nSPRINT-CONSULTANT-SERVER VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(1);
}

// ---- SP1 ----
const before = seenRequests.length;
const bad = [];
for (const body of [{ seen: [], delta: 'Her own words about the harbour.' }, { messages: [{ role: 'writer', text: 'hello' }] }, { seen: [], selection: 'a stretch' }, { seen: [], bible: 'a fact' }, { seen: 'not an array' }, { seen: ['a', 'b', 'c', 'd'] }, { seen: [''] }, 'nope']) {
  const r = await call(handler, body, 'u-sp1');
  bad.push(r.status);
}
const okBody = await call(handler, { seen: [] }, 'u-sp1');
ok(bad.every((s) => s === 400) && seenRequests.length === before + 1 && okBody.status === 200, 'SP1 the body is { seen? } and nothing else: anything more (her words, a thread, a selection, a bible, a bad seen) is a 400 and the model is never called',
  JSON.stringify({ bad, calls: seenRequests.length - before, ok: okBody.status }));

// ---- SP2 ----
seenRequests.length = 0;
await call(handler, { seen: ['Write about a kitchen at night.', 'Describe a sound you cannot place.'] }, 'u-sp2');
const sent = seenRequests[0] || {};
const sys = String(sent.system || '');
const userTurns = (sent.messages || []);
const allText = JSON.stringify(userTurns);
ok(/exactly one/i.test(sys) && /short/i.test(sys) && /no question back|never ask a question back|do not ask/i.test(sys) && /follow-up/i.test(sys) && /never (write|compose)[^.]*prose/i.test(sys) && /do not (judge|evaluate)/i.test(sys) && userTurns.length === 1 && userTurns[0].role === 'user' && allText.includes('kitchen at night') && allText.includes('sound you cannot place') && !/harbour|page/i.test(allText.replace(/prompt/gi, '')),
  'SP2 what reaches the model: the strict system prompt and ONE user turn naming only the seen prompts',
  JSON.stringify({ sysHas: sys.slice(0, 200), userTurns: userTurns.length }));

// ---- SP3 ----
const cases = [
  ['"Write about the sea."', 'Write about the sea.'],
  ["Here's a prompt: Describe the last room you left.", 'Describe the last room you left.'],
  ['1. Tell me what the stairs remember.', 'Tell me what the stairs remember.'],
  ['**Write about a locked drawer.**', 'Write about a locked drawer.'],
  ['Begin with the smell of rain.\n\nThat should get you going. Would you like another?', 'Begin with the smell of rain.'],
];
const got = [];
for (const [raw] of cases) { reply = raw; const r = await call(handler, { seen: [] }, 'u-sp3'); got.push(r.body && r.body.prompt); }
ok(got.every((g, i) => g === cases[i][1]), 'SP3 the answer is cleaned to ONE line: quotes, a preface, numbering, markdown and a second line or paragraph removed', JSON.stringify(got));

// ---- SP4 ----
const rej = [];
for (const raw of ['', '   ', 'x'.repeat(260), 'What do you think about your draft? Tell me more about it, and I will tell you what I think of the middle.']) { reply = raw; const r = await call(handler, { seen: [] }, 'u-sp4'); rej.push([r.status, r.body && r.body.prompt === undefined && r.body.configured === true && typeof r.body.error === 'string']); }
ok(rej.every(([s, shaped]) => s === 502 && shaped), 'SP4 a reply that cannot be a prompt (empty, over 200 characters, two sentences of chat) is a 502 with the plain error shape, so the client falls back to the local deck', JSON.stringify(rej));

// ---- SP6 (before SP5: SP5 needs a fresh module) ----
reply = 'Write about the last door you walked through.';
let last = null;
let calls0 = seenRequests.length;
for (let i = 0; i < 9; i++) last = await call(handler, { seen: [] }, 'budget-user');
ok(last.status === 429 && seenRequests.length - calls0 <= 6, 'SP6 the per-account daily budget is shared: after it is spent the route answers 429 and the model is not called', JSON.stringify({ last: last.status, modelCalls: seenRequests.length - calls0 }));

// ---- SP5 ----
process.env.TUTOR_DISABLED = '1';
const off = loadAll();
const offHandler = findHandler(off.mod.tutorRouter, '/tutor/sprint-prompt');
seenRequests.length = 0;
const r5 = await call(offHandler, { seen: [] }, 'u-sp5');
delete process.env.TUTOR_DISABLED;
ok(r5.status === 200 && r5.body && r5.body.configured === false && seenRequests.length === 0, 'SP5 the kill switch answers the existing { configured: false } and the model is not called', JSON.stringify(r5));
fs.rmSync(off.tmp, { recursive: true, force: true });

// ---- mutants ----
reply = 'Write about the sea.';
const m1 = loadAll(mutate('if (!isSprintBody(req.body))', 'if (false)'));
const h1 = findHandler(m1.mod.tutorRouter, '/tutor/sprint-prompt');
const r1 = await call(h1, { seen: [], delta: 'Her own words.' }, 'u-m1');
ok(r1.status !== 400, 'MUT1 the strict-body gate removed: SP1 goes RED');
fs.rmSync(m1.tmp, { recursive: true, force: true });
const m2 = loadAll(mutate('const prompt = cleanSprintPrompt(text);', 'const prompt = text;'));
const h2 = findHandler(m2.mod.tutorRouter, '/tutor/sprint-prompt');
reply = '"Write about the sea."';
const r2 = await call(h2, { seen: [] }, 'u-m2');
ok(!r2.body || r2.body.prompt !== 'Write about the sea.', 'MUT2 the cleaning removed: SP3 goes RED');
fs.rmSync(m2.tmp, { recursive: true, force: true });
const m3 = loadAll(mutate('system: SPRINT_SYSTEM_PROMPT,', "system: '',"));
const h3 = findHandler(m3.mod.tutorRouter, '/tutor/sprint-prompt');
seenRequests.length = 0;
await call(h3, { seen: [] }, 'u-m3');
ok(!/exactly one/i.test(String((seenRequests[0] || {}).system || '')), 'MUT3 the strict system prompt blanked: SP2 goes RED');
fs.rmSync(m3.tmp, { recursive: true, force: true });

model.close();
fs.rmSync(base.tmp, { recursive: true, force: true });
console.log(fails === 0 ? `\nSPRINT-CONSULTANT-SERVER VERIFY: PASS (${checks} checks)` : `\nSPRINT-CONSULTANT-SERVER VERIFY: FAIL - ${fails}/${checks} failed`);
process.exit(fails === 0 ? 0 : 1);
