// TH1 — the theme seam. A committed CDP verification scenario (per AGENTS.md
// "Harness scenarios persist"), covering the brief's 6 harness checks plus
// Fable's post-build review fold (docs/open-threads.md item 19):
//   1. Theme switch applies the expected token values (spot-check per slot).
//   2. Lexicon projection maps every term ID; unknown/missing falls through
//      to canonical; canonical nouns still resolve in routes and search.
//      R1 fold: both number forms (t=one, tMany=many) resolve and fall
//      through independently; the Drawers/Pages sweep renders tMany's value.
//   3. Prefs persist across reload; prefs survive a theme switch.
//   4. Reduced-motion forces dial to 0; dial 0 yields zero scheduled events.
//   5. Effects layer contributes no layout size (fixed-track grid unchanged).
//      R2 fold: registerThemeFx is the seam TH2 calls — it must not disturb
//      Plateau's own (still-empty) render for an unregistered id.
//   6. Plateau default-theme regression: rendered token values byte-equal to
//      pre-TH1 `main` where measurable.
// Run: node apps/desktop/scripts/harness/th1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Ground truth: the exact literal values pre-TH1 `main`'s bare :root block
// authored for these slots (apps/desktop/src/index.css, before this ticket).
// TH1 re-points --font-display/--font-ui/--font-prose through new slot vars
// (--font-chromeLabel/--font-proseSerif) but the STRING each resolves to on
// Plateau must be unchanged — that identity is check 6.
// Quoted font names come back double-quote-normalized from getComputedStyle
// regardless of the source's quoting — a serialization detail, not a value
// change (true pre-TH1 `main` would report identically).
const PRE_TH1 = {
  '--brass': '#ff9800',
  '--ink-950': '#110600',
  '--paper': '#F3EDE1',
  '--font-display': '"Figtree Variable", system-ui, sans-serif',
  '--font-prose': '"Crimson Pro Variable", Georgia, serif',
  '--font-ui': '"Figtree Variable", system-ui, sans-serif',
};

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'authed Desk' });
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear' });

  // -- boot state: data-theme is on <html> before first render, default 'plateau' --
  const bootTheme = await app.evalJs("document.documentElement.getAttribute('data-theme')");
  ok('boot applies data-theme="plateau" to <html> with no flash', bootTheme === 'plateau', String(bootTheme));

  // -- check 1: theme switch mechanism — explicit re-set is a no-op on values,
  // an unregistered theme id is rejected (root never goes blank/broken) -------
  const rootVals = (props) => app.evalJs(`(() => {
    const cs = getComputedStyle(document.documentElement);
    return ${JSON.stringify(props)}.reduce((o, p) => { o[p] = cs.getPropertyValue(p).trim(); return o; }, {});
  })()`);
  const before = await rootVals(Object.keys(PRE_TH1).concat(['--line-active', '--signal-live']));
  await app.evalJs("window.wrizoTheme.set('plateau')"); // explicit re-apply of the same theme
  const afterSameTheme = await rootVals(Object.keys(PRE_TH1).concat(['--line-active', '--signal-live']));
  ok('check 1: re-applying the registered theme leaves every slot value unchanged',
    JSON.stringify(before) === JSON.stringify(afterSameTheme),
    `${JSON.stringify(before)} vs ${JSON.stringify(afterSameTheme)}`);

  const rejectedUnknown = await app.evalJs(`(() => {
    window.wrizoTheme.set('nonexistent-theme'); // never registered — must no-op
    return document.documentElement.getAttribute('data-theme');
  })()`);
  ok('check 1: setting an unregistered theme id is rejected (root stays plateau, never blank)',
    rejectedUnknown === 'plateau', String(rejectedUnknown));

  // -- check 2: lexicon — every term ID maps to a non-empty string; DOM sites
  // render exactly what the lexicon returns; canonical routes still resolve --
  const lexiconCheck = await app.evalJs(`(() => {
    const { t, tMany, CANONICAL_TERMS } = window.wrizoLexicon;
    const mapped = CANONICAL_TERMS.map(id => [id, t(id)]);
    const allNonEmpty = mapped.every(([, v]) => typeof v === 'string' && v.length > 0);
    const fallThrough = t('journal', 'nonexistent-theme'); // unknown theme -> canonical
    const fallThroughMany = tMany('drawer', 'nonexistent-theme'); // R1: many falls through too
    const pageOne = t('page');
    const pageMany = tMany('page');
    return { mapped, allNonEmpty, fallThrough, fallThroughMany, pageOne, pageMany };
  })()`);
  ok('check 2: every canonical term ID maps to a non-empty display string', lexiconCheck.allNonEmpty, JSON.stringify(lexiconCheck.mapped));
  ok('check 2: an unregistered theme id falls through to the canonical noun (t/one)', lexiconCheck.fallThrough === 'Journal', String(lexiconCheck.fallThrough));
  ok('check 2 (R1): an unregistered theme id falls through to the canonical plural (tMany/many)', lexiconCheck.fallThroughMany === 'Drawers', String(lexiconCheck.fallThroughMany));
  ok('check 2 (R1): t() and tMany() resolve distinct, correct number forms for the same term', lexiconCheck.pageOne === 'Page' && lexiconCheck.pageMany === 'Pages', JSON.stringify(lexiconCheck));

  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list (canonical route resolves)' });
  // Rail order is [Catch, Journal, Shelf, Drawers, Library] with no way-back
  // chip present (fresh state) — indices 1/3 (Catch is 0).
  const journalRailLabel = await app.evalJs("document.querySelectorAll('.desk-rail-item .desk-rail-label')[1]?.textContent");
  const journalLexiconVal = await app.evalJs("window.wrizoLexicon.t('journal')");
  ok('check 2: DeskRail label renders exactly the lexicon projection for its term', journalRailLabel === journalLexiconVal, `${journalRailLabel} vs ${journalLexiconVal}`);

  const drawersRailLabel = await app.evalJs("document.querySelectorAll('.desk-rail-item .desk-rail-label')[3]?.textContent");
  const drawersLexiconMany = await app.evalJs("window.wrizoLexicon.tMany('drawer')");
  ok('check 2 (R1): DeskRail\'s Drawers item now renders via tMany(\'drawer\') — matches the lexicon projection exactly', drawersRailLabel === drawersLexiconMany, `${drawersRailLabel} vs ${drawersLexiconMany}`);

  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.dz-pagetitle')", { label: 'Drawers route resolves (canonical path segment)' });
  // The route's own page HEADING (.dz-pagetitle) is a DIFFERENT site from the
  // DeskRail nav item above — at R1 this heading was still a bare literal;
  // TH2's full lexicon sweep later routed it through tMany('drawer') too
  // (docs/open-threads.md item 20's ".dz-pagetitle starting example"). The
  // assertion is unchanged either way: Plateau renders the same literal.
  const drawersTitle = await app.evalJs("document.querySelector('.dz-pagetitle')?.textContent");
  ok('check 2: the Drawers route\'s own page heading renders the canonical literal on Plateau', drawersTitle === 'Drawers', String(drawersTitle));

  // -- check 3: prefs persist across reload; survive a theme switch -----------
  await app.evalJs("window.wrizoThemePrefs.set({ voice: 'sans', fade: 'off' })");
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-rail')", { label: 'reloaded (authed tree present)' });
  const prefsAfterReload = await app.evalJs("window.wrizoThemePrefs.get()");
  ok('check 3: Voice/Fade prefs persist across a reload', prefsAfterReload.voice === 'sans' && prefsAfterReload.fade === 'off', JSON.stringify(prefsAfterReload));
  const voiceAttrAfterReload = await app.evalJs("document.documentElement.getAttribute('data-voice')");
  ok('check 3: the data-voice attribute reflects the persisted pref pre-paint', voiceAttrAfterReload === 'sans', String(voiceAttrAfterReload));

  await app.evalJs("window.wrizoTheme.set('plateau')"); // the only registered theme switch available in TH1
  const prefsAfterThemeSwitch = await app.evalJs("window.wrizoThemePrefs.get()");
  ok('check 3: prefs survive a theme switch', prefsAfterThemeSwitch.voice === 'sans' && prefsAfterThemeSwitch.fade === 'off', JSON.stringify(prefsAfterThemeSwitch));

  // Restore defaults before the remaining checks (Fade:off gates noteWrite —
  // leaving it off would silently invalidate any later chrome-fade assumption).
  await app.evalJs("window.wrizoThemePrefs.set({ voice: 'serif', fade: 'on' })");
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-rail')", { label: 'authed tree after prefs restore' });

  // -- check 4: reduced-motion forces the EFFECTIVE dial to 0; the stored
  // preference itself is untouched; the effects layer schedules zero events --
  await app.evalJs('window.wrizoAmbiance.set(80)');
  const dialNormal = await app.evalJs('({ stored: window.wrizoAmbiance.get(), effective: window.wrizoAmbiance.effective() })');
  ok('check 4: with no reduced-motion, the effective dial matches the stored value', dialNormal.stored === 80 && dialNormal.effective === 80, JSON.stringify(dialNormal));

  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const dialReduced = await app.evalJs('({ stored: window.wrizoAmbiance.get(), effective: window.wrizoAmbiance.effective(), reduced: window.wrizoAmbiance.reducedMotion() })');
  ok('check 4: prefers-reduced-motion forces the effective dial to 0 without erasing the stored preference', dialReduced.stored === 80 && dialReduced.effective === 0 && dialReduced.reduced === true, JSON.stringify(dialReduced));
  await app.emulateMedia([]);
  await app.evalJs('window.wrizoAmbiance.set(50)'); // restore the shipped default

  // -- check 4/5: the effects layer is mounted, empty (Plateau schedules zero
  // events), and contributes no layout size ------------------------------------
  await app.goto('/sprint');
  await app.waitFor("!!document.querySelector('.mode-row')", { label: 'a ModeStage surface (fixed-track grid present)' });
  const fx = await app.evalJs(`(() => {
    const el = document.querySelector('.theme-fx-layer');
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { present: true, childCount: el.childElementCount, position: cs.position, inset: [cs.top, cs.right, cs.bottom, cs.left].join(','), pointerEvents: cs.pointerEvents };
  })()`);
  ok('check 5: the effects layer is mounted once, globally', !!fx?.present, JSON.stringify(fx));
  ok('check 5: the layer is position:fixed (out of flow — zero layout participation)', fx?.position === 'fixed', String(fx?.position));
  ok('check 5: the layer never intercepts pointer events', fx?.pointerEvents === 'none', String(fx?.pointerEvents));
  ok('check 4: Plateau schedules zero effects-layer events (empty FX_REGISTRY entry)', fx?.childCount === 0, String(fx?.childCount));

  // -- R2: registerThemeFx is the seam TH2 calls — registering a DIFFERENT
  // theme id must not throw and must not disturb Plateau's own empty render --
  const registerResult = await app.evalJs(`(() => {
    try {
      window.wrizoThemeFx.register('__th1_harness_probe__', { mount: () => () => {} });
      return { threw: false };
    } catch (e) {
      return { threw: true, message: String(e) };
    }
  })()`);
  ok('check 5 (R2): registerThemeFx registers a theme\'s handlers without throwing', registerResult.threw === false, JSON.stringify(registerResult));
  const fxAfterRegister = await app.evalJs("document.querySelector('.theme-fx-layer')?.childElementCount");
  ok('check 5 (R2): registering a DIFFERENT theme id leaves Plateau\'s active effects layer empty', fxAfterRegister === 0, String(fxAfterRegister));

  const gridColsBefore = await app.evalJs("getComputedStyle(document.querySelector('.mode-row')).gridTemplateColumns");
  const rowRectBefore = await app.evalJs("JSON.stringify(document.querySelector('.mode-row').getBoundingClientRect())");
  // Toggling ambiance / theme prefs while the layer sits mounted must not
  // perturb the fixed-track grid it sits behind.
  await app.evalJs("window.wrizoAmbiance.set(90)");
  await sleep(50);
  const rowRectAfter = await app.evalJs("JSON.stringify(document.querySelector('.mode-row').getBoundingClientRect())");
  const gridColsAfter = await app.evalJs("getComputedStyle(document.querySelector('.mode-row')).gridTemplateColumns");
  ok('check 5: .mode-row (W1 fixed-track grid) rect is unaffected by the effects layer', rowRectBefore === rowRectAfter, `${rowRectBefore} -> ${rowRectAfter}`);
  ok('check 5: the fixed-track column template itself is untouched by the effects layer/ambiance dial', gridColsBefore === gridColsAfter, `${gridColsBefore} -> ${gridColsAfter}`);
  await app.evalJs("window.wrizoAmbiance.set(50)");

  // -- Slice 1 sweep sites (PageEditor, a real project) render exactly the
  // lexicon projection, unchanged text on Plateau at default settings --------
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before PageEditor fixture' });
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  const planLabel = await app.evalJs("document.querySelector('.sprint-toggle-btn:nth-child(2)')?.textContent");
  const pagesLabel = await app.evalJs("document.querySelector('.sprint-toggle-btn:nth-child(1)')?.textContent");
  const pagesLexiconMany = await app.evalJs("window.wrizoLexicon.tMany('page')");
  ok('check 2/6: the Plan toggle still reads exactly "Plan" on Plateau', planLabel === 'Plan', String(planLabel));
  ok('check 2/6 (R1): the Pages toggle now renders via tMany(\'page\') — matches the lexicon projection and stays byte-equal to "Pages"', pagesLabel === 'Pages' && pagesLabel === pagesLexiconMany, `${pagesLabel} vs ${pagesLexiconMany}`);

  // -- check 6: Plateau default-theme regression — byte-equal to pre-TH1 values --
  const finalVals = await rootVals(Object.keys(PRE_TH1));
  const regressionOk = Object.keys(PRE_TH1).every((k) => finalVals[k] === PRE_TH1[k]);
  ok('check 6: Plateau default token values are byte-equal to pre-TH1 main', regressionOk, JSON.stringify({ expected: PRE_TH1, actual: finalVals }));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTH1 VERIFY: PASS (${checks.length} checks)` : `\nTH1 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
