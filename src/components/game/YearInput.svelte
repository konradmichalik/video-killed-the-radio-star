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
  <output class="display" aria-live="polite">{value}</output>
  <div class="row">
    <button type="button" class="bump" aria-label="Minus 10" on:click={() => bump(-10)} {disabled}
      >−10</button
    >
    <button type="button" class="bump" aria-label="Minus 1" on:click={() => bump(-1)} {disabled}
      >−1</button
    >
    <button type="button" class="bump" aria-label="Plus 1" on:click={() => bump(1)} {disabled}
      >+1</button
    >
    <button type="button" class="bump" aria-label="Plus 10" on:click={() => bump(10)} {disabled}
      >+10</button
    >
  </div>
  <button type="button" class="lock" on:click={lockIn} {disabled}>Lock it in</button>
</div>

<style>
  .year-input {
    display: grid;
    gap: 14px;
  }
  .display {
    font-family: 'Anton', sans-serif;
    font-size: clamp(56px, 12vw, 96px);
    letter-spacing: 6px;
    text-align: center;
    color: var(--bug-yellow);
    background: #050505;
    border: 3px solid #050505;
    box-shadow: 5px 5px 0 var(--accent-2);
    padding: 12px 8px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .bump {
    min-height: 52px;
    font-family: 'Anton', sans-serif;
    font-size: 22px;
    letter-spacing: 2px;
    color: #fff;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      color 0.12s ease,
      border-color 0.12s ease;
  }
  .bump:hover {
    border-color: var(--accent-2);
    color: var(--accent-2);
    box-shadow: 4px 4px 0 var(--accent-2);
    transform: translate(-2px, -2px);
  }
  .bump:active {
    transform: translate(2px, 2px);
    box-shadow: none;
  }
  .lock {
    width: 100%;
    min-height: 60px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 3.4vw, 28px);
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
  .lock:hover {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .lock:active {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
</style>
