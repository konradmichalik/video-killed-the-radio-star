<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
</script>

<div id="start-screen">
  <div class="static-noise"></div>
  <div class="start-content">
    <div class="brand-block" aria-hidden="true">
      <span class="brand-mark">VKTRS</span>
      <span class="brand-dot"></span>
    </div>
    <h1 class="logo">
      <span>VIDEO KILLED</span>
      <span>THE RADIO STAR</span>
    </h1>
    <button id="power-btn" type="button" on:click={() => dispatch('power')}>
      <span class="power-glyph">&#x23FB;</span>
      <span>TURN ON TV</span>
    </button>
    <p class="hint">Tap to start the channel</p>
    <p class="legal">Videos streamed via YouTube · &copy; their respective owners</p>
  </div>
</div>

<style>
  #start-screen {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: grid;
    place-items: center;
    background: #050505;
    overflow: hidden;
  }
  .static-noise {
    position: absolute;
    inset: -50%;
    opacity: 0.18;
    background-image:
      repeating-radial-gradient(circle at 17% 32%, #fff 0 1px, transparent 1px 3px),
      repeating-radial-gradient(circle at 71% 64%, #fff 0 1px, transparent 1px 4px),
      repeating-radial-gradient(circle at 43% 88%, #fff 0 1px, transparent 1px 2px);
    animation: noise 0.4s steps(4) infinite;
    mix-blend-mode: screen;
  }
  @keyframes noise {
    0% {
      transform: translate(0, 0);
    }
    25% {
      transform: translate(-3%, 2%);
    }
    50% {
      transform: translate(2%, -4%);
    }
    75% {
      transform: translate(-2%, 3%);
    }
    100% {
      transform: translate(3%, -2%);
    }
  }
  .start-content {
    position: relative;
    z-index: 2;
    text-align: center;
    padding: 24px;
  }
  /* Neo-brutalist VKTRS station block (matches Guide header + station bug). */
  .brand-block {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    padding: 6px clamp(12px, 2vw, 18px) 8px;
    margin-bottom: 22px;
    background: #000;
    border: 3px solid #fff;
    box-shadow: 6px 6px 0 var(--accent-2);
  }
  .brand-mark {
    font-family: 'Anton', sans-serif;
    font-size: clamp(22px, 3.6vw, 36px);
    letter-spacing: 3px;
    color: #fff;
  }
  .brand-dot {
    width: clamp(10px, 1.3vw, 14px);
    height: clamp(10px, 1.3vw, 14px);
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 12px var(--accent);
    animation: pulse 2.4s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .brand-dot {
      animation: none;
    }
  }
  .logo {
    font-family: 'Anton', sans-serif;
    font-weight: 400;
    line-height: 0.92;
    margin: 0 0 40px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .logo span {
    display: block;
  }
  .logo span:first-child {
    font-size: clamp(38px, 11vw, 120px);
    color: var(--ink);
    animation: wordmark-glitch-1 4.6s steps(1, end) infinite;
  }
  .logo span:last-child {
    font-size: clamp(38px, 11vw, 120px);
    color: var(--accent);
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
    text-shadow: 4px 4px 0 rgba(8, 217, 214, 0.55);
    animation: wordmark-glitch-2 4.6s steps(1, end) infinite;
    animation-delay: 0.2s;
  }
  #power-btn {
    font-family: 'Anton', sans-serif;
    font-size: clamp(20px, 4vw, 34px);
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #050505;
    background: var(--bug-yellow);
    border: none;
    padding: 18px 44px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 16px;
    box-shadow: 6px 6px 0 var(--accent);
    transition:
      transform 0.08s ease,
      box-shadow 0.08s ease;
  }
  #power-btn:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--accent);
  }
  #power-btn:active {
    transform: translate(3px, 3px);
    box-shadow: 2px 2px 0 var(--accent);
  }
  .power-glyph {
    font-size: 1.2em;
    line-height: 1;
  }
  .hint {
    font-family: 'VT323', monospace;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 26px;
    animation: blink 1.4s steps(2) infinite;
  }
  .legal {
    font-family: 'VT323', monospace;
    font-size: 13px;
    letter-spacing: 1px;
    color: rgba(255, 255, 255, 0.28);
    margin-top: 22px;
  }
  @keyframes blink {
    50% {
      opacity: 0.2;
    }
  }
</style>
