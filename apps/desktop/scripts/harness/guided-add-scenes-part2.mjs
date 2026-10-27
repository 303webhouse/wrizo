// "ADD SCENES..." PART 2 - THE LIVE APP (a box turn). PART 1 (guided-add-scenes.mjs) holds the contract and the pure model; this proves what only a browser can: the door and its popover, nothing created on Esc, Add 2,
// the Walk landing on the first child with the caret in the card, the readout / edge / hanging rail, the parent kindled by a child, Outline and Storyboard, the page never moving, Arbor + Flux, dark + light.
// DOM: .walk-door[data-door=scenes] ; .scenes-pop > .scenes-kicker .scenes-q .scenes-chip[data-n][aria-pressed] .scenes-add .scenes-note ; .walk-card[data-sub] ; .walk-readout ; .walk-mark-group > .walk-subrail > .walk-mark[data-sub] ;
//   .board-scenes-door (Outline / Storyboard) ; .board-outline-children .
// Run: node scripts/harness/guided-add-scenes-part2.mjs [outDir]   (a box turn; with outDir it also writes the frames Fable clears).
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
  const tones = [];   // every frame's page-tone attribute (Fable, Oct 27): frames.json beside the PNGs
  const shot = async (name) => { if (out) { fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(await app.screenshot(), 'base64')); tones.push({ frame: `${name}.png`, dataPage: await q("document.documentElement.getAttribute('data-page')"), dataTheme: await q("document.documentElement.getAttribute('data-theme')") }); } };
  const point = (sel) => q(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return null; const r = b.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const click = async (sel) => { const p = await point(sel); if (!p) return false; await app.mouseMove(p.x, p.y); await app.mouseDown(p.x, p.y); await sleep(50); await app.mouseUp(p.x, p.y); await sleep(400); return true; };
  const boxes = () => q('(window.wrizoBoard ? window.wrizoBoard() : [])');
  const guard = async (name, fn) => { try { await fn(); } catch (e) { ok(`${name}: the section ran to the end (nothing it needs was missing)`, false, String((e && e.message) || e).slice(0, 220)); } };
  const rectOf = (sel) => q(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map((v) => Math.round(v * 10) / 10); })()`);
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
  const seed = async () => {
    await q(`(() => { const d = window.wrizoCreateDrawer('The Well'); const p = window.wrizoCreateProject('The Well', 'creative'); window.wrizoSetProjectDrawer(p.id, d.id);
      const names = ${JSON.stringify(NAMES)};
      const steps = (deck) => names.map((n, i) => ({ id: 's' + (i + 1), kind: 'text', x: 0.03 + (i % 3) * 0.32, y: 0.04 + Math.floor(i / 3) * 0.2, w: 0.28, h: 0.15, z: 1, seq: i + 1, text: n + '\\n' + (i === 0 ? 'She waits.' : ''), prompt: 'What happens at the ' + n + '?', deckStep: { deck, step: 'st' + i } }));
      const meta = { id: 'dm', kind: 'board-meta', x: 0, y: 0, w: 0, h: 0, z: 0, homeView: 'walk' };
      window.wrizoCreateJournalPage({ id: 'sc-deck', text: 'Three-Act', pageType: 'board', projectId: p.id, boxes: [...steps('three-act'), meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:01.000Z' });
      window.wrizoCreateJournalPage({ id: 'sc-research', text: 'The Paper', pageType: 'board', projectId: p.id, boxes: [...steps('research-paper'), meta], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:02.000Z' });
      window.wrizoCreateJournalPage({ id: 'sc-plain', text: 'A plain board', pageType: 'board', projectId: p.id, boxes: [{ id: 'p1', kind: 'text', x: 0.1, y: 0.1, w: 0.2, h: 0.1, z: 1, text: 'One\\nwords' }], origin: 'project', source: 'page', createdAt: '2026-01-01T00:00:03.000Z' });
      window.wrizoFlushNow(); })()`);
    await sleep(500);
  };
  const open = async (id, sel) => { await q(`location.hash = '#/page/${id}'`); await waitSoft(`!!document.querySelector('${sel}')`, { label: id, timeout: 8000 }); await sleep(900); };
  const marks = () => q("[...document.querySelectorAll('.walk-mark')].map((m) => ({ s: m.getAttribute('data-state'), k: m.getAttribute('data-kindled'), sub: m.getAttribute('data-sub'), cur: m.getAttribute('data-current') }))");
  const curId = () => q("document.querySelector('.walk-card')?.getAttribute('data-box-id')");
  const doors = () => q("[...document.querySelectorAll('.walk-door')].map((d) => d.getAttribute('data-door'))");
  const showAs = async (view) => { const strip = await point('.show-as'); if (strip) { await app.mouseMove(strip.x, strip.y); await sleep(500); } return click(`.show-as-btn[data-view="${view}"]`); };
  const goMark = (i) => click(`.walk-rail .walk-mark:nth-of-type(${i + 1})`);

  for (const theme of ['plateau', 'flux']) {
    for (const tone of ['dark', 'light']) {
      const T = `${theme === 'plateau' ? 'Arbor' : 'Flux'} ${tone}`;
      const flux = theme === 'flux';
      const tag = `${flux ? 'flux' : 'arbor'}-${tone}`;
      const full = tone === 'dark';
      await guard(`[${T}]`, async () => {
        await fresh(theme, tone); await seed();
        await open('sc-deck', '.walk');
        await goMark(1); await sleep(500);   // Midpoint Reversal
        const onStep = await curId();
        const d0 = await doors();
        const doorText = await q("document.querySelector('.walk-door[data-door=scenes]')?.textContent.trim() || ''");
        const rect0 = await rectOf('.walk-window');
        ok(`[${T}] a top-level step of a Deck has the scenes door, the last of its own doors (Mark lit stays last), in the theme's word (${flux ? '[+ SCENES]' : 'Add scenes…'})`, onStep === 's2' && d0.filter((k) => k !== 'lit').slice(-1)[0] === 'scenes' && d0[d0.length - 1] === 'lit' && (flux ? doorText === '[+ SCENES]' : doorText === 'Add scenes\u2026'), JSON.stringify({ d0, doorText }));

        // the popover: kicker, How many, chips 1-5 with 3 chosen, Add, the note - nothing created until Add
        await click('.walk-door[data-door="scenes"]'); await sleep(400);
        const pop = await q(`(() => { const p = document.querySelector('.scenes-pop'); if (!p) return null; const cs = getComputedStyle(p); const chip = p.querySelector('.scenes-chip'); const cc = getComputedStyle(chip); return { kicker: p.querySelector('.scenes-kicker').textContent, q: p.querySelector('.scenes-q').textContent, chips: [...p.querySelectorAll('.scenes-chip')].map((c) => c.textContent + (c.getAttribute('aria-pressed') === 'true' ? '*' : '')), add: p.querySelector('.scenes-add').textContent, note: p.querySelector('.scenes-note').textContent, radius: cs.borderTopLeftRadius, shadow: cs.boxShadow, chipRadius: cc.borderTopLeftRadius, chipShadow: cc.boxShadow }; })()`);
        await shot(`s1-popover-${tag}`);
        ok(`[${T}] the popover asks "How many scenes?": the kicker, chips 1-5 with 3 chosen, Add, and "They go right under Midpoint Reversal."`, !!pop && /ADD SCENES UNDER THIS STEP/i.test(pop.kicker) && pop.q === 'How many scenes?' && pop.chips.join(',') === '1,2,3*,4,5' && pop.add === 'Add' && pop.note === 'They go right under Midpoint Reversal.', JSON.stringify(pop));
        ok(`[${T}] the popover and its chips are square with no shadow`, !!pop && /^0(px)?$/.test(pop.radius) && pop.shadow === 'none' && /^0(px)?$/.test(pop.chipRadius) && pop.chipShadow === 'none', JSON.stringify(pop));
        const rectOpen = await rectOf('.walk-window');
        await app.key('Escape'); await sleep(400);
        const afterEsc = { pop: await q("!!document.querySelector('.scenes-pop')"), walk: await q("!!document.querySelector('.walk-card')"), kids: (await boxes()).filter((b) => b.parentId).length };
        ok(`[${T}] Esc closes the popover, creates nothing, and does not leave the Walk`, !afterEsc.pop && afterEsc.walk && afterEsc.kids === 0, JSON.stringify(afterEsc));
        ok(`[${T}] the page never moves: the card's place is the same with the popover shut, open and shut again`, !!rect0 && !!rectOpen && Math.abs(rect0[0] - rectOpen[0]) < 1.5 && Math.abs(rect0[1] - rectOpen[1]) < 1.5 && Math.abs(rect0[3] - rectOpen[3]) < 1.5, JSON.stringify({ rect0, rectOpen }));

        // Add 2
        await click('.walk-door[data-door="scenes"]'); await sleep(300);
        await click('.scenes-chip[data-n="2"]'); await sleep(200);
        await click('.scenes-add'); await sleep(900);
        const all = await boxes();
        const kids = all.filter((b) => b.parentId === 's2');
        ok(`[${T}] Add 2 creates exactly two ordinary text cards under the step: parentId, titled Scene 1 / Scene 2, the question stored as the placeholder (never in the text)`, kids.length === 2 && kids.every((k, i) => k.kind === 'text' && k.text === `Scene ${i + 1}\n` && k.prompt === 'What happens in this scene, and what has changed by its end?' && !('deckStep' in k)), JSON.stringify(kids.map((k) => [k.text, k.parentId, k.seq])));
        const landed = await curId();
        const caret = await q("(() => { const a = document.activeElement; return !!(a && a.closest && a.closest('.walk-card')); })()");
        ok(`[${T}] the Walk lands on the first new child with the caret in the card`, landed === kids[0]?.id && caret, JSON.stringify({ landed, caret }));
        const sub = await q(`(() => { const c = document.querySelector('.walk-card'); const r = document.querySelector('.walk-readout'); const cs = getComputedStyle(c); return { sub: c.getAttribute('data-sub'), edge: cs.borderLeftColor, edgeW: cs.borderLeftWidth, readout: r ? r.textContent : null, upper: r ? getComputedStyle(r).textTransform : null, trk: document.querySelector('.walk-trk')?.textContent || null, ph: (c.querySelector('.board-popup-editor')?.textContent || '').trim() }; })()`);
        ok(`[${T}] the readout above the card says ${flux ? 'MIDPOINT REVERSAL > SCENE 1/2' : 'MIDPOINT REVERSAL > SCENE 1 OF 2'}`, sub.sub === 'true' && sub.readout === (flux ? 'Midpoint Reversal \u203a Scene 1/2' : 'Midpoint Reversal \u203a Scene 1 of 2') && sub.upper === 'uppercase', JSON.stringify(sub));
        if (!flux) ok(`[${T}] Arbor: a 3 px bronze #8f7a4c edge says "inside a step"`, sub.edgeW === '3px' && sub.edge === 'rgb(143, 122, 76)', JSON.stringify(sub));
        else ok(`[${T}] Flux: TRK reads 2.1/5 (a position) and the orange bar is the current card's, as today`, sub.trk === 'TRK 2.1/5' && sub.edge === 'rgb(255, 152, 0)', JSON.stringify(sub));
        const rail = await q(`(() => { const g = document.querySelector('.walk-mark-group'); if (!g) return null; const main = g.querySelector(':scope > .walk-mark'); const subs = [...g.querySelectorAll('.walk-subrail .walk-mark')]; const sr = g.querySelector('.walk-subrail'); const ms = main.getBoundingClientRect(), ss = subs.map((s) => s.getBoundingClientRect()); return { groups: document.querySelectorAll('.walk-mark-group').length, subs: subs.length, mainW: Math.round(ms.width), subW: Math.round(ss[0].width), below: ss[0].top > ms.bottom - 1, line: getComputedStyle(sr).borderTopColor, mainsTotal: document.querySelectorAll('.walk-rail > .walk-mark, .walk-rail > .walk-mark-group > .walk-mark:not([data-sub])').length, states: subs.map((s) => s.getAttribute('data-state')) }; })()`);
        ok(`[${T}] the rail: ${flux ? 'sub-ticks' : 'small marks'} hang from the parent's mark, smaller, same states; five main marks stay five`, !!rail && rail.groups === 1 && rail.subs === 2 && rail.subW < rail.mainW && rail.below && rail.mainsTotal === 5 && rail.states[0] === 'current' && rail.states[1] === 'seed', JSON.stringify(rail));
        if (!flux) ok(`[${T}] Arbor: the hanging line is bronze #8f7a4c`, rail.line === 'rgb(143, 122, 76)', String(rail.line));
        await shot(`s2-substep-${tag}`);
        const noDoor = await doors();
        ok(`[${T}] a sub-step has NO scenes door (one level deep)`, !noDoor.includes('scenes'), JSON.stringify(noDoor));

        // coverage: the parent is kindled by a child
        const before = (await marks())[1];
        await click('.walk-card'); await sleep(250); await app.typeKeys('She opens the door.'); await sleep(1100);
        const afterM = await marks();
        const parentIdx = 1;
        ok(`[${T}] a parent counts as kindled when a child has words (the parent's own text is still empty)`, before.k === 'false' && afterM[parentIdx].k === 'true' && ((await boxes()).find((b) => b.id === 's2').text === 'Midpoint Reversal\n'), JSON.stringify({ before, afterM: afterM[parentIdx] }));
        if (full) {
          // the first scene has words now, so the arrows belong to its caret: the Next chevron steps on
          await click('.walk-nav[data-dir="next"]'); await sleep(500);   // the Next chevron (always steps)
          const second = await curId();
          ok(`[${T}] stepping on: the next card is the second scene (the walk order is the parent, then its children)`, second === kids[1]?.id, String(second));
        }

        {
          // Outline: ordinary nested cards; the door sits on the top-level steps only
          await showAs('outline'); await waitSoft("!!document.querySelector('.board-outline')", { label: 'outline' }); await sleep(700);
          const ol = await q("({ rows: document.querySelectorAll('.board-outline-row').length, nested: document.querySelectorAll('.board-outline-children .board-outline-row').length, doors: [...document.querySelectorAll('.board-scenes-door')].length, doorOnChild: !!document.querySelector('.board-outline-children .board-scenes-door') })");
          ok(`[${T}] in Outline the scenes are ordinary nested cards under their step, and only the five main steps carry the door`, ol.rows === 7 && ol.nested === 2 && ol.doors === 5 && !ol.doorOnChild, JSON.stringify(ol));
          // THE OUTLINE NESTS (Fable, Oct 27: the scenes sat in a 2nd column at x ~ 950): each scene is indented under its step, its top is between its step's and the next step's, its arrows are on its own row, and it carries 2.1 / 2.2
          const geo = await q(`(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), b: Math.round(b.bottom) }; }; const kid = (id) => ({ input: r('[data-outline-input="' + id + '"]'), num: document.querySelector('[data-outline-row="' + id + '"] > .board-outline-num')?.textContent || null, ctl: r('[data-outline-row="' + id + '"] > .board-outline-ctl'), bullet: r('[data-outline-row="' + id + '"] > .board-outline-bullet') }); return { parent: kid('s2'), next: kid('s3'), kids: ${JSON.stringify(kids.map((k) => k.id))}.map(kid) }; })()`);
          const nestedOk = !!geo.parent.input && geo.kids.length === 2 && geo.kids.every((k) => !!k.input && k.input.l > geo.parent.input.l + 8 && k.bullet.l > geo.parent.bullet.l + 8 && k.input.t > geo.parent.input.t && k.input.t < geo.next.input.t && !!k.ctl && Math.abs((k.ctl.t + k.ctl.b) / 2 - (k.input.t + k.input.b) / 2) < 14) && geo.kids[0].input.t < geo.kids[1].input.t;
          ok(`[${T}] in Outline each scene NESTS under its step: indented (left edge past the step's), its top between the step's and the next step's, its arrows on its own row`, nestedOk, JSON.stringify(geo));
          ok(`[${T}] a Deck's Outline numbers its rows: the step 2, its scenes 2.1 and 2.2`, geo.parent.num === '2' && geo.kids[0].num === '2.1' && geo.kids[1].num === '2.2', JSON.stringify([geo.parent.num, ...geo.kids.map((k) => k.num)]));
          const caseOf = await q(`(() => { const u = (id) => getComputedStyle(document.querySelector('[data-outline-input="' + id + '"]')).textTransform; return { s2: u('s2'), kid1: u(${JSON.stringify(kids[0].id)}), kid2: u(${JSON.stringify(kids[1].id)}) }; })()`);
          ok(`[${T}] one rule for the title's case in Outline (${flux ? 'Flux: every title uppercase by style, typed or not' : 'Arbor: as typed'})`, flux ? caseOf.s2 === 'uppercase' && caseOf.kid1 === 'uppercase' && caseOf.kid2 === 'uppercase' : caseOf.s2 === 'none' && caseOf.kid1 === 'none' && caseOf.kid2 === 'none', JSON.stringify(caseOf));
          await shot(`s3-outline-${tag}`);
          await click('.board-outline-row[data-outline-row="s3"] > .board-outline-ctl .board-scenes-door'); await sleep(400);
          const popO = await q("!!document.querySelector('.board-outline-row .scenes-pop')");
          await click('.scenes-chip[data-n="1"]'); await click('.scenes-add'); await sleep(800);
          const k2 = (await boxes()).filter((b) => b.parentId === 's3');
          ok(`[${T}] adding from Outline: the same popover, one card "Scene 1" under Darkest Point`, popO && k2.length === 1 && k2[0].text === 'Scene 1\n', JSON.stringify(k2.map((k) => k.text)));
          if (full) {
          await showAs('storyboard'); await waitSoft("!!document.querySelector('.board-storyboard')", { label: 'storyboard' }); await sleep(600);
          const sb = await q("({ doors: document.querySelectorAll('.board-sb-card .board-scenes-door').length, cards: document.querySelectorAll('.board-sb-card').length })");
          ok(`[${T}] in Storyboard the door shows on the five main steps and not on their scenes`, sb.doors === 5 && sb.cards === 8, JSON.stringify(sb));
          }
        }
      });
      if (full) {
        await guard(`[${T}] other decks and boards`, async () => {
          await open('sc-research', '.walk'); await sleep(300);
          const word = await q("document.querySelector('.walk-door[data-door=scenes]')?.textContent.trim() || ''");
          ok(`[${T}] a Research Paper's step says its own word (${flux ? '[+ SUBSECTIONS]' : 'Add subsections…'})`, flux ? word === '[+ SUBSECTIONS]' : word === 'Add subsections\u2026', word);
          await open('sc-plain', '.board-canvas');
          const any = await q("({ door: !!document.querySelector('[data-door=scenes], .board-scenes-door, .scenes-pop'), sub: !!document.querySelector('[data-sub]') })");
          ok(`[${T}] a plain Board shows nothing new`, !any.door && !any.sub, JSON.stringify(any));
        });
      }
    }
  }
});

if (out) fs.writeFileSync(path.join(out, 'frames.json'), JSON.stringify(tones, null, 2));
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
const failed = checks.filter((c) => !c.pass);
console.log(failed.length ? `\nGUIDED-ADD-SCENES PART 2 VERIFY: FAIL - ${failed.length}/${checks.length}` : `\nGUIDED-ADD-SCENES PART 2 VERIFY: PASS (${checks.length} checks${out ? '; frames in ' + out : ''})`);
process.exit(failed.length ? 1 : 0);
