import { capTutorHistory } from '../../store/tutorHistory';

// THE WALK'S THREADS (PRESETS-B, Nov 27; guide-walk-spec.md section 3.8): one for each step of each page, her question then the reply. IN THIS SESSION ONLY: the spec says nothing new is saved by the ask, so nothing
// here is written anywhere. Only that step's own thread travels with an ask (the server cannot tell one thread from another), capped like the Tutor's, her question last. The send is handed in, so a proof runs this as is.

export interface WalkTurn { role: 'writer' | 'tutor'; text: string }
export interface WalkThread { turns: readonly WalkTurn[]; status: 'idle' | 'sending' | 'error' }
export type WalkSend = (messages: WalkTurn[], walk: Record<string, string>) => Promise<{ ok: boolean; configured: boolean; reply?: string }>;

const NONE: WalkThread = { turns: [], status: 'idle' };
const threads = new Map<string, WalkThread>();
const asked = new Map<string, Record<string, string>>();   // the step as it was sent, so Try again sends the same ask
let off = false;
const listeners = new Set<() => void>();
const put = (key: string, next: WalkThread): void => { threads.set(key, next); listeners.forEach((l) => l()); };

export const walkThread = (key: string): WalkThread => threads.get(key) ?? NONE;
/** The server has answered "not configured": the AI is off, and the panel shows the step's own note. */
export const walkAiOff = (): boolean => off;
export const subscribeWalkThreads = (l: () => void): (() => void) => { listeners.add(l); return () => { listeners.delete(l); }; };

async function run(key: string, send: WalkSend): Promise<void> {
  const turns = walkThread(key).turns;
  put(key, { turns, status: 'sending' });
  let result: { ok: boolean; configured: boolean; reply?: string };
  try { result = await send(capTutorHistory(turns), asked.get(key) as Record<string, string>); }
  catch { result = { ok: false, configured: true }; }
  const now = walkThread(key).turns;
  if (result.ok && !result.configured) {
    off = true;
    put(key, { turns: now, status: 'idle' });
  } else if (result.ok && result.reply) put(key, { turns: [...now, { role: 'tutor', text: result.reply }], status: 'idle' });
  else put(key, { turns: now, status: 'error' });
}

export async function askWalk(key: string, text: string, walk: Record<string, string>, send: WalkSend): Promise<void> {
  const was = walkThread(key);
  const question = text.trim();
  if (was.status === 'sending' || !question) return;
  asked.set(key, walk);
  put(key, { turns: [...was.turns, { role: 'writer', text: question }], status: 'idle' });
  await run(key, send);
}

export async function retryWalk(key: string, send: WalkSend): Promise<void> {
  if (walkThread(key).status !== 'error' || !asked.has(key)) return;
  await run(key, send);
}
