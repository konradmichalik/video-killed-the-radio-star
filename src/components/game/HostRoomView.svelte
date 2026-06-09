<!-- src/components/game/HostRoomView.svelte -->
<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import PlayerList from './PlayerList.svelte';
  import Scoreboard from './Scoreboard.svelte';

  export let roomCode;
  export let joinUrl;
  export let players = [];
  export let submissions = {};
  export let session; // { round, phase }
  export let connectedCount = 0;

  const dispatch = createEventDispatcher();
  let qrEl;
  let qrError = '';

  onMount(async () => {
    try {
      const { default: QRCode } = await import('qrcode');
      await QRCode.toCanvas(qrEl, joinUrl, { width: 200, margin: 1 });
    } catch {
      qrError = 'QR code unavailable — share the room code instead.';
    }
  });

  $: phase = session?.phase || 'idle';
  $: round = session?.round || 0;
  $: submittedCount = Object.keys(submissions).length;
</script>

<section class="host">
  <div class="qr-block">
    <canvas bind:this={qrEl}></canvas>
    <div class="code">{roomCode}</div>
    {#if qrError}<p class="err">{qrError}</p>{/if}
  </div>

  <div class="status">
    <h3>Round {round}</h3>
    <p>Phase: <strong>{phase}</strong></p>
    {#if phase === 'guessing'}
      <p>Submissions: {submittedCount}/{connectedCount}</p>
    {/if}
  </div>

  <div class="controls">
    {#if phase === 'idle'}
      <button on:click={() => dispatch('startRound')} disabled={connectedCount === 0}>Start round</button>
    {:else if phase === 'guessing'}
      <button on:click={() => dispatch('reveal')}>Reveal</button>
    {:else}
      <button on:click={() => dispatch('nextRound')}>Next round</button>
    {/if}
    <button class="ghost" on:click={() => dispatch('end')}>End game</button>
  </div>

  <div class="lists">
    <div>
      <h4>Players ({connectedCount})</h4>
      <PlayerList {players} {submissions} />
    </div>
    <div>
      <h4>Scoreboard</h4>
      <Scoreboard {players} />
    </div>
  </div>
</section>

<style>
  .host { display: grid; gap: 18px; }
  .qr-block { display: flex; align-items: center; gap: 16px; }
  .code { font-size: 2rem; letter-spacing: 0.18em; font-weight: 700; }
  .controls { display: flex; gap: 10px; flex-wrap: wrap; }
  .controls button {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 10px;
    background: var(--accent);
    color: #000;
    border: none;
    font-weight: 700;
  }
  .controls .ghost {
    background: transparent;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .lists { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  .err { color: #f88; }
</style>
