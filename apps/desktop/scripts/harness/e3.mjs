// E3 — THE COUNSEL FADES OUT (docs/open-threads.md's own E3 entry). A committed
// CDP verification scenario, per AGENTS.md's "Harness scenarios persist".
// Run: node scripts/harness/e3.mjs   (from apps/desktop, dist-web freshly built)
//
// THE FINDING, Nick 2026-08-31: the Tutor pop-out does NOT fade out on close;
// the Tools menu does. Ruling: fade in AND fade out on BOTH pop-outs.
//
// WHAT S0 MEASURED, and why the obvious reading was wrong. The Tutor panel's
// fade was never missing: `.wz-tutor-panel` has carried
// `opacity var(--fade-dur,.2s) ease, transform var(--fade-dur,.2s) ease` since
// FX10 S1 copied it off `.wz-sliver-panel` after reading that rule LIVE. The
// panel faded correctly the whole time — it was fading an EMPTY BOX, because
// Tutor.tsx wrapped its body in `{open && …}` and the content unmounted
// synchronously on close. Pre-fix sample, first frame after the close click:
// `{t:1, opacity:"1.00", content:false}` — content already gone, fade not yet
// begun. So the repair is a MOUNT change, not a timing change: no duration is
// copied anywhere in this ticket, and no transition was added.
//
// THE MIRROR IS THE POINT. S3 below asserts the two panels' transitions are
// character-for-character identical, so a future edit that "tunes" one hand
// without the other fails HERE rather than in a founder's walkthrough.
import { withHarness } from '../runtime-verify.mjs';

const checks = [];
const ok = (name, pass, detail = '') => checks.push({ name, pass, detail });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Sample a panel's opacity and whether its CONTENT is still mounted, every
// frame across a window — the only way to catch "the content left before the
// fade did", which a single after-the-fact read cannot see.
const SAMPLER = `
window.__sample = function(panelSel, contentSel, ms) {
  return new Promise(resolve => {
    const out = [];
    const t0 = performance.now();
    const tick = () => {
      const p = document.querySelector(panelSel);
      const c = document.querySelector(contentSel);
      out.push({
        t: Math.round(performance.now() - t0),
        opacity: p ? Number(getComputedStyle(p).opacity) : null,
        content: !!c,
      });
      if (performance.now() - t0 < ms) requestAnimationFrame(tick);
      else resolve(out);
    };
    requestAnimationFrame(tick);
  });
};
`;

const freshPage = async (app) => {
  await app.emulateDpr(1, 1400, 900);
  await app.goto('/');
  await app.evalJs("localStorage.clear(); localStorage.setItem('wrizo-first-run-complete', '1')");
  await app.reload();
  await app.waitFor("!!document.querySelector('.wz-arrival')", { label: 'Desk' });
  await app.evalJs(`(() => {
    const now = new Date().toISOString();
    window.wrizoCreateJournalPage({ id: 'e3-page', text: 'Some words already here.', pageType: 'page', createdAt: now, origin: null });
  })()`);
  await app.reload();
  await app.evalJs("location.hash = '#/page/e3-page'");
  await app.waitFor("!!document.querySelector('.desk-frame')", { label: 'page framed' });
  await sleep(700);
  await app.evalJs(SAMPLER);
};

await withHarness(async (app) => {
  await freshPage(app);

  // ==========================================================================
  // S1 — the close. The content must still be there WHILE the panel fades.
  // ==========================================================================
  const gripThere = await app.evalJs("!!document.querySelector('.wz-tutor-grip')");
  ok('S1 (setup): the Counsel grip is reachable on a born page', gripThere);

  if (gripThere) {
    await app.evalJs("document.querySelector('.wz-tutor-grip').click()");
    await sleep(700);
  }
  ok('S1 (setup): the panel is open and its body is mounted',
    await app.evalJs("!!document.querySelector('.wz-tutor-body') && document.querySelector('.wz-tutor-panel').dataset.open === 'true'"));

  const closing = gripThere ? await app.evalJs(`(() => {
    const p = window.__sample('.wz-tutor-panel', '.wz-tutor-body', 320);
    document.querySelector('.wz-tutor-grip').click();
    return p;
  })()`) : [];

  // The defining property of a real fade-out: at least one sampled frame in
  // which the panel is PARTLY faded and the content is STILL THERE. Pre-fix
  // this set was empty — the content was gone by the first frame.
  const midFadeWithContent = closing.filter(s => s.opacity > 0.05 && s.opacity < 0.95 && s.content);
  ok('S1: the Counsel FADES OUT WITH ITS CONTENTS — there are frames where the panel is part-faded and its body is still mounted (pre-fix the body was gone by frame one, so the fade ran on an empty box)',
    midFadeWithContent.length >= 2, JSON.stringify({ midFadeFrames: midFadeWithContent.length, first: closing[0], sample: midFadeWithContent.slice(0, 3) }));

  ok('S1: the body never blinks out ahead of the fade — no sampled frame loses the content while the panel is still substantially opaque',
    !closing.some(s => !s.content && s.opacity > 0.5),
    JSON.stringify(closing.filter(s => !s.content && s.opacity > 0.5).slice(0, 3)));

  const faded = closing.find(s => s.opacity <= 0.02);
  ok('S1: and the fade actually completes — the panel reaches transparent within the sampling window',
    !!faded, JSON.stringify({ fullyFadedAt: faded ? faded.t : 'never' }));

  // ==========================================================================
  // S2 — the open. "Fade IN and fade OUT", so prove the other direction too.
  // ==========================================================================
  await sleep(400);
  const opening = await app.evalJs(`(() => {
    const p = window.__sample('.wz-tutor-panel', '.wz-tutor-body', 320);
    document.querySelector('.wz-tutor-grip').click();
    return p;
  })()`);
  const midOpen = opening.filter(s => s.opacity > 0.05 && s.opacity < 0.95);
  ok('S2: the Counsel FADES IN as well — the open is a transition, not a snap (the ruling is fade in AND out)',
    midOpen.length >= 2, JSON.stringify({ midFadeFrames: midOpen.length, sample: midOpen.slice(0, 3) }));

  // ==========================================================================
  // S3 — THE MIRROR, asserted character-for-character. Nick's ruling is that
  // the Counsel mirrors the Desk; this is the check that keeps it true when
  // someone later "tunes" one hand.
  // ==========================================================================
  const mirror = await app.evalJs(`(() => {
    const t = document.querySelector('.wz-tutor-panel');
    const s = document.querySelector('.wz-sliver-panel');
    if (!t || !s) return { missing: true, tutor: !!t, sliver: !!s };
    const ct = getComputedStyle(t), cs = getComputedStyle(s);
    return {
      missing: false,
      tutorDur: ct.transitionDuration, sliverDur: cs.transitionDuration,
      tutorProp: ct.transitionProperty, sliverProp: cs.transitionProperty,
      tutorFn: ct.transitionTimingFunction, sliverFn: cs.transitionTimingFunction,
    };
  })()`);
  // ---- PARKED - SUPERSEDED by the drawer ghost fix (a CLOSED panel's transition list now also carries `visibility`, delayed until its fade ends; the two panels' whole lists therefore differ by design while one is closed), 2026-10-12 ----
  // Kept VERBATIM and no longer run. The successor (Fable's wording) follows.
  //
  // ok('S3: BOTH HANDS, ONE FADE — the Counsel and the tool pop-out resolve to the same transition DURATION (never a copied literal: both read var(--fade-dur))',
  // !mirror.missing && mirror.tutorDur === mirror.sliverDur, JSON.stringify(mirror));
  //
  // ok('S3: the same transitioned PROPERTIES and the same timing FUNCTION on both hands — a divergence in either fails here rather than in a walkthrough',
  // !mirror.missing && mirror.tutorProp === mirror.sliverProp && mirror.tutorFn === mirror.sliverFn,
  // JSON.stringify(mirror));
  // ----------------------------------------------------------------------
  const fade = await app.evalJs(`(() => {
    const read = (sel) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el);
      const props = cs.transitionProperty.split(', '); const i = props.indexOf('opacity'); const v = props.indexOf('visibility');
      const d = cs.transitionDuration.split(', '), f = cs.transitionTimingFunction.split(', '), dl = cs.transitionDelay.split(', ');
      return { props, opacityDur: i >= 0 ? d[i] : null, opacityFn: i >= 0 ? f[i] : null, opacityDelay: i >= 0 ? dl[i] : null, visIndex: v, visDelay: v >= 0 ? dl[v] : null, visibility: cs.visibility, open: el.getAttribute('data-open') }; };
    return { tutor: read('.wz-tutor-panel'), sliver: read('.wz-sliver-panel') };
  })()`);
  ok('S3 successor: The Counsel panel and the tool pop-out share one opacity fade (same duration and timing)',
    !!fade.tutor && !!fade.sliver && !!fade.tutor.opacityDur && fade.tutor.opacityDur === fade.sliver.opacityDur && fade.tutor.opacityFn === fade.sliver.opacityFn && fade.tutor.opacityDelay === fade.sliver.opacityDelay,
    JSON.stringify(fade));
  ok('S3 successor: on close, visibility switches off only after the fade ends (the closed tool pop-out: its visibility transition is delayed by at least the opacity fade\'s duration, and it is hidden)',
    !!fade.sliver && fade.sliver.open === 'false' && fade.sliver.visIndex >= 0 && parseFloat(fade.sliver.visDelay) >= parseFloat(fade.sliver.opacityDur) - 0.001 && fade.sliver.visibility === 'hidden',
    JSON.stringify(fade.sliver));

  // ==========================================================================
  // S4 — the a11y posture is INHERITED from the left hand, not invented. A
  // mounted-but-closed body must be aria-hidden and non-interactive, exactly
  // as the sliver's own mounted-but-closed body already is.
  // ==========================================================================
  await app.evalJs("document.querySelector('.wz-tutor-grip').click()"); // close again
  await sleep(500);
  const tutorClosedFade = await app.evalJs(`(() => { const el = document.querySelector('.wz-tutor-panel'); if (!el) return null; const cs = getComputedStyle(el);
    const props = cs.transitionProperty.split(', '); const i = props.indexOf('opacity'); const v = props.indexOf('visibility');
    return { opacityDur: i >= 0 ? cs.transitionDuration.split(', ')[i] : null, visDelay: v >= 0 ? cs.transitionDelay.split(', ')[v] : null, visibility: cs.visibility, open: el.getAttribute('data-open') }; })()`);
  ok('S3 successor: and the closed Counsel the same - visibility switches off only after ITS fade ends',
    !!tutorClosedFade && tutorClosedFade.open === 'false' && tutorClosedFade.visDelay != null && parseFloat(tutorClosedFade.visDelay) >= parseFloat(tutorClosedFade.opacityDur) - 0.001 && tutorClosedFade.visibility === 'hidden',
    JSON.stringify(tutorClosedFade));
  const posture = await app.evalJs(`(() => {
    const t = document.querySelector('.wz-tutor-panel');
    const s = document.querySelector('.wz-sliver-panel');
    return {
      tutorHidden: t ? t.getAttribute('aria-hidden') : null,
      tutorPointer: t ? getComputedStyle(t).pointerEvents : null,
      tutorBodyMounted: !!document.querySelector('.wz-tutor-body'),
      sliverBodyMounted: !!document.querySelector('.wz-sliver-body'),
      sliverHiddenAttrPresent: s ? s.hasAttribute('aria-hidden') : null,
    };
  })()`);
  ok('S4: a CLOSED Counsel keeps its body mounted but marks it aria-hidden and pointer-events:none — the identical posture the left hand has shipped since FX1, inherited rather than invented',
    posture.tutorHidden === 'true' && posture.tutorPointer === 'none' && posture.tutorBodyMounted === true,
    JSON.stringify(posture));
});

for (const c of checks) {
  // eslint-disable-next-line no-console
  console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? `  [${c.detail}]` : ''}`);
}
const pass = checks.every((c) => c.pass);
// eslint-disable-next-line no-console
console.log(pass
  ? `\nE3 VERIFY: PASS (${checks.length} checks)`
  : `\nE3 VERIFY: FAIL — ${checks.filter((c) => !c.pass).length}/${checks.length} failed`);
process.exit(pass ? 0 : 1);
