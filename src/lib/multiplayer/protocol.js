export const PROTOCOL_VERSION = 1;

const VALID_TYPES = new Set([
  'join',
  'guess',
  'ping',
  'welcome',
  'round',
  'reveal',
  'score',
  'end',
  'kick',
]);

export function encode(type, payload = {}) {
  return JSON.stringify({ v: PROTOCOL_VERSION, type, payload });
}

export function parseMessage(raw) {
  let obj;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw;
  } else {
    return null;
  }
  if (obj.v !== PROTOCOL_VERSION) return null;
  if (!VALID_TYPES.has(obj.type)) return null;
  return { type: obj.type, payload: obj.payload ?? {} };
}
