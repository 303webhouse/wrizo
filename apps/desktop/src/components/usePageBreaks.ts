// PAGE BREAKS - the writing surface's half (ModeStage). It keeps the one list (store/pageBreaks.ts) for the open page from the hidden letter page
// (store/pageMeasure.ts) and draws the marks (store/pageMarks.ts). THE CADENCE (the box turn, Nov 19: the work is 0.3 ms median, 0.7 worst):
//   per key   - the caret's row in the copy takes the key (one contained row's layout) and the walk runs again, only to decide the page-turn sound,
//               so it rings on the key that turns the page; nothing is published;
//   a pause   - (400 ms) the copy takes the whole text (only the changed rows are rebuilt and measured), the list is published, and the marks and
//               the count move together (spec §4);
//   open      - the copy's rows are measured in idle slices of 50 rows (about 7 ms each at 50k), after first paint; a resize or the zoom only redraws
//               the marks (the copy reads no window).
// The sound keeps #63's rules: it rings only for a turn the writing made (a key within 1.5 s) and once per page per sitting [usePageBreaks §1]
import { useEffect, type RefObject } from 'react';
import { pageAt, setPageBreaks, clearPageBreaks, getPageBreaks } from '../store/pageBreaks';
import { LetterPage, chainKey, cleanCaret, cleanText, docSections, liveChain, pagesOfText } from '../store/pageMeasure';
import { clearMarks, drawMarks } from '../store/pageMarks';
import { rowsFor, lineOf } from '../store/lineRows';

const PAUSE_MS = 400;
const SLICE_ROWS = 50;

// Free Write's last clean line, read backward from the page's end (struck runs and the end guard are not her text)
function lastCleanLine(ed: HTMLElement): string | null {
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  let out = '';
  // elements are skipped, so the root's last child IS the page's last text node; previousNode walks back through the text in order
  for (let x: Node | null = w.lastChild(); x; x = w.previousNode()) {
    const tx = x as Text;
    if (tx.parentElement && tx.parentElement.closest('.fo-struck')) continue;
    const d = tx.data.split('​').join('');
    const k = d.lastIndexOf('\n');
    if (k >= 0) return d.slice(k + 1) + out;
    out = d + out;
  }
  return out;
}

export function usePageBreaks(scrollRef: RefObject<HTMLElement | null>, pageId: string | undefined, onTurn: (page: number, fromKey: boolean) => void): void {
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const id = pageId ?? null;
    let page: LetterPage | null = null;
    let lastKeyAt = 0;
    let pauseT = 0, sliceT = 0, selT = 0, marksT = 0, raf = 0;
    let breaks: number[] = [];
    let before = 0, total = 1, head = false;
    let lastPage = 0;
    let dead = false;

    const editor = () => scroll.querySelector('.forward-only-editor') as HTMLElement | null;
    const ring = (p: number) => { if (p !== lastPage) { const up = p > lastPage; lastPage = p; if (up) onTurn(p, Date.now() - lastKeyAt <= 1500); } };

    // the Doc's other sections, counted in copies of this page's chain (cached by text): pages before this one, and the Doc's total
    const sections = (chain: NonNullable<ReturnType<typeof liveChain>>, key: string, mine: number) => {
      const parts = id ? docSections(id) : [];
      const at = parts.findIndex((p) => p.id === id);
      if (at < 0 || parts.length < 2) { before = 0; total = mine; head = false; return; }
      let b = 0, t = 0;
      parts.forEach((p, i) => { if (i === at) return; const n = pagesOfText(chain, key, p.text || ''); t += n; if (i < at) b += n; });
      before = b; total = t + mine; head = at > 0;
    };

    const publish = (ed: HTMLElement) => {
      const caret = cleanCaret(ed);
      const pageInSection = pageAt(breaks, caret ?? 0);
      const docPage = before + pageInSection;
      setPageBreaks({ id, breaks, before, total, page: docPage, sectionHead: head });
      ring(docPage);
      drawMarks(ed, head ? [0, ...breaks] : breaks);
    };

    // the whole text into the copy; idle slices measure what changed; then the walk, the Doc's sections, the list and the marks
    const settle = () => {
      if (dead) return;
      const ed = editor();
      if (!ed) return;
      const chain = liveChain(ed);
      if (!chain) return;
      const key = chainKey(chain);
      if (!page || page.key !== key) { page?.destroy(); page = new LetterPage(chain, key); }
      page.setLines(cleanText(ed).split('\n'));
      const pump = () => {
        sliceT = 0;
        if (dead || !page) return;
        if (!page.measureSome(SLICE_ROWS)) { sliceT = window.setTimeout(pump, 0); return; }
        const br = page.breaks();
        if (!br) return;
        breaks = br;
        sections(chain, key, br.length + 1);
        const live = editor();
        if (live) publish(live);
      };
      clearTimeout(sliceT);
      pump();
    };

    // per key: the caret's row takes the key in the copy and the walk decides the sound (when the copy already holds this many lines)
    const onKeyFrame = () => {
      raf = 0;
      const ed = editor();
      if (!ed || !page || !page.complete()) return;
      const text = rowsFor(ed);
      let i: number, line: string, caret: number | null;
      if (text && !text.stale) {
        caret = cleanCaret(ed);
        if (caret === null || text.lines.length !== page.lineCount) return;
        i = lineOf(text, caret); line = text.lines[i];
      } else {
        // Free Write writes forward at its end: its last line is the caret's, read backward from the end (never the whole page per key); a new
        // line (Enter) waits for the pause, which also reads the exact caret
        const last = lastCleanLine(ed);
        if (last === null) return;
        i = page.lineCount - 1; line = last; caret = page.offsetOfLine(i) + last.length;
      }
      if (!page.remeasure(i, line)) return;
      const br = page.breaks();
      if (br) ring(before + pageAt(br, caret));
    };

    const onChange = () => {
      clearTimeout(pauseT);
      pauseT = window.setTimeout(settle, PAUSE_MS);
      if (!raf && Date.now() - lastKeyAt < 200) raf = requestAnimationFrame(onKeyFrame);
    };
    const onKey = () => { lastKeyAt = Date.now(); };
    // a caret move alone changes only the count's page: arithmetic on the list, no layout
    const onSel = () => {
      clearTimeout(selT);
      selT = window.setTimeout(() => {
        const ed = editor();
        if (!ed || !ed.contains(document.getSelection()?.focusNode ?? null)) return;
        const c = cleanCaret(ed);
        const st = getPageBreaks();
        if (c === null || st.id !== id) return;
        const p = before + pageAt(breaks, c);
        if (p !== st.page) setPageBreaks({ ...st, page: p });
      }, 120);
    };
    // a resize, the zoom or a dress change: the copy reads no window, so only the marks are redrawn (and the copy re-keyed if its chain changed)
    const onResize = () => {
      clearTimeout(marksT);
      marksT = window.setTimeout(() => {
        const ed = editor();
        if (!ed) return;
        const chain = liveChain(ed);
        if (chain && page && page.key !== chainKey(chain)) { settle(); return; }
        drawMarks(ed, head ? [0, ...breaks] : breaks);
      }, 120);
    };

    // the marks' own layer is not the text: its redraw must never count as a change (or every pause would schedule the next)
    const mine = (n: Node) => !!(n instanceof Element ? n : n.parentElement)?.closest('.wz-pb-marks');
    const mo = new MutationObserver((recs) => { if (recs.some((r) => !mine(r.target))) onChange(); });
    mo.observe(scroll, { childList: true, subtree: true, characterData: true });
    const ro = new ResizeObserver(onResize);
    ro.observe(scroll);
    // the chain's own attributes (the zoom, the dress on the page, the face and size on the editor), never the attributes inside the text
    const col = scroll.closest('.mode-pagecol');
    const attrs = new MutationObserver((recs) => { const ed = editor(); if (recs.some((r) => !mine(r.target) && (r.target === ed || !(ed && ed.contains(r.target))))) onResize(); });
    if (col) attrs.observe(col, { attributes: true, subtree: true, attributeFilter: ['data-zoom', 'style', 'class'] });
    attrs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-page', 'data-cast', 'data-arbor2-room'] });
    scroll.addEventListener('keydown', onKey, true);
    document.addEventListener('selectionchange', onSel);
    // the first count, after first paint
    let first = 0;
    const firstRaf = requestAnimationFrame(() => { first = window.setTimeout(settle, 0); });
    return () => {
      dead = true;
      mo.disconnect(); ro.disconnect(); attrs.disconnect();
      scroll.removeEventListener('keydown', onKey, true);
      document.removeEventListener('selectionchange', onSel);
      cancelAnimationFrame(firstRaf); clearTimeout(first); clearTimeout(pauseT); clearTimeout(sliceT); clearTimeout(selT); clearTimeout(marksT); cancelAnimationFrame(raf);
      clearMarks(editor());
      page?.destroy();
      clearPageBreaks(id);
    };
  }, [scrollRef, pageId]);   // eslint-disable-line react-hooks/exhaustive-deps
}
