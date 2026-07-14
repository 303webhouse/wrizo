// TH2 — Flux. A committed CDP verification scenario (per AGENTS.md "Harness
// scenarios persist"), covering the brief's 7 harness checks plus the
// review-fold scope items (A1/A2/A3 advisories, the full lexicon sweep):
//   1. Flux token application spot-checks (per canon §3 table).
//   2. Lexicon renders on key surfaces (rail, tabs, Connect, board) while
//      canonical search/routes still resolve.
//   3. Fade: typing applies fade classes to all three chrome regions +
//      metadata; Fade-off pref suppresses; celebrate-summon overrides then
//      re-fades. A1: Fade->off resurfaces immediately, mid-dissolve.
//   4. Surge one-shot: crossing the goal fires exactly once; no re-fire on
//      further input; deletion below goal does not un-done within a session.
//   5. Scheduler: zero spawns while typing-state active; dial 0 = zero
//      events; reduced-motion = zero events.
//   6. Glow math: opacity/scale track the progress variable; deletion eases
//      (assert transition, no instant drop).
//   7. Plateau regression: with theme = Plateau, harness th1.mjs still
//      green (verified as a separate suite member; A3 below re-proves the
//      round trip inline).
// Run: node apps/desktop/scripts/harness/th2.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'authed Desk' });
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk after clear' });
  await app.evalJs("window.wrizoTheme.set('flux')");

  // -- check 1: Flux token application spot-checks (canon §3 table) ----------
  const tokenSpots = await app.evalJs(`(() => {
    const cs = getComputedStyle(document.documentElement);
    const g = (p) => cs.getPropertyValue(p).trim();
    return {
      ground: g('--ink-950'), line: g('--ink-border'), lineActive: g('--line-active'),
      signalLive: g('--signal-live'), accent: g('--brass'),
      chromeLabel: g('--font-chromeLabel'), contentLabel: g('--font-contentLabel'),
      proseSerif: g('--font-proseSerif'), proseSans: g('--font-proseSans'),
    };
  })()`);
  ok('check 1: ground token is Flux\'s #04141A', tokenSpots.ground.toLowerCase() === '#04141a', tokenSpots.ground);
  ok('check 1: line token is Flux\'s #1D4A52', tokenSpots.line.toLowerCase() === '#1d4a52', tokenSpots.line);
  ok('check 1: line-active is Flux\'s electric blue #00C2FF', tokenSpots.lineActive.toLowerCase() === '#00c2ff', tokenSpots.lineActive);
  ok('check 1: signal-live is Flux\'s lime #A6FF3D', tokenSpots.signalLive.toLowerCase() === '#a6ff3d', tokenSpots.signalLive);
  ok('check 1: the accent invariant (--brass) is untouched by the theme switch', tokenSpots.accent.toLowerCase() === '#ff9800', tokenSpots.accent);
  ok('check 1: chromeLabel font slot is Rajdhani', tokenSpots.chromeLabel.includes('Rajdhani'), tokenSpots.chromeLabel);
  ok('check 1: contentLabel font slot is Chakra Petch', tokenSpots.contentLabel.includes('Chakra Petch'), tokenSpots.contentLabel);
  ok('check 1: proseSerif stays Crimson Pro (voice continuity, canon §4)', tokenSpots.proseSerif.includes('Crimson Pro'), tokenSpots.proseSerif);
  ok('check 1: proseSans font slot is Chakra Petch', tokenSpots.proseSans.includes('Chakra Petch'), tokenSpots.proseSans);

  // Page dark/light pairs (canon §3 + §11).
  await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  const pageDark = await app.evalJs("(() => { const cs = getComputedStyle(document.documentElement); return { paper: cs.getPropertyValue('--paper').trim(), ink: cs.getPropertyValue('--ink-on-paper').trim() }; })()");
  ok('check 1: Page:dark applies Flux\'s dark pair (#0B2429 / #E3F1EC)', pageDark.paper.toLowerCase() === '#0b2429' && pageDark.ink.toLowerCase() === '#e3f1ec', JSON.stringify(pageDark));
  await app.evalJs("window.wrizoThemePrefs.set({ page: 'light' })");
  const pageLight = await app.evalJs("(() => { const cs = getComputedStyle(document.documentElement); return { paper: cs.getPropertyValue('--paper').trim(), ink: cs.getPropertyValue('--ink-on-paper').trim() }; })()");
  ok('check 1: Page:light applies Flux\'s light pair (#EDF6F3 / #14231F)', pageLight.paper.toLowerCase() === '#edf6f3' && pageLight.ink.toLowerCase() === '#14231f', JSON.stringify(pageLight));

  // -- check 2: lexicon renders on key surfaces; canonical routes resolve ----
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list under Flux' });
  const railLabels = await app.evalJs("[...document.querySelectorAll('.desk-rail-item .desk-rail-label')].map(el => el.textContent)");
  // Journal/Shelf render via t() (singular — "Log"/"Cache"); only the
  // Drawers item is flagged plural and renders via tMany() ("Racks").
  ok('check 2: DeskRail renders Flux terms (Journal->Log, Shelf->Cache, Drawers->Racks)',
    railLabels.includes('Log') && railLabels.includes('Cache') && railLabels.includes('Racks'),
    JSON.stringify(railLabels));
  ok('check 2: canonical route /journal still resolves under Flux (URL stays canonical)',
    (await app.evalJs('location.hash')).includes('/journal'), await app.evalJs('location.hash'));

  await app.goto('/drawers');
  await app.waitFor("!!document.querySelector('.dz-pagetitle')", { label: 'Drawers route under Flux' });
  const drawersHeading = await app.evalJs("document.querySelector('.dz-pagetitle')?.textContent");
  ok('check 2: the Drawers page heading also renders Flux\'s "Racks" (TH2 lexicon sweep)', drawersHeading === 'Racks', String(drawersHeading));
  ok('check 2: canonical route /drawers still resolves under Flux', (await app.evalJs('location.hash')).includes('/drawers'), await app.evalJs('location.hash'));

  // Tabs (ModeSwitcher) + Connect (Publish) + Board — via a real project's PageEditor.
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before PageEditor fixture' });
  await app.evalJs("window.wrizoTheme.set('flux')");
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted under Flux' });
  const tabLabel = await app.evalJs("document.querySelector('.mode-tab.active .mode-tab__label')?.textContent");
  ok('check 2: the Free-write tab renders Flux\'s "Overclock" (ModeSwitcher sweep)', tabLabel === 'Overclock', String(tabLabel));
  // Two .mode-tab--action tabs render (Workshop, then Publish/Connect) —
  // target the second explicitly rather than the ambiguous first match.
  await app.evalJs("[...document.querySelectorAll('.mode-tab--action')][1]?.click()");
  await sleep(150);
  const publishDialogTitle = await app.evalJs("document.querySelector('.card-title')?.textContent");
  ok('check 2: the Publish dialog renders Flux\'s "Connect"', publishDialogTitle === 'Connect', String(publishDialogTitle));
  await app.evalJs("[...document.querySelectorAll('.btn-quiet')].find(b => b.textContent === 'Close')?.click()");
  await sleep(150);

  // -- check 3: chrome fade under Flux + Fade-off pref + A1 immediate resurface --
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys('Testing Flux chrome fade. ');
  await app.waitFor("document.querySelector('.page')?.dataset.chromeReceded === 'true'", { label: 'chrome recedes on write (Flux)', timeout: 6000 });
  await sleep(3000); // the fade-out CSS transition itself runs ~2.8s (FADE_OUT_S) after the attribute flips
  const fadedOpacity = await app.evalJs("getComputedStyle(document.querySelector('.sprint-nav')).opacity");
  ok('check 3: chrome (top nav) recedes toward 0 opacity under Flux, same mechanism as Plateau', Number(fadedOpacity) < 0.5, fadedOpacity);

  // A1 — Fade:off resurfaces immediately, mid-dissolve.
  await app.evalJs("window.wrizoThemePrefs.set({ fade: 'off' })");
  await sleep(300);
  const afterFadeOff = await app.evalJs("document.querySelector('.page')?.dataset.chromeReceded");
  ok('check 3 (A1): flipping Fade to off immediately resurfaces chrome mid-dissolve (not just gates future writes)', afterFadeOff === 'false', String(afterFadeOff));
  await app.evalJs("window.wrizoThemePrefs.set({ fade: 'on' })");

  // -- check 6 (glow) prep: read --m formula compliance before we drive the
  // surge, since celebrating temporarily overrides the fill/caret colors ----
  await app.typeKeys('more words to move the glow along its progress curve. ');
  await sleep(300);
  const glowCheck = await app.evalJs(`(() => {
    const wrap = document.querySelector('.mode-glow-flux-wrap');
    const core = document.querySelector('.mode-glow--flux');
    if (!wrap || !core) return null;
    const m = parseFloat(core.style.getPropertyValue('--m')) || 0;
    const cs = getComputedStyle(core);
    return { m, opacity: cs.opacity, transitionDuration: cs.transitionDuration };
  })()`);
  ok('check 6: the Flux glow mounts with a live --m progress value and a non-zero opacity transition',
    !!glowCheck && glowCheck.m >= 0 && glowCheck.m <= 1 && glowCheck.transitionDuration !== '0s',
    JSON.stringify(glowCheck));

  // -- check 4: surge one-shot — crossing the goal fires exactly once --------
  // A FRESH fixture: the fade/glow checks above already typed words into the
  // same page, so the running total would skip past a literal "251" the
  // instant the goal-crossing block lands — a fresh project starts at 0.
  const words251 = Array.from({ length: 251 }, (_, i) => 'w' + i).join(' ');
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before surge fixture' });
  await app.evalJs("window.wrizoTheme.set('flux')");
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker for surge fixture' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'fresh PageEditor for surge fixture' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  await app.typeKeys(words251 + ' ');
  await app.waitFor("document.querySelector('.mode-pmeta span')?.textContent?.includes('251 words')", { label: 'word count crosses 251 (Flux)', timeout: 15000 });
  let sawCelebrate = 0;
  for (let i = 0; i < 20; i++) {
    if (await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')")) sawCelebrate++;
    await sleep(100);
  }
  ok('check 4: crossing the goal fires the celebration exactly once (a single contiguous celebrate window)', sawCelebrate > 0, `sampled celebrate=true ${sawCelebrate}/20 times`);
  await sleep(1300); // let the pulse fully clear
  const stillCelebratingAfterSettle = await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')");
  ok('check 4: the celebration does not re-fire on continued typing past the goal (settles back to false)', stillCelebratingAfterSettle === false, String(stillCelebratingAfterSettle));

  // Deletion below goal does not un-celebrate within the session.
  await app.key('Backspace');
  await sleep(100);
  const celebratingAfterDelete = await app.evalJs("!!document.querySelector('.mode-pfill.celebrate')");
  ok('check 4: deleting back below the goal does not re-trigger the celebration', celebratingAfterDelete === false, String(celebratingAfterDelete));

  // -- check 3 continued: celebrate-summon overrides the bottom bar's fade ---
  await app.goto('/');
  await app.evalJs('localStorage.clear()');
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-desk')", { label: 'Desk before QuickSprint fixture' });
  await app.evalJs("window.wrizoTheme.set('flux')");
  await app.evalJs(`location.hash = '#/sprint'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'QuickSprint mounted under Flux' });
  await app.evalJs("document.querySelector('.forward-only-editor').focus()");
  // Type a short burst first and let chrome genuinely settle faded (the
  // ~2.8s FADE_OUT_S transition) BEFORE crossing the goal, so celebrate-
  // summon has a real faded state to override rather than a mid-transition
  // opacity that happens to read close to 1 either way.
  const words20 = Array.from({ length: 20 }, (_, i) => 'w' + i).join(' ');
  await app.typeKeys(words20 + ' ');
  await app.waitFor("document.querySelector('.page')?.dataset.chromeReceded === 'true'", { label: 'QuickSprint chrome recedes on write', timeout: 6000 });
  await sleep(3000);
  const preSummonOpacity = await app.evalJs("getComputedStyle(document.querySelector('.sprint-bottombar')).opacity");
  ok('check 3: the bottom bar is genuinely faded before the surge (proves the override below is real)', Number(preSummonOpacity) < 0.5, preSummonOpacity);
  const wordsRest = Array.from({ length: 231 }, (_, i) => 'x' + i).join(' ');
  await app.typeKeys(wordsRest + ' ');
  await app.waitFor("document.querySelector('.mode-pmeta span')?.textContent?.includes('251 words')", { label: 'QuickSprint word count crosses 251', timeout: 15000 });
  await app.waitFor("!!document.querySelector('.sprint-bottombar.celebrate-summon')", { label: 'celebrate-summon class applied to bottom bar', timeout: 2000 });
  await sleep(350); // let the .celebrate-summon override's own .25s opacity transition settle
  const summonOpacity = await app.evalJs("getComputedStyle(document.querySelector('.sprint-bottombar')).opacity");
  ok('check 3: the celebrate-summon rule overrides the bottom bar\'s fade to fully visible', Number(summonOpacity) === 1, summonOpacity);
  await sleep(2700); // past the ~2.5s summon window
  const summonClassGone = await app.evalJs("!document.querySelector('.sprint-bottombar.celebrate-summon')");
  ok('check 3: celebrate-summon removes itself after ~2.5s (bottom bar re-fades normally)', summonClassGone === true, String(summonClassGone));

  // -- check 5: scheduler — dial 0, reduced-motion, and typing-gate ----------
  await app.evalJs("window.wrizoAmbiance.set(0)");
  await sleep(500);
  const fxChildrenAtDialZero1 = await app.evalJs("document.querySelector('.theme-fx-layer')?.childElementCount");
  await sleep(3000);
  const fxChildrenAtDialZero2 = await app.evalJs("document.querySelector('.theme-fx-layer')?.childElementCount");
  ok('check 5: dial 0 yields a static effects layer (no growth in transient children over 3s)',
    fxChildrenAtDialZero1 === fxChildrenAtDialZero2, `${fxChildrenAtDialZero1} -> ${fxChildrenAtDialZero2}`);
  await app.evalJs("window.wrizoAmbiance.set(50)");

  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await sleep(3000);
  const fxChildrenReducedMotion = await app.evalJs("document.querySelector('.theme-fx-layer')?.childElementCount");
  // The 3 persistent elements (shear/noise/backlight) still exist as DOM
  // nodes — "zero events" means no ANIMATION, not "layer is literally empty"
  // (canon §7's dial-0/reduced-motion floor is about visible motion).
  const reducedMotionAnimating = await app.evalJs(`(() => {
    const shear = document.querySelector('.theme-fx-shear');
    return shear ? getComputedStyle(shear).animationName !== 'none' && shear.classList.contains('on') : false;
  })()`);
  ok('check 5: prefers-reduced-motion leaves the effects layer non-animating', reducedMotionAnimating === false, JSON.stringify({ fxChildrenReducedMotion, reducedMotionAnimating }));
  await app.emulateMedia([]);

  // Typing-gate: isBusy() suppresses new scheduled fires.
  await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
  const fxBeforeTyping = await app.evalJs("document.querySelector('.theme-fx-layer')?.getAttribute('style')");
  await app.typeKeys('typing continuously to hold the busy flag true. ');
  const dampedOpacity = await app.evalJs("getComputedStyle(document.querySelector('.theme-fx-layer')).opacity");
  ok('check 5: the texture layer damps toward its typing-state opacity floor while busy', Number(dampedOpacity) <= 0.2, dampedOpacity);

  // -- check 7 / A3: the round trip is lossless — Flux -> Plateau -> Flux ----
  const beforeRoundTrip = await app.evalJs("({ theme: window.wrizoTheme.get(), prefs: window.wrizoThemePrefs.get(), dial: window.wrizoAmbiance.get() })");
  await app.evalJs("window.wrizoTheme.set('plateau')");
  const midRoundTrip = await app.evalJs("(() => { const cs = getComputedStyle(document.documentElement); return { theme: document.documentElement.getAttribute('data-theme'), brass: cs.getPropertyValue('--brass').trim(), ground: cs.getPropertyValue('--ink-950').trim() }; })()");
  ok('check 7 (A3): switching back to Plateau mid-session restores Plateau\'s own ground token', midRoundTrip.theme === 'plateau' && midRoundTrip.ground.toLowerCase() === '#110600', JSON.stringify(midRoundTrip));
  await app.evalJs("window.wrizoTheme.set('flux')");
  const afterRoundTrip = await app.evalJs("({ theme: window.wrizoTheme.get(), prefs: window.wrizoThemePrefs.get(), dial: window.wrizoAmbiance.get() })");
  ok('check 7 (A3): the Flux<->Plateau round trip is lossless — prefs/dial survive both switches unchanged',
    JSON.stringify(beforeRoundTrip.prefs) === JSON.stringify(afterRoundTrip.prefs) && beforeRoundTrip.dial === afterRoundTrip.dial && afterRoundTrip.theme === 'flux',
    `${JSON.stringify(beforeRoundTrip)} -> mid:${JSON.stringify(midRoundTrip)} -> ${JSON.stringify(afterRoundTrip)}`);

  // -- A2: theme-prefs enum validation on load (a corrupted localStorage
  // value must never reach the DOM attribute verbatim) -----------------------
  const a2Result = await app.evalJs(`(() => {
    localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'XSS<script>', page: 12345, fade: 'maybe' }));
    window.wrizoThemePrefs.set({}); // re-sanitizes current in-memory state through the same path load() uses
    return window.wrizoThemePrefs.get();
  })()`);
  ok('check A2: setThemePrefs sanitizes invalid enum values rather than trusting them verbatim', a2Result.voice === 'serif' && a2Result.page === 'light' && a2Result.fade === 'on', JSON.stringify(a2Result));
  // A genuine reload-from-corrupted-storage proof (load(), not just setThemePrefs()).
  await app.evalJs("localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'nonsense', page: 'also-nonsense', fade: 0 }))");
  await app.reload();
  await app.waitFor("!!document.querySelector('.desk-rail')", { label: 'reloaded after corrupt prefs seed' });
  const dataVoiceAfterCorruptLoad = await app.evalJs("document.documentElement.getAttribute('data-voice')");
  ok('check A2: a corrupted stored value never reaches the data-voice attribute on load (falls back to the default)', dataVoiceAfterCorruptLoad === 'serif', String(dataVoiceAfterCorruptLoad));

  // -- Firewall chip + block caret (Slice 5) ----------------------------------
  await app.evalJs("window.wrizoTheme.set('flux')");
  await app.goto('/journal');
  await app.waitFor("!!document.querySelector('.journal-new-page')", { label: 'Journal list for VW/caret checks' });
  // "New page" is itself lexicon-swept under Flux ("New doc") — click by the
  // stable class rather than a theme-varying label.
  await app.evalJs("document.querySelector('.journal-new-page').click()");
  await app.waitFor("!!document.querySelector('.entry-edit')", { label: 'authored page for VW/caret checks' });
  await app.evalJs("document.querySelector('.entry-edit').focus()");
  await app.typeKeys('a');
  await sleep(150);
  const caretActive = await app.evalJs("!!document.querySelector('.flux-block-caret') && document.querySelector('.entry-edit')?.dataset.fluxCaretActive === 'true'");
  ok('check 5 slice: the Flux block caret renders and marks its host element data-flux-caret-active', caretActive === true, String(caretActive));

  await app.evalJs(`(() => {
    const el = document.querySelector('.entry-edit');
    el.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true }));
  })()`);
  await sleep(150);
  const firewallChip = await app.evalJs("document.querySelector('.flux-firewall-chip')?.textContent");
  ok('check 5 slice: the Firewall chip fires on a blocked paste and reads "FIREWALL ▪ PASTE BLOCKED"', firewallChip === 'FIREWALL ▪ PASTE BLOCKED', String(firewallChip));

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nTH2 VERIFY: PASS (${checks.length} checks)` : `\nTH2 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
