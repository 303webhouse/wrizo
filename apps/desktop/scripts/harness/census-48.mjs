// CENSUS #48 (INK, Nov 6): leaving the Typewriter moves the scroll 0 -> 79 (a law-1 question), every theme.
// On the live build, in each theme: a long page in Draft, the caret and the view at the head (scroll 0). Into Free Write (the Typewriter), then back to Draft.
// STILL THERE: the Draft view came back more than 2 px from where it was. GONE: within 2 px, in every theme.
// CAN'T TELL: the page cannot scroll, the view was not at 0 before, Free Write did not zoom, or Draft did not unzoom.
import { census, sleep, GONE, THERE, CANT, prose } from './census/lib.mjs';

const VIEW = "(() => { const sc = document.querySelector('.desk-frame-stage .mode-scroll'), col = document.querySelector('.desk-frame-stage .mode-pagecol'); return sc ? { top: Math.round(sc.scrollTop), room: sc.scrollHeight - sc.clientHeight, zoom: col ? col.getAttribute('data-zoom') : null } : null; })()";
const HOME = { key: 'Home', code: 'Home', windowsVirtualKeyCode: 36, nativeVirtualKeyCode: 36, modifiers: 2, commands: ['moveToBeginningOfDocument'] };
const tab = (k) => `.desk-mode-tab[data-mode-key="${k}"]`;

await census('48', async ({ app, q, shot, press, openPage, waitSoft }) => {
  const rows = [];
  for (const theme of ['plateau', 'machina', 'flux']) {
    const id = await openPage({ theme, mode: 'drafting', text: prose(80) });
    if (!id) { rows.push({ theme, state: 'blind', note: 'the page did not open' }); continue; }
    await q("document.querySelector('.forward-only-editor').focus(); true");
    await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...HOME });
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...HOME });
    await sleep(300);
    await q("(() => { const sc = document.querySelector('.desk-frame-stage .mode-scroll'); if (sc) sc.scrollTop = 0; return true; })()");
    await sleep(900);
    const before = await q(VIEW);
    const inFw = await press(tab('freewrite'));
    const zoomed = inFw && await waitSoft("document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') === 'true'", { timeout: 5000, label: 'Free Write zoomed' });
    await sleep(1400);
    const during = await q(VIEW);
    const inDr = await press(tab('draft'));
    const left = inDr && await waitSoft("document.querySelector('.desk-frame-stage .mode-pagecol')?.getAttribute('data-zoom') !== 'true'", { timeout: 5000, label: 'Draft unzoomed' });
    await sleep(1600);   // the mode switch's own re-persist lands about 1.1 s after it
    const after = await q(VIEW);
    await shot(theme);
    const premise = !!before && !!after && before.room > 200 && before.top === 0 && before.zoom !== 'true' && zoomed && left;
    rows.push({ theme, state: !premise ? 'blind' : Math.abs(after.top - before.top) <= 2 ? 'gone' : 'there', before, during, after, zoomed, left });
  }
  const there = rows.filter((r) => r.state === 'there'), blind = rows.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `the view moved on leaving the Typewriter: ${there.map((r) => `${r.theme} ${r.before.top} -> ${r.after.top}`).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => r.theme).join(', ')}` : 'the Draft view came back to scroll 0 in every theme',
    readings: rows,
  };
});
