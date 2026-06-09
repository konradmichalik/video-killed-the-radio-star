<!-- src/components/game/FloatingControls.svelte -->
<!--
  Mini control bar pinned to the bottom-center of the TV when a game is
  running (solo or connected) but the host has closed the GameSheet.
  Mirrors the three phase-aware CTAs (Start / Reveal / Next) so a round
  can be driven without reopening the sheet. Coexists with
  GameRunningBadge (bottom-right) which provides the reopen affordance.

  Only mounted from App.svelte's TV branch when $gameMode !== null && !gameSheetOpen.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { gameMode, room } from '../../lib/stores.js';

  const dispatch = createEventDispatcher();
  $: phase = $room.session?.phase || 'idle';
  $: connectedCount = ($room.players || []).filter((p) => p.connected !== false).length;
  $: startDisabled = $gameMode === 'connected' && connectedCount === 0;
</script>

<div class="bar" role="group" aria-label="Game round controls">
  {#if phase === 'idle'}
    <button
      class="cta"
      type="button"
      on:click={() => dispatch('startRound')}
      disabled={startDisabled}
    >
      Start round
    </button>
  {:else if phase === 'guessing'}
    <button class="cta" type="button" on:click={() => dispatch('reveal')}>Reveal</button>
  {:else}
    <button class="cta" type="button" on:click={() => dispatch('nextRound')}>Next round</button>
  {/if}

  <button
    class="ghost"
    type="button"
    aria-label="Open game sheet"
    on:click={() => dispatch('open')}
  >
    Open
  </button>
</div>

<style>
  .bar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(20px + env(safe-area-inset-bottom));
    z-index: 41;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: rgba(5, 5, 5, 0.78);
    border: 3px solid #050505;
    box-shadow: 4px 4px 0 #050505;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    flex-wrap: wrap;
    max-width: calc(100vw - 32px);
    justify-content: center;
  }
  .cta {
    min-height: 40px;
    padding: 0 16px;
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #050505;
    background: var(--accent-2);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 4px 4px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .cta:hover:not(:disabled) {
    box-shadow: 6px 6px 0 #050505;
    transform: translate(-1px, -1px);
  }
  .cta:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #050505;
  }
  .cta:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .ghost {
    min-height: 40px;
    padding: 0 14px;
    font-family: 'Anton', sans-serif;
    font-size: 14px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 3px solid #fff;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      color 0.12s ease,
      border-color 0.12s ease;
  }
  .ghost:hover {
    color: var(--accent);
    border-color: var(--accent);
    box-shadow: 4px 4px 0 var(--accent);
    transform: translate(-1px, -1px);
  }
  .ghost:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent);
  }

  /* On narrow screens (phone-width), nudge above GameRunningBadge so they
     don't visually collide at bottom-right. */
  @media (max-width: 600px) {
    .bar {
      bottom: calc(72px + env(safe-area-inset-bottom));
    }
  }
</style>
