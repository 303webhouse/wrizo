# Parked records archived from drawers-p1.mjs (#13 step 14)

Each record below is a parked check's original, moved VERBATIM out of `scripts/harness/drawers-p1.mjs` once its successor had been green for two production deploys (#12n a1718101 and train 1 e97dde15). The live file keeps the successor and a one-line pointer naming the record. Nothing here runs.

## Record 1 · from drawers-p1.mjs lines 180-186 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 761741990afdf8ba8e7bdefc3ed5668155fe7fe1

```js
  // SUPERSEDED (typing-latency, 2026-10-15; Fable: "drawers-p1 D1a/D1c: intended - park verbatim with successors"). D1a pinned that
  // Phase 1's drawers left the typing surface untouched, and they did (Phase 1 is merged). It then read ANY later branch that changes
  // the typing surface as a breach: typing-latency rebuilds the free-edit surface as rows, a declared typing-path change that takes
  // the full pair. Not falsified: expired - the same shape as (D1c) below. Quoted VERBATIM; successor directly below.
  // ok('(D1a) H1: ForwardOnlyEditor.tsx (the typing surface) is byte-identical to main', fo !== null && fo.trim() === '', String(fo));
  // (D1a) successor, post-merge: on main, nothing has touched ForwardOnlyEditor.tsx since the merge base (the base IS HEAD, so the diff
  // is empty); on a branch the diff is REPORTED, not judged - a branch that changes the typing surface takes the full pair.
```

## Record 2 · from drawers-p1.mjs lines 229-236 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in e2acbb1ffed4c5e58d89a396156c117597cc910e

```js
  // SUPERSEDED (item word-diet, Fable, review fix) — baseRef is `git
  // merge-base origin/main HEAD`, computed fresh each run; once word-diet
  // merges, Phase 1's own hunks are already IN origin/main, so this diff
  // shows only whatever landed AFTER it — today, word-diet's own two
  // hunks (the footer line's REMOVE, and "Copy page text" -> "Copy text").
  // Neither touches the typing path either; parked word for word.
  // ok('(D1c) H1: PageEditor.tsx differs from main ONLY by the declared hunks - the drawer wiring, S4\'s one guard line, and S5\'s one replacement of the line-count seed with the per-page typewriter memory (seven removed lines: five in the mount effect and its import, two being the band\'s retired instrument props); no typing-path line is touched',
  //   peDiff !== null && diffConfinedS5(peDiff), String(peDiff).slice(0, 300));
```

## Record 3 · from drawers-p1.mjs lines 259-267 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in b3508224b4429ed810cb246d8dfff100306e98d3

```js
  // ---- PARKED - EXPIRED BY THE MERGE it described (word-diet landed on main as 79a48182) ----
  // This check was BRANCH-RELATIVE: it diffed PageEditor.tsx against `git merge-base origin/main HEAD` and demanded exactly word-diet's own six changed lines. It was green while word-diet was unmerged;
  // once those lines are IN main the merge base is HEAD itself, the diff is empty, and "removed === 6" can never hold again - red on main with nobody having touched the file (neither board-click-to-create
  // nor connector-a changes PageEditor.tsx). Not falsified: expired. Its claim survives, asserted on CONTENT.
  // Quoted VERBATIM below. Successor: the two checks directly below (content, and an empty diff on main).
  // ok('(D1c) [word-diet successor]: PageEditor.tsx differs from origin/main ONLY by word-diet\'s own two declared hunks (the saved-silently footer\'s REMOVE, and "Copy page text" -> "Copy text"); no typing-path line is touched',
  //   peDiff !== null && diffConfinedWD(peDiff), String(peDiff).slice(0, 300));
  // (D1c) successor, post-merge: assert the CONTENT word-diet left, and - on main - that nothing has touched the file since (the merge base IS HEAD, so the diff is empty). On a branch the diff is whatever
  // that branch declares; typing-path branches take the full pair, so the diff is reported, not judged, there.
```

## Record 4 · from drawers-p1.mjs lines 297-333 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in ad74b67e6582b732788a4308466dc08b122f71d4

```js
  // SUPERSEDED (item word-diet, Fable, review fix) — baseRef is `git
  // merge-base origin/main HEAD`, computed fresh each run; S2's own gate
  // is already IN origin/main now (phase1-drawers merged), so `was` (main)
  // ALREADY carries it too — stripping it ONLY from `now` compares a
  // gate-less `now` against a gated `was`, an artificial mismatch the gate
  // itself didn't cause. Word-diet made no change inside this slice at
  // all; parked word for word.
  // ok('(D2b) H3: the Templates block in Sliver.tsx is unchanged from main (whitespace aside) save the ONE declared table gate allowed(\'pageKind\'); with that gate removed it is identical',
  //   gated && now.replace(GATE, '') === was, `${now ? now.length : 0} (gate ${gated}) vs ${was ? was.length : 0}`);
  // SUPERSEDED (help-buttons, Nick approved Oct 12): word-diet's own claim
  // ("changed nothing inside this slice") stops being true the moment
  // ANY later ticket touches the slice for a real reason - this one adds
  // three HelpButton calls (the Templates heading's own "?", and one each
  // for Outline/Title Page). Kept verbatim, no longer run:
  //   ok('(D2b) [word-diet successor]: the Templates block in Sliver.tsx is BYTE-IDENTICAL to origin/main (whitespace aside) — S2\'s own gate is already in both, and word-diet changed nothing inside this slice',
  //     gated && now === was, `${now ? now.length : 0} (gate ${gated}) vs ${was ? was.length : 0}`);
  // SUPERSEDED (help-buttons' own D2c, byte-identical-save-three-gates):
  // PAGE TEMPLATES R2 (the approved templates mockup cursor/templates @
  // 0fc9afef, Fable Oct 16) rebuilds this block on purpose - the icon
  // buttons and the four grayed stand-ins become a five-row picker - so
  // "byte-identical save help-buttons' own three insertions" stopped being
  // true for a reason that has nothing to do with help-buttons. Kept
  // verbatim, no longer run:
  //   const HELP_GATES = [
  //     ' <HelpButton helpKey="helpTemplates" subjectLabel={t(\'railTemplates\')} />',
  //     ' <HelpButton helpKey="helpOutline" subjectLabel={t(\'templateOutline\')} />',
  //     ' <HelpButton helpKey="helpTitlePage" subjectLabel={t(\'templateTitlePage\')} />',
  //   ];
  //   const helpGated = HELP_GATES.every((g) => !!now && now.split(g).length === 2);
  //   const nowStripped = HELP_GATES.reduce((t, g) => t.replace(g, ''), now ?? '');
  //   ok('(D2c) [help-buttons successor]: the Templates block in Sliver.tsx is BYTE-IDENTICAL to origin/main (whitespace aside, pageKind gate already in both) save help-buttons\' own three named insertions; nothing else inside this slice moved',
  //     gated && helpGated && nowStripped === was, `${now ? now.length : 0} (gate ${gated}, help ${helpGated}) vs ${was ? was.length : 0}`);
  // Successor (D2d... renumbered below to avoid colliding with the pointer-
  // events D2d that already exists past this block): page-templates-r2's own
  // structural claim, PLUS help-buttons' own per-row "?" placement merged in
  // on top of it - the two tickets touched the exact same slice for two
  // unrelated reasons, so one check now carries both.
```

## Record 5 · from drawers-p1.mjs lines 418-419 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 7b5b260d892b8cea33ddd34652bae98aa732e977

```js
  // SUPERSEDED (tutor-drawer-mirror round 2) — quoted verbatim:
  // ok('(F3) the chosen tab is a BRASS OUTLINE and nothing else (no fill, no color-mix) - and the drawer\'s own arrow tab stays olive (Nick: the open tab is not a choice)', g.brassOutline && g.arrowStaysOlive, JSON.stringify(g));
```

## Record 6 · from drawers-p1.mjs lines 499-503 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in ffab933362fe7fdd8498c5f3ea80f1d407338c34

```js
  // ---- PARKED - SUPERSEDED by board-context-menu (Fable ruling, Oct 16: "one pop-up for every delete") ----
  // The Page's own in-page confirm ("Send this page to Trash?" with Send to Trash / Keep, focus on Keep) is RETIRED: Delete asks through the ONE standard dialog (Cancel / Delete / "Don't ask me again"), the same as a card, a board and a Drawers row. Esc still cancels the Tags editor (the check below).
  // Quoted VERBATIM below. Successor: the check directly below; scripts/harness/board-context-menu.mjs S1/S3 (the gate) and box-tombstones.mjs T12 (the delete itself is still soft).
  // ok('(I3) DELETE ASKS FIRST, in the page: the Delete button only opens the confirm; the one place that runs onDelete is the "Send to Trash" button; Esc and Keep cancel; focus lands on Keep',
  //   j.asksFirst && j.escCancels && j.focusKeep && j.confirmWords, JSON.stringify(j));
```

## Record 7 · from drawers-p1.mjs lines 568-574 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4924bc1754f8a1bcbe9099fc9a32ee05186f0bf

```js
  // SUPERSEDED IN PART (help-buttons, Nick approved Oct 12): K1's own
  // `inUnion` read the union string drawerLinksNote/-NoteLabel were still
  // part of; both retired (below). Kept verbatim, no longer run:
  //   ok('(K1) the right drawer\'s second tab word is the THEME\'S, from the lexicon: Grafts in Arbor (the canonical theme), Links in Flux',
  //     k.arborWord === 'Grafts' && k.fluxWord === 'Links' && k.inUnion, JSON.stringify(k));
  // Successor: the SAME core claim (the word itself), against the union's
  // own current, accurate shape.
```

## Record 8 · from drawers-p1.mjs lines 576-586 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
  // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): the right drawer's second tab is INPUTS in Flux (the knob is an Input; the verb is connect).
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('(K1 [help-buttons successor]) the right drawer\'s second tab word is the THEME\'S, from the lexicon: Grafts in Arbor (the canonical theme), Links in Flux',
  //   k.arborWord === 'Grafts' && k.fluxWord === 'Links' && inUnionNow, JSON.stringify({ ...k, inUnionNow }));
  // ---- PARKED - SUPERSEDED by #13 step 11 (Fable, Nov 5): drawerLinksEmpty (an empty-pane line nothing renders) is deleted from the lexicon,
  // so the union line no longer carries it. Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('(K1 [flux-v2 successor]) the right drawer\'s second tab word is the THEME\'S, from the lexicon: Grafts in Arbor (the canonical theme), Inputs in Flux',
  //   k.arborWord === 'Grafts' && k.fluxWord === 'Inputs' && inUnionNow, JSON.stringify({ ...k, inUnionNow }));
  // the union line as it stands before step 11's delete, or after it (drawerLinksEmpty gone): either is the same tab-word claim
```

## Record 9 · from drawers-p1.mjs lines 591-600 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4924bc1754f8a1bcbe9099fc9a32ee05186f0bf

```js
  // SUPERSEDED WHOLE (help-buttons): drawerLinksNote/-NoteLabel are DELETED
  // (not emptied) - the Arbor-only/Flux-empty explainer model this check
  // proved is gone, replaced below by helpGrafts (BOTH themes carry text
  // now, through the shared HelpButton, not a per-instance DrawerNote).
  // Kept verbatim, no longer run:
  //   ok('(K2) the "?" note: Nick\'s draft copy for Arbor, in one place; Flux has NO explainer (an empty term, so no "?") and no label',
  //     k.arborNote === NICK_NOTE && k.fluxNote === '' && !!k.arborNoteLabel && k.fluxNoteLabel === '', JSON.stringify(k));
  // The KEY pattern (name immediately followed by a colon), not a bare word
  // match — this file's own comments explain the retirement by naming the
  // old keys in prose, which a bare \bdrawerLinksNote\b would also catch.
```

## Record 10 · from drawers-p1.mjs lines 608-615 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in 6ba919fdc9606dab283aaf745dd002ecff4422e0

```js
  // ---- PARKED - SUPERSEDED by FLUX V2 (Fable's brief, Nick Oct 21): the empty pane reads "Nothing connected yet." in Flux.
  // Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('(K3) the empty pane\'s line follows the theme too (grafted / linked)', k.arborEmpty === 'Nothing grafted yet.' && k.fluxEmpty === 'Nothing linked yet.', JSON.stringify(k));
  // ---- PARKED - SUPERSEDED by #13 step 11 (Fable, Nov 5): drawerLinksEmpty is named by no source (the pane does not render it) and step 11
  // deletes it. Kept VERBATIM below and no longer run; the live successor follows.
  //
  // ok('(K3 [flux-v2 successor]) the empty pane\'s line follows the theme too (grafted / connected)', k.arborEmpty === 'Nothing grafted yet.' && k.fluxEmpty === 'Nothing connected yet.', JSON.stringify(k));
```

## Record 11 · from drawers-p1.mjs lines 623-627 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4924bc1754f8a1bcbe9099fc9a32ee05186f0bf

```js
  // SUPERSEDED (help-buttons): the conditional-on-`linksNote` shape is gone -
  // the "?" now renders unconditionally (helpGrafts always has words in both
  // themes, so the old "an empty term gives none" gate is dead code this
  // ticket removes along with it). Kept verbatim, no longer run:
  //   ok('(K6) the "?" exists ONLY where the theme\'s term has words (an empty term gives none)', m.noteOnlyWhenWords, JSON.stringify(m));
```

## Record 12 · from drawers-p1.mjs lines 635-643 at 61af64b79a894e744ae352c51a8eccc54fae3a29 · parked in d4924bc1754f8a1bcbe9099fc9a32ee05186f0bf

```js
  // SUPERSEDED (help-buttons): K8's own "brass outline" claim described
  // DrawerNote's CSS, which this one call site no longer uses at all (it
  // still reads true, since DrawerNote's OWN css is untouched for its other
  // callers - but it is no longer describing the Grafts/Links tab, so it is
  // a green check about the wrong thing now). Kept verbatim, no longer run:
  //   ok('(K8) it displaces nothing and is not part of the tab: the notes overlay sits OUTSIDE the tablist, ignores the pointer except on the "?", and the open note is an absolutely positioned overlay; open is a brass outline, no fill',
  //     m.outsideTablist && m.overlayInert && m.popOverlay && m.noteOpenOutline, JSON.stringify(m));
  // Successor: the SAME shape of claim, read from the NEW mechanism's own
  // files - HelpButton.tsx/HelpPop.tsx/their CSS, not DrawerNote's.
```
