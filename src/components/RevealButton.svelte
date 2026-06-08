<script>
  import { fade } from 'svelte/transition';
  import { hintsOn, revealNowPlaying } from '../lib/stores.js';
</script>

{#if !$hintsOn}
  <button
    class="reveal"
    type="button"
    transition:fade={{ duration: 150 }}
    on:click={revealNowPlaying}
  >
    ? &nbsp;REVEAL
  </button>
{/if}

<style>
  .reveal {
    position: absolute;
    top: clamp(8px, 2vh, 16px);
    left: clamp(8px, 2vw, 16px);
    z-index: 11; /* above the touch overlay so taps hit the button, not play/pause */
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--bug-yellow);
    background: rgba(0, 0, 0, 0.55);
    border: 1px solid var(--bug-yellow);
    padding: 6px 14px;
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.15s;
  }
  .reveal:hover {
    opacity: 1;
  }
  .reveal:active {
    transform: scale(0.97);
  }
</style>
