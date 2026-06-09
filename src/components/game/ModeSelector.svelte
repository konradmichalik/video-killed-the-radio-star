<!-- src/components/game/ModeSelector.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="cards">
  <article class="card">
    <h3>🎲 Solo</h3>
    <p>Rate yourself — works alone or with a friend on the couch. Tracks your streak.</p>
    <button type="button" on:click={() => dispatch('start', { mode: 'solo' })}>Start</button>
  </article>
  <article class="card">
    <h3>📱 Connected (up to 8 players)</h3>
    <p>Everyone at the table joins from their phone. Closest to the actual year wins the point.</p>
    <button type="button" on:click={() => dispatch('start', { mode: 'connected' })}>Open room</button>
  </article>
</div>

<style>
  .cards { display: grid; gap: 14px; }
  .card {
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  .card h3 { margin: 0 0 6px; }
  .card p { margin: 0 0 12px; opacity: 0.8; }
  .card button {
    min-height: 48px;
    padding: 0 18px;
    border-radius: 10px;
    background: var(--accent);
    color: #000;
    font-weight: 700;
    border: none;
  }
</style>
