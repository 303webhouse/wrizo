import { useEffect, useState } from 'react';
import { getProject, saveProject, generateId, subscribe } from './persistence';
import type { Fact, TutorBible } from '../types';

// TU5 S2 — the client store for the book's Bible (L4 of the Tutor's memory):
// read/add/edit/delete durable, writer-owned facts on the PROJECT record,
// local-first (offline edits persist and sync on return, riding the same
// last-write-wins `saveProject → upsert` path every project field uses; the
// `updatedAt` bump, dirty-mark, flush schedule, and subscriber notify all fall
// out of `upsert` for free — see persistence.ts).
//
// THE FIXED POINT, structural — mirroring advanceTutorCursor / appendTutorMessage:
// every function refuses to conjure. Opening the Tutor on a project page and
// reading creates NOTHING; only the writer's explicit first `addFact` births
// `project.tutor` (the spread-of-undefined birth, like appendTutorMessage).
// `editFact` / `deleteFact` no-op on a project with no bible (the
// `if (!project?.tutor) return` refusal, like advanceTutorCursor). A project
// never touched by the bible stays byte-identical to today: absent, never null.
//
// WRITER-AUTHORED ONLY: nothing here is ever called by model output. The Tutor
// cannot write to the bible, not even by proposal — the hands stay the writer's
// (the ticket's thesis; A13's kin).

// A fact is a line, not a page. 300 is the store's policy (the type holds shape,
// not policy); the UI input caps to match, this slice is the backstop.
export const FACT_TEXT_CAP = 300;

// --- read (conjures nothing) ---------------------------------------------
export function getBibleFacts(projectId: string): Fact[] {
  return getProject(projectId)?.tutor?.facts ?? [];
}

// --- add (the ONLY birth site) -------------------------------------------
export function addFact(projectId: string, text: string): Fact | null {
  const project = getProject(projectId);
  if (!project) return null; // refuse to conjure a project
  const clean = text.trim().slice(0, FACT_TEXT_CAP);
  if (!clean) return null; // empty is not a fact
  const now = new Date().toISOString();
  const fact: Fact = { id: generateId(), text: clean, source: 'writer', createdAt: now, updatedAt: now };
  // Birth here, and ONLY here: an absent bible becomes { v:1, facts:[fact] };
  // an existing one gains the fact. Never conjured by a read/edit/delete.
  const bible: TutorBible = project.tutor ?? { v: 1, facts: [] };
  saveProject({ ...project, tutor: { v: 1, facts: [...bible.facts, fact] } });
  return fact;
}

// --- edit (refuses to conjure) -------------------------------------------
export function editFact(projectId: string, factId: string, text: string): void {
  const project = getProject(projectId);
  if (!project?.tutor) return; // no bible → nothing to edit, conjure nothing
  const clean = text.trim().slice(0, FACT_TEXT_CAP);
  if (!clean) return; // an emptied edit is not a delete; delete is its own explicit act
  if (!project.tutor.facts.some((f) => f.id === factId)) return;
  const now = new Date().toISOString();
  const facts = project.tutor.facts.map((f) => (f.id === factId ? { ...f, text: clean, updatedAt: now } : f));
  saveProject({ ...project, tutor: { ...project.tutor, facts } });
}

// --- delete (real removal from the jsonb; refuses to conjure) ------------
export function deleteFact(projectId: string, factId: string): void {
  const project = getProject(projectId);
  if (!project?.tutor) return;
  const facts = project.tutor.facts.filter((f) => f.id !== factId);
  if (facts.length === project.tutor.facts.length) return; // no such fact → no spurious write
  saveProject({ ...project, tutor: { ...project.tutor, facts } });
}

// --- reactive read for the panel (S3) ------------------------------------
// Re-reads on any store change (cheap; the bible is small). A null projectId
// (loose/journal page) yields no facts — the section never mounts anyway.
export function useBibleFacts(projectId: string | null): Fact[] {
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((n) => n + 1)), []);
  return projectId ? getBibleFacts(projectId) : [];
}

// Test/inspection seam (the wrizoSectionFold / wrizoBoardMode convention;
// self-registers in its own store module). Never read by app code.
if (typeof window !== 'undefined') {
  (window as unknown as { wrizoBible?: unknown }).wrizoBible = {
    get: getBibleFacts, add: addFact, edit: editFact, delete: deleteFact,
  };
}
