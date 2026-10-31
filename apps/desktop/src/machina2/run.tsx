import { useEffect, useState } from 'react';
import { useWritingSettings } from '../store/writingSettings';
import { goalCount, useWritingGoal } from '../store/writingGoal';
import { prefersReducedMotion, useAmbianceDial } from '../store/ambianceDial';
import { useGoalProgress } from '../components/WritingIncentives';
import { getJournalEntry, getJournalEntries } from '../store/persistence';
import { getRunUnit, isOn, subscribeSwitches } from './switches';
import { readoutLine, partsCovered } from './readout';

// MACHINA v2 MOCKUP - §7 THE RUN and §8.2 THE READOUT BAR, under the flag (components/RunStrip.tsx hands over to this; off the flag RunStrip is
// byte-for-byte today's). What changes, and why:
//   - "NO GOAL SET" SHOWS AN EMPTY RUN WITH THE FIRST UNIT NOTCHED (spec §7): the Run is drawn without a goal too, as an empty instrument.
//   - ONE CELEBRATION IN BOTH CASTS (Fable ruling 6): NEUTRAL's sparks retire; the batch closing grey-to-brass is the only one.
//   - THE "PARTS" UNIT (ruling 3: a Part counts as covered once it has any words): with the mockup's Run unit on Parts, on a page that belongs to
//     a Project, the twenty units read the share of the Project's manuscript pages that have words ("2 / 4 parts"); a loose File has no Parts,
//     so the Run stays in words there. The unit is the writer's pick (in session; storage is Nick's call).
//   - THE READOUT BAR replaces the plain count with true facts (readout.ts), Plex Mono, quiet grey - while its switch is on.
//   - The Run strip's own switch hides the strip (the readout stays).
// Motion: none but the strip's fill (the existing .35s handoff); reduced motion / Ambiance 0 keep the still state. Nothing is stored.
const UNITS = 20;

function useSwitchTick(): void {
  const [, tick] = useState(0);
  useEffect(() => subscribeSwitches(() => tick((x) => x + 1)), []);
}

/** The page on screen, its Project's manuscript pages in order, and the words in each (the live text for this one). */
function projectParts(text: string): { index: number; words: number[] } | null {
  const id = (/#\/page\/([^/?#]+)/.exec(window.location.hash) || [])[1];
  if (!id) return null;
  const entry = getJournalEntry(decodeURIComponent(id));
  if (!entry || !entry.projectId) return null;
  const parts = getJournalEntries()
    .filter((e) => e.projectId === entry.projectId && (e.pageType == null || e.pageType === 'manuscript'))
    .sort((a, b) => (a.orderIndex ?? Number.MAX_SAFE_INTEGER) - (b.orderIndex ?? Number.MAX_SAFE_INTEGER) || String(a.createdAt).localeCompare(String(b.createdAt)));
  const index = parts.findIndex((e) => e.id === entry.id);
  if (index < 0) return null;
  const count = (t: string) => goalCount(t, { n: 1, unit: 'words' });
  return { index, words: parts.map((e) => (e.id === entry.id ? count(text) : count(e.text || ''))) };
}

export function MachinaRun2({ text }: { text: string }) {
  useSwitchTick();
  const settings = useWritingSettings();
  const goal = useWritingGoal();
  const dial = useAmbianceDial();
  const n = goal?.n ?? 0;
  const count = goal ? goalCount(text, goal) : 0;
  const { frac, celebrating } = useGoalProgress(count, n);
  if (!(settings.instrumentsOn && settings.progress === 'words')) return null;

  const words = goalCount(text, { n: 1, unit: 'words' });
  const parts = projectParts(text);
  const byParts = getRunUnit() === 'parts' && !!parts && parts.words.length > 0;
  const hasGoal = goal != null && n > 0;
  let done = 0, here = 0, closed = false, label: string | null = null;
  if (byParts && parts) {
    const [covered, total] = partsCovered(parts.words);
    done = Math.min(UNITS, Math.floor((covered / total) * UNITS));
    closed = covered === total;
    here = closed ? UNITS - 1 : done;
    label = `${covered} / ${total} parts`;
  } else if (hasGoal) {
    closed = celebrating;
    done = celebrating ? UNITS : Math.min(UNITS, Math.floor(frac * UNITS));
    here = celebrating ? UNITS - 1 : done;
    label = `${celebrating ? n : count % n} / ${n}`;
  }
  const still = prefersReducedMotion() || dial === 0;
  const line = readoutLine(words, parts ? [parts.index + 1, parts.words.length] : null, hasGoal ? goal : null, count);
  return (
    <div className="machina-run machina2-run" data-closed={closed ? 'true' : 'false'} data-still={still ? 'true' : 'false'} data-unit={byParts ? 'parts' : 'words'} data-goal={hasGoal ? 'set' : 'none'}>
      {isOn('run') && (
        <div className="machina-run-strip" role="img" aria-label={label ? `Run: ${label}` : 'Run: no goal set'}>
          {Array.from({ length: UNITS }, (_, i) => (
            <i key={i} className={`${i < done ? 'on' : ''}${i === here ? ' here' : ''}`.trim() || undefined} data-unit={i} />
          ))}
        </div>
      )}
      {isOn('readout')
        ? <div className="machina2-readout" aria-label="Readout">{line}{byParts && label ? ` · ${label}` : ''}</div>
        : label && <div className="machina-run-count">{label}</div>}
    </div>
  );
}
