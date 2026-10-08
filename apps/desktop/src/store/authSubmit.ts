import type { AuthResult } from './api';

// A sign-in or sign-up whose request never reached the server (offline, DNS, a dropped connection) makes fetch THROW.
// apiLogin and apiRegister do not catch that, so it used to leave the form stuck on "one moment…" with no message.
// This turns a thrown call into an ordinary failed result with one plain line, so the form always has an answer.
export const NETWORK_ERROR_LINE = 'Couldn\u2019t reach Wrizo. Check your connection and try again.';

export async function runAuthCall(call: () => Promise<AuthResult>): Promise<AuthResult> {
  try {
    return await call();
  } catch {
    return { ok: false, error: NETWORK_ERROR_LINE };
  }
}
