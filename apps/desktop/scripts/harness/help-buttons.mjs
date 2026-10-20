// HELP BUTTONS (Nick approved Oct 12, cursor/help-buttons @ d4d1c835;
// docs/mockups/help-buttons/index.html is the approved reference). The one
// plain sentence behind each themed word's own "?": Templates, Outline,
// Title Page, Recede depth, Free Write, Publish, Grafts/Links.
//
// THE CLAIM THAT NEEDS A CHECK MORE THAN ANY OTHER: it never moves or
// resizes the page it sits over (page primacy) — S6 proves it with the
// SAME before/after rect technique the mockup's own rig bar used. S4/S5
// prove the two rules Fable named explicitly: Esc returns focus, and there
// is no brass anywhere.
//
// Run: node scripts/harness/help-buttons.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

// REPAIR (Fable, Oct 17, ledger 85) — every tap on a "?" or its popover, and
// the press outside it, now goes through a genuinely TRUSTED CDP pointer
// event (app.mouseDown/mouseUp over the element's own measured centre), the
// same standing law splash.mjs already keeps ("nothing uses page-side
// .click()"). A page-side el.click() establishes no real pointer identity
// and no real focus the way a writer's actual tap does — exactly the gap
// S4 (Esc returns focus) needs closed under a trusted press, not a synthetic
// one. Missing elements fail loudly (never a silent no-op), per house law.
const realClick = async (app, selector) => {
  // REPAIR (Fable, Oct 17, ledger 91) — Recede depth's own "?" sits at y=1351
  // in this fixture's 900px-tall viewport: a CDP mouse event at that y is
  // off-screen, so the trusted click found nothing there (a different
  // failure than the pointer-events gap D2d fixed — this one never reaches
  // the browser's hit-test at all). scrollIntoView BEFORE measuring the
  // rect, so every caller's click lands on the element's actual, visible
  // position rather than assuming the fixture scrolled it there already.
  //
  // REPAIR (Fable, Oct 18, ledger 92 — the flake): scrolling and measuring
  // in the SAME evalJs call read the rect before any scroll ANIMATION had
  // actually settled — scrollIntoView's default behaviour is instant only
  // when the browser/CSS agrees it should be; whenever it wasn't (how far
  // the target already was from view, machine load), getBoundingClientRect
  // read mid-scroll, a stale rect a real pointer press at that coordinate
  // then missed. Scroll in its own tick, then POLL the rect across SEPARATE
  // ticks (a real sleep between each, so an in-flight animation actually
  // gets to progress) until two consecutive reads agree, rather than
  // trusting the first read alone.
  await app.evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('realClick: no element ' + ${JSON.stringify(selector)});
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  })()`);
  const readCentre = () => app.evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) throw new Error('realClick: no element ' + ${JSON.stringify(selector)});
    const r = el.getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  })()`);
  let prev = await readCentre();
  for (let i = 0; i < 10; i++) {
    await sleep(30);
    const next = await readCentre();
    const stable = next.x === prev.x && next.y === prev.y;
    prev = next;
    if (stable) break;
  }
  await app.mouseDown(prev.x, prev.y);
  await app.mouseUp(prev.x, prev.y);
};

const freshPage = async (app, theme, { width = 1400, id = 'hb-page' } = {}) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)});`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk, for seeding' });
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: 'A page for the help-buttons checks.', origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z' })})`);
  await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(500);
};

const openDraftSliver = async (app) => {
  await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === 'Draft')?.click()");
  await sleep(300);
  // REPAIR (Fable, Oct 17, ledger 91) — .wz-sliver-grip is a TOGGLE: calling
  // this unconditionally as each LOCATIONS entry's own reach step closed the
  // sliver right back on the second location of a fixture that had already
  // opened it on the first. Open it only if it is currently closed, the same
  // check-before-toggle idiom drawers-p1-live.mjs's own ensureRight already
  // uses for the Tutor panel.
  const isOpen = await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
  if (!isOpen) {
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()");
    await sleep(400);
  }
};

const openTutorDrawer = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
  await sleep(400);
};

// REPAIR (Fable, Oct 17) — Recede depth's own Seg lives inside the sliver's
// FOOT SETTINGS POPOUT (Sliver.tsx's .wz-sliver-instruments-panel), a second
// disclosure nested inside the sliver itself ("..." button, aria-label
// footSettings) — reading the Draft sliver open is not enough to reach it.
const openDraftSliverSettings = async (app) => {
  await openDraftSliver(app);
  // REPAIR (Fable, Oct 18, ledger 92) — .wz-sliver-instruments-btn is ALSO a
  // toggle (aria-expanded), same species as .wz-sliver-grip above: calling
  // it unconditionally closed the popout right back on any re-entry that
  // found it already open. Open it only if it is currently closed.
  const settingsOpen = await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.getAttribute('aria-expanded') === 'true'");
  if (!settingsOpen) {
    await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.click()");
    await sleep(300);
  }
};

// Each location, how to reach it, and the selector of its own "?".
// SUPERSEDED (help-buttons, Fable Oct 18-19): Outline's own "?" was a single
// generic LOCATIONS entry, checked identically in both themes (icon-button
// era). The five-row picker's own theme-unique rule makes that reading
// wrong on BOTH sides at once: Arbor's Outline row carries no "?" at all
// now, and Flux's row reads "Spine", not "Outline" - this exact selector
// can never match in either theme. Kept verbatim, no longer run:
//   { key: 'helpOutline', subject: 'Outline', reach: openDraftSliver, sel: '.wz-sliver-templates .wz-help[aria-label="What is Outline?"]' },
// Dedicated per-theme successor: S1b, below the generic loop.
const LOCATIONS = [
  { key: 'helpTemplates', subject: 'Templates', reach: openDraftSliver, sel: '.wz-sliver-templates .wz-sliver-h .wz-help' },
  { key: 'recedeHint', subject: 'Recede depth', reach: openDraftSliverSettings, sel: '.wz-help[aria-label="What is Recede depth?"]' },
  { key: 'helpFreeWrite', subject: 'Free Write', reach: async () => {}, sel: '.desk-mode-tab-wrap .wz-help[aria-label^="What is Free"]' },
  { key: 'helpPublish', subject: 'Publish', reach: async () => {}, sel: '.desk-mode-tab-wrap .wz-help[aria-label^="What is Publish"]' },
  { key: 'helpGrafts', subject: 'Grafts/Links', reach: openTutorDrawer, sel: '.wz-drawer-tabnotes .wz-help' },
];

const SENTENCES = {
  plateau: {
    helpTemplates: 'Ready-made page layouts.',
    recedeHint: 'Type and the menus fade; pause, reach an edge, or press Esc to bring them back.',
    helpFreeWrite: 'Write forward only. No going back to edit.',
    helpPublish: 'Share a page as a link or a file.',
    helpGrafts: 'Grafts join pages, cards and boards.',
  },
  flux: {
    helpTemplates: 'Ready-made doc layouts.',
    recedeHint: 'Type to dissolve the chrome; pause, reach an edge, or press Esc to bring it back.',
    helpFreeWrite: 'Write forward only. No editing back.',
    helpPublish: 'Send a doc out as a link or a file.',
    helpGrafts: 'Links join docs, cards and circuits.',
  },
};

// S1b (help-buttons successor, Fable Oct 18-19) — the five-row Templates
// picker's own per-theme rule: Arbor's five words are the canonical
// baseline (none renamed), so NO row carries a "?"; Flux renames every one
// (Raw/Script/Spine/Cover/Sources), so EVERY row carries its own, with
// THIS theme's own sentence (Spine/Cover reuse helpOutline/helpTitlePage's
// existing Flux text; the other three are new).
const TEMPLATE_ROW_SENTENCES = {
  plateau: {},
  flux: {
    Raw: 'A raw page. Nothing written yet.',
    Script: 'The script format: sluglines, dialogue, action.',
    Spine: 'A numbered spine. Tab indents.',
    Cover: 'A standard manuscript cover sheet.',
    Sources: 'Your sources, collected on one page.',
  },
};

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — ALL SEVEN LOCATIONS, BOTH THEMES: the "?" exists and opens its own
  // theme's own sentence (never the other theme's, never empty).
  // ==========================================================================
  for (const [theme, page] of [['plateau', 'hb-s1-plateau'], ['flux', 'hb-s1-flux']]) {
    await freshPage(app, theme, { id: page });
    for (const loc of LOCATIONS) {
      await loc.reach(app);
      const exists = await app.evalJs(`!!document.querySelector(${JSON.stringify(loc.sel)})`);
      if (!exists) { ok(`S1 [${theme}] ${loc.subject}: the "?" exists`, false, 'not found'); continue; }
      await realClick(app, loc.sel);
      await sleep(250);
      const text = await app.evalJs("document.querySelector('.wz-help-pop')?.textContent ?? null");
      const expected = SENTENCES[theme][loc.key];
      ok(`S1 [${theme}] ${loc.subject}: the "?" opens THIS theme's own sentence`, text === expected, JSON.stringify({ text, expected }));
      await realClick(app, loc.sel);
      await sleep(250);
    }
  }

  // ==========================================================================
  // S1b (help-buttons successor) — the picker's own per-theme rule, Outline's
  // old single-location reading retired above. Arbor (canonical, no row
  // renamed): zero "?"s on the rows. Flux (every row renamed): one "?" per
  // row, each opening THIS row's own sentence.
  // ==========================================================================
  await freshPage(app, 'plateau', { id: 'hb-s1b-plateau' });
  await openDraftSliver(app);
  const arborRowHelps = await app.evalJs("[...document.querySelectorAll('.wz-template-list .wz-template-row-wrap .wz-help')].length");
  ok('S1b Arbor: none of the five picker rows carry a "?" (Arbor\'s own five words are the canonical baseline, none renamed)',
    arborRowHelps === 0, String(arborRowHelps));

  await freshPage(app, 'flux', { id: 'hb-s1b-flux' });
  await openDraftSliver(app);
  const fluxRows = await app.evalJs(`[...document.querySelectorAll('.wz-template-list .wz-template-row-wrap')].map((wrap) => ({
    label: wrap.querySelector('.wz-template-row')?.getAttribute('aria-label') ?? null,
    hasHelp: !!wrap.querySelector('.wz-help'),
  }))`);
  ok('S1b Flux: every one of the five picker rows carries its own "?" (every row is renamed)',
    fluxRows.length === 5 && fluxRows.every((r) => r.hasHelp === true), JSON.stringify(fluxRows));
  for (const { label } of fluxRows) {
    const sel = `.wz-template-list .wz-template-row-wrap .wz-help[aria-label="What is ${label}?"]`;
    await realClick(app, sel);
    await sleep(250);
    const text = await app.evalJs("document.querySelector('.wz-help-pop')?.textContent ?? null");
    const expected = TEMPLATE_ROW_SENTENCES.flux[label];
    ok(`S1b Flux [${label}]: its own "?" opens the matching sentence`, !!expected && text === expected, JSON.stringify({ label, text, expected }));
    await realClick(app, sel);
    await sleep(250);
  }

  // ==========================================================================
  // S2-S6 — THE DEEP BEHAVIOURAL CLAIMS, proved once on a representative
  // location (the Templates heading's own "?", Draft/Sliver, Arbor).
  // ==========================================================================
  await freshPage(app, 'plateau', { id: 'hb-deep' });
  await openDraftSliver(app);
  const SEL = '.wz-sliver-templates .wz-sliver-h .wz-help';

  // S2 — a second tap of the SAME "?" closes it.
  await realClick(app, SEL);
  await sleep(250);
  const s2Open = await app.evalJs(`document.querySelector(${JSON.stringify(SEL)})?.getAttribute('aria-expanded')`);
  await realClick(app, SEL);
  await sleep(250);
  const s2Closed = await app.evalJs(`document.querySelector(${JSON.stringify(SEL)})?.getAttribute('aria-expanded')`);
  ok('S2: a second tap of the SAME "?" closes it', s2Open === 'true' && s2Closed === 'false', JSON.stringify({ s2Open, s2Closed }));

  // S3 — a tap/press anywhere outside closes it.
  await realClick(app, SEL);
  await sleep(250);
  await realClick(app, '.mode-page, .wz-sliver-body');
  await sleep(250);
  const s3Closed = await app.evalJs(`document.querySelector(${JSON.stringify(SEL)})?.getAttribute('aria-expanded')`);
  ok('S3: a press outside the "?" and its popover closes it', s3Closed === 'false', String(s3Closed));

  // S4 — Esc closes it AND returns focus to the "?" (Fable's own explicit ask).
  await realClick(app, SEL);
  await sleep(250);
  await app.key('Escape');
  await sleep(250);
  const s4 = await app.evalJs(`({ expanded: document.querySelector(${JSON.stringify(SEL)})?.getAttribute('aria-expanded'), focused: document.activeElement === document.querySelector(${JSON.stringify(SEL)}) })`);
  ok('S4: Esc closes it AND returns focus to the "?" that opened it', s4.expanded === 'false' && s4.focused === true, JSON.stringify(s4));

  // S5 — NO TIMER: left open, it stays open (Nick's own ruling — the
  // mockup's own commit d4d1c835 removed an earlier auto-close timer).
  await realClick(app, SEL);
  await sleep(3000);
  const s5Still = await app.evalJs(`document.querySelector(${JSON.stringify(SEL)})?.getAttribute('aria-expanded')`);
  ok('S5: left alone, the popover stays open — NO auto-close timer', s5Still === 'true', String(s5Still));
  await realClick(app, SEL);
  await sleep(250);

  // S6 — PAGE PRIMACY: the page's own rect is byte-identical before the "?"
  // opens, while it is open, and after it closes. The mockup's own rig bar
  // proved this; this is the same proof against the real editor's own rect.
  const rect = () => app.evalJs(`(() => { const r = document.querySelector('${ED}').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round).join(','); })()`);
  const r0 = await rect();
  await realClick(app, SEL);
  await sleep(250);
  const r1 = await rect();
  await app.key('Escape');
  await sleep(250);
  const r2 = await rect();
  ok('S6 THE CLAIM: the page\'s own rect never moves or resizes while a "?" opens and closes — it is an overlay, never part of the layout',
    r0 === r1 && r1 === r2, JSON.stringify({ r0, r1, r2 }));

  // ==========================================================================
  // S7 (source) — NEVER BRASS, and ONE shared position:fixed overlay in a
  // body portal (never per-instance, never position:absolute).
  // ==========================================================================
  const css = await app.evalJs(`(() => {
    const sheets = [...document.styleSheets];
    let text = '';
    for (const s of sheets) { try { for (const r of s.cssRules) text += r.cssText + '\\n'; } catch { /* cross-origin, skip */ } }
    return text;
  })()`);
  const openRule = (css.match(/\.wz-help\[aria-expanded="?'?true'?"?\]\s*\{[^}]*\}/) || [''])[0];
  const popRule = (css.match(/\.wz-help-pop\s*\{[^}]*\}/) || [''])[0];
  ok('S7: the "?" is never brass when open (the --help token, not --brass)',
    !!openRule && !/brass/i.test(openRule) && /--help/i.test(openRule), openRule.slice(0, 160));
  ok('S7: the popover is position:fixed — one shared overlay, never position:absolute',
    !!popRule && /position:\s*fixed/.test(popRule), popRule.slice(0, 160));
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nHELP-BUTTONS VERIFY: PASS (${checks.length} checks)` : `\nHELP-BUTTONS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
