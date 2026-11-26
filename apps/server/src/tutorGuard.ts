// TUTOR-B ITEM 3 — THE REPLY GUARD (the TUTOR-B kit: rules-of-the-road R6 and R7, runner-kit.md section 1, checks M1 and M2). Two plain word searches, run on the server on every chat reply BEFORE she sees it.
// A reply that says "I" (M1) or flatters (M2) is asked for again once (tutor.ts); if it fails twice she sees FALLBACK_LINE. These are the kit's lists, exactly. The test runner (apps/server/scripts/tutor-eval)
// imports this same file, so the machine checks it runs are the ones the server runs.
//
// What every check skips (the kit's words): anything inside quotation marks, and any sentence that follows the label "Example". Those hold her words or a specimen, not the aid's own voice.
// One more skip, ours: the closing "Read:" line, which names her Parts and assets (a Part called "My Story" is hers, not the aid speaking).
// A word on the FLAG lists is never failed here: it goes to the second reader (G8) in the test runner, where "a great deal of the scene" can be told from praise.

// the plain line she sees when a reply broke a machine check twice (the kit, prompts.md section 8: written by people, never by the aid)
export const FALLBACK_LINE = 'No answer this time. Try asking again.';

// M1 · never "I". FAILS on any of these as whole words. Case: "I" and its contractions in capital I; "me, my, myself, we, our, ours" in any case; "us" in lower case or capitalised, never all-capitals ("US" passes).
export const M1_FAIL_WORDS = ['I', "I'm", "I've", "I'd", "I'll", 'me', 'my', 'myself', 'we', "we're", "we've", 'our', 'ours', 'us'] as const;
// flagged for the second reader, not failed (it can be a noun)
export const M1_FLAG_WORDS = ['mine'] as const;

// M2 · no flattery or small talk. FAILS on these phrases.
export const M2_FAIL_PHRASES = [
  'well done', 'good job', 'great job', 'nice work', 'nicely done', 'great question', 'love this', 'love the', 'love how', 'thank you', "you're welcome", 'happy to', 'glad to', 'pleased to',
  'hope this helps', 'feel free', 'let me know', 'good luck', 'no problem', 'of course',
] as const;
// flagged for the second reader, not failed (a flagged word can be innocent: "a great deal of the scene")
export const M2_FLAG_WORDS = ['great', 'amazing', 'wonderful', 'beautiful', 'brilliant', 'excellent', 'fantastic', 'lovely', 'perfect', 'impressive', 'stunning', 'sorry', 'thanks', 'hello', 'hi', 'hey', 'proud', 'congratulations'] as const;

// a word is "whole" when no letter, digit, underscore or apostrophe touches it
const L = "(?<![\\p{L}\\p{N}_'’])";
const R = "(?![\\p{L}\\p{N}_'’])";
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apos = (w: string): string => esc(w).replace(/'/g, "['’]");
const wordRe = (w: string, flags: string): RegExp => new RegExp(`${L}${apos(w)}${R}`, flags);
const phraseRe = (p: string): RegExp => new RegExp(`${L}${apos(p).replace(/ /g, '\\s+')}${R}`, 'iu');

const M1_RES: Array<[string, RegExp]> = M1_FAIL_WORDS.map((w): [string, RegExp] => {
  if (w === 'I' || w.startsWith("I'")) return [w, wordRe(w, 'u')]; // capital I only
  if (w === 'us') return [w, new RegExp(`${L}[Uu]s${R}`, 'u')]; // "US" passes
  return [w, wordRe(w, 'iu')];
});
const M2_RES: Array<[string, RegExp]> = M2_FAIL_PHRASES.map((p): [string, RegExp] => [p, phraseRe(p)]);
const FLAG_RES: Array<[string, RegExp]> = [...M1_FLAG_WORDS, ...M2_FLAG_WORDS].map((w): [string, RegExp] => [w, wordRe(w, 'iu')]);

// the text the checks read: the reply without its closing "Read:" line, without quoted text, and without the sentence(s) after an "Example" label
export function textTheChecksRead(reply: string): string {
  let t = reply.replace(/\r\n/g, '\n');
  // the closing "Read:" line (the last line that begins "Read:")
  t = t.replace(/\n?[ \t]*Read:[^\n]*\s*$/i, '');
  // quoted text: straight pairs and curly pairs
  t = t.replace(/"[^"\n]*"/g, ' ').replace(/“[^”]*”/g, ' ');
  // the label "Example" and what follows it on that line (or, when the label stands alone, on the next line)
  t = t.replace(/\bExample\b[ \t]*:?[ \t]*(?:\n[ \t]*)?[^\n]*/g, ' ');
  return t;
}

export interface GuardVerdict {
  ok: boolean;
  /** the M1 words and M2 phrases that failed (empty when ok) */
  failed: string[];
  /** words only flagged for the second reader; never fail a reply here */
  flagged: string[];
}

// NEVER AN EMPTY OR A CUT-OFF ANSWER (Fable, Nov 25, 5:08 pm). A reply with no text, or one the model stopped at the token cap, fails the guard like a bad word does: asked again once, then the fallback line. It is a
// separate function because it reads how the call ENDED, not the words; the test runner records stop reasons and counts these itself.
export function unfinishedReply(text: string, stopReason: string | null | undefined): boolean {
  return !text.trim() || stopReason === 'max_tokens';
}

export function guardReply(reply: string): GuardVerdict {
  const t = textTheChecksRead(reply);
  const failed: string[] = [];
  for (const [w, re] of M1_RES) if (re.test(t)) failed.push(w);
  for (const [p, re] of M2_RES) if (re.test(t)) failed.push(p);
  const flagged: string[] = [];
  for (const [w, re] of FLAG_RES) if (re.test(t)) flagged.push(w);
  return { ok: failed.length === 0, failed, flagged };
}
