// A PART MADE BY SPLIT OPENS IN THE MODE IT WAS SPLIT FROM (Fable, Nov 22, 3:28 pm, RULED: "P3-mode - today it gets the default page type, so it opens in Free Write on every split from Draft. Use the existing per-page mode; nothing new saved.
// Red first, in Machina and Arbor (reorg on)"). POLISH's repro: Split in Draft, then the next-Part arrow: the tail opens in Free Write (the Typewriter zoom, no Front menu); run 5 read the tail's stored mode as null and the head's as 'drafting'.
//   PM1  after "Split here" in Draft, the tail's stored mode is the head's: wrizo-mode-page-<tail> is 'drafting', as the head's is
//   PM2  the next-Part arrow opens the tail IN DRAFT: the editor draws Draft's rows (.wz-row), and not Free Write's forward-only host
//        (#128, Nov 24: the arrow is retired; PM2 parked, PM2-B moves by the Part's foot - the same claim)
//   PM3  nothing else is saved for it: the only new storage key the split makes for the tail is that existing per-page mode key (no new key is invented)
//   PM4  CONTROL: a manuscript page that has no saved mode still opens in Free Write (the default is untouched), and the head keeps Draft
// In Machina (?reorg=1) and Arbor (?reorg=1&arbor2=1 with the preview door ?reorglift= for the pieces the table has not switched on).
// Run: node scripts/harness/split-opens-in-mode.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const HEAD = 'Ledger one opens here. ';
const TAIL = 'The tail goes below.';
const LIFT = ['top', 'front', 'back', 'split', 'uplink'].map((p) => `plateau.${p}`).join(',');
const CFGS = [
  { name: 'Machina', theme: 'machina', q: 'reorg=1' },
  { name: 'Arbor', theme: 'plateau', q: `reorg=1&arbor2=1&reorglift=${LIFT}` },
];
const click = (sel) => `(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b || b.disabled) return false; b.click(); return true; })()`;
const caretAt = (n) => `(() => { const ed = document.querySelector('.forward-only-editor'); if (!ed) return false; ed.focus(); let left = ${n};
  const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) { const len = t.data.length; if (left <= len) { const r = document.createRange(); r.setStart(t, left); r.collapse(true); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); return true; } left -= len; }
  return false; })()`;
const MODEKEYS = "(() => Object.keys(localStorage).filter((k) => k.indexOf('wrizo-mode-page-') === 0).sort())()";
const READ = "(() => { const ed = document.querySelector('.forward-only-editor'); return { rows: ed ? ed.querySelectorAll('.wz-row').length : -1, hasEditor: !!ed, text: ed ? ed.innerText.replace(/\\u200b/g, '').trim() : null }; })()";

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  await app.emulateDpr(1, 1366, 768);
  for (const cfg of CFGS) {
    await app.goto('/');
    await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await ev(`localStorage.setItem('wrizo-theme', '${cfg.theme}')`);
    await ev(`history.replaceState(null, '', '/?${cfg.q}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    await app.waitFor("typeof window.wrizoCreateProject === 'function' && typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
    const ids = await ev(`(() => { const W = window; const set = W.wrizoCreateProject('Ledger');
      W.wrizoCreateJournalPage({ id: 'pm-1', text: ${JSON.stringify(HEAD + TAIL)}, createdAt: '2026-04-01T00:00:01.000Z', origin: 'project', source: 'page', projectId: set.id, orderIndex: 0, pageType: 'manuscript' });
      W.wrizoCreateJournalPage({ id: 'pm-2', text: 'A second Part.', createdAt: '2026-04-01T00:00:02.000Z', origin: 'project', source: 'page', projectId: set.id, orderIndex: 1, pageType: 'manuscript' });
      W.wrizoCreateJournalPage({ id: 'pm-ctl', text: 'A page with no saved mode.', createdAt: '2026-04-01T00:00:03.000Z', origin: 'project', source: 'page', projectId: set.id, orderIndex: 2, pageType: 'manuscript' });
      localStorage.setItem('wrizo-mode-page-pm-1', 'drafting'); W.wrizoFlushNow(); return { set: set.id }; })()`);
    const before = await ev(MODEKEYS);
    await ev("location.hash = '#/page/pm-1'");
    await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.wz-row')", { label: 'Draft opens', timeout: 20000 }).catch(() => {});
    await sleep(1200);
    // the Parts tab of the Front menu, then "Split here" with her caret after the head
    const already = await ev("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'");
    if (!already) await ev("document.querySelector('.wz-sliver-grip')?.click(); null");
    await app.waitFor("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", { label: 'the Front menu', timeout: 5000 }).catch(() => {});
    await sleep(500);
    await ev("document.querySelector('#wz-sliver-tab-parts')?.click(); null"); await sleep(500);
    const placed = await ev(caretAt(HEAD.length));
    const pressed = await ev(click('[data-parts-split]'));
    await sleep(1500);
    await ev('window.wrizoFlushNow && window.wrizoFlushNow(); null'); await sleep(500);
    const split = await ev(`(() => { const es = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]').filter((e) => e.projectId === ${JSON.stringify(ids.set)} && !e.deletedAt).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)); return es.map((e) => e.id); })()`);
    const tailId = split && split.find((id) => !/^pm-/.test(id));
    const after = await ev(MODEKEYS);
    const headMode = await ev("localStorage.getItem('wrizo-mode-page-pm-1')");
    const tailMode = tailId ? await ev(`localStorage.getItem('wrizo-mode-page-${tailId}')`) : null;
    ok(`PM1 [${cfg.name}] after "Split here" in Draft the tail's stored mode is the head's ('drafting')`, placed === true && pressed === true && !!tailId && headMode === 'drafting' && tailMode === 'drafting', JSON.stringify({ placed, pressed, split, tailId, headMode, tailMode }));
    const added = after.filter((k) => !before.includes(k));
    ok(`PM3 [${cfg.name}] the split saves nothing new but that existing per-page mode key`, !!tailId && added.length === 1 && added[0] === `wrizo-mode-page-${tailId}`, JSON.stringify({ added }));
    // SUPERSEDED (#128, Fable Nov 24 11:28 am: the reorg's Part arrows on the page's scrollbar are no longer mounted; the fix run 45468457970 read
    // stepped false). PM2's claim - the tail opens in Draft - stands; PM2-B moves to it by the Part's foot ("Next · 2 · name"), her door now. Verbatim:
    //   // the arrow to the tail
    //   const stepped = await ev(click('[data-part-step="1"]'));
    // the foot's Next to the tail
    const stepped = await ev(click(`[data-part-go="${tailId}"]`));
    await app.waitFor(`location.hash.indexOf(${JSON.stringify(tailId || 'none')}) >= 0`, { label: 'the tail opens', timeout: 8000 }).catch(() => {});
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the tail editor', timeout: 8000 }).catch(() => {});
    await sleep(1500);
    const tailPage = await ev(READ);
    // SUPERSEDED with the arrow (#128): PM2, verbatim:
    //   ok(`PM2 [${cfg.name}] the next-Part arrow opens the tail in Draft (rows drawn), not in Free Write`, stepped === true && tailPage.rows > 0 && (tailPage.text || '').indexOf('The tail') === 0, JSON.stringify({ stepped, tailPage }));
    ok(`PM2-B [${cfg.name}] the foot's Next (the next-Part arrow is retired, #128) opens the tail in Draft (rows drawn), not in Free Write`, stepped === true && tailPage.rows > 0 && (tailPage.text || '').indexOf('The tail') === 0, JSON.stringify({ stepped, tailPage }));
    // the control: a page with no saved mode opens in Free Write, as it always did
    await ev("location.hash = '#/page/pm-ctl'");
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'the control page', timeout: 8000 }).catch(() => {});
    await sleep(1500);
    const ctl = await ev(READ);
    ok(`PM4 [${cfg.name}] CONTROL: a manuscript page with no saved mode still opens in Free Write (no rows), and the head keeps Draft`, ctl.hasEditor && ctl.rows === 0 && headMode === 'drafting', JSON.stringify({ ctl, headMode }));
  }
}); } catch (e) { ok('the run did not crash', false, String(e && e.stack || e)); }
let bad = 0;
for (const c of checks) { if (!c.pass) bad += 1; console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  ' + c.detail}`); }
console.log(`\n${checks.length - bad}/${checks.length} checks passed`);
process.exit(bad ? 1 : 0);
