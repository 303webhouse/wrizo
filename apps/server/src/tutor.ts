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
- You only know what the writer tells you in this conversation — never claim to have read their page.`;

const MAX_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 4000;

interface InboundMessage {
  role: 'writer' | 'tutor';
  text: string;
}

function isValidBody(body: unknown): body is { messages: InboundMessage[] } {
  if (!body || typeof body !== 'object') return false;
  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) return false;
  return messages.every((m) =>
    m && typeof m === 'object'
    && (m.role === 'writer' || m.role === 'tutor')
    && typeof m.text === 'string' && m.text.length > 0 && m.text.length <= MAX_MESSAGE_CHARS,
  );
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
    res.json({ configured: true, reply: text });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[tutor] chat request failed', err);
    res.status(502).json({ configured: true, error: 'The Tutor could not be reached right now.' });
  }
}));
