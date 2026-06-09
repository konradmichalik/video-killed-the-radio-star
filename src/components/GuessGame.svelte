<script>
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import {
    currentVideo,
    hintsOn,
    revealHint,
    revealNowPlaying,
    recordGuess,
  } from '../lib/stores.js';

  const dispatch = createEventDispatcher();

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
  <div
    class="game-bar"
    role="group"
    aria-label="Solo guess controls"
    transition:fade={{ duration: 150 }}
  >
    {#if phase === 'guessing'}
      <button class="game-bar__cta gold" type="button" on:click={revealNowPlaying}>? Reveal</button>
    {:else if phase === 'revealed'}
      <button class="game-bar__cta" type="button" on:click={() => rate(true)}>✓ I knew it</button>
      <button class="game-bar__cta warn" type="button" on:click={() => rate(false)}>✗ Missed</button
      >
    {:else}
      <span class="status">▶ Next track</span>
    {/if}

    <button
      class="game-bar__ghost"
      type="button"
      aria-label="Open game sheet"
      on:click={() => dispatch('open')}
    >
      Open
    </button>
  </div>
{/if}

<style>
  /* Phase-specific colour variants — base structure comes from .game-bar__cta in app.css. */
  .game-bar__cta.gold {
    background: var(--bug-yellow);
  }
  .game-bar__cta.warn {
    background: var(--accent);
    color: #fff;
  }
  .status {
    font-family: 'Anton', sans-serif;
    font-size: 14px;
    letter-spacing: 2px;
    color: var(--accent-2);
    text-transform: uppercase;
  }
</style>
