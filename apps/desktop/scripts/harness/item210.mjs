// ITEM 210 - TITLES AND EXCERPTS ARE PLAIN TEXT (Nick, 2026-09-25: "The title bar is still showing the asterisks").
// His screenshot: Draft, title bar "**TESTING** THE *DATABASE* SYNC". Every place a page's words are DERIVED into a label - the title
// bar, the Page face, the Journal/Shelf boards' cards, the Spread caption, the Desk rail, the cascade lists, the exports' headings - now reads
// them through the one reader (store/markRuns.ts via entryText.firstLine/plainLines). The formatter's own derivations are pinned
// browserlessly by scripts/writing-format-proof.mjs; this file looks at the screens.
//
// THE QUESTION ASKED OF EACH SURFACE: is there any text on the page, OUTSIDE an editable surface and outside a collapsed `.md-mark`
// (which is how the page's own decorated text hides its markers), that still contains markup? Decorated bodies keep their marker
// characters inside `.md-mark` spans, so anything else that carries `**` is a derived label that skipped the reader.
// Run: node scripts/harness/item210.mjs   (from apps/desktop, dist-web built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TITLE = '**TESTING** THE *DATABASE* SYNC';
const BODY = 'and a body line with **bold** and *italic* words\n\n- a bullet **point**';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
// the text on the page that is NOT a decorated body: outside any contenteditable and outside any collapsed/visible `.md-mark`
const strayMarkup = (app) => app.evalJs(`(() => {
  const out = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const t = n.data;
    if (!/\\*\\*|\\*[A-Z]+\\*|(^|\\s)\\*[a-z]+\\*(\\s|$)|^\\s*(# |>\\| |- )\\S/.test(t)) continue;
    const el = n.parentElement;
    if (!el) continue;
    if (el.closest('.md-mark, [contenteditable="true"], script, style, textarea, .md-h1, .md-h2')) continue;
    out.push(t.trim().slice(0, 80));
  }
  return out;
})()`);

await withHarness(async (app) => {
  await freshDesk(app);
  // a filed page, plus one loose page, each opening with the marked-up title
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'p210', text: `${TITLE}\n\n${BODY}`, createdAt: '2026-04-01T00:00:00.000Z', origin: 'journal' })})`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'q210', text: `# **Loose** page title\n\n${BODY}`, createdAt: '2026-04-02T00:00:00.000Z', origin: 'loose' })})`);
  await sleep(700);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after reload' });
  await sleep(600);

  const surfaces = [['the Desk', '/'], ['the Journal board', '#/journal'], ['the Shelf board', '#/shelf'], ['the Spread', '#/journal/spread'], ['the Drawers page', '#/drawers']];
  for (const [label, hash] of surfaces) {
    await app.evalJs(`location.hash = ${JSON.stringify(hash.startsWith('#') ? hash : '#/')}`);
    await sleep(1400);
    const stray = await strayMarkup(app);
    ok(`[${label}] no derived label still carries the page's markup (no \`**\`, \`*WORD*\`, heading mark or block token as visible text)`, stray.length === 0, JSON.stringify(stray));
  }

  // THE SCREENSHOT: Draft, the caret INSIDE the bold word, the title bar / crumb / page face above it
  await app.evalJs("location.hash = '#/page/p210'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page framed' });
  await sleep(500);
  await app.click('Draft'); await sleep(900);
  const pt = await app.evalJs(`(() => { const b = document.querySelector('.forward-only-editor .md-bold'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  if (pt) { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(500); }
  const bar = await app.evalJs(`(() => {
    const txt = (sel) => [...document.querySelectorAll(sel)].map(e => e.textContent.trim()).filter(Boolean);
    return { crumb: txt('.wz-crumb, .desk-crumb, [class*="crumb"]'), face: txt('.wz-pageface-title, [class*="pageface-title"]'), title: document.title, hasEditorBold: !!document.querySelector('.forward-only-editor .md-bold') };
  })()`);
  const strayDraft = await strayMarkup(app);
  ok('[the page, Draft, caret inside the bold word] the title bar / crumb / face read the plain words, and nothing outside the editor shows markup', strayDraft.length === 0, JSON.stringify({ strayDraft, bar }));
  ok('[the page] the title is the WORDS: "TESTING THE DATABASE SYNC" appears in the chrome (a label was derived, not skipped)', JSON.stringify(bar).includes('TESTING THE DATABASE SYNC'), JSON.stringify(bar));

  // Free Write and Revise draw the same chrome
  for (const mode of ['Free Write', 'Revise']) {
    await app.click(mode); await sleep(800);
    const s = await strayMarkup(app);
    ok(`[the page, ${mode}] no markup outside the editor`, s.length === 0, JSON.stringify(s));
  }

  // The second page: a heading title with bold inside it
  await app.evalJs("location.hash = '#/page/q210'");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'q framed' });
  await sleep(900);
  const sq = await strayMarkup(app);
  ok('[the page, a `# **Loose**` heading title] derived as "Loose page title"', sq.length === 0 && JSON.stringify(await app.evalJs("document.body.innerText")).includes('Loose page title'), JSON.stringify(sq));

  // A board card: text cards and the board's own name
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'b210', text: '**Plot** board', pageType: 'board', createdAt: '2026-04-03T00:00:00.000Z', origin: null,
    boxes: [{ id: 'b210-c', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.14, z: 1, text: '**Card** title\nsecond *line* here' }] })})`);
  await sleep(700);
  await app.evalJs("location.hash = '#/page/b210'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'board framed' });
  await sleep(900);
  const sb = await strayMarkup(app);
  const name = await app.evalJs("document.body.innerText.includes('Plot board')");
  ok('[a board] its name and its card faces show no markup outside the decorated card bodies, and the name is "Plot board"', sb.length === 0 && name === true, JSON.stringify({ sb, name }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nITEM210 VERIFY: PASS (${checks.length} checks)` : `\nITEM210 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
