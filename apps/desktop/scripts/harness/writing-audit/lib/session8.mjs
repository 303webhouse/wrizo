// SESSION 8 (writing audit; Fable, Nov 22, 2:30 pm: "the writing audit with the reorg on, in Machina and Arbor (report only)... Parts, split, Find, footnotes, Sup/Sub,
// the Typewriter, long pages"; Nick tests Monday). FINDS AND REPORTS; FIXES NOTHING. The reorg is ON: ?reorg=1 (Machina is on by default after the switch-over; Arbor keeps
// ?reorg=1, and with it only the rail is lit until its cells pass: WA_LIFT=all previews the rest through the gate's own preview door, ?reorglift=, reported separately).
// Each case drives a writer's steps and judges the page after each with the audit's own verify(): the text, the caret's place, the caret DRAWN where the selection is,
// focus, the page's rect, the console. A step the harness could not reach (a selector missing in this theme) is "not covered", never a finding.
//   PARTS   P1 split at the caret (Front menu PARTS, Structure, Split here) / P2 type after the split / P3 the next Part by the arrows, type there / P4 join it back
//   FIND    F1 open the search (top rail door), find a word, Enter, back to the page and type / F2 Replace all, then Undo: the page and the caret follow
//   NOTES   N1 a footnote typed by hand ([^1] and its note line) / N2 the footnote button (Draft, TEXT, More)
//   SUPSUB  U1 ^2^ typed by hand, then the arrows across the hidden markers / U2 the sub button on a selection
//   SPLIT   S1 an asset beside the page (the split): type in the page while it is open; the page's rect with it open and after it closes
//   TYPEWR  T1 Free Write (the Typewriter): type, Enter, type; the caret drawn in the zoom
//   LONG    L1 a 10,000-word Doc: type at the end and in the middle; the time per key (information)
// Knobs (env): WA_THEME WA_FLAG WA_TONE WA_W WA_H WA_OUT WA_LIFT (all | off) WA_ONLY (case ids)
import fs from 'node:fs';
import path from 'node:path';
import { withHarness } from '../../../runtime-verify.mjs';
import { makeDriver, sleep, THEMES } from './driver.mjs';
import { verify } from './verify.mjs';

const LIFT_ALL = (th) => ['top', 'front', 'back', 'split', 'uplink'].map((p) => `${th}.${p}`).join(',');

export async function main({ title }) {
  const env = process.env;
  const cfg = { theme: env.WA_THEME || 'machina', flag: env.WA_FLAG || 'off', tone: env.WA_TONE || 'light', width: Number(env.WA_W || 1366), height: Number(env.WA_H || 768), out: env.WA_OUT || null };
  if (!THEMES[cfg.theme]) { console.error('WA_THEME must be plateau, flux or machina'); process.exit(2); }
  const lift = env.WA_LIFT === 'all' ? LIFT_ALL(cfg.theme) : '';
  const TAG = `${THEMES[cfg.theme].label}/reorg${lift ? '+lift' : ''}/${cfg.tone}/${cfg.width}`;
  const only = env.WA_ONLY ? new Set(env.WA_ONLY.split(',').map((s) => s.trim())) : null;
  if (cfg.out) fs.mkdirSync(cfg.out, { recursive: true });
  const results = [];   // { id, label, fails: [{check, detail}], notes, obs }
  const uncovered = [];
  const out = (s) => console.log(s);

  await withHarness(async (app) => {
    const d = makeDriver(app, cfg);
    const ev = (js) => app.evalJs(js);
    const waitFor = (expr, label, timeout = 12000) => app.waitFor(expr, { label, timeout });
    out(`WRITING AUDIT ${title} [${TAG}] (${new Date().toISOString()})`);
    await d.boot();
    // the reorg ON (and the preview door, when asked), kept in the URL's query so every hash navigation carries it
    // WA_NOASK=1 (train K, Fable 6:20 pm: the reorg on by default in Machina and Arbor): no ?reorg=1, so the run proves the DEFAULT
    const q = env.WA_NOASK === '1' ? [] : ['reorg=1']; if (cfg.flag === 'on') q.push(`${THEMES[cfg.theme].flag}=1`); if (lift) q.push(`reorglift=${lift}`);
    await ev(`history.replaceState(null, '', '/${q.length ? '?' + q.join('&') : ''}#/')`);
    await app.reload();
    await waitFor("!!document.querySelector('.wz-arrival')", 'the Desk', 20000);
    await waitFor("!document.querySelector('.wz-splash')", 'splash gone', 20000).catch(() => {});
    out(`INFO reorg: ${JSON.stringify(await ev("({ q: location.search, top: !!document.querySelector('.reorg-top'), topSearch: !!document.querySelector('[data-top-search]'), theme: document.documentElement.getAttribute('data-theme'), arbor2: document.documentElement.getAttribute('data-arbor2') })"))}`);

    // ---- helpers --------------------------------------------------------------------------------------------------------------------------------
    let docN = 0;
    /** a Doc (a set) of Parts holding `texts`, opened on Part `at` in `mode`; returns the Part ids */
    const openDoc = async (texts, mode = 'drafting', at = 0) => {
      const tag = `wa8-${Date.now().toString(36)}-${++docN}`;
      await ev("location.hash = '#/'"); await sleep(200);
      const ids = await ev(`(() => { const W = window; const set = W.wrizoCreateProject(${JSON.stringify('Audit Doc ' + docN)}); const ids = [];
        ${JSON.stringify(texts)}.forEach((t, i) => { const id = ${JSON.stringify(tag)} + '-' + i; ids.push(id);
          W.wrizoCreateJournalPage({ id, text: t, createdAt: new Date(Date.now() + i).toISOString(), origin: 'project', source: 'page', projectId: set.id, orderIndex: i });
          localStorage.setItem('wrizo-mode-page-' + id, ${JSON.stringify(mode)}); });
        W.wrizoFlushNow(); return ids; })()`);
      await ev(`location.hash = '#/page/${ids[at]}'`);
      await waitFor("!!document.querySelector('.forward-only-editor') && !!document.querySelector('.mode-page')", 'the editor', 15000);
      await waitFor(`window.__wa && window.__wa.read().text === ${JSON.stringify(texts[at])}`, 'the editor holds the Part', 10000);
      await sleep(400); await d.still(); d.errors.length = 0;
      return ids;
    };
    const settle = async () => { await d.frames(); await sleep(300); return d.read(); };
    /** the page judged after a step, against the model `exp` (text, anchor, focus); `before` holds the page's rect the step must keep */
    const judge = async (id, label, exp, before, obs = {}) => {
      const late = await settle();
      if (late.collapsed && late.focused && !(late.theme === 'flux' && late.fluxCaret)) { const px = await d.pixelCaret(6); late.px = px; late.pxTries = px ? px.tries : 6; }
      const box = late.collapsed && late.focus !== null ? await d.box(late.focus) : null;
      const v = exp ? verify({ exp, box, before: before || late, early: late, late, errors: d.errors.splice(0) }) : { fails: [], notes: [] };
      const r = { id, label, fails: v.fails, notes: v.notes, obs: { ...obs, text: (late.text || '').slice(-120), caret: [late.anchor, late.focus], focused: late.focused } };
      results.push(r);
      out(`${v.fails.length ? 'FAIL' : 'PASS'} ${id} ${label}${v.fails.length ? '  ' + JSON.stringify(v.fails).slice(0, 700) : ''}${Object.keys(obs).length ? '  OBS ' + JSON.stringify(obs).slice(0, 500) : ''}`);
      return late;
    };
    const finding = (id, label, check, detail, obs = {}) => { results.push({ id, label, fails: [{ check, detail }], notes: [], obs }); out(`FAIL ${id} ${label}  ${JSON.stringify({ check, detail, obs }).slice(0, 700)}`); };
    const has = (sel) => ev(`!!document.querySelector(${JSON.stringify(sel)})`);
    /** a real mouse press on the first element matching `sel` (its own mousedown rules, focus kept or not, as a writer's press) */
    // SUPERSEDED (run 45074226527: the Replace toggle "pressed" true yet aria-expanded stayed false on all ten jobs: chrome that dissolved while she
    // typed takes a press only once pointer intent has brought it back, and the press went in at once. The press, verbatim:
    //   if (!p || p.dis) return false; await d.click(p.x, p.y); await sleep(350); return true;
    // [successor] as a writer does: move the pointer there, wait until elementFromPoint hits the target (or inside it), then press; a target never
    // hit in 2.5 s is reported (press returns false and says so), never pressed blind.
    const press = async (sel) => {
      const p = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), dis: !!e.disabled }; })()`);
      if (!p || p.dis) return false;
      await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x, y: p.y, buttons: 0, pointerType: 'mouse' });
      let hit = false;
      for (let i = 0; i < 25 && !hit; i++) {
        hit = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); const h = document.elementFromPoint(${p.x}, ${p.y}); return !!e && !!h && (h === e || e.contains(h)); })()`);
        if (!hit) { await sleep(100); await app.cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: p.x + (i % 2), y: p.y, buttons: 0, pointerType: 'mouse' }); }
      }
      if (!hit) { out(`OBS press ${sel}: never hit-testable at ${p.x},${p.y} (${await ev(`(() => { const h = document.elementFromPoint(${p.x}, ${p.y}); return h ? (h.tagName + '.' + String(h.className)).slice(0, 80) : 'nothing'; })()`)} on top)`); return false; }
      await d.click(p.x, p.y); await sleep(350); return true;
    };
    const need = async (id, sel, why) => { if (await has(sel)) return true; uncovered.push({ id, why: `${why} (${sel} not on the page in ${TAG})` }); out(`NOTCOVERED ${id} ${why}`); return false; };
    const frontOpen = async () => { if (!(await ev("document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'"))) { await press('.wz-sliver-grip'); await sleep(400); } };
    const refocus = async (a, f = a) => { await ev("document.querySelector('.forward-only-editor')?.focus()"); await d.place(a, f); await sleep(150); };
    const want = (cid) => !only || only.has(cid);
    const run = async (cid, fn) => { if (!want(cid)) return; try { await fn(); } catch (e) { uncovered.push({ id: cid, why: 'harness: ' + String(e && e.message || e).slice(0, 200) }); out(`NOTCOVERED ${cid} harness error: ${String(e && e.message || e).slice(0, 200)}`); } };

    // ---- PARTS ----------------------------------------------------------------------------------------------------------------------------------
    await run('P', async () => {
      const A = 'Alpha beta gamma.\nDelta epsilon zeta.', B = 'The second part.';
      const ids = await openDoc([A, B]);
      const cut = A.indexOf('Delta');
      await refocus(cut);
      const before = await d.read();
      await frontOpen(); await press('#wz-sliver-tab-parts'); await sleep(300);
      if (!(await need('P1', '[data-parts-structure-toggle]', 'the Parts tab\'s Structure'))) return;
      if (await ev("document.querySelector('[data-parts-structure-toggle]')?.getAttribute('aria-expanded') !== 'true'")) await press('[data-parts-structure-toggle]');
      await refocus(cut);
      if (!(await need('P1', '[data-parts-split]', 'Split here'))) return;
      await press('[data-parts-split]'); await sleep(900);
      const r1 = await d.read();
      const said = await ev("(document.querySelector('[data-parts-said]') || {}).textContent || null");
      const head = A.slice(0, cut).replace(/\n$/, '');
      // the writer's expectation: she stays on the head, the caret at its end, focus in the page, the page where it was
      await judge('P1', 'Split here at the caret: the head stays, the caret at its end, the page in focus and unmoved', { text: r1.text, a: (r1.text || '').length, f: (r1.text || '').length }, before, { said, head, gotHeadMatches: (r1.text || '').replace(/\n$/, '') === head });
      await d.type('Z'); await sleep(300);
      const r2 = await d.read();
      await judge('P2', 'type after the split: the letter lands at the caret (the end of the head)', { text: r1.text + 'Z', a: (r1.text || '').length + 1, f: (r1.text || '').length + 1 }, before, { got: (r2.text || '').slice(-30) });
      if (!(await need('P3', '[data-part-step="1"]', 'the Part arrows'))) return;
      await press('[data-part-step="1"]'); await sleep(1200);
      await waitFor("!!document.querySelector('.forward-only-editor')", 'the next Part', 10000);
      const r3 = await d.read();
      const tail = A.slice(cut);
      await judge('P3a', 'the next Part (the tail) by the arrows: its text is the tail, the caret is in it and drawn', { text: r3.text, a: r3.anchor ?? 0, f: r3.focus ?? 0 }, null, { tailMatches: r3.text === tail, text0: (r3.text || '').slice(0, 40), caret: [r3.anchor, r3.focus] });
      const at3 = r3.focus ?? 0;
      await d.type('Q'); await sleep(300);
      await judge('P3b', 'type on the next Part: the letter lands at the caret', { text: (r3.text || '').slice(0, at3) + 'Q' + (r3.text || '').slice(at3), a: at3 + 1, f: at3 + 1 }, null);
      // SUPERSEDED (run 45072994222: Join is not a Structure button; it lives in each Part row's own menu, PartsList.tsx data-part-act="join"; the
      // line looked where it never was and read "not covered" on all twelve jobs). The line, verbatim:
      // if (!(await need('P4', '[data-structure-act="join"]', 'Join (the Structure section)'))) return;
      // [successor] open the Front menu's PARTS tab, the open Part's row (aria-current) menu, then its Join
      // run 45075160867: the Front menu and its tab were not on the page at all after the arrow (open/tab undefined, rows []). Read the chrome
      // as she arrives, then again after she clicks into the page (what a writer does when her letters went nowhere), before opening PARTS.
      const chrome = () => ev("({ sliver: !!document.querySelector('.wz-sliver'), grip: !!document.querySelector('.wz-sliver-grip'), tab: !!document.querySelector('#wz-sliver-tab-parts'), arrows: !!document.querySelector('[data-part-arrows]'), editor: !!document.querySelector('.forward-only-editor'), focused: document.activeElement === document.querySelector('.forward-only-editor') })");
      const ch0 = await chrome();
      await press('.forward-only-editor'); await refocus(0); await sleep(300);
      const ch1 = await chrome();
      out(`OBS P4 the chrome after the arrow: ${JSON.stringify({ arriving: ch0, afterClickIn: ch1 })}`);
      // SUPERSEDED (run 45076050345: the Front menu's absence is the page's MODE, not a lost menu: Split gives the tail pageType 'manuscript'
      // (parts.ts splitPart, createBinderPage(docId, src.pageType ?? 'manuscript')), a manuscript page with no saved mode opens in Free Write
      // (PageEditor.tsx useState mode), and under the reorg Free Write has no Front menu (PageEditor.tsx sliver={mode === 'journal' && reorgTop ?
      // undefined : ...}), by design. The line, verbatim:
      // if (!ch1.sliver) finding('P4-front', 'after the Part arrow (and a click into the page), the Front menu is on the page', 'chrome', `.wz-sliver absent: ${JSON.stringify({ ch0, ch1 })}`);
      // [successor] the tail's mode, read three ways; the head was cut in Draft (Split here lives only in Draft's Front menu), so a tail opening in
      // Free Write is reported as P3-mode (a question for a ruling: should a split's tail open in the mode it was cut in?)
      const tailId = (await ev('location.hash')).split('/').pop();
      const modeObs = await ev(`({ stored: localStorage.getItem('wrizo-mode-page-${tailId}'), headStored: localStorage.getItem('wrizo-mode-page-${ids[0]}'), sprintGrip: document.querySelector('.wz-tutor-grip')?.getAttribute('data-sprint') || null, zoom: !!document.querySelector('.mode-pagecol[data-zoom="true"]'), front: !!document.querySelector('.wz-sliver') })`);
      out(`OBS P3-mode the tail's mode: ${JSON.stringify(modeObs)}`);
      if (!modeObs.front && modeObs.headStored === 'drafting') finding('P3-mode', 'a split\'s tail opens in the mode it was cut in (Draft): it opened in Free Write, without the Front menu', 'mode', JSON.stringify(modeObs));
      // Join from the head, as she can: back to Part 1 by the arrow (it is in Draft, with its Front menu), PARTS, the tail's row menu, Join
      await press('[data-part-step="-1"]'); await sleep(1200);
      await waitFor(`location.hash.endsWith(${JSON.stringify(ids[0])})`, 'back on the head', 10000).catch(() => {});
      await press('.forward-only-editor'); await sleep(200);
      await frontOpen(); await press('#wz-sliver-tab-parts'); await sleep(300);
      const rowId = await ev(`document.querySelector('[data-part-row="${tailId}"]') ? ${JSON.stringify(tailId)} : null`);
      if (!rowId) out(`OBS P4 the PARTS tab: ${JSON.stringify(await ev("({ open: document.querySelector('.wz-sliver')?.getAttribute('data-open'), tab: document.querySelector('#wz-sliver-tab-parts')?.getAttribute('aria-selected'), rows: [...document.querySelectorAll('[data-part-row]')].map((r) => [r.getAttribute('data-part-row').slice(-6), r.getAttribute('aria-current')]), hash: location.hash.slice(-30) })"))}`);
      if (!rowId) { uncovered.push({ id: 'P4', why: `the tail's row ([data-part-row="${tailId}"]) not in the head's PARTS tab in ${TAG}` }); out('NOTCOVERED P4 the tail\'s row'); return; }
      // the earlier aria-current read, kept for the record (it named the open Part; Join now acts on the tail's row from the head):
      // const rowId = await ev("(document.querySelector('[data-part-row][aria-current=\"true\"]') || {}).getAttribute?.('data-part-row') || null");
      await press(`[data-part-more="${rowId}"]`); await sleep(300);
      if (!(await need('P4', `[data-part-menu="${rowId}"] [data-part-act="join"]`, 'Join (the tail\'s row menu)'))) return;
      const tailNow = r3.text;   // the tail as it stands (P3b's letter went nowhere: R1)
      await press(`[data-part-menu="${rowId}"] [data-part-act="join"]`); await sleep(1500);
      await waitFor("!!document.querySelector('.forward-only-editor')", 'the joined Part', 10000).catch(() => {});
      const r4 = await d.read();
      await judge('P4', 'Join it back onto the Part above: one Part holds both halves, the caret in it and drawn', { text: r4.text, a: r4.anchor ?? 0, f: r4.focus ?? 0 }, null,
        { holdsBoth: (r4.text || '').includes(r1.text + 'Z') && (r4.text || '').includes(tailNow), caret: [r4.anchor, r4.focus], ids });
    });

    // ---- FIND -----------------------------------------------------------------------------------------------------------------------------------
    await run('F', async () => {
      const T = 'The toll rose at dawn.\nNobody paid the toll.';
      await openDoc([T]);
      await refocus(T.length);
      const before = await d.read();
      if (!(await need('F1', '[data-top-search]', 'the top rail\'s search door'))) return;
      await press('[data-top-search]'); await sleep(600);
      if (!(await need('F1', '[data-search-q]', 'the search field'))) return;
      await d.type('toll'); await sleep(500);
      await d.key('Enter'); await sleep(500);
      const hits = await ev("(window.CSS && CSS.highlights && CSS.highlights.get('wz-search')) ? CSS.highlights.get('wz-search').size : null");
      await press('.forward-only-editor'); await refocus(T.length);
      await d.type('!'); await sleep(300);
      await judge('F1', 'with the search open on "toll": back in the page, a letter lands at the caret; the page stays put', { text: T + '!', a: T.length + 1, f: T.length + 1 }, before, { hits });
      if (!(await need('F2', '[data-replace-toggle]', 'Replace'))) return;
      // the menu's own state before each press (run 1 read replaced:false with no reason: suspect the instrument first)
      const fdiag = () => ev("(() => { const q = document.querySelector('[data-search-q]'), w = document.querySelector('input[data-replace-with]'), all = document.querySelector('[data-replace-all]'), tg = document.querySelector('[data-replace-toggle]'); return { q: q ? q.value : null, qFocused: !!q && document.activeElement === q, toggle: tg ? tg.getAttribute('aria-expanded') : null, repl: w ? w.value : null, replFocused: !!w && document.activeElement === w, all: all ? { dis: all.disabled, label: all.textContent } : null, active: document.activeElement && (document.activeElement.tagName + '.' + document.activeElement.className).slice(0, 60) }; })()");
      const fd0 = await fdiag();
      // run 45075160867: after she clicked back into the page the search menu was no longer hit-testable (the page's stage on top of its toggle):
      // the menu closes when she returns to the page, so a writer opens the search door again; Replace is judged from there
      if (!(await ev("(() => { const t = document.querySelector('[data-replace-toggle]'); if (!t) return false; const r = t.getBoundingClientRect(); const h = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!h && (h === t || t.contains(h)); })()"))) {
        await press('[data-top-search]'); await sleep(600);
        out(`OBS F2 the search door again: ${JSON.stringify(await fdiag())}`);
        // run 45076050345: the door did nothing. The drawer closed when she went back to the page but the search stayed open, and openSearch on
        // an open search only bumps `opened` (searchStore.ts), while the drawer opens on `search.open` alone (Tutor.tsx): R3
        const drawer = await ev("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') || null");
        if (drawer !== 'true') {
          finding('R3', 'after she returns to the page, the search door opens the search again', 'door', `the Back drawer stays shut (data-open ${drawer}) after the door press; the search is still open behind it (q ${JSON.stringify((await fdiag()).q)})`);
          // to reach Replace anyway, the way she still can: the Back menu's own grip
          await press('.wz-tutor-grip'); await sleep(600);
          out(`OBS F2 after the Back grip: ${JSON.stringify({ drawer: await ev("document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') || null"), ...(await fdiag()) })}`);
        }
      }
      const pT = await press('[data-replace-toggle]'); await sleep(300);
      const fd1 = await fdiag();
      // (run 45075160867 typed "fee" into the page when the field was never pressed: type only into a pressed field)
      const pW = await press('input[data-replace-with]'); if (pW) await d.type('fee'); await sleep(200);
      if (!pW) { uncovered.push({ id: 'F2', why: `the Replace field could not be pressed in ${TAG} (see OBS F2)` }); out('NOTCOVERED F2 the Replace field'); return; }
      const fd2 = await fdiag();
      const pA = await press('[data-replace-all]'); await sleep(800);
      out(`OBS F2 the menu before each press: ${JSON.stringify({ fd0, pT, fd1, pW, fd2, pA })}`);
      const r = await d.read();
      const want2 = (T + '!').replace(/toll/g, 'fee');
      await judge('F2a', 'Replace all ("toll" -> "fee"): the page reads the replaced text', { text: r.text, a: r.anchor ?? 0, f: r.focus ?? 0 }, before, { replaced: r.text === want2 });
      if (r.text !== want2) finding('F2a-text', 'Replace all ("toll" -> "fee"): the page reads the replaced text', 'text', `got ${JSON.stringify(r.text)} want ${JSON.stringify(want2)}`, { fd2, pA });
      if (await has('[data-replace-undo]')) { await press('[data-replace-undo]'); await sleep(800); const u = await d.read(); await judge('F2b', 'Undo the replace: the page reads the text before it', { text: u.text, a: u.anchor ?? 0, f: u.focus ?? 0 }, before, { restored: u.text === T + '!' }); }
      await d.key('Escape'); await sleep(300);
    });

    // ---- NOTES ----------------------------------------------------------------------------------------------------------------------------------
    await run('N', async () => {
      const T = 'A claim worth a note.';
      await openDoc([T]);
      await refocus(T.length);
      const before = await d.read();
      await d.type('[^1]'); await sleep(200);
      // SUPERSEDED (run 45072994222: the premise was wrong, not the page. What a writer types is literal: ForwardOnlyEditor escapes its formatting
      // characters (escapeTyped, [ForwardOnlyEditor §1]) and footnotes.ts reads "a typed \[^1] (escaped) is not a marker"; markers come from the
      // button, N2). The two lines, verbatim:
      // await judge('N1a', 'a footnote marker typed by hand', { text: T + '[^1]', a: T.length + 4, f: T.length + 4 }, before);
      // const t1 = T + '[^1]\n[^1]: The note itself.';
      // await judge('N1b', 'its note line typed by hand (drawn as a note): the text and the caret drawn at its end', { text: t1, a: t1.length, f: t1.length }, before,
      //   { noteRow: await ev("!!document.querySelector('.forward-only-editor .md-note')") });
      // [successor] typed by hand, the marker and its note line stay literal words: escaped in the text, the caret after them and drawn, no note row drawn
      const E = (s) => s.replace(/[[\]^]/g, (c) => '\\' + c);
      await judge('N1a', 'a footnote marker typed by hand stays literal (escaped): the text and the caret drawn after it', { text: T + E('[^1]'), a: T.length + 7, f: T.length + 7 }, before);
      await d.key('Enter'); await d.type('[^1]: The note itself.'); await sleep(400);
      const t1 = T + E('[^1]') + '\n' + E('[^1]') + ': The note itself.';
      const noteRow = await ev("!!document.querySelector('.forward-only-editor .md-note')");
      await judge('N1b', 'its note line typed by hand stays literal words: the text and the caret drawn at its end', { text: t1, a: t1.length, f: t1.length }, before, { noteRow });
      if (noteRow) finding('N1c', 'a note line typed by hand is drawn as a note (it should stay literal words)', 'literal', '.md-note drawn for a typed (escaped) note line');
      const T2 = 'Body text for the button.';
      await openDoc([T2]);
      await refocus(4);
      const b2 = await d.read();
      await frontOpen(); await press('#wz-sliver-tab-text'); await sleep(300);
      if (!(await need('N2', '[data-text-fold="more"]', 'the TEXT tab\'s More'))) return;
      await press('[data-text-fold="more"]'); await sleep(300);
      await refocus(4);
      if (!(await need('N2', '[data-note-pick="footnote"]', 'the footnote button'))) return;
      await press('[data-note-pick="footnote"]'); await sleep(600);
      const r = await d.read();
      await judge('N2a', 'the footnote button: a marker at the caret, its note line at the end, the caret at the end and drawn, focus in the page', { text: r.text, a: (r.text || '').length, f: (r.text || '').length }, b2, { text: r.text });
      await d.type('Its note.'); await sleep(300);
      await judge('N2b', 'type the note: it lands on the note line', { text: r.text + 'Its note.', a: (r.text || '').length + 9, f: (r.text || '').length + 9 }, b2);
    });

    // ---- SUP / SUB ------------------------------------------------------------------------------------------------------------------------------
    await run('U', async () => {
      await openDoc(['']);
      await refocus(0);
      const before = await d.read();
      await d.type('E = mc^2^ holds'); await sleep(300);
      // SUPERSEDED (run 45072994222: the premise was wrong, not the page: typed formatting characters are literal, escapeTyped; ^2^ comes from the
      // sup button. The lines, verbatim:
      // const t = 'E = mc^2^ holds';
      // await judge('U1a', 'superscript typed by hand (^2^): the text, and the caret drawn after the hidden markers', { text: t, a: t.length, f: t.length }, before,
      //   { sup: await ev("!!document.querySelector('.forward-only-editor .md-sup')") });
      // const at = t.length - 6;
      // await judge('U1b', 'six ArrowLefts across the hidden markers, then a letter: it lands where the model says', { text: t.slice(0, at) + '!' + t.slice(at), a: at + 1, f: at + 1 }, before);
      // [successor] typed by hand, ^2^ stays literal (escaped, no superscript drawn); six ArrowLefts cross " holds" and the letter lands there
      const t = 'E = mc\\^2\\^ holds';
      const sup = await ev("!!document.querySelector('.forward-only-editor .md-sup')");
      await judge('U1a', 'superscript typed by hand (^2^) stays literal: the escaped text, the caret drawn at its end', { text: t, a: t.length, f: t.length }, before, { sup });
      if (sup) finding('U1c', 'a typed ^2^ is drawn as a superscript (it should stay literal)', 'literal', '.md-sup drawn for typed (escaped) carets');
      for (let i = 0; i < 6; i++) await d.key('ArrowLeft');
      await d.type('!'); await sleep(300);
      const at = t.length - 6;
      await judge('U1b', 'six ArrowLefts across " holds", then a letter: it lands where the model says', { text: t.slice(0, at) + '!' + t.slice(at), a: at + 1, f: at + 1 }, before);
      await openDoc(['H2O is water']);
      await refocus(1, 2);
      const b2 = await d.read();
      await frontOpen(); await press('#wz-sliver-tab-text'); await sleep(300);
      if (!(await need('U2', '[data-style-pick="sub"]', 'the sub button'))) return;
      await press('[data-style-pick="sub"]'); await sleep(500);
      const r = await d.read();
      await judge('U2', 'the sub button on "2": the text holds ~2~, the selection or caret on it, focus in the page', { text: r.text, a: r.anchor ?? 0, f: r.focus ?? 0 }, b2, { text: r.text, wantText: 'H~2~O is water', sub: await ev("!!document.querySelector('.forward-only-editor .md-sub')") });
    });

    // ---- SPLIT SCREEN ---------------------------------------------------------------------------------------------------------------------------
    await run('S', async () => {
      const T = 'The page beside its asset.';
      const ids = await openDoc([T, 'The asset page.']);
      await ev(`window.wrizoAddPageLink(${JSON.stringify(ids[0])}, { bEntryId: ${JSON.stringify(ids[1])} })`);
      await ev(`location.hash = '#/'`); await sleep(200); await ev(`location.hash = '#/page/${ids[0]}'`);
      await waitFor(`window.__wa && window.__wa.read().text === ${JSON.stringify(T)}`, 'the page again', 10000); await sleep(400); await d.still();
      await refocus(T.length);
      const before = await d.read();
      const opened = await ev(`(() => { if (!window.wrizoSplit) return false; window.wrizoSplit.open(${JSON.stringify(ids[0])}, { entryId: ${JSON.stringify(ids[1])} }); return true; })()`);
      if (!opened) { uncovered.push({ id: 'S1', why: `the split's test door (window.wrizoSplit) is not on the page in ${TAG}` }); out('NOTCOVERED S1 the split'); return; }
      await sleep(900); await d.still();
      const open = await d.read();
      await refocus(T.length);
      await d.type(' Typed beside it.'); await sleep(300);
      await judge('S1a', 'with an asset open beside the page: typing lands at the caret, drawn, focus kept (the page\'s rect compared with before it opened)', { text: T + ' Typed beside it.', a: T.length + 17, f: T.length + 17 }, open,
        { pageBefore: before.page, pageOpen: open.page, split: await ev("!!document.querySelector('aside.wz-split-asset')") });
      if (await has('[data-split-close]')) { await press('[data-split-close]'); await sleep(800); await d.still(); const c = await d.read(); out(`OBS S1b the page after the split closes: ${JSON.stringify({ before: before.page, after: c.page, same: JSON.stringify(before.page) === JSON.stringify(c.page) })}`);
        if (JSON.stringify(before.page) !== JSON.stringify(c.page)) finding('S1b', 'the page returns to its own rect when the split closes', 'page', `before ${JSON.stringify(before.page)} after ${JSON.stringify(c.page)}`); }
    });

    // ---- TYPEWRITER -----------------------------------------------------------------------------------------------------------------------------
    await run('T', async () => {
      const T = 'Start.';
      await openDoc([T], 'journal');
      await refocus(T.length);
      await d.still(); const before = await d.read();
      await d.type(' More words here.'); await sleep(300);
      const t1 = T + ' More words here.';
      await judge('T1a', 'Free Write (the Typewriter, the reorg on): type, the caret drawn in the zoom, the page holds still', { text: t1, a: t1.length, f: t1.length }, before,
        { zoom: await ev("!!document.querySelector('.mode-pagecol[data-zoom=\"true\"]:not(.wz-letter-measure *)')"), front: await ev("!!document.querySelector('.wz-sliver')") });
      await d.key('Enter'); await d.type('Next line.'); await sleep(400);
      const t2 = t1 + '\nNext line.';
      await judge('T1b', 'Enter, then a new line in the Typewriter', { text: t2, a: t2.length, f: t2.length }, before);
    });

    // ---- R2 PROBE (Arbor's Typewriter caret, Fable 3:20 pm "keep the audit going (R2 ...)") --------------------------------------------------------
    // T1a found no caret painted on 7 of 16 Arbor jobs, 0 of 6 Machina. W repeats T1a's steps four times a job and reads, each time, what could
    // hide a caret: where the selection sits, the caret's own rect, what is drawn on top of it, the opacity / mask / filter / visibility down the
    // caret's ancestry, caret-color, focus (element and window), the zoom; then the painted caret (pixelCaret). Observation first; the only
    // finding is the one T1a already states (no caret painted), counted per attempt.
    await run('W', async () => {
      const probe = () => ev(`(() => {
        const ed = document.querySelector('.forward-only-editor'); const s = getSelection(); const out = { docFocus: document.hasFocus(), edFocus: document.activeElement === ed };
        if (!ed || !s || !s.rangeCount) return { ...out, sel: null };
        const r = s.getRangeAt(0); const n = s.focusNode;
        out.sel = { node: n ? (n.nodeType === 3 ? '#text' : n.nodeName + '.' + String(n.className || '').slice(0, 30)) : null, off: s.focusOffset, inEd: !!n && ed.contains(n) };
        out.kids = [...ed.childNodes].slice(0, 8).map((k) => k.nodeType === 3 ? '#t' + k.textContent.length : k.nodeName + (k.className ? '.' + String(k.className).slice(0, 20) : '') + ':' + (k.textContent || '').length + ':' + getComputedStyle(k).display);
        const rects = [...r.getClientRects()]; const rc = rects[0] || r.getBoundingClientRect();
        out.rect = rc ? { x: Math.round(rc.left), y: Math.round(rc.top), h: Math.round(rc.height), n: rects.length } : null;
        if (rc && rc.height) { const h = document.elementFromPoint(rc.left + 1, rc.top + rc.height / 2); out.top = h ? (h.tagName + '.' + String(h.className || '').slice(0, 40)) : null; out.topInEd = !!h && ed.contains(h); }
        const chain = []; for (let e = ed; e && e !== document.documentElement; e = e.parentElement) { const c = getComputedStyle(e); const bad = []; if (c.opacity !== '1') bad.push('op' + c.opacity); if (c.visibility !== 'visible') bad.push(c.visibility); if (c.maskImage && c.maskImage !== 'none') bad.push('mask'); if (c.webkitMaskImage && c.webkitMaskImage !== 'none') bad.push('wmask'); if (c.filter && c.filter !== 'none') bad.push('filter'); if (bad.length) chain.push((e.className && String(e.className).split(' ')[0]) + ':' + bad.join(',')); }
        out.chain = chain; const cs = getComputedStyle(ed); out.caretColor = cs.caretColor; out.color = cs.color; out.zoom = !!document.querySelector('.mode-pagecol[data-zoom="true"]');
        return out; })()`);
      const tally = { painted: 0, none: 0 };
      for (let k = 1; k <= 4; k++) {
        const T = 'Start.';
        await openDoc([T], 'journal');
        await refocus(T.length);
        await d.still();
        await d.type(' More words here.'); await sleep(300);
        const p0 = await probe();
        const px = await d.pixelCaret(6);
        const p1 = await probe();
        if (px) tally.painted++; else tally.none++;
        out(`OBS W${k} ${px ? 'PAINTED' : 'NONE'} ${JSON.stringify({ px: px ? { x: px.x, y: px.y, via: px.via } : null, before: p0, after: p1 })}`.slice(0, 1800));
      }
      out(`OBS W the tally: ${JSON.stringify(tally)}`);
      if (tally.none) finding('W', 'Free Write (the Typewriter): the caret is painted after typing (four tries)', 'drawn', `no caret painted in ${tally.none} of 4 tries`, tally);
    });

    // ---- R2, WHAT HIDES IT (run 45077968172: Arbor 1920 painted 0 of 8, Arbor 1366 7 of 8, Machina 8 of 8; selection, focus, caret-color and the
    // .mode-pagecol mask read the same in all). V discriminates, each on a fresh Free Write page after T1a's typing:
    //   a. as typed (the selection at the editor element, after its two spans)       b. the selection put inside the last text node, at its end
    //   c. as typed, with .mode-pagecol's mask lifted (style override, put back)     d. the geometry: where the text's end is, the paper, the mask
    await run('V', async () => {
      const geo = () => ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const col = document.querySelector('.mode-pagecol[data-zoom="true"]') || document.querySelector('.mode-pagecol');
        const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let last = null; while (w.nextNode()) if (w.currentNode.textContent.length) last = w.currentNode;
        let end = null; if (last) { const r = document.createRange(); r.setStart(last, last.textContent.length); r.collapse(true); const b = r.getClientRects()[0] || r.getBoundingClientRect(); end = { x: Math.round(b.left), y: Math.round(b.top), h: Math.round(b.height) }; }
        const cr = col ? col.getBoundingClientRect() : null; const cs = col ? getComputedStyle(col) : null;
        return { vw: innerWidth, vh: innerHeight, end, col: cr ? { x: Math.round(cr.left), y: Math.round(cr.top), w: Math.round(cr.width), h: Math.round(cr.height) } : null, mask: cs ? String(cs.webkitMaskImage || cs.maskImage).slice(0, 300) : null, maskSize: cs ? cs.webkitMaskSize || cs.maskSize : null, maskPos: cs ? cs.webkitMaskPosition || cs.maskPosition : null, transform: cs ? cs.transform : null }; })()`);
      const inText = () => ev(`(() => { const ed = document.querySelector('.forward-only-editor'); const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let last = null; while (w.nextNode()) if (w.currentNode.textContent.length) last = w.currentNode; if (!last) return false; const s = getSelection(); s.removeAllRanges(); const r = document.createRange(); r.setStart(last, last.textContent.length); r.collapse(true); s.addRange(r); return true; })()`);
      const fresh = async () => { const T = 'Start.'; await openDoc([T], 'journal'); await refocus(T.length); await d.still(); await d.type(' More words here.'); await sleep(300); };
      const rows = [];
      for (let k = 1; k <= 2; k++) {
        await fresh(); const g = await geo(); const a = await d.pixelCaret(6);
        await fresh(); await inText(); await sleep(150); const b = await d.pixelCaret(6);
        await fresh(); await ev("(() => { const c = document.querySelector('.mode-pagecol[data-zoom=\"true\"]') || document.querySelector('.mode-pagecol'); if (c) { c.style.setProperty('mask-image', 'none', 'important'); c.style.setProperty('-webkit-mask-image', 'none', 'important'); } })()"); await sleep(150);
        const c = await d.pixelCaret(6);
        await ev("(() => { const c = document.querySelector('.mode-pagecol'); if (c) { c.style.removeProperty('mask-image'); c.style.removeProperty('-webkit-mask-image'); } })()");
        const pick = (p) => (p ? { x: p.x, y: p.y, via: p.via } : null);
        rows.push({ k, asTyped: pick(a), inText: pick(b), maskLifted: pick(c), geo: g });
        out(`OBS V${k} ${JSON.stringify(rows[rows.length - 1])}`.slice(0, 1800));
      }
      const n = (key) => rows.filter((r) => r[key]).length;
      out(`OBS V the tally (painted of 2): ${JSON.stringify({ asTyped: n('asTyped'), inText: n('inText'), maskLifted: n('maskLifted') })}`);
    });

    // ---- R2, TEST THE INSTRUMENT (run 45078904889: neither the selection inside the text nor the mask lifted cures Arbor 1920 reliably, and the
    // only detector that works here is DIFF (the forced colour never matched): two shots inside the editor, with and without the selection,
    // rejected when the change is wider than 8 px. If anything else in the editor moves between the shots (the Typewriter's letter fade?), a
    // painted caret reads "none". X prints the raw diffs: a STILL pair (both shots with the selection, nothing changed), the caret pair, and the
    // same two after a 2.5 s wait.
    await run('X', async () => {
      const shot = async () => (await app.cdp('Page.captureScreenshot', { format: 'png' })).data;
      const pair = async (label) => {
        const at = await ev('(() => { const r = window.__wa.read(); return { a: r.anchor, f: r.focus }; })()');
        const S1 = await shot(); await sleep(60); const S2 = await shot();
        const still = await ev(`window.__wa.diff(${JSON.stringify(S1)}, ${JSON.stringify(S2)})`);
        const A = await shot(); await ev('window.__wa.clear()'); await sleep(60); const B = await shot();
        if (at.a !== null) await ev(`window.__wa.place(${at.a}, ${at.f})`);
        const caret = await ev(`window.__wa.diff(${JSON.stringify(A)}, ${JSON.stringify(B)})`);
        return { label, still, caret };
      };
      for (let k = 1; k <= 3; k++) {
        const T = 'Start.'; await openDoc([T], 'journal'); await refocus(T.length); await d.still();
        await d.type(' More words here.'); await sleep(300);
        const p0 = await pair('300ms');
        await sleep(2500);
        const p1 = await pair('2.8s');
        out(`OBS X${k} ${JSON.stringify([p0, p1])}`.slice(0, 1800));
      }
    });

    // ---- LONG -----------------------------------------------------------------------------------------------------------------------------------
    await run('L', async () => {
      const para = Array.from({ length: 100 }, (_, i) => 'word' + i).join(' ');
      const L = Array.from({ length: 100 }, () => para).join('\n\n');   // 10,000 words
      await openDoc([L]);
      await refocus(L.length);
      const before = await d.read();
      const t0 = Date.now(); await d.type(' End of it.'); const ms = Date.now() - t0;
      await judge('L1a', 'a 10,000-word Doc: type at the very end', { text: L + ' End of it.', a: L.length + 11, f: L.length + 11 }, before, { msFor11Keys: ms });
      const mid = Math.floor(L.length / 2); const midAt = L.indexOf(' ', mid);
      await refocus(midAt);
      const b2 = await d.read();
      const t1 = Date.now(); await d.type(' mid'); const ms2 = Date.now() - t1;
      const L2 = L + ' End of it.';
      await judge('L1b', 'the middle of the same Doc: type there, the caret drawn, the view stays', { text: L2.slice(0, midAt) + ' mid' + L2.slice(midAt), a: midAt + 4, f: midAt + 4 }, b2, { msFor4Keys: ms2 });
    });
  });

  const failed = results.filter((r) => r.fails.length);
  console.log(`\nWRITING AUDIT ${title} [${TAG}]: ${results.length} steps judged, ${failed.length} with a finding, ${uncovered.length} not covered`);
  for (const u of uncovered) console.log(`NOT COVERED ${u.id}: ${u.why}`);
  if (cfg.out) fs.writeFileSync(path.join(cfg.out, `s8-${TAG.replace(/\//g, '_')}.json`), JSON.stringify({ tag: TAG, results, uncovered }, null, 1));
  process.exit(failed.length ? 1 : 0);
}
