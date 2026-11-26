// #136 - MACHINA'S LIGHT BOARD: THE EMPTY BOARD'S STARTERS CAN BE READ (Fable, Nov 25: New Card / Presets / Attach Docs drawn very faint; words 4.5:1, icons 3:1).
// The starters are drawn at 40% opacity (19-beginnings.css), and bg2.mjs reads the colour alone, so it never saw what the eye sees. Here each starter's colour is laid over the Board's own
// ground AT ITS OPACITY (every ancestor's too), and the contrast is read from that. At rest, the pointer away.
// Machina (the live redesign): the page tone (light, dark) x the room (Day, Night) x the cast (cool, neutral). A LIGHT BOARD is one whose ground is light; only those are judged:
//   W  every starter's words reach 4.5:1        I  every starter's icon reaches 3:1
//   P  premise: at least one light Board was read, with its three starters
//   MUT the judge goes RED on 40% of a mid colour on a light ground
// Arbor and Flux (light and dark page) are READ AND PRINTED, never judged.
// Run: node scripts/harness/board-starters-contrast.mjs (from apps/desktop; Actions or the box).
process.env.WS_ARBOR2 = 'default';
process.env.WS_MACHINA2 = 'default';
const { withHarness } = await import('../runtime-verify.mjs');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => { checks.push({ name, pass: !!pass }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${detail ? '  ' + String(detail).slice(0, 700) : ''}`); };
const J = (v) => JSON.stringify(v);

const lum = ([r, g, b]) => { const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100; };
const over = (fg, alpha, bg) => fg.map((v, i) => v * alpha + bg[i] * (1 - alpha));

// per starter: its label's and icon's colour (with alpha), the opacity product up the tree, and the ground (the first ancestor that paints one)
const READ = `(() => {
  const rgba = (c) => { const m = String(c).match(/-?[\\d.]+(e-?\\d+)?/g); if (!m) return null; const n = m.map(Number); const srgb = /^color\\(srgb/.test(String(c)); const k = srgb ? 255 : 1; return [n[0] * k, n[1] * k, n[2] * k, n.length > 3 ? n[3] : 1]; };
  return [...document.querySelectorAll('.wz-beginnings[data-beginnings="board"] .wz-beginning')].map((b) => {
    const label = b.querySelector('.wz-beginning-label'), glyph = b.querySelector('.wz-beginning-glyph svg');
    let op = 1; for (let e = label; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    let bg = null, from = null, image = null;
    for (let e = b.parentElement; e; e = e.parentElement) { const cs = getComputedStyle(e); const c = rgba(cs.backgroundColor); if (!image && cs.backgroundImage !== 'none') image = String(e.className).split(' ')[0]; if (c && c[3] > 0.99) { bg = c.slice(0, 3); from = String(e.className || e.tagName).split(' ')[0]; break; } }
    const mark = glyph && glyph.querySelector('path, rect, circle, line, polyline');
    const ms = mark ? getComputedStyle(mark) : null;
    const icon = ms && ms.stroke !== 'none' ? rgba(ms.stroke) : ms && ms.fill !== 'none' ? rgba(ms.fill) : rgba(getComputedStyle(label).color);
    return { word: label.textContent, color: rgba(getComputedStyle(label).color), icon, op: Math.round(op * 1000) / 1000, bg: bg || [255, 255, 255], from, image };
  });
})()`;
const judge = (s) => ({ word: s.word, words: ratio(over(s.color.slice(0, 3), s.op * s.color[3], s.bg), s.bg), icon: ratio(over(s.icon.slice(0, 3), s.op * s.icon[3], s.bg), s.bg), op: s.op });
const lightGround = (bg) => lum(bg) > 0.4;

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const soft = async (expr, timeout = 15000) => { try { await app.waitFor(expr, { label: expr.slice(0, 60), timeout }); return true; } catch { return false; } };
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); true");
  await app.reload();
  await app.waitFor("typeof window.wrizoCreateJournalPage === 'function'", { label: 'the seams', timeout: 20000 });
  await ev(`window.wrizoCreateJournalPage(${J({ id: 'bsc-board', text: 'Board', pageType: 'board', boxes: [], createdAt: new Date().toISOString(), origin: null })}); window.wrizoFlushNow(); true`);

  const arms = [];
  for (const page of ['light', 'dark']) for (const room of ['light', 'dark']) for (const cast of ['cool', 'neutral']) arms.push({ theme: 'machina', page, room, cast });
  for (const theme of ['plateau', 'flux']) for (const page of ['light', 'dark']) arms.push({ theme, page, room: null, cast: null });
  let lightBoards = 0;
  for (const arm of arms) {
    const tag = arm.theme === 'machina' ? `machina page ${arm.page} room ${arm.room} ${arm.cast}` : `${arm.theme} page ${arm.page}`;
    await ev("location.hash = '#/'; true"); await sleep(250);
    await ev(`localStorage.setItem('wrizo-theme', ${J(arm.theme)}); localStorage.setItem('wrizo-theme-prefs', JSON.stringify({ voice: 'serif', page: ${J(arm.page)}, fade: 'on' })); history.replaceState(null, '', '/#/'); true`);
    await app.reload();
    await soft("!document.querySelector('.wz-splash')");
    if (arm.room) await ev(`document.documentElement.setAttribute('data-room', ${J(arm.room)}); document.documentElement.setAttribute('data-cast', ${J(arm.cast)}); true`);
    await ev("location.hash = '#/page/bsc-board'; true");
    const up = await soft("document.querySelectorAll('.wz-beginnings[data-beginnings=\"board\"] .wz-beginning').length > 0", 10000);
    await app.mouseMove(4, 4);
    await sleep(700);
    const read = up ? await ev(READ) : [];
    const at = await ev("({ theme: document.documentElement.getAttribute('data-theme'), page: document.documentElement.getAttribute('data-page'), room: document.documentElement.getAttribute('data-machina2-room') })");
    const got = read.map(judge);
    const light = read.length > 0 && lightGround(read[0].bg);
    const detail = J({ at, light, bg: read[0] && read[0].bg.map(Math.round), from: read[0] && read[0].from, image: read[0] && read[0].image, starters: got });
    if (arm.theme !== 'machina' || !light) { console.log(`INFO ${tag}: ${detail}`); continue; }
    lightBoards += 1;
    ok(`W ${tag}: every starter's words reach 4.5:1 on this light Board`, got.length >= 3 && got.every((g) => g.words >= 4.5), detail);
    ok(`I ${tag}: every starter's icon reaches 3:1 on this light Board`, got.length >= 3 && got.every((g) => g.icon >= 3), detail);
  }
  ok(`P (premise): light Machina Boards were read (${lightBoards})`, lightBoards >= 1);
  ok('MUT: the judge goes RED on 40% of a mid colour over a light ground', judge({ word: 'x', color: [63, 97, 131, 1], icon: [63, 97, 131, 1], op: 0.4, bg: [233, 234, 235] }).words < 4.5 && judge({ word: 'x', color: [40, 40, 40, 1], icon: [40, 40, 40, 1], op: 1, bg: [233, 234, 235] }).words >= 4.5);
}); } catch (e) { console.log('HARNESS ERROR', e && e.stack || e); ok('HARNESS ' + String(e && e.message || e).slice(0, 300), false); }

const bad = checks.filter((c) => !c.pass).length;
if (process.env.HARNESS_PARKED === '1') console.log('\nBOARD-STARTERS-CONTRAST PARKED: PASS (0 records) - a new file; it parks nothing of its own');
console.log(bad ? `\nBOARD-STARTERS-CONTRAST VERIFY: FAIL - ${bad}/${checks.length} failed` : `\nBOARD-STARTERS-CONTRAST VERIFY: PASS (${checks.length} checks)`);
process.exit(bad ? 1 : 0);
