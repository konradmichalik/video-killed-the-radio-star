<script>
  import { onMount, onDestroy } from 'svelte';
  import { fade } from 'svelte/transition';
  import { helpHint } from '../lib/stores.js';

  const KEY = 'vktrs-onboarded';
  let show = false;
  let timer;
  let lastTick = 0;

  function dismiss() {
    show = false;
    clearTimeout(timer);
  }

  function reveal() {
    show = true;
    clearTimeout(timer);
    timer = setTimeout(() => (show = false), 5200);
    // attach dismiss listeners on the next frame so the triggering tap doesn't dismiss
    requestAnimationFrame(() => {
      window.addEventListener('pointerdown', dismiss, { once: true });
      window.addEventListener('keydown', dismiss, { once: true });
    });
  }

  onMount(() => {
    try {
      if (localStorage.getItem(KEY)) return;
      localStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable — show once this session */
    }
    reveal();
  });

  onDestroy(() => {
    clearTimeout(timer);
    window.removeEventListener('pointerdown', dismiss);
    window.removeEventListener('keydown', dismiss);
  });

  // explicit re-show via the "?" help button
  $: if ($helpHint && $helpHint !== lastTick) {
    lastTick = $helpHint;
    reveal();
  }
</script>

{#if show}
  <div class="hint" aria-hidden="true" transition:fade={{ duration: 250 }}>
    <span class="lbl top">▲ SWIPE UP · GUIDE</span>
    <span class="lbl left">◀ PREV</span>
    <span class="lbl center">TAP · PLAY / PAUSE</span>
    <span class="lbl right">NEXT ▶</span>
    <span class="lbl bottom">▼ SWIPE DOWN · SONG INFO</span>
  </div>
{/if}

<style>
  .hint {
    position: absolute;
    inset: 0;
    z-index: 13; /* above the tuning static, below the unmute hint */
    pointer-events: none;
    font-family: 'VT323', monospace;
    letter-spacing: 2px;
    color: rgba(255, 255, 255, 0.82);
    text-shadow: 0 1px 10px rgba(0, 0, 0, 0.9);
  }
  .lbl {
    position: absolute;
    font-size: clamp(13px, 2vw, 18px);
    white-space: nowrap;
  }
  .top {
    top: clamp(36px, 8vh, 72px);
    left: 50%;
    transform: translateX(-50%);
    color: var(--accent-2);
  }
  .bottom {
    bottom: clamp(36px, 8vh, 72px);
    left: 50%;
    transform: translateX(-50%);
    color: var(--bug-yellow);
  }
  .left {
    left: clamp(10px, 3vw, 28px);
    top: 50%;
    transform: translateY(-50%);
  }
  .right {
    right: clamp(10px, 3vw, 28px);
    top: 50%;
    transform: translateY(-50%);
  }
  .center {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(15px, 2.4vw, 22px);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.35);
    padding: 8px 16px;
    background: rgba(0, 0, 0, 0.45);
  }
</style>
