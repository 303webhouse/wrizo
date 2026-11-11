// #76 PART 3 - "both versions were kept": a merge of two windows' words (store/textMerge.ts) tells the open page, which says so once in its quiet toast line. A leaf module: persistence announces, the page listens.
type Listener = (pageId: string) => void;
const listeners = new Set<Listener>();
export function announceKeptBoth(pageId: string): void { listeners.forEach((fn) => { try { fn(pageId); } catch { /* a listener never breaks a write path */ } }); }
export function subscribeKeptBoth(fn: Listener): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
