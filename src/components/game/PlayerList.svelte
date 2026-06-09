<!-- src/components/game/PlayerList.svelte -->
<script>
  export let players = [];
  export let submissions = {}; // {[playerId]: {year}}
</script>

<ul class="players">
  {#each players as p (p.id)}
    <li class:offline={!p.connected}>
      <span class="dot" aria-hidden="true"></span>
      <span class="name">{p.name || 'Player'}</span>
      {#if submissions[p.id]}
        <span class="badge" aria-label="Submitted">LOCKED</span>
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
    gap: 8px;
  }
  .players li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.04);
    border: 2px solid rgba(255, 255, 255, 0.15);
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 1px;
    color: #fff;
  }
  .dot {
    width: 10px;
    height: 10px;
    background: var(--accent-2);
    box-shadow: 0 0 6px var(--accent-2);
  }
  .name {
    flex: 1;
    text-transform: uppercase;
  }
  .offline {
    opacity: 0.45;
    border-color: rgba(255, 255, 255, 0.08);
  }
  .offline .dot {
    background: #666;
    box-shadow: none;
  }
  .badge {
    margin-left: auto;
    font-family: 'Anton', sans-serif;
    font-size: 14px;
    letter-spacing: 2px;
    color: #050505;
    background: var(--bug-yellow);
    border: 2px solid #050505;
    padding: 2px 8px;
  }
</style>
