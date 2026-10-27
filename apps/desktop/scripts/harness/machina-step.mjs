// MACHINA STEP - THE DOM HALF (a box turn; Fable's brief Oct 24 §3 via the TOOLS #9 handoff; frames m1-m4). W1's Walk in Machina's dress. DRESS ONLY: INK's own Walk checks (geometry, keys, rail states) are theirs and must still pass; this
// file checks only what the dress adds, under Machina, COOL + NEUTRAL x the dark + light page (the chrome stays dark on both).
//   ROW     R1  the readout row above the Block: "AGENDA · <NAME>" left, "BLOCK 01 / 05" right, the hairline chevron boxes at the row's two ends INSIDE the Block's width
//   BLOCK   B1  the Block: the chrome surface (dark on both page tones), a 1px strong hairline, square, no shadow, 26 / 30 padding, 700 wide      B2  the title in Plex Mono 600 (.14em), the writer's words in Plex Sans
//   HELP    H1  the "?" is an 18px hairline box; open = the carrier on its border + text; the box is raised (--ink-800), kicker / sentence / "E.G." + example / "MORE → CONSULTANT" in the carrier
//   DOORS   D1  "Note" as a hairline text button; "← → STEP · ESC PLAN" right-aligned in mono
//   RAIL    N1  one hairline, one notch per Block, numbered 01..05 in mono; empty = a 1px tick, kindled = a 9px filled square (--signal-live), current = a 3x19 bar in the carrier
//   MOTION  M1  nothing in the Step transitions or animates (computed 0s); ArrowRight is a CUT - no leaving card, no transform
//   CARRIER K1  no text at rest is in the carrier colour      FLOOR C1  names >= 7:1, labels >= 4.5:1 on every text, pseudo-elements included
//   PLANS   P1  the Agenda row: the stacked hairline thumbnail (three 16x11 rectangles offset 2px) + "Agenda · n of 5 filled"
//   OTHERS  A1  Arbor and Flux draw none of it (no readout row, no keys hint)
//
// Run (repo root; needs a box turn):  node apps/desktop/scripts/harness/machina-step.mjs      MS_FRAMES=<dir> saves frames
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FRAMES = process.env.MS_FRAMES || null;
const frame = async (app, name) => { if (!FRAMES) return; mkdirSync(FRAMES, { recursive: true }); writeFileSync(join(FRAMES, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };

const boot = async (app, { theme = 'machina', cast = 'cool', page = 'dark' }) => {
  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','${theme}'); localStorage.setItem('wrizo-machina-cast','${cast}');`);
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  try { await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }); } catch { /* the checks record what follows */ }
  await app.evalJs(`window.wrizoTheme.set('${theme}'); window.wrizoCast && window.wrizoCast.set('${cast}'); window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${page}' })`);
  await sleep(500);
  // an unborn Research Paper deck: it deals its 5 Blocks at once and opens in the Step
  await app.evalJs("location.hash = '#/page/new?kind=board&deck=research-paper'");
  await app.waitFor("!!document.querySelector('[data-walk] .walk-card')", { label: 'the Step', timeout: 15000 }).catch(() => {});
  await sleep(900);
};
const key = async (app, k) => { const vk = { Escape: 27, ArrowRight: 39, ArrowLeft: 37 }[k]; await app.cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: vk }); await app.cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k }); };
const R = `const rgb = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c || ''); if (!m) return null; const v = m[1].split(',').map((x) => parseFloat(x)); return { c: v.slice(0, 3), a: v.length > 3 ? v[3] : 1 }; };
  const lum = ([r, g, b]) => { const f = (x) => { const s = x / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
  const ground = (el) => { for (let n = el; n; n = n.parentElement) { const bg = rgb(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.5) return bg.c; } return [0, 0, 0]; };
  const probe = (v) => { const i = document.createElement('i'); i.style.color = 'var(' + v + ')'; document.body.appendChild(i); const c = rgb(getComputedStyle(i).color).c; i.remove(); return c; };`;

const LAYOUT = `(() => { ${R}
  const w = document.querySelector('[data-walk]'); if (!w) return null;
  const frame = w.querySelector('.walk-frame'), row = w.querySelector('.walk-readout'), card = w.querySelector('.walk-card'), ed = card && card.querySelector('.board-popup-editor');
  const prev = w.querySelector('.walk-nav[data-dir="prev"]'), next = w.querySelector('.walk-nav[data-dir="next"]'), doors = w.querySelector('.walk-doors'), keys = w.querySelector('.walk-keys'), help = card && card.querySelector('.board-step-help');
  const b = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const cs = card ? getComputedStyle(card) : null; const surf = probe('--chrome-surface');
  const fl = ed ? getComputedStyle(ed, '::first-line') : null;
  return { row: row ? row.innerText.replace(/\\s+/g, ' ').trim() : null, rowRect: b(row), frameRect: b(frame), cardRect: b(card), prev: b(prev), next: b(next), doorsText: doors ? [...doors.querySelectorAll('.walk-door')].map((d) => d.textContent.trim()) : null, keys: keys ? keys.innerText.trim() : null, keysRect: b(keys), doorRect: b(doors && doors.querySelector('.walk-door')),
    bg: cs ? cs.backgroundColor : null, surf: 'rgb(' + surf.join(', ') + ')', radius: cs && cs.borderRadius, shadow: cs && cs.boxShadow, border: cs && (cs.borderTopWidth + ' ' + cs.borderLeftWidth), pad: cs && (cs.paddingTop + ' ' + cs.paddingLeft),
    titleFont: fl && fl.fontFamily, titleWeight: fl && fl.fontWeight, titleTracking: fl && fl.letterSpacing, edFont: ed && getComputedStyle(ed).fontFamily, help: b(help), helpBorder: help ? getComputedStyle(help).borderTopWidth : null }; })()`;

const SCAN = `(() => { ${R}
  const w = document.querySelector('[data-walk]'); if (!w) return null; const choice = probe('--choice'); const rows = [];
  const NAMES = '.walk-door, .board-popup-editor';
  const add = (el, pseudo) => { const s = getComputedStyle(el, pseudo || null); if (pseudo && (s.content === 'none' || s.content === 'normal' || s.content === '""')) return; const col = rgb(s.color); if (!col) return; rows.push({ cls: String(el.className || el.tagName).slice(0, 30) + (pseudo || ''), kind: !pseudo && el.matches(NAMES) ? 'name' : 'label', ratio: Math.round(ratio(col.c, ground(el)) * 100) / 100, carrier: col.c.join() === choice.join() }); };
  for (const el of w.querySelectorAll('*')) { const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()); if (own) add(el); }
  for (const el of w.querySelectorAll('.walk-mark, .board-popup-editor')) add(el, '::after');
  const motion = [...w.querySelectorAll('*'), w].map((el) => { const s = getComputedStyle(el); return Math.max(...s.transitionDuration.split(',').map((x) => parseFloat(x) || 0), ...s.animationDuration.split(',').map((x) => parseFloat(x) || 0)); });
  return { rows, names: rows.filter((x) => x.kind === 'name'), labels: rows.filter((x) => x.kind === 'label'), carrier: rows.filter((x) => x.carrier).length, minName: rows.filter((x) => x.kind === 'name').reduce((m, x) => Math.min(m, x.ratio), 99), minLabel: rows.filter((x) => x.kind === 'label').reduce((m, x) => Math.min(m, x.ratio), 99), maxMotion: Math.max(...motion) }; })()`;

const RAIL = `(() => { ${R}
  const w = document.querySelector('[data-walk]'); const rail = w && w.querySelector('.walk-rail'); if (!rail) return null; const live = probe('--signal-live'), choice = probe('--choice');
  const rr = rail.getBoundingClientRect(); const line = getComputedStyle(rail, '::before');
  const marks = [...rail.querySelectorAll('.walk-mark')].map((m) => { const s = getComputedStyle(m, '::before'), n = getComputedStyle(m, '::after'); const bg = rgb(s.backgroundColor); return { state: m.dataset.state, kindled: m.dataset.kindled, w: parseFloat(s.width), h: parseFloat(s.height), bg: bg ? bg.c.join() : null, num: n.content.replace(/"/g, ''), numFont: n.fontFamily, x: Math.round(m.getBoundingClientRect().left - rr.left) }; });
  return { n: marks.length, marks, live: live.join(), choice: choice.join(), lineH: line.height, lineBg: line.backgroundColor, railW: Math.round(rr.width) }; })()`;

await withHarness(async (app) => {
  for (const cast of ['cool', 'neutral']) {
    for (const page of ['dark', 'light']) {
      const label = `${cast}/${page}`;
      await boot(app, { cast, page });
      const L = await app.evalJs(LAYOUT);
      ok(`R1 [${label}]: the readout row reads "AGENDA · RESEARCH PAPER (IMRAD)" left and "BLOCK 01 / 05" right, sits above the Block, and the chevron boxes stand at its two ends inside the Block's width`,
        !!L && /^AGENDA · RESEARCH PAPER \(IMRAD\)\s+BLOCK 01 \/ 05$/i.test(L.row || '') && L.rowRect.b <= L.cardRect.t + 8 && Math.abs(L.prev.l - L.frameRect.l) <= 2 && Math.abs(L.next.r - L.frameRect.r) <= 2 && L.prev.t >= L.rowRect.t - 2 && L.next.b <= L.rowRect.b + 2, JSON.stringify(L && { row: L.row, rowRect: L.rowRect, prev: L.prev, next: L.next, frame: L.frameRect }));
      ok(`B1 [${label}]: the Block is the chrome surface (dark on this page tone too), a 1px hairline, square, no shadow, 26 / 30 padding, 700 wide`, !!L && L.bg === L.surf && parseFloat(L.radius) === 0 && L.shadow === 'none' && L.border === '1px 1px' && L.pad === '26px 30px' && L.cardRect.w === 700, JSON.stringify(L && { bg: L.bg, surf: L.surf, radius: L.radius, shadow: L.shadow, border: L.border, pad: L.pad, w: L.cardRect.w }));
      ok(`B2 [${label}]: the title is Plex Mono 600 with .14em tracking; the writer's text is Plex Sans`, !!L && /IBM Plex Mono/.test(L.titleFont || '') && Number(L.titleWeight) >= 600 && parseFloat(L.titleTracking) > 1 && /IBM Plex Sans/.test(L.edFont || ''), JSON.stringify(L && { f: L.titleFont, w: L.titleWeight, t: L.titleTracking, ed: L.edFont }));
      ok(`D1 [${label}]: the door reads "Note" in a hairline box, and "← → STEP · ESC PLAN" sits on the right edge of the Block's width`, !!L && L.doorsText.includes('Note') && /^← → STEP · ESC PLAN$/i.test(L.keys || '') && Math.abs(L.keysRect.r - L.cardRect.r) <= 2, JSON.stringify(L && { doors: L.doorsText, keys: L.keys, keysR: L.keysRect && L.keysRect.r, cardR: L.cardRect.r }));
      ok(`H1a [${label}]: the "?" is an 18px hairline box`, !!L && !!L.help && L.help.w === 18 && L.help.h === 18 && L.helpBorder === '1px', JSON.stringify(L && { help: L.help, border: L.helpBorder }));
      const sc = await app.evalJs(SCAN);
      const rl = await app.evalJs(RAIL);
      await frame(app, `step-${cast}-${page}-fresh`);
      ok(`N1 [${label}]: one hairline, ${rl ? rl.n : '?'} notches numbered 01..05 in mono (a CSS counter, decimal-leading-zero - the computed content is the counter() itself; the digits are seen in the frames), the rail 520 wide; empty notches are 1px ticks, the current one a 3x19 bar in the carrier`,
        !!rl && rl.n === 5 && rl.marks.every((m) => m.num === 'counter(notch, decimal-leading-zero)') && rl.marks.every((m) => /IBM Plex Mono/.test(m.numFont)) && rl.railW === 520 && rl.lineH === '1px' && rl.marks[0].w === 3 && rl.marks[0].h === 19 && rl.marks[0].bg === rl.choice && rl.marks.slice(1).every((m) => m.w === 1 && m.h === 9), JSON.stringify(rl && rl.marks.map((m) => [m.state, m.w, m.h, m.bg])));
      ok(`M1 [${label}]: nothing in the Step transitions or animates (computed 0s)`, !!sc && sc.maxMotion === 0, String(sc && sc.maxMotion));
      ok(`K1 [${label}]: no text at rest is in the carrier colour (${sc ? sc.rows.length : 0} texts, pseudo-elements included)`, !!sc && sc.carrier === 0 && sc.rows.length >= 10, JSON.stringify(sc && { carrier: sc.carrier, n: sc.rows.length }));
      ok(`C1 [${label}]: names >= 7:1 (min ${sc ? sc.minName : '?'}) and labels >= 4.5:1 (min ${sc ? sc.minLabel : '?'}) - ${sc ? sc.names.length : 0} names, ${sc ? sc.labels.length : 0} labels`, !!sc && sc.names.length >= 2 && sc.labels.length >= 8 && sc.minName >= 7 && sc.minLabel >= 4.5, JSON.stringify(sc && { worstName: sc.names.slice().sort((a, b) => a.ratio - b.ratio)[0], worstLabel: sc.labels.slice().sort((a, b) => a.ratio - b.ratio)[0] }));

      // the "?" open (m2)
      await app.evalJs("document.querySelector('.walk-card .board-step-help').click()"); await sleep(400);
      const pop = await app.evalJs(`(() => { ${R} const p = document.querySelector('.board-step-pop'), h = document.querySelector('.walk-card .board-step-help'); if (!p) return null; const cs = getComputedStyle(p), hs = getComputedStyle(h), choice = probe('--choice'); const more = p.querySelector('.board-step-pop-more'), eg = p.querySelector('.board-step-pop-eg'); const fill = probe('--ink-800');
        const bg = rgb(cs.backgroundColor).c.join(); return { text: p.innerText.replace(/\\s+/g, ' ').trim(), bgOk: bg === fill.join(), radius: cs.borderRadius, shadow: cs.boxShadow, border: cs.borderTopWidth, helpBorderOk: rgb(hs.borderTopColor).c.join() === choice.join(), helpTextOk: rgb(hs.color).c.join() === choice.join(), moreOk: rgb(getComputedStyle(more).color).c.join() === choice.join(), egMono: /IBM Plex Mono/.test(getComputedStyle(eg).fontFamily), moreText: more.innerText.replace(/\\s+/g, ' ').trim() }; })()`);
      await frame(app, `step-${cast}-${page}-help`);
      ok(`H1 [${label}]: the "?" open - its border and glyph in the carrier; the box raised (--ink-800), square, a hairline, no shadow; the step's title as the kicker, the sentence, mono "E.G." + example, "MORE → CONSULTANT" in the carrier`,
        !!pop && pop.helpBorderOk && pop.helpTextOk && pop.bgOk && parseFloat(pop.radius) === 0 && pop.shadow === 'none' && pop.border === '1px' && /E\.G\./i.test(pop.text) && pop.egMono && pop.moreOk && /^MORE → CONSULTANT$/i.test(pop.moreText), JSON.stringify(pop));
      await key(app, 'Escape'); await sleep(250);

      // the writer's words: the first Block kindles; ArrowRight is a CUT
      await app.evalJs("(() => { const e = document.querySelector('.walk-card .board-popup-editor'); e.focus(); })()"); await sleep(150);
      await app.cdp('Input.insertText', { text: ' We matched two classes for last term\'s reading scores.' }); await sleep(900);
      const rl2 = await app.evalJs(RAIL);
      await frame(app, `step-${cast}-${page}-writing`);
      ok(`N1 [${label}]: while Block 01 is current its notch stays the carrier bar (current wins over kindled)`, !!rl2 && rl2.marks[0].w === 3 && rl2.marks[0].h === 19 && rl2.marks[0].bg === rl2.choice, JSON.stringify(rl2 && rl2.marks.slice(0, 2).map((m) => [m.state, m.kindled, m.w, m.h, m.bg])));
      // a card with words keeps the caret: step with the chevron (always steps), then check the cut
      await app.evalJs("document.querySelector('.walk-nav[data-dir=\"next\"]').click()");
      const cut = await app.evalJs(`(() => { const w = document.querySelector('[data-walk]'); const card = w.querySelector('.walk-card'); const s = getComputedStyle(card); return { leaving: !!w.querySelector('.walk-card-leaving'), inAttr: card.getAttribute('data-in'), anim: s.animationName, transform: s.transform, row: w.querySelector('.walk-readout-count').innerText.trim() }; })()`);
      await sleep(150);
      const rl3 = await app.evalJs(RAIL);
      ok(`M1 [${label}]: stepping is a CUT - no leaving card, no slide attribute, no animation, no transform - and the readout moves to BLOCK 02 / 05`, !cut.leaving && !cut.inAttr && cut.anim === 'none' && (cut.transform === 'none' || cut.transform === 'matrix(1, 0, 0, 1, 0, 0)') && /BLOCK 02 \/ 05/i.test(cut.row), JSON.stringify(cut));
      ok(`N1 [${label}]: at Block 02 the carrier bar is on notch 02 and notch 01 stays a kindled square`, !!rl3 && rl3.marks[1].w === 3 && rl3.marks[1].bg === rl3.choice && rl3.marks[0].w === 9 && rl3.marks[0].bg === rl3.live, JSON.stringify(rl3 && rl3.marks.slice(0, 3).map((m) => [m.state, m.w, m.h, m.bg])));
      await frame(app, `step-${cast}-${page}-block2`);

      if (page === 'dark') {
        // P1 - the Plans pop-out's Agenda row (the board is born by the first word)
        await app.evalJs('window.wrizoFlushNow && window.wrizoFlushNow()'); await sleep(500);
        await app.evalJs(`(() => { const b = document.querySelector('.wz-strip [data-category="plan"]'); if (b) b.click(); })()`); await sleep(900);
        const row = await app.evalJs(`(() => { ${R} const t = document.querySelector('.wz-sections .wz-thumb[data-thumb="deck"]'); if (!t) return null; const f = t.closest('.wz-section-open').querySelector('.wz-thumb-fact'); const cs = getComputedStyle(t), b = getComputedStyle(t, '::before'), a = getComputedStyle(t, '::after');
          return { w: parseFloat(cs.width), h: parseFloat(cs.height), bw: parseFloat(b.width), bh: parseFloat(b.height), aw: parseFloat(a.width), ah: parseFloat(a.height), bl: parseFloat(b.left), bt: parseFloat(b.top), al: parseFloat(a.left), at: parseFloat(a.top), shadow: cs.boxShadow, fact: f ? f.innerText.trim() : null }; })()`);
        if (cast === 'cool') await frame(app, 'step-plans-agenda-row');
        ok(`P1 [${label}]: the Agenda row has the stacked hairline thumbnail - three 16 x 11 rectangles, each offset 2px - and "Agenda · 1 of 5 filled" under the name`, !!row && row.w === 16 && row.h === 11 && row.bw === 16 && row.bh === 11 && row.aw === 16 && row.ah === 11 && row.al - row.bl === 2 && row.bt - row.at === 2 && row.shadow === 'none' && row.fact === 'Agenda · 1 of 5 filled', JSON.stringify(row));
      }
    }
  }
  // A1 - Arbor and Flux draw none of it
  for (const theme of ['plateau', 'flux']) {
    await boot(app, { theme, page: 'dark' });
    const o = await app.evalJs("({ walk: !!document.querySelector('[data-walk] .walk-card'), readout: !!document.querySelector('.walk-readout'), keys: !!document.querySelector('.walk-keys') })");
    ok(`A1 [${theme}]: the Step's Machina dress is absent - the Walk is there, with no readout row and no keys hint`, o.walk && !o.readout && !o.keys, JSON.stringify(o));
  }
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 420)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
console.log(passed === checks.length ? `\nMACHINA-STEP VERIFY: PASS (${checks.length} checks)` : `\nMACHINA-STEP VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length ? 0 : 1);
