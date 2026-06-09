<!-- src/components/game/Scoreboard.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  export let players = []; // [{id, name, score, connected}]
  export let highlightId = null;
  export let editable = false;

  const dispatch = createEventDispatcher();

  $: sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  function adjust(playerId, delta) {
    dispatch('scoreChange', { playerId, delta });
  }
</script>

<ol class="scoreboard">
  {#each sorted as p, i (p.id)}
    <li class:me={p.id === highlightId} class:offline={p.connected === false}>
      <span class="rank">{i + 1}</span>
      <span class="name">{p.name || 'Player'}</span>
      <span class="score">{p.score || 0}</span>
      {#if editable}
        <span class="adjust">
          <button
            type="button"
            class="adj-btn"
            aria-label="Decrease score for {p.name || 'player'}"
            on:click={() => adjust(p.id, -1)}
            disabled={(p.score || 0) <= 0}>−</button
          >
          <button
            type="button"
            class="adj-btn"
            aria-label="Increase score for {p.name || 'player'}"
            on:click={() => adjust(p.id, +1)}>+</button
          >
        </span>
      {/if}
    </li>
  {/each}
</ol>

<style>
  .scoreboard {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 6px;
  }
  .scoreboard li {
    display: grid;
    grid-template-columns: 32px 1fr auto auto;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.15);
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 1px;
    color: #fff;
  }
  .rank {
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.5);
    text-align: center;
  }
  .name {
    text-transform: uppercase;
  }
  .score {
    font-family: 'Anton', sans-serif;
    font-size: 20px;
    letter-spacing: 2px;
    color: var(--bug-yellow);
    font-variant-numeric: tabular-nums;
  }
  .scoreboard .me {
    border-color: var(--accent-2);
    box-shadow: 3px 3px 0 var(--accent-2);
  }
  .scoreboard .me .name {
    color: var(--accent-2);
  }
  .scoreboard .offline {
    opacity: 0.45;
  }
  .adjust {
    display: inline-flex;
    gap: 6px;
  }
  .adj-btn {
    min-width: 28px;
    min-height: 28px;
    padding: 0 6px;
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    line-height: 1;
    color: #050505;
    background: var(--accent-2);
    border: 2px solid #050505;
    box-shadow: 2px 2px 0 #050505;
    cursor: pointer;
    transition:
      transform 0.08s ease,
      box-shadow 0.08s ease;
  }
  .adj-btn:hover:not(:disabled) {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0 #050505;
  }
  .adj-btn:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 #050505;
  }
  .adj-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
