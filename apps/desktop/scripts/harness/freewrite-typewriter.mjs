// FREE WRITE IS THE TYPEWRITER (Nick, Nov 19, 2:10 pm: "make Free Write everywhere just Typewriter mode ... If a User wants the full page view with menu options, then they can just be in Draft."; Fable's ruling, 2:25 pm).
// Free Write ALWAYS runs the Typewriter, in every theme (as Flux's Wire In already did); Draft NEVER does; the Typewriter switch leaves both stages; every stored value (wrizo-typewriter-page-*, settings.typewriter) is kept as data, read by nothing, deleted by nothing; no new saved data.
//   FW-FRESH  per theme x tone: a FRESH page (nothing stored for the Typewriter) opened in Free Write is ZOOMED (the page column carries data-zoom) with the Typewriter fade on (the scroller's data-typewriter is true)
//   FW-OLD    per theme x tone: an OLD page whose switch was OFF (the page's own value 'off', the shared setting off) opened in Free Write is zoomed with the fade on all the same
//   DR-ON     per theme x tone: a Draft page whose switch was ON (the page's own value 'on', the shared setting on, text on it) is NEVER zoomed, its scroller's data-typewriter is false
//   DR-FRESH  per theme x tone: a fresh EMPTY Draft page (the plateau skin's old default was ON) is never zoomed either
//   GONE      the switch is gone from both stages: no .typewriter-toggle, no [data-mode-toggle="typewriter"], and the gear's panel offers no Typewriter row, in Free Write and in Draft
//   DATA      kept as data, read by nothing, deleted by nothing, nothing new saved: after a page opens and takes keys, the seeded per-page values stay exactly as seeded ('off', 'on'), the shared setting is untouched, and a fresh page's own key is never created
//   MUT-*     each old path put back goes RED on its own read: Free Write reading the shared switch (the old-off page unzooms), Draft reading the page's own value (the on page zooms); a mutant that did not land fails the run
// Run: node scripts/harness/freewrite-typewriter.mjs (from apps/desktop; a box turn or Actions). FREE_WRITE_SHOTS=<dir> writes frames.
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const SHOTS = process.env.FREE_WRITE_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const THEMES = ['plateau', 'flux', 'machina'];
const TONES = ['dark', 'light'];

// the old paths put back, as text rewrites of the built bundle (the names are the minifier's, so every one is captured, never typed): ModeStage's three lines
//   P = isFluxTheme(N) && pageId != null, L = N === 'flux' ? P && mode === 'journal' : mode === 'journal', z = L && !P
const SHAPE = /([\w$]+)=([\w$]+)\(([\w$]+)\)&&([\w$]+)!=null,([\w$]+)=\3==="flux"\?\1&&([\w$]+)==="journal":\6==="journal",([\w$]+)=\5&&!\1,/g;
const MUTANTS = {
  // Free Write reading the shared switch again (the old Free Write line: settings.typewriter, a stored value)
  fwswitch: [SHAPE, '$1=$2($3)&&$4!=null,$5=$3==="flux"?$1&&$6==="journal":$6==="journal"&&JSON.parse(localStorage.getItem("wrizo-writing-settings")||"{}").typewriter!==false,$7=$5&&!$1,'],
  // Draft reading this page's own saved value again (the old Draft line: typewriterForPage)
  draftpage: [SHAPE, '$1=$2($3)&&$4!=null,$5=($3==="flux"?$1&&$6==="journal":$6==="journal")||($6==="drafting"&&$4!=null&&localStorage.getItem("wrizo-typewriter-page-"+$4)==="on"),$7=$5&&!$1,'],
};

const PROBE = `(() => { const col = document.querySelector('.mode-pagecol'); const sc = document.querySelector('.mode-scroll'); const pg = document.querySelector('.mode-page'); const r = pg ? pg.getBoundingClientRect() : null;
  return { editor: !!document.querySelector('.forward-only-editor'), col: !!col, zoom: col ? col.getAttribute('data-zoom') : null, tw: sc ? sc.getAttribute('data-typewriter') : null, pageW: r ? Math.round(r.width) : null,
    toggles: document.querySelectorAll('.typewriter-toggle, [data-mode-toggle="typewriter"]').length }; })()`;
const GEAR = `(async () => { const g = document.querySelector('.mode-gear'); if (!g) return { gear: false }; g.click(); await new Promise((r) => setTimeout(r, 400));
  const wrap = document.querySelector('.mode-gear-wrap'); const txt = wrap ? wrap.innerText : ''; g.click(); await new Promise((r) => setTimeout(r, 200)); return { gear: true, hasTypewriterRow: /typewriter/i.test(txt), text: txt.slice(0, 200) }; })()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});

  let mutant = null;
  const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      if (mutant) {
        const [from, to] = MUTANTS[mutant];
        const n = (text.match(from) || []).length;
        landed[mutant] = n;
        if (n === 1) text = text.replace(from, to);
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });

  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  let seq = 0;
  const OLD_TEXT = 'Some old words.\nA second line.';

  // one case: the page is created through the app's own seam while off any writing surface (the harness seeding law), then the Typewriter's stored values are set (settings and the page's own key are plain keys, not collections), then the page is opened in the wanted mode
  const openCase = async ({ theme, tone, mode, text, pageKey, setting }) => {
    const id = `fwt-${Date.now()}-${seq += 1}`;
    await ev(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' })})`);
    await sleep(300);
    await ev(`(() => { localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${JSON.stringify(tone)}, fade: 'on' }));
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { typewriter: ${JSON.stringify(setting)}, instrumentsOn: true }); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)});
      ${pageKey ? `localStorage.setItem('wrizo-typewriter-page-${id}', ${JSON.stringify(pageKey)});` : `localStorage.removeItem('wrizo-typewriter-page-${id}');`} })()`);
    await ev(`history.replaceState(null, '', '/#/page/${id}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: `the ${mode} page` }).catch(() => {});
    await splashGone();
    await sleep(1400);
    return id;
  };
  const zoomed = (r) => !!r && r.col && r.zoom === 'true' && r.tw === 'true';
  const plain = (r) => !!r && r.col && r.zoom !== 'true' && r.tw === 'false';
  const CASES = {
    fresh: { mode: 'journal', text: '', pageKey: null, setting: true },
    old: { mode: 'journal', text: OLD_TEXT, pageKey: 'off', setting: false },
    draftOn: { mode: 'drafting', text: OLD_TEXT, pageKey: 'on', setting: true },
    draftFresh: { mode: 'drafting', text: '', pageKey: null, setting: true },
  };

  // ---- per theme x tone: the four situations, the switch gone, the data left alone --------------------------------------------------------------------
  for (const theme of THEMES) for (const tone of TONES) {
    const T = `${theme}/${tone}`;
    let id = await openCase({ theme, tone, ...CASES.fresh });
    const fresh = await ev(PROBE);
    const gearFw = await ev(GEAR);
    ok(`FW-FRESH [${T}] a fresh page opened in Free Write is zoomed with the Typewriter fade on (data-zoom ${fresh.zoom}, data-typewriter ${fresh.tw}, page ${fresh.pageW}px)`, zoomed(fresh), JSON.stringify(fresh));
    ok(`GONE [${T}] Free Write offers no Typewriter switch: no toggle button (${fresh.toggles}), and the gear's panel has no Typewriter row (${gearFw.hasTypewriterRow})`, fresh.toggles === 0 && gearFw.gear && gearFw.hasTypewriterRow === false, JSON.stringify({ toggles: fresh.toggles, gearFw }));
    // keys: nothing new may be saved for the page's Typewriter
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (e) e.focus(); })()");
    for (const ch of 'a few words') { await app.typeKeys(ch); await sleep(30); }
    await sleep(700);
    const freshKey = await ev(`localStorage.getItem('wrizo-typewriter-page-${id}')`);
    ok(`DATA [${T}] a fresh page's Typewriter value is never created (no new saved data): the page key reads ${JSON.stringify(freshKey)}`, freshKey === null, JSON.stringify({ freshKey }));
    await snap(`fw-fresh-${theme}-${tone}`);

    id = await openCase({ theme, tone, ...CASES.old });
    const old = await ev(PROBE);
    await ev("(() => { const e = document.querySelector('.forward-only-editor'); if (e) e.focus(); })()");
    for (const ch of 'more') { await app.typeKeys(ch); await sleep(30); }
    await sleep(700);
    const oldKept = await ev(`({ page: localStorage.getItem('wrizo-typewriter-page-${id}'), setting: (JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')).typewriter })`);
    ok(`FW-OLD [${T}] an old page whose switch was OFF (its own value 'off', the shared setting off) opened in Free Write is zoomed with the fade on all the same (data-zoom ${old.zoom}, data-typewriter ${old.tw})`, zoomed(old), JSON.stringify(old));
    ok(`DATA [${T}] the old values are kept as they were and nothing deletes them: the page's own value ${JSON.stringify(oldKept.page)} (seeded 'off'), the shared setting ${JSON.stringify(oldKept.setting)} (seeded false)`, oldKept.page === 'off' && oldKept.setting === false, JSON.stringify(oldKept));

    id = await openCase({ theme, tone, ...CASES.draftOn });
    const dr = await ev(PROBE);
    const gearDr = await ev(GEAR);
    const drKept = await ev(`({ page: localStorage.getItem('wrizo-typewriter-page-${id}'), setting: (JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}')).typewriter })`);
    ok(`DR-ON [${T}] a Draft page whose switch was ON (its own value 'on', the shared setting on) is NEVER zoomed and its fade is off (data-zoom ${dr.zoom}, data-typewriter ${dr.tw}, page ${dr.pageW}px)`, plain(dr), JSON.stringify(dr));
    ok(`GONE [${T}] Draft offers no Typewriter switch either: no toggle button (${dr.toggles}), no Typewriter row in the gear (${gearDr.hasTypewriterRow})`, dr.toggles === 0 && gearDr.gear && gearDr.hasTypewriterRow === false, JSON.stringify({ toggles: dr.toggles, gearDr }));
    ok(`DATA [${T}] the Draft page's old value stays as seeded: the page's own value ${JSON.stringify(drKept.page)} (seeded 'on'), the shared setting ${JSON.stringify(drKept.setting)} (seeded true)`, drKept.page === 'on' && drKept.setting === true, JSON.stringify(drKept));
    await snap(`draft-on-${theme}-${tone}`);

    id = await openCase({ theme, tone, ...CASES.draftFresh });
    const dfr = await ev(PROBE);
    ok(`DR-FRESH [${T}] a fresh empty Draft page is never zoomed (the plateau skin's old default was ON): data-zoom ${dfr.zoom}, data-typewriter ${dfr.tw}`, plain(dfr), JSON.stringify(dfr));
  }

  // ---- MUT: each old path put back goes RED on its own read; undone, the same read is green -------------------------------------------------------------
  const withMutant = async (name, run) => { mutant = name; landed[name] = undefined; try { return { landed: landed[name], ...(await run()) }; } finally { mutant = null; } };
  const mFw = await withMutant('fwswitch', async () => { await openCase({ theme: 'plateau', tone: 'dark', ...CASES.old }); return { probe: await ev(PROBE) }; });
  ok(`MUT-fwswitch (landed ${mFw.landed}) Free Write reading the shared switch again: the old page (switch off) is NOT zoomed, so the Free Write read goes RED (data-zoom ${mFw.probe.zoom}, data-typewriter ${mFw.probe.tw})`, mFw.landed === 1 && !zoomed(mFw.probe), JSON.stringify(mFw));
  const mDr = await withMutant('draftpage', async () => { await openCase({ theme: 'plateau', tone: 'dark', ...CASES.draftOn }); return { probe: await ev(PROBE) }; });
  ok(`MUT-draftpage (landed ${mDr.landed}) Draft reading the page's own saved value again: the Draft page whose switch was ON IS zoomed, so the Draft read goes RED (data-zoom ${mDr.probe.zoom}, data-typewriter ${mDr.probe.tw})`, mDr.landed === 1 && !plain(mDr.probe), JSON.stringify(mDr));
  // undone: the same two reads green on the untouched bundle
  await openCase({ theme: 'plateau', tone: 'dark', ...CASES.old });
  const backFw = await ev(PROBE);
  await openCase({ theme: 'plateau', tone: 'dark', ...CASES.draftOn });
  const backDr = await ev(PROBE);
  ok('MUT-undone the same two reads are green again on the untouched bundle (the old page zoomed, the Draft page plain)', zoomed(backFw) && plain(backDr), JSON.stringify({ backFw, backDr }));
}); } catch (e) { console.log('HARNESS ERROR', (e && e.stack) || e); checks.push({ name: 'HARNESS', pass: false, detail: String((e && e.message) || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nFREE-WRITE-TYPEWRITER VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nFREE-WRITE-TYPEWRITER VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
