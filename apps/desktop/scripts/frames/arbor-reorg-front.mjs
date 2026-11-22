// ARBOR REORG: THE FRONT MENU IN ARBOR (arbor-reorg-spec sections 4 and 6), as frames: both rooms (day and night: the frames job's tones), at 1366 and 1920, through the frames job's --screens-file.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<branch> -f screens=arbor-front-format,arbor-front-sections,arbor-front-kindmenu,arbor-front-structure,arbor-front-publish -f themes=plateau -f tones=light,dark -f screens_file=apps/desktop/scripts/frames/arbor-reorg-front.mjs
// The piece is not switched on in reorg/themeGate.ts for Arbor yet, so every frame takes it through the PREVIEW DOOR (?reorg=1&reorglift=plateau.front,plateau.top): the door only shows a piece, it flips no cell. The top rail is lifted with it because the page's host passes the Front menu its entry only while the top
// rail is on; the top bar's own look is ARBOR's (arbor/arbor-reorg-rail), so the strip above the page is not this piece's to judge. The Publish frame also lifts the uplink, and the Back menu is lifted so the badge's GRAFTS door is real.
// A frame is a LOOK (a PNG a person reads), never a verdict: it writes no assertion. Seeded through the app's own seams (window.wrizo*), never raw storage.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const PS = "{ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }";
const press = (sel) => `(() => { const b = document.querySelector(${q(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const LIFT = 'plateau.front,plateau.top,plateau.back';

async function seed(app) {
  try { await app.waitFor("(JSON.parse(localStorage.getItem('writer-studio-drawers') || '[]')).some((d) => /^top-drawer-/.test(d.id))", { label: 'Top Drawer', timeout: 30000 }); } catch { /* the frame shows what is there */ }
  await app.evalJs(`(() => {
    const W = window;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:0' + id.length % 10 + '.000Z', source: 'page', ...extra });
    const grants = W.wrizoCreateDrawer('Grants');
    const brief = W.wrizoCreateProject('Brief'); W.wrizoSetProjectDrawer(brief.id, grants.id);
    page('ff-note', 'Field notes\\nThe rain came late, and the river ran brown for a week.', { origin: 'loose' });
    page('ff-1', 'The harbour was quiet when she arrived. Nobody met her at the quay.', { origin: 'project', projectId: brief.id, orderIndex: 0 });
    page('ff-2', 'By the second week the town had decided what she was.', { origin: 'project', projectId: brief.id, orderIndex: 1 });
    page('ff-3', 'The tide went out and stayed out.', { origin: 'project', projectId: brief.id, orderIndex: 2 });
    page('ff-4', 'She wrote the letter twice and sent neither.', { origin: 'project', projectId: brief.id, orderIndex: 3 });
    page('ff-5', 'In March the ferry stopped running.', { origin: 'project', projectId: brief.id, orderIndex: 4 });
    page('ff-6', 'The lamp in the lighthouse was never lit again.', { origin: 'project', projectId: brief.id, orderIndex: 5 });
    const slots = { 'ff-1': ['Arrival', 'a'], 'ff-2': ['The town', 'b'], 'ff-3': ['Low tide', 'c'], 'ff-4': ['The letter', 'd'], 'ff-5': ['The ferry', 'e'], 'ff-6': ['The lamp', 'f'] };
    for (const id of Object.keys(slots)) W.wrizoPatchEntry(id, { pageSettings: ${PS}, name: slots[id][0], level: 0, color: slots[id][1] } });
    W.wrizoFlushNow();
    return null;
  })()`);
}
async function open(app, id, lift = LIFT) {
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&reorglift=${lift}#/page/${id}')`);
  await app.reload();
  try { await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-sliver-grip')", { label: 'the page', timeout: 15000 }); } catch { /* the frame shows what is there */ }
  await sleep(900);
  // the Doc's grafts (the link badge's count) are added once the page is up: window.wrizoDocSettings is mounted with the page, not on the Desk the fixture is made from
  await app.evalJs("(() => { const D = window.wrizoDocSettings; if (D && D.addAsset) { D.addAsset('ff-3', { entryId: 'ff-note' }); D.addAsset('ff-3', { entryId: 'ff-2' }); window.wrizoFlushNow(); } return null; })()");
  await sleep(600);
  // Free Write is remembered between pages and has no Front menu: a frame of the Front menu is Draft's
  await app.evalJs("(() => { const el = [...document.querySelectorAll('button, a, [role=tab]')].find((b) => /^\\s*draft\\s*$/i.test(b.textContent || '')); if (el) el.click(); return null; })()");
  await sleep(700);
}
async function front(app, id) {
  if (!(await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
  await app.evalJs(`document.getElementById('wz-sliver-tab-${id}')?.click(); null`); await sleep(600);
}

// THE ROOM (arbor2/room.ts): Arbor's room follows the clock unless data-room says otherwise (light = Always day, dark = Always night), so the job's tone is set as the room, and a frame is never two shots of the one room
const setRoom = async (app, tone) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${q(tone === 'dark' ? 'dark' : 'light')}); null`); await sleep(900); };
const SCREENS = {
  // FORMAT: the main tab (Typeface, Format, Paragraph and Insert symbol folded), the olive cloth forward; no Presets section: they live in SECTIONS' kind menu
  'arbor-front-format': async (app) => { await seed(app); await open(app, 'ff-3'); await front(app, 'text'); },
  // SECTIONS: the kind menu closed at the head, Sections (6), New section, Structure closed; six rows, each one's number tag (1 to 6), the chosen row (3) washed, with its brass mark and its link badge
  'arbor-front-sections': async (app) => { await seed(app); await open(app, 'ff-3'); await front(app, 'parts'); },
  // the kind menu open: Normal, then Style guide, Presets, Page setup, Special Sections; Presets unfolded
  'arbor-front-kindmenu': async (app) => {
    await seed(app); await open(app, 'ff-3'); await front(app, 'parts');
    await app.evalJs(`(async () => { document.querySelector('[data-doc-kind]')?.click(); await new Promise((r) => setTimeout(r, 300)); const pre = [...document.querySelectorAll('.reorg-dockind-item > button')].find((b) => /^Presets/.test((b.textContent || '').trim())); if (pre) pre.click(); return null; })()`);
    await sleep(500);
  },
  // Structure open: Split · Move up · Move down · Merge with the Section above
  'arbor-front-structure': async (app) => { await seed(app); await open(app, 'ff-3'); await front(app, 'parts'); await app.evalJs("document.querySelector('[data-parts-structure-toggle]')?.click(); null"); await sleep(500); },
  // Publish: FORMAT greyed with its note, SECTIONS the one that works (orders and ticks what goes out)
  'arbor-front-publish': async (app) => {
    await seed(app); await open(app, 'ff-3', 'plateau.front,plateau.top,plateau.back,plateau.uplink');
    await app.evalJs(press('.reorg-top .desk-mode-tab[data-mode-key="publish"]')); await sleep(700);
    await front(app, 'parts');
  },
};
export default Object.fromEntries(Object.entries(SCREENS).map(([name, fn]) => [name, async (app, ctx) => { await fn(app, ctx); await setRoom(app, ctx && ctx.tone); }]));
