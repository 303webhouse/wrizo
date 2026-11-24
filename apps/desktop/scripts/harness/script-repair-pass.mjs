// SCRIPT batch 2, item 3: THE BREAK RULES FLOW THE PAGES ON; THEY NEVER OPEN A PAGE FOR ONE LINE (the review's finding 13, P3/P4/W3; Fable, Nov 24).
// The break rules ran as a second pass over finished pages: it pushed a page's bad tail (a heading, a cue) onto the next page, and when that
// page overflowed it opened a NEW page for the one line pushed out, instead of letting the pages after it flow on. A script showed a page more
// than its lines need, with a page holding one line, and a cue could be left alone on a page. Machina, ?reorg=1, seeded through the app's seams.
//
// HEADING      RP1  a heading that would end a page goes over with what follows it, and the pages after flow on: four pages, none holding one line
// HEADING+CUE  RP2  a heading and the cue under it go over together with the speech, and the pages after flow on: three pages, none holding one line
// TRANSITION   RP3  a transition that would open a page takes the line above it over, and the pages after flow on: three pages, none holding one line
// THE RULES    RP4  (control) on all three, no page ends on a heading, a cue or a parenthetical, and none opens on a transition
// THE SHORT    RP5  (control) the panel's 950-word short (sr-session.mjs, 200 lines run on) is four pages, none ending on a cue or a heading
// THE WORDS    RP6  (control) every line of all four scripts is on the pages exactly once, in order
//
// Run (repo root; the Actions harness, or a box turn):  node apps/desktop/scripts/harness/script-repair-pass.mjs
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail: typeof detail === 'string' ? detail : JSON.stringify(detail) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const q = (s) => JSON.stringify(s);
const act = (x) => ['action', x];
// one-line actions: each takes two lines (a blank above it)
const beats = (k, w = 'Beat') => Array.from({ length: k }, (_, i) => act(`${w} ${i + 1}.`));
// heading + 25 beats = 51 lines; the second heading lands on line 54, and the next page is full
const H25 = [['scene', 'INT. A - DAY'], ...beats(25), ['scene', 'INT. B - NIGHT'], ...beats(27, 'Step'), ['character', 'MARA'], ['dialogue', 'Short.'], ...beats(30, 'Tail')];
// heading + 24 beats = 49; a heading and a cue at the foot, then a full page
const HC24 = [['scene', 'INT. A - DAY'], ...beats(24), ['scene', 'INT. B - NIGHT'], ['character', 'MARA'], ['dialogue', 'One. Two. Three.'], ...beats(26, 'Step'), ...beats(10, 'Tail')];
// heading + 26 beats = 53; the transition would open page two, and the page after it is full
const T26 = [['scene', 'INT. A - DAY'], ...beats(26), ['transition', 'CUT TO:'], ['scene', 'INT. B - NIGHT'], ...beats(26, 'Step')];
const T = { s: 'scene', a: 'action', c: 'character', p: 'paren', d: 'dialogue', t: 'transition', h: 'shot', g: 'general' };
const UP = new Set(['scene', 'character', 'transition', 'shot']);
// The panel's short, copied verbatim from the SCRIPT review's own harness (review/screenwriting, sr-session.mjs): [type key, text as typed].
const SPIN_CYCLE = [
  ['t', 'FADE IN:'],
  ['s', 'int. suds & duds laundromat - night'],
  ['a', 'Twenty washers, one working light. The dryers tick as they cool. Rain runs down a window lettered backwards from this side.'],
  ['a', 'MARA (58, reading glasses on a shoelace) feeds quarters into a coffee can, counting under her breath. She has done this every night for nineteen years and it shows in her thumbs.'],
  ['a', 'The door bangs. THEO (31, a good coat, wet) backs in dragging a black garbage bag. He looks at the machines as if one of them might explain itself.'],
  ['c', 'mara'],
  ['d', 'We close at eleven.'],
  ['c', 'theo'],
  ['d', 'It says twenty-four hours.'],
  ['c', 'mara'],
  ['p', 'not looking up'],
  ['d', 'It said a lot of things in 1994.'],
  ['a', 'Theo hauls the bag to the nearest washer and opens it. Shirts. Dozens, all white, all the same collar. He lifts one out and holds it a moment too long.'],
  ['c', 'theo'],
  ['d', 'How much soap do you use for, like, a lot of shirts?'],
  ['a', 'Mara finally looks. At the shirts, then at him. She takes off her glasses.'],
  ['c', 'mara'],
  ['d', 'Whose are they?'],
  ['c', 'theo'],
  ['d', 'Mine.'],
  ['c', 'mara'],
  ['d', 'You wear a sixteen neck like I wear a tiara.'],
  ['a', 'He almost laughs. It goes wrong halfway up. He sits down on the folding table, the shirt still in his hands.'],
  ['c', 'theo'],
  ['d', 'My dad. Tuesday. My sister wants them gone by the weekend, she has a guy coming for the furniture, and I said I would take care of the clothes because it was the one thing nobody was fighting about.'],
  ['c', 'mara'],
  ['d', 'So you are washing them.'],
  ['c', 'theo'],
  ['d', 'They smell like him. I thought if I gave them away smelling like him that would be strange for whoever got them.'],
  ['a', 'Mara comes around the counter. She takes the shirt, turns the collar out, and reads it with her thumb the way some people read a face.'],
  ['c', 'mara'],
  ['d', 'Starch. Every week, somebody starched these by hand. You do not see that.'],
  ['c', 'theo'],
  ['d', 'He did it himself. Sunday nights, with the game on. After my mom. He never said a word about it, he just learned how, and every Monday morning of my life that man walked out of the house looking like a bank.'],
  ['a', 'She lays the shirt flat on the table and smooths it. Neither of them says anything for a while. A dryer ticks.'],
  ['c', 'mara'],
  ['d', "I am going to tell you something and you are going to think it is about laundry. My husband drove a bread truck for thirty-one years. When he went I had every uniform he ever owned in the back of that closet, and I did exactly what you are doing. I brought them here, to my own place, at two in the morning, so nobody would see. I put them in number six because number six runs hot. And I stood right there with my hand on the lid and I could not close it. Forty minutes I stood there. Because the second that water comes in, that is the last of him that is in the room, and you do not get it back, and there is no one to complain to. So here is what nobody told me. You do not have to do them all. You pick one. You keep one that you never wash, you put it in a plastic bag, you put the bag in a drawer, and maybe once a year when it is bad you open it up. The rest of them are just shirts. The rest of them can go and keep some other man warm, and he will never know he is walking around in all that Sunday night. That is not you throwing your father away. That is the only way I ever found to carry it."],
  ['a', 'Theo does not move. Then he reaches into the bag, goes through the shirts one at a time, and draws out the oldest: the collar frayed, a small brown scorch by the placket.'],
  ['c', 'theo'],
  ['d', 'This one. He burned it the first time he tried.'],
  ['c', 'mara'],
  ['d', 'That is the one.'],
  ['h', 'angle on the coffee can'],
  ['a', 'She tips it toward him. He takes out four quarters. She closes his hand around them.'],
  ['c', 'mara'],
  ['d', 'Number six.'],
  ['t', 'dissolve to:'],
  ['s', 'int. suds & duds laundromat - later'],
  ['a', 'Number six churns, white on white. Theo and Mara sit side by side on the plastic chairs watching it the way people watch a fire. The one shirt lies folded on his knee, in a dry cleaning bag she found somewhere.'],
  ['c', 'theo'],
  ['d', 'Does it get better?'],
  ['c', 'mara'],
  ['d', 'No.'],
  ['a', 'He nods. She pats his knee twice, hard, like a horse.'],
  ['c', 'mara'],
  ['d', 'It gets folded.'],
  ['a', 'They both talk at once, the way people do when the worst of it is over:'],
  ['c', 'theo'],
  ['d', 'What do I owe you for the soap?'],
  ['c', 'mara'],
  ['d', 'You owe me for the soap.'],
  ['a', 'The washer shudders into its spin. The whole row of machines hums along with it, and for a moment the place sounds almost like a choir.'],
  ['t', 'cut to:'],
  ['s', 'ext. suds & duds laundromat - dawn'],
  ['a', 'The rain has quit. The sky over the parking lot is the color of dishwater. Theo comes out with the garbage bag over his shoulder, lighter now, full of clean shirts, and the one in its plastic tucked inside his good coat.'],
  ['a', 'At the curb there is a donation bin, dented, painted green. He stops in front of it. He looks back.'],
  ['a', 'Through the backwards letters on the window, Mara is already wiping down number six. She does not wave. She lifts the rag about an inch.'],
  ['a', 'Theo opens the bin and starts feeding the shirts in, one at a time, each one folded first.'],
  ['g', 'Note: hold on the bin until the last shirt.'],
  ['t', 'fade out.'],
];
const SHORT = SPIN_CYCLE.map(([k, x]) => [T[k], k === 'p' ? `(${x})` : (UP.has(T[k]) ? x.toUpperCase() : x)]);

let n = 0;
const docOf = (id, rows) => {
  const scenes = [];
  rows.forEach(([t, text], i) => {
    const el = { id: `${id}-${i}`, t, text };
    // the first line leads its group whatever its type (store/scriptDoc.ts, SCRIPT #7): the short opens on FADE IN:
    if (t === 'scene' || !scenes.length) scenes.push({ id: el.id, heading: el, body: [] });
    else scenes[scenes.length - 1].body.push(el);
  });
  return { v: 1, scenes };
};
// each sheet: its lines in order as [docIndex, type], parts of a broken line marked
const SHEETS = "(() => [...document.querySelectorAll('.script-sheet')].map((s) => [...s.querySelectorAll('.script-el[data-doc-index]')].map((e) => [+e.dataset.docIndex, e.dataset.type, e.dataset.continuedFrom === 'true'])))()";
const lonely = (sheets) => sheets.map((s, k) => ({ k, lines: s.length })).filter((x, k, all) => k < all.length - 1 && x.lines === 1).map((x) => x.k);
const badEnds = (sheets) => sheets.flatMap((s, k) => {
  const out = [];
  const last = s[s.length - 1];
  if (k < sheets.length - 1 && last && ['scene', 'character', 'paren'].includes(last[1])) out.push(`p${k} ends ${last[1]}`);
  if (k > 0 && s[0] && s[0][1] === 'transition') out.push(`p${k} opens transition`);
  return out;
});
const inOrder = (sheets, count) => { const idx = sheets.flat().filter((x) => !x[2]).map((x) => x[0]); return idx.length === count && idx.every((v, i) => v === i); };

await withHarness(async (app) => {
  const open = async (rows) => {
    const id = `rp-${Date.now().toString(36)}-${++n}`;
    await app.evalJs("location.hash = '#/'"); await sleep(180);
    const doc = docOf(id, rows);
    await app.evalJs(`(() => { const W = window; W.wrizoCreateJournalPage({ id: ${q(id)}, text: ${q(rows.map((r) => r[1]).join('\n\n'))}, pageType: 'script', origin: 'journal', source: 'page', createdAt: new Date().toISOString() }); W.wrizoPatchEntry(${q(id)}, { script: ${q(doc)} }); W.wrizoFlushNow(); return true; })()`);
    await app.evalJs(`location.hash = '#/page/${id}'`);
    await app.waitFor("!!document.querySelector('.script-sheet .script-el')", { label: 'the script page', timeout: 15000 });
    await sleep(420);
    return app.evalJs(SHEETS);
  };

  await app.emulateDpr(1, 1366, 768);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','machina');");
  await app.evalJs("history.replaceState(null, '', '/?reorg=1&arbor2=0#/'); null");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 20000 });
  await app.waitFor("!document.querySelector('.wz-splash')", { label: 'splash gone', timeout: 15000 }).catch(() => {});

  const h = await open(H25);
  ok('RP1: a heading that would end a page goes over with what follows it, and the pages after flow on: four pages, none holding one line',
    h.length === 4 && lonely(h).length === 0 && h[1][0] && h[1][0][0] === 26, { pages: h.length, perPage: h.map((s) => s.length), lonely: lonely(h), page2opens: h[1] && h[1][0] });
  const hc = await open(HC24);
  ok('RP2: a heading and the cue under it go over together with the speech, and the pages after flow on: three pages, none holding one line',
    hc.length === 3 && lonely(hc).length === 0 && JSON.stringify((hc[1] || []).slice(0, 3).map((x) => x[0])) === '[25,26,27]', { pages: hc.length, perPage: hc.map((s) => s.length), lonely: lonely(hc), page2opens: hc[1] && hc[1].slice(0, 3) });
  const t = await open(T26);
  ok('RP3: a transition that would open a page takes the line above it over, and the pages after flow on: three pages, none holding one line',
    t.length === 3 && lonely(t).length === 0 && JSON.stringify((t[1] || []).slice(0, 2).map((x) => x[1])) === '["action","transition"]', { pages: t.length, perPage: t.map((s) => s.length), lonely: lonely(t), page2opens: t[1] && t[1].slice(0, 2) });
  ok('RP4 (control): on all three, no page ends on a heading, a cue or a parenthetical, and none opens on a transition', [h, hc, t].every((x) => badEnds(x).length === 0), [h, hc, t].map(badEnds));
  const s = await open(SHORT);
  ok('RP5 (control): the panel\'s 950-word short (200 lines run on) is four pages, none ending on a cue or a heading', s.length === 4 && badEnds(s).length === 0, { pages: s.length, perPage: s.map((x) => x.length), bad: badEnds(s) });
  ok('RP6 (control): every line of all four scripts is on the pages exactly once, in order',
    inOrder(h, H25.length) && inOrder(hc, HC24.length) && inOrder(t, T26.length) && inOrder(s, SHORT.length), [inOrder(h, H25.length), inOrder(hc, HC24.length), inOrder(t, T26.length), inOrder(s, SHORT.length)]);
  return checks;
});

for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${String(c.detail).slice(0, 700)}]` : ''}`);
const passed = checks.filter((c) => c.pass).length;
const EXPECTED = 6;
const counted = checks.length === EXPECTED;
if (!counted) console.log(`COUNT: ${checks.length} checks ran, ${EXPECTED} expected`);
console.log(passed === checks.length && counted ? `\nSCRIPT-REPAIR-PASS VERIFY: PASS (${checks.length} checks)` : `\nSCRIPT-REPAIR-PASS VERIFY: FAIL - ${checks.length - passed}/${checks.length} failed`);
process.exit(passed === checks.length && counted ? 0 : 1);
