<!-- src/components/game/EndGameCelebration.svelte -->
<!--
  Full-screen "winner!" curtain shown on the TV when the host taps End game
  in Connected mode. The actual session teardown is deferred until the user
  dismisses this overlay (see triggerEndGame / finalizeEndGame in App.svelte)
  so the scoreboard snapshot still reflects the final standings.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import Scoreboard from './Scoreboard.svelte';

  export let players = []; // [{id, name, score, connected}]

  const dispatch = createEventDispatcher();
  $: sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  $: winner = sorted[0];
  $: winnerName = winner?.name || 'Nobody';
  $: winnerScore = winner?.score || 0;
</script>

<div class="curtain" role="dialog" aria-modal="true" aria-label="Game over">
  <div class="card">
    <div class="trophy-frame" aria-hidden="true">
      <div class="trophy">
        <svg viewBox="0 0 64 64" width="128" height="128" focusable="false">
          <!-- Cup body -->
          <path
            d="M16 8 H48 V20 C48 32 40 40 32 40 C24 40 16 32 16 20 Z"
            fill="var(--bug-yellow)"
            stroke="#050505"
            stroke-width="5"
            stroke-linejoin="round"
          />
          <!-- Left handle -->
          <path
            d="M16 14 C8 14 8 26 16 26"
            fill="none"
            stroke="#050505"
            stroke-width="5"
            stroke-linecap="round"
          />
          <!-- Right handle -->
          <path
            d="M48 14 C56 14 56 26 48 26"
            fill="none"
            stroke="#050505"
            stroke-width="5"
            stroke-linecap="round"
          />
          <!-- Stem -->
          <rect
            x="28"
            y="40"
            width="8"
            height="8"
            fill="var(--bug-yellow)"
            stroke="#050505"
            stroke-width="5"
          />
          <!-- Base -->
          <rect
            x="16"
            y="48"
            width="32"
            height="10"
            fill="var(--bug-yellow)"
            stroke="#050505"
            stroke-width="5"
          />
        </svg>
      </div>
    </div>

    <p class="kicker">Game over</p>
    <h2 class="winner">
      <span class="wm-1">WINNER</span>
      <span class="wm-2">{winnerName}</span>
    </h2>
    {#if winner}
      <p class="score">{winnerScore} pts</p>
    {/if}

    <div class="board">
      <h3 class="board-title">Final scoreboard</h3>
      <Scoreboard {players} highlightId={winner?.id} />
    </div>

    <button class="cta" type="button" on:click={() => dispatch('dismiss')}>Done</button>
  </div>
</div>

<style>
  .curtain {
    position: fixed;
    inset: 0;
    z-index: 60;
    background: rgba(0, 0, 0, 0.92);
    display: grid;
    place-items: center;
    padding: clamp(16px, 4vw, 32px);
    overflow-y: auto;
  }
  .card {
    width: min(720px, 100%);
    display: grid;
    gap: 18px;
    justify-items: center;
    text-align: center;
    padding: clamp(20px, 4vw, 36px);
    background: #050505;
    border: 4px solid var(--accent-2);
    box-shadow: 8px 8px 0 var(--accent);
  }
  .trophy-frame {
    display: inline-block;
    padding: 14px 18px;
    background: var(--accent);
    border: 5px solid #050505;
    box-shadow:
      8px 8px 0 var(--accent-2),
      16px 16px 0 #050505;
    transform: rotate(-2deg);
    animation: trophy-frame-glitch 2.4s steps(1, end) infinite;
  }
  .trophy {
    line-height: 0;
    display: block;
    filter: drop-shadow(4px 4px 0 #050505) drop-shadow(-3px 0 0 var(--accent-2));
    animation: trophy-glitch 2.4s steps(1, end) infinite;
  }
  @keyframes trophy-glitch {
    0%,
    72%,
    100% {
      transform: translate(0, 0) skew(0deg);
      filter: drop-shadow(4px 4px 0 #050505) drop-shadow(-3px 0 0 var(--accent-2));
    }
    73% {
      transform: translate(-4px, 2px) skew(-3deg);
      filter: drop-shadow(6px 0 0 var(--accent)) drop-shadow(-6px 0 0 var(--accent-2))
        drop-shadow(4px 4px 0 #050505);
    }
    76% {
      transform: translate(5px, -2px) skew(2deg);
      filter: drop-shadow(-6px 0 0 var(--accent)) drop-shadow(6px 0 0 var(--accent-2))
        drop-shadow(4px 4px 0 #050505);
    }
    79% {
      transform: translate(-3px, 3px) skew(0deg);
      filter: drop-shadow(0 -4px 0 var(--bug-yellow)) drop-shadow(4px 4px 0 #050505);
    }
    82% {
      transform: translate(2px, -3px) skew(1deg);
      filter: drop-shadow(4px 0 0 #ff00ea) drop-shadow(-4px 0 0 #00f0ff)
        drop-shadow(4px 4px 0 #050505);
    }
    85% {
      transform: translate(0, 0) skew(0deg);
      filter: drop-shadow(4px 4px 0 #050505) drop-shadow(-3px 0 0 var(--accent-2));
    }
    88% {
      transform: translate(-2px, 0) skew(-1deg);
      filter: drop-shadow(3px 0 0 var(--accent)) drop-shadow(4px 4px 0 #050505);
    }
    91% {
      transform: translate(0, 0) skew(0deg);
      filter: drop-shadow(4px 4px 0 #050505) drop-shadow(-3px 0 0 var(--accent-2));
    }
  }
  @keyframes trophy-frame-glitch {
    0%,
    72%,
    100% {
      transform: rotate(-2deg) translate(0, 0);
      box-shadow:
        8px 8px 0 var(--accent-2),
        16px 16px 0 #050505;
    }
    74% {
      transform: rotate(-2deg) translate(-3px, 2px);
      box-shadow:
        10px 6px 0 var(--accent),
        18px 14px 0 #050505;
    }
    78% {
      transform: rotate(-1deg) translate(3px, -2px);
      box-shadow:
        6px 10px 0 var(--accent-2),
        14px 18px 0 #050505;
    }
    82% {
      transform: rotate(-2deg) translate(-2px, 0);
      box-shadow:
        8px 8px 0 var(--bug-yellow),
        16px 16px 0 #050505;
    }
    87% {
      transform: rotate(-2deg) translate(0, 0);
      box-shadow:
        8px 8px 0 var(--accent-2),
        16px 16px 0 #050505;
    }
  }
  .kicker {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.55);
  }
  .winner {
    margin: 0;
    display: grid;
    gap: 4px;
    font-family: 'Anton', sans-serif;
    text-transform: uppercase;
    line-height: 0.92;
  }
  .wm-1 {
    font-size: clamp(28px, 5vw, 44px);
    letter-spacing: 6px;
    color: var(--ink);
    animation: wordmark-glitch-1 4.6s steps(1, end) infinite;
  }
  .wm-2 {
    font-size: clamp(40px, 8vw, 84px);
    letter-spacing: 4px;
    color: var(--bug-yellow);
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
    text-shadow: 6px 6px 0 var(--accent);
    animation: wordmark-glitch-2 4.6s steps(1, end) infinite;
    animation-delay: 0.2s;
  }
  .score {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 3vw, 28px);
    letter-spacing: 3px;
    color: var(--accent-2);
  }
  .board {
    width: 100%;
    display: grid;
    gap: 8px;
    max-height: 40vh;
    overflow-y: auto;
  }
  .board-title {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent-2);
    text-transform: uppercase;
    text-align: left;
  }
  /* Highlight the winner row inside the embedded scoreboard with a gold
     pulse so it pops above the rest. */
  .board :global(.scoreboard li.me) {
    border-color: var(--bug-yellow);
    box-shadow: 4px 4px 0 var(--bug-yellow);
    animation: winner-pulse 2.2s ease-in-out infinite;
  }
  .board :global(.scoreboard li.me .name),
  .board :global(.scoreboard li.me .score) {
    color: var(--bug-yellow);
  }

  @keyframes winner-pulse {
    0%,
    100% {
      box-shadow: 4px 4px 0 var(--bug-yellow);
    }
    50% {
      box-shadow: 6px 6px 0 var(--accent);
    }
  }

  .cta {
    min-height: 52px;
    padding: 0 28px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 2.5vw, 22px);
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #050505;
    background: var(--accent-2);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 5px 5px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .cta:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 #050505;
  }
  .cta:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }

  @media (prefers-reduced-motion: reduce) {
    .trophy-frame,
    .trophy,
    .wm-1,
    .wm-2,
    .board :global(.scoreboard li.me) {
      animation: none !important;
    }
    .trophy-frame {
      transform: none;
    }
  }
</style>
