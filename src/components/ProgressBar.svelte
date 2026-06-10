<script>
  import { fade } from 'svelte/transition';
  import { progressOn, playPosition, playDuration, switching } from '../lib/stores.js';

  $: pct = $playDuration > 0 ? Math.min(100, ($playPosition / $playDuration) * 100) : 0;
</script>

{#if $progressOn}
  <div class="progress" aria-hidden="true" transition:fade={{ duration: 200 }}>
    <div class="fill" class:smooth={!$switching} style="width: {pct}%"></div>
  </div>
{/if}

<style>
  /* Playback progress at the bottom edge — opaque black track so the bar
     stays legible over bright video content. Sits above the iframe but
     below most UI overlays. */
  .progress {
    position: absolute;
    left: 0;
    right: 0;
    bottom: env(safe-area-inset-bottom, 0px);
    z-index: 7;
    height: 4px;
    background: rgba(0, 0, 0, 0.9);
    pointer-events: none;
  }
  .fill {
    height: 100%;
    background: var(--accent);
    box-shadow: 0 0 6px var(--accent);
    /* No transition by default — track changes snap to 0 instantly. */
    /* Periodic VHS-tracking flicker — pairs with the station bug's idle
       glitch cadence (14 s) so the channel feels alive without competing
       overlays. Animates background/shadow/transform only — `width` is left
       for the per-tick smooth transition below. */
    animation: pb-idle-glitch 14s steps(1, end) infinite;
  }
  /* Smooth growth between poll ticks (1 s cadence in player.js). Disabled
     while switching tracks so the bar doesn't animate the wrap-around. */
  .fill.smooth {
    transition: width 1s linear;
  }
  @keyframes pb-idle-glitch {
    0%,
    93%,
    100% {
      background: var(--accent);
      box-shadow: 0 0 6px var(--accent);
      transform: translateY(0);
    }
    94% {
      background: var(--accent-2);
      box-shadow: 0 0 10px var(--accent-2);
      transform: translateY(-1px);
    }
    95% {
      background: var(--bug-yellow);
      box-shadow: 0 0 10px var(--bug-yellow);
      transform: translateY(0);
    }
    96% {
      background: var(--accent-2);
      box-shadow: 0 0 8px var(--accent-2);
      transform: translateY(1px);
    }
    97% {
      background: var(--accent);
      box-shadow: 0 0 8px var(--accent);
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .fill {
      animation: none;
    }
    .fill.smooth {
      transition: none;
    }
  }
</style>
