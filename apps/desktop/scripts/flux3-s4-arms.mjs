// FLUX3 S4 - THE LATENCY EXPERIMENT'S ARMS (Fable, Nov 8: the quiet L red is real and the budget is NOT loosened; ONE experiment turn on a
// quiet PC, each option a LANDED arm against the same control; Nick picks from the numbers and the frames, light and dark). Shared by the
// experiment harness (scripts/harness/flux3-s4-arms.mjs) and the frames job's screens (scripts/frames/flux3-s4.mjs, the arm-* screens).
//
// NOTHING HERE IS BUILT FOR REAL. Each arm is a set of patches applied to the served files in flight (CDP Fetch), exactly the harness's mutant
// mechanism: a patch whose pattern does not match its file EXACTLY ONCE is not applied, and the arm does not stand. The product's source is
// untouched until Nick picks.
//   J       Jacked In as built (S4 r12): the reference arm.
//   K       Jacked In with the tunnel never mounted (L's information arm): what Jacked In costs without the tunnel.
//   hold    (1) the tunnel holds while keys land: Nick's hold switch on (TUNNEL_SWITCHES.holdWhileTyping); it runs on her pauses.
//   light   (2) a lighter tunnel: 6 frames, not 12; each 110% of the stage, not 180%; no rays (the streaks stay).
//   margins (3) the tunnel clipped to the margins: masked out across the words' column (a 24 px fade), the column read from the editor.
//   veil    (4) a cheaper veil: the editor's two-line window as a rectangle clip, not a mask (a clip cannot dim, so the dim line is full).
//   veilK   (4) without the tunnel: the veil's own share, against K.
// A patch: [pattern (global), replacement, file kind]. File kinds: js (index-*.js), css (boot-*.css: flux-v3.css built), icss (index-*.css).

const NOTUNNEL = [/if\(!([\w$]+)\)return;const ([\w$]+)=document\.createElement\("div"\);return \2\.className="flux3-tunnel"/g, 'if(!0)return;const $2=document.createElement("div");return $2.className="flux3-tunnel"', 'js'];
const VEIL = [/\.forward-only-editor\{-webkit-mask-image:var\(--f3-term-mask\);mask-image:var\(--f3-term-mask\)\}/g, '.forward-only-editor{clip-path:inset(calc(100% - 2lh) 0 0 0)}', 'css'];

export const ARMS = {
  J: { what: 'Jacked In as built (r12)', patches: [] },
  K: { what: 'Jacked In, the tunnel never mounted', patches: [NOTUNNEL] },
  hold: { what: '(1) the tunnel holds while keys land (the hold switch on)', patches: [[/holdWhileTyping:!1/g, 'holdWhileTyping:!0', 'js']] },
  light: { what: '(2) a lighter tunnel: 6 frames of 110%, no rays', patches: [
    [/\.flux3-tunnel-rays\{position:absolute;/g, '.flux3-tunnel-rays{display:none;position:absolute;', 'css'],
    [/width:180%;height:180%;box-sizing:border-box;border:1px solid var\(--t-line\)/g, 'width:110%;height:110%;box-sizing:border-box;border:1px solid var(--t-line)', 'css'],
    [/(@keyframes flux3-tunnel-run\{)/g, ':root[data-flux3][data-theme=flux] i.flux3-tunnel-frame:nth-of-type(2n){display:none}$1', 'css'],
  ] },
  margins: { what: '(3) the tunnel clipped to the margins (none behind the words)', patches: [
    [/\.flux3-tunnel\{position:absolute;top:0;right:0;bottom:0;left:0;/g, '.flux3-tunnel{-webkit-mask-image:linear-gradient(to right,#000 calc(var(--arm-l) - 24px),transparent var(--arm-l),transparent var(--arm-r),#000 calc(var(--arm-r) + 24px));mask-image:linear-gradient(to right,#000 calc(var(--arm-l) - 24px),transparent var(--arm-l),transparent var(--arm-r),#000 calc(var(--arm-r) + 24px));position:absolute;top:0;right:0;bottom:0;left:0;', 'css'],
  ] },
  veil: { what: '(4) the veil a rectangle clip, not a mask (the dim line full)', patches: [VEIL] },
  veilK: { what: '(4) the veil a rectangle clip, without the tunnel', patches: [VEIL, NOTUNNEL] },
};

const PATTERNS = [{ urlPattern: '*/assets/index-*.js', requestStage: 'Response' }, { urlPattern: '*/assets/boot-*.css', requestStage: 'Response' }, { urlPattern: '*/assets/index-*.css', requestStage: 'Response' }];
const kindOf = (u) => (/\.css(\?|$)/.test(u) ? (/\/boot-/.test(u) ? 'css' : 'icss') : 'js');
const installed = new WeakMap();

// the in-flight patcher, once per app. set(name) arms the NEXT load; counts() reads each patch's match count in that load (undefined: its file
// never passed); landed() is true only when every patch matched exactly once. set(null) after the load leaves later loads untouched.
export async function installArms(app) {
  if (installed.has(app)) return installed.get(app);
  const s = { arm: null, counts: [] };
  await app.cdp('Network.enable');
  await app.cdp('Network.setCacheDisabled', { cacheDisabled: true });
  await app.cdp('Fetch.enable', { patterns: PATTERNS });
  app.tap(async (method, p) => {
    if (method !== 'Fetch.requestPaused') return;
    try {
      const patches = s.arm ? ARMS[s.arm].patches : [];
      const kind = kindOf((p.request && p.request.url) || '');
      if (!patches.some((x) => x[2] === kind)) { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); return; }
      const body = await app.cdp('Fetch.getResponseBody', { requestId: p.requestId });
      let text = body.base64Encoded ? Buffer.from(body.body, 'base64').toString('utf8') : body.body;
      patches.forEach(([from, to, k], i) => {
        if (k !== kind) return;
        const n = (text.match(from) || []).length;
        s.counts[i] = n;
        if (n === 1) text = text.replace(from, to);
      });
      await app.cdp('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: p.responseStatusCode || 200, responseHeaders: p.responseHeaders || [], body: Buffer.from(text, 'utf8').toString('base64') });
    } catch { try { await app.cdp('Fetch.continueRequest', { requestId: p.requestId }); } catch { /* the request is gone */ } }
  });
  const api = {
    set: (name) => { if (name !== null && !ARMS[name]) throw new Error(`no arm ${name}`); s.arm = name; if (name !== null) s.counts = []; },
    counts: () => s.counts.slice(),
    landed: (name) => ARMS[name].patches.every((_, i) => s.counts[i] === 1),
  };
  installed.set(app, api);
  return api;
}

// after the arm's page is open: the margins arm's column (the editor's left and right, in the tunnel's own box), set on the tunnel
export const STAND = `(() => { const t = document.querySelector('[data-flux3-tunnel]'), ed = document.querySelector('.forward-only-editor'); if (!t || !ed) return false;
  const tr = t.getBoundingClientRect(), er = ed.getBoundingClientRect(); t.style.setProperty('--arm-l', Math.round(er.left - tr.left - 16) + 'px'); t.style.setProperty('--arm-r', Math.round(er.right - tr.left + 16) + 'px'); return true; })()`;

// what stands on the page, for every arm's own predicate (read at rest, and mid-burst for the hold)
export const READ = `(() => { const t = document.querySelector('[data-flux3-tunnel]'), ed = document.querySelector('.forward-only-editor'), cs = ed ? getComputedStyle(ed) : null;
  const fr = t ? [...t.querySelectorAll('.flux3-tunnel-frame')] : [], shown = fr.filter((f) => getComputedStyle(f).display !== 'none'), rays = t && t.querySelector('.flux3-tunnel-rays');
  const tw = t ? t.getBoundingClientRect().width : 0, f0 = shown[0];
  const running = shown.reduce((a, f) => a + f.getAnimations().filter((x) => x.playState === 'running').length, 0);
  return { tunnel: !!t, frames: fr.length, shown: shown.length, running, rays: rays ? getComputedStyle(rays).display : null,
    frameW: f0 && tw ? +(f0.offsetWidth / tw).toFixed(2) : null, tunMask: t ? (getComputedStyle(t).maskImage || getComputedStyle(t).webkitMaskImage || 'none') : null,
    armL: t ? t.style.getPropertyValue('--arm-l') : null, hold: !!t && t.hasAttribute('data-hold'), writing: document.documentElement.getAttribute('data-wz-writing'),
    edMask: cs ? (cs.maskImage || cs.webkitMaskImage || 'none') : null, edClip: cs ? cs.clipPath : null,
    jacked: document.documentElement.hasAttribute('data-flux3-jacked'), zoom: document.querySelector('.mode-pagecol')?.getAttribute('data-zoom') || null }; })()`;

const veiled = (r) => !!r.edMask && r.edMask !== 'none' && (!r.edClip || r.edClip === 'none');
const clipped = (r) => (!r.edMask || r.edMask === 'none') && /^inset\(/.test(r.edClip || '');
const fullTunnel = (r) => r.tunnel && r.shown === 12 && r.rays !== 'none' && r.frameW === 1.8 && r.tunMask === 'none';
// each arm's effect, from a rest read (and, for the hold, a read while keys land): J's own reads must fail every other arm's (liveness)
export const STOOD = {
  J: (r) => r.jacked && fullTunnel(r) && !r.hold && veiled(r),
  K: (r) => r.jacked && !r.tunnel && veiled(r),
  hold: (r, mid) => r.jacked && fullTunnel(r) && r.hold && veiled(r) && !!mid && mid.writing === 'true' && mid.running === 0,
  light: (r) => r.jacked && r.tunnel && r.shown === 6 && r.rays === 'none' && r.frameW === 1.1 && r.tunMask === 'none' && veiled(r),
  margins: (r) => r.jacked && r.tunnel && r.shown === 12 && r.rays !== 'none' && /linear-gradient/.test(r.tunMask || '') && !!r.armL && veiled(r),
  veil: (r) => r.jacked && fullTunnel(r) && clipped(r),
  veilK: (r) => r.jacked && !r.tunnel && clipped(r),
};
