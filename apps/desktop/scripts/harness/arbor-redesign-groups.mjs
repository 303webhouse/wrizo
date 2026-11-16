// THE REDESIGN, BY WHAT A WRITER DOES (FABLE RULED, Nov 15, 10:40 pm: the harness pins today's Arbor for the 69 files written for it; "Before the ship:
// group the 69 by what a writer does ... and give each group at least one green check ON the redesign; fix anything broken for a writer"; the full
// triage is bug #105). Every read here is ON the redesign as it ships (no query: its own default), signed in (the double's default):
//   G1 FRONT DOOR: the splash's Write door opens a page, and a key typed there lands in it
//   G2 THEME PICKER: the rail's Themes item opens the picker: Arbor, Flux and Machina shown, Arbor the current choice (pressed, not locked)
//   G3 PAGE TEMPLATES: Tools -> the Presets cloth tab lists Blank, Screenplay, Outline, Title Page, Bibliography; pressing Screenplay on an empty page
//      makes it a screenplay (the editor carries data-template="screenplay")
//   G4 FONT-SIZE BOX: Tools -> Format: the size box reads the page's size; typing 15 + Enter sizes the page to 15 pt (20 px), and Larger takes it to 16
//   G5 PAGE SIZE: a page born in Arbor is 11 pt (Nick's r17 default: 14.67 px), and the size box says 11
//   (Typewriter and fades: arbor-shade-fade.mjs, arbor-keyflip.mjs and the typewriter-* files; menus: vw1, drawer-toggles, drawers-p1, one-drawer,
//    tutor-mirror - all green on the redesign in the default-on pair a01a10af; front door also arbor-front-door.mjs)
//   M1 (mutant) the Write door taken away (asserted LANDED): G1's path goes red
//   M2 (mutant) the size box made inert (asserted LANDED): G4's read goes red
// Navigation is this file's own (history.replaceState to '/#/...', no query), so the harness's ?arbor2=0 pin does not apply. Seeding through the seams.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const J = (v) => JSON.stringify(v);
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const near = (a, b, tol = 0.1) => typeof a === 'number' && Math.abs(a - b) <= tol;
const press = async (app, sel) => {
  const at = await app.evalJs(`(() => { const e = document.querySelector(${J(sel)}); if (!e || e.disabled) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return r.width ? { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) } : null; })()`);
  if (!at) return false;
  await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(700); return true;
};
const EDITOR = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return null; return { text: e.innerText, px: parseFloat(getComputedStyle(e).fontSize), template: e.getAttribute('data-template'), arbor: document.documentElement.getAttribute('data-arbor2') }; })()";
const BOX = "(() => { const i = document.querySelector('.wz-type .wz-type-num'); return i ? { value: i.value, disabled: i.disabled } : null; })()";

await withHarness(async (app) => {
  await app.emulateDpr(1, 1400, 900);
  const boot = async () => {
    await app.goto('/');
    await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1'); localStorage.setItem('wrizo-splash-hold', '50'); localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4'); localStorage.setItem('wrizo-theme', 'plateau'); true");
    await app.evalJs("history.replaceState(null, '', '/#/')"); await app.reload();
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'the splash gone', timeout: 25000 });
  };
  const openPage = async (text) => {
    const id = `arbor-rg-${Math.random().toString(36).slice(2, 7)}`;
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`); await sleep(300);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector(\".wz-strip-item[data-category='theme']\")", { label: 'page', timeout: 15000 }); await sleep(900);
    await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  };
  const openTools = async (tab) => {
    if (await app.evalJs("document.querySelector('.wz-sliver')?.getAttribute('data-open') !== 'true'")) {
      for (const type of ['keyDown', 'keyUp']) await app.cdp('Input.dispatchKeyEvent', { type, key: '/', code: 'Slash', windowsVirtualKeyCode: 191, modifiers: 2 });
      await waitSoft(app, "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'Tools open', timeout: 4000 }); await sleep(500);
    }
    if (tab) { await press(app, `#wz-sliver-tab-${tab}`); await sleep(400); }
  };

  // G1 FRONT DOOR
  await boot();
  // shown and hit-testable, as a writer sees it (the doors are enabled during data-phase='wait', when they are still hidden)
  await waitSoft(app, "(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-write:not([disabled])'); if (!b) return false; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the Write door shown', timeout: 25000 });
  const wrote = await press(app, '.arbor2-front-doors .arbor2-door.wz-arrival-write');
  // (the Write door's page: whatever editable the writer lands in - read by the focus and the route, not by one editor's class)
  await waitSoft(app, "!!document.querySelector('[contenteditable=\"true\"]') && !document.querySelector('.arbor2-front:not(.gone)')", { label: 'a writing surface', timeout: 15000 }); await sleep(800);
  const landed = await app.evalJs("(() => { const a = document.activeElement; return { hash: location.hash, active: a ? (a.tagName.toLowerCase() + '.' + String(a.className || '').split(' ').slice(0, 2).join('.')) : null, editable: !!(a && a.isContentEditable) }; })()");
  if (!landed.editable) await app.evalJs("(() => { const e = document.querySelector('[contenteditable=\"true\"]'); if (e) e.focus(); return !!e; })()");
  await app.typeKeys('Wren'); await sleep(700);
  const g1 = await app.evalJs("(() => { const a = document.activeElement; const e = a && a.isContentEditable ? a : document.querySelector('[contenteditable=\"true\"]'); return { text: e ? e.innerText : null, cls: e ? String(e.className) : null, hash: location.hash, arbor: document.documentElement.getAttribute('data-arbor2') }; })()");
  g1.landed = landed;
  ok(`G1 FRONT DOOR: the splash's Write door opens a page (pressed ${wrote}) and the keys typed there land in it (${J(g1 && g1.text)})`, wrote && !!g1 && g1.arbor === 'true' && /Wren/.test(g1.text || ''), J(g1));

  // G2 THEME PICKER
  await openPage('A page for the theme picker.');
  const opened = await press(app, ".wz-strip-item[data-category='theme']");
  await waitSoft(app, "!!document.querySelector('.wz-theme-cards')", { label: 'the picker', timeout: 5000 });
  const cards = await app.evalJs("[...document.querySelectorAll('.wz-theme-card')].map((c) => ({ name: (c.querySelector('.wz-theme-wm')?.textContent || '').trim(), pressed: c.getAttribute('aria-pressed'), locked: c.classList.contains('locked') }))");
  const arbor = (cards || []).find((c) => c.name === 'Arbor');
  ok(`G2 THEME PICKER: the rail's Themes item opens the picker (pressed ${opened}): ${J((cards || []).map((c) => c.name))}, Arbor the current choice`, opened && (cards || []).length === 3 && ['Arbor', 'Flux', 'Machina'].every((n) => cards.some((c) => c.name === n)) && !!arbor && arbor.pressed === 'true' && !arbor.locked, J(cards));
  await app.key('Escape'); await sleep(400);

  // G3 PAGE TEMPLATES (Presets) - on an empty page
  await openPage('');
  await openTools('presets');
  const rows = await app.evalJs("[...document.querySelectorAll('.wz-template-row')].map((b) => b.getAttribute('data-template'))");
  const pickedTpl = await press(app, ".wz-template-row[data-template='screenplay']");
  await waitSoft(app, "!!document.querySelector('.script-sheet')", { label: 'the screenplay surface', timeout: 6000 }); await sleep(500);
  const g3 = await app.evalJs("(() => ({ sheets: document.querySelectorAll('.script-sheet').length, editor: !!document.querySelector('.forward-only-editor'), pressed: document.querySelector(\".wz-template-row[data-template='screenplay']\")?.getAttribute('aria-pressed') ?? null }))()");
  ok(`G3 PAGE TEMPLATES: Tools -> Presets lists ${J(rows)}; Screenplay on an empty page makes it a screenplay (${g3 && g3.sheets} screenplay sheet(s))`,
    J(rows) === J(['blank', 'screenplay', 'outline', 'title', 'bibliography']) && pickedTpl && !!g3 && g3.sheets >= 1, J({ rows, pickedTpl, g3 }));

  // G4 FONT-SIZE BOX and G5 PAGE SIZE - on a page born now
  await openPage('The ferry was late, so Ada counted gulls.');
  await openTools('format');
  const before = await app.evalJs(BOX), born = await app.evalJs(EDITOR);
  ok(`G5 PAGE SIZE: a page born in Arbor is 11 pt (${born && born.px} px; the size box says ${before && before.value})`, !!born && near(born.px, 14.667, 0.05) && !!before && before.value === '11', J({ born, before }));
  const setSize = async (n) => {
    const at = await app.evalJs("(() => { const i = document.querySelector('.wz-type .wz-type-num'); if (!i || i.disabled) return null; const r = i.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()");
    if (!at) return false;
    await app.mouseMove(at.x, at.y); await app.mouseDown(at.x, at.y); await app.mouseUp(at.x, at.y); await sleep(200);
    await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'a', code: 'KeyA', windowsVirtualKeyCode: 65, modifiers: 2 });
    await app.typeKeys(String(n)); await app.key('Enter'); await sleep(700); return true;
  };
  const typed = await setSize(15); const at15 = await app.evalJs(EDITOR), box15 = await app.evalJs(BOX);
  const larger = await press(app, ".wz-type button[aria-label='Larger']"); const at16 = await app.evalJs(EDITOR), box16 = await app.evalJs(BOX);
  ok(`G4 FONT-SIZE BOX: typing 15 + Enter sizes the page to 15 pt (${at15 && at15.px} px, the box ${box15 && box15.value}); Larger takes it to 16 (${at16 && at16.px} px, ${box16 && box16.value})`,
    typed && !!at15 && near(at15.px, 20, 0.05) && !!box15 && box15.value === '15' && larger && !!at16 && near(at16.px, 21.333, 0.05) && !!box16 && box16.value === '16', J({ at15, box15, larger, at16, box16 }));

  // M2: the size box made inert - G4's read must go red
  await openPage('Inert box page.');
  await openTools('format');
  await app.evalJs("(() => { const i = document.querySelector('.wz-type .wz-type-num'); if (i) i.disabled = true; return !!i; })()");
  const m2typed = await setSize(15); const m2 = await app.evalJs(EDITOR);
  ok(`M2 (mutant): the size box made inert (LANDED: typed ${m2typed}) - G4's read goes RED (${m2 && m2.px} px)`, !m2typed && !!m2 && !near(m2.px, 20, 0.05), J({ m2typed, m2 }));

  // M1: the Write door taken away - G1's path must go red
  await boot();
  // shown and hit-testable, as a writer sees it (the doors are enabled during data-phase='wait', when they are still hidden)
  await waitSoft(app, "(() => { const b = document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-write:not([disabled])'); if (!b) return false; const r = b.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && (t === b || b.contains(t)); })()", { label: 'the Write door shown', timeout: 25000 });
  await app.evalJs("document.querySelector('.arbor2-front-doors .arbor2-door.wz-arrival-write')?.remove(); true");
  const m1 = await press(app, '.arbor2-front-doors .arbor2-door.wz-arrival-write');
  ok(`M1 (mutant): the Write door taken away (LANDED: pressed ${m1}) - G1's path goes RED`, !m1, J({ m1 }));
  return checks;
}, { label: 'arbor-redesign-groups' });

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nARBOR-REDESIGN-GROUPS PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const WANT = 7;
const pass = checks.length === WANT && checks.every((c) => c.pass);
console.log(pass ? `\nARBOR-REDESIGN-GROUPS VERIFY: PASS (${checks.length} checks)` : `\nARBOR-REDESIGN-GROUPS VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length !== WANT ? ` (${checks.length} ran, ${WANT} expected)` : ''}`);
process.exit(pass ? 0 : 1);
