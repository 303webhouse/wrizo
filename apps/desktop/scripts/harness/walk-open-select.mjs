// WALK -> OPEN SELECT (train #9, found by INK in glue-9): in a Deck, "Show as: Open" from the Walk left the cards unpressable - a press never selected one; a reload onto Open worked.
// CAUSE (read in the source): BoardEditor's delegated pointer effect opens with `const canvas = canvasRef.current; if (!canvas) return;` and was keyed on [pageWidthPx] only. A Deck mounts in the
// Walk, where there is no canvas, so the effect ran once and bailed; switching to Open mounts the canvas but nothing re-ran the effect (pageWidthPx did not change), so no listener ever attached.
// THE FIX under test: the effect is also keyed on "the board is shown Open" (the same key the W1 wrap effects already use), so it re-attaches when the canvas appears.
//
// PART A (browserless): the pointer effect's deps name the Open flag; a MUTANT removes it and the check must go red.
// PART B (a box turn): a Deck is opened in the Walk, shown as Open by the strip (NO reload), a card is pressed, and it is selected - in Arbor and in Flux. Control: a plain board's card selects (it always did).
//
// Run: node scripts/harness/walk-open-select.mjs     (PART B needs a box turn through scripts/box-take.mjs; PART A runs anywhere: node scripts/harness/walk-open-select.mjs --source)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '../../src/components/BoardEditor.tsx');
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- PART A: the source -------------------------------------------------------------------------------------------------------------------------------------------------------------------
const MARK = '// -- delegated pointer handling: select / move / resize / thread-drag';
// the dependency list of the effect that begins at MARK: the first `}, [ ... ]);` at the effect's own indent after it
function pointerEffectDeps(src) {
  const i = src.indexOf(MARK);
  if (i < 0) return null;
  const m = /\r?\n {2}\}, \[([^\]]*)\]\);/.exec(src.slice(i));
  return m ? m[1] : null;
}
const keyedOnOpen = (src) => { const d = pointerEffectDeps(src); return d !== null && /boardMode\s*===\s*'open'/.test(d); };
const source = fs.readFileSync(SRC, 'utf8');
ok('A1 the pointer effect is found in BoardEditor.tsx (its marker comment and its dependency list)', pointerEffectDeps(source) !== null, 'marker or deps not found');
ok("A2 the pointer effect re-runs when the board is shown Open (its deps name boardMode === 'open'), so a Deck switched from the Walk attaches its listeners to the canvas that just mounted", keyedOnOpen(source), `deps: [${pointerEffectDeps(source)}]`);
// mutant: the Open key is dropped -> A2's test function must go red on it
{
  const i = source.indexOf(MARK);
  const head = source.slice(0, i), tail = source.slice(i).replace(/(\r?\n {2}\}, \[)([^\]]*)(\]\);)/, (m0, a, deps, c) => a + deps.split(',').filter((s) => !/boardMode/.test(s)).join(',').trim() + c);
  const mutant = head + tail;
  ok('A3 MUTANT: with the Open key removed from the effect the A2 test goes red (the check can fail)', keyedOnOpen(source) && !keyedOnOpen(mutant), 'the mutant was not red');
}

if (process.argv.includes('--source')) { report('WALK-OPEN-SELECT (source only)'); }

// ---- PART B: the live app ----------------------------------------------------------------------------------------------------------------------------------------------------------------
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };
  const selectedIds = () => q(`[...document.querySelectorAll('.board-box[data-selected="true"]')].map((e) => e.getAttribute('data-box-id'))`);
  const fresh = async (theme, seed = true) => {
    await app.emulateDpr(1, 1400, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await sleep(400);
    if (!seed) return;
    // a plain board (the control) and a Deck of three steps (a Deck is a board whose board-meta homeView is walk), seeded through the app's own seams
    await q(`(() => { const d = window.wrizoCreateDrawer('Select'); const p = window.wrizoCreateProject('Select', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const text = (id, x, y, seq, t) => ({ id, kind: 'text', x, y, w: 0.2, h: 0.105, z: 1, text: t, seq });
      window.wrizoCreateJournalPage({ id: 'wos-plain', text: 'A plain board', pageType: 'board', projectId: p.id, boxes: [text('p1', 0.05, 0.06, 1, 'First\\n'), text('p2', 0.4, 0.2, 2, 'Second\\n')], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'wos-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: [1, 2, 3].map((i) => ({ ...text('d' + i, 0.03 + (i - 1) * 0.32, 0.04, i, 'Step ' + i + '\\n'), prompt: 'What happens in step ' + i + '?', deckStep: { deck: 'three-act', step: 'hook' } })).concat([{ id: 'dm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' }]), origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' }); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  const showAs = async (view) => {
    const strip = await point('.show-as');
    if (strip) { await app.mouseMove(strip.x, strip.y); await waitSoft("document.querySelector('.show-as')?.getAttribute('data-open') === 'true'", { label: 'show-as open', timeout: 2000 }); await sleep(120); }
    return click(`.show-as-btn[data-view="${view}"]`);
  };

  for (const theme of ['plateau', 'flux']) {
    const T = theme === 'plateau' ? 'Arbor' : 'Flux';
    try {
      await fresh(theme);
      // control: a plain board is Open from the start - a press selects
      await open('wos-plain', '.board-canvas');
      const cp = await point('.board-box[data-box-id="p2"] .board-text');
      if (cp) { await app.mouseMove(cp.x, cp.y); await app.mouseDown(cp.x, cp.y); await sleep(60); await app.mouseUp(cp.x, cp.y); await sleep(500); }
      ok(`[${T}] B0 control: on a plain board shown Open, a press selects the card`, (await selectedIds()).includes('p2'), JSON.stringify(await selectedIds()));

      // the Deck lands in the Walk; the writer shows it as Open by the strip (no reload)
      await open('wos-deck', '.walk');
      ok(`[${T}] B1 the Deck lands in the Walk`, !!(await point('.walk-card')), 'no .walk-card');
      await showAs('open');
      await waitSoft("!!document.querySelector('.board-canvas')", { label: 'the canvas after Show as Open', timeout: 6000 }); await sleep(900);
      ok(`[${T}] B2 the Deck is now shown Open (the canvas is mounted, the strip says open)`, (await q("document.querySelector('.show-as-btn[aria-pressed=\"true\"]')?.getAttribute('data-view')")) === 'open' && !!(await point('.board-canvas')), 'not Open');
      // press the second step's card on the canvas, with NO reload
      const dp = await point('.board-box[data-box-id="d2"] .board-text');
      if (dp) { await app.mouseMove(dp.x, dp.y); await app.mouseDown(dp.x, dp.y); await sleep(60); await app.mouseUp(dp.x, dp.y); await sleep(600); }
      ok(`[${T}] B3 a press on a Deck card, shown Open from the Walk with no reload, SELECTS it (the bug: nothing ever did)`, (await selectedIds()).includes('d2'), JSON.stringify(await selectedIds()));
      // and a second card, so it is the listener that is alive, not a one-off
      const dp3 = await point('.board-box[data-box-id="d3"] .board-text');
      if (dp3) { await app.mouseMove(dp3.x, dp3.y); await app.mouseDown(dp3.x, dp3.y); await sleep(60); await app.mouseUp(dp3.x, dp3.y); await sleep(600); }
      ok(`[${T}] B4 the next press moves the selection to the third card`, (await selectedIds()).join() === 'd3', JSON.stringify(await selectedIds()));
    } catch (e) { ok(`[${T}] the scenario ran to the end`, false, String(e && e.message || e).slice(0, 200)); }
  }

  // C - INK's own path (glue-9): a board BORN by the preset wizard (From my pages) is a Deck; the deal lands in the Walk; the writer shows it as Open with the strip (no reload) and presses a card.
  try {
    await fresh('plateau', false);
    await q(`(() => { const p = window.wrizoCreateProject('Select C', 'creative'); window.__wosProject = p.id; window.wrizoCreateJournalPage({ id: 'wos-empty', text: 'Empty board', pageType: 'board', projectId: p.id, boxes: [], origin: 'project', source: 'page' });
      for (const [id, text] of [['wos-pg1', 'Mara at the window\\nShe watches the ferry light.'], ['wos-pg2', 'The blue cup\\nTheir mother.'], ['wos-pg3', 'Second horn']]) window.wrizoCreateJournalPage({ id, text, projectId: p.id, origin: 'project', source: 'page' }); window.wrizoFlushNow(); })()`);
    await q("location.hash = '#/page/wos-empty'"); await sleep(900);
    await click('.wz-strip [data-category="plan"]'); await sleep(700);
    await click(".wz-sections-preset[data-preset='from-my-pages']");
    await waitSoft("!!document.querySelector('.deck-wizard-dialog')", { label: 'preset wizard', timeout: 6000 });
    await click("[data-page-id='wos-pg3']"); await click("[data-page-id='wos-pg1']"); await click('.deck-wizard-deal'); await sleep(1200);
    const born = (await q('window.wrizoBoard()')).filter((b) => b.kind === 'text');
    ok('[Arbor] C0 the preset deal births two cards', born.length === 2, JSON.stringify(born.map((b) => b.text)));
    await waitSoft("!!document.querySelector('.walk-card')", { label: 'the Walk after the preset deal', timeout: 6000 }); await sleep(700);
    ok('[Arbor] C1 the preset-born board lands in the Walk', !!(await point('.walk-card')), 'no .walk-card');
    await showAs('open');
    await waitSoft("!!document.querySelector('.board-canvas')", { label: 'the canvas after Show as Open', timeout: 6000 }); await sleep(900);
    ok('[Arbor] C2 the preset-born board is now shown Open (the canvas is mounted)', !!(await point('.board-canvas')), 'no canvas');
    const cp2 = born[0] ? await point('[data-box-id="' + born[0].id + '"] .board-text') : null;
    if (cp2) { await app.mouseMove(cp2.x, cp2.y); await app.mouseDown(cp2.x, cp2.y); await sleep(60); await app.mouseUp(cp2.x, cp2.y); await sleep(600); }
    ok('[Arbor] C3 a press on a card of the preset-born board, shown Open from the Walk with no reload, SELECTS it', !!born[0] && (await selectedIds()).includes(born[0].id), JSON.stringify(await selectedIds()));
  } catch (e) { ok('[Arbor] section C ran to the end', false, String(e && e.message || e).slice(0, 200)); }
});

report('WALK-OPEN-SELECT');

function report(label) {
  for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
  const failed = checks.filter((c) => !c.pass);
  console.log(failed.length ? `\n${label} VERIFY: FAIL - ${failed.length}/${checks.length}` : `\n${label} VERIFY: PASS (${checks.length} checks)`);
  process.exit(failed.length ? 1 : 0);
}
