// FLUX3 S4b L5 - THE PORT BOX'S PREVIEW (flux3-s4b-plan.md L5; flux-full-look-for-monday.md item 5, tier B; Fable, Nov 21: "then L6 the node voice, then L5 the port box's
// preview"). The source is the Oct 28 doc mockup's .pbox .node: the linked node, previewed in the box a port opens: its address and kind, its name in capitals, a short body.
// The plan: "one preview block of the linked node (title + a short body, read-only, from data already loaded). Open-as-hologram and Go-to-Schema stay out, as ruled."
// Read on a writing page behind ?flux3=1 (Flux theme), whose page owns three connections: a page, a preset card on a board, and a board.
//   PAGE    the page's port: the preview reads DOC 0x<addr of that page>, its name (the page's first line) in capitals, and the lines after it as its body
//   CARD    the card's port: NODE 0x<addr of the card>, the card's first line as its name and the rest as its body; a preset step is drawn in lime
//   BOARD   the board's port: its address and its name, no body
//   ONLY    read-only: the preview holds no field, no button and nothing editable; the box keeps exactly the acts it had (Dock where it had it, Connect another, Disconnect);
//           no hologram, no Go to the Schema
//   SHORT   a long body is clamped to three lines
//   RECT    the page's rects and editor node are the same with a box open (the preview having drawn)
//   SOURCE  the preview reads the stored page through getJournalEntry only and writes nothing
//   MUT     the reader can go red: with the preview taken away, PAGE reads false
// Run: node scripts/harness/flux3-s4b-l5.mjs (from apps/desktop; a box turn or Actions).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, '..', '..', 'src');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const nodeHex = (id) => { let h = 7; for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0; return (h & 0xffff).toString(16).toUpperCase().padStart(4, '0'); };
const LIME = 'rgb(183, 255, 60)';
const LONG = Array.from({ length: 12 }, (_, i) => `Line ${i + 1} of the other page's body keeps on going.`).join(' ');

const INSTRUMENT = `(() => {
  if (window.__l5) return;
  const I = window.__l5 = {};
  I.box = () => { const b = document.querySelector('[data-flux3-port-box]'); if (!b) return null; const p = b.querySelector('[data-flux3-port-node]');
    const pv = p ? (() => { const h = p.querySelector('[data-port-node-h]'), n = p.querySelector('[data-port-node-name]'), body = p.querySelector('[data-port-node-body]');
      const lh = body ? parseFloat(getComputedStyle(body).lineHeight) : 0;
      return { h: h ? (h.innerText || '').replace(/\\s+/g, ' ').trim() : null, name: n ? (n.textContent || '').trim() : null, nameTT: n ? getComputedStyle(n).textTransform : null, nameColor: n ? getComputedStyle(n).color : null,
        body: body ? (body.textContent || '').trim() : null, bodyH: body ? body.getBoundingClientRect().height : 0, lineH: lh,
        fields: p.querySelectorAll('input, textarea, select, button, [contenteditable="true"], a').length }; })() : null;
    return { preview: pv, acts: [...b.querySelectorAll(':scope > [data-port-act]')].map((x) => x.getAttribute('data-port-act')), text: (b.textContent || '') }; };
  I.rects = () => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((n) => Math.round(n * 10) / 10).join(','); };
    return { col: q('.mode-pagecol'), page: q('.mode-page'), editor: q('.forward-only-editor') }; };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const press = async (sel) => { const p = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
    if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await app.mouseUp(p.x, p.y); return true; };
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();

  // ---- the fixture (seams only): l5-p1 owns three connections: a page (l5-p2), a preset card on a board (l5-b1 / l5-k) and a board (l5-b2) ----------------------------------
  const seeded = await ev(`(() => {
    const W = window, at = '2026-04-01T00:00:00.000Z';
    W.wrizoCreateJournalPage({ id: 'l5-p1', text: 'The tolls rose at dawn.', createdAt: at, origin: 'loose', source: 'page' });
    W.wrizoCreateJournalPage({ id: 'l5-p2', text: 'The other page\\n' + ${JSON.stringify(LONG)}, createdAt: at, origin: 'loose', source: 'page' });
    W.wrizoCreateJournalPage({ id: 'l5-b1', text: 'Plot board', pageType: 'board', createdAt: at, origin: null, source: null,
      boxes: [{ id: 'l5-k', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'The hook\\nThe step body.', deckStep: { deck: 'three-act', step: 'hook' } }] });
    W.wrizoCreateJournalPage({ id: 'l5-b2', text: 'Cast board', pageType: 'board', createdAt: at, origin: null, source: null, boxes: [] });
    W.wrizoAddPageLink('l5-p1', { bEntryId: 'l5-p2' });
    W.wrizoAddPageLink('l5-p1', { bEntryId: 'l5-b1', bBoxId: 'l5-k' });
    W.wrizoAddPageLink('l5-p1', { bEntryId: 'l5-b2' });
    W.wrizoFlushNow();
    return { links: (W.wrizoPageLinksOf('l5-p1') || []).filter((l) => !l.deletedAt).length };
  })()`);
  await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = 'dark'; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-mode-page-l5-p1', 'drafting'); })()`);
  await ev(`history.replaceState(null, '', '/?flux3=1#/page/l5-p1')`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && document.querySelectorAll('.flux3-port').length >= 3", { timeout: 15000, label: 'the page and its ports' }).catch(() => {});
  await splashGone();
  await app.mouseMove(8, 8);
  await sleep(1600);

  const openPort = async (kind) => { await ev("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); null"); await sleep(250);
    await press(`.flux3-port[data-port-kind="${kind}"]`); await sleep(500); return ev('window.__l5.box()'); };
  const r0 = await ev('window.__l5.rects()');
  await ev("(() => { const n = document.querySelector('.forward-only-editor'); if (n) n.__l5Mark = 1; return null; })()");

  const pg = await openPort('page');
  const r1 = await ev('window.__l5.rects()');
  const kept = await ev("!!(document.querySelector('.forward-only-editor') || {}).__l5Mark");
  const pagePv = (b) => !!b && !!b.preview && b.preview.h === `DOC 0x${nodeHex('l5-p2')}` && b.preview.name === 'The other page' && b.preview.nameTT === 'uppercase' && !!b.preview.body && b.preview.body.startsWith('Line 1 of the other page');
  ok(`PAGE the page's port previews it: DOC 0x${nodeHex('l5-p2')}, its first line as its name in capitals, the lines after it as its body`, seeded.links === 3 && pagePv(pg), { seeded, pg });
  ok('SHORT a long body is clamped to three lines', !!pg && !!pg.preview && pg.preview.lineH > 0 && pg.preview.bodyH <= pg.preview.lineH * 3 + 1 && pg.preview.bodyH >= pg.preview.lineH * 2, pg && pg.preview);
  ok('ONLY the preview is read-only (no field, button, link or editable), and the page\'s box keeps its acts: Dock, Connect another, Disconnect; no hologram, no Go to the Schema',
    !!pg && !!pg.preview && pg.preview.fields === 0 && JSON.stringify(pg.acts) === '["dock","link","unlink"]' && !/hologram|schema/i.test(pg.text), pg);
  ok('RECT the page\'s rects and its editor node are the same with a box open and its preview drawn', !!r0 && JSON.stringify(r0) === JSON.stringify(r1) && kept && !!pg && !!pg.preview, { r0, r1, kept });

  const cd = await openPort('card');
  ok(`CARD the card's port previews it: NODE 0x${nodeHex('l5-k')}, "The hook" as its name and its body after it; a preset step drawn in lime`,
    !!cd && !!cd.preview && /^NODE 0x/.test(cd.preview.h) && cd.preview.h.includes(nodeHex('l5-k')) && cd.preview.name === 'The hook' && cd.preview.body === 'The step body.' && cd.preview.nameColor === LIME, cd);
  const bd = await openPort('board');
  ok('BOARD the board\'s port previews its address and its name, and no body', !!bd && !!bd.preview && bd.preview.h.includes(nodeHex('l5-b2')) && bd.preview.name === 'Cast board' && !bd.preview.body, bd);

  const pg2 = await openPort('page');
  await ev("document.querySelectorAll('[data-flux3-port-node]').forEach((e) => e.remove()); null");
  const gone = await ev('window.__l5.box()');
  ok('MUT with the preview taken away, PAGE reads false (the reader can go red)', pagePv(pg2) && !pagePv(gone), { gone });
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

// ---- SOURCE: the preview reads the stored page and writes nothing ------------------------------------------------------------------------------------------------------------
{
  const doc = fs.existsSync(path.join(SRC, 'flux3', 'FluxDoc.tsx')) ? fs.readFileSync(path.join(SRC, 'flux3', 'FluxDoc.tsx'), 'utf8').replace(/\r\n/g, '\n') : '';
  const at = doc.indexOf('function PortPreview(');
  const end = at >= 0 ? doc.indexOf('\nfunction ', at + 10) : -1;
  const body = at >= 0 ? doc.slice(at, end > 0 ? end : undefined) : '';
  const reads = /getJournalEntry\(/.test(body);
  const writes = /\b(addPageLink|removePageLink|saveJournalEntry|patchJournalEntry|saveBoardBoxes|setLinkDock|requestDelete)\s*\(/.test(body);
  ok('SOURCE the preview (PortPreview) reads the stored page through getJournalEntry and writes nothing', at >= 0 && reads && !writes, { found: at >= 0, reads, writes });
}

const EXPECTED = 8;
let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + String(c.detail).slice(0, 1500)}`); if (!c.pass) bad += 1; }
if (checks.length !== EXPECTED) bad = Math.max(bad, 1);
console.log(bad ? `\nFLUX3-S4B-L5 VERIFY: FAIL - ${bad}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}` : `\nFLUX3-S4B-L5 VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
