// FLUX3 S4b L1 - THE CIRCUIT GROUND ACROSS THE ROOM as named screens for the frames job (-f themes=flux -f screens_file=apps/desktop/scripts/frames/flux3-s4b-l1.mjs
// -f screens=room-page,room-page-typing,room-schema). Both tones come from the job (-f tones=light,dark). Pages are made through the app's seam, never raw storage.
//   room-page:        a Page room in BUILD (Draft): the ground behind the whole room, around the page and the chrome
//   room-current:     a Page room with the current held mid-trace: every drifting point (at most three) placed half way along its trace and paused, so the stills show them
//   room-page-typing: the same, just after a burst of keys (the current is paused: the damping rule)
//   room-schema:      a Schema (board) room: the same ground in the margins of the board's frame
// Each screen prints what it stood on ("FLUX3-S4B-L1-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const seed = async (app, row, mode) => {
  const id = `f3l1-frames-${Date.now()}`;
  await app.evalJs("localStorage.setItem('wrizo-theme', 'flux'); localStorage.setItem('wrizo-ambiance-dial', '50');");
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, createdAt: new Date().toISOString(), ...row })})`);
  await sleep(400);
  await app.evalJs(`${mode ? `localStorage.setItem('wrizo-mode-page-${id}', '${mode}');` : ''} history.replaceState(null, '', '/?flux3=1#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.forward-only-editor') || !!document.querySelector('.board-canvas-wrap')", { label: 'the room', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await app.mouseMove(8, 8);
  await sleep(2200);
  return id;
};
const stood = (app) => app.evalJs("(() => { const b = document.querySelector('[data-flux3-room-ground]'); const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)]; }; return { flag: document.documentElement.hasAttribute('data-flux3'), page: document.documentElement.getAttribute('data-page'), ground: !!b, dots: b ? b.querySelectorAll('i').length : 0, picture: b ? getComputedStyle(b).backgroundImage.length : 0, draws: b ? b.dataset.draws : null, pageRect: r('.mode-page'), host: r('.desk-frame-host') }; })()");

// the drifting points start at different times and are mostly between traces in a still; this puts each half way along its own trace (its animation's time set to delay + half
// its duration) and holds it there, then reports how many are lit. The animations are the page's own; only their clock is set.
const holdCurrent = (app) => app.evalJs("(() => { const b = document.querySelector('[data-flux3-room-ground]'); if (!b) return null; const out = []; b.getAnimations({ subtree: true }).forEach((a) => { const t = a.effect.getComputedTiming(); a.pause(); a.currentTime = (t.delay || 0) + t.duration * 0.5; const e = a.effect.target.getBoundingClientRect(); out.push({ x: Math.round(e.left + e.width / 2), y: Math.round(e.top + e.height / 2), op: +getComputedStyle(a.effect.target).opacity }); }); return { points: out.length, lit: out.filter((p) => p.op > 0.5).length, at: out }; })()");

export default {
  'room-current': async (app) => {
    await seed(app, { text: 'The room behind the page.\nA second line of her text.', origin: 'loose', source: 'page' }, 'drafting');
    const c = await holdCurrent(app);
    await sleep(300);
    console.log(`FLUX3-S4B-L1-FRAME room-current ${JSON.stringify({ ...(await stood(app)), current: c })}`);
  },
  'room-page': async (app) => {
    await seed(app, { text: 'The room behind the page.\nA second line of her text.', origin: 'loose', source: 'page' }, 'drafting');
    console.log(`FLUX3-S4B-L1-FRAME room-page ${JSON.stringify(await stood(app))}`);
  },
  'room-page-typing': async (app) => {
    await seed(app, { text: 'The room behind the page.\nA second line of her text.', origin: 'loose', source: 'page' }, 'drafting');
    await app.evalJs("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); })()");
    for (const ch of ' and she keeps writing') { await app.typeKeys(ch); await sleep(40); }
    console.log(`FLUX3-S4B-L1-FRAME room-page-typing ${JSON.stringify(await stood(app))}`);
  },
  'room-schema': async (app) => {
    await seed(app, { text: 'Schema L1', pageType: 'board', boxes: [{ id: 'b1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'Card A' }, { id: 'b2', kind: 'text', x: 0.5, y: 0.3, w: 0.2, h: 0.1, z: 2, text: 'Card B' }], origin: null, source: null });
    console.log(`FLUX3-S4B-L1-FRAME room-schema ${JSON.stringify(await stood(app))}`);
  },
};
