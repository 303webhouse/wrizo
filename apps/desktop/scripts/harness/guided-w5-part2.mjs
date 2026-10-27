// W5 PART 2 - THE LIVE APP (a box turn). PART 1 (guided-w5.mjs) holds the contract and the pure decisions; this proves what only a browser can:
//   the gaps line in the Deck's header (names, never a count, a press jumps), the kindle moment (once, the rail seed -> leaf with ONE ring, the card's root line / Flux edge), the Deck completion (once), Lit (the same door
//   marks and unmarks, never celebrates, never counts), reduced motion (the still end state), the page never moving, and Arbor + Flux, dark + light, as frames for Fable.
// DOM: .deck-gaps > .deck-gaps-lead + .deck-gap[data-gap-id] (+ .deck-gaps-more) ; .walk-mark[data-state][data-lit][data-fx] ; .walk-card[data-kindled][data-lit][data-fx] > .kindle-mark / .lit-mark ; .walk-door[data-door=lit] ;
//   .deck-celebration ; .board-box[data-kindled][data-lit] (Open).
// Run: node scripts/harness/guided-w5-part2.mjs [outDir]   (a box turn; with outDir it also writes the frames Fable clears).
import fs from 'node:fs';
import path from 'node:path';
const out = process.argv[2] || null;
if (out) fs.mkdirSync(out, { recursive: true });
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
process.env.WS_PLACE = '1';
const { withHarness } = await import('../runtime-verify.mjs');
const NAMES = ['Hook', 'Midpoint Reversal', 'Darkest Point', 'Climax', 'Final Image'];

await withHarness(async (app) => {
  const q = (js) => app.evalJs(js);
  const waitSoft = async (expr, opts) => { try { await app.waitFor(expr, opts); return true; } catch { return false; } };
  const shot = async (name) => { if (out) fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(350); return true; };
  const boxes = (id) => q(`(window.wrizoBoard ? window.wrizoBoard() : [])`);
  const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: the section ran to the end (nothing it needs was missing)`, false, String((e && e.message) || e).slice(0, 220)); } };
  const rectOf = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10); })()`);

  // an in-page recorder: every time a node GAINS data-fx="kindle", and every time a .deck-celebration is mounted (what "fires once" means)
  const install = () => q(`(() => { window.__w5 = { kindle: [], celebrate: 0 }; if (window.__w5obs) window.__w5obs.disconnect();
    const obs = new MutationObserver((ms) => { for (const m of ms) {
      if (m.type === 'attributes' && m.target.getAttribute && m.target.getAttribute('data-fx') === 'kindle' && m.oldValue !== 'kindle') { const mk = m.target.closest && m.target.closest('.walk-mark'); window.__w5.kindle.push(mk ? 'mark' : (m.target.className || '').toString().slice(0, 20)); }
      if (m.type === 'childList') for (const n of m.addedNodes) if (n.nodeType === 1 && (n.matches?.('.deck-celebration') || n.querySelector?.('.deck-celebration'))) window.__w5.celebrate += 1;
    } });
    obs.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-fx'], attributeOldValue: true }); window.__w5obs = obs; })()`);
  const rec = () => q('JSON.parse(JSON.stringify(window.__w5 || { kindle: [], celebrate: 0 }))');
  const fresh = async (theme, tone, width = 1400) => {
    await app.emulateDpr(1, width, 900);
    await app.goto('/');
    await q("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4');");
    await app.reload();
    await waitSoft("!!document.querySelector('.wz-arrival')", { label: 'front door' });
    await waitSoft("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 14000 });
    await sleep(600);
    await q(`window.wrizoTheme && window.wrizoTheme.set('${theme}')`);
    await q(`window.wrizoThemePrefs && window.wrizoThemePrefs.set({ page: '${tone}' })`);
    await sleep(400);
  };
  // three decks: w5-deck (five empty steps), w5-open (the first two begun, for Open), w5-rm (for reduced motion) - plus a plain board (a writer who never opens a Deck sees nothing new)
  const seed = async () => {
    await q(`(() => { const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const names = ${JSON.stringify(NAMES)};
      const steps = (pre, begun) => names.map((n, i) => ({ id: pre + (i + 1), kind: 'text', x: 0.03 + (i % 3) * 0.32, y: 0.04 + Math.floor(i / 3) * 0.2, w: 0.28, h: 0.15, z: 1, seq: i + 1, text: n + '\\n' + (i < begun ? 'Her words ' + (i + 1) : ''), prompt: 'What happens at the ' + n + '?', deckStep: { deck: 'three-act', step: 'step' + i } }));
      const meta = { id: 'dm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' };
      window.wrizoCreateJournalPage({ id: 'w5-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: [...steps('d', 0), meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'w5-open', text: 'Half done', pageType: 'board', projectId: p.id, boxes: [...steps('o', 2), meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' });
      window.wrizoCreateJournalPage({ id: 'w5-rm', text: 'Quiet one', pageType: 'board', projectId: p.id, boxes: [...steps('r', 0), meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:03.000Z' });
      window.wrizoCreateJournalPage({ id: 'w5-plain', text: 'A plain board', pageType: 'board', projectId: p.id, boxes: [{ id: 'p1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'One\\nwords' }], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:04.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  const marks = () => q("[...document.querySelectorAll('.walk-mark')].map((m) => ({ s: m.getAttribute('data-state'), k: m.getAttribute('data-kindled'), lit: m.getAttribute('data-lit'), fx: m.getAttribute('data-fx') }))");
  const gapNames = () => q("[...document.querySelectorAll('.deck-gap')].map((b) => b.textContent.trim())");
  const curId = () => q("document.querySelector('.walk-card')?.getAttribute('data-box-id')");
  const goMark = (i) => click(`.walk-mark:nth-child(${i + 1})`);
  const writeIn = async (text) => { await click('.walk-card .board-popup-editor, .walk-card'); await sleep(250); await app.typeKeys(text); await sleep(900); };
  // the luminance contrast of a colour against the nearest opaque ground behind an element
  const contrast = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null;
    const rgb = (s) => (s.match(/[\\d.]+/g) || []).slice(0, 4).map(Number);
    const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    let n = e, bg = null; while (n) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length >= 3 && (c.length === 3 || c[3] > 0.95)) { bg = c; break; } n = n.parentElement; }
    const fg = rgb(getComputedStyle(e).color); if (!bg) bg = rgb(getComputedStyle(document.body).backgroundColor);
    const a = lum(fg) + 0.05, b = lum(bg) + 0.05; return Math.round((Math.max(a, b) / Math.min(a, b)) * 100) / 100; })()`);

  for (const theme of ['plateau', 'flux']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : 'Flux'} ${tone}`;
      const flux = theme === 'flux';
      const tag = `${flux ? 'flux' : 'arbor'}-${tone}`;
      const full = tone === 'dark';
      await guard(`[${T}]`, async () => {
        await fresh(theme, tone); await seed();

        // ---- the gaps line (nothing begun yet) ----
        await open('w5-deck', '.walk'); await install();
        const names0 = await gapNames();
        const text0 = await q("document.querySelector('.deck-gaps')?.textContent || ''");
        const more0 = await q("!!document.querySelector('.deck-gaps-more')");
        const lead0 = await q("document.querySelector('.deck-gaps-lead')?.textContent || ''");
        if (full) {
          ok(`[${T}] the gaps line names the steps with nothing yet: at most three, in the Deck's order after the current step, then an ellipsis`, names0.length === 3 && names0.join('|') === 'Midpoint Reversal|Darkest Point|Climax' && more0, JSON.stringify({ names0, more0 }));
          ok(`[${T}] names, never a count: no digit and no "left" anywhere in the line`, !/\d/.test(text0) && !/\bleft\b|\bof\b|%/i.test(text0), JSON.stringify(text0));
          ok(`[${T}] the lead words are the theme's own (${flux ? 'NO SIGNAL' : 'Nothing yet'}) ${flux ? 'and the STACK line names the Deck' : ''}`, flux ? /^NO SIGNAL/i.test(lead0.trim()) && /^STACK\s+Three-Act/i.test((await q("document.querySelector('.deck-stack')?.textContent || ''")).trim()) : /^Nothing yet/i.test(lead0.trim()), lead0);
        }
        const gapsRect = await rectOf('.deck-gaps');
        const cs0 = await q("(() => { const b = document.querySelector('.deck-gap'); const s = getComputedStyle(b); return { shadow: s.boxShadow, radius: s.borderRadius, color: s.color }; })()");
        ok(`[${T}] the names are flat, square, no shadow`, cs0.shadow === 'none' && /^0(px)?$/.test(cs0.radius), JSON.stringify(cs0));
        const c0 = await contrast('.deck-gap');
        ok(`[${T}] the names meet the 4.5:1 label floor on their ground`, c0 >= 4.5, String(c0));
        await shot(`gaps-${tag}`);
        const walkRect0 = await rectOf('.walk-window');
        // a press jumps the Walk to that step
        const firstGap = await q("document.querySelector('.deck-gap')?.getAttribute('data-gap-id')");
        await click('.deck-gap'); await sleep(500);
        const landed = await curId();
        ok(`[${T}] pressing a name jumps the Walk to that step`, landed === firstGap && landed === 'd2', `${landed} vs ${firstGap}`);
        await goMark(0); await sleep(500);

        // ---- the kindle moment: the writer writes in step one ----
        const before = await rec();
        await click('.walk-card'); await sleep(250);
        await app.typeKeys('She waits');
        const seen = await waitSoft("(window.__w5 && window.__w5.kindle.length > 0)", { label: 'kindle moment', timeout: 4000 });
        await sleep(260);
        const mid = await q(`(() => { const m = document.querySelector('.walk-mark[data-fx="kindle"]'); const card = document.querySelector('.walk-card'); if (!m) return null;
          const a = getComputedStyle(m, '::after'); const root = card.querySelector('.kindle-root path'); const edge = card.querySelector('.kindle-mark');
          return { ring: a.borderTopColor, ringStyle: a.borderTopStyle, radius: a.borderTopLeftRadius, cardFx: card.getAttribute('data-fx'), root: root ? getComputedStyle(root).stroke : null, edge: edge ? getComputedStyle(edge).borderTopColor : null, shadow: getComputedStyle(m).boxShadow }; })()`);
        await shot(`kindle-${tag}`);
        ok(`[${T}] writing in a step makes its moment happen: the rail mark gains the moment, the card too`, seen && !!mid && mid.cardFx === 'kindle', JSON.stringify(mid));
        if (!flux) ok(`[${T}] Arbor: ONE brass pulse ring on the mark (brass is the human act), no shadow`, !!mid && mid.ring === 'rgb(255, 152, 0)' && mid.ringStyle === 'solid' && mid.shadow === 'none', JSON.stringify(mid));
        else ok(`[${T}] Flux: the pulse is lime (progress) and the edge lights lime on the way to cyan`, !!mid && mid.ring === 'rgb(166, 255, 61)' && /rgb\(\s*(1[0-9]\d|[0-9]{1,2}),/.test(mid.edge || ''), JSON.stringify(mid));
        await sleep(1500);
        const rest = await q(`(() => { const card = document.querySelector('.walk-card'); const root = card.querySelector('.kindle-root path'); const edge = card.querySelector('.kindle-mark'); const ring = document.querySelector('.walk-mark[data-fx]');
          return { kindledMark: card.getAttribute('data-kindled'), fxLeft: !!document.querySelector('[data-fx="kindle"]'), root: root ? getComputedStyle(root).stroke : null, rootShown: root ? getComputedStyle(root.ownerSVGElement).display : null, edge: edge ? getComputedStyle(edge).borderTopColor : null, edgeRadius: edge ? getComputedStyle(edge).borderTopLeftRadius : null, shadow: edge ? getComputedStyle(edge).boxShadow : null }; })()`);
        ok(`[${T}] the moment ends by itself (about 1.1 s) and the card keeps its mark at rest`, rest.kindledMark === 'true' && !rest.fxLeft, JSON.stringify(rest));
        if (!flux) ok(`[${T}] Arbor: the root line is muted bronze #8f7a4c (never brass), a hint not a plant`, rest.root === 'rgb(143, 122, 76)' && rest.rootShown !== 'none', JSON.stringify(rest));
        else ok(`[${T}] Flux: the edge RESTS cyan, square, no shadow`, rest.edge === 'rgb(0, 194, 255)' && /^0(px)?$/.test(rest.edgeRadius) && rest.shadow === 'none', JSON.stringify(rest));
        await shot(`kindle-rest-${tag}`);
        const after1 = await rec();
        ok(`[${T}] the moment fired exactly once for that step`, after1.kindle.filter((x) => x === 'mark').length - before.kindle.filter((x) => x === 'mark').length === 1 && after1.celebrate === 0, JSON.stringify({ before, after1 }));
        const m1 = await marks();
        ok(`[${T}] the first mark is the current ring and is now kindled; the others are still seeds`, m1[0].s === 'current' && m1[0].k === 'true' && m1.slice(1).every((x) => x.k === 'false'), JSON.stringify(m1));
        // delete the words and retype: no second moment on this device
        for (let i = 0; i < 9; i++) await app.key('Backspace');
        await sleep(900);
        const mDel = await marks();
        await app.typeKeys('Again'); await sleep(1800);
        const after2 = await rec();
        ok(`[${T}] deleting the words and retyping them does NOT fire a second time (already celebrated on this device)`, mDel[0].k === 'false' && after2.kindle.filter((x) => x === 'mark').length === after1.kindle.filter((x) => x === 'mark').length && after2.celebrate === 0, JSON.stringify({ mDel: mDel[0], k1: after1.kindle.length, k2: after2.kindle.length }));
        const mem = await q("localStorage.getItem('wrizo-celebrated')");
        ok(`[${T}] the only memory is the one device-local celebrated set: ids, no text`, !!mem && JSON.parse(mem).cards.includes('d1') && !/She waits|Again/.test(mem), String(mem));

        // ---- the Walk's gaps line moved on; the page did not ----
        const names1 = await gapNames();
        await goMark(0); await sleep(400);
        const walkRect1 = await rectOf('.walk-window');
        ok(`[${T}] the page never moves: the card's place is the same with the line, after a kindle and after steps`, !!walkRect0 && !!walkRect1 && Math.abs(walkRect0[0] - walkRect1[0]) < 1.5 && Math.abs(walkRect0[1] - walkRect1[1]) < 1.5, JSON.stringify({ walkRect0, walkRect1 }));

        // ---- Lit: the same door marks and unmarks; it never celebrates and never counts ----
        for (const i of [1, 2, 3]) { await goMark(i); await sleep(300); await writeIn(`Step ${NAMES[i]} words`); await sleep(300); }
        const rec3 = await rec();
        ok(`[${T}] four steps begun, the Deck has not completed: no completion yet`, rec3.celebrate === 0 && (await gapNames()).join('|') === 'Final Image', JSON.stringify({ rec3, names: await gapNames() }));
        await goMark(4); await sleep(500);
        const doorOrder = await q("[...document.querySelectorAll('.walk-door')].map((d) => d.getAttribute('data-door'))");
        ok(`[${T}] the Lit door is the LAST in the row`, doorOrder[doorOrder.length - 1] === 'lit' && doorOrder[0] === 'notes', JSON.stringify(doorOrder));
        const litWord = await q("document.querySelector('.walk-door[data-door=lit]')?.textContent.trim()");
        await click('.walk-door[data-door="lit"]'); await sleep(700);
        const mLit = await marks();
        const litBox = (await boxes()).find((b) => b.id === 'd5');
        const recLit = await rec();
        ok(`[${T}] Mark lit: the rail shows it, the card stores lit:true with a change time, and the word is the theme's (${flux ? '[LOCK]' : 'Mark lit'})`, mLit[4].lit === 'true' && !!litBox && litBox.lit === true && typeof litBox.updatedAt === 'string' && (flux ? /LOCK/.test(litWord) : /Mark lit/i.test(litWord)), JSON.stringify({ litWord, m: mLit[4], lit: litBox && litBox.lit }));
        ok(`[${T}] marking lit never celebrates and never counts: no moment, no completion, the step is STILL a gap`, recLit.celebrate === 0 && recLit.kindle.length === rec3.kindle.length && mLit[4].k === 'false' && (await gapNames()).join('|') === 'Final Image', JSON.stringify({ recLit, k: mLit[4].k, names: await gapNames() }));
        const litCss = await q(`(() => { const m = document.querySelector('.walk-mark[data-lit="true"]'); const l = document.querySelector('.lit-mark'); const s = getComputedStyle(m); const ls = l ? getComputedStyle(l) : null; return { markColor: s.color, markBg: s.backgroundColor, markLeft: s.borderLeftColor, markLeftW: s.borderLeftWidth, lit: ls ? { color: ls.color, shadow: ls.boxShadow, bg: ls.backgroundColor, left: ls.borderLeftColor } : null }; })()`);
        if (!flux) ok(`[${T}] Arbor: the lit leaf is brass (a human act) on the rail and on the card`, litCss.markColor === 'rgb(255, 152, 0)' && !!litCss.lit && litCss.lit.color === 'rgb(255, 152, 0)' && litCss.lit.shadow === 'none', JSON.stringify(litCss));
        else ok(`[${T}] Flux: the tick fills cyan with the orange left bar; the card's mark the same, square, no shadow`, litCss.markBg === 'rgb(0, 194, 255)' && litCss.markLeft === 'rgb(255, 152, 0)' && !!litCss.lit && litCss.lit.bg === 'rgb(0, 194, 255)' && litCss.lit.shadow === 'none', JSON.stringify(litCss));
        await shot(`lit-${tag}`);
        await click('.walk-door[data-door="lit"]'); await sleep(700);
        const litBox2 = (await boxes()).find((b) => b.id === 'd5');
        const mLit2 = await marks();
        ok(`[${T}] the writer can UNMARK it from the same door: the key is gone, the mark is gone`, !!litBox2 && !('lit' in litBox2) && mLit2[4].lit === null, JSON.stringify({ litBox2: litBox2 && Object.keys(litBox2), m: mLit2[4] }));

        // ---- the Deck completes: her words in the last step; the theme's existing goal celebration, ONCE ----
        const rail5 = await rectOf('.walk-window');
        await click('.walk-card'); await sleep(250);
        await app.typeKeys('The last image');
        const seenDone = await waitSoft("(window.__w5 && window.__w5.celebrate > 0)", { label: 'completion', timeout: 4000 });
        await sleep(350);
        const flash = await q(`(() => { const c = document.querySelector('.deck-celebration'); if (!c) return null; const f = c.querySelector('.mode-pfill'); const s = f ? getComputedStyle(f) : null; return { cls: f ? f.className : '', sparks: c.querySelectorAll('.mode-pfill-spark').length, bg: s ? s.backgroundColor : '', text: c.textContent.trim(), radius: s ? s.borderRadius : '' }; })()`);
        await shot(`complete-${tag}`);
        ok(`[${T}] the last kindle completes the Deck: the existing goal celebration plays (${flux ? 'the ignition sweep + fourteen sparks' : 'the brass surge'}), carrying no number or label`, seenDone && !!flash && /celebrate/.test(flash.cls) && flash.text === '' && (flux ? flash.sparks === 14 : flash.sparks === 0), JSON.stringify(flash));
        await sleep(1500);
        const gone = await q("!document.querySelector('.deck-celebration')");
        const namesDone = await gapNames();
        const gapLeadLeft = await q("!!document.querySelector('.deck-gaps-lead')");
        ok(`[${T}] it lasts about 1.1 s and goes; the gaps line disappears with no "Complete!" and no verdict${flux ? ' (Flux keeps only its STACK name)' : ''}`, gone && namesDone.length === 0 && !gapLeadLeft && (flux ? !!(await q("!!document.querySelector('.deck-stack')")) : !(await q("!!document.querySelector('.deck-gaps')"))), JSON.stringify({ gone, namesDone, gapLeadLeft }));
        const recDone = await rec();
        for (let i = 0; i < 14; i++) await app.key('Backspace');
        await sleep(900); await app.typeKeys('Back again'); await sleep(2200);
        const recAgain = await rec();
        ok(`[${T}] the Deck's moment happened exactly once (never twice, not on a re-kindle either)`, recDone.celebrate === 1 && recAgain.celebrate === 1, JSON.stringify({ recDone: recDone.celebrate, recAgain: recAgain.celebrate }));
        const toast = await q("!!document.querySelector('[class*=toast], [role=alert], [role=status]:not(:empty)')");
        ok(`[${T}] nothing spoke first: no toast, no alert, no status line appeared`, !toast, String(toast));
        const memDeck = JSON.parse(await q("localStorage.getItem('wrizo-celebrated') || '{}'"));
        ok(`[${T}] the memory holds ids only: five steps and the Deck`, (memDeck.cards || []).length === 5 && (memDeck.decks || []).includes('w5-deck') && !/words|last image|Back again/i.test(JSON.stringify(memDeck)), JSON.stringify(memDeck));
        if (full) {
          // the stored text is the writer's own: lit never leaked into the text; the first card still reads as ordinary card text
          const d1 = (await boxes()).find((b) => b.id === 'd1');
          ok(`[${T}] the card's text is her words only (the question stays a placeholder, never text)`, !!d1 && /^hook\n/i.test(d1.text) && !/What happens/.test(d1.text), JSON.stringify(d1 && d1.text));
        }
      });

      if (full) {
        // ---- Open: the line reads from the first; a press scrolls to the card and focuses it; kindled cards wear their mark ----
        await guard(`[${T}] Open`, async () => {
          await open('w5-open', '.walk'); await install(); await sleep(300);
          const strip = await point('.show-as'); if (strip) { await app.mouseMove(strip.x, strip.y); await sleep(500); }
          await click('.show-as-btn[data-view="open"]'); await waitSoft("!!document.querySelector('.board-canvas')", { label: 'open view' }); await sleep(900);
          const n = await gapNames();
          ok(`[${T}] in Open the line reads from the first step with nothing yet`, n.join('|') === 'Darkest Point|Climax|Final Image', JSON.stringify(n));
          const kindledCards = await q("[...document.querySelectorAll('.board-box[data-kindled=\"true\"]')].map((e) => e.getAttribute('data-box-id'))");
          ok(`[${T}] in Open, the begun steps wear their mark (a root line / the lit edge) and the others do not`, kindledCards.sort().join() === 'o1,o2' && (await q("document.querySelectorAll('.board-box .kindle-mark').length")) === 2, JSON.stringify(kindledCards));
          await shot(`open-${tag}`);
          await click('.deck-gap'); await sleep(600);
          const focused = await q("(document.activeElement && document.activeElement.closest && document.activeElement.closest('.board-box')?.getAttribute('data-box-id')) || null");
          ok(`[${T}] in Open, pressing a name scrolls to that card and focuses it`, focused === 'o3', String(focused));
          const lit = await q("[...document.querySelectorAll('.board-box [class*=lit-mark]')].length");
          ok(`[${T}] opening a Deck and looking writes nothing and rewards nothing`, lit === 0 && (await rec()).celebrate === 0, String(lit));
        });
        // ---- reduced motion: the still end state ----
        await guard(`[${T}] reduced motion`, async () => {
          await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await sleep(300);
          await open('w5-rm', '.walk'); await install(); await sleep(300);
          await click('.walk-card'); await sleep(250); await app.typeKeys('Quietly'); await sleep(2000);
          const r = await rec();
          const st = await q("(() => { const c = document.querySelector('.walk-card'); return { kindled: c.getAttribute('data-kindled'), mark: !!c.querySelector('.kindle-mark'), fx: !!document.querySelector('[data-fx=\"kindle\"]'), leaf: document.querySelector('.walk-mark')?.getAttribute('data-kindled') }; })()");
          ok(`[${T}] reduced motion = the still end state: no moment plays (none held), yet the card is begun, its mark and leaf are simply there`, r.kindle.length === 0 && st.kindled === 'true' && st.mark && !st.fx && st.leaf === 'true', JSON.stringify({ r, st }));
          await app.emulateMedia([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
        });
        // ---- a writer who never opens a Deck sees nothing new ----
        await guard(`[${T}] a plain board`, async () => {
          await open('w5-plain', '.board-canvas');
          const any = await q("({ gaps: !!document.querySelector('.deck-gaps'), mark: !!document.querySelector('.kindle-mark'), lit: !!document.querySelector('.lit-mark'), fx: !!document.querySelector('[data-fx]'), lit2: !!document.querySelector('[data-lit]') })");
          ok(`[${T}] a plain board shows nothing new: no gaps line, no marks, no moments, no Lit`, !any.gaps && !any.mark && !any.lit && !any.fx && !any.lit2, JSON.stringify(any));
        });
      }
    }
  }
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-W5 PART 2 VERIFY: FAIL - ${failed.length}/${checks.length}` : `\nGUIDED-W5 PART 2 VERIFY: PASS (${checks.length} checks${out ? '; frames in ' + out : ''})`);
process.exit(failed.length ? 1 : 0);
