// #133 follow-on (POLISH, Nov 25; found through reorg-split-full F6): since #133 the prose page is PAINTED larger than its layout (a transform), and
// every place that reads a distance off the screen (getBoundingClientRect) and gives it to the page's own scroller or to a box inside the page must
// first divide it by the painted scale. These checks stand on a REAL page painted past 1.15:
//   A1  Draft: the caret above the view, Enter brings the new line into the sheet (a script-placed caret: store/caretInView.ts revealCaret)
//   A2  Draft: the caret below the view, the same
//   O   a long page opened for the first time shows its caret's line, and its first drawn row is whole
//   W   the open-page tint (components/useWarmStart.ts) lies over the last block
//   S   a search result far down the page is brought into the sheet (reorg/search/searchMarks.ts)
// The Typewriter is not here: a page painted large always runs it zoomed (ModeStage `zoomed`), and that path already divides by the painted scale.
//   MUT the "line is in the sheet" reading goes false when the sheet is scrolled away from the line
// THE PRODUCT'S OWN LOOKS, as page-small-133.mjs. Run: node scripts/harness/page-small-133-scroll.mjs  (from apps/desktop, dist-web built)
Object.assign(process.env, { WS_REORG: '1', WS_ARBOR2: 'default', WS_MACHINA2: 'default', WS_FLUX3: 'default', WS_PLACE: '1' });
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${typeof detail === 'string' ? detail : JSON.stringify(detail)}]` : ''}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);

const LINES = (n) => Array.from({ length: n }, (_, i) => `Row ${String(i + 1).padStart(2, '0')} keeps its own words on the page.`);
const LAST = 'The lamp burned low tonight.';

// the page side. LINE(marker): where the marked row stands against the page's scroll box, in screen px
const BOX = `(() => { const s = document.querySelector('.desk-frame-stage .mode-page .mode-scroll'); if (!s) return null; const b = s.getBoundingClientRect(); const p = s.closest('.mode-page');
  return { top: b.top, bottom: Math.min(b.bottom, innerHeight), h: b.height, scrollTop: s.scrollTop, room: s.scrollHeight - s.clientHeight, k: p.getBoundingClientRect().width / p.offsetWidth }; })()`;
const FIND = (marker) => `(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) { const at = n.data.indexOf(${J(marker)}); if (at >= 0) return { n, at }; } return null; })()`;
const LINE = (marker) => `(() => { const f = ${FIND(marker)}; if (!f) return null; const r = document.createRange(); r.setStart(f.n, f.at); r.setEnd(f.n, f.at + ${J(marker)}.length);
  const q = r.getBoundingClientRect(); return { top: q.top, bottom: q.bottom, left: q.left, right: q.right }; })()`;
const CARET_AT = (marker) => `(() => { const ed = document.querySelector('.desk-frame-stage .forward-only-editor'); ed.focus({ preventScroll: true }); const f = ${FIND(marker)}; if (!f) return false;
  const r = document.createRange(); r.setStart(f.n, f.at + 1); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`;
const CARET = `(() => { const s = getSelection(); if (!s.rangeCount) return null; const r = s.getRangeAt(0); let q = r.getClientRects()[0]; if (!q || !q.height) { const e = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement; q = e.closest('.wz-row, div, p, span').getBoundingClientRect(); }
  return { top: q.top, bottom: q.bottom }; })()`;
const SCROLL_TO = (v) => `(() => { const s = document.querySelector('.desk-frame-stage .mode-page .mode-scroll'); s.dispatchEvent(new WheelEvent('wheel', { bubbles: true })); s.scrollTop = ${v}; return s.scrollTop; })()`;
const inside = (line, box) => !!line && !!box && line.top >= box.top - 2 && line.bottom <= box.bottom + 2;

async function load(app, theme, w, h) {
  await app.emulateDpr(1, w, h);
  await app.evalJs("location.hash = '#/'");
  await app.evalJs(`localStorage.setItem('wrizo-theme', ${J(theme)})`);
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
}
async function make(app, id, text, mode = 'drafting') {
  await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: null, source: 'page' })}); localStorage.setItem('wrizo-mode-page-${id}', ${J(mode)}); window.wrizoFlushNow()`);
}
async function openPage(app, id) {
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.desk-frame-stage .mode-page') && !!document.querySelector('.desk-frame-stage .forward-only-editor')", { label: id, timeout: 10000 });
  await sleep(2600);   // past the page's own open settle (2 s at the latest)
}

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();

  for (const [theme, name, w, h] of [['plateau', 'Arbor', 1366, 768], ['machina', 'Machina', 1920, 1080]]) {
    const at = `${name} ${w}x${h}`;
    await load(app, theme, w, h);
    const rows = LINES(70); rows[59] = 'Row 60 hides a zebra among its words.';
    await make(app, `s-${theme}`, rows.concat([LAST]).join('\n'));
    await openPage(app, `s-${theme}`);
    const opened = { box: await app.evalJs(BOX), line: await app.evalJs(LINE(LAST)) };
    ok(`${at} (premise): the page is painted past 1.15 and scrolls`, !!opened.box && opened.box.k > 1.15 && opened.box.room > 400, opened.box);
    const cut = await app.evalJs(`(() => { const s = document.querySelector('.desk-frame-stage .mode-page .mode-scroll'); const top = s.getBoundingClientRect().top;
      for (const r of s.querySelectorAll('.wz-row')) { const q = r.getBoundingClientRect(); if (q.height > 0 && q.bottom > top + 1) return Math.round((top - q.top) * 10) / 10; } return null; })()`);
    ok(`${at} O: a long page opened for the first time shows its caret's line, and its first drawn row is whole`, inside(opened.line, opened.box) && cut !== null && cut <= 1, { line: opened.line, box: opened.box, firstRowCutBy: cut });

    // A1: the caret high in the page, the view at its foot
    await app.evalJs(CARET_AT('Row 12'));
    await app.evalJs(SCROLL_TO(1e6));
    await sleep(400);
    await app.typeKeys('\n');
    await sleep(500);
    const a1 = { box: await app.evalJs(BOX), line: await app.evalJs(CARET) };
    ok(`${at} A1: the caret above the view, Enter brings the new line into the sheet`, inside(a1.line, a1.box), a1);
    await app.evalJs(SCROLL_TO(a1.box.scrollTop + a1.box.h * 2));
    await sleep(200);
    const away = { box: await app.evalJs(BOX), line: await app.evalJs(CARET) };
    ok(`${at} MUT: scrolled away from the line, the same reading says it is not in the sheet`, !inside(away.line, away.box), away);

    // A2: the caret far down, the view at the top
    await app.evalJs(CARET_AT('Row 45'));
    await app.evalJs(SCROLL_TO(0));
    await sleep(400);
    await app.typeKeys('\n');
    await sleep(500);
    const a2 = { box: await app.evalJs(BOX), line: await app.evalJs(CARET) };
    ok(`${at} A2: the caret below the view, Enter brings the new line into the sheet`, inside(a2.line, a2.box), a2);

    // S: a search result far down the page
    await app.evalJs(SCROLL_TO(0));
    const door = await app.evalJs("(() => { const b = document.querySelector('[data-top-search]'); if (!b) return false; b.click(); return true; })()");
    await app.waitFor("!!document.querySelector('[data-search-menu] [data-search-q]')", { label: 'the search field', timeout: 5000 }).catch(() => {});
    await sleep(500);
    const field = await app.evalJs(`(() => { const i = document.querySelector('[data-search-menu] [data-search-q]'); if (!i) return false; i.focus();
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'zebra'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await sleep(900);
    const hit = await app.evalJs(`(() => { const b = document.querySelector('[data-search-hit][data-hit-entry="s-${theme}"]'); if (!b) return false; b.click(); return true; })()`);
    await sleep(900);
    const s = { door, field, hit, box: await app.evalJs(BOX), line: await app.evalJs(LINE('zebra')) };
    ok(`${at} S: a search result far down the page is brought into the sheet`, field && hit && inside(s.line, s.box), s);

    // W: the open-page tint, over the last block
    await make(app, `w-${theme}`, LINES(8).concat(['', LAST]).join('\n'));
    await app.evalJs(`history.replaceState({ usr: { warmStart: true }, key: 'warm133', idx: 0 }, '', '#/page/w-${theme}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-warm')", { label: 'the tint', timeout: 12000 }).catch(() => {});
    await sleep(250);
    const warm = await app.evalJs("(() => { const t = document.querySelector('.wz-warm'); if (!t) return null; const q = t.getBoundingClientRect(); return { top: q.top, bottom: q.bottom, left: q.left, right: q.right }; })()");
    const last = await app.evalJs(LINE(LAST));
    ok(`${at} W: the open-page tint lies over the last block`, !!warm && !!last && warm.top <= last.top + 4 && warm.bottom >= last.bottom - 4 && last.top - warm.top <= 24 && warm.bottom - last.bottom <= 24 && Math.abs(warm.left - last.left) <= 24, { warm, last });
  }

});

const failed = checks.filter((c) => !c.pass).length;
console.log(`\nPAGE-SMALL-133-SCROLL VERIFY: ${failed ? `FAIL - ${failed}/${checks.length} failed` : `PASS - ${checks.length}/${checks.length}`}`);
process.exit(failed ? 1 : 0);
