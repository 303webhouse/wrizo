// BUG 32d - THE "FIT TO TEXT" ICON (a box turn; Fable, Oct 30, #12b; Nick APPROVED: a small, out-of-the-way ICON, not a menu item). A hand-sized card (sizedByHand) wears one small square button beside its resize grip. In every skin
// (Arbor, Flux, Machina):
//   I1  WHERE      exactly one icon on the board: on the hand-sized card; the auto card and a card nobody touched have none
//   I2  QUIET      invisible at rest; visible while the card is hovered; visible while it holds focus (the pointer far away); a real button that Tab reaches; hidden again in the recede (the host's data-chrome-receded)
//   I3  BESIDE     on the selected card it sits beside the resize grip (left of it, on the bottom edge, not overlapping it)
//   I4  COLOUR     the GUIDANCE colour at rest (the card's --badge-on-card), the HUMAN-ACTION colour (--choice) only while pressed; contrast against the card >= 4.5:1
//   I5  DRESS      square, flat 1 px edge, no shadow
//   I6  WORDS      its tooltip and accessible name come from the lexicon, per theme (Arbor "Fit to text", Flux "Auto-fit", Machina "Fit to content")
//   I7  QUIET SAVE hovering, focusing and pressing-and-leaving it change nothing stored
//   I8  CLICK      a click removes sizedByHand and fits the card to its content (the floors apply): the icon goes, the stored key is gone, the stored height is the fit; the card is then auto
// Run (repo root or apps/desktop; needs a box turn):  node scripts/harness/fit-icon.mjs      FI_FRAMES=<dir> saves a close-up per skin
import fs from 'node:fs';
import path from 'node:path';
const FRAMES = process.env.FI_FRAMES || null;
if (FRAMES) fs.mkdirSync(FRAMES, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const { withHarness } = await import('../runtime-verify.mjs');

const LONG = 'I will read six novels from before and after 1848 closely, count every time word, compare the two halves, and test the counts against the timetables of the period.';
const SEED = [
  { id: 'fi-hand', kind: 'text', x: 0.05, y: 0.08, w: 0.3, h: 0.45, z: 1, text: LONG, sizedByHand: true },
  { id: 'fi-auto', kind: 'text', x: 0.5, y: 0.08, w: 0.3, h: 0.12, z: 2, text: 'An auto card.' },
];
const SKINS = [['plateau', 'Arbor', null, 'Fit to text'], ['flux', 'Flux', null, 'Auto-fit'], ['machina', 'Machina', 'cool', 'Fit to content']];
const STORED = `(() => { const all = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]'); const e = all.find((x) => x.id === 'fi-board'); return e ? (e.boxes || []).map((b) => ({ id: b.id, h: b.h, mark: b.sizedByHand === true, keys: Object.keys(b).sort().join() })) : null; })()`;
const near = (a, b, e = 1e-9) => Math.abs(a - b) < e;
const byId = (list, id) => (list || []).find((b) => b.id === id);
const lum = (rgb) => { const m = rgb.match(/[\d.]+/g).map(Number); const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const rect = (sel) => q(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); return el ? el.getBoundingClientRect().toJSON() : null; })()`);
  const styleOf = (sel) => q(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null; const s = getComputedStyle(el); return { opacity: s.opacity, vis: s.visibility, pe: s.pointerEvents, color: s.color, border: s.borderTopColor, bw: s.borderTopWidth, bg: s.backgroundColor, radius: s.borderTopLeftRadius, shadow: s.boxShadow }; })()`);
  // what a colour token resolves to INSIDE the board canvas (a probe element, so the card's own scoped tokens apply)
  const token = (name) => q(`(() => { const cv = document.querySelector('.board-canvas'); const p = document.createElement('span'); p.style.color = 'var(${name})'; cv.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })()`);
  const far = async () => { await app.mouseMove(4, 4); await sleep(350); };

  for (const [theme, name, cast, word] of SKINS) {
    await app.emulateDpr(1, 1400, 1000);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme.set('${theme}'); ${cast ? `window.wrizoCast && window.wrizoCast.set('${cast}');` : ''} window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: 'light' })`);
    await sleep(400);
    await q(`window.wrizoCreateJournalPage({ id: 'fi-board', text: 'Fit icon', pageType: 'board', boxes: ${JSON.stringify(SEED)}, createdAt: new Date().toISOString(), origin: null }); window.wrizoFlushNow()`);
    await sleep(400);
    await q("location.hash = '#/page/fi-board'");
    await waitSoft("document.querySelectorAll('.board-box[data-kind=text]').length === 2", { label: 'board', timeout: 12000 });
    await waitSoft("document.fonts.status === 'loaded'", { label: 'fonts', timeout: 15000 });
    await sleep(1200);

    // I1
    const owners = await q(`[...document.querySelectorAll('.board-fit')].map((b) => b.closest('.board-box').dataset.boxId)`);
    ok(`I1 [${name}]: exactly one Fit-to-text icon, on the hand-sized card (none on the auto card)`, owners.length === 1 && owners[0] === 'fi-hand', JSON.stringify(owners));

    // I2 - quiet
    await far();
    const rest = await styleOf('.board-fit');
    ok(`I2 [${name}]: invisible at rest`, rest && Number(rest.opacity) === 0, JSON.stringify(rest));
    const card = await rect('.board-box[data-box-id="fi-hand"]');
    await app.mouseMove(Math.round(card.x + card.width / 2), Math.round(card.y + card.height / 2));
    await sleep(450);
    const hov = await styleOf('.board-fit');
    ok(`I2 [${name}]: visible while the card is hovered`, hov && Number(hov.opacity) === 1 && hov.vis === 'visible', JSON.stringify(hov));
    await far();
    await q("document.querySelector('.board-fit').focus()");
    await sleep(450);
    const foc = await styleOf('.board-fit');
    ok(`I2 [${name}]: visible while it holds focus, the pointer far away (keyboard reach)`, foc && Number(foc.opacity) === 1, JSON.stringify(foc));
    await q("document.activeElement && document.activeElement.blur()");
    await q("document.body.focus()");
    let tabbed = false, presses = 0;
    for (; presses < 80 && !tabbed; presses += 1) { await app.key('Tab'); tabbed = await q("!!(document.activeElement && document.activeElement.classList.contains('board-fit'))"); }
    ok(`I2 [${name}]: a real button that Tab reaches`, tabbed && (await q("document.querySelector('.board-fit').tagName")) === 'BUTTON', `${presses} presses`);
    await q("document.activeElement && document.activeElement.blur()");
    // recede: the host's own attribute
    await app.mouseMove(Math.round(card.x + card.width / 2), Math.round(card.y + card.height / 2));
    await sleep(300);
    const inHost = await q("(() => { const h = document.querySelector('.desk-frame-host'); const b = document.querySelector('.board-fit'); return !!(h && b && h.contains(b)); })()");
    await q("document.querySelector('.desk-frame-host').setAttribute('data-chrome-receded', 'true')");
    await sleep(300);
    const rec = await styleOf('.board-fit');
    await q("document.querySelector('.desk-frame-host').setAttribute('data-chrome-receded', 'false')");
    ok(`I2 [${name}]: hidden in the recede (even with the card hovered); the icon lives under the host that carries the attribute`, inHost && rec && Number(rec.opacity) === 0 && rec.vis === 'hidden' && rec.pe === 'none', JSON.stringify({ inHost, rec }));

    // I3 - beside the grip (the card selected so the grip shows)
    await app.mouseDown(Math.round(card.x + card.width / 2), Math.round(card.y + 14)); await app.mouseUp(Math.round(card.x + card.width / 2), Math.round(card.y + 14));
    await sleep(350);
    const fit = await rect('.board-fit'), grip = await rect('.board-handle');
    ok(`I3 [${name}]: it sits beside the resize grip - left of it, on the same bottom edge, not overlapping`, fit && grip && fit.right <= grip.left + 0.5 && Math.abs((fit.y + fit.height / 2) - (grip.y + grip.height / 2)) <= 10 && fit.width >= 14 && fit.width <= 18, JSON.stringify({ fit, grip }));

    // I4 - colour: guidance at rest, human action on press
    const badge = await token('--badge-on-card'), choice = await token('--choice');
    const fx = Math.round(fit.x + fit.width / 2), fy = Math.round(fit.y + fit.height / 2);
    await app.mouseMove(fx, fy); await sleep(400);
    const atRest = await styleOf('.board-fit');
    ok(`I4 [${name}]: the GUIDANCE colour at rest (the card's --badge-on-card)`, atRest.color === badge && atRest.border === badge, JSON.stringify({ atRest, badge }));
    ok(`I4 [${name}]: contrast of the icon against the card >= 4.5:1`, ratio(atRest.color, atRest.bg) >= 4.5, `${ratio(atRest.color, atRest.bg).toFixed(2)} (${atRest.color} on ${atRest.bg})`);
    await app.mouseDown(fx, fy); await sleep(250);
    const pressed = await styleOf('.board-fit');
    await app.mouseMove(4, 4); await app.mouseUp(4, 4); await sleep(300);   // pressed and left: no click
    ok(`I4 [${name}]: the HUMAN-ACTION colour (--choice) only while pressed`, pressed.color === choice && pressed.border === choice && choice !== badge, JSON.stringify({ pressed, choice, badge }));
    ok(`I5 [${name}]: square, a flat 1 px edge, no shadow`, atRest.radius === '0px' && atRest.shadow === 'none' && parseFloat(atRest.bw) >= 1, JSON.stringify(atRest));
    const lab = await q("(() => { const b = document.querySelector('.board-fit'); return { aria: b.getAttribute('aria-label'), title: b.getAttribute('title') }; })()");
    ok(`I6 [${name}]: the tooltip and accessible name come from the lexicon: "${word}"`, lab.aria === word && lab.title === word, JSON.stringify(lab));
    if (FRAMES) {
      await app.mouseMove(fx, fy); await sleep(400);
      const r = await rect('.board-box[data-box-id="fi-hand"]');
      const clip = { x: Math.max(0, r.right - 150), y: Math.max(0, r.bottom - 70), width: 190, height: 110, scale: 3 };
      fs.writeFileSync(path.join(FRAMES, `fit-${name.toLowerCase()}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png', clip })).data, 'base64'));
    }

    // I7 - nothing stored changed by hover / focus / press-and-leave
    await sleep(4500);
    const s0 = await q(STORED);
    const h0 = byId(s0, 'fi-hand');
    ok(`I7 [${name}]: hovering, focusing and pressing-and-leaving the icon change nothing stored (the mark and the height stand)`, h0 && h0.mark && near(h0.h, 0.45) && Object.keys(SEED[0]).sort().join() === h0.keys, JSON.stringify(h0));

    // I8 - click: fits and clears
    const before = await q("window.wrizoBoard().find((b) => b.id === 'fi-hand').h");
    const target = await q(`(() => { const el = document.querySelector('.board-box[data-box-id="fi-hand"] .board-text'); const cv = document.querySelector('.board-canvas'); const W = cv.getBoundingClientRect().width; const keep = el.style.height; el.style.height = 'auto'; const nat = el.offsetHeight; el.style.height = keep; return { fit: Math.max(nat, 0.045 * W) / W, W }; })()`);
    await app.mouseMove(fx, fy); await sleep(300);
    await app.mouseDown(fx, fy); await app.mouseUp(fx, fy);
    await sleep(600);
    const after = await q("window.wrizoBoard().find((b) => b.id === 'fi-hand')");
    ok(`I8 [${name}]: a click fits the card to its content (the floors apply) - was ${before.toFixed(3)}, now the fit`, after && Math.abs(after.h - target.fit) * target.W <= 3 && after.h < before, `${after && after.h} vs ${target.fit} (W ${target.W})`);
    ok(`I8 [${name}]: ... and removes sizedByHand (the key is gone) and the icon with it`, after && !('sizedByHand' in after) && (await q("document.querySelectorAll('.board-fit').length")) === 0, JSON.stringify(after));
    await sleep(4500);
    const s1 = byId(await q(STORED), 'fi-hand');
    ok(`I8 [${name}]: the fit is stored and the stored mark is gone`, s1 && !s1.mark && !s1.keys.includes('sizedByHand') && Math.abs(s1.h - target.fit) * target.W <= 3, JSON.stringify(s1));
  }
}).catch((e) => { ok('harness ran to a verdict', false, String((e && e.stack) || e)); });

const failed = checks.filter((c) => !c.pass);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? '  ' + String(c.detail).slice(0, 420) : ''}`);
console.log(failed.length ? `FIT-ICON VERIFY: FAIL (${failed.length} of ${checks.length})` : `FIT-ICON VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
