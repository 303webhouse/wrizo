// REORG - the reorg's one switch (reorg-plan-tech.md section 3: "?reorg=1"; Fable cleared POLISH's rails plan Nov 14, live-feedback-nov14i.md).
// A URL query parameter only: no stored flag, no localStorage key. Read once at load, like flux3/flag.ts: the query sits before the hash route
// (/?reorg=1#/...), so in-app navigation never changes it. The rail itself is gated on this AND the theme being Machina (components/Cascade.tsx).
export const REORG: boolean = typeof location !== 'undefined' && new URLSearchParams(location.search).get('reorg') === '1';
