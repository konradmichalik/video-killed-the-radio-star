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
  <header class="shell-head">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">GAME MODE</span>
  </header>

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
    padding: clamp(16px, 4vw, 28px) clamp(16px, 5vw, 26px)
      calc(28px + env(safe-area-inset-bottom));
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 22px;
    z-index: 60;
  }
  .shell-head {
    display: grid;
    gap: 6px;
    padding-bottom: 14px;
    border-bottom: 3px solid var(--accent-2);
  }
  .shell-body {
    min-height: 0;
  }
</style>
