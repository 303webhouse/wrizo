// LOOK B, THE FIDELITY FRAMES (Nick's pick Nov 14 5:29 pm; Fable's ruling 6:18 pm: "frames for the Wrizors' fidelity check against today's blur in all three themes"), for the frames job:
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f themes=plateau,flux,machina -f widths=1366,1920 \
//      -f screens=blur-open-live,blur-open-snap,blur-open-flux3-live,blur-open-flux3-snap -f screens_file=apps/desktop/scripts/frames/blur-b.mjs
// ONE build, both looks: a card opened over the nine-card board. "-live" forces TODAY'S look (the live filter: blur(6px) on the wrap, the live board shown, the snapshot slot off: a stylesheet put in before the card
// opens), "-snap" is look B as the product ships it (the board drawn once into a blurred canvas and held still). Same board, same card, same theme, same tone: the pair differs only in the blur. The "-flux3-" pair
// runs under ?flux3=1 (the Schema's layer under the cards: the case that cost 22.5 ms of first frame). Each screen prints what it stood on ("BLUR-B-FRAME <screen> {...}").
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };

const LIVE_CSS = ".board-blur-snap-slot{display:none!important}.board-canvas-blur-wrap[data-blur='snap']{filter:blur(6px)!important;transition:none!important}.board-canvas-blur-wrap[data-blur='snap'] > :not(.board-blur-snap-slot){visibility:visible!important}";

const seed = async (app, flux3) => {
  const id = `blurb-frames-${Date.now()}`;
  const at = new Date().toISOString();
  const doc = `${id}-doc`;
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: doc, text: 'The doc node\nIts second line.', createdAt: at, origin: 'journal', source: 'page' })})`);
  const T = (bid, x, y, z, text, extra = {}) => ({ id: bid, kind: 'text', x, y, w: 0.2, h: 0.1, z, text, ...extra });
  const L = (bid, a, b, z) => ({ id: bid, kind: 'connection', x: 0, y: 0, w: 0, h: 0, z, connA: a, connB: b });
  const boxes = [
    T('bb-a', 0.05, 0.05, 1, 'The opening: she arrives at the house after dark and finds the door already open.'),
    T('bb-b', 0.5, 0.05, 2, 'What she wants'), T('bb-c', 0.05, 0.4, 3, 'The hall, the stairs, the smell of woodsmoke'), T('bb-d', 0.5, 0.4, 4, 'The middle: she tells the lie'),
    T('bb-e', 0.05, 0.75, 5, 'Card E'), T('bb-f', 0.5, 0.75, 6, 'Card F, the turn'), T('bb-g', 0.75, 0.4, 7, 'Card G, no link'),
    T('bb-h', 0.75, 0.05, 8, 'The hook', { deckStep: { deck: 'three-act', step: 'hook' }, lit: true }),
    { id: 'bb-p', kind: 'page-pin', entryId: doc, x: 0.75, y: 0.75, w: 0.2, h: 0.15, z: 9 },
    L('bb-ac', 'bb-a', 'bb-c', 10), L('bb-bd', 'bb-b', 'bb-d', 11), L('bb-ef', 'bb-e', 'bb-f', 12), L('bb-ad', 'bb-a', 'bb-d', 13),
  ];
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'Look B frames', pageType: 'board', boxes, createdAt: at, origin: null, source: null })})`);
  await sleep(500);
  await app.evalJs(`history.replaceState(null, '', '${flux3 ? '/?flux3=1' : '/'}#/page/${id}')`);
  await app.reload();
  await waitSoft(app, "!!document.querySelector('.board-box[data-box-id=\"bb-a\"]')", { label: 'the board', timeout: 15000 });
  if (flux3) await waitSoft(app, "!!document.querySelector('[data-flux3-layer]')", { label: 'the Schema', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 });
  await sleep(flux3 ? 1500 : 700);
};

const open = async (app, live, flux3) => {
  await seed(app, flux3);
  if (live) await app.evalJs(`(() => { const s = document.createElement('style'); s.id = '__livecss'; s.textContent = ${JSON.stringify(LIVE_CSS)}; document.head.appendChild(s); return true; })()`);
  const p = await app.evalJs(`(() => { const e = document.querySelector('.board-box[data-box-id="bb-d"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.4) }; })()`);
  if (p) await app.doubleClick(p.x, p.y);
  await waitSoft(app, "!!document.querySelector('.board-popup-editor')", { label: 'the card editor', timeout: 5000 });
  if (!live) await waitSoft(app, "document.querySelector('.board-canvas-blur-wrap')?.getAttribute('data-blur') === 'snap'", { label: 'the snapshot', timeout: 6000 });
  await app.evalJs("(() => { const e = document.querySelector('.board-popup-editor'); if (!e) return; e.focus(); const s = getSelection(); s.selectAllChildren(e); s.collapseToEnd(); })()");
  await sleep(900);
};

const stood = (app, name) => app.evalJs(`(() => { const w = document.querySelector('.board-canvas-blur-wrap'), cs = w && getComputedStyle(w), cv = w && w.querySelector('.board-blur-snap-slot > *');
  return { screen: ${JSON.stringify(name)}, theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), flag: new URLSearchParams(location.search).get('flux3'),
    popup: !!document.querySelector('.board-popup-editor'), dataBlur: w ? w.getAttribute('data-blur') : null, filter: cs ? cs.filter : null, opacity: cs ? cs.opacity : null,
    canvas: cv ? { w: cv.width, h: cv.height } : null, layer: document.querySelectorAll('[data-flux3-layer]').length }; })()`);

export default {
  'blur-open-live': async (app) => { await open(app, true, false); console.log(`BLUR-B-FRAME blur-open-live ${JSON.stringify(await stood(app, 'blur-open-live'))}`); },
  'blur-open-snap': async (app) => { await open(app, false, false); console.log(`BLUR-B-FRAME blur-open-snap ${JSON.stringify(await stood(app, 'blur-open-snap'))}`); },
  'blur-open-flux3-live': async (app) => { await open(app, true, true); console.log(`BLUR-B-FRAME blur-open-flux3-live ${JSON.stringify(await stood(app, 'blur-open-flux3-live'))}`); },
  'blur-open-flux3-snap': async (app) => { await open(app, false, true); console.log(`BLUR-B-FRAME blur-open-flux3-snap ${JSON.stringify(await stood(app, 'blur-open-flux3-snap'))}`); },
};
