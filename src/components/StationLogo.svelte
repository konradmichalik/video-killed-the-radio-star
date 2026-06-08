<script>
  import { fade } from 'svelte/transition';
  import { logoOn, guideOpen } from '../lib/stores.js';
</script>

{#if $logoOn}
  <button
    type="button"
    class="bug"
    aria-label="Open TV Guide"
    on:click={() => guideOpen.set(true)}
    transition:fade={{ duration: 250 }}
  >
    <span class="mark">VKTRS</span>
    <span class="dot" aria-hidden="true"></span>
  </button>
{/if}

<style>
  /* Neo-brutalist station bug — now a real button: tap/click opens the TV
     Guide on all devices. Swipe-up gesture in TouchOverlay still works
     because the bug only occupies its own small area at the top-right. */
  .bug {
    position: absolute;
    right: calc(clamp(14px, 3vw, 36px) + env(safe-area-inset-right, 0px));
    top: calc(clamp(14px, 3vh, 36px) + env(safe-area-inset-top, 0px));
    z-index: 11; /* above TouchOverlay (z 10) so taps land on the button */
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 4px clamp(8px, 1.4vw, 14px) 6px;
    background: rgba(0, 0, 0, 0.55);
    border: 3px solid rgba(255, 255, 255, 0.85);
    box-shadow: 5px 5px 0 var(--accent-2);
    opacity: 0.22;
    color: #fff;
    cursor: pointer;
    font: inherit;
    /* Idle: long calm stretch + brief glitch burst every ~14 s. */
    animation: bug-glitch-idle 14s steps(1, end) infinite;
  }
  .bug .mark {
    animation: bug-glitch-idle-mark 14s steps(1, end) infinite;
  }
  /* Mouse/trackpad: hover triggers the aggressive CRT-glitch. */
  @media (hover: hover) and (pointer: fine) {
    .bug:hover {
      opacity: 1;
      animation: bug-glitch 0.46s steps(1, end) infinite;
    }
    .bug:hover .mark {
      animation: bug-glitch-rgb 0.46s steps(1, end) infinite;
    }
  }
  /* Tap feedback on touch devices */
  .bug:active {
    opacity: 1;
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent-2);
  }

  /* Position + shadow jitter — discrete frames, no smoothing (= digital glitch) */
  @keyframes bug-glitch {
    0% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    10% {
      transform: translate(-3px, 1px);
      box-shadow: 8px 4px 0 var(--accent);
    }
    18% {
      transform: translate(2px, -2px);
      box-shadow: 3px 7px 0 var(--accent-2);
      clip-path: inset(0 0 40% 0);
    }
    26% {
      transform: translate(-1px, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    36% {
      transform: translate(4px, 0);
      box-shadow: 10px 5px 0 var(--bug-yellow);
      clip-path: inset(35% 0 0 0);
    }
    44% {
      transform: translate(0, 2px);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    56% {
      transform: translate(-2px, -1px);
      box-shadow: 4px 8px 0 var(--accent-2);
    }
    66% {
      transform: translate(2px, 1px);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 30% 0 0);
    }
    74% {
      transform: translate(-1px, 0);
      box-shadow: 6px 5px 0 var(--accent);
      clip-path: inset(0 0 0 0);
    }
    86% {
      transform: translate(0, 1px);
      box-shadow: 5px 5px 0 var(--accent-2);
    }
    100% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
  }

  /* RGB channel split on the wordmark — chromatic aberration */
  @keyframes bug-glitch-rgb {
    0% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    12% {
      text-shadow:
        2px 0 0 var(--accent-2),
        -2px 0 0 var(--accent);
    }
    24% {
      text-shadow:
        -3px 0 0 var(--accent-2),
        3px 0 0 var(--accent);
      transform: translate(1px, 0);
    }
    36% {
      text-shadow: none;
    }
    48% {
      text-shadow:
        1px 0 0 var(--accent-2),
        -1px 0 0 var(--accent);
      transform: translate(-1px, 0);
    }
    60% {
      text-shadow:
        -2px 0 0 var(--accent-2),
        2px 0 0 var(--accent);
    }
    72% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    84% {
      text-shadow:
        2px 0 0 var(--bug-yellow),
        -2px 0 0 var(--accent);
    }
    100% {
      text-shadow: none;
    }
  }

  /* Occasional idle glitch — quiet most of the cycle, ~0.5 s burst at the end. */
  @keyframes bug-glitch-idle {
    0%,
    92%,
    100% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    93% {
      transform: translate(-2px, 1px);
      box-shadow: 7px 4px 0 var(--accent);
    }
    94% {
      transform: translate(2px, -1px);
      box-shadow: 4px 6px 0 var(--accent-2);
      clip-path: inset(0 0 40% 0);
    }
    95% {
      transform: translate(0, 1px);
      box-shadow: 5px 5px 0 var(--accent-2);
      clip-path: inset(0 0 0 0);
    }
    96% {
      transform: translate(-1px, 0);
      box-shadow: 6px 5px 0 var(--accent-2);
    }
    97% {
      transform: translate(0, 0);
      box-shadow: 5px 5px 0 var(--accent-2);
    }
  }
  @keyframes bug-glitch-idle-mark {
    0%,
    92%,
    100% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    93% {
      text-shadow:
        2px 0 0 var(--accent-2),
        -2px 0 0 var(--accent);
    }
    95% {
      text-shadow:
        -1px 0 0 var(--accent-2),
        1px 0 0 var(--accent);
      transform: translate(1px, 0);
    }
    97% {
      text-shadow: none;
      transform: translate(0, 0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .bug,
    .bug .mark,
    .bug:hover,
    .bug:hover .mark {
      animation: none;
      opacity: 0.85;
    }
  }
  .mark {
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.2vw, 40px);
    letter-spacing: 2px;
    color: #fff;
  }
  /* small "on air" accent dot */
  .dot {
    width: clamp(7px, 1vw, 11px);
    height: clamp(7px, 1vw, 11px);
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 10px var(--accent);
    animation: pulse 2.4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
</style>
