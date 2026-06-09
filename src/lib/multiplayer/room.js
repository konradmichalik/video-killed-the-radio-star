// Crockford-ish Base32 without ambiguous glyphs (no 0/O/1/I/L/U).
export const ROOM_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
export const ROOM_ID_LENGTH = 4;

export function generateRoomId() {
  const bytes = new Uint8Array(ROOM_ID_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < ROOM_ID_LENGTH; i++) {
    id += ROOM_ALPHABET[bytes[i] % ROOM_ALPHABET.length];
  }
  return id;
}

export function isValidRoomId(value) {
  if (typeof value !== 'string') return false;
  if (value.length !== ROOM_ID_LENGTH) return false;
  for (const ch of value) {
    if (!ROOM_ALPHABET.includes(ch)) return false;
  }
  return true;
}
