// ITEM 84 — THE DECK PHASE (the Tutor's Free Write roster, deck-drawn).
// Committed CDP verification scenario. Fixtures/technique adopted VERBATIM from
// tu1.mjs / tu2.mjs / sc1.mjs (freshDesk / freshProsePage / freshBoard /
// freshScriptPage / openTutor) — the "don't re-derive fixtures" law.
// Run: node scripts/harness/item84.mjs  (from apps/desktop, dist-web freshly built).
//
// WHAT THIS FILE HAS TO BITE ON, and why each claim needs a live proof:
//
//   S1 — MODE-AWARENESS. The census's headline finding was that the Tutor is
//        MODE-BLIND: not one branch in Tutor.tsx read the writing mode, and the
//        panel rendered identically everywhere. This is the panel's first
//        mode-aware layer, so the assertion cannot be "the roster renders" — it
//        must be "the roster renders in Free Write AND NOWHERE ELSE," proven on
//        all four surfaces that mount this component (prose Free Write, prose
//        Draft, screenplay, board). Absent, not disabled (G3).
//
//   S2 — THE DECK LAW, inherited whole from FX15. fx15.mjs:113 is the precedent
//        AND the enforcement pattern: "the rendered line is a verbatim member of
//        the local NUDGE_POOL deck." Same shape here, pointed at three pools —
//        and strengthened, because a preset press can be attributed: the line
//        must be a member of the pool belonging to THE PRESET THAT WAS PRESSED,
//        not merely of some pool. A model-composed line could not be a member.
//
//   S3 — ZERO NETWORK ON PRESS. Nick's button law (lock record §10) reads "a
//        counsel's button names what its own press sends." Here the press sends
//        NOTHING, which is exactly why this phase needs no disclosure gate and
//        no carve-out sentence — so THIS ASSERTION IS THE PHASE'S DISCLOSURE
//        OBLIGATION, discharged by proof rather than by prose. Proven from both
//        ends and deliberately not from one: a page-side counter over every
//        outbound primitive (fetch / XHR / sendBeacon / WebSocket — any URL, not
//        just the Tutor's route), and the server double's own request counter
//        (runtime-verify.mjs's `tutorChatCount`, added by this ticket). A
//        page-side trap alone could be wrong about what escapes it; a server
//        counter alone only watches one route.
//
//   S4 — THE ANTI-DELIBERATION RULE. Nick's, and a rule rather than a number:
//        "up to 3 prompts may exist behind an ask, but ONLY ONE IS EVER RENDERED
//        AT A TIME… Pressing again draws the next." His reasoning, verbatim: "We
//        don't want a user spending time debating which prompt to respond to —
//        the goal in Free Write is to get writing without much deliberation." A
//        build that shows three at once satisfies the count and defeats the
//        purpose, so the check is a NODE COUNT (exactly one, always), held
//        across repeat presses of one preset AND across switches between
//        presets. The ceiling rides with it, and so does NICK'S REFILL RULING
//        (verbatim): "It should reset after 100 words have been written with a
//        note to the user if they try to use it a fourth time before writing 100
//        words." That ruling SUPERSEDES this lane's own first reading, which
//        re-armed on any new writing or on a send — so the checks here straddle
//        the hundred deliberately (40 words must NOT refill; 105 must), because a
//        test that only proves "wrote, then re-armed" would pass the superseded
//        build too. A spent ask must also stay PRESSABLE: a fourth press answers
//        with a note, and a disabled control cannot answer anything.
//
//   S5 — REQUIREMENT 3, in Nick's own sentence: "Whether the user asks their own
//        question or selects a preset, the Tutor's response should be in the
//        same dialog/chat window where conversation can commence." Proven three
//        ways: the drawn line renders INSIDE .wz-tutor-convo-log; on the
//        writer's own Send it commits into the persisted thread AHEAD of their
//        message; and it is on the wire in `messages`, so the model is answering
//        a spur it can actually see. (Conversation RULES are deferred by Nick's
//        own word — this proves the window, never the rules.)
//
//   S6 — (A) OF THE ROSTER: "blank space with a flashing cursor where anything
//        can be asked." Free Write only.
//
//   S7 — A13, the wall. No preset press may put a byte on any writing surface.
//
// PARK SWEEP (this ticket's own, run before writing this file): the change is
// additive — one optional prop, one mode-gated render branch, one commit line in
// send(), five new lexicon ids, one new store module, one additive field on the
// harness server's /api/_state. Grepped every harness for assertions this could
// falsify: tu1.mjs's A13 structural walk clicks "every OTHER button species in
// the panel" and asserts the page text never changes — the presets join that
// walk and pass it; tu1.mjs:225-241's A15 dissolve checks focus the editor
// explicitly before typing (so the new Free-Write composer focus cannot steal
// their keystrokes) and dispatch Escape on `document`, whose target has no
// closest() and so never engages Tutor.tsx's .wz-tutor-zone guard; every
// typeKeys() in tu1/tu2/tu5/fx10 is preceded by an explicit focus() of its
// intended target. fx10.mjs's no-scroll-within-scroll walk reads computed
// overflow across every panel descendant — the new roster row declares no
// overflow of any kind and wraps instead. NOTHING PARKED.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The strings of record — Nick's own lock word, docs/menus/tutor/
// tutor-menus-lock-record.md §1 line 1, in his ruled order. Taken from the lock
// record and never from a pass file or the mockup HTML (that record's §3 rule).
const PRESET_LABELS = ['Writing Prompt', 'Unblock', 'Free Writing Tips'];
const PRESET_IDS = ['writingPrompt', 'unblock', 'tips'];

// NICK'S REFILL RULING, verbatim: "It should reset after 100 words have been
// written with a note to the user if they try to use it a fourth time before
// writing 100 words." The two typing fixtures below straddle that threshold on
// purpose — the first must NOT refill, the second must. Short words keep the
// keystroke count sane (typeKeys dispatches two CDP events per character) while
// staying honest to the instrument, which is whitespace-delimited (F1).
const REFILL_WORDS = 100;
const shortOfHundred = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ');   // 40 words — under
const restOfHundred = Array.from({ length: 65 }, (_, i) => `x${i}`).join(' ');    // +65 = 105 — over

// NICK'S OWN LINE, verbatim — he superseded the desk's three candidates with
// this one, and it is the string of record. Asserted byte-for-byte rather than
// by pattern, and asserted to be the SAME string at zero words and at forty:
// that is what proves it is a rule and not a progress report.
const REFILL_NOTE = 'Write 100 words to unlock more prompts';

// --- tu1.mjs / tu2.mjs's own fixtures, copied verbatim --------------------
const freshDesk = async (app, width = 1400, height = 900, { skipDisclosure = true } = {}) => {
  await app.goto('/');
  await app.evalJs(
    "localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1');"
    + (skipDisclosure ? " localStorage.setItem('wrizo-tutor-disclosure-seen', '1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version', '4');" : ''),
  );
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk before fixture' });
  await app.emulateDpr(1, width, height);
};

const freshProsePage = async (app, width = 1400, height = 900, opts = {}) => {
  await freshDesk(app, width, height, opts);
  await app.goto('/project/new');
  await app.waitFor("!!document.querySelector('[data-kind=\"book\"]')", { label: 'CreateProject picker (book)' });
  await app.evalJs("document.querySelector('[data-kind=\"book\"]').click()");
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'PageEditor mounted, framed' });
  await sleep(400); // store/persistence.ts's FLUSH_DELAY (300ms) — tu1.mjs's own note
};

// sc1.mjs's own: through the real wizard, onto a real screenplay page.
const freshScriptPage = async (app, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.goto('/project/new');
  await app.waitFor('!!document.querySelector(\'[data-kind="screenplay"]\')', { label: 'CreateProject picker (screenplay)' });
  await app.evalJs('document.querySelector(\'[data-kind="screenplay"]\').click()');
  await app.click('Start writing');
  await app.waitFor("!!document.querySelector('.script-el-active')", { label: 'screenplay surface' });
  await sleep(400);
};

// tu2.mjs's own freshBoard.
const freshBoard = async (app, boardId, width = 1400, height = 900) => {
  await freshDesk(app, width, height);
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    const entries = JSON.parse(localStorage.getItem('writer-studio-journal-entries') || '[]');
    entries.push({ id: ${JSON.stringify(boardId)}, text: 'Item 84 Board', projectId: null, pageType: 'board', source: 'page', boxes: [], createdAt: now, updatedAt: now });
    localStorage.setItem('writer-studio-journal-entries', JSON.stringify(entries));
  })()`);
  await app.reload();
  await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(boardId)}`);
  await app.waitFor("!!document.querySelector('.board-canvas')", { label: 'board framed' });
  await sleep(400);
  await app.emulateDpr(1, width, height);
};

const openTutor = async (app) => {
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
  await sleep(300);
};

const rawEntry = async (app, id) =>
  app.evalJs(`JSON.parse(localStorage.getItem('writer-studio-journal-entries')||'[]').find(e => e.id === ${JSON.stringify(id)}) ?? null`);

const armTutorMode = (app, mode) =>
  app.evalJs(`fetch('/api/_tutor_mode', { method: 'POST', body: JSON.stringify(${JSON.stringify(mode)}) })`);

const lastTutorBody = async (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.lastTutorChatBody)");

// --- item 84's own helpers ------------------------------------------------
const press = async (app, id) => {
  await app.evalJs(`document.querySelector('.wz-tutor-fw-preset[data-preset="${id}"]')?.click()`);
  await sleep(160);
};

const rosterState = (app) => app.evalJs(`(() => {
  const roster = document.querySelector('.wz-tutor-fw-roster');
  const presets = [...document.querySelectorAll('.wz-tutor-fw-preset')];
  const draws = [...document.querySelectorAll('.wz-tutor-draw')];
  const log = document.querySelector('.wz-tutor-convo-log');
  return {
    rosterPresent: !!roster,
    convoPresent: !!document.querySelector('.wz-tutor-convo-row'),
    labels: presets.map(b => b.textContent.trim()),
    ids: presets.map(b => b.dataset.preset),
    disabled: presets.map(b => b.disabled),
    spent: presets.map(b => b.dataset.spent),
    note: document.querySelector('.wz-tutor-fw-note')?.textContent ?? null,
    noteFor: document.querySelector('.wz-tutor-fw-note')?.dataset.noteFor ?? null,
    drawCount: draws.length,
    drawText: draws[0] ? draws[0].textContent : null,
    drawPreset: draws[0] ? draws[0].dataset.drawn : null,
    drawInsideLog: !!(draws[0] && log && log.contains(draws[0])),
  };
})()`);

// The page-side outbound-traffic counter. Wraps every primitive by which a byte
// could leave this document — not just the Tutor's own route — because the claim
// being proven is "nothing travels", not "the Tutor's endpoint wasn't called".
// Installed once, then zeroed immediately before each measured window (zeroing
// is an evalJs, which rides CDP and never touches fetch, so the reset itself
// cannot pollute the count it is resetting).
const installNetCounter = (app) => app.evalJs(`(() => {
  if (window.__i84net) { window.__i84net.reset(); return true; }
  const R = { fetch: 0, xhr: 0, beacon: 0, ws: 0, urls: [] };
  const note = (kind, url) => { R[kind] += 1; R.urls.push(kind + ':' + String(url)); };
  const realFetch = window.fetch;
  window.fetch = function (...args) {
    const u = args[0] && args[0].url ? args[0].url : args[0];
    note('fetch', u);
    return realFetch.apply(this, args);
  };
  const realOpen = window.XMLHttpRequest.prototype.open;
  window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    note('xhr', url);
    return realOpen.call(this, method, url, ...rest);
  };
  if (navigator.sendBeacon) {
    const realBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => { note('beacon', url); return realBeacon(url, data); };
  }
  const RealWS = window.WebSocket;
  window.WebSocket = function (url, protocols) { note('ws', url); return new RealWS(url, protocols); };
  window.WebSocket.prototype = RealWS.prototype;
  R.reset = () => { R.fetch = 0; R.xhr = 0; R.beacon = 0; R.ws = 0; R.urls = []; };
  window.__i84net = R;
  return true;
})()`);

// Read WITHOUT a fetch (CDP only), so reading cannot bump what it reads.
const netCounts = (app) => app.evalJs(
  "(() => { const R = window.__i84net; return { fetch: R.fetch, xhr: R.xhr, beacon: R.beacon, ws: R.ws, urls: R.urls.slice(0, 8) }; })()",
);
const resetNet = (app) => app.evalJs('window.__i84net.reset(); true');
const serverTutorChatCount = (app) =>
  app.evalJs("fetch('/api/_state').then(r => r.json()).then(s => s.tutorChatCount)");

const switchMode = async (app, label) => {
  await app.evalJs(`[...document.querySelectorAll('.desk-mode-tab')].find(b => b.textContent.trim() === ${JSON.stringify(label)})?.click()`);
  await sleep(400);
};

const activeIsComposer = (app) =>
  app.evalJs("!!(document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('wz-tutor-convo-input'))");

await withHarness(async (app) => {
  // ==========================================================================
  // S0 — the deck seam itself. Everything below reads these pools; prove first
  // that they exist, are non-empty, and carry the ceiling the rule names.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    const deck = await app.evalJs(`(() => {
      const d = window.wrizoTutorFreeWriteDeck;
      if (!d) return null;
      return {
        ids: Object.keys(d.POOLS),
        sizes: Object.keys(d.POOLS).map(k => d.POOLS[k].length),
        ceiling: d.DRAW_CEILING,
        refillWords: d.REFILL_WORDS,
        allStrings: Object.keys(d.POOLS).every(k => d.POOLS[k].every(x => typeof x === 'string' && x.trim().length > 0)),
      };
    })()`);
    ok('S0: the local deck seam exists and carries exactly the three preset pools, every member a non-empty string',
      !!deck && JSON.stringify(deck.ids) === JSON.stringify(PRESET_IDS) && deck.allStrings === true && deck.sizes.every(n => n > 0),
      JSON.stringify(deck));
    ok('S0: the anti-deliberation ceiling is 3 — "up to 3 prompts may exist behind an ask"',
      !!deck && deck.ceiling === 3, JSON.stringify(deck && deck.ceiling));
    ok(`S0 (the refill ruling): the refill threshold is ${REFILL_WORDS} words — Nick's "it should reset after 100 words have been written"`,
      !!deck && deck.refillWords === REFILL_WORDS, JSON.stringify(deck && deck.refillWords));
  }

  // ==========================================================================
  // S1 — THE ROSTER APPEARS IN FREE WRITE, AND NOWHERE ELSE.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    await openTutor(app);
    const fw = await rosterState(app);
    ok('S1: in Free Write the roster renders — the panel\'s first mode-aware layer, live',
      fw.rosterPresent === true, JSON.stringify(fw));
    ok('S1: exactly THREE presets, carrying Nick\'s own lock strings in his ruled order — "Writing Prompt" · "Unblock" · "Free Writing Tips"',
      JSON.stringify(fw.labels) === JSON.stringify(PRESET_LABELS), JSON.stringify(fw.labels));
    ok('S1: no preset is born spent, and none is EVER `disabled` — the roster arrives usable, and a spent ask stays pressable so it can answer',
      fw.disabled.every(d => d === false) && fw.spent.every(sp => sp === 'false'), JSON.stringify({ disabled: fw.disabled, spent: fw.spent }));
    ok('S1: and no refill note stands before anything has been pressed',
      fw.note === null, JSON.stringify({ note: fw.note }));
    ok('S1: nothing is drawn before any press — the panel opens silent (A14: the room never knocks)',
      fw.drawCount === 0, JSON.stringify(fw));

    // Draft, on the SAME page: absent outright, and the conversation survives —
    // proving the absence is scoped to the roster and not a broken panel.
    await switchMode(app, 'Draft');
    const draft = await rosterState(app);
    ok('S1: switching that same page to DRAFT removes the roster entirely — ABSENT, never disabled (G3)',
      draft.rosterPresent === false && draft.labels.length === 0, JSON.stringify(draft));
    ok('S1: the Draft panel is otherwise untouched — the conversation and its composer still render',
      draft.convoPresent === true, JSON.stringify(draft));

    // …and back again: the layer is a live branch, not a first-render accident.
    await switchMode(app, 'Free Write');
    const back = await rosterState(app);
    ok('S1: switching back to Free Write restores the roster — the mode branch is live, not decided once at mount',
      back.rosterPresent === true && JSON.stringify(back.labels) === JSON.stringify(PRESET_LABELS), JSON.stringify(back));
  }

  {
    await freshScriptPage(app, 1400, 900);
    await openTutor(app);
    const script = await rosterState(app);
    ok('S1: on a SCREENPLAY page (Draft-only by its own law) the roster is absent, and the panel is otherwise whole',
      script.rosterPresent === false && script.convoPresent === true, JSON.stringify(script));
  }

  {
    await freshBoard(app, 'item84-board', 1400, 900);
    await openTutor(app);
    const board = await rosterState(app);
    ok('S1: on a BOARD (a surface with no writing mode at all — it mounts no mode strip) the roster is absent, and the panel is otherwise whole',
      board.rosterPresent === false && board.convoPresent === true, JSON.stringify(board));
  }

  // ==========================================================================
  // S2 — DECK-DRAWN, NEVER MODEL-DRAWN (fx15.mjs:113's assertion shape,
  // strengthened by attribution: the line must belong to the pool of the preset
  // that was actually pressed).
  // ==========================================================================
  {
    for (const id of PRESET_IDS) {
      await freshProsePage(app, 1400, 900);
      await openTutor(app);
      await press(app, id);
      const drawn = await app.evalJs(`(() => {
        const el = document.querySelector('.wz-tutor-draw');
        const d = window.wrizoTutorFreeWriteDeck;
        const text = el ? el.textContent : null;
        const pressed = el ? el.dataset.drawn : null;
        const own = pressed && d ? d.POOLS[pressed] : null;
        const anyPool = d ? [].concat(...Object.keys(d.POOLS).map(k => d.POOLS[k])) : [];
        return {
          text, pressed,
          memberOfOwnPool: !!own && !!text && own.includes(text),
          memberOfAnyPool: !!text && anyPool.includes(text),
        };
      })()`);
      ok(`S2 [${id}]: pressing the preset renders a line, and it is DECK-DRAWN — a VERBATIM member of that preset's own local pool (a model-composed line could not be a member)`,
        drawn.memberOfOwnPool === true && drawn.pressed === id, JSON.stringify(drawn));
      ok(`S2 [${id}]: the drawn line is attributable — it comes from the pressed preset's pool, not merely from some pool on the page`,
        drawn.memberOfOwnPool === true && drawn.memberOfAnyPool === true, JSON.stringify(drawn));
    }
  }

  // ==========================================================================
  // S3 — ZERO NETWORK ON PRESS. This phase's disclosure obligation, discharged
  // by proof. Measured from both ends, page-side read BEFORE the server-side
  // read so the instrumentation call cannot pollute the counter it verifies.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    await openTutor(app);
    await installNetCounter(app);
    const serverBefore = await serverTutorChatCount(app);
    await resetNet(app); // zero the page-side counter AFTER the /api/_state read above

    // Every preset, pressed more than once, plus a switch between presets —
    // the whole surface of the roster, in one measured window.
    await press(app, 'writingPrompt');
    await press(app, 'writingPrompt');
    await press(app, 'unblock');
    await press(app, 'tips');
    await sleep(400); // give any deferred/async send every chance to fire before measuring

    const net = await netCounts(app);            // CDP read — no fetch
    const serverAfter = await serverTutorChatCount(app); // fetch, deliberately after the read above

    ok('S3 (THE BUTTON LAW, discharged by proof): pressing the presets produces ZERO outbound network calls of any kind — no fetch, no XHR, no beacon, no websocket, to ANY url',
      net.fetch === 0 && net.xhr === 0 && net.beacon === 0 && net.ws === 0, JSON.stringify(net));
    ok('S3: and the server double agrees — its /api/tutor/chat request count is byte-identical across the whole press sequence',
      serverBefore === serverAfter, JSON.stringify({ serverBefore, serverAfter }));
    const afterPresses = await rosterState(app);
    ok('S3: the presses genuinely happened — a line is standing in the panel, drawn without a single byte leaving the device',
      afterPresses.drawCount === 1 && typeof afterPresses.drawText === 'string' && afterPresses.drawText.length > 0,
      JSON.stringify(afterPresses));
  }

  // ==========================================================================
  // S4 — THE ANTI-DELIBERATION RULE: one at a time, three behind an ask, and a
  // re-arm when the writer moves on.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    await openTutor(app);

    await press(app, 'writingPrompt');
    const one = await rosterState(app);
    await press(app, 'writingPrompt');
    const two = await rosterState(app);
    ok('S4: pressing again draws the NEXT — and there is still exactly ONE line rendered; a second draw REPLACES the first, it never stacks beside it',
      one.drawCount === 1 && two.drawCount === 1, JSON.stringify({ one: one.drawCount, two: two.drawCount }));
    ok('S4: the second draw is a different line — "pressing again draws the next", not the same line re-rendered',
      one.drawText !== two.drawText, JSON.stringify({ first: one.drawText, second: two.drawText }));

    // Switching presets must not stack either — one at a time is a property of
    // the ROSTER, not of a single preset.
    await press(app, 'unblock');
    const crossed = await rosterState(app);
    ok('S4: switching to a DIFFERENT preset still leaves exactly ONE line rendered, now attributed to the preset just pressed — a build that shows three at once satisfies the count and defeats the purpose',
      crossed.drawCount === 1 && crossed.drawPreset === 'unblock', JSON.stringify(crossed));

    // The ceiling: three behind one ask, then that ask is spent.
    await freshProsePage(app, 1400, 900);
    await openTutor(app);
    await press(app, 'tips');
    await press(app, 'tips');
    const beforeThird = await rosterState(app);
    ok('S4: an ask is still live after two draws — the ceiling has not fired early',
      beforeThird.spent[2] === 'false', JSON.stringify(beforeThird.spent));
    await press(app, 'tips');
    const spent = await rosterState(app);
    ok('S4: after the THIRD draw that ask is spent — the preset goes quiet (a transient gate on real capability, not an unbuilt feature wearing paint)',
      spent.spent[2] === 'true', JSON.stringify(spent.spent));
    ok('S4: the other two presets are untouched by one ask being spent — the ceiling is per ask, exactly as "up to 3 prompts may exist behind an ask" says',
      spent.spent[0] === 'false' && spent.spent[1] === 'false', JSON.stringify(spent.spent));
    await press(app, 'tips');
    const fourth = await rosterState(app);
    ok('S4: a fourth press changes nothing — the standing line is unmoved, and still exactly one',
      fourth.drawCount === 1 && fourth.drawText === spent.drawText, JSON.stringify({ spent: spent.drawText, fourth: fourth.drawText }));

    // THE FOURTH PRESS ANSWERS — Nick's ruling, verbatim: "a note to the user if
    // they try to use it a fourth time before writing 100 words." A spent ask is
    // not a dead control; it is one that says why. So it must NOT be `disabled`
    // (a disabled button cannot speak) and the press must produce a note.
    ok('S4 (the refill ruling): a spent preset is NOT disabled — it stays pressable, because a fourth press has to be able to answer',
      fourth.disabled.every(d => d === false), JSON.stringify(fourth.disabled));
    ok('S4 (the refill ruling): the fourth press shows a NOTE instead of a prompt, and draws nothing — the standing line is untouched',
      fourth.note !== null && fourth.drawCount === 1 && fourth.drawText === spent.drawText,
      JSON.stringify({ note: fourth.note, drawText: fourth.drawText }));
    ok('S4 (the refill ruling): the note is NICK\'S OWN LINE, verbatim — "Write 100 words to unlock more prompts", carrying the unlock condition inside the copy',
      fourth.note === REFILL_NOTE, JSON.stringify({ note: fourth.note, expected: REFILL_NOTE }));

    // WRITING LESS THAN A HUNDRED WORDS DOES NOT REFILL IT. This is the check
    // that makes the number mean something: before this ruling ANY new writing
    // re-armed the ask, and that build would pass a "writes then re-arms" test
    // while failing Nick's actual rule.
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(shortOfHundred);
    await sleep(350);
    await openTutor(app);
    const underRefill = await rosterState(app);
    ok(`S4 (the refill ruling): writing FEWER than ${REFILL_WORDS} words does NOT refill the deck — the ask is still spent`,
      underRefill.disabled.every(d => d === false) && underRefill.spent[2] === 'true', JSON.stringify(underRefill.spent));
    ok('S4: and the standing line SURVIVES that writing and the panel\'s dissolve — the spur is not deleted at the moment it starts working',
      underRefill.drawCount === 1 && underRefill.drawText === spent.drawText, JSON.stringify({ before: spent.drawText, after: underRefill.drawText }));

    // THE NOTE IS A CONSTANT, NOT A PROGRESS REPORT — proven structurally rather
    // than by pattern-matching for digits (Nick's own line contains "100", and a
    // digit ban would have been the wrong test as well as a failing one). Press
    // again now that FORTY of the hundred words are written: if the copy carried
    // any progress content at all — "60 to go", a bar, a percentage — this line
    // could not come back byte-identical. M1/CD4 holds: the threshold is a rule
    // and may be named; the writer's distance from it is a score and may not.
    await press(app, 'tips');
    const notedAtForty = await rosterState(app);
    ok('S4 (the refill ruling): the note is a CONSTANT — pressing again with 40 of the 100 words written returns the BYTE-IDENTICAL line, so it carries no countdown, no progress, no score',
      notedAtForty.note === fourth.note && notedAtForty.note === REFILL_NOTE,
      JSON.stringify({ atZero: fourth.note, atForty: notedAtForty.note }));

    // A HUNDRED WORDS REFILLS IT.
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys(restOfHundred);
    await sleep(500);
    await openTutor(app);
    const refilled = await rosterState(app);
    ok(`S4 (the refill ruling): once ${REFILL_WORDS} words are written the deck REFILLS — the ceiling is a nudge back to the page, never a wall`,
      refilled.spent.every(s => s === 'false'), JSON.stringify(refilled.spent));
    ok('S4 (the refill ruling): the refill clears the note it answered — nothing stale is left standing',
      refilled.note === null, JSON.stringify({ note: refilled.note }));
    await press(app, 'tips');
    const afterRefill = await rosterState(app);
    ok('S4 (the refill ruling): and the refilled ask genuinely draws again — a real pool member, not a second note',
      afterRefill.drawCount === 1 && afterRefill.note === null && afterRefill.drawText !== spent.drawText,
      JSON.stringify({ drawText: afterRefill.drawText }));
  }

  // ==========================================================================
  // S5 — REQUIREMENT 3: the same conversation window, and conversation continues
  // there. (The window, never the rules — those are deferred by Nick's word.)
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await armTutorMode(app, { configured: true, reply: 'A stubbed continuation.' });
    await openTutor(app);
    await press(app, 'writingPrompt');

    const placed = await rosterState(app);
    ok('S5: the drawn line lands INSIDE the conversation log itself — the same window the composer talks into, with no tray, panel or furniture of its own',
      placed.drawInsideLog === true, JSON.stringify(placed));

    const beforeSend = await rawEntry(app, pageId);
    ok('S5: a press alone persists NOTHING — no thread is conjured by an act that sent nothing (persistence.ts: a thread "is born on its first real message")',
      !beforeSend?.tutor, JSON.stringify(beforeSend?.tutor ?? null));

    const drawnText = placed.drawText;
    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Taking that one.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(600);

    const after = await rawEntry(app, pageId);
    const msgs = after?.tutor?.messages ?? [];
    ok('S5: on the writer\'s own Send the drawn line COMMITS into the thread, ahead of their message — the transcript reads in the order it happened: the spur, then the answer to it',
      msgs.length === 3 && msgs[0].role === 'tutor' && msgs[0].text === drawnText && msgs[1].role === 'writer' && msgs[1].text === 'Taking that one.',
      JSON.stringify(msgs.map(m => ({ role: m.role, text: m.text }))));
    ok('S5: conversation genuinely continues in that same window — the Tutor\'s reply lands as the next turn of the same thread',
      msgs.length === 3 && msgs[2].role === 'tutor' && msgs[2].text === 'A stubbed continuation.',
      JSON.stringify(msgs.map(m => m.role)));

    const body = await lastTutorBody(app);
    const wireTexts = (body?.messages ?? []).map(m => m.text);
    ok('S5: the wire carries the spur as an ordinary turn of the conversation — the model is answering a prompt it can actually see, on the writer\'s own Send and never before it',
      wireTexts[0] === drawnText && wireTexts[1] === 'Taking that one.', JSON.stringify(wireTexts));
    ok('S5: no new wire KEY is added by any of this — the body is still exactly { messages, delta?, bible? }',
      body !== null && Object.keys(body).every(k => ['messages', 'delta', 'bible'].includes(k)), JSON.stringify(Object.keys(body ?? {})));

    const settled = await rosterState(app);
    ok('S5: the standing draw is spent by the send — it is a real message now, so nothing is rendered twice',
      settled.drawCount === 0, JSON.stringify(settled));
    // Nick's refill ruling names exactly ONE refill condition — a hundred words
    // written — and conversation is not it. Before that ruling this lane's own
    // build re-armed on a send; that reading is SUPERSEDED, and this check is
    // what holds the supersession in place rather than letting it drift back.
    //
    // The ask must be genuinely SPENT before a send can be shown not to refill
    // it — one draw then a send proves nothing either way. Writing Prompt has
    // had exactly one draw so far in this fixture (and the send did not reset
    // it), so two more presses exhaust it.
    await press(app, 'writingPrompt');
    await press(app, 'writingPrompt');
    const exhausted = await rosterState(app);
    ok('S5: precondition — Writing Prompt is genuinely spent before the second send (a send cannot be shown not to refill an ask that was never spent)',
      exhausted.spent[0] === 'true', JSON.stringify({ spent: exhausted.spent }));

    await app.evalJs("document.querySelector('.wz-tutor-convo-input').focus()");
    await app.typeKeys('Another turn, with no writing on the page.');
    await app.evalJs("document.querySelector('.wz-tutor-convo-send').click()");
    await sleep(600);
    const afterSecondSend = await rosterState(app);
    ok('S5 (the refill ruling): a SEND does NOT refill the deck — the only refill is a hundred words on the page, because that is where Free Write wants the writer',
      afterSecondSend.spent[0] === 'true', JSON.stringify({ spent: afterSecondSend.spent }));
    await press(app, 'writingPrompt');
    const stillSpent = await rosterState(app);
    ok('S5 (the refill ruling): and pressing it after that send still answers with the NOTE, not a prompt — conversation bought no draws',
      stillSpent.note !== null && stillSpent.drawCount === 0, JSON.stringify({ note: stillSpent.note, drawCount: stillSpent.drawCount }));
    await armTutorMode(app, {}); // restore the double's default for anything after this
  }

  // ==========================================================================
  // S6 — (A) of the roster: a blank composer with a cursor. Free Write only.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    await openTutor(app);
    const focused = await activeIsComposer(app);
    const blank = await app.evalJs("document.querySelector('.wz-tutor-convo-input')?.value ?? null");
    ok('S6 (roster member A): opening the panel in Free Write puts the cursor in the composer — "blank space with a flashing cursor where anything can be asked"',
      focused === true, JSON.stringify({ focused }));
    ok('S6: and it is genuinely BLANK — nothing is staged into it, by a preset or by anything else',
      blank === '', JSON.stringify({ blank }));

    // Not in Draft: this is Free Write's posture, not a new global behaviour.
    // The Draft half needs a FRESH MOUNT rather than a mode switch in place —
    // a programmatic .click() does not move focus in Chromium, so a panel that
    // had already focused the composer in Free Write would still be holding it
    // and the check would pass for the wrong reason. PageEditor persists the
    // mode per page (its own `wrizo-mode-page-<id>` key), so switching then
    // reloading gives a page that OPENS in Draft, on which nothing has ever
    // focused the composer.
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await switchMode(app, 'Draft');
    await app.reload();
    await sleep(600);
    await app.evalJs(`location.hash = '#/page/' + ${JSON.stringify(pageId)}`);
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { label: 'page reopened, in Draft' });
    await sleep(400);
    const modeNow = await app.evalJs("[...document.querySelectorAll('.desk-mode-tab')].find(b => b.classList.contains('active'))?.textContent.trim()");
    ok('S6: precondition — the page genuinely reopened in DRAFT (a fresh mount, so nothing has ever focused this panel\'s composer)',
      modeNow === 'Draft', JSON.stringify({ modeNow }));
    await openTutor(app);
    const draftFocused = await activeIsComposer(app);
    const draftRoster = await rosterState(app);
    ok('S6: Draft does NOT take the composer\'s focus on open — the cursor is Free Write\'s posture, not a new global behaviour',
      draftFocused === false, JSON.stringify({ draftFocused }));
    // ITEM 84b park sweep — this check still PASSES (it reads
    // `.wz-tutor-fw-roster`, the Free Write roster's own class, and Draft still
    // carries none of that) but it has stopped MEANING what it says: the Draft
    // panel now carries a roster of its own, the four-chip Draft roster. A claim
    // that stops meaning what it says is parked, never quietly reinterpreted, so
    // the original stands verbatim at the foot of this file and this is its fresh,
    // narrower successor — which also asserts the true post-ticket state rather
    // than only the absence half of it. The owning live successor is item84b.mjs's
    // own S1 mode-boundary section.
    const draftHasDraftRoster = await app.evalJs("!!document.querySelector('.wz-tutor-draft-roster')");
    ok('S6: and that Draft panel carries no FREE WRITE roster either — the two halves of the mode branch agree. It carries the DRAFT roster instead (item 84b), which is what makes them two sides of one branch rather than one roster with a condition',
      draftRoster.rosterPresent === false && draftHasDraftRoster === true,
      JSON.stringify({ fwRoster: draftRoster.rosterPresent, draftRoster: draftHasDraftRoster }));
  }

  // ==========================================================================
  // S7 — A13: the wall. A press can never put a byte on a writing surface.
  // ==========================================================================
  {
    await freshProsePage(app, 1400, 900);
    const pageId = await app.evalJs("location.hash.split('/page/')[1]");
    await app.evalJs("document.querySelector('.forward-only-editor').focus()");
    await app.typeKeys('The writer own words, which nothing here may touch.');
    await sleep(400);
    await openTutor(app);
    const pageBefore = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
    const storedBefore = (await rawEntry(app, pageId))?.text;

    for (const id of PRESET_IDS) {
      await press(app, id);
      const pageNow = await app.evalJs("document.querySelector('.forward-only-editor').innerText");
      ok(`S7 (A13) [${id}]: pressing the preset never changes the page's own text — a drawn line addresses the Tutor's window and has no path to the paper`,
        pageNow === pageBefore, JSON.stringify({ pageBefore, pageNow }));
    }
    await sleep(400);
    const storedAfter = (await rawEntry(app, pageId))?.text;
    ok('S7 (A13): and the persisted page entry is byte-identical after the whole roster has been pressed',
      storedBefore === storedAfter, JSON.stringify({ storedBefore, storedAfter }));
  }

  return checks;
});

// eslint-disable-next-line no-console
console.log(JSON.stringify(checks, null, 2));
// ITEM 84's deck phase parked NOTHING of its own — see this file's own park-sweep
// note in the header; the change was additive on every seam it touched.
//
// ITEM 84b (the Draft roster) parks ONE check that lives here, recorded below. It
// is a park of MEANING rather than of truth: the original still passes against
// the 84b build, because it reads the Free Write roster's class and Draft carries
// none of that — but "carries no roster either" ceased to describe a panel that
// now carries the four Draft chips. The house law is that such a claim is parked
// verbatim with its successor named, never edited into agreement with the new
// build, so the sentence below is the sentence that was written.
const parkedChecks = [];
{
  const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass, detail });
  pok('PARKED (was "S6: and that Draft panel carries no roster either — the two halves of the mode branch agree") — ITEM 84b: Draft now carries the four-chip Draft roster, so "no roster" no longer describes that panel; the check\'s own selector still passes, its wording no longer holds — live successor in item84b.mjs\'s S1 mode-boundary section (and re-asserted fresh above, narrowed to the Free Write roster and paired with the Draft roster\'s presence)',
    true, 'superseded by ITEM 84b\'s Draft roster');
}
if (process.env.HARNESS_PARKED === '1') {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(parkedChecks, null, 2));
  const parkedPass = parkedChecks.every((c) => c.pass);
  // eslint-disable-next-line no-console
  console.log(parkedPass
    ? `\nITEM84 PARKED: PASS (${parkedChecks.length} checks) — HARNESS_PARKED=1 armed: one ITEM-84b-superseded mode-branch check (successor in item84b.mjs). The deck phase itself parked nothing.`
    : `\nITEM84 PARKED: FAIL — ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass ? `\nITEM84 VERIFY: PASS (${checks.length} checks)` : `\nITEM84 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
