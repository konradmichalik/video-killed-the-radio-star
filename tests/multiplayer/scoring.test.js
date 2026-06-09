import { describe, it, expect } from 'vitest';
import { closestYearWinners } from '../../src/lib/multiplayer/scoring.js';

describe('closestYearWinners', () => {
  it('returns empty array when no submissions', () => {
    expect(closestYearWinners({}, 1987)).toEqual([]);
    expect(closestYearWinners(null, 1987)).toEqual([]);
  });

  it('returns single winner when one player is closest', () => {
    const submissions = {
      a: { year: 1985 },
      b: { year: 1990 },
      c: { year: 2000 },
    };
    expect(closestYearWinners(submissions, 1987)).toEqual(['a']);
  });

  it('returns all winners on a tie (equal distance)', () => {
    const submissions = {
      a: { year: 1985 }, // dist 2
      b: { year: 1989 }, // dist 2
      c: { year: 2000 }, // dist 13
    };
    const winners = closestYearWinners(submissions, 1987);
    expect(winners.sort()).toEqual(['a', 'b']);
  });

  it('handles exact match', () => {
    const submissions = { a: { year: 1987 }, b: { year: 1990 } };
    expect(closestYearWinners(submissions, 1987)).toEqual(['a']);
  });

  it('all-wrong-by-same-amount returns all of them', () => {
    const submissions = { a: { year: 1980 }, b: { year: 1994 } };
    expect(closestYearWinners(submissions, 1987).sort()).toEqual(['a', 'b']);
  });
});
