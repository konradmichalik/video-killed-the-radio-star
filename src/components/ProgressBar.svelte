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
  }
  /* Smooth growth between poll ticks (1 s cadence in player.js). Disabled
     while switching tracks so the bar doesn't animate the wrap-around. */
  .fill.smooth {
    transition: width 1s linear;
  }
  @media (prefers-reduced-motion: reduce) {
    .fill.smooth {
      transition: none;
    }
  }
</style>
