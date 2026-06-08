<script>
  import { onMount } from 'svelte';
  import { shouldOfferInstall } from '../lib/platform.js';

  const KEY = 'vktrs-install-dismissed';
  let show = false;

  onMount(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    const standalone =
      window.navigator.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches === true;
    show = shouldOfferInstall({
      ua: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      standalone,
      dismissed,
    });
  });

  function dismiss() {
    show = false;
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  }
</script>

{#if show}
  <div class="install">
    <span>For real full screen: tap <b>Share</b> ⬆ then <b>Add to Home Screen</b>.</span>
    <button type="button" aria-label="Dismiss" on:click={dismiss}>✕</button>
  </div>
{/if}

<style>
  .install {
    position: absolute;
    left: 50%;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    transform: translateX(-50%);
    z-index: 101; /* above the start screen */
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: min(90vw, 460px);
    padding: 10px 14px;
    background: rgba(0, 0, 0, 0.72);
    border: 1px solid var(--accent-2);
    font-family: 'VT323', monospace;
    font-size: 17px;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.85);
  }
  .install b {
    color: var(--accent-2);
  }
  .install button {
    flex: 0 0 auto;
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #fff;
    width: 30px;
    height: 30px;
    font-size: 14px;
    cursor: pointer;
  }
</style>
