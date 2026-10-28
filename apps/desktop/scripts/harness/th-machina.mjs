// TH-MACHINA, THE BOX-TURN HALF (step 4 of the Oct 21 build queue; docs/plans/machina-build.md §4; Fable's Phase B GO, Oct 23). The browserless half (th-machina-source.mjs) proves the
// SOURCE; this drives the real app and reads COMPUTED styles and the live DOM, so a rule the stylesheet states but the cascade loses cannot pass.
//
//   SP  splash     under Machina the splash draws the WRIZ[] mark, twenty units that fill and close orange, and NO loading line (the status region is absent); Arbor still has its line
//   RN  Run        the strip is mounted on the framed Draft page under Machina (not under Arbor); 20 units; the lap's own count ("5 / 10"); ten finished units are the live gray, the rest the
//                  line tone; ONE notch, 3 x 16 px, orange
//   CL  celebrate  crossing the goal closes the whole strip orange ONCE; NEUTRAL draws eight sparks, COOL draws none; Ambiance 0 (the still state) draws none and has no colour transition
//   WB  way back   leaving the page draws the return chip with the "◂" glyph; GRAY under COOL, ORANGE under NEUTRAL
//   CA  CAST       ONE Controls row "Cast" with Cool | Neutral under Machina; pressing Neutral flips data-cast on <html>; under Arbor the row is absent
//   LX  words      the mode strip reads Sprint / Build / Edit / Finalize on screen
//   PP  primacy    PAGE IS PRIMARY: the writing surface's rect is identical with the Run strip on and off, and the editor never unmounts across a celebration
//
// Run (repo root or apps/desktop; needs a box turn - node apps/desktop/scripts/box-take.mjs take <lane> <token>):  node scripts/harness/th-machina.mjs     MA_FRAMES=<dir> saves frames
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.MA_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
const ED = '.forward-only-editor';
const words = (n) => Array.from({ length: n }, (_, i) => ['rain', 'wire', 'neon', 'relay', 'ash'][i % 5]).join(' ') + ' ';

// resolve a token to the browser's own computed colour, in the cascade of the live document
const RESOLVE = `window.__wzResolve = (v) => { const p = document.createElement('i'); p.style.color = 'var(' + v + ')'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; }`;
const token = (app, v) => app.evalJs(`(${RESOLVE}, window.__wzResolve(${JSON.stringify(v)}))`);

const boot = async (app, { theme = 'machina', cast = 'cool', page = 'dark', dial = 50, goal = 10, instruments = true, splash = false, style = 'rhizome' } = {}) => {
  await app.emulateDpr(1, 1400, 900);   // framed (the Run strip lives on the framed desk, like Glitch)
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');
    ${splash ? '' : "localStorage.setItem('wrizo-splash-hold','50');"}
    localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: '${style}', instrumentsOn: ${instruments}, typewriter: false }));
    localStorage.setItem('wrizo-writing-goal-lines', JSON.stringify({ n: ${goal}, unit: 'words' }));
    localStorage.setItem('wrizo-ambiance-dial', '${dial}'); localStorage.setItem('wrizo-theme', '${theme}'); localStorage.setItem('wrizo-machina-cast', '${cast}');`);
  await app.reload();
  if (splash) return;
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' }); window.wrizoCast && window.wrizoCast.set('${cast}')`);
};
const openPage = async (app, id, text) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
  await sleep(500);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const up = await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page', timeout: 12000 }).then(() => true, () => false);
  await sleep(700);
  return up;
};
const run = (app) => app.evalJs(`(() => { const r = document.querySelector('.machina-run'); if (!r) return null; const units = [...r.querySelectorAll('.machina-run-strip > i')];
  const here = r.querySelectorAll('.machina-run-strip > i.here');
  const note = here[0] ? getComputedStyle(here[0], '::after') : null;
  return { units: units.length, on: units.filter((u) => u.classList.contains('on')).length, here: here.length, closed: r.dataset.closed, still: r.dataset.still, count: (r.querySelector('.machina-run-count') || {}).textContent,
    sparks: r.querySelectorAll('.machina-run-burst > span').length,
    notch: note ? { w: note.width, h: note.height, bg: note.backgroundColor } : null,
    bgFirst: units[0] ? getComputedStyle(units[0]).backgroundColor : null, bgLast: units.length ? getComputedStyle(units[units.length - 1]).backgroundColor : null,
    transition: units[0] ? getComputedStyle(units[0]).transitionDuration : null }; })()`);
// the editor's rect AND the paper's (.mode-page): the editor's height follows its text, the paper's is the fixed frame
const rectOf = (app) => app.evalJs(`(() => { const out = []; for (const sel of ['${ED}', '.mode-page']) { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); out.push([r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10).join(',')); } return out.join(' | '); })()`);
// watch the strip for a celebration: the max sparks ever seen, whether it ever closed, how long it stayed closed
const watchCelebration = async (app, ms) => {
  let maxSparks = 0, closedAt = null, openAt = null, allOrange = false;
  const orange = await token(app, '--orange');
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const r = await run(app);
    if (r) {
      maxSparks = Math.max(maxSparks, r.sparks);
      if (r.closed === 'true') { if (closedAt === null) closedAt = Date.now() - t0; if (r.bgFirst === orange && r.bgLast === orange) allOrange = true; }
      else if (closedAt !== null && openAt === null) openAt = Date.now() - t0;
    }
    await sleep(60);
  }
  return { maxSparks, closedAt, openAt, allOrange };
};

await withHarness(async (app) => {
  // ======================================================= SP - the splash (a real launch, not the held one)
  await boot(app, { theme: 'machina', splash: true });
  const seen = await app.waitFor("!!document.querySelector('.wz-splash[data-splash-theme=\"machina\"] .wz-splash-machina')", { label: 'the Machina splash', timeout: 8000 }).then(() => true, () => false);
  const sp = seen ? await app.evalJs(`(() => ({ units: document.querySelectorAll('.wz-splash .ma-unit').length, loading: document.querySelectorAll('.wz-splash .wz-splash-loading').length, word: (document.querySelector('.ma-word') || {}).textContent, ends: [...document.querySelectorAll('.ma-end')].map((e) => e.textContent) }))()`) : null;
  ok('SP1: the Machina splash draws the WRIZ mark, IDEAS / FINAL DRAFT, and twenty units - and NO loading line (the Run strip is the readout)',
    !!sp && sp.units === 20 && sp.loading === 0 && sp.word === 'WRIZ' && sp.ends.join('|') === 'IDEAS|FINAL DRAFT', JSON.stringify(sp));
  await frame(app, 'splash-early');
  await sleep(1800);
  await frame(app, 'splash-filling');
  const closedSplash = await app.waitFor("!!document.querySelector('.wz-splash .ma-strip.closed')", { label: 'the splash strip closing', timeout: 9000 }).then(() => true, () => false);
  const lit = await app.evalJs("document.querySelectorAll('.wz-splash .ma-unit.on').length");
  ok('SP2: the splash strip fills to all twenty units and closes orange once', closedSplash && lit === 20, JSON.stringify({ closedSplash, lit }));
  await frame(app, 'splash-closed');
  const gone = await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 12000 }).then(() => true, () => false);
  ok('SP3: the splash ends by itself after the strip closes (the floor trigger fires)', gone);
  await app.evalJs("window.wrizoTheme.set('plateau')");
  await app.evalJs("window.wrizoSplash && window.wrizoSplash.reset()");

  // ======================================================= RN - the Run strip, COOL
  await boot(app, { cast: 'cool', page: 'dark', dial: 100, goal: 10 });
  const up = await openPage(app, 'ma1', words(15));
  const r0 = await run(app);
  ok('RN1 (premise): a framed Machina Draft page with Progress on, the style set to Run and a goal draws the strip', up && !!r0, JSON.stringify(r0));
  const live = await token(app, '--signal-live'), line = await token(app, '--ink-border'), orange = await token(app, '--orange');
  ok('RN2: twenty units; the lap reads "5 / 10" (15 words toward a 10-word goal); ten finished units; exactly one notch',
    !!r0 && r0.units === 20 && r0.count === '5 / 10' && r0.on === 10 && r0.here === 1, JSON.stringify(r0));
  ok('RN3: the notch is 3 x 16 px and ORANGE; a finished unit is the live gray, an unfinished unit the line tone (computed)',
    !!r0 && !!r0.notch && r0.notch.w === '3px' && r0.notch.h === '16px' && r0.notch.bg === orange && r0.bgFirst === live && r0.bgLast === line, JSON.stringify({ notch: r0 && r0.notch, first: r0 && r0.bgFirst, last: r0 && r0.bgLast, live, line, orange }));
  await frame(app, 'run-cool-dark');
  const rectWith = await rectOf(app);
  // OR1 - orange is scarce: no Arbor ember on the page (the resting and focused halos), the goal glow dialled down and not orange, the celebration flare not drawn
  // a colour reads as warm when red leads blue by 30 / 255; computed gradients may serialize as rgb() or color(srgb r g b), so both are parsed - and the parse count is asserted (a blind scan passes)
  const warm = await app.evalJs(`(() => { const seen = { n: 0 }; const hot = (s) => { let any = false; for (const m of String(s).matchAll(/rgba?\\(([^)]+)\\)/g)) { const [r, g, b] = m[1].split(',').map((x) => parseFloat(x)); seen.n += 1; if (r - b > 30) any = true; }
      for (const m of String(s).matchAll(/color\\(srgb ([\\d.]+) ([\\d.]+) ([\\d.]+)/g)) { seen.n += 1; if ((parseFloat(m[1]) - parseFloat(m[3])) * 255 > 30) any = true; } return any; };
    const page = document.querySelector('.mode-page'); const glow = document.querySelector('.wz-goal-glow'); const flare = document.querySelector('.desk-frame-goalflare');
    page.classList.add('focused'); const focused = getComputedStyle(page).boxShadow; page.classList.remove('focused');
    const out = { rest: getComputedStyle(page).boxShadow, focused, restHot: hot(getComputedStyle(page).boxShadow), focusedHot: hot(focused), cap: getComputedStyle(document.documentElement).getPropertyValue('--goal-glow-cap').trim(),
      glowHot: glow ? hot(getComputedStyle(glow).backgroundImage) : null, flare: flare ? getComputedStyle(flare).display : 'absent' }; out.parsed = seen.n; return out; })()`);
  ok('OR1: no Arbor ember on the page - the resting and focused halos are not warm, the goal glow is dialled to .16 and is not orange, and the celebration flare is not drawn (and the scan parsed colours: it is not blind)',
    !!warm && warm.parsed >= 4 && !warm.restHot && !warm.focusedHot && warm.cap === '.16' && warm.glowHot === false && (warm.flare === 'none' || warm.flare === 'absent'), JSON.stringify(warm));

  // ======================================================= CL - the celebration, COOL: closes orange, NO sparks
  await app.evalJs(`document.querySelector('${ED}').focus()`);
  await app.key('End').catch(() => {});
  const watchCool = watchCelebration(app, 2600);
  await app.typeKeys(' ' + words(6));
  const wc = await watchCool;
  ok('CL1 [COOL]: crossing the goal closes the WHOLE strip orange, then the lap resets - and COOL draws NO sparks', wc.allOrange && wc.closedAt !== null && wc.openAt !== null && wc.maxSparks === 0, JSON.stringify(wc));
  const after = await run(app);
  ok('CL2: after the celebration the next lap reads from the remainder (21 words: "1 / 10")', !!after && after.closed === 'false' && after.count === '1 / 10', JSON.stringify(after));
  const edUp = await app.evalJs(`!!document.querySelector('${ED}')`);
  ok('PP1: the editor never unmounted across the celebration (PAGE IS PRIMARY)', edUp);

  // ======================================================= CA - the CAST row (the Controls panel lives on the page's own strip)
  const opened = await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="settings"]'); if (!b) return false; b.click(); return true; })()`);
  await sleep(700);
  const row = await app.evalJs(`(() => { const r = document.querySelectorAll('.wz-cascade-cast'); return { rows: r.length, label: r[0] ? r[0].querySelector('span').textContent : null, opts: r[0] ? [...r[0].querySelectorAll('button')].map((b) => b.textContent) : [], pressed: r[0] ? [...r[0].querySelectorAll('button')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.textContent) : [] }; })()`);
  ok('CA1: Controls carries ONE "Cast" row, Cool | Neutral, with Cool pressed (the default)', opened && row.rows === 1 && row.label === 'Cast' && row.opts.join('|') === 'Cool|Neutral' && row.pressed.join('|') === 'Cool', JSON.stringify({ opened, row }));
  await frame(app, 'controls-cool');
  await app.evalJs(`(() => { const b = document.querySelector('.wz-cascade-cast [data-cast-option="neutral"]'); if (b) b.click(); })()`);
  await sleep(400);
  const flipped = await app.evalJs("({ attr: document.documentElement.getAttribute('data-cast'), stored: localStorage.getItem('wrizo-machina-cast') })");
  ok('CA2: pressing Neutral flips data-cast on <html> and stores it', flipped.attr === 'neutral' && flipped.stored === 'neutral', JSON.stringify(flipped));
  await frame(app, 'controls-neutral');

  // ======================================================= WB - the way-back glyph. The return chip lives on the DeskRail, which retires on a FRAMED surface (DeskRail.tsx, CD1 S4) - so this leg runs at the
  // legacy width (< 1100 px), where the rail is the return door: leave the page for the Journal board and read the chip under each cast.
  await app.emulateDpr(1, 1000, 800);
  await app.evalJs("location.hash = '#/'");
  await sleep(500);
  await app.evalJs("location.hash = '#/page/ma1'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page at the legacy width', timeout: 12000 }).catch(() => {});
  await sleep(900);
  await app.evalJs("location.hash = '#/journal'");
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'the Journal board', timeout: 12000 }).catch(() => {});
  await sleep(800);
  const wbChip = () => app.evalJs(`(() => { const b = document.querySelector('.desk-rail-wayback'); if (!b) return null; return { glyph: (b.querySelector('.desk-rail-glyph') || {}).textContent, color: getComputedStyle(b).color }; })()`);
  const wbN = await wbChip();
  const orangeN = await token(app, '--orange');
  ok('WB1 [NEUTRAL]: the return chip draws "◂" in the one ORANGE accent', !!wbN && wbN.glyph === '◂' && wbN.color === orangeN, JSON.stringify({ wbN, orangeN }));
  await frame(app, 'journal-neutral-dark');
  await app.evalJs("window.wrizoCast.set('cool')");
  await sleep(300);
  const wbCool = await wbChip();
  const mid = await token(app, '--text-mid');
  ok('WB2 [COOL]: the same chip is the quiet gray (--text-mid), not Arbor\'s ember', !!wbCool && wbCool.glyph === '◂' && wbCool.color === mid, JSON.stringify({ wbCool, mid }));
  await frame(app, 'journal-cool-dark');
  await app.evalJs("window.wrizoCast.set('neutral')");
  await app.emulateDpr(1, 1400, 900);
  await sleep(500);

  // ======================================================= CL under NEUTRAL: eight sparks
  await app.evalJs("location.hash = '#/page/ma1'");
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'back on the page', timeout: 8000 }).catch(() => {});
  await sleep(700);
  await frame(app, 'run-neutral-dark');
  await app.evalJs(`document.querySelector('${ED}').focus()`);
  await app.key('End').catch(() => {});
  const watchN = watchCelebration(app, 2600);
  await app.typeKeys(' ' + words(10));
  const wn = await watchN;
  ok('CL3 [NEUTRAL]: crossing the goal closes the strip orange AND draws the eight sparks', wn.allOrange && wn.maxSparks === 8, JSON.stringify(wn));
  await frame(app, 'run-neutral-after');

  // ======================================================= CL under Ambiance 0: the still state
  await boot(app, { cast: 'neutral', dial: 0, goal: 10 });
  await openPage(app, 'ma2', words(8));
  const still0 = await run(app);
  await app.evalJs(`document.querySelector('${ED}').focus()`);
  await app.key('End').catch(() => {});
  const watchS = watchCelebration(app, 2200);
  await app.typeKeys(' ' + words(4));
  const ws = await watchS;
  ok('CL4 [Ambiance 0]: the still state - the strip turns orange with NO sparks and no colour transition', !!still0 && still0.still === 'true' && parseFloat(still0.transition) === 0 && ws.maxSparks === 0 && ws.closedAt !== null, JSON.stringify({ still0: still0 && { still: still0.still, transition: still0.transition }, ws }));

  // ======================================================= LT - the light page, both casts: the paper is the foundations' own, the Run strip still reads (frames for the clear)
  for (const cast of ['cool', 'neutral']) {
    await boot(app, { cast, page: 'light', dial: 50, goal: 10 });
    await openPage(app, `ma-l-${cast}`, words(15));
    const paper = await app.evalJs("getComputedStyle(document.querySelector('.mode-page')).backgroundColor");
    const paperWant = await token(app, '--paper');
    const rl = await run(app);
    ok(`LT [${cast}]: on the light page the paper is the cell's own and the Run strip still draws 20 units with its notch`, paper === paperWant && !!rl && rl.units === 20 && rl.here === 1, JSON.stringify({ paper, paperWant, units: rl && rl.units }));
    const vig = await app.evalJs("(() => { const c = getComputedStyle(document.body, '::after'); return { z: c.zIndex, content: c.content, pos: c.position }; })()");
    ok(`LT [${cast}]: the vignette sits BEHIND the content (body::after z-index -1) - no grey bands over the empty light page (the control: it has a real pseudo-element, so the read is not blind)`, vig.z === '-1' && vig.content !== 'none', JSON.stringify(vig));
    await frame(app, `run-${cast}-light`);
  }

  // ======================================================= ON - Run is the ONLY progress instrument: on the DEFAULT style ("bar") Machina draws Run and no Arbor bar / orange WORDS; Arbor (the control) still draws its bar
  for (const mode of ['drafting', 'freewrite']) {
    await boot(app, { cast: 'cool', dial: 50, goal: 10, style: 'bar' });
    await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: `ma-on-${mode}`, text: words(15), createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })}); localStorage.setItem('wrizo-mode-page-ma-on-${mode}', '${mode}')`);
    await sleep(500);
    await app.evalJs(`location.hash = '#/page/ma-on-${mode}'`);
    await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page', timeout: 12000 }).catch(() => {});
    await sleep(900);
    const only = await app.evalJs("({ run: !!document.querySelector('.machina-run'), tracks: document.querySelectorAll('.desk-frame-instrument .mode-ptrack').length, metric: [...document.querySelectorAll('.desk-frame-instrument .mode-pmetric')].map((e) => e.textContent).join('|'), lane: !!document.querySelector('.desk-frame-instrument') })");
    if (mode === 'drafting') await frame(app, 'run-default-style');
    await app.evalJs("window.wrizoTheme.set('plateau')"); await sleep(600);
    const ctl = await app.evalJs("({ tracks: document.querySelectorAll('.desk-frame-instrument .mode-ptrack').length, lane: !!document.querySelector('.desk-frame-instrument') })");
    ok(`ON [${mode}]: on the default style Machina draws Run and NOT Arbor's thin bar or its orange WORDS; the control (Arbor, same page) still draws the bar, so the probe is not blind`,
      only.lane && only.tracks === 0 && only.metric === '' && (mode === 'drafting' ? only.run : true) && ctl.tracks === 1, JSON.stringify({ only, ctl }));
  }

  // ======================================================= SV - Oct 24 (Nick, train #7): the Sprint page text is READABLE, and FINALIZE / PLAN are plain at rest
  // Sprint (Free Write) hands the editor a PEN ink, which used to be the raw #1a0f06 on the dark page (1.06:1). Computed contrast of the editor's text against the page's own paper, Sprint AND Build, both casts, both page tones: >= 13.9:1.
  const rgbOf = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ''); return m ? m[1].split(',').slice(0, 3).map((x) => parseFloat(x)) : null; };
  const relLum = ([r, g, b]) => { const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const contrast = (a, b) => { const [hi, lo] = [relLum(a), relLum(b)].sort((p, q) => q - p); return (hi + 0.05) / (lo + 0.05); };
  const clickTab = (label) => app.evalJs(`(() => { const t = [...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent.trim() === ${JSON.stringify(label)}); if (!t) return false; t.click(); return true; })()`);
  const sv = [];
  for (const cast of ['cool', 'neutral']) {
    for (const tone of ['dark', 'light']) {
      await boot(app, { cast, page: tone, dial: 50, goal: 10 });
      await openPage(app, `ma-sv-${cast}-${tone}`, words(12));
      for (const mode of ['Sprint', 'Build']) {
        const clicked = await clickTab(mode);
        await app.waitFor(`!!document.querySelector('${ED}')`, { label: `${mode} editor`, timeout: 8000 }).catch(() => {});
        await sleep(600);
        const r = await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); const pg = document.querySelector('.mode-page'); if (!ed || !pg) return null; return { text: getComputedStyle(ed).color, paper: getComputedStyle(pg).backgroundColor, pen: ed.style.color || null, tab: [...document.querySelectorAll('.desk-mode-tab.active')].map((b) => b.textContent.trim()).join('|') }; })()`);
        const ratioV = r && rgbOf(r.text) && rgbOf(r.paper) ? contrast(rgbOf(r.text), rgbOf(r.paper)) : 0;
        sv.push({ cast, tone, mode, ratio: Math.round(ratioV * 100) / 100 });
        ok(`SV [${cast}/${tone}, ${mode}]: the editor's text is >= 13.9:1 against the page's own paper (computed ${ratioV.toFixed(2)}:1) - the active mode really is ${mode}`, clicked && !!r && r.tab === mode && ratioV >= 13.9, JSON.stringify(r));
        if (mode === 'Sprint') await frame(app, `sprint-${cast}-${tone}`);
      }
    }
  }
  // FINALIZE and the PLAN door at rest: --text-mid, in both casts (not orange)
  for (const cast of ['cool', 'neutral']) {
    await boot(app, { cast, page: 'dark', dial: 50, goal: 10 });
    await openPage(app, `ma-sv2-${cast}`, words(12));
    const mid = await token(app, '--text-mid');
    const orangeT = await token(app, '--orange');
    const cols = await app.evalJs(`(() => ({ finalize: (document.querySelector('.desk-mode-tab[data-mode-key="publish"]') ? getComputedStyle(document.querySelector('.desk-mode-tab[data-mode-key="publish"]')).color : null), build: getComputedStyle([...document.querySelectorAll('.desk-mode-tab')].find((b) => b.textContent.trim() === 'Edit') || document.body).color, plan: (document.querySelector('.sprint-nav .page-plan-door') ? getComputedStyle(document.querySelector('.sprint-nav .page-plan-door')).color : null) }))()`);
    ok(`SV [${cast}]: FINALIZE and the PLAN door are plain at rest - the same --text-mid as the other modes, never the orange`, cols.finalize === mid && cols.plan === mid && cols.build === mid && cols.finalize !== orangeT && cols.plan !== orangeT, JSON.stringify({ cols, mid, orangeT }));
    if (cast === 'neutral') await frame(app, 'modes-plain-neutral');
  }

  // ======================================================= LX - the words on screen; PP - the page does not move
  await boot(app, { cast: 'cool', dial: 50, goal: 10 });
  await openPage(app, 'ma3', words(15));
  const tabs = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].map((b) => b.textContent.trim())");
  ok('LX1: the mode strip reads Sprint / Build / Edit / Finalize on screen', ['Sprint', 'Build', 'Edit', 'Finalize'].every((w) => tabs.includes(w)), JSON.stringify(tabs));
  ok('LX2: the Workshop tab is absent from the mode strip under Machina (hidden in every theme until it is built - Nick, Oct 23)', !tabs.includes('Workshop'), JSON.stringify(tabs));
  const withRun = await rectOf(app);
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: 'rhizome', instrumentsOn: false, typewriter: false }))`);
  await app.reload();
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page after a reload', timeout: 12000 }).catch(() => {});
  await sleep(900);
  const noRun = await run(app);
  const withoutRun = await rectOf(app);
  ok('PP2: PAGE IS PRIMARY - the writing surface\'s rect is identical with the Run strip on and off (the strip rides the instrument lane, it never displaces)', noRun === null && !!withRun && withRun === withoutRun, JSON.stringify({ withRun, withoutRun, noRun }));

  // ======================================================= PK - the picker card: present in the arc's order, locked while it is not the current theme (the unlock table decides; no server here = no note), current when chosen
  const cardRead = () => app.evalJs(`(() => [...document.querySelectorAll('.wz-theme-card')].map((c) => ({ name: c.querySelector('.wz-theme-wm')?.textContent ?? null, locked: c.classList.contains('locked'), disabled: c.disabled, pressed: c.getAttribute('aria-pressed'), note: c.querySelector('.wz-theme-note')?.textContent ?? null, units: c.querySelectorAll('.wz-theme-plate-run > i').length, notch: !!c.querySelector('.wz-theme-plate-notch') })))()`);
  // FN - LOAD-ON-CHOOSE, proved in the browser (Fable, Oct 24): under Arbor nothing of IBM Plex / Atkinson is even DECLARED at boot (no face in document.fonts, no font request in the resource timeline); choosing Machina declares and loads them
  const fontState = () => app.evalJs(`(() => { const faces = [...document.fonts].filter((f) => /IBM Plex|Atkinson Hyperlegible|Source Sans 3/.test(f.family)); const res = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /ibm-plex|atkinson|source-sans/i.test(n));   // DRIVER (TOOLS #10 item 10): Machina's default writing face, Source Sans 3, is one of the families this probe follows
    return { declared: [...new Set(faces.map((f) => f.family.replace(/["']/g, '').replace(/ Variable$/, '')))].sort(), loaded: [...new Set(faces.filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '').replace(/ Variable$/, '')))].sort(), requests: res.length }; })()`);
  await boot(app, { theme: 'plateau', goal: 10 });
  await openPage(app, 'ma-pk', words(5));
  await sleep(600);
  const fnArbor = await fontState();
  ok('FN1: under Arbor, at boot, NO IBM Plex / Atkinson face is declared or loaded and no font request was made - Machina\'s faces are not in the eager set (load-on-choose)', fnArbor.declared.length === 0 && fnArbor.loaded.length === 0 && fnArbor.requests === 0, JSON.stringify(fnArbor));
  await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="theme"]'); if (b) b.click(); })()`);
  await app.waitFor("!!document.querySelector('.wz-theme-cards')", { label: 'the picker', timeout: 8000 }).catch(() => {});
  await sleep(300);
  const pkA = await cardRead();
  const mA = pkA.find((c) => c.name === 'Machina');
  ok('PK1: under Arbor the picker lists Arbor, Machina, Flux in the arc\'s order; the Machina card draws its 20-unit Run plate and notch, and (no unlock data reachable) reads LOCKED with no guessed count',
    pkA.map((c) => c.name).join(',') === 'Arbor,Machina,Flux' && !!mA && mA.locked && mA.disabled && mA.note === null && mA.units === 20 && mA.notch, JSON.stringify(pkA));
  await frame(app, 'picker-arbor');
  await boot(app, { theme: 'machina', goal: 10 });
  await openPage(app, 'ma-pk2', words(5));
  let fnMachina = await fontState();
  // ---- PARKED - SUPERSEDED by TOOLS #10 item 10 (Nick, Oct 24: Machina's default writing face is Source Sans 3). The ORIGINAL waited for, and required, IBM Plex Serif - the prose slot - to be LOADED; the prose slot is Source Sans 3 now, so
  // Plex Serif is still declared (the theme still registers it) but nothing paints in it. Kept VERBATIM below and no longer run; the successor follows, and the original is run as a PARKED RECORD (it must now fail, for exactly that reason).
  // for (let i = 0; i < 40 && !(fnMachina.loaded.includes('IBM Plex Mono') && fnMachina.loaded.includes('IBM Plex Sans') && fnMachina.loaded.includes('IBM Plex Serif')); i += 1) { await sleep(250); fnMachina = await fontState(); }
  // ok('FN2: choosing Machina DECLARES its faces (IBM Plex Mono / Sans / Serif and Atkinson Hyperlegible in document.fonts) and LOADS the three Plex slots the chrome and the prose use, with font requests on the wire', ['IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif', 'Atkinson Hyperlegible'].every((f) => fnMachina.declared.includes(f)) && ['IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif'].every((f) => fnMachina.loaded.includes(f)) && fnMachina.requests > 0, JSON.stringify(fnMachina));
  // ------------------------------------------------------------------
  for (let i = 0; i < 40 && !(fnMachina.loaded.includes('IBM Plex Mono') && fnMachina.loaded.includes('IBM Plex Sans') && fnMachina.loaded.includes('Source Sans 3')); i += 1) { await sleep(250); fnMachina = await fontState(); }
  ok('FN2 [item-10 successor]: choosing Machina DECLARES its faces (IBM Plex Mono / Sans / Serif and Atkinson Hyperlegible in document.fonts) and LOADS the three it paints in - Plex Mono and Plex Sans for the chrome, Source Sans 3 (its default writing face) for the prose - with font requests on the wire', ['IBM Plex Mono', 'IBM Plex Sans', 'IBM Plex Serif', 'Atkinson Hyperlegible'].every((f) => fnMachina.declared.includes(f)) && ['IBM Plex Mono', 'IBM Plex Sans', 'Source Sans 3'].every((f) => fnMachina.loaded.includes(f)) && fnMachina.requests > 0, JSON.stringify(fnMachina));
  ok('FN2 [parked record]: the ORIGINAL (Plex Serif LOADED for the prose) now fails ONLY because the prose is Source Sans 3 - Plex Serif stays declared, unpainted', !fnMachina.loaded.includes('IBM Plex Serif') && fnMachina.loaded.includes('Source Sans 3') && fnMachina.declared.includes('IBM Plex Serif'), JSON.stringify(fnMachina));
  await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="theme"]'); if (b) b.click(); })()`);
  await app.waitFor("!!document.querySelector('.wz-theme-cards')", { label: 'the picker (Machina)', timeout: 8000 }).catch(() => {});
  await sleep(300);
  const pkM = await cardRead();
  const mM = pkM.find((c) => c.name === 'Machina');
  ok('PK2: with Machina current, its card is the pressed one (open by being current) and the other themes\' cards are not pressed', !!mM && !mM.locked && mM.pressed === 'true' && pkM.filter((c) => c.pressed === 'true').length === 1, JSON.stringify(pkM));
  await frame(app, 'picker-machina');

  // ======================================================= RN under Arbor / Flux: no Run
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ progress: 'words', progressStyle: 'rhizome', instrumentsOn: true, typewriter: false }))`);
  await app.reload();
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'reload', timeout: 12000 }).catch(() => {});
  await sleep(700);
  await app.evalJs("window.wrizoTheme.set('plateau')"); await sleep(500);
  const arbor = await run(app);
  await app.evalJs("window.wrizoTheme.set('flux')"); await sleep(500);
  const flux = await run(app);
  ok('RN4: the Run strip is Machina-only - absent under Arbor and under Flux', arbor === null && flux === null, JSON.stringify({ arbor, flux }));
  await app.evalJs("window.wrizoTheme.set('plateau')"); await sleep(300);
  const openedA = await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="settings"]'); if (!b) return false; b.click(); return true; })()`);
  await sleep(700);
  const rowArbor = await app.evalJs("document.querySelectorAll('.wz-cascade-cast').length");
  const panelArbor = await app.evalJs("document.querySelectorAll('.wz-cascade-panel-body').length");
  ok('CA3: under Arbor the Controls panel opens and the Cast row is absent (CAST means nothing outside Machina)', openedA && panelArbor > 0 && rowArbor === 0, JSON.stringify({ openedA, panelArbor, rowArbor }));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nTH-MACHINA VERIFY: PASS (${checks.length} checks)` : `\nTH-MACHINA VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
