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

<Sheet {open} label="Game" heading="Game Mode" on:close={close}>
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
         The middle slot in solo is the existing three "I got it" toggles.
         Wired in Task 17. -->
    <slot name="solo" />
  {/if}
</Sheet>
