// TU1 S3 — the Consistency lens: proper-noun harvest across the page's
// scope (its own project, when it has one), flagging case variants and
// near-duplicates (edit distance <=2) as plain observations, e.g. "Aria /
// Arya both appear." Fully client-side, deterministic (no Date.now()/
// Math.random() anywhere in this file — the fixed point the harness's own
// seeded-misspelling fixture depends on), nothing leaves the device.
//
// "Honest v1 simplicity" per the brief: this is a stoplist heuristic, not
// real NER. A "proper noun candidate" is any Title-Case word that isn't a
// common English word capitalized purely by sentence position — no
// sentence-segmentation attempt (regex sentence-splitters are fragile and
// would blind the harvest to a name that happens to open a sentence, which
// is common for a protagonist). False positives from ordinary capitalized
// words that slip the stoplist are harmless here: they only ever surface
// as an observation if they collide (case-vary or near-duplicate) with
// something else, which a short common-word list makes rare in practice.

const COMMON_WORDS = new Set([
  'The', 'A', 'An', 'And', 'But', 'Or', 'Nor', 'So', 'Yet', 'For', 'It', 'He', 'She', 'They',
  'We', 'You', 'I', 'In', 'On', 'At', 'To', 'Of', 'By', 'From', 'With', 'As', 'Is', 'Was',
  'Were', 'Are', 'Am', 'Be', 'Been', 'Being', 'This', 'That', 'These', 'Those', 'There',
  'Here', 'What', 'When', 'Where', 'Why', 'How', 'If', 'Then', 'Not', 'No', 'Yes', 'All',
  'Some', 'Its', 'His', 'Her', 'Their', 'Our', 'My', 'One', 'Two', 'Three', 'Now', 'Then',
]);

function harvestProperNouns(text: string): string[] {
  const matches = text.match(/\b[A-Z][a-z]+\b/g) ?? [];
  return matches.filter(w => !COMMON_WORDS.has(w));
}

// Case variants of an ALREADY-IDENTIFIED proper noun (e.g. "Aria" also
// appearing as "ARIA" or "aria" elsewhere) — a second, targeted pass, not a
// broadening of the harvest above. Harvesting every letter-casing up front
// would also catch ordinary sentence-initial capitalization's lowercase
// twin (ever common word appears lowercase somewhere), flooding the lens
// with noise; searching case-insensitively for spellings the FIRST pass
// already flagged as a name keeps the signal honest — only names, still
// deterministic (a plain sorted regex scan, no randomness).
function harvestCaseVariants(text: string, knownLowerSpellings: Set<string>): Map<string, Set<string>> {
  const variants = new Map<string, Set<string>>(); // lowercase spelling -> surface forms seen
  for (const key of knownLowerSpellings) {
    const re = new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const found = text.match(re) ?? [];
    if (found.length === 0) continue;
    const forms = new Set(found);
    if (forms.size > 1) variants.set(key, forms);
  }
  return variants;
}

// Plain Levenshtein (edit distance) — O(m*n), fine at the token lengths a
// proper noun ever reaches.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// The most frequent surface form in a group, tie-broken alphabetically
// (deterministic regardless of scan order).
function mostCommonForm(forms: Map<string, number>): string {
  let best = '';
  let bestCount = -1;
  for (const [form, count] of [...forms.entries()].sort((x, y) => x[0].localeCompare(y[0]))) {
    if (count > bestCount) { best = form; bestCount = count; }
  }
  return best;
}

// One observation per finding, plain and quiet — the panel renders these
// as read-only lines; this lens computes them fresh every call, storing
// nothing (S1's own "lens results are derived, never stored" law).
export function computeConsistencyObservations(texts: string[]): string[] {
  const fullText = texts.join('\n');
  const tokens = texts.flatMap(harvestProperNouns);
  if (tokens.length === 0) return [];

  // Group by lowercase spelling: the set of distinct surface CASINGS seen
  // under that spelling (Title-Case only, from the harvest above), each
  // with a count.
  const groups = new Map<string, Map<string, number>>();
  for (const t of tokens) {
    const key = t.toLowerCase();
    const g = groups.get(key) ?? new Map<string, number>();
    g.set(t, (g.get(t) ?? 0) + 1);
    groups.set(key, g);
  }

  const observations: string[] = [];

  // Case variants: EVERY casing a known name appears in across the full
  // text — not just the Title-Case ones the harvest above sees (an
  // ALL-CAPS or all-lowercase occurrence of the SAME name, e.g. "ARIA" or
  // "aria" alongside "Aria", never gets harvested as its own candidate by
  // design — see harvestCaseVariants's own header comment for why a
  // targeted second pass, not a broader harvest, is the honest fix).
  const caseVariants = harvestCaseVariants(fullText, new Set(groups.keys()));
  for (const key of [...caseVariants.keys()].sort()) {
    const surfaceForms = [...caseVariants.get(key)!].sort();
    observations.push(`${surfaceForms.join(' / ')} both appear.`);
  }

  // Near-duplicates: distinct spellings within edit distance <=2 of each
  // other. Substring pairs ("Ann"/"Anna") are excluded — nesting like that
  // is ordinary (a nickname), not a likely misspelling, and including it
  // would make the lens noisy rather than honest.
  const keys = [...groups.keys()].sort();
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      if (a.includes(b) || b.includes(a)) continue;
      if (levenshtein(a, b) > 2) continue;
      const nameA = mostCommonForm(groups.get(a)!);
      const nameB = mostCommonForm(groups.get(b)!);
      observations.push(`${nameA} / ${nameB} both appear.`);
    }
  }

  return observations;
}
