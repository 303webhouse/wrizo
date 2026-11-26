import { useEffect } from 'react';
import { rangeFromPlainOffsets } from '../../store/caretOffset';
import { findAll } from './searchFind';
import { paintScaleOf } from '../../store/paintScale';

// THE FOUND WORDS ON THE PAGE, while the search is over the Doc she is in (the prototype marks each one; #F6ECBE): a PAINT LAYER, the CSS Custom
// Highlight API, so no letter's box changes and her words never re-wrap; nothing is written into the editor. A range lives in the editor's text
// nodes, which a re-render replaces, so the marks are drawn again whenever the editor's text changes (a MutationObserver), and on every word or
// find change. 'wz-search' holds every find in the open Part, 'wz-search-cur' the one she is on. The find she is on is brought into view when it
// changes. Where the API is missing, nothing is drawn (the results list still works). A page that has just opened may mount its editor a frame
// after the menu: the hook looks for it for up to a second.

const ALL = 'wz-search';
const CUR = 'wz-search-cur';
const LOOK_FRAMES = 60;

type HighlightCtor = new (...ranges: Range[]) => unknown;
interface HighlightRegistry { set(name: string, h: unknown): void; delete(name: string): void }
const registry = (): { reg: HighlightRegistry; Ctor: HighlightCtor } | null => {
  const reg = (globalThis as { CSS?: { highlights?: HighlightRegistry } }).CSS?.highlights;
  const Ctor = (globalThis as { Highlight?: HighlightCtor }).Highlight;
  return reg && Ctor ? { reg, Ctor } : null;
};

function textOf(el: HTMLElement): string {
  let s = '';
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) s += (n as Text).data;
  return s;
}

export function clearSearchMarks(): void {
  const r = registry();
  if (!r) return;
  r.reg.delete(ALL);
  r.reg.delete(CUR);
}

/** Draw the finds of `q` in the open page's editor; `curAt` is the offset of the find she is on in this page, or null. */
export function useSearchMarks(q: string, curAt: number | null): void {
  useEffect(() => {
    const r = registry();
    if (!r || !q) { clearSearchMarks(); return undefined; }
    let mo: MutationObserver | null = null;
    let raf = 0;
    let frames = 0;
    const start = () => {
      const editor = document.querySelector<HTMLElement>('.forward-only-editor');
      if (!editor) { if (frames++ < LOOK_FRAMES) raf = requestAnimationFrame(start); return; }
      const draw = (): Range | null => {
        const ranges: Range[] = [];
        let cur: Range | null = null;
        for (const at of findAll(textOf(editor), q)) {
          const range = rangeFromPlainOffsets(editor, at, at + q.length);
          if (!range) continue;
          ranges.push(range);
          if (at === curAt) cur = range;
        }
        r.reg.set(ALL, new r.Ctor(...ranges));
        if (cur) r.reg.set(CUR, new r.Ctor(cur)); else r.reg.delete(CUR);
        return cur;
      };
      const cur = draw();
      // the find she is on, into view in the page's own scroller (never the window)
      if (cur) {
        const scroller = editor.closest<HTMLElement>('.mode-scroll');
        const box = cur.getBoundingClientRect();
        if (scroller && box.height) {
          const s = scroller.getBoundingClientRect();
          if (box.top < s.top + 40 || box.bottom > s.bottom - 40) scroller.scrollTop += (box.top - (s.top + s.height / 3)) / paintScaleOf(scroller);   // screen px to the page's px (#133)
        }
      }
      mo = new MutationObserver(() => { draw(); });
      mo.observe(editor, { childList: true, subtree: true, characterData: true });
    };
    start();
    return () => { cancelAnimationFrame(raf); mo?.disconnect(); };
  }, [q, curAt]);
  useEffect(() => () => clearSearchMarks(), []);
}
