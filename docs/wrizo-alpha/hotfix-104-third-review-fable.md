# Item 104, third pass — review (Fable), read at raw bytes, offer
8e75e60

VERDICT: PASS. Both settings 60/60 CLEAN on the identical bundle
(index-CaW0zodg.js/531457b, tree e5f3f25), the new hooks-order
guard among them.

THE FIX IS PLACED WHERE THE INVARIANT HOLDS. PageEditorView's
guard now sits BELOW useCascade — every hook above, the decision
below — and the comment states why the two earlier passes did not
close it: lifting this ticket's own hooks left useCascade behind,
and the dispatcher decision only helps when the PARENT re-renders;
a child-local re-render never consults the parent. Both prior
fixes are kept, not reverted — the dispatchers still unmount on a
vanished page (the tombstone path, proven red pre-fix) and the
view is now internally safe. Belt and braces, each argued.

THE MECHANISM IS MEASURED, NOT NAMED: UnbornProvider registers the
slot during RENDER (useMemo) and tears it down in an EFFECT
CLEANUP; StrictMode cycles effects while preserving memo state, so
the cleanup wins and the memo cannot re-run. Dev-only by
construction — which also RECONCILES the two desks' opposite
cold-load reports at the same bundle. That open closes with this
ticket, append-style, neither report overwritten.

THE GUARD IS THE DURABLE PRIZE, and it is the general form: 145
files, every function-declared component and custom hook. Its
census found THREE violations and only one was the reported
surface — ScriptEditor carried the identical fault and is the
room the doorway sends writers INTO, so the reported-instance fix
would have MOVED the crash. Its allowlist is one deliberate,
reasoned entry (JournalEntry.tsx, unrouted since FX14, with the
instruction to delete the line first if it is ever re-routed), and
a second check asserts the allowlist still describes only unrouted
surfaces. Blind spots are written into the file: arrow-defined
components unparsed (exactly one exists today, hookless — the gap
EMPTY BUT STRUCTURAL), multi-line early returns unmatched, line
scanner not AST. The AST form stays owed to item 109.

ELEVATED AS STANDING HARNESS LAW, the lane's own wording: "'nothing
threw' is not a verdict; 'the writer sees the page' is." The
intermediate state that almost shipped — crash gone, #/page/new
redirecting to Arrival — would have passed any absence-of-error
check and was caught only because the probe asserts a VISIBLE
outcome. Binds every future check.

OBS (non-blocking, next touch): the guard's FNSTART regex matches
`function Name(` and its early-return regex requires exactly
two-space indentation — so a component nested inside another
function, or one written with different indentation, is scanned
under the wrong owner or not at all. Consistent with the file's
own "line scanner, not an AST pass," and subsumed by item 109's
AST form; worth naming in that charter alongside the two blind
spots already listed.

RISK CARRIED FORWARD, the lane's own: "the reported surface is
the whole fault" is DISPROVEN for this class (three reopens,
three times narrower than the fault), and the production suite
still cannot express this failure mode — a dev-serve check is the
only instrument that reaches it until item 109's charter is built.

— Fable, 2026-08-25
