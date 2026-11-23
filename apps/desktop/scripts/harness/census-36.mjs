// CENSUS #36 (ARBOR, Oct 31): with the room different from the page, the Typewriter's zoomed page fades into the ROOM and reads as a band. The fade must go to the page's own colour.
// On the live build, in each theme, a long Free Write page in the Page tone that differs from the room, zoomed. Read from the drawn pixels, in the paper's own margin (no text):
//   P  the paper at the writing line, T  the paper near the top of the column (where the fade has done its work), R  the room just outside the paper at T's height.
// STILL THERE: T has left P by more than 12 levels and sits nearer the room than the paper. GONE: T stays within 12 levels of P.
// CAN'T TELL: not zoomed, the paper does not cover both points, or the room and the page are too close to tell apart (under 30 levels).
import { census, sleep, dist, GONE, THERE, CANT, prose } from './census/lib.mjs';

const GEOM = `(() => { const col = document.querySelector('.desk-frame-stage .mode-pagecol'), pg = document.querySelector('.desk-frame-stage .mode-page'), st = document.querySelector('.desk-frame-stage'); if (!col || !pg || !st) return null;
  const c = col.getBoundingClientRect(), p = pg.getBoundingClientRect(), s = st.getBoundingClientRect(), root = document.documentElement;
  return { zoom: col.getAttribute('data-zoom'), col: { t: c.top, b: c.bottom, l: c.left, r: c.right }, page: { t: p.top, b: p.bottom, l: p.left, r: p.right }, stage: { t: s.top, b: s.bottom, l: s.left, r: s.right }, dataPage: root.getAttribute('data-page'), dataRoom: root.getAttribute('data-room'), arborRoom: root.getAttribute('data-arbor2-room'), mask: getComputedStyle(col).maskImage.slice(0, 40) }; })()`;

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
    if (!id) { rows.push({ name, state: 'blind', note: 'the page did not open' }); continue; }
    await app.mouseMove(6, 400); await sleep(1500);
    const g = await q(GEOM);
    if (!g || g.zoom !== 'true') { rows.push({ name, state: 'blind', note: 'not zoomed', g }); continue; }
    const x = g.page.l + 14, yT = Math.max(g.col.t, g.stage.t) + 10, yP = (Math.max(g.col.t, g.stage.t) + Math.min(g.col.b, g.stage.b)) / 2, xR = g.page.l - 14;
    if (!(g.page.t < yT && g.page.b > yP && xR > g.stage.l + 2)) { rows.push({ name, state: 'blind', note: 'the paper does not cover both points', g }); continue; }
    const b64 = await shot(name);
    const [T, P, R] = await patches(b64, [{ x, y: yT }, { x, y: yP }, { x: xR, y: yT }]);
    const apart = dist(P, R), off = dist(T, P), nearRoom = dist(T, R);
    const state = apart < 30 ? 'blind' : off <= 12 ? 'gone' : nearRoom < off ? 'there' : 'blind';
    rows.push({ name, state, T, P, R, apart, off, nearRoom, dataPage: g.dataPage, dataRoom: g.dataRoom, arborRoom: g.arborRoom, mask: g.mask });
  }
  const there = rows.filter((r) => r.state === 'there'), gone = rows.filter((r) => r.state === 'gone');
  return {
    result: there.length ? THERE : gone.length ? GONE : CANT,
    why: there.length ? `the paper fades to the room in: ${there.map((r) => r.name).join(', ')}` : gone.length ? `the paper keeps its colour through the fade in: ${gone.map((r) => r.name).join(', ')}` : 'no case could be measured',
    readings: rows,
  };
});
