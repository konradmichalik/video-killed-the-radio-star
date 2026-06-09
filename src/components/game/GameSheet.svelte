<!-- src/components/game/GameSheet.svelte -->
<script>
  import Sheet from '../Sheet.svelte';
  import ModeSelector from './ModeSelector.svelte';
  import HostRoomView from './HostRoomView.svelte';
  import PhoneRoomView from './PhoneRoomView.svelte';
  import { gameMode, room, phoneRoom } from '../../lib/stores.js';
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let isPhone = false; // App.svelte passes true when ?join is set
  export let roomCode = null;
  export let joinUrl = '';

  const dispatch = createEventDispatcher();
  const close = () => dispatch('close');

  // Bubble all sub-events to the parent (App.svelte) so it can drive
  // the actual game lifecycle (peerjs, player, lower-third visibility).
  const forward = (name) => (e) => dispatch(name, e.detail || {});
</script>

<Sheet {open} label="Game mode" accent="var(--accent-2)" on:close={close}>
  <svelte:fragment slot="title">
    <span class="sheet-wordmark" aria-hidden="true">
      <span class="sheet-wm-1">VIDEO KILLED</span>
      <span class="sheet-wm-2">THE RADIO STAR</span>
    </span>
    <span class="sheet-subheading">GAME MODE</span>
  </svelte:fragment>

  {#if isPhone}
    <PhoneRoomView
      player={$phoneRoom.player}
      roomCode={$phoneRoom.roomCode}
      session={$phoneRoom.session}
      scoreboard={$phoneRoom.scoreboard}
      mySubmission={$phoneRoom.mySubmission}
      connectionStatus={$phoneRoom.connectionStatus}
      yearMin={$phoneRoom.yearRange?.min}
      yearMax={$phoneRoom.yearRange?.max}
      on:setName={forward('setName')}
      on:guess={forward('guess')}
    />
  {:else if $gameMode === null}
    <ModeSelector on:start={forward('startMode')} />
  {:else if $gameMode === 'connected'}
    <HostRoomView
      {roomCode}
      {joinUrl}
      players={$room.players}
      submissions={$room.submissions}
      session={$room.session}
      connectedCount={$room.players.filter((p) => p.connected).length}
      on:startRound={forward('startRound')}
      on:reveal={forward('reveal')}
      on:nextRound={forward('nextRound')}
      on:end={forward('endSession')}
    />
  {:else if $gameMode === 'solo'}
    <!-- Solo round shell shares the same trio: Start round / Reveal / Next.
         The middle slot in solo is the existing three "I got it" toggles
         provided by App.svelte via the "solo" named slot. -->
    <section class="solo-shell">
      <div class="status">
        <h3 class="round">ROUND {$room.session?.round || 0}</h3>
        <div class="phase-row">
          <span class="phase-label">Phase:</span>
          <span class="phase-value">{$room.session?.phase || 'idle'}</span>
        </div>
      </div>
      <div class="controls">
        {#if ($room.session?.phase || 'idle') === 'idle'}
          <button class="cta" on:click={() => dispatch('startRound')}>Start round</button>
        {:else if $room.session?.phase === 'guessing'}
          <button class="cta" on:click={() => dispatch('reveal')}>Reveal</button>
        {:else}
          <button class="cta" on:click={() => dispatch('nextRound')}>Next round</button>
        {/if}
        <button class="ghost" on:click={() => dispatch('endSession')}>End game</button>
      </div>
      <slot name="solo" />
    </section>
  {/if}
</Sheet>

<style>
  .solo-shell {
    display: grid;
    gap: 22px;
  }
  .status {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
  }
  .round {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(24px, 4vw, 32px);
    letter-spacing: 3px;
    color: #fff;
    text-transform: uppercase;
  }
  .phase-row {
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
  }
  .phase-label {
    color: rgba(255, 255, 255, 0.55);
  }
  .phase-value {
    color: var(--accent-2);
    text-transform: uppercase;
    margin-left: 6px;
  }
  .controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cta {
    flex: 1 1 auto;
    min-width: 180px;
    min-height: 52px;
    padding: 0 24px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 3vw, 22px);
    letter-spacing: 3px;
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
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .cta:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
  .ghost {
    min-height: 52px;
    padding: 0 20px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(16px, 2.4vw, 20px);
    letter-spacing: 3px;
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
    box-shadow: 5px 5px 0 var(--accent);
    transform: translate(-2px, -2px);
  }
  .ghost:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent);
  }
</style>
