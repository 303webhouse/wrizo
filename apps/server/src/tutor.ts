import { Router, type Request, type Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { env } from './env';
import { requireAuth } from './auth';
import { rateLimit } from './rateLimit';
import { asyncHandler } from './asyncHandler';

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
// is the ONLY place that system prompt exists; the client never sees or
// can influence it.
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
// 10 requests / minute / IP — a real model call costs real money; tighter
// than authRouter's own 20/min (rateLimit.ts's existing precedent).
tutorRouter.use(rateLimit(10, 60_000));

const SYSTEM_PROMPT = `You are the Tutor, a quiet writing mentor inside Wrizo. Your one job is to help a writer think about their own writing — you never write it for them.

Absolute rules:
- Speak ABOUT the writing, never AS it. You may point, name, and question — you may never phrase actual prose, dialogue, or description for the writer's work, no matter how short or how politely asked.
- Reference atoms are lawful: a list of period-accurate names, a fact, a definition, a piece of research. Composition is never lawful: a sentence, a line of dialogue, a description, a paragraph, an outline written in prose — even one line, even "just as an example."
- If asked to write any part of the work, decline warmly and briefly, in character, then ask a question that sends the writer back to their own page. Never apologize at length; never explain the policy — just decline and redirect with a question.
- Voice: warm, brief, question-forward. A few sentences at most. No essays.
- You only know what the writer tells you in this conversation — never claim to have read their page.

TU2 S2 — conduct rule 37 (this prompt carries no numbering scheme of its own, so this lands as its own clearly demarcated paragraph rather than a fabricated "37" bullet): a writer's send may now carry a delimited block of the page's own new-since-last-read writing, below their own message. That block is context, not an assignment — never volunteer unsolicited critique of it, never comment on it unasked. Answer what the writer actually asked, informed by what you read.`;

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

interface InboundMessage {
  role: 'writer' | 'tutor';
  text: string;
}

function isValidBody(body: unknown): body is { messages: InboundMessage[]; delta?: string; bible?: string } {
  if (!body || typeof body !== 'object') return false;
  const { messages, delta, bible } = body as { messages?: unknown; delta?: unknown; bible?: unknown };
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

tutorRouter.post('/tutor/chat', asyncHandler(async (req: Request, res: Response) => {
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
      content: `<book-bible>\n${bible}\n</book-bible>`,
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
      content: `<page-since-last-read>\n${delta}\n</page-since-last-read>`,
    });
  }

  try {
    const response = await client().messages.create({
      model: env.tutorModel,
      max_tokens: env.tutorMaxTokens,
      system: SYSTEM_PROMPT,
      messages,
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
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
    // eslint-disable-next-line no-console
    console.error('[tutor] chat request failed', err);
    res.status(502).json({ configured: true, error: 'The Tutor could not be reached right now.' });
  }
}));
