// CENSUS #42 (Nick, Nov 2): the Room (light/dark room) control must sit beside Page in the Themes menu; he could not find light mode. "With each redesign."
// On the live build, Arbor and Machina (the two redesigns that are live): open the Themes panel from the rail, read its rows.
// GONE: a visible Room row with its choices follows the Page row directly, in both. STILL THERE: the panel opened and the Room row is missing or not next to Page.
// CAN'T TELL: the panel did not open, or no Page row. Flux's redesign is not live: read and reported, not counted.
import { census, sleep, GONE, THERE, CANT } from './census/lib.mjs';

const ROWS = `(() => { const f = document.querySelector('.wz-theme-picker-field'); if (!f) return null;
  const rows = [...f.children].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((e) => { const r = e.getBoundingClientRect(); return { word: (e.querySelector('span')?.textContent || e.textContent || '').trim().split(/\\s+/)[0], text: (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60), t: Math.round(r.top), b: Math.round(r.bottom), buttons: e.querySelectorAll('button').length }; });
  return rows; })()`;

await census('42', async ({ q, shot, press, openPage, waitSoft }) => {
  const rows = [];
  for (const theme of ['plateau', 'machina', 'flux']) {
    const id = await openPage({ theme, text: 'A few words on the page.' });
    if (!id) { rows.push({ theme, state: 'blind', note: 'the page did not open' }); continue; }
    const pressed = await press(".wz-strip-item[data-category='theme']");
    const open = pressed && await waitSoft("!!document.querySelector('.wz-theme-picker-field')", { timeout: 4000, label: 'the Themes panel' });
    await sleep(500);
    if (!open) { rows.push({ theme, state: 'blind', note: 'the Themes panel did not open', pressed }); continue; }
    const list = await q(ROWS);
    await shot(theme);
    const iPage = list ? list.findIndex((r) => r.word === 'Page') : -1, next = iPage >= 0 ? list[iPage + 1] : null;
    const beside = !!next && next.word === 'Room' && next.buttons >= 2 && next.t - list[iPage].b <= 24;
    rows.push({ theme, state: iPage < 0 ? 'blind' : beside ? 'gone' : 'there', rows: list });
  }
  const counted = rows.filter((r) => r.theme !== 'flux');
  const there = counted.filter((r) => r.state === 'there'), blind = counted.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `no Room row directly after Page in: ${there.map((r) => r.theme).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => r.theme).join(', ')}` : 'the Room row follows the Page row directly in Arbor and Machina',
    readings: rows,
  };
});
