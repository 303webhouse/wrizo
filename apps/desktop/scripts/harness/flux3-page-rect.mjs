// FLUX3 S0 - THE PAGE-RECT GUARD (Fable's slice plan, Oct 31: flux-rulings-oct31.md; spec draft 2 md5 d247caf3, §5 "the page-rect self-check is the first
// check of every slice"). The Flux redesign is built behind a URL flag, ?flux3=1 (no stored flag, no localStorage key). The law (AGENTS.md, PAGE IS
// PRIMARY; docs/page-primacy-canon.md): the page's rect is identical in every skin. This file is the guard every later slice keeps green:
//
//   R   the .mode-page rect with ?flux3=1 is IDENTICAL to the rect without it, in the Flux theme, at 1366x768 and 1920x1080, Page: Dark and Light,
//       Free Write and Draft (16 reads, 8 compared pairs; the pair count is printed and checked, so a cell that silently drops cannot pass).
//   P   premises, per read: the page and editor are mounted, data-theme is flux, data-page is the tone asked for, the asked-for mode tab is the
//       selected one, the flag is in location.search exactly when it should be, the splash is gone; the Typewriter state is the SAME on and off
//       (the Typewriter zoom is the one ruled rect exception and must never be what makes a pair differ or agree).
//   M   the guard can see (a landed mutant): with the flag on, a 3px `translate` on .mode-page (applied, computed value asserted) makes the
//       comparison report a difference. Removed in a finally.
//   B   the build: the bundle served is the one in dist-web, and dist-web is newer than the last commit that touched apps/desktop/src (the stale-build
//       lesson of Oct 31). Printed as a BUILD line on every run.
//
// Today (S0) the flag does nothing, so R passes trivially; that is the point - it is the baseline the S1..S5 builds must keep.
//
// Run: node scripts/harness/flux3-page-rect.mjs   (from apps/desktop; needs a box turn, or a hosted runner)
//      FLUX3_SHOTS=<dir> also writes a frame per read (both tones, both widths, both surfaces, flag off and on).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });

// ---- the build this run uses ------------------------------------------------------------------------------------------------------------------------
function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: reported as null, and B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale}`);

// ---- the matrix ---------------------------------------------------------------------------------------------------------------------------------------
const VIEWS = [[1366, 768], [1920, 1080]];
const TONES = ['dark', 'light'];
const SURFACES = [['freewrite', 'Free Write'], ['draft', 'Draft']];
const rectKey = (r) => (r ? `${r.x},${r.y},${r.w},${r.h}` : 'none');
// identical means identical: the rect is read to 1/100 px and compared exactly
const sameRect = (a, b) => !!a && !!b && rectKey(a) === rectKey(b);

const STATE = `(() => {
  const root = document.documentElement, p = document.querySelector('.mode-page'), r = p ? p.getBoundingClientRect() : null;
  const tab = document.querySelector('[data-mode-key][aria-selected="true"]'), tw = document.querySelector('.mode-scroll[data-typewriter]');
  const scripts = [...document.scripts].map((s) => s.getAttribute('src') || '').filter((s) => /index-/.test(s));
  return {
    theme: root.getAttribute('data-theme'), page: root.getAttribute('data-page'), mode: tab ? tab.getAttribute('data-mode-key') : null,
    flag: new URLSearchParams(location.search).get('flux3'), editor: !!document.querySelector('.forward-only-editor'), splash: !!document.querySelector('.wz-splash'),
    typewriter: tw ? tw.getAttribute('data-typewriter') : null, jacked: root.hasAttribute('data-flux3-jacked'), zoom: p && p.closest('.mode-pagecol') ? p.closest('.mode-pagecol').getAttribute('data-zoom') : null, served: scripts.length ? scripts[0].replace(/^.*\\//, '') : null,
    rect: r ? { x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } : null,
  };
})()`;

try { await withHarness(async (app) => {
  const state = () => app.evalJs(STATE);
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
  const snap = async (name) => {
    if (!SHOTS) return;
    fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64'));
  };

  // a fresh account in the Flux theme, and one page created through the app's own door (no seeding). The page is made while Flux is the theme,
  // so its remembered Typewriter value is Flux's default (off) on both sides of the flag.
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted' });
  await splashGone();
  const pageHash = await app.evalJs('location.hash');
  ok('P0 a page was opened through the app (CreateProject -> Start writing)', /^#\/page\//.test(pageHash), pageHash);

  // the tone is the existing Page pref (wrizo-theme-prefs, a pref and not a collection); the flag is the URL query, set before the hash so it survives
  // every hash route. Each (flag, tone) is one reload; the surfaces and widths are read inside it.
  const open = async (flagOn, tone) => {
    await app.evalJs(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p)); })()`);
    await app.evalJs(`history.replaceState(null, '', ${JSON.stringify(flagOn ? '/?flux3=1' : '/')} + ${JSON.stringify(pageHash)})`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'page after reload' }).catch(() => {});
    await splashGone();
    await sleep(400);
  };
  const toSurface = async (key) => {
    await app.evalJs(`(() => { const b = document.querySelector('[data-mode-key=${JSON.stringify(key)}]'); if (b) b.click(); return !!b; })()`);
    await app.waitFor(`document.querySelector('[data-mode-key=${JSON.stringify(key)}]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: `surface ${key}` }).catch(() => {});
    await sleep(700); // the mode switch settles (its own re-persist lands ~1.1 s later and moves nothing)
  };

  const reads = {};
  const premises = [];
  for (const flagOn of [false, true]) {
    for (const tone of TONES) {
      await open(flagOn, tone);
      for (const [key, label] of SURFACES) {
        await toSurface(key);
        for (const [w, h] of VIEWS) {
          await app.emulateDpr(1, w, h);
          await sleep(450);
          const s = await state();
          const cell = `${tone} ${label} ${w}x${h}`;
          reads[`${flagOn ? 'on' : 'off'}|${cell}`] = s;
          const good = s.editor && !s.splash && s.theme === 'flux' && s.page === tone && s.mode === key && (flagOn ? s.flag === '1' : s.flag === null) && !!s.rect;
          premises.push({ cell: `${flagOn ? 'flag on' : 'flag off'} ${cell}`, good, s: good ? undefined : s, raw: s, flagOn, tone, key });
          await snap(`s0-rect-${flagOn ? 'on' : 'off'}-${tone}-${key}-${w}`);
        }
      }
    }
  }
  await app.emulateDpr(1, 1366, 768);

  const bad = premises.filter((p) => !p.good);
  // PARKED - SUPERSEDED (S4 Corridor, Nov 10; the original P1, verbatim, no longer runs; its successor P1b follows). Under ?flux3=1 Flux's Free Write IS Jacked In (draft 21 §6: a mode, always dark, whatever
  // the saved Page tone): the 'flag on, light, Free Write' cells read page 'dark', which the original `s.page === tone` calls a stand-in that did not stand.
  // ok(`P1 every read stood where it claimed (page + editor mounted, splash gone, data-theme flux, the asked tone and surface, the flag exactly when on): ${premises.length - bad.length}/${premises.length}`,
  // premises.length === 16 && bad.length === 0, JSON.stringify(bad.slice(0, 3)));
  // SUCCESSOR P1b: the same premise, with the one thing the ruling changed: flag on + Free Write reads the tone 'dark' (Jacked In, always dark) and the Typewriter running; every other cell reads the tone asked.
  const standsAs = (p) => { const s = p.raw; const jacked = p.flagOn && p.key === 'freewrite'; return !!s && s.editor && !s.splash && s.theme === 'flux' && s.page === (jacked ? 'dark' : p.tone) && s.mode === p.key && (p.flagOn ? s.flag === '1' : s.flag === null) && !!s.rect && (!jacked || s.typewriter === 'true'); };
  const bad2 = premises.filter((p) => !standsAs(p));
  // PARKED - SUPERSEDED (Wire In on its own, Nov 12; Fable's go "BUILD the Corridor on its own in today's Flux"; the P1b below, verbatim, no longer runs; its successor P1c follows). Without the flag too, Flux's Free Write IS Wire In
  // now (the Corridor: always dark, zoomed, marked data-flux3-jacked, the Typewriter running), so the two 'flag off light Free Write' cells (1366 and 1920) read page 'dark' where P1b's `jacked` (flag on + Free Write only)
  // asks for the saved tone: 14/16 stood where claimed. P1b's own words ("flag on + Free Write = Jacked In") name the flag the ruling removed.
  // ok(`P1b every read stood where it claimed (page + editor mounted, splash gone, data-theme flux, the asked tone and surface, the flag exactly when on; flag on + Free Write = Jacked In: dark, Typewriter running): ${premises.length - bad2.length}/${premises.length}`,
  //   premises.length === 16 && bad2.length === 0, JSON.stringify(bad2.slice(0, 3).map((p) => ({ cell: p.cell, s: p.raw }))));
  // SUCCESSOR P1c: the same premise, with the one thing the ruling changed: in Flux Free Write is Wire In WITH OR WITHOUT the flag: every Free Write cell reads page 'dark', data-flux3-jacked set, the page zoomed
  // (data-zoom 'true') and the Typewriter running; every Draft (TEXT) cell reads the tone asked, not jacked, not zoomed, no Typewriter; the flag exactly when on.
  const standsAs2 = (p) => {
    const s = p.raw, wired = p.key === 'freewrite';
    return !!s && s.editor && !s.splash && s.theme === 'flux' && s.page === (wired ? 'dark' : p.tone) && s.mode === p.key && (p.flagOn ? s.flag === '1' : s.flag === null) && !!s.rect
      && (wired ? s.jacked === true && s.zoom === 'true' && s.typewriter === 'true' : s.jacked === false && s.zoom !== 'true' && s.typewriter !== 'true');
  };
  const bad3 = premises.filter((p) => !standsAs2(p));
  ok(`P1c every read stood where it claimed (page + editor mounted, splash gone, data-theme flux, the flag exactly when on; Free Write = Wire In with or without the flag: dark, marked, zoomed, Typewriter running; Draft = the tone asked, plain page, no zoom, no Typewriter): ${premises.length - bad3.length}/${premises.length}`,
    premises.length === 16 && bad3.length === 0, JSON.stringify(bad3.slice(0, 3).map((p) => ({ cell: p.cell, s: p.raw }))));
  // P1b's mutant: a cell that read the wrong tone in a plain-page cell, or Jacked In without its Typewriter, fails the same premise
  const wrongTone = premises.map((p, i) => (i === 0 ? { ...p, raw: { ...p.raw, page: p.tone === 'dark' ? 'light' : 'dark' } } : p));
  const noTypewriter = premises.map((p) => (p.flagOn && p.key === 'freewrite' ? { ...p, raw: { ...p.raw, typewriter: 'false' } } : p));
  // PARKED - SUPERSEDED (Nov 12): this is the mutant of the P1b premise parked above (it exercises standsAs, P1b's own predicate, whose `jacked` is flag on + Free Write only). P1b no longer runs, so neither does its mutant. Verbatim, no longer run; the successor MUT-P1c follows.
  // ok('MUT-P1b the premise goes RED on a plain-page cell with the wrong tone and on Jacked In without its Typewriter', wrongTone.some((p) => !standsAs(p)) && noTypewriter.some((p) => !standsAs(p)), '');
  // MUT-P1c: P1c goes RED on each form it exists to catch, each one cell's raw read changed (the cell stood before, asserted) and the SAME predicate asked: a Draft cell with the wrong tone; the exact cell that failed P1b's way
  // (flag OFF, light, Free Write) reading the saved tone instead of dark; Free Write not marked jacked / without its Typewriter / not zoomed; a Draft cell zoomed or marked jacked.
  const iDraft = premises.findIndex((p) => p.key === 'draft'), iWiredOff = premises.findIndex((p) => p.key === 'freewrite' && !p.flagOn && p.tone === 'light'), iWired = premises.findIndex((p) => p.key === 'freewrite');
  const mut1c = (name, i, patch) => { const p = premises[i]; const m = p ? { ...p, raw: { ...p.raw, ...patch(p) } } : null; return { name, stoodBefore: !!p && standsAs2(p), red: !!m && !standsAs2(m) }; };
  const mutants1c = [
    mut1c('wrong tone on a Draft cell', iDraft, (p) => ({ page: p.tone === 'dark' ? 'light' : 'dark' })),
    mut1c('flag-off light Free Write reading the saved tone (the P1b way)', iWiredOff, (p) => ({ page: p.tone })),
    mut1c('Free Write not marked jacked', iWired, () => ({ jacked: false })),
    mut1c('Free Write without its Typewriter', iWired, () => ({ typewriter: 'false' })),
    mut1c('Free Write not zoomed', iWired, () => ({ zoom: 'false' })),
    mut1c('a Draft cell zoomed', iDraft, () => ({ zoom: 'true' })),
    mut1c('a Draft cell marked jacked', iDraft, () => ({ jacked: true })),
  ];
  ok('MUT-P1c the premise goes RED on each mutant (a Draft cell with the wrong tone, flag-off light Free Write reading the saved tone, Free Write not jacked / without its Typewriter / not zoomed, a Draft cell zoomed or jacked), each cell having stood before',
    mutants1c.every((m) => m.stoodBefore && m.red), JSON.stringify(mutants1c));

  // R: the same cell, flag off vs on
  let pairs = 0;
  const diffs = [];
  const twDiffs = [];
  for (const tone of TONES) for (const [, label] of SURFACES) for (const [w, h] of VIEWS) {
    const cell = `${tone} ${label} ${w}x${h}`;
    const off = reads[`off|${cell}`], on = reads[`on|${cell}`];
    if (!off || !on) continue;
    pairs += 1;
    if (off.typewriter !== on.typewriter) twDiffs.push({ cell, off: off.typewriter, on: on.typewriter });
    const same = sameRect(off.rect, on.rect);
    if (!same) diffs.push({ cell, off: off.rect, on: on.rect });
    ok(`R [${cell}] the page rect with ?flux3=1 is identical to the rect without it`, same, JSON.stringify({ off: off.rect, on: on.rect }));
  }
  ok(`R coverage: ${pairs}/8 cells compared (1366 + 1920, dark + light, Free Write + Draft)`, pairs === 8, JSON.stringify(diffs));
  ok('P2 the Typewriter state is the same with the flag on and off in every cell (the ruled zoom exception never decides a pair)', pairs === 8 && twDiffs.length === 0, JSON.stringify(twDiffs));

  // R-WIRED (Nov 12, Wire In on its own): WHAT R NOW MEASURES, AND WHAT THIS ADDS. Without the flag Flux's Free Write is Wire In (zoomed, always dark, jacked), so R's two Free Write columns compare the Corridor flag OFF against the
  // Corridor flag ON (the redesign's other pieces must not move it) and its two Draft columns compare the plain TEXT page both ways; neither asks the page-primacy question for the flag-off Corridor ITSELF: does the page's rect hold
  // while Wire In's own overlays open and close (the entry line, the 4 s nudge, the circled X, the chrome fading out)? So: flag OFF, each tone, 1366: open Wire In, read the rect (settled), wait out the entry line and its fade
  // (EXIT_LINE_MS 3000 + EXIT_FADE_MS 600) and the nudge (4 s), read it again: the same rect, and the same rect the R loop read for that cell. Structure only (marked, zoomed, always dark); no pixel value is claimed.
  const wiredRect = [];
  for (const tone of TONES) {
    await open(false, tone);
    await toSurface('freewrite');
    const first = await state();
    await sleep(4600);
    const later = await state();
    wiredRect.push({ tone, first, later });
    const prior = reads[`off|${tone} Free Write 1366x768`];
    ok(`R-WIRED [flag off, ${tone}] Wire In: the page rect holds while its overlays come and go (settled, then after the entry line, its fade and the nudge) and equals the R loop's read of the cell (marked, zoomed, dark: ${first.jacked}/${first.zoom}/${first.page})`,
      first.jacked === true && first.zoom === 'true' && first.page === 'dark' && first.flag === null && first.mode === 'freewrite' && later.jacked === true && later.zoom === 'true' && !!first.rect && sameRect(first.rect, later.rect) && !!prior && sameRect(prior.rect, first.rect),
      JSON.stringify({ first: first.rect, later: later.rect, prior: prior && prior.rect, marks: [first.jacked, first.zoom, first.page, later.jacked, later.zoom] }));
  }
  // R-WIRED's mutant (landed): the page nudged 3px under the open Wire In (the light read's page, still mounted): the SAME comparison reports a difference; removed in a finally
  const lastWired = wiredRect[wiredRect.length - 1];
  try {
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'flux3-rect-wired-mutant'; s.textContent = '.mode-page{ translate: 3px 0 !important; }'; document.head.appendChild(s); })()");
    await sleep(200);
    const landedW = await app.evalJs("getComputedStyle(document.querySelector('.mode-page')).translate");
    const mutW = await state();
    ok('MUT-R-WIRED (mutant, landed) a 3px translate on .mode-page under a flag-off Wire In makes the R-WIRED comparison report a difference',
      /3px/.test(String(landedW)) && !!lastWired && lastWired.first.jacked === true && sameRect(lastWired.first.rect, lastWired.later.rect) && !sameRect(lastWired.first.rect, mutW.rect),
      JSON.stringify({ landed: landedW, before: lastWired && lastWired.first.rect, mutant: mutW.rect }));
  } finally {
    await app.evalJs("document.getElementById('flux3-rect-wired-mutant')?.remove()");
  }

  // M: the guard can see. Flag on, Dark, Draft, 1366: a 3px translate on the page must read as a different rect.
  await open(true, 'dark');
  await toSurface('draft');
  const base = reads['off|dark Draft 1366x768'];
  try {
    await app.evalJs("(() => { const s = document.createElement('style'); s.id = 'flux3-rect-mutant'; s.textContent = '.mode-page{ translate: 3px 0 !important; }'; document.head.appendChild(s); })()");
    await sleep(200);
    const landed = await app.evalJs("getComputedStyle(document.querySelector('.mode-page')).translate");
    const mut = await state();
    ok('M (mutant, landed) a 3px translate on .mode-page under the flag makes R report a difference', /3px/.test(String(landed)) && !!base && !sameRect(base.rect, mut.rect),
      JSON.stringify({ landed, off: base && base.rect, mutant: mut.rect }));
  } finally {
    await app.evalJs("document.getElementById('flux3-rect-mutant')?.remove()");
  }

  // B: the build
  const served = (reads['off|dark Draft 1366x768'] || {}).served;
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-PAGE-RECT VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-PAGE-RECT VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
