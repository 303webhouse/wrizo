// W4 "HELP ME CHOOSE" - THE DOM HALF (a box turn). The logic - the 26-row pick table, determinism, nothing stored, Q3's landing, the why lines - is help-choose-census.mjs's, browserless. This drives the real app:
//   DOOR   D1  it NEVER opens without a press (the Boards pop-out open, no panel in the DOM, no dialog)
//          D2  ONE row at the top of the Presets list, first after the heading; Arbor "Ask the librarian", Flux "RUN DIAGNOSTIC", Machina "Intake"
//   FLOW   F1  Q2's answers depend on Q1 (a novel -> 5, a screenplay -> 2, poems -> straight to Q3)
//          F2  the result is the table's: short story / events and pressure -> Three-Act (Short story) + Scene-Sequel; novel / events -> Three-Act + Fifteen Beats (Novel)
//          F3  Q3's three answers all land the same while the Walk is not shipped (every answer opens as Open), and the panel says nothing of a Walk
//   LAWS   L1  Esc closes it and focus returns to the door; L2 nothing is stored: localStorage is byte-identical after a full pass to the result; L3 the answers slide in <= 300 ms, and are CUTS at Ambiance 0
//   DEAL   B1  "Begin" opens the unborn board in the writer's CURRENT place (the same place params a preset carries) and DEALS the pick: short story -> Three-Act with the 6 cards of its short form, no question asked
//          B2  a pick whose deck still has a question (novel -> Three-Act) opens the wizard on that question; "Browse the shelves" opens the full library
//   DRESS  S1  Arbor: the olive panel, square, no blurred shadow; hover is brass         S2  Flux: bracket corners, the lime line fills by thirds, the orange bar on the result line
//          S3  Machina: a plain square panel in the theme's own tokens (Intake)
//
// Run (repo root; needs a box turn - node apps/desktop/scripts/box-take.mjs take <lane> <token>):  node scripts/harness/help-choose.mjs      HC_FRAMES=<dir> saves frames
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.HC_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const ED = '.forward-only-editor';

const boot = async (app, { theme = 'plateau', page = 'dark', dial = 50 } = {}) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    localStorage.setItem('wrizo-ambiance-dial', '${dial}'); localStorage.setItem('wrizo-theme', '${theme}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'hc-page', text: 'A first line to stand on.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(500);
  await app.evalJs("location.hash = '#/page/hc-page'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page', timeout: 12000 }).catch(() => {});
  await sleep(700);
};
const openBoards = async (app) => {
  await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="plan"]'); if (b) b.click(); })()`);
  await app.waitFor("!!document.querySelector('.wz-sections[data-kind=\"boards\"]')", { label: 'the Boards pop-out', timeout: 8000 }).catch(() => {});
  await sleep(300);
};
const door = (app) => app.evalJs(`(() => { const d = document.querySelector('[data-preset="help-me-choose"]'); if (!d) return null; const wrap = d.parentElement; const kids = [...wrap.children]; return { text: d.textContent.trim(), indexInPresets: kids.indexOf(d), firstAfterHeading: kids[1] === d, before: kids.length }; })()`);
const press = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return false; e.click(); return true; })()`);
const option = (app, id) => press(app, `.help-panel [data-help-option="${id}"]`);
const panelState = (app) => app.evalJs(`(() => { const p = document.querySelector('.help-panel'); if (!p) return null; return { variant: p.dataset.helpTheme, options: [...p.querySelectorAll('[data-help-option]')].map((o) => o.dataset.helpOption), text: p.innerText.replace(/\\s+/g, ' ').slice(0, 400), hasBegin: !!p.querySelector('[data-help-begin]'), hasAlt: !!p.querySelector('[data-help-alt]'), focus: document.activeElement ? document.activeElement.className + '|' + (document.activeElement.dataset.preset || '') : null, kids: p.querySelectorAll('.help-step').length }; })()`);
const store = (app) => app.evalJs("JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))");
const resultNames = (app) => app.evalJs(`(() => { const p = document.querySelector('.help-panel'); if (!p) return null; const b = p.querySelector('.help-book-title, .help-rline span, .help-q'); const al = p.querySelector('[data-help-alt]'); return { pick: (p.querySelector('.help-book-title') || p.querySelector('.help-rline span') || p.querySelector('.help-q') || {}).textContent || null, alt: al ? al.textContent.replace(/\\s+/g, ' ').trim() : null }; })()`);

await withHarness(async (app) => {
  // ======================================================= ARBOR - the door, the flow, the laws
  await boot(app, { theme: 'plateau', page: 'dark' });
  await openBoards(app);
  const noPanel = await app.evalJs("({ panel: !!document.querySelector('.help-panel'), dialogs: document.querySelectorAll('[role=\"dialog\"]').length })");
  ok('D1: it never opens without a press - the Boards pop-out is open and no help panel (nor any dialog) is in the DOM', !noPanel.panel && noPanel.dialogs === 0, JSON.stringify(noPanel));
  const d0 = await door(app);
  ok('D2 [Arbor]: ONE row at the top of the Presets list - first after the heading - reading "Ask the librarian"', !!d0 && d0.firstAfterHeading && d0.text === 'Ask the librarian', JSON.stringify(d0));
  const storeBefore = await store(app);

  await press(app, '[data-preset="help-me-choose"]');
  await app.waitFor("!!document.querySelector('.help-panel')", { label: 'the librarian', timeout: 6000 }).catch(() => {});
  await sleep(350);
  const q1s = await panelState(app);
  ok('F1 [Q1]: the first question offers the ten things you might be making', !!q1s && q1s.variant === 'librarian' && q1s.options.length === 10 && /What are you making/.test(q1s.text), JSON.stringify(q1s));
  await frame(app, 'arbor-dark-q1');
  await option(app, 'novel'); await sleep(350);
  const q2n = await panelState(app);
  await frame(app, 'arbor-dark-q2');
  await app.evalJs("document.querySelector('.help-back')?.click()"); await sleep(300);
  await option(app, 'screenplay'); await sleep(350);
  const q2s = await panelState(app);
  await app.evalJs("document.querySelector('.help-back')?.click()"); await sleep(300);
  await option(app, 'poems'); await sleep(350);
  const q2p = await panelState(app);
  ok('F1 [Q2 depends on Q1]: a novel -> 5 answers; a screenplay -> 2; poems have no second question (straight to "how much do you want to know")',
    !!q2n && q2n.options.length === 5 && !!q2s && q2s.options.length === 2 && !!q2p && q2p.options.length === 3 && /How much do you want to know/.test(q2p.text), JSON.stringify({ novel: q2n && q2n.options, screenplay: q2s && q2s.options, poems: q2p && q2p.options }));

  // novel -> events and pressure -> the shape
  await app.evalJs("document.querySelector('.help-back')?.click()"); await sleep(300);
  await app.evalJs("document.querySelector('.help-back')?.click()"); await sleep(300);
  await option(app, 'novel'); await sleep(300); await option(app, 'events-pressure'); await sleep(300);
  const q3 = await panelState(app);
  await frame(app, 'arbor-dark-q3');
  await option(app, 'shape'); await sleep(450);
  const r1 = await resultNames(app);
  await frame(app, 'arbor-dark-result');
  ok('F2 [novel / events and pressure]: the pick is Three-Act, the alternative the Fifteen Beats (Novel) - the table\'s row, each one press from dealing', !!r1 && /Three-Act/i.test(r1.pick || '') && /Fifteen|Feature/i.test(r1.alt || '') && (await panelState(app)).hasBegin && (await panelState(app)).hasAlt, JSON.stringify(r1));
  const storeDuring = await store(app);
  ok('L2: nothing is stored - localStorage is byte-identical after a full pass to the result (no key added, none changed)', storeBefore === storeDuring, storeBefore === storeDuring ? '' : 'differs');
  const stepAnim = await app.evalJs("(() => { const s = document.querySelector('.help-step'); return s ? { name: getComputedStyle(s).animationName, dur: getComputedStyle(s).animationDuration } : null; })()");
  ok('L3: the answers slide in <= 300 ms (the swipe grammar)', !!stepAnim && stepAnim.name === 'help-slide' && parseFloat(stepAnim.dur) <= 0.3, JSON.stringify(stepAnim));
  const dressA = await app.evalJs(`(() => { const p = document.querySelector('.help-panel'); const cs = getComputedStyle(p); const blurs = [...cs.boxShadow.matchAll(/(?:rgba?\\([^)]*\\)|#[0-9a-f]+)\\s+(-?[\\d.]+)px\\s+(-?[\\d.]+)px\\s+([\\d.]+)px/g)].map((m) => parseFloat(m[3])); return { bg: cs.backgroundImage.slice(0, 120), radius: cs.borderRadius, blurs, shadow: cs.boxShadow }; })()`);
  ok('S1 [Arbor]: the olive alcove - an olive gradient ground, square edges, and no blurred shadow (flat 1px edges only)', /rgb\(105, 115, 61\)/.test(dressA.bg) && parseFloat(dressA.radius) === 0 && dressA.blurs.every((b) => b === 0), JSON.stringify(dressA));

  // Q3: all three answers land the same while the Walk is not shipped
  const landings = [];
  for (const a of ['little', 'everything']) {
    await app.evalJs("document.querySelector('.help-back')?.click()"); await sleep(300);
    await option(app, a); await sleep(400);
    landings.push({ a, r: await resultNames(app), text: (await panelState(app)).text });
  }
  ok('F3: Q3\'s answers all land the same while the Walk is not shipped - "a little", "the shape" and "everything" each give the same pick and nothing mentions a Walk', landings.every((l) => l.r && l.r.pick === r1.pick && !/walk/i.test(l.text)), JSON.stringify(landings.map((l) => l.r)));

  // L1: Esc closes it and focus returns to the door
  await app.key('Escape').catch(() => {});
  await sleep(350);
  const afterEsc = await app.evalJs("({ panel: !!document.querySelector('.help-panel'), focus: document.activeElement ? (document.activeElement.dataset.preset || document.activeElement.className) : null })");
  ok('L1: Esc closes the panel and focus returns to the door that opened it', !afterEsc.panel && afterEsc.focus === 'help-me-choose', JSON.stringify(afterEsc));

  // ---- B1: short story / events and pressure -> "Begin" deals Three-Act (Short story) in the CURRENT place, asking nothing
  const presetUrl = await (async () => { await press(app, '.wz-sections-preset[data-preset="three-act"]'); await sleep(900); const h = await app.evalJs('location.hash'); await app.evalJs("location.hash = '#/page/hc-page'"); await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'back', timeout: 8000 }).catch(() => {}); await sleep(500); await openBoards(app); return h; })();
  await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
  await option(app, 'short-story'); await sleep(300); await option(app, 'events-pressure'); await sleep(300); await option(app, 'shape'); await sleep(450);
  await press(app, '[data-help-begin]');
  await sleep(1800);
  const wizardOpen = await app.evalJs("!!document.querySelector('.deck-wizard-dialog')");
  await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); await sleep(500);
  // the dealt board, read from storage: the newest board whose cards carry a Three-Act step (the address - deck=three-act&da=format:short-story - is spent the moment the deal births the board)
  const born = await app.evalJs(`(() => { const found = []; for (const k of Object.keys(localStorage)) { let v; try { v = JSON.parse(localStorage.getItem(k)); } catch { continue; } if (!Array.isArray(v)) continue;
    for (const e of v) if (e && e.pageType === 'board' && Array.isArray(e.boxes) && e.boxes.some((b) => b && b.deckStep && b.deckStep.deck === 'three-act')) found.push({ origin: e.origin || null, projectId: e.projectId || null, steps: e.boxes.filter((b) => b && b.deckStep && b.deckStep.deck === 'three-act').length, last: String(e.createdAt || '') }); }
    return found; })()`);
  const presetOrigin = (String(presetUrl).match(/origin=(\w+)/) || [])[1] || null;
  const presetBinder = (String(presetUrl).match(/binder=([\w-]+)/) || [])[1] || null;
  const dealt = born.find((b) => b.steps === 6) || null;
  ok('B1: "Begin" on short story / events and pressure DEALS Three-Act (Short story) - its 6 cards, no wizard asked (it deals at once) - in the writer\'s CURRENT place (the same origin / set a preset carries)',
    !!dealt && !wizardOpen && dealt.origin === presetOrigin && (dealt.projectId || null) === presetBinder, JSON.stringify({ born, presetUrl, wizardOpen, presetOrigin, presetBinder }));
  await frame(app, 'arbor-dark-dealt-short-story');

  // ---- B2: novel / events -> Three-Act still asks Novel vs Novella; Browse opens the library
  await app.evalJs("location.hash = '#/page/hc-page'"); await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'back', timeout: 8000 }).catch(() => {}); await sleep(500);
  await openBoards(app);
  await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
  await option(app, 'novel'); await sleep(300); await option(app, 'events-pressure'); await sleep(300); await option(app, 'little'); await sleep(450);
  await press(app, '[data-help-begin]'); await sleep(1500);
  const asks = await app.evalJs("({ dialog: !!document.querySelector('.deck-wizard-dialog'), opts: [...document.querySelectorAll('.deck-wizard-option-btn')].map((b) => b.dataset.optionId), url: location.hash })");
  ok('B2: a pick whose deck still has a question (novel -> Three-Act) opens the wizard on THAT question (novel / novella / short story) - the deck asks its own', asks.dialog && asks.opts.join(',') === 'novel,novella,short-story' && /deck=three-act/.test(asks.url) && !/da=/.test(asks.url), JSON.stringify(asks));
  await app.evalJs("location.hash = '#/page/hc-page'"); await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'back', timeout: 8000 }).catch(() => {}); await sleep(500);
  await openBoards(app);
  await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
  await press(app, '[data-help-browse]'); await sleep(1500);
  const lib = await app.evalJs("({ dialog: !!document.querySelector('.deck-wizard-dialog'), rows: document.querySelectorAll('.deck-wizard-deck-row').length })");
  ok('B2: "Browse the shelves" opens the full library (the deck wizard on its list of decks)', lib.dialog && lib.rows >= 10, JSON.stringify(lib));

  // ---- Ambiance 0: the slide is a cut
  await boot(app, { theme: 'plateau', page: 'dark', dial: 0 });
  await openBoards(app);
  await press(app, '[data-preset="help-me-choose"]'); await sleep(400);
  await option(app, 'novel'); await sleep(300);
  const still = await app.evalJs("(() => { const s = document.querySelector('.help-step'); return s ? { name: getComputedStyle(s).animationName, still: s.dataset.still } : null; })()");
  ok('L3 [Ambiance 0]: the answers CUT - no slide (animation none, the still state)', !!still && still.name === 'none' && still.still === 'true', JSON.stringify(still));

  // ---- Arbor light, both states (frames) + hover brass
  await boot(app, { theme: 'plateau', page: 'light' });
  await openBoards(app);
  await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
  await option(app, 'novel'); await sleep(450);
  const tileRect = await app.evalJs("(() => { const r = document.querySelector('.help-panel [data-help-option=\"world-system\"]').getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
  await app.mouseMove(tileRect.x, tileRect.y); await sleep(450);
  const brass = await app.evalJs(`(() => { const t = document.querySelector('.help-panel [data-help-option="world-system"]'); const probe = document.createElement('i'); probe.style.color = 'var(--brass)'; document.body.appendChild(probe); const want = getComputedStyle(probe).color; probe.remove(); return { want, hovered: t.matches(':hover'), shadow: getComputedStyle(t).boxShadow, color: getComputedStyle(t).color }; })()`);
  ok('S1 [Arbor]: a tile under a REAL pointer turns brass (the ring and the label)', brass.hovered && brass.shadow.includes(brass.want) && brass.color === brass.want, JSON.stringify(brass));
  await frame(app, 'arbor-light-q2');
  await option(app, 'world-system'); await sleep(350); await option(app, 'shape'); await sleep(450);
  await frame(app, 'arbor-light-result');

  // ======================================================= FLUX - RUN DIAGNOSTIC
  for (const page of ['dark', 'light']) {
    await boot(app, { theme: 'flux', page });
    await openBoards(app);
    const df = await door(app);
    if (page === 'dark') ok('D2 [Flux]: the top row of the Presets list reads "RUN DIAGNOSTIC"', !!df && df.firstAfterHeading && df.text === 'RUN DIAGNOSTIC', JSON.stringify(df));
    await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
    const prog = [];
    const bars = () => app.evalJs("[...document.querySelectorAll('.help-progress i')].map((i) => i.dataset.on)");
    prog.push((await bars()).filter((v) => v === 'true').length);
    await frame(app, `flux-${page}-q1`);
    await option(app, 'novel'); await sleep(350); prog.push((await bars()).filter((v) => v === 'true').length);
    await option(app, 'events-pressure'); await sleep(350); prog.push((await bars()).filter((v) => v === 'true').length);
    await frame(app, `flux-${page}-q3`);
    await option(app, 'shape'); await sleep(450); prog.push((await bars()).filter((v) => v === 'true').length);
    await frame(app, `flux-${page}-result`);
    const fx = await app.evalJs(`(() => { const p = document.querySelector('.help-panel'); const cs = getComputedStyle(p); const rl = document.querySelector('.help-resultlines'); const probe = document.createElement('i'); probe.style.color = 'var(--orange)'; document.body.appendChild(probe); const orange = getComputedStyle(probe).color; probe.remove();
      return { corners: p.querySelectorAll('.help-br').length, radius: cs.borderRadius, shadow: cs.boxShadow, bar: rl ? getComputedStyle(rl).borderLeftColor + ' ' + getComputedStyle(rl).borderLeftWidth : null, orange, load: [...p.querySelectorAll('.help-load')].map((b) => b.textContent.trim()), browse: (p.querySelector('.help-browse') || {}).textContent, kicker: (p.querySelector('.help-kicker') || {}).textContent }; })()`);
    ok(`S2 [Flux ${page}]: the terminal panel - four bracket corners, square, no shadow; "DIAGNOSTIC v1"; [LOAD] on the result and the alt; "BROWSE ALL STACKS"; the thin ORANGE bar on the result line`,
      fx.corners === 4 && parseFloat(fx.radius) === 0 && fx.shadow === 'none' && fx.bar === `${fx.orange} 2px` && fx.load.join('|') === '[LOAD]|[LOAD]' && /BROWSE ALL STACKS/i.test(fx.browse || '') && /DIAGNOSTIC v1/i.test(fx.kicker || ''), JSON.stringify(fx));
    ok(`S2 [Flux ${page}]: the lime progress line fills by THIRDS - 0, 1, 2, 3 segments as the three answers land`, prog.join(',') === '0,1,2,3', prog.join(','));
  }

  // ======================================================= MACHINA - Intake (plain)
  await boot(app, { theme: 'machina', page: 'dark' });
  await openBoards(app);
  const dm = await door(app);
  ok('D2 [Machina]: the top row of the Presets list reads "Intake"', !!dm && dm.firstAfterHeading && dm.text === 'Intake', JSON.stringify(dm));
  await press(app, '[data-preset="help-me-choose"]'); await sleep(450);
  await frame(app, 'machina-q1');
  await option(app, 'proposal'); await sleep(350); await option(app, 'problem-solution'); await sleep(350); await option(app, 'everything'); await sleep(450);
  await frame(app, 'machina-result');
  const pm = await app.evalJs(`(() => { const p = document.querySelector('.help-panel'); const cs = getComputedStyle(p); const probe = document.createElement('i'); probe.style.color = 'var(--chrome-surface)'; document.body.appendChild(probe); const chrome = getComputedStyle(probe).backgroundColor; const c = getComputedStyle(probe).color; probe.remove(); return { variant: p.dataset.helpTheme, bg: cs.backgroundColor, chrome: c, radius: cs.borderRadius, shadow: cs.boxShadow, text: p.innerText.replace(/\\s+/g, ' ').slice(0, 200) }; })()`);
  ok('S3 [Machina]: a plain square panel in the theme\'s own tokens (the chrome surface), no shadow - the same questions; the result is the table\'s Business Proposal', pm.variant === 'plain' && pm.bg === pm.chrome && parseFloat(pm.radius) === 0 && pm.shadow === 'none' && /Business Proposal/i.test(pm.text), JSON.stringify(pm));
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nHELP-CHOOSE VERIFY: PASS (${checks.length} checks)` : `\nHELP-CHOOSE VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
