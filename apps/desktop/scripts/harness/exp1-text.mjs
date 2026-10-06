// EXPERIMENT 1 — THE TEXT SIDE, ON THE BOX. Auto-discovered by run-suite.mjs.
// Run with an ABSOLUTE worktree path.
//
// ⚠ A WORKTREE ISOLATES FILES, NOT THE BOX. One machine, one browser pool. The turn
// comes by announcement, never inferred from quiet.
//
// WHY THIS FILE EXISTS. Experiment 1's text side — the right-click menu's connect
// acts, the strip's three acts, and the mark — was accepted on report with its box run
// deferred, and `exp1.mjs` turned out to be the RAIL's harness (every check §7.x,
// TOOLS' item 190). So the text side had no committed scenario at all. Fable's list,
// 2026-10-05, is what this covers, and each item below says which of his it is.
//
// ⛔ THE ONE THING THIS FILE IS REALLY FOR. Every claim here is about a SPAN surviving
// a trip through two coordinate systems. The page stores RAW text; anchors live in
// VISIBLE coordinates (markers and lead tokens stripped); and since item 211 the
// markers are still in the DOM but collapsed to zero width. Three off-by-N mistakes
// are available at every step, and all three fail the same way: the mark lands on the
// wrong words, or the act silently becomes a different act. Browserless proofs cover
// the arithmetic (exp1-b-proof.mjs). This covers the part only a browser can answer.
//
// ── FIDELITY BOUNDS, STATED RATHER THAN HIDDEN ───────────────────────────────────
// 1. THE RIGHT-CLICK IS SYNTHETIC. `runtime-verify.mjs` drives trusted presses with
//    `button: 'left'` only — there is no right-click in the driver — so the menu is
//    opened by dispatching a real `contextmenu` Event at a measured point. The product
//    listens for exactly that event (`PageEditor.tsx`'s `onContextMenu`), so the path
//    under test is the product's; what is NOT tested is the browser's own native menu
//    suppression. Named because a reader should know which half is covered.
// 2. THE SELECTION IS SET THROUGH A `Range`. `window.getSelection()` is the same
//    object the product reads either way, so this is the real selection state and not
//    a stand-in — but it is not a hand dragging across words, so it does not exercise
//    pointer-driven selection.
// 3. The SWITCH is flipped through the product's own Settings control, never by
//    writing `localStorage` — so "off" and "on" are the states a writer can reach.
//
// STANDING HARNESS LAWS, carried: drivers never assume existence; probes press with
// real CDP pointer events at a hit-tested point; seeds go through the seams, never raw
// collection writes; handles are selected BY NAME, never by index; waits exit on
// observable state, never on elapsed time.
import { withHarness } from '../runtime-verify.mjs';
import { hittablePoint, hittablePointBy } from '../trusted-point.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const settle = async (app, expr, ms = 5000, step = 100) => {
  const deadline = Date.now() + ms;
  let v = await app.evalJs(expr);
  while (v !== true && Date.now() < deadline) { await sleep(step); v = await app.evalJs(expr); }
  return v;
};

const must = async (app, sel, what) => {
  const there = await app.evalJs(`!!document.querySelector(${JSON.stringify(sel)})`);
  if (!there) ok(`DRIVER: ${what} — the target (${sel}) is present to act on`, false, 'absent');
  return there;
};

const pressEl = async (app, elExpr, what) => {
  const p = await hittablePointBy(app, elExpr);
  if (!p) { ok(`DRIVER: ${what} — the target is present to act on`, false, 'absent'); return false; }
  if (!p.found) { ok(`DRIVER: ${what} — a point inside it is reachable by a real pointer (not occluded)`, false, JSON.stringify(p)); return false; }
  await app.mouseDown(p.x, p.y);
  await app.mouseUp(p.x, p.y);
  await sleep(200);
  return true;
};

const EDITOR = '.forward-only-editor';

const freshDesk = async (app, width = 1400, height = 900) => {
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.emulateDpr(1, width, height);
};

/** A Draft page with real words, typed through the editor (never seeded as text). */
const freshDraftPage = async (app, text) => {
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor(`!!document.querySelector('${EDITOR}')`, { label: 'PageEditor mounted' });
  await sleep(300);
  await app.evalJs(`document.querySelector('${EDITOR}').focus()`);
  await app.type(text);
  // ⚠ WAIT ON THE STORED TEXT, NEVER ON A FLUSH CALL. `wrizoFlushNow()` moves the
  // persistence CACHE to storage; it cannot move the EDITOR's own state into the
  // cache. The editor's autosave is the second debounce, and only the stored text
  // proves it landed.
  const landed = await settle(app, `(() => { const r = localStorage.getItem('writer-studio-journal-entries');
    const a = r ? JSON.parse(r) : []; return a.some(e => (e.text || '').includes(${JSON.stringify(text.slice(0, 18))})); })()`, 12000);
  return landed === true;
};

/** The experiment switch, flipped through the product's own Settings control. */
const setSwitch = async (app, want) => {
  const already = await app.evalJs("(() => { try { return !!JSON.parse(localStorage.getItem('wrizo-experiments')||'{}').connectFromThePage; } catch { return false; } })()");
  if (already === want) return true;
  const sel = `.wz-cascade-action[aria-pressed="${already ? 'true' : 'false'}"]`;
  // BY ITS OWN STATE, not by index: there are several `.wz-cascade-action` buttons and
  // an index would press a different one the day the panel grows a row.
  const found = await app.evalJs(`[...document.querySelectorAll('.wz-cascade-action')].findIndex(b => (b.textContent||'').includes('Connect from the page'))`);
  if (found < 0) { ok('DRIVER: the Settings switch for "Connect from the page" is present to press', false, 'absent'); return false; }
  const pressed = await pressEl(app, `[...document.querySelectorAll('.wz-cascade-action')].find(b => (b.textContent||'').includes('Connect from the page'))`, 'the experiment switch');
  if (!pressed) return false;
  void sel;
  const now = await settle(app, `(() => { try { return !!JSON.parse(localStorage.getItem('wrizo-experiments')||'{}').connectFromThePage === ${want}; } catch { return false; } })()`);
  return now === true;
};

/**
 * The writing MODE, pressed on the mode strip by its named key.
 *
 * ⛔ WHY THIS EXISTS, AND WHY THE FIRST DRAFT OF THIS FILE WAS WRONG WITHOUT IT.
 * `canStyle = mode === 'drafting'` (PageEditor.tsx), so `onFormat` reaches the menu
 * ONLY in Draft — B/I/U do not exist in Free Write at all. And a new page does not open
 * in Draft: the initial mode resolves to 'journal' for a manuscript or a loose page. So
 * a check that opened a fresh page and expected item 186's five base items would have
 * failed on the product being RIGHT. Read off the source before the first run rather
 * than discovered by it.
 */
const MODE_KEY = { freewrite: 'freewrite', draft: 'draft', revise: 'revise' };

const modeOf = (app) => app.evalJs(
  "(() => { const b = document.querySelector('.desk-mode-strip [aria-selected=\"true\"], .desk-mode-strip [data-active=\"true\"]'); return b ? (b.getAttribute('data-mode-key') || null) : null; })()");

const setMode = async (app, key) => {
  const sel = `.desk-mode-strip [data-mode-key="${MODE_KEY[key]}"]`;
  if (!(await must(app, sel, `the mode strip's ${key} tab`))) return false;
  if (!(await pressEl(app, `document.querySelector('${sel}')`, `the ${key} mode tab`))) return false;
  // ⚠ THE MODE SWITCH RE-PERSISTS LATE (~1.1s, standing note), so this waits on
  // observable state — the editor still mounted AND the text still stored — never on
  // elapsed time. A fixture that read the store straight after a switch would read a
  // stale empty page and report it as data loss.
  const settled = await settle(app, `(() => {
    const el = document.querySelector('${EDITOR}');
    if (!el) return false;
    const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
    const id = location.hash.split('/page/')[1];
    const e = a.find(x => x.id === id);
    return !!(e && (e.text || '').length > 0);
  })()`, 8000);
  return settled === true;
};

const openSettings = async (app) => {
  const there = await app.evalJs("!!document.querySelector('.wz-strip-item[data-category=settings]')");
  if (!there) { ok('DRIVER: the cascade strip carries a Settings category', false, 'absent'); return false; }
  return pressEl(app, "document.querySelector('.wz-strip-item[data-category=settings]')", 'the strip Settings category');
};

/** Select a substring of the editor's VISIBLE text, by searching the text nodes. */
const selectWords = (app, needle) => app.evalJs(`(() => {
  const el = document.querySelector('${EDITOR}');
  if (!el) return 'no editor';
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const i = n.data.indexOf(${JSON.stringify(needle)});
    if (i >= 0) {
      const r = document.createRange();
      r.setStart(n, i); r.setEnd(n, i + ${needle.length});
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      return 'ok';
    }
  }
  return 'needle not found in any text node';
})()`);

/** Open the writing menu at the selection's own rect (a real point, measured). */
const openMenu = async (app) => {
  const r = await app.evalJs(`(() => {
    const s = window.getSelection();
    if (!s || s.rangeCount === 0) return null;
    const b = s.getRangeAt(0).getBoundingClientRect();
    return { x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) };
  })()`);
  if (!r) { ok('DRIVER: the selection has a rect to open the menu at', false, 'null'); return false; }
  await app.evalJs(`(() => {
    const el = document.querySelector('${EDITOR}');
    el.dispatchEvent(new MouseEvent('contextmenu', { clientX: ${r.x}, clientY: ${r.y}, bubbles: true, cancelable: true }));
    return true;
  })()`);
  await sleep(250);
  return true;
};

const menuItems = (app) => app.evalJs(
  "[...document.querySelectorAll('.wz-writing-menu .dz-menu-item')].map(b => (b.textContent||'').trim())");

const pressMenuItem = async (app, label) => {
  // BY NAME. An index encodes the menu's current order into the probe, and the day an
  // item is added it presses a DIFFERENT act and goes green about something else.
  const there = await app.evalJs(`[...document.querySelectorAll('.wz-writing-menu .dz-menu-item')].some(b => (b.textContent||'').trim() === ${JSON.stringify(label)})`);
  if (!there) { ok(`DRIVER: the menu offers "${label}" to press`, false, JSON.stringify(await menuItems(app))); return false; }
  return pressEl(app, `[...document.querySelectorAll('.wz-writing-menu .dz-menu-item')].find(b => (b.textContent||'').trim() === ${JSON.stringify(label)})`, `the menu's "${label}"`);
};

const storedPage = (app) => app.evalJs(`(() => {
  const id = location.hash.split('/page/')[1];
  const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
  const e = a.find(x => x.id === id);
  return e ? { id: e.id, text: e.text, pageLinks: e.pageLinks ?? null } : null;
})()`);

// Pixel sampling, the same instrument exp1-paint.mjs uses: a mean over a rect, and a
// control word that must NOT move.
const sampleOf = async (app, b64, rect) => app.evalJs(`(async () => {
  const img = new Image(); img.src = 'data:image/png;base64,' + ${JSON.stringify(b64)};
  await img.decode();
  const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const R = ${JSON.stringify(rect)};
  const d = g.getImageData(R.left, R.top, Math.max(1, R.width), Math.max(1, R.height)).data;
  let r = 0, gg = 0, b = 0, n = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i+1]; b += d[i+2]; n++; }
  return { r: Math.round(r/n), g: Math.round(gg/n), b: Math.round(b/n) };
})()`);
const dist = (a, b) => (!a || !b) ? -1 : Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

const wordRect = (app, needle) => app.evalJs(`(() => {
  const el = document.querySelector('${EDITOR}');
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = w.nextNode())) {
    const i = n.data.indexOf(${JSON.stringify(needle)});
    if (i >= 0) {
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + ${needle.length});
      const b = r.getBoundingClientRect();
      return { left: Math.round(b.left), top: Math.round(b.top), width: Math.round(b.width), height: Math.round(b.height) };
    }
  }
  return null;
})()`);

const SENTENCE = 'The rain fell on the quiet street and nothing moved at all.';

await withHarness(async (app) => {
  // =========================================================================
  // T1 / T2 — BOTH DOORS, SWITCH OFF (Fable 3: "both doors both ways")
  // =========================================================================
  await freshDesk(app);
  if (!(await freshDraftPage(app, SENTENCE))) {
    ok('FIXTURE: a Draft page with real typed words, stored', false, 'the editor never stored the text');
  } else {
    ok('FIXTURE: a Draft page with real typed words, stored', true);

    const offFlag = await app.evalJs("(() => { try { return !!JSON.parse(localStorage.getItem('wrizo-experiments')||'{}').connectFromThePage; } catch { return false; } })()");
    ok('T0: the switch is OFF by default — Nick\'s own word, and the premise of every "off" check below',
      offFlag === false, String(offFlag));

    // =====================================================================
    // T1 — FREE WRITE, SWITCH OFF. The mode a new page actually opens in.
    // =====================================================================
    const startMode = await modeOf(app);
    ok('T1-pre: a new book page opens in FREE WRITE, not Draft — stated because every expectation below depends on it, and the first draft of this file got it wrong',
      startMode === 'freewrite' || startMode === null, JSON.stringify(startMode));

    if ((await selectWords(app, 'quiet street')) === 'ok' && (await openMenu(app))) {
      const items = await menuItems(app);
      // In Free Write `canStyle` is FALSE, so there is no B/I/U: Cut and Copy are the
      // whole menu. Asserted EXACTLY, not as "at least N" — a count with slack cannot
      // tell a missing item from a spare one.
      ok("T1 (door 1, OFF, Free Write): the menu carries Cut and Copy and NOTHING else — no B/I/U, because styling is Draft's",
        Array.isArray(items) && items.length === 2 && items.every(t => /Cut|Copy/i.test(t)), JSON.stringify(items));
      ok('T1b \u26d4 and NO connect act is present — absent from the DOM, not greyed (G3), which is what makes "v1 with the switch off" true rather than nearly true',
        !(items || []).some(t => /Link to|Note this|Make a card|Unlink/i.test(t)), JSON.stringify(items));
      await app.evalJs("document.body.click()");
      await sleep(150);
    }

    // =====================================================================
    // T1c — A BARE CARET WITH THE SWITCH OFF MUST NOT OPEN A MENU AT ALL.
    // =====================================================================
    // `writingMenuHasItems` is false for canStyle=false, connectOn=false, hasWords=false,
    // and the handler checks it BEFORE preventDefault — so the writer keeps the browser's
    // own menu wherever Wrizo has nothing to say. A menu that opened empty, or that
    // suppressed the native one to show nothing, is the defect.
    await app.evalJs("(() => { const el = document.querySelector('.forward-only-editor'); el.focus(); const s = window.getSelection(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(true); s.removeAllRanges(); s.addRange(r); return true; })()");
    await sleep(120);
    await openMenu(app);
    ok('T1c \u26d4 a BARE CARET in Free Write with the switch off opens NO menu — nothing to show, so the native menu is left alone',
      (await app.evalJs("!!document.querySelector('.wz-writing-menu')")) === false);

    ok("T2 (door 2, OFF): the strip's connect zone is ABSENT from the DOM",
      (await app.evalJs("!!document.querySelector('.wz-sliver-connect')")) === false);

    // =====================================================================
    // T2b — DRAFT, SWITCH STILL OFF: item 186's base menu in full.
    // =====================================================================
    const toDraft = await setMode(app, 'draft');
    ok('T2b-pre: switched to Draft through the mode strip, by its named key and never an index', toDraft === true, String(toDraft));
    if (toDraft && (await selectWords(app, 'quiet street')) === 'ok' && (await openMenu(app))) {
      const items = await menuItems(app);
      const has = (re) => (items || []).some(t => re.test(t));
      ok('T2b (item 186): in DRAFT the base menu is B/I/U + Cut/Copy — five items, with the switch still OFF',
        has(/Bold/i) && has(/Italic/i) && has(/Underline/i) && has(/Cut/i) && has(/Copy/i) && items.length === 5,
        JSON.stringify(items));
      ok('T2c: and still no connect act, so the base menu is not the experiment',
        !has(/Link to|Note this|Make a card/i), JSON.stringify(items));
      ok("T2d: NO Paste — ruled out of this menu by item 186's brief",
        !has(/Paste/i), JSON.stringify(items));
      await app.evalJs("document.body.click()");
      await sleep(150);
    }
  }

  // =========================================================================
  // T3 / T4 — BOTH DOORS, SWITCH ON
  // =========================================================================
  let on = false;
  if (await openSettings(app)) on = await setSwitch(app, true);
  ok('T3-pre: the switch was turned ON through the product\'s own Settings control (never by writing localStorage), so this is a state a writer can reach',
    on === true, String(on));

  if (on) {
    // back to the page
    await app.evalJs("document.body.click()");
    await sleep(200);
    if (await must(app, EDITOR, 'the editor, still mounted after the Settings trip')) {
      if ((await selectWords(app, 'quiet street')) === 'ok' && (await openMenu(app))) {
        const items = await menuItems(app);
        const hasLink = (items || []).some((t) => /Link to/i.test(t));
        const hasNote = (items || []).some((t) => /Note this/i.test(t));
        const hasCard = (items || []).some((t) => /Make a card/i.test(t));
        ok('T3 (door 1, ON): the menu now offers all three connect acts beside the base items',
          hasLink && hasNote && hasCard, JSON.stringify(items));

        // =================================================================
        // T5 ⛔ SPAN, NOT SPOT-NOTE (Fable 3) — the regression this exists for
        // =================================================================
        // A menu button lives OUTSIDE the contenteditable, so its mousedown blurs the
        // editor and COLLAPSES the selection. An act that re-reads the selection at
        // click time therefore sees a bare caret and writes a SPOT-NOTE — silently
        // turning every "Link to…" into a different act. The acts capture their
        // offsets when the menu OPENS for exactly this reason, and this is the check
        // that can tell the two apart.
        const before = await storedPage(app);
        if (await pressMenuItem(app, (items || []).find((t) => /Link to/i.test(t)))) {
          const landed = await settle(app, `(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
            const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
            return !!(e && e.pageLinks && (e.pageLinks.anchors || []).length > 0); })()`, 8000);
          const after = await storedPage(app);
          const anchors = after?.pageLinks?.anchors ?? [];
          const a0 = anchors[0];
          ok('T5-pre: the act wrote an anchor at all', landed === true && !!a0, JSON.stringify(after?.pageLinks));
          ok('T5 ⛔ and it is a SPAN over the selected words, not a spot-note at a collapsed caret — the exact regression a menu press causes when an act re-reads the selection instead of the offsets captured at open',
            !!a0 && typeof a0.from === 'number' && typeof a0.to === 'number' && a0.to > a0.from,
            JSON.stringify(a0));
          ok('T5b: and the span is the words the writer chose — "quiet street", 12 characters',
            !!a0 && (a0.to - a0.from) === 'quiet street'.length, JSON.stringify({ from: a0?.from, to: a0?.to, len: a0 ? a0.to - a0.from : null }));
          ok('T5c: the manuscript is BYTE-UNCHANGED by the act — no glyph, no sentinel (§6b)',
            !!before && !!after && before.text === after.text,
            JSON.stringify({ before: before?.text?.length, after: after?.text?.length }));
        }

        // =================================================================
        // T5d ⛔ "NOTE THIS" IS WHERE THE ACT CAN SILENTLY CHANGE, and it is a
        // DIFFERENT failure from T5's. Read off the acts: `onLink` returns early
        // when `to <= from`, so a collapsed selection makes Link do NOTHING —
        // loud, and T5 catches it. `onNote` instead FALLS BACK to `anchorSpot`
        // for a bare caret (EXP1-Q6's caret note), so the same collapse turns a
        // span note into a SPOT note — the same words, a different object, and
        // nothing anywhere says so. That is the one this file must pin.
        // =================================================================
        if ((await selectWords(app, 'nothing moved')) === 'ok' && (await openMenu(app))) {
          const items3 = await menuItems(app);
          const noteLabel = (items3 || []).find((t) => /Note this/i.test(t));
          const beforeN = await storedPage(app);
          const countBefore = (beforeN?.pageLinks?.anchors ?? []).length;
          if (noteLabel && await pressMenuItem(app, noteLabel)) {
            await settle(app, `(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
              const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
              return ((e && e.pageLinks && e.pageLinks.anchors) || []).length > ${countBefore}; })()`, 8000);
            const afterN = await storedPage(app);
            const anchorsN = afterN?.pageLinks?.anchors ?? [];
            const fresh = anchorsN[anchorsN.length - 1];
            ok('T5d-pre: "Note this" on a SELECTION wrote a new anchor',
              anchorsN.length > countBefore && !!fresh, JSON.stringify({ before: countBefore, after: anchorsN.length }));
            ok('T5d ⛔ and it is a SPAN over the selected words, NOT the spot-note anchorSpot would have made from a collapsed caret — the silent act-swap a menu press causes, pinned',
              !!fresh && fresh.to > fresh.from, JSON.stringify(fresh));
            ok('T5e: and the span is the 13 characters chosen, so it is this selection and not a stale one',
              !!fresh && (fresh.to - fresh.from) === 'nothing moved'.length,
              JSON.stringify({ from: fresh?.from, to: fresh?.to, len: fresh ? fresh.to - fresh.from : null }));
          }
          await app.evalJs("document.body.click()");
          await sleep(150);
        }
      }

      // =================================================================
      // T4 — door 2, ON
      // =================================================================
      await selectWords(app, 'nothing moved');
      await sleep(150);
      ok('T4 (door 2, ON): the strip\'s connect zone is present with its acts',
        (await app.evalJs("!!document.querySelector('.wz-sliver-connect')")) === true);
      const stripActs = await app.evalJs("[...document.querySelectorAll('.wz-sliver-connect .wz-sliver-item-btn')].map(b => (b.textContent||'').trim())");
      ok('T4b: and it offers the acts by name, the selection-based two included',
        Array.isArray(stripActs) && stripActs.length >= 1, JSON.stringify(stripActs));

      // =================================================================
      // T6 — CUT / COPY ACT ON THE CAPTURED WORDS (Fable 3)
      // =================================================================
      // Same hazard as T5 from the other side: Copy must copy what was selected when
      // the menu opened, not the empty selection the press leaves behind.
      if ((await selectWords(app, 'rain fell')) === 'ok' && (await openMenu(app))) {
        const items2 = await menuItems(app);
        const copyLabel = (items2 || []).find((t) => /^Copy$/i.test(t)) ?? (items2 || []).find((t) => /Copy/i.test(t));
        if (copyLabel && await pressMenuItem(app, copyLabel)) {
          const clip = await app.evalJs("navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText().then(t => t).catch(e => 'DENIED:' + e.name) : 'NO_API'");
          // Clipboard reads need permission in a headless context; a refusal is a
          // DRIVER limit, not a product failure, and is reported as itself.
          if (typeof clip === 'string' && (clip.startsWith('DENIED') || clip === 'NO_API')) {
            ok(`T6 (bound): the clipboard could not be READ in this context (${clip}) — Copy was pressed on a captured selection and did not throw, but what landed on the clipboard is not observable here`,
              true, clip);
          } else {
            ok('T6 ⛔ Copy put the CAPTURED words on the clipboard — not the empty selection the menu press leaves behind',
              clip === 'rain fell', JSON.stringify(clip));
          }
        }
        await app.evalJs("document.body.click()"); await sleep(150);
      }

      // =================================================================
      // T7 — THE TINT AFTER AN EDIT (Fable 3), in pixels with a control
      // =================================================================
      // A Range points at NODES. The editor re-decorates imperatively on every
      // keystroke, so a highlight registered once silently stops painting while
      // `CSS.highlights.has()` still answers true. The mark re-registers on every
      // render; this is the check that can tell painting from registration.
      {
        const hasMark = await settle(app, "(() => { try { return !!CSS.highlights && CSS.highlights.has('wz-linked'); } catch { return false; } })()", 4000);
        ok('T7-pre: the mark is registered for the anchor written in T5', hasMark === true, String(hasMark));

        const target = await wordRect(app, 'quiet street');
        const control = await wordRect(app, 'nothing moved');
        if (!target || !control) {
          ok('T7: both the marked words and a control word have rects to sample', false, JSON.stringify({ target, control }));
        } else {
          const painted = await sampleOf(app, await app.screenshot(), target);
          const ctlBefore = await sampleOf(app, await app.screenshot(), control);
          // An ordinary edit, far from the anchor: type at the end.
          await app.evalJs(`(() => { const el = document.querySelector('${EDITOR}'); el.focus();
            const s = window.getSelection(); const r = document.createRange();
            r.selectNodeContents(el); r.collapse(false); s.removeAllRanges(); s.addRange(r); return true; })()`);
          await app.type(' more');
          await settle(app, `(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
            const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
            return !!(e && (e.text||'').includes('at all. more')); })()`, 12000);
          await sleep(400);

          const after = await sampleOf(app, await app.screenshot(), await wordRect(app, 'quiet street') ?? target);
          const ctlAfter = await sampleOf(app, await app.screenshot(), await wordRect(app, 'nothing moved') ?? control);
          ok('T7 ⛔ the tint is STILL PAINTED after an ordinary edit — measured in pixels against the painted frame, which is the only way to tell a live range from a registered-but-detached one',
            dist(painted, after) <= 12, JSON.stringify({ painted, after, delta: dist(painted, after) }));
          ok('T7b (the control): an UNMARKED word on the same page did not change across the same two frames, so T7 is measuring the mark and not a repaint of the surface',
            dist(ctlBefore, ctlAfter) <= 12, JSON.stringify({ ctlBefore, ctlAfter, delta: dist(ctlBefore, ctlAfter) }));
        }
      }

      // =================================================================
      // T9 — NO RENDER LOOP (Fable 3)
      // =================================================================
      // The mark's effect has NO dependency array — it must re-register after every
      // render, because a range detaches. That is one `setState` away from an endless
      // loop, and the tick comparison carries a 1px tolerance to stop it. A loop would
      // show as the editor's subtree mutating without end.
      {
        const churn = await app.evalJs(`(async () => {
          const el = document.querySelector('${EDITOR}');
          if (!el) return null;
          let count = 0;
          const obs = new MutationObserver(ms => { count += ms.length; });
          obs.observe(el.parentElement || el, { childList: true, subtree: true, characterData: true, attributes: true });
          await new Promise(r => setTimeout(r, 1500));
          obs.disconnect();
          return count;
        })()`);
        ok('T9 ⛔ NO RENDER LOOP: with the mark painted and nothing touching the page, the editor\'s subtree settles — mutations over 1.5 idle seconds are few, not unbounded',
          typeof churn === 'number' && churn < 40, JSON.stringify({ mutations: churn }));
      }

      // =================================================================
      // T8 — A LOST ANCHOR PAINTS NOTHING (Fable 3)
      // =================================================================
      // §1b: an anchor whose words are gone must resolve to nothing — not to a guess,
      // and not to a crash. Deleting the anchored words is the way a writer causes it.
      {
        // The painted count BEFORE the deletion, so T8 can measure the DROP rather than
        // assert an absolute that the second anchor makes false.
        const rangesBefore = await app.evalJs("(() => { try { const h = CSS.highlights.get('wz-linked'); return h ? h.size : 0; } catch { return -1; } })()");
        ok('T8-pre0: more than one anchor is painted before the deletion, so the drop below is measured against a live neighbour',
          typeof rangesBefore === 'number' && rangesBefore >= 1, JSON.stringify({ rangesBefore }));
        const removed = await app.evalJs(`(() => {
          const el = document.querySelector('${EDITOR}');
          const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
          let n;
          while ((n = w.nextNode())) {
            const i = n.data.indexOf('quiet street');
            if (i >= 0) {
              const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 'quiet street'.length);
              const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
              el.focus();
              return true;
            }
          }
          return false;
        })()`);
        if (removed !== true) {
          ok('T8-pre: the anchored words are present to delete', false, String(removed));
        } else {
          await app.type('fog');   // replaces the selection — the anchor's words are gone
          await settle(app, `(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
            const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
            return !!(e && (e.text||'').includes('the fog and')); })()`, 12000);
          await sleep(500);
          const stored = await storedPage(app);
          ok('T8-pre: the anchor is still STORED after its words were deleted — a lost anchor is kept, not silently dropped (the writer may undo)',
            (stored?.pageLinks?.anchors ?? []).length > 0, JSON.stringify(stored?.pageLinks?.anchors));
          const ranges = await app.evalJs("(() => { try { const h = CSS.highlights.get('wz-linked'); return h ? h.size : 0; } catch { return -1; } })()");
          // ⚠ NOT "ZERO RANGES", AND THE DIFFERENCE IS THE WHOLE CHECK. By now the page
          // carries TWO anchors — T5's Link on "quiet street" and T5d's note on
          // "nothing moved" — and only the FIRST one's words were deleted. A zero
          // assertion would fail on the product behaving correctly, because the
          // surviving anchor must still paint. What a lost anchor owes is to contribute
          // NOTHING while its neighbour is untouched, so the measurement is the DROP.
          ok('T8 ⛔ the LOST anchor paints nothing while its surviving neighbour still does — the highlight lost exactly one range, rather than guessing at a position, painting the wrong words, or throwing',
            typeof ranges === 'number' && ranges === rangesBefore - 1,
            JSON.stringify({ rangesBefore, rangesAfter: ranges }));
          const alive = await app.evalJs(`!!document.querySelector('${EDITOR}')`);
          ok('T8b: and the editor is still mounted and the page intact — a lost anchor is not an error condition (PAGE IS PRIMARY)',
            alive === true);
        }
      }
    }
  }

  // =========================================================================
  // T10 — A PAGE ENDING IN A BLANK LINE: THE EOF GUARD (Fable 3)
  // =========================================================================
  // ⛔ THE DEFECT THIS EXISTS FOR, found browserlessly and fixed in the same breath:
  // item 211 appends a `.md-eof-guard` CHARACTER whenever the text ends with a newline.
  // The old `domSelectionToVisible` guarded with `editor.textContent !== rawText`, which
  // that character makes FALSE — so the function returned null and the menu captured NO
  // selection, silently, on any ordinary page ending in a blank line. Nothing in the
  // browserless proof can show the live selection working; this can.
  {
    await freshDesk(app);
    if (!(await freshDraftPage(app, 'A first line of prose here.\n\n'))) {
      ok('T10-pre: a page whose text ENDS IN A BLANK LINE, stored', false, 'the editor never stored it');
    } else {
      const storedEndsNl = await app.evalJs(`(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
        const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
        return !!e && /\\n$/.test(e.text || ''); })()`);
      ok('T10-pre ⛔ the stored text really does end with a newline, which is what mints the EOF guard — the premise, measured rather than assumed',
        storedEndsNl === true, String(storedEndsNl));
      const guard = await app.evalJs("!!document.querySelector('.md-eof-guard')");
      ok('T10-pre2: and the guard span is in the DOM, so this page is the hazardous shape',
        guard === true, String(guard));

      if ((await selectWords(app, 'first line')) === 'ok' && (await openMenu(app))) {
        const items = await menuItems(app);
        const link = (items || []).find((t) => /Link to/i.test(t));
        ok('T10-pre3: the menu offers Link to… on this page (the switch is still on)', !!link, JSON.stringify(items));
        if (link && await pressMenuItem(app, link)) {
          const landed = await settle(app, `(() => { const a = JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]');
            const id = location.hash.split('/page/')[1]; const e = a.find(x => x.id === id);
            return !!(e && e.pageLinks && (e.pageLinks.anchors || []).length > 0); })()`, 8000);
          const stored = await storedPage(app);
          const a0 = (stored?.pageLinks?.anchors ?? [])[0];
          ok('T10 ⛔ ON A PAGE ENDING IN A BLANK LINE the menu still captures a real SPAN — the eof-guard character no longer makes the selection read refuse. Before the rewire this wrote nothing at all, on an ordinary manuscript.',
            landed === true && !!a0 && a0.to > a0.from, JSON.stringify({ landed, anchor: a0 }));
          ok('T10b: and the span is the ten characters chosen, so the guard is not merely tolerated but correctly skipped',
            !!a0 && (a0.to - a0.from) === 'first line'.length, JSON.stringify({ from: a0?.from, to: a0?.to }));
        }
      }
    }
  }
});

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ============
// EMIT THE ARRAY, EVEN EMPTY. This file retires nothing: it is Experiment 1's first
// text-side scenario, so there is no earlier assertion of these behaviours anywhere to
// supersede. Printed anyway — an array that is never emitted reads the same to the
// counter as one that silently lost a record, and the park COUNT is the check.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
}

const allChecks = checks.concat(parkedChecks);
const pass = allChecks.every((c) => c.pass);
for (const c of allChecks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? '  ok  ' : '  FAIL'} ${c.name}${c.detail ? `  ${c.detail}` : ''}`);
}
// eslint-disable-next-line no-console
console.log(pass ? `\nEXP1TEXT VERIFY: PASS (${allChecks.length} checks)` : `\nEXP1TEXT VERIFY: FAIL — ${allChecks.filter((c) => !c.pass).length}/${allChecks.length} failed`);
process.exit(pass ? 0 : 1);
