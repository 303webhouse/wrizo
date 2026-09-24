// WRITING SURFACE S0 - THE BROWSER HALF (Nick, 2026-09-24: "every time I write in the app, I hit formatting issues").
// Companion to scripts/writing-engine-audit.mjs (what the engine STORES and the decorator EMITS, no browser).
// This file supplies what only a browser can: what the page SHOWS (screenshot + computed style), what the DOM holds, and what is
// STORED after the debounce, for every styling tool in every mode, in the default theme and a dark one.
//
// Run: node scripts/harness/writing-s0-frames.mjs   (from apps/desktop, dist-web built, box turn granted)
// Output: docs/evidence/writing-s0/<theme>/<mode>-<frame>.png plus frames.json (one row per frame). It is a SURVEY: it
// reports, it does not pass/fail a fix. The rows are the evidence for docs/menus/writing-surface-s0.md.
//
// Laws honoured: real pointer events for every button and every caret; seeded through the wrizoCreateJournalPage seam;
// probe-before-click (a missing node is a recorded ROW, never an abort); stored text is read only AFTER it has changed and
// settled (two debounces sit between a keystroke and storage - flushNow does not save the editor).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = join(here, '..', '..', '..', '..', 'docs', 'evidence', 'writing-s0');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];

const THEMES = [
  { id: 'default', prefs: null },
  { id: 'dark', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
];
const MODES = ['Free Write', 'Draft', 'Revise'];
// [frame id, button title]  (titles are the lexicon's own words)
const TOOLS = [
  ['bold', 'Bold'], ['italic', 'Italic'], ['underline', 'Underline'], ['strike', 'Strikethrough'],
  ['heading', 'Heading'], ['bullet', 'Bulleted list'], ['quote', 'Block quote'],
  ['outdent', 'Outdent'], ['indent', 'Indent'],
  ['align-left', 'Align left'], ['align-center', 'Align centre'], ['align-right', 'Align right'],
];
const KEYS = [['ctrl-b', 'b'], ['ctrl-i', 'i'], ['ctrl-u', 'u']];
// the fixture the RENDER frames show: every construct the tools can store, on its own line
const KITCHEN = [
  'A plain line of prose.', '**bold** *italic* __underline__ ~~strike~~', '***bold italic*** **__bold under__**',
  '# Heading one', '## Heading two', '- a bullet', '- another bullet', '> a block quote', '>< a centred line', '>> a right line',
  '\tan indented paragraph that is long enough that it will wrap onto a second line in a narrow editor column, to see the hanging',
].join('\n');
const SHORT = 'Plain words here\nSecond line here';

const freshDesk = async (app, prefs) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    ${prefs ? `localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(prefs))});` : ''}`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const seed = async (app, id, text) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  for (let i = 0; i < 60; i += 1) {
    if (await app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').some(e => e.id === ${JSON.stringify(id)})`)) return true;
    await sleep(100);
  }
  return false;
};
const stored = (app, id) => app.evalJs(`(() => { const e = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === ${JSON.stringify(id)}); return e ? e.text : null; })()`);
// wait for stored text to STOP changing (two debounces), then return it
const settledStored = async (app, id) => {
  await sleep(2200); let last = await stored(app, id); let same = 0;
  for (let i = 0; i < 60 && same < 16; i += 1) { await sleep(150); const now = await stored(app, id); same = now === last ? same + 1 : 0; last = now; }
  return last;
};
const centre = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
const realClick = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(250); };
const shot = async (app, theme, name) => {
  const dir = join(OUT, theme); mkdirSync(dir, { recursive: true });
  const file = `${name}.png`;
  try { writeFileSync(join(dir, file), Buffer.from(await app.screenshot(), 'base64')); return `${theme}/${file}`; } catch (e) { return `SHOT-FAILED ${e.message}`; }
};
const openSliver = async (app) => {
  if (await app.evalJs("document.querySelector('.wz-sliver')?.dataset.open === 'true'")) return true;
  const g = await centre(app, '.wz-sliver-grip'); if (!g) return false;
  await realClick(app, g); await sleep(400);
  return app.evalJs("document.querySelector('.wz-sliver')?.dataset.open === 'true'");
};
const domOf = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('.forward-only-editor, .fo-editor, [contenteditable=true]');
  if (!ed) return { missing: true };
  const cs = (el) => { const s = getComputedStyle(el); return { fw: s.fontWeight, fs: s.fontStyle, td: s.textDecorationLine, ta: s.textAlign, pl: s.paddingLeft, ml: s.marginLeft, ti: s.textIndent, fz: s.fontSize, color: s.color }; };
  const classes = [...new Set([...ed.querySelectorAll('[class]')].flatMap(n => [...n.classList]))];
  return { html: ed.innerHTML.slice(0, 4000), text: ed.innerText, classes, editorClass: ed.className, editable: ed.isContentEditable,
    firstStyle: cs(ed), spans: [...ed.querySelectorAll('.md-bold,.md-italic,.md-underline,.md-strike,.md-h1,.md-h2')].slice(0, 6).map(n => ({ c: n.className, s: cs(n) })) };
})()`);
const modeTo = async (app, mode) => {
  const r = await app.click(mode); await sleep(700); return r;
};
const themeAttrs = (app) => app.evalJs("({ theme: document.documentElement.getAttribute('data-theme'), body: getComputedStyle(document.body).backgroundColor, page: JSON.stringify(document.documentElement.dataset) })");

await withHarness(async (app) => {
  for (const th of THEMES) {
    // ------------------------------------------------------------------------------------------------
    // A. RENDER frames - a stored page with every construct, shown in every mode (#10: does Free Write render styled text?)
    // ------------------------------------------------------------------------------------------------
    for (const mode of MODES) {
      await freshDesk(app, th.prefs);
      const okSeed = await seed(app, 'k', KITCHEN);
      await app.reload();
      await app.evalJs("location.hash = '#/page/k'");
      await app.waitFor("!!document.querySelector('.forward-only-editor, .fo-editor, [contenteditable=true]')", { label: 'page framed' }).catch(() => null);
      await sleep(600);
      const clicked = await modeTo(app, mode);
      const dom = await domOf(app);
      rows.push({ kind: 'render', theme: th.id, mode, seeded: okSeed, modeClicked: clicked, attrs: await themeAttrs(app), dom, stored: await stored(app, 'k'), shot: await shot(app, th.id, `render-${mode.replace(' ', '')}`) });
    }

    // ------------------------------------------------------------------------------------------------
    // B. TOOL frames - real select-all + real button press, per mode. Free Write and Revise have no toolbar by ruling:
    //    the row records "no toolbar" (probe) rather than pressing anything. Ctrl+B/I/U are pressed in every mode.
    // ------------------------------------------------------------------------------------------------
    for (const mode of MODES) {
      for (const [tid, title] of TOOLS) {
        await freshDesk(app, th.prefs);
        const id = `t-${tid}`;
        await seed(app, id, SHORT);
        await app.reload();
        await app.evalJs(`location.hash = '#/page/${id}'`);
        await app.waitFor("!!document.querySelector('.forward-only-editor, .fo-editor, [contenteditable=true]')", { label: 'page framed' }).catch(() => null);
        await sleep(500);
        await modeTo(app, mode);
        const row = { kind: 'tool', theme: th.id, mode, tool: tid };
        const edPt = await centre(app, '.forward-only-editor, .fo-editor, [contenteditable=true]');
        if (!edPt) { row.error = 'no editor'; rows.push(row); continue; }
        await realClick(app, { x: edPt.x, y: edPt.y - 20 });
        await app.keyCombo('a'); await sleep(200);           // a real select-all
        const opened = await openSliver(app);
        const btn = await app.evalJs(`(() => { const b = [...document.querySelectorAll('.wz-sliver [title]')].find(x => x.getAttribute('title') === ${JSON.stringify(title)}); if (!b) return null; const r = b.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
        row.sliverOpen = opened;
        if (!btn) { row.toolbar = 'ABSENT'; row.dom = await domOf(app); row.stored = await stored(app, id); row.shot = await shot(app, th.id, `${mode.replace(' ', '')}-${tid}-no-toolbar`); rows.push(row); continue; }
        await realClick(app, btn);
        row.toolbar = 'pressed';
        row.stored = await settledStored(app, id);
        row.dom = await domOf(app);
        row.shot = await shot(app, th.id, `${mode.replace(' ', '')}-${tid}`);
        // press the SAME tool again (the writer's "un-bold")
        if (['bold', 'italic', 'underline', 'strike', 'bullet', 'quote', 'heading'].includes(tid)) {
          await realClick(app, btn);
          row.storedAfterSecondPress = await settledStored(app, id);
          row.domAfterSecondPress = await domOf(app);
        }
        rows.push(row);
      }
      for (const [kid, key] of KEYS) {
        await freshDesk(app, th.prefs);
        const id = `k-${kid}`;
        await seed(app, id, SHORT);
        await app.reload();
        await app.evalJs(`location.hash = '#/page/${id}'`);
        await app.waitFor("!!document.querySelector('.forward-only-editor, .fo-editor, [contenteditable=true]')", { label: 'page framed' }).catch(() => null);
        await sleep(500);
        await modeTo(app, mode);
        const row = { kind: 'key', theme: th.id, mode, key: kid };
        const edPt = await centre(app, '.forward-only-editor, .fo-editor, [contenteditable=true]');
        if (!edPt) { row.error = 'no editor'; rows.push(row); continue; }
        await realClick(app, { x: edPt.x, y: edPt.y - 20 });
        await app.keyCombo('a'); await sleep(150);
        await app.keyCombo(key); await sleep(300);
        row.domImmediately = await domOf(app);            // native contenteditable bold shows here (as <b>/<strong>)
        row.stored = await settledStored(app, id);
        row.domSettled = await domOf(app);
        row.shot = await shot(app, th.id, `${mode.replace(' ', '')}-${kid}`);
        rows.push(row);
      }
    }

    // ------------------------------------------------------------------------------------------------
    // C. SCREENPLAY, where its toolbar exists - best effort: an unborn screenplay page, then whatever the surface offers.
    // ------------------------------------------------------------------------------------------------
    await freshDesk(app, th.prefs);
    await app.evalJs("location.hash = '#/page/new?structure=screenplay'");
    await sleep(1200);
    const sp = { kind: 'screenplay', theme: th.id };
    sp.surface = await app.evalJs("({ scriptPage: !!document.querySelector('.script-page, .script-editor'), editable: !!document.querySelector('[contenteditable=true]'), sliverButtons: [...document.querySelectorAll('.wz-sliver [title]')].map(b => b.getAttribute('title')) })");
    sp.shot = await shot(app, th.id, 'screenplay');
    rows.push(sp);
  }
});

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'frames.json'), JSON.stringify(rows, null, 2));
// a one-line-per-frame digest for the terminal (the JSON is the evidence)
for (const r of rows) {
  const d = r.dom || r.domSettled;
  console.log([r.kind, r.theme, r.mode || '', r.tool || r.key || '', r.toolbar || '', JSON.stringify(r.stored ?? null),
    d && !d.missing ? `classes=[${(d.classes || []).filter((c) => /^md-/.test(c)).join(',')}]` : 'no-dom', r.shot || ''].join(' | '));
}
console.log(`FRAMES ${rows.length} written to ${OUT}`);
