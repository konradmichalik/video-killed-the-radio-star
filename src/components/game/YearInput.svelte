<!-- src/components/game/YearInput.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  export let min = 1900;
  export let max = new Date().getFullYear();
  export let value = Math.round((min + max) / 2);
  export let disabled = false;

  const dispatch = createEventDispatcher();

  const bump = (n) => {
    value = Math.max(min, Math.min(max, value + n));
  };
  const lockIn = () => dispatch('lock', { year: value });
</script>

<div class="year-input">
  <div class="row">
    <button type="button" aria-label="Minus 10" on:click={() => bump(-10)} disabled={disabled}>−10</button>
    <button type="button" aria-label="Minus 1" on:click={() => bump(-1)} disabled={disabled}>−1</button>
    <output class="display" aria-live="polite">{value}</output>
    <button type="button" aria-label="Plus 1" on:click={() => bump(1)} disabled={disabled}>+1</button>
    <button type="button" aria-label="Plus 10" on:click={() => bump(10)} disabled={disabled}>+10</button>
  </div>
  <button type="button" class="lock" on:click={lockIn} disabled={disabled}>Lock it in</button>
</div>

<style>
  .year-input {
    display: grid;
    gap: 16px;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
  }
  .display {
    font-size: 2.4rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    grid-column: span 1;
    padding: 8px;
  }
  button {
    min-height: 56px;
    font-size: 1.1rem;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
  }
  .lock {
    background: var(--accent);
    color: #000;
    font-weight: 700;
  }
  button:disabled {
    opacity: 0.4;
  }
</style>
