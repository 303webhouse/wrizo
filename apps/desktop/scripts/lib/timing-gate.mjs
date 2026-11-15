// THE TIMING GATE (bug #47, Fable, Nov 10: "the instrument is fixed, not waved"). A timing line of a latency probe is a reading of THIS machine's clock. On the box it
// is the verdict (it gates). On a GitHub-hosted runner it is information: it prints, with what it would have said, and gates nothing. Every other line of the file keeps
// gating on both machines. One rule, kept here so the probe and its guard read the same function (the guard mutates it).
//   onBox  true on the box (the ordinary case); false when GITHUB_ACTIONS === 'true' (the precedent: flux3-layer.mjs, flux3-s4c.mjs - ON_BOX).
//   pass   what the line's own measure says.
// Returns { pass, info, actual }: `pass` is what the file records (the gate), `info` marks a line that gated nothing, `actual` is what the measure said.
export const isOnBox = (env = process.env) => env.GITHUB_ACTIONS !== 'true';
export const timingGate = (onBox, pass) => (onBox ? { pass: !!pass, info: false, actual: !!pass } : { pass: true, info: true, actual: !!pass });
