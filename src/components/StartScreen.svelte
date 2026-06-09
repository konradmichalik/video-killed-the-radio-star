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
      <span class="line line-1">
        <span class="word" style="--i: 0">VIDEO</span>
        <span class="word" style="--i: 1">KILLED</span>
      </span>
      <span class="line line-2">
        <span class="word" style="--i: 2">THE</span>
        <span class="word" style="--i: 3">RADIO</span>
        <span class="word" style="--i: 4">STAR</span>
      </span>
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
    animation: crt-on 700ms cubic-bezier(0.15, 0.85, 0.3, 1.15) backwards;
  }
  /* CRT power-on: collapsed scanline → horizontal stretch → vertical bloom →
     settle. Mimics an old tube TV warming up. */
  @keyframes crt-on {
    0% {
      transform: scaleY(0.005) scaleX(0.55);
      filter: brightness(5) blur(2px);
      opacity: 0.5;
    }
    32% {
      transform: scaleY(0.005) scaleX(1);
      filter: brightness(4) blur(1.5px);
      opacity: 1;
    }
    55% {
      transform: scaleY(1.04) scaleX(1);
      filter: brightness(2) blur(0.4px);
    }
    100% {
      transform: none;
      filter: none;
    }
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
    animation: brand-drop 500ms steps(6, end) 550ms backwards;
  }
  @keyframes brand-drop {
    0% {
      transform: translateY(-40px) scale(0.8);
      box-shadow: 14px 14px 0 var(--accent);
      opacity: 0;
    }
    40% {
      transform: translateY(8px) scale(1.06);
      box-shadow: 10px 10px 0 var(--bug-yellow);
      opacity: 1;
    }
    70% {
      transform: translateY(-3px) scale(0.98);
      box-shadow: 4px 4px 0 var(--accent-2);
    }
    100% {
      transform: none;
      box-shadow: 6px 6px 0 var(--accent-2);
      opacity: 1;
    }
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
  .line {
    display: block;
    white-space: nowrap;
    font-size: clamp(38px, 11vw, 120px);
  }
  .line-1 {
    color: var(--ink);
    --final-shadow: none;
    animation: wordmark-glitch-1 4.6s steps(1, end) 2400ms infinite;
  }
  .line-2 {
    color: var(--accent);
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
    text-shadow: 4px 4px 0 rgba(8, 217, 214, 0.55);
    --final-shadow: 4px 4px 0 rgba(8, 217, 214, 0.55);
    animation: wordmark-glitch-2 4.6s steps(1, end) 2600ms infinite;
  }
  /* Each word gets its own VHS tracking-lock scramble, staggered by --i. */
  .word {
    display: inline-block;
    animation: word-in 850ms steps(7, end) calc(700ms + var(--i) * 180ms) backwards;
  }
  .word + .word {
    margin-left: 0.32em;
  }
  @keyframes word-in {
    0% {
      opacity: 0;
      transform: translateX(-80px) scaleX(1.5);
      text-shadow:
        20px 0 0 var(--accent-2),
        -20px 0 0 var(--accent);
      letter-spacing: 14px;
      filter: blur(2.5px);
    }
    22% {
      opacity: 0.75;
      transform: translateX(28px) scaleX(0.85);
      text-shadow:
        -14px 0 0 var(--accent-2),
        14px 0 0 var(--accent);
      letter-spacing: -4px;
      filter: blur(1px);
    }
    45% {
      opacity: 1;
      transform: translateX(-8px) scaleX(1.05);
      text-shadow:
        8px 0 0 var(--accent-2),
        -8px 0 0 var(--accent);
      letter-spacing: 4px;
      filter: none;
    }
    70% {
      transform: translateX(3px);
      text-shadow:
        -3px 0 0 var(--accent-2),
        3px 0 0 var(--accent);
      letter-spacing: 1px;
    }
    100% {
      transform: none;
      text-shadow: var(--final-shadow);
      letter-spacing: 1px;
    }
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
    animation: btn-in 400ms cubic-bezier(0.2, 1.5, 0.4, 1) 2400ms backwards;
  }
  @keyframes btn-in {
    0% {
      opacity: 0;
      transform: scale(0.6);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
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
  /* Entrance animations are decorative — skip them if the user prefers
     reduced motion. The idle wordmark glitch and pulsing dot also stop. */
  @media (prefers-reduced-motion: reduce) {
    .start-content,
    .brand-block,
    .line,
    .word,
    #power-btn {
      animation: none;
    }
  }
</style>
