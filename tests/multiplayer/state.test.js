import { describe, it, expect } from 'vitest';
import {
  EMPTY_ROOM,
  startSession,
  startRound,
  submitGuess,
  reveal,
  nextRound,
  endSession,
  addPlayer,
  markPlayerDisconnected,
} from '../../src/lib/multiplayer/state.js';

describe('state reducer', () => {
  it('startSession initialises a session at round 1, phase idle', () => {
    const s = startSession(EMPTY_ROOM);
    expect(s.session.round).toBe(1);
    expect(s.session.phase).toBe('idle');
  });

  it('startSession resets all player scores to 0', () => {
    let s = addPlayer(EMPTY_ROOM, { id: 'p1', name: 'Kim' });
    s = { ...s, players: s.players.map((p) => ({ ...p, score: 7 })) };
    s = startSession(s);
    expect(s.players[0].score).toBe(0);
  });

  it('addPlayer adds a fresh player with score 0', () => {
    const s = addPlayer(EMPTY_ROOM, { id: 'p1', name: 'Kim' });
    expect(s.players).toEqual([
      { id: 'p1', name: 'Kim', connected: true, score: 0, lastSubmission: null },
    ]);
  });

  it('addPlayer rejoining preserves existing score', () => {
    let s = addPlayer(EMPTY_ROOM, { id: 'p1', name: 'Kim' });
    s = { ...s, players: s.players.map((p) => ({ ...p, score: 5, connected: false })) };
    s = addPlayer(s, { id: 'p1', name: 'Kim' });
    expect(s.players[0].score).toBe(5);
    expect(s.players[0].connected).toBe(true);
  });

  it('submitGuess is ignored when phase is not guessing', () => {
    const s = startSession(EMPTY_ROOM);
    const next = submitGuess(s, 'p1', 1987);
    expect(next).toBe(s);
  });

  it('submitGuess records year during guessing', () => {
    let s = startSession(EMPTY_ROOM);
    s = startRound(s, { video_id: 'x', year: 1987 });
    s = submitGuess(s, 'p1', 1985);
    expect(s.submissions.p1.year).toBe(1985);
  });

  it('reveal awards winners 1 point each and flips phase', () => {
    let s = startSession(EMPTY_ROOM);
    s = addPlayer(s, { id: 'p1', name: 'Kim' });
    s = addPlayer(s, { id: 'p2', name: 'Jordan' });
    s = startRound(s, { video_id: 'x', year: 1987 });
    s = submitGuess(s, 'p1', 1985);
    s = submitGuess(s, 'p2', 1990);
    s = reveal(s, ['p1']);
    expect(s.session.phase).toBe('revealed');
    expect(s.players.find((p) => p.id === 'p1').score).toBe(1);
    expect(s.players.find((p) => p.id === 'p2').score).toBe(0);
  });

  it('nextRound clears submissions and increments round', () => {
    let s = startSession(EMPTY_ROOM);
    s = startRound(s, { video_id: 'x', year: 1987 });
    s = submitGuess(s, 'p1', 1985);
    s = nextRound(s);
    expect(s.session.round).toBe(2);
    expect(s.session.phase).toBe('idle');
    expect(s.submissions).toEqual({});
  });

  it('endSession resets session to null', () => {
    let s = startSession(EMPTY_ROOM);
    s = endSession(s);
    expect(s.session).toBeNull();
  });

  it('markPlayerDisconnected flips flag, keeps score', () => {
    let s = addPlayer(EMPTY_ROOM, { id: 'p1', name: 'Kim' });
    s = markPlayerDisconnected(s, 'p1');
    expect(s.players[0].connected).toBe(false);
  });
});
