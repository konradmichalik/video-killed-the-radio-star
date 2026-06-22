import { describe, it, expect } from 'vitest';
import { encode, parseMessage, PROTOCOL_VERSION } from '../../src/lib/multiplayer/protocol.js';

describe('encode / parseMessage roundtrip', () => {
  it('roundtrips a join message', () => {
    const wire = encode('join', { playerId: 'p1', name: 'Kim' });
    expect(parseMessage(wire)).toEqual({
      type: 'join',
      payload: { playerId: 'p1', name: 'Kim' },
    });
  });

  it('roundtrips a guess', () => {
    const wire = encode('guess', { year: 1987 });
    expect(parseMessage(wire)).toEqual({ type: 'guess', payload: { year: 1987 } });
  });

  it('accepts an already-parsed object', () => {
    const obj = { v: PROTOCOL_VERSION, type: 'ping', payload: {} };
    expect(parseMessage(obj)).toEqual({ type: 'ping', payload: {} });
  });

  it('rejects unknown type', () => {
    const obj = { v: PROTOCOL_VERSION, type: 'evil', payload: {} };
    expect(parseMessage(obj)).toBeNull();
  });

  it('rejects mismatched version', () => {
    const obj = { v: 999, type: 'join', payload: {} };
    expect(parseMessage(obj)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(parseMessage('not json')).toBeNull();
    expect(parseMessage(null)).toBeNull();
    expect(parseMessage(42)).toBeNull();
  });

  it('PROTOCOL_VERSION is 2', () => {
    expect(PROTOCOL_VERSION).toBe(2);
  });

  it('roundtrips a control grant', () => {
    const wire = encode('control', { granted: true });
    expect(parseMessage(wire)).toEqual({ type: 'control', payload: { granted: true } });
  });

  it('roundtrips an autocountdown', () => {
    const wire = encode('autocountdown', { active: true, endsAt: 1000 });
    expect(parseMessage(wire)).toEqual({
      type: 'autocountdown',
      payload: { active: true, endsAt: 1000 },
    });
  });

  it('roundtrips a command', () => {
    const wire = encode('command', { action: 'reveal' });
    expect(parseMessage(wire)).toEqual({ type: 'command', payload: { action: 'reveal' } });
  });

  it('rejects a v1 message now that we are on v2', () => {
    expect(parseMessage({ v: 1, type: 'join', payload: {} })).toBeNull();
  });
});
