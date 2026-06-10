<!-- src/components/game/HostRoomView.svelte -->
<script>
  import { createEventDispatcher, tick } from 'svelte';
  import PlayerList from './PlayerList.svelte';
  import Scoreboard from './Scoreboard.svelte';
  import NetworkBadge from './NetworkBadge.svelte';
  import Toggle from '../Toggle.svelte';
  import { autoAdvanceRound } from '../../lib/stores.js';

  export let roomCode;
  export let joinUrl;
  export let players = [];
  export let submissions = {};
  export let session; // { round, phase }
  export let connectedCount = 0;

  const dispatch = createEventDispatcher();
  let qrEl;
  let qrError = '';
  let activeTab = 'room'; // 'room' | 'game'

  async function drawQr() {
    if (!qrEl || !joinUrl) return;
    try {
      const { default: QRCode } = await import('qrcode');
      await QRCode.toCanvas(qrEl, joinUrl, { width: 200, margin: 1 });
      qrError = '';
    } catch {
      qrError = 'QR code unavailable — share the room code instead.';
    }
  }

  // Re-draw whenever the canvas remounts (tab switch) or the join URL changes.
  // The canvas only exists while the ROOM tab is active, so we also key on
  // activeTab to retrigger after a tab toggle.
  $: if (activeTab === 'room' && qrEl && joinUrl) {
    tick().then(drawQr);
  }

  $: phase = session?.phase || 'idle';
  $: round = session?.round || 0;
  $: submittedCount = Object.keys(submissions).length;

  // Auto-switch to GAME tab when a round starts so the host sees status + controls.
  $: if (session?.phase === 'guessing') activeTab = 'game';

  function onScoreChange(e) {
    dispatch('scoreChange', e.detail);
  }
</script>

<section class="host">
  <div class="tabs" role="tablist" aria-label="Game mode sections">
    <button
      type="button"
      role="tab"
      class="tab"
      class:active={activeTab === 'room'}
      aria-selected={activeTab === 'room'}
      on:click={() => (activeTab = 'room')}>ROOM</button
    >
    <button
      type="button"
      role="tab"
      class="tab"
      class:active={activeTab === 'game'}
      aria-selected={activeTab === 'game'}
      on:click={() => (activeTab = 'game')}>GAME</button
    >
  </div>

  {#if activeTab === 'room'}
    <div class="qr-block">
      <div class="qr-frame">
        <canvas bind:this={qrEl}></canvas>
      </div>
      <div class="join-info">
        <span class="join-label">SCAN OR ENTER</span>
        <div class="code">{roomCode}</div>
        {#if joinUrl}
          <a class="url" href={joinUrl} target="_blank" rel="noopener">{joinUrl}</a>
        {/if}
        {#if qrError}<p class="err">{qrError}</p>{/if}
      </div>
    </div>

    <div class="meta-row room-meta">
      <NetworkBadge status="open" />
      <span class="peers">{connectedCount}/{players.length} peers</span>
    </div>

    <div>
      <h4 class="lists-title">Players ({connectedCount})</h4>
      <PlayerList {players} {submissions} editable={true} on:kick />
    </div>
  {:else}
    <div class="status">
      <h3 class="round">ROUND {round}</h3>
      <div class="phase-row">
        <span class="phase-label">Phase:</span>
        <span class="phase-value">{phase}</span>
      </div>
      {#if phase === 'guessing'}
        <div class="subs-block" aria-live="polite">
          <span class="subs-label">Guesses in</span>
          <span class="subs-count"
            ><strong>{submittedCount}</strong><span class="subs-sep">/</span>{connectedCount}</span
          >
        </div>
      {/if}
    </div>

    <div class="controls">
      {#if phase === 'idle'}
        <button class="cta" on:click={() => dispatch('startRound')} disabled={connectedCount === 0}
          >Start round</button
        >
      {:else if phase === 'guessing'}
        <button class="cta" on:click={() => dispatch('reveal')}>Reveal</button>
      {:else}
        <button class="cta" on:click={() => dispatch('nextRound')}>Next round</button>
      {/if}
      <button class="ghost" on:click={() => dispatch('end')}>End game</button>
    </div>

    <Toggle
      label="AUTO NEXT ROUND"
      hint="(when the next track starts)"
      checked={$autoAdvanceRound}
      on:toggle={() => autoAdvanceRound.update((v) => !v)}
    />

    <div>
      <h4 class="lists-title">Scoreboard</h4>
      <Scoreboard {players} editable on:scoreChange={onScoreChange} />
    </div>
  {/if}
</section>

<style>
  .host {
    display: grid;
    gap: 22px;
  }
  .tabs {
    display: flex;
    gap: 10px;
  }
  .tab {
    flex: 1 1 auto;
    min-height: 48px;
    padding: 0 18px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(16px, 2.4vw, 20px);
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 3px solid #fff;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      background 0.12s ease,
      color 0.12s ease,
      border-color 0.12s ease;
  }
  .tab:hover {
    color: var(--accent-2);
    border-color: var(--accent-2);
  }
  .tab.active {
    color: #050505;
    background: var(--accent-2);
    border-color: #050505;
    box-shadow: 5px 5px 0 #050505;
  }
  .qr-block {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .qr-frame {
    padding: 8px;
    background: #fff;
    border: 3px solid #050505;
    box-shadow: 5px 5px 0 var(--accent);
    line-height: 0;
  }
  .join-info {
    display: grid;
    gap: 6px;
  }
  .join-label {
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
  }
  .code {
    font-family: 'Anton', sans-serif;
    font-size: clamp(36px, 6vw, 56px);
    letter-spacing: 8px;
    color: var(--bug-yellow);
    background: #050505;
    border: 3px solid #050505;
    box-shadow: 5px 5px 0 var(--accent-2);
    padding: 8px 16px;
    line-height: 1;
  }
  .err {
    font-family: 'VT323', monospace;
    color: var(--accent);
    margin: 4px 0 0;
  }
  .url {
    font-family: 'VT323', monospace;
    font-size: 14px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.65);
    text-decoration: underline;
    max-width: 100%;
    word-break: break-all;
    overflow-wrap: anywhere;
    line-height: 1.2;
  }
  .url:hover,
  .url:focus-visible {
    color: var(--accent-2);
  }

  .status {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
  }
  .round {
    margin: 0;
    font-family: 'Anton', sans-serif;
    font-size: clamp(24px, 4vw, 32px);
    letter-spacing: 3px;
    color: #fff;
    text-transform: uppercase;
  }
  .phase-row {
    font-family: 'VT323', monospace;
    font-size: 18px;
    letter-spacing: 2px;
  }
  .phase-label {
    color: rgba(255, 255, 255, 0.55);
  }
  .phase-value {
    color: var(--accent-2);
    text-transform: uppercase;
    margin-left: 6px;
  }
  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.65);
  }
  .room-meta {
    padding: 10px 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 3px solid #fff;
    box-shadow: 5px 5px 0 var(--accent-2);
  }
  .subs-block {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin-top: 6px;
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.4);
    border: 2px dashed var(--bug-yellow);
  }
  .subs-label {
    font-family: 'Anton', sans-serif;
    font-size: 16px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.65);
  }
  .subs-count {
    font-family: 'VT323', monospace;
    font-size: clamp(24px, 4vw, 32px);
    letter-spacing: 2px;
    color: var(--bug-yellow);
    line-height: 1;
  }
  .subs-count strong {
    font-family: 'Anton', sans-serif;
    font-size: clamp(32px, 6vw, 48px);
    margin-right: 2px;
  }
  .subs-sep {
    margin: 0 2px;
    color: rgba(255, 255, 255, 0.45);
  }

  .controls {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cta {
    flex: 1 1 auto;
    min-width: 180px;
    min-height: 52px;
    padding: 0 24px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(18px, 3vw, 22px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--accent-2);
    border: 3px solid #050505;
    cursor: pointer;
    box-shadow: 5px 5px 0 #050505;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease;
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
    opacity: 0.4;
    cursor: not-allowed;
  }
  .ghost {
    min-height: 52px;
    padding: 0 20px;
    font-family: 'Anton', sans-serif;
    font-size: clamp(16px, 2.4vw, 20px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #fff;
    background: transparent;
    border: 3px solid #fff;
    cursor: pointer;
    transition:
      transform 0.1s ease,
      box-shadow 0.1s ease,
      color 0.12s ease,
      border-color 0.12s ease;
  }
  .ghost:hover {
    color: var(--accent);
    border-color: var(--accent);
    box-shadow: 5px 5px 0 var(--accent);
    transform: translate(-2px, -2px);
  }
  .ghost:active {
    transform: translate(2px, 2px);
    box-shadow: 0 0 0 var(--accent);
  }

  .lists-title {
    margin: 0 0 10px;
    font-family: 'Anton', sans-serif;
    font-size: 18px;
    letter-spacing: 3px;
    color: var(--accent-2);
    text-transform: uppercase;
  }
</style>
