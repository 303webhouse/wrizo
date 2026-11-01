import { useEffect, useState } from 'react';
import { getJournalEntry, subscribe } from '../store/persistence';
import { withoutFontMarks } from '../store/markRuns';

// MACHINA v2 MOCKUP - §8.3 OUTLINE → PARTS, THE AFFORDANCE ONLY (Fable ruling 4: "affordance only in the mockup; the real behaviour comes with
// the spine, on existing links"). In the Controls drawer on a Build (Draft) File: the File's outline points - its paragraphs' openings, in order,
// up to eight - each with a "→ Part" in the cool blue (guidance). Pressing one shows the brass tick on that point (the human acted) and says
// plainly that no Part is made yet: NOTHING is created, linked or stored (the ticks live in this module for the session). The spine's
// "materialize" verb (Phase 2) is what will make the Part.
const ticked = new Map<string, Set<number>>();
const MAX_POINTS = 8, WORDS = 7;

export function outlinePoints(text: string): string[] {
  return withoutFontMarks(String(text || ''))
    .split(/\n+/).map((l) => l.replace(/^[#>*\-\s]+/, '').trim()).filter(Boolean)
    .slice(0, MAX_POINTS)
    .map((l) => { const w = l.split(/\s+/); return w.length > WORDS ? `${w.slice(0, WORDS).join(' ')}…` : l; });
}

export function OutlineParts({ pageId }: { pageId: string | null | undefined }) {
  const [, tick] = useState(0);
  useEffect(() => subscribe(() => tick((x) => x + 1)), []);
  const entry = pageId ? getJournalEntry(pageId) : null;
  const points = outlinePoints(entry?.text || '');
  const done = (pageId && ticked.get(pageId)) || new Set<number>();
  return (
    <div className="wz-sliver-section machina2-outline" id="machina2-outline" data-points={points.length}>
      {/* r4 (the Wrizors' door 3): headed OUTLINE (the caps are the drawer headings' own style); "→ Part" shows on every point at rest */}
      <div className="wz-sliver-h">Outline</div>
      {points.length === 0 && <p className="machina2-outline-empty">No outline points yet: each paragraph you write is one.</p>}
      <ol className="machina2-outline-list">
        {points.map((p, i) => (
          <li key={i} className="machina2-outline-point" data-done={done.has(i) ? 'true' : 'false'}>
            <span className="machina2-outline-text">{p}</span>
            {done.has(i)
              ? <span className="machina2-outline-tick" title="Mockup: the Part is made when the spine lands (Phase 2) - nothing was created">✓</span>
              : <button type="button" className="machina2-outline-part" onClick={() => { if (!pageId) return; const s = ticked.get(pageId) ?? new Set<number>(); s.add(i); ticked.set(pageId, s); tick((x) => x + 1); }}>→ Part</button>}
          </li>
        ))}
      </ol>
      {done.size > 0 && <p className="machina2-outline-note">Mockup: no Part is made yet (the spine makes it).</p>}
    </div>
  );
}
