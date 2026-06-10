<script>
  import { onMount } from 'svelte';
  import { shouldOfferInstall } from '../lib/platform.js';
  import { installPromptEvent } from '../lib/stores.js';

  const KEY = 'vktrs-install-dismissed';
  let dismissed = false;
  let iosHint = false;
  let standalone = false;

  onMount(() => {
    try {
      dismissed = localStorage.getItem(KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    standalone =
      window.navigator.standalone === true ||
      window.matchMedia?.('(display-mode: standalone)').matches === true;
    iosHint = shouldOfferInstall({
      ua: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      standalone,
      dismissed,
    });
  });

  // Android / Chrome path: Chrome only fires `beforeinstallprompt` when the
  // PWA install criteria are met (HTTPS, manifest, SW). If the store holds an
  // event we know the browser considers the app installable.
  $: showAndroid = !!$installPromptEvent && !standalone && !dismissed;
  // iOS path: pure UA-based since Safari has no install-prompt event.
  $: showIos = iosHint && !dismissed;

  async function install() {
    const prompt = $installPromptEvent;
    if (!prompt) return;
    // The captured event can only be used once; clear immediately so a second
    // click is a no-op even before the user resolves the native dialog.
    installPromptEvent.set(null);
    try {
      await prompt.prompt();
    } catch {
      /* user closed the dialog or browser refused — nothing to do */
    }
  }

  function dismiss() {
    dismissed = true;
    iosHint = false;
    installPromptEvent.set(null);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* ignore */
    }
  }
</script>

{#if showAndroid}
  <div class="install">
    <span>Install <b>VKTRS</b> for fullscreen, standalone playback.</span>
    <button class="primary" type="button" on:click={install}>Install</button>
    <button type="button" aria-label="Dismiss" on:click={dismiss}>✕</button>
  </div>
{:else if showIos}
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
  .install button.primary {
    width: auto;
    padding: 0 14px;
    height: 30px;
    background: var(--accent-2);
    color: #000;
    border-color: var(--accent-2);
    font-family: 'VT323', monospace;
    font-size: 16px;
    letter-spacing: 1px;
  }
</style>
