<script>
  import { fly } from 'svelte/transition';
  import { upNext, showUpNext, hintsOn } from '../lib/stores.js';
</script>

{#if $showUpNext && $hintsOn && $upNext}
  <div class="up-next" transition:fly={{ x: 80, duration: 450 }}>
    <span class="kicker">▶ COMING UP</span>
    <span class="artist">{$upNext.artist}</span>
    <span class="title">{$upNext.title}</span>
  </div>
{/if}

<style>
  .up-next {
    position: absolute;
    /* Sit clearly below the station bug — its container reaches ~62–84 px
       (14–36 px top + the 48 px icon) so the teaser needs ≥ ~80 px of
       breathing room at the top to keep a visible gap. */
    top: calc(clamp(82px, 13vh, 122px) + env(safe-area-inset-top, 0px));
    right: env(safe-area-inset-right, 0px);
    z-index: 8;
    pointer-events: none;
    text-align: right;
    padding: 10px 20px 12px 28px;
    background: linear-gradient(270deg, rgba(0, 0, 0, 0.82) 0%, rgba(0, 0, 0, 0.45) 100%);
    border-right: 10px solid var(--accent-2);
    box-shadow: 0 0 18px rgba(8, 217, 214, 0.4);
    /* Periodic cyan-edge flicker matches the lower-third bar-glitch rhythm. */
    animation: un-edge-glitch 5s steps(1, end) 1.4s infinite;
  }
  .kicker {
    display: block;
    font-family: 'VT323', monospace;
    font-size: clamp(14px, 1.8vw, 20px);
    letter-spacing: 3px;
    color: var(--accent-2);
    text-shadow: 0 0 10px var(--accent-2);
  }
  .artist {
    display: block;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.2vw, 38px);
    line-height: 1.05;
    text-transform: uppercase;
    margin-top: 2px;
    /* Entrance glitch + periodic re-glitch while visible. */
    animation:
      un-text-glitch 0.55s steps(1, end),
      un-text-idle-glitch 5s steps(1, end) 1.2s infinite;
  }
  .title {
    display: block;
    font-family: 'Archivo', sans-serif;
    font-weight: 700;
    font-size: clamp(13px, 1.8vw, 20px);
    color: #fff;
    opacity: 0.85;
    /* Slightly out-of-phase from the artist so bursts don't line up. */
    animation:
      un-text-glitch 0.55s steps(1, end) 40ms,
      un-text-idle-glitch 5s steps(1, end) 1.6s infinite;
  }
  /* Entrance text glitch — RGB-split text-shadow + tiny position jitter,
     applied directly to the artist / title glyphs so the chromatic
     aberration reads (not blurred around the dark background). */
  @keyframes un-text-glitch {
    0%,
    25% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    35% {
      text-shadow:
        3px 0 0 var(--accent),
        -3px 0 0 var(--accent-2);
      transform: translate(2px, 0);
    }
    50% {
      text-shadow:
        -3px 0 0 var(--accent),
        3px 0 0 var(--accent-2);
      transform: translate(-1px, 1px);
    }
    65% {
      text-shadow:
        1px 0 0 var(--accent),
        -1px 0 0 var(--accent-2);
      transform: translate(1px, 0);
    }
    78%,
    100% {
      text-shadow: none;
      transform: translate(0, 0);
    }
  }
  /* Periodic re-glitch on the artist/title — short burst once per cycle. */
  @keyframes un-text-idle-glitch {
    0%,
    5% {
      text-shadow: none;
      transform: translate(0, 0);
    }
    6% {
      text-shadow:
        2px 0 0 var(--accent),
        -2px 0 0 var(--accent-2);
      transform: translate(1px, 0);
    }
    9% {
      text-shadow:
        -2px 0 0 var(--accent),
        2px 0 0 var(--accent-2);
      transform: translate(-1px, 1px);
    }
    12% {
      text-shadow:
        1px 0 0 var(--accent),
        -1px 0 0 var(--accent-2);
      transform: translate(0, 0);
    }
    15%,
    100% {
      text-shadow: none;
      transform: translate(0, 0);
    }
  }
  /* Edge flicker — same cadence as the text idle glitch. */
  @keyframes un-edge-glitch {
    0%,
    5% {
      border-right-color: var(--accent-2);
      box-shadow: 0 0 18px rgba(8, 217, 214, 0.4);
    }
    6% {
      border-right-color: var(--accent);
      box-shadow: 0 0 18px rgba(255, 46, 99, 0.4);
    }
    9% {
      border-right-color: var(--bug-yellow);
      box-shadow: 0 0 18px rgba(255, 230, 0, 0.4);
    }
    12% {
      border-right-color: var(--accent);
      box-shadow: 0 0 18px rgba(255, 46, 99, 0.4);
    }
    15%,
    100% {
      border-right-color: var(--accent-2);
      box-shadow: 0 0 18px rgba(8, 217, 214, 0.4);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .up-next,
    .artist,
    .title {
      animation: none !important;
    }
  }
</style>
