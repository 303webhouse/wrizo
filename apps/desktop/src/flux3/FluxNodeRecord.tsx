// FLUX3 S1 - A CARD AS A NODE RECORD (the spec's §4 "Nodes as records": header NODE 0x... + kind, footer n LINKS + CHECKSUM OK when lit).
// The same card, data and geometry as every theme: the record is an OVERLAY on the card's own box (absolutely placed, its header standing just
// above the card's top edge and its footer just below its bottom), so it adds no height and the board's measure never sees it (a skin changes
// only the skin: a card's stored h is the reflow's, and it must not move under the flag). Its words are painted from data attributes by CSS, so
// they are never the card's text: not selected, copied, counted, exported or read by a screen reader (the overlay is aria-hidden).
// Colour (q3): a doc node (a pinned page) is outlined in cyan, never orange; a dealt preset step in lime; the LAST-touched node wears the orange
// bar (lastTouched.ts: derived in-session, nothing stored).
import { useEffect, useRef } from 'react';
import type { Box } from '../types/board';
import { useTheme } from '../store/theme';
import { useDeskLexicon } from '../store/deskLexicon';
import { DECKS } from '../decks/library';
import { touchNode, useLastTouched } from './lastTouched';

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

export function FluxNodeRecord(props: Props) {
  const theme = useTheme();
  return theme === 'flux' ? <NodeRecord {...props} /> : null;
}

function NodeRecord({ box, connections, peers }: Props) {
  const { t } = useDeskLexicon();
  const last = useLastTouched();

  // the writer's hand on this card: its words, its place, an ink stroke, a hand-sized edge (never the reflow's fit, which changes only an
  // auto card's height); the first sight of a card is not a touch
  const sig = `${box.text ?? ''}\u0000${box.x},${box.y}\u0000${box.strokes?.length ?? 0}\u0000${box.sizedByHand ? `${box.w},${box.h}` : ''}`;
  const seen = useRef<string | null>(null);
  useEffect(() => {
    if (seen.current !== null && seen.current !== sig) touchNode(box.id);
    seen.current = sig;
  }, [sig, box.id]);

  const kind = box.kind === 'page-pin' ? 'doc' : box.kind === 'ink' ? 'ink' : box.deckStep ? 'preset' : 'text';
  const deck = box.deckStep ? DECKS.find((d) => d.id === box.deckStep?.deck) : undefined;
  const kindWord = kind === 'doc' ? t('linksKindPage')
    : kind === 'ink' ? t('inkModeInk')
      : kind === 'preset' ? (deck ? `${t('flux3KindPreset')} · ${t(deck.nameTerm)}` : t('flux3KindPreset'))
        : t('inkModeText');
  const n = connections.filter((c) => c.connA === box.id || c.connB === box.id).length + (peers?.length ?? 0);
  return (
    <span className="flux3-node" data-node-kind={kind} data-last={last === box.id ? 'true' : undefined} aria-hidden="true">
      <i className="flux3-node-h" data-addr={`${t('linksKindCard').toUpperCase()} 0x${nodeHex(box.id)}`} data-kind-word={kindWord} />
      <i className="flux3-node-f" data-links={`${n} ${n === 1 ? t('flux3LinkOne') : t('flux3LinkMany')}`} data-ok={box.lit ? t('flux3ChecksumOk') : undefined} />
    </span>
  );
}
