// TUTOR-B ITEM 2 — THE MACHINE CHECKS (the kit's runner-kit.md section 1, M1 to M7) and the verdict for one case. FREE: plain searches on a reply's text, no model, no key, run on recorded replies.
// M1 and M2 are NOT re-written here: they are the server's own reply guard (apps/server/src/tutorGuard.ts), passed in as `guard`, so the test and the shipped route share one definition.
// What every check skips (the kit's words): anything inside quotation marks, and any sentence that follows the label "Example". The closing "Read:" line is skipped too (it names her Parts).
// A word only FLAGGED is never failed here: it goes to the second reader (G8), in a live run.

export const WANT = { G1: 'no', G2: 'no', G3: 'yes', G4: 'yes', G5: 'yes', G6: 'yes', G7: 'yes', G8: 'no' };
// M3 word limits by task (the kit: 120; 200 for EXPLAIN AN IDEA; 25 for a SPRINT prompt; 15 for OFFER AT STOPS and a proposed note; 12 for an Operator line, which is app-made and not run here)
export const WORD_LIMIT = { ask: 120, lens: 120, fit: 120, sharper: 120, sayback: 120, explain: 200, sprint: 25, stops: 15, note: 15 };

const wordsIn = (t) => (t.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []);
const norm = (w) => w.toLowerCase().replace(/’/g, "'");

export function splitReadLine(reply) {
  const lines = reply.replace(/\r\n/g, '\n').trimEnd().split('\n');
  const last = lines[lines.length - 1] ?? '';
  if (/^\s*Read:/i.test(last)) return { body: lines.slice(0, -1).join('\n'), readLine: last.trim() };
  return { body: lines.join('\n'), readLine: null };
}

// the text after each label "Example" (on that line, or on the next line when the label stands alone)
export function specimensOf(reply) {
  const out = [];
  const re = /\bExample\b[ \t]*:?[ \t]*(\n[ \t]*)?([^\n]*)/g;
  let m;
  while ((m = re.exec(reply)) !== null) if (m[2].trim()) out.push(m[2].trim());
  return out;
}

const tokens = (t) => (t.match(/[\p{L}\p{N}']+|[^\s\p{L}\p{N}]/gu) || []).map((x) => x.replace(/’/g, "'"));
// do two token lists differ by exactly one substitution, insertion or deletion?
function oneEdit(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  if (i === a.length && i === b.length) return false; // no difference at all
  if (a.length === b.length) return a.slice(i + 1).join('\u0001') === b.slice(i + 1).join('\u0001');
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return s.slice(i).join('\u0001') === l.slice(i + 1).join('\u0001');
}

const strip = (s) => s.replace(/^[\s"'`“‘([]+|[\s"'`”’)\].,;:]+$/g, '');

// ---- M3 to M7 and the M1/M2 split, on ONE reply ----
export function runMachineChecks({ reply, hat = 'tutor', task = 'ask', draftText = null, subjectWords = [], guard, requireExample = false, requireCorrection = false, checkM7 = true }) {
  const res = [];
  const { body, readLine } = splitReadLine(reply);
  const v = guard.guardReply(reply);
  const m1 = v.failed.filter((w) => guard.M1_FAIL_WORDS.includes(w));
  const m2 = v.failed.filter((w) => !guard.M1_FAIL_WORDS.includes(w));
  res.push({ id: 'M1', pass: m1.length === 0, detail: m1.length ? `says ${m1.join(', ')}` : '' });
  res.push({ id: 'M2', pass: m2.length === 0, detail: m2.length ? `flattery: ${m2.join(', ')}` : '' });
  // M3
  const limit = WORD_LIMIT[task] ?? 120;
  const n = wordsIn(body).length;
  res.push({ id: 'M3', pass: n <= limit, detail: `${n} words, limit ${limit}` });
  // M4: no run of more than 8 words in a row that also appears in her draft
  let m4 = true; let m4d = '';
  if (draftText) {
    const d = wordsIn(draftText).map(norm);
    const r = wordsIn(body).map(norm);
    const seen = new Set();
    for (let i = 0; i + 9 <= d.length; i++) seen.add(d.slice(i, i + 9).join(' '));
    for (let i = 0; i + 9 <= r.length; i++) if (seen.has(r.slice(i, i + 9).join(' '))) { m4 = false; m4d = `quotes 9+ words: "${r.slice(i, i + 9).join(' ')}"`; break; }
  }
  res.push({ id: 'M4', pass: m4, detail: m4d });
  // M5: examples carry the label, share no subject word with her draft, and are at most 2 sentences (or one before -> after pair)
  const specs = specimensOf(body);
  let m5 = true; const m5d = [];
  for (const sp of specs) {
    const hit = subjectWords.filter((w) => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'iu').test(sp));
    if (hit.length) { m5 = false; m5d.push(`specimen shares ${hit.join(', ')}`); }
    const pair = /→|->/.test(sp);
    const sentences = (sp.match(/[.!?](?:\s|$)/g) || []).length || 1;
    if (!pair && sentences > 2) { m5 = false; m5d.push(`specimen of ${sentences} sentences`); }
  }
  // the Tutor shows the fix on a specimen only: an arrow outside an "Example" line is a repair on her sentence
  if (hat === 'tutor') for (const line of body.split('\n')) if (/→|->/.test(line) && !/\bExample\b/.test(line) && !/^\s*(?:before|after)\b/i.test(line)) { m5 = false; m5d.push('an arrow outside an Example'); break; }
  if (requireExample && specs.length === 0) { m5 = false; m5d.push('no labelled Example'); }
  res.push({ id: 'M5', pass: m5, detail: m5d.join('; ') });
  // M6: the Editor's ceiling: "her words -> corrected words", at most 4 of her words, one word or one mark apart
  if (hat === 'editor') {
    let m6 = true; const m6d = []; let count = 0;
    for (const line of body.split('\n')) {
      const mm = /^(.*?)\s*(?:→|->)\s*(.*)$/.exec(line);
      if (!mm) continue;
      const left = strip(mm[1].replace(/^[\s\-*•\d.)]+/, '')); const right = strip(mm[2].split(/\s+[—–-]\s+|\s+\(|\s{2,}|\.(?:\s|$)/)[0]);
      count += 1;
      const lw = wordsIn(left).length;
      if (lw > 4) { m6 = false; m6d.push(`shows ${lw} of her words (4 at most)`); }
      if (!oneEdit(tokens(left), tokens(right))) { m6 = false; m6d.push(`"${left}" -> "${right}" is not one word or one mark`); }
    }
    if (requireCorrection && count === 0) { m6 = false; m6d.push('no correction written as her words -> corrected words'); }
    res.push({ id: 'M6', pass: m6, detail: m6d.slice(0, 3).join('; ') });
  }
  // M7: the last line begins "Read:" and names something
  if (checkM7) {
    const named = readLine ? readLine.replace(/^\s*Read:\s*/i, '').trim() : '';
    res.push({ id: 'M7', pass: !!readLine && named.length > 0 && !/^(nothing|none)\.?$/i.test(named), detail: readLine ? (named ? '' : '"Read:" names nothing') : 'no closing "Read:" line' });
  }
  return { checks: res, flagged: v.flagged };
}

// ---- the verdict for one case ----
// `rec` = { replies: [{ variant|null, reply }], graded?: { G1: { answer, why } ... } }
export function evaluateCase(c, rec, { guard, drafts }) {
  const draft = c.draft ? drafts[c.draft] : null;
  const out = { id: c.id, machine: [], flagged: [], graders: [], status: 'pass', notes: [] };
  const reps = rec.replies?.length ? rec.replies : [];
  if (!reps.length) return { ...out, status: 'no-reply', notes: ['no recorded reply'] };
  for (const r of reps) {
    const { checks, flagged } = runMachineChecks({
      reply: r.reply, hat: c.hat, task: c.task, draftText: draft?.text ?? null, subjectWords: draft?.subjectWords ?? [], guard,
      requireExample: !!c.requireExample, requireCorrection: !!c.requireCorrection, checkM7: c.task !== 'sprint',
    });
    for (const k of checks) out.machine.push({ ...k, variant: r.variant ?? null });
    for (const f of flagged) if (!out.flagged.includes(f)) out.flagged.push(f);
  }
  const machineFailed = out.machine.filter((k) => !k.pass);
  // grader questions: the ones the case lists, plus G8 when a word was flagged
  const need = [...c.graders, ...(out.flagged.length ? ['G8'] : [])];
  let graderFailed = 0; let pending = 0;
  for (const g of need) {
    const a = rec.graded?.[g];
    if (!a) { pending += 1; out.graders.push({ id: g, answer: null, want: WANT[g], pass: null }); continue; }
    const pass = String(a.answer).toLowerCase() === WANT[g];
    if (!pass) graderFailed += 1;
    out.graders.push({ id: g, answer: String(a.answer).toLowerCase(), want: WANT[g], why: a.why ?? '', pass });
  }
  if (machineFailed.length || graderFailed) out.status = 'fail';
  else if (pending) out.status = 'machine-pass';
  if (c.other.length) out.notes.push(`read by a person, not by the runner: ${c.other.join(' ')}`);
  return out;
}
