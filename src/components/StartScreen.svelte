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
  .logo span {
    display: block;
  }
  .logo span:first-child {
    font-size: clamp(38px, 11vw, 120px);
    color: var(--ink);
    animation:
      logo-scramble-1 900ms steps(8, end) 800ms backwards,
      wordmark-glitch-1 4.6s steps(1, end) 1700ms infinite;
  }
  .logo span:last-child {
    font-size: clamp(38px, 11vw, 120px);
    color: var(--accent);
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.15);
    text-shadow: 4px 4px 0 rgba(8, 217, 214, 0.55);
    animation:
      logo-scramble-2 1000ms steps(9, end) 1000ms backwards,
      wordmark-glitch-2 4.6s steps(1, end) 2000ms infinite;
  }
  /* Heavy chromatic split that collapses into the stable wordmark — VHS
     tracking-lock-in feel. Each step is a hard frame, no easing. */
  @keyframes logo-scramble-1 {
    0% {
      opacity: 0;
      transform: translateX(-60px) scaleX(1.4);
      text-shadow:
        18px 0 0 var(--accent-2),
        -18px 0 0 var(--accent);
      letter-spacing: 12px;
      filter: blur(2px);
    }
    25% {
      opacity: 0.7;
      transform: translateX(24px) scaleX(0.9);
      text-shadow:
        -14px 0 0 var(--accent-2),
        14px 0 0 var(--accent);
      letter-spacing: -4px;
    }
    50% {
      opacity: 1;
      transform: translateX(-8px);
      text-shadow:
        8px 0 0 var(--accent-2),
        -8px 0 0 var(--accent);
      letter-spacing: 4px;
      filter: none;
    }
    75% {
      transform: translateX(3px);
      text-shadow:
        -3px 0 0 var(--accent-2),
        3px 0 0 var(--accent);
      letter-spacing: 1px;
    }
    100% {
      transform: none;
      text-shadow: none;
      letter-spacing: 1px;
    }
  }
  @keyframes logo-scramble-2 {
    0% {
      opacity: 0;
      transform: translateX(60px) scaleX(1.4);
      text-shadow:
        -18px 0 0 var(--accent-2),
        18px 0 0 var(--accent),
        4px 4px 0 rgba(8, 217, 214, 0.55);
      letter-spacing: 12px;
      filter: blur(2px);
    }
    25% {
      opacity: 0.7;
      transform: translateX(-24px) scaleX(0.9);
      text-shadow:
        14px 0 0 var(--accent-2),
        -14px 0 0 var(--accent),
        4px 4px 0 rgba(8, 217, 214, 0.55);
      letter-spacing: -4px;
    }
    50% {
      opacity: 1;
      transform: translateX(8px);
      text-shadow:
        -8px 0 0 var(--accent-2),
        8px 0 0 var(--accent),
        4px 4px 0 rgba(8, 217, 214, 0.55);
      letter-spacing: 4px;
      filter: none;
    }
    75% {
      transform: translateX(-3px);
      text-shadow:
        3px 0 0 var(--accent-2),
        -3px 0 0 var(--accent),
        4px 4px 0 rgba(8, 217, 214, 0.55);
      letter-spacing: 1px;
    }
    100% {
      transform: none;
      text-shadow: 4px 4px 0 rgba(8, 217, 214, 0.55);
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
    animation: btn-in 400ms cubic-bezier(0.2, 1.5, 0.4, 1) 1800ms backwards;
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
    .logo span,
    #power-btn {
      animation: none;
    }
  }
</style>
