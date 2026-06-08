# Guess game

Turn **SONG INFO** off in the TV Guide and the channel becomes a lean-back,
self-rated quiz (artist · title · year).

## How it plays

- The lower-third stays hidden; a small **HUD** (top left) shows your current
  **streak**, **best** streak and hit-rate.
- Tap **REVEAL** (or press `I`) to slide the answer in.
- Self-rate with **I KNEW IT** / **MISSED**. Correct extends the streak, a miss
  resets it.
- Best streak and hit-rate **persist** across sessions (localStorage).

Rating is optional and never interrupts playback — the channel keeps going. The
"coming up" teaser and the screen-reader now-playing announcement are both
suppressed in this mode so nothing is spoiled.

## Under the hood

Scoring is pure, unit-tested logic in `src/lib/game.js` (`nextGuessStats`,
`hitRate`); the UI lives in `src/components/GuessGame.svelte` and the running
stats in the `guessStats` store.

## Going further

This is the lightweight tier. A heavier "real game" (multiple-choice with
distractors generated from the library, points for guessing before the reveal,
rounds / daily challenge / leaderboard) would build cleanly on `game.js`.
