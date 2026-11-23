// CENSUS #48, in Fable's wording of Nov 22, 9:35 am: "on leaving Free Write, the line she was writing stays in view. A jump to the top that loses it on a long page is the bug; a short page that fits may show its top."
// On the live build, in each theme: a long page (80 lines) open in Free Write, its last line (where she was writing) in view; the pointer brings the chrome back; the Draft tab.
// STILL THERE: after the Draft tab the last line is outside the scroller on a long page. GONE: it is inside, in every theme.
// A short page (6 lines) is read and reported, not counted. CAN'T TELL: Free Write did not zoom, Draft did not unzoom, or the line was not in view before leaving.
import { census, sleep, GONE, THERE, CANT, prose } from './census/lib.mjs';

const READ = `(() => { const sc = document.querySelector('.desk-frame-stage .mode-scroll'), ed = document.querySelector('.forward-only-editor'), col = document.querySelector('.desk-frame-stage .mode-pagecol'); if (!sc || !ed) return null;
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, last = null; while ((n = w.nextNode())) { if (n.nodeValue.trim().length) last = n; } let line = null;
  if (last) { const r = document.createRange(); r.setStart(last, Math.max(0, last.nodeValue.length - 1)); r.setEnd(last, last.nodeValue.length); const g = r.getBoundingClientRect(); line = { top: Math.round(g.top), bottom: Math.round(g.bottom) }; }
  const b = sc.getBoundingClientRect(); const clip = [Math.max(Math.round(b.top), 0), Math.min(Math.round(b.bottom), innerHeight)];
  return { top: Math.round(sc.scrollTop), max: sc.scrollHeight - sc.clientHeight, zoom: col ? col.getAttribute('data-zoom') : null, clip, line, inView: !!line && line.top >= clip[0] - 1 && line.bottom <= clip[1] + 1 }; })()`;
const tab = (k) => `.desk-mode-tab[data-mode-key="${k}"]`;

await census('48', async ({ q, shot, press, openPage, waitSoft, wake }) => {
  const rows = [];
  for (const theme of ['plateau', 'machina', 'flux']) for (const [kind, lines] of [['long', 80], ['short', 6]]) {
    const name = `${theme}-${kind}`;
    const id = await openPage({ theme, mode: 'journal', text: prose(lines) });
    if (!id) { rows.push({ name, kind, state: 'blind', note: 'the page did not open' }); continue; }
    await sleep(1200);
    const fw = await q(READ);
    await wake();
    const pressed = await press(tab('draft'));
    const left = pressed && await waitSoft("document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') !== 'true'", { timeout: 5000, label: 'Draft unzoomed' });
    await sleep(1600);   // the mode switch's own re-persist lands about 1.1 s after it
    const dr = await q(READ);
    await shot(name);
    const premise = !!fw && !!dr && fw.zoom === 'true' && fw.inView && left;
    rows.push({ name, kind, state: !premise ? 'blind' : dr.inView ? 'gone' : 'there', pressed, left, freeWrite: fw, draft: dr });
  }
  const counted = rows.filter((r) => r.kind === 'long');
  const there = counted.filter((r) => r.state === 'there'), blind = counted.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `the line she was writing left the view on: ${there.map((r) => r.name).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => r.name).join(', ')}` : 'on a long page the line she was writing stays in view after the Draft tab, in every theme',
    readings: rows,
  };
});
