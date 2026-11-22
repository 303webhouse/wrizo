// FLUX3 S4b L4 - THE PAGE'S FRAME (flux3-s4b-plan.md L4; flux-full-look-for-monday.md item 4, tier A, the Flux bonus: Fable, Nov 21, 4:58 pm; the source is the Oct 28 mockup,
// flux-page-mockup-2-schema-doc.html #page::before/::after and #page .hd). Read in the live page behind ?flux3=1 (Flux theme), on a writing page.
//   BRACKETS  two corner brackets OUTSIDE the glass: the top-left one beyond the page's top-left corner, the bottom-right one beyond its bottom-right corner, in the circuit's cyan;
//             the page's own inset brackets (plain Flux's, inside the paper) are not drawn
//   GRID      no grid under the words: plain Flux's grid ring in the paper (.flux-frame) is not drawn, and nothing on the page, its scroller or the editor paints a background image
//   HEAD      a readout header across the page's top edge, inside its top padding (above the first line of words): DOC // 0x<four hex> on the left (the address FluxNodeRecord gives
//             this id), and <n> WORDS · <n> BLOCKS · <n> CONNECTIONS on the right, TRUE to the seeded page (3 paragraphs, 12 words, 1 connection), in the chrome face's capitals
//   PAUSE     the header follows her words on the pause (never per key): two words typed, and after the pause it reads 14 WORDS
//   RECT      the frame adds nothing to any layout: the page's rects (column, page, editor) are the same with the L4 frame taken away, at 1366 and 1920 (page primacy)
//   OFF       without the flag the page's frame is plain Flux's as it was: its grid ring and inset brackets drawn, no outside brackets, no header
//   MUT       the readers can go red: with the L4 frame taken away, BRACKETS, GRID and HEAD read false
//   CLEAR     (law 1; Fable, Nov 21, 6:00 pm: "It must never cover a line of text, at any size or scroll") on a long page at 1366, 1920 and 2560, unscrolled and scrolled to the middle
//             of a line, the header is drawn and the first line she can see starts at or below the header's foot (unscrolled: the first row's own top; scrolled: where the scroller's
//             clip edge lets it show)
//   CLEAR-MUT the reader can go red: the same header made 40 px taller reads as covering
// FLUX3_SHOTS=<dir> writes frames. Run: node scripts/harness/flux3-s4b-l4.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const CYAN = 'rgb(0, 194, 255)';
const TEXT = 'The tolls rose at dawn.\n\nA booth stood empty there.\n\nNobody paid.';   // 3 blocks (a blank line is no block), 5 + 5 + 2 = 12 words
// the address FluxNodeRecord.nodeHex gives an id (the same function, written out: a reader must not import the code it judges)
const nodeHex = (id) => { let h = 7; for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0; return (h & 0xffff).toString(16).toUpperCase().padStart(4, '0'); };

const INSTRUMENT = `(() => {
  if (window.__l4) return;
  const I = window.__l4 = {};
  const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const vis = (e) => !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 0;
  I.frame = () => { const page = document.querySelector('.mode-page'); if (!page) return null;
    const col = page.parentElement, ed = page.querySelector('.forward-only-editor');
    const tl = col.querySelector(':scope > [data-flux3-bracket="tl"]'), br = col.querySelector(':scope > [data-flux3-bracket="br"]');
    const bs = (e) => { if (!e) return null; const s = getComputedStyle(e); return { rect: R(e), vis: vis(e), top: s.borderTopColor, left: s.borderLeftColor, right: s.borderRightStyle, bottom: s.borderBottomStyle, topS: s.borderTopStyle, leftS: s.borderLeftStyle, w: s.borderTopWidth }; };
    const inset = page.querySelector('.flux-readouts > .flux-brackets'), ring = page.querySelector('.flux-readouts > .flux-frame');
    const head = col.querySelector(':scope > [data-flux3-dochead]');
    const firstRow = ed ? ed.querySelector('.wz-row') : null;
    const bg = (e) => e ? getComputedStyle(e).backgroundImage : null;
    return { page: R(page), editor: R(ed), firstRow: R(firstRow || ed), tl: bs(tl), br: bs(br), insetVis: vis(inset), ringVis: vis(ring), ringBg: bg(ring),
      bgs: { page: bg(page), scroll: bg(page.querySelector('.mode-scroll')), editor: bg(ed) },
      head: head ? { vis: vis(head), rect: R(head), text: (head.textContent || '').replace(/\\s+/g, ' ').trim(), shown: (head.innerText || '').replace(/\\s+/g, ' ').trim(), tt: getComputedStyle(head).textTransform,
        ff: getComputedStyle(head).fontFamily, chrome: getComputedStyle(document.documentElement).getPropertyValue('--font-chromeLabel').trim() } : null }; };
  // law 1: the header's foot against the first line she can see (a row's top, or the scroller's clip edge when the row is scrolled partly out of view)
  I.clear = () => { const page = document.querySelector('.mode-page'); if (!page) return null; const col = page.parentElement;
    const head = col.querySelector(':scope > [data-flux3-dochead]'), sc = page.querySelector('.mode-scroll'), ed = page.querySelector('.forward-only-editor'); if (!sc || !ed) return null;
    const clip = sc.getBoundingClientRect().top;
    const rows = [...ed.querySelectorAll('.wz-row')].map((r) => r.getBoundingClientRect()).filter((r) => r.height > 0 && r.bottom > clip + 1);
    const first = rows[0] || null, shown = vis(head);
    return { shown, foot: shown ? head.getBoundingClientRect().bottom : null, clip, firstTop: first ? first.top : null, seen: first ? Math.max(first.top, clip) : null, scrollTop: sc.scrollTop, rows: rows.length }; };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); };
    return { col: q('.mode-pagecol'), page: q('.mode-page'), editor: q('.forward-only-editor'), host: q('.desk-frame-host') }; };
  // the control arm: the L4 frame away (its overlays and every flag-scoped rule naming them), the same page without the frame
  I.undress = () => { let n = 0; document.querySelectorAll('[data-flux3-bracket], [data-flux3-dochead], [data-flux3-docframe]').forEach((e) => { e.remove(); n += 1; });
    for (const sh of [...document.styleSheets]) { let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (let i = rules.length - 1; i >= 0; i--) { const t = rules[i].selectorText || ''; if (t.indexOf('data-flux3') >= 0 && /flux3-bracket|flux3-dochead|data-flux3-docframe/.test(t)) { sh.deleteRule(i); n += 1; } } } return n; };
})()`;

const norm = (f) => String(f || '').replace(/[\s'"]/g, '').toLowerCase();
const brackets = (f) => !!f && !!f.tl && !!f.br && f.tl.vis && f.br.vis && !f.insetVis
  && f.tl.rect.l < f.page.l && f.tl.rect.t < f.page.t && f.br.rect.r > f.page.r && f.br.rect.b > f.page.b
  && f.tl.top === CYAN && f.tl.left === CYAN && f.tl.right === 'none' && f.tl.bottom === 'none' && f.br.topS === 'none' && f.br.leftS === 'none';
const noGrid = (f) => !!f && !f.ringVis && Object.values(f.bgs).every((b) => !b || b === 'none');
const headRe = (id, words, blocks, links) => new RegExp(`^DOC // 0x${nodeHex(id)}\\s+${words} WORDS · ${blocks} BLOCKS · ${links} CONNECTIONS?$`);
const head = (f, id, words, blocks, links) => !!f && !!f.head && f.head.vis && headRe(id, words, blocks, links).test(f.head.shown)
  && f.head.rect.t >= f.page.t && f.head.rect.b <= f.firstRow.t + 0.5 && f.head.rect.l >= f.page.l && f.head.rect.r <= f.page.r && f.head.tt === 'uppercase' && norm(f.head.ff) === norm(f.head.chrome);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  // ---- the fixture (seams only): a page of three paragraphs that owns one connection (a page link to a second page) ----------------------------------------------------
  const seeded = await ev(`(() => {
    const W = window;
    W.wrizoCreateJournalPage({ id: 'l4-p1', text: ${JSON.stringify(TEXT)}, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' });
    W.wrizoCreateJournalPage({ id: 'l4-p2', text: 'The other page.', createdAt: '2026-04-01T00:00:01.000Z', origin: 'loose', source: 'page' });
    W.wrizoAddPageLink('l4-p1', { bEntryId: 'l4-p2' });
    W.wrizoCreateJournalPage({ id: 'l4-long', text: Array.from({ length: 30 }, (_, i) => 'Paragraph ' + (i + 1) + ' runs on with plain words so the page wraps a line or two and keeps going well past the fold of the glass.').join('\\n\\n'),
      createdAt: '2026-04-01T00:00:02.000Z', origin: 'loose', source: 'page' });
    // the frames job's own doc (scripts/frames/flux3-s3.mjs PARAS), for the INFO reading of Fable's 1366 frame
    W.wrizoCreateJournalPage({ id: 'l4-frames', text: ['The first paragraph runs long enough to wrap across a few lines of the page, so that the line holding the caret is only one of the several lines it fills with these plain words.', '',
      'A second block, shorter.', 'Third block keeps going with plain words for the gutter count.', '', 'Fourth and last block closes the page with a handful more words to read.'].join('\\n'),
      createdAt: '2026-04-01T00:00:03.000Z', origin: 'loose', source: 'page' });
    W.wrizoFlushNow();
    return { links: (W.wrizoPageLinksOf('l4-p1') || []).filter((l) => !l.deletedAt).length };
  })()`);
  const WORDS0 = TEXT.split(/\s+/).filter(Boolean).length, BLOCKS = 3;

  const open = async (id, { flag = true, w = 1920, h = 1080 } = {}) => {
    await app.emulateDpr(1, w, h);
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');
      localStorage.setItem('wrizo-mode-page-${id}', 'drafting'); })()`);
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { timeout: 15000, label: `the page ${id}` }).catch(() => {});
    await splashGone();
    await app.mouseMove(8, 8);
    await sleep(1600);   // past the gutter's pause (FluxDoc GUTTER_PAUSE_MS 700), so the frame has measured
  };
  const frame = () => ev('window.__l4.frame()');
  const rects = () => ev('window.__l4.rects()');

  // ---- BRACKETS, GRID, HEAD at 1920; RECT and MUT through the same page's control arm, at 1920 and 1366 ------------------------------------------------------------------
  await open('l4-p1');
  const f = await frame();
  await snap('l4-p1-1920');
  ok('BRACKETS two corner brackets OUTSIDE the glass (top-left beyond the top-left corner, bottom-right beyond the bottom-right), cyan; the page\'s inset brackets not drawn', brackets(f), { seeded, tl: f && f.tl, br: f && f.br, page: f && f.page, insetVis: f && f.insetVis });
  ok('GRID no grid under the words: plain Flux\'s grid ring is not drawn, and the page, its scroller and the editor paint no background image', noGrid(f), { ringVis: f && f.ringVis, ringBg: f && f.ringBg, bgs: f && f.bgs });
  ok(`HEAD the readout header across the page's top, inside its top padding: DOC // 0x${nodeHex('l4-p1')} and ${WORDS0} WORDS · ${BLOCKS} BLOCKS · 1 CONNECTION, in the chrome face's capitals`,
    seeded.links === 1 && head(f, 'l4-p1', WORDS0, BLOCKS, 1), { head: f && f.head, firstRow: f && f.firstRow, page: f && f.page });
  const r1920 = await rects();
  const removed1920 = await ev('window.__l4.undress()'); await sleep(300);
  const r1920off = await rects(), fOff = await frame();
  ok('MUT with the L4 frame taken away, BRACKETS, GRID and HEAD read false (the readers can go red)', removed1920 > 0 && !brackets(fOff) && !noGrid(fOff) && !head(fOff, 'l4-p1', WORDS0, BLOCKS, 1), { removed1920, fOff });

  await open('l4-p1', { w: 1366, h: 768 });
  const f1366 = await frame();
  await snap('l4-p1-1366');
  const r1366 = await rects();
  const removed1366 = await ev('window.__l4.undress()'); await sleep(300);
  const r1366off = await rects();
  const same = (a, b) => ['col', 'page', 'editor', 'host'].every((k) => a[k] !== null && a[k] === b[k]);
  ok('RECT the page\'s rects (column, page, editor, host) are the same with the L4 frame taken away, at 1920 and 1366; and the frame is drawn at 1366 too',
    removed1920 > 0 && removed1366 > 0 && same(r1920, r1920off) && same(r1366, r1366off) && brackets(f1366) && head(f1366, 'l4-p1', WORDS0, BLOCKS, 1), { r1920, r1920off, r1366, r1366off, f1366h: f1366 && f1366.head });

  // ---- PAUSE: two words typed; the header follows on the pause ---------------------------------------------------------------------------------------------------------------
  await open('l4-p1');
  await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; })()");
  await sleep(300);
  await app.type(' and then');
  await app.mouseMove(12, 12);
  await sleep(2400);
  const fp = await frame();
  ok(`PAUSE the header follows her words on the pause: two words typed, it reads ${WORDS0 + 2} WORDS`, head(fp, 'l4-p1', WORDS0 + 2, BLOCKS, 1), { head: fp && fp.head });

  // ---- CLEAR (law 1): the header never covers a line, at 1366, 1920 and 2560, unscrolled and scrolled mid-line; and its mutant ----------------------------------------------------
  const clearOf = (c) => !!c && c.shown && c.rows > 0 && c.foot !== null && c.seen !== null && c.foot <= c.seen + 0.5 && c.foot <= c.clip + 0.5;
  const readings = {};
  for (const [w, h] of [[1366, 768], [1920, 1080], [2560, 1440]]) {
    await open('l4-long', { w, h });
    const flat = await ev('window.__l4.clear()');
    await ev("(() => { const sc = document.querySelector('.mode-page .mode-scroll'); if (sc) sc.scrollTop = 37; return null; })()");
    await sleep(700);
    const scrolled = await ev('window.__l4.clear()');
    await snap(`l4-long-${w}-scrolled`);
    readings[w] = { flat, scrolled, ok: clearOf(flat) && flat.firstTop !== null && flat.foot <= flat.firstTop + 0.5 && clearOf(scrolled) && scrolled.scrollTop > 0 };
  }
  ok('CLEAR (law 1) the header is drawn and never covers a line: at 1366, 1920 and 2560, unscrolled and scrolled mid-line, the first line she can see starts at or below its foot',
    Object.values(readings).every((r) => r.ok), readings);
  const mut = await ev("(() => { const h = document.querySelector('[data-flux3-dochead]'); if (!h) return null; h.style.height = (h.getBoundingClientRect().height + 40) + 'px'; return true; })()");
  const cm = await ev('window.__l4.clear()');
  ok('CLEAR-MUT the reader can go red: the same header 40 px taller reads as covering', mut === true && !clearOf(cm), { mut, cm });

  // INFO (no check): Fable's 1366 frame, the frames job's own scene (its doc, in Draft, at 1366 x 768), with the flag and without: where the header ends, where the
  // scroller clips, where the first row stands and how far the page rests scrolled (a line cut at the clip edge is the scroll's, not the header's)
  for (const flag of [true, false]) {
    await open('l4-frames', { flag, w: 1366, h: 768 });
    await ev("(() => { const b = document.querySelector('[data-mode-key=\"draft\"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); return null; })()");
    await app.mouseMove(8, 8); await sleep(2400);
    const c = await ev('window.__l4.clear()');
    const dress = await ev("(() => { const p = document.querySelector('.mode-page'); if (!p) return null; const s = getComputedStyle(p); const r = p.getBoundingClientRect(); return { padTop: s.paddingTop, pageTop: r.top, pageH: r.height, kids: [...p.children].map((k) => [k.className.split(' ')[0], getComputedStyle(k).position, Math.round(k.getBoundingClientRect().top), Math.round(k.getBoundingClientRect().height)]) }; })()");
    console.log(`INFO L4-1366-FRAME flag=${flag} ${JSON.stringify({ clear: c, dress })}`);
  }

  // ---- OFF: without the flag, plain Flux's frame as it was ----------------------------------------------------------------------------------------------------------------
  await open('l4-p1', { flag: false });
  const off = { flag: await ev("document.documentElement.hasAttribute('data-flux3')"), f: await frame() };
  ok('OFF without the flag the frame is plain Flux\'s: its grid ring and inset brackets drawn, no outside brackets and no header',
    !off.flag && !!off.f && off.f.ringVis && off.f.insetVis && !off.f.tl && !off.f.br && !off.f.head, off);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

const EXPECTED = 9;   // 7 + CLEAR and CLEAR-MUT (Fable, Nov 21, 6:00 pm)
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-L4 VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-L4 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
