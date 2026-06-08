<script>
  import { fade } from 'svelte/transition';
  import { adPlaying } from '../lib/stores.js';
</script>

{#if $adPlaying}
  <div class="ad" aria-live="polite" transition:fade={{ duration: 200 }}>
    <span class="bar"></span>
    <span class="label">ADVERTISEMENT</span>
  </div>
{/if}

<style>
  /* Brutalist ad notice — sits where the lower third would, with a hard red
     accent bar instead of the teal one. Tells the user that YouTube is showing
     a pre-roll / mid-roll so they don't expect their music to start yet. */
  .ad {
    position: absolute;
    left: env(safe-area-inset-left, 0px);
    bottom: calc(clamp(28px, 9vh, 90px) + env(safe-area-inset-bottom, 0px));
    z-index: 8;
    display: flex;
    align-items: stretch;
    pointer-events: none;
  }
  .bar {
    width: 10px;
    background: var(--accent);
    box-shadow: 0 0 18px var(--accent);
  }
  .label {
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.55) 100%);
    backdrop-filter: blur(3px);
    padding: 14px 28px;
    border-left: 2px solid rgba(255, 255, 255, 0.08);
    font-family: 'VT323', monospace;
    font-size: clamp(18px, 2.4vw, 26px);
    letter-spacing: 4px;
    color: var(--accent);
    text-transform: uppercase;
    animation: ad-blink 1.6s steps(2) infinite;
  }
  @keyframes ad-blink {
    50% {
      opacity: 0.55;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .label {
      animation: none;
    }
  }
</style>
