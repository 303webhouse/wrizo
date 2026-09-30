// PUB1 — the .wzo writer's browserless half. ".wzo (Wrizo file): zip of the
// writer's records verbatim + manifest with sha-256 + order + provenance + an
// HTML preview + README" (§2's format table); "the whole-work and
// whole-account backup, ink included" (R11).
//
// WHAT THIS FILE DOES NOT DO: it does not zip. fflate lands in its own
// commit after Batch Eight merges, so the lockfile does not race item 207's
// packages (Fable, 2026-09-30) — this file builds every INPUT the zip step
// needs (the records verbatim, the manifest, the README, the HTML preview)
// as a plain in-memory package; the follow-up commit's own `writeWzoFile()`
// is exactly `fflate.zipSync(packageToZipEntries(buildWzoPackage(...)))`
// and nothing more. Nothing here reads or writes a real filesystem either —
// that is `triggerDownload`'s job (widened to accept a Blob, per §7's own
// PUB1 row), not this module's.
//
// .wzo records the writer's OWN data verbatim (records/<id>.json — no marks
// parser, no Assemble/Dress/Render pipeline; a raw backup, not an edition),
// so it needs neither model.ts's PressDoc nor markRuns.ts, and can ship
// ahead of both.
//
// NEVER A CREDENTIAL IN IT (Fable, 2026-09-30). scrubForCredentials() is an
// enforced guard, not a convention: it walks every record BEFORE it is
// packaged and throws if any key name looks like a credential — nothing in
// JournalEntry/Project carries one today (WordPress/Substack addresses and
// any credential live in users.publish_profile and, per §2's own words,
// "credentials are never stored in either" table, and never in a record this
// module ever sees) — but a guard that fires only on data that can't occur
// yet is decorative (the house's own law); the harness proves this one
// actually fires on an injected credential-shaped field.

/** A record exactly as it is stored — JournalEntry-shaped or Project-shaped
 *  — carried verbatim. This module never interprets its fields beyond `id`. */
export interface WzoRecord {
  id: string;
  kind: 'page' | 'binder';
  data: Record<string, unknown>;
}

export interface WzoManifestFile {
  path: string;
  sha256: string;
}

export interface WzoManifest {
  v: 1;
  generatedAt: string;
  /** The record ids, in the order a reader should walk them — chapterOrder()'s
   *  own output for a binder scope, or the "everything" ordering Select
   *  produces for that scope; this file takes it as given, never derives one
   *  (the same "one function, never a second copy" law, §2). */
  order: string[];
  provenance: {
    app: 'wrizo';
    exportedAt: string;
    /** The writer's own device-local pen name, if set — never an email,
     *  never a credential (the title-page rule, §2, reused here). */
    penName: string | null;
  };
  files: WzoManifestFile[];
}

export interface WzoPackage {
  manifest: WzoManifest;
  manifestJson: string;
  /** records/<id>.json, README.txt and preview.html — everything the later
   *  fflate commit zips verbatim, path -> UTF-8 text. No binary member
   *  exists yet (ink ships as the record's own `strokes` field, already
   *  JSON, per R11 — no separate image asset this ticket adds). */
  files: { path: string; text: string }[];
}

const CREDENTIAL_KEY = /token|password|passwd|secret|credential|api[-_]?key|auth(?!or)/i;

/** Throws on the FIRST key anywhere in `value` (at any depth, including
 *  inside arrays) whose name looks like a credential. Depth-first, so the
 *  thrown path names exactly where it was found — never a bare "found one
 *  somewhere" a writer's report would have to re-diagnose. */
export function scrubForCredentials(value: unknown, path = '$'): void {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => scrubForCredentials(v, `${path}[${i}]`));
    return;
  }
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (CREDENTIAL_KEY.test(key)) {
      throw new RangeError(`scrubForCredentials: credential-shaped field "${key}" at ${path}.${key} — refusing to package a .wzo that carries it`);
    }
    scrubForCredentials(v, `${path}.${key}`);
  }
}

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  // globalThis.crypto.subtle: available in every Electron renderer (a real
  // browser context) and in Node 20+ (this repo's own floor), so this
  // function needs no platform branch and no browser to prove correct.
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const README = `This is a .wzo file — a Wrizo archive.

It holds your own writing exactly as Wrizo stored it: every page and binder
named in manifest.json's own "order", each as its own records/<id>.json file,
byte-for-byte what you wrote (hand-drawn ink included, as the same data
Wrizo itself stores). preview.html is a plain, readable copy for anyone
without Wrizo open, and manifest.json lists a sha-256 for every file so you
can check nothing was altered after this archive was made.

Importing a .wzo back into Wrizo is not built yet. Nothing here needs it to
be useful as a backup.
`;

/** Assembles everything a .wzo needs EXCEPT the zip container itself (see
 *  this file's header). `records` must already be in the order the archive
 *  should read them (chapterOrder()'s own output, or whatever Select
 *  produced for an "everything" scope) — this function does not sort. */
export async function buildWzoPackage(
  records: readonly WzoRecord[],
  opts: { penName: string | null; now?: string },
): Promise<WzoPackage> {
  for (const r of records) scrubForCredentials(r.data, `$.records[${r.id}]`);

  const now = opts.now ?? new Date().toISOString();
  const recordFiles = records.map((r) => ({
    path: `records/${r.id}.json`,
    text: JSON.stringify(r.data, null, 2),
  }));

  const previewBody = records
    .map((r) => {
      const text = typeof r.data.text === 'string' ? r.data.text : '';
      // No marks parser (Pass 2's own rejected proposal #4) — a plain <pre>,
      // never formatted, so this can ship ahead of markRuns.ts.
      return `<article data-id="${escapeHtml(r.id)}"><pre>${escapeHtml(text)}</pre></article>`;
    })
    .join('\n');
  const previewHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Wrizo archive</title></head><body>${previewBody}</body></html>`;

  const allFiles = [
    ...recordFiles,
    { path: 'README.txt', text: README },
    { path: 'preview.html', text: previewHtml },
  ];

  const manifestFiles: WzoManifestFile[] = await Promise.all(
    allFiles.map(async (f) => ({ path: f.path, sha256: await sha256Hex(f.text) })),
  );

  const manifest: WzoManifest = {
    v: 1,
    generatedAt: now,
    order: records.map((r) => r.id),
    provenance: { app: 'wrizo', exportedAt: now, penName: opts.penName },
    files: manifestFiles,
  };
  const manifestJson = JSON.stringify(manifest, null, 2);

  return { manifest, manifestJson, files: [...allFiles, { path: 'manifest.json', text: manifestJson }] };
}
