# Rulings: `apps/desktop/src/store/firstRun.ts`

Ruling histories moved verbatim out of the source by #13 step 9 (Fable's comment ruling, Oct 29). A comment in the
source that cites `[firstRun §n]` points here.

## firstRun §1

From `apps/desktop/src/store/firstRun.ts`, line 36 at `7f1c6a84` (the comment that stays: "the first-run ritual runs once per ACCOUNT: a register here is a first run; signed out, the flag decides; a sign-in only when the first whole-account pull completed and the account holds no work (not knowing is never a reason)").

```ts
// B10.1 - THE RITUAL RUNS ONCE PER ACCOUNT, EVER (Nick's ruling). The flag above is only this device's memory of it, and a
// device's memory is the wrong unit: a sign-out, a second device or a fresh profile would otherwise show an existing writer
// the 100-word gate again. So the verdict is derived from the ACCOUNT, with no schema change:
//   - a successful REGISTER on this device is a first run, whatever the flag says (a new account on a used device gets it);
//   - signed out (local-first writing, no account): the flag alone decides, as before;
//   - a sign-in is a first run ONLY if the session's first whole-account pull has completed AND the account holds no work
//     (no non-system entry, no project). A pull that is capped or failed is NOT a first run: not knowing is never a reason to
//     put a returning writer through the gate. If the account does hold work, the flag is set so it cannot return.
```
