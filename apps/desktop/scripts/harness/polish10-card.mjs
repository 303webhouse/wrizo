// POLISH #10, FIX item 16 (Nick, Oct 25: "the Tools/Tutor drawers are flush + mirrored on CARD surfaces too"; docs: Downloads/polish-10-brief.md):
// drawer-mirror's checks 1-5 + 7, on the CARD surface - an opened card (BoardCardPopup) and its Styling dock, which is the card's Tools drawer
// (a grip on the card's left edge, the dock beyond it). The card is the paper here; it has no Tutor side (a card is not a writing surface to ask about).
// RED-FIRST, on main @ db8dcc00: C2 is the expected red (item 159 left the grip 2px OFF the card's edge, `right:calc(100% + 2px)`: not flush) and C5 (Esc
// inside the dock closes the whole card, not the dock). C1/C4/C7 may already hold - a green on main is a finding, not a failure.
//
// Arbor, Flux, Machina, at 1366x768 and 1920x1080, one text card opened on a board:
//   C1  the grip's rect is unchanged by the dock's open and close - only its arrow flips
//   C2  flush: the open dock's page-side edge is the card's edge - grip.right on card.left (within 1px), dock.right on grip.left (within 1px)
//   C3  both-or-one: n/a - a card has no second drawer (stated, not tested)
//   C4  the card's rect is unchanged through every open and close
//   C5  PARKED VERBATIM (Fable, Oct 28: Esc closes the whole card - ruled): Esc inside the dock closes the dock, focus to the grip. Successor C5s states the ruling: Esc closes the card
//   C7  reduced motion: the dock arrives with no travel - on the first read after the press it is at its final rect and no transform animates
// Mutants (Arbor, 1366), each asserted to have LANDED: MC1 the grip pushed 32px left while the dock is open - C1 fails; MC2 the dock pushed 40px off the
// grip - C2 fails; MC4 the card nudged 24px while the dock is open - C4 fails; MC5 Escape swallowed before the app sees it - C5s fails.
// Seeding goes through the app's seams. Needs a box turn. Run: WS_BOX_TURN=<token> node scripts/harness/polish10-card.mjs (apps/desktop, dist-web built)
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const J = (v) => JSON.stringify(v);
const mouse = (app, type, x, y) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse' });
const click = async (app, x, y) => { await app.mouseMove(x, y); await mouse(app, 'mousePressed', x, y); await mouse(app, 'mouseReleased', x, y); };
const escape = async (app) => {
  const p = { key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 };
  await app.cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...p }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', ...p });
};
const c5Park = [];   // the park record: each skin x size's C5 observation
const THEMES = [{ id: 'plateau', name: 'Arbor' }, { id: 'flux', name: 'Flux' }, { id: 'machina', name: 'Machina' }];
const SIZES = [[1366, 768], [1920, 1080]];
const TOL = 1;
const near = (a, b, t = TOL) => a != null && b != null && Math.abs(a - b) <= t;
const bid = (theme) => `p10-card-${theme}`;
const WORDS = 'The rope was already there, and the well took the bucket back colder still.';

const GEO = `(() => { const R = (s) => { const el = document.querySelector(s); if (!el) return null; const b = el.getBoundingClientRect();
    return b.width || b.height ? { left: Math.round(b.left * 10) / 10, right: Math.round(b.right * 10) / 10, top: Math.round(b.top * 10) / 10, width: Math.round(b.width * 10) / 10, height: Math.round(b.height * 10) / 10 } : null; };
  const grip = document.querySelector('.board-popup-dock-grip');
  return { card: R('.board-popup'), grip: R('.board-popup-dock-grip'), dock: R('.board-popup-dock'), arrow: (document.querySelector('.board-popup-dock-grip-glyph')?.textContent || '').trim(),
    open: grip ? grip.getAttribute('aria-expanded') === 'true' : null, popup: !!document.querySelector('.board-popup'), focus: document.activeElement === grip ? 'grip' : (document.activeElement?.closest?.('.board-popup-dock') ? 'dock' : (document.activeElement?.className || document.activeElement?.tagName || null)) }; })()`;
const sameRect = (a, b) => !!a && !!b && near(a.left, b.left, 0.5) && near(a.top, b.top, 0.5) && near(a.width, b.width, 0.5) && near(a.height, b.height, 0.5);
const gripPoint = (app) => app.evalJs(`(() => { const b = document.querySelector('.board-popup-dock-grip'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
const pressGrip = async (app) => { const p = await gripPoint(app); if (!p) return false; await click(app, p.x, p.y); await sleep(450); return true; };
const setDock = async (app, want) => { if ((await app.evalJs(GEO))?.open !== want) await pressGrip(app); return (await app.evalJs(GEO))?.open === want; };
const style = (app, id, css) => app.evalJs(css == null
  ? `(() => { document.getElementById(${J(id)})?.remove(); return true; })()`
  : `(() => { let s = document.getElementById(${J(id)}); if (!s) { s = document.createElement('style'); s.id = ${J(id)}; document.head.appendChild(s); } s.textContent = ${J(css)}; return true; })()`);

const openCard = async (app, id) => {
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.evalJs(`location.hash = '#/page/${id}'`);
  if (!(await waitSoft(app, "!!document.querySelector('[data-box-id=\"c1\"]') && !!document.querySelector('.desk-frame-stage')", { label: id, timeout: 10000 }))) return false;
  await sleep(900);
  await app.evalJs(`(() => { const el = document.querySelector('[data-box-id="c1"]'); const r = el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); })()`);
  const there = await waitSoft(app, "!!document.querySelector('.board-popup-editor') && !!document.querySelector('.board-popup-dock-grip')", { label: 'card popup', timeout: 6000 });
  await sleep(500);
  return there;
};

await withHarness(async (app) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
  const now = new Date().toISOString();
  for (const th of THEMES) await app.evalJs(`window.wrizoCreateJournalPage(${J({ id: bid(th.id), text: 'Card board', pageType: 'board', projectId: null, createdAt: now, origin: null, source: null, boxes: [{ id: 'c1', kind: 'text', x: 0.3, y: 0.25, w: 0.4, h: 0.2, z: 1, text: WORDS }] })})`);
  await app.evalJs('window.wrizoFlushNow()'); await sleep(400);
  ok('fixture: per skin, a board with one text card, through the seams', true);

  for (const th of THEMES) {
    for (const [w, h] of SIZES) {
      const tag = `${th.name} ${w}x${h}`;
      await app.evalJs("location.hash = '#/'"); await sleep(300);
      await app.emulateDpr(1, w, h);
      await app.evalJs(`localStorage.setItem('wrizo-theme', '${th.id}')`); await app.reload();
      await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams' });
      if (!(await openCard(app, bid(th.id)))) { ok(`${tag} fixture: the card opened with its Styling grip`, false, ''); continue; }
      const shut = await app.evalJs(GEO);
      await setDock(app, true); const open = await app.evalJs(GEO);
      await setDock(app, false); const shut2 = await app.evalJs(GEO);
      ok(`${tag} C1: the grip's rect is unchanged by the dock's open and close - only its arrow flips (${shut.arrow} / ${open.arrow})`,
        sameRect(shut.grip, open.grip) && sameRect(shut.grip, shut2.grip) && shut.arrow !== open.arrow && open.open === true, J({ shut: shut.grip, open: open.grip, shut2: shut2.grip, arrows: [shut.arrow, open.arrow] }));
      const gapShut = shut.card && shut.grip ? Math.round((shut.card.left - shut.grip.right) * 10) / 10 : null;
      const gapDock = open.grip && open.dock ? Math.round((open.grip.left - open.dock.right) * 10) / 10 : null;
      const gapGrip = open.card && open.grip ? Math.round((open.card.left - open.grip.right) * 10) / 10 : null;
      ok(`${tag} C2: flush - the grip meets the card's edge (gap ${gapGrip}px) and the open dock meets the grip (gap ${gapDock}px)`,
        !!open.dock && gapGrip != null && gapGrip >= -TOL && gapGrip <= TOL && near(open.dock.right, open.grip.left), J({ card: open.card, grip: open.grip, dock: open.dock, gapShut }));
      ok(`${tag} C4: the card's rect is unchanged through the dock's open and close`, sameRect(shut.card, open.card) && sameRect(shut.card, shut2.card), J({ shut: shut.card, open: open.card, shut2: shut2.card }));
      // C5: PARKED VERBATIM (Fable, Oct 28): Esc closes the whole card - that is ruled (fx4 S5: Esc and the backdrop close the pop-up), so the card's dock does not take
      // the Esc first. Kept as written and no longer run; its successor follows (C5s: the ruled behaviour, stated).
      //   focus on a control inside the dock, then Esc:
      //   ok(`${tag} C5: Esc inside the dock closes the dock, focus returns to the grip, the card stays open (...)`, inside.focus === 'dock' && afterEsc.popup && afterEsc.open === false && afterEsc.focus === 'grip', ...);
      await setDock(app, true);
      await app.evalJs("(() => { document.querySelector('.board-popup-dock .board-popup-tool')?.focus(); return true; })()");
      const inside = await app.evalJs(GEO);
      await escape(app); await sleep(500);
      const afterEsc = await app.evalJs(GEO);
      c5Park.push({ tag, popup: afterEsc.popup });
      ok(`${tag} C5s (successor): Esc pressed with focus inside the dock closes the whole card, as ruled (focus before: ${inside.focus}; after: card ${afterEsc.popup ? 'STILL OPEN' : 'closed'})`,
        inside.focus === 'dock' && afterEsc.popup === false, J({ inside: inside.focus, afterEsc }));

      if (th.id === 'plateau' && w === 1366) {
        // the mutants, each asserted to have landed, on the open dock
        if (!afterEsc.popup) await openCard(app, bid(th.id));
        await setDock(app, true);
        const base = await app.evalJs(GEO);
        await style(app, 'p10c-mc1', ".board-popup:has(.board-popup-dock) .board-popup-dock-grip{ right:calc(100% + 33px) !important; }"); await sleep(200);
        const m1 = await app.evalJs(GEO); await style(app, 'p10c-mc1', null);
        ok(`MC1 (mutant): with the grip pushed 32px left while the dock is open (LANDED: moved ${m1.grip && base.grip ? Math.round(base.grip.left - m1.grip.left) : null}px), C1 fails`, !!m1.grip && !!base.grip && Math.round(base.grip.left - m1.grip.left) === 32 && !sameRect(base.grip, m1.grip), J({ base: base.grip, m1: m1.grip }));
        await style(app, 'p10c-mc2', ".board-popup-dock{ right:calc(100% + 62px) !important; }"); await sleep(200);
        const m2 = await app.evalJs(GEO); await style(app, 'p10c-mc2', null);
        ok(`MC2 (mutant): with the dock pushed 40px off the grip (LANDED: gap ${m2.grip && m2.dock ? Math.round(m2.grip.left - m2.dock.right) : null}px), C2 fails`, !!m2.dock && !!m2.grip && !near(m2.dock.right, m2.grip.left), J({ grip: m2.grip, dock: m2.dock }));
        await style(app, 'p10c-mc4', ".board-popup:has(.board-popup-dock){ transform:translateX(24px) !important; }"); await sleep(200);
        const m4 = await app.evalJs(GEO); await style(app, 'p10c-mc4', null);
        ok(`MC4 (mutant): with the card nudged 24px while the dock is open (LANDED: ${m4.card && base.card ? Math.round(m4.card.left - base.card.left) : null}px), C4 fails`, !!m4.card && !!base.card && !sameRect(base.card, m4.card), J({ base: base.card, m4: m4.card }));
        await app.evalJs("window.__p10cSwallow = (e) => { if (e.key === 'Escape') e.stopImmediatePropagation(); }; window.addEventListener('keydown', window.__p10cSwallow, true); (document.querySelector('.board-popup-dock .board-popup-tool'))?.focus(); true");
        await escape(app); await sleep(500);
        const m5 = await app.evalJs(GEO);
        await app.evalJs("window.removeEventListener('keydown', window.__p10cSwallow, true); true");
        ok(`MC5 (mutant): with Escape swallowed before the app sees it (LANDED: card still ${m5.popup ? 'open' : 'closed'}), C5s fails`, m5.popup && m5.open === true, J(m5));
      }
    }
  }

  // C7: reduced motion, Arbor at 1366 - the first read after the press: the dock at its final rect, no transform animating
  await app.evalJs("location.hash = '#/'"); await sleep(300);
  await app.emulateDpr(1, 1366, 768);
  await app.evalJs("localStorage.setItem('wrizo-theme', 'plateau')"); await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams (reduced motion)' });
  await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (!(await openCard(app, bid('plateau')))) ok('C7 fixture (reduced motion): the card opened', false, '');
  else {
    await setDock(app, false);
    const p = await gripPoint(app);
    await app.evalJs("window.__p10cFirst = null; document.addEventListener('click', () => { requestAnimationFrame(() => { const d = document.querySelector('.board-popup-dock'); const cs = d && getComputedStyle(d); const r = d && d.getBoundingClientRect(); window.__p10cFirst = d ? { anims: d.getAnimations().length, transition: cs.transitionDuration, left: r.left, right: r.right } : null; }); }, { capture: true, once: true }); true");
    await click(app, p.x, p.y); await sleep(600);
    const first = await app.evalJs('window.__p10cFirst'); const fin = await app.evalJs(GEO);
    ok(`C7 (reduced motion): the dock arrives with NO travel - on the first frame after the press it runs no animation and sits at its final rect (${first && first.anims} animations, transition ${first && first.transition})`,
      !!first && first.anims === 0 && !!fin.dock && near(first.left, fin.dock.left, 0.5) && near(first.right, fin.dock.right, 0.5), J({ first, fin: fin.dock }));
  }
  await app.emulateMedia([]);
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 1200)}]` : ''}`);
if (process.env.HARNESS_PARKED === '1') {
  // C5, parked (Fable, Oct 28): one record per skin and size, under its original name; each re-verifies the ruled truth - Esc closes the whole card
  const rec = c5Park.map((o) => ({ name: `PARKED (was "${o.tag} C5: Esc inside the dock closes the dock, focus returns to the grip, the card stays open") - Fable's ruling (Oct 28): Esc closes the whole card`, pass: o.popup === false, detail: J(o) }));
  for (const c of rec) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}  [${c.detail}]`);
  console.log(rec.length && rec.every((c) => c.pass) ? `\nPOLISH10-CARD PARKED: PASS (${rec.length} records) - this FILE parks 1 (C5, one record per skin x size)` : `\nPOLISH10-CARD PARKED: FAIL - ${rec.filter((c) => !c.pass).length}/${rec.length} (${rec.length} records)`);
}
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nPOLISH10-CARD VERIFY: PASS (${checks.length} checks)` : `\nPOLISH10-CARD VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
