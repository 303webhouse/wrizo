// S1 — the element engine (the Screenplay Room). A committed CDP verification
// scenario (per AGENTS.md "Harness scenarios persist").
// Run: node apps/desktop/scripts/harness/s1.mjs   (from apps/desktop, with
// dist-web freshly built via `pnpm run build:web`).
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Synthetic keydown dispatch on document.activeElement — untrusted, so it
// never triggers the browser's OWN default key handling (native Tab-focus-
// shift, native Enter-newline, native arrow-caret-move). That's exactly what
// we want here: every key this scenario drives (Enter/Tab/Shift+Tab/Ctrl+N/
// Backspace/ArrowUp/ArrowDown/Escape) is FULLY handled by ScriptEditor's own
// onKeyDown (always preventDefault + a manual state update), so a synthetic
// dispatch exercises that handler in isolation without a native side-effect
// racing it. React's delegated listener receives synthetic dispatches
// normally (same technique React Testing Library's fireEvent uses).
const HELPERS = `
window.__key = function(key, opts) {
  opts = opts || {};
  const el = document.activeElement;
  const ev = new KeyboardEvent('keydown', {
    key, bubbles: true, cancelable: true,
    shiftKey: !!opts.shift, ctrlKey: !!opts.ctrl, metaKey: !!opts.meta,
  });
  el.dispatchEvent(ev);
  return true;
};
// Direct Selection/Range placement — mirrors ScriptEditor's OWN setCaretOffset
// exactly, since native ArrowLeft/Right/Home/End (which normally move the
// caret) don't fire on a synthetic dispatch either.
window.__setCaret = function(offset) {
  const el = document.querySelector('.script-el-active');
  const sel = window.getSelection();
  const textNode = el.firstChild;
  const range = document.createRange();
  if (!textNode) { range.setStart(el, 0); }
  else { range.setStart(textNode, Math.min(offset, textNode.textContent.length)); }
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
};
window.__setActiveText = function(text) {
  const el = document.querySelector('.script-el-active');
  el.textContent = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
};
window.__activeType = () => document.querySelector('.script-el-active')?.dataset.type ?? null;
window.__activeText = () => document.querySelector('.script-el-active')?.textContent ?? null;
window.__elCount = () => document.querySelectorAll('.script-el').length;
window.__acOptions = () => [...document.querySelectorAll('.script-autocomplete-opt')].map(o => o.textContent);
// A real paste-event dispatch: untrusted, so no native insertion is even
// attempted — the useful signal is whether OUR listener called
// preventDefault (readable on the event object post-dispatch).
window.__pasteText = function(text) {
  const el = document.querySelector('.script-el-active');
  el.focus();
  const dt = new DataTransfer();
  dt.setData('text/plain', text);
  const ev = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
  return ev.defaultPrevented;
};
`;

const ENTER_MAP = { scene: 'action', action: 'action', character: 'dialogue', paren: 'dialogue', dialogue: 'action', transition: 'scene', shot: 'action', general: 'action' };
const TAB_MAP = { scene: 'action', action: 'character', character: 'transition', paren: 'dialogue', dialogue: 'paren', transition: 'scene', shot: 'character', general: 'action' };
const TYPE_CYCLE = ['scene', 'action', 'character', 'paren', 'dialogue', 'transition', 'shot', 'general'];

await withHarness(async (app) => {
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk after clear' });
  await app.evalJs(HELPERS);

  // -- DoD 1: Screenplay-kind create lands the caret in the scene-heading
  // ghost, no title demanded. ------------------------------------------------
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'script editor lands' });
  const scriptId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  ok('DoD1: Screenplay-kind create lands directly on a script page', !!scriptId, scriptId);
  const activeType0 = await app.evalJs('__activeType()');
  ok('DoD1: the caret lands in the scene-heading element (type=scene)', activeType0 === 'scene', activeType0);
  const ghost0 = await app.evalJs("document.querySelector('.script-el-active').getAttribute('data-ghost')");
  ok('a ghost placeholder is present on the empty active element', !!ghost0, ghost0);

  await app.waitFor(
    `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); return l.some(x => x.id === ${JSON.stringify(scriptId)}); })()`,
    { label: 'script entry persisted', timeout: 4000 },
  );
  let entries = await app.localJSON('writer-studio-journal-entries');
  let scriptEntry = entries.find((e) => e.id === scriptId);
  ok('the entry is pageType script with a fresh v1 ScriptDoc from birth (no title demanded)',
    scriptEntry?.pageType === 'script' && scriptEntry?.script?.v === 1 && scriptEntry?.script?.scenes?.length === 1 && scriptEntry?.text === '',
    JSON.stringify({ pageType: scriptEntry?.pageType, v: scriptEntry?.script?.v, scenes: scriptEntry?.script?.scenes?.length, text: scriptEntry?.text }));

  // -- Uppercase-on-commit + seed a known location for the autocomplete chain
  // test below (typed lowercase, on purpose, to exercise the case transform). -
  await app.typeKeys('int. kitchen - day');
  await sleep(100);
  const rawSceneText = await app.evalJs('__activeText()');
  ok('the underlying text stays lowercase WHILE active (uppercase is CSS-only until commit)', rawSceneText === 'int. kitchen - day', rawSceneText);
  await app.evalJs("__key('Enter')");
  await sleep(80);
  ok('Enter (non-empty, caret at end) commits the current element and creates a new one', (await app.evalJs('__elCount()')) === 2, await app.evalJs('__elCount()'));
  ok('the new element is ENTER_MAP[scene] = action', (await app.evalJs('__activeType()')) === 'action');

  // -- DoD 2: the frozen Enter/Tab table, cell-by-cell (every row, both keys).
  // Runs on the current (empty) active element via Ctrl+N resets — Enter on
  // an empty element retypes IN PLACE (no new element: "no blank litter"). ---
  for (let i = 0; i < TYPE_CYCLE.length; i++) {
    const t = TYPE_CYCLE[i];
    const countBefore = await app.evalJs('__elCount()');

    await app.evalJs(`__key('${i + 1}', {ctrl:true})`);
    await sleep(30);
    ok(`Ctrl+${i + 1} sets the active element's type to ${t}`, (await app.evalJs('__activeType()')) === t);

    await app.evalJs("__key('Enter')");
    await sleep(30);
    const afterEnter = await app.evalJs('__activeType()');
    ok(`DoD2 ENTER_MAP[${t}] === ${ENTER_MAP[t]}`, afterEnter === ENTER_MAP[t], afterEnter);
    ok(`DoD2: empty-element Enter for ${t} created no new element (no blank litter)`, (await app.evalJs('__elCount()')) === countBefore);

    await app.evalJs(`__key('${i + 1}', {ctrl:true})`);
    await sleep(30);
    await app.evalJs("__key('Tab')");
    await sleep(30);
    const afterTab = await app.evalJs('__activeType()');
    ok(`DoD2 TAB_MAP[${t}] === ${TAB_MAP[t]}`, afterTab === TAB_MAP[t], afterTab);
    ok(`DoD2: Tab for ${t} created no new element`, (await app.evalJs('__elCount()')) === countBefore);
  }

  // Shift+Tab: a plain backward walk of the type list, independent of TAB_MAP.
  await app.evalJs("__key('3', {ctrl:true})"); // -> character
  await sleep(30);
  await app.evalJs("__key('Tab', {shift:true})");
  await sleep(30);
  ok('Shift+Tab cycles the type list backward (character -> action)', (await app.evalJs('__activeType()')) === 'action', await app.evalJs('__activeType()'));

  // -- split-at-caret: "hello world" split right after "hello" -> tail
  // trimmed into a new element. ------------------------------------------
  await app.evalJs("__key('2', {ctrl:true})"); // -> action, empty
  await sleep(30);
  await app.typeKeys('hello world');
  await sleep(100);
  await app.evalJs('__setCaret(5)');
  const countBeforeSplit = await app.evalJs('__elCount()');
  await app.evalJs("__key('Enter')");
  await sleep(80);
  ok('split-at-caret creates exactly one new element', (await app.evalJs('__elCount()')) === countBeforeSplit + 1);
  ok('split-at-caret: the tail (trimmed) becomes the new active element\'s text', (await app.evalJs('__activeText()')) === 'world', await app.evalJs('__activeText()'));

  // -- backspace-merge: caret at head of "world" merges into the head
  // element ("hello"), landing the caret exactly at the join. ----------------
  await app.evalJs('__setCaret(0)');
  const countBeforeMerge = await app.evalJs('__elCount()');
  await app.evalJs("__key('Backspace')");
  await sleep(80);
  ok('backspace-at-head merges into the element above (one fewer element)', (await app.evalJs('__elCount()')) === countBeforeMerge - 1);
  ok('backspace-merge concatenates with no separator', (await app.evalJs('__activeText()')) === 'helloworld', await app.evalJs('__activeText()'));
  const caretAfterMerge = await app.evalJs("(() => { const el = document.querySelector('.script-el-active'); const sel = window.getSelection(); const r = sel.getRangeAt(0); const pre = r.cloneRange(); pre.selectNodeContents(el); pre.setEnd(r.startContainer, r.startOffset); return pre.toString().length; })()");
  ok('the caret lands exactly at the merge boundary', caretAfterMerge === 5, caretAfterMerge);

  // -- ArrowUp / ArrowDown walk elements at their (text-content) edges. ------
  // The caret is still at the merge boundary (offset 5) — move it to the end
  // first, or this Enter would split "helloworld" again instead of cleanly
  // committing it.
  await app.evalJs('__setCaret(10)');
  await app.evalJs("__key('Enter')"); // commit "helloworld", fresh empty next (type=action, since head type was action)
  await sleep(60);
  await app.evalJs('__setCaret(0)');
  await app.evalJs("__key('ArrowUp')");
  await sleep(60);
  ok('ArrowUp at offset 0 walks to the previous element', (await app.evalJs('__activeText()')) === 'helloworld', await app.evalJs('__activeText()'));
  await app.evalJs("__key('ArrowDown')");
  await sleep(60);
  ok('ArrowDown at the end walks to the next element', (await app.evalJs('__activeText()')) === '', await app.evalJs('__activeText()'));

  // -- auto (CONT'D): character "bob" -> dialogue -> intervening action ->
  // character "bob" again commits as "BOB (CONT'D)". --------------------------
  await app.evalJs("__key('3', {ctrl:true})"); // -> character
  await sleep(30);
  await app.typeKeys('bob');
  await app.evalJs("__key('Escape')"); // dismiss any character-name autocomplete (none known yet, but harmless)
  await sleep(60);
  await app.evalJs("__key('Enter')"); // commit "bob" -> "BOB"; new el = ENTER_MAP[character] = dialogue
  await sleep(60);
  await app.typeKeys('Some dialogue.');
  await app.evalJs("__key('Enter')"); // commit dialogue; new el = ENTER_MAP[dialogue] = action
  await sleep(60);
  await app.typeKeys('Bob walks to the door.'); // intervening action
  await app.evalJs("__key('Enter')"); // commit action; new el = ENTER_MAP[action] = action
  await sleep(60);
  await app.evalJs("__key('3', {ctrl:true})"); // -> character
  await sleep(30);
  await app.typeKeys('bob');
  await app.evalJs("__key('Escape')"); // dismiss the (now-populated) character autocomplete without accepting
  await sleep(60);
  const preCommitContd = await app.evalJs('__activeText()');
  ok('no (CONT\'D) suffix before commit (still the raw typed text)', preCommitContd === 'bob', preCommitContd);
  await app.evalJs("__key('Enter')"); // COMMIT — this is where (CONT'D) + uppercase apply
  await sleep(60);

  // -- character two-letter completion + extension completion. ---------------
  // "BOB" is now a known character (just committed above).
  await app.evalJs("__key('3', {ctrl:true})"); // -> character, empty
  await sleep(30);
  await app.typeKeys('bo');
  await sleep(80);
  const nameOpts = await app.evalJs('__acOptions()');
  ok('two letters offers the known character BOB', nameOpts.includes('BOB'), JSON.stringify(nameOpts));
  await app.evalJs("__key('ArrowDown')"); // exercise arrow-navigation even with one option
  await sleep(30);
  await app.evalJs("__key('Enter')"); // accept
  await sleep(60);
  ok('accepting the character completion lands the full name', (await app.evalJs('__activeText()')) === 'BOB', await app.evalJs('__activeText()'));
  await app.typeKeys('(');
  await sleep(80);
  const extOptsAll = await app.evalJs('__acOptions()');
  ok('"(" on a character line offers the extension list', extOptsAll.length === 4 && extOptsAll.includes('V.O.'), JSON.stringify(extOptsAll));
  await app.typeKeys('v');
  await sleep(80);
  const extOptsV = await app.evalJs('__acOptions()');
  ok('narrowing to "v" leaves exactly V.O.', JSON.stringify(extOptsV) === JSON.stringify(['V.O.']), JSON.stringify(extOptsV));
  await app.evalJs("__key('Tab')"); // accept via Tab this time
  await sleep(60);
  ok('accepting the extension completion closes the parenthetical', (await app.evalJs('__activeText()')) === 'BOB(V.O.)', await app.evalJs('__activeText()'));
  await app.evalJs("__key('Enter')"); // commit
  await sleep(60);

  // -- the autocomplete chain: INT. -> location -> " - " -> DAY. -------------
  await app.evalJs("__key('1', {ctrl:true})"); // -> scene, empty
  await sleep(30);
  await app.typeKeys('int. kit');
  await sleep(80);
  const locOpts = await app.evalJs('__acOptions()');
  ok('a known location (KITCHEN, from the doc\'s first scene) is offered', JSON.stringify(locOpts) === JSON.stringify(['KITCHEN']), JSON.stringify(locOpts));
  await app.evalJs("__key('ArrowDown')");
  await sleep(30);
  await app.evalJs("__key('Enter')"); // accept location -> chains into " - "
  await sleep(80);
  ok('accepting a location appends " - " and lands mid-chain', (await app.evalJs('__activeText()')) === 'int. KITCHEN - ', await app.evalJs('__activeText()'));
  const todOptsAll = await app.evalJs('__acOptions()');
  ok('the TOD popover opens immediately, unprompted', todOptsAll.includes('DAY'), JSON.stringify(todOptsAll));
  await app.typeKeys('d');
  await sleep(80);
  const todOptsD = await app.evalJs('__acOptions()');
  ok('narrowing to "d" leaves exactly DAY', JSON.stringify(todOptsD) === JSON.stringify(['DAY']), JSON.stringify(todOptsD));
  await app.evalJs("__key('Enter')"); // accept DAY (still the SAME Enter-press family — consumed by the popover)
  await sleep(60);
  ok('the full chain lands "int. KITCHEN - DAY" (raw, pre-commit case)', (await app.evalJs('__activeText()')) === 'int. KITCHEN - DAY', await app.evalJs('__activeText()'));
  await app.evalJs("__key('Enter')"); // a SECOND Enter — no popover left open — commits the scene heading
  await sleep(60);

  // -- R1: the popover anchors to the ACTIVE element, not the sheet's tail.
  // Every check up to here always edited the document's LAST element — click
  // back to element 0 (many elements now follow it) to exercise the actual
  // regression Fable found: mid-document editing in a script longer than a
  // screen. -------------------------------------------------------------
  await app.evalJs("document.querySelectorAll('.script-el')[0].click()");
  await sleep(80);
  ok('R1 setup: clicking an earlier element activates it (not the tail)', (await app.evalJs('__activeType()')) === 'scene', await app.evalJs('__activeType()'));
  await app.evalJs("__setActiveText('int. kit')"); // reuses the known KITCHEN fixture — no type change, sidesteps A1 entirely
  await sleep(80);
  const r1Opts = await app.evalJs('__acOptions()');
  ok('R1 setup: the popover is genuinely open mid-document', r1Opts.includes('KITCHEN'), JSON.stringify(r1Opts));
  const r1Geometry = await app.evalJs(`
    (() => {
      const activeEl = document.querySelector('.script-el-active');
      const pop = document.querySelector('.script-autocomplete');
      const sheet = document.querySelector('.script-sheet');
      return {
        gap: pop.offsetTop - (activeEl.offsetTop + activeEl.offsetHeight),
        distFromSheetBottom: sheet.scrollHeight - pop.offsetTop,
      };
    })()
  `);
  ok('R1: the popover sits within one line-height of the ACTIVE element (not the sheet\'s bottom)', r1Geometry.gap >= 0 && r1Geometry.gap < 40, JSON.stringify(r1Geometry));
  ok('R1: many elements still follow it — the popover is nowhere near the sheet\'s bottom', r1Geometry.distFromSheetBottom > 100, JSON.stringify(r1Geometry));
  // Restore element 0 and return to the tail, so the rest of the scenario
  // (which assumes a fresh empty ACTIVE element) is undisturbed.
  await app.evalJs("__setActiveText('INT. KITCHEN - DAY')");
  await sleep(60);
  await app.evalJs("(() => { const all = document.querySelectorAll('.script-el'); all[all.length - 1].click(); return true; })()");
  await sleep(80);

  // -- VW: foreign paste blocked + whispered; own-shadow paste allowed;
  // copy-out emits the derived serialization untouched. -----------------------
  const foreignBlocked = await app.evalJs("__pasteText('FOREIGN VOICE TEXT')");
  ok('DoD7: a foreign paste on the script surface is blocked (preventDefault)', foreignBlocked === true, foreignBlocked);
  const whisperShown = await app.evalJs("!!document.querySelector('.vw-whisper')");
  ok('DoD7: the Voice Wall whisper shows after the blocked paste', whisperShown === true);

  await app.click('Copy script text');
  await sleep(80);
  const lastCopy = await app.evalJs('window.__wzLastCopy');
  ok('DoD7: "Copy script text" emits a non-empty derived serialization', typeof lastCopy === 'string' && lastCopy.includes('INT. KITCHEN - DAY') && lastCopy.includes("BOB (CONT'D)"), lastCopy);
  const ownAllowed = await app.evalJs('__pasteText(window.__wzLastCopy)');
  ok('DoD7: a paste matching the own-ink shadow is allowed (preventDefault NOT called)', ownAllowed === false, ownAllowed);

  // -- DoD 8: the pen points, never types, never inks. ------------------------
  const penGuard = await app.evalJs(`
    (() => {
      const el = document.querySelector('.script-el-active');
      return el.style.touchAction === 'none' && el.getAttribute('handwriting') === 'false';
    })()
  `);
  ok('DoD8: the active element carries the I0 pen-discipline guard (touch-action:none, handwriting=false)', penGuard === true);

  // -- settle the debounced autosave (2000ms component debounce + 300ms
  // persistence flush), then verify persisted shape. A blind sleep(2300) sits
  // right at that worst case with no buffer and proved flaky under load —
  // poll for the specific latest content instead (the J5 harness lesson). --
  await app.waitFor(
    `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); const e = l.find(x => x.id === ${JSON.stringify(scriptId)}); if (!e?.script?.scenes) return false; const flat = e.script.scenes.flatMap(s => [s.heading, ...s.body]).map(el => el.text); return flat.includes('BOB(V.O.)'); })()`,
    { label: 'script doc autosaved with latest content', timeout: 6000 },
  );
  entries = await app.localJSON('writer-studio-journal-entries');
  scriptEntry = entries.find((e) => e.id === scriptId);
  const flat = (scriptEntry.script.scenes || []).flatMap((s) => [s.heading, ...s.body]).map((e) => e.text);
  ok('DoD5/persisted: the committed scene heading is uppercased', flat.includes('INT. KITCHEN - DAY'), JSON.stringify(flat));
  ok('DoD4/persisted: the auto (CONT\'D) text is present and uppercased', flat.includes("BOB (CONT'D)"), JSON.stringify(flat));
  ok('DoD3/persisted: the extension-completed character line is present', flat.includes('BOB(V.O.)'), JSON.stringify(flat));
  ok('DoD5: entry.text carries the golden serialization (a non-empty derived shadow)', scriptEntry.text.length > 0 && scriptEntry.text.includes('INT. KITCHEN - DAY'), scriptEntry.text);
  ok('the ScriptDoc is versioned (v:1)', scriptEntry.script.v === 1);

  // -- DoD 6: the jsonb column survives a full reload. -------------------------
  const scenesBeforeReload = JSON.stringify(scriptEntry.script);
  await app.goto('/journal'); // navigate off first — the same unmount-flush-clobber hazard J5 documented
  await app.reload();
  // B1 S5 — '/journal' now bridges to the Journal Board (pages/Journal.tsx
  // deleted); '.board-canvas' is the settled-post-reload marker there now.
  await app.waitFor("!!document.querySelector('.wz-arrival') || !!document.querySelector('.board-canvas')", { label: 'app after reload', timeout: 8000 });
  await app.evalJs(HELPERS); // a hard reload wipes injected window functions — re-inject
  const entriesAfterReload = await app.localJSON('writer-studio-journal-entries');
  const scriptAfterReload = entriesAfterReload.find((e) => e.id === scriptId);
  ok('DoD6: the ScriptDoc round-trips byte-identical across a full reload', JSON.stringify(scriptAfterReload.script) === scenesBeforeReload);

  // -- DoD 5 (resume mirror) — PARKED by HB1 (see the PARKED section below,
  // A4 discipline): the Desk room this originally read (ReturnCard, an
  // unprompted passive glance) is retired. Arrival (route '/') deliberately
  // shows only the mark, the boot bar, and the two doors — no passive
  // mirror content — per the brief's own flow (docs/wrizo-alpha/
  // hb1-threshold-brief.md). The underlying resume-target resolution this
  // check exercised is still correct and still reachable (now behind
  // Arrival's Open door, F2 — see scripts/harness/hb1.mjs's own "Open,
  // authed with a resume target" check), so this is DORMANT, not
  // SUPERSEDED: no successor proves the SAME unprompted-glance truth,
  // because HB1 ruled that UX away. Whether an unprompted mirror belongs on
  // Arrival is a genuine open call, not resolved here — flagged for Fable/
  // Nick, not silently reinstated or silently dropped.

  // -- birth paths: the picker leaf + the dedicated button on an EXISTING
  // (non-screenplay) binder; a non-screenplay kind still births manuscript. --
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'book lands on Free write' });
  const bookPageId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.waitFor(
    `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); return l.some(x => x.id === ${JSON.stringify(bookPageId)}); })()`,
    { label: 'book entry persisted', timeout: 4000 },
  );
  entries = await app.localJSON('writer-studio-journal-entries');
  const bookEntry = entries.find((e) => e.id === bookPageId);
  ok('birth paths: a non-screenplay kind still births a manuscript page (old birth path untouched)', bookEntry?.pageType === 'manuscript', bookEntry?.pageType);
  const bookProjectId = bookEntry.projectId;

  await app.goto(`/project/${bookProjectId}`);
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.includes('Add support page'))", { label: 'ProjectHome (book)' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('Add support page')).click()");
  await app.waitFor("[...document.querySelectorAll('button')].some(b => b.textContent.trim() === 'Script')", { label: 'Script leaf in the generic picker' });
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Script').click()");
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'a script page from the generic picker leaf' });
  ok('birth paths: any binder can hold a script page via the generic picker leaf', true);
  // Navigating away triggers ScriptEditor's own unmount-flush (visibilitychange
  // + cleanup effect), so the fresh script page is saved before we check for it.
  await app.goto(`/project/${bookProjectId}`);
  await app.waitFor("!!document.querySelector('.eyebrow')", { label: 'ProjectHome after adding a script page' });
  const scriptsSectionShown = await app.evalJs("[...document.querySelectorAll('.eyebrow')].some(e => e.textContent.trim() === 'Scripts')");
  ok('birth paths: the binder now shows its own "Scripts" section, atop Manuscript', scriptsSectionShown === true);
  const newScriptBtnShown = await app.evalJs("[...document.querySelectorAll('button')].some(b => b.textContent.includes('New script page'))");
  ok('birth paths: the dedicated "+ New script page" button is present once a script page exists', newScriptBtnShown === true);

  // -- A4: an exact-match golden-string assertion on a small, ISOLATED doc.
  // Containment testing (used everywhere above) can't catch whitespace drift
  // in the shadow — and this string is S3's future Fountain parser input. --
  await app.evalJs("[...document.querySelectorAll('button')].find(b => b.textContent.includes('New script page')).click()");
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'a second, clean script page' });
  const goldenId = (await app.evalJs('location.hash')).replace(/^#\/page\//, '');
  await app.typeKeys('int. office');
  await app.evalJs("__key('Enter')");
  await sleep(60);
  await app.typeKeys('She sits.');
  await app.waitFor(
    `(() => { const l = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]'); const e = l.find(x => x.id === ${JSON.stringify(goldenId)}); return e?.text === ${JSON.stringify('INT. OFFICE\n\nShe sits.')}; })()`,
    { label: 'golden doc autosaved', timeout: 6000 },
  );
  const goldenEntries = await app.localJSON('writer-studio-journal-entries');
  const goldenEntry = goldenEntries.find((e) => e.id === goldenId);
  ok('A4: the golden serialization is an EXACT match, not just a substring', goldenEntry.text === 'INT. OFFICE\n\nShe sits.', JSON.stringify(goldenEntry.text));
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// HB1 (docs/wrizo-alpha/hb1-threshold-brief.md) retires the Desk room this
// file's own DoD5 check read from. First real tenant of the A4 park law in
// this file (S1 predates most of the arc's parking history). DORMANT, not
// SUPERSEDED — see the in-line note left at the check's original call site
// (search this file for "PARKED by HB1"): no successor proves the SAME
// unprompted-glance truth, because Arrival deliberately doesn't offer one.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  await withHarness(async (app) => {
    await app.reload();
    await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
    await app.reload();
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival after clear (PARKED)' });
    await app.evalJs(HELPERS);
    await app.goto('/project/new');
    await app.waitFor("!!document.querySelector('[data-kind=\"screenplay\"]')", { label: 'CreateProject picker (PARKED)' });
    await app.evalJs("document.querySelector('[data-kind=\"screenplay\"]').click()");
    await app.click('Start writing');
    await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'script editor lands (PARKED)' });
    await app.typeKeys('int. kitchen - day');
    await app.evalJs("__key('Enter')");
    await sleep(3200); // past PageEditor/ScriptEditor's autosave debounce

    // ORIGINAL (DoD5): ok('DoD5: the Desk\'s mirror surfaces the SCRIPT tag
    // unprompted', mirrorText.includes('SCRIPT'), mirrorText.slice(0,400));
    // — read document.body.innerText straight off '/' (the Desk room, its
    // ReturnCard rendering the resume pointer with no click required).
    // DORMANT: '/' is Arrival now (mark + boot bar + two doors only); no
    // unprompted mirror exists there to read. This re-assertion proves the
    // NARROWER truth that survives — the resume pointer itself still
    // resolves to this SCRIPT page — via the one path that still reaches
    // it (Open, F2), not via an unprompted glance.
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Arrival, resume check (PARKED)' });
    await app.click('Open');
    await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'Open resumes the script page (PARKED)', timeout: 4000 });
    pok('PARKED (was "DoD5: the Desk\'s mirror surfaces the SCRIPT tag unprompted") — DORMANT, no unprompted successor: the resume pointer still resolves to this SCRIPT page, now reachable via Open (F2) rather than an unprompted glance',
      true);
  });
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nS1 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed`
    : `\nS1 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const allChecksS1 = checks.concat(parkedChecks);
const pass = allChecksS1.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nS1 VERIFY: PASS (${allChecksS1.length} checks)` : `\nS1 VERIFY: FAIL — ${allChecksS1.filter((c) => !c.pass).length}/${allChecksS1.length} failed`);
process.exit(pass ? 0 : 1);
