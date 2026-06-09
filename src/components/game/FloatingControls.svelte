<!-- src/components/game/FloatingControls.svelte -->
<!--
  Connected-mode control bar pinned to the bottom-center of the TV when
  the GameSheet is closed. Carries everything the host needs at a glance:
  round indicator (pulsing dot + R{n}), phase-aware CTA (Start / Reveal
  with submission count / Next round), and an Open affordance to expand
  the full sheet (scoreboard, players, end game).

  Container/cta/ghost styles live in app.css under `.game-bar*`. Only
  Connected-specific chips/labels are local.

  Only mounted from App.svelte's TV branch when
  $gameMode === 'connected' && !gameSheetOpen.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { room } from '../../lib/stores.js';

  const dispatch = createEventDispatcher();
  $: phase = $room.session?.phase || 'idle';
  $: round = $room.session?.round || 0;
  $: connectedCount = ($room.players || []).filter((p) => p.connected !== false).length;
  $: submittedCount = Object.keys($room.submissions || {}).length;
  $: startDisabled = connectedCount === 0;
</script>

<div class="game-bar" role="group" aria-label="Game round controls">
  <span class="round-chip" aria-label="Current round">
    <span class="dot" aria-hidden="true"></span>
    R{round || 1}
  </span>

  {#if phase === 'idle'}
    <button
      class="game-bar__cta"
      type="button"
      on:click={() => dispatch('startRound')}
      disabled={startDisabled}
    >
      Start round
    </button>
  {:else if phase === 'guessing'}
    <button
      class="game-bar__cta"
      type="button"
      on:click={() => dispatch('reveal')}
      aria-live="polite"
    >
      Reveal <span class="sub">({submittedCount}/{connectedCount})</span>
    </button>
  {:else}
    <button class="game-bar__cta" type="button" on:click={() => dispatch('nextRound')}
      >Next round</button
    >
  {/if}

  <button
    class="game-bar__ghost"
    type="button"
    aria-label="Open game sheet"
    on:click={() => dispatch('open')}
  >
    Open
  </button>
</div>

<style>
  .round-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    background: var(--accent);
    color: #050505;
    border: 3px solid #050505;
    font-family: 'Anton', sans-serif;
    font-size: 15px;
    letter-spacing: 2px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #050505;
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      transform: scale(0.6);
      opacity: 0.4;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .dot {
      animation: none;
    }
  }
  .sub {
    font-family: 'VT323', monospace;
    font-size: 15px;
    letter-spacing: 1px;
    margin-left: 4px;
    opacity: 0.85;
  }
</style>
