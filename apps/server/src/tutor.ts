import { Router, type Request, type Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { requireAuth } from './auth';
import { rateLimit } from './rateLimit';
import { asyncHandler } from './asyncHandler';
import { logError } from './logSafe';
import { buildSystemPrompt, buildSprintSystemPrompt, voiceForTheme, withSafetyMessage, holdsSafetyMarker, wrapBible, wrapDelta, wrapSelection } from './tutorPrompts';

// TU1 S5 — the Tutor's ONE new route: a writer-initiated proxy to a
// language model, key server-side only (env.tutorApiKey — never sent to,
// or configurable by, the client). Built as minimally as this codebase's
// own existing routes (auth.ts/sync.ts) — no streaming, no tool use, no
// ambient calls (this route only ever fires on a writer's own explicit
// send), no retry loop (the client below constructs the Anthropic client
// with maxRetries: 0 — one attempt, fail fast, surface a plain error
// rather than silently retrying/looping), and a hard per-request
// max_tokens cap (env.tutorMaxTokens). Offline/unconfigured is a
// first-class response shape, not an error path the client has to guess
// at — see the `configured: false` branch below.
//
// A13, mechanically: the system prompt binds the Tutor to speak ABOUT the
// writing, never AS it — reference atoms lawful, composition declined in
// character with a question that sends the writer back to the page. This
// is the ONLY place that system prompt is chosen; the client never sees or
// can influence it. TUTOR-B item 1: the prompt's own words now live in
// tutorPrompts.ts (the kit's v0.3: BASE + HAT + VOICE + TASK + CONTEXT), built
// the same way for the route and for the test runner; this file only picks
// the hat, the voice and the task, and sends the Tutor hat to everyone until the
// hat choice (item 4) is built.
//
// Privacy, matching the disclosure's own wording verbatim ("What you ask
// the Tutor travels to a language model; your pages stay yours."): only
// the conversation thread the writer is actively having travels here —
// never the page's own authored text, never lens results, never nudges.
// The request body is exactly `{ messages: [{ role, text }] }`.
//
// TU2 S2 amends that last line, on the brief's own word: the body may
// now ALSO carry a `delta?: string` — the writer's own new page text
// since the Tutor's cursor last advanced (never assembled ambiently,
// only at send time; see Tutor.tsx). Still exactly two top-level things,
// still nothing else — messages plus the one delimited delta.

export const tutorRouter = Router();
tutorRouter.use(requireAuth);
// ITEM 224, ROUND 2 — keyed by ACCOUNT, not address. requireAuth (above)
// guarantees req.session.userId by the time this runs, so every caller IS
// an account — an IP key was the wrong unit once that's true (one writer
// behind many IPs, or many writers behind one NAT'd IP, each defeat an
// IP key in opposite directions). 10 requests/minute/account — a real
// model call costs real money; tighter than authRouter's own 20/min/IP
// (rateLimit.ts's existing precedent).
tutorRouter.use(rateLimit(10, 60_000, (req) => req.session.userId!));

// The chat system prompt is built per request by buildSystemPrompt (tutorPrompts.ts): the Tutor hat, the typed-question task, and the voice for the theme the client names in `theme` (voiceForTheme: one of three from a fixed list;
// anything else, or no theme, gets no voice block: the neutral BASE). `theme` is read as a plain value and never put into the prompt.

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;
// TU2 S2 — the delta's own cap, deliberately much larger than a single
// conversational message: the client assembles it as ~4k tokens of the
// writer's own page text (its own disclosed ~4-chars/token approximation,
// see Tutor.tsx), which routinely runs several times MAX_MESSAGE_CHARS.
// It travels as its OWN top-level field rather than folded into
// `messages` for exactly that reason — folding it in would silently trip
// the per-message cap above the first time a real delta arrived. 17000
// covers the 4000-token/~16000-char ceiling plus the client's own short
// truncation-honesty header line, with headroom to spare.
const MAX_DELTA_CHARS = 17000;
// TU5 S4 — the book's Bible's own server backstop, mirroring the delta branch:
// the client joins the project's saved facts into ONE block capped at 8000
// chars of content (Tutor.tsx's BIBLE_CHAR_CAP) plus a short truncation-honesty
// header line if trimmed; 9000 covers that with headroom. Like the delta, the
// bible travels as its OWN top-level field, never folded into `messages`.
const MAX_BIBLE_CHARS = 9000;
// ITEM 84, TD4 — the selection ask's own backstop, mirroring the delta's. The
// client caps the selected stretch at 16000 chars plus a short truncation-honesty
// header (Tutor.tsx's SELECTION_CHAR_CAP); 17000 covers that with headroom. It
// travels as its OWN top-level field for the same reason the delta does — folding
// a stretch of prose into `messages` would trip MAX_MESSAGE_CHARS on the first
// real selection — and, more importantly here, because a counsel's payload must be
// separately visible to be separately testable: item84b.mjs asserts this key
// carries the selection and that the page never rides with it.
const MAX_SELECTION_CHARS = 17000;

interface InboundMessage {
  role: 'writer' | 'tutor';
  text: string;
}

function isValidBody(body: unknown): body is { messages: InboundMessage[]; delta?: string; bible?: string; selection?: string; theme?: unknown } {
  if (!body || typeof body !== 'object') return false;
  const { messages, delta, bible, selection } = body as { messages?: unknown; delta?: unknown; bible?: unknown; selection?: unknown };
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  const messagesValid = messages.every((m) =>
    m && typeof m === 'object'
    && (m.role === 'writer' || m.role === 'tutor')
    && typeof m.text === 'string' && m.text.length > 0 && m.text.length <= MAX_MESSAGE_CHARS,
  );
  if (!messagesValid) return false;
  // delta is optional — true silence (the brief's own words) when there is
  // no new writing since the cursor means the field is simply absent, not
  // an empty string standing in for "nothing."
  if (delta !== undefined && (typeof delta !== 'string' || delta.length === 0 || delta.length > MAX_DELTA_CHARS)) return false;
  // TU5 S4 — bible is optional on exactly the delta's terms: absent (never an
  // empty string) when the project has no facts; a real string otherwise,
  // within the server backstop cap.
  if (bible !== undefined && (typeof bible !== 'string' || bible.length === 0 || bible.length > MAX_BIBLE_CHARS)) return false;
  // ITEM 84, TD4 — selection is optional on exactly those same terms: absent
  // (never an empty string) unless the writer pressed the one chip that names it.
  if (selection !== undefined && (typeof selection !== 'string' || selection.length === 0 || selection.length > MAX_SELECTION_CHARS)) return false;
  return true;
}

// maxRetries: 0 — "no retry loops" per the brief's own invariant; one
// attempt, fail fast. Constructed lazily (not at module load) so an
// unconfigured deploy never even touches the SDK. TU2 S1 — baseURL is now
// configurable (env.tutorBaseUrl) so the SAME Anthropic-format client can
// address any Anthropic-compatible endpoint (DeepSeek by default); no
// other call site below changed shape.
function client(): Anthropic {
  return new Anthropic({ apiKey: env.tutorApiKey!, baseURL: env.tutorBaseUrl, maxRetries: 0 });
}

// ITEM 224 — a per-person daily budget, ON TOP OF rateLimit's existing
// per-IP window above. INTERIM: in memory, no schema, resets on restart —
// named as such because it is a stopgap, not the lasting shape (a restart
// gives every writer a fresh day for free; acceptable for a pre-launch
// invite-gated tester population, not for the account-scale load this will
// eventually see). Keyed by session userId (never by IP — that is the OTHER
// limiter's job), and keyed again by a UTC date string, so a count simply
// never finds its old entry once the day turns over — no timer, no cron.
const dailyTutorUsage = new Map<string, { day: string; count: number }>();
function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD', UTC
}
// Returns true if the call may proceed, incrementing the count as a side
// effect — checked-and-incremented together so two requests racing the same
// millisecond cannot both read "one under budget" and both proceed.
function consumeTutorBudget(userId: string): boolean {
  const day = todayKey();
  const entry = dailyTutorUsage.get(userId);
  if (!entry || entry.day !== day) {
    dailyTutorUsage.set(userId, { day, count: 1 });
    return true;
  }
  if (entry.count >= env.tutorDailyBudget) return false;
  entry.count += 1;
  return true;
}

// ITEM 224, ROUND 2 — a GLOBAL cap, across every account combined, on top of
// the per-person one above. The per-person budget bounds one account's own
// cost; nothing before this bounded the SUM across every account on a given
// day. Same interim shape and the same reason: in memory, no schema, resets
// on restart. One shared key ('*') rather than a second map — there is only
// ever one "whole app, today" count.
const dailyTutorGlobalUsage = { day: '', count: 0 };
function consumeGlobalTutorBudget(): boolean {
  const day = todayKey();
  if (dailyTutorGlobalUsage.day !== day) {
    dailyTutorGlobalUsage.day = day;
    dailyTutorGlobalUsage.count = 1;
    return true;
  }
  if (dailyTutorGlobalUsage.count >= env.tutorGlobalDailyBudget) return false;
  dailyTutorGlobalUsage.count += 1;
  return true;
}

tutorRouter.post('/tutor/chat', asyncHandler(async (req: Request, res: Response) => {
  // ITEM 224, ROUND 2 — the kill switch. Answers with the EXISTING
  // "not configured" shape (never a new error shape the client would have
  // to learn) — a writer sees the same quiet state as an unset API key, and
  // an operator can pull this lever without redeploying a code change.
  if (env.tutorDisabled) {
    res.json({ configured: false });
    return;
  }
  // Offline/unconfigured is a first-class, expected state (the brief's own
  // words) — respond plainly, never a 500, never a crash at boot.
  if (!env.tutorApiKey) {
    res.json({ configured: false });
    return;
  }

  if (!isValidBody(req.body)) {
    res.status(400).json({ error: 'Invalid conversation payload' });
    return;
  }

  // ITEM 224 — the per-person daily budget. requireAuth (above, via
  // tutorRouter.use) guarantees req.session.userId by the time any handler
  // runs. Checked after validation (a malformed payload never consumes
  // budget) but before the model is actually called (a request that WILL
  // reach the model is exactly the cost this protects against).
  if (!consumeTutorBudget(req.session.userId!)) {
    res.status(429).json({ error: 'Daily Tutor limit reached — try again tomorrow.' });
    return;
  }
  // ITEM 224, ROUND 2 — the global cap, checked second (a person's own
  // budget is the more specific, more useful message when BOTH would have
  // refused the same request).
  if (!consumeGlobalTutorBudget()) {
    res.status(429).json({ error: 'The Tutor has reached today\'s overall limit — try again tomorrow.' });
    return;
  }

  const messages = req.body.messages.map((m: InboundMessage) => ({
    role: m.role === 'writer' ? ('user' as const) : ('assistant' as const),
    content: m.text,
  }));

  // TU5 S4 — the book's Bible splices as ONE synthetic wire-only user turn,
  // BEFORE the delta splice below: stable context (the writer's durable facts)
  // ahead of fresh context (the page delta), both ahead of the writer's own
  // latest word (still the array's last entry). Same discipline as the delta
  // exactly — delimited so the model reads it as background the writer supplied,
  // and NEVER persisted: the stored thread stays writer|tutor, this 'user' turn
  // lives only in this outbound wire mapping. S5's own Bible paragraph in the
  // system prompt is what keeps the Tutor from composing from a fact.
  const bible: string | undefined = req.body.bible;
  if (bible) {
    messages.splice(messages.length - 1, 0, {
      role: 'user' as const,
      content: wrapBible(bible),
    });
  }

  // TU2 S2 — the delta, if present, is spliced in as ONE synthetic user
  // turn immediately before the writer's own latest message (the last
  // entry in `messages`, since the client sends its full persisted
  // history including the message it just appended) — never appended AS
  // IF the writer had said it, and clearly delimited so the model reads
  // it as background the writer supplied, not a request in its own right.
  // Conduct rule 37 above is what actually keeps the Tutor from treating
  // it as an invitation to critique.
  const delta: string | undefined = req.body.delta;
  if (delta) {
    messages.splice(messages.length - 1, 0, {
      role: 'user' as const,
      content: wrapDelta(delta),
    });
  }

  // ITEM 84, TD4 — the selected stretch, spliced LAST of the three so it sits
  // immediately before the writer's own latest message: it is the most specific
  // context of the three, the one thing the writer physically pointed at, and the
  // ask that carries it reads "look at just this stretch." Same discipline as the
  // other two otherwise — delimited, never appended as if the writer had said it,
  // never persisted. It arrives ONLY when the writer pressed the chip whose own
  // words name it; the button law (lock record §10) is enforced on the client,
  // where the press happens, and this route simply never invents the key.
  const selection: string | undefined = req.body.selection;
  if (selection) {
    messages.splice(messages.length - 1, 0, {
      role: 'user' as const,
      content: wrapSelection(selection),
    });
  }

  try {
    const response = await client().messages.create({
      model: env.tutorModel,
      max_tokens: env.tutorMaxTokens,
      system: buildSystemPrompt({ hat: 'tutor', voice: voiceForTheme(req.body.theme), task: 'ask' }),
      messages,
    });
    // THE SAFETY MESSAGE (R12, Fable Nov 23, 6:14 pm): BASE tells the model to reply with one fixed marker only when she says she herself is in danger. A reply that holds the marker, alone or with
    // other text, is replaced whole by Nick's exact words (tutorPrompts.ts SAFETY_MESSAGE), written by people and never by the model; any other reply is untouched.
    const text = withSafetyMessage(response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim());
    // TU2 S2 — usage threaded through now (not consumed until S5's session
    // meter) so that later, client-only slice never has to re-open this
    // closed-census file. Absent on the {configured:false}/error shapes
    // below — there is nothing to report when no model call was made.
    //
    // TU2 S5 — `model` joins `usage` here, the one addition S5 actually
    // needed to reopen this file for: S5's own static cost table (client-
    // side, store/tutorCostEstimates.ts) is keyed by model id, and without
    // SOME way to know which model produced a given turn's usage, its own
    // "unknown provider -> tokens only, never an invented dollar figure"
    // rule would have nothing to key off of and could never genuinely
    // fire. `env.tutorModel` is already server-side config (S1) — echoing
    // it back on the response is not a new secret (it names a model id,
    // never the API key) and costs nothing extra to compute.
    res.json({
      configured: true,
      reply: text,
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      model: env.tutorModel,
    });
  } catch (err) {
    logError('tutor', err);
    res.status(502).json({ configured: true, error: 'The Tutor could not be reached right now.' });
  }
}));

// SPRINT'S PROMPTS FROM THE CONSULTANT (Fable, Nov 21, 12:35 am, FIX's queue item 6; Nick's F1, machina-stage-menus-decide.md: in SPRINT the Consultant gives ONE prompt to get her writing and keep her writing and "never
// starts a back-and-forth"). A second route beside /tutor/chat, under the same auth, the same per-account rate limit and the SAME two daily budgets. It is not a chat: the body carries NOTHING OF HER PAGE and no
// conversation, only the prompts already shown this session (`seen`, so the Consultant does not repeat itself), and the answer is ONE cleaned line, or a plain failure the client answers from its local deck.
// The strict rules are the system prompt below and the cleaning after it: whatever the model says, only a single short sentence leaves this route.
// The rules that already lived on the server for this route; the kit's SPRINT task says so ("the rules already live on the server"). buildSprintSystemPrompt puts BASE, the Machina voice and the SPRINT task ahead of them.
const SPRINT_RULES = `
You are the Consultant inside Wrizo's SPRINT stage, where the writer is free-writing against the clock. Your only job is to give the writer exactly one short writing prompt that gets them writing again.

Absolute rules:
- Reply with exactly one prompt: a single sentence of at most 25 words, plain text, with no quotation marks, no numbering, no markdown, no preface and no sign-off.
- Keep it short and concrete: a scene, an object, a sound, a moment, a place to begin from. It points; it never starts the writing.
- Never ask a question back to the writer about their work, and never invite a reply. There is no follow-up and no conversation: whatever arrives next, you give exactly one prompt.
- Do not judge, evaluate or comment on anything the writer has written. You have not seen it, and you must never claim to have.
- Never write or compose prose, dialogue or description for the writer's work. The prompt points; it never writes.
- Do not repeat or paraphrase a prompt you are told was already given.
`;
const SPRINT_SYSTEM_PROMPT = buildSprintSystemPrompt(SPRINT_RULES);
const MAX_SEEN = 3;
const MAX_SEEN_CHARS = 300;
const MAX_SPRINT_PROMPT_CHARS = 200;
const SPRINT_MAX_TOKENS = 80;

// the body is `{ seen? }` and NOTHING ELSE: a key that could carry her words (delta, messages, selection, bible) makes the whole body invalid
function isSprintBody(body: unknown): body is { seen?: string[] } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return false;
  if (Object.keys(body as object).some((k) => k !== 'seen')) return false;
  const seen = (body as { seen?: unknown }).seen;
  if (seen === undefined) return true;
  return Array.isArray(seen) && seen.length <= MAX_SEEN && seen.every((x) => typeof x === 'string' && x.length > 0 && x.length <= MAX_SEEN_CHARS);
}

// ONE line, or null (nothing a prompt can be made of): the first non-empty line, with markdown, a list marker, a "Here's a prompt:" preface and wrapping quotes removed; refused when empty, over the cap, or more than one sentence
export function cleanSprintPrompt(raw: string): string | null {
  const first = raw.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0);
  if (!first) return null;
  let line = first
    .replace(/[*_#`]+/g, '')
    .replace(/^\s*(?:\d+[.)]|[-\u2022])\s+/, '')
    .replace(/^(?:here(?:'|\u2019)s|here is)[^:]{0,40}:\s*/i, '')
    .replace(/^["'\u201C\u2018]+|["'\u201D\u2019]+$/g, '')
    .trim();
  if (!line || line.length > MAX_SPRINT_PROMPT_CHARS) return null;
  if (/[.?!]["\u201D']?\s+[A-Z]/.test(line)) return null;
  return line;
}

tutorRouter.post('/tutor/sprint-prompt', asyncHandler(async (req: Request, res: Response) => {
  if (env.tutorDisabled || !env.tutorApiKey) {
    res.json({ configured: false });
    return;
  }
  if (!isSprintBody(req.body)) {
    res.status(400).json({ error: 'Invalid prompt request' });
    return;
  }
  if (!consumeTutorBudget(req.session.userId!)) {
    res.status(429).json({ error: 'Daily Tutor limit reached \u2014 try again tomorrow.' });
    return;
  }
  if (!consumeGlobalTutorBudget()) {
    res.status(429).json({ error: 'The Tutor has reached today\'s overall limit \u2014 try again tomorrow.' });
    return;
  }
  const seen: string[] = req.body.seen ?? [];
  const ask = seen.length > 0
    ? `Prompts already given this session (do not repeat or paraphrase them):\n${seen.map((x) => `- ${x}`).join('\n')}\n\nGive one new writing prompt.`
    : 'Give one writing prompt.';
  try {
    const response = await client().messages.create({
      model: env.tutorModel,
      max_tokens: SPRINT_MAX_TOKENS,
      system: SPRINT_SYSTEM_PROMPT,
      messages: [{ role: 'user' as const, content: ask }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    const prompt = cleanSprintPrompt(text);
    // the marker is for the chat route (her words ride only there); in SPRINT a reply that holds it is no writing prompt, so it takes the same plain failure and the client's local deck answers
    if (!prompt || holdsSafetyMarker(text)) {
      res.status(502).json({ configured: true, error: 'The Consultant could not give a prompt right now.' });
      return;
    }
    res.json({ configured: true, prompt });
  } catch (err) {
    logError('tutor-sprint', err);
    res.status(502).json({ configured: true, error: 'The Consultant could not be reached right now.' });
  }
}));
