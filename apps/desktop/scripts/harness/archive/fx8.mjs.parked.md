# Parked records archived from fx8.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/fx8.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from fx8.mjs lines 107-120 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The green tack (.board-pin-grab) is RETIRED. Its dome (radial gradient, shadow, 12px, 50% radius) has nothing to describe. (They also read the pin's computed style off a node that no longer exists, which would abort this file.)
  // Quoted VERBATIM below. Successor: scripts/harness/connector-a.mjs C2 (no tack anywhere) + the corner circle's own look in C4.
  // const pinStyle = await app.evalJs(`(() => {
  //   const cs = getComputedStyle(document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab'));
  //   return { backgroundImage: cs.backgroundImage, boxShadow: cs.boxShadow, borderRadius: cs.borderRadius, width: cs.width, height: cs.height };
  // })()`);
  // ok('S1: the pin is no longer a flat single-color fill — computed backgroundImage is a genuine radial-gradient (a flat fill would report "none" here, with the color only on backgroundColor)',
  //   pinStyle.backgroundImage.startsWith('radial-gradient('), JSON.stringify(pinStyle));
  // ok('S1: the pin now casts a real box-shadow (was previously none) — "a small box-shadow... the way a raised sphere would cast one" (the brief\'s own words)',
  //   pinStyle.boxShadow !== 'none' && pinStyle.boxShadow.length > 0, pinStyle.boxShadow);
  // ok('S1: same ~12px size, unchanged by the dome treatment', pinStyle.width === '12px' && pinStyle.height === '12px', JSON.stringify(pinStyle));
  // ok('S1: still the SAME recorded circular exception to square corners (border-radius:50%, unchanged — fx5.mjs\'s own S5 check asserts this identically)',
  //   pinStyle.borderRadius === '50%', pinStyle.borderRadius);
```

## Record 2 · from fx8.mjs lines 134-152 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The green tack (.board-pin-grab) is RETIRED. The pin's grabbing cursor pair (and the pointerdown on the pin that armed the thread) are gone.
  // Quoted VERBATIM below. Successor: scripts/harness/connector-a.mjs C3 (the canvas reads data-thread-armed=true in connection mode).
  // // The grabbing-state variant still works — thread-drag arm still swaps
  // // the pin's own cursor, unaffected by the dome restyle (background/
  // // border/box-shadow changed; the cursor rule pair did not).
  // await app.evalJs(`(() => {
  //   const pin = document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab');
  //   const r = pin.getBoundingClientRect();
  //   const mk = (type, x, y) => new PointerEvent(type, {clientX:x, clientY:y, pointerId:1, pointerType:'mouse', bubbles:true, cancelable:true, isPrimary:true});
  //   pin.dispatchEvent(mk('pointerdown', r.left + r.width/2, r.top + r.height/2));
  // })()`);
  // await sleep(150);
  // const armedShape = await app.evalJs(`(() => ({
  //   threadArmed: document.querySelector('.board-canvas').dataset.threadArmed,
  //   pinCursor: getComputedStyle(document.querySelector('[data-box-id="fx8-s1-card"] .board-pin-grab')).cursor,
  // }))()`);
  // ok('S1: the pin\'s own grabbing-state variant (data-thread-armed) still works, unbroken by the dome restyle',
  //   armedShape.threadArmed === 'true' && armedShape.pinCursor === 'grabbing', JSON.stringify(armedShape));
```

## Record 3 · from fx8.mjs lines 223-233 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7dfcc08667ea6a9e8fd957489e30dc77b65d9758

```js
  // ---- PARKED - SUPERSEDED by connector-a (connector-a, Nick-approved mockup v6, 2026-10-15) ----
  // The green tack (.board-pin-grab) is RETIRED. The pin's own cursor is gone; the handle's own cursor (nwse-resize, never stolen by the card-body rule) is re-asserted without it.
  // Quoted VERBATIM below. Successor: the check directly below.
  // const exclusionCursors = await app.evalJs(`(() => ({
  //   pin: getComputedStyle(document.querySelector('[data-box-id="fx8-s3-text"] .board-pin-grab')).cursor,
  //   handle: getComputedStyle(document.querySelector('.board-handle')).cursor,
  // }))()`);
  // ok('S3: the olive pin keeps its OWN cursor (grab, its own state meaning) — never stolen by the new card-body rule',
  //   exclusionCursors.pin === 'grab', JSON.stringify(exclusionCursors));
  // ok('S3: the resize handle keeps its OWN cursor (nwse-resize) — never stolen by the new card-body rule',
  //   exclusionCursors.handle === 'nwse-resize', JSON.stringify(exclusionCursors));
```
