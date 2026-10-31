#!/usr/bin/env node
// #13 step 1 (docs/cleanup/deploy-13-brief.md): tag each unmerged remote branch archive/<name> at its own tip, then delete it;
// delete each merged remote branch; prune clean local worktrees whose branch is merged. Browserless; needs no box turn.
//
//   node apps/desktop/scripts/c13/c13-1-branches.mjs plan        read-only: fetch, classify, write docs/cleanup/c13-1-plan.tsv
//   node apps/desktop/scripts/c13/c13-1-branches.mjs apply --yes Chat 1 only: push the tags, prove them, then delete and prune
//   node apps/desktop/scripts/c13/c13-1-branches.mjs verify      the proof: reads the remote, writes docs/cleanup/c13-1-branches.log
//   node apps/desktop/scripts/c13/c13-1-branches.mjs selftest    red-capable check: the planted mutants must fail verify
//
// Safety: the live list (docs/cleanup/c13-1-live.txt) is never touched. Tags are pushed and proved at the planned SHA BEFORE
// any branch is deleted. A branch whose remote SHA moved after the plan is skipped. Worktrees are removed without --force, only
// when clean and idle for 48 hours. Nothing here force-pushes or rewrites history.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const OUT = path.join(ROOT, 'docs', 'cleanup');
const PLAN = path.join(OUT, 'c13-1-plan.tsv');
const LOG = path.join(OUT, 'c13-1-branches.log');
const LIVE = path.join(OUT, 'c13-1-live.txt');
const REMOTE = 'origin';
const TRUNK = `${REMOTE}/main`;
const IDLE_MS = 48 * 3600 * 1000;
const BATCH = 40;

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).trim();
const gitOk = (...a) => { try { execFileSync('git', a, { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; } };

function readLive() {
  const branch = [], worktree = [];
  for (const raw of fs.readFileSync(LIVE, 'utf8').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const [kind, glob] = line.split(/\s+/);
    const re = new RegExp('^' + glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$', 'i');
    if (kind === 'branch') branch.push(re); else if (kind === 'worktree') worktree.push(re); else throw new Error(`live list: bad line "${raw}"`);
  }
  return { isLiveBranch: (n) => branch.some((r) => r.test(n)), isLiveWorktree: (p) => worktree.some((r) => r.test(p.replace(/\\/g, '/'))) };
}

// `git ls-remote` -> { heads: Map(name -> sha), tags: Map(name -> sha) }. Annotated tags would list ^{} lines; ours are lightweight.
function lsRemote() {
  const heads = new Map(), tags = new Map();
  for (const l of git('ls-remote', '--heads', '--tags', REMOTE).split('\n').filter(Boolean)) {
    const [sha, ref] = l.split('\t');
    if (ref.startsWith('refs/heads/')) heads.set(ref.slice(11), sha);
    else if (ref.startsWith('refs/tags/') && !ref.endsWith('^{}')) tags.set(ref.slice(10), sha);
  }
  return { heads, tags };
}

function plan() {
  git('fetch', '--prune', '--quiet', REMOTE);
  const live = readLive();
  const trunk = git('rev-parse', TRUNK);
  const { heads, tags } = lsRemote();
  const rows = [];
  for (const [name, sha] of [...heads].sort((a, b) => a[0].localeCompare(b[0]))) {
    const merged = gitOk('merge-base', '--is-ancestor', sha, trunk);
    const date = git('log', '-1', '--format=%cs', sha);
    let action = live.isLiveBranch(name) ? 'keep' : merged ? 'delete' : 'archive+delete';
    if (action === 'archive+delete' && tags.has(`archive/${name}`) && tags.get(`archive/${name}`) !== sha) action = 'keep(tag-clash)';
    rows.push({ name, sha, merged: merged ? 'yes' : 'no', date, action });
  }
  // Worktrees: the porcelain list, one block per worktree.
  const wts = [];
  for (const block of git('worktree', 'list', '--porcelain').split(/\n\n/)) {
    const wt = Object.fromEntries(block.split('\n').map((l) => [l.split(' ')[0], l.slice(l.indexOf(' ') + 1)]));
    if (!wt.worktree) continue;
    const p = wt.worktree, br = wt.branch ? wt.branch.replace('refs/heads/', '') : '';
    let action;
    if (live.isLiveWorktree(p)) action = 'keep(live)';
    else if (!fs.existsSync(p)) action = 'keep(missing: prune by hand)';
    else if (!br) action = 'keep(detached)';
    else if (!gitOk('merge-base', '--is-ancestor', `refs/heads/${br}`, trunk)) action = 'keep(unmerged)';
    else {
      const gitdir = execFileSync('git', ['rev-parse', '--git-dir'], { cwd: p, encoding: 'utf8' }).trim();
      const idx = path.resolve(p, gitdir, 'index');
      const idle = !fs.existsSync(idx) || Date.now() - fs.statSync(idx).mtimeMs > IDLE_MS;
      const clean = execFileSync('git', ['status', '--porcelain'], { cwd: p, encoding: 'utf8' }).trim() === '';
      action = !clean ? 'keep(dirty)' : !idle ? 'keep(active <48h)' : 'remove';
    }
    wts.push({ path: p, branch: br, action });
  }
  const tsv = ['kind\tname\tsha\tmerged\tdate\taction', ...rows.map((r) => `branch\t${r.name}\t${r.sha}\t${r.merged}\t${r.date}\t${r.action}`),
    ...wts.map((w) => `worktree\t${w.path}\t${w.branch}\t\t\t${w.action}`)].join('\n') + '\n';
  fs.writeFileSync(PLAN, `# c13-1 plan @ ${TRUNK} ${trunk.slice(0, 8)} ${new Date().toISOString()}\n` + tsv);
  const count = (xs, a) => xs.filter((x) => x.action === a).length;
  console.log(`branches ${rows.length}: keep ${count(rows, 'keep')}, delete (merged) ${count(rows, 'delete')}, archive+delete ${count(rows, 'archive+delete')}, tag clash ${count(rows, 'keep(tag-clash)')}`);
  console.log(`worktrees ${wts.length}: remove ${count(wts, 'remove')}; kept: ${[...new Set(wts.map((w) => w.action))].filter((a) => a !== 'remove').map((a) => `${a} ${count(wts, a)}`).join(', ')}`);
  console.log(`wrote ${path.relative(ROOT, PLAN)}`);
}

function readPlan() {
  const lines = fs.readFileSync(PLAN, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith('#')).slice(1);
  const branches = [], worktrees = [];
  for (const l of lines) {
    const [kind, name, sha, merged, date, action] = l.split('\t');
    if (kind === 'branch') branches.push({ name, sha, merged, date, action }); else worktrees.push({ path: name, branch: sha, action });
  }
  return { branches, worktrees };
}

// The proof, as a pure function of the plan and a remote snapshot, so selftest can feed it mutants.
function check({ branches }, { heads, tags }, isLiveBranch) {
  const fails = [], lines = [];
  for (const b of branches) {
    const head = heads.get(b.name), tag = tags.get(`archive/${b.name}`);
    let taken, bad = '';
    if (b.action.startsWith('keep')) {
      taken = head ? 'kept' : 'MISSING';
      if (!head) bad = 'a kept branch is gone from the remote';
    } else {
      taken = !head ? 'deleted' : head === b.sha ? 'not yet deleted' : 'moved after plan, left alone';
      if (b.action === 'archive+delete' && !head && tag !== b.sha) bad = `deleted but archive/${b.name} is ${tag ? tag.slice(0, 8) : 'absent'}, not ${b.sha.slice(0, 8)}`;
    }
    if (isLiveBranch(b.name) && b.action !== 'keep') bad = 'a live-list branch was planned for an action';
    if (bad) fails.push(`${b.name}: ${bad}`);
    lines.push([b.name, b.sha.slice(0, 8), b.merged, tag ? tag.slice(0, 8) : '-', b.action, taken].join('\t'));
  }
  return { fails, lines };
}

function verify() {
  const p = readPlan();
  const { fails, lines } = check(p, lsRemote(), readLive().isLiveBranch);
  const head = fs.readFileSync(PLAN, 'utf8').split('\n')[0];
  fs.writeFileSync(LOG, [`# c13-1 verify ${new Date().toISOString()} against ${head.replace(/^# /, '')}`, 'branch\tsha\tmerged\tarchive-tag\tplanned\ttaken', ...lines,
    ...p.worktrees.map((w) => `worktree ${w.path}\t${w.branch}\t${w.action}\t${fs.existsSync(w.path) ? 'present' : 'removed'}`),
    `# FAILS ${fails.length}`, ...fails].join('\n') + '\n');
  const taken = {};
  for (const l of lines) { const t = l.split('\t')[5]; taken[t] = (taken[t] ?? 0) + 1; }
  console.log(`checked ${p.branches.length} branches (${Object.entries(taken).map(([k, v]) => `${k} ${v}`).join(', ')}); ${fails.length} fails; wrote ${path.relative(ROOT, LOG)}`);
  for (const f of fails.slice(0, 20)) console.log('FAIL', f);
  console.log(fails.length ? 'VERIFY: FAIL' : 'VERIFY: PASS');
  process.exit(fails.length ? 1 : 0);
}

function selftest() {
  const p = readPlan();
  const live = readLive();
  const arch = p.branches.find((b) => b.action === 'archive+delete');
  const kept = p.branches.find((b) => b.action === 'keep');
  if (!arch || !kept) { console.log('selftest needs at least one archive+delete and one keep row'); process.exit(1); }
  // The "done" remote: kept branches present, the rest deleted, every archive tag at its tip.
  const done = () => ({ heads: new Map(p.branches.filter((b) => b.action.startsWith('keep')).map((b) => [b.name, b.sha])),
    tags: new Map(p.branches.filter((b) => b.action === 'archive+delete').map((b) => [`archive/${b.name}`, b.sha])) });
  const cases = [];
  cases.push(['the done state passes', check(p, done(), live.isLiveBranch).fails.length === 0]);
  const m1 = done(); m1.tags.set(`archive/${arch.name}`, git('rev-parse', `${arch.sha}^`));
  cases.push([`MUTANT tag one commit back (${arch.name}) fails`, check(p, m1, live.isLiveBranch).fails.length === 1]);
  const m2 = done(); m2.tags.delete(`archive/${arch.name}`);
  cases.push([`MUTANT tag missing (${arch.name}) fails`, check(p, m2, live.isLiveBranch).fails.length === 1]);
  const m3 = done(); m3.heads.delete(kept.name);
  cases.push([`MUTANT kept branch deleted (${kept.name}) fails`, check(p, m3, live.isLiveBranch).fails.length === 1]);
  const m4 = { branches: p.branches.map((b) => (b.name === 'main' ? { ...b, action: 'delete' } : b)) };
  cases.push(['MUTANT live branch planned for delete (main) fails', check(m4, done(), live.isLiveBranch).fails.length >= 1]);
  for (const [n, ok] of cases) console.log(ok ? 'ok  ' : 'BAD ', n);
  const bad = cases.filter((c) => !c[1]).length;
  console.log(bad ? 'SELFTEST: FAIL' : 'SELFTEST: PASS');
  process.exit(bad ? 1 : 0);
}

function apply() {
  if (!process.argv.includes('--yes')) { console.log('apply changes the remote: Chat 1 runs it with --yes, after `plan` and the live-list census'); process.exit(1); }
  const p = readPlan();
  const live = readLive();
  const arch = p.branches.filter((b) => b.action === 'archive+delete' && !live.isLiveBranch(b.name));
  for (let i = 0; i < arch.length; i += BATCH)
    git('push', '--quiet', REMOTE, ...arch.slice(i, i + BATCH).map((b) => `${b.sha}:refs/tags/archive/${b.name}`));
  const r = lsRemote();
  const unproved = arch.filter((b) => r.tags.get(`archive/${b.name}`) !== b.sha);
  if (unproved.length) { console.log(`STOP: ${unproved.length} archive tags are not at the planned SHA; nothing deleted`, unproved.slice(0, 5).map((b) => b.name)); process.exit(1); }
  console.log(`tags pushed and proved: ${arch.length}`);
  const del = p.branches.filter((b) => (b.action === 'delete' || b.action === 'archive+delete') && !live.isLiveBranch(b.name) && r.heads.get(b.name) === b.sha);
  const moved = p.branches.filter((b) => (b.action === 'delete' || b.action === 'archive+delete') && r.heads.has(b.name) && r.heads.get(b.name) !== b.sha);
  for (let i = 0; i < del.length; i += BATCH) git('push', '--quiet', REMOTE, '--delete', ...del.slice(i, i + BATCH).map((b) => b.name));
  console.log(`branches deleted: ${del.length}; moved after plan, left alone: ${moved.length} ${moved.map((b) => b.name).join(' ')}`);
  let removed = 0;
  for (const w of p.worktrees.filter((w) => w.action === 'remove' && !live.isLiveWorktree(w.path))) {
    try { git('worktree', 'remove', w.path); removed++; } catch (e) { console.log(`worktree left: ${w.path} (${String(e.message).split('\n')[0]})`); }
  }
  console.log(`worktrees removed: ${removed}. Now run: verify`);
}

const cmd = process.argv[2];
({ plan, apply, verify, selftest }[cmd] ?? (() => { console.log('usage: plan | apply --yes | verify | selftest'); process.exit(1); }))();
