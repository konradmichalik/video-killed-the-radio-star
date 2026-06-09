<!-- src/components/game/ModeSelector.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div class="cards">
  <article class="card">
    <h3 class="title">SOLO</h3>
    <p class="desc">
      Rate yourself — works alone or with a friend on the couch. Tracks your streak.
    </p>
    <button type="button" class="cta" on:click={() => dispatch('start', { mode: 'solo' })}
      >Start</button
    >
  </article>
  <article class="card alt">
    <h3 class="title">CONNECTED</h3>
    <p class="desc">
      Up to 8 players join from their phone. Closest to the actual year wins the point.
    </p>
    <button
      type="button"
      class="cta alt-cta"
      on:click={() => dispatch('start', { mode: 'connected' })}>Open room</button
    >
  </article>
</div>

<style>
  .cards {
    display: grid;
    gap: 16px;
  }
  .card {
    padding: 18px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent);
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .card.alt {
    box-shadow: 5px 5px 0 var(--accent-2);
  }
  .title {
    margin: 0 0 8px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(24px, 4vw, 34px);
    letter-spacing: 3px;
    color: #fff;
    text-transform: uppercase;
  }
  .desc {
    margin: 0 0 16px;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.7);
  }
  .cta {
    min-height: 52px;
    padding: 0 24px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 3vw, 22px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--accent);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 5px 5px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
  }
  .cta.alt-cta {
    background: var(--accent-2);
  }
  .cta:hover {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .cta:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
</style>
