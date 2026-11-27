// THE WALK BESIDE THE DRAWING TOOLS, the page side (reorg-guide-walk-live.mjs). Load visual-ink/page.js and page-1a3.js first. Assigns window.__gw and does nothing else.
// Fixtures go through the app's own seams; keys and strokes that are under test are sent by the harness file itself, trusted.
(() => {
  const q = (s) => document.querySelector(s);
  const all = (s) => [...document.querySelectorAll(s)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const v3 = () => window.__vi3;
  const entry = (id) => v3().entry(id);
  const CARDS = [['gw-a', 'Opening', 0.05], ['gw-b', 'Midpoint', 0.3], ['gw-c', 'Finale', 0.55]];

  /** A page in BUILD with words and a three-step Plan on its own Plan board (the same board "Draw on a Board" opens). */
  const setup = async (theme, words) => {
    const id = await v3().buildPage(theme, words);
    const board = window.wrizoPairing.birth(id).id;
    window.wrizoPatchEntry(board, { boxes: CARDS.map(([cid, name, y], i) => ({ id: cid, kind: 'text', x: 0.05, y, w: 0.35, h: 0.16, z: i + 1, text: name, seq: i })) });
    window.wrizoFlushNow();
    await sleep(600);
    return { id, board };
  };
  const card = (board, cid) => ((entry(board) || {}).boxes || []).find((b) => b.id === cid) || null;
  const cards = (board) => JSON.stringify(((entry(board) || {}).boxes || []).filter((b) => b.kind === 'text'));
  const strokes = (id) => ((entry(id) || {}).strokes || []).length;
  const words = (id) => (entry(id) || {}).text;

  /** The Back menu's PLAN tab, where the walk's door is. */
  const toDoor = async () => {
    if (q('.wz-tutor-panel')?.getAttribute('data-open') !== 'true') { q('.wz-tutor-grip')?.click(); await sleep(700); }
    q('#wz-tutor-tab-plan')?.click();
    await v3().until(() => !!q('[data-plan-walk]'));
  };
  /** The Back menu's PLAN tab, then its "Walk the Plan" door, as she presses them. */
  const openWalk = async () => {
    await toDoor();
    const door = q('[data-plan-walk]');
    if (!door) return false;
    door.focus();   // where a real press leaves her focus
    door.click();
    const open = await v3().until(() => !!q('[data-walk-card]'));
    await sleep(700);
    return open;
  };
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null; };
  const walk = () => ({
    open: !!q('[data-walk-card]'),
    inField: !!document.activeElement && document.activeElement.hasAttribute('data-walk-field'),
    field: q('[data-walk-field]')?.textContent ?? null,
    step: q('[data-walk-step]')?.getAttribute('data-walk-step') ?? null,
    inert: !!q('#root')?.hasAttribute('inert'),
    paper: v3().paper(),
    page: rect(q('.mode-page')),
    chip: rect(q('[data-walk-chip]')),
  });
  /** Select the first `n` characters of her note in the walk's field. */
  const selectNote = (n) => {
    const field = q('[data-walk-field]');
    const node = field && document.createTreeWalker(field, NodeFilter.SHOW_TEXT).nextNode();
    if (!node) return false;
    field.focus();
    const r = document.createRange();
    r.setStart(node, 0);
    r.setEnd(node, Math.min(n, node.length));
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    return true;
  };
  /** What of the page's controls the chip lies over. */
  const chipClear = () => {
    const chip = q('[data-walk-chip]');
    if (!chip) return { chip: false, over: [] };
    const c = chip.getBoundingClientRect();
    const hits = (s) => all(s).some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top; });
    const top = document.elementFromPoint(c.left + c.width / 2, c.top + c.height / 2);
    return { chip: true, pressable: top === chip, over: ['.wz-sliver-panel', '.wz-sliver-grip', '[id^="wz-sliver-tab-"]', '.wz-ink-sheet > .ink-undo', '.forward-only-editor', '.desk-mode-tab'].filter(hits) };
  };
  /** The walk's card covers the paper: the ink sheet is under it where she would draw. */
  const underCard = (fx, fy) => { const s = q('.wz-ink-sheet'); if (!s) return null; const r = s.getBoundingClientRect(); const el = document.elementFromPoint(r.left + r.width * fx, r.top + Math.min(r.height, innerHeight - r.top) * fy); return !!el && !!el.closest('.wz-walk'); };
  const painted = (selector) => { const c = q(selector); if (!c || c.width < 2) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; };
  /** How a Board's canvas shows a card: its words and the bold run in them. */
  const onCanvas = (cid) => {
    const el = q(`.board-canvas [data-box-id="${cid}"]`);
    return el ? { text: el.textContent.replace(/\s+/g, ' ').trim(), bold: [...el.querySelectorAll('.board-text b, .board-text strong')].map((b) => b.textContent) } : null;
  };

  window.__gw = { setup, card, cards, strokes, words, toDoor, openWalk, walk,selectNote, chipClear, underCard, painted, onCanvas };
})();
