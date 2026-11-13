# Parked records archived from connector-a.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/connector-a.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from connector-a.mjs lines 59-64 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 295cd5da102bc993f60e24d420586da91679c6e1

```js
  // ---- PARKED - SUPERSEDED by W3 (guided paths, Oct 23; train #6 red, Fable Oct 24): W3 widened the dblclick guard's selector so a double-click on the step question mark (or in its popover) opens nothing: `hitEl?.closest('.board-handle, .board-step-help, .board-step-pop')`. The pin's source regex named the exact old line.
  // Kept VERBATIM below and no longer run; the live successor follows. The behaviour is intact (Fable read the diff): the dblclick-on-the-corner return still names .board-handle and the < 100 ms gesture guard still follows it.
  //
  // ok('S1: the tack is gone from the component; the corner square has BOTH new doors (a second press at the same spot, soon, with nothing moved in between; a right-button press); the relock guard is KEPT (the dblclick-on-the-corner return, the <100ms-after-a-gesture return, the selection clear before a resize, the native-drag refusal)',
  //   p.noTack && p.doubleDoor && p.rightDoor && p.relockKept, JSON.stringify(p));
  // the relock guard, as W3 left it: the return's selector may be WIDENED but must still name .board-handle, and it must still be followed by the < 100 ms-after-a-gesture return; the selection clear before a resize and the native-drag refusal are unchanged
```

## Record 2 · from connector-a.mjs lines 68-72 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6f82b466ffdcf6b81449adaece3a9e9281debd69

```js
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15; pair ledger 69) ----
  // `ctxScoped` is a SOURCE regex on the board's contextmenu handler as connector-a wrote it (`... ) e.preventDefault();`). board-context-menu rewrote that handler: the browser's menu is still suppressed in connection mode, on the corner square and for the beat after a right-drag lets go, and a right-click ANYWHERE ELSE on a card or on empty board now opens the board's own menu. The literal text is gone; the claim (the corner square, and only it, is connection mode; nothing but the app's own menu ever shows) stands.
  // Quoted VERBATIM below. Successor: the check directly below (the new handler's shape) + board-context-menu.mjs K1/K2 (behaviour: a card right-click opens the menu, the corner square is connection mode with no menu).
  // ok('S2: a release on a linked card removes the connection, on an unlinked one makes the SAME connection box as ever (no new field - zero schema); a release on empty board after a drag cancels; lines are drawn only inside the mode; targets are same-board cards only; the context menu is suppressed only on the square',
  //   p.toggle && p.cancelOnEmpty && p.linesOnlyInMode && p.sameBoard && p.ctxScoped && p.footersOn, JSON.stringify(p));
```

## Record 3 · from connector-a.mjs lines 74-78 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2a7aaed810c53f32ff8fd00e9980ae4a66f655f

```js
  // ---- PARKED - SUPERSEDED by ledger 92 (connector-b, Oct 17): the board's capture-phase contextmenu handler now also STOPS the event it suppresses (BoardEditor.tsx - so a held right-release over a rail thumbnail cannot reach the tile's own "Delete board" menu).
  // The handler's literal text changed again (`{ e.preventDefault(); e.stopPropagation(); return; }`), so the context-menu successor's regex no longer matches. Kept VERBATIM below and no longer run; the successor pins the new shape.
  //
  // ok('S2 [context-menu successor]: a release on a linked card removes the connection, on an unlinked one makes the SAME connection box as ever (no new field - zero schema); a release on empty board after a drag cancels; lines are drawn only inside the mode; targets are same-board cards only; the browser\'s menu is suppressed in connection mode, on the corner square and for the beat after a right-drag lets go (the handler\'s new shape)',
  //   p.toggle && p.cancelOnEmpty && p.linesOnlyInMode && p.sameBoard && ctxNew(be) && p.footersOn, JSON.stringify({ ...p, ctxNew: ctxNew(be) }));
```

## Record 4 · from connector-a.mjs lines 90-94 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6f82b466ffdcf6b81449adaece3a9e9281debd69

```js
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15; pair ledger 69) ----
  // The suppress-the-menu-everywhere mutant (m2) and its pin were written against the handler's old text; the mutation no longer lands on the rewritten handler.
  // Quoted VERBATIM below. Successor: the check directly below (the same mutants, m2 re-aimed at the new handler).
  // ok('S (mutants): dropping "nothing moved in between", suppressing the menu everywhere, dropping the cancel-on-empty, dropping the relock return, dropping the unlink branch, or putting the tack back each turn a pin RED, while a history COMMENT naming the tack does not (each mutation landed)',
  //   m1 !== be && !pins(m1).doubleDoor && m2 !== be && !pins(m2).ctxScoped && m3 !== be && !pins(m3).cancelOnEmpty && m4 !== be && !pins(m4).relockKept && m5 !== be && !pins(m5).toggle && m6 !== be && !pins(m6).noTack && m7 !== be && pins(m7).noTack, '');
```

## Record 5 · from connector-a.mjs lines 97-107 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 295cd5da102bc993f60e24d420586da91679c6e1

```js
  // ---- PARKED - SUPERSEDED by ledger 92 (connector-b, Oct 17): the board's capture-phase contextmenu handler now also STOPS the event it suppresses (BoardEditor.tsx - so a held right-release over a rail thumbnail cannot reach the tile's own "Delete board" menu).
  // Its `m2b` mutation patches the PREVIOUS text of that very line, so it no longer lands (its "each mutation landed" cannot hold). Kept VERBATIM below and no longer run; the successor re-aims the mutation at the line as it now reads.
  //
  // ok('S (mutants) [context-menu successor]: dropping "nothing moved in between", suppressing the menu everywhere (re-aimed at the rewritten handler), dropping the cancel-on-empty, dropping the relock return, dropping the unlink branch, or putting the tack back each turn a pin RED, while a history COMMENT naming the tack does not (each mutation landed)',
  //   m1 !== be && !pins(m1).doubleDoor && m2b !== be && !ctxNew(m2b) && m3 !== be && !pins(m3).cancelOnEmpty && m4 !== be && !pins(m4).relockKept && m5 !== be && !pins(m5).toggle && m6 !== be && !pins(m6).noTack && m7 !== be && pins(m7).noTack, '');
  // ---- PARKED - SUPERSEDED by W3 (guided paths, Oct 23; train #6 red, Fable Oct 24): the mutant m4 patches the old text of the dblclick-return line (`if (hitEl?.closest('.board-handle')) return;`), so it no longer lands (its "each mutation landed" cannot hold).
  // Kept VERBATIM below and no longer run; the live successor follows. The behaviour is intact (Fable read the diff): the dblclick-on-the-corner return still names .board-handle and the < 100 ms gesture guard still follows it.
  //
  // ok('S (mutants) [stopPropagation successor]: dropping "nothing moved in between", suppressing the menu everywhere (re-aimed at the handler as it now reads, stop included), dropping the cancel-on-empty, dropping the relock return, dropping the unlink branch, or putting the tack back each turn a pin RED, while a history COMMENT naming the tack does not (each mutation landed)',
  //   m1 !== be && !pins(m1).doubleDoor && m2c !== be && !ctxNew2(m2c) && m3 !== be && !pins(m3).cancelOnEmpty && m4 !== be && !pins(m4).relockKept && m5 !== be && !pins(m5).toggle && m6 !== be && !pins(m6).noTack && m7 !== be && pins(m7).noTack, '');
  // m4 re-aimed at the line as it now reads (any selector list that starts with .board-handle), and a second mutant on the < 100 ms guard that follows it
```

## Record 6 · from connector-a.mjs lines 277-280 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2a7aaed810c53f32ff8fd00e9980ae4a66f655f

```js
  // ---- PARKED - SUPERSEDED by ledger 92 (connector-b, Oct 17): the board's capture-phase contextmenu handler now also STOPS the event it suppresses (BoardEditor.tsx - so a held right-release over a rail thumbnail cannot reach the tile's own "Delete board" menu).
  // Its observer (a bubble-phase listener on the window) sits DOWNSTREAM of that stop, so it never sees the event: it reads `[]` and the check goes blind. Kept VERBATIM below and no longer run; the successor observes from the window's CAPTURE phase, before the board.
  //
  // ok('C9: the browser\'s context menu is suppressed on the square AND for the beat after a right-drag lets go over another card (every contextmenu event in that gesture was default-prevented, and at least one arrived)', ctx9.length >= 1 && ctx9.every((e) => e.prevented), JSON.stringify(ctx9));
```

## Record 7 · from connector-a.mjs lines 286-290 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in bb0c867dd07e760970b9544b6aa30a49b94a8776

```js
  // ---- PARKED - SUPERSEDED by board-context-menu (Nick approved the mockup, Oct 15) ----
  // A right-click on a card BODY opens that card's menu now (default-prevented, by design); only the corner square is connection mode. The browser's own menu is never what shows on the board.
  // Quoted VERBATIM below. Successor: the check directly below (the card menu opens, prevented) and board-context-menu.mjs K1/K2.
  // const ctx9b = await app.evalJs('window.__ctx.slice()');
  // ok('C9: and a right-click anywhere else (a card body) is NOT suppressed - the menu rule is only on the square', ctx9b.length >= 1 && ctx9b.every((e) => e.prevented === false), JSON.stringify(ctx9b));
```
