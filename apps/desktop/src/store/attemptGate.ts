// A request that can be superseded: only the NEWEST attempt may act on its result. Two guest links opened in quick
// succession race; if the older one's answer arrives last it must not win (the wrong account, or its refusal laid over
// the newer link's success). Pure and dependency-free, so a proof runs the exact thing the component uses.
//
// An attempt counter, not a cancel flag set in an effect's cleanup: that cleanup also runs on React StrictMode's simulated
// unmount, which would cancel the only in-flight request of an effect that (by design) does not run twice.
export function createAttemptGate() {
  let current = 0;
  return {
    /** Start a new attempt. Every earlier attempt is stale from this moment. */
    begin(): number { current += 1; return current; },
    /** True only for the most recently begun attempt. */
    isCurrent(attempt: number): boolean { return attempt === current; },
  };
}
