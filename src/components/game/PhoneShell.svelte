<!-- src/components/game/PhoneShell.svelte -->
<!--
  Full-viewport phone container for connected game mode.
  Replaces the Sheet wrapper so the experience feels like a dedicated app:
  VKTRS wordmark at top, PhoneRoomView in the middle, safe-area padding at
  the bottom. Keeps the same event surface so App.svelte wiring is unchanged.
-->
<script>
  import { phoneRoom } from '../../lib/stores.js';
  import PhoneRoomView from './PhoneRoomView.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const forward = (name) => (e) => dispatch(name, e.detail || {});
</script>

<div class="phone-shell" role="main" aria-label="Game mode">
  <span class="corner-mark" aria-hidden="true">
    <span class="phone-mark phone-mark-1">VIDEO KILLED</span>
    <span class="phone-mark phone-mark-2">THE RADIO STAR</span>
  </span>

  <div class="shell-body">
    <PhoneRoomView
      player={$phoneRoom.player}
      roomCode={$phoneRoom.roomCode}
      session={$phoneRoom.session}
      scoreboard={$phoneRoom.scoreboard}
      mySubmission={$phoneRoom.mySubmission}
      connectionStatus={$phoneRoom.connectionStatus}
      lastReveal={$phoneRoom.lastReveal}
      yearMin={$phoneRoom.yearRange?.min}
      yearMax={$phoneRoom.yearRange?.max}
      on:setName={forward('setName')}
      on:guess={forward('guess')}
    />
  </div>
</div>

<style>
  .phone-shell {
    position: fixed;
    inset: 0;
    overflow-y: auto;
    background: var(--bg, #000);
    color: #fff;
    padding: clamp(16px, 4vw, 28px) clamp(16px, 5vw, 26px) calc(28px + env(safe-area-inset-bottom));
    display: grid;
    grid-template-rows: 1fr;
    gap: 22px;
    z-index: 60;
  }
  /* Corner wordmark — small, condensed, top-right. The PhoneRoomView header
     carries the room code on the left, so this never overlaps. */
  .corner-mark {
    position: absolute;
    top: 12px;
    right: 14px;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 0.92;
    font-family: 'Anton', sans-serif;
    text-transform: uppercase;
    pointer-events: none;
    z-index: 1;
  }
  .phone-mark {
    font-size: 13px;
    letter-spacing: 2px;
  }
  .phone-mark-1 {
    color: var(--ink);
    animation: wordmark-glitch-1 4.6s steps(1, end) infinite;
  }
  .phone-mark-2 {
    color: var(--accent);
    text-shadow: 2px 2px 0 rgba(8, 217, 214, 0.55);
    animation: wordmark-glitch-2 4.6s steps(1, end) infinite;
    animation-delay: 0.2s;
  }
  .shell-body {
    min-height: 0;
    padding-top: 8px;
  }
  @media (prefers-reduced-motion: reduce) {
    .phone-mark-1,
    .phone-mark-2 {
      animation: none !important;
    }
  }
</style>
