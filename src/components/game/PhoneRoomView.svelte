<!-- src/components/game/PhoneRoomView.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import Scoreboard from './Scoreboard.svelte';
  import YearInput from './YearInput.svelte';

  export let player; // {id, name}
  export let roomCode;
  export let session;
  export let scoreboard = [];
  export let mySubmission = null;
  export let connectionStatus = 'open';
  export let yearMin = 1900;
  export let yearMax = new Date().getFullYear();

  const dispatch = createEventDispatcher();
  let editingName = !player?.name;
  let nameDraft = player?.name || '';

  const saveName = () => {
    dispatch('setName', { name: nameDraft.trim() });
    editingName = false;
  };
  const lock = (e) => dispatch('guess', { year: e.detail.year });

  $: phase = session?.phase || 'idle';
</script>

<section class="phone">
  {#if connectionStatus !== 'open'}
    <div class="banner">Connection: {connectionStatus}</div>
  {/if}

  <header>
    <span>Room {roomCode}</span>
    {#if editingName}
      <input bind:value={nameDraft} placeholder="Your name" maxlength="20" />
      <button on:click={saveName}>Save</button>
    {:else}
      <span>You: <strong>{player.name}</strong></span>
      <button class="ghost" on:click={() => { editingName = true; }}>Change</button>
    {/if}
  </header>

  <main>
    {#if !session}
      <p>Waiting for host to start a game…</p>
    {:else if phase === 'idle'}
      <p>Get ready — round {session.round} is about to start.</p>
    {:else if phase === 'guessing'}
      {#if mySubmission}
        <p>Locked in: <strong>{mySubmission.year}</strong>. Waiting for reveal…</p>
      {:else}
        <h3>What year is this track?</h3>
        <YearInput min={yearMin} max={yearMax} on:lock={lock} />
      {/if}
    {:else}
      <p>Reveal! Scoreboard updating…</p>
    {/if}
  </main>

  <footer>
    <h4>Scoreboard</h4>
    <Scoreboard players={scoreboard} highlightId={player?.id} />
  </footer>
</section>

<style>
  .phone { display: grid; gap: 14px; }
  header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .banner {
    background: rgba(255, 200, 0, 0.15);
    padding: 6px 10px;
    border-radius: 6px;
    text-align: center;
  }
  button {
    min-height: 40px;
    padding: 0 12px;
    border-radius: 8px;
    background: var(--accent);
    color: #000;
    border: none;
  }
  button.ghost {
    background: transparent;
    color: inherit;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  input {
    flex: 1 1 120px;
    min-height: 40px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
    color: inherit;
  }
</style>
