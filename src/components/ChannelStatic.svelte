<script>
  import { fade } from 'svelte/transition';
  import { switching } from '../lib/stores.js';
</script>

{#if $switching}
  <div class="channel-static" aria-hidden="true" transition:fade={{ duration: 120 }}>
    <div class="noise"></div>
    <div class="roll"></div>
  </div>
{/if}

<style>
  /* Pure black & white analog "snow" shown briefly on a manual skip / initial load. */
  .channel-static {
    position: absolute;
    inset: 0;
    z-index: 12; /* above video + lower third, below the guide */
    pointer-events: none;
    background: #000;
    overflow: hidden;
    filter: grayscale(1) contrast(1.1);
  }
  .noise {
    position: absolute;
    inset: -50%;
    opacity: 0.5;
    background-image:
      repeating-radial-gradient(circle at 17% 32%, #fff 0 1px, transparent 1px 3px),
      repeating-radial-gradient(circle at 71% 64%, #fff 0 1px, transparent 1px 4px),
      repeating-radial-gradient(circle at 43% 88%, #fff 0 1px, transparent 1px 2px),
      repeating-radial-gradient(circle at 88% 12%, #fff 0 1px, transparent 1px 3px);
    animation: noise 0.1s steps(3) infinite;
    mix-blend-mode: screen;
  }
  /* faint white horizontal sync bar sweeping down */
  .roll {
    position: absolute;
    left: 0;
    right: 0;
    height: 7%;
    background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.25), transparent);
    animation: roll 0.6s linear infinite;
  }
  @keyframes noise {
    0% {
      transform: translate(0, 0);
    }
    33% {
      transform: translate(-4%, 3%);
    }
    66% {
      transform: translate(3%, -3%);
    }
    100% {
      transform: translate(-2%, 2%);
    }
  }
  @keyframes roll {
    from {
      top: -10%;
    }
    to {
      top: 110%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .noise {
      animation: none;
    }
    .roll {
      display: none;
    }
  }
</style>
