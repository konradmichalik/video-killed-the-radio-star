<!-- src/components/game/GameSheet.svelte -->
<script>
  import Sheet from '../Sheet.svelte';
  import ModeSelector from './ModeSelector.svelte';
  import HostRoomView from './HostRoomView.svelte';
  import PhoneRoomView from './PhoneRoomView.svelte';
  import { gameMode, room, phoneRoom, guessStats } from '../../lib/stores.js';
  import { hitRate } from '../../lib/game.js';
  import { createEventDispatcher } from 'svelte';

  export let open = false;
  export let isPhone = false; // App.svelte passes true when ?join is set
  export let roomCode = null;
  export let joinUrl = '';
  export let roomError = false;

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
      {roomError}
      players={$room.players}
      submissions={$room.submissions}
      session={$room.session}
      connectedCount={$room.players.filter((p) => p.connected).length}
      on:startRound={forward('startRound')}
      on:reveal={forward('reveal')}
      on:nextRound={forward('nextRound')}
      on:end={forward('endSession')}
      on:scoreChange={forward('scoreChange')}
      on:kick={forward('kick')}
    />
  {:else if $gameMode === 'solo'}
    <!-- Solo plays via the GuessGame bar bottom-center (Reveal + self-rate).
         The sheet shows running stats (analogous to Connected's scoreboard)
         and the exit button. -->
    <section class="solo-shell">
      <h3 class="stats-title">Stats</h3>
      <dl class="stats">
        <div class="stat">
          <dt>Streak</dt>
          <dd>{$guessStats.streak}</dd>
        </div>
        <div class="stat">
          <dt>Best</dt>
          <dd>{$guessStats.best}</dd>
        </div>
        <div class="stat">
          <dt>Played</dt>
          <dd>{$guessStats.played}</dd>
        </div>
        <div class="stat">
          <dt>Hit&nbsp;rate</dt>
          <dd>{$guessStats.played ? `${hitRate($guessStats)}%` : '—'}</dd>
        </div>
      </dl>
      <button class="btn-brutal-ghost" on:click={() => dispatch('endSession')}>End game</button>
    </section>
  {/if}
</Sheet>

<style>
  .solo-shell {
    display: grid;
    gap: 18px;
    justify-items: start;
  }
  .stats-title {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent-2);
    text-transform: uppercase;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 10px;
    width: 100%;
    margin: 0;
  }
  .stat {
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 4px 4px 0 var(--accent-2);
    display: grid;
    gap: 4px;
  }
  .stat dt {
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
  }
  .stat dd {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 3vw, 28px);
    letter-spacing: 2px;
    color: var(--bug-yellow);
  }
  /* End-game uses the shared .btn-brutal-ghost — no local styles needed. */
</style>
