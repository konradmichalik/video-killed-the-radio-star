<script>
  import { fade } from 'svelte/transition';
  import {
    currentVideo,
    hintsOn,
    revealHint,
    guessStats,
    revealNowPlaying,
    recordGuess,
  } from '../lib/stores.js';
  import { hitRate } from '../lib/game.js';

  // per-track phase: guessing -> revealed -> rated
  let phase = 'guessing';
  let lastId = null;
  let lastReveal = 0;

  // reset for each new track
  $: id = $currentVideo ? $currentVideo.video_id : null;
  $: if (id !== lastId) {
    lastId = id;
    phase = 'guessing';
    lastReveal = $revealHint; // ignore a stale reveal from the previous track
  }

  // a reveal (button or the "I" key) moves us from guessing -> revealed
  $: if ($revealHint !== lastReveal) {
    lastReveal = $revealHint;
    if (phase === 'guessing') phase = 'revealed';
  }

  function rate(correct) {
    recordGuess(correct);
    phase = 'rated';
  }
</script>

{#if !$hintsOn}
  <div class="guess" transition:fade={{ duration: 150 }}>
    <div class="hud" aria-live="polite">
      <span class="stat">STREAK <b>{$guessStats.streak}</b></span>
      <span class="stat">BEST <b>{$guessStats.best}</b></span>
      {#if $guessStats.played}
        <span class="stat"
          >{hitRate($guessStats)}% <small>({$guessStats.correct}/{$guessStats.played})</small></span
        >
      {/if}
    </div>

    {#if phase === 'guessing'}
      <p class="prompt">GUESS: ARTIST · TITLE · YEAR</p>
      <button class="btn reveal" type="button" on:click={revealNowPlaying}>? &nbsp;REVEAL</button>
    {:else if phase === 'revealed'}
      <p class="prompt">DID YOU GET IT?</p>
      <div class="rate">
        <button class="btn ok" type="button" on:click={() => rate(true)}>✓ &nbsp;I KNEW IT</button>
        <button class="btn no" type="button" on:click={() => rate(false)}>✗ &nbsp;MISSED</button>
      </div>
    {:else}
      <p class="prompt done">▶ NEXT TRACK COMING UP</p>
    {/if}
  </div>
{/if}

<style>
  .guess {
    position: absolute;
    top: clamp(8px, 2vh, 16px);
    left: clamp(8px, 2vw, 16px);
    z-index: 11; /* above the touch overlay so taps hit the buttons */
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    max-width: min(78vw, 420px);
  }
  .hud {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.75);
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 12px;
  }
  .stat b {
    color: var(--bug-yellow);
  }
  .stat small {
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 1px;
  }
  .prompt {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.55);
  }
  .prompt.done {
    color: var(--accent-2);
  }
  .rate {
    display: flex;
    gap: 8px;
  }
  .btn {
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 3px;
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid var(--bug-yellow);
    color: var(--bug-yellow);
    padding: 6px 14px;
    cursor: pointer;
    opacity: 0.85;
    transition:
      opacity 0.15s,
      transform 0.08s;
  }
  .btn:hover {
    opacity: 1;
  }
  .btn:active {
    transform: scale(0.97);
  }
  .btn.ok {
    border-color: var(--accent-2);
    color: var(--accent-2);
  }
  .btn.no {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
