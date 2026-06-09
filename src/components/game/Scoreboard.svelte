<!-- src/components/game/Scoreboard.svelte -->
<script>
  export let players = []; // [{id, name, score, connected}]
  export let highlightId = null;

  $: sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
</script>

<ol class="scoreboard">
  {#each sorted as p (p.id)}
    <li class:me={p.id === highlightId} class:offline={p.connected === false}>
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
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
  }
  .scoreboard .me {
    outline: 2px solid var(--accent);
  }
  .scoreboard .offline {
    opacity: 0.45;
  }
  .score {
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
</style>
