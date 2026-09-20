// ITEM 154 — THE NAMED EXEMPTIONS, AND THE ONE HAND-WRITTEN REWRITE.
//
// The S0 census counted a SYNTACTIC SHAPE (a silent-act verb behind an
// optional chain or an `if (x)` guard). Building on that count mechanically
// converted sites where the shape was NOT a silent act — and reading them
// one at a time (which item 155's own band demands of any number: "a
// number you cannot defend per site is not a population") found that three
// different things wear the same syntax:
//
//   1. SILENT — absence proceeds and nothing reports it. The population.
//   2. PROBE-AND-REPORT — the guard hands the absence to the caller as a
//      value the caller ASSERTS. Not silent: converting it to a throw
//      swaps a NAMED FAILED CHECK for a file abort, the exact opposite of
//      this arc's own law ("probe first, fail a check, record both ways").
//   3. EXPECTED-ABSENT or CONTROL FLOW — the passing state IS absence (a
//      negative assertion), or the guard is a search loop whose `else` is
//      the loop continuing. A throw there breaks a green check.
//
// Classes 2 and 3 are EXEMPTED BY NAME, per site, with the reason written
// next to it — the same posture as VW1's inverted check 7 ("an offender
// unless NAMED and JUSTIFIED"). An exemption is a judgment, not a spelling,
// so it lives in a table a reviewer can overrule, not in a pattern.
//
// EVERY EXEMPTION MUST MATCH EXACTLY `expect` (default 1) OFFENDER-BEARING
// evalJs ARGUMENTS. Fewer is a STALE record (the site moved or was fixed),
// more is an ambiguous needle — both fail the run, because an exemption that
// silently matches nothing is precisely how a guard "passes while blind".
//
// A NEEDLE IS A SINGLE-LINE SUBSTRING of the extracted (cooked) argument —
// never a multi-line one — so nothing here depends on how a newline
// survives a pipeline (item 152).
export const EXEMPTIONS = [
  {
    file: 'm2.mjs',
    needle: "=== 'Time') : null;",
    reason: 'PROBE-AND-REPORT: `if (btn) btn.click(); return !!btn;` and the caller asserts it on the next line '
      + '(`ok("...Progress metric Seg itself is reachable...", progressTimeBtn === true)`). Absence already fails a NAMED '
      + 'check; a throw would replace that with a file abort.',
  },
  {
    file: 'm4.mjs',
    needle: "=== 'Bar') : null;",
    reason: 'PROBE-AND-REPORT: same shape as m2 — `return !!btn` is asserted by '
      + '`ok("S3: the gear still OFFERS the Progress-style toggle...", clicked === true)`.',
  },
  {
    file: 'tu5.mjs',
    needle: "btn.dataset.tu5seen = '1'",
    reason: 'CONTROL FLOW: a scan-until-exhausted loop. `if (btn) {...; return btn.textContent}` falls through to the '
      + 'next root and finally `return null`, which the caller tests (`if (!clicked) break;`). Absence is how the '
      + 'loop terminates; a throw would break it.',
  },
  {
    file: 'sc1.mjs',
    needle: "const gear = btns.find(b => (b.getAttribute('aria-label') || '').startsWith('Typewriter'));",
    reason: 'EXPECTED-ABSENT: the check is "the OPTION does not present itself" — `gear` is the Typewriter control, '
      + 'which must be ABSENT on a screenplay page. The passing state is `gear` undefined (reported as '
      + '`gearFound: false`), so a throw would fail the expected, passing state.',
  },
  {
    file: 'cd2.mjs',
    needle: "'.entry-edit, .entry-full')?.focus?.() ||",
    expect: 2,
    reason: 'FALLBACK CHAIN: `A?.focus?.() || B?.focus?.()` — the `||` CONSUMES the absence of A as "try B". Rewriting '
      + 'each half into a throw would make the FIRST alternative throw when absent instead of falling back to the '
      + 'second, breaking a passing check. (Two identical arguments, cd2.mjs:597 and :622.)',
  },
  {
    file: 'item133.mjs',
    needle: "querySelector('.crumb-rename-btn')?.click()",
    reason: 'AUTHOR-DOCUMENTED INTENT: the comment above the call reads "`?.click()` rather than a bare one: a driver '
      + 'that dies on a missing node reports nothing, and the assertion below is what should speak" — and the '
      + 'assertion (`namedDraft === "Chapter Plan"`) does. RULED EXEMPT by Fable, 2026-09-19: the author chose the '
      + 'guard so the assertion speaks — which is the check asserting the RULE (the rename field opens pre-filled), '
      + 'not the PROXY (the click landed). Absence is spoken by that assertion, not by a throw.',
  },
];

// The one site the mechanical tool cannot transform: a TWO-level lookup
// (`find(...)?.querySelector(...)?.click()`), where a named failure is owed
// at EACH level. Written by hand, then carried through the SAME byte
// comparison as every automated rewrite — an in-string edit is verified by
// what the file actually says, whoever typed it.
export const MANUAL_REWRITES = [
  {
    file: 'th2.mjs',
    original: "[...document.querySelectorAll('.mode-theme-settings .mode-crow')].find(r => r.textContent.includes('Ambiance'))?.querySelector('button:nth-of-type(2)')?.click()",
    replacement: "(() => { const __row = [...document.querySelectorAll('.mode-theme-settings .mode-crow')].find(r => r.textContent.includes('Ambiance')); "
      + "if (!__row) throw new Error(\"no Ambiance row in the theme settings panel\"); "
      + "const __t = __row.querySelector('button:nth-of-type(2)'); "
      + "if (!__t) throw new Error(\"no second button (the 25 stop) in the Ambiance row\"); "
      + "return __t.click(); })()",
  },
];

export function findExemption(file, innerText) {
  for (const ex of EXEMPTIONS) {
    if (ex.file === file && innerText.includes(ex.needle)) return ex;
  }
  return null;
}

export function findManual(file, cookedText) {
  for (const m of MANUAL_REWRITES) {
    if (m.file === file && m.original === cookedText) return m;
  }
  return null;
}
