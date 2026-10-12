// TYPEWRITER UNDER THE SPLASH - a MEASUREMENT, not a check (Fable, 2026-10-12: "does typing while the splash is up (5s,
// unskippable) break the typewriter's scroll for a real writer (resume-into-page)? Measure it; don't guess.")
// A  control  - the splash is gone before the page opens; the writer types at the end of a 30-line page.
// B  resume   - the app boots straight onto the page (#/page/<id>, as a writer resuming does) and the writer types WHILE the splash
//               is up (asserted present at the keystroke); read under the splash, and again 1.5s after it is gone.
// C  carry on - in B's session, after the splash, the writer keeps typing; read again.
// Each reading: data-scrolled, scrollTop/scrollHeight/clientHeight, the start offset, the topmost visible line's y and fade alpha,
// the line count, order inversions, and the stored text (did every typed character land?). Paths resolve from this file.
// Run on a granted box turn:  node apps/desktop/scripts/typewriter-splash-probe.mjs   (dist-web built). Prints JSON rows.
import { withHarness } from './runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const LINES = Array.from({ length: 30 }, (_, i) => `Line ${String(i + 1).padStart(2, '0')} of the history that rides up into the page.`).join('\n');
const READ = `(() => {
  const scroll = document.querySelector('.mode-scroll'); const ed = document.querySelector('${ED}');
  if (!scroll || !ed) return { missing: true, splash: !!document.querySelector('.wz-splash') };
  const cs = getComputedStyle(scroll); const mask = cs.webkitMaskImage || cs.maskImage || ''; const box = scroll.getBoundingClientRect();
  const px = (t) => { t = t.trim(); const c = t.match(/^calc\\((.*)\\)$/); if (c) return c[1].split('+').reduce((a, p) => a + parseFloat(p), 0); return parseFloat(t); };
  const inner = (mask.match(/linear-gradient\\((.*)\\)\\s*$/) || [])[1] || ''; const parts = []; let d = 0, cur = '';
  for (const ch of inner) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { parts.push(cur.trim()); cur = ''; } else cur += ch; }
  if (cur.trim()) parts.push(cur.trim());
  const stops = []; for (const p of parts) { const col = p.match(/^(rgba?\\([^)]*\\)|#[0-9a-f]+)\\s*(.*)$/i); if (!col) continue;
    const nums = (col[1].match(/[\\d.]+/g) || []).map(Number); stops.push({ alpha: col[1].startsWith('rgba') ? nums[3] : 1, at: px(col[2] || '0px') }); }
  const alphaAt = (y) => { if (!stops.length) return 1; if (y <= stops[0].at) return stops[0].alpha;
    for (let i = 1; i < stops.length; i++) { const a = stops[i - 1], b = stops[i]; if (y <= b.at) return b.at === a.at ? b.alpha : a.alpha + (b.alpha - a.alpha) * ((y - a.at) / (b.at - a.at)); }
    return stops[stops.length - 1].alpha; };
  const r = document.createRange(); r.selectNodeContents(ed); const tops = [];
  for (const rc of r.getClientRects()) { if (rc.height < 4 || rc.bottom <= box.top || rc.top >= box.bottom) continue; const mid = Math.round((rc.top + rc.bottom) / 2); if (!tops.some((t) => Math.abs(t - mid) < 4)) tops.push(mid); }
  tops.sort((a, b) => a - b);
  const lines = tops.map((mid) => ({ y: Math.round(mid - box.top), alpha: Math.round(alphaAt(mid - box.top) * 1000) / 1000 }));
  let inversions = 0; for (let i = 1; i < lines.length; i++) if (lines[i].alpha < lines[i - 1].alpha - 0.01) inversions++;
  return { splash: !!document.querySelector('.wz-splash'), scrolled: scroll.dataset.scrolled, typewriter: scroll.dataset.typewriter,
    scrollTop: Math.round(scroll.scrollTop), scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight,
    startOffset: cs.getPropertyValue('--tw-start-offset').trim(), lineCount: lines.length, top: lines[0] || null, last: lines[lines.length - 1] || null,
    inversions, focused: !!document.activeElement && (document.activeElement === ed || ed.contains(document.activeElement)) };
})()`;
const stored = (app) => app.evalJs("(JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').find(e => e.id === 'twf') || {}).text || ''");
const caretEnd = (app) => app.evalJs(`(() => { const ed = document.querySelector('${ED}'); if (!ed) return false; ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
  const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
const rows = [];
const row = async (app, scenario, moment) => { const m = await app.evalJs(READ); rows.push({ scenario, moment, ...m }); console.log(JSON.stringify({ scenario, moment, ...m })); };

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  // A - control
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (A)', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(400);
  await app.evalJs("location.hash = '#/page/twf'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page (A)' });
  await sleep(600);
  await caretEnd(app);
  await app.typeKeys(' and on');
  await sleep(1500);
  await row(app, 'A control', 'typed after the splash');

  // B - resume into the page: boot straight onto it, type under the splash
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1')");
  await app.reload();
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (B seed)', timeout: 15000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'twf', text: LINES, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/twf'");
  await app.reload();                       // a fresh boot ON the page: the splash runs over it
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'page under the splash', timeout: 15000 });
  const splashAtType = await app.evalJs("!!document.querySelector('.wz-splash')");
  await caretEnd(app);
  await app.typeKeys(' under the splash');
  await sleep(300);
  await row(app, 'B resume', `typed UNDER the splash (splash at keystroke: ${splashAtType})`);
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone (B)', timeout: 15000 }); } catch { /* recorded */ }
  await sleep(1500);
  await row(app, 'B resume', '1.5s after the splash left');
  const textB = await stored(app);

  // C - the writer carries on after the splash
  await caretEnd(app);
  await app.typeKeys(' and after it');
  // ---- SUPERSEDED (Fable, 2026-10-12: the 1f78f860 run read everyCharAfter:false). The page's own save is DEBOUNCED
  // (PageEditor AUTOSAVE_MS = 2000, then the store's 300ms flush), so a read 1.5s after the keystrokes can see the old text with
  // nothing lost. Kept verbatim, no longer run; the reads below separate "not saved YET" from "lost":
  //   await sleep(1500);
  //   await row(app, 'C carry on', 'typed after the splash, same session');
  //   const textC = await stored(app);
  // ------------------------------------------------------------------
  // 1. did the keystrokes reach the PAGE? (the editor's own text, read at once - no debounce sits between typing and the DOM)
  const domC = await app.evalJs(`(document.querySelector('${ED}')?.textContent || '').replace(/\\u200b/g, '')`);
  const onPage = domC.includes(' under the splash and after it');
  // 2. when do they reach STORAGE? poll every 100ms for up to 8s and record the time it took
  const t0 = Date.now();
  let textC = await stored(app), msToStore = null;
  while (Date.now() - t0 < 8000) {
    if (textC.endsWith(' under the splash and after it')) { msToStore = Date.now() - t0; break; }
    await sleep(100);
    textC = await stored(app);
  }
  await row(app, 'C carry on', 'typed after the splash, same session (read once the text was stored, or at 8s)');
  const tail = (t) => t.slice(-60);
  console.log(JSON.stringify({ storedTailB: tail(textB), everyCharUnderSplash: textB.endsWith(' under the splash'),
    domTailC: tail(domC), onPageAfter: onPage, storedTailC: tail(textC), everyCharAfter: textC.endsWith(' under the splash and after it'), msToStoreAfter: msToStore }));
  console.log(`C VERDICT ON INPUT: ${!onPage ? 'LOST BEFORE THE PAGE - the keystrokes never reached the editor' : msToStore == null ? 'LOST BEFORE STORAGE - on the page but not stored within 8s' : `NOT LOST - on the page at once, stored after ${msToStore}ms (the save debounce)`}`);
  console.log(`\nTYPEWRITER SPLASH PROBE: ${rows.length} readings (a measurement; no verdict)`);
});
