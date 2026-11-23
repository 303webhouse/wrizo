// FLUX3 S1 - A CARD AS A NODE RECORD (the spec's §4 "Nodes as records": header NODE 0x... + kind, footer n LINKS + CHECKSUM OK when lit).
// The same card, data and geometry as every theme: the record is an OVERLAY on the card's own box (absolutely placed, its header standing just
// above the card's top edge and its footer just below its bottom), so it adds no height and the board's measure never sees it (a skin changes
// only the skin: a card's stored h is the reflow's, and it must not move under the flag). Its words are painted from data attributes by CSS, so
// they are never the card's text: not selected, copied, counted, exported or read by a screen reader (the overlay is aria-hidden).
// Colour (q3): a doc node (a pinned page) is outlined in cyan, never orange; a dealt preset step in lime; the LAST-touched node wears the orange
// bar (lastTouched.ts: derived in-session, nothing stored).
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { Box } from '../types/board';
import { useTheme } from '../store/theme';
import { useDeskLexicon } from '../store/deskLexicon';
import { DECKS } from '../decks/library';
import { useAmbianceDial } from '../store/ambianceDial';
import { touchNode, useLastTouched } from './lastTouched';
import { splitCard } from '../store/guided';
import { getJournalEntry } from '../store/persistence';
import { firstLine } from '../store/entryText';

/** A node's address: four stable hex digits from its id (the same card reads the same address on every open). */
export function nodeHex(id: string): string {
  let h = 7;
  for (let i = 0; i < id.length; i++) h = (Math.imul(h, 31) + id.charCodeAt(i)) >>> 0;
  return (h & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

interface Props {
  box: Box;
  /** The board's same-board links (its 'connection' boxes). */
  connections: Box[];
  /** This card's page / board / other-board links (the footer's CONNECTOR-B peers), if any. */
  peers?: readonly unknown[];
}

/** A doc node's title (Fable, Nov 21, 11:55 pm): the page's own name when it has one (pageSettings.name, as the Parts list and publishing read it), else its first line. */
function docTitle(entryId: string): string {
  const e = getJournalEntry(entryId);
  return (e?.pageSettings?.name ?? '').trim() || firstLine(e?.text ?? '').trim();
}

export function FluxNodeRecord(props: Props) {
  const theme = useTheme();
  return theme === 'flux' ? <NodeRecord {...props} /> : null;
}

function NodeRecord({ box, connections, peers }: Props) {
  const { t } = useDeskLexicon();
  const last = useLastTouched();
  const dial = useAmbianceDial();

  // the writer's hand on this card: its words, its place, an ink stroke, a hand-sized edge (never the reflow's fit, which changes only an
  // auto card's height); the first sight of a card is not a touch
  const sig = `${box.text ?? ''}\u0000${box.x},${box.y}\u0000${box.strokes?.length ?? 0}\u0000${box.sizedByHand ? `${box.w},${box.h}` : ''}`;
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current !== null && seen.current !== sig) touchNode(box.id);
    seen.current = sig;
  }, [sig, box.id]);

  const kind = box.kind === 'page-pin' ? 'doc' : box.kind === 'ink' ? 'ink' : box.deckStep ? 'preset' : 'text';
  // the card carries the preset mark for the lime first line (flux-v3.css). It was a :has() on the card, and that one rule made the first key in ANY Flux page restyle the whole document (Nov 23, KL-FLIP-flux)
  const recordRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const card = recordRef.current?.closest('.board-box');
    if (!card || kind !== 'preset') return undefined;
    card.setAttribute('data-flux3-preset', '');
    return () => card.removeAttribute('data-flux3-preset');
  }, [kind]);
  const deck = box.deckStep ? DECKS.find((d) => d.id === box.deckStep?.deck) : undefined;
  const kindWord = kind === 'doc' ? t('linksKindPage')
    : kind === 'ink' ? t('inkModeInk')
      : kind === 'preset' ? (deck ? `${t('flux3KindPreset')} · ${t(deck.nameTerm)}` : t('flux3KindPreset'))
        : t('inkModeText');
  const n = connections.filter((c) => c.connA === box.id || c.connB === box.id).length + (peers?.length ?? 0);
  // S4b L6 - THE NODE VOICE (the board mockup's .ft .st): the footer's status theatre, under the Ambiance dial only (0 takes it away), and never on a node she lit, whose
  // CHECKSUM OK is her act and stands in its place. Painted from a data attribute like the rest of the record, so it is never the card's text.
  const theatre = dial > 0 && !box.lit ? (kind === 'ink' ? t('flux3TheatreInk') : t('flux3TheatreHuman')) : undefined;
  // S4b L6, THE TITLE ROW (Fable, Nov 21, 11:20 pm, reading A; the Wrizors: its own row outside the card's text, the mockup's .ttl): only where a title already exists,
  // a dealt step's (its card's title, store/guided.ts splitCard: the step's name) and a doc node's (its page's first line). Painted from data-title above the header,
  // one line, so it is never the card's text and no card moves (S1). Plain text and ink nodes carry none.
  const title = kind === 'preset' ? splitCard(box.text).title.trim()
    : kind === 'doc' && box.entryId ? docTitle(box.entryId) : '';
  return (
    <span ref={recordRef} className="flux3-node" data-node-kind={kind} data-last={last === box.id ? 'true' : undefined} aria-hidden="true">
      {title && <i className="flux3-node-t" data-flux3-node-title="" data-title={title} />}
      <i className="flux3-node-h" data-addr={`${t('linksKindCard').toUpperCase()} 0x${nodeHex(box.id)}`} data-kind-word={kindWord} />
      <i className="flux3-node-f" data-links={`${n} ${n === 1 ? t('flux3LinkOne') : t('flux3LinkMany')}`} data-ok={box.lit ? t('flux3ChecksumOk') : undefined} data-st={theatre} />
    </span>
  );
}
