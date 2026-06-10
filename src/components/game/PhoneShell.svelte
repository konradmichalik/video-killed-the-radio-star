<!-- src/components/game/PhoneShell.svelte -->
<!--
  Full-viewport phone container for connected game mode.
  Replaces the Sheet wrapper so the experience feels like a dedicated app:
  VKTRS app icon top-left, wordmark top-right, PhoneRoomView in the middle,
  safe-area padding at the bottom. Keeps the same event surface so
  App.svelte wiring is unchanged.
-->
<script>
  import { phoneRoom } from '../../lib/stores.js';
  import PhoneRoomView from './PhoneRoomView.svelte';
  import VktrsIcon from '../VktrsIcon.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  const forward = (name) => (e) => dispatch(name, e.detail || {});
</script>

<div class="phone-shell" role="main" aria-label="Game mode">
  <span class="brand-icon" aria-hidden="true">
    <VktrsIcon size={42} />
  </span>

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
    padding: clamp(64px, 14vw, 92px) clamp(16px, 5vw, 26px) calc(28px + env(safe-area-inset-bottom));
    display: grid;
    grid-template-rows: 1fr;
    gap: 22px;
    z-index: 60;
  }
  /* App icon top-left — same square mark as favicon / station bug. The
     `vktrs-icon-glitch-idle` keyframe lives in src/app.css and is shared
     with StationLogo so both brand icons jitter on the same VHS cadence. */
  .brand-icon {
    position: absolute;
    top: 14px;
    left: 14px;
    display: inline-block;
    line-height: 0;
    z-index: 1;
    animation: vktrs-icon-glitch-idle 14s steps(1, end) infinite;
  }
  /* Corner wordmark — small, condensed, top-right. The PhoneRoomView header
     carries the room code on the left, so this never overlaps. */
  .corner-mark {
    position: absolute;
    top: 18px;
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
    .phone-mark-2,
    .brand-icon {
      animation: none !important;
    }
  }
</style>
