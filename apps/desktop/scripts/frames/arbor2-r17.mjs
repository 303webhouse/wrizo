// ARBOR v2 MOCKUP, ROUND r17 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r17.mjs).
// Source: Fable, Nov 2, after Nick tested r16: 1. rebase onto current main (done: arbor/mockup-r17; Sprout was deleted from live in #12j); 2. the
// Room control right beside Page in the Themes menu (it stays in Mood too); 3. the font-size box between - and + (whole numbers 6-72; Enter or
// blur applies; a bad value reverts; default 11; the same scope as -/+); 4. the tabs unchanged. The checks live in mockup-kit.mjs (shared with
// the Machina mockup). Each THROWS with its numbers when it fails ("ARBOR-R17 <screen> {...}"). Written red-first: run against r16 rebased
// (6bbe5c91) before the r17 build. Seeds go through window.wrizo*.
import { themeRoomCheck, sizeBoxCheck, guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ED = '.forward-only-editor';
const WORDS = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim().toLowerCase() === ${JSON.stringify(text.toLowerCase())}); if (b) b.click(); return !!b; })()`);
const say = (name, data) => console.log(`ARBOR-R17 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R17-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const load = async (app, hash) => {
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1' + ${JSON.stringify(hash)})`);
  await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 25000 });
};
const page = async (app, id, mode) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  await load(app, '#/page/' + id);
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'page' });
  await sleep(1000);
  if (mode) { await clickText(app, '.desk-mode-tab', mode); await sleep(1000); }
  await app.evalJs(`document.querySelector('${ED}')?.blur(); getSelection()?.removeAllRanges()`);
};
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { a.finish(); } catch {} }); return true; })()";
// the cloths' colours (unchanged) as computed colours, to find in a band's box-shadow
const CLOTH = { 'wz-sliver-tab-format': 'rgb(86, 99, 46)', 'wz-sliver-tab-presets': 'rgb(127, 160, 188)', 'wz-sliver-tab-ink': 'rgb(168, 57, 47)',
  'wz-tutor-tab-tutor': 'rgb(86, 99, 46)', 'wz-tutor-tab-links': 'rgb(127, 160, 188)', 'wz-tutor-tab-board': 'rgb(168, 57, 47)' };
const C2 = `(() => { const q = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height }; };
  const L = document.querySelector('.arbor2-c2--left'), R = document.querySelector('.arbor2-c2--right');
  const tabs = (c) => c ? [...c.querySelectorAll('.wz-drawer-tab')].map((t) => { const cs = getComputedStyle(t); return { id: t.id, on: t.getAttribute('data-on') === 'true', r: q(t), wm: cs.writingMode, deco: cs.textDecorationLine, decoC: cs.textDecorationColor, z: Number(cs.zIndex) || 0 }; }) : [];
  const shown = (c) => !!c && getComputedStyle(c).visibility === 'visible' && Number(getComputedStyle(c).opacity) > 0.9;
  const ls = document.querySelector('.wz-sliver-panel > .wz-drawer-slide'), rs = document.querySelector('.wz-tutor-panel > .wz-drawer-slide');
  return { left: tabs(L), right: tabs(R), lShown: shown(L), rShown: shown(R), lFilter: L ? getComputedStyle(L).filter : null, rFilter: R ? getComputedStyle(R).filter : null,
    lBand: ls ? getComputedStyle(ls).boxShadow : '', rBand: rs ? getComputedStyle(rs).boxShadow : '', ls: q(ls), rs: q(rs), lt: q(document.querySelector('.wz-sliver-grip')), rt: q(document.querySelector('.wz-tutor-grip')) }; })()`;
// r17-tabs' successor reads each tab's fill and word colour too (the open tab is filled brass with a walnut word)
const C2B = C2.replace("wm: cs.writingMode,", "wm: cs.writingMode, bg: cs.backgroundColor, fg: cs.color,");
if (C2B === C2) throw new Error('C2B did not take');
const BRASS = 'rgb(255, 152, 0)', WALNUT = 'rgb(43, 29, 18)';
// the 3 px brass band: across the Tools drawer's top edge, down the Tutor drawer's right edge
const band3 = (shadow, side) => (side === 'top' ? /rgb\(255, 152, 0\) 0px 3px 0px( 0px)? inset/ : /rgb\(255, 152, 0\) -3px 0px 0px( 0px)? inset/).test(String(shadow || ''));
// a page written before (seeded while the flag is off: born unflagged, no size) reads 12; a page born now through the Write door reads 11
const BOXV = "(() => { const i = document.querySelector('.wz-sliver-panel input.wz-type-num'); return i ? i.value : null; })()";
const newPageCheck = async (app, name) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id: 'arbor-r17-old', text: WORDS, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await sleep(300);
  const flagAtSeed = await app.evalJs("/[?&]arbor2=1/.test(location.search)");
  await load(app, '#/page/arbor-r17-old'); await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'old page' }); await sleep(900);
  await clickText(app, '.desk-mode-tab', 'Draft'); await sleep(900);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(700);
  const old = await app.evalJs(BOXV);
  await load(app, '#/'); await sleep(500);
  const wrote = await app.evalJs("(() => { const b = document.querySelector('.wz-arrival-write'); if (b) b.click(); return !!b; })()");
  await waitSoft(app, `!!document.querySelector('${ED}')`, { label: 'the new page', timeout: 8000 }); await sleep(900);
  await app.evalJs(`document.querySelector('${ED}')?.focus()`); await app.type('A'); await sleep(1200);
  await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await app.evalJs(FINISH); await sleep(700);
  const fresh = await app.evalJs(BOXV);
  const ok = { seededUnflagged: !flagAtSeed, oldKeeps12: old === '12', newIs11: wrote && fresh === '11' };
  if (Object.values(ok).some((x) => !x)) fail(name, { ok, old, fresh, wrote, route: await app.evalJs('location.hash') });
  say(name.toLowerCase(), { ok, old, fresh });
};
const openMood = (app) => app.evalJs("(() => { const m = [...document.querySelectorAll('.arbor2-bar-head')].find((h) => /^Mood/.test(h.textContent.trim()) && h.getAttribute('aria-expanded') !== 'true'); if (m) m.click(); return true; })()");

// (Fable, Nov 2, all lanes: a check that throws, crashes or prints no verdict is RED - the kit's verdict guard wraps every screen here)
export default guarded({
  // ── THE ROOM BESIDE PAGE in the Themes menu: Arbor's words, Day / Night / By the clock move the room at once, the Mood menu's row agrees
  // (amendment before any green: the Wrizors' note md5 a17aae25, gated by Fable, sets the words "Room: Light · Dark · By the clock" and takes
  // the row out of the Mood menu. Original: words By the clock / Day / Night, the Mood row agreeing.)
  'r17-theme-room': async (app) => {
    await page(app, 'arbor-r17-room');
    await openMood(app); await sleep(300);
    const mood = await app.evalJs("({ open: !!document.querySelector('.arbor2-mood'), roomRow: !!document.querySelector('.arbor2-mood .arbor2-room-row, .arbor2-mood [data-room-opt]') })");
    if (!mood.open || mood.roomRow) fail('R17-THEME-ROOM', { mood, note: 'the Room row must leave the Mood menu' });
    await themeRoomCheck(app, { name: 'R17-THEME-ROOM', say, fail, label: 'Room', words: [['day', 'Light'], ['night', 'Dark'], ['clock', 'By the clock']],
      roomAttr: 'data-arbor2-room', roomOf: { day: 'day', night: 'night' }, otherRow: null });
  },
  // ── NEW PAGES START AT 11 PT; pages already written keep their size (the Wrizors' note): a page written before (seeded without the flag) reads
  // 12 in the box; a page born now through the Write door reads 11
  'r17-new-page': async (app) => { await newPageCheck(app, 'R17-NEW-PAGE'); },
  // ── NICK'S C2 FOLDER TABS (spec draft 23 §9c): the measures, the open tab's band and brass word, the gap under the opener, the shadow, Grafts
  // turning the band blue, the tabs gone with a closed drawer, and the openers exactly as built
  // PARKED 2026-11-02 (SUPERSEDED by the Wrizors' note CORRECTED 11:10 pm Nov 2 (md5 fc26efc3) and Fable's relay of Nick's Nov 1 rule, "Just have the tab turn brass when it's active": the open folder tab is FILLED brass #FF9800 with its word in walnut #2B1D12, joined to a 3 px brass band; no underline). Kept verbatim under the name r17-tabs-v1 (not in the run list); SUCCESSOR r17-tabs below.
  'r17-tabs-v1': async (app) => {
    await page(app, 'arbor-r17-tabs', 'Draft');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(150); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await app.evalJs(FINISH); await sleep(700); await app.evalJs(FINISH);
    const a = await app.evalJs(C2);
    await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(300); await app.evalJs(FINISH);
    const g = await app.evalJs(C2);
    await app.evalJs("document.querySelector('#wz-tutor-tab-tutor')?.click()");
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(150); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await app.evalJs(FINISH); await sleep(700); await app.evalJs(FINISH);
    const shut = await app.evalJs(C2);
    const near = (x, y, t = 1) => x != null && y != null && Math.abs(x - y) <= t;
    const L = a.left, R = a.right, lo = L.find((t) => t.on), ro = R.find((t) => t.on);
    const seq = (arr, f) => arr.slice(1).every((t, i) => f(arr[i], t));
    const shadow = (f) => { const m = String(f || '').match(/drop-shadow\(.*?\)\s*(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/) || String(f || '').match(/drop-shadow\((-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/); return m ? m.slice(1, 4).map(Number) : null; };
    const sh = [shadow(a.lFilter), shadow(a.rFilter)];
    const ok = {
      toolsShape: L.length >= 2 && !!lo && L.every((t) => near(t.r.w, 96) && near(t.r.h, t.on ? 30 : 25)),
      toolsOnEdge: L.every((t) => near(t.r.b, a.ls.t)) && seq(L, (p, n) => near(n.r.l, p.r.r - 12)) && L.every((t) => t.r.l >= a.ls.l - 0.5),
      toolsOpenFront: !!lo && L.every((t) => t.on || t.z < lo.z) && /underline/.test(lo.deco) && /255,\s*152,\s*0/.test(lo.decoC) && a.lBand.includes(CLOTH[lo.id]),
      tutorShape: R.length === 3 && !!ro && R.every((t) => near(t.r.w, t.on ? 30 : 25) && near(t.r.h, 98) && /vertical-rl/.test(t.wm)),
      tutorOffEdge: R.every((t) => near(t.r.l, a.rs.r)) && R[0].r.t >= a.rt.b + 12 - 0.5 && seq(R, (p, n) => near(n.r.t, p.r.b - 10)),
      tutorOpenFront: !!ro && R.every((t) => t.on || t.z < ro.z) && /underline/.test(ro.deco) && /255,\s*152,\s*0/.test(ro.decoC) && a.rBand.includes(CLOTH[ro.id]),
      clearOfOpeners: L.every((t) => t.r.b <= a.lt.t + 0.5) && R.every((t) => t.r.t >= a.rt.b),
      shadow: sh.every((s) => !!s && Math.abs(s[0]) <= 2 && Math.abs(s[1]) <= 2 && s[2] <= 3),
      graftsBlue: g.right.find((t) => t.on)?.id === 'wz-tutor-tab-links' && g.rBand.includes(CLOTH['wz-tutor-tab-links']),
      goneWhenShut: !shut.lShown && !shut.rShown,
      openersAsBuilt: [a.lt, a.rt, shut.lt, shut.rt].every((r) => near(r.w, 16) && near(r.h, 34)),
    };
    const brief = { ok, tools: L.map((t) => [t.id.replace('wz-sliver-tab-', ''), t.on, Math.round(t.r.l), Math.round(t.r.w), Math.round(t.r.h), Math.round(t.r.b)]), slideTop: a.ls && Math.round(a.ls.t),
      tutor: R.map((t) => [t.id.replace('wz-tutor-tab-', ''), t.on, Math.round(t.r.t), Math.round(t.r.w), Math.round(t.r.h), Math.round(t.r.l)]), slideRight: a.rs && Math.round(a.rs.r), openerFoot: a.rt && Math.round(a.rt.b),
      bands: [a.lBand, a.rBand, g.rBand], shadow: sh };
    if (Object.values(ok).some((x) => !x)) fail('R17-TABS', brief);
    say('r17-tabs', brief);
  },
  'r17-tabs': async (app) => {
    await page(app, 'arbor-r17-tabs', 'Draft');
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(150); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await app.evalJs(FINISH); await sleep(700); await app.evalJs(FINISH);
    const a = await app.evalJs(C2B);
    await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(300); await app.evalJs(FINISH);
    const g = await app.evalJs(C2B);
    await app.evalJs("document.querySelector('#wz-tutor-tab-tutor')?.click()");
    await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(150); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()");
    await app.evalJs(FINISH); await sleep(700); await app.evalJs(FINISH);
    const shut = await app.evalJs(C2B);
    const near = (x, y, t = 1) => x != null && y != null && Math.abs(x - y) <= t;
    const L = a.left, R = a.right, lo = L.find((t) => t.on), ro = R.find((t) => t.on);
    const seq = (arr, f) => arr.slice(1).every((t, i) => f(arr[i], t));
    const shadow = (f) => { const m = String(f || '').match(/drop-shadow\(.*?\)\s*(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/) || String(f || '').match(/drop-shadow\((-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/); return m ? m.slice(1, 4).map(Number) : null; };
    const sh = [shadow(a.lFilter), shadow(a.rFilter)];
    const ok = {
      toolsShape: L.length >= 2 && !!lo && L.every((t) => near(t.r.w, 96) && near(t.r.h, t.on ? 30 : 25)),
      toolsOnEdge: L.every((t) => near(t.r.b, a.ls.t)) && seq(L, (p, n) => near(n.r.l, p.r.r - 12)) && L.every((t) => t.r.l >= a.ls.l - 0.5),
      // (SUCCESSOR, the brass tab: the open tab filled brass with a walnut word, no underline, joined to a 3 px brass band; the others in their cloths)
      toolsOpenFront: !!lo && L.every((t) => t.on || t.z < lo.z) && lo.bg === BRASS && lo.fg === WALNUT && !/underline/.test(lo.deco) && band3(a.lBand, 'top'),
      toolsBehindInCloth: L.filter((t) => !t.on).every((t) => t.bg === CLOTH[t.id]),
      tutorShape: R.length === 3 && !!ro && R.every((t) => near(t.r.w, t.on ? 30 : 25) && near(t.r.h, 98) && /vertical-rl/.test(t.wm)),
      tutorOffEdge: R.every((t) => near(t.r.l, a.rs.r)) && R[0].r.t >= a.rt.b + 12 - 0.5 && seq(R, (p, n) => near(n.r.t, p.r.b - 10)),
      tutorOpenFront: !!ro && R.every((t) => t.on || t.z < ro.z) && ro.bg === BRASS && ro.fg === WALNUT && !/underline/.test(ro.deco) && band3(a.rBand, 'right'),
      tutorBehindInCloth: R.filter((t) => !t.on).every((t) => t.bg === CLOTH[t.id]),
      clearOfOpeners: L.every((t) => t.r.b <= a.lt.t + 0.5) && R.every((t) => t.r.t >= a.rt.b),
      shadow: sh.every((s) => !!s && Math.abs(s[0]) <= 2 && Math.abs(s[1]) <= 2 && s[2] <= 3),
      // GRAFTS open: GRAFTS turns brass, TUTOR back to olive, the band stays brass (the note's frame list)
      graftsBrass: g.right.find((t) => t.on)?.id === 'wz-tutor-tab-links' && g.right.find((t) => t.on)?.bg === BRASS && g.right.find((t) => t.id === 'wz-tutor-tab-tutor')?.bg === CLOTH['wz-tutor-tab-tutor'] && band3(g.rBand, 'right'),
      goneWhenShut: !shut.lShown && !shut.rShown,
      openersAsBuilt: [a.lt, a.rt, shut.lt, shut.rt].every((r) => near(r.w, 16) && near(r.h, 34)),
    };
    const brief = { ok, tools: L.map((t) => [t.id.replace('wz-sliver-tab-', ''), t.on, Math.round(t.r.l), Math.round(t.r.w), Math.round(t.r.h), Math.round(t.r.b)]), slideTop: a.ls && Math.round(a.ls.t),
      tutor: R.map((t) => [t.id.replace('wz-tutor-tab-', ''), t.on, Math.round(t.r.t), Math.round(t.r.w), Math.round(t.r.h), Math.round(t.r.l)]), slideRight: a.rs && Math.round(a.rs.r), openerFoot: a.rt && Math.round(a.rt.b),
      bands: [a.lBand, a.rBand, g.rBand], shadow: sh, fills: [...L, ...R, ...g.right].map((t) => [t.id.replace(/wz-(sliver|tutor)-tab-/, ''), t.on, t.bg, t.fg, t.deco]) };
    if (Object.values(ok).some((x) => !x)) fail('R17-TABS', brief);
    say('r17-tabs', brief);
  },
  // ── THE SIZE BOX between - and +: on Free Write's strip (it had none) and in Draft's drawer, where highlighted words size alone
  'r17-size-freewrite': async (app) => { await page(app, 'arbor-r17-size-fw', null); await sizeBoxCheck(app, { name: 'R17-SIZE-FREEWRITE', say, fail }); },
  'r17-size-draft': async (app) => { await page(app, 'arbor-r17-size-dr', 'Draft'); await sizeBoxCheck(app, { name: 'R17-SIZE-DRAFT', say, fail, selection: true }); },
  // ── PICTURES for the Wrizors: the Themes menu with the Room row; the Tools drawer's size box on Free Write and in Draft
  'r17-pic-themes': async (app) => { await page(app, 'arbor-r17-pic'); await app.evalJs("document.querySelector(\".wz-strip-item[data-category='theme']\")?.click()"); await sleep(800); },
  'r17-pic-size-freewrite': async (app) => { await page(app, 'arbor-r17-pic-fw', null); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); },
  'r17-pic-size-draft': async (app) => { await page(app, 'arbor-r17-pic-dr', 'Draft'); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(900); },
  'r17-pic-tabs': async (app) => { await page(app, 'arbor-r17-pic-t', 'Draft'); await app.evalJs("document.querySelector('.wz-sliver-grip')?.click()"); await sleep(150); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(900); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); })()"); },
  'r17-pic-grafts': async (app) => { await page(app, 'arbor-r17-pic-g', 'Draft'); await app.evalJs("document.querySelector('.wz-tutor-grip')?.click()"); await sleep(600); await app.evalJs("document.querySelector('#wz-tutor-tab-links')?.click()"); await sleep(600); await app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); })()"); },
}, { verdict: ["ARBOR-R17"] });
