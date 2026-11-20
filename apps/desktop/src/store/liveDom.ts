// THE LIVE PAGE, NEVER ITS MEASURING COPY (Fable's ruling, Nov 20, 3:40 pm). Page breaks keep a hidden copy of the page column at the foot of
// <body> (store/pageMeasure.ts: root .wz-letter-measure, invisible, inert, aria-hidden) that carries the page's class chain and data attributes,
// so a document-wide lookup that misses the live page on its first selector can land on the copy. Every such lookup goes through here: the first
// match, or every match, OUTSIDE the copy. One definition, no per-key cost (a lookup reads the same matches it read before, minus the copy's).

export const MEASURE_COPY = 'wz-letter-measure';

/** Whether an element is the measuring copy or inside it. */
export const inMeasureCopy = (el: Element | null | undefined): boolean => !!el && !!el.closest(`.${MEASURE_COPY}`);

/** The first match outside the measuring copy (document order), or null. */
export function liveQuery<T extends Element = Element>(selector: string, root: ParentNode = document): T | null {
  for (const el of Array.from(root.querySelectorAll<T>(selector))) if (!inMeasureCopy(el)) return el;
  return null;
}

/** Every match outside the measuring copy, in document order. */
export function liveQueryAll<T extends Element = Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector)).filter((el) => !inMeasureCopy(el));
}

// THE CHECK'S DOOR (scripts/harness/letter-measure-guard.mjs): each site that reads the page document-wide registers the very lookup it uses, so the
// check can hold the copy in front of the live page and ask each one what it finds. A read only; nothing here is drawn or stored.
type Site = () => Element | Element[] | null;
const sites = new Map<string, Site>();
export function registerLiveSite(name: string, lookup: Site): void { sites.set(name, lookup); }
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoLiveDom?: unknown }).wrizoLiveDom = {
    names: () => [...sites.keys()].sort(),
    run: () => Object.fromEntries([...sites.entries()].map(([k, f]) => {
      let v: Element | Element[] | null = null;
      try { v = f(); } catch { v = null; }
      const list = Array.isArray(v) ? v : v ? [v] : [];
      return [k, { n: list.length, inCopy: list.filter((e) => inMeasureCopy(e)).length, connected: list.every((e) => e.isConnected), tags: list.slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${e.classList[0] ?? ''}`) }];
    })),
  };
}
