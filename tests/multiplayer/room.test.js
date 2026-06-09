import { describe, it, expect } from 'vitest';
import { generateRoomId, isValidRoomId, ROOM_ALPHABET } from '../../src/lib/multiplayer/room.js';

describe('generateRoomId', () => {
  it('returns a 4-character string', () => {
    const id = generateRoomId();
    expect(id).toHaveLength(4);
  });

  it('only uses unambiguous Base32 characters (no 0/O/1/I)', () => {
    expect(ROOM_ALPHABET).not.toMatch(/[01OI]/);
    for (let i = 0; i < 200; i++) {
      const id = generateRoomId();
      for (const ch of id) expect(ROOM_ALPHABET).toContain(ch);
    }
  });
});

describe('isValidRoomId', () => {
  it('accepts a freshly generated id', () => {
    expect(isValidRoomId(generateRoomId())).toBe(true);
  });
  it.each([null, undefined, '', 'ABC', 'ABCDE', 'abcd', 'AB0D', 'AB1D', 'AB-D', 123])(
    'rejects garbage: %p',
    (input) => expect(isValidRoomId(input)).toBe(false),
  );
});
