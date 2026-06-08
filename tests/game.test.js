import { describe, it, expect } from 'vitest';
import { EMPTY_GUESS_STATS, nextGuessStats, hitRate } from '../src/lib/game.js';

describe('nextGuessStats', () => {
  it('increments streak and counts on a correct guess', () => {
    const s = nextGuessStats(EMPTY_GUESS_STATS, true);
    expect(s).toEqual({ streak: 1, best: 1, played: 1, correct: 1 });
  });

  it('resets the streak on a miss but still counts the round', () => {
    const after3 = [true, true, true].reduce((s, c) => nextGuessStats(s, c), EMPTY_GUESS_STATS);
    expect(after3.streak).toBe(3);
    const missed = nextGuessStats(after3, false);
    expect(missed).toEqual({ streak: 0, best: 3, played: 4, correct: 3 });
  });

  it('keeps best as the high-water mark across streaks', () => {
    let s = EMPTY_GUESS_STATS;
    for (const c of [true, true, false, true, true, true, true, false]) s = nextGuessStats(s, c);
    expect(s.best).toBe(4);
    expect(s.streak).toBe(0);
    expect(s).toMatchObject({ played: 8, correct: 6 });
  });

  it('treats a missing prev as empty stats', () => {
    expect(nextGuessStats(undefined, true)).toEqual({ streak: 1, best: 1, played: 1, correct: 1 });
  });
});

describe('hitRate', () => {
  it('is 0 before anything is played', () => {
    expect(hitRate(EMPTY_GUESS_STATS)).toBe(0);
    expect(hitRate(undefined)).toBe(0);
  });

  it('rounds to a whole percent', () => {
    expect(hitRate({ streak: 0, best: 1, played: 3, correct: 2 })).toBe(67);
  });
});
