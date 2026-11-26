// TUTOR-B ITEM 2 — THE LIVE HALF. Real model calls, run ONLY by hand (the Actions job .github/workflows/tutor-eval-live.yml, workflow_dispatch). Everything here is bounded by a HARD CAP the run cannot pass:
// a count of model calls and a count of tokens (input estimated before each call, output reserved at max_tokens, both corrected by the usage the provider reports). A call that would pass either cap is not made;
// the run stops, and what was not run is written down as "cap reached". Keys come from the environment only (the workflow hands them in from repository secrets Nick adds himself); nothing here ever prints,
// logs or writes a key, and a failure message is cut down to its status and type before it is shown (the repo is PUBLIC, so a log line is public).
import { svRequire } from './load-server.mjs';
import { graderSystemPrompt, graderUserPrompt, parseGrade } from './grader.mjs';

export class CapReached extends Error {}

export function makeCap({ maxCalls, maxTokens }) {
  const s = { calls: 0, tokens: 0, maxCalls, maxTokens, hit: false };
  return {
    state: s,
    // take room for one call BEFORE making it (output at its max, input estimated at 1 token per 3 characters, rounded up and doubled for safety)
    reserve(inputChars, maxOut) {
      const est = Math.ceil(inputChars / 3) * 2 + maxOut;
      if (s.calls + 1 > s.maxCalls || s.tokens + est > s.maxTokens) { s.hit = true; throw new CapReached(`cap reached: ${s.calls}/${s.maxCalls} calls, ${s.tokens}/${s.maxTokens} tokens`); }
      s.calls += 1; s.tokens += est;
      return est;
    },
    // after the call: swap the estimate for what the provider said was really used
    settle(est, usage) { if (usage) s.tokens += (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) - est; },
  };
}

const textOf = (r) => r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
// a safe one-line account of a failure: never the key, never a header, never the body
export const safeError = (e) => `${e?.constructor?.name ?? 'Error'}${e?.status ? ` ${e.status}` : ''}`;

export function makeClients(env) {
  const sdk = svRequire('@anthropic-ai/sdk');
  const Anthropic = sdk.default ?? sdk.Anthropic ?? sdk;
  const reply = env.TUTOR_EVAL_API_KEY ? new Anthropic({ apiKey: env.TUTOR_EVAL_API_KEY, baseURL: env.TUTOR_EVAL_BASE_URL || 'https://api.deepseek.com/anthropic', maxRetries: 0 }) : null;
  const grader = env.TUTOR_EVAL_GRADER_API_KEY ? new Anthropic({ apiKey: env.TUTOR_EVAL_GRADER_API_KEY, baseURL: env.TUTOR_EVAL_GRADER_BASE_URL || undefined, maxRetries: 0 }) : null;
  return {
    reply, grader,
    replyModel: env.TUTOR_EVAL_MODEL || 'deepseek-v4-flash',
    graderModel: env.TUTOR_EVAL_GRADER_MODEL || 'claude-fable-5-2',
  };
}

// ONE reply, built the way the route builds it: the SAME prompt builder, the draft as the delta turn, her words last
export async function liveReply({ clients, cap, prompts, c, variant, draftText }) {
  const system = prompts.buildSystemPrompt({ hat: c.hat, voice: variant ?? c.voice, task: c.task });
  const messages = [];
  if (c.notes && c.notes.length) messages.push({ role: 'user', content: prompts.wrapNotes(c.notes) });   // her notes on file, first of the wire turns (tutor.ts, item 7 step 2)
  // a walk case (c.walk) sends her step in ONE <walk-step> turn; its draft is her note for that step, never a page delta
  if (c.walk) messages.push({ role: 'user', content: prompts.wrapWalkStep({ ...c.walk, note: draftText ?? '' }) });
  else if (draftText) messages.push({ role: 'user', content: prompts.wrapDelta(draftText) });
  messages.push({ role: 'user', content: c.says });
  const est = cap.reserve(system.length + messages.reduce((n, m) => n + m.content.length, 0), prompts.CHAT_MAX_TOKENS);
  const t0 = Date.now();
  const r = await clients.reply.messages.create({ model: clients.replyModel, max_tokens: prompts.CHAT_MAX_TOKENS, system, messages });
  cap.settle(est, r.usage);
  return { variant: variant ?? null, reply: textOf(r), ...howItEnded(r, t0) };
}
// SPRINT's one prompt, built the way the route builds it (nothing of hers is in it), at the cap named: the old 80, or the route's own now
export async function liveSprint({ clients, cap, prompts, maxTokens }) {
  const system = prompts.buildSprintSystemPrompt(prompts.SPRINT_RULES);
  const content = prompts.sprintAsk([]);
  const est = cap.reserve(system.length + content.length, maxTokens);
  const t0 = Date.now();
  const r = await clients.reply.messages.create({ model: clients.replyModel, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] });
  cap.settle(est, r.usage);
  return { maxTokens, reply: textOf(r), ...howItEnded(r, t0) };
}
// why it stopped, whether it thought first, how long it took, what it cost: enough to tell a cut-off or an empty reply from a short one
const howItEnded = (r, t0) => ({ stop: r.stop_reason ?? null, thought: r.content.some((b) => b.type === 'thinking'), ms: Date.now() - t0, usage: { input: r.usage.input_tokens, output: r.usage.output_tokens } });

export async function liveGrade({ clients, cap, c, draftText, replies, questions }) {
  const system = graderSystemPrompt();
  const user = graderUserPrompt({ c, draftText, replies, questions });
  const est = cap.reserve(system.length + user.length, 500);
  const r = await clients.grader.messages.create({ model: clients.graderModel, max_tokens: 500, system, messages: [{ role: 'user', content: user }] });
  cap.settle(est, r.usage);
  return parseGrade(textOf(r), questions);
}
