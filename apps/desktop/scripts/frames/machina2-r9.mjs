// MACHINA v2 MOCKUP, ROUND r9 - as named screens for INK's frames job (-f themes=machina -f screens_file=apps/desktop/scripts/frames/machina2-r9.mjs).
// Source: the Wrizors' review of r8 (wrizors-to-ARBOR-nov4.md md5 d1c1dcc2, via Fable, Nov 4): the Theme pop-out's row reads "Room: Light ·
// Dark · Automatic", directly under Page, with a "?" ("the space around the page; Automatic = light by day, dark by night") - the Room words
// themselves are proven by m2r8-theme-lighting's successor (machina2-r8.mjs); polish: a hairline tick before the readout's "?"; one new-page
// frame at 11 pt. The kit's verdict guard reds a crash or a silent check. Written red-first: run against r8 rebased before the r9 build.
// Seeds go through window.wrizo*.
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.';
const ROOM_HELP = 'the space around the page; Automatic = light by day, dark by night';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R9 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R9-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()";
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?machina2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-machina2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
};
const page = async (app, id, mode) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1000);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1000); }
  await app.evalJs(`document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges()`);
};
const openTheme = async (app) => { await app.evalJs("(() => { const b = document.querySelector(\".wz-strip-item[data-category='theme']\"); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); return !!b; })()"); await sleep(700); };

const SCREENS = {
  // ── THE ROOM ROW'S "?": on the row (after the choices, not one of them), guidance blue like the readout's "?", and it opens its line
  'm2r9-room-help': async (app) => {
    await page(app, 'm2r9-help'); await openTheme(app);
    const READ = `(() => { const row = [...document.querySelectorAll('.wz-theme-picker .mode-crow')].find((r) => r.querySelector(':scope > span')?.textContent.trim() === 'Room'); if (!row) return null;
      const q = [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '?'); const note = document.querySelector('.wz-theme-picker [role="note"]');
      return { q: !!q, inSeg: !!(q && q.closest('.mode-seg')), border: q ? getComputedStyle(q).borderTopColor : null, label: q ? q.getAttribute('aria-label') : null, note: note ? note.textContent.trim() : null }; })()`;
    const a = await app.evalJs(READ);
    await app.evalJs("(() => { const row = [...document.querySelectorAll('.wz-theme-picker .mode-crow')].find((r) => r.querySelector(':scope > span')?.textContent.trim() === 'Room'); const q = row && [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '?'); if (q) q.click(); return !!q; })()"); await sleep(300);
    const b = await app.evalJs(READ);
    const guide = await app.evalJs("(() => { const s = document.createElement('span'); s.style.color = 'var(--machina2-guide-mark, #7FA0BC)'; document.body.appendChild(s); const c = getComputedStyle(s).color; s.remove(); return c; })()");
    const ok = { onTheRow: !!a && a.q && !a.inSeg, guidance: !!a && a.border === guide, itsLine: !!b && b.note === ROOM_HELP };
    const brief = { ok, a, b, guide };
    if (Object.values(ok).some((x) => !x)) fail('M2R9-ROOM-HELP', brief);
    say('m2r9-room-help', brief);
  },
  // ── THE READOUT: a hairline tick stands right before its "?" (as between its fields)
  'm2r9-readout-tick': async (app) => {
    await page(app, 'm2r9-tick');
    const s = await app.evalJs(`(() => { const q = document.querySelector('.machina2-readout .machina2-readout-help'); if (!q) return null; const prev = q.previousElementSibling; const r = prev ? prev.getBoundingClientRect() : null; const qr = q.getBoundingClientRect();
      const field = document.querySelector('.machina2-readout .machina2-tick'); const fr = field ? getComputedStyle(field) : null;
      return { prev: prev ? String(prev.className) : null, w: r ? r.width : null, h: r ? r.height : null, gap: r ? qr.left - r.right : null, fieldTick: fr ? [fr.width, fr.height, fr.backgroundColor] : null, tick: prev ? [getComputedStyle(prev).width, getComputedStyle(prev).height, getComputedStyle(prev).backgroundColor] : null }; })()`);
    const ok = { tickBeforeQ: !!s && /machina2-tick/.test(s.prev || '') && s.w > 0 && s.w <= 2 && s.h >= 6, sameAsFields: !!s && !!s.fieldTick && JSON.stringify(s.tick) === JSON.stringify(s.fieldTick) };
    const brief = { ok, s };
    if (Object.values(ok).some((x) => !x)) fail('M2R9-READOUT-TICK', brief);
    say('m2r9-readout-tick', brief);
  },
  // ── PICTURES: the Theme pop-out (with its "?" open), a new page at 11 pt (the Write door, then the Tools drawer)
  'm2r9-pic-theme': async (app) => { await page(app, 'm2r9-pic-t'); await openTheme(app); await app.evalJs("(() => { const row = [...document.querySelectorAll('.wz-theme-picker .mode-crow')].find((r) => r.querySelector(':scope > span')?.textContent.trim() === 'Room'); const q = row && [...row.querySelectorAll('button')].find((b) => b.textContent.trim() === '?'); if (q) q.click(); return !!q; })()"); await sleep(400); },
  'm2r9-pic-new-page': async (app) => {
    await load(app, '#/'); await sleep(600);
    await app.evalJs("document.querySelector('.wz-arrival-write')?.click()");
    await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'the new page', timeout: 8000 }); await sleep(900);
    await app.evalJs(`document.querySelector('${ED}')?.focus()`); await app.type('A new page, at eleven points.'); await sleep(1200);
    await clickText(app, '.desk-mode-tab', 'Build'); await sleep(900);
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(800);
  },
};

export default guarded(SCREENS, { verdict: ['MACHINA2-R9'] });
