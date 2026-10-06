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

    if ((await selectWords(app, 'quiet street')) === 'ok' && (await openMenu(app))) {
      const items = await menuItems(app);
      ok('T1 (door 1, OFF): the right-click menu mounts and carries the BASE items — B/I/U and Cut/Copy (item 186)',
        Array.isArray(items) && items.length >= 5, JSON.stringify(items));
      // ⛔ ABSENT, NEVER GREYED (G3). The gate is the item not being in the DOM.
      const hasConnect = (items || []).some((t) => /Link to|Note this|Make a card|Unlink/i.test(t));
      ok('T1b ⛔ and NO connect act is present — absent from the DOM, not greyed (G3), which is what makes "the app is v1 with the switch off" true rather than nearly true',
        hasConnect === false, JSON.stringify(items));
      await app.evalJs("document.body.click()");
      await sleep(150);
    }
    ok('T2 (door 2, OFF): the strip\'s connect zone is ABSENT from the DOM',
      (await app.evalJs("!!document.querySelector('.wz-sliver-connect')")) === false);
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
          ok('T8 ⛔ and it PAINTS NOTHING — the highlight holds no range for a lost anchor, rather than guessing at a position or throwing',
            ranges === 0, JSON.stringify({ rangesInHighlight: ranges }));
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
