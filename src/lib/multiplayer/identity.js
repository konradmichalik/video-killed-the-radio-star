// Persistent player identity for the phone client.
// Browser-only; not unit-tested (covered by E2E reconnect spec).
const KEY = 'vktrs:player';

function safeRead() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeWrite(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable (Safari private mode). Identity stays
    // in-memory for the session.
  }
}

export function loadOrCreate() {
  const existing = safeRead();
  if (existing && existing.id) return existing;
  const fresh = { id: globalThis.crypto.randomUUID(), name: '' };
  safeWrite(fresh);
  return fresh;
}

export function setName(name) {
  const player = loadOrCreate();
  const next = { ...player, name };
  safeWrite(next);
  return next;
}
