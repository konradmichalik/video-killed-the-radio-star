<script>
  import { createEventDispatcher } from 'svelte';

  export let label;
  export let checked = false;
  export let hint = '';

  const dispatch = createEventDispatcher();
</script>

<div class="toggle-row">
  <span class="toggle-label"
    >{label}{#if hint}&nbsp;<small>{hint}</small>{/if}</span
  >
  <button
    type="button"
    class="switch"
    class:on={checked}
    role="switch"
    aria-checked={checked}
    on:click={() => dispatch('toggle')}
  >
    <span class="knob"></span>
    <span class="switch-label">{checked ? 'ON' : 'OFF'}</span>
  </button>
</div>

<style>
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
  }
  .toggle-label {
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.65);
  }
  .toggle-label small {
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.4);
  }
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.08);
    border: 2px solid rgba(255, 255, 255, 0.25);
    padding: 8px 14px;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      border-color 0.12s ease;
  }
  .switch:hover {
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow: 3px 3px 0 rgba(255, 255, 255, 0.18);
    transform: translate(-1px, -1px);
  }
  .switch.on:hover {
    box-shadow: 3px 3px 0 var(--accent-2);
  }
  .knob {
    width: 22px;
    height: 22px;
    background: rgba(255, 255, 255, 0.4);
    transition:
      background 0.15s,
      transform 0.15s;
  }
  .switch.on {
    border-color: var(--accent-2);
  }
  .switch.on .knob {
    background: var(--accent-2);
    box-shadow: 0 0 12px var(--accent-2);
    transform: translateX(2px);
  }
  .switch-label {
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: #fff;
    min-width: 34px;
  }
</style>
