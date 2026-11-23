// CENSUS #36 (ARBOR, Oct 31): with the room different from the page, the Typewriter's zoomed page fades into the ROOM and reads as a band. The fade must go to the page's own colour.
// On the live build, in each theme, a long Free Write page in the Page tone that differs from the room, zoomed. Read from the drawn pixels, in the paper's own margin (no text):
//   P  the paper at the writing line, T  the paper near the top of the column (where the fade has done its work), R  the room just outside the paper at T's height.
// A case counts only if the page really is in the asked tone (a room that forces the tone, or Flux's Jacked In, leaves nothing to compare: "n/a").
//   an opaque paper: STILL THERE if T has left P by more than 12 levels toward the room; gone if T stays within 12 of P
//   no paper while zoomed (its background is transparent, the words stand on the room): gone if P and R are within 12 levels, so no band edge is drawn
// GONE needs a counted, gone case in both Arbor and Machina. CAN'T TELL: a counted case that could not be read, or a theme with no counted case.
import { census, sleep, dist, GONE, THERE, CANT, prose } from './census/lib.mjs';

const GEOM = `(() => { const col = document.querySelector('.desk-frame-stage .mode-pagecol'), pg = document.querySelector('.desk-frame-stage .mode-page'), st = document.querySelector('.desk-frame-stage'); if (!col || !pg || !st) return null;
  const c = col.getBoundingClientRect(), p = pg.getBoundingClientRect(), s = st.getBoundingClientRect(), root = document.documentElement, bg = getComputedStyle(pg).backgroundColor, a = /rgba\\([^)]*,\\s*([\\d.]+)\\)/.exec(bg);
  return { zoom: col.getAttribute('data-zoom'), col: { t: c.top, b: c.bottom, l: c.left, r: c.right }, page: { t: p.top, b: p.bottom, l: p.left, r: p.right }, stage: { t: s.top, b: s.bottom, l: s.left, r: s.right }, paper: bg, paperAlpha: bg === 'transparent' ? 0 : a ? Number(a[1]) : 1, dataPage: root.getAttribute('data-page'), dataRoom: root.getAttribute('data-room'), arborRoom: root.getAttribute('data-arbor2-room') }; })()`;

const CASES = [
  { theme: 'plateau', room: 'dark', tone: 'light' },
  { theme: 'plateau', room: 'light', tone: 'dark' },
  { theme: 'machina', room: 'dark', tone: 'light' },
  { theme: 'machina', room: 'light', tone: 'dark' },
  { theme: 'flux', room: null, tone: 'light' },
];

await census('36', async ({ q, shot, patches, openPage, app }) => {
  const rows = [];
  for (const c of CASES) {
    const name = `${c.theme}-room-${c.room || 'own'}-page-${c.tone}`;
    const id = await openPage({ theme: c.theme, tone: c.tone, room: c.room, mode: 'journal', text: prose(70) });
    if (!id) { rows.push({ name, theme: c.theme, state: 'blind', note: 'the page did not open' }); continue; }
    await app.mouseMove(6, 400); await sleep(1500);
    const g = await q(GEOM);
    if (!g || g.zoom !== 'true') { rows.push({ name, theme: c.theme, state: 'blind', note: 'not zoomed', g }); continue; }
    const b64 = await shot(name);
    if (g.dataPage !== c.tone) { rows.push({ name, theme: c.theme, state: 'n/a', note: `the page is drawn ${g.dataPage}, not the asked ${c.tone}`, dataPage: g.dataPage, paper: g.paper }); continue; }
    const x = g.page.l + 14, yT = Math.max(g.col.t, g.stage.t) + 10, yP = (Math.max(g.col.t, g.stage.t) + Math.min(g.col.b, g.stage.b)) / 2, xR = g.page.l - 14;
    if (!(g.page.t < yT && g.page.b > yP && xR > g.stage.l + 2)) { rows.push({ name, theme: c.theme, state: 'blind', note: 'the paper does not cover both points', g }); continue; }
    const [T, P, R] = await patches(b64, [{ x, y: yT }, { x, y: yP }, { x: xR, y: yT }]);
    const apart = dist(P, R), off = dist(T, P), nearRoom = dist(T, R);
    const noPaper = g.paperAlpha === 0;
    const state = noPaper ? (apart <= 12 ? 'gone' : 'there') : apart < 30 ? 'blind' : off <= 12 ? 'gone' : nearRoom < off ? 'there' : 'blind';
    rows.push({ name, theme: c.theme, state, noPaper, paper: g.paper, T, P, R, apart, off, nearRoom, dataPage: g.dataPage, arborRoom: g.arborRoom });
  }
  const counted = rows.filter((r) => r.state !== 'n/a');
  const there = counted.filter((r) => r.state === 'there'), blind = counted.filter((r) => r.state === 'blind');
  const both = ['plateau', 'machina'].every((t) => counted.some((r) => r.theme === t && r.state === 'gone'));
  return {
    result: there.length ? THERE : blind.length || !both ? CANT : GONE,
    why: there.length ? `the page fades to the room in: ${there.map((r) => r.name).join(', ')}` : blind.length ? `could not read: ${blind.map((r) => r.name).join(', ')}` : !both ? 'Arbor or Machina has no counted case' : `no band in: ${counted.map((r) => `${r.name}${r.noPaper ? ' (no paper while zoomed)' : ''}`).join(', ')}`,
    readings: rows,
  };
});
