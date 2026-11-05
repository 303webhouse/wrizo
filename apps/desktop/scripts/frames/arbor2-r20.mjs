// ARBOR v2 MOCKUP, ROUND r20 - as named screens for INK's frames job (-f themes=plateau -f screens_file=apps/desktop/scripts/frames/arbor2-r20.mjs).
// Sources: Fable, Nov 4 (rulings on r19): 2. the vines - Arbor's drawing derives the extra stems and branch levels (~10 / 3) from the SAME seed, the
// shared growth plan untouched; 3. snap both logo drawing boxes to whole pixels (r19's 1920 hand-over offset); checks for Clear / Undo / the kept
// laps under the vines. The Wrizors' r19 review (wrizors-to-ARBOR-nov4d.md md5 2f312b28): the night bars must MEASURE Nick's solid #241912 (top bar
// and rail; they read #1F150C / #19100A - r19-bars read the computed colour, blind to the night dim's opacity). And main's splash law, met while
// rebasing (Splash.tsx: "a writer who opens Wrizo and immediately types must not have that first character eaten"): r19's skip consumed the key -
// right on the front door (no page), wrong over a page, where the key must land.
// Every check THROWS with its numbers when it fails and prints them when it passes ("ARBOR-R20 <screen> {...}"). Written red-first (r20 base 61baa507).
import { guarded } from './mockup-kit.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitSoft = async (app, expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
const say = (name, data) => console.log(`ARBOR-R20 ${name} ${JSON.stringify(data)}`);
const fail = (name, data) => { console.log(`ARBOR-R20-FAIL ${name} ${JSON.stringify(data)}`); throw new Error(`${name} FAILED ${JSON.stringify(data)}`.slice(0, 1200)); };
const FINISH = "(() => { document.getAnimations().forEach((a) => { try { if (a.effect && Number.isFinite(a.effect.getComputedTiming().endTime)) a.finish(); } catch {} }); return true; })()";
const PAGEW = 'The morning light came in low across the table, and she began to write. The kettle ticked as it cooled, and outside a dog asked the street a question nobody answered.';
const words = (n) => Array.from({ length: n }, (_, i) => ['light', 'kettle', 'street', 'table', 'question', 'morning', 'dog', 'answer'][i % 8]).join(' ');
const seedPage = async (app, id, { text = PAGEW, progress = 'words', style = 'bar', goal = null } = {}) => {
  await app.evalJs(`window.wrizoCreateJournalPage(${JSON.stringify({ id, text, createdAt: '2026-04-01T00:00:00.000Z', origin: 'loose', source: 'page' })})`);
  await app.evalJs(`localStorage.setItem('wrizo-writing-settings', JSON.stringify({ ...JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'), progress: ${JSON.stringify(progress)}, progressStyle: ${JSON.stringify(style)} }))`);
  if (goal) await app.evalJs(`window.wrizoSetWritingGoal(${JSON.stringify(goal)})`);
  await sleep(300);
};
const openPage = async (app, id, opts = {}) => {
  await seedPage(app, id, opts);
  await app.evalJs(`history.replaceState(null, '', '/?arbor2=1#/page/${id}')`); await app.reload();
  await waitSoft(app, "document.documentElement.getAttribute('data-arbor2') === 'true'", { label: 'flag', timeout: 15000 });
  await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 20000 });
  await waitSoft(app, "!!document.querySelector('.forward-only-editor')", { label: 'page' }); await sleep(900);
  await app.evalJs("(() => { const b = [...document.querySelectorAll('.desk-mode-tab')].find((x) => (x.textContent || '').trim().toLowerCase() === 'draft'); if (b) b.click(); return !!b; })()"); await sleep(900);
  await app.evalJs("document.querySelector('.forward-only-editor')?.blur(); getSelection()?.removeAllRanges()");
};
const setRoom = async (app, room) => { await app.evalJs(`document.documentElement.setAttribute('data-room', ${JSON.stringify(room === 'day' ? 'light' : 'dark')})`); await sleep(700); };
const caretEnd = "(() => { const e = document.querySelector('.forward-only-editor'); if (!e) return false; e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; })()";
const typeKeys = async (app, text) => { await app.evalJs(caretEnd); for (const ch of text) { await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: ch }); await sleep(40); } };
const clickSel = (app, sel) => app.evalJs(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (b) b.click(); return !!b; })()`);
const clickText = (app, sel, text) => app.evalJs(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => (x.textContent || '').trim() === ${JSON.stringify(text)}); if (b) b.click(); return !!b; })()`);
// colour arithmetic
const parseRgb = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const over = (top, a, base) => ({ r: base.r + (top.r - base.r) * a, g: base.g + (top.g - base.g) * a, b: base.b + (top.b - base.b) * a, a: 1 });

// what the vines' heads say (level, start, width, ratio), and how many pieces show, in this lap and the kept ones
const VINES = `(() => { const f = document.querySelector('.wz-rhizome-field'); if (!f) return null; const num = (v, k) => Number(v.getAttribute(k));
  const heads = [...f.querySelectorAll('.arbor2-vines > path.arbor2-vine[data-w0]')].map((v) => ({ level: num(v, 'data-level'), x0: num(v, 'data-x0'), y0: num(v, 'data-y0'), w0: num(v, 'data-w0'), ratio: v.hasAttribute('data-ratio') ? num(v, 'data-ratio') : null, under: v.getAttribute('data-under') === 'true', derived: v.getAttribute('data-derived') === 'true' }));
  const past = f.querySelector('.arbor2-vines-past');
  return { vines: f.getAttribute('data-vines'), flash: f.getAttribute('data-flash'), lap: f.getAttribute('data-lap'), n: f.querySelectorAll('.arbor2-vines > path.arbor2-vine').length,
    pastN: past ? past.querySelectorAll('path.arbor2-vine').length : 0, pastOp: past ? Number(getComputedStyle(past).opacity) : null, heads,
    sig: heads.map((h) => [h.level, Math.round(h.x0), Math.round(h.y0), Math.round(h.w0 * 100)].join(':')).join('|') }; })()`;

const screens = {
  // ── the night bars measure solid #241912 (the Wrizors, r19 review) ─────────────────────────────────────────────────────────────────────────
  'r20-night-bars': async (app) => {
    await openPage(app, 'arbor-r20-bars');
    await setRoom(app, 'night'); await sleep(800); await app.evalJs("document.activeElement?.blur(); window.dispatchEvent(new MouseEvent('mousemove', { clientX: 683, clientY: 400 }))"); await sleep(400);
    const r = await app.evalJs(`(() => { const op = (e) => { let o = 1; for (let n = e; n && n !== document.documentElement; n = n.parentElement) o *= Number(getComputedStyle(n).opacity); return Math.round(o * 1000) / 1000; };
      const bar = [...document.querySelectorAll('.chrome-top.sprint-nav')].find((b) => b.getBoundingClientRect().height > 0), strip = document.querySelector('.desk-frame-strip');
      const lab = (root) => root ? [...root.querySelectorAll('button, a, span, .wz-strip-label')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && e.getBoundingClientRect().width > 0).slice(0, 24).map((e) => [e.textContent.trim().slice(0, 14), getComputedStyle(e).color, op(e)]) : [];
      return { bar: bar && { bg: getComputedStyle(bar).backgroundColor, op: op(bar), line: getComputedStyle(bar).borderBottomColor }, strip: strip && { bg: getComputedStyle(strip).backgroundColor, op: op(strip) }, labels: [...lab(bar), ...lab(strip)], room: document.documentElement.getAttribute('data-arbor2-room') }; })()`);
    const want = 'rgb(36, 25, 18)', ground = { r: 36, g: 25, b: 18, a: 1 };
    const painted = (x) => !!x && x.bg === want && x.op === 1;
    const worst = r.labels.map(([t, c, o]) => { const p = parseRgb(c); return [t, p ? ratio(over(p, (p.a ?? 1) * o, ground), ground) : 0, o]; }).sort((a, b) => a[1] - b[1])[0];
    const ok = { night: r.room === 'night', barSolid: painted(r.bar), railSolid: painted(r.strip), labelsHold: !!worst && worst[1] >= 4.5 };
    if (Object.values(ok).some((x) => !x)) fail('R20-NIGHT-BARS', { ok, r: { bar: r.bar, strip: r.strip }, worst });
    say('r20-night-bars', { ok, bar: r.bar, strip: r.strip, worst });
  },

  // ── a key typed during the splash over a PAGE lands in the page (main's splash law); the front door's skip stays (r19-front-skip) ──────────────
  'r20-splash-key-through': async (app) => {
    await seedPage(app, 'arbor-r20-key', { text: 'Before the splash' });
    await app.evalJs("localStorage.removeItem('wrizo-splash-hold'); localStorage.removeItem('wrizo-splash-force-not-ready')");
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/page/arbor-r20-key')"); await app.reload();
    const splash = await waitSoft(app, "!!document.querySelector('.wz-splash') && !!document.querySelector('.forward-only-editor')", { label: 'splash over the page', timeout: 8000 });
    await sleep(500);
    await typeKeys(app, 'Q');
    await sleep(600);
    const r = await app.evalJs("({ splash: !!document.querySelector('.wz-splash'), text: (document.querySelector('.forward-only-editor')?.textContent || '').trim(), route: location.hash })");
    await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50')").catch(() => {});
    const ok = { splashWasUp: splash, keyLanded: /Q$/.test(r.text), stayedOnPage: /arbor-r20-key/.test(r.route) };
    if (Object.values(ok).some((x) => !x)) fail('R20-SPLASH-KEY-THROUGH', { ok, r });
    say('r20-splash-key-through', { ok, r });
  },

  // ── both logo drawing boxes on whole pixels (r19's 1920 hand-over offset) ──────────────────────────────────────────────────────────────────
  'r20-logo-snap': async (app) => {
    await app.evalJs("localStorage.setItem('wrizo-splash-hold', '9000'); localStorage.setItem('wrizo-splash-force-not-ready', '1')");
    await app.evalJs("history.replaceState(null, '', '/?arbor2=1#/')"); await app.reload();
    await waitSoft(app, "document.querySelector('.wz-splash .arbor2-top-logo')?.getAttribute('data-writing') === 'still' || !!document.querySelector('.wz-splash .arbor2-top-logo[data-writing]')", { label: 'splash logo', timeout: 9000 });
    await waitSoft(app, "!!(window.wrizoArborFront && window.wrizoArborFront.logoStart && performance.now() > window.wrizoArborFront.logoStart)", { label: 'logo due', timeout: 9000 });
    const R = "(() => { const e = document.querySelector(SEL); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; })()";
    const sp = await app.evalJs(R.replace('SEL', JSON.stringify('.wz-splash .arbor2-top-logo')));
    await app.evalJs("localStorage.setItem('wrizo-splash-hold', '50'); localStorage.removeItem('wrizo-splash-force-not-ready')");
    await waitSoft(app, "!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); await sleep(500);
    const fr = await app.evalJs(R.replace('SEL', JSON.stringify('.arbor2-front-mark .arbor2-top-logo')));
    const whole = (r) => !!r && Math.abs(r.l - Math.round(r.l)) < 0.01 && Math.abs(r.t - Math.round(r.t)) < 0.01;
    const ok = { splashWhole: whole(sp), frontWhole: whole(fr), same: !!sp && !!fr && Math.abs(sp.l - fr.l) < 0.01 && Math.abs(sp.t - fr.t) < 0.01 && Math.abs(sp.w - fr.w) < 0.01 };
    if (Object.values(ok).some((x) => !x)) fail('R20-LOGO-SNAP', { ok, sp, fr });
    say('r20-logo-snap', { ok, sp, fr });
  },

  // ── the vines' full growth: ~10 main stems from the page's centre and three levels, derived from the same seed (Fable's ruling 2) ─────────────
  'r20-vines-full': async (app) => {
    await openPage(app, 'arbor-r20-full', { text: words(52), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
    await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH);
    const a = await app.evalJs(VINES);
    // the same seed draws the same vines: away to the Desk and back (the same session)
    await app.evalJs("location.hash = '#/'"); await sleep(900); await app.evalJs("location.hash = '#/page/arbor-r20-full'");
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field .arbor2-vine')", { label: 'vines again', timeout: 6000 }); await sleep(900); await app.evalJs(FINISH);
    const b = await app.evalJs(VINES);
    const main = (v) => v.heads.filter((h) => h.level === 0);
    const lv = (v, n) => v.heads.filter((h) => h.level === n);
    const ok = {
      drawn: !!a && a.vines === 'true' && a.n > 0,
      tenStems: !!a && main(a).length >= 9 && main(a).length <= 12,
      threeLevels: !!a && lv(a, 1).length > 0 && lv(a, 2).length > 0,
      levelTwoRule: !!a && lv(a, 2).every((h) => h.w0 <= 4.2 + 1e-6 && h.ratio != null && h.ratio <= 0.8 + 1e-6 && (h.w0 >= 4.2 - 1e-6 || h.ratio >= 0.55 - 1e-6)),
      sameSeed: !!a && !!b && a.sig.length > 0 && a.sig === b.sig,
      fromCentre: !!a && main(a).every((h) => h.w0 >= 9 - 1e-6 && h.w0 <= 11 + 1e-6),
    };
    const brief = { ok, main: a && main(a).length, l1: a && lv(a, 1).length, l2: a && lv(a, 2).length, derived: a && a.heads.filter((h) => h.derived).length, l2s: a && lv(a, 2).slice(0, 6), same: !!a && !!b && a.sig === b.sig };
    if (Object.values(ok).some((x) => !x)) fail('R20-VINES-FULL', brief);
    say('r20-vines-full', brief);
  },

  // ── the rhizome's life under the vines: the kept laps (at ~40%, kept on revisit), Clear Rhizome and Undo (Fable's ruling 3) ──────────────────
  'r20-rhizome-life': async (app) => {
    await openPage(app, 'arbor-r20-life', { text: words(58), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } });
    await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(6500);
    await typeKeys(app, ' w w');
    await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'false' && document.querySelector('.wz-rhizome-field')?.dataset.lap === '1'", { label: 'the lap kept', timeout: 9000 });
    await typeKeys(app, ' w'); await sleep(1500); await app.evalJs(FINISH);
    const kept = await app.evalJs(VINES);
    await app.evalJs("location.hash = '#/'"); await sleep(900); await app.evalJs("location.hash = '#/page/arbor-r20-life'");
    await waitSoft(app, "!!document.querySelector('.wz-rhizome-field .arbor2-vine')", { label: 'vines again', timeout: 6000 }); await sleep(900);
    await typeKeys(app, ' w'); await sleep(1500); await app.evalJs(FINISH);
    const back = await app.evalJs(VINES);
    await clickText(app, '.arbor2-bar-head', 'Mood ▸'); await sleep(250);
    const cleared = await clickSel(app, '.arbor2-rhizome-clear'); await sleep(600); await app.evalJs(FINISH);
    const afterClear = await app.evalJs(VINES);
    const undone = await clickSel(app, '.arbor2-rhizome-undo'); await sleep(600); await app.evalJs(FINISH);
    const afterUndo = await app.evalJs(VINES);
    const ok = {
      keptLap: !!kept && kept.pastN > 0 && Math.abs((kept.pastOp ?? 0) - 0.4) < 0.01,
      keptOnRevisit: !!back && back.pastN === kept.pastN,
      clears: cleared && !!afterClear && afterClear.pastN === 0 && afterClear.n <= 2,
      undoes: undone && !!afterUndo && afterUndo.pastN === kept.pastN && afterUndo.sig === back.sig,
    };
    const brief = { ok, kept: kept && { n: kept.n, pastN: kept.pastN, pastOp: kept.pastOp, lap: kept.lap }, back: back && { n: back.n, pastN: back.pastN }, afterClear: afterClear && { n: afterClear.n, pastN: afterClear.pastN }, afterUndo: afterUndo && { n: afterUndo.n, pastN: afterUndo.pastN }, cleared, undone };
    if (Object.values(ok).some((x) => !x)) fail('R20-RHIZOME-LIFE', brief);
    say('r20-rhizome-life', brief);
  },
};

// the Wrizors' frames for the vines' full growth: by day, by night, mid-flash
const hideBar = (app) => app.evalJs("(() => { const s = document.createElement('style'); s.textContent = '.arbor2-bar{ visibility:hidden !important; }'; document.head.appendChild(s); return true; })()");
Object.assign(screens, {
  'r20-pic-vines-day': async (app) => { await openPage(app, 'arbor-r20-p1', { text: words(52), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(7000); await app.evalJs(FINISH); await hideBar(app); },
  'r20-pic-vines-night': async (app) => { await openPage(app, 'arbor-r20-p2', { text: words(52), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'night'); await typeKeys(app, ' w'); await sleep(2500); await app.evalJs(FINISH); await hideBar(app); },
  'r20-pic-vines-flash': async (app) => { await openPage(app, 'arbor-r20-p3', { text: words(58), progress: 'words', style: 'rhizome', goal: { n: 60, unit: 'words' } }); await setRoom(app, 'day'); await typeKeys(app, ' w'); await sleep(6500); await typeKeys(app, ' w'); await waitSoft(app, "document.querySelector('.wz-rhizome-field')?.dataset.flash === 'true'", { label: 'flash', timeout: 4000 }); await app.evalJs(FINISH); await hideBar(app); },
  'r20-pic-night-bars': async (app) => { await openPage(app, 'arbor-r20-p4'); await setRoom(app, 'night'); await sleep(600); await hideBar(app); },
});

export default guarded(screens, { verdict: ['ARBOR-R20'] });
