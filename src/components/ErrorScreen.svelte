<script>
  import { loadError } from '../lib/stores.js';
  import { focusOnMount } from '../lib/a11y.js';

  function reload() {
    location.reload();
  }
</script>

{#if $loadError}
  <div class="testcard" role="alert">
    <!-- SMPTE-style colour bars -->
    <div class="bars">
      <span style="background:#bfbfbf"></span>
      <span style="background:#bfbf00"></span>
      <span style="background:#00bfbf"></span>
      <span style="background:#00bf00"></span>
      <span style="background:#bf00bf"></span>
      <span style="background:#bf0000"></span>
      <span style="background:#0000bf"></span>
    </div>
    <!-- reverse castellation strip -->
    <div class="castellation">
      <span style="background:#0000bf"></span>
      <span style="background:#131313"></span>
      <span style="background:#bf00bf"></span>
      <span style="background:#131313"></span>
      <span style="background:#00bfbf"></span>
      <span style="background:#131313"></span>
      <span style="background:#bfbfbf"></span>
    </div>
    <!-- info panel -->
    <div class="panel">
      <div class="scanlines"></div>
      <p class="standby">PLEASE STAND BY</p>
      <h1>NO SIGNAL</h1>
      <p class="msg">{$loadError}</p>
      <button type="button" use:focusOnMount on:click={reload}>↻ RELOAD</button>
    </div>
  </div>
{/if}

<style>
  .testcard {
    position: fixed;
    inset: 0;
    z-index: 60; /* above the guide */
    display: flex;
    flex-direction: column;
    background: #000;
  }
  .bars {
    display: flex;
    flex: 1 1 62%;
  }
  .bars span {
    flex: 1;
  }
  .castellation {
    display: flex;
    flex: 0 0 8%;
  }
  .castellation span {
    flex: 1;
  }
  .panel {
    position: relative;
    flex: 1 1 30%;
    display: grid;
    place-content: center;
    text-align: center;
    gap: 4px;
    background: #0a0a0a;
    padding: 16px;
    overflow: hidden;
  }
  .scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0) 0 2px,
      rgba(0, 0, 0, 0.25) 2px 3px
    );
  }
  .panel > * {
    position: relative;
    z-index: 2;
  }
  .standby {
    font-family: 'VT323', monospace;
    font-size: clamp(16px, 2.4vw, 24px);
    letter-spacing: 6px;
    color: var(--accent-2);
    margin: 0;
    animation: blink 1.3s steps(2) infinite;
  }
  h1 {
    font-family: 'Anton', sans-serif;
    font-size: clamp(34px, 9vw, 92px);
    margin: 4px 0;
    color: #fff;
    letter-spacing: 2px;
  }
  .msg {
    font-family: 'VT323', monospace;
    font-size: clamp(15px, 2.2vw, 22px);
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0 0 18px;
  }
  button {
    justify-self: center;
    font-family: 'Anton', sans-serif;
    font-size: clamp(16px, 2.6vw, 24px);
    letter-spacing: 3px;
    color: #050505;
    background: var(--bug-yellow);
    border: none;
    padding: 12px 32px;
    cursor: pointer;
    box-shadow: 4px 4px 0 var(--accent);
  }
  button:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--accent);
  }
  @keyframes blink {
    50% {
      opacity: 0.25;
    }
  }
</style>
