// #76 PART 3 - "both versions were kept": a merge of two windows' words (store/textMerge.ts) tells the open page, which says so once in its quiet toast line. A leaf module: persistence announces, the page listens.
// a test/inspection seam, this file's established pattern (persistence core's wrizoDirty): the last merges this window made, as short strings. Never read by app code.
const trail: unknown[] = [];
if (typeof window !== 'undefined') (window as unknown as { wrizoMergeLog?: unknown[] }).wrizoMergeLog = trail;
export function noteMerge(entry: Record<string, string | number | boolean>): void {
  const short: Record<string, string | number | boolean> = {};
  for (const k of Object.keys(entry)) { const v = entry[k]; short[k] = typeof v === 'string' && v.length > 160 ? `${v.slice(0, 70)}...${v.slice(-70)}` : v; }
  trail.push(short);
  if (trail.length > 24) trail.shift();
}
type Listener = (pageId: string) => void;
const listeners = new Set<Listener>();
export function announceKeptBoth(pageId: string): void { listeners.forEach((fn) => { try { fn(pageId); } catch { /* a listener never breaks a write path */ } }); }
export function subscribeKeptBoth(fn: Listener): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
