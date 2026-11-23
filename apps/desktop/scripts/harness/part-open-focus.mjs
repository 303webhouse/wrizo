// A PART OPENS WITH HER CARET IN IT (Fable, Nov 22, 3:20 pm: MONDAY BLOCKER from POLISH's writing audit, R1: "after the next-Part arrow (and the top rail's Part name), the new Part opens with nothing focused and her letters go nowhere (PageEditor focuses only
// an empty page; PartMoves just opens it). Fix: focus lands in the new Part's editor with the caret at its start. Red first, in Machina and Arbor (reorg on)"). POLISH's pointer: in a Doc of two Parts, caret in Part 1, press `[data-part-step="1"]`, type Q: the active
// element is the body and the Q is lost, 12 of 12 jobs (Machina live, Arbor's preview door ?reorglift=, both tones, both widths).
// Every door that opens another Part of the Doc she is writing in: the next-Part arrow on the scrollbar (PartMoves), the line at the Part's foot ("Next · 2 · name"), and a row of the Parts list the top rail's Part name drops. After each, with her caret in the
// first Part before it:
//   PF1  the new Part's editor holds the focus (the active element is inside it) and its caret is a collapsed one inside the editor
//   PF2  Draft (BUILD): the caret is at the START of the Part (Fable's word), so the next key types there: a Q typed after the move is the first character of the Part's words
//   PF3  Free Write (SPRINT, the Typewriter: forward-only, its insertion point is always the end of the Part): the focus is in the editor and a Q typed after the move lands at the end of the Part's words
//   PF4  the old Part kept what she had typed in it (nothing of the move's typing is in it)
//   PF5  CONTROL: a Free Write page opened by any other door (the Desk's route) is left exactly as it was: no focus is taken (the active element is not the editor) - the fix is for her own moves between Parts only (a Draft page takes its editor at its mount anyway)
// In Machina (?reorg=1) and Arbor (?reorg=1&arbor2=1 with the preview door ?reorglift=plateau.* for the pieces the table has not switched on).
// Run: node scripts/harness/part-open-focus.mjs (from apps/desktop; a box turn or Actions)
import { withHarness } from '../runtime-verify.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const TEXTS = ['First Part, its own words.', 'Second Part, other words here.', 'Third.'];
const LIFT = ['top', 'front', 'back', 'split', 'uplink'].map((p) => `plateau.${p}`).join(',');
const CFGS = [
  { name: 'Machina', theme: 'machina', q: 'reorg=1' },
  { name: 'Arbor', theme: 'plateau', q: `reorg=1&arbor2=1&reorglift=${LIFT}` },
];
const DOORS = [
  { id: 'arrow', label: 'the next-Part arrow on the scrollbar', press: (ids) => `(() => { const b = document.querySelector('[data-part-step="1"]'); if (!b || b.disabled) return false; b.click(); return true; })()` },
  { id: 'foot', label: 'the "Next" line at the Part\'s foot', press: (ids) => `(() => { const b = document.querySelector('[data-part-go="${ids[1]}"]'); if (!b) return false; b.click(); return true; })()` },
  { id: 'rail', label: 'a row of the Parts list the top rail\'s Part name drops', first: () => "(() => { const c = document.querySelector('[data-top-part-count]'); if (!c) return false; c.click(); return true; })()", press: (ids) => `(() => { const r = document.querySelector('[data-top-parts-drop] [data-part-row="${ids[1]}"]'); if (!r) return 'norow'; r.click(); return true; })()` },
];
const STATE = () => `(() => {
  const ed = document.querySelector('.forward-only-editor'); const a = document.activeElement; const sel = getSelection();
  return { text: ed ? ed.innerText.replace(/\\u200b/g, '') : null, onEditor: !!(a && a.closest && a.closest('.forward-only-editor')), active: a ? a.tagName + '.' + String(a.className).slice(0, 28) : null,
    caret: !!(sel && sel.rangeCount && ed && ed.contains(sel.anchorNode) && sel.isCollapsed) };
})()`;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const waitText = async (t) => { for (let i = 0; i < 60; i += 1) { const s = await ev(STATE()); if (s && s.text && s.text.trim() === t) return s; await sleep(250); } return null; };
  await app.emulateDpr(1, 1920, 1080);
  for (const cfg of CFGS) {
    await app.goto('/');
    await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await ev(`localStorage.setItem('wrizo-theme', '${cfg.theme}')`);
    await ev(`history.replaceState(null, '', '/?${cfg.q}')`);
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
    await app.waitFor("!document.querySelector('.wz-splash')", { timeout: 20000, label: 'splash gone' }).catch(() => {});
    await app.waitFor("typeof window.wrizoCreateProject === 'function' && typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
    let n = 0;
    const openDoc = async (mode) => {
      const tag = `pof-${Date.now().toString(36)}-${n += 1}`;
      await ev("location.hash = '#/'"); await sleep(300);
      const ids = await ev(`(() => { const W = window; const set = W.wrizoCreateProject('Doc ' + ${n}); const ids = [];
        ${JSON.stringify(TEXTS)}.forEach((t, i) => { const id = '${tag}-' + i; ids.push(id); W.wrizoCreateJournalPage({ id, text: t, createdAt: new Date(Date.now() + i).toISOString(), origin: 'project', source: 'page', projectId: set.id, orderIndex: i });
          localStorage.setItem('wrizo-mode-page-' + id, '${mode}'); }); W.wrizoFlushNow(); return ids; })()`);
      await ev(`location.hash = '#/page/${ids[0]}'`);
      await app.waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", { label: 'the editor', timeout: 20000 });
      await waitText(TEXTS[0]);
      await sleep(1200);
      return ids;
    };
    for (const [stage, mode] of [['Draft', 'drafting'], ['Free Write', 'journal']]) {
      for (const door of DOORS) {
        const ids = await openDoc(mode);
        // her caret in the first Part: she is writing there (a few characters typed first)
        await ev("(() => { const ed = document.querySelector('.forward-only-editor'); ed.focus({ preventScroll: true }); return true; })()");
        await app.typeKeys('!'); await sleep(900);
        if (door.first) { const f = await ev(door.first()); if (f !== true) { ok(`PF1 [${cfg.name} ${stage}] ${door.label}: the door exists on the page`, false, JSON.stringify({ first: f })); continue; } await sleep(900); }
        const pressed = await ev(door.press(ids));
        await sleep(300);
        const there = await waitText(TEXTS[1]);
        await sleep(900);
        const after = await ev(STATE());
        const tag = `[${cfg.name} ${stage}] ${door.label}`;
        if (pressed !== true) { ok(`PF1 ${tag}: the door exists on the page`, false, JSON.stringify({ pressed })); continue; }
        ok(`PF1 ${tag}: the new Part opens with the focus in its editor and a collapsed caret there`, !!there && after.onEditor === true && after.caret === true, JSON.stringify({ opened: !!there, active: after.active, onEditor: after.onEditor, caret: after.caret }));
        await app.typeKeys('Q'); await sleep(500);
        const typed = await ev(STATE());
        const t = (typed.text || '').trim();
        if (mode === 'drafting') ok(`PF2 ${tag}: the caret is at the START of the Part: a Q typed after the move is the first character of its words`, t.startsWith('Q' + TEXTS[1].slice(0, 10)), JSON.stringify(t.slice(0, 40)));
        else ok(`PF3 ${tag}: a Q typed after the move lands at the end of the Part's words (forward-only)`, t.endsWith('Q') && t.includes(TEXTS[1].slice(0, 10)), JSON.stringify(t.slice(-40)));
        // PF4: the first Part kept its '!' and nothing else of the move
        await ev(`location.hash = '#/page/${ids[0]}'`);
        const back = await ev(`new Promise((res) => { let i = 0; const f = () => { const ed = document.querySelector('.forward-only-editor'); const tx = ed ? ed.innerText.replace(/\\u200b/g, '') : ''; if (tx.startsWith('First Part') || i > 40) res(tx); else { i += 1; setTimeout(f, 250); } }; f(); })`);
        ok(`PF4 ${tag}: the first Part kept what she typed in it and took nothing of the move (no Q)`, typeof back === 'string' && back.includes('!') && !back.includes('Q'), JSON.stringify((back || '').slice(-40)));
      }
    }
    // PF5: a page opened by the route (not her own move) takes no focus
    const ids = await openDoc('journal');
    await ev("document.activeElement && document.activeElement.blur && document.activeElement.blur()");
    await ev(`location.hash = '#/page/${ids[1]}'`);
    await waitText(TEXTS[1]);
    await sleep(900);
    const ctl = await ev(STATE());
    ok(`PF5 [${cfg.name}] CONTROL: a page opened by the Desk's route (not her own move between Parts) is left as it was: the focus is not taken into the editor`, !!ctl && ctl.onEditor === false, JSON.stringify({ active: ctl && ctl.active }));
  }
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); checks.push({ name: 'HARNESS', pass: false, detail: String(e && e.message || e) }); }

let bad = 0;
for (const c of checks) { console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.pass ? '' : '  ' + c.detail}`); if (!c.pass) bad += 1; }
console.log(bad ? `\nPART-OPEN-FOCUS VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nPART-OPEN-FOCUS VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
