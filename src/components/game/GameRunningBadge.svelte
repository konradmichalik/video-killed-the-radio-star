<!-- src/components/game/GameRunningBadge.svelte -->
<!--
  Floating bottom-right indicator visible whenever a game session is active
  in TV mode. Tapping it re-opens the GameSheet so the host can drive the
  round controls without going through the Guide every time.

  Only mounted from App.svelte's TV branch (NOT the phone branch).
-->
<script>
  import { createEventDispatcher } from 'svelte';
  import { gameMode, room } from '../../lib/stores.js';
  const dispatch = createEventDispatcher();
  $: round = $room.session?.round ?? 0;
</script>

{#if $gameMode}
  <button class="badge" type="button" aria-label="Open game mode" on:click={() => dispatch('open')}>
    <span class="dot" aria-hidden="true"></span>
    <span class="label">GAME&nbsp;MODE</span>
    {#if round > 0}<span class="round">R{round}</span>{/if}
  </button>
{/if}

<style>
  .badge {
    position: fixed;
    right: 16px;
    bottom: calc(16px + env(safe-area-inset-bottom));
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--accent);
    color: #050505;
    border: 3px solid #050505;
    box-shadow: 5px 5px 0 #050505;
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .badge:hover {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .badge:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
  .dot {
    width: 10px;
    height: 10px;
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
  .round {
    background: #050505;
    color: var(--accent);
    padding: 2px 6px;
    font-size: 14px;
  }
</style>
