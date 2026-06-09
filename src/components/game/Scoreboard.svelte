<!-- src/components/game/Scoreboard.svelte -->
<script>
  export let players = []; // [{id, name, score, connected}]
  export let highlightId = null;

  $: sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
</script>

<ol class="scoreboard">
  {#each sorted as p, i (p.id)}
    <li class:me={p.id === highlightId} class:offline={p.connected === false}>
      <span class="rank">{i + 1}</span>
      <span class="name">{p.name || 'Player'}</span>
      <span class="score">{p.score || 0}</span>
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
    grid-template-columns: 32px 1fr auto;
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
</style>
