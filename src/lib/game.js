// Pure scoring logic for the self-rated guessing game. Kept free of stores /
// browser APIs so it can be unit-tested.

export const EMPTY_GUESS_STATS = { streak: 0, best: 0, played: 0, correct: 0 };

/**
 * Fold one self-rated round into the running stats.
 * @param {{streak:number,best:number,played:number,correct:number}} prev
 * @param {boolean} correct  did the player say they got it right?
 */
export function nextGuessStats(prev, correct) {
  const base = prev || EMPTY_GUESS_STATS;
  const streak = correct ? base.streak + 1 : 0;
  return {
    streak,
    best: Math.max(base.best, streak),
    played: base.played + 1,
    correct: base.correct + (correct ? 1 : 0),
  };
}

/** Whole-percent hit rate, 0 when nothing has been played yet. */
export function hitRate(stats) {
  const s = stats || EMPTY_GUESS_STATS;
  return s.played ? Math.round((s.correct / s.played) * 100) : 0;
}
