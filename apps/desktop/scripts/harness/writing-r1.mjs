// WRITING-SURFACE S0 STEP 1 (Nick, 2026-09-24: "text formatting options ... are not displaying correctly").
// Ruled step 1: bullets, quotes and alignment RENDER, and Free Write runs the decorator - rendering only.
// Run: node scripts/harness/writing-r1.mjs   (from apps/desktop, dist-web built, box turn granted)
//
// Evidence that this fails on the old code: docs/evidence/writing-s0/frames.json (the 98-frame survey run on d70822c) shows
// Free Write rendering `.fo-run` only with every marker as typed, and Draft/Revise emitting no class at all for `- `, `> `,
// `>< `, `>> `. Every check below reads a class or a computed style that build could not produce.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FIX = ['A plain line of prose.', '**bold** and *italic*', '- first bullet', '- second bullet', '> a quote line', '>< a centred line', '>> a right line', 'The last plain line.'].join('\n');
const ED = '.forward-only-editor';

const freshDesk = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
};
const open = async (app, mode) => {
  await freshDesk(app);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'r1', text: FIX, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose' })})`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/r1'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page framed' });
  await sleep(500);
  await app.click(mode); await sleep(800);
};
const centre = (app, sel) => app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) } : null; })()`);
const realClick = async (app, pt) => { await app.mouseDown(pt.x, pt.y); await app.mouseUp(pt.x, pt.y); await sleep(300); };

const measure = (app) => app.evalJs(`(() => {
  const ed = document.querySelector('${ED}');
  const box = ed.getBoundingClientRect(); const cs = getComputedStyle(ed);
  const inner = { l: box.left + parseFloat(cs.paddingLeft), r: box.right - parseFloat(cs.paddingRight) };
  const one = (sel) => ed.querySelector(sel);
  const textRect = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()].filter(x => x.width > 1); return rs.length ? { l: Math.min(...rs.map(x => x.left)), r: Math.max(...rs.map(x => x.right)), t: Math.min(...rs.map(x => x.top)) } : null; };
  const bullet = one('.md-bullet'), quote = one('.md-quote'), ctr = one('.md-align-center'), right = one('.md-align-right');
  const line = (needle) => { const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const i = n.data.indexOf(needle); if (i >= 0) { const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + needle.length); const r = rg.getBoundingClientRect(); return { t: r.top, l: r.left, r: r.right }; } } return null; };
  const tops = ['A plain line', 'The last plain'].map(line);
  const b1 = line('first bullet'), b2 = line('second bullet');
  const plain = line('A plain line'), plain2 = line('**bold**') || line('bold');
  return {
    editorText: ed.textContent,
    bullet: bullet ? { glyph: getComputedStyle(bullet, '::before').content, marks: [...bullet.querySelectorAll('.md-mark')].map(m => m.className) } : null,
    quote: quote ? { bw: getComputedStyle(quote).borderLeftWidth, it: getComputedStyle(quote).fontStyle } : null,
    center: ctr ? { ta: getComputedStyle(ctr).textAlign, mid: ((line('a centred line')?.l ?? 0) + (line('a centred line')?.r ?? 0)) / 2, colMid: (inner.l + inner.r) / 2 } : null,
    right: right ? { ta: getComputedStyle(right).textAlign, gap: inner.r - (line('a right line')?.r ?? 0) } : null,
    rawMarkersVisible: [...ed.querySelectorAll('.md-mark')].filter(m => !m.classList.contains('md-mark-hidden') && /^(- |> |>< |>> )$/.test(m.textContent)).length,
    bulletStep: b1 && b2 ? b2.t - b1.t : null,
    plainStep: plain && plain2 ? plain2.t - plain.t : null,
    hasFoRun: !!ed.querySelector('.fo-run'),
  };
})()`);
const stored = (app) => app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(x => x.id === 'r1')||{}).text ?? null");

await withHarness(async (app) => {
  for (const mode of ['Free Write', 'Draft', 'Revise']) {
    await open(app, mode);
    const m = await measure(app);
    const tag = `[${mode}]`;
    ok(`${tag} a bullet line renders as a BULLET: the hanging glyph is drawn and the stored "- " is collapsed, not shown as a hyphen`,
      !!m.bullet && /•/.test(m.bullet.glyph) && m.bullet.marks.every((c) => /md-mark-hidden/.test(c)), JSON.stringify(m.bullet));
    ok(`${tag} a quote line renders with a rule and its "> " collapsed`, !!m.quote && m.quote.bw === '3px' && m.quote.it === 'italic', JSON.stringify(m.quote));
    ok(`${tag} a centred line is centred in the column (text midpoint within 8px of the column midpoint)`,
      !!m.center && m.center.ta === 'center' && Math.abs(m.center.mid - m.center.colMid) < 8, JSON.stringify(m.center));
    ok(`${tag} a right-aligned line ends at the column's right edge (within 8px)`, !!m.right && m.right.ta === 'right' && Math.abs(m.right.gap) < 8, JSON.stringify(m.right));
    ok(`${tag} no directive marker is left visible as literal text ("- ", "> ", ">< ", ">> ")`, m.rawMarkersVisible === 0, String(m.rawMarkersVisible));
    ok(`${tag} STORAGE INVARIANT: the editor's text is the stored text byte for byte, markers included`, m.editorText === FIX, JSON.stringify({ got: m.editorText.slice(0, 80) }));
    ok(`${tag} the wrappers add NO blank line: consecutive bullet lines sit one plain-line step apart`,
      m.bulletStep !== null && m.plainStep !== null && Math.abs(m.bulletStep - m.plainStep) < 3,
      JSON.stringify({ bulletStep: m.bulletStep, plainStep: m.plainStep }));
    if (mode === 'Free Write') ok('[Free Write] still forward-only: the runs are the same `.fo-run` spans (rendering changed, the mechanic did not)', m.hasFoRun);

    if (mode === 'Draft') {
      // reveal: a real click into the bullet line un-collapses its prefix, and the glyph gives way to the literal hyphen
      const pt = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bullet'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + 2), y: Math.round(r.top + r.height / 2) }; })()`);
      if (pt) await realClick(app, pt);
      const rv = await app.evalJs(`(() => { const b = document.querySelector('${ED} .md-bullet'); return b ? { revealed: b.classList.contains('md-revealed'), glyph: getComputedStyle(b, '::before').content, mark: b.querySelector('.md-mark').className } : null; })()`);
      ok('[Draft] a real click at the START of a bullet line (where its prefix is) reveals its "- " (the writer can reach and delete it), and the glyph steps aside', !!rv && rv.revealed && rv.glyph === 'none' && !/hidden/.test(rv.mark), JSON.stringify(rv));
      ok('[Draft] the reveal did not touch the stored text', (await stored(app)) === FIX);
    }
  }

  // Free Write still WRITES: type a word at the end through real keys and read the stored text after the debounces settle.
  await open(app, 'Free Write');
  const pt = await centre(app, ED);
  if (pt) await realClick(app, { x: pt.x, y: pt.y });
  await app.typeKeys(' more');
  await sleep(3200);
  const after = await stored(app);
  ok('[Free Write] typing still appends to the stored text after the decorated render (the runway is intact)', typeof after === 'string' && after.startsWith(FIX) && /more/.test(after.slice(FIX.length)), JSON.stringify(after && after.slice(-30)));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
// The runner reads a "VERIFY: PASS|FAIL" verdict line; a count alone is NOVERDICT (the stack pair's first run said so).
console.log(passed === checks.length ? `\nWRITING-R1 VERIFY: PASS (${checks.length} checks)` : `\nWRITING-R1 VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
