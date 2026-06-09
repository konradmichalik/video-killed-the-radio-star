<!-- src/components/game/PhoneRoomView.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  import Scoreboard from './Scoreboard.svelte';
  import YearInput from './YearInput.svelte';
  import NetworkBadge from './NetworkBadge.svelte';

  export let player; // {id, name}
  export let roomCode;
  export let session;
  export let scoreboard = [];
  export let mySubmission = null;
  export let connectionStatus = 'open';
  export let lastReveal = null; // { year, title, artist, winners, submissions }
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

  // Reveal feedback derived from props (no mutation, no side effects).
  $: myGuessYear = lastReveal?.submissions?.[player?.id]?.year ?? mySubmission?.year ?? null;
  $: actualYear = lastReveal?.year ?? null;
  $: delta = actualYear != null && myGuessYear != null ? Math.abs(actualYear - myGuessYear) : null;
  $: didWin = !!(player?.id && lastReveal?.winners?.includes(player.id));
</script>

<section class="phone">
  {#if connectionStatus !== 'open'}
    <div class="banner">Connection: {connectionStatus}</div>
  {/if}

  <header>
    <div class="room-line">
      <span class="room-label">ROOM</span>
      <span class="room-code">{roomCode}</span>
      <NetworkBadge status={connectionStatus} />
    </div>
    {#if editingName}
      <div class="name-row">
        <input bind:value={nameDraft} placeholder="Your name" maxlength="20" />
        <button class="save" on:click={saveName}>Save</button>
      </div>
    {:else}
      <div class="name-row">
        <span class="you-label">You: <strong>{player.name}</strong></span>
        <button
          class="ghost"
          on:click={() => {
            editingName = true;
          }}>Change</button
        >
      </div>
    {/if}
  </header>

  <main>
    {#if !session}
      <p class="msg">Waiting for host to start a game…</p>
    {:else if phase === 'idle'}
      <p class="msg">Get ready — round {session.round} is about to start.</p>
    {:else if phase === 'guessing'}
      {#if mySubmission}
        <p class="msg locked">
          Locked in: <strong>{mySubmission.year}</strong>. Waiting for reveal…
        </p>
      {:else}
        <h3 class="prompt">What year is this track?</h3>
        <YearInput min={yearMin} max={yearMax} on:lock={lock} />
      {/if}
    {:else}
      <div class="reveal-card">
        {#if actualYear != null}
          <p class="reveal-label">Actual year</p>
          <p class="reveal-year">{actualYear}</p>
          {#if lastReveal?.artist || lastReveal?.title}
            <p class="reveal-track">
              {lastReveal?.artist ?? ''}{lastReveal?.artist && lastReveal?.title
                ? ' — '
                : ''}{lastReveal?.title ?? ''}
            </p>
          {/if}
          {#if myGuessYear != null}
            <p class="reveal-guess">
              Your guess: <strong>{myGuessYear}</strong>
              {#if delta === 0}
                — spot on!
              {:else if delta != null}
                — off by {delta} year{delta === 1 ? '' : 's'}
              {/if}
            </p>
          {:else}
            <p class="reveal-guess miss">No guess submitted this round.</p>
          {/if}
          {#if didWin}
            <p class="reveal-badge win">You got the point!</p>
          {:else}
            <p class="reveal-badge">Closer luck next round.</p>
          {/if}
        {:else}
          <p class="msg reveal">Reveal! Scoreboard updating…</p>
        {/if}
      </div>
    {/if}
  </main>

  <footer>
    <h4 class="board-title">Scoreboard</h4>
    <Scoreboard players={scoreboard} highlightId={player?.id} />
  </footer>
</section>

<style>
  .phone {
    display: grid;
    gap: 18px;
  }
  .banner {
    padding: 8px 12px;
    background: var(--bug-yellow);
    color: #050505;
    border: 3px solid #050505;
    box-shadow: 4px 4px 0 #050505;
    text-align: center;
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  header {
    display: grid;
    gap: 12px;
  }
  .room-line {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .room-label {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.55);
  }
  .room-code {
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 5vw, 30px);
    letter-spacing: 5px;
    color: var(--bug-yellow);
    background: #050505;
    border: 2px solid #050505;
    padding: 2px 10px;
  }
  .name-row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .you-label {
    flex: 1;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.7);
  }
  .you-label strong {
    color: #fff;
    text-transform: uppercase;
  }

  input {
    flex: 1 1 140px;
    min-height: 44px;
    padding: 6px 12px;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: #fff;
    background: rgba(0, 0, 0, 0.45);
    border: 3px solid #fff;
    outline: none;
  }
  input:focus-visible {
    border-color: var(--accent-2);
  }
  .save {
    min-height: 44px;
    padding: 0 18px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
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
  .save:hover {
    box-shadow: 6px 6px 0 #050505;
    transform: translate(-1px, -1px);
  }
  .save:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #050505;
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
    border: 2px solid #fff;
    cursor: pointer;
    transition:
      color 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.1s ease,
      transform 0.1s ease;
  }
  .ghost:hover {
    color: var(--accent);
    border-color: var(--accent);
    box-shadow: 3px 3px 0 var(--accent);
    transform: translate(-1px, -1px);
  }
  .ghost:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent);
  }

  .msg {
    margin: 0;
    padding: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.8);
  }
  .msg strong {
    color: var(--bug-yellow);
  }
  .msg.reveal {
    box-shadow: 5px 5px 0 var(--bug-yellow);
    color: var(--bug-yellow);
  }
  .prompt {
    margin: 0 0 12px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 4vw, 30px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
  }
  .board-title {
    margin: 0 0 10px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent-2);
    text-transform: uppercase;
  }

  .reveal-card {
    display: grid;
    gap: 10px;
    padding: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--bug-yellow);
  }
  .reveal-label {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
  }
  .reveal-year {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(54px, 12vw, 96px);
    letter-spacing: 6px;
    line-height: 1;
    color: var(--bug-yellow);
    font-variant-numeric: tabular-nums;
  }
  .reveal-track {
    margin: 0;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: #fff;
  }
  .reveal-guess {
    margin: 6px 0 0;
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.85);
  }
  .reveal-guess strong {
    color: var(--accent-2);
  }
  .reveal-guess.miss {
    color: rgba(255, 255, 255, 0.6);
  }
  .reveal-badge {
    margin: 8px 0 0;
    padding: 10px 14px;
    font-family: 'Anton', sans-serif;
    font-size: 20px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 3px solid #fff;
  }
  .reveal-badge.win {
    color: #050505;
    background: var(--accent);
    border-color: #050505;
    box-shadow: 4px 4px 0 #050505;
  }
</style>
