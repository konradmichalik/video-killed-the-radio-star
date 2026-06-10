<script>
  import { fade } from 'svelte/transition';
  import { logoOn, guideOpen } from '../lib/stores.js';
  import VktrsIcon from './VktrsIcon.svelte';
</script>

{#if $logoOn}
  <button
    type="button"
    class="bug"
    aria-label="Open TV Guide"
    on:click={() => guideOpen.set(true)}
    transition:fade={{ duration: 250 }}
  >
    <VktrsIcon size={48} />
  </button>
{/if}

<style>
  /* Neo-brutalist station bug — clickable, opens the TV Guide. The icon
     itself is the canonical VKTRS square (V + on-air dot); we keep the
     bug's container minimal so the offset shadow already inside the SVG
     stays visible. */
  .bug {
    position: absolute;
    right: calc(clamp(14px, 3vw, 36px) + env(safe-area-inset-right, 0px));
    top: calc(clamp(14px, 3vh, 36px) + env(safe-area-inset-top, 0px));
    z-index: 11; /* above TouchOverlay (z 10) so taps land on the button */
    display: inline-flex;
    padding: 0;
    background: none;
    border: 0;
    opacity: 0.45;
    cursor: pointer;
    font: inherit;
    /* Idle: long calm stretch + brief glitch burst every ~14 s. */
    animation: bug-glitch-idle 14s steps(1, end) infinite;
  }
  /* Mouse/trackpad: hover triggers the aggressive CRT-glitch. */
  @media (hover: hover) and (pointer: fine) {
    .bug:hover {
      opacity: 1;
      animation: bug-glitch 0.46s steps(1, end) infinite;
    }
  }
  /* Tap feedback on touch devices */
  .bug:active {
    opacity: 1;
    transform: translate(2px, 2px);
  }

  /* Position + RGB-split jitter — discrete frames, no smoothing (= digital glitch). */
  @keyframes bug-glitch {
    0% {
      transform: translate(0, 0);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    10% {
      transform: translate(-3px, 1px);
      filter: drop-shadow(3px 0 0 var(--accent)) drop-shadow(-3px 0 0 var(--accent-2));
    }
    18% {
      transform: translate(2px, -2px);
      filter: drop-shadow(-3px 0 0 var(--accent)) drop-shadow(3px 0 0 var(--accent-2));
      clip-path: inset(0 0 40% 0);
    }
    26% {
      transform: translate(-1px, 0);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    36% {
      transform: translate(4px, 0);
      filter: drop-shadow(0 2px 0 var(--bug-yellow));
      clip-path: inset(35% 0 0 0);
    }
    44% {
      transform: translate(0, 2px);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    56% {
      transform: translate(-2px, -1px);
      filter: drop-shadow(2px 0 0 var(--accent)) drop-shadow(-2px 0 0 var(--accent-2));
    }
    66% {
      transform: translate(2px, 1px);
      filter: none;
      clip-path: inset(0 30% 0 0);
    }
    74% {
      transform: translate(-1px, 0);
      clip-path: inset(0 0 0 0);
    }
    86% {
      transform: translate(0, 1px);
      filter: drop-shadow(1px 0 0 var(--accent)) drop-shadow(-1px 0 0 var(--accent-2));
    }
    100% {
      transform: translate(0, 0);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
  }

  /* Occasional idle glitch — quiet most of the cycle, ~0.5 s burst at the end.
     Pairs the position jitter with a stepped RGB drop-shadow split so the
     bug picks up the same VHS-tracking character as the start-screen brand
     icon and the lower-third / up-next entrances. */
  @keyframes bug-glitch-idle {
    0%,
    92%,
    100% {
      transform: translate(0, 0);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    93% {
      transform: translate(-2px, 1px);
      filter: drop-shadow(2px 0 0 var(--accent)) drop-shadow(-2px 0 0 var(--accent-2));
    }
    94% {
      transform: translate(2px, -1px);
      filter: drop-shadow(-3px 0 0 var(--accent)) drop-shadow(3px 0 0 var(--accent-2));
      clip-path: inset(0 0 40% 0);
    }
    95% {
      transform: translate(0, 1px);
      filter: none;
      clip-path: inset(0 0 0 0);
    }
    96% {
      transform: translate(-1px, 0);
      filter: drop-shadow(1px 0 0 var(--accent)) drop-shadow(-1px 0 0 var(--accent-2));
    }
    97% {
      transform: translate(0, 0);
      filter: none;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bug,
    .bug:hover {
      animation: none;
      opacity: 0.85;
    }
  }
</style>
