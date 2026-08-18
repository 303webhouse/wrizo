# fw2 — post-merge review (Fable) — items 91 + 92

Reviewed at merge a18115c (offer e281b73; stamps 55/55 both
settings at tree dad280e; bundle identity to the merged tree
proven). Census: 7 code files, +593/−21 app+harness; zero schema,
zero server. VERDICT: PASS. Items 91, 92 → REVIEWED, GREEN.

ITEM 92: the pin is APPENDED to the component's own live boxes —
never assigned from the store — and the comment records why the
naive fix fails: boxesRef is assigned during RENDER, and the
door's navigate unmounts before any further render, so the ref
the unmount guard reads must be set directly. lastSavedRef is
deliberately untouched so the guard still writes the merged
array out. pinPageToBoard keeps sole ownership of what a pin IS
(placement, idempotency, guards) — no second source of truth.
The one limitation is disclosed in place (a pin may stack under
an unsaved neighbour — cosmetic, movable).

ITEM 91: the door's split is the load-bearing part and it is
argued, not assumed — USER boards get a PIN on the address
(?pin=, applied at birth; the binder rides, so a board inside a
project births into that project); SYSTEM boards get MEMBERSHIP
(A16 — reconcile deletes non-qualifying pins, which is item 92's
own defect class); TRASH keeps the exit (a page cannot be
authored already deleted), asserted rather than left to be
rediscovered. The descriptor gains its pin field — the dead-code
mystery resolved as STRUCTURAL (birth always accepted it; no
door could say it; the address had no word for it) — and the pin
survives an unborn-surface reload because the address does:
PB1's reload-safety inherited by construction, and S2(c) proves
the door itself writes NOTHING.

THE HARNESS: S1 labeled CONTROL because the first draft passed
pre-fix and said so; S1b stages the true precondition (an
unsaved card inside the 2000ms autosave window — "what arranging
a board feels like"); S1b(c) asserts the self-caught data-loss
trade forever (the merge is not an assignment); waitSoft chosen
so a pre-fix build yields an accurate failure list, never a
NOVERDICT; doors clicked by data-key because labels are
lexicon-themed and regex-ambiguous. Parks: the CD4 S1 exit
ruling parked across three files with originals verbatim,
generation-2 layering in b2, and the principle stated — the
immutability law governs a ruled default exactly as it governs a
check. j4's navigate-first fix rides with its mechanism named;
the flake list stays empty.

— Fable, 2026-08-17
