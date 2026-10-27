import { Fragment } from 'react';
import { useDeskLexicon } from '../store/deskLexicon';
import { gapsOf } from '../store/deckRewards';
import type { Box } from '../types';

// W5 - THE GAPS LINE, in the Deck's header (brief section 1; frames 02-walk-arbor / 02-trace-flux). Arbor: "Nothing yet: Midpoint Reversal · Darkest Point · Final Image" - muted text, the step names in olive. Flux: the
// `STACK <name>` readout and `NO SIGNAL: MIDPOINT REVERSAL · DARKEST POINT …`. NAMES, never a count: at most three, then an ellipsis; no "N left", no percentage, no verdict - and when every step is kindled the line simply
// disappears (Flux keeps only its STACK name). Pressing a name jumps to that step: in the Walk the card comes up, in Open the board scrolls to it and focuses it (the board decides how; this draws and reports).
// ONE LINE, NEVER WRAPPING (the stylesheet's W5 zone ellipsizes it): the header row's height cannot change when the line appears or goes, so nothing below it - the page - ever moves. Computed from kindled() only (the
// caller hands it the kindled set), so it needs no data. It is a quiet fact, not a prompt: nothing about it animates, and it never speaks first.

export interface DeckGapsProps {
  order: readonly Box[];
  kindledIds: ReadonlySet<string>;
  /** The current step's index in the Walk; -1 in Open (no current step: the line reads from the first). */
  fromIndex: number;
  /** The Deck's name (Flux's STACK line). */
  deckName: string;
  flux: boolean;
  onJump: (boxId: string) => void;
}

export function DeckGaps(p: DeckGapsProps) {
  const { t } = useDeskLexicon();
  const line = gapsOf(p.order, p.kindledIds, p.fromIndex);
  if (!line && !p.flux) return null;
  return (
    <div className="deck-gaps" data-flux={p.flux ? 'true' : 'false'} data-deck-gaps="true" role="group" aria-label={t('gapsLead')}>
      {p.flux && p.deckName && <span className="deck-stack">{t('deckStack')} {p.deckName}</span>}
      {line && (
        <>
          <span className="deck-gaps-lead">{t('gapsLead')}</span>
          {line.names.map((g, i) => (
            <Fragment key={g.id}>
              {i > 0 && <span className="deck-gaps-sep" aria-hidden="true">{'\u00b7'}</span>}
              <button type="button" className="deck-gap" data-gap-id={g.id} onClick={() => p.onJump(g.id)}>{g.name}</button>
            </Fragment>
          ))}
          {line.more && <span className="deck-gaps-more" aria-hidden="true">{'\u2026'}</span>}
        </>
      )}
    </div>
  );
}
