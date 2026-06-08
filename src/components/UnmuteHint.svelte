<script>
  import { fade } from 'svelte/transition';
  import { needsUnmute } from '../lib/stores.js';
  import { unmute } from '../lib/player.js';
</script>

{#if $needsUnmute}
  <button class="unmute" type="button" transition:fade={{ duration: 150 }} on:click={unmute}>
    <span class="ico">♪</span>
    TAP FOR SOUND
  </button>
{/if}

<style>
  .unmute {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 14; /* above the static + touch overlay */
    display: inline-flex;
    align-items: center;
    gap: 12px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 3.4vw, 30px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--bug-yellow);
    border: none;
    padding: 16px 32px;
    cursor: pointer;
    box-shadow: 5px 5px 0 var(--accent);
  }
  .unmute:active {
    transform: translate(-50%, -50%) scale(0.97);
  }
  .ico {
    font-size: 1.2em;
  }
</style>
