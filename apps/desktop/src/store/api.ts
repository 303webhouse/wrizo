import type { DirtyRecords, RemoteRecords } from './persistence';

// Thin fetch wrappers around the server's /auth and /api endpoints. Same-origin
// in production (server serves the app); a vite dev proxy covers local dev.
// Cookies carry the session — never block writing on any of this.

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

export interface SyncResponse {
  serverTime: string;
  pull: RemoteRecords;
}

async function postJson(path: string, body: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return data?.error || fallback;
  } catch {
    return fallback;
  }
}

export async function apiMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });
    return res.ok ? ((await res.json()) as AuthUser) : null;
  } catch {
    return null;
  }
}

export interface AuthResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  const res = await postJson('/auth/login', { email, password });
  if (res.ok) return { ok: true, user: (await res.json()) as AuthUser };
  return { ok: false, error: await errorMessage(res, 'Could not sign in') };
}

export async function apiRegister(email: string, password: string, name: string): Promise<AuthResult> {
  const res = await postJson('/auth/register', { email, password, name });
  if (res.ok) return { ok: true, user: (await res.json()) as AuthUser };
  return { ok: false, error: await errorMessage(res, 'Could not create account') };
}

export async function apiLogout(): Promise<void> {
  try {
    await postJson('/auth/logout', {});
  } catch {
    // Logout is best-effort; the local session is cleared regardless.
  }
}

export async function apiSync(payload: {
  lastSyncAt: string | null;
  push: DirtyRecords;
}): Promise<SyncResponse> {
  const res = await postJson('/api/sync', payload);
  if (!res.ok) throw new Error(`sync failed: ${res.status}`);
  return (await res.json()) as SyncResponse;
}

// TU1 S5 — the Tutor's one writer-initiated call. Fires only on an
// explicit send (never ambient, never polled). `configured: false` is a
// first-class response (the server has no TUTOR_API_KEY) — not an error;
// the caller renders it as the panel's own quiet "not configured" line.
// A network failure or a non-2xx response resolves the same way (`ok:
// false`) rather than throwing — the conversation degrading quietly is
// the whole point (S5: "offline... the conversation says so in one quiet
// line"), and this file never retries on its own (no loop of any kind).
export interface TutorChatResult {
  ok: boolean;
  configured: boolean;
  reply?: string;
}

export async function apiTutorChat(messages: { role: 'writer' | 'tutor'; text: string }[]): Promise<TutorChatResult> {
  try {
    const res = await postJson('/api/tutor/chat', { messages });
    if (!res.ok) return { ok: false, configured: true };
    const data = (await res.json()) as { configured: boolean; reply?: string };
    if (!data.configured) return { ok: true, configured: false };
    return { ok: true, configured: true, reply: data.reply ?? '' };
  } catch {
    return { ok: false, configured: true };
  }
}
