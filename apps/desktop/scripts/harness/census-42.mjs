// CENSUS #42 (Nick, Nov 2): the Room (light/dark room) control must sit beside Page in the Themes menu; he could not find light mode. "With each redesign."
// On the live build, Arbor by night (by day its room forces the page, so the Page row is not offered: read and reported) and Machina: open the Themes panel from the rail, read its rows.
// GONE: a visible Room row with its choices follows the Page row directly, in both. STILL THERE: the panel opened and the Room row is missing or not next to Page.
// CAN'T TELL: the panel did not open, or no Page row. Flux's redesign is not live: read and reported, not counted.
import { census, sleep, GONE, THERE, CANT } from './census/lib.mjs';

const ROWS = `(() => { const f = document.querySelector('.wz-theme-picker-field'); if (!f) return null;
  const rows = [...f.children].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map((e) => { const r = e.getBoundingClientRect(); return { word: (e.querySelector('span')?.textContent || e.textContent || '').trim().split(/\\s+/)[0], text: (e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 60), t: Math.round(r.top), b: Math.round(r.bottom), buttons: e.querySelectorAll('button').length }; });
  return rows; })()`;
const CASES = [
  { name: 'arbor-night', theme: 'plateau', room: 'dark', counted: true },
  { name: 'arbor-day', theme: 'plateau', room: 'light', counted: false },
  { name: 'machina', theme: 'machina', room: 'dark', counted: true },
  { name: 'flux', theme: 'flux', room: null, counted: false },
];

await census('42', async ({ q, shot, press, openPage, waitSoft, wake }) => {
  const rows = [];
  for (const c of CASES) {
    const id = await openPage({ theme: c.theme, room: c.room, mode: 'drafting', text: 'A few words on the page.' });
    if (!id) { rows.push({ ...c, state: 'blind', note: 'the page did not open' }); continue; }
    await wake();
    const pressed = await press(".wz-strip-item[data-category='theme']");
    const open = pressed && await waitSoft("!!document.querySelector('.wz-theme-picker-field')", { timeout: 4000, label: 'the Themes panel' });
    await sleep(500);
    if (!open) { rows.push({ ...c, state: 'blind', note: 'the Themes panel did not open', pressed }); continue; }
    const list = await q(ROWS);
    await shot(c.name);
    const iPage = list ? list.findIndex((r) => r.word === 'Page') : -1, next = iPage >= 0 ? list[iPage + 1] : null;
    const beside = !!next && next.word === 'Room' && next.buttons >= 2 && next.t - list[iPage].b <= 24;
    rows.push({ ...c, state: iPage < 0 ? 'blind' : beside ? 'gone' : 'there', rows: list });
  }
  const counted = rows.filter((r) => r.counted);
  const there = counted.filter((r) => r.state === 'there'), blind = counted.filter((r) => r.state === 'blind');
  return {
    result: there.length ? THERE : blind.length ? CANT : GONE,
    why: there.length ? `no Room row directly after Page in: ${there.map((r) => r.name).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => r.name).join(', ')}` : 'the Room row follows the Page row directly in Arbor (night) and Machina',
    readings: rows,
  };
});
