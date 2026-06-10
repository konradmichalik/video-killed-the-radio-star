<!-- src/components/game/YearInput.svelte -->
<!--
  Retro range slider for picking a year. Big Anton number above, native
  <input type="range"> styled with hard borders / offset shadows / tick
  marks every 10 years, "Lock it in" CTA below.
-->
<script>
  import { createEventDispatcher } from 'svelte';
  export let min = 1900;
  export let max = new Date().getFullYear();
  export let value = Math.round((min + max) / 2);
  export let disabled = false;

  const dispatch = createEventDispatcher();
  const lockIn = () => dispatch('lock', { year: value });

  // Hide the year + disable lock-in until the player actually moves the slider.
  // The default mid-range value (e.g. 1995 on a 1900–2026 span) would otherwise
  // anchor the guess; the placeholder forces a deliberate pick.
  let touched = false;
  const markTouched = () => {
    touched = true;
  };

  // Build a CSS gradient of vertical ticks every 10 years. The track is
  // (max - min) "units" wide, and each unit is 100/(max-min)%. A 10-year
  // major tick sits every 10 units => major step = 1000/(max-min)%.
  $: span = Math.max(1, max - min);
  $: majorStepPct = (1000 / span).toFixed(4); // every 10 years
</script>

<div class="year-input">
  <output class="display" class:placeholder={!touched} aria-live="polite"
    >{touched ? value : '????'}</output
  >

  <div class="slider-wrap" style="--major-step: {majorStepPct}%">
    <input
      class="slider"
      type="range"
      {min}
      {max}
      step="1"
      bind:value
      on:input={markTouched}
      on:change={markTouched}
      {disabled}
      aria-label="Year"
    />
    <div class="ticks" aria-hidden="true"></div>
    <div class="bounds">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>

  <button type="button" class="lock" on:click={lockIn} disabled={disabled || !touched}>
    {touched ? 'Lock it in' : 'Pick a year'}
  </button>
</div>

<style>
  .year-input {
    display: grid;
    gap: 18px;
  }
  .display {
    font-family: 'Anton', sans-serif;
    font-size: clamp(56px, 14vw, 112px);
    letter-spacing: 6px;
    text-align: center;
    color: var(--bug-yellow);
    background: #050505;
    border: 3px solid #050505;
    box-shadow: 5px 5px 0 var(--accent-2);
    padding: 14px 8px;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }
  .display.placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  .slider-wrap {
    position: relative;
    padding: 24px 4px 4px;
  }

  /* Tick rail sits behind the slider; 1px lines every 10 years. */
  .ticks {
    position: absolute;
    left: 4px;
    right: 4px;
    top: 50%;
    transform: translateY(-50%);
    height: 26px;
    pointer-events: none;
    background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.5) 0 2px,
      transparent 2px 100%
    );
    background-size: var(--major-step) 100%;
    background-repeat: repeat-x;
    opacity: 0.6;
  }

  .slider {
    position: relative;
    width: 100%;
    appearance: none;
    -webkit-appearance: none;
    background: transparent;
    margin: 0;
    height: 36px;
    cursor: pointer;
  }
  .slider:focus-visible {
    outline: none;
  }

  /* WebKit track */
  .slider::-webkit-slider-runnable-track {
    height: 14px;
    background: #050505;
    border: 3px solid #fff;
    box-shadow: 4px 4px 0 var(--accent-2);
  }
  /* Firefox track */
  .slider::-moz-range-track {
    height: 14px;
    background: #050505;
    border: 3px solid #fff;
    box-shadow: 4px 4px 0 var(--accent-2);
  }

  /* WebKit thumb */
  .slider::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 36px;
    height: 36px;
    background: var(--accent);
    border: 3px solid #050505;
    box-shadow: 4px 4px 0 #050505;
    /* Align thumb centre with 14px track centre: (14 - 36) / 2 = -11px */
    margin-top: -11px;
    cursor: grab;
  }
  .slider:active::-webkit-slider-thumb {
    cursor: grabbing;
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #050505;
  }
  /* Firefox thumb */
  .slider::-moz-range-thumb {
    width: 36px;
    height: 36px;
    background: var(--accent);
    border: 3px solid #050505;
    border-radius: 0;
    box-shadow: 4px 4px 0 #050505;
    cursor: grab;
  }
  .slider:focus-visible::-webkit-slider-thumb {
    outline: 3px solid var(--accent-2);
    outline-offset: 2px;
  }
  .slider:focus-visible::-moz-range-thumb {
    outline: 3px solid var(--accent-2);
    outline-offset: 2px;
  }
  .slider:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .bounds {
    display: flex;
    justify-content: space-between;
    margin-top: 12px;
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.55);
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
  .lock:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }
</style>
