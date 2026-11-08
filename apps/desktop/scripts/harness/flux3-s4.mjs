// FLUX3 S4 - JACKED IN + THE JACK IN DEFAULT (flux-rulings-oct31.md q8; Fable's S4 rulings, Nov 6: A the idle line is out; C Jacked In keeps
// today's Typewriter controls EXACTLY, the same Esc and the same reach-to-summon; D the switch is in-session; E the dress on every Flux Typewriter,
// the default on Free Write only; F the compile on the pause; G the burst edge drains with the goal's lap; B the tunnel waits for Nick).
// The build: src/flux3/FluxJackedIn.tsx (the default, the compile, the decompile), FluxBurstEdge.tsx, jackIn.ts (the session state), the
// Free Write overlay in store/writingSettings.ts (read by ModeStage and the Sliver), the switch in the Sliver's foot, flux-v3.css; mount points
// in ModeStage and DeskInstrument; the idle glitch is off while jacked in. The page-rect law keeps its own guard (flux3-page-rect.mjs).
//
// THE PAGES, seeded through the app's seams (wrizoCreateJournalPage; never raw storage): loose pages open in Free Write (the app's own rule:
// origin 'loose'); a Draft page (origin null) with its own Typewriter memory set ('wrizo-typewriter-page-<id>', a preference, not a collection).
// Every open sets the shared Typewriter field OFF (the writing settings), so a Free Write page that opens jacked in did so by the default alone.
//
//   DEF    flag on, Flux: a loose page opens in Free Write JACKED IN (zoomed, data-flux3-jacked) while the shared field stays off; the first frame
//          with the editor is already zoomed (never painted un-jacked); Draft -> Free Write jacks in again. Flag off, or another theme: not jacked.
//          A Draft page whose own memory is off is not jacked (the default is Free Write's only).
//   SWITCH the "Jack In by default" switch: in the TOOLS foot under the flag in Flux only (absent off the flag and in another theme); Off -> Free
//          Write opens un-jacked; On -> jacked again; flipping it writes NOTHING to storage (in-session, ruling D).
//   TOGGLE today's Typewriter toggle jacks out (zoom off, shared field still off) and back in (it writes the shared field, as today).
//   RESTORE (q8) jacking in and out on a Draft page: the jacked rect is the Typewriter's own zoom rect (flag on = flag off), and on leaving the
//          rect, the scroll, the caret and the text are exactly as before (and as the control's).
//   COMPILE (F) on the pause, words two lines up and beyond are covered by signal: no layer change and no compile grant while keys land; after
//          the pause every covered word is >= 2 lines above the caret, none on the caret's line or the line above (which has words: coverage);
//          every glyph run stands on its OWN word's rect (+-1 px), also after a scroll with no re-compile; the text, the caret and the Glitch
//          bar's count are unchanged; the layer is aria-hidden, takes no pointer and cannot be selected.
//   DECOMPILE jacking out with signal showing: one decompile grant, the glyph runs on their words as the page settles, the layer gone by 700 ms,
//          the text unchanged. STILL: reduced motion and Ambiance 0 cut it (gone at once, no grant).
//   FLASH  no second with more than 3 granted flashes, across the compile and decompile runs.
//   IDLE   no idle glitch while jacked in (the idle clock told it has been still 400 s); it is back after jacking out (premise).
//   EDGE   (G) the burst edge: a 2 px line on the window's top, holding 1 - the lap (249 of 250 words: 0.004), drawn by a transform with no
//          transition; at the goal it empties, then fills for the next lap; absent once jacked out and with Progress off.
//   ESC / REACH (C) while jacked in, Esc does what it does today (the chrome comes back; still jacked in), and an edge dwell summons the chrome:
//          both identical to the control (flag off, the Typewriter on). ESC-LATER (the Wrizors' S4 review, Fable Nov 7): >= 1.2 s after Esc,
//          the band mask, every opacity down to the lines, the caret, the focus and Flux's block caret are the control's (the signal reported).
//          ESC-READ (the r4 frames: the control's lines read after Esc, Jacked In's stayed compiled): Esc resolves the signal through the
//          budget, so at 1.2 s no word is compiled; writing again, the next pause compiles. MUT-LOOKUP (landed): Esc not resolving fails it.
//   COMPILE-WHOLE (same review) every character, punctuation included, is ONE WHOLE block inside its own slot; no text in the layer.
//          MUT-BLOCK (landed) a block wider than its slot: COMPILE-WHOLE fails.
//   TUN    THE TUNNEL (Nick kept it, Nov 7; INK's lean B, src/flux3/FluxTunnel.tsx): while jacked in, first in .mode-stage behind the page,
//          aria-hidden, no pointer, no canvas, 12 frames, every animation transform/opacity only and running; the paper opaque and above it.
//          TUN-TYPE the named recede exception: while keys land (the chrome receded) it stays and runs. TUN-RATE re-set at most every 2 s
//          (every updatePlaybackRate is logged), faster while she types fast, the streaks at speed, back to rest after; its only DOM change the
//          streaks' flag, at most every 2 s. TUN-STILL no animation under reduced motion and Ambiance 0. TUN-WHERE only while jacked in.
//          MUT-RECEDE / MUT-HOLD (landed): each one-line switch flipped alone does exactly its thing. MUT-RESET (landed): TUN-RATE fails.
//          TUN-CLEAR (the r5 frames: the tunnel showed through the band mask's fade, behind the text): the page's rect is cut out of the tunnel
//          (a still mask hole, measured on mount, settle, resize and zoom), at rest and while she types. MUT-NOHOLE (landed): it fails.
//          INFO SPLIT: L's K arm, Jacked In with the tunnel never mounted (landed), so a red L splits into the tunnel's share.
//   TERM   THE TERMINAL (Nick, Nov 7, the spec's draft 13 §6, r9): jacked in there is no paper. TERM-PAPER the page clear, its readouts hidden,
//          the veil on the editor, the ground the white room (light: the paper's colour) or the night glass (dark: nothing laid). TERM-LINES in
//          pixels (a clipped screenshot decoded in the page): the writing line and the dim line above it >= 4.5:1 (the dim one dimmer), and the
//          line two up, risen during a burst and not yet signal, shows no text (< 2.5:1: only the tunnel's lines). TERM-ROWS on the pause each
//          row of signal smaller toward the top. ESC-TERM Esc lifts the veil, writing lowers it. TUN [successor] / TUN-BEHIND: the words inside
//          the tunnel, nothing cut out of it (TUN's opaque paper, TUN-CLEAR and MUT-NOHOLE PARKED). MUT-TERMINAL / MUT-DIM (landed in
//          boot-*.css), MUT-ROWS (landed) and MUT-LOOKUP-TERM each fail their check.
//   CARET  (Nick's ruling, Nov 7) CARET-JACKED-LIGHT Jacked In's light caret is brass (#FF9800) with a 1 px solid ink outline >= 4.5:1
//          against the page; CARET-PLAIN-LIGHT outside Jacked In the light caret's fill (#A84E00) >= 4.5:1, no outline; MUT-OUTLINE and
//          MUT-CARET [successor] (landed in boot-*.css) each fail theirs. (CARET-LIGHT and MUT-CARET below are PARKED by the ruling.)
//   CARET  (the Wrizors' S4 r7 blocker, Fable Nov 7: the light tone's caret read 1.4:1) CARET-LIGHT Flux's block caret on the light page is
//          >= 4.5:1 against the page under it (computed colours, its alpha composited), in the orange family; CARET-DARK the dark tone keeps the
//          shared orange. MUT-CARET (landed, in boot-*.css: flux-v3.css's built file) the shared orange back on the light page: CARET-LIGHT
//          fails. INFO CARET-CONTROL prints the flag-off light caret (Flux v2: not S4's scope).
//   FL     Forward Lock is today's: Backspace in Jacked In strikes and never deletes, exactly as the control.
//   L      the Jacked In arm (box only; information on Actions): key -> paint (rhizome-latency's method) against the control (Flux, flag off, the
//          Typewriter on), interleaved rounds: J median <= C median + C's spread, p95 likewise, no key over 100 ms; no canvas drew more while
//          keys landed than in the control.
//   MUT-*  red-first, each a LANDED mutant (a pattern matched exactly once in index-*.js, replaced in flight): the compile per key (COMPILE-ZERO
//          fails); the compile one line up (COMPILE lines fails); the default not laid (DEF fails); the toggle not clearing the default (TOGGLE
//          fails); the idle glitch running while jacked (IDLE fails); the edge filling instead of draining (EDGE fails); the still state ignored
//          (STILL fails).
//   B      the build: the bundle served is dist-web's, built after the last commit touching apps/desktop/src.
//
// FLUX3_SHOTS=<dir> writes the frames. Run: node scripts/harness/flux3-s4.mjs (from apps/desktop; a box turn).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { withHarness } from '../runtime-verify.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, '..', '..', '..', '..');
const DIST = path.resolve(here, '..', '..', 'dist-web');
const SHOTS = process.env.FLUX3_SHOTS || null;
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const ON_BOX = process.env.GITHUB_ACTIONS !== 'true';
const LONG = 'f3s4-long', DRAFTP = 'f3s4-draft', GOAL = 'f3s4-goal', FL_ON = 'f3s4-fl-on', FL_OFF = 'f3s4-fl-off', CARETP = 'f3s4-caret';
const PARA = 'The signal runs along these plain words so that the page holds many lines above the writing line, each one long enough to wrap across the measure of the page.';
const LONG_TEXT = Array.from({ length: 10 }, (_, i) => `${i + 1}. ${PARA}`).join('\n');
const LAT_TEXT = Array.from({ length: 150 }, (_, i) => 'word' + i).join(' ');
const CYCLE = 'the signal holds while she writes on ';
const ROUNDS = 3, KEYS = 44, MIN_KEYS = 40, GAP = 90, MAX_MS = 100;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass: !!pass, detail });
// PARKED (HARNESS_PARKED=1): retired checks, quoted verbatim with what superseded them, each re-asserting the new truth; the COUNT is held too
const parkedChecks = [];
const pok = (name, pass, detail = '') => parkedChecks.push({ name, pass: !!pass, detail });
// ESC-LATER's premise that the control keeps its caret after Esc (Actions 42359165446, Nov 7); TUN's opaque paper, TUN-CLEAR and MUT-NOHOLE
// (Nick's terminal, Nov 7, r9: no paper, the words inside the tunnel); r9's own first run (Actions 42410571466): TUN-BEHIND's covers premise
// and TERM-ROWS' "smaller every row" (light and dark: two records); TERM-ROWS [successor]'s "down to the floor" (Actions 42415597899: two records)
// TERM-LINES' "before the pause" (light, dark) with MUT-TERMINAL and MUT-DIM (Actions 42420374454: four records)
// CARET-LIGHT and MUT-CARET (Nick's ruling, Nov 7: Jacked In's light caret is brass with a 1 px ink outline: two records)
// MUT-CARETEND and MUT-RETRY (Actions 42431319040: both blind on their first run)
// MUT-OPENROWS (Actions 42435766295: the open drew its rows with the elements count back; the cause was the scroll)
const PARKED_EXPECTED = 18;

function buildIdentity() {
  const out = { bundle: null, builtAt: null, head: null, srcCommitAt: null, dirtySrc: null, stale: null };
  try {
    const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const m = html.match(/assets\/(index-[\w-]+\.js)/);
    out.bundle = m ? m[1] : null;
    out.builtAt = fs.statSync(path.join(DIST, 'index.html')).mtime.toISOString();
  } catch { /* no bundle: withHarness refuses on its own */ }
  try {
    const git = (...a) => execFileSync('git', a, { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    out.head = git('rev-parse', '--short=8', 'HEAD');
    out.srcCommitAt = new Date(Number(git('log', '-1', '--format=%ct', '--', 'apps/desktop/src')) * 1000).toISOString();
    out.dirtySrc = git('status', '--porcelain', '--', 'apps/desktop/src').split('\n').filter(Boolean).length;
    out.stale = out.builtAt ? Date.parse(out.builtAt) < Date.parse(out.srcCommitAt) : null;
  } catch { /* git unavailable: reported as null, and B fails on it */ }
  return out;
}
const BUILD = buildIdentity();
console.log(`BUILD: tree=${BUILD.head} bundle=${BUILD.bundle} builtAt=${BUILD.builtAt} lastSrcCommit=${BUILD.srcCommitAt} dirtySrcFiles=${BUILD.dirtySrc} stale=${BUILD.stale} machine=${ON_BOX ? 'box' : 'actions'}`);

// ---- the outside instrument (a new-document script, in place before the app's first line) + page-side readers -----------------------------------
const INSTRUMENT = `(() => {
  if (window.__f4) return;
  const I = window.__f4 = { keys: [], first: null, layerMut: [], draws: 0, frames: [] };
  window.__wzVerifyFlashes = true;
  window.__wzVerifyCompile = true;   // FluxJackedIn's harness-only log of why each compile stopped
  // every event the compile's pause listens to, counted (r10b: at rest after opening the compile never ran at all: something kept resetting it)
  I.evc = {};
  for (const t of ['selectionchange', 'keydown', 'beforeinput', 'wz-zoom-changed', 'scroll']) document.addEventListener(t, (e) => { const k = t === 'scroll' ? 'scroll:' + ((e.target && e.target.className && String(e.target.className).slice(0, 24)) || (e.target === document ? 'document' : '?')) : t; I.evc[k] = (I.evc[k] || 0) + 1; }, true);
  addEventListener('resize', () => { I.evc.resize = (I.evc.resize || 0) + 1; });
  addEventListener('keydown', () => I.keys.push(performance.now()), true);
  // the first frame in which the editor exists: was the page already zoomed (jacked in)?
  const watchFirst = () => { const ed = document.querySelector('.forward-only-editor'); if (ed) { const c = document.querySelector('.mode-pagecol'); I.first = { at: performance.now(), zoom: c ? c.getAttribute('data-zoom') : null, jacked: document.documentElement.hasAttribute('data-flux3-jacked') }; return; } requestAnimationFrame(watchFirst); };
  requestAnimationFrame(watchFirst);
  // canvas draw calls, bucketed per frame (the latency arm's damping read)
  const P = CanvasRenderingContext2D.prototype;
  for (const m of ['stroke', 'fill', 'fillRect', 'strokeRect', 'clearRect', 'drawImage', 'fillText', 'strokeText', 'putImageData']) {
    const o = P[m]; if (typeof o !== 'function') continue;
    P[m] = function (...a) { I.draws += 1; return o.apply(this, a); };
  }
  const raf = window.requestAnimationFrame.bind(window);
  const tick = () => { I.frames.push([performance.now(), I.draws]); I.draws = 0; if (I.frames.length > 20000) I.frames.splice(0, 10000); raf(tick); };
  raf(tick);
  const rr = (r) => ({ x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2) });
  I.ed = () => document.querySelector('.forward-only-editor');
  // the caret: its rect, and how much of the editor's text stands before it. A collapsed range at the end of the text has no rect of its own
  // (the first Actions run read 0,0,0,0 there), so the rect falls back to the last line box of the text before the caret
  I.caret = () => { const ed = I.ed(), s = getSelection(); if (!ed || !s || !s.rangeCount || !ed.contains(s.anchorNode)) return null; const r0 = s.getRangeAt(0);
    const pre = document.createRange(); pre.selectNodeContents(ed); pre.setEnd(r0.startContainer, r0.startOffset);
    let r = r0.getClientRects()[0]; if (!r || !r.height) { const rs = [...pre.getClientRects()].filter((x) => x.height > 0); r = rs.length ? rs[rs.length - 1] : r0.getBoundingClientRect(); }
    return { before: pre.toString().length, r: rr(r) }; };
  I.toEnd = () => { const ed = I.ed(); if (!ed) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(ed); s.collapseToEnd(); return true; };
  // the caret at the end of row i (a row on screen at the top of the page: the writer's caret in view)
  I.toRow = (i) => { const ed = I.ed(), row = ed && [...ed.querySelectorAll('.wz-row')][i]; if (!row) return false; ed.focus(); const s = getSelection(); s.selectAllChildren(row); s.collapseToEnd(); return true; };
  I.lh = () => { const ed = I.ed(), L = document.querySelector('[data-flux3-compile]') || (ed && ed.parentElement); if (!ed) return null; const raw = parseFloat(getComputedStyle(ed).lineHeight); const s = ed.offsetWidth ? ed.getBoundingClientRect().width / ed.offsetWidth : 1; return Number.isFinite(raw) && raw > 0 ? raw * s : null; };
  // every word in the editor with its rect (one rect each), for the compile's checks
  I.words = () => { const ed = I.ed(); if (!ed) return []; const out = []; const walk = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) { for (const m of (n.nodeValue || '').matchAll(/\\S+/gu)) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const rs = r.getClientRects(); if (rs.length === 1) out.push({ t: m[0], r: rr(rs[0]) }); } }
    return out; };
  // the compiled words: each glyph run, and the nearest word of the same text (its own rect), and how far apart they stand
  I.compiled = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null; const ws = I.words();
    const list = [...L.querySelectorAll('.flux3-compile-word')].map((g) => { const gr = rr(g.getBoundingClientRect()); let best = null;
      for (const w of ws) if (w.t === g.dataset.word) { const off = Math.max(Math.abs(w.r.x - gr.x), Math.abs(w.r.y - gr.y), Math.abs(w.r.w - gr.w), Math.abs(w.r.h - gr.h)); if (!best || off < best.off) best = { off: +off.toFixed(2), w: w.r }; }
      return { word: g.dataset.word, g: gr, off: best ? best.off : null, glyphs: g.textContent }; });
    const cs = getComputedStyle(L), g0 = L.querySelector('.flux3-compile-word'), gs = g0 ? getComputedStyle(g0) : null;
    return { list, decompile: L.classList.contains('decompile'), aria: L.getAttribute('aria-hidden'), pe: cs.pointerEvents, us: gs ? gs.userSelect : null, inScroll: !!L.parentElement && L.parentElement.classList.contains('mode-scroll') }; };
  I.watchLayer = () => { I.layerMut = []; const L = document.querySelector('[data-flux3-compile]'); if (I.ml) I.ml.disconnect(); if (!L) return false;
    I.ml = new MutationObserver((ms) => { const t = performance.now(); for (const m of ms) I.layerMut.push(t); }); I.ml.observe(L, { childList: true, subtree: true, attributes: true, characterData: true }); return true; };
  // every compiled word's blocks: one per character, each whole inside its own slot (an equal share of the word's rect) and inside the run, no text
  I.whole = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null;
    return [...L.querySelectorAll('.flux3-compile-word')].map((g) => { const gr = g.getBoundingClientRect(), bs = [...g.children], n = [...(g.dataset.word || '')].length;
      const out = bs.filter((b, k) => { const r = b.getBoundingClientRect(), x0 = gr.left + (k * gr.width) / n - 0.5, x1 = gr.left + ((k + 1) * gr.width) / n + 0.5;
        return !(r.width > 0 && r.height > 0 && r.left >= x0 && r.right <= x1 && r.top >= gr.top - 0.5 && r.bottom <= gr.bottom + 0.5); }).length;
      return { word: g.dataset.word, chars: n, blocks: bs.length, out, text: g.textContent.length, filled: bs.filter((b) => b.className === 'f').length }; }); };
  // what dims or hides the page and its caret (ESC-LATER)
  I.look = () => { const ed = I.ed(), col = document.querySelector('.mode-pagecol'), sc = document.querySelector('.mode-page .mode-scroll'), page = document.querySelector('.mode-page'), bc = document.querySelector('.flux-block-caret');
    const mask = (e) => { if (!e) return null; const c = getComputedStyle(e); return c.webkitMaskImage || c.maskImage || 'none'; };
    const op = (e) => (e ? getComputedStyle(e).opacity : null);
    const bcs = bc && getComputedStyle(bc), bcr = bc && bc.getBoundingClientRect();
    return { caret: !!I.caret(), focus: !!ed && document.activeElement === ed, block: !!bc && bcr.width > 0 && bcr.height > 0 && bcs.visibility !== 'hidden' && bcs.display !== 'none',   /* not its opacity: it blinks */
      edMask: mask(ed), looking: document.documentElement.hasAttribute('data-flux3-looking'), colMask: mask(col), scMask: mask(sc),
      layerKids: document.querySelectorAll('[data-flux3-compile] *').length, op: [op(page), op(col), op(sc), op(ed)], rowOps: ed ? [...new Set([...ed.children].map((r) => getComputedStyle(r).opacity))] : null,
      compiled: document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length, writing: document.documentElement.getAttribute('data-wz-writing') }; };
  // THE TUNNEL: every playbackRate set on its animations (the only way its speed changes), its mutations, and what it is
  I.rates = [];
  const upr = Animation.prototype.updatePlaybackRate;
  Animation.prototype.updatePlaybackRate = function (r) { const tg = this.effect && this.effect.target; if (tg && tg.closest && tg.closest('[data-flux3-tunnel]')) I.rates.push([performance.now(), r]); return upr.call(this, r); };
  I.watchTunnel = () => { I.tunMut = []; const t = document.querySelector('[data-flux3-tunnel]'); if (I.mt) I.mt.disconnect(); if (!t) return false;
    I.mt = new MutationObserver((ms) => { const at = performance.now(); for (const m of ms) I.tunMut.push([at, m.type, m.attributeName || '']); }); I.mt.observe(t, { childList: true, subtree: true, attributes: true, characterData: true }); return true; };
  I.tunnel = () => { const t = document.querySelector('[data-flux3-tunnel]'); if (!t) return null; const cs = getComputedStyle(t), anims = t.getAnimations({ subtree: true }), props = new Set();
    anims.forEach((a) => { try { a.effect.getKeyframes().forEach((k) => Object.keys(k).forEach((p) => props.add(p))); } catch { props.add('unreadable'); } });
    const page = document.querySelector('.mode-page'), par = t.parentElement;
    return { inStage: !!par && par.classList.contains('mode-stage'), first: !!par && par.firstElementChild === t, aria: t.getAttribute('aria-hidden'), pe: cs.pointerEvents, op: +cs.opacity, z: cs.zIndex,
      canvas: t.querySelectorAll('canvas').length, frames: t.querySelectorAll('.flux3-tunnel-frame').length, anims: anims.length, running: anims.filter((a) => a.playState === 'running').length,
      props: [...props].filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)).sort(), rates: [...new Set(anims.map((a) => a.playbackRate))],
      time: anims.length ? +(+anims[0].currentTime).toFixed(0) : null, fast: t.hasAttribute('data-fast'), still: t.hasAttribute('data-still'), recede: t.hasAttribute('data-recede'), hold: t.hasAttribute('data-hold'),
      pageBg: page ? getComputedStyle(page).backgroundColor : null, pageAbove: !!page && (() => { const r = page.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!e && !t.contains(e); })(),
      writing: document.documentElement.getAttribute('data-wz-writing'), clear: I.hole(t, page, cs), mask: cs.maskImage || cs.webkitMaskImage || 'none',
      covers: !!page && (() => { const B = t.getBoundingClientRect(), P = page.getBoundingClientRect(); return B.left <= P.left && B.top <= P.top && B.right >= P.right && B.bottom >= P.bottom; })(),
      // the page's SEEN part (the zoomed page is taller than the stage, which clips it: r9's first run) within the tunnel's box
      coversSeen: !!page && !!par && (() => { const B = t.getBoundingClientRect(), P = page.getBoundingClientRect(), S = par.getBoundingClientRect();
        const x0 = Math.max(P.left, S.left), y0 = Math.max(P.top, S.top), x1 = Math.min(P.right, S.right), y1 = Math.min(P.bottom, S.bottom);
        return x1 > x0 && y1 > y0 && B.left <= x0 + 0.5 && B.top <= y0 + 0.5 && B.right >= x1 - 0.5 && B.bottom >= y1 - 0.5; })() }; };
  // the page's rect cut out of the tunnel: the hole (its four custom properties, in screen px) against the page's own rect, and the mask applied
  I.hole = (t, page, cs) => { if (!page) return null; const B = t.getBoundingClientRect(), s = t.offsetWidth ? B.width / t.offsetWidth : 1, v = (n) => parseFloat(t.style.getPropertyValue(n)) || 0;
    const h = { x: B.left + v('--hx') * s, y: B.top + v('--hy') * s, w: v('--hw') * s, h: v('--hh') * s }, P = page.getBoundingClientRect();
    return { hole: rr(new DOMRect(h.x, h.y, h.w, h.h)), page: rr(P), off: +Math.max(Math.abs(h.x - P.left), Math.abs(h.y - P.top), Math.abs(h.w - P.width), Math.abs(h.h - P.height)).toFixed(2),
      comp: cs.maskComposite || cs.webkitMaskComposite || '', masks: (cs.maskImage || cs.webkitMaskImage || '').split('linear-gradient').length - 1 }; };
  // THE CARET'S INK (the Wrizors' S4 r7 blocker): Flux's block caret against the page under it, both read from computed colours; the caret's
  // colour is composited over that page (it may carry alpha), and the page is the first opaque background under the caret's centre
  I.caretInk = () => { const bc = document.querySelector('.flux-block-caret'); if (!bc) return null; const r = bc.getBoundingClientRect(); if (!r.width || !r.height) return null;
    const rgba = (s) => { if (!s || !s.startsWith('rgb')) return null; const v = s.replace(/[^0-9.,]/g, '').split(',').map(Number); return v.length >= 3 ? [v[0], v[1], v[2], v.length > 3 ? v[3] : 1] : null; };
    const under = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).filter((e) => e !== bc).map((e) => ({ e, c: rgba(getComputedStyle(e).backgroundColor) })).find((x) => x.c && x.c[3] >= 0.99);
    const cc = rgba(getComputedStyle(bc).backgroundColor); if (!cc || !under) return { caret: getComputedStyle(bc).backgroundColor, page: null, ratio: null, at: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], vh: innerHeight,
      stack: document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2).slice(0, 6).map((e) => String(e.className || e.tagName).slice(0, 30) + ':' + getComputedStyle(e).backgroundColor) };
    const page = under.c.slice(0, 3), ink = cc.slice(0, 3).map((v, k) => v * cc[3] + page[k] * (1 - cc[3]));
    const lum = (c) => { const l = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
    const a = lum(ink), b = lum(page);
    // its OUTLINE (Nick, Nov 7: Jacked In's light caret is brass held by a 1 px ink outline): style, width, colour, and the colour against the page
    const bs = getComputedStyle(bc), oc = rgba(bs.outlineColor), ow = parseFloat(bs.outlineWidth) || 0;
    const oInk = oc ? oc.slice(0, 3).map((v, k) => v * oc[3] + page[k] * (1 - oc[3])) : null, ol = oInk ? lum(oInk) : null;
    const outline = { style: bs.outlineStyle, width: ow, color: bs.outlineColor, ratio: ol === null || bs.outlineStyle === 'none' || ow <= 0 ? null : +((Math.max(ol, b) + 0.05) / (Math.min(ol, b) + 0.05)).toFixed(2) };
    return { at: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], caret: bs.backgroundColor, page, pageEl: String(under.e.className || under.e.tagName).slice(0, 60), ink: ink.map(Math.round), ratio: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2), outline }; };
  // THE CARET AT THE TEXT'S END (the Wrizors' S4 r9 review: the block stood on the last word's first letter): Flux's block caret against the
  // right edge of the text's last character, and how the selection is held (a text node, or an element boundary)
  I.blockAt = () => { const bc = document.querySelector('.flux-block-caret'), ed = I.ed(), s = getSelection(); if (!ed) return null;
    let last = null; const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if ((n.nodeValue || '').replace(/\\u200b/g, '').trim().length) last = n;
    let end = null; if (last) { const v = last.nodeValue, i = v.replace(/[\\s\\u200b]+$/u, '').length; if (i > 0) { const r = document.createRange(); r.setStart(last, i - 1); r.setEnd(last, i); const rr = [...r.getClientRects()].pop(); if (rr) end = rr; } }
    const B = bc ? bc.getBoundingClientRect() : null, a = s && s.anchorNode;
    return { block: B ? { x: +B.left.toFixed(1), y: +B.top.toFixed(1), h: +B.height.toFixed(1) } : null, end: end ? { right: +end.right.toFixed(1), y: +end.top.toFixed(1), h: +end.height.toFixed(1) } : null,
      anchor: a ? { type: a.nodeType, name: a.nodeType === 1 ? (a.className || a.tagName) : (a.parentElement && (a.parentElement.className || a.parentElement.tagName)), offset: s.anchorOffset, kids: a.nodeType === 1 ? a.childNodes.length : null } : null }; };
  // THE ZOOM, frame by frame (r9i: the dark read found the editor at scale 1.0 between two reads at 1.6, data-zoom 'true' throughout): every
  // change of the editor's rendered scale by more than .05, with the time, data-zoom and data-wz-writing then
  I.zoomWatch = () => { I.zlog = []; let last = null; const t0 = performance.now(); if (I.zraf) cancelAnimationFrame(I.zraf);
    I.flips = []; let flipping = false;
    const tick = () => { const ed = I.ed(), col = document.querySelector('.mode-pagecol'); const s = ed && ed.offsetWidth ? +(ed.getBoundingClientRect().width / ed.offsetWidth).toFixed(3) : null;
      // ModeStage's page-turn (.flipping): when it starts, what its page count reads (floor(editor.scrollHeight / scroll.clientHeight))
      const pg = document.querySelector('.mode-page'), sc = document.querySelector('.mode-page .mode-scroll'), f = !!pg && pg.classList.contains('flipping');
      if (f && !flipping && ed && sc) I.flips.push([Math.round(performance.now() - t0), ed.scrollHeight, sc.clientHeight, sc.scrollWidth, sc.clientWidth, sc.offsetHeight, getComputedStyle(pg).transform.slice(0, 40)]);
      flipping = f;
      if (s !== null && (last === null || Math.abs(s - last) > 0.05)) {
        // and what the zoom is made of (DeskFrame: --wz-zoom from the stage's width and the strip's right edge, on a stage resize)
        const stg = document.querySelector('.desk-frame-stage'), strip = document.querySelector('.desk-frame-strip'), S = stg && stg.getBoundingClientRect(), T = strip && strip.getBoundingClientRect();
        I.zlog.push([Math.round(performance.now() - t0), s, col ? col.getAttribute('data-zoom') : null, document.documentElement.getAttribute('data-wz-writing'),
          stg ? getComputedStyle(stg).getPropertyValue('--wz-zoom').trim() : null, S ? [Math.round(S.left), Math.round(S.width), Math.round(S.height)] : null, T ? [Math.round(T.left), Math.round(T.right), Math.round(T.width)] : null,
          stg ? getComputedStyle(stg).getPropertyValue('--wz-k').trim() : null]); last = s; }
      I.zraf = requestAnimationFrame(tick); };
    I.zraf = requestAnimationFrame(tick); return true; };
  I.zoomStop = () => { if (I.zraf) cancelAnimationFrame(I.zraf); I.zraf = 0; return I.zlog || []; };
  // THE TERMINAL (r9): the page's paper and readouts, the room's ground under it (the stage's column), and the editor's veil
  I.term = () => { const page = document.querySelector('.mode-page'), ro = document.querySelector('.mode-page .flux-readouts'), col = document.querySelector('.desk-frame-stagecol'), ed = I.ed();
    const m = (e) => { if (!e) return null; const c = getComputedStyle(e); return c.webkitMaskImage || c.maskImage || 'none'; };
    return { pageBg: page ? getComputedStyle(page).backgroundColor : null, readouts: ro ? getComputedStyle(ro).visibility : 'absent', groundBg: col ? getComputedStyle(col).backgroundColor : null,
      edMask: m(ed), looking: document.documentElement.hasAttribute('data-flux3-looking'), page: page ? rr(page.getBoundingClientRect()) : null }; };
  // the box of the line k above the caret's (k = 0: the writing line), in screen px: the editor's width, the middle 70% of that line's height
  I.lineBox = (k) => { const ed = I.ed(), c = I.caret(), lh = I.lh(); if (!ed || !c || !lh) return null; const E = ed.getBoundingClientRect(), cy = c.r.y + c.r.h / 2 - k * lh;
    return { x: Math.max(0, Math.round(E.left)), y: Math.max(0, Math.round(cy - lh * 0.35)), width: Math.round(E.width), height: Math.max(1, Math.round(lh * 0.7)) }; };
  // THE PIXELS (a mask, an opacity and a band all meet in paint, so the read is of paint): the viewport's own screenshot (the frames job's capture;
  // r9's first run clipped it in CDP and read the html ground, flat, in both tones) decoded here on an OffscreenCanvas (never appended), and the
  // box cut from it; the ground is the commonest colour, the ink the pixel of most contrast against it
  I.pix = async (b64, box) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i += 1) u[i] = bin.charCodeAt(i);
    const bm = await createImageBitmap(new Blob([u], { type: 'image/png' })), cv = new OffscreenCanvas(bm.width, bm.height), cx = cv.getContext('2d'); cx.drawImage(bm, 0, 0);
    const bx = Math.max(0, Math.min(bm.width - 1, box.x)), by = Math.max(0, Math.min(bm.height - 1, box.y));
    const bw = Math.max(1, Math.min(bm.width - bx, box.width)), bh = Math.max(1, Math.min(bm.height - by, box.height));
    const d = cx.getImageData(bx, by, bw, bh).data, counts = new Map();
    for (let i = 0; i < d.length; i += 4) { const q = ((d[i] >> 2) << 12) | ((d[i + 1] >> 2) << 6) | (d[i + 2] >> 2); counts.set(q, (counts.get(q) || 0) + 1); }
    let best = 0, n = 0; counts.forEach((v, q) => { if (v > n) { n = v; best = q; } });
    const ground = [((best >> 12) & 63) * 4 + 2, ((best >> 6) & 63) * 4 + 2, (best & 63) * 4 + 2];
    const lum = (c) => { const l = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
    const lg = lum(ground); let ratio = 1, ink = ground;
    for (let i = 0; i < d.length; i += 4) { const c = [d[i], d[i + 1], d[i + 2]], l = lum(c), r = (Math.max(l, lg) + 0.05) / (Math.min(l, lg) + 0.05); if (r > ratio) { ratio = r; ink = c; } }
    return { ground, ink, ratio: +ratio.toFixed(2), box: [bx, by, bw, bh], shot: [bm.width, bm.height] }; };
  // the compiled rows: each row's blocks against their slots (THE ROWS: smaller toward the top)
  I.rows = () => { const L = document.querySelector('[data-flux3-compile]'); if (!L) return null; const by = {};
    L.querySelectorAll('.flux3-compile-word').forEach((g) => { const n = [...(g.dataset.word || '')].length, b = g.firstElementChild; if (!n || !b) return; const r = +g.dataset.row;
      const share = b.getBoundingClientRect().width / (g.getBoundingClientRect().width / n); (by[r] = by[r] || []).push(share); });
    return Object.keys(by).map(Number).sort((a, b) => a - b).map((r) => ({ row: r, n: by[r].length, share: +(by[r].reduce((a, b) => a + b, 0) / by[r].length).toFixed(3) })); };
  I.flashes = (kind) => (window.__wzFlashLog || []).filter((f) => f.ok && (!kind || f.kind === kind)).map((f) => f.t);
  I.st = () => {
    const root = document.documentElement, page = document.querySelector('.mode-page'), ed = I.ed(), col = document.querySelector('.mode-pagecol'), sc = document.querySelector('.mode-page .mode-scroll');
    const burst = document.querySelector('[data-flux3-burst]'), bi = burst && burst.querySelector('i');
    let shared = null; try { shared = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}').typewriter; } catch { shared = 'unreadable'; }
    const tog = document.querySelector('[data-mode-toggle="typewriter"]'), gb = document.querySelector('[data-flux3-glitchbar]');
    return {
      flag: root.hasAttribute('data-flux3'), theme: root.getAttribute('data-theme'), jacked: root.hasAttribute('data-flux3-jacked'), writing: root.getAttribute('data-wz-writing'),
      mode: document.querySelector('[data-mode-key][aria-selected="true"]')?.getAttribute('data-mode-key') || null,
      zoom: col ? col.getAttribute('data-zoom') : null, typewriter: sc ? sc.getAttribute('data-typewriter') : null, shared,
      page: page ? rr(page.getBoundingClientRect()) : null, text: ed ? ed.textContent : null, scrollTop: sc ? sc.scrollTop : null, caret: I.caret(),
      toggle: tog ? tog.getAttribute('aria-pressed') : null, sw: !!document.querySelector('[data-flux3-jackin-switch]'),
      burst: burst ? { left: +burst.dataset.left, r: rr(burst.getBoundingClientRect()), t: bi ? getComputedStyle(bi).transform : null, td: bi ? getComputedStyle(bi).transitionDuration : null, vw: innerWidth } : null,
      compile: !!document.querySelector('[data-flux3-compile]'), idleLayer: !!document.querySelector('[data-flux3-idle]'), idleLive: document.querySelectorAll('[data-flux3-idle] .flux3-idle-word').length,
      count: gb ? (gb.querySelector('.flux3-glitchbar-count')?.textContent || '') : null,
      struck: ed ? ed.querySelectorAll('s, del, [class*="strike"], [class*="struck"]').length : null,
      served: ([...document.scripts].map((s) => s.getAttribute('src') || '').find((s) => /index-/.test(s)) || '').replace(/^.*\\//, ''),
    };
  };
})();`;

const MUTANTS = {
  perkey: [/=700,([\w$]+)=2,([\w$]+)=420,/g, '=0,$1=2,$2=420,'],
  lines: [/=700,([\w$]+)=2,([\w$]+)=420,/g, '=700,$1=1,$2=420,'],
  default: [/return ([\w$]+)\(\)&&\(([\w$]+)\(!0\),([\w$]+)\(\)\),\(\)=>\{([\w$]+)\(!1\)\}/g, 'return ()=>{$4(!1)}'],
  clear: [/\{([\w$]+)=!1,([\w$]+)\(\{typewriter:e\}\)/g, '{$2({typewriter:e})'],
  idle: [/\.flicker&&([\w$]+)>0&&![\w$]+;/g, '.flicker&&$1>0;'],
  edge: [/\?0:Math\.max\(0,Math\.min\(1,1-([\w$]+)\)\)/g, '?0:Math.max(0,Math.min(1,$1))'],
  still: [/\.size\|\|([\w$]+)\(\)\|\|!([\w$]+)\("f3-decompile"\)/g, '.size||!1||!$2("f3-decompile")'],
  block: [/=420,([\w$]+)=\.72([,;])/g, '=420,$1=1.6$2'],
  // the tunnel's two one-line switches, each flipped alone (Nick: in case he changes his mind), and the re-set's interval
  recede: [/recedeWhileTyping:!1/g, 'recedeWhileTyping:!0'],
  hold: [/holdWhileTyping:!1/g, 'holdWhileTyping:!0'],
  reset: [/resetMs:2e3/g, 'resetMs:100'],
  // Esc no longer resolving the signal (r4's behaviour): ESC-READ fails
  // (re-pointed r9: Esc now sets the looking-up mark through look(true), so the anchor is `{x(!0),...`; r4-r8's was `{x=!0,...`)
  lookup: [/if\(([\w$]+)\.key==="Escape"\)\{([\w$]+)\(!0\),([\w$]+)&&window\.clearTimeout\(\3\),\3=0,([\w$]+)\(\);return\}/g, 'if($1.key==="Escape"){return}'],
  // the page's rect never cut out of the tunnel (r5's build): TUN-CLEAR fails. PARKED r9 (no hole by design): the parked leg holds it lands 0 times
  nohole: [/\.setProperty\("--hw",/g, '.setProperty("--hw-unset",'],
  // THE TERMINAL (r9): the veil never laid (the editor's mask property unset): TERM-LINES' hidden line reads; the dim line at .3: TERM-LINES' dim
  // line under the floor; the rows not shrinking: TERM-ROWS fails
  terminal: [/--f3-term-mask:/g, '--f3-term-mask-off:', 'css'],
  dim: [/--f3-dim:\.78(?=[;}])/g, '--f3-dim:.3', 'css'],
  rows: [/rowShrink:\.12,/g, 'rowShrink:0,'],
  // the L split's K arm (information): Jacked In with the tunnel never mounted
  notunnel: [/if\(!([\w$]+)\)return;const ([\w$]+)=document\.createElement\("div"\);return \2\.className="flux3-tunnel"/g, 'if(!0)return;const $2=document.createElement("div");return $2.className="flux3-tunnel"'],
  // the light page's block caret back to the shared orange (r7's build), in flux-v3.css's built file (boot-*.css): CARET-LIGHT fails
  // (re-pointed r9 to the caret's own rule: the light room's finished Glitch bar takes the same orange)
  caret: [/flux-block-caret\{background:#a84e00(?=[;}])/gi, 'flux-block-caret{background:rgba(255,152,0,.82)', 'css'],
  // Jacked In's light caret without its ink outline (Nick's ruling, Nov 7): CARET-JACKED-LIGHT fails
  outline: [/outline:1px solid #042632/gi, 'outline:none', 'css'],
  // the Wrizors' S4 r9 review: the caret's text-end place off (FluxBlockCaret §5): CARET-END fails; a refused compile never tried again: OPEN-ROWS
  caretend: [/textEnd:!0\}/g, 'textEnd:!1}'],
  // (re-pointed: the compile now logs why it stops, so the refusal branch is `{N("refused"),d=window.setTimeout(...);return}`)
  retry: [/if\(!([\w$]+)\("f3-compile"\)\)\{([\w$]+)\("refused"\),([\w$]+)=window\.setTimeout\(([\w$]+),([\w$]+)\);return\}/g, 'if(!$1("f3-compile")){$2("refused");return}'],
  // the caret's editor boundary counted in ELEMENTS again (r9's caretBox): the open's own pause finds no caret: OPEN-ROWS fails
  openrow: [/\?([\w$]+)\.childNodes\[([\w$]+)\.startOffset-1\]\?\?null:null/g, '?$1.children[$2.startOffset-1]??null:null'],
  // the page's own scrolling postponing her pause again (r10b's measure: the open's glides fired 30-46 scrolls a second): OPEN-ROWS fails
  // (the minifier folds PAUSE.scrollPostpones away: the anchor is the scroll handler itself, `L=()=>{d||E()}` registered on "scroll")
  scrollpause: [/const ([\w$]+)=\(\)=>\{([\w$]+)\|\|([\w$]+)\(\)\};return ([\w$]+)\.addEventListener\("scroll",\1,\{passive:!0\}\)/g, 'const $1=()=>{$3()};return $4.addEventListener("scroll",$1,{passive:!0})'],
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const maxIn1s = (ts) => { let m = 0; for (let i = 0; i < ts.length; i += 1) m = Math.max(m, ts.filter((x) => x >= ts[i] && x < ts[i] + 1000).length); return m; };
const stat = (xs) => { const s = (xs || []).slice().sort((a, b) => a - b); const q = (p) => (s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null); return { n: s.length, median: q(0.5), p95: q(0.95), max: s.length ? s[s.length - 1] : null }; };
const r1 = (x) => (x === null || x === undefined ? null : Math.round(x * 10) / 10);

try { await withHarness(async (app) => {
  const ev = (js) => app.evalJs(js);
  const mouse = (type, x, y, o = {}) => app.cdp('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, pointerType: 'mouse', ...o });
  const click = async (x, y) => { await app.mouseMove(x, y); await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const snap = async (name) => { if (SHOTS) fs.writeFileSync(path.join(SHOTS, `${name}.png`), Buffer.from((await app.cdp('Page.captureScreenshot', { format: 'png' })).data, 'base64')); };
  const splashGone = () => app.waitFor("!document.querySelector('.wz-splash')", { timeout: 15000, label: 'splash gone' }).catch(() => {});
  const centreOf = (sel, i = 0) => ev(`(() => { const e = document.querySelectorAll(${JSON.stringify(sel)})[${i}]; if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width) return null; return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; })()`);
  const st = () => ev('window.__f4.st()');

  let mutant = null;
  const landed = {};
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  // the bundle, and flux-v3.css's built file (the flag's dynamic import: boot-*.css); a mutant names its file kind (js unless it says css)
  await app.cdp('Fetch.enable', { patterns: [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }, { urlPattern: '*/assets/boot-*.css', requestStage: 'Response' }] });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      const isCss = /\.css(\?|$)/.test((p.request && p.request.url) || '');
      if (mutant && ((MUTANTS[mutant][2] || 'js') === 'css') === isCss) {
        const [from, to] = MUTANTS[mutant];
        const n = (text.match(from) || []).length;
        landed[mutant] = n;
        if (n === 1) text = text.replace(from, to);
      }
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });
  await app.cdp('Page.addScriptToEvaluateOnNewDocument', { source: INSTRUMENT });

  // ---- the pages, through the seams (on the Desk: no flush handler is mounted) -------------------------------------------------------------------
  await app.emulateDpr(1, 1920, 1080);
  await app.goto('/');
  await ev("localStorage.clear(); sessionStorage.clear(); localStorage.setItem('wrizo-first-run-complete','1'); localStorage.setItem('wrizo-splash-hold','50'); localStorage.setItem('wrizo-tutor-disclosure-seen','1'); localStorage.setItem('wrizo-tutor-disclosure-seen-version','4'); localStorage.setItem('wrizo-theme','flux');");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk', timeout: 15000 });
  await splashGone();
  const at = new Date().toISOString();
  const mk = (row) => ev(`window.wrizoCreateJournalPage(${JSON.stringify(row)})`);
  await mk({ id: LONG, text: LONG_TEXT, createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: DRAFTP, text: LONG_TEXT, createdAt: at, origin: null, source: 'page' });
  await mk({ id: GOAL, text: Array.from({ length: 249 }, (_, i) => `w${i}`).join(' '), createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: FL_ON, text: 'Forward lock line', createdAt: at, origin: 'loose', source: 'page' });
  await mk({ id: FL_OFF, text: 'Forward lock line', createdAt: at, origin: 'loose', source: 'page' });
  // the jacked caret's reads on a page of their own (r10c: on LONG, grown by every earlier scenario, the Typewriter never brought the caret on screen)
  await mk({ id: CARETP, text: LONG_TEXT, createdAt: at, origin: 'loose', source: 'page' });
  await sleep(400);

  // preferences (not collections), set before the reload as the app reads them at boot; the shared Typewriter field is OFF unless a test says so
  const open = async ({ flag = true, id = LONG, theme = 'flux', tone = 'dark', view = [1920, 1080], dial = 50, prefs = {}, mode = null, reduced = false, pageTw = null } = {}) => {
    await ev(`(() => { const p = JSON.parse(localStorage.getItem('wrizo-theme-prefs') || '{}'); p.page = ${JSON.stringify(tone)}; localStorage.setItem('wrizo-theme-prefs', JSON.stringify(p));
      localStorage.setItem('wrizo-theme', ${JSON.stringify(theme)}); localStorage.setItem('wrizo-ambiance-dial', ${JSON.stringify(String(dial))});
      const w = JSON.parse(localStorage.getItem('wrizo-writing-settings') || '{}'); Object.assign(w, { flicker: true, progressStyle: 'bar', progress: 'words', instrumentsOn: true, typewriter: false }, ${JSON.stringify(prefs)}); localStorage.setItem('wrizo-writing-settings', JSON.stringify(w));
      localStorage.removeItem('wrizo-mode-page-${id}');
      ${pageTw ? `localStorage.setItem('wrizo-typewriter-page-${id}', ${JSON.stringify(pageTw)});` : ''} })()`);
    await app.cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
    await ev(`history.replaceState(null, '', ${JSON.stringify(flag ? '/?flux3=1' : '/')} + '#/page/${id}')`);
    await app.emulateDpr(1, view[0], view[1]);
    await app.reload();
    await app.waitFor("!!document.querySelector('.forward-only-editor')", { timeout: 15000, label: 'the page' }).catch(() => {});
    await splashGone();
    if (mode) await pickMode(mode);
    await ev('window.__f4.toEnd()');
    await app.mouseMove(8, 8);
    await sleep(1600);
  };
  const pickMode = async (key) => {
    await ev(`(() => { const b = document.querySelector('[data-mode-key="${key}"]'); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); })()`);
    await app.waitFor(`document.querySelector('[data-mode-key="${key}"]')?.getAttribute('aria-selected') === 'true' && !!document.querySelector('.forward-only-editor')`, { timeout: 6000, label: key }).catch(() => {});
    await sleep(500);
    await ev('window.__f4.toEnd()');
  };
  // the TOOLS hand (it overlays the zoomed page; nothing is displaced), its foot menu, and today's Typewriter toggle in it
  const hand = async (want) => {
    const isOpen = await ev("document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') === 'true'");
    if (isOpen !== want) { const p = await centreOf('.wz-sliver-grip'); if (p) { await click(p.x, p.y); await sleep(700); } }
    return ev("document.querySelector('.wz-sliver-grip')?.getAttribute('aria-expanded') === 'true'");
  };
  const pressToggle = async () => {
    await hand(true);
    const p = await centreOf('[data-mode-toggle="typewriter"]');
    if (p) await click(p.x, p.y);
    await sleep(80);
    return !!p;
  };
  const footMenu = async () => {
    await hand(true);
    const open = await ev("document.querySelector('.wz-sliver-instruments-btn')?.getAttribute('aria-expanded') === 'true'");
    if (!open) { const p = await centreOf('.wz-sliver-instruments-btn'); if (p) { await click(p.x, p.y); await sleep(400); } }
    return ev("!!document.querySelector('[data-flux3-jackin-switch]')");
  };
  const pickSwitch = async (on) => { const p = await centreOf('[data-flux3-jackin-switch] .mode-seg button', on ? 0 : 1); if (p) { await click(p.x, p.y); await sleep(300); } return !!p; };
  const storageSnap = () => ev('JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)]))');

  // ---- DEF: the default ---------------------------------------------------------------------------------------------------------------------------
  const testDefault = async () => {
    await open();
    const a = await st(), first = await ev('window.__f4.first');
    if (SHOTS) for (const tone of ['dark', 'light']) for (const view of [[1366, 768], [1920, 1080]]) {
      if (!(tone === 'dark' && view[0] === 1920)) await open({ tone, view });
      await ev('window.__f4.toEnd()'); await sleep(1600);
      await snap(`s4-${tone}-${view[0]}-jacked`);
    }
    if (SHOTS) await open();
    await pickMode('draft');
    const inDraft = await st();
    await pickMode('freewrite');
    const back = await st();
    return { a, first, inDraft, back };
  };
  const d = await testDefault();
  ok('DEF flag on, Flux: a loose page opens in Free Write JACKED IN (zoomed, marked) while the shared Typewriter field stays off',
    d.a.mode === 'freewrite' && d.a.zoom === 'true' && d.a.typewriter === 'true' && d.a.jacked && d.a.shared === false, JSON.stringify({ mode: d.a.mode, zoom: d.a.zoom, tw: d.a.typewriter, jacked: d.a.jacked, shared: d.a.shared }));
  ok('DEF-FIRST the first frame with the editor is already jacked in (the page never paints un-jacked first)', d.first && d.first.zoom === 'true', JSON.stringify(d.first));
  ok('DEF-TAB Draft (its own memory: off) is not jacked; back to Free Write jacks in again', d.inDraft.mode === 'draft' && d.inDraft.zoom !== 'true' && !d.inDraft.jacked && d.back.mode === 'freewrite' && d.back.zoom === 'true' && d.back.jacked,
    JSON.stringify({ draft: [d.inDraft.mode, d.inDraft.zoom, d.inDraft.jacked], back: [d.back.mode, d.back.zoom, d.back.jacked] }));
  await open({ flag: false });
  const dOff = await st();
  ok('DEF-OFF flag off: the same page opens un-jacked (the shared field rules, as today)', !dOff.flag && dOff.mode === 'freewrite' && dOff.zoom !== 'true' && !dOff.jacked, JSON.stringify({ zoom: dOff.zoom, jacked: dOff.jacked }));
  await open({ theme: 'plateau' });
  const dArbor = await st();
  ok('DEF-THEME flag on, another theme (Arbor): un-jacked, and no switch', dArbor.theme === 'plateau' && dArbor.zoom !== 'true' && !dArbor.jacked && !(await footMenu()), JSON.stringify({ theme: dArbor.theme, zoom: dArbor.zoom, jacked: dArbor.jacked }));
  await open({ id: DRAFTP, pageTw: 'off' });
  const dDraft = await st();
  ok('DEF-DRAFT a Draft page whose own memory is off opens un-jacked (the default is Free Write\'s only)', dDraft.mode === 'draft' && dDraft.zoom !== 'true' && !dDraft.jacked, JSON.stringify({ mode: dDraft.mode, zoom: dDraft.zoom }));
  await open({ id: DRAFTP, pageTw: 'on' });
  const dDraftOn = await st();
  ok('DEF-DRESS (E) a Draft page whose own Typewriter is on is Jacked In too (the dress on every Flux Typewriter)', dDraftOn.mode === 'draft' && dDraftOn.zoom === 'true' && dDraftOn.jacked && dDraftOn.compile, JSON.stringify({ mode: dDraftOn.mode, zoom: dDraftOn.zoom, jacked: dDraftOn.jacked, compile: dDraftOn.compile }));

  // ---- SWITCH ----------------------------------------------------------------------------------------------------------------------------------------
  const testSwitch = async () => {
    await open();
    const shown = await footMenu();
    if (SHOTS) await snap('s4-dark-1920-switch');
    const before = await storageSnap();
    await pickSwitch(false);
    const after = await storageSnap();
    await hand(false);
    await pickMode('draft'); await pickMode('freewrite');
    const offRun = await st();
    await footMenu(); await pickSwitch(true); await hand(false);
    await pickMode('draft'); await pickMode('freewrite');
    const onRun = await st();
    await open({ flag: false });
    const offFlag = await footMenu();
    return { shown, saved: before !== after, offRun, onRun, offFlag };
  };
  const s = await testSwitch();
  ok('SWITCH "Jack In by default" is in the TOOLS foot under the flag in Flux, and absent off the flag', s.shown && !s.offFlag, JSON.stringify({ shown: s.shown, offFlag: s.offFlag }));
  ok('SWITCH Off: Free Write opens un-jacked; On: jacked again', s.offRun.mode === 'freewrite' && s.offRun.zoom !== 'true' && !s.offRun.jacked && s.onRun.mode === 'freewrite' && s.onRun.zoom === 'true' && s.onRun.jacked,
    JSON.stringify({ off: [s.offRun.zoom, s.offRun.jacked], on: [s.onRun.zoom, s.onRun.jacked] }));
  ok('SWITCH flipping it writes nothing to storage (in-session, ruling D)', !s.saved);

  // ---- TOGGLE: today's control jacks out and back in ----------------------------------------------------------------------------------------------
  const testToggle = async () => {
    await open();
    const a = await st();
    await pressToggle(); await sleep(600);
    const out = await st();
    await pressToggle(); await sleep(600);
    const back = await st();
    await hand(false);
    return { a, out, back };
  };
  const t = await testToggle();
  ok('TOGGLE today\'s Typewriter toggle jacks out (zoom off, unmarked; the shared field still off) and back in (it writes the shared field, as today)',
    t.a.jacked && t.a.toggle === 'true' && t.out.zoom !== 'true' && !t.out.jacked && t.out.toggle === 'false' && t.out.shared === false && t.back.zoom === 'true' && t.back.jacked && t.back.shared === true,
    JSON.stringify({ a: [t.a.jacked, t.a.toggle], out: [t.out.zoom, t.out.jacked, t.out.toggle, t.out.shared], back: [t.back.zoom, t.back.jacked, t.back.shared] }));

  // ---- RESTORE: in and out on a Draft page, against the control ---------------------------------------------------------------------------------
  const testRestore = async (flag) => {
    await open({ flag, id: DRAFTP, pageTw: 'off' });
    // the writer's caret in view: the end of the second row, at the top of an unscrolled page (the first Actions run put the caret at the end of the
    // text while the page sat at scroll 0, a caret out of view; the control moved its scroll too, 0 -> 464, so that read was the scenario's)
    await ev('(() => { const s = document.querySelector(".mode-page .mode-scroll"); if (s) s.scrollTop = 0; window.__f4.toRow(1); })()');
    await sleep(600);
    const before = await st();
    await pressToggle(); await sleep(900);
    const inside = await st();
    await pressToggle(); await sleep(900);
    await hand(false); await app.mouseMove(8, 8); await sleep(600);
    const after = await st();
    return { before, inside, after };
  };
  const rOn = await testRestore(true), rOff = await testRestore(false);
  ok('RESTORE the jacked rect is the Typewriter\'s own zoom rect (flag on = flag off), and Jacked In while on', rOn.inside.jacked && rOn.inside.zoom === 'true' && rOff.inside.zoom === 'true' && same(rOn.inside.page, rOff.inside.page),
    JSON.stringify({ on: rOn.inside.page, off: rOff.inside.page }));
  // THE SCROLL IS HELD TO THE CONTROL, NOT TO "BEFORE" (Actions runs 42342032987 + 42343730035, both legs): the control - today's Typewriter, flag
  // off - leaves at a different scroll than it entered (0 -> 79 with the caret in view at the top of the page), so an exact-scroll check is a claim
  // about the Typewriter itself, not about Jacked In. S4's claim is that Jacked In leaves exactly as the Typewriter does; the absolute scroll is
  // printed as a FINDING for Fable, never silently dropped.
  const restored = (r) => same(r.before.page, r.after.page) && r.before.text === r.after.text && !!r.before.caret && !!r.after.caret && r.before.caret.before === r.after.caret.before;
  ok('RESTORE on leaving, the rect, the caret and the text are exactly as before (flag on), and the scroll is the control\'s (Jacked In leaves as the Typewriter does)',
    restored(rOn) && same(rOn.after.page, rOff.after.page) && rOn.after.scrollTop === rOff.after.scrollTop && rOn.before.scrollTop === rOff.before.scrollTop,
    JSON.stringify({ on: { b: [rOn.before.page, rOn.before.scrollTop, rOn.before.caret], a: [rOn.after.page, rOn.after.scrollTop, rOn.after.caret] }, off: { restored: restored(rOff), b: rOff.before.scrollTop, a: [rOff.after.page, rOff.after.scrollTop] } }));
  console.log(`FINDING RESTORE-SCROLL the Typewriter's own exit: scroll ${rOff.before.scrollTop} -> ${rOff.after.scrollTop} on the control (flag off), ${rOn.before.scrollTop} -> ${rOn.after.scrollTop} under the flag${rOff.before.scrollTop === rOff.after.scrollTop ? ' (exact)' : ' (NOT exact on the control: a Typewriter question, not S4\'s)'}`);

  // ---- COMPILE ---------------------------------------------------------------------------------------------------------------------------------------
  const testCompile = async ({ snapName = null } = {}) => {
    await open();
    await sleep(600);
    await ev('window.__f4.watchLayer()');
    const g0 = (await ev('window.__f4.flashes("f3-compile")')).length;
    const k0 = await ev('window.__f4.keys.length');
    // long enough to wrap the writing line at least twice, so lines rise while keys land (and must not compile until the pause)
    const words = ' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps, and then it wraps again as the writing line moves down the page';
    for (const ch of words) { await app.typeKeys(ch); await sleep(40); }
    const typed = await st();
    const span = await ev(`(() => { const k = window.__f4.keys.slice(${k0}); return { n: k.length, a: k[0], b: k[k.length - 1] }; })()`);
    const mutDuring = await ev(`window.__f4.layerMut.filter((t) => t >= ${span.a} && t <= ${span.b} + 30).length`);
    const grantsDuring = await ev(`window.__f4.flashes("f3-compile").filter((t) => t >= ${span.a} && t <= ${span.b} + 30).length`);
    await sleep(1500);
    const after = await st();
    const comp = await ev('window.__f4.compiled()');
    const whole = await ev('window.__f4.whole()');
    const lh = await ev('window.__f4.lh()');
    const caret = after.caret;
    const allWords = await ev('window.__f4.words()');
    if (snapName) await snap(snapName);
    // which line above the caret each covered word stands on, and the words of the line just above (none may be covered)
    const lineOf = (r) => (caret && lh ? Math.round((caret.r.y - r.y) / lh) : null);
    const covered = (comp && comp.list) || [];
    const lines = covered.map((c) => lineOf(c.g));
    const lineAbove = allWords.filter((w) => lineOf(w.r) === 1);
    const lineAboveCovered = lineAbove.filter((w) => covered.some((c) => Math.abs(c.g.x - w.r.x) < 1 && Math.abs(c.g.y - w.r.y) < 1)).length;
    const maxOff = covered.length ? Math.max(...covered.map((c) => (c.off === null ? 999 : c.off))) : null;
    // a scroll with no re-compile: the glyph runs move with the text
    await ev('(() => { const s = document.querySelector(".mode-page .mode-scroll"); if (s) s.scrollTop -= 120; })()');
    await sleep(120);
    const scrolled = await ev('window.__f4.compiled()');
    const maxOffScrolled = scrolled && scrolled.list.length ? Math.max(...scrolled.list.map((c) => (c.off === null ? 999 : c.off))) : null;
    return { typed, span, mutDuring, grantsDuring, grantsAfter: (await ev('window.__f4.flashes("f3-compile")')).length - g0, after, comp, whole, lh, lines, lineAbove: lineAbove.length, lineAboveCovered, maxOff, maxOffScrolled, nScrolled: scrolled ? scrolled.list.length : 0 };
  };
  const c = await testCompile({ snapName: 's4-dark-1920-compiled' });
  ok(`COMPILE-ZERO while keys land: no layer change and no compile grant (${c.span.n} keys)`, c.span.n >= 50 && c.mutDuring === 0 && c.grantsDuring === 0, JSON.stringify({ keys: c.span.n, mut: c.mutDuring, grants: c.grantsDuring }));
  ok(`COMPILE on the pause, words two lines up and beyond are covered (${c.comp ? c.comp.list.length : 0} words), none on the caret's line or the line above (${c.lineAbove} words there, ${c.lineAboveCovered} covered)`,
    c.comp && c.comp.list.length >= 8 && c.lines.every((n) => n !== null && n >= 2) && c.lineAbove >= 3 && c.lineAboveCovered === 0 && c.grantsAfter >= 1,
    JSON.stringify({ n: c.comp && c.comp.list.length, lines: [...new Set(c.lines)], lh: c.lh, lineAbove: c.lineAbove, lineAboveCovered: c.lineAboveCovered, grants: c.grantsAfter }));
  ok(`COMPILE-PLACE every glyph run stands on its own word's rect (+-1 px; worst ${c.maxOff}), and still after a scroll with no re-compile (worst ${c.maxOffScrolled}, ${c.nScrolled} runs)`,
    c.maxOff !== null && c.maxOff <= 1 && c.maxOffScrolled !== null && c.maxOffScrolled <= 1, JSON.stringify((c.comp && c.comp.list.slice(0, 4)) || null));
  ok('COMPILE-TEXT the text, the caret and the Glitch bar\'s count are unchanged by the compile', c.typed.text === c.after.text && c.typed.caret && c.after.caret && c.typed.caret.before === c.after.caret.before && c.typed.count === c.after.count,
    JSON.stringify({ text: c.typed.text === c.after.text, caret: [c.typed.caret && c.typed.caret.before, c.after.caret && c.after.caret.before], count: [c.typed.count, c.after.count] }));
  // COMPILE-WHOLE (the Wrizors' S4 review, Fable Nov 7: "every character, punctuation included, compiles to one whole block"). Coverage: words
  // with punctuation among them ("1.", "page.") and both kinds of block drawn
  const wholeOf = (w) => { const list = w || []; const punct = list.filter((x) => /[^\p{L}\p{N}]/u.test(x.word || ''));
    return { n: list.length, punct: punct.length, bad: list.filter((x) => x.blocks !== x.chars || x.out > 0 || x.text > 0), filled: list.reduce((a, x) => a + x.filled, 0), blocks: list.reduce((a, x) => a + x.blocks, 0) }; };
  const cw = wholeOf(c.whole);
  ok(`COMPILE-WHOLE every character, punctuation included, is one whole block inside its own slot (${cw.n} words, ${cw.punct} with punctuation, ${cw.blocks} blocks, ${cw.filled} filled; ${cw.bad.length} bad)`,
    cw.n >= 8 && cw.punct >= 1 && cw.bad.length === 0 && cw.filled > 0 && cw.filled < cw.blocks, JSON.stringify({ bad: cw.bad.slice(0, 4), sample: (c.whole || []).filter((x) => /[^\p{L}\p{N}]/u.test(x.word || '')).slice(0, 3) }));
  ok('COMPILE-A11Y the layer sits in the page\'s own scroller, aria-hidden, no pointer, not selectable', c.comp && c.comp.inScroll && c.comp.aria === 'true' && c.comp.pe === 'none' && c.comp.us === 'none', JSON.stringify(c.comp && { inScroll: c.comp.inScroll, aria: c.comp.aria, pe: c.comp.pe, us: c.comp.us }));

  // ---- DECOMPILE + STILL -----------------------------------------------------------------------------------------------------------------------------
  const testDecompile = async ({ reduced = false, dial = 50, snapName = null } = {}) => {
    await open({ reduced, dial });
    // wait on the signal itself (Actions 42344491441: a fixed 600 ms read 0 words, and the compile landed while the hand opened); a page that never
    // compiles fails on `had`, never here
    await app.waitFor("document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length > 0", { timeout: 8000, label: 'the signal' }).catch(() => {});
    await sleep(300);
    const had = await ev('window.__f4.compiled()');
    const g0 = (await ev('window.__f4.flashes("f3-decompile")')).length;
    const text0 = (await st()).text;
    await pressToggle();
    await sleep(40);
    const early = await ev('window.__f4.compiled()');
    await sleep(80);
    const mid = await ev('window.__f4.compiled()');
    if (snapName) await snap(snapName);
    await sleep(700);
    const late = await st();
    await hand(false);
    const grants = (await ev('window.__f4.flashes("f3-decompile")')).length - g0;
    const midOff = mid && mid.list.length ? Math.max(...mid.list.map((x) => (x.off === null ? 999 : x.off))) : null;
    return { had: had ? had.list.length : 0, early: early ? early.list.length : 0, mid: mid ? { n: mid.list.length, decompile: mid.decompile, off: midOff } : null, gone: !late.compile, jackedOut: !late.jacked, textSame: late.text === text0, grants };
  };
  const dc = await testDecompile({ snapName: 's4-dark-1920-decompile' });
  ok(`DECOMPILE jacking out with signal showing (${dc.had} words): one grant, the glyph runs on their words as the page settles (worst ${dc.mid && dc.mid.off}), gone by 700 ms, the text unchanged`,
    dc.had >= 8 && dc.jackedOut && dc.grants === 1 && dc.mid && dc.mid.n > 0 && dc.mid.decompile && dc.mid.off !== null && dc.mid.off <= 1 && dc.gone && dc.textSame, JSON.stringify(dc));
  const dcR = await testDecompile({ reduced: true });
  const dcZ = await testDecompile({ dial: 0 });
  const stillOk = (x) => x.had >= 8 && x.jackedOut && x.early === 0 && x.grants === 0 && x.gone && x.textSame;
  ok('STILL reduced motion and Ambiance 0 cut the decompile (gone at once, no grant)', stillOk(dcR) && stillOk(dcZ), JSON.stringify({ reduced: dcR, dial0: dcZ }));
  const allFlashes = await ev('window.__f4.flashes()');
  ok(`FLASH no second holds more than 3 granted flashes across the compile and decompile runs (max ${maxIn1s(allFlashes)})`, maxIn1s(allFlashes) <= 3);

  // ---- IDLE ------------------------------------------------------------------------------------------------------------------------------------------
  const testIdle = async () => {
    await open();
    await ev('window.__f3IdleShift = 400');
    await sleep(3000);
    const jackedIn = await st();
    await pressToggle(); await hand(false);
    await app.mouseMove(8, 8);
    await ev('window.__f3IdleShift = 400');
    await sleep(500);
    const out = await st();
    await ev('window.__f3IdleShift = 0');
    return { jackedIn, out };
  };
  const id = await testIdle();
  ok('IDLE no idle glitch while jacked in (still 400 s on its clock); it is back once jacked out (premise)', id.jackedIn.jacked && !id.jackedIn.idleLayer && id.jackedIn.idleLive === 0 && !id.out.jacked && id.out.idleLayer,
    JSON.stringify({ in: [id.jackedIn.jacked, id.jackedIn.idleLayer, id.jackedIn.idleLive], out: [id.out.jacked, id.out.idleLayer] }));

  // ---- EDGE ------------------------------------------------------------------------------------------------------------------------------------------
  // each run on its OWN fresh page one word short of the lap (the first Actions run's mutant run reused the page an earlier run had typed past the
  // goal, so it read 250 words, not 249)
  let edgeRun = 0;
  const testEdge = async () => {
    edgeRun += 1;
    const pid = `${GOAL}-${edgeRun}`;
    await mk({ id: pid, text: Array.from({ length: 249 }, (_, i) => `w${i}`).join(' '), createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
    await sleep(300);
    await open({ id: pid });
    const a = await st();
    if (SHOTS) await snap('s4-dark-1920-edge');
    await app.typeKeys(' x');
    await sleep(250);
    const goal = await st();
    await sleep(1800);
    const next = await st();
    await pressToggle(); await sleep(300);
    const out = await st();
    await hand(false);
    await open({ id: pid, prefs: { progress: 'off' } });
    const off = await st();
    return { a, goal, next, out, off };
  };
  const e = await testEdge();
  const scaleOf = (b) => { const m = b && b.t && b.t.match(/matrix\(([^,]+)/); return m ? +(+m[1]).toFixed(4) : (b && b.t === 'none' ? 1 : null); };
  ok(`EDGE a 2 px line on the window's top holds 1 - the lap (249/250 words: ${e.a.burst && e.a.burst.left}), drawn by a transform with no transition`,
    e.a.jacked && e.a.burst && Math.abs(e.a.burst.left - 0.004) < 1e-6 && Math.abs(scaleOf(e.a.burst) - 0.004) < 1e-3 && e.a.burst.r.y === 0 && e.a.burst.r.h === 2 && e.a.burst.r.x === 0 && e.a.burst.r.w >= e.a.burst.vw - 20 && /^0s(,|$)/.test(e.a.burst.td),
    JSON.stringify(e.a.burst));
  ok('EDGE at the goal it empties, then fills for the next lap; gone once jacked out and with Progress off',
    e.goal.burst && e.goal.burst.left === 0 && e.next.burst && e.next.burst.left === 1 && !e.out.burst && e.off.jacked && !e.off.burst,
    JSON.stringify({ goal: e.goal.burst && e.goal.burst.left, next: e.next.burst && e.next.burst.left, out: !!e.out.burst, off: [e.off.jacked, !!e.off.burst] }));

  // ---- ESC / REACH: today's Typewriter controls, against the control ------------------------------------------------------------------------------
  const testControls = async (flag, tone = 'dark') => {
    await open({ flag, tone, prefs: flag ? {} : { typewriter: true } });
    for (const ch of ' more words') { await app.typeKeys(ch); await sleep(60); }
    await sleep(300);
    const typing = await st();
    // the pause before Esc, the same on both sides, so signal shows under the flag (Actions 42360786133: Esc 300 ms after the last key found
    // nothing compiled yet, and ESC-READ's premise read 0); under the flag it then waits on the signal itself, never past 2 s more
    await sleep(1000);
    if (flag) await app.waitFor("document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length >= 8", { timeout: 2000, label: 'signal before Esc' }).catch(() => {});
    const pre = await ev('window.__f4.look()');
    const g0 = (await ev('window.__f4.flashes("f3-resolve")')).length;
    await app.key('Escape');
    await sleep(500);
    const esc = await st();
    // ESC-LATER (the Wrizors' S4 review, Fable Nov 7): the page >= 1.2 s after Esc, read the same way on both sides
    await sleep(700);
    const later = await ev('window.__f4.look()');
    const resolveGrants = (await ev('window.__f4.flashes("f3-resolve")')).length - g0;
    await snap(flag ? 's4-esc-later' : 's4-esc-later-control');
    for (const ch of ' and more') { await app.typeKeys(ch); await sleep(60); }
    await sleep(300);
    const typing2 = await st();
    await app.mouseMove(2, 540);
    await sleep(700);
    const reach = await st();
    const again = await ev('window.__f4.look()');
    return { typing: [typing.zoom, typing.writing], esc: [esc.zoom, esc.writing, esc.jacked], pre, later, resolveGrants, again, typing2: [typing2.zoom, typing2.writing], reach: [reach.zoom, reach.writing] };
  };
  const kOn = await testControls(true), kOff = await testControls(false);
  // what dims or hides: the band mask on the column and the scroller, the opacity of the page, the column, the scroller, the editor and each of its
  // lines, the caret (the selection's, the focus, Flux's block caret). The compiled signal is reported apart: still jacked in, it is S4's own layer
  const dimOf = (l) => l && { colMask: l.colMask, scMask: l.scMask, op: l.op, rowOps: l.rowOps };
  const eL = { on: kOn.later, off: kOff.later };
  // ---- PARKED - SUPERSEDED by its own first run (Actions 42359165446, Nov 7): the control itself loses the focus and Flux's block caret after
  // Esc (today's Esc), so the premise "the control's caret is present" was false; every compared value matched. Kept VERBATIM and no longer run;
  // its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok(`ESC-LATER >= 1.2 s after Esc the lines are as lit and the caret as present as the control's (caret ${eL.on && eL.on.caret}/${eL.off && eL.off.caret}, block caret ${eL.on && eL.on.block}/${eL.off && eL.off.block}, focus ${eL.on && eL.on.focus}/${eL.off && eL.off.focus}; signal still on ${eL.on && eL.on.compiled} words)`,
  //   !!eL.on && !!eL.off && eL.off.caret && eL.off.block && eL.off.focus && eL.on.caret === eL.off.caret && eL.on.block === eL.off.block && eL.on.focus === eL.off.focus && same(dimOf(eL.on), dimOf(eL.off)),
  //   JSON.stringify(eL));
  const escSame = !!eL.on && !!eL.off && eL.on.caret === eL.off.caret && eL.on.block === eL.off.block && eL.on.focus === eL.off.focus && same(dimOf(eL.on), dimOf(eL.off));
  ok(`ESC-LATER [successor] >= 1.2 s after Esc the lines are as lit, and the caret, the focus and Flux's block caret exactly as the control's (caret ${eL.on && eL.on.caret}/${eL.off && eL.off.caret}, block caret ${eL.on && eL.on.block}/${eL.off && eL.off.block}, focus ${eL.on && eL.on.focus}/${eL.off && eL.off.focus})`,
    escSame, JSON.stringify(eL));
  if (process.env.HARNESS_PARKED === '1') {
    pok('PARKED (was "ESC-LATER >= 1.2 s after Esc the lines are as lit and the caret as present as the control\'s") - SUPERSEDED by its first run (Actions 42359165446, Nov 7: today\'s Esc takes the focus and Flux\'s block caret on the control too). Opposite reasserted: the control has no focus and no block caret after Esc, and Jacked In matches it; live successor ESC-LATER [successor]',
      escSame && !!eL.off && eL.off.focus === false && eL.off.block === false, JSON.stringify(eL));
  }
  // ESC-READ (the r4 frames, Nov 7: the control's lines read after Esc, Jacked In's stayed compiled): Esc resolves the signal through the budget
  // and the page reads as the control's; once she writes again, the next pause compiles again
  const escRead = (k) => !!k.pre && k.pre.compiled >= 8 && !!k.later && k.later.compiled === 0 && k.resolveGrants === 1 && !!k.again && k.again.compiled > 0;
  ok(`ESC-READ Esc resolves the signal (${kOn.pre && kOn.pre.compiled} words before, ${kOn.later && kOn.later.compiled} at 1.2 s, ${kOn.resolveGrants} grant), the page reading as the control's; writing again, the next pause compiles (${kOn.again && kOn.again.compiled})`,
    escRead(kOn) && kOff.later && kOff.later.compiled === 0, JSON.stringify({ pre: kOn.pre && kOn.pre.compiled, later: kOn.later && kOn.later.compiled, grants: kOn.resolveGrants, again: kOn.again && kOn.again.compiled }));
  // ESC-TERM (r9): looking up lifts the terminal's veil (the lines above read), and writing again lowers it
  const escTerm = (k) => !!k.pre && /gradient/.test(k.pre.edMask || '') && !k.pre.looking && !!k.later && k.later.looking && k.later.edMask === 'none' && !!k.again && !k.again.looking && /gradient/.test(k.again.edMask || '');
  ok(`ESC-TERM Esc lifts the terminal's veil (the editor's mask ${kOn.later && kOn.later.edMask}), and writing again lowers it`, escTerm(kOn) && !!kOff.later && kOff.later.edMask === 'none',
    JSON.stringify({ pre: kOn.pre && [kOn.pre.looking, kOn.pre.edMask], later: kOn.later && [kOn.later.looking, kOn.later.edMask], again: kOn.again && [kOn.again.looking, kOn.again.edMask], control: kOff.later && kOff.later.edMask }));
  ok('ESC while jacked in, Esc does what it does today (the chrome comes back, still in the Typewriter), the same as the control', kOn.esc[2] === true && kOn.esc[0] === 'true' && same(kOn.typing, kOff.typing) && same(kOn.esc.slice(0, 2), kOff.esc.slice(0, 2)),
    JSON.stringify({ on: kOn, off: kOff }));
  ok('REACH an edge dwell summons the chrome while jacked in, the same as the control', same(kOn.typing2, kOff.typing2) && same(kOn.reach, kOff.reach), JSON.stringify({ on: [kOn.typing2, kOn.reach], off: [kOff.typing2, kOff.reach] }));

  // ---- CARET: Flux's block caret on its page (the Wrizors' S4 r7 blocker, Fable Nov 7: the light tone's caret read 1.4:1 on its page) -----------------
  const caretOf = async ({ atRow = null, ...o }) => {
    await open({ view: [1366, 768], ...o });
    // an un-jacked page does not follow the caret to the text's end (278a0ad9's run: the Draft caret stood below the window and nothing was read
    // under it): the caret at the end of a row at the top of the unscrolled page
    if (atRow !== null) { await ev(`(() => { const s = document.querySelector('.mode-page .mode-scroll'); if (s) s.scrollTop = 0; return window.__f4.toRow(${atRow}); })()`); await sleep(400); }
    // the block caret on screen before the read (r10b: jacked in, the Typewriter was still gliding the long page to its end: the caret at y 1802)
    await app.waitFor("(() => { const b = document.querySelector('.flux-block-caret'); if (!b) return false; const r = b.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; })()", { timeout: 8000, label: 'the block caret on screen' }).catch(() => {});
    await sleep(300);
    await app.waitFor("!!document.querySelector('.flux-block-caret')", { timeout: 4000, label: 'the block caret' }).catch(() => {});
    return ev('window.__f4.caretInk()');
  };
  // the orange family: red over green over blue, its hue between 15 and 45 degrees (the shared orange is 36, the light caret 28)
  const hueOf = (c) => { if (!c) return null; const [r, g, b] = c, mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx === mn) return null; return mx === r ? (60 * (g - b)) / (mx - mn) : null; };
  const caretLightOk = (k) => !!k && k.ratio !== null && k.ratio >= 4.5 && !!k.ink && hueOf(k.ink) !== null && hueOf(k.ink) >= 15 && hueOf(k.ink) <= 45;
  const kLight = await caretOf({ tone: 'light', id: CARETP }), kDark = await caretOf({ tone: 'dark' });
  // ---- PARKED - SUPERSEDED by Nick's ruling (Nov 7, via Fable): Jacked In's light caret is BRASS #FF9800 held by a 1 px ink outline, so its fill
  // is no longer the contrast (this open is Free Write: jacked in by default). Kept VERBATIM and no longer run; its parked record is in the
  // HARNESS_PARKED block, and its successors follow: the jacked caret's outline, and the plain (un-jacked) light caret's fill.
  // ok(`CARET-LIGHT the block caret on the light page is >= 4.5:1 against the page under it (${kLight && kLight.ratio}:1), in the orange family (hue ${kLight && r1(hueOf(kLight.ink))})`,
  //   caretLightOk(kLight), JSON.stringify(kLight));
  // the jacked light caret: jacked in, the fill brass (opaque #FF9800), a 1 px solid outline that reads >= 4.5:1 against the page under it
  const caretBrassOk = (k, st0) => !!k && !!st0 && st0.jacked && k.caret === 'rgb(255, 152, 0)' && !!k.outline && k.outline.style === 'solid' && k.outline.width >= 1 && k.outline.width < 1.5
    && k.outline.ratio !== null && k.outline.ratio >= 4.5;
  const kLightSt = await st();
  ok(`CARET-JACKED-LIGHT [successor] Jacked In's light caret is brass (${kLight && kLight.caret}) held by a 1 px ink outline (${kLight && kLight.outline && kLight.outline.width}px ${kLight && kLight.outline && kLight.outline.style}) at ${kLight && kLight.outline && kLight.outline.ratio}:1 against the page (>= 4.5)`,
    caretBrassOk(kLight, kLightSt), JSON.stringify({ k: kLight, jacked: kLightSt.jacked }));
  // the plain light caret under the flag (a Draft page whose own Typewriter is off: not jacked): r8's #A84E00 fill, >= 4.5:1
  const kPlain = await caretOf({ tone: 'light', id: DRAFTP, pageTw: 'off', atRow: 1 });
  const kPlainSt = await st();
  ok(`CARET-PLAIN-LIGHT [successor] outside Jacked In the light caret's fill is >= 4.5:1 against the page (${kPlain && kPlain.ratio}:1), in the orange family, and no outline`,
    !kPlainSt.jacked && caretLightOk(kPlain) && !!kPlain.outline && kPlain.outline.ratio === null, JSON.stringify({ k: kPlain, jacked: kPlainSt.jacked }));
  if (process.env.HARNESS_PARKED === '1') {
    pok('PARKED (was "CARET-LIGHT the block caret on the light page is >= 4.5:1 against the page under it, in the orange family") - SUPERSEDED by Nick\'s ruling (Nov 7: Jacked In\'s light caret is brass with a 1 px ink outline). Opposite reasserted: the jacked light caret\'s FILL is under 4.5:1 (brass), and its outline carries the contrast; live successors CARET-JACKED-LIGHT, CARET-PLAIN-LIGHT',
      !caretLightOk(kLight) && caretBrassOk(kLight, kLightSt), JSON.stringify(kLight));
  }
  ok('CARET-DARK the dark tone keeps its caret (the shared orange, rgba(255, 152, 0, 0.82))', !!kDark && kDark.caret === 'rgba(255, 152, 0, 0.82)', JSON.stringify(kDark));
  // ---- TERM: the terminal (r9, Nick Nov 7, the spec's draft 13 §6: no paper; one writing line, one dim line, then signal rows) -------------------
  const pixOf = async (box) => {
    if (!box || box.width < 2 || box.height < 2) return null;
    const shot = await app.cdp('Page.captureScreenshot', { format: 'png' });
    return ev(`window.__f4.pix(${JSON.stringify(shot.data)}, ${JSON.stringify(box)})`);
  };
  // at Ambiance 0: the tunnel stands still (no streak crosses a measured line), and the veil, the compile and the rows are the same. (r9's first
  // runs used reduced motion: there the zoomed Typewriter left the writing line BELOW the window after the burst, y 880-1050 of 768, so every
  // line box fell off the screen; INFO TERM-WHERE-CONTROL asks whether today's Typewriter does the same, flag off)
  const testTerminal = async (tone) => {
    await open({ tone, view: [1366, 768], dial: 0 });
    await ev('window.__f4.zoomWatch()');
    const rest = await ev('window.__f4.term()');
    // a burst that wraps: lines rise while keys land, and BEFORE the pause the line two up (it rose during the burst, so no signal covers it yet:
    // the open's own pause compiled only the lines that stood two up then) must show no text
    // at 70 ms a key (r9e: at 25 ms the burst outran the Typewriter's own line glides, and the writing line stood four lines below the anchor,
    // inside the band's fade, steady for 60 ms: the Typewriter's engine, the same on the control)
    for (const ch of ' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps') { await app.typeKeys(ch); await sleep(70); }
    await sleep(120);
    // the writing line on screen first (r9b's run read every line box below the window: the diagnostic says where the caret stood, and how long
    // the line took to come into view, never past 450 ms, inside the 700 ms pause)
    const DIAG = "(() => { const c = window.__f4.caret(), ed = window.__f4.ed(), sc = document.querySelector('.mode-page .mode-scroll'); return { caret: c && c.r, lh: window.__f4.lh(), ed: ed ? ((r) => [Math.round(r.top), Math.round(r.bottom)])(ed.getBoundingClientRect()) : null, top: sc ? sc.scrollTop : null, vh: innerHeight }; })()";
    const d0 = await ev(DIAG);
    const tSeen = Date.now();
    await app.waitFor("(() => { const c = window.__f4.caret(); return !!c && c.r.y > 0 && c.r.y + c.r.h < innerHeight; })()", { timeout: 450, label: 'the writing line on screen' }).catch(() => {});
    // and settled (r9d's dark read caught a glide: the caret at 605 on its way to 424): two reads 60 ms apart agree, inside the pause
    // and AT the Typewriter's anchor (the middle of the column), not merely still: r9f's mutant run read a line held steady in the band's fade
    await app.waitFor("(() => { const c = window.__f4.caret(), col = document.querySelector('.mode-pagecol'), lh = window.__f4.lh(); if (!c || !col || !lh) return false; const R = col.getBoundingClientRect(); return Math.abs(c.r.y + c.r.h / 2 - (R.top + R.height / 2)) < lh * 0.75; })()", { timeout: 500, label: 'the writing line at the anchor' }).catch(() => {});
    let lastY = null, same2 = 0;
    for (let i = 0; i < 8; i += 1) { const y = await ev('(() => { const c = window.__f4.caret(); return c ? Math.round(c.r.y) : null; })()'); same2 = y !== null && y === lastY ? same2 + 1 : 0; if (same2 >= 2) break; lastY = y; await sleep(50); }
    const d1 = { ...(await ev(DIAG)), waited: Date.now() - tSeen };
    console.log(`INFO TERM-WHERE (${tone}) after the burst ${JSON.stringify(d0)} then ${JSON.stringify(d1)}`);
    const hidBox = await ev('window.__f4.lineBox(2)');
    const hidSignal = hidBox ? await ev(`(() => { const b = ${JSON.stringify(hidBox)}; return [...document.querySelectorAll('[data-flux3-compile] .flux3-compile-word')].filter((g) => { const r = g.getBoundingClientRect(); return r.right > b.x && r.left < b.x + b.width && r.bottom > b.y && r.top < b.y + b.height; }).length; })()`) : null;
    const write = await pixOf(await ev('window.__f4.lineBox(0)'));
    const dim = await pixOf(await ev('window.__f4.lineBox(1)'));
    const hid = await pixOf(hidBox);
    await sleep(1500);
    // THE SETTLED READ (TERM-LINES [successor]): long past the pause and the glides, the writing line at the anchor; the lines two and three up are
    // signal now, so the text UNDER them is read with the signal layer hidden for that one shot (the instrument's only touch: the overlay's own
    // visibility, put back at once)
    await app.waitFor("(() => { const c = window.__f4.caret(), col = document.querySelector('.mode-pagecol'), lh = window.__f4.lh(); if (!c || !col || !lh) return false; const R = col.getBoundingClientRect(); return Math.abs(c.r.y + c.r.h / 2 - (R.top + R.height / 2)) < lh * 0.75; })()", { timeout: 1500, label: 'the writing line at the anchor (settled)' }).catch(() => {});
    const sst = await st();
    const sigOver = (k) => ev(`(() => { const b = window.__f4.lineBox(${k}); if (!b) return null; return [...document.querySelectorAll('[data-flux3-compile] .flux3-compile-word')].filter((g) => { const r = g.getBoundingClientRect(); return r.right > b.x && r.left < b.x + b.width && r.bottom > b.y && r.top < b.y + b.height; }).length; })()`);
    const settled = { zoom: sst.zoom, jacked: sst.jacked, write: await pixOf(await ev('window.__f4.lineBox(0)')), dim: await pixOf(await ev('window.__f4.lineBox(1)')), sig2: await sigOver(2), sig3: await sigOver(3) };
    await ev("(() => { const L = document.querySelector('[data-flux3-compile]'); if (L) L.style.visibility = 'hidden'; return true; })()");
    await sleep(60);
    try { settled.under2 = await pixOf(await ev('window.__f4.lineBox(2)')); settled.under3 = await pixOf(await ev('window.__f4.lineBox(3)')); }
    finally { await ev("(() => { const L = document.querySelector('[data-flux3-compile]'); if (L) L.style.removeProperty('visibility'); return true; })()"); }
    const zlog = await ev('window.__f4.zoomStop()');
    console.log(`INFO TERM-ZOOM (${tone}) the editor's scale, each change: ${JSON.stringify(zlog)}; page-turns [t, editor scrollHeight, scroll clientHeight, scrollWidth, clientWidth, offsetHeight, transform]: ${JSON.stringify(await ev('window.__f4.flips'))}`);
    return { rest, hidSignal, write, dim, hid, settled, zlog, flips: await ev('window.__f4.flips'), rows: await ev('window.__f4.rows()'), after: await ev('window.__f4.term()') };
  };
  const clear = (bg) => { const m = /rgba?\(([^)]+)\)/.exec(bg || ''); if (!m) return false; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length === 4 && +p[3] === 0; };
  const termPaperOk = (x, tone) => !!x && clear(x.pageBg) && x.readouts === 'hidden' && /gradient/.test(x.edMask || '') && !x.looking && (tone === 'light' ? x.groundBg === 'rgb(244, 247, 248)' : clear(x.groundBg));
  const termLinesOk = (x) => !!x.write && !!x.dim && !!x.hid && x.hidSignal === 0 && x.write.ratio >= 4.5 && x.dim.ratio >= 4.5 && x.dim.ratio <= x.write.ratio * 0.85 && x.hid.ratio < 2.5;
  // the settled read: jacked and zoomed; the writing line and the dim one >= 4.5 (the dim one dimmer); the lines two and three up ARE signal, and
  // with the signal hidden for that shot, no text under it (< 2.5: only the tunnel's still lines)
  const termLinesSucc = (x) => { const s = x.settled; return !!s && s.zoom === 'true' && s.jacked && !!s.write && !!s.dim && !!s.under2 && !!s.under3 && s.sig2 > 0 && s.sig3 > 0
    && s.write.ratio >= 4.5 && s.dim.ratio >= 4.5 && s.dim.ratio <= s.write.ratio * 0.85 && s.under2.ratio < 2.5 && s.under3.ratio < 2.5; };
  const termRowsOk = (x) => !!x.rows && x.rows.length >= 3 && x.rows.every((r, i) => i === 0 || r.share < x.rows[i - 1].share - 0.02) && x.rows[0].share <= 0.73;
  // the floor: BLOCK_FILL (.72) x SIGNAL.rowMin (.5); at least three rows above it, each smaller than the one below, then every row at it
  const FLOOR = 0.36;
  const termRowsSucc = (x) => { if (!x.rows || x.rows.length < 4 || x.rows[0].share > 0.73) return false; const at = (r) => Math.abs(r.share - FLOOR) <= 0.01;
    const k = x.rows.findIndex(at); if (k < 3) return false;
    return x.rows.slice(1, k).every((r, i) => r.share < x.rows[i].share - 0.02) && x.rows[k].share < x.rows[k - 1].share && x.rows.slice(k).every(at); };
  // at least three rows; each smaller than the one below it (by > .01), or both at the floor; none below the floor; the first row full
  const termRowsSucc2 = (x) => { if (!x.rows || x.rows.length < 3 || x.rows[0].share > 0.73 || x.rows[0].share < 0.71) return false; const at = (r) => Math.abs(r.share - FLOOR) <= 0.01;
    return x.rows.every((r) => r.share >= FLOOR - 0.01) && x.rows.slice(1).every((r, i) => r.share < x.rows[i].share - 0.01 || (at(r) && at(x.rows[i]))); };
  const tmL = await testTerminal('light'), tmD = await testTerminal('dark');
  // INFO (a finding, never a verdict): where the writing line stands after the same burst under REDUCED MOTION, flag on and on the control
  const whereReduced = async (flag) => {
    await open({ flag, view: [1366, 768], reduced: true, prefs: flag ? {} : { typewriter: true } });
    for (const ch of ' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps') { await app.typeKeys(ch); await sleep(25); }
    await sleep(600);
    return ev("(() => { const c = window.__f4.caret(), sc = document.querySelector('.mode-page .mode-scroll'), z = document.querySelector('.mode-pagecol')?.getAttribute('data-zoom'); return { zoom: z, caretY: c ? Math.round(c.r.y) : null, caretH: c ? Math.round(c.r.h) : null, top: sc ? sc.scrollTop : null, vh: innerHeight, onScreen: !!c && c.r.y > 0 && c.r.y + c.r.h < innerHeight }; })()");
  };
  const wrOn = await whereReduced(true), wrOff = await whereReduced(false);
  // INFO: the same burst and wait on the CONTROL (flag off, the Typewriter on, Ambiance 0, dark), its zoom watched the same way
  const zoomControl = async () => {
    await open({ flag: false, tone: 'dark', view: [1366, 768], dial: 0, prefs: { typewriter: true } });
    await ev('window.__f4.zoomWatch()');
    for (const ch of ' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps') { await app.typeKeys(ch); await sleep(70); }
    await sleep(3000);
    const z = await ev('window.__f4.zoomStop()');
    return { zoom: z, flips: await ev('window.__f4.flips') };
  };
  console.log(`INFO TERM-ZOOM-CONTROL (flag off, the Typewriter on, dark, Ambiance 0) the editor's scale, each change: ${JSON.stringify(await zoomControl())}`);
  console.log(`INFO TERM-WHERE-CONTROL reduced motion, after a burst: Jacked In ${JSON.stringify(wrOn)} / the control (flag off, the Typewriter on) ${JSON.stringify(wrOff)}${!wrOff.onScreen ? ' - the TYPEWRITER\'s own (not S4\'s)' : ''}`);
  for (const [tone, x] of [['light', tmL], ['dark', tmD]]) {
    ok(`TERM-PAPER (${tone}) jacked in, no paper: the page clear (${x.rest && x.rest.pageBg}), its readouts hidden, the veil on the editor; the ground ${tone === 'light' ? 'the white room (the paper\'s colour)' : 'the night glass (nothing laid)'} (${x.rest && x.rest.groundBg})`,
      termPaperOk(x.rest, tone) && termPaperOk(x.after, tone), JSON.stringify({ rest: x.rest, after: x.after }));
    // ---- PARKED - SUPERSEDED by its own runs (Actions 42415597899 to 42420374454, Nov 7): "before the pause" races the Typewriter's glides (the
    // line stood in the band's fade, or the wait ran past the 700 ms pause and the line two up was signal by the read). Kept VERBATIM and no
    // longer run; its successor reads the settled page.
    // ok(`TERM-LINES (${tone}, in pixels) the writing line ${x.write && x.write.ratio}:1, the dim line above it ${x.dim && x.dim.ratio}:1 (>= 4.5, dimmer), the line two up hidden before the pause (${x.hid && x.hid.ratio}:1, < 2.5; signal over it then: ${x.hidSignal})`,
    //   termLinesOk(x), JSON.stringify({ write: x.write, dim: x.dim, hid: x.hid, hidSignal: x.hidSignal }));
    // TERM-ZOOM (r9's zoom watch: ModeStage's page-turn threw the zoomed page to scale 1 for half a second, the rect moving): the page's scale
    // holds through the whole terminal run, whatever page-turns come
    const zs = (x.zlog || []).map((z) => z[1]);
    ok(`TERM-ZOOM (${tone}) the page's scale holds at the zoom through the terminal run (scales seen ${JSON.stringify([...new Set(zs)])}; page-turns ${JSON.stringify((x.flips || []).length)})`,
      zs.length >= 1 && zs.every((v) => Math.abs(v - zs[0]) <= 0.05) && zs[0] > 1.05, JSON.stringify({ zlog: x.zlog, flips: x.flips }));
    const sx = x.settled || {};
    ok(`TERM-LINES [successor] (${tone}, in pixels, settled) the writing line ${sx.write && sx.write.ratio}:1, the dim line above it ${sx.dim && sx.dim.ratio}:1 (>= 4.5, dimmer); under the signal two and three up no text (${sx.under2 && sx.under2.ratio}:1, ${sx.under3 && sx.under3.ratio}:1, < 2.5; signal words there ${sx.sig2}, ${sx.sig3})`,
      termLinesSucc(x), JSON.stringify(sx));
    if (process.env.HARNESS_PARKED === '1') {
      pok(`PARKED (was "TERM-LINES (${tone}, in pixels) ... the line two up hidden before the pause") - SUPERSEDED by its own runs (Actions 42415597899 to 42420374454: "before the pause" raced the Typewriter's glides). Opposite reasserted: once settled, the line two up IS signal (${sx.sig2} words), so it is read under the signal; live successor TERM-LINES [successor]`,
        termLinesSucc(x) && sx.sig2 > 0, JSON.stringify(sx));
    }
    // ---- PARKED - SUPERSEDED by its own first run (Actions 42410571466, Nov 7): the rows shrink to the floor (SIGNAL.rowMin: share .36 from the
    // sixth row up) and hold it there, so "smaller every row" was false above the floor. Kept VERBATIM and no longer run; its parked record is in
    // the HARNESS_PARKED block, and its successor follows.
    // ok(`TERM-ROWS (${tone}) on the pause the rows of signal grow smaller toward the top (block share per row ${JSON.stringify(x.rows && x.rows.map((r) => [r.row, r.share]))})`, termRowsOk(x), JSON.stringify(x.rows));
    // ---- PARKED - SUPERSEDED by its own first run at Ambiance 0 (Actions 42415597899, Nov 7): only the four nearest rows stand in view there,
    // so the floor is never reached and "down to the floor" was false. Kept VERBATIM and no longer run; its successor follows.
    // ok(`TERM-ROWS [successor] (${tone}) on the pause each row of signal smaller toward the top down to the floor, and every row past it at the floor (block share per row ${JSON.stringify(x.rows && x.rows.slice(0, 8).map((r) => [r.row, r.share]))})`,
    //   termRowsSucc(x), JSON.stringify(x.rows));
    ok(`TERM-ROWS [successor 2] (${tone}) on the pause each row of signal smaller than the one below it, or both at the floor; never below it (block share per row ${JSON.stringify(x.rows && x.rows.slice(0, 8).map((r) => [r.row, r.share]))})`,
      termRowsSucc2(x), JSON.stringify(x.rows));
    if (process.env.HARNESS_PARKED === '1') {
      // (its re-assertion re-pointed in the same unmerged round: at Ambiance 0 no row reaches the floor, so "two rows at the floor" has no rows)
      pok(`PARKED (was "TERM-ROWS (${tone}) on the pause the rows of signal grow smaller toward the top") - SUPERSEDED by its own first run (Actions 42410571466: under reduced motion sixteen rows stood in view and held the floor past the sixth). Opposite reasserted: no row is ever below the floor, so a view that reaches it holds rows of one size; live successor TERM-ROWS [successor 2]`,
        termRowsSucc2(x) && !!x.rows && x.rows.every((r) => r.share >= FLOOR - 0.01), JSON.stringify(x.rows));
      // (re-pointed in the same unmerged round: r9f's dark view held eight rows and reached the floor, so "this view never reaches it" hung on
      // where the scroll landed; the claim that does not: the parked check is true exactly of a view that reaches the floor)
      pok(`PARKED (was "TERM-ROWS [successor] (${tone}) ... down to the floor, and every row past it at the floor") - SUPERSEDED by its own first run at Ambiance 0 (Actions 42415597899: four rows in view, none at the floor). Opposite reasserted: it holds exactly when the view reaches the floor (here ${x.rows && x.rows.some((r) => Math.abs(r.share - FLOOR) <= 0.01) ? 'it does' : 'it does not'}); live successor TERM-ROWS [successor 2]`,
        termRowsSucc2(x) && !!x.rows && termRowsSucc(x) === x.rows.some((r) => Math.abs(r.share - FLOOR) <= 0.01), JSON.stringify(x.rows));
    }
  }
  const kCtl = await caretOf({ flag: false, tone: 'light', prefs: { typewriter: true } });
  console.log(`INFO CARET-CONTROL the flag-off light caret (Flux v2, not S4's scope: new CSS only under the flag): ${kCtl && kCtl.ratio}:1 ${JSON.stringify(kCtl)}`);

  // ---- THE WRIZORS' S4 r9 REVIEW (Fable, Nov 7) -------------------------------------------------------------------------------------------------
  // (1) Esc resolves EVERY compiled line, in both tones (the dark run is ESC-READ's, above); jacking out leaves no signal at all, in both tones
  const kOnL = await testControls(true, 'light');
  const escAll = (k) => !!k.pre && k.pre.compiled >= 8 && !!k.later && k.later.compiled === 0 && k.later.layerKids === 0;
  ok(`ESC-ALL Esc resolves every compiled line, both tones (light: ${kOnL.pre && kOnL.pre.compiled} before, ${kOnL.later && kOnL.later.compiled} words and ${kOnL.later && kOnL.later.layerKids} pieces at 1.2 s; dark: ${kOn.pre && kOn.pre.compiled} before, ${kOn.later && kOn.later.compiled} and ${kOn.later && kOn.later.layerKids})`,
    escAll(kOnL) && escAll(kOn), JSON.stringify({ light: kOnL.later && [kOnL.pre.compiled, kOnL.later.compiled, kOnL.later.layerKids], dark: kOn.later && [kOn.pre.compiled, kOn.later.compiled, kOn.later.layerKids] }));
  const testJackOutAll = async (tone) => {
    await open({ tone });
    await app.waitFor("document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length >= 8", { timeout: 3000, label: 'signal before jacking out' }).catch(() => {});
    const before = await ev("document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length");
    await pressToggle(); await sleep(900);
    const after = await ev("({ layers: document.querySelectorAll('[data-flux3-compile]').length, words: document.querySelectorAll('.flux3-compile-word').length, zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') })");
    await hand(false);
    return { before, after };
  };
  const joL = await testJackOutAll('light'), joD = await testJackOutAll('dark');
  const joOk = (x) => x.before >= 8 && x.after.zoom !== 'true' && x.after.layers === 0 && x.after.words === 0;
  ok(`JACKOUT-ALL jacking out leaves no signal anywhere, both tones, by 900 ms (light ${joL.before} -> ${JSON.stringify(joL.after)}; dark ${joD.before} -> ${JSON.stringify(joD.after)})`, joOk(joL) && joOk(joD), JSON.stringify({ joL, joD }));

  // (2) the block caret at the text's end, 300 ms after a burst (Jacked In, and the control: the fix is in FluxBlockCaret, shared)
  // mode 'compiled' is the frames' jack-compiled screen exactly (the r9 frame the Wrizors flagged): the words in one call, the pointer to the
  // corner, the frame 1.6 s later
  const testCaretEnd = async (flag, mode = 'burst') => {
    await open({ flag, prefs: flag ? {} : { typewriter: true } });
    if (mode === 'compiled') { await app.typeKeys(' and the line keeps going forward with more plain words now, on and on across the measure of the page until it wraps again'); await app.mouseMove(8, 8); await sleep(1600); }
    else { for (const ch of ' the signal holds while she writes on and on and on whil') { await app.typeKeys(ch); await sleep(35); } await sleep(300); }
    return ev('window.__f4.blockAt()');
  };
  const ceOn = await testCaretEnd(true), ceOff = await testCaretEnd(false);
  const ceOnB = await testCaretEnd(true, 'compiled'), ceOffB = await testCaretEnd(false, 'compiled');
  const atEnd = (x) => !!x && !!x.block && !!x.end && Math.abs(x.block.x - x.end.right) <= 3 && Math.abs((x.block.y + x.block.h / 2) - (x.end.y + x.end.h / 2)) <= x.end.h * 0.6;
  ok(`CARET-END 300 ms after a burst the block caret stands at the text's end (Jacked In: caret x ${ceOn && ceOn.block && ceOn.block.x}, end ${ceOn && ceOn.end && ceOn.end.right}; the control: ${ceOff && ceOff.block && ceOff.block.x} vs ${ceOff && ceOff.end && ceOff.end.right})`,
    atEnd(ceOn) && atEnd(ceOff), JSON.stringify({ on: ceOn, off: ceOff }));
  ok(`CARET-END-COMPILED the frames' jack-compiled screen: 1.6 s after the words land the block caret stands at the text's end (Jacked In: ${ceOnB && ceOnB.block && ceOnB.block.x} vs ${ceOnB && ceOnB.end && ceOnB.end.right}; the control: ${ceOffB && ceOffB.block && ceOffB.block.x} vs ${ceOffB && ceOffB.end && ceOffB.end.right})`,
    atEnd(ceOnB) && atEnd(ceOffB), JSON.stringify({ on: ceOnB, off: ceOffB }));

  // (3) the rows compiled at the last pause STAY while she types (only NEW compiling waits for the pause: ruling F)
  const testRowsStay = async (tone) => {
    await open({ tone });
    const flashes0 = await ev('(window.__wzFlashLog || []).filter((f) => f.kind === "f3-compile").map((f) => f.ok)');
    const clog = await ev('(window.__wzCompileLog || []).map((x) => x[1])');
    // and over one more second of rest, the events that reset the compile's pause
    await ev('(() => { window.__f4.evc = {}; return true; })()'); await sleep(1000);
    const restEvents = await ev('window.__f4.evc');
    console.log(`INFO OPEN-ROWS-WHY (${tone}) compile log ${JSON.stringify(clog)}; events in one second of rest ${JSON.stringify(restEvents)}`);
    const rest = await ev("({ n: document.querySelectorAll('[data-flux3-compile] .flux3-compile-word').length })");
    await ev("(() => { window.__f4.firstSig = document.querySelector('[data-flux3-compile] .flux3-compile-word'); return true; })()");
    const k0 = await ev('window.__f4.keys.length');
    let mid = null;
    const burst = ' and the line keeps going forward with more plain words now, on and on';
    for (let i = 0; i < burst.length; i += 1) { await app.typeKeys(burst[i]); await sleep(40); if (i === burst.length - 10) mid = await ev("(() => { const L = document.querySelector('[data-flux3-compile]'), ws = [...document.querySelectorAll('[data-flux3-compile] .flux3-compile-word')]; const cs = L ? getComputedStyle(L) : null; return { n: ws.length, same: !!window.__f4.firstSig && window.__f4.firstSig.isConnected, vis: cs ? cs.visibility : null, op: cs ? +cs.opacity : null, seen: ws.filter((g) => { const r = g.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; }).length, writing: document.documentElement.getAttribute('data-wz-writing') }; })()"); }
    const keys = await ev(`window.__f4.keys.length - ${k0}`);
    return { rest, mid, keys, flashes0, clog };
  };
  const rsL = await testRowsStay('light'), rsD = await testRowsStay('dark');
  ok(`OPEN-ROWS on opening, the open's own pause compiles: rows at rest (light ${rsL.rest.n}, dark ${rsD.rest.n} words; compile grants ${JSON.stringify(rsL.flashes0)} / ${JSON.stringify(rsD.flashes0)})`, rsL.rest.n >= 8 && rsD.rest.n >= 8, JSON.stringify({ rsL, rsD }));
  const stayOk = (x) => x.rest.n >= 8 && !!x.mid && x.mid.writing === 'true' && x.mid.n === x.rest.n && x.mid.same && x.mid.vis === 'visible' && x.mid.op >= 0.99 && x.mid.seen >= 4;
  ok(`ROWS-STAY mid-burst (keys landing, the chrome receded) the rows compiled at the last pause are all still there and seen (light ${JSON.stringify(rsL.mid)}, dark ${JSON.stringify(rsD.mid)})`, stayOk(rsL) && stayOk(rsD), JSON.stringify({ rsL, rsD }));

  // ---- FL: Forward Lock is today's -------------------------------------------------------------------------------------------------------------------
  const testFL = async (flag, id) => {
    await open({ flag, id, prefs: flag ? {} : { typewriter: true } });
    await app.typeKeys(' abc');
    await sleep(200);
    await app.key('Backspace'); await sleep(120); await app.key('Backspace');
    await sleep(1500);
    const x = await st();
    return { text: x.text, struck: x.struck, zoom: x.zoom };
  };
  const fOn = await testFL(true, FL_ON), fOff = await testFL(false, FL_OFF);
  ok('FL Backspace in Jacked In strikes and never deletes, exactly as the control', fOn.zoom === 'true' && /abc/.test(fOn.text) && fOn.text === fOff.text && fOn.struck === fOff.struck, JSON.stringify({ on: fOn, off: fOff }));

  // ---- TUN: the tunnel (Nick kept it, Nov 7: ruling B, INK's lean) -------------------------------------------------------------------------------
  const testTunnel = async () => {
    await open();
    const rest = await ev('window.__f4.tunnel()');
    await sleep(600);
    const rest2 = await ev('window.__f4.tunnel()');
    await ev('(() => { window.__f4.watchTunnel(); window.__f4.rates = []; return true; })()');
    const t0 = await ev('performance.now()');
    let mid = null;
    for (let i = 0; i < 90; i += 1) { await app.typeKeys(CYCLE[i % CYCLE.length]); await sleep(40); if (i === 60) mid = await ev('window.__f4.tunnel()'); }
    const t1 = await ev('performance.now()');
    const end = await ev('window.__f4.tunnel()');
    await sleep(6500);
    const after = await ev('window.__f4.tunnel()');
    return { rest, rest2, mid, end, after, rates: await ev('window.__f4.rates'), muts: await ev('window.__f4.tunMut || []'), t0, t1 };
  };
  // a re-set sets every animation's rate at once: one set is a cluster of calls within 100 ms
  const setsOf = (rates) => { const out = []; for (const [t, r] of rates || []) { const last = out[out.length - 1]; if (last && t - last.t < 100) continue; out.push({ t, r }); } return out; };
  const gapsOk = (ts) => ts.every((t, i) => i === 0 || t - ts[i - 1] >= 1990);
  const opaque = (bg) => { const m = /rgba?\(([^)]+)\)/.exec(bg || ''); if (!m) return false; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length < 4 || +p[3] === 1; };
  const tunOk = (x) => !!x.rest && x.rest.inStage && x.rest.first && x.rest.aria === 'true' && x.rest.pe === 'none' && x.rest.canvas === 0 && x.rest.frames === 12 && x.rest.anims >= 12
    && x.rest.running === x.rest.anims && same(x.rest.props, ['opacity', 'transform']) && !!x.rest2 && x.rest2.time > x.rest.time && opaque(x.rest.pageBg) && x.rest.pageAbove;
  const typeOk = (x) => !!x.mid && x.mid.writing === 'true' && x.mid.op >= 0.99 && x.mid.anims > 0 && x.mid.running === x.mid.anims;
  const rateOf = (x) => { const sets = setsOf(x.rates), during = sets.filter((s) => s.t >= x.t0 && s.t <= x.t1 + 50), muts = (x.muts || []);
    return { sets: sets.map((s) => [Math.round(s.t - x.t0), +s.r.toFixed(2)]), gaps: gapsOk(sets.map((s) => s.t)), top: during.length ? Math.max(...during.map((s) => s.r)) : null,
      rest: x.after ? x.after.rates : null, fast: !!(x.mid && x.mid.fast) || !!(x.end && x.end.fast), mutKinds: [...new Set(muts.map((m) => m[2] || m[1]))], mutGaps: gapsOk(muts.map((m) => m[0])) }; };
  const tun = await testTunnel();
  const tr = rateOf(tun);
  // ---- PARKED - SUPERSEDED by Nick's terminal (Nov 7, the spec's draft 13 §6, r9): Jacked In has NO PAPER, so "the page's paper opaque" is no
  // longer the design. Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  // ok(`TUN the tunnel stands behind the page while jacked in: first in .mode-stage, aria-hidden, no pointer, no canvas, ${tun.rest && tun.rest.frames} frames, every animation transform/opacity only (${tun.rest && tun.rest.props}) and running; the page's paper opaque (${tun.rest && tun.rest.pageBg}) and above it`,
  //   tunOk(tun), JSON.stringify({ rest: tun.rest, t2: tun.rest2 && tun.rest2.time }));
  const tunBase = (x) => !!x.rest && x.rest.inStage && x.rest.first && x.rest.aria === 'true' && x.rest.pe === 'none' && x.rest.canvas === 0 && x.rest.frames === 12 && x.rest.anims >= 12
    && x.rest.running === x.rest.anims && same(x.rest.props, ['opacity', 'transform']) && !!x.rest2 && x.rest2.time > x.rest.time && x.rest.pageAbove;
  const tunSucc = (x) => tunBase(x) && clear(x.rest.pageBg);
  ok(`TUN [successor] the tunnel stands behind the page while jacked in: first in .mode-stage, aria-hidden, no pointer, no canvas, ${tun.rest && tun.rest.frames} frames, every animation transform/opacity only (${tun.rest && tun.rest.props}) and running; the page above it with no paper (${tun.rest && tun.rest.pageBg})`,
    tunSucc(tun), JSON.stringify({ rest: tun.rest, t2: tun.rest2 && tun.rest2.time }));
  // ---- PARKED - SUPERSEDED by Nick's terminal (r9): the words stand on the room's ground INSIDE the tunnel's frames, so nothing is cut out of it
  // (r7's hole served a sheet of paper). Kept VERBATIM and no longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  const clearOk = (t) => !!t && !!t.clear && t.clear.off <= 1 && t.clear.page.w > 0 && /exclude|xor/.test(t.clear.comp) && t.clear.masks === 2;
  // ok(`TUN-CLEAR nothing of the tunnel stands behind her words: the page's rect is cut out of it (hole vs page, worst ${tun.rest && tun.rest.clear && tun.rest.clear.off} px; mask ${tun.rest && tun.rest.clear && tun.rest.clear.comp}), at rest and while she types`,
  //   clearOk(tun.rest) && clearOk(tun.mid), JSON.stringify({ rest: tun.rest && tun.rest.clear, mid: tun.mid && tun.mid.clear }));
  // ---- PARKED - SUPERSEDED by its own first run (Actions 42410571466, Nov 7): the zoomed page is TALLER than the stage that clips it (1396 px in
  // a 1080 window), so no box inside the stage can cover the page's whole rect; the tunnel's mask was none on every read. Kept VERBATIM and no
  // longer run; its parked record is in the HARNESS_PARKED block, and its successor follows.
  const behindOk = (t) => !!t && t.mask === 'none' && t.covers && !clearOk(t);
  // ok(`TUN-BEHIND [successor of TUN-CLEAR] the words stand inside the tunnel: nothing cut out of it (mask ${tun.rest && tun.rest.mask}), its box covering the page's, at rest and while she types`,
  //   behindOk(tun.rest) && behindOk(tun.mid), JSON.stringify({ rest: tun.rest && [tun.rest.mask, tun.rest.covers, tun.rest.clear], mid: tun.mid && [tun.mid.mask, tun.mid.covers] }));
  const behindSeen = (t) => !!t && t.mask === 'none' && t.coversSeen && !clearOk(t);
  ok(`TUN-BEHIND [successor] the words stand inside the tunnel: nothing cut out of it (mask ${tun.rest && tun.rest.mask}), its box covering the page's seen part (the stage clips the zoomed page), at rest and while she types`,
    behindSeen(tun.rest) && behindSeen(tun.mid), JSON.stringify({ rest: tun.rest && [tun.rest.mask, tun.rest.coversSeen, tun.rest.clear], mid: tun.mid && [tun.mid.mask, tun.mid.coversSeen] }));
  if (process.env.HARNESS_PARKED === '1') {
    pok('PARKED (was "TUN ... the page\'s paper opaque and above it") - SUPERSEDED by Nick\'s terminal (Nov 7, spec draft 13 §6, r9: no paper while jacked in). Opposite reasserted: the paper is clear, not opaque, and the rest of TUN holds; live successor TUN [successor]',
      tunSucc(tun) && !opaque(tun.rest.pageBg), JSON.stringify({ pageBg: tun.rest && tun.rest.pageBg }));
    // (its re-assertion re-pointed to TUN-BEHIND [successor] in the same unmerged round: the first one leaned on the covers premise parked below)
    pok('PARKED (was "TUN-CLEAR nothing of the tunnel stands behind her words: the page\'s rect is cut out of it") - SUPERSEDED by Nick\'s terminal (r9: the words stand inside the tunnel). Opposite reasserted: no hole is cut (no mask, the hole check fails), at rest and while she types; live successor TUN-BEHIND [successor]',
      behindSeen(tun.rest) && behindSeen(tun.mid) && !clearOk(tun.rest) && !clearOk(tun.mid), JSON.stringify({ rest: tun.rest && tun.rest.clear, mid: tun.mid && tun.mid.clear }));
    pok('PARKED (was "TUN-BEHIND ... its box covering the page\'s") - SUPERSEDED by its own first run (Actions 42410571466: the zoomed page is taller than the stage that clips it). Opposite reasserted: the page\'s whole rect is NOT inside the tunnel\'s box, and its seen part is; live successor TUN-BEHIND [successor]',
      !!tun.rest && !tun.rest.covers && tun.rest.coversSeen && behindSeen(tun.rest), JSON.stringify({ covers: tun.rest && tun.rest.covers, seen: tun.rest && tun.rest.coversSeen }));
  }
  ok(`TUN-TYPE the named recede exception: while keys land (the chrome receded: data-wz-writing ${tun.mid && tun.mid.writing}) the tunnel stays (opacity ${tun.mid && tun.mid.op}) and runs (${tun.mid && tun.mid.running}/${tun.mid && tun.mid.anims})`,
    typeOk(tun), JSON.stringify(tun.mid));
  ok(`TUN-RATE her speed is the tunnel's: re-set at most every 2 s (sets at ${JSON.stringify(tr.sets)}), up to ${tr.top} while she types fast, the streaks at speed, back to rest after (${JSON.stringify(tr.rest)}); its only DOM change is the streaks' flag, at most every 2 s (${tr.mutKinds})`,
    tr.gaps && tr.top !== null && tr.top >= 2 && tr.fast && !!tr.rest && tr.rest.every((r) => r <= 1.1) && tr.mutKinds.every((k) => k === 'data-fast') && tr.mutGaps, JSON.stringify(tr));
  const testTunnelStill = async () => { await open({ reduced: true }); const r = await ev('window.__f4.tunnel()'); await open({ dial: 0 }); const d = await ev('window.__f4.tunnel()'); return { r, d }; };
  const ts0 = await testTunnelStill();
  ok('TUN-STILL reduced motion and Ambiance 0: the frames stand still (no animation at all), the streaks gone', !!ts0.r && ts0.r.still && ts0.r.anims === 0 && ts0.r.frames === 12 && !!ts0.d && ts0.d.still && ts0.d.anims === 0,
    JSON.stringify({ r: ts0.r && [ts0.r.still, ts0.r.anims], d: ts0.d && [ts0.d.still, ts0.d.anims] }));
  const testTunnelWhere = async () => {
    await open(); const on = !!(await ev('window.__f4.tunnel()')); await pressToggle(); await sleep(900); const out = !!(await ev('window.__f4.tunnel()'));
    await open({ flag: false, prefs: { typewriter: true } }); const ctl = !!(await ev('window.__f4.tunnel()'));
    await open({ theme: 'plateau', prefs: { typewriter: true } }); const other = !!(await ev('window.__f4.tunnel()'));
    return { on, out, ctl, other };
  };
  const tw = await testTunnelWhere();
  ok('TUN-WHERE only while jacked in: gone on jacking out, absent off the flag and in another theme\'s Typewriter', tw.on && !tw.out && !tw.ctl && !tw.other, JSON.stringify(tw));

  // ---- L: the Jacked In arm --------------------------------------------------------------------------------------------------------------------------
  // K (information, the tunnel's share; Nick kept the tunnel Nov 7): Jacked In with the tunnel never mounted (the landed `notunnel` mutant), run
  // after each round's C/J pair so C and J keep the order they had before the tunnel
  const lat = { C: [], J: [], K: [] };
  let cursor = 0;
  let kLanded = null;
  for (let round = 0; round <= ROUNDS; round += 1) {
    for (const arm of [...(round % 2 ? ['J', 'C'] : ['C', 'J']), 'K']) {
      const pid = `f3s4-lat-${arm}-${round}`;
      // the arm's own fresh page, through the seam (it enters the cache and flushes before it returns, so seeding from any surface is safe)
      await mk({ id: pid, text: LAT_TEXT, createdAt: new Date().toISOString(), origin: 'loose', source: 'page' });
      await sleep(300);
      if (arm === 'K') { mutant = 'notunnel'; landed.notunnel = undefined; }
      try { await open({ flag: arm !== 'C', id: pid, prefs: arm === 'C' ? { typewriter: true } : {} }); } finally { if (arm === 'K') { kLanded = landed.notunnel; mutant = null; } }
      const stood = { ...(await st()), tunnel: !!(await ev('window.__f4.tunnel()')) };
      await ev(`(() => { window.__lat = []; let t0 = 0; if (window.__latOff) window.__latOff();
        const kd = () => { t0 = performance.now(); };
        const bi = () => { const t = t0; requestAnimationFrame(() => requestAnimationFrame(() => { const now = performance.now(); window.__lat.push({ ms: now - t, key: t, at: now }); })); };
        document.addEventListener('keydown', kd, true); document.addEventListener('beforeinput', bi, true);
        window.__latOff = () => { document.removeEventListener('keydown', kd, true); document.removeEventListener('beforeinput', bi, true); }; return true; })()`);
      for (let i = 0; i < KEYS; i += 1) { await app.typeKeys(CYCLE[cursor % CYCLE.length]); cursor += 1; await sleep(GAP); }
      await sleep(250);
      const got = await ev(`(() => { const l = window.__lat.slice(), fr = window.__f4.frames; const a = l.length ? Math.min(...l.map((x) => x.key)) : 0, b = l.length ? Math.max(...l.map((x) => x.at)) : 0;
        return { lat: l.map((x) => x.ms), drawFrames: fr.filter((f) => f[0] >= a && f[0] <= b && f[1] > 0).length }; })()`);
      if (round > 0) lat[arm].push({ ...got, stood: { flag: stood.flag, zoom: stood.zoom, jacked: stood.jacked, theme: stood.theme, tunnel: stood.tunnel } });
    }
  }
  const cMeds = lat.C.map((r) => stat(r.lat).median), cP95s = lat.C.map((r) => stat(r.lat).p95);
  const spreadMed = Math.max(...cMeds) - Math.min(...cMeds), spreadP95 = Math.max(...cP95s) - Math.min(...cP95s);
  const C = stat(lat.C.flatMap((r) => r.lat)), J = stat(lat.J.flatMap((r) => r.lat));
  const enough = lat.C.every((r) => r.lat.length >= MIN_KEYS) && lat.J.every((r) => r.lat.length >= MIN_KEYS);
  const stoodRight = lat.J.every((r) => r.stood.flag && r.stood.jacked && r.stood.zoom === 'true') && lat.C.every((r) => !r.stood.flag && r.stood.zoom === 'true' && r.stood.theme === 'flux');
  const latOk = enough && stoodRight && J.median <= C.median + spreadMed && J.p95 <= C.p95 + spreadP95 && J.max <= MAX_MS;
  const drawsOk = lat.J.reduce((a, r) => a + r.drawFrames, 0) <= lat.C.reduce((a, r) => a + r.drawFrames, 0) + lat.J.length;
  const latLine = `J median ${r1(J.median)} <= C ${r1(C.median)} + ${r1(spreadMed)}, J p95 ${r1(J.p95)} <= C ${r1(C.p95)} + ${r1(spreadP95)}, J max ${r1(J.max)} <= ${MAX_MS}`;
  if (ON_BOX) ok(`L the Jacked In arm adds no latency beyond the control's own spread: ${latLine}`, latOk, JSON.stringify({ C, J, cMeds, cP95s, stoodRight, enough }));
  else console.log(`INFO L (Actions: timing is the box's to judge) ${latOk ? 'within' : 'OUTSIDE'} the control's spread: ${latLine}`);
  const K = lat.K.length ? stat(lat.K.flatMap((r) => r.lat)) : null;
  const kStood = kLanded === 1 && lat.K.every((r) => r.stood.flag && r.stood.jacked && !r.stood.tunnel) && lat.J.every((r) => r.stood.tunnel);
  console.log(`INFO SPLIT (the tunnel's share; information, never a verdict): C median ${r1(C.median)} p95 ${r1(C.p95)} / K (Jacked In, no tunnel) ${K ? `median ${r1(K.median)} p95 ${r1(K.p95)}` : 'none'} / J (with the tunnel) median ${r1(J.median)} p95 ${r1(J.p95)}; K stood right (landed, jacked, no tunnel; J with it): ${kStood}`);
  ok(`L-DRAW no canvas drew more while keys landed in Jacked In than in the control (J ${lat.J.map((r) => r.drawFrames).join('/')} vs C ${lat.C.map((r) => r.drawFrames).join('/')})`, drawsOk && stoodRight && enough,
    JSON.stringify({ stoodRight, enough, n: [lat.C.map((r) => r.lat.length), lat.J.map((r) => r.lat.length)] }));

  // ---- the mutants, each landed in the served bundle ----------------------------------------------------------------------------------------------
  const withMutant = async (name, run) => { mutant = name; landed[name] = undefined; try { const r = await run(); return { r, landed: landed[name] }; } finally { mutant = null; } };
  const mK = await withMutant('perkey', testCompile);
  ok('MUT-PERKEY (landed) the compile not waiting for the pause: COMPILE-ZERO fails (the layer changed while keys landed)', mK.landed === 1 && mK.r.mutDuring > 0, JSON.stringify({ landed: mK.landed, mut: mK.r.mutDuring }));
  const mL = await withMutant('lines', testCompile);
  ok('MUT-LINES (landed) the compile one line up: COMPILE fails (a word on the line above covered)', mL.landed === 1 && mL.r.lineAboveCovered > 0, JSON.stringify({ landed: mL.landed, covered: mL.r.lineAboveCovered }));
  const mD = await withMutant('default', async () => { await open(); return st(); });
  ok('MUT-DEFAULT (landed) the default not laid: DEF fails (Free Write opens un-jacked)', mD.landed === 1 && mD.r.zoom !== 'true' && !mD.r.jacked, JSON.stringify({ landed: mD.landed, zoom: mD.r.zoom }));
  const mC = await withMutant('clear', testToggle);
  ok('MUT-CLEAR (landed) the toggle not clearing the default: TOGGLE fails (it cannot jack out)', mC.landed === 1 && mC.r.out.zoom === 'true', JSON.stringify({ landed: mC.landed, out: mC.r.out.zoom }));
  const mI = await withMutant('idle', testIdle);
  ok('MUT-IDLE (landed) the idle glitch running while jacked: IDLE fails', mI.landed === 1 && mI.r.jackedIn.idleLayer, JSON.stringify({ landed: mI.landed, layer: mI.r.jackedIn.idleLayer }));
  const mE = await withMutant('edge', testEdge);
  ok('MUT-EDGE (landed) the edge filling instead of draining: EDGE fails', mE.landed === 1 && mE.r.a.burst && Math.abs(mE.r.a.burst.left - 0.004) > 0.5, JSON.stringify({ landed: mE.landed, left: mE.r.a.burst && mE.r.a.burst.left }));
  const mS = await withMutant('still', () => testDecompile({ reduced: true }));
  ok('MUT-STILL (landed) the still state ignored: STILL fails (a decompile ran under reduced motion)', mS.landed === 1 && !stillOk(mS.r), JSON.stringify({ landed: mS.landed, r: mS.r }));
  const mLu = await withMutant('lookup', () => testControls(true));
  ok('MUT-LOOKUP (landed) Esc not resolving the signal: ESC-READ fails (the lines stay compiled after Esc)', mLu.landed === 1 && !!mLu.r.later && mLu.r.later.compiled > 0 && !escRead(mLu.r),
    JSON.stringify({ landed: mLu.landed, later: mLu.r.later && mLu.r.later.compiled }));
  const mRc = await withMutant('recede', testTunnel);
  ok('MUT-RECEDE (landed) the recede switch flipped, alone: the tunnel recedes while she types (TUN-TYPE fails) and is there at rest', mRc.landed === 1 && !!mRc.r.rest && mRc.r.rest.recede && !mRc.r.rest.hold && !typeOk(mRc.r) && !!mRc.r.mid && mRc.r.mid.running === mRc.r.mid.anims,
    JSON.stringify({ landed: mRc.landed, mid: mRc.r.mid && { op: mRc.r.mid.op, running: mRc.r.mid.running, anims: mRc.r.mid.anims } }));
  const mHd = await withMutant('hold', testTunnel);
  ok('MUT-HOLD (landed) the hold switch flipped, alone: the tunnel holds still while she types (TUN-TYPE fails), visible, and runs at rest', mHd.landed === 1 && !!mHd.r.rest && mHd.r.rest.hold && !mHd.r.rest.recede && !typeOk(mHd.r) && !!mHd.r.mid && mHd.r.mid.op >= 0.99 && mHd.r.rest.running === mHd.r.rest.anims,
    JSON.stringify({ landed: mHd.landed, mid: mHd.r.mid && { op: mHd.r.mid.op, running: mHd.r.mid.running, anims: mHd.r.mid.anims } }));
  // ---- PARKED - SUPERSEDED by Nick's terminal (r9): there is no hole to remove (its successor TUN-BEHIND holds there is none). Kept VERBATIM and
  // no longer run; its parked record is in the HARNESS_PARKED block.
  // const mNh = await withMutant('nohole', testTunnel);
  // ok('MUT-NOHOLE (landed) the page\'s rect never cut out of the tunnel: TUN-CLEAR fails', mNh.landed === 1 && !!mNh.r.rest && !clearOk(mNh.r.rest), JSON.stringify({ landed: mNh.landed, clear: mNh.r.rest && mNh.r.rest.clear }));
  if (process.env.HARNESS_PARKED === '1') {
    const mNh = await withMutant('nohole', testTunnel);
    // (its re-assertion re-pointed to TUN-BEHIND [successor]'s measure in the same unmerged round, as TUN-CLEAR's above)
    pok('PARKED (was "MUT-NOHOLE (landed) the page\'s rect never cut out of the tunnel: TUN-CLEAR fails") - SUPERSEDED by Nick\'s terminal (r9). Opposite reasserted: the hole\'s code is gone from the bundle (its anchor lands 0 times) and the tunnel is uncut',
      mNh.landed === 0 && behindSeen(mNh.r.rest), JSON.stringify({ landed: mNh.landed, rest: mNh.r.rest && [mNh.r.rest.mask, mNh.r.rest.coversSeen] }));
  }
  ok('MUT-LOOKUP-TERM (the same landed mutant) Esc not looking up: ESC-TERM fails (the veil stays on)', mLu.landed === 1 && !escTerm(mLu.r), JSON.stringify({ later: mLu.r.later && [mLu.r.later.looking, mLu.r.later.edMask] }));
  const mRs = await withMutant('reset', testTunnel);
  ok('MUT-RESET (landed) the speed re-set every 100 ms: TUN-RATE fails (sets closer than 2 s)', mRs.landed === 1 && !rateOf(mRs.r).gaps, JSON.stringify({ landed: mRs.landed, sets: rateOf(mRs.r).sets.slice(0, 6) }));
  const mW = await withMutant('block', testCompile);
  const mWw = wholeOf(mW.r.whole);
  ok('MUT-BLOCK (landed) a block wider than its slot: COMPILE-WHOLE fails (blocks stand outside their slots)', mW.landed === 1 && mWw.n > 0 && mWw.bad.length > 0, JSON.stringify({ landed: mW.landed, n: mWw.n, bad: mWw.bad.length }));
  // ---- PARKED with CARET-LIGHT (Nick's ruling, Nov 7): opened jacked in, its read is now the brass caret, which fails CARET-LIGHT with or without
  // the mutant (a guard passing blind). Kept VERBATIM and no longer run; its successor runs the same landed mutant on the plain light page.
  // const mCa = await withMutant('caret', () => caretOf({ tone: 'light' }));
  // ok('MUT-CARET (landed, in boot-*.css) the light page\'s caret back to the shared orange: CARET-LIGHT fails', mCa.landed === 1 && !!mCa.r && !caretLightOk(mCa.r), JSON.stringify({ landed: mCa.landed, r: mCa.r }));
  const mCa = await withMutant('caret', () => caretOf({ tone: 'light', id: DRAFTP, pageTw: 'off', atRow: 1 }));
  ok('MUT-CARET [successor] (landed, in boot-*.css) the plain light caret back to the shared orange: CARET-PLAIN-LIGHT fails', mCa.landed === 1 && !!mCa.r && !caretLightOk(mCa.r), JSON.stringify({ landed: mCa.landed, r: mCa.r }));
  // MUT-OUTLINE (Nick's ruling): the jacked light caret without its outline: CARET-JACKED-LIGHT fails
  const mOl = await withMutant('outline', async () => { const k = await caretOf({ tone: 'light', id: CARETP }); return { k, st0: await st() }; });
  ok(`MUT-OUTLINE (landed, in boot-*.css) the jacked light caret without its ink outline: CARET-JACKED-LIGHT fails (outline ${mOl.r.k && mOl.r.k.outline && mOl.r.k.outline.style})`,
    mOl.landed === 1 && !caretBrassOk(mOl.r.k, mOl.r.st0), JSON.stringify({ landed: mOl.landed, k: mOl.r.k }));
  const mCe = await withMutant('caretend', () => testCaretEnd(true));
  // ---- PARKED - SUPERSEDED by its own first run (Actions 42431319040): the burst scenario does not reproduce the flagged frame (the caret stood
  // at the text's end with the fix off too), so this guard was blind. Kept VERBATIM and no longer run; its successor adds the frame's own scenario.
  // ok(`MUT-CARETEND (landed) the caret's text-end place off: CARET-END fails (caret x ${mCe.r && mCe.r.block && mCe.r.block.x}, end ${mCe.r && mCe.r.end && mCe.r.end.right}; anchor ${JSON.stringify(mCe.r && mCe.r.anchor)})`,
  //   mCe.landed === 1 && !atEnd(mCe.r), JSON.stringify({ landed: mCe.landed, r: mCe.r }));
  const mCeB = await withMutant('caretend', () => testCaretEnd(true, 'compiled'));
  ok(`MUT-CARETEND [successor] (landed) an inline span taken for the caret's row again: CARET-END or CARET-END-COMPILED fails (burst ${mCe.r && mCe.r.block && mCe.r.block.x} vs ${mCe.r && mCe.r.end && mCe.r.end.right}; compiled ${mCeB.r && mCeB.r.block && mCeB.r.block.x} vs ${mCeB.r && mCeB.r.end && mCeB.r.end.right})`,
    mCe.landed === 1 && mCeB.landed === 1 && (!atEnd(mCe.r) || !atEnd(mCeB.r)), JSON.stringify({ burst: mCe.r, compiled: mCeB.r }));
  const mSp = await withMutant('scrollpause', () => testRowsStay('dark'));
  ok(`MUT-SCROLL (landed) the page's own scrolling postponing her pause again: OPEN-ROWS fails (rows at rest ${mSp.r.rest.n}; compile log ${JSON.stringify(mSp.r.clog)})`, mSp.landed === 1 && mSp.r.rest.n < 8, JSON.stringify({ landed: mSp.landed, r: mSp.r }));
  // INFO: the control's rest after opening (flag off, the Typewriter on): does today's Typewriter scroll the same way? (its glides, not S4's)
  await open({ flag: false, prefs: { typewriter: true } });
  await ev('(() => { window.__f4.evc = {}; return true; })()'); await sleep(1000);
  console.log(`INFO OPEN-SCROLL-CONTROL (flag off, the Typewriter on) events in one second of rest after opening: ${JSON.stringify(await ev('window.__f4.evc'))}`);
  // MUT-OPENROWS: the caret's boundary counted in ELEMENTS again (r9's caretBox): OPEN-ROWS fails
  const mOr = await withMutant('openrow', () => testRowsStay('dark'));
  // ---- PARKED - SUPERSEDED by its own first valid run (Actions 42435766295): with the elements count back, the open still drew its rows (the
  // first compile found no caret, the next ones drew): the cause was the scroll (MUT-SCROLL). The child-node count stays, as the right reading of
  // an offset at an element boundary. Kept VERBATIM and no longer run; its parked record follows.
  // ok(`MUT-OPENROWS (landed) the caret's boundary counted in elements again: OPEN-ROWS fails (rows at rest ${mOr.r.rest.n}; compile log ${JSON.stringify(mOr.r.clog)})`, mOr.landed === 1 && mOr.r.rest.n < 8, JSON.stringify({ landed: mOr.landed, r: mOr.r }));
  if (process.env.HARNESS_PARKED === '1') {
    pok(`PARKED (was "MUT-OPENROWS (landed) the caret's boundary counted in elements again: OPEN-ROWS fails") - SUPERSEDED by its own first valid run (Actions 42435766295). Opposite reasserted: with the elements count back, the open still draws its rows (${mOr.r.rest.n}); the open's cause is MUT-SCROLL's`,
      mOr.landed === 1 && mOr.r.rest.n >= 8, JSON.stringify({ landed: mOr.landed, clog: mOr.r.clog }));
  }
  const mRt = await withMutant('retry', () => testRowsStay('dark'));
  // ---- PARKED - SUPERSEDED by its own first run (Actions 42431319040): no compile at open was refused (no f3-compile grant or refusal at all:
  // the compile stopped before the budget), so this guard was blind; the cause is MUT-OPENROWS'. Kept VERBATIM and no longer run.
  // ok(`MUT-RETRY (landed) a refused compile never tried again: OPEN-ROWS fails (rows at rest ${mRt.r.rest.n}; grants ${JSON.stringify(mRt.r.flashes0)})`, mRt.landed === 1 && mRt.r.rest.n < 8, JSON.stringify({ landed: mRt.landed, r: mRt.r }));
  if (process.env.HARNESS_PARKED === '1') {
    // (re-pointed in the same unmerged round: 42433836311's burst DID reproduce it with the fix off, so the burst alone is a sometime witness;
    // the claim that holds: across the burst and the frame's own scenario, the fix off is caught)
    pok('PARKED (was "MUT-CARETEND (landed) the caret\'s text-end place off: CARET-END fails") - SUPERSEDED by its own first run (Actions 42431319040: the burst alone did not reproduce the flagged frame; on 42433836311 it did). Opposite reasserted: the burst is a sometime witness, and with the frame\'s own scenario beside it the fix off is always caught; live successor MUT-CARETEND [successor]',
      mCe.landed === 1 && mCeB.landed === 1 && (!atEnd(mCe.r) || !atEnd(mCeB.r)), JSON.stringify({ burst: mCe.r, compiled: mCeB.r }));
    pok('PARKED (was "MUT-RETRY (landed) a refused compile never tried again: OPEN-ROWS fails") - SUPERSEDED by its own first run (Actions 42431319040: no compile was refused at open). Opposite reasserted: with the retry stripped, the open\'s compile is never refused (the compile log has no "refused"), so the retry is not what draws the open\'s rows; live successor MUT-OPENROWS',
      mRt.landed === 1 && !(mRt.r.clog || []).includes('refused'), JSON.stringify({ clog: mRt.r.clog, rows: mRt.r.rest.n }));
  }
  if (process.env.HARNESS_PARKED === '1') {
    pok('PARKED (was "MUT-CARET (landed) the light page\'s caret back to the shared orange: CARET-LIGHT fails") - SUPERSEDED with CARET-LIGHT (Nick\'s ruling, Nov 7). Opposite reasserted: on the jacked page the read fails CARET-LIGHT without any mutant (brass), so the old guard was blind there; live successor MUT-CARET [successor]',
      !caretLightOk(kLight) && mCa.landed === 1 && !caretLightOk(mCa.r), JSON.stringify({ unmutated: kLight && kLight.ratio }));
  }
  // THE TERMINAL's mutants (r9), each on the light tone (its floor is the tighter one)
  const mTv = await withMutant('terminal', () => testTerminal('light'));
  // ---- PARKED with TERM-LINES (Actions 42420374454: its read raced the pause). Kept VERBATIM and no longer run; successors follow.
  // ok(`MUT-TERMINAL (landed, in boot-*.css) the veil never laid: TERM-LINES fails (the line two up reads ${mTv.r.hid && mTv.r.hid.ratio}:1)`, mTv.landed === 1 && !termLinesOk(mTv.r) && !!mTv.r.hid && mTv.r.hid.ratio >= 2.5,
  //   JSON.stringify({ landed: mTv.landed, hid: mTv.r.hid, hidSignal: mTv.r.hidSignal }));
  const mTs = mTv.r.settled || {};
  ok(`MUT-TERMINAL [successor] (landed, in boot-*.css) the veil never laid: TERM-LINES [successor] fails (under the signal, two up reads ${mTs.under2 && mTs.under2.ratio}:1)`,
    mTv.landed === 1 && !termLinesSucc(mTv.r) && !!mTs.under2 && mTs.under2.ratio >= 2.5, JSON.stringify({ landed: mTv.landed, settled: mTs }));
  const mDm = await withMutant('dim', () => testTerminal('light'));
  // ok(`MUT-DIM (landed, in boot-*.css) the dim line at .3: TERM-LINES fails (the dim line ${mDm.r.dim && mDm.r.dim.ratio}:1)`, mDm.landed === 1 && !termLinesOk(mDm.r) && !!mDm.r.dim && mDm.r.dim.ratio < 4.5,
  //   JSON.stringify({ landed: mDm.landed, dim: mDm.r.dim }));
  const mDs = mDm.r.settled || {};
  ok(`MUT-DIM [successor] (landed, in boot-*.css) the dim line at .3: TERM-LINES [successor] fails (the dim line ${mDs.dim && mDs.dim.ratio}:1)`,
    mDm.landed === 1 && !termLinesSucc(mDm.r) && !!mDs.dim && mDs.dim.ratio < 4.5, JSON.stringify({ landed: mDm.landed, dim: mDs.dim }));
  if (process.env.HARNESS_PARKED === '1') {
    pok('PARKED (was "MUT-TERMINAL (landed) the veil never laid: TERM-LINES fails") - SUPERSEDED with TERM-LINES (Actions 42420374454). Opposite reasserted: the same landed mutant fails the successor read; live successor MUT-TERMINAL [successor]',
      mTv.landed === 1 && !termLinesSucc(mTv.r), JSON.stringify({ settled: mTs }));
    pok('PARKED (was "MUT-DIM (landed) the dim line at .3: TERM-LINES fails") - SUPERSEDED with TERM-LINES (Actions 42420374454). Opposite reasserted: the same landed mutant fails the successor read; live successor MUT-DIM [successor]',
      mDm.landed === 1 && !termLinesSucc(mDm.r), JSON.stringify({ dim: mDs.dim }));
  }
  const mRo = await withMutant('rows', () => testTerminal('light'));
  ok('MUT-ROWS (landed) the rows not shrinking: TERM-ROWS fails', mRo.landed === 1 && !termRowsOk(mRo.r), JSON.stringify({ landed: mRo.landed, rows: mRo.r.rows }));
  ok('MUT-ROWS [successor] (the same landed mutant) the rows not shrinking: TERM-ROWS [successor] fails', mRo.landed === 1 && !termRowsSucc(mRo.r), JSON.stringify({ rows: mRo.r.rows && mRo.r.rows.slice(0, 4) }));
  ok('MUT-ROWS [successor 2] (the same landed mutant) the rows not shrinking: TERM-ROWS [successor 2] fails', mRo.landed === 1 && !termRowsSucc2(mRo.r), JSON.stringify({ rows: mRo.r.rows && mRo.r.rows.slice(0, 4) }));

  // ---- B: the build -----------------------------------------------------------------------------------------------------------------------------
  await open();
  const served = (await st()).served;
  ok(`B the build: served ${served} = dist-web's ${BUILD.bundle}, built ${BUILD.builtAt} after the last src commit ${BUILD.srcCommitAt} (tree ${BUILD.head}, ${BUILD.dirtySrc} uncommitted src file(s))`,
    !!BUILD.bundle && served === BUILD.bundle && BUILD.stale === false, JSON.stringify(BUILD));
}); } catch (err) { ok('the run reached its end', false, String((err && err.stack) || err).split('\n').slice(0, 3).join(' | ')); }

if (process.env.HARNESS_PARKED === '1') {
  for (const c of parkedChecks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
  console.log(parkedChecks.every((c) => c.pass) && parkedChecks.length === PARKED_EXPECTED
    ? `\nFLUX3-S4 PARKED: PASS (${parkedChecks.length} checks) - HARNESS_PARKED=1 armed, every retired check's successor green`
    : `\nFLUX3-S4 PARKED: FAIL - ${parkedChecks.filter((c) => !c.pass).length}/${parkedChecks.length} failed (expected ${PARKED_EXPECTED} parked)`);
}
const failed = checks.filter((c) => !c.pass).concat(parkedChecks.filter((c) => !c.pass))
  .concat(process.env.HARNESS_PARKED === '1' && parkedChecks.length !== PARKED_EXPECTED ? [{ name: 'parked count' }] : []);
for (const c of checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.pass ? '' : '  -- ' + c.detail}`);
console.log(failed.length ? `\nFLUX3-S4 VERIFY: FAIL - ${failed.length}/${checks.length} failed` : `\nFLUX3-S4 VERIFY: PASS (${checks.length} checks)`);
process.exit(failed.length ? 1 : 0);
