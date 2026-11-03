// ARBOR v2 MOCKUP, ROUND r17 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r17.mjs).
// Source: Fable, Nov 2, after Nick tested r16: 1. rebase onto current main (done: arbor/mockup-r17; Sprout was deleted from live in #12j); 2. the
// Room control right beside Page in the Themes menu (it stays in Mood too); 3. the font-size box between - and + (whole numbers 6-72; Enter or
// blur applies; a bad value reverts; default 11; the same scope as -/+); 4. the tabs unchanged. The checks live in mockup-kit.mjs (shared with
// the Machina mockup). Each THROWS with its numbers when it fails ("ARBOR-R17 <screen> {...}"). Written red-first: run against r16 rebased
// (6bbe5c91) before the r17 build. Seeds go through window.wrizo*.
import { themeRoomCheck, sizeBoxCheck } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R17 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R17-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
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
const openMood = (app) => app.evalJs("(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); return true; })()");

export default {
  // ── THE ROOM BESIDE PAGE in the Themes menu: Arbor's words, Day / Night / By the clock move the room at once, the Mood menu's row agrees
  'r17-theme-room': async (app) => {
    await page(app, 'arbor-r17-room');
    await openMood(app); await sleep(300);
    await themeRoomCheck(app, { name: 'R17-THEME-ROOM', say, fail, label: 'Room', words: [['clock', 'By the clock'], ['day', 'Day'], ['night', 'Night']],
      roomAttr: 'data-arbor2-room', roomOf: { day: 'day', night: 'night' }, otherRow: '.arbor2-room-row' });
  },
  // ── THE SIZE BOX between - and +: on Free Write's strip (it had none) and in Draft's drawer, where highlighted words size alone
  'r17-size-freewrite': async (app) => { await page(app, 'arbor-r17-size-fw', null); await sizeBoxCheck(app, { name: 'R17-SIZE-FREEWRITE', say, fail }); },
  'r17-size-draft': async (app) => { await page(app, 'arbor-r17-size-dr', 'Draft'); await sizeBoxCheck(app, { name: 'R17-SIZE-DRAFT', say, fail, selection: true }); },
  // ── PICTURES for the Wrizors: the Themes menu with the Room row; the Tools drawer's size box on Free Write and in Draft
  'r17-pic-themes': async (app) => { await page(app, 'arbor-r17-pic'); await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(800); },
  'r17-pic-size-freewrite': async (app) => { await page(app, 'arbor-r17-pic-fw', null); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); },
  'r17-pic-size-draft': async (app) => { await page(app, 'arbor-r17-pic-dr', 'Draft'); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); },
};
