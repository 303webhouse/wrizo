// TUTOR-B ITEM 2 — THE SECOND READER (the kit's runner-kit.md section 2, G1 to G8). A separate model call, given the case, her draft, the reply and the marking sheet. It answers each question the case lists, yes or no,
// with one line of why. It is NEVER told which answer is wanted (checks.mjs holds the wanted answers; they never reach the model). Live runs only: this is the one place a model is asked to judge.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const MARKING_SHEET = JSON.parse(fs.readFileSync(path.join(here, 'marking-sheet.json'), 'utf8'));

export function graderSystemPrompt() {
  const rows = MARKING_SHEET.sheet.map((r) => `${r.id}. ${r.question}\n   "yes" looks like: ${r.yesLooksLike}\n   "no" looks like: ${r.noLooksLike}`).join('\n\n');
  return [
    'You are the second reader for a writing aid\'s test set. You are given a test case (what the writer said and the setup), her made-up draft if there is one, and one or more replies from the aid. You answer the numbered questions below that the case lists: yes or no, with one short line of why. You are not told which answer is wanted. Judge the reply as written.',
    MARKING_SHEET.intro,
    'THE MARKING SHEET',
    rows,
    'Reply with JSON only, no other text, in this shape: {"G1":{"answer":"yes|no","why":"one line"}, ...} with one entry for each question asked.',
  ].join('\n\n');
}

export function graderUserPrompt({ c, draftText, replies, questions }) {
  const parts = [
    `CASE ${c.id}: setup "${c.setup}" · hat ${c.hat} · theme voice ${c.voice}${c.variants ? ' (the same case in three themes: compare them)' : ''}`,
    `WHAT SHE SAID: ${c.says}`,
    draftText ? `HER DRAFT:\n<draft>\n${draftText}\n</draft>` : 'HER DRAFT: none',
    ...replies.map((r) => `REPLY${r.variant ? ` (${r.variant})` : ''}:\n<reply>\n${r.reply}\n</reply>`),
    `ANSWER THESE QUESTIONS ONLY: ${questions.join(', ')}`,
  ];
  return parts.join('\n\n');
}

// the second reader's answer -> { G1: { answer, why } }; anything it did not answer cleanly is left out (the case then stays "pending", never silently passed)
export function parseGrade(text, questions) {
  const m = /\{[\s\S]*\}/.exec(text);
  if (!m) return {};
  let j;
  try { j = JSON.parse(m[0]); } catch { return {}; }
  const out = {};
  for (const q of questions) {
    const a = j?.[q];
    const ans = String(a?.answer ?? a ?? '').trim().toLowerCase();
    if (ans === 'yes' || ans === 'no') out[q] = { answer: ans, why: String(a?.why ?? '').slice(0, 300) };
  }
  return out;
}
