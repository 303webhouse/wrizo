// J5 — the Spread console (lenses + Add to…). A committed CDP verification
// scenario (per AGENTS.md "Harness scenarios persist").
// Run: node apps/desktop/scripts/harness/j5.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A zero-delta tap (pointerdown+pointerup, no movement) exercises a real
// pointerdown-driven select/open, distinct from a bare .click(). A non-zero
// delta drives an actual drag attempt through the same delegated listener
// Spread/BoardEditor use, so lift/no-lift is asserted on real listener code.
const POINTER_HELPER = `
window.__pointerSeq = function(selector, dx, dy, opts) {
  opts = opts || {};
  const el = document.querySelector(selector);
  if (!el) throw new Error('pointerSeq: not found ' + selector);
  const r = el.getBoundingClientRect();
  const x0 = r.left + r.width/2, y0 = r.top + r.height/2;
  const pid = opts.pointerId || 1;
  const ptype = opts.pointerType || 'mouse';
  const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:pid, pointerType:ptype, bubbles:true, cancelable:true, isPrimary:true});
  el.dispatchEvent(mk('pointerdown', x0, y0));
  const steps = opts.steps ?? 4;
  for (let i=1;i<=steps;i++) {
    el.dispatchEvent(mk('pointermove', x0 + dx*i/steps, y0 + dy*i/steps));
  }
  el.dispatchEvent(mk('pointerup', x0+dx, y0+dy));
  return true;
};
`;

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after clear' });
  await app.evalJs(POINTER_HELPER);

  // -- create 4 loose pages: A (text), B (text, to be starred+tagged), C
  // (ink only), D (text + ink) ------------------------------------------
  // Polls the SPECIFIC entry (by id, read from the URL right after
  // creation) rather than a fixed sleep — a blind sleep(2300) proved flaky
  // under sustained CDP load (this scenario creates 5 pages + many sheet
  // round-trips), occasionally reading localStorage before the 300ms
  // debounced flush had actually landed.
  const makePage = async (text, withInk) => {
    await app.goto('/journal');
    await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list' });
    await app.click('New page');
    await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page' });
    const id = (await app.evalJs('location.hash')).replace(/^#\/journal\//, '');
    if (text) {
      await app.evalJs("document.querySelector('.entry-edit').focus()");
      await app.typeKeys(text);
    }
    if (withInk) await app.penStroke('.entry-full', [{ x: 0.2, y: 0.3 }, { x: 0.5, y: 0.35 }, { x: 0.8, y: 0.3 }]);
    const expect = [
      text ? `e.text === ${JSON.stringify(text)}` : null,
      withInk ? '(e.strokes?.length ?? 0) > 0' : null,
    ].filter(Boolean).join(' && ') || 'true';
    await app.waitFor(
      `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); const e = l.find(x => x.id === ${JSON.stringify(id)}); return !!e && (${expect}); })()`,
      { label: `page ${id} saved`, timeout: 6000 },
    );
    return id;
  };
  const idA = await makePage('Alpha text only.', false);
  const idB = await makePage('Beta text only, starred and tagged.', false);
  const idC = await makePage(null, true);
  const idD = await makePage('Delta has both.', true);

  let entries = await app.localJSON('writer-studio-journal-entries');
  const A = entries.find((e) => e.id === idA);
  const B = entries.find((e) => e.id === idB);
  const C = entries.find((e) => e.id === idC);
  const D = entries.find((e) => e.id === idD);
  ok('4 fixture pages created (text-only, text-only, ink-only, text+ink)', !!A && !!B && !!C && !!D, JSON.stringify({ A: !!A, B: !!B, C: !!C, D: !!D }));

  // Star + tag B directly (Slice 0: lens authoring is out of scope — the
  // lenses CONSUME data J2/J6 already authors; this just seeds it). Navigate
  // away from the entry view FIRST — its unmount flush would otherwise
  // re-save its own stale in-memory copy over this direct patch.
  await app.goto('/journal');
  await app.evalJs(`
    (() => {
      const key = 'writer-studio-journal-entries';
      const list = JSON.parse(localStorage.getItem(key));
      const b = list.find(e => e.id === ${JSON.stringify(B.id)});
      b.starred = true; b.tags = ['research'];
      localStorage.setItem(key, JSON.stringify(list));
    })()
  `);
  // A direct localStorage write doesn't update the app's already-hydrated
  // in-memory cache — reload so persistence.ts re-hydrates from it.
  await app.reload();
  await app.evalJs(POINTER_HELPER);

  // -- Slice 1: the lens matrix ----------------------------------------------
  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-lens-row')", { label: 'lens row' });

  const visibleIds = async () => app.evalJs("[...document.querySelectorAll('.spread-cell')].map(c => c.dataset.pageId)");
  const clickChip = (label) => app.evalJs(`[...document.querySelectorAll('.spread-lens-chip')].find(b => b.textContent.trim() === ${JSON.stringify(label)}).click()`);

  await clickChip('Text');
  await sleep(100);
  let vis = await visibleIds();
  ok('content=Text shows exactly {A,B}', new Set(vis).size === 2 && vis.includes(A.id) && vis.includes(B.id), JSON.stringify(vis));

  await clickChip('Ink');
  await sleep(100);
  vis = await visibleIds();
  ok('content=Ink shows exactly {C}', vis.length === 1 && vis[0] === C.id, JSON.stringify(vis));

  await clickChip('Text+ink');
  await sleep(100);
  vis = await visibleIds();
  ok('content=Text+ink shows exactly {D}', vis.length === 1 && vis[0] === D.id, JSON.stringify(vis));

  await clickChip('All');
  await sleep(100);
  vis = await visibleIds();
  ok('content=All shows all 4', new Set(vis).size === 4, JSON.stringify(vis));

  await clickChip('☆ Starred');
  await sleep(100);
  vis = await visibleIds();
  ok('★ Starred shows exactly {B}', vis.length === 1 && vis[0] === B.id, JSON.stringify(vis));
  await clickChip('★ Starred'); // toggle back off
  await sleep(100);

  await app.waitFor("[...document.querySelectorAll('.spread-lens-chip')].some(b => b.textContent.trim() === 'research')", { label: 'tag chip' });
  await clickChip('research');
  await sleep(100);
  vis = await visibleIds();
  ok('TAG=research shows exactly {B}', vis.length === 1 && vis[0] === B.id, JSON.stringify(vis));
  await clickChip('research'); // clear

  await clickChip('Newest');
  await sleep(100);
  vis = await visibleIds();
  ok('order=Newest sorts createdAt-descending (D,C,B,A)', JSON.stringify(vis) === JSON.stringify([D.id, C.id, B.id, A.id]), JSON.stringify(vis));

  // -- Slice 1: selection survives a lens flip -------------------------------
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${A.id}"]').click()`);
  await app.evalJs(`document.querySelector('[data-page-id="${C.id}"]').click()`);
  let count = await app.evalJs("document.querySelector('.spread-select-count').textContent");
  ok('2 selected before any lens change', count.startsWith('2'), count);

  await clickChip('Text'); // hides C (ink-only)
  await sleep(100);
  count = await app.evalJs("document.querySelector('.spread-select-count').textContent");
  ok('selection count survives a lens change that HIDES a selected cell', count.startsWith('2'), count);

  await clickChip('All');
  await sleep(100);
  const cSelected = await app.evalJs(`document.querySelector('[data-page-id="${C.id}"]').dataset.selected`);
  ok('a hidden-then-reshown selected cell is still marked selected', cSelected === 'true', cSelected);
  await app.click('Done'); // exit select mode, clears selection
  await clickChip('Your order');
  await sleep(100);

  // -- Slice 1: drag disabled under ANY non-default lens ---------------------
  await clickChip('Text'); // a non-default lens
  await sleep(100);
  const orderIndexBefore = (await app.localJSON('writer-studio-journal-entries')).find((e) => e.id === A.id).orderIndex ?? null;
  await app.evalJs(`__pointerSeq('[data-page-id="${A.id}"]', 80, 0, {steps:6})`);
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const orderIndexAfterBlocked = (await app.localJSON('writer-studio-journal-entries')).find((e) => e.id === A.id).orderIndex ?? null;
  ok('drag under a non-default lens writes ZERO orderIndex changes', orderIndexAfterBlocked === orderIndexBefore, `before=${orderIndexBefore} after=${orderIndexAfterBlocked}`);
  const noteVisible = await app.evalJs("!!document.querySelector('.spread-lens-note')");
  ok('the "view, not an arrangement" lens note shows under a non-default lens', noteVisible === true);

  await clickChip('All'); // back to default lens (Your order + All + no star + no tag)
  await sleep(100);
  const noteGone = await app.evalJs("!!document.querySelector('.spread-lens-note')");
  ok('the lens note is gone in the default lens state', noteGone === false);

  // -- Slice 1 / Fable R2: DoD 2's positive half — an ACTUAL default-lens drag
  // reorder. The blocked-drag check above only proves lift is refused OUTSIDE
  // the default lens; an inverted `dragEnabled` flag would kill ALL
  // reordering and nothing above would catch it (no persisted J3 script
  // backstops this — J3 predates the harness-persistence rule). Compute the
  // exact delta to B's cell center so `computeTarget`'s nearest-cell
  // heuristic drops A deterministically right after B.
  const dragDelta = await app.evalJs(`
    (() => {
      const a = document.querySelector('[data-page-id="${A.id}"]').getBoundingClientRect();
      const b = document.querySelector('[data-page-id="${B.id}"]').getBoundingClientRect();
      return { dx: (b.left + b.width / 2) - (a.left + a.width / 2) + 4, dy: (b.top + b.height / 2) - (a.top + a.height / 2) };
    })()
  `);
  const orderBeforeDrag = await visibleIds();
  await app.evalJs(`__pointerSeq('[data-page-id="${A.id}"]', ${dragDelta.dx}, ${dragDelta.dy}, {steps:6})`);
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const orderAfterDrag = await visibleIds();
  ok('R2: a default-lens drag actually reorders A to directly after B', orderAfterDrag[0] === B.id && orderAfterDrag[1] === A.id, JSON.stringify({ before: orderBeforeDrag, after: orderAfterDrag }));
  const aOrderIndexAfterDrag = (await app.localJSON('writer-studio-journal-entries')).find((e) => e.id === A.id).orderIndex;
  ok('R2: the drag wrote a real orderIndex for A', typeof aOrderIndexAfterDrag === 'number', String(aOrderIndexAfterDrag));
  await app.reload();
  await app.evalJs(POINTER_HELPER);
  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-lens-row')", { label: 'lens row after drag reload' });
  const orderAfterReload = await visibleIds();
  ok('R2: the reordered position survives a reload', JSON.stringify(orderAfterReload) === JSON.stringify(orderAfterDrag), JSON.stringify(orderAfterReload));

  // -- Slice 2: FILE to the Shelf (single page A) ----------------------------
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${A.id}"]').click()`);
  await app.waitFor("!!document.querySelector('.spread-add')", { label: 'Add to… button' });
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('The Shelf')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const toastShelf = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('FILE-to-Shelf toast carries the exact MOVES language', toastShelf === 'Filed 1 page to the Shelf — moved; it left the Journal.', toastShelf);
  entries = await app.localJSON('writer-studio-journal-entries');
  const aAfter = entries.find((e) => e.id === A.id);
  ok('A is now on the Shelf (projectId null, shelved true)', aAfter.projectId == null && aAfter.shelved === true);
  await sleep(150);
  vis = await visibleIds();
  ok('A left the Spread grid', !vis.includes(A.id), JSON.stringify(vis));

  // -- Slice 2 / Fable R1: single-page FILE via the entry view's OWN "Add
  // to…" button (JournalEntry.tsx, not the Spread's multi-select) — the
  // toast must survive the navigate('/journal') that follows a MOVES verb.
  // Previously lost: the toast node lived inside the view being unmounted.
  const idF = await makePage('Foxtrot, filed from its own entry view.', false);
  await app.goto(`/journal/${idF}`);
  await app.waitFor("!!document.querySelector('.entry-add')", { label: 'entry view (F)' });
  await app.evalJs("document.querySelector('.entry-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (entry view)' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('The Shelf')).click()");
  await app.waitFor("!!document.querySelector('.action-toast')", { label: 'toast on /journal after MOVE (R1)' });
  const entryViewToast = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('R1: single-page FILE-to-Shelf toast survives the navigate to /journal', entryViewToast === 'Filed 1 page to the Shelf — moved; it left the Journal.', entryViewToast);
  await app.reload();
  await app.waitFor("!!document.querySelector('.journal-row')", { label: 'Journal after reload (R1)' });
  const toastGoneAfterReload = await app.evalJs("!!document.querySelector('.action-toast')");
  ok('R1: the one-shot toast does not reappear on reload', toastGoneAfterReload === false, String(toastGoneAfterReload));

  // -- Slice 2: FILE standalone into a NEW, empty drawer (B) -----------------
  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.dz-new')", { label: 'Drawers page' });
  await app.evalJs("document.querySelector('.dz-new').click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const drawers1 = await app.localJSON('writer-studio-drawers');
  const newDrawer = drawers1.find((d) => d.name === 'New Drawer');
  ok('a new (empty) drawer was created', !!newDrawer);

  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (2)' });
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${B.id}"]').click()`);
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (2)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(newDrawer.name)})).click()`);
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Standalone document here'))", { label: 'empty-drawer standalone leaf' });
  const emptyLine = await app.evalJs("document.querySelector('.board-sheet-inner p')?.textContent ?? null");
  ok('an empty drawer shows an explanatory line', !!emptyLine, emptyLine);
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Standalone document here')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const toastStandalone = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('FILE-standalone toast says "Untitled" and uses MOVES language', toastStandalone === 'Filed 1 page to Untitled — moved; it left the Journal.', toastStandalone);
  const projectsAfterStandalone = await app.localJSON('writer-studio-projects');
  const standaloneBinder = projectsAfterStandalone.find((p) => p.drawerId === newDrawer.id);
  entries = await app.localJSON('writer-studio-journal-entries');
  const bAfter = entries.find((e) => e.id === B.id);
  ok('standalone birth: ONE Untitled/\'other\' binder in that drawer, holding B', !!standaloneBinder && standaloneBinder.kind === 'other' && bAfter.projectId === standaloneBinder.id, JSON.stringify({ binder: standaloneBinder?.id, bProject: bAfter.projectId }));

  // -- Slice 3: chapter-append (D, text+ink -> ink notice + byte-verify) ----
  // Use the existing standalone binder: create a chapter there directly.
  await app.goto(`/project/${standaloneBinder.id}`);
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('New chapter'))", { label: 'ProjectHome' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('New chapter')).click()");
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'chapter editor' });
  const chapterId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Chapter start.');
  await app.waitFor(
    `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); const e = l.find(x => x.id === ${JSON.stringify(chapterId)}); return e?.text === 'Chapter start.'; })()`,
    { label: 'chapter text saved', timeout: 6000 },
  );
  entries = await app.localJSON('writer-studio-journal-entries');
  const chapter = entries.find((e) => e.id === chapterId);
  ok('a manuscript chapter exists with seed text', chapter?.pageType === 'manuscript' && chapter?.text === 'Chapter start.', chapter?.text);

  const dTextBefore = D.text, dStrokesBefore = JSON.stringify(D.strokes);

  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (3)' });
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${D.id}"]').click()`);
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (3)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(newDrawer.name)})).click()`); // root -> the drawer
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Untitled'))", { label: 'drawer level (3)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Untitled')).click()`); // drawer -> the standalone binder (title "Untitled")
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('File here as a new page'))", { label: 'binder level' });
  const inkNoticeShown = await app.evalJs("!!document.querySelector('.add-ink-notice')");
  ok('the ink notice shows when the selection carries ink', inkNoticeShown === true);
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Append to')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const toastAppend = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('chapter-append toast carries the exact COPIES language', toastAppend === 'Copied — appended to "Chapter start.". The originals stay in the Journal.', toastAppend);
  entries = await app.localJSON('writer-studio-journal-entries');
  const chapterAfter = entries.find((e) => e.id === chapter.id);
  ok('text lands at the end, blank-line separated', chapterAfter.text === 'Chapter start.\n\nDelta has both.', chapterAfter.text);
  const dAfter = entries.find((e) => e.id === D.id);
  ok('D (the source) is byte-untouched — COPY never mutates a source', dAfter.text === dTextBefore && JSON.stringify(dAfter.strokes) === dStrokesBefore);

  // -- Slice 3 / Fable R3: two-source chapter-append lands in NOTEBOOK order
  // even when clicked in reverse — pins the ruling (notebook order stands;
  // click/selection sequence is never honored).
  const idG = await makePage('Golf comes first in the notebook.', false);
  const idH = await makePage('Hotel comes second in the notebook.', false);
  entries = await app.localJSON('writer-studio-journal-entries');
  const G = entries.find((e) => e.id === idG);
  const H = entries.find((e) => e.id === idH);

  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (R3)' });
  await app.click('Select');
  // Click H FIRST, then G — the reverse of notebook order.
  await app.evalJs(`document.querySelector('[data-page-id="${H.id}"]').click()`);
  await app.evalJs(`document.querySelector('[data-page-id="${G.id}"]').click()`);
  const selCountR3 = await app.evalJs("document.querySelector('.spread-select-count').textContent");
  ok('R3 setup: both G and H are selected (2)', selCountR3.startsWith('2'), selCountR3);
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (R3)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(newDrawer.name)})).click()`); // root -> the drawer
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Untitled'))", { label: 'drawer level (R3)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Untitled')).click()`); // drawer -> the standalone binder
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Append to'))", { label: 'binder level (R3)' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Append to')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  entries = await app.localJSON('writer-studio-journal-entries');
  const chapterAfterR3 = entries.find((e) => e.id === chapter.id);
  ok('R3: a 2-source append lands in NOTEBOOK order (G, then H) despite reverse click order', chapterAfterR3.text.endsWith('Golf comes first in the notebook.\n\nHotel comes second in the notebook.'), chapterAfterR3.text);

  // -- Slice 3: plan-link (seed a StoryPlan fixture; lens authoring is out of
  // scope, but attach/link behavior is this ticket's own new code) ----------
  const idE = await makePage('Echo needs a plan link.', false);
  entries = await app.localJSON('writer-studio-journal-entries');
  const E = entries.find((e) => e.id === idE);

  // Navigate away first — same clobbering hazard as the star/tag seed above.
  await app.goto('/journal');
  await app.evalJs(`
    (() => {
      const now = new Date().toISOString();
      const plan = { id: 'plan-' + Date.now(), projectId: ${JSON.stringify(standaloneBinder.id)}, frameworkId: 'three_act', beatNotes: [], currentBeatId: null, createdAt: now, updatedAt: now };
      localStorage.setItem('writer-studio-story-plans', JSON.stringify([plan]));
    })()
  `);
  await app.reload();
  await app.evalJs(POINTER_HELPER);

  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (4)' });
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${E.id}"]').click()`);
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (4)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(newDrawer.name)})).click()`); // root -> the drawer
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Untitled'))", { label: 'drawer level (4)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Untitled')).click()`); // drawer -> the binder
  // "Attach to the plan" is an .eyebrow header, not a button — wait on an
  // actual beat button instead (three_act's first beat is "Setup").
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Setup'))", { label: 'plan section' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Setup')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const toastLink = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('plan-link toast carries the exact LINKS language', toastLink === 'Linked — marked routed to "Setup"; the page stays in the Journal.', toastLink);
  entries = await app.localJSON('writer-studio-journal-entries');
  const eAfter = entries.find((e) => e.id === E.id);
  ok('beatId + routedProjectIds set; nothing moved (projectId still null)', eAfter.beatId === 'setup' && eAfter.routedProjectIds?.includes(standaloneBinder.id) && eAfter.projectId == null, JSON.stringify({ beatId: eAfter.beatId, routed: eAfter.routedProjectIds, projectId: eAfter.projectId }));

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-row')", { label: 'Journal list' });
  const routedCrumbShown = await app.evalJs(`[...document.querySelectorAll('.journal-row')].some(r => r.textContent.includes('routed'))`);
  ok('the "routed" crumb appears in the Journal list', routedCrumbShown === true);

  // -- Slice 3: board-append (append onto an EXISTING board, below content) -
  // Seed an existing board with one box so we can assert the new group lands
  // BELOW it (this exercises appendToBoard's new-code path specifically).
  const boardId = 'seed-board-' + Date.now();
  await app.evalJs(`
    (() => {
      const key = 'writer-studio-journal-entries';
      const list = JSON.parse(localStorage.getItem(key));
      const now = new Date().toISOString();
      list.push({
        id: ${JSON.stringify(boardId)}, text: 'Seed Board', projectId: ${JSON.stringify(standaloneBinder.id)},
        pageType: 'board', source: 'page', createdAt: now, updatedAt: now,
        boxes: [{ id: 'seed-box', kind: 'text', x: 0.05, y: 0.1, w: 0.6, h: 0.2, z: 1, text: 'existing content' }],
      });
      localStorage.setItem(key, JSON.stringify(list));
    })()
  `);
  await app.reload();
  await app.evalJs(POINTER_HELPER);

  await app.goto('/journal/spread');
  await app.waitFor("!!document.querySelector('.spread-select-toggle')", { label: 'Spread (5)' });
  await app.click('Select');
  await app.evalJs(`document.querySelector('[data-page-id="${C.id}"]').click()`); // C = ink-only, no ink-choice prompt needed for a text-empty page... wait C has ink, so a prompt WILL show
  await app.evalJs("document.querySelector('.spread-add').click()");
  await app.waitFor("!!document.querySelector('.board-sheet')", { label: 'Add to… sheet (5)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes(${JSON.stringify(newDrawer.name)})).click()`); // root -> the drawer
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Untitled'))", { label: 'drawer level (5)' });
  await app.evalJs(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Untitled')).click()`); // drawer -> the binder
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Add onto Board'))", { label: 'board leaf' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Add onto Board')).click()");
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Text + ink'))", { label: 'board-append ink choice' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Text + ink')).click()");
  await sleep(400); // clear the 300ms debounced-flush window before reading localStorage
  const toastBoard = await app.evalJs("document.querySelector('.action-toast')?.textContent ?? null");
  ok('board-append toast carries the exact COPIES language', toastBoard === 'Copied — added to the "Seed Board" Board. The originals stay in the Journal.', toastBoard);
  entries = await app.localJSON('writer-studio-journal-entries');
  const boardAfter = entries.find((e) => e.id === boardId);
  const seedBox = boardAfter.boxes.find((b) => b.id === 'seed-box');
  const newBox = boardAfter.boxes.find((b) => b.id !== 'seed-box');
  ok('a new box was appended onto the existing board', boardAfter.boxes.length === 2, `count=${boardAfter.boxes.length}`);
  ok('the new box lands BELOW existing content (y >= seed bottom)', newBox.y >= seedBox.y + seedBox.h, `seedBottom=${seedBox.y + seedBox.h} newY=${newBox.y}`);
  ok('the new box carries C\'s ink + provenance', newBox.kind === 'ink' && !!newBox.strokes?.length && newBox.sourceEntryId === C.id);
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nJ5 VERIFY: PASS (${checks.length} checks)` : `\nJ5 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
