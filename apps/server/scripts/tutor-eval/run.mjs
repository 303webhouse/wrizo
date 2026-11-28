// TUTOR-B ITEM 2 — THE TEST RUNNER for the writing aid (TUTOR build-list item 2; shaped as Fable ruled). It sits beside the server and imports the SAME prompt builder (apps/server/src/tutorPrompts.ts) and the SAME
// reply guard (apps/server/src/tutorGuard.ts) the server ships, through load-server.mjs, so what is tested is what runs. Synthetic cases only: cases.json (the kit's eval-set) and drafts.json (made-up drafts).
//
//   FREE, any time, no key, no model:   node apps/server/scripts/tutor-eval/run.mjs --recorded [files...]      (default: every file in ./recorded)
//        The machine checks M1 to M7 on recorded replies. A recording made by a live run also carries the second reader's answers, which are read back (not asked again).
//   BY HAND ONLY, costs money:          node apps/server/scripts/tutor-eval/run.mjs --live --out recorded/<name>.json [--only A1,B2] [--max-calls 220] [--max-tokens 300000] [--no-grader]
//        Real model calls under a HARD CAP (live.mjs). Run as the Actions job .github/workflows/tutor-eval-live.yml; the keys are repository secrets Nick adds himself:
//          TUTOR_EVAL_API_KEY          the key for the model whose replies are tested (the same kind of key as the server's TUTOR_API_KEY)
//          TUTOR_EVAL_GRADER_API_KEY   the key for the second reader (optional: without it the live run records the replies and runs the machine checks only; the graded questions stay "pending")
//        Not secrets, and optional: TUTOR_EVAL_BASE_URL, TUTOR_EVAL_MODEL, TUTOR_EVAL_GRADER_BASE_URL, TUTOR_EVAL_GRADER_MODEL. A reply's token cap is the route's own (tutorPrompts.ts).
//   --list prints what the runner will run and what it will not (and why).
//
// A case passes when every machine check passes AND every listed second-reader question gets the answer the case wants (checks.mjs). One wrong answer fails it; no partial credit, no overall score.
// A fixture file marked `selfTest` holds hand-written replies that are SUPPOSED to fail some checks (they prove the checks catch what they should); each carries `expect`, and is reported as ok when it behaves as expected.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadServer } from './load-server.mjs';
import { evaluateCase } from './checks.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const CASES = JSON.parse(fs.readFileSync(path.join(here, 'cases.json'), 'utf8')).cases;
const DRAFTS = JSON.parse(fs.readFileSync(path.join(here, 'drafts.json'), 'utf8')).drafts;

export function loadModules() {
  const s = loadServer({ files: ['tutorGuard.ts', 'tutorPrompts.ts'] });
  return { guard: s.load('tutorGuard.ts'), prompts: s.load('tutorPrompts.ts'), cleanup: s.cleanup };
}
// the kit's section 8 words, read from the kit's own file: the safety cases compare what she would see with THIS, not with the code's copy
const KIT_WORDS = JSON.parse(fs.readFileSync(path.join(here, 'prompts-v0.5.json'), 'utf8')).blocks.safetyMessage;

// ---- evaluate recordings (free) ----
export function evaluateRecording(file, { guard, prompts = null }) {
  const rec = JSON.parse(fs.readFileSync(file, 'utf8'));
  const byId = new Map(CASES.map((c) => [c.id, c]));
  const results = [];
  for (const e of rec.entries ?? []) {
    const c = e.case ? { ...e.case, ...(byId.get(e.id) ?? {}), ...e.case } : byId.get(e.id);
    if (!c) { results.push({ id: e.id, status: 'unknown-case', notes: ['no such case'] }); continue; }
    const r = evaluateCase(c, e, { guard, drafts: DRAFTS, prompts, words: KIT_WORDS });
    if (e.expect) {
      const failed = r.machine.filter((k) => !k.pass).map((k) => k.id);
      const wantFailed = (e.expect.fails ?? []).slice().sort();
      const got = [...new Set(failed)].sort();
      r.selfTest = { wantFailed, got, ok: JSON.stringify(wantFailed) === JSON.stringify(got) };
    }
    results.push(r);
  }
  return { file, kind: rec.kind ?? 'recording', meta: { model: rec.model, promptVersion: rec.promptVersion, at: rec.at }, results };
}

const mark = (r) => r.selfTest ? (r.selfTest.ok ? 'fixture ok' : 'FIXTURE WRONG') : ({ pass: 'pass', fail: 'FAIL', 'machine-pass': 'machine-pass (second reader pending)', 'no-reply': 'no reply', 'unknown-case': 'unknown case' }[r.status] ?? r.status);

export function summarise(evals) {
  let pass = 0; let fail = 0; let pending = 0; let bad = 0;
  for (const ev of evals) for (const r of ev.results) {
    if (r.selfTest) { if (!r.selfTest.ok) bad += 1; continue; }
    if (r.status === 'pass') pass += 1; else if (r.status === 'machine-pass') pending += 1; else fail += 1;
  }
  return { pass, fail, pending, bad };
}

function printEval(ev) {
  console.log(`\n== ${path.basename(ev.file)} (${ev.kind}${ev.meta.model ? `, ${ev.meta.model}` : ''}${ev.meta.promptVersion ? `, prompts v${ev.meta.promptVersion}` : ''})`);
  for (const r of ev.results) {
    const bad = r.machine?.filter((k) => !k.pass).map((k) => `${k.id}${k.variant ? `(${k.variant})` : ''}: ${k.detail || 'failed'}`) ?? [];
    const gr = r.graders?.filter((g) => g.pass === false).map((g) => `${g.id} answered ${g.answer}, wanted ${g.want}${g.why ? ` (${g.why})` : ''}`) ?? [];
    console.log(`${(r.selfTest ? (r.selfTest.ok ? 'ok  ' : 'BAD ') : r.status === 'fail' ? 'FAIL' : 'ok  ')} ${String(r.id).padEnd(5)} ${mark(r)}${[...bad, ...gr].length ? `  [${[...bad, ...gr].join(' | ')}]` : ''}${r.selfTest && !r.selfTest.ok ? `  [wanted failures ${r.selfTest.wantFailed.join(',') || 'none'}, got ${r.selfTest.got.join(',') || 'none'}]` : ''}`);
  }
}

// ---- the live run ----
async function liveRun(args) {
  const { makeCap, makeClients, makeRoute, liveRoute, liveReply, liveSprint, liveGrade, CapReached, safeError } = await import('./live.mjs');
  const env = process.env;
  if (!env.TUTOR_EVAL_API_KEY) { console.error('TUTOR_EVAL_API_KEY is not set. The live run waits for Nick to add that repository secret. Nothing was called.'); process.exit(3); }
  const num = (v, d, hi) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.min(n, hi) : d; };
  const cap = makeCap({ maxCalls: num(args.maxCalls, 220, 400), maxTokens: num(args.maxTokens, 300000, 600000) });
  const clients = makeClients(env);
  const useGrader = !args.noGrader && !!clients.grader;
  const { guard, prompts, cleanup } = loadModules();
  const only = args.only ? new Set(args.only.split(',')) : null;
  // a case marked `byName` (the walk's W3 to W12) runs only when `only` names it, so a full run stays the size it was and keeps inside its 120 calls
  const todo = CASES.filter((c) => (c.kind === 'reply' || c.kind === 'safety') && (only ? only.has(c.id) : !c.byName));
  const out = { _about: 'A live run of the TUTOR test set. Replies from the real model, the machine checks, and (when a second-reader key was given) its answers. Synthetic cases only.', kind: 'live-run', promptVersion: '0.5', model: clients.replyModel, graderModel: useGrader ? clients.graderModel : null, at: new Date().toISOString(), cap: null, entries: [], notRun: [], sprint: [] };
  console.log(`LIVE RUN: ${todo.length} cases, reply model ${clients.replyModel}, second reader ${useGrader ? clients.graderModel : 'off'}, cap ${cap.state.maxCalls} calls / ${cap.state.maxTokens} tokens`);
  let stop = false;
  const route = todo.some((c) => c.walk) ? makeRoute({ clients, env }) : null;
  const runOne = async (c) => {
    if (stop) { out.notRun.push({ id: c.id, why: 'cap reached' }); return; }
    try {
      const draftText = c.draft ? DRAFTS[c.draft].text : null;
      const replies = [];
      if (c.walk) replies.push(await liveRoute({ cap, route, c, draftText }));
      else for (const v of (c.variants ?? [null])) replies.push(await liveReply({ clients, cap, prompts, c, variant: v, draftText }));
      const entry = { id: c.id, replies };
      if (useGrader) {
        // the machine checks first: the second reader is asked for what the case lists, plus G8 when a word was flagged
        const first = evaluateCase(c, entry, { guard, drafts: DRAFTS, prompts, words: KIT_WORDS });
        const questions = [...c.graders, ...(first.flagged.length ? ['G8'] : [])];
        if (questions.length) entry.graded = await liveGrade({ clients, cap, c, draftText, replies, questions });
      }
      out.entries.push(entry);
    } catch (e) {
      if (e instanceof CapReached) { stop = true; out.notRun.push({ id: c.id, why: 'cap reached' }); } else { out.notRun.push({ id: c.id, why: `call failed (${safeError(e)})` }); }
    }
  };
  // three at a time; the cap is taken before each call, so the pool can never pass it
  const queue = todo.filter((c) => !c.walk);
  await Promise.all(Array.from({ length: 3 }, async () => { while (queue.length) await runOne(queue.shift()); }));
  // then the walk's cases, one at a time (liveRoute)
  for (const c of todo.filter((x) => x.walk)) await runOne(c);
  route?.cleanup();
  // SPRINT's one prompt (Fable, Nov 25: show what it really returns live): a FULL run ends with five calls as the route made them before (a cap of 80) and five as it makes them now. LAST, so they never take room from the cases.
  if (!only && !stop) {
    for (const maxTokens of [80, 80, 80, 80, 80, ...Array(5).fill(prompts.SPRINT_MAX_TOKENS)]) {
      try {
        const s = await liveSprint({ clients, cap, prompts, maxTokens });
        out.sprint.push(s);
        console.log(`SPRINT cap ${maxTokens}: stop ${s.stop}, thought ${s.thought}, ${s.reply.length} characters, ${s.usage.output} tokens out, ${s.ms} ms`);
      } catch (e) {
        out.notRun.push({ id: `SPRINT ${maxTokens}`, why: e instanceof CapReached ? 'cap reached' : `call failed (${safeError(e)})` });
        if (e instanceof CapReached) break;
      }
    }
  }
  out.entries.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  out.cap = { ...cap.state };
  cleanup();
  if (args.out) { fs.mkdirSync(path.dirname(path.resolve(args.out)), { recursive: true }); fs.writeFileSync(args.out, JSON.stringify(out, null, 1) + '\n'); console.log(`wrote ${args.out}: ${out.entries.length} cases recorded, ${out.notRun.length} not run, ${cap.state.calls} calls, about ${cap.state.tokens} tokens`); }
  return out;
}

// ---- main ----
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const args = { files: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--live') args.live = true;
    else if (a === '--recorded') args.recorded = true;
    else if (a === '--list') args.list = true;
    else if (a === '--no-grader') args.noGrader = true;
    else if (['--out', '--only', '--max-calls', '--max-tokens'].includes(a)) args[a.slice(2).replace(/-(\w)/g, (_, x) => x.toUpperCase())] = argv[++i];
    else if (!a.startsWith('--')) args.files.push(a);
    else { console.error(`unknown option ${a}`); process.exit(2); }
  }
  if (args.list) {
    const k = (x) => CASES.filter((c) => c.kind === x);
    console.log(`${CASES.length} cases: ${k('reply').length} the runner runs, ${k('safety').length} expect the safety marker (run, checked without a second reader), ${k('app').length} test the app (not run here), ${k('skipped').length} wait for something not built:`);
    for (const c of k('skipped')) console.log(`  ${c.id}: ${c.skip}`);
    process.exit(0);
  }
  if (args.live) {
    const out = await liveRun(args);
    // a live run's machine checks, immediately (the same free code)
    const m = loadModules();
    const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'tutor-eval-')), 'this-run.json');
    fs.writeFileSync(tmp, JSON.stringify(out));
    const ev = evaluateRecording(tmp, { guard: m.guard, prompts: m.prompts });
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
    m.cleanup();
    printEval(ev);
    const s = summarise([ev]);
    console.log(`\nTUTOR-EVAL LIVE: ${s.fail === 0 ? 'PASS' : 'FAIL'} (${s.pass} pass, ${s.pending} machine-pass with the second reader pending, ${s.fail} fail, ${out.notRun.length} not run)`);
    // NOT process.exit(): the model client leaves keep-alive sockets open, and on Windows (Node 24) exiting with them still open aborts the process (libuv assertion) and hides this verdict behind a crash code. Setting the code and letting the loop drain is clean.
    process.exitCode = s.fail === 0 && out.notRun.length === 0 ? 0 : 1;
  } else {
    const dir = path.join(here, 'recorded');
    const files = args.files.length ? args.files : fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(dir, f));
    const m = loadModules();
    const evals = files.map((f) => evaluateRecording(f, { guard: m.guard, prompts: m.prompts }));
    m.cleanup();
    evals.forEach(printEval);
    const s = summarise(evals);
    console.log(`\nTUTOR-EVAL RECORDED: ${s.fail === 0 && s.bad === 0 ? 'PASS' : 'FAIL'} (${s.pass} pass, ${s.pending} machine-pass, ${s.fail} fail, ${s.bad} fixture${s.bad === 1 ? '' : 's'} wrong)`);
    process.exit(s.fail === 0 && s.bad === 0 ? 0 : 1);
  }
}
