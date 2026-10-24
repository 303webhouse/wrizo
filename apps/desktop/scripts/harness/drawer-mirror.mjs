// DRAWER MIRROR (Nick approved for train #7, via Fable, Oct 24). The Tutor | Grafts drawer is anchored to the page's RIGHT edge, the mirror of the
// Tools drawer on its left: [Tools panel][tab][ PAGE ][tab][Tutor panel]. The tabs never move when a drawer opens or closes; they ride the PAINTED
// page's edge (so the normal view and the zoom differ, by design - Fable, Oct 24). The both-or-one rule is unchanged (page-size's measured rule).
// RED-FIRST: written before the build. On page-size-r3 @ a3de5470, (1) and (2) are expected RED for the Tutor (its tab jumps left of the opened panel,
// and at 1920 the panel pins to the stage's edge, 63px off the page) and (5) RED for both (the Tools drawer has no Escape; the Tutor ignores an Escape
// pressed inside its own zone). CD is expected RED (the Cascade's dock floor reads the stage-wide column in the zoom).
//
// Arbor, Flux and Machina (no rule yet for Nomad or Volant), each in the NORMAL view (typewriter off), at 1366x768 and 1920x1080:
//   1  a tab's rect is unchanged by open/close - only its arrow flips (both tabs)
//   2  the open drawer's page-side edge is the page's edge on that side (the drawer = its panel + its tab), and each panel abuts its own tab -
//      Tools: tab.right = page.left, panel.right = tab.left; Tutor: tab.left = page.right, panel.left = tab.right (the mirror)
//   3  both open where the page + 2 x 200px fit (the desk on each side of the painted page, measured shut); else opening one closes the other -
//      the else-branch is read in the zoom at 1366, where the 1.6x page leaves under 200px a side
//   4  the page's rect (painted .mode-page) is unchanged through every open and close
//   5  Esc closes a drawer and focus returns to its tab (focus first placed on a control INSIDE the drawer); and 5b - an Esc pressed on the PAGE
//      closes the Tools drawer but never takes the page's focus (PAGE IS PRIMARY)
//   7  reduced motion: the drawer arrives with no travel - its sliding layer is untransformed and untransitioned on the very first read after the
//      press, and the panel is already at its final rect (Nick's earlier ruling keeps a short opacity fade; that is not motion and is not tested here)
//   CD the Cascade docks on a ZOOMED page where the painted page leaves room (the dock floor reads the painted page, not the column) - with a control
//      below the floor (1100, zoomed), where the dock is refused
// Mutants (Arbor, 1366), each asserted to have LANDED:
//   M1 the Tutor tab pushed 32px left while its drawer is open - 1 fails     M2 the Tutor panel pushed 40px off the page - 2 fails
//   M4 the page nudged 24px while the Tutor is open - 4 fails                M5 Escape swallowed before the app sees it (counted) - 5 fails
//   M7 the same press WITHOUT reduced motion - the first read shows travel (the instrument can see motion at all)
// (3 has no mutant here: one-drawer.mjs owns the both-or-one rule's mutants.)
// Seeding goes through the app's seams; the per-page mode and typewriter keys are this device's own UI keys (not collections). Needs a box turn.
// Run: WS_BOX_TURN=<token> node scripts/harness/drawer-mirror.mjs   (from apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const escape = async (app) => {
  const p = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
};
const J = (v) => JSON.stringify(v);

const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SIZES = [[1366, 768], [1920, 1080]];
const DRAWER_MIN = 200;   // store/menusDrawers.ts - the desk a drawer needs beside the page
const TOL = 1;
const PARA = 'The rope was already there, and the well took the bucket back colder still. Whatever is worth carrying is already with you. '.repeat(6);
const pid = (theme) => `dm-${theme}`;
const SLIDE = { tools: '.wz-sliver-panel .wz-drawer-slide', tutor: '.wz-tutor-panel .wz-drawer-slide' };
const TAB = { tools: '.wz-sliver-grip', tutor: '.wz-tutor-grip' };
const PANEL = { tools: '.wz-sliver-panel', tutor: '.wz-tutor-panel' };
const OPEN = { tools: "document.querySelector('.wz-sliver')?.getAttribute('data-open') === 'true'", tutor: "document.querySelector('.wz-tutor-panel')?.getAttribute('data-open') === 'true'" };

// the whole geometry, in one read: the painted page, the stage, both tabs, both panels, both arrows, open state, zoom
const GEO = `(() => { const R = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect();
    return b.width || b.height ? { left: Math.round(b.left * 10) / 10, right: Math.round(b.right * 10) / 10, top: Math.round(b.top * 10) / 10, width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10 } : null; };
  const T = (s) => (document.querySelector(s)?.textContent || '').trim();
  return { page: R('.desk-frame-stage--prose .mode-page'), stage: R('.desk-frame-stage'), sTab: R('.wz-sliver-grip'), tTab: R('.wz-tutor-grip'),
    sPanel: R('.wz-sliver-panel'), tPanel: R('.wz-tutor-panel'), sArrow: T('.wz-sliver-grip-glyph'), tArrow: T('.wz-tutor-grip-glyph'),
    sOpen: ${OPEN.tools}, tOpen: ${OPEN.tutor}, zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') === 'true' }; })()`;
const near = (a, b, t = TOL) => a != null && b != null && Math.abs(a - b) <= t;
const sameRect = (a, b, t = 0.5) => !!a && !!b && ['left', 'right', 'top', 'width', 'height'].every((k) => near(a[k], b[k], t));
const settled = (which) => `(() => { const l = document.querySelector(${J(SLIDE[which])}); if (!l) return true; const cs = getComputedStyle(l); return cs.transform === 'none'; })()`;

const openPage = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  const there = await waitSoft(app, "!!document.querySelector('.forward-only-editor') && !!document.querySelector('.desk-frame-stage--prose .mode-page')", { label: id, timeout: 10000 });
  await sleep(900);
  return there;
};
const tabPoint = (app, which) => app.evalJs(`(() => { const b = document.querySelector(${J(TAB[which])}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
// a trusted press on a drawer's own tab, then the drawer settles (its sliding layer at rest)
const press = async (app, which) => {
  const p = await tabPoint(app, which); if (!p) return false;
  await click(app, p.x, p.y); await sleep(250);
  await waitSoft(app, settled(which), { label: `${which} settled`, timeout: 2500 }); await sleep(250);
  return true;
};
const setOpen = async (app, which, want) => { if ((await app.evalJs(OPEN[which])) !== want) await press(app, which); return (await app.evalJs(OPEN[which])) === want; };
const style = (app, id, css) => app.evalJs(css == null
  ? `(() => { document.getElementById(${J(id)})?.remove(); return true; })()`
  : `(() => { let s = document.getElementById(${J(id)}); if (!s) { s = document.createElement('style'); s.id = ${J(id)}; document.head.appendChild(s); } s.textContent = ${J(css)}; return true; })()`);

// (1) + (2) + (4) on one geometry run: closed -> Tools open -> Tutor open -> both closed
const pred1 = (g0, gOpen, which) => {
  const tab = which === 'tools' ? 'sTab' : 'tTab'; const arrow = which === 'tools' ? 'sArrow' : 'tArrow';
  return sameRect(g0[tab], gOpen[tab]) && !!g0[arrow] && !!gOpen[arrow] && g0[arrow] !== gOpen[arrow];
};
const pred2 = (g, which) => !!g && !!g.page && (which === 'tools'
  ? !!g.sTab && !!g.sPanel && near(g.sTab.right, g.page.left) && near(g.sPanel.right, g.sTab.left) && g.sPanel.width > 0
  : !!g.tTab && !!g.tPanel && near(g.tTab.left, g.page.right) && near(g.tPanel.left, g.tTab.right) && g.tPanel.width > 0);
const pred4 = (gs) => gs.every((g) => !!g && sameRect(gs[0].page, g.page));

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const th of THEMES) {
    const id = pid(th.id);
    await app.evalJs(`window.wrizoCreateJournalPage(${J({ id, text: PARA, createdAt: now, origin: null, source: 'page' })})`);
    await app.evalJs(`localStorage.setItem('wrizo-mode-page-${id}', 'drafting')`);
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
  }
  await app.evalJs('window.wrizoFlushNow()');
  await sleep(400);
  ok('fixture: one Draft page per skin seeded through the seams (Arbor, Flux, Machina), typewriter off', true);

  for (const th of THEMES) {
    await app.evalJs("location.hash = '#/'"); await sleep(300);
    await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`);
    await app.reload();
    await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: `${th.name}: the seams` });
    const applied = await app.evalJs("document.documentElement.getAttribute('data-theme')");
    ok(`${th.name} (premise): the skin is applied (data-theme=${applied})`, applied === th.id, String(applied));
    const id = pid(th.id);

    for (const [w, h] of SIZES) {
      const tag = `${th.name} ${w}x${h}`;
      await app.emulateDpr(1, w, h);
      await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
      if (!(await openPage(app, id))) { ok(`${tag} fixture: the page opened`, false, ''); continue; }
      await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
      const g0 = await app.evalJs(GEO);
      const roomL = g0 && g0.page && g0.stage ? g0.page.left - g0.stage.left : null;
      const roomR = g0 && g0.page && g0.stage ? g0.stage.right - g0.page.right : null;
      ok(`${tag} (premise): the NORMAL view, both drawers shut, the page and both tabs measurable`, !!g0 && !g0.zoom && !g0.sOpen && !g0.tOpen && !!g0.page && !!g0.sTab && !!g0.tTab, J(g0));
      await press(app, 'tools'); const g1 = await app.evalJs(GEO);
      await press(app, 'tutor'); const g2 = await app.evalJs(GEO);
      const both = roomL != null && roomL >= DRAWER_MIN && roomR >= DRAWER_MIN;
      // (3) at these sizes the room is measured; where it holds, both stand
      ok(`${tag} 3: there is room for both (${Math.round(roomL)} / ${Math.round(roomR)}px beside the page, >= ${DRAWER_MIN}) and BOTH stand open`,
        both && !!g2 && g2.sOpen && g2.tOpen, J({ roomL, roomR, sOpen: g2 && g2.sOpen, tOpen: g2 && g2.tOpen }));
      // (1) the tabs: Tools' tab across its open, the Tutor's across its own
      ok(`${tag} 1 (Tools): the tab's rect is unchanged by opening its drawer - only its arrow flips`, !!g1 && g1.sOpen && pred1(g0, g1, 'tools'), J({ shut: g0 && [g0.sTab, g0.sArrow], open: g1 && [g1.sTab, g1.sArrow] }));
      ok(`${tag} 1 (Tutor): the tab's rect is unchanged by opening its drawer - only its arrow flips`, !!g2 && g2.tOpen && pred1(g1, g2, 'tutor'), J({ shut: g1 && [g1.tTab, g1.tArrow], open: g2 && [g2.tTab, g2.tArrow] }));
      // (2) the open drawers meet the page
      ok(`${tag} 2 (Tools): the open drawer's page-side edge is the page's left edge - its tab on the page's edge, its panel against its tab`, pred2(g2, 'tools'),
        J({ page: g2 && g2.page, tab: g2 && g2.sTab, panel: g2 && g2.sPanel }));
      ok(`${tag} 2 (Tutor): the open drawer's page-side edge is the page's right edge - its tab on the page's edge, its panel against its tab (the mirror)`, pred2(g2, 'tutor'),
        J({ page: g2 && g2.page, tab: g2 && g2.tTab, panel: g2 && g2.tPanel }));
      // ...and closing: the tabs come back to the same rect, arrows back
      await press(app, 'tutor'); const g3 = await app.evalJs(GEO);
      await press(app, 'tools'); const g4 = await app.evalJs(GEO);
      ok(`${tag} 1 (both, closing): each tab's rect is unchanged by closing its drawer, and its arrow flips back`,
        !!g3 && !!g4 && !g4.sOpen && !g4.tOpen && sameRect(g2.tTab, g3.tTab) && sameRect(g3.sTab, g4.sTab) && g4.sArrow === g0.sArrow && g4.tArrow === g0.tArrow,
        J({ tTab: [g2 && g2.tTab, g3 && g3.tTab], sTab: [g3 && g3.sTab, g4 && g4.sTab], arrows: [g4 && g4.sArrow, g4 && g4.tArrow] }));
      // (4) the page, through all of it
      ok(`${tag} 4: the page's rect is unchanged through every open and close (shut, Tools open, both open, Tutor shut, both shut)`, pred4([g0, g1, g2, g3, g4]),
        J([g0, g1, g2, g3, g4].map((g) => g && g.page)));

      // (5) Esc, from a control inside each drawer, closes it and gives the focus back to its tab
      for (const which of ['tools', 'tutor']) {
        await setOpen(app, which, true);
        const inside = await app.evalJs(`(() => { const p = document.querySelector(${J(PANEL[which])}); const c = p && [...p.querySelectorAll('button, [tabindex="0"], textarea, input')].find((el) => el.getBoundingClientRect().width > 0 && !el.disabled);
          if (!c) return null; c.focus(); return document.activeElement === c ? (c.getAttribute('aria-label') || c.textContent || c.tagName).trim().slice(0, 30) : null; })()`);
        await escape(app); await sleep(450);
        const after = await app.evalJs(`({ open: ${OPEN[which]}, onTab: document.activeElement === document.querySelector(${J(TAB[which])}), at: document.activeElement ? (document.activeElement.className || document.activeElement.tagName) : null })`);
        ok(`${tag} 5 (${which === 'tools' ? 'Tools' : 'Tutor'}): Esc pressed inside the open drawer (on "${inside}") closes it, and the focus returns to its tab`,
          !!inside && after.open === false && after.onTab === true, J({ inside, after }));
      }
      if (w === 1366) {
        // 5b: an Esc on the PAGE closes the Tools drawer but never takes the page's focus
        await setOpen(app, 'tools', true);
        await app.evalJs("document.querySelector('.forward-only-editor')?.focus()");
        const onPage = await app.evalJs("!!document.activeElement && !!document.activeElement.closest('.forward-only-editor')");
        await escape(app); await sleep(450);
        const after = await app.evalJs(`({ open: ${OPEN.tools}, onPage: !!document.activeElement && !!document.activeElement.closest('.forward-only-editor') })`);
        ok(`${tag} 5b: an Esc pressed on the PAGE closes the Tools drawer and the focus STAYS on the page (the page is primary)`, onPage && after.open === false && after.onPage === true, J({ onPage, after }));
        await setOpen(app, 'tools', false);
      }

      // mutants: Arbor, 1366
      if (th.id === 'plateau' && w === 1366) {
        await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
        // M1: the Tutor tab pushed 32px left while its drawer is open
        await style(app, 'dm-m1', ".desk-frame-stage:has(.wz-tutor-panel[data-open='true']) .wz-tutor-grip{ transform: translateX(-32px) !important; }");
        const m0 = await app.evalJs(GEO); await press(app, 'tutor'); const m1 = await app.evalJs(GEO);
        await press(app, 'tutor'); await style(app, 'dm-m1', null);
        ok(`MI1 (mutant): with the Tutor tab pushed left while open (LANDED: ${m0 && m1 && m0.tTab && m1.tTab ? Math.round(m0.tTab.left - m1.tTab.left) : '?'}px), 1 fails`,
          !!m0 && !!m1 && m1.tOpen && m0.tTab && m1.tTab && m0.tTab.left - m1.tTab.left >= 30 && !pred1(m0, m1, 'tutor'), J({ m0: m0 && m0.tTab, m1: m1 && m1.tTab }));
        // M2: the Tutor panel pushed 40px off the page
        await style(app, 'dm-m2', ".wz-tutor-panel[data-open='true']{ transform: translateX(40px) !important; }");
        await press(app, 'tutor'); const m2 = await app.evalJs(GEO); await press(app, 'tutor'); await style(app, 'dm-m2', null);
        ok(`MI2 (mutant): with the Tutor panel pushed 40px off the page (LANDED: panel at ${m2 && m2.tPanel ? m2.tPanel.left : '?'}, page at ${m2 && m2.page ? m2.page.right : '?'}), 2 fails`,
          !!m2 && m2.tOpen && !!m2.tPanel && !!m2.page && m2.tPanel.left - m2.page.right >= 38 && !pred2(m2, 'tutor'), J({ page: m2 && m2.page, tab: m2 && m2.tTab, panel: m2 && m2.tPanel }));
        // M4: the page nudged while the Tutor is open
        await style(app, 'dm-m4', ".desk-frame-stage--prose:has(.wz-tutor-panel[data-open='true']) .mode-page{ translate: 24px 0 !important; }");
        const n0 = await app.evalJs(GEO); await press(app, 'tutor'); const n1 = await app.evalJs(GEO); await press(app, 'tutor'); await style(app, 'dm-m4', null);
        ok(`MI4 (mutant): with the page nudged 24px while the Tutor is open (LANDED: ${n0 && n1 && n0.page && n1.page ? Math.round(n1.page.left - n0.page.left) : '?'}px), 4 fails`,
          !!n0 && !!n1 && n1.tOpen && n0.page && n1.page && n1.page.left - n0.page.left >= 20 && !pred4([n0, n1]), J({ before: n0 && n0.page, open: n1 && n1.page }));
        // M5: Escape swallowed before the app sees it (a window capture listener; it counts)
        await setOpen(app, 'tutor', true);
        await app.evalJs("(() => { window.__dmEsc = 0; window.__dmEscMut = (e) => { if (e.key === 'Escape') { window.__dmEsc += 1; e.stopImmediatePropagation(); e.stopPropagation(); } }; window.addEventListener('keydown', window.__dmEscMut, true); document.querySelector('.wz-tutor-panel button')?.focus(); return true; })()");
        await escape(app); await sleep(450);
        const m5 = await app.evalJs(`(() => { window.removeEventListener('keydown', window.__dmEscMut, true); return { swallowed: window.__dmEsc, open: ${OPEN.tutor}, onTab: document.activeElement === document.querySelector('.wz-tutor-grip') }; })()`);
        ok(`MI5 (mutant): with Escape swallowed before the app sees it (LANDED: ${m5 && m5.swallowed} swallowed), the drawer stays open - 5 fails`, !!m5 && m5.swallowed >= 1 && m5.open === true && !m5.onTab, J(m5));
        await setOpen(app, 'tutor', false);
      }
    }

    // (3), the else-branch: in the zoom at 1366 the 1.6x page leaves under 200px a side - opening the Tutor after the Tools closes the Tools
    await app.emulateDpr(1, 1366, 768);
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', 'on')`);
    if (await openPage(app, id)) {
      const z0 = await app.evalJs(GEO);
      const zl = z0 && z0.page && z0.stage ? z0.page.left - z0.stage.left : null; const zr = z0 && z0.page && z0.stage ? z0.stage.right - z0.page.right : null;
      await setOpen(app, 'tools', true); const zs = await app.evalJs(GEO);
      await press(app, 'tutor'); const zt = await app.evalJs(GEO);
      ok(`${th.name} 1366x768 zoomed 3: there is NO room for both (${Math.round(zl)} / ${Math.round(zr)}px beside the 1.6x page, < ${DRAWER_MIN}), so opening the Tutor after the Tools CLOSES the Tools`,
        !!z0 && z0.zoom && zl != null && (zl < DRAWER_MIN || zr < DRAWER_MIN) && !!zs && zs.sOpen && !!zt && zt.tOpen && !zt.sOpen, J({ zl, zr, toolsOpened: zs && zs.sOpen, after: zt && { sOpen: zt.sOpen, tOpen: zt.tOpen } }));
      ok(`${th.name} 1366x768 zoomed 1 (Tutor): in the zoom too the tab's rect is unchanged by opening its drawer (it rides the painted page's edge)`, !!zs && !!zt && pred1(zs, zt, 'tutor'),
        J({ shut: zs && zs.tTab, open: zt && zt.tTab }));
      await setOpen(app, 'tutor', false);
    } else ok(`${th.name} 1366x768 zoomed fixture: the page opened`, false, '');
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${id}', 'off')`);
  }

  // (7) reduced motion, Arbor at 1366: the first read after the press already shows the drawer at rest, at its final rect
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')"); await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams (reduced motion)' });
  await app.emulateDpr(1, 1366, 768);
  const firstRead = (which) => `(() => { const l = document.querySelector(${J(SLIDE[which])}); const p = document.querySelector(${J(PANEL[which])}); if (!l || !p) return null; const cs = getComputedStyle(l); const r = p.getBoundingClientRect();
    return { transform: cs.transform, transition: cs.transitionDuration, panelLeft: Math.round(r.left), panelWidth: Math.round(r.width), open: p.getAttribute('data-open') ?? document.querySelector('.wz-sliver')?.getAttribute('data-open') }; })()`;
  const quickPress = async (which) => { const p = await tabPoint(app, which); if (!p) return null; await click(app, p.x, p.y); return app.evalJs(firstRead(which)); };
  for (const reduce of [true, false]) {
    await app.emulateMedia(reduce ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : []);
    if (!(await openPage(app, pid('plateau')))) { ok(`7 fixture (${reduce ? 'reduced' : 'full'} motion): the page opened`, false, ''); continue; }
    await setOpen(app, 'tutor', false); await setOpen(app, 'tools', false);
    const rd = {};
    for (const which of ['tools', 'tutor']) {
      const first = await quickPress(which); await sleep(900); const rest = await app.evalJs(firstRead(which));
      rd[which] = { first, rest };
      await setOpen(app, which, false); await sleep(400);
    }
    const noTravel = (o) => !!o.first && !!o.rest && o.first.transform === 'none' && Math.max(...String(o.first.transition).split(',').map((d) => parseFloat(d) * (/ms$/.test(d.trim()) ? 0.001 : 1) || 0)) <= 0.001 && o.first.panelLeft === o.rest.panelLeft && o.first.panelWidth === o.rest.panelWidth;
    if (reduce) {
      ok('7 (Tools, reduced motion): the drawer arrives with NO travel - on the first read after the press its sliding layer is untransformed and untransitioned, and the panel is already at its final rect',
        noTravel(rd.tools), J(rd.tools));
      ok('7 (Tutor, reduced motion): the drawer arrives with NO travel - on the first read after the press its sliding layer is untransformed and untransitioned, and the panel is already at its final rect',
        noTravel(rd.tutor), J(rd.tutor));
    } else {
      ok('MI7 (mutant / instrument): WITHOUT reduced motion the same first read sees TRAVEL - the sliding layer still transformed or transitioning - so 7 can see motion at all',
        !!rd.tutor.first && !!rd.tools.first && !noTravel(rd.tutor) && !noTravel(rd.tools), J(rd));
    }
  }
  await app.emulateMedia([]);

  // CD: the Cascade docks on a ZOOMED page where the painted page leaves room on its left; refused below the floor (the control)
  const dockAt = async (w, h) => {
    await app.emulateDpr(1, w, h);
    await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${pid('plateau')}', 'on')`);
    if (!(await openPage(app, pid('plateau')))) return null;
    const g = await app.evalJs(GEO);
    await app.evalJs("document.querySelector('.wz-strip-item[data-category=journal]')?.click()"); await sleep(200);
    await app.evalJs("document.querySelector('.wz-cascade-link')?.click()"); await sleep(250);
    const survey = await app.evalJs("!!document.querySelector('.wz-cascade-survey')");
    await app.evalJs("document.querySelector('.wz-cascade-dock-btn')?.click()"); await sleep(300);
    const docked = await app.evalJs("document.querySelector('.wz-cascade-survey')?.dataset.docked ?? null");
    await escape(app); await sleep(300);
    return { zoom: g && g.zoom, roomL: g && g.page && g.stage ? Math.round(g.page.left - g.stage.left) : null, survey, docked };
  };
  const cdRoom = await dockAt(1366, 768);
  ok('CD: on a ZOOMED page at 1366 the painted page leaves 120px+ on its left, and the Cascade\'s survey DOCKS there (its floor reads the painted page, not the stage-wide column)',
    !!cdRoom && cdRoom.zoom && cdRoom.roomL >= 120 && cdRoom.survey && cdRoom.docked === 'true', J(cdRoom));
  const cdTight = await dockAt(1100, 900);
  ok('CD (control): on a ZOOMED page at 1100 the painted page leaves under 120px, and the dock is REFUSED (the survey closes instead) - the floor still bites',
    !!cdTight && cdTight.zoom && cdTight.roomL != null && cdTight.roomL < 120 && cdTight.survey && cdTight.docked !== 'true', J(cdTight));
  await app.evalJs(`localStorage.setItem('wrizo-typewriter-page-${pid('plateau')}', 'off')`);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 600)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') console.log('\nDRAWER-MIRROR PARKED: PASS (0 records) - a new file; it parks nothing of its own');
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nDRAWER-MIRROR VERIFY: PASS (${checks.length} checks)` : `\nDRAWER-MIRROR VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
