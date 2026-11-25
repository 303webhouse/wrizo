// #121 (Nov 24, live from L7, Flux): "the PARTS menu's preset row and its '?' note have no Flux dress" (Fable, 10:33 am). The twenty new presets each
// sit in a row (.reorg-dockind-prow: the pick button and its "?" side by side) and their note pops out of the menu (.reorg-preset-note); Arbor and
// Machina dress both, Flux had no rule for either. Read on the Flux a writer gets (the redesign and the reorg by default), TRACKS -> the Doc's kind
// menu -> Presets, in both Page tones:
//   P0        (premise) every tone is the live Flux, the Presets sub is open, and it holds at least 20 new-preset rows and at least one live lone preset
//   DRESS<t>  every new preset's pick wears the live presets' Flux dress: the same face, size, colour, background, border and vertical padding as a
//             lone live preset button in the same menu (Flux's own .reorg-dockind-group > button), so the two kinds read as one list
//   ROW<t>    every row is one line: the "?" stands beside its pick (its centre inside the pick's top..bottom) and the row is no taller than the pick + 4 px
//   NOTE<t>   the first row's "?" opens its note, and the note escapes the menu's scroll box: position fixed, wholly inside the window
// Run: node scripts/harness/flux-121-preset-row.mjs   (from apps/desktop; Actions harness or a box turn)
process.env.WS_REORG = '1';
process.env.WS_FLUX3 = 'default';
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const LIVE = "({ theme: document.documentElement.getAttribute('data-theme'), flux3: document.documentElement.hasAttribute('data-flux3'), top: !!document.querySelector('.reorg-top'), search: location.search })";

const READ = `(() => {
  const sub = document.querySelector('[data-doc-sub=presets]'); if (!sub) return null;
  const KEYS = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor', 'borderTopWidth', 'borderTopStyle', 'paddingTop', 'paddingBottom'];
  const face = (b) => { const s = getComputedStyle(b); return Object.fromEntries(KEYS.map((k) => [k, s[k]])); };
  const lone = [...sub.querySelectorAll('.reorg-dockind-group > button[data-preset-pick]')];
  const rows = [...sub.querySelectorAll('[data-preset-row]')];
  const want = lone.length ? face(lone[0]) : null;
  const dress = [], line = [];
  for (const r of rows) {
    const pick = r.querySelector('[data-preset-pick]'), qb = r.querySelector('.wz-drawer-note-btn'); if (!pick || !qb) { line.push({ id: r.dataset.presetRow, missing: true }); continue; }
    const f = face(pick); const off = want ? KEYS.filter((k) => f[k] !== want[k]).map((k) => k + ': ' + f[k] + ' (lone ' + want[k] + ')') : ['no lone preset to compare'];
    if (off.length) dress.push({ id: r.dataset.presetRow, off });
    const pr = pick.getBoundingClientRect(), qr = qb.getBoundingClientRect(), rr = r.getBoundingClientRect(); const cy = qr.top + qr.height / 2;
    if (!(cy >= pr.top && cy <= pr.bottom) || rr.height > pr.height + 4) line.push({ id: r.dataset.presetRow, pick: [Math.round(pr.top), Math.round(pr.height)], q: Math.round(cy), row: Math.round(rr.height) });
  }
  return { rows: rows.length, lone: lone.length, want, dress, line, first: rows[0] ? rows[0].dataset.presetRow : null };
})()`;

await withHarness(async (app) => {
  const ev = (s) => app.evalJs(s);
  const soft = async (expr, timeout = 6000) => { try { await app.waitFor(expr, { timeout, label: expr.slice(0, 60) }); return true; } catch { return false; } };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await soft("!document.querySelector('.wz-splash')", 20000);
  // a Doc of three Parts, seeded through the seams at the Desk (the kind menu is the Doc's)
  const seeded = await ev(`(() => { const W = window; const doc = W.wrizoCreateProject('Novel');
    const ps = ['one', 'two', 'three'].map((w, i) => W.wrizoCreateJournalPage({ id: 'pr-' + (i + 1), text: 'The harbour was quiet when she arrived, chapter ' + w + '.', createdAt: '2026-04-01T00:00:00.000Z', origin: 'project', projectId: doc.id, orderIndex: i, source: 'page' }));
    W.wrizoFlushNow(); return !!doc && ps.every(Boolean); })()`);
  const prem = [];
  for (const tone of ['light', 'dark']) {
    await ev(`(() => { localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${q(tone)}, fade: 'on' })); localStorage.setItem('wrizo-mode-page-pr-2', 'drafting'); history.replaceState(null, '', '/#/page/pr-2'); return true; })()`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the page', timeout: 20000 });
    await soft("!document.querySelector('.wz-splash')", 25000);
    await soft("document.documentElement.hasAttribute('data-flux3') && !!document.querySelector('.reorg-top')", 10000);
    await sleep(800);
    // TRACKS -> the Doc's kind menu -> Presets (the frames script's own path, frames/presets-b.mjs)
    if (!(await ev("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await ev("document.querySelector('.wz-sliver-grip')?.click(); null"); await sleep(700); }
    await ev("document.getElementById('wz-sliver-tab-parts')?.click(); null"); await sleep(500);
    await ev("document.querySelector('.wz-sliver [data-reorg-parts] [data-doc-kind]')?.click(); null"); await sleep(400);
    await ev("document.querySelector('[data-doc-menu] [data-doc-menu-item=\"presets\"]')?.click(); null"); await sleep(600);
    const live = await ev(LIVE);
    const r = await ev(READ);
    prem.push([tone, live.theme === 'flux' && live.flux3 && live.top && !/flux3|reorg/.test(live.search) && !!r && r.rows >= 20 && r.lone >= 1, { live, rows: r && r.rows, lone: r && r.lone }]);
    ok(`DRESS [${tone}] every new preset's pick wears the live presets' Flux dress (face, size, weight, colour, background, border, vertical padding): ${r ? r.dress.length : '?'} of ${r ? r.rows : '?'} differ`, !!r && r.rows >= 20 && r.dress.length === 0, r ? { want: r.want, differ: r.dress.slice(0, 3) } : 'no Presets sub');
    ok(`ROW [${tone}] every row is one line, the "?" beside its pick (${r ? r.line.length : '?'} not)`, !!r && r.rows >= 20 && r.line.length === 0, r ? r.line.slice(0, 4) : 'no Presets sub');
    let note = null;
    if (r && r.first) {
      await ev(`(() => { const row = document.querySelector('[data-preset-row="${r.first}"]'); if (row) row.scrollIntoView({ block: 'center' }); return null; })()`); await sleep(300);
      await ev(`(() => { const b = document.querySelector('[data-preset-note="${r.first}"] .wz-drawer-note-btn'); if (b) { b.focus(); b.click(); } return null; })()`); await sleep(500);
      note = await ev(`(() => { const p = document.querySelector('[data-preset-note="${r.first}"] .wz-drawer-note-pop'); if (!p) return null; const b = p.getBoundingClientRect(), s = getComputedStyle(p);
        return { position: s.position, shown: s.display !== 'none' && s.visibility === 'visible' && b.width > 0, box: [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)], win: [innerWidth, innerHeight] }; })()`);
    }
    ok(`NOTE [${tone}] the first row's "?" opens its note, which escapes the menu: position fixed, wholly inside the window`,
      !!note && note.shown && note.position === 'fixed' && note.box[0] >= 0 && note.box[1] >= 0 && note.box[2] <= note.win[0] && note.box[3] <= note.win[1], note);
  }
  ok('P0 (premise) both tones are the live Flux (no ?flux3 or ?reorg), the Doc seeded, the Presets sub open with at least 20 new-preset rows and a live lone preset', seeded && prem.length === 2 && prem.every((p) => p[1]), { seeded, prem });
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '\n     ' + String(c.detail).slice(0, 1600)}`);
const EXPECTED = 7;
const pass = checks.length === EXPECTED && checks.every((c) => c.pass);
console.log(pass ? `\nFLUX-121-PRESET-ROW VERIFY: PASS (${checks.length} checks)` : `\nFLUX-121-PRESET-ROW VERIFY: FAIL - ${checks.filter((c) => !c.pass).length}/${checks.length} failed${checks.length === EXPECTED ? '' : ` (expected ${EXPECTED} checks)`}`);
process.exit(pass ? 0 : 1);
