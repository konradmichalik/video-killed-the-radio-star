<!-- src/components/game/ModeSelector.svelte -->
<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { brokerReachable } from '../../lib/stores.js';
  import { checkBrokerReachable } from '../../lib/multiplayer/peer.js';

  const dispatch = createEventDispatcher();

  // Probe the PeerJS broker on first mount so the "Open room" CTA can be
  // disabled before the user wastes 8s on a doomed `hostRoom()` attempt. We
  // keep the result in the store across re-mounts so closing/reopening the
  // sheet doesn't re-probe — the broker either works for the whole session
  // or the user needs to reload anyway.
  onMount(async () => {
    if ($brokerReachable !== null) return;
    const ok = await checkBrokerReachable();
    brokerReachable.set(ok);
  });

  $: connectedDisabled = $brokerReachable === false;
  $: connectedLabel = connectedDisabled ? 'Broker offline' : 'Open room';
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
      Up to 16 players join from their phone. Closest to the actual year wins the point.
    </p>
    <button
      type="button"
      class="cta alt-cta"
      disabled={connectedDisabled}
      on:click={() => dispatch('start', { mode: 'connected' })}>{connectedLabel}</button
    >
    {#if connectedDisabled}
      <p class="warning" role="status">
        PeerJS signaling broker unreachable — Connected mode is unavailable. Try again later.
      </p>
    {/if}
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
  .cta:hover:not(:disabled) {
    box-shadow: 8px 8px 0 #050505;
    transform: translate(-2px, -2px);
  }
  .cta:active:not(:disabled) {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #050505;
  }
  .cta:disabled {
    cursor: not-allowed;
    opacity: 0.45;
    box-shadow: 5px 5px 0 #050505;
  }
  .warning {
    margin: 12px 0 0;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 0.5px;
    color: rgba(255, 100, 100, 0.85);
  }
</style>
