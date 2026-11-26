// TUTOR-B (Nov 26) — A 60-SECOND LIMIT ON THE MODEL CALL (Fable, Nov 26, 1:20 pm). BROWSERLESS, SERVER ONLY, NO KEY: the real routes (apps/server/src/tutor.ts) run against a stand-in model on localhost.
// A live reply came back empty after 607 seconds (run 45881901200, B24); the route set no limit of its own, so she could have waited the SDK's ten minutes. The SDK's own `timeout` is not enough: it stops
// counting once the response's headers arrive, so a model that answers its headers at once and then stalls is not bounded by it. The limit covers the whole call.
//   TL1  the limit is 60 seconds
//   TL2  chat: a model that sends nothing for longer than the limit: 502 with the usual "could not be reached" line, soon after the limit
//   TL3  chat: a model that sends its headers at once and stalls on the body (the shape the SDK's timeout misses): the same
//   TL4  SPRINT: both stalls end the same way (502, so the client gives her a line from its local deck)
//   TL5  chat: the guard's second ask is held to the same limit
//   TL6  a reply inside the limit is untouched
//   MUT1 no limit on the chat call: TL3 goes RED   MUT2 no limit on the SPRINT call: TL4 goes RED
// For the runs below the limit is shortened in the loaded module (a mutant of the number only). Run (from apps/desktop): node scripts/harness/tutor-call-limit.mjs
import { loadServer, swap, findHandler, callRoute } from '../../../server/scripts/tutor-eval/load-server.mjs';
import { startStandInModel } from '../../../server/scripts/tutor-eval/stand-in-model.mjs';

let fails = 0;
let checks = 0;
const ok = (cond, msg, detail = '') => { checks += 1; console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}${detail ? `  [${String(detail).slice(0, 400)}]` : ''}`); if (!cond) fails += 1; };
const GOOD = 'A reader may lose the thread at the second sentence. Which sentence carries the claim?\nRead: Part 1.';
const BODY = { messages: [{ role: 'writer', text: 'Where does this drag?' }] };
const LIMIT = 700;      // the shortened limit the runs use
const STALL = 4000;     // how long the stand-in holds a stalled reply
const SOON = 2500;      // "soon after the limit": well under the stall
const CHAT_LINE = 'The Tutor could not be reached right now.';
const SPRINT_LINE = 'The Consultant could not be reached right now.';

const model = await startStandInModel();
process.env.TUTOR_API_KEY = 'harness-key-not-real';
process.env.TUTOR_BASE_URL = `http://127.0.0.1:${model.port}`;
process.env.TUTOR_DAILY_BUDGET = '500';
process.env.TUTOR_GLOBAL_DAILY_BUDGET = '5000';
process.env.SESSION_SECRET = 'harness-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://unused/unused';
delete process.env.TUTOR_DISABLED;

const finish = async () => {
  await model.close();
  console.log(fails === 0 ? `\nTUTOR-CALL-LIMIT VERIFY: PASS (${checks} checks)` : `\nTUTOR-CALL-LIMIT VERIFY: FAIL - ${fails}/${checks} failed`);
  process.exit(fails === 0 ? 0 : 1);
};

const SHORT = swap('MODEL_CALL_MS = 60_000', `MODEL_CALL_MS = ${LIMIT}`);
const load = (...more) => {
  const s = loadServer({ mutate: { 'tutor.ts': (src) => more.reduce((t, f) => f(t), SHORT(src)) } });
  const router = s.load('tutor.ts').tutorRouter;
  return { s, chat: findHandler(router, '/tutor/chat'), sprint: findHandler(router, '/tutor/sprint-prompt') };
};
let n = 0;
const timed = async (handler, body, ...queue) => {
  model.reset(); model.say(...queue);
  const t0 = Date.now();
  const r = await callRoute(handler, body, `u-tl-${n += 1}`);
  return { ...r, ms: Date.now() - t0, calls: model.requests.length };
};
const cut = (r, line) => r.status === 502 && r.body && r.body.error === line && r.ms < SOON;
const shown = (r) => `status=${r.status} ms=${r.ms} calls=${r.calls} ${JSON.stringify(r.body).slice(0, 160)}`;

// ---- TL1 ----
const real = loadServer();
ok(real.load('tutor.ts').MODEL_CALL_MS === 60_000, 'TL1 the limit on a model call is 60 seconds', String(real.load('tutor.ts').MODEL_CALL_MS));
real.cleanup();

let m = null;
try { m = load(); } catch (e) { ok(false, 'TL2 to TL6 the route holds its model call to a limit', e.message); await finish(); }

const quiet = await timed(m.chat, BODY, { text: GOOD, stallHead: STALL });
ok(cut(quiet, CHAT_LINE), 'TL2 chat: a model that sends nothing is given up on at the limit, with the usual line', shown(quiet));
const dribble = await timed(m.chat, BODY, { text: GOOD, stallBody: STALL });
ok(cut(dribble, CHAT_LINE), 'TL3 chat: headers at once and then a stalled body is given up on at the limit too', shown(dribble));
const s1 = await timed(m.sprint, { seen: [] }, { text: 'Write about a door.', stallHead: STALL });
const s2 = await timed(m.sprint, { seen: [] }, { text: 'Write about a door.', stallBody: STALL });
ok(cut(s1, SPRINT_LINE) && cut(s2, SPRINT_LINE), 'TL4 SPRINT: both stalls end at the limit, as a plain failure', `${shown(s1)} | ${shown(s2)}`);
const again = await timed(m.chat, BODY, { text: null }, { text: GOOD, stallBody: STALL });
ok(cut(again, CHAT_LINE) && again.calls === 2, 'TL5 the guard\'s second ask is held to the same limit', shown(again));
const quick = await timed(m.chat, BODY, { text: GOOD, stallBody: 100 });
ok(quick.status === 200 && quick.body.reply === GOOD, 'TL6 a reply inside the limit comes through untouched', shown(quick));
m.s.cleanup();

// ---- mutants ----
try {
  const m1 = load(swap('}, { signal: AbortSignal.timeout(MODEL_CALL_MS) });   // chat', '});   // chat'));
  const r1 = await timed(m1.chat, BODY, { text: GOOD, stallBody: STALL });
  ok(!cut(r1, CHAT_LINE), 'MUT1 no limit on the chat call: TL3 goes RED', shown(r1));
  m1.s.cleanup();
  const m2 = load(swap('}, { signal: AbortSignal.timeout(MODEL_CALL_MS) });   // sprint', '});   // sprint'));
  const r2 = await timed(m2.sprint, { seen: [] }, { text: 'Write about a door.', stallBody: STALL });
  ok(!cut(r2, SPRINT_LINE), 'MUT2 no limit on the SPRINT call: TL4 goes RED', shown(r2));
  m2.s.cleanup();
} catch (e) { ok(false, 'MUT1/MUT2 could not be built', e.message); }

await finish();
