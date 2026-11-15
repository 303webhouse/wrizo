// FLUX-PAGE-INK (Fable, URGENT, fast lane) — the PAGE TEXT itself, not just
// card labels: ForwardOnlyEditor's `penColor` prop (ModeStage.tsx) is an
// unconditional inline-style override of .mode-page's own --ink-on-paper
// colour, applied only in Free Write (RAILS.journal.tools === 'pen'). Its
// default swatch (PEN_INKS[0] = '#1a0f06', "black-brown") is tuned for a
// light page and measured 1.16:1 against Flux dark's --paper (#0B2429) —
// Chat 1 ledger 62/72, docs/evidence/batch-b-ship-f44c66bd/runs/fluxdarktext.mjs
// and flux-dark-page-text-measurement.txt (constant rgb(26, 15, 6) across
// four separate builds, every Flux-dark frame measured).
//
// THE FIX (ModeStage.tsx): effectivePenInk(ink, theme, pageTone) swaps each
// of the three PEN_INKS for a dark-page-safe variant when theme==='flux' &&
// pageTone==='dark', at the ONE hand-off site both the framed host's
// controlled penColorProp (PageEditor.tsx's own, otherwise-dead, penColor
// state — confirmed no setPenColor call site exists, so the framed surface
// always carries PEN_INKS[0]) and the unframed bar's own internal `pen`
// state funnel through.
//
// Draft and Revise never receive a penColor at all (RAILS tools:'format'),
// so they always render .mode-page's own --ink-on-paper — already correct
// by hand WCAG calc (13.9:1 Flux dark) — and P1 below proves that stays true
// rather than assuming it. Arbor (plateau) has no dark-page variant at all
// (canon §11 debt, themePrefs.ts header) — selecting it is a documented
// no-op — so, matching card-label-contrast.mjs's own convention, this file
// never asserts plateau/dark.
//
// Run: node scripts/harness/flux-page-ink.mjs   (from apps/desktop, dist-web freshly built, box turn granted)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';

// WCAG 2.x contrast — copied verbatim from card-label-contrast.mjs's own
// contrastOf (itself flux-card-ink.mjs's/bg2.mjs's method): the element's
// own rendered colour against the first opaque ancestor background.
const contrastOf = (app, sel) => app.evalJs(`(() => {
  const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
  const parse = (c) => c.match(/[\\d.]+/g).slice(0, 3).map(Number);
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  let bgEl = el, bg = null;
  while (bgEl) {
    const c = getComputedStyle(bgEl).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\\(0, 0, 0, 0\\)/.test(c)) { bg = c; break; }
    bgEl = bgEl.parentElement;
  }
  const fg = getComputedStyle(el).color;
  const L1 = lum(parse(fg)), L2 = lum(parse(bg || 'rgb(255,255,255)'));
  const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  return { fg, bg, ratio: Math.round(ratio * 100) / 100 };
})()`);

// WIRE IN'S PAGE TEXT (Nov 12, Wire In on its own; Fable's go "BUILD the Corridor on its own in today's Flux"). In Flux a page's free-writing mode (Free Write, called Wire In) IS the Corridor: always dark
// (data-page=dark while wired in; the saved tone returns on leaving) and, on the zoomed framed page, the editor's text is painted by ONE gradient clipped to the glyphs (flux-wirein.css: the writing line
// --f3-ink, the line above it --f3-dim-ink) with the computed `color` transparent, so contrastOf's computed-colour read of the editor reads nothing there. This reads the same promise where it lives now:
// the two ink tokens that gradient is painted from, against the ground under the page, plus the structure that makes the gradient the paint (zoomed, clipped to text, a linear-gradient, color transparent).
// Structure and tokens only: no pixel values are guessed here. The dim line's floor is 4.5 (flux-wirein.css: "6.9:1 on the ground; the floor is 4.5:1"), the writing line's is Fable's 7.
const WIRED_DIM_FLOOR = 4.5;
const wiredInk = (app) => app.evalJs(`(() => {
  const root = document.documentElement, el = document.querySelector(${JSON.stringify(ED)}); if (!el) return null;
  const rgbOf = (c) => { const m = document.createElement('span'); m.style.color = c; document.body.appendChild(m); const v = getComputedStyle(m).color.match(/[\\d.]+/g).slice(0, 3).map(Number); m.remove(); return v; };
  const lum = (rgb) => { const [r, g, b] = rgb.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const A = lum(a), B = lum(b); return Math.round(((Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05)) * 100) / 100; };
  let bgEl = el, bg = null;
  while (bgEl) {
    const c = getComputedStyle(bgEl).backgroundColor;
    if (c && c !== 'transparent' && !/rgba\\(0, 0, 0, 0\\)/.test(c)) { bg = c; break; }
    bgEl = bgEl.parentElement;
  }
  const rs = getComputedStyle(root), cs = getComputedStyle(el);
  const inkTok = rs.getPropertyValue('--f3-ink').trim(), dimTok = rs.getPropertyValue('--f3-dim-ink').trim();
  const base = { jacked: root.hasAttribute('data-flux3-jacked'), page: root.getAttribute('data-page'), zoom: el.closest('.mode-pagecol')?.getAttribute('data-zoom') ?? null,
    color: cs.color, clip: cs.backgroundClip || cs.webkitBackgroundClip, image: String(cs.backgroundImage).slice(0, 24), inkTok, dimTok, bg };
  if (!inkTok || !dimTok || !bg) return base;
  const ground = rgbOf(bg), ink = rgbOf(inkTok), dim = rgbOf(dimTok);
  return { ...base, ink: 'rgb(' + ink.join(', ') + ')', dim: 'rgb(' + dim.join(', ') + ')', inkRatio: ratio(ink, ground), dimRatio: ratio(dim, ground) };
})()`);
const wiredOk = (r, floor) => !!r && r.jacked === true && r.page === 'dark' && r.zoom === 'true' && r.color === 'rgba(0, 0, 0, 0)' && r.clip === 'text' && /linear-gradient/.test(r.image || '')
  && typeof r.inkRatio === 'number' && r.inkRatio >= floor && r.dimRatio >= WIRED_DIM_FLOOR;
// the mutants' lever: ONE landed change to the token the gradient is painted from (an inline custom property on the root beats the stylesheet's), the SAME read, then undone
const withWiredInkMutant = async (app, ink, read) => {
  try {
    await app.evalJs(`document.documentElement.style.setProperty('--f3-ink', ${JSON.stringify(ink)})`);
    await sleep(120);
    return await read();
  } finally { await app.evalJs("document.documentElement.style.removeProperty('--f3-ink')"); }
};

const freshPage = async (app, theme, page, { width = 1400, id = 'fpi-page' } = {}) => {
  await app.emulateDpr(1, width, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* theme premise below still records */ }
  if (theme === 'flux') await app.evalJs("window.wrizoTheme.set('flux')");
  if (page === 'dark') await app.evalJs("window.wrizoThemePrefs.set({ page: 'dark' })");
  await sleep(200);
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({
    id, text: 'Line one of a loose page.\nLine two.\nLine three.\nLine four.\nLine five, the active one.',
    origin: 'loose', source: 'page', createdAt: '2026-05-01T00:00:00.000Z',
  })})`);
  await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor(`!!document.querySelector('${ED}')`, { label: 'the page' });
  await sleep(500);
};

const switchMode = async (app, label) => {
  await app.evalJs(`[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent === ${JSON.stringify(label)})?.click()`);
  await sleep(400);
};

await withHarness(async (app) => {
  const FLOOR = 7; // Fable's own line: "page text ... is >=7:1 in Flux dark and light"

  // P1 — the page surface itself, across every mode that reaches it
  // (Free Write/Draft/Revise), across every theme/page tone this app
  // currently ships a dark pair for (plateau/light stands as the
  // already-healthy control).
  for (const [theme, page] of [['plateau', 'light'], ['flux', 'light'], ['flux', 'dark']]) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { id: `fpi-p1-${theme}-${page}` });
    const now = await app.evalJs("(() => ({ theme: document.documentElement.getAttribute('data-theme') || 'plateau', page: document.documentElement.getAttribute('data-page') || 'light', jacked: document.documentElement.hasAttribute('data-flux3-jacked') }))()");
    const savedTone = await app.evalJs('window.wrizoThemePrefs.get().page');
    // ---- PARKED - SUPERSEDED (Nov 12, Wire In on its own): a loose page opens in Free Write, and in Flux Free Write IS Wire In: always dark (data-page=dark while wired in; the saved tone returns on leaving),
    // so the 'flux/light' cell read page 'dark' where this premise expects 'light'. Kept VERBATIM below; it still runs, unchanged, for the cells it is true of (Arbor); the Flux successor follows.
    //
    // ok(`${T} (premise) the page is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));
    if (theme === 'flux') {
      ok(`${T} (premise) the page opens in Wire In: theme=flux, data-page=dark while wired in, data-flux3-jacked set, the saved Page tone (${page}) held`,
        now.theme === 'flux' && now.page === 'dark' && now.jacked === true && savedTone === page, JSON.stringify({ ...now, savedTone }));
    } else {
      ok(`${T} (premise) the page is in theme=${theme} page=${page}`, now.theme === theme && now.page === page, JSON.stringify(now));
    }

    // ---- PARKED - SUPERSEDED by FLUX WORDS (Nick's Oct 12 pass, folded into flux-v2): under Flux the mode tabs read Wire In / Draft / Patch (Draft is held for Fable's confirmation and still reads Draft); Arbor keeps Free Write / Draft / Revise.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // for (const modeLabel of ['Free Write', 'Draft', 'Revise']) {
    // ---- PARKED - SUPERSEDED by Nick's answer (Oct 21): Flux's Draft tab reads "Text": the tab is found by its text.
    // Kept VERBATIM below and no longer run; the live successor follows.
    //
    // const modeLabels = theme === 'flux' ? ['Wire In', 'Draft', 'Patch'] : ['Free Write', 'Draft', 'Revise'];
    const modeLabels = theme === 'flux' ? ['Wire In', 'Text', 'Patch'] : ['Free Write', 'Draft', 'Revise'];
    for (const modeLabel of modeLabels) {
      await switchMode(app, modeLabel);
      const active = await app.evalJs("document.querySelector('.desk-mode-tab.active')?.textContent");
      ok(`${T} (premise) ${modeLabel} tab is active after switching`, active === modeLabel, JSON.stringify({ active }));
      // ---- PARKED - SUPERSEDED (Nov 12, Wire In on its own): in Flux the Wire In cell's text is drawn by a gradient clipped to the glyphs and its computed `color` is transparent (rgba(0, 0, 0, 0): 1.06:1 against the ground),
      // so the computed-colour read cannot see her ink there. Kept VERBATIM below; it still runs, unchanged, for every cell it describes (Arbor's three modes, Flux's Text and Patch); the Flux Wire In successor follows.
      //
      // const c = await contrastOf(app, ED);
      // ok(`${T} P1 ${modeLabel}: the page text carries against its own page (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
      if (theme === 'flux' && modeLabel === 'Wire In') {
        const w = await wiredInk(app);
        ok(`${T} P1 Wire In [wire-in successor]: her words carry in the Corridor: the gradient's writing-line ink ${w?.ink} is ${w?.inkRatio}:1 (>= ${FLOOR}) and the line above it ${w?.dim} is ${w?.dimRatio}:1 (>= ${WIRED_DIM_FLOOR}) against the ground ${w?.bg}, painted as a text-clipped gradient over a transparent colour`,
          wiredOk(w, FLOOR), JSON.stringify(w));
        if (page === 'dark') {
          // its mutant: the writing line's token turned to Arbor's literal #1A0F06 (dark on the dark ground), the SAME read goes RED (and green again undone)
          const mut = await withWiredInkMutant(app, '#1A0F06', () => wiredInk(app));
          const back = await wiredInk(app);
          ok(`${T} MUT-P1-WIRED the Wire In reader goes RED on its mutant (--f3-ink -> #1A0F06: ${mut?.inkRatio}:1) and green again undone`, !!mut && mut.ink === 'rgb(26, 15, 6)' && !wiredOk(mut, FLOOR) && wiredOk(back, FLOOR), JSON.stringify({ mut, back }));
        }
      } else {
        const c = await contrastOf(app, ED);
        ok(`${T} P1 ${modeLabel}: the page text carries against its own page (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
      }
    }
  }

  // P2 — the typewriter fade's CURRENT line. The fade mask (index.css
  // .mode-scroll[data-typewriter='true'][data-scrolled='true']) only dims
  // SCROLLED-PAST history (alpha ramps 15%→100% over --tw-fade-band); the
  // active line always sits in the fully-opaque zone, so its own computed
  // `color` — what contrastOf measures — must carry the identical fix. This
  // proves the typewriter path doesn't reach past the one hand-off site and
  // reapply the raw ink some other way.
  for (const [theme, page] of [['flux', 'dark'], ['flux', 'light']]) {
    const T = `[${theme}/${page}]`;
    await freshPage(app, theme, page, { id: `fpi-p2-${theme}-${page}` });
    await app.evalJs(`(() => { const ed = document.querySelector('${ED}'); ed.focus(); const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()`);
    for (let i = 1; i <= 6; i += 1) { await app.typeKeys(`\nMore history riding up into the page, line ${i}.`); await sleep(120); }
    let scrolled = false;
    try { await app.waitFor("document.querySelector('.mode-scroll')?.dataset.scrolled === 'true'", { label: 'history scrolled', timeout: 6000 }); scrolled = true; } catch { /* recorded as a failed premise below */ }
    ok(`${T} (premise) the typewriter has engaged and the history has scrolled`, scrolled);
    if (scrolled) {
      // ---- PARKED - SUPERSEDED (Nov 12, Wire In on its own): both cells are Wire In now (Flux's free-writing mode, always dark; the paper Typewriter is retired in Flux), whose text is drawn by a text-clipped gradient with a
      // transparent computed `color` (rgba(0, 0, 0, 0): 1.06:1), so the computed-colour read sees nothing. The mask is gone with the paper: the Corridor's rect clip hides the lines older than the last two and the gradient
      // paints the writing line in --f3-ink. Kept VERBATIM below and no longer run; the live successor follows.
      //
      // const c = await contrastOf(app, ED);
      // ok(`${T} P2: the typewriter fade's active line keeps the fixed ink (computed ${c?.ratio}:1, >= ${FLOOR}) — the mask dims history, never the current line's own colour`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
      const w = await wiredInk(app);
      ok(`${T} P2 [wire-in successor]: after the history has scrolled, the Corridor's active (writing) line keeps its ink ${w?.ink} (${w?.inkRatio}:1, >= ${FLOOR}) and the editor is still the text-clipped gradient over a transparent colour (the clip hides older lines, it never recolours the writing line)`,
        wiredOk(w, FLOOR), JSON.stringify(w));
      if (page === 'dark') {
        const mut = await withWiredInkMutant(app, '#1A0F06', () => wiredInk(app));
        const back = await wiredInk(app);
        ok(`${T} MUT-P2-WIRED the scrolled-history reader goes RED on its mutant (--f3-ink -> #1A0F06: ${mut?.inkRatio}:1) and green again undone`, !!mut && mut.ink === 'rgb(26, 15, 6)' && !wiredOk(mut, FLOOR) && wiredOk(back, FLOOR), JSON.stringify({ mut, back }));
      }
    }
  }

  // P3 — the unframed pen bar's own three swatches (ModeStage.tsx, <1100px):
  // the one place a writer can still pick red/blue, not only the framed
  // host's dead-default black-brown. Each of the three PEN_INKS entries
  // must clear the floor once chosen, in Flux dark.
  {
    const T = '[flux/dark unframed]';
    await freshPage(app, 'flux', 'dark', { width: 800, id: 'fpi-p3' });
    const swatchCount = await app.evalJs("document.querySelectorAll('.mode-swatch').length");
    ok(`${T} (premise) the unframed pen bar shows its 3 ink swatches`, swatchCount === 3, JSON.stringify({ swatchCount }));
    for (let i = 0; i < swatchCount; i += 1) {
      await app.evalJs(`document.querySelectorAll('.mode-swatch')[${i}].click()`);
      await sleep(200);
      const c = await contrastOf(app, ED);
      ok(`${T} P3 swatch ${i}: the chosen pen ink carries against Flux dark's page (computed ${c?.ratio}:1, >= ${FLOOR})`, !!c && c.ratio >= FLOOR, JSON.stringify(c));
    }
  }

  // P4 — theme-leftovers (Fable, Oct 16): "Flux light Free Write's default
  // pen ink is Arbor's #1A0F06; use Flux's ink instead." NOT a contrast gap —
  // P1 above already proves Arbor's black-brown carries fine on Flux light's
  // own paper, so it never caught this — it is an IDENTITY gap: the default
  // swatch was never re-pointed to Flux's own ink there at all. Asserts the
  // actual rendered colour, not just that it carries.
  {
    const T = '[flux/light default ink]';
    await freshPage(app, 'flux', 'light', { id: 'fpi-p4' });
    // ARCHIVED PARK (#13 step 14): archive/flux-page-ink.mjs.parked.md record 1

    // ---- PARKED - SUPERSEDED (Nov 12, Wire In on its own): Free Write in Flux is Wire In now (the Corridor, always dark), and its words are drawn by a text-clipped gradient with a transparent computed `color`
    // (rgba(0, 0, 0, 0)); the pen ink this read measured (--ink-on-paper) is no longer what paints the page in Free Write. The identity promise (Flux's OWN ink, never Arbor's literal #1A0F06) lives in two places
    // now: the Corridor's gradient ink token (--f3-ink, P4 [wire-in successor]) and the ink of Flux light's Text page, the page a writer lands on leaving Wire In (P4 [text successor]).
    // Kept VERBATIM below and no longer run; the live successors follow.
    //
    // const c = await contrastOf(app, ED);
    // ok(`${T} P4 [flux-v2 successor]: Free Write's default pen ink is Flux's OWN ink (--ink-on-paper #042632 = rgb(4, 38, 50)), never Arbor's literal #1A0F06 (computed ${c?.fg})`,
    //   !!c && c.fg === 'rgb(4, 38, 50)', JSON.stringify(c));
    const ARBOR_INK = 'rgb(26, 15, 6)';   // Arbor's #1A0F06, the literal this promise forbids
    const w = await wiredInk(app);
    const saved = await app.evalJs('window.wrizoThemePrefs.get().page');
    const p4wOk = (r) => wiredOk(r, FLOOR) && r.ink === 'rgb(232, 246, 250)' && r.ink !== ARBOR_INK && r.dim !== ARBOR_INK;
    ok(`${T} P4 [wire-in successor]: on a Flux page saved light, Wire In paints her words in Flux's OWN ink (--f3-ink #E8F6FA = rgb(232, 246, 250); read ${w?.ink}, dim line ${w?.dim}), never Arbor's literal #1A0F06 (the saved tone ${saved} is held)`,
      p4wOk(w) && saved === 'light', JSON.stringify({ ...w, saved }));
    // its mutant: the token turned to plain white (it carries, so only the identity clause can see it), the SAME read goes RED and green again undone
    const mutW = await withWiredInkMutant(app, '#FFFFFF', () => wiredInk(app));
    const backW = await wiredInk(app);
    ok(`${T} MUT-P4-WIRED the Wire In ink-identity read goes RED on its mutant (--f3-ink -> #FFFFFF: ${mutW?.ink}) and green again undone`, !!mutW && mutW.ink === 'rgb(255, 255, 255)' && !p4wOk(mutW) && p4wOk(backW), JSON.stringify({ mutW, backW }));
    await switchMode(app, 'Text');
    const c = await contrastOf(app, ED);
    ok(`${T} P4 [text successor]: Flux light's Text page default ink is Flux's OWN ink (--ink-on-paper #042632 = rgb(4, 38, 50)), never Arbor's literal #1A0F06 (computed ${c?.fg})`,
      !!c && c.fg === 'rgb(4, 38, 50)', JSON.stringify(c));
    // its mutant: the editor's colour forced to Arbor's literal inline, the SAME read goes RED and green again undone
    let mutT = null;
    try {
      await app.evalJs(`document.querySelector('${ED}').style.setProperty('color', '#1A0F06', 'important')`);
      await sleep(120);
      mutT = await contrastOf(app, ED);
    } finally { await app.evalJs(`document.querySelector('${ED}').style.removeProperty('color')`); }
    await sleep(120);
    const backT = await contrastOf(app, ED);
    ok(`${T} MUT-P4-TEXT the Text-page ink read goes RED on its mutant (the editor forced to #1A0F06: ${mutT?.fg}) and green again undone`, !!mutT && mutT.fg === ARBOR_INK && mutT.fg !== 'rgb(4, 38, 50)' && !!backT && backT.fg === 'rgb(4, 38, 50)', JSON.stringify({ mutT, backT }));
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nFLUX-PAGE-INK VERIFY: PASS (${checks.length} checks)` : `\nFLUX-PAGE-INK VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
