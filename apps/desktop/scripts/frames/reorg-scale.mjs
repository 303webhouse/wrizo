// §3b ARBOR item 4, BEFORE (Fable, Nov 21 11:45 am: "frames at 1366/1920/2560 to the Wrizors first"): Machina's reorg as it stands, at three windows,
// so the Wrizors see what stays laptop-sized when the window grows (Team B row 5: "the page looked skinny"). Each screen sets its OWN window
// (1366x768, 1920x1080, 2560x1440): the job's own widths are 1366 and 1920 only, so name one width and every screen still shoots at its own size.
//   gh workflow run frames.yml --ref ci/actions-harness -f ref=<sha> -f themes=machina -f widths=1920 -f screens_file=apps/desktop/scripts/frames/reorg-scale.mjs \
//      -f screens=scale-page-1366,scale-page-1920,scale-page-2560,scale-split-1366,scale-split-1920,scale-split-2560
// page: a Part in BUILD with the Front menu open; split: the same Part with a Doc open beside it. The fixture is made through the app's own seams.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const SIZE = { 1366: 768, 1920: 1080, 2560: 1440 };
const LINES = Array.from({ length: 24 }, (_, i) => `Paragraph ${i + 1}. The rain had not stopped for three days, and the river was up past the second step of the mill.`);

async function fixture(app) {
  const made = await app.evalJs(`(() => {
    const W = window;
    const ids = { one: 'sc-1', two: 'sc-2', three: 'sc-3', notes: 'sc-n' };
    // made once per profile: a later screen finds the rows already there (a read only)
    if ((JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]')).some((e) => e.id === ids.one)) return ids;
    const page = (id, text, extra) => W.wrizoCreateJournalPage({ id, text, createdAt: '2026-04-01T00:00:00.000Z', source: 'page', ...extra });
    const drawer = W.wrizoCreateDrawer('Fiction');
    const novel = W.wrizoCreateProject('The Mill'); W.wrizoSetProjectDrawer(novel.id, drawer.id);
    page(ids.one, ${q(['Chapter One', ...LINES].join('\n'))}, { origin: 'project', projectId: novel.id, orderIndex: 0 });
    page(ids.two, 'Chapter Two\\nThe second morning.', { origin: 'project', projectId: novel.id, orderIndex: 1 });
    page(ids.three, 'Chapter Three\\nThe flood.', { origin: 'project', projectId: novel.id, orderIndex: 2 });
    page(ids.notes, 'Research notes\\nMill wheels turn at about twelve turns a minute.\\nThe river rises fastest in March.', { origin: 'loose' });
    W.wrizoFlushNow();
    return ids;
  })()`);
  return made;
}
async function at(app, w, ids) {
  await app.emulateDpr(1, w, SIZE[w]);
  await app.evalJs(`history.replaceState(null, '', '/?reorg=1&arbor2=0#/page/${ids.one}'); null`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.reorg-top')", { label: 'the reorg page', timeout: 20000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("document.querySelector('.reorg-top .desk-mode-tab[data-mode-key=\"draft\"]')?.click(); null");
  await sleep(900);
}
async function frontMenu(app) {
  const already = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!already) await app.evalJs("document.querySelector('.wz-sliver-grip')?.click(); null");
  await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the Front menu open', timeout: 4000 }).catch(() => {});
  await sleep(700);
}
async function report(app, name) {
  const r = await app.evalJs(`(() => { const box = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); };
    return { win: [innerWidth, innerHeight], paper: box('.mode-page'), rail: box('.desk-frame-strip'), top: box('.reorg-top'), front: box('.wz-sliver-panel'), split: box('.wz-split-asset'),
      railFont: (() => { const e = document.querySelector('.desk-frame-strip button, .desk-frame-strip a'); return e ? getComputedStyle(e).fontSize : null; })(),
      topFont: (() => { const e = document.querySelector('.reorg-top .desk-mode-tab'); return e ? getComputedStyle(e).fontSize : null; })() }; })()`);
  console.log(`REORG-SCALE-FRAME ${name} ${JSON.stringify(r)}`);
}
const page = (w) => async (app) => { const ids = await fixture(app); await at(app, w, ids); await frontMenu(app); await app.mouseMove(4, 4); await sleep(300); await report(app, `scale-page-${w}`); };
const split = (w) => async (app) => {
  const ids = await fixture(app); await at(app, w, ids);
  await app.evalJs(`window.wrizoSplit && window.wrizoSplit.open(${q(ids.one)}, { entryId: ${q(ids.notes)} }); null`);
  await app.waitFor("!!document.querySelector('.wz-split-asset')", { label: 'the split', timeout: 6000 }).catch(() => {});
  await sleep(900); await app.mouseMove(4, 4); await sleep(300);
  await report(app, `scale-split-${w}`);
};

// ---- PROTO (item 4, design only: a candidate chrome scale injected as a style, no product change) ----
const kOf = (w) => Math.max(1, w / 1366);
const PROTO = (k) => `:root{ --k:${k}; --strip-width: calc(84px * var(--k)); } .desk-frame-strip > *{ zoom: var(--k); } .chrome-top.sprint-nav > *{ zoom: var(--k); } .machina2-nameplate-mark{ zoom: var(--k); } .wz-sliver-panel > *, .wz-tutor-panel > *{ zoom: var(--k); } .wz-split-reader > :not(.wz-split-board), .wz-split-board-bar{ zoom: var(--k); }`;
const inject = async (app, w) => { await app.evalJs(`(() => { const s = document.createElement('style'); s.id = 'proto-scale'; s.textContent = ${JSON.stringify(PROTO(kOf(w)))}; document.head.appendChild(s); return true; })()`); await app.evalJs("window.dispatchEvent(new Event('resize')); null"); await sleep(900); };
const ppage = (w) => async (app) => { const ids = await fixture(app); await at(app, w, ids); await inject(app, w); await frontMenu(app); await app.mouseMove(4, 4); await sleep(300); await report(app, `proto-page-${w}`); };
const psplit = (w) => async (app) => {
  const ids = await fixture(app); await at(app, w, ids); await inject(app, w);
  await app.evalJs(`window.wrizoSplit && window.wrizoSplit.open(${q(ids.one)}, { entryId: ${q(ids.notes)} }); null`);
  await app.waitFor("!!document.querySelector('.wz-split-asset')", { label: 'the split', timeout: 6000 }).catch(() => {});
  await sleep(900); await app.mouseMove(4, 4); await sleep(300);
  await report(app, `proto-split-${w}`);
};
export default {
  'scale-page-1366': page(1366), 'scale-page-1920': page(1920), 'scale-page-2560': page(2560),
  'scale-split-1366': split(1366), 'scale-split-1920': split(1920), 'scale-split-2560': split(2560),
  'proto-page-1920': ppage(1920), 'proto-page-2560': ppage(2560), 'proto-split-1920': psplit(1920), 'proto-split-2560': psplit(2560),
};
