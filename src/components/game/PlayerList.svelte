<!-- src/components/game/PlayerList.svelte -->
<script>
  export let players = [];
  export let submissions = {}; // {[playerId]: {year}}
</script>

<ul class="players">
  {#each players as p (p.id)}
    <li class:offline={!p.connected}>
      <span class="dot"></span>
      <span class="name">{p.name || 'Player'}</span>
      {#if submissions[p.id]}
        <span class="badge">✓</span>
      {/if}
    </li>
  {/each}
</ul>

<style>
  .players {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 4px;
  }
  .players li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }
  .offline {
    opacity: 0.45;
  }
  .offline .dot {
    background: #666;
  }
  .badge {
    margin-left: auto;
    color: var(--accent);
  }
</style>
