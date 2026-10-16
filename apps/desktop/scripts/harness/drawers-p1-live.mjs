// PHASE 1 - THE SHARED SIDE-DRAWER SYSTEM, the BROWSER half (docs/plans/phase1-drawers.md §8). drawers-p1.mjs reads the code; this file drives the real thing, framed at
// 1280x800, in Arbor (plateau) and in Flux. It needs a box turn (withHarness refuses without WS_BOX_TURN).
//
//   L1  PAGE IS PRIMARY     the paper's rect is identical before / during / after every open, close and tab change, of either drawer or both; the editor node never changes
//   L2  MOTION, MEASURED    on open AND on close the slide and the fade are both strictly mid-way at one and the same sample ("together"); the tab never moves;
//                           under prefers-reduced-motion the layer never travels and the fade is short
//   L3  THE ARROW           only the glyph differs between open and closed (rect and position equal), and the two hands are mirrors
//   L4  CLOSED MEANS CLOSED every control inside a closed panel is inert, not focusable, not hit-testable
//   L5  CONTENT PER SURFACE Free Write (TEXT, INK), Draft, Revise, Screenplay, Board - the sections each shows, the Board tools arm named button by button
//   L6  BRASS AND OLIVE     the chosen tab is brass, the unchosen is not; an open drawer's tab is olive
//   L7  ONE DRAWER AT A TIME (Fable, Oct 12) at EVERY width: opening the right drawer closes the left and the reverse - 1100, 1280 and 1400
//   L8  SCROLLBAR           at 1366x768 with long content the panel shows the thin bar on its outer edge
//   L9  ARIA AND KEYBOARD   tablist / tab / aria-selected / aria-controls / roving tabindex, arrow keys move the selection AND the focus, the "?" note opens, reports and closes on Escape,
//                           the grips report their state, the two mode toggles are operable by keyboard
//
// Every driver PROBES BEFORE IT DRIVES: a missing node fails a check instead of aborting the file (the standing law for harness drivers).
// Run: WS_BOX_TURN=<token> node scripts/harness/drawers-p1-live.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: THE DRIVER THREW (not a product finding)`, false, String(e).slice(0, 240)); } };

const W = 1280, H = 800;
const THEMES = [
  { id: 'arbor', theme: 'plateau', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
  { id: 'flux', theme: 'flux', prefs: { voice: 'serif', page: 'dark', fade: 'on' } },
].filter((t) => !process.env.LIVE_ONLY || process.env.LIVE_ONLY === t.id);
const TEXT = 'The first thing she noticed was the quiet.\nThen the light on the floor, long and thin.\nShe set the cup down and listened.';
const LONG = Array.from({ length: 40 }, (_, i) => `Line ${i + 1} of a long page that holds a good deal of work already.`).join('\n');
const SCRIPT_ROW = (id) => `{ id: ${JSON.stringify(id)}, text: '', pageType: 'script', script: { v: 1, scenes: [{ id: 'h-${id}', heading: { id: 'h-${id}', t: 'scene', text: '' }, body: [] }] }, createdAt: new Date().toISOString(), source: null, origin: null }`;

const SURFACES = {
  draft: { id: 'live-draft', row: `{ id: 'live-draft', text: ${JSON.stringify(TEXT)}, createdAt: new Date().toISOString(), source: null, origin: null }`, ready: ".forward-only-editor" },
  free: { id: 'live-free', row: `{ id: 'live-free', text: '', createdAt: new Date().toISOString(), source: null, origin: 'loose' }`, ready: ".forward-only-editor" },
  long: { id: 'live-long', row: `{ id: 'live-long', text: ${JSON.stringify(LONG)}, createdAt: new Date().toISOString(), source: null, origin: null }`, ready: ".forward-only-editor" },
  script: { id: 'live-script', row: SCRIPT_ROW('live-script'), ready: '.script-el' },
  board: { id: 'live-board', row: `{ id: 'live-board', text: 'Board', pageType: 'board', createdAt: new Date().toISOString(), origin: null, boxes: [{ id: 'live-card', kind: 'text', x: 0.05, y: 0.05, w: 0.3, h: 0.1, z: 1, text: 'Card words here' }] }`, ready: '.desk-frame' },
};

const open = async (app, th, kind, w = W, h = H) => {
  const s = SURFACES[kind];
  await app.emulateDpr(1, w, h);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1');
    localStorage.setItem('wrizo-theme-prefs', ${JSON.stringify(JSON.stringify(th.prefs))}); localStorage.setItem('wrizo-theme', ${JSON.stringify(th.theme)});
    localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.evalJs(`window.wrizoCreateJournalPage(${s.row})`);
  await sleep(450);
  await app.evalJs(`location.hash = '#/page/${s.id}'`);
  const there = await waitSoft(app, `!!document.querySelector('${s.ready}')`, { label: `${kind} surface`, timeout: 9000 });
  await sleep(800);
  return there;
};
const modeTab = async (app, key) => { await app.evalJs(`document.querySelector('.desk-mode-tab[data-mode-key="${key}"]')?.click()`); await sleep(900); };

const leftOpen = (app) => app.evalJs(`document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'`);
const rightOpen = (app) => app.evalJs(`document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'`);
const settled = (app, panel) => waitSoft(app, `(() => { const l = document.querySelector('${panel} > .wz-drawer-slide'); if (!l) return false; const cs = getComputedStyle(l); return cs.transform === 'none' && cs.pointerEvents !== 'none'; })()`, { timeout: 3000, label: 'settled' });
const toggleLeft = async (app) => { await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(30); };
const toggleRight = async (app) => { await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(30); };
const ensureLeft = async (app, want) => { if ((await leftOpen(app)) !== want) await toggleLeft(app); await waitSoft(app, `document.querySelector('.wz-sliver')?.getAttribute('data-open') === '${want}'`, { timeout: 2500 }); if (want) await settled(app, '.wz-sliver-panel'); await sleep(want ? 300 : 500); };
const ensureRight = async (app, want) => { if ((await rightOpen(app)) !== want) await toggleRight(app); await waitSoft(app, `document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === '${want}'`, { timeout: 2500 }); if (want) await settled(app, '.wz-tutor-panel'); await sleep(want ? 300 : 500); };
const rectOf = (app, sel) => app.evalJs(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100); })()`);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// app.key() is rawKeyDown + keyUp: no char event, hence no keypress, hence a plain <button> is never activated by it (Enter on ANY button "does nothing"). A real keyboard sends
// a keyDown that carries the character; this does the same, so the press the writer makes is the press that is tested.
const trustedKey = async (app, key, code, vk, text) => {
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, text });
  await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
};
const pressEnter = (app) => trustedKey(app, 'Enter', 'Enter', 13, '\r');
const pressSpace = (app) => trustedKey(app, ' ', 'Space', 32, ' ');
const varColour = (app, name) => app.evalJs(`(() => { const d = document.createElement('div'); d.style.color = 'var(${name})'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; })()`);

await withHarness(async (app) => {
  for (const th of THEMES) {
    const T = `[${th.id}]`;

    // ===== L1 - PAGE IS PRIMARY ============================================================================================================================
    for (const kind of ['draft', 'free']) {
      await guard(`L1 ${T} ${kind}`, async () => {
        const there = await open(app, th, kind);
        ok(`L1 ${T} fixture: the ${kind} surface opened`, there, '');
        if (!there) return;
        // (the first cut returned the assignment's value - the editor NODE - to the runner: "Object reference chain is too long". It is the TEST that carried a node out; the app is fine.)
        await app.evalJs("(() => { window.__ed = document.querySelector('.forward-only-editor'); return !!window.__ed; })()");
        const R0 = await rectOf(app, '.mode-page');
        const steps = [
          ['open the left drawer', () => toggleLeft(app)],
          ['open the right drawer (the left yields)', () => toggleRight(app)],
          ['right: Grafts/Links tab', () => app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()")],
          ['right: back to Tutor', () => app.evalJs("document.querySelector('#wz-tutor-tab-tutor')?.click()")],
          ...(kind === 'free' ? [['left: INK tab', () => app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.click()")], ['left: TEXT tab', () => app.evalJs("document.querySelector('#wz-sliver-tab-text')?.click()")]] : []),
          ['close the right drawer', () => toggleRight(app)],
          ['open the left drawer again', () => toggleLeft(app)],
          ['close the left drawer', () => toggleLeft(app)],
        ];
        const bad = [];
        for (const [label, act] of steps) {
          await act();
          const during0 = await rectOf(app, '.mode-page');
          await sleep(60);
          const during1 = await rectOf(app, '.mode-page');
          await sleep(500);
          const after = await rectOf(app, '.mode-page');
          if (!same(R0, during0) || !same(R0, during1) || !same(R0, after)) bad.push({ label, R0, during0, during1, after });
        }
        ok(`L1 ${T} (${kind}): the paper's rect is IDENTICAL before, during and after every open, close and tab change of either drawer, and of the hand-over from one to the other`, bad.length === 0, JSON.stringify(bad).slice(0, 400));
        const sameNode = await app.evalJs("window.__ed === document.querySelector('.forward-only-editor') && !!window.__ed");
        ok(`L1 ${T} (${kind}): and the editor node is the SAME node throughout (never unmounted)`, sameNode === true, String(sameNode));
      });
    }

    // ===== L2 / L3 - MOTION, MEASURED; THE ARROW ============================================================================================================
    await guard(`L2 ${T}`, async () => {
      if (!(await open(app, th, 'draft'))) { ok(`L2 ${T} fixture: draft opened`, false); return; }
      const sampler = (grip, panel, layer) => `(async () => {
        const g = document.querySelector('${grip}'), p = document.querySelector('${panel}'), l = document.querySelector('${layer}');
        if (!g || !p || !l) return { missing: true };
        const t0 = performance.now(); const out = [];
        const read = () => { const m = new DOMMatrixReadOnly(getComputedStyle(l).transform); const r = g.getBoundingClientRect(); const pr = p.getBoundingClientRect();
          return { t: Math.round(performance.now() - t0), tx: Math.round(m.m41 * 10) / 10, op: Math.round(parseFloat(getComputedStyle(p).opacity) * 1000) / 1000, grip: [r.left, r.top, r.width, r.height].map(n => Math.round(n * 100) / 100), panelLeft: Math.round(pr.left * 100) / 100, glyph: (g.textContent || '').trim() }; };
        out.push(read()); g.click();
        await new Promise((res) => { const tick = () => { out.push(read()); if (performance.now() - t0 < 520) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
        return { samples: out }; })()`;
      const together = (samples, from, to) => {
        const lo = Math.min(from, to), hi = Math.max(from, to);
        return samples.some((s) => s.tx > lo + 1 && s.tx < hi - 1 && s.op > 0.03 && s.op < 0.97);
      };
      for (const [hand, grip, panel, layer] of [['left', '.wz-sliver-grip', '.wz-sliver-panel', '.wz-sliver-panel > .wz-drawer-slide'], ['right', '.wz-tutor-grip', '.wz-tutor-panel', '.wz-tutor-panel > .wz-drawer-slide']]) {
        const o = await app.evalJs(sampler(grip, panel, layer));
        if (o.missing) { ok(`L2 ${T} (${hand}): the drawer's parts exist`, false, JSON.stringify(o)); continue; }
        const s = o.samples; const startTx = s[0].tx; const endTx = s[s.length - 1].tx;
        ok(`L2 ${T} (${hand}, OPEN): the slide and the fade are both strictly mid-way at the SAME sample (they run together), and it ends at rest (transform none, opacity 1)`,
          together(s, startTx, endTx) && endTx === 0 && s[s.length - 1].op === 1, JSON.stringify({ startTx, endTx, mid: s.filter((x) => x.op > 0 && x.op < 1).slice(0, 4) }));
        // SUPERSEDED for the RIGHT hand only (item tutor-drawer-v2, Fable
        // Oct 16: "Tutor grip moves 32px left on open - that's your arrow
        // fix, intended"). LEFT (Sliver) keeps the ORIGINAL claim verbatim
        // - its own panel is a static 16px inset of its anchor, so its
        // grip genuinely never moves. RIGHT (Tutor) now has its own
        // successor: the grip SETTLES exactly GRIP_GUTTER_PX (16) outside
        // the open panel's own left edge, Tutor.tsx's own measured value,
        // not a guessed one.
        if (hand === 'left') {
          ok(`L2 ${T} (${hand}): the tab's rect never changes while the drawer opens (only its glyph)`, s.every((x) => same(x.grip, s[0].grip)), JSON.stringify(s.map((x) => x.grip).filter((g, i, a) => i === 0 || !same(g, a[0])).slice(0, 3)));
        } else {
          // ok(`L2 ${T} (${hand}): the tab's rect never changes while the drawer opens (only its glyph)`, s.every((x) => same(x.grip, s[0].grip)), JSON.stringify(s.map((x) => x.grip).filter((g, i, a) => i === 0 || !same(g, a[0])).slice(0, 3)));
          const GRIP_GUTTER_PX = 16; // Tutor.tsx's own GRIP_GUTTER_PX
          const last = s[s.length - 1];
          const gripRight = last.grip[0] + last.grip[2];
          const gap = Math.round((last.panelLeft - gripRight) * 100) / 100;
          ok(`L2 ${T} (${hand}) [tutor-drawer-arrow successor]: the tab's rect MOVES while the drawer opens, settling ${GRIP_GUTTER_PX}px outside the open panel's own left edge (never inside its tab row)`,
            Math.abs(gap - GRIP_GUTTER_PX) < 1.5, JSON.stringify({ gripRight, panelLeft: last.panelLeft, gap }));
        }
        const glyphs = [...new Set(s.map((x) => x.glyph))];
        ok(`L3 ${T} (${hand}): the arrow glyph flips and nothing else on the tab does`, glyphs.length === 2, JSON.stringify(glyphs));
        await sleep(300);
        const c = await app.evalJs(sampler(grip, panel, layer));
        const cs = c.samples; const cEnd = cs[cs.length - 1];
        ok(`L2 ${T} (${hand}, CLOSE): slide and fade are both mid-way at the same sample on the way out too, and it ends hidden`,
          together(cs, cs[0].tx, cEnd.tx) && cEnd.op === 0 && cEnd.tx !== 0, JSON.stringify({ first: cs[0], last: cEnd }));
        await sleep(300);
      }
      const mirrored = await app.evalJs(`(() => { const l = document.querySelector('.wz-sliver-grip'), r = document.querySelector('.wz-tutor-grip'); return { left: (l.textContent || '').trim(), right: (r.textContent || '').trim() }; })()`);
      ok(`L3 ${T}: the two hands are mirrors - closed left shows ‹ and closed right shows ›`, mirrored.left === '‹' && mirrored.right === '›', JSON.stringify(mirrored));

      // reduced motion: fade only, short; the layer never travels
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
      await sleep(200);
      const rr = await app.evalJs(sampler('.wz-sliver-grip', '.wz-sliver-panel', '.wz-sliver-panel > .wz-drawer-slide'));
      await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
      if (rr.missing) { ok(`L2 ${T} (reduced): the drawer's parts exist`, false); return; }
      const rs = rr.samples; const fadeSamples = rs.filter((x) => x.op > 0.03 && x.op < 0.97);
      const reachedFull = rs.find((x) => x.op === 1);
      ok(`L2 ${T} (REDUCED MOTION): the layer never travels (transform none at every sample) and the fade still happens, over a short time (full by <= ~250 ms with frame slack)`,
        rs.every((x) => x.tx === 0) && !!reachedFull && reachedFull.t <= 250, JSON.stringify({ fadeSamples: fadeSamples.length, reachedFullAt: reachedFull && reachedFull.t, travelled: rs.filter((x) => x.tx !== 0).length }));
      await sleep(300);
    });

    // ===== L4 - CLOSED MEANS CLOSED ========================================================================================================================
    await guard(`L4 ${T}`, async () => {
      if (!(await open(app, th, 'draft'))) { ok(`L4 ${T} fixture: draft opened`, false); return; }
      for (const [hand, panel] of [['left', '.wz-sliver-panel'], ['right', '.wz-tutor-panel']]) {
        const r = await app.evalJs(`(() => {
          const p = document.querySelector('${panel}'); if (!p) return { missing: true };
          const ctl = [...p.querySelectorAll('button, input, select, textarea, a[href], [tabindex]')];
          let focusable = 0, hittable = 0;
          for (const c of ctl) {
            c.focus(); if (document.activeElement === c) focusable += 1;
            const b = c.getBoundingClientRect(); if (b.width && b.height) { const h = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); if (h && (h === c || c.contains(h) || p.contains(h))) hittable += 1; }
          }
          if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
          const cs = getComputedStyle(p);
          return { controls: ctl.length, focusable, hittable, inert: p.hasAttribute('inert'), ariaHidden: p.getAttribute('aria-hidden'), visibility: cs.visibility, opacity: cs.opacity };
        })()`);
        ok(`L4 ${T} (${hand}): CLOSED MEANS CLOSED - inert, aria-hidden, visibility hidden, opacity 0, and of ${r.controls} controls inside none can take focus and none is hit-testable`,
          !r.missing && r.controls > 0 && r.focusable === 0 && r.hittable === 0 && r.inert === true && r.ariaHidden === 'true' && r.visibility === 'hidden' && r.opacity === '0', JSON.stringify(r));
      }
    });

    // ===== L5 - CONTENT PER SURFACE =========================================================================================================================
    const sections = (app2) => app2.evalJs(`(() => ({
      heads: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-h')].map(h => h.textContent.trim()),
      typeface: document.querySelectorAll('.wz-sliver-type').length, format: document.querySelectorAll('.wz-sliver-fieldset').length,
      actions: document.querySelectorAll('.wz-sliver-actions').length, templates: document.querySelectorAll('.wz-sliver-templates').length,
      pageKind: document.querySelectorAll('.wz-sliver-page-kind').length, ink: document.querySelectorAll('.wz-ink-tips, .wz-ink-nibs').length,
      tabs: [...document.querySelectorAll('.wz-sliver-panel [role="tab"]')].map(t => t.id.replace('wz-sliver-tab-', '')),
      disabledOrGrey: document.querySelectorAll('.wz-sliver-body [aria-disabled="true"]:not(.wz-template-btn)').length }))()`);
    await guard(`L5 free ${T}`, async () => {
      if (!(await open(app, th, 'free'))) { ok(`L5 ${T} fixture: free write opened`, false); return; }
      await ensureLeft(app, true);
      const text = await sections(app);
      ok(`L5 ${T} Free Write, TEXT: tabs TEXT|INK; Typeface only - no Format, no Actions, no Templates, no page-kind, no ink zone`, same(text.tabs, ['text', 'ink']) && text.typeface === 1 && !text.format && !text.actions && !text.templates && !text.pageKind && !text.ink, JSON.stringify(text));
      await app.evalJs("document.querySelector('#wz-sliver-tab-ink')?.click()"); await sleep(500);
      const ink = await sections(app);
      ok(`L5 ${T} Free Write, INK: the ink zone is there and the Typeface is not`, ink.ink > 0 && ink.typeface === 0 && !ink.format && !ink.actions && !ink.templates, JSON.stringify(ink));
    });
    await guard(`L5 draft ${T}`, async () => {
      if (!(await open(app, th, 'draft'))) { ok(`L5 ${T} fixture: draft opened`, false); return; }
      await ensureLeft(app, true);
      const d = await sections(app);
      ok(`L5 ${T} Draft: Typeface, Format, Actions, Templates, page-kind - in that order, no tab row`, d.typeface === 1 && d.format === 1 && d.actions === 1 && d.templates === 1 && d.pageKind === 1 && d.tabs.length === 0, JSON.stringify(d));
      const order = await app.evalJs(`[...document.querySelectorAll('.wz-sliver-body > .wz-sliver-section')].map(s => [...s.classList].find(c => /^wz-sliver-(type|actions|templates|page-kind)$/.test(c)) || (s.querySelector('.wz-sliver-fieldset') ? 'format' : 'other'))`);
      ok(`L5 ${T} Draft: the sections run Typeface, Format, Actions, Templates, Page kind`, same(order.filter((x) => x !== 'other'), ['wz-sliver-type', 'format', 'wz-sliver-actions', 'wz-sliver-templates', 'wz-sliver-page-kind']), JSON.stringify(order));
      await modeTab(app, 'revise');
      await ensureLeft(app, true);
      const r = await sections(app);
      ok(`L5 ${T} Revise: the Typeface and nothing else`, r.typeface === 1 && !r.format && !r.actions && !r.templates && !r.pageKind && !r.ink, JSON.stringify(r));
    });
    await guard(`L5 script ${T}`, async () => {
      if (!(await open(app, th, 'script'))) { ok(`L5 ${T} fixture: screenplay opened`, false); return; }
      await ensureLeft(app, true);
      const s = await sections(app);
      ok(`L5 ${T} Screenplay: Templates only`, s.templates === 1 && !s.typeface && !s.format && !s.actions && !s.pageKind && !s.ink, JSON.stringify(s));
    });
    await guard(`L5 board ${T}`, async () => {
      if (!(await open(app, th, 'board'))) { ok(`L5 ${T} fixture: board opened`, false); return; }
      await ensureLeft(app, true);
      const b = await app.evalJs(`(() => ({
        heading: document.querySelector('.wz-sliver-body .wz-sliver-h')?.textContent.trim() ?? null,
        items: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-item-btn')].map(x => x.textContent.trim()),
        footerToggle: [...document.querySelectorAll('.wz-sliver-body .wz-sliver-board-footer')].map(x => ({ pressed: x.getAttribute('aria-pressed'), label: x.textContent.trim() })),
        otherSections: document.querySelectorAll('.wz-sliver-type, .wz-sliver-actions, .wz-sliver-templates, .wz-sliver-fieldset').length,
        tabs: document.querySelectorAll('.wz-sliver-panel [role="tab"]').length }))()`);
      // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
      // "Show grafts" is RETIRED: the board's tools arm is the FOUR door buttons and no footer toggle.
      // Quoted VERBATIM below. Successor: the check directly below.
      // ok(`L5 ${T} BOARD (page-level): the tools arm keeps its list, now on the shared shell - FOUR door buttons (Add card, New page card, Existing page, From a deck) and the footer toggle, with no Typeface/Format/Actions/Templates and no tab row`,
      //   b.items.length === 4 && b.items.every((x) => x.length > 0) && b.footerToggle.length === 1 && b.otherSections === 0 && b.tabs === 0, JSON.stringify(b));
      ok(`L5 ${T} BOARD (page-level) [connector-a successor]: the tools arm keeps its list on the shared shell - FOUR door buttons (Add card, New Page, + Filed Pages, From a deck) and NO footer toggle (retired), with no Typeface/Format/Actions/Templates and no tab row`,
        b.items.length === 4 && b.items.every((x) => x.length > 0) && b.footerToggle.length === 0 && b.otherSections === 0 && b.tabs === 0, JSON.stringify(b));
    });

    // ===== L6 - BRASS AND OLIVE =============================================================================================================================
    await guard(`L6 ${T}`, async () => {
      if (!(await open(app, th, 'free'))) { ok(`L6 ${T} fixture: free write opened`, false); return; }
      await ensureLeft(app, true);
      // the open tab's where-you-are colour is the theme's: olive (--accent-rest) in Arbor; Flux wears its own mid text colour (index.css: [data-theme='flux'] .wz-sliver[data-open='true'] .wz-sliver-grip)
      const brass = await varColour(app, '--brass'); const olive = await varColour(app, th.id === 'flux' ? '--text-mid' : '--accent-rest');
      const accentRest = await varColour(app, '--accent-rest');
      const c = await app.evalJs(`(() => { const t = (k) => document.querySelector('#wz-sliver-tab-' + k); const cs = (e) => e ? getComputedStyle(e) : null;
        const grip = document.querySelector('.wz-sliver-grip');
        return { textTab: cs(t('text')) && { color: cs(t('text')).color, border: cs(t('text')).borderTopColor, bg: cs(t('text')).backgroundColor, on: t('text').getAttribute('data-on') },
                 inkTab: cs(t('ink')) && { color: cs(t('ink')).color, border: cs(t('ink')).borderTopColor, on: t('ink').getAttribute('data-on') },
                 gripColor: cs(grip).color, gripBorder: cs(grip).borderTopColor }; })()`);
      // SUPERSEDED (item tutor-drawer-mirror round 2, Nick's live bug
      // report, confirmed by tutor-drawer-probe.mjs: the open TUTOR tab
      // measured brass rgb(255,152,0); "make it olive now") — the chosen
      // DrawerTabs.tsx tab (shared by both the left Sliver's TEXT|INK row
      // and the right Tutor's TUTOR|links row — ONE component) no longer
      // wears brass at all; quoted verbatim:
      // ok(`L6 ${T}: the CHOSEN tab (TEXT) computes to brass and takes no fill; the unchosen one (INK) does not`,
      //   c.textTab && (c.textTab.border === brass || c.textTab.color === brass) && c.textTab.bg === 'rgba(0, 0, 0, 0)' && c.inkTab && c.inkTab.border !== brass && c.inkTab.color !== brass, JSON.stringify({ brass, c }));
      ok(`L6 ${T} [tutor-drawer-mirror round 2 successor]: the CHOSEN tab (TEXT) computes to olive (--accent-rest) and takes no fill - the same "where you are" signal the drawer's own grip already carries; the unchosen one (INK) does not`,
        c.textTab && (c.textTab.border === accentRest || c.textTab.color === accentRest) && c.textTab.bg === 'rgba(0, 0, 0, 0)' && c.inkTab && c.inkTab.border !== accentRest && c.inkTab.color !== accentRest, JSON.stringify({ accentRest, c }));
      ok(`L6 ${T}: an OPEN drawer's tab wears the theme's where-you-are colour (olive in Arbor, mid text in Flux), never brass`, c.gripColor === olive && c.gripBorder === olive && c.gripColor !== brass, JSON.stringify({ olive, brass, grip: [c.gripColor, c.gripBorder] }));
    });

    // ===== L7 - ONE DRAWER AT A TIME, AT EVERY WIDTH (Fable, Oct 12) ================================================================================
    // PARKED - SUPERSEDED by Fable's ruling (Oct 12): "Only one drawer may be open at a time, at every screen width." The block below is the original two-drawer law, kept VERBATIM
    // and no longer run: it asserted BOTH drawers may stand at 1280 and the later one closes the other only at 1100.
    //
    // // ===== L7 - THE TWO-DRAWER LAW ==========================================================================================================================
    // await guard(`L7 ${T}`, async () => {
    //   if (!(await open(app, th, 'draft'))) { ok(`L7 ${T} fixture: draft opened`, false); return; }
    //   await ensureLeft(app, true); await ensureRight(app, true);
    //   ok(`L7 ${T} @1280: BOTH drawers may be open at once`, (await leftOpen(app)) && (await rightOpen(app)), '');
    //   if (!(await open(app, th, 'draft', 1100, 800))) { ok(`L7 ${T} fixture: draft opened at 1100`, false); return; }
    //   await ensureLeft(app, true);
    //   await toggleRight(app); await sleep(900);
    //   const later = { left: await leftOpen(app), right: await rightOpen(app) };
    //   ok(`L7 ${T} @1100: opening the right drawer while the left is open CLOSES the left - the later one wins`, later.right === true && later.left === false, JSON.stringify(later));
    // });


    for (const w of [1100, 1280, 1400]) {
      await guard(`L7 ${T} @${w}`, async () => {
        if (!(await open(app, th, 'draft', w, 800))) { ok(`L7 ${T} fixture: draft opened at ${w}`, false); return; }
        await ensureLeft(app, true);
        await toggleRight(app); await sleep(900);
        const a = { left: await leftOpen(app), right: await rightOpen(app) };
        ok(`L7 ${T} @${w}: opening the RIGHT drawer while the left is open CLOSES the left - one drawer at a time`, a.right === true && a.left === false, JSON.stringify(a));
        await toggleLeft(app); await sleep(900);
        const b = { left: await leftOpen(app), right: await rightOpen(app) };
        ok(`L7 ${T} @${w}: and opening the LEFT drawer while the right is open closes the right (the rule is symmetric)`, b.left === true && b.right === false, JSON.stringify(b));
      });
    }

    // ===== L8 - THE SCROLLBAR ===============================================================================================================================
    await guard(`L8 ${T}`, async () => {
      if (!(await open(app, th, 'long', 1366, 768))) { ok(`L8 ${T} fixture: long page opened`, false); return; }
      await ensureLeft(app, true);
      const s = await app.evalJs(`(() => { const p = document.querySelector('.wz-sliver-panel'); if (!p) return null; const cs = getComputedStyle(p);
        return { overflowY: cs.overflowY, scrollbarWidth: cs.scrollbarWidth, direction: cs.direction, canScroll: p.scrollHeight > p.clientHeight }; })()`);
      ok(`L8 ${T} @1366x768: the panel scrolls, shows the THIN bar, and on its OUTER edge (direction rtl, children keep ltr)`, s && s.overflowY === 'auto' && s.scrollbarWidth === 'thin' && s.direction === 'rtl', JSON.stringify(s));
    });

    // ===== L9 - ARIA AND KEYBOARD ===========================================================================================================================
    await guard(`L9 ${T}`, async () => {
      if (!(await open(app, th, 'free'))) { ok(`L9 ${T} fixture: free write opened`, false); return; }
      await ensureLeft(app, true);
      const a = await app.evalJs(`(() => { const list = document.querySelector('.wz-sliver-panel [role="tablist"]'); if (!list) return { missing: true };
        const tabs = [...list.querySelectorAll('[role="tab"]')]; const panelId = tabs[0] && tabs[0].getAttribute('aria-controls');
        return { label: list.getAttribute('aria-label'), n: tabs.length, selected: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length,
                 tabindex: tabs.map(t => t.getAttribute('tabindex')), controlsExist: !!panelId && !!document.getElementById(panelId),
                 panelRole: document.getElementById(panelId)?.getAttribute('role') ?? null }; })()`);
      ok(`L9 ${T}: the left tablist is named, has two tabs with exactly one selected, a ROVING tabindex (0 on the selected, -1 on the other), and aria-controls points at a real panel`,
        !a.missing && !!a.label && a.n === 2 && a.selected === 1 && same(a.tabindex, ['0', '-1']) && a.controlsExist === true, JSON.stringify(a));
      await app.evalJs("document.querySelector('#wz-sliver-tab-text')?.focus()");
      await app.key('ArrowRight'); await sleep(500);
      const k = await app.evalJs(`({ selected: document.querySelector('.wz-sliver-panel [role="tab"][aria-selected="true"]')?.id ?? null, focused: document.activeElement?.id ?? null })`);
      ok(`L9 ${T}: ArrowRight moves the selection to INK AND the focus with it`, k.selected === 'wz-sliver-tab-ink' && k.focused === 'wz-sliver-tab-ink', JSON.stringify(k));
      await app.key('ArrowLeft'); await sleep(400);
      const k2 = await app.evalJs(`document.querySelector('.wz-sliver-panel [role="tab"][aria-selected="true"]')?.id ?? null`);
      ok(`L9 ${T}: ArrowLeft brings it back to TEXT`, k2 === 'wz-sliver-tab-text', String(k2));
      // the grips report their state
      const g = await app.evalJs(`(() => { const l = document.querySelector('.wz-sliver-grip'), r = document.querySelector('.wz-tutor-grip'); const d = (e) => e && ({ label: e.getAttribute('aria-label'), expanded: e.getAttribute('aria-expanded'), tag: e.tagName }); return { left: d(l), right: d(r) }; })()`);
      ok(`L9 ${T}: both tabs are real buttons with a name, and the left one reports aria-expanded true while open`, g.left && g.right && g.left.tag === 'BUTTON' && g.right.tag === 'BUTTON' && !!g.left.label && !!g.right.label && g.left.expanded === 'true', JSON.stringify(g));
      // the two mode toggles: keyboard-operable, state reported
      await modeTab(app, 'draft');
      const t0 = await app.evalJs(`document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]')?.getAttribute('aria-pressed') ?? null`);
      ok(`L9 ${T}: the Typewriter toggle exists on Draft and reports aria-pressed`, t0 === 'true' || t0 === 'false', String(t0));
      // PARKED - SUPERSEDED (Oct 12): this driver pressed Enter through app.key(), which sends rawKeyDown + keyUp only - no char event, so no keypress, so NO plain button is ever activated by it.
      // Chat 1's run read the toggle as "did not flip"; the check was not testing a keyboard. The original is kept verbatim below; the successor sends a TRUSTED keyDown carrying the
      // character, and proves the instrument on a CONTROL (the plain "..." button, which has no handler of ours) before it accuses the product.
      //
      // if (t0 != null) {
      //   await app.evalJs(`document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]').focus()`);
      //   await app.key('Enter'); await sleep(400);
      //   const t1 = await app.evalJs(`document.querySelector('.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]')?.getAttribute('aria-pressed') ?? null`);
      //   ok(`L9 ${T}: Enter on the focused Typewriter toggle flips it (keyboard-operable)`, t1 != null && t1 !== t0, JSON.stringify({ t0, t1 }));
      // }

      if (t0 != null) {
        await ensureLeft(app, true);
        const sel = '.wz-sliver-instruments-modes [data-mode-toggle="typewriter"]';
        // CONTROL: Enter on the plain "..." button must open its menu (aria-expanded flips) - if THIS fails the instrument is broken, not the toggle
        await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.focus()");
        const c0 = await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.getAttribute('aria-expanded') ?? null");
        await pressEnter(app); await sleep(350);
        const c1 = await app.evalJs("document.querySelector('.wz-sliver-instruments-btn')?.getAttribute('aria-expanded') ?? null");
        ok(`L9 ${T} CONTROL: a trusted Enter activates a plain button (the "..." menu opens) - so the next two checks test the toggle, not the keyboard instrument`, c0 === 'false' && c1 === 'true', JSON.stringify({ c0, c1 }));
        await pressEnter(app); await sleep(250);   // close it again (Enter on the still-focused "...")
        await app.evalJs(`document.querySelector('${sel}').focus()`);
        const focused = await app.evalJs(`document.activeElement === document.querySelector('${sel}')`);
        ok(`L9 ${T}: the Typewriter toggle can take focus (a precondition: an inert or hidden toggle would make the next press a no-op for the wrong reason)`, focused === true, String(focused));
        const t1 = await app.evalJs(`document.querySelector('${sel}')?.getAttribute('aria-pressed') ?? null`);
        await pressEnter(app); await sleep(400);
        const t2 = await app.evalJs(`document.querySelector('${sel}')?.getAttribute('aria-pressed') ?? null`);
        ok(`L9 ${T}: Enter on the focused Typewriter toggle FLIPS it, like any button`, t1 != null && t2 != null && t2 !== t1, JSON.stringify({ t1, t2 }));
        await app.evalJs(`document.querySelector('${sel}')?.focus()`);
        await pressSpace(app); await sleep(400);
        const t3 = await app.evalJs(`document.querySelector('${sel}')?.getAttribute('aria-pressed') ?? null`);
        ok(`L9 ${T}: and Space flips it back`, t3 != null && t3 !== t2, JSON.stringify({ t2, t3 }));
      }
      // the "?" note (Arbor only): opens on press, is reported, closes on Escape.
      // SUPERSEDED (item word-diet, Fable, review fix) — a bare
      // '.wz-drawer-note-btn' query is DOCUMENT-WIDE, and word-diet's own
      // "?" notes (the Tutor's Ask box, its Fragments lens, Recede depth,
      // etc.) are NOT Arbor-exclusive, so on Flux this fixture (the right
      // drawer defaults to the Tutor tab, per K5) now finds one of THOSE
      // regardless of theme — a false "has a note" reading that was never
      // the tab row's own claim. Scope to the tab row's own overlay
      // (.wz-drawer-tabnotes), matching the CSS's own scoping anchor.
      // const hasNote = await app.evalJs("!!document.querySelector('.wz-drawer-note-btn')");
      const hasNote = await app.evalJs("!!document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')");
      if (th.id === 'arbor') {
        await ensureRight(app, true);
        const n0 = await app.evalJs(`document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded') ?? null`);
        await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.click()"); await sleep(300);
        const n1 = await app.evalJs(`({ expanded: document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded'), role: document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-pop')?.getAttribute('role') ?? null })`);
        await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.focus()"); await app.key('Escape'); await sleep(300);
        const n2 = await app.evalJs("document.querySelector('.wz-drawer-tabnotes .wz-drawer-note-btn')?.getAttribute('aria-expanded') ?? null");
        ok(`L9 ${T}: the Arbor "?" note is a button that reports aria-expanded, opens a role=note panel on press, and closes on Escape`, n0 === 'false' && n1.expanded === 'true' && n1.role === 'note' && n2 === 'false', JSON.stringify({ n0, n1, n2 }));
      } else {
        ok(`L9 ${T} [word-diet successor]: Flux's own tab row has NO "?" note (its word explains itself - by ruling)`, hasNote === false, String(hasNote));
      }
    });
  }
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
const failed = checks.filter((c) => !c.pass);
// eslint-disable-next-line no-console
console.log(failed.length === 0 ? `\nDRAWERS-P1-LIVE VERIFY: PASS (${checks.length} checks)` : `\nDRAWERS-P1-LIVE VERIFY: FAIL - ${failed.length}/${checks.length}\n` + failed.map((c) => '  FAIL ' + c.name + ' | ' + String(c.detail).slice(0, 240)).join('\n'));
process.exit(failed.length === 0 ? 0 : 1);
