# Splash build kit (Fable, Oct 16, 2026)

This is the reference material for building the per-theme splash. Read `claude/splash-brief.md` first; it holds the rulings.

The mockup is the "Splash Sweep Mockup" artifact, round 4. Its timings below are mockup timings; **multiply every one by 0.7** (Nick's "30% faster").

## 1. Arbor layers: the cutting script

Run it once and commit the outputs under `apps/desktop/public/brand/splash-arbor/`:

```
python cut-splash-layers.py apps/desktop/public/brand/wrizo-sketch-for-dark-theme.png apps/desktop/public/brand/splash-arbor
```

It needs Python with pillow, numpy and scipy. If Python isn't available on this machine, tell Fable through Nick, and Fable will send the 14 files.

`layers.json` gives each layer's position on the 3374 × 2699 canvas. It also gives each connector's reveal path and stroke width (full-size coordinates), its two end stages, and which connector is last. Fable checked the output: composited, it reproduces the mockup's finished frame.

```python
"""Cut the Arbor splash sketch into the layers the splash animation needs (Fable, Oct 16).

Usage:  python cut-splash-layers.py <wrizo-sketch-for-dark-theme.png> <out-dir>
Needs:  pip install pillow numpy scipy

Everything is located in a 1350 x 1080 working copy of the sketch (the
mockup's coordinates), then cut at full size (3374 x 2699) by scaling the
masks up and taking the sketch's own alpha.

Outputs:
  base.png             the whole sketch in cream (TEXT recoloured cream),
                       with FINAL DRAFT's outline removed
  final-cream.png      FINAL DRAFT's outline in cream (it pops, so it is its own layer)
  final.png, ideas.png, text.png, feedback.png, page.png
                       brass outline layers, letters left out
  edge-*.png           one brass layer per connector
  layers.json          each layer's x/y/w/h at full size, and each connector's
                       reveal path + stroke width at full size, its two end
                       stages (a -> b is the draw direction) and `last`
All layers are full-canvas-relative crops, so place them at x/y on the canvas.
"""
import sys, json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
W, H = 1350, 1080
full = Image.open(SRC).convert('RGBA')
FW, FH = full.size
SX, SY = FW / W, FH / H
fa = np.array(full)[:, :, 3]
work = np.array(full.resize((W, H), Image.LANCZOS))
alpha = work[:, :, 3]
yy, xx = np.mgrid[0:H, 0:W]

# coarse strokes (1350 copy, dilated so sketchy strokes join)
lab1, _ = ndimage.label(ndimage.binary_dilation(alpha > 50, iterations=3))
lab1 = lab1 * (alpha > 50)
# fine strokes (2x copy, no dilation) for separating outlines from letters
S = 2
w2 = np.array(full.resize((W * S, H * S), Image.LANCZOS))[:, :, 3]
lab2, _ = ndimage.label(w2 > 60, structure=np.ones((3, 3)))
y2, x2 = np.mgrid[0:H * S, 0:W * S]

def comp1_at(x, y):
    """Coarse component under a point (searches a small box for ink)."""
    box = lab1[y - 6:y + 7, x - 6:x + 7]
    ids, c = np.unique(box[box > 0], return_counts=True)
    return ids[np.argmax(c)]
def band(s, e, hw):
    (x1, y1), (x2_, y2_) = s, e
    dx, dy = x2_ - x1, y2_ - y1; L2 = dx * dx + dy * dy
    t = np.clip(((xx - x1) * dx + (yy - y1) * dy) / L2, 0, 1)
    return (xx - (x1 + t * dx)) ** 2 + (yy - (y1 + t * dy)) ** 2 <= hw * hw
def largest2(x0, y0, x1, y1):
    sub = lab2[y0 * S:y1 * S, x0 * S:x1 * S]
    ids, c = np.unique(sub[sub > 0], return_counts=True)
    return lab2 == ids[np.argmax(c)]
def cut2(m, x0, y0, x1, y1):
    return m & ~((x2 >= x0 * S) & (x2 <= x1 * S) & (y2 >= y0 * S) & (y2 <= y1 * S))
def down2(m):
    return m.reshape(H, S, W, S).any(axis=(1, 3))

# ---- connectors (coarse components, picked by a point on each) ----
C = lambda x, y: lab1 == comp1_at(x, y)
EDGES = [
  # id, a, b, mask, reveal path (1350 coords, drawn a -> b), stroke width
  ('ideas-text', 'ideas', 'text', C(560, 600) & band((772, 623), (700, 657), 18) & (xx >= 698), 'M774,622 L697,659', 44),
  ('ideas-page', 'ideas', 'page', C(768, 470), 'M835,553 L704,390', 60),
  ('text-fb', 'text', 'feedback', C(450, 712), 'M514,702 Q420,735 388,646', 62),
  ('text-page', 'text', 'page', C(607, 490), 'M607,587 L607,393', 60),
  ('page-fb', 'page', 'feedback', C(460, 440) & band((370, 514), (549, 364), 16), 'M552,361 L366,518', 56),
  ('page-final', 'page', 'final', C(830, 268), 'M760,268 L901,266', 50),
]
# ---- stage outlines (fine components; letters cut out) ----
ide = cut2(cut2(largest2(750, 400, 1090, 730), 849, 432, 897, 506), 927, 624, 999, 683)
txt = cut2(largest2(505, 540, 705, 700), 534, 614, 680, 664)
fb = largest2(180, 420, 580, 660)
# the loop's right-hand arc and a fleck are separate strokes; take strokes whose
# centre lies on the loop's open right side
objs = ndimage.find_objects(lab2)
for i, s in enumerate(objs, 1):
    if s is None: continue
    cy, cx = (s[0].start + s[0].stop) / 2 / S, (s[1].start + s[1].stop) / 2 / S
    if 440 <= cx <= 480 and 480 <= cy <= 600 and (lab2[s] == i).sum() > 40: fb |= lab2 == i
# PAGE's sheet edges: every stroke in the sheet's box that sits on its rim
pg = np.zeros_like(fb)
for i, s in enumerate(objs, 1):
    if s is None: continue
    x0, x1, y0, y1 = s[1].start / S, s[1].stop / S, s[0].start / S, s[0].stop / S
    if not (555 <= x0 and x1 <= 730 and 190 <= y0 and y1 <= 380): continue
    if (lab2[s] == i).sum() < 30: continue
    rim = x0 < 572 or x1 > 690 or y1 < 206 or y0 > 362 or (x1 - x0 < 8 and x0 < 581 and y0 > 295)
    if rim: pg |= lab2 == i
fin = cut2(largest2(930, 170, 1110, 360), 966, 203, 1082, 306)
OUTLINES = {'ideas': down2(ide), 'text': down2(txt), 'feedback': down2(fb), 'page': down2(pg), 'final': down2(fin)}

# ---- cut at full size ----
BRASS, CREAM = (255, 152, 0), (234, 226, 218)
def up(m):  # 1350 mask -> full size, grown 2px so antialiased edges come along
    big = np.array(Image.fromarray((m * 255).astype(np.uint8)).resize((FW, FH), Image.NEAREST)) > 0
    return ndimage.binary_dilation(big, iterations=2)
def save(name, m, col):
    m = m & (fa > 0); ys, xs = np.where(m)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    a = np.zeros((y1 - y0, x1 - x0, 4), np.uint8); a[..., :3] = col
    a[..., 3] = np.where(m[y0:y1, x0:x1], fa[y0:y1, x0:x1], 0)
    Image.fromarray(a, 'RGBA').save(os.path.join(OUT, name), optimize=True)
    return dict(file=name, x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))
meta = {'canvas': [FW, FH], 'outlines': {}, 'edges': []}
for k, m in OUTLINES.items(): meta['outlines'][k] = save(k + '.png', up(m), BRASS)
finalBig = up(OUTLINES['final'])
meta['finalCream'] = save('final-cream.png', finalBig, CREAM)
def scale_path(d):
    out, nums = [], d.replace(',', ' ').split()
    i = 0; xy = 0
    for tok in nums:
        if tok[0].isalpha():
            out.append(tok[0]); tok = tok[1:]
            if not tok: continue
        v = float(tok); out.append(f'{v * (SX if xy == 0 else SY):.1f}'); xy ^= 1
    s = ' '.join(out)
    return s
for (eid, a, b, m, d, w) in EDGES:
    e = save(f'edge-{eid}.png', up(m & (alpha > 0)), BRASS)
    e.update(id=eid, a=a, b=b, path=scale_path(d), strokeWidth=round(w * SX, 1), last=(eid == 'page-final'))
    meta['edges'].append(e)
base = np.zeros((FH, FW, 4), np.uint8); base[..., :3] = CREAM; base[..., 3] = np.where(finalBig, 0, fa)
Image.fromarray(base, 'RGBA').save(os.path.join(OUT, 'base.png'), optimize=True)
json.dump(meta, open(os.path.join(OUT, 'layers.json'), 'w'), indent=1)
print('wrote', len(os.listdir(OUT)), 'files to', OUT)
```

## 2. Flux: the schematic (SVG from the mockup)

- Move the colours to tokens: #2A6A76 → `--ink-border-strong`, #1D4A52 → `--ink-border`, #E3F1EC → `--text-hi`, #8FB4AC → `--text-mid`, #00C2FF → `--line-active`, brass → `--brass`.
- Fonts come from the Flux font slots (Rajdhani, Chakra Petch).
- The wires and tiles are created by the script in section 3.

```html
<svg class="mark-svg" id="fluxSvg" viewBox="0 0 1350 1080" role="img" aria-label="Wrizo schematic: from Ideas to Final Draft" style="display:none">
        <defs>
          <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.5" class="fx-grid"></circle></pattern>
          <mask id="scan" maskUnits="userSpaceOnUse" x="0" y="0" width="1350" height="1080">
            <rect x="0" y="0" width="1350" height="1080" fill="#fff"></rect>
            <rect x="0" y="122" width="1350" height="5" fill="#000"></rect>
          </mask>
        </defs>
        <rect x="40" y="40" width="1270" height="1000" fill="url(#dots)" opacity=".55"></rect>
        <path class="fx-tree" d="M40,80 L40,40 L80,40 M1270,40 L1310,40 L1310,80 M1310,1000 L1310,1040 L1270,1040 M80,1040 L40,1040 L40,1000"></path>

        <!-- wordmark: drawn from straight strokes on a 4-unit grid -->
        <g transform="translate(435,70) scale(1.6)" mask="url(#scan)">
          <g fill="none" stroke="#E3F1EC" stroke-width="8" stroke-linecap="square" stroke-linejoin="miter">
            <path d="M0,0 L14,64 L35,22 L56,64 L70,0"></path>
            <path d="M92,64 L92,0 L124,0 L136,12 L136,26 L124,36 L92,36 M114,36 L136,64"></path>
            <path d="M158,0 L158,64"></path>
            <path d="M180,0 L226,0 L180,64 L226,64"></path>
            <path d="M262,0 L286,0 L300,14 L300,50 L286,64 L262,64 L248,50 L248,14 Z"></path>
          </g>
          <rect x="270" y="28" width="8" height="8" fill="#00C2FF"></rect>
        </g>
        <text x="675" y="218" text-anchor="middle" class="fx-sub" style="font-size:18px;letter-spacing:.3em">// IN ABSTRACT · FIRST PRINCIPLES TO FINAL PRODUCT</text>

        <!-- trees of sub-parts -->
        <path class="fx-tree" d="M84,566 L84,681 M84,611 L104,611 M84,646 L104,646 M84,681 L104,681"></path>
        <text x="114" y="618" class="fx-sub">STRUCTURE</text><text x="114" y="653" class="fx-sub">RESEARCH</text><text x="114" y="688" class="fx-sub">FLEXIBILITY</text>
        <path class="fx-tree" d="M420,577 L420,692 M420,622 L440,622 M420,657 L440,657 M420,692 L440,692"></path>
        <text x="450" y="629" class="fx-sub">QUOTES</text><text x="450" y="664" class="fx-sub">UNIQUE</text><text x="450" y="699" class="fx-sub">INK</text>
        <path class="fx-tree" d="M580,837 L580,952 M580,882 L600,882 M580,917 L600,917 M580,952 L600,952"></path>
        <text x="610" y="889" class="fx-sub">AUTOMATED</text><text x="610" y="924" class="fx-sub">AI TUTOR</text><text x="610" y="959" class="fx-sub">WORKSHOPS</text>
        <path class="fx-tree" d="M1030,592 L1030,742 M1030,637 L1050,637 M1030,672 L1050,672 M1030,707 L1050,707 M1030,742 L1050,742"></path>
        <text x="1060" y="644" class="fx-sub">POLISH</text><text x="1060" y="679" class="fx-sub">ERROR-FREE</text><text x="1060" y="714" class="fx-sub">FILE TYPE</text><text x="1060" y="749" class="fx-sub">SHAREABLE</text>

        <!-- wires (dim), each with a brass twin drawn over it -->
        <g id="fxWires"></g>

        <!-- nodes -->
        <text x="70" y="490" class="fx-tag">N.01 · INPUT</text>
        <g id="fxTiles"></g>
        <g id="fxSum" class="fx-node"><circle cx="360" cy="540" r="16" class="fx-box"></circle></g>
        <text x="360" y="548" text-anchor="middle" class="fx-tag" style="font-size:20px;letter-spacing:0">Σ</text>
        <text x="400" y="490" class="fx-tag">N.02</text>
        <g id="fxText" class="fx-node"><rect x="400" y="505" width="180" height="70" class="fx-box"></rect></g><text x="490" y="551" text-anchor="middle" class="fx-name">TEXT</text>
        <text x="700" y="490" class="fx-tag">N.03</text><text x="790" y="606" text-anchor="middle" class="fx-sub">LINEAR, COHERENT</text>
        <g id="fxPage" class="fx-node"><rect x="700" y="505" width="180" height="70" class="fx-box"></rect></g><text x="790" y="551" text-anchor="middle" class="fx-name">PAGE</text>
        <text x="560" y="755" class="fx-tag">N.04 · LOOP</text>
        <g id="fxFb" class="fx-node"><rect x="560" y="765" width="200" height="70" class="fx-box"></rect></g><text x="660" y="811" text-anchor="middle" class="fx-name">FEEDBACK</text>
        <text x="1010" y="475" class="fx-tag">N.05 · OUTPUT</text>
        <g id="fxFinal" class="fx-node">
          <rect x="1010" y="490" width="240" height="100" class="fx-box"></rect>
          <rect x="1019" y="499" width="222" height="82" fill="none" stroke="#2A6A76" stroke-width="2"></rect>
          <text x="1130" y="551" text-anchor="middle" class="fx-name">FINAL DRAFT</text>
        </g>
      </svg>
```

```css
/* Flux schematic */
.fx-dim{ fill:none; stroke:#2A6A76; stroke-width:3; stroke-linecap:square; stroke-linejoin:miter; }
.fx-hot{ fill:none; stroke:var(--brass); stroke-width:4; stroke-linecap:square; stroke-linejoin:miter; }
.fx-box{ fill:#04141A; stroke:#2A6A76; stroke-width:3; }
.fx-name{ fill:#E3F1EC; font-family:'Rajdhani','Figtree',sans-serif; font-weight:600; font-size:27px; letter-spacing:.08em; }
.fx-tag{ fill:#00C2FF; font-family:'Chakra Petch','Figtree',sans-serif; font-size:17px; letter-spacing:.12em; }
.fx-sub{ fill:#8FB4AC; font-family:'Chakra Petch','Figtree',sans-serif; font-size:19px; letter-spacing:.14em; }
.fx-tree{ fill:none; stroke:#1D4A52; stroke-width:2; }
.fx-grid{ fill:#1D4A52; }
.tile rect{ fill:#04141A; stroke:#8FB4AC; stroke-width:3; transition:stroke .3s; }
.tile text{ fill:#E3F1EC; font-family:'Rajdhani','Figtree',sans-serif; font-weight:600; font-size:28px; text-anchor:middle; transition:fill .3s; }
.tile.lit rect{ stroke:var(--brass); }
.fx-node rect, .fx-node circle{ transition:stroke .35s; } .fx-node.lit rect, .fx-node.lit circle{ stroke:var(--brass); }
#fxFinal{ transform-box:fill-box; transform-origin:center; }

```

## 3. Mockup script: wires, tiles and the timeline

The Arbor wave timing, node lighting, Flux schedule, pop and fade are all here. Again, the real build multiplies every time by 0.7.

```js
/* ---- Flux: wires and tiles ---- */
const FX_WIRES = [
  { id: 'bus1',   d: 'M314,540 L344,540 M376,540 L398,540 M386,532 L398,540 L386,548' },
  { id: 'bypass', d: 'M292,512 L292,400 L830,400 L830,503 M822,491 L830,503 L838,491' },
  { id: 'bus2',   d: 'M580,540 L698,540 M686,532 L698,540 L686,548' },
  { id: 'loop',   d: 'M880,540 L940,540 L940,800 L762,800 M558,800 L360,800 L360,558 M352,570 L360,558 L368,570' },
  { id: 'out',    d: 'M940,540 L1008,540 M996,532 L1008,540 L996,548' },
];
const fxWires = {};
FX_WIRES.forEach(w => {
  mk('path', { d: w.d, class: 'fx-dim' }, $('fxWires'));
  fxWires[w.id] = mk('path', { d: w.d, class: 'fx-hot', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, $('fxWires'));
});
const TILES = [ // letter, home x, scattered offset and tilt
  ['I', 70, -18, 46, -9], ['D', 120, 14, -38, 7], ['E', 170, -10, 30, -5], ['A', 220, 22, -50, 11], ['S', 270, -6, 40, -7] ];
const tiles = TILES.map(([ch, x, dx, dy, rot]) => {
  const g = mk('g', { class: 'tile' }, $('fxTiles'));
  g.style.transformBox = 'fill-box'; g.style.transformOrigin = 'center';
  mk('rect', { x, y: 518, width: 44, height: 44 }, g);
  const t = mk('text', { x: x + 22, y: 550 }, g); t.textContent = ch;
  return { g, dx, dy, rot };
});

function play() {
  reset();
  const k = state.speed * 0.7;   // round 4 (Nick): 30% faster
  const A = (el, kf, at, dur, ease = 'ease-in-out') => anims.push(el.animate(kf, { delay: at * k, duration: Math.max(1, dur * k), fill: 'forwards', easing: ease }));
  const pop = (el, at) => A(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: .35 }, { transform: 'scale(.99)', offset: .75 }, { transform: 'scale(1)' }], at, 480, 'ease-out');
  const draw = (p, at, dur) => A(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], at, dur, 'linear');
  const later = (fn, at) => timers.push(setTimeout(fn, at * k));
  let finalAt;

  if (state.theme === 'arbor') {
    const ideasAt = 300, ideasDur = 500, v = 0.2;                 // the wave travels 200 px of drawing per second
    const t0 = ideasAt + ideasDur;
    const reach = { ideas: t0 }; let lastEnd = t0;
    const plain = arEdges.filter(e => !e.last), finalEdge = arEdges.find(e => e.last);
    // nodes are reached in order of distance from IDEAS; each connector draws from the end the wave reaches first
    for (let pass = 0; pass < 4; pass++) plain.forEach(e => {
      if (reach[e.a] === undefined) return;
      const arrive = reach[e.a] + e.len / v;
      if (reach[e.b] === undefined || arrive < reach[e.b]) reach[e.b] = arrive;
    });
    if (reduced) { arEdges.forEach(e => e.path.style.strokeDashoffset = '0'); ['arIdeas','arText','arFeedback','arPage','arFinal'].forEach(id => $(id).setAttribute('opacity','1')); finalAt = 0; }
    else {
      A($('arIdeas'), [{ opacity: 0, filter: glowOff }, { opacity: 1, filter: glowOn, offset: .6 }, { opacity: 1, filter: glowRest }], ideasAt, ideasDur + 250);
      plain.forEach(e => { const s = reach[e.a], d = e.len / v; draw(e.path, s, d); lastEnd = Math.max(lastEnd, s + d); });
      [['arText','text'],['arPage','page'],['arFeedback','feedback']].forEach(([id, n]) => A($(id), [{ opacity: 0 }, { opacity: 1 }], reach[n] - 60, 380));
      const fs = lastEnd + 120, fd = finalEdge.len / 0.3;
      draw(finalEdge.path, fs, fd);
      finalAt = fs + fd;
      A($('arFinal'), [{ opacity: 0, filter: glowOff }, { opacity: 1, filter: glowOn, offset: .6 }, { opacity: 1, filter: glowRest }], finalAt, 750);
      pop($('arFinalG'), finalAt + 260);
    }
  } else {
    if (reduced) {
      tiles.forEach(t => { t.g.style.transform = 'none'; t.g.classList.add('lit'); });
      document.querySelectorAll('.fx-node').forEach(n => n.classList.add('lit'));
      Object.values(fxWires).forEach(p => p.style.strokeDashoffset = '0'); fxFinal.classList.add('lit'); finalAt = 0;
    } else {
      tiles.forEach((t, i) => {
        A(t.g, [{ transform: `translate(${t.dx}px,${t.dy}px) rotate(${t.rot}deg)` }, { transform: 'translate(0,0) rotate(0deg)' }], 250 + i * 60, 420, 'cubic-bezier(.2,.8,.2,1)');
        later(() => t.g.classList.add('lit'), 520 + i * 60);
      });
      draw(fxWires.bus1, 950, 260);                 // IDEAS → Σ → TEXT
      draw(fxWires.bypass, 950, 1050);              // IDEAS → PAGE, the other direction at the same moment
      draw(fxWires.bus2, 1210, 420);                // TEXT → PAGE
      draw(fxWires.loop, 1630, 1150);               // PAGE → FEEDBACK → back into TEXT
      draw(fxWires.out, 2900, 330);                 // PAGE → FINAL DRAFT, last
      finalAt = 3230;
      [['fxSum',1080],['fxText',1210],['fxPage',1630],['fxFb',2220]].forEach(([id, at]) => later(() => $(id).classList.add('lit'), at));
      later(() => fxFinal.classList.add('lit'), finalAt);
      pop(fxFinal, finalAt + 260);
      A(fxFinal, [{ filter: glowOff }, { filter: glowOn, offset: .6 }, { filter: glowRest }], finalAt, 750);
    }
  }

  const fadeAt = reduced ? 4600 : finalAt + 260 + 480 + 500, fade = 450;
  if (state.end === 'fade') {
    if (reduced) { later(() => { splash.style.opacity = '0'; surface.style.opacity = '1'; }, fadeAt); }
    else { A(splash, [{ opacity: 1 }, { opacity: 0 }], fadeAt, fade, 'ease'); A(surface, [{ opacity: 0 }, { opacity: 1 }], fadeAt, fade, 'ease'); }
  }
  let li = 1; loading.textContent = PHRASES[state.theme][li];
  const cyc = () => { li = (li + 1) % 4; loading.textContent = PHRASES[state.theme][li]; timers.push(setTimeout(cyc, 1400 * k)); };
  timers.push(setTimeout(cyc, 1400 * k));
  const end = (state.end === 'fade' ? fadeAt + fade : (reduced ? 0 : finalAt + 750)) * k, t0 = performance.now();
  const tick = () => { const t = Math.min(performance.now() - t0, end); clock.textContent = (t / 1000 / state.speed).toFixed(1) + ' s';
    if (t < end) raf = requestAnimationFrame(tick); else timers.forEach(clearTimeout); };
  raf = requestAnimationFrame(tick);
}
```
