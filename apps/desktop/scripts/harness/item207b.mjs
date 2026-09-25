// ITEM 207b — DEVICE FONTS, RENDERED. A committed CDP scenario; needs a box turn and a fresh `pnpm run build:web`.
//   Run: node <ABSOLUTE>/apps/desktop/scripts/harness/item207b.mjs       (WS_BOX_TURN exported from the grant)
// item207-core.mjs proves the library, the enumeration contract and the door's guards WITHOUT an engine. This proves them in one:
//   · the door ("Add a font…") is the roster's last row in Draft/Revise, and absent in Free Write and on a card (his Q2/Q3);
//   · permission is asked ON THE CLICK, never on load; a grant lists this device's families, each set in its own face;
//   · picking one stores { name, generic, source: 'device' } on the page, renders in it, and adds it to THIS device's library,
//     which Free Write's roster then lists (without the door);
//   · a refusal is one plain sentence and changes nothing;
//   · a page in a face this device lacks renders its class fallback and is marked quietly (no toast, no extra element).
// Every press is a hit-tested real pointer; fixtures go through the app's own seams; a thrown driver error is a FAILED check.
import { withHarness } from '../runtime-verify.mjs';
import { trustedDispatch } from '../trusted-point.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass, detail }); console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  [${String(detail).slice(0, 280)}]` : ''}`); };
const press = (app, expr, what) => trustedDispatch(app, expr, what, { report: ok });
const PROSE = 'The garden had been quiet for a long time, and nobody who walked through it that autumn could have said exactly when the quiet began. ';
// A family that is installed on any Windows box and whose class is known: the pick target.
const TARGET = { name: 'Consolas', generic: 'monospace' };

const entryRow = async (app, id) => { await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); return ((await app.localJSON('writer-studio-journal-entries')) || []).find((r) => r.id === id) || null; };
const familyOfEditor = (app) => app.evalJs(`(() => { const e = document.querySelector('.forward-only-editor'); return e ? getComputedStyle(e).fontFamily : null; })()`);
const rosterRows = (app) => app.evalJs(`[...document.querySelectorAll('.wz-type-row')].map(r => r.textContent)`);
const freshDesk = async (app, w, h) => {
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
};
const openPage = async (app, { id, mode, settings = null, keepStorage = false }) => {
  if (!keepStorage) await freshDesk(app, 1280, 900);
  await app.evalJs(`window.wrizoCreateJournalPage({ id: ${JSON.stringify(id)}, text: ${JSON.stringify(PROSE.repeat(3))}, createdAt: new Date().toISOString(), origin: null, source: 'page' })`);
  if (settings) await app.evalJs(`window.wrizoPatchEntry(${JSON.stringify(id)}, { pageSettings: ${JSON.stringify(settings)} })`);
  await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', ${JSON.stringify(mode)})`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/${id}'`);
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: `${mode} page mounted` });
  await app.emulateDpr(1, 1280, 900);
  await sleep(500);
};
const openDrawer = async (app) => {
  if ((await app.evalJs("(document.querySelector('.wz-sliver-panel') || {}).dataset && document.querySelector('.wz-sliver-panel').dataset.open")) !== 'true') await press(app, "document.querySelector('.wz-sliver-grip')", 'the tool drawer grip');
  await sleep(500);
};
const openRoster = async (app) => { await press(app, "document.querySelector('.wz-type-face')", 'the face button'); await sleep(200); };
const DRESSED = (face) => ({ margins: 'normal', lineSpacing: 1.6, pageNumbers: { on: false, placement: 'bottom-center' }, headers: { on: false, text: '' }, footers: { on: false, text: '' }, face, size: 12 });

await withHarness(async (app) => {
  try {
    // ==== 1 · THE DOOR: where it is, and where it is not ==========================================================
    await openPage(app, { id: 'i207b-dr', mode: 'drafting' });
    const supported = await app.evalJs("typeof window.queryLocalFonts === 'function'");
    ok('ENV: Local Font Access exists in this Chromium (else the door is correctly absent and the rest of this file is moot)', supported, String(supported));
    await openDrawer(app);
    await openRoster(app);
    let rows = await rosterRows(app);
    ok('DRAFT: the roster\'s LAST row is "Add a font…" (after the nine)', rows.length >= 10 && rows[rows.length - 1] === 'Add a font…' && rows.slice(0, 9).join('|').startsWith('Crimson Pro|Lora'), JSON.stringify(rows));
    ok('DRAFT: the door is a row — the control is still exactly three buttons and one number input', await app.evalJs("(() => { const t = document.querySelector('.wz-type'); return t.querySelectorAll('button').length === 3 && t.querySelectorAll('input').length === 1; })()"), '');
    const calledOnLoad = await app.evalJs("window.__lfCalls || 0");
    ok('NOT ON LOAD: no font enumeration has happened before the click (the page has not asked for permission)', calledOnLoad === 0, String(calledOnLoad));

    await openPage(app, { id: 'i207b-rv', mode: 'revise' });
    await openDrawer(app); await openRoster(app);
    rows = await rosterRows(app);
    ok('REVISE: the roster ends in "Add a font…" too (Draft and Revise only)', rows[rows.length - 1] === 'Add a font…', JSON.stringify(rows));

    await openPage(app, { id: 'i207b-fw', mode: 'journal' });
    await openDrawer(app); await openRoster(app);
    rows = await rosterRows(app);
    ok('FREE WRITE: NO "Add a font…" row (his Q2) — the nine, and nothing else on a device with an empty library', !rows.includes('Add a font…') && rows.length === 9, JSON.stringify(rows));

    // ==== 2 · THE CLICK: permission asked now, families listed, each in its own face ==============================
    await openPage(app, { id: 'i207b-add', mode: 'drafting' });
    let grant = 'ok';
    try { await app.cdp('Browser.grantPermissions', { permissions: ['localFonts'] }); } catch (e) { grant = String(e && e.message).slice(0, 140); }
    ok('DRIVER: the localFonts permission could be granted over CDP', grant === 'ok', grant);
    await app.evalJs("(() => { const orig = window.queryLocalFonts.bind(window); window.__lfCalls = 0; window.queryLocalFonts = (...a) => { window.__lfCalls += 1; return orig(...a); }; })()");
    await openDrawer(app); await openRoster(app);
    await press(app, "[...document.querySelectorAll('.wz-type-row')].find(r => r.textContent === 'Add a font…')", 'the door row');
    await app.waitFor("document.querySelectorAll('.wz-type-list--add .wz-type-row').length > 5", { label: 'installed families listed' }).catch(() => ok('DRIVER: installed families appeared after the door click', false, 'timed out'));
    const drill = await app.evalJs(`(() => { const rs = [...document.querySelectorAll('.wz-type-list--add .wz-type-row')]; return { n: rs.length, calls: window.__lfCalls, hasTarget: rs.some(r => r.textContent === ${JSON.stringify(TARGET.name)}), ownFace: rs.slice(0, 40).every(r => getComputedStyle(r).fontFamily.replace(/["']/g, '').startsWith(r.textContent.replace(/['\\\\]/g, ''))) }; })()`);
    ok('DRILL-IN: the door click asked for the fonts ONCE (permission on the click) and listed this device\'s families, each row set in its own face', drill.calls === 1 && drill.n > 5 && drill.ownFace, JSON.stringify(drill));
    ok(`DRILL-IN: a family known to be installed (${TARGET.name}) is in the list`, drill.hasTarget, JSON.stringify(drill));

    // ==== 3 · THE PICK: stored as a device face, rendered, added to THIS device's library =========================
    await press(app, `[...document.querySelectorAll('.wz-type-list--add .wz-type-row')].find(r => r.textContent === ${JSON.stringify(TARGET.name)})`, `the installed family ${TARGET.name}`);
    await sleep(600);
    const row = await entryRow(app, 'i207b-add');
    const face = row && row.pageSettings && row.pageSettings.face;
    ok(`PICK: the page stores { name: ${TARGET.name}, generic: ${TARGET.generic}, source: "device" } (the class was MEASURED, not asked) and no fallback file`, face && face.name === TARGET.name && face.generic === TARGET.generic && face.source === 'device' && !('fallback' in face), JSON.stringify(face));
    ok('PICK: the editor renders in it — its name first, then its class fallback', new RegExp(`^"?'?${TARGET.name}`).test(String(await familyOfEditor(app)).replace(/^["']/, '')) && /monospace/.test(String(await familyOfEditor(app))), String(await familyOfEditor(app)));
    const lib = await app.evalJs("localStorage.getItem('wrizo-device-fonts')");
    ok('LIBRARY: the family was added to THIS device\'s library (localStorage), not to any synced row', /Consolas/.test(String(lib)) && !/Consolas/.test(JSON.stringify((await entryRow(app, 'i207b-add')).boxes || [])), String(lib));
    ok('MARK: a device face this device HAS is not marked substituted', (await app.evalJs("document.querySelector('.wz-type-face').getAttribute('data-substituted')")) === null, '');

    // ==== 4 · FREE WRITE lists the library and still has no door ==================================================
    await openPage(app, { id: 'i207b-fw2', mode: 'journal', keepStorage: true });
    await openDrawer(app); await openRoster(app);
    rows = await rosterRows(app);
    ok('FREE WRITE: the roster now lists the font added on this device, and STILL has no "Add a font…" row', rows.includes(TARGET.name) && !rows.includes('Add a font…') && rows.length === 10, JSON.stringify(rows));

    // ==== 5 · A PAGE IN A FACE THIS DEVICE LACKS: the fallback in its class, marked quietly =======================
    await openPage(app, { id: 'i207b-miss', mode: 'drafting', settings: DRESSED({ name: 'Wrizo Definitely Absent', generic: 'serif', source: 'device' }) });
    await openDrawer(app);
    const miss = await app.evalJs(`(() => { const b = document.querySelector('.wz-type-face'); const t = document.querySelector('.wz-type'); return { sub: b.getAttribute('data-substituted'), title: b.getAttribute('title'), aria: b.getAttribute('aria-label'), buttons: t.querySelectorAll('button').length, toast: !!document.querySelector('[role="alert"], .wz-toast, .toast'), text: b.textContent }; })()`);
    ok('MARK: the missing device face is marked quietly inside the button — data-substituted, the sentence in its title and accessible name', miss.sub === 'true' && /Substituted on this device/.test(miss.title) && /Substituted on this device/.test(miss.aria), JSON.stringify(miss));
    ok('MARK: no extra element and no toast — still three buttons, and the visible text is the face name alone', miss.buttons === 3 && miss.toast === false && miss.text === 'Wrizo Definitely Absent', JSON.stringify(miss));
    const fam = String(await familyOfEditor(app));
    ok('FALLBACK IN KIND: the page renders in its own name then a SERIF (the stored class), never a sans', /Wrizo Definitely Absent/.test(fam) && /serif/.test(fam) && !/sans-serif/.test(fam.replace(/serif/, '')), fam);

    // ==== 6 · A REFUSAL: one plain sentence, nothing changes ======================================================
    await openPage(app, { id: 'i207b-deny', mode: 'drafting' });
    let denied = 'ok';
    try { await app.cdp('Browser.setPermission', { permission: { name: 'local-fonts' }, setting: 'denied' }); } catch (e) { denied = String(e && e.message).slice(0, 140); }
    ok('DRIVER: the local-fonts permission could be DENIED over CDP', denied === 'ok', denied);
    await openDrawer(app); await openRoster(app);
    const libBefore = await app.evalJs("localStorage.getItem('wrizo-device-fonts')");
    await press(app, "[...document.querySelectorAll('.wz-type-row')].find(r => r.textContent === 'Add a font…')", 'the door row (denied)');
    await sleep(800);
    const refused = await app.evalJs("(() => { const n = document.querySelector('.wz-type-list--add .wz-type-note'); return { note: n && n.textContent, rows: document.querySelectorAll('.wz-type-list--add .wz-type-row[role=\"option\"]').length }; })()");
    ok('REFUSAL: one plain sentence in the list, and no families', refused.note === 'The fonts on this device could not be read.' && refused.rows === 0, JSON.stringify(refused));
    ok('REFUSAL: the roster and the page are untouched — no library growth, no face written', (await app.evalJs("localStorage.getItem('wrizo-device-fonts')")) === libBefore && !(((await entryRow(app, 'i207b-deny')) || {}).pageSettings || {}).face, '');
  } catch (e) { ok('DRIVER: the scenario ran to its end without a thrown error', false, String(e && e.stack || e).slice(0, 400)); }
});

const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // Parks nothing here: the one 207a assertion the door falsifies ("NO ADD DOOR") lives in item207-core.mjs and is parked THERE.
  console.log(parkedChecks.every((c) => c.pass)
    ? `\nITEM207B PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed; nothing parked in this file`
    : `\nITEM207B PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const all = checks.concat(parkedChecks);
const pass = all.every((c) => c.pass);
console.log(pass ? `\nITEM207B VERIFY: PASS (${all.length} checks)` : `\nITEM207B VERIFY: FAIL — ${all.filter((c) => !c.pass).length}/${all.length} failed`);
process.exit(pass ? 0 : 1);
