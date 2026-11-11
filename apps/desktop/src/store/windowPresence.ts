// #76 PART 2 - WHICH PAGE IS OPEN IN WHICH WINDOW. Windows of the app on one computer share one browser store, and two windows on the SAME page can overwrite each other's words (the store keeps whole
// records). This module only lets the windows SEE each other: each says, over a BroadcastChannel, which page it has open, and every window can ask "is my page open in another window too?".
//
// NOTHING IS SAVED. The state is memory only; a window that closes says so (pagehide), and one that dies without saying so is dropped when its heartbeat stops (it speaks every HEARTBEAT_MS, and is
// forgotten after EXPIRE_MS of silence). A browser with no BroadcastChannel never sees another window, and so never warns: the warning is a courtesy, never a gate.
const CHANNEL = 'wrizo-open-pages';
const HEARTBEAT_MS = 2000;
const EXPIRE_MS = 7000;

interface Hello { t: 'hello' | 'here' | 'bye'; w: string; page: string | null }

const me = `w${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
let mine: string | null = null;
const others = new Map<string, { page: string | null; seen: number }>();
const listeners = new Set<() => void>();
let channel: BroadcastChannel | null = null;
let started = false;

function post(t: Hello['t']): void {
  try { const m: Hello = { t, w: me, page: mine }; channel?.postMessage(m); } catch { /* a closed channel says nothing */ }
}

/** Is the page open in this window also open in another window of the app? */
export function samePageElsewhere(): boolean {
  if (mine === null) return false;
  for (const o of others.values()) if (o.page === mine) return true;
  return false;
}

let lastAnswer = false;
function emit(): void {
  const now = samePageElsewhere();
  if (now === lastAnswer) return;
  lastAnswer = now;
  listeners.forEach((fn) => { try { fn(); } catch { /* a listener never breaks the channel */ } });
}

function start(): void {
  if (started) return;
  started = true;
  if (typeof BroadcastChannel === 'undefined') return;
  try { channel = new BroadcastChannel(CHANNEL); } catch { channel = null; return; }
  channel.onmessage = (e: MessageEvent<Hello>) => {
    const m = e.data;
    if (!m || typeof m !== 'object' || m.w === me || typeof m.w !== 'string') return;
    if (m.t === 'bye') others.delete(m.w);
    else others.set(m.w, { page: typeof m.page === 'string' ? m.page : null, seen: Date.now() });
    if (m.t === 'hello') post('here');   // a window that has just arrived is told where this one is
    emit();
  };
  const beat = window.setInterval(() => {
    post('here');
    const now = Date.now();
    for (const [w, o] of others) if (now - o.seen > EXPIRE_MS) others.delete(w);
    emit();
  }, HEARTBEAT_MS);
  window.addEventListener('pagehide', () => { post('bye'); window.clearInterval(beat); });
  post('hello');
}

// a test/inspection seam, this file's established pattern (persistence core's wrizoDirty): what this window believes. Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoPresence?: () => unknown }).wrizoPresence = () => ({ me, mine, others: [...others].map(([w, o]) => ({ w, page: o.page, ageMs: Date.now() - o.seen })), channel: !!channel });
}

/** Say which page this window has open now (null: none). */
export function setOpenPage(id: string | null): void {
  start();
  mine = id;
  post('here');
  emit();
}

// WHERE THE LINE STANDS. Each count row that can carry the line (Arbor's under the page, Machina's Run row, Flux's header) says it is mounted; with none mounted the notice draws the line by itself.
let hostCount = 0;
const hostListeners = new Set<() => void>();
export function registerLineHost(): () => void {
  hostCount += 1; hostListeners.forEach((fn) => fn());
  return () => { hostCount -= 1; hostListeners.forEach((fn) => fn()); };
}
export const lineHostCount = (): number => hostCount;
export function subscribeLineHosts(fn: () => void): () => void { hostListeners.add(fn); return () => { hostListeners.delete(fn); }; }

export function subscribeSamePage(fn: () => void): () => void {
  start();
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
