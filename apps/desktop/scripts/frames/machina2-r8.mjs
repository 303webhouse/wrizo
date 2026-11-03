// MACHINA v2 MOCKUP, ROUND r8 - as named screens for INK's frames job (-f themes=machina -f screens_file=apps/desktop/scripts/frames/machina2-r8.mjs).
// Source: Fable, Nov 2, after Nick tested: 1. rebase onto current main (done: machina/mockup-r8); 2. the room's control right beside Page in the
// Themes menu (Machina's words: Lighting ▸ Automatic · Day · Night; it stays in the mockup panel too); 3. the font-size box between - and +
// (whole numbers 6-72; Enter or blur applies; a bad value reverts; default 11; the same scope as -/+); 4. the tabs unchanged. The checks live in
// mockup-kit.mjs (shared with the Arbor mockup). Each THROWS with its numbers when it fails ("MACHINA2-R8 <screen> {...}"). Written red-first:
// run against r7 rebased (94ff94d7) before the r8 build. Seeds go through window.wrizo*.
import { themeRoomCheck, sizeBoxCheck } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The quarterly figures show a steady rise in exports. The tariff change explains part of it, but not all.\nThe second paragraph names the evidence: shipping records for March and April.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`MACHINA2-R8 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`MACHINA2-R8-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
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

export default {
  // ── LIGHTING BESIDE PAGE in the Themes menu: Machina's words, Day / Night / Automatic move the room at once, the panel's row agrees
  'm2r8-theme-lighting': async (app) => {
    await page(app, 'm2r8-room');
    await themeRoomCheck(app, { name: 'M2R8-THEME-LIGHTING', say, fail, label: 'Lighting', words: [['clock', 'Automatic'], ['light', 'Day'], ['dark', 'Night']],
      roomAttr: 'data-machina2-room', roomOf: { light: 'light', dark: 'dark' }, otherRow: '.machina2-bar [role="group"][aria-label="Lighting"]' });
  },
  // ── THE SIZE BOX between - and +: on the opening page's strip (it had none) and in Build's drawer, where highlighted words size alone
  'm2r8-size-sprint': async (app) => { await page(app, 'm2r8-size-sp', null); await sizeBoxCheck(app, { name: 'M2R8-SIZE-SPRINT', say, fail }); },
  'm2r8-size-build': async (app) => { await page(app, 'm2r8-size-b', 'Build'); await sizeBoxCheck(app, { name: 'M2R8-SIZE-BUILD', say, fail, selection: true }); },
  // ── PICTURES for the Wrizors
  'm2r8-pic-themes': async (app) => { await page(app, 'm2r8-pic'); await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(800); },
  'm2r8-pic-size-build': async (app) => { await page(app, 'm2r8-pic-b', 'Build'); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); },
};
