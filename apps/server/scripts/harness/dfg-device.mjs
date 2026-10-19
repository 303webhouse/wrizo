// DELETE FOR GOOD - ONE DEVICE, for delete-for-good-e2e.mjs. A child process running the app's REAL client store (persistence + sync, the
// desktop's own modules) against the REAL server over HTTP, with its own storage and its own session cookie. The parent sends commands; this
// answers each with what the device now holds. `skewMs` runs this device's clock ahead (a device whose clock is wrong is how an old edit can
// carry a NEWER stamp than a purge - the resurrection case the server must refuse).
import { installClientGlobals, loadClientStore } from '../../../desktop/scripts/lib/client-node.mjs';

const base = process.env.DFG_BASE;
installClientGlobals({ base, hostname: '127.0.0.1' });
const RealDate = Date;
let skew = 0;
globalThis.Date = class extends RealDate {
  constructor(...a) { if (a.length === 0) super(RealDate.now() + skew); else super(...a); }
  static now() { return RealDate.now() + skew; }
};

// every request this device makes, with what it pushed and what the server acknowledged
const wire = [];
const innerFetch = globalThis.fetch;
// OFFLINE (ledger 107, E5's race): a device the scenario says is offline must really be - the app's own background sync (the journal
// backfill's zero-delay syncOnce after a first pull) otherwise pushes an "offline" edit before the purge it is meant to follow
let offline = false;
globalThis.fetch = async (url, opts = {}) => {
  if (offline && String(url).includes('/api/')) throw new TypeError('Failed to fetch (this device is offline)');
  const res = await innerFetch(url, opts);
  if (String(url).includes('/api/sync')) {
    let body = {}; try { body = JSON.parse(opts.body || '{}'); } catch { /* not json */ }
    const copy = res.clone();
    let json = null; try { json = await copy.json(); } catch { /* not json */ }
    wire.push({ pushed: Object.fromEntries(Object.entries(body.push || {}).map(([k, v]) => [k, (v || []).map((r) => r.id)])), ack: json && json.acknowledgedPurged, rejected: json && json.rejected });
  }
  return res;
};

const S = await loadClientStore();
const P = S.persistence;
const dirty = () => Object.fromEntries(Object.entries(P.getDirtyRecords()).map(([k, v]) => [k, (v || []).map((r) => r.id)]));
const raw = (coll, id) => (JSON.parse(localStorage.getItem(coll) || '[]').find((e) => e.id === id) || null);

const handlers = {
  async login({ email, password }) {
    const r = await fetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const user = await r.json();
    S.currentUser.setCurrentUser(user);
    return { ok: r.ok, id: user.id };
  },
  // a sync that REALLY ran: the app schedules its own background sync after a first pull (sync.ts maybeBackfillJournal), and a syncOnce
  // that lands while that one is in flight is skipped silently - so this waits for its own request to go out, and for nothing to be pending
  async sync({ full = false } = {}) {
    for (let i = 0; i < 40; i++) {
      const before = globalThis.__deviceFetchCount;
      await S.sync.syncOnce(full);
      if (globalThis.__deviceFetchCount > before && S.sync.getSyncStatus() !== 'pending') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    P.flushNow();
    return { status: S.sync.getSyncStatus() };
  },
  async skew({ ms }) { skew = ms; return { skew }; },
  async offline({ on }) { offline = !!on; return { offline }; },
  // connector-b's page_links: a link OWNED by `owner` to `target` (the app's own addPageLink), and the owner's stored records
  async addLink({ owner, target }) { const l = P.addPageLink(owner, { bEntryId: target }); P.flushNow(); return { id: l ? l.id : null }; },
  async links({ id }) { const e = raw('writer-studio-journal-entries', id); return { links: (e && e.pageLinks) || [] }; },
  async createPage({ text, projectId }) { const e = P.createJournalPage({ text, ...(projectId ? { projectId } : {}) }); P.flushNow(); return { id: e.id }; },
  async edit({ id, text }) { const e = P.getJournalEntry(id); P.patchJournalEntry(id, e ? e.text : '', { text }); P.flushNow(); return { updatedAt: P.getJournalEntry(id)?.updatedAt }; },
  async softDelete({ id }) { P.softDeleteEntry(id); P.flushNow(); return {}; },
  async purge({ id }) { const done = P.purgeEntry(id); P.flushNow(); return { done }; },
  async createBinderWithWork({ title }) {
    const b = P.createBinder(title, 'book');
    P.saveDraft(b.id, 'scratch words for the binder');
    const now = new Date().toISOString();
    P.saveSession({ id: `sess-${b.id}`, projectId: b.id, startedAt: now, words: 12, durationSec: 30, updatedAt: now });
    P.flushNow();
    return { id: b.id };
  },
  async purgeBinder({ id }) { P.softDeleteProject(id); const done = P.purgeProject(id); P.flushNow(); return { done }; },
  async state({ id }) {
    return {
      live: !!P.getJournalEntry(id), inTrash: P.getDeletedEntries().some((e) => e.id === id),
      stored: raw('writer-studio-journal-entries', id), dirty: dirty(), wire,
    };
  },
};

process.on('message', async (msg) => {
  try { process.send({ seq: msg.seq, ok: true, out: await handlers[msg.cmd](msg.args || {}) }); }
  catch (e) { process.send({ seq: msg.seq, ok: false, error: String(e && (e.stack || e.message)) }); }
});
process.send({ ready: true });
