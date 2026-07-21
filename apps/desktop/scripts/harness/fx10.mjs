// FX10 — the Room's Edges (docs/wrizo-alpha/fx10-rooms-edges-brief.md). A
// committed CDP verification scenario (per this project's own "harness
// scenarios persist" convention). `freshDesk`/`freshProsePage`/`freshBoard`/
// `seedEntries`/`rawEntry`/`openTutor`/`rectOf` below are copied VERBATIM
// from tu2.mjs's own (most recently evolved) versions, per this project's
// own standing instruction not to re-derive fixtures from scratch.
// Run: node scripts/harness/fx10.mjs   (from apps/desktop, with dist-web
// freshly built via `pnpm run build:web`).
//
// Covers the brief's own S5 list exactly:
//   S1 — at 1100 (floor, mandatory)/1280/2200, on BOTH the page and board
//   surfaces: the open panel's own width matches the ruled clamp
//   `clamp(320px, 34vw, 460px)`, read live (not hardcoded); the grip stays
//   flush to the paper's right edge closed AND open; the paper's rect is
//   invariant closed/open/docked at every width; NO element inside the
//   panel owns its own scrollbar (a real descendant walk, computed
//   overflow, not eyeballed); the motion's own duration/easing are read
//   LIVE off both `.wz-tutor-panel` and `.wz-sliver-panel` (the tool
//   pop-out) and asserted EQUAL, not merely "close"; the A13 structural
//   walk repeats; A15's dock rider/Escape ladder/reduced-motion branch are
//   re-verified whole (touched only by JSX reordering, never by logic, but
//   proven live rather than assumed unaffected).
//   S2 — chrome including the strip is dissolved after a first keystroke,
//   at all three reference widths (both the two "reference widths" S2's own
//   prose names AND the 1100 floor, per this ticket's own "both-reference-
//   widths + the 1100 floor on every geometry assert" invariant). Root-
//   cause proof included: `.desk-rail` itself never mounts on a framed
//   surface at all (confirmed structurally, at every width) — the element
//   Nick actually saw at "the far left" is `.desk-frame-strip`, which
//   carried neither `chrome-fade` nor `desk-dissolve` before this ticket. A
//   legacy-width (<1100) DeskRail sanity check confirms that surface's own
//   fade (unrelated code path, never touched) is unaffected.
//   S3 — a dissolved-but-open menu is restored by a GENUINE TRUSTED pointer
//   move over it (runtime-verify.mjs's own `app.mouseMove`, CDP
//   Input.dispatchMouseEvent, isTrusted:true), WITH NO CLICK anywhere in
//   the proof (this file never calls `app.mouseDown`/`mouseUp`/`click` in
//   the S3 section at all — the absence is structural, not merely
//   asserted). Proven on TWO independently-dissolving surface families (the
//   sliver panel AND the strip, now dissolving per S2) to make good on the
//   brief's own "fixed at the source, every dissolved surface inherits it"
//   claim explicitly, plus a negative control (casual hover over the page
//   itself, away from any chrome, does NOT summon).
//   S4 — the scrollbar's own rect (`.mode-scroll`'s border-box edge, where
//   a scrollbar always renders) sits flush against the paper's own edge
//   (near-zero gap, the 1px paper border the only remainder); the text
//   measure is proven unchanged via a structural equivalence (not a
//   guessed pixel constant): `.mode-scroll`'s own content-box width is
//   asserted equal to `.mode-page`'s own content-box width — exactly what
//   the PRE-FIX markup already guaranteed by construction (zero padding on
//   `.mode-scroll` meant its content box WAS `.mode-page`'s content box),
//   so this proves the measure never moved rather than merely matching a
//   number that happens to look right today. Checked at the 1100 floor and
//   the 1280 reference width.
//
// Park sweep (S5's own instruction): a full, independent grep-based sweep
// of scripts/harness/, THEN an empirical re-run of every pre-existing file
// (both HARNESS_PARKED settings) against this ticket's own build. Exactly
// ONE falsified assertion shape found, all six instances in tu2.mjs's own
// geometry section (the "EXACTLY 2x --strip-width" width check, page +
// board, at all three reference widths) — parked THERE per A4, quoted
// verbatim, with live successors HERE (this file's own S1 geometry
// section). tu1.mjs and every other pre-existing file re-ran byte-identical
// against this ticket's build, both HARNESS_PARKED settings — see
// tu2.mjs's own header + PARKED section for the full six-check writeup.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const FLOOR_W = 1100; // DESKFRAME_MIN_WIDTH — the mandatory floor, never skipped
const LAPTOP_W = 1280;
const WIDE_W = 2200;

// --- tu2.mjs's own freshDesk/freshProsePage/freshBoard/seedEntries/
// rawEntry/openTutor/rectOf, copied verbatim ---------------------------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '2');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's own FLUSH_DELAY (300ms), + margin
};

const freshBoard = async (app, boardId, boxes, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'FX10 Board', projectId: null, pageType: 'board', source: 'page', boxes: ${JSON.stringify(boxes)}, createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(300);
  await app.emulateDpr(1, width, height);
};

const seedEntries = async (app, rows) => {
  await app.goto('/');
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before FX10 seed' });
  await app.evalJs(`(() => {
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push(...${JSON.stringify(rows)});
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
};

const rawEntry = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const rectOf = async (app, sel) =>
  app.evalJs(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const r = el.getBoundingClientRect(); return { left:r.left, right:r.right, top:r.top, bottom:r.bottom, width:r.width, height:r.height }; })()`);

await withHarness(async (app) => {
  // ==========================================================================
  // S1 — geometry: three widths (1100 floor mandatory / 1280 / 2200), BOTH
  // page and board surfaces. Ruled width: clamp(320px, 34vw, 460px).
  // ==========================================================================
  for (const surface of ['page', 'board']) {
    for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
      const paperSel = surface === 'page' ? '.mode-pagecol' : '.board-canvas-wrap';
      if (surface === 'page') {
        await freshProsePage(app, width, 900);
      } else {
        await freshBoard(app, `fx10-geom-${width}`, [], width, 900);
      }

      const paperClosed = await rectOf(app, paperSel);
      const gripClosed = await rectOf(app, '.wz-tutor-grip');
      ok(`S1 geometry @${width}px/${surface}: grip-flush (closed) — the grip's own left edge sits flush (no gap) against the paper's right edge`,
        Math.abs(gripClosed.left - paperClosed.right) < 1.5, JSON.stringify({ gripLeft: gripClosed.left, paperRight: paperClosed.right }));

      await openTutor(app);
      const panelOpen = await rectOf(app, '.wz-tutor-panel');
      const paperOpen = await rectOf(app, paperSel);
      const gripOpen = await rectOf(app, '.wz-tutor-grip');
      ok(`S1 geometry @${width}px/${surface}: grip-flush (open) — the grip never moves once the panel opens`,
        Math.abs(gripOpen.left - paperOpen.right) < 1.5, JSON.stringify({ gripLeft: gripOpen.left, paperRight: paperOpen.right }));
      ok(`S1 geometry @${width}px/${surface}: paper rect BYTE-IDENTICAL, closed -> open`,
        JSON.stringify(paperClosed) === JSON.stringify(paperOpen), JSON.stringify({ paperClosed, paperOpen }));

      // Fable's corrected ruling (superseding TU2 S4's "2x --strip-width"
      // spec error): clamp(320px, 34% of the viewport, 460px), a genuine
      // `vw`-unit CSS clamp — no JS-side margin adjustment (the CD2 overlay
      // law means the panel simply overlays the paper below the width
      // where it can't fit, exactly as today; see index.css's own header
      // comment on `--tutor-panel-open-w` for the full reasoning).
      const expectedOpenW = Math.max(320, Math.min(width * 0.34, 460));
      ok(`S1 geometry @${width}px/${surface}: the OPEN panel's own width matches the RULED clamp(320px, 34vw, 460px) — ${expectedOpenW.toFixed(2)}px at this width, not TU2's superseded ~168px`,
        Math.abs(panelOpen.width - expectedOpenW) < 1, JSON.stringify({ panelOpenWidth: panelOpen.width, expected: expectedOpenW }));

      await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()");
      await sleep(250);
      const paperAfterDock = await rectOf(app, paperSel);
      const dockedState = await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.docked");
      ok(`S1 geometry @${width}px/${surface}: paper rect BYTE-IDENTICAL after invoking the dock control (whether it genuinely docks or, below the floor, falls back to closing — either way the paper never moves)`,
        JSON.stringify(paperClosed) === JSON.stringify(paperAfterDock), JSON.stringify({ paperClosed, paperAfterDock, dockedState }));
    }
  }

  // ==========================================================================
  // S1 — the motion itself: duration + easing read LIVE off both the tutor
  // panel and the tool pop-out (the sliver panel), asserted EQUAL — not
  // merely "close," not a hardcoded guess on either side.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const tutorMotion = await app.evalJs(`(() => {
      const cs = getComputedStyle(document.querySelector('.wz-tutor-panel'));
      return { duration: cs.transitionDuration, property: cs.transitionProperty, easing: cs.transitionTimingFunction };
    })()`);
    const sliverMotion = await app.evalJs(`(() => {
      const cs = getComputedStyle(document.querySelector('.wz-sliver-panel'));
      return { duration: cs.transitionDuration, property: cs.transitionProperty, easing: cs.transitionTimingFunction };
    })()`);
    ok('S1 motion: the tutor panel\'s own live computed transition-duration EQUALS the tool pop-out\'s (the sliver panel\'s) own live computed transition-duration',
      tutorMotion.duration === sliverMotion.duration, JSON.stringify({ tutorMotion, sliverMotion }));
    ok('S1 motion: the tutor panel\'s own live computed transition-timing-function (easing) EQUALS the tool pop-out\'s own',
      tutorMotion.easing === sliverMotion.easing, JSON.stringify({ tutorMotion, sliverMotion }));
    ok('S1 motion: the tutor panel animates opacity + transform (a fade+slide, mirroring the sliver\'s own shape) — NOT width/max-width/border-width (TU2\'s superseded collapse)',
      tutorMotion.property.includes('opacity') && tutorMotion.property.includes('transform')
      && !tutorMotion.property.includes('width') && !tutorMotion.property.includes('border-width'),
      tutorMotion.property);
    ok('S1 motion: the sliver panel\'s own reference shape is unchanged (opacity + transform) — the constant being measured against wasn\'t itself altered by this ticket',
      sliverMotion.property.includes('opacity') && sliverMotion.property.includes('transform'), sliverMotion.property);

    // The panel's own OPEN/CLOSE transform genuinely moves (a real slide,
    // not merely a fade) — mirroring the sliver's own translateX shape,
    // sign flipped (the tutor panel settles in from the paper's side).
    const closedTransform = await app.evalJs("getComputedStyle(document.querySelector('.wz-tutor-panel')).transform");
    await openTutor(app);
    const openTransform = await app.evalJs("getComputedStyle(document.querySelector('.wz-tutor-panel')).transform");
    ok('S1 motion: the panel\'s own transform genuinely changes open vs closed (a real translateX slide, mirroring the sliver\'s own shape) — not a bare opacity fade',
      closedTransform !== openTransform, JSON.stringify({ closedTransform, openTransform }));

    // A15 — reduced motion honored: the transition itself is suppressed.
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await sleep(100);
    const reducedTransition = await app.evalJs("getComputedStyle(document.querySelector('.wz-tutor-panel')).transitionDuration");
    // Chromium's own computed-style serialization of `transition:none` isn't
    // always the literal string "0s" (confirmed live: this build reports
    // "1e-05s", ~10 microseconds — imperceptible, not a real transition) —
    // a numeric tolerance is the honest check, not a brittle string match.
    const reducedIsEffectivelyZero = reducedTransition.split(',').every((d) => Math.abs(parseFloat(d)) < 0.001);
    ok('S1/A15: prefers-reduced-motion suppresses the panel\'s own transition (duration collapses to effectively 0 under the media query\'s `transition:none`)',
      reducedIsEffectivelyZero, reducedTransition);
    await app.emulateMedia([]);
  }

  // ==========================================================================
  // S1 — no scroll-within-scroll: a rich fixture (every lens populated, a
  // seeded conversation) so the panel actually has enough content to test,
  // then a real descendant walk asserting computed overflow, not an
  // eyeball.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const hostId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('Aria and Arya, a rich fixture for the no-scroll-within-scroll walk.');
    await sleep(2600);
    // Harness-seeding law (MEMORY.md's own "seeding vs. flushNow race"):
    // never mutate a page's own record directly while THAT page is still
    // mounted and about to be navigated away from — PageEditor's own
    // flush-on-unmount holds a stale in-memory copy and silently clobbers
    // an out-of-band write the instant it unmounts. tu1.mjs's own working
    // fixture already proves the safe order: navigate to the Desk FIRST
    // (unmounting the host page cleanly, its own flush settled), THEN
    // mutate its record and seed the fragment, THEN reload/reopen.
    await app.goto('/');
    await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before FX10 no-scroll-within-scroll seed' });
    await app.evalJs(`(() => {
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const e = entries.find(x => x.id === ${JSON.stringify(hostId)});
      if (e) e.tags = ['walk-fixture'];
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    const walkNow = new Date().toISOString();
    await seedEntries(app, [
      { id: 'fx10-walk-frag', text: 'A fragment for the no-scroll-within-scroll walk', projectId: null, source: 'page', starred: true, tags: ['walk-fixture'], createdAt: walkNow, updatedAt: walkNow },
    ]);
    await app.reload();
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(hostId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'no-scroll-within-scroll fixture reloaded' });
    await sleep(250);
    await openTutor(app);
    // The conversation seed is safe to write directly WHILE mounted here —
    // nothing navigates away before it's read (the same precedent tu1.mjs's
    // own structural-walk fixture already relies on).
    await app.evalJs(`(() => {
      const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
      const e = entries.find(x => x.id === ${JSON.stringify(hostId)});
      if (e) e.tutor = { messages: [
        { id: 'm1', role: 'writer', text: 'A first message, to give the log some real height.', at: new Date().toISOString() },
        { id: 'm2', role: 'tutor', text: 'A reply of a reasonable length, wrapping across more than one line inside the new wider panel, so the conversation log genuinely has content to grow with rather than sitting empty.', at: new Date().toISOString() },
      ] };
      localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
    })()`);
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); // close
    await sleep(150);
    await openTutor(app); // reopen, now with the seeded message + fragment rendered

    const descendantCount = await app.evalJs("document.querySelectorAll('.wz-tutor-panel *').length");
    ok('S1 no-scroll-within-scroll: the rich fixture actually mounts a real subtree to walk (not a vacuous sweep)',
      descendantCount >= 15, String(descendantCount));

    const nestedScrollers = await app.evalJs(`(() => {
      const panel = document.querySelector('.wz-tutor-panel');
      const offenders = [];
      panel.querySelectorAll('*').forEach((el) => {
        const cs = getComputedStyle(el);
        if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflowX === 'auto' || cs.overflowX === 'scroll') {
          offenders.push({ tag: el.tagName, className: el.className, overflowY: cs.overflowY, overflowX: cs.overflowX });
        }
      });
      return offenders;
    })()`);
    ok('S1 no-scroll-within-scroll: NO descendant of the panel owns its own scrollbar (computed overflow walked across every actual descendant) — the panel itself is the ONLY scroll region',
      nestedScrollers.length === 0, JSON.stringify(nestedScrollers));

    const panelOverflowY = await app.evalJs("getComputedStyle(document.querySelector('.wz-tutor-panel')).overflowY");
    ok('S1 no-scroll-within-scroll: the panel itself IS the one scroll region (overflow-y: auto)',
      panelOverflowY === 'auto', panelOverflowY);

    // A message bubble grows to its content — no fixed/clamped height on
    // any individual message.
    const bubbleHeights = await app.evalJs(`[...document.querySelectorAll('.wz-tutor-msg')].map(el => { const cs = getComputedStyle(el); return { maxHeight: cs.maxHeight, height: cs.height }; })`);
    ok('S1 no-scroll-within-scroll: no message bubble carries a max-height clamp — it grows to its own content',
      bubbleHeights.every((b) => b.maxHeight === 'none'), JSON.stringify(bubbleHeights));

    // ==========================================================================
    // S1 — center of gravity: the conversation renders ahead of every lens
    // section in DOM order (composer + exchange read as the main event).
    // ==========================================================================
    const order = await app.evalJs(`(() => {
      const body = document.querySelector('.wz-tutor-body');
      const kids = [...body.children].map(c => c.className);
      return kids;
    })()`);
    const convoIdx = order.findIndex((c) => c.includes('wz-tutor-convo') && !c.includes('wz-tutor-convo-'));
    const sectionsIdx = order.findIndex((c) => c.includes('wz-tutor-sections'));
    ok('S1 center of gravity: the conversation block renders BEFORE the lens/nudge sections in DOM order',
      convoIdx >= 0 && sectionsIdx >= 0 && convoIdx < sectionsIdx, JSON.stringify({ order, convoIdx, sectionsIdx }));

    // ==========================================================================
    // A13 — the structural walk, repeated (a rich fixture already mounted
    // above; every control species present).
    // ==========================================================================
    const pageTextBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    const controlCount = await app.evalJs("document.querySelectorAll('.desk-frame-tutor-panel-anchor button, .desk-frame-tutor-panel-anchor input').length");
    ok('A13 structural walk (repeated): the rich fixture actually mounts multiple control species (not a vacuous sweep)',
      controlCount >= 4, String(controlCount));

    const forbidden = await app.evalJs(`(() => {
      const root = document.querySelector('.desk-frame-tutor-panel-anchor');
      const html = root ? root.innerHTML.toLowerCase() : '';
      const words = ['insert', 'apply', 'copy-into', 'paste-into', 'send-to-page', 'inject'];
      return words.filter(w => html.includes(w));
    })()`);
    ok('A13 structural walk (repeated): no insert/apply/copy-into-page affordance keyword exists anywhere in the panel',
      forbidden.length === 0, JSON.stringify(forbidden));

    const fragClicked = await app.evalJs(`(() => {
      const el = document.querySelector('.desk-frame-tutor-panel-anchor .wz-tutor-frag-item');
      if (!el) return false;
      el.click();
      return true;
    })()`);
    if (fragClicked) {
      await sleep(250);
      ok('A13 structural walk (repeated): activating a fragment-item control TRAVELS (a lawful exception — never inserts into any page)',
        !(await app.evalJs(`location.hash.includes(${JSON.stringify(hostId)})`)));
      await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(hostId)}`);
      await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'back on the A13 walk host' });
      await sleep(250);
      await openTutor(app);
    }

    let guard = 0;
    while (guard++ < 40) {
      const stillOpen = await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open");
      if (stillOpen !== 'true') { await openTutor(app); }
      const clicked = await app.evalJs(`(() => {
        const root = document.querySelector('.desk-frame-tutor-panel-anchor');
        if (!root) return null;
        const btns = [...root.querySelectorAll('button')];
        const target = btns.find(b => !b.className.includes('wz-tutor-dock-btn') && !b.className.includes('wz-tutor-frag-item'));
        if (!target) return null;
        target.click();
        return target.className;
      })()`);
      if (!clicked) break;
      await sleep(150);
      const pageTextNow = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
      ok(`A13 structural walk (repeated): activating a "${clicked}" control never changes the page's own text`,
        pageTextNow === pageTextBefore, clicked);
    }
    ok('A13 structural walk (repeated): the sweep actually walked at least one control',
      guard >= 1, String(guard));
  }

  // ==========================================================================
  // A15 — the dock rider + Escape ladder, re-verified whole (touched only
  // by JSX reordering in this ticket, never by the keydown logic itself,
  // but proven live rather than assumed unaffected).
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    await openTutor(app);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('a');
    await sleep(150);
    ok('A15: an undocked panel dissolves (closes) on the first keystroke back in the editor',
      (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open")) === 'false');

    await openTutor(app);
    await app.evalJs("document.querySelector('.wz-tutor-dock-btn')?.click()");
    await sleep(250);
    const dockedNow = await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.docked");
    if (dockedNow === 'true') {
      await app.evalJs("document.querySelector('.forward-only-editor').focus()");
      await app.typeKeys('b');
      await sleep(150);
      ok('A15: a DOCKED panel survives a keystroke (the dock rider)',
        (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open")) === 'true'
        && (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.docked")) === 'true');
      // Escape while docked: closes AND undocks (T5's own rider, mirrored —
      // tu1.mjs's own precedent for this exact keyboard claim already uses
      // a synthetic dispatchEvent, not a trusted CDP key event; kept
      // consistent with that established pattern here).
      await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
      await sleep(150);
      ok('A15: Escape dismisses a DOCKED panel too (closes and undocks)',
        (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open")) === 'false'
        && (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.docked")) === 'false');
    } else {
      ok('A15: dock affordance unavailable at this width (falls back to a plain close) — the docked-survives-keystroke branch is not exercised here, consistent with the floor-fallback law',
        true, 'dock unavailable at LAPTOP_W, not a failure');
    }

    // Escape ladder: open (undocked) -> Escape closes.
    await openTutor(app);
    await app.evalJs("document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
    await sleep(150);
    ok('A15: Escape closes an open, undocked panel',
      (await app.evalJs("document.querySelector('.wz-tutor-panel')?.dataset.open")) === 'false');
  }

  // ==========================================================================
  // S2 — the strip is chrome, and chrome vanishes. Root-cause proof: DeskRail
  // itself never mounts on a framed surface (the element Nick actually saw
  // is the strip). All three reference widths.
  // ==========================================================================
  for (const width of [FLOOR_W, LAPTOP_W, WIDE_W]) {
    await freshProsePage(app, width, 900);
    const structuralInfo = await app.evalJs(`(() => {
      const strip = document.querySelector('.desk-frame-strip');
      const rail = document.querySelector('.desk-rail');
      return { railExists: !!rail, stripExists: !!strip, stripClasses: strip?.className ?? null };
    })()`);
    ok(`S2 root cause @${width}px: DeskRail itself does NOT mount on a framed surface — the "far left menu strip" Nick saw is .desk-frame-strip, not .desk-rail`,
      structuralInfo.railExists === false && structuralInfo.stripExists === true, JSON.stringify(structuralInfo));
    ok(`S2 root cause @${width}px: the strip now carries the SAME chrome-fade + desk-dissolve pair every other dissolving DeskFrame track carries — the one vanishing engine, no second implementation`,
      structuralInfo.stripClasses?.includes('chrome-fade') && structuralInfo.stripClasses?.includes('desk-dissolve'),
      structuralInfo.stripClasses);

    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('typing to trigger the vanishing law');
    await sleep(2200); // FADE_OUT_S (2.8s ceiling in useChromeDissolve.ts) with margin below it, but the class flips synchronously on the first keystroke — this margin covers the CSS transition settling, not a wait for the class itself
    const dissolveInfo = await app.evalJs(`(() => {
      const strip = document.querySelector('.desk-frame-strip');
      const host = document.querySelector('.desk-frame-host');
      const frame = document.querySelector('.desk-frame');
      const cs = strip ? getComputedStyle(strip) : null;
      return {
        hostChromeReceded: host?.dataset.chromeReceded,
        frameWriting: frame?.dataset.writing,
        stripOpacity: cs ? parseFloat(cs.opacity) : null,
        stripPointerEvents: cs ? cs.pointerEvents : null,
      };
    })()`);
    ok(`S2 @${width}px: the SAME first-keystroke trigger every other piece of chrome obeys also dissolves the strip (data-chrome-receded/data-writing both flip true)`,
      dissolveInfo.hostChromeReceded === 'true' && dissolveInfo.frameWriting === 'true', JSON.stringify(dissolveInfo));
    ok(`S2 @${width}px: the strip's own opacity drops to the SAME ambient floor every other dissolving surface uses (--fade-min, ~0.08) — no longer exempting itself from the vanishing law`,
      dissolveInfo.stripOpacity !== null && dissolveInfo.stripOpacity < 0.5, JSON.stringify(dissolveInfo));
    ok(`S2 @${width}px: the dissolved strip is genuinely inert (pointer-events:none) — the SAME contract every dissolved surface carries`,
      dissolveInfo.stripPointerEvents === 'none', dissolveInfo.stripPointerEvents);
  }

  // Reduced-motion branch: the SAME class family already honors it
  // (`.chrome-fade`/`.desk-dissolve` both carry a reduced-motion override) —
  // re-verified on the strip specifically now that it participates.
  {
    await freshProsePage(app, LAPTOP_W, 900);
    await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await sleep(100);
    const stripTransition = await app.evalJs("getComputedStyle(document.querySelector('.desk-frame-strip')).transitionDuration");
    const stripIsEffectivelyZero = stripTransition.split(',').every((d) => Math.abs(parseFloat(d)) < 0.001);
    ok('S2 reduced-motion: the strip\'s own opacity transition is suppressed under prefers-reduced-motion (the SAME branch every other chrome-fade/desk-dissolve surface already honors)',
      stripIsEffectivelyZero, stripTransition);
    await app.emulateMedia([]);
  }

  // Legacy (<1100) sanity: DeskRail's own fade (a separate code path this
  // ticket never touches) is unaffected.
  {
    await freshProsePage(app, 900, 900);
    await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
    await app.typeKeys('legacy width dissolve sanity');
    await sleep(500);
    const legacyInfo = await app.evalJs(`(() => {
      const rail = document.querySelector('.desk-rail');
      return { railExists: !!rail, receded: rail?.dataset.chromeReceded };
    })()`);
    ok('S2 legacy (<1100px) sanity: DeskRail still mounts (unframed) and its own dissolve is untouched by this ticket',
      legacyInfo.railExists === true, JSON.stringify(legacyInfo));
  }

  // ==========================================================================
  // S3 — a dissolved-but-open menu restores on GENUINE TRUSTED pointer
  // approach, WITH NO CLICK. This section never calls app.mouseDown/
  // app.mouseUp/app.click/app.doubleClick anywhere — the absence of any
  // click path is structural, not merely asserted below.
  // ==========================================================================
  {
    await freshProsePage(app, LAPTOP_W, 900);
    const dissolvedState = () => app.evalJs("document.querySelector('.desk-frame-host').dataset.chromeReceded");

    // --- the sliver panel: the brief's own named example -------------------
    await app.evalJs("document.querySelector('.wz-sliver-grip').click()"); // open the menu (structural state, not the dissolve)
    await sleep(250);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('dissolving with the sliver open, for the hover-restore proof');
    await sleep(2500);
    ok('S3 sliver: chrome is genuinely dissolved with the menu structurally still open (data-open stays true — only its ambient opacity changed)',
      (await dissolvedState()) === 'true' && (await app.evalJs("document.querySelector('.wz-sliver-panel')?.dataset.open")) === 'true');
    const sliverPE = await app.evalJs("getComputedStyle(document.querySelector('.wz-sliver-panel')).pointerEvents");
    ok('S3 sliver: the dissolved panel is genuinely inert (pointer-events:none) — proving a hover-driven restore CANNOT rely on the panel\'s own hover/pointerenter (it cannot fire one)',
      sliverPE === 'none', sliverPE);
    const sliverRect = await rectOf(app, '.wz-sliver-panel');
    ok('S3 sliver: the dissolved-but-open panel sits well inland from any viewport edge (not a coincidental edge-dwell match)',
      sliverRect.left > 100 && sliverRect.left < 400, JSON.stringify(sliverRect));

    // A genuine, incremental, TRUSTED pointer trajectory (CDP Input, real
    // isTrusted:true events — runtime-verify.mjs's own app.mouseMove) walking
    // in from well outside the panel, then holding still over its center —
    // the same "a hand slowing to a stop" technique FX5 S8's own edge-dwell
    // proof already established, aimed at the panel's own rect instead of a
    // viewport edge. No click, no mousedown/mouseup, anywhere in this block.
    const cx = sliverRect.left + sliverRect.width / 2, cy = sliverRect.top + sliverRect.height / 2;
    for (let i = 1; i <= 12; i++) {
      await app.mouseMove(Math.round(cx + 300 - 300 * (i / 12)), Math.round(cy + 300 - 300 * (i / 12)));
      await sleep(40);
    }
    let resurfaced = false;
    for (let i = 0; i < 12 && !resurfaced; i++) {
      await app.mouseMove(Math.round(cx), Math.round(cy));
      await sleep(60);
      if ((await dissolvedState()) === 'false') resurfaced = true;
    }
    ok('S3 sliver: a GENUINE TRUSTED pointer move onto the dissolved-but-open panel (no click, ever) restores it to full view',
      resurfaced === true, JSON.stringify({ resurfaced }));

    // --- the strip: a SECOND, independent surface, proving the fix landed
    // at the SOURCE (every dissolved surface inherits it automatically) ----
    await freshProsePage(app, LAPTOP_W, 900);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('dissolving the strip, for the second hover-restore proof');
    await sleep(2500);
    ok('S3 strip: chrome (including the newly-dissolving strip, S2) is genuinely dissolved',
      (await dissolvedState()) === 'true');
    const stripRect = await rectOf(app, '.desk-frame-strip');
    const stripCx = stripRect.left + stripRect.width / 2, stripCy = stripRect.top + stripRect.height / 2;
    for (let i = 1; i <= 12; i++) {
      await app.mouseMove(Math.round(stripCx + 300 + 300 * (i / 12)), Math.round(stripCy + 200 - 200 * (i / 12)));
      await sleep(40);
    }
    let stripResurfaced = false;
    for (let i = 0; i < 12 && !stripResurfaced; i++) {
      await app.mouseMove(Math.round(stripCx), Math.round(stripCy));
      await sleep(60);
      if ((await dissolvedState()) === 'false') stripResurfaced = true;
    }
    ok('S3 strip: the SAME genuine trusted hover-restore (no click) also restores the strip — proving the fix is shared machinery every dissolved surface inherits, not a one-off patch on the sliver alone',
      stripResurfaced === true, JSON.stringify({ stripResurfaced }));

    // --- negative control: casual hover over the PAGE itself (nowhere near
    // any chrome-fade/desk-dissolve element) must NOT summon anything ------
    await freshProsePage(app, LAPTOP_W, 900);
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('negative control — casual hover over the page must not summon chrome');
    await sleep(2500);
    const pageRect = await rectOf(app, '.forward-only-editor');
    const midX = pageRect.left + pageRect.width / 2, midY = pageRect.top + pageRect.height / 2;
    for (let i = 1; i <= 10; i++) {
      await app.mouseMove(Math.round(midX - 50 + i * 8), Math.round(midY - 50 + i * 8));
      await sleep(50);
    }
    ok('S3 negative control: casual pointer movement over the PAGE itself (never touching any chrome-fade/desk-dissolve rect) does NOT summon chrome — reaching for chrome still takes deliberate contact',
      (await dissolvedState()) === 'true');
  }

  // ==========================================================================
  // S4 — the scrollbar sits flush at the paper's own outer right edge; the
  // text measure is proven unchanged via structural equivalence.
  // ==========================================================================
  for (const width of [FLOOR_W, LAPTOP_W]) {
    await freshProsePage(app, width, 900);
    const info = await app.evalJs(`(() => {
      const scroll = document.querySelector('.mode-scroll');
      const page = document.querySelector('.mode-page');
      const sr = scroll.getBoundingClientRect();
      const pr = page.getBoundingClientRect();
      const scs = getComputedStyle(scroll);
      const pcs = getComputedStyle(page);
      const scrollContentWidth = sr.width - parseFloat(scs.paddingLeft) - parseFloat(scs.paddingRight);
      const pageBorder = parseFloat(pcs.borderLeftWidth) + parseFloat(pcs.borderRightWidth);
      const pageContentWidth = pr.width - parseFloat(pcs.paddingLeft) - parseFloat(pcs.paddingRight) - pageBorder;
      return {
        scrollRight: sr.right, pageRight: pr.right, gap: pr.right - sr.right,
        scrollLeft: sr.left, pageContentLeft: pr.left + parseFloat(pcs.borderLeftWidth) + parseFloat(pcs.paddingLeft),
        scrollContentWidth, pageContentWidth,
      };
    })()`);
    ok(`S4 @${width}px: the scrollbar's own rect (mode-scroll's border-box edge) sits FLUSH against the paper's right edge — zero gap beyond the paper's own 1px border`,
      info.gap < 2, JSON.stringify(info));
    ok(`S4 @${width}px: the text measure is UNCHANGED — mode-scroll's own content-box width still equals mode-page's own content-box width, exactly the equivalence the pre-fix (zero-padding) markup guaranteed by construction`,
      Math.abs(info.scrollContentWidth - info.pageContentWidth) < 1, JSON.stringify(info));
    ok(`S4 @${width}px: the LEFT edge of the writing area is untouched (only the right side moved, per Nick's own words)`,
      Math.abs(info.scrollLeft - info.pageContentLeft) < 1, JSON.stringify(info));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));

// === PARKED — gated behind HARNESS_PARKED=1, skipped by default. ===========
// fx10.mjs is a brand-new file; it parks nothing of its own (every check
// above reflects this ticket's live, current design). The park sweep S5
// requires (does FX10's own diff falsify any assertion in the other 30
// pre-existing harness files?) was investigated in full — a grep-based
// sweep, THEN an empirical re-run of all 30 files against this ticket's
// own build, both HARNESS_PARKED settings. 29 of the 30 came back
// byte-identical; the one exception (tu2.mjs, six checks — the "EXACTLY 2x
// --strip-width" geometry assertion, page + board surfaces, all three
// reference widths) is parked IN tu2.mjs itself, A4-style, quoted verbatim,
// with its own live successors HERE (this file's own S1 geometry section
// above). This gate is therefore intentionally empty, mirroring tu2.mjs's
// own precedent for an armed-but-empty gate on a brand-new file.
const parkedChecks = [];
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nFX10 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed, nothing parked out of fx10.mjs itself`
    : `\nFX10 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}

const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nFX10 VERIFY: PASS (${checks.length} checks)` : `\nFX10 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
