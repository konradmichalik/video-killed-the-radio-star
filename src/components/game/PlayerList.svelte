<!-- src/components/game/PlayerList.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';

  export let players = [];
  export let submissions = {}; // {[playerId]: {year}}
  export let editable = false;

  const dispatch = createEventDispatcher();
</script>

<ul class="players">
  {#each players as p (p.id)}
    <li class:offline={!p.connected}>
      <span class="dot" aria-hidden="true"></span>
      <span class="name">{p.name || 'Player'}</span>
      {#if submissions[p.id]}
        <span class="badge" aria-label="Submitted">LOCKED</span>
      {/if}
      {#if editable}
        <button
          class="ctrl"
          type="button"
          class:active={p.isController}
          aria-pressed={p.isController}
          aria-label={p.isController ? 'Revoke game control' : 'Give game control'}
          title={p.isController ? 'Revoke game control' : 'Give game control'}
          on:click={() => dispatch('setController', { playerId: p.isController ? null : p.id })}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <!-- crown: hand control to this player ("game leader") -->
            <path d="M4 17 L4 8 L9 12 L12 6 L15 12 L20 8 L20 17 Z" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </svg>
        </button>
        <button
          class="kick"
          type="button"
          aria-label="Remove player"
          on:click={() => dispatch('kick', { playerId: p.id })}>✕</button
        >
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
  .ctrl {
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition:
      color 0.12s ease,
      border-color 0.12s ease,
      box-shadow 0.12s ease;
  }
  .ctrl svg {
    width: 15px;
    height: 15px;
    display: block;
  }
  .ctrl:hover,
  .ctrl:focus-visible {
    color: var(--accent-2);
    border-color: var(--accent-2);
  }
  .ctrl.active {
    color: var(--bug-yellow);
    border-color: var(--bug-yellow);
    box-shadow: 0 0 6px var(--bug-yellow);
  }
  .kick {
    margin-left: 6px;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: 'VT323', monospace;
    font-size: 16px;
    line-height: 1;
    color: rgba(255, 255, 255, 0.5);
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition:
      color 0.12s ease,
      border-color 0.12s ease,
      background 0.12s ease;
  }
  /* When LOCKED badge is present it claims margin-left:auto; action buttons
     that follow (ctrl and/or kick) should not push further. */
  .badge ~ .ctrl,
  .badge ~ .kick {
    margin-left: 6px;
  }
  /* Without the LOCKED badge, action buttons float to the right.
     .ctrl is the first action button so it gets margin-left:auto; .kick follows at 6px. */
  .name ~ .ctrl {
    margin-left: auto;
  }
  .ctrl + .kick {
    margin-left: 6px;
  }
  .name ~ .kick {
    margin-left: auto;
  }
  .kick:hover,
  .kick:focus-visible {
    color: var(--accent);
    border-color: var(--accent);
    background: rgba(0, 0, 0, 0.2);
  }
</style>
